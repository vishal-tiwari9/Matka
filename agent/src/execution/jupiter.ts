import axios from "axios";

// ============================================================
//  jupiter.ts — Jupiter V6 Swap Integration
//
//  Role in Matka Protocol:
//  1. Agent calls Jupiter /quote to find the best swap route
//     (USDC → target token like AAPLx or SPACEXx)
//  2. Agent calls Jupiter /swap to get serialized transaction data
//  3. This transaction data is passed to our Smart Contract's
//     execute_trade instruction (as remaining_accounts)
//  4. The Smart Contract executes the swap via CPI, never exposing
//     private keys to an external system
// ============================================================

const JUP_API = process.env.JUPITER_API_URL!;
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;         // Raw input (USDC 6 dec)
  outAmount: string;        // Raw expected output
  otherAmountThreshold: string; // Min output after slippage (use this for safety)
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

export interface JupiterRouteResult {
  quote: JupiterQuote;
  serializedTransaction: string; // base64 encoded transaction
  fillPriceUsd: number;          // Effective price per token
  minOutAmount: bigint;          // otherAmountThreshold as bigint
}

/**
 * Get a live Jupiter quote for USDC → targetMint.
 * Uses the strict token list (only verified mints).
 */
export async function getJupiterQuote(
  targetMint: string,
  usdcAmountRaw: bigint,
  slippageBps: number = 100
): Promise<JupiterQuote> {
  const res = await axios.get(`${JUP_API}/quote`, {
    params: {
      inputMint: USDC_MINT,
      outputMint: targetMint,
      amount: usdcAmountRaw.toString(),
      slippageBps,
      restrictIntermediateTokens: true, // Avoid exotic routing
      onlyDirectRoutes: false,
    },
    headers: process.env.JUPITER_API_KEY
      ? { Authorization: `Bearer ${process.env.JUPITER_API_KEY}` }
      : {},
    timeout: 10_000,
  });

  return res.data as JupiterQuote;
}

/**
 * Get a serialized swap transaction from Jupiter.
 * The vault PDA will be the userPublicKey — it signs via CPI seeds.
 */
export async function getJupiterSwapTransaction(
  quote: JupiterQuote,
  vaultPda: string,
  wrapUnwrapSOL: boolean = false
): Promise<string> {
  const res = await axios.post(
    `${JUP_API}/swap`,
    {
      quoteResponse: quote,
      userPublicKey: vaultPda,
      wrapAndUnwrapSol: wrapUnwrapSOL,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...(process.env.JUPITER_API_KEY
          ? { Authorization: `Bearer ${process.env.JUPITER_API_KEY}` }
          : {}),
      },
      timeout: 15_000,
    }
  );

  return res.data.swapTransaction; // base64 encoded
}

/**
 * Full Jupiter route: get quote + build transaction.
 * Returns everything the agent needs to submit to execute_trade.
 */
export async function buildJupiterRoute(
  targetMint: string,
  usdcAmountRaw: bigint,
  slippageBps: number,
  vaultPda: string,
  usdcPerToken: number  // for fill price calculation
): Promise<JupiterRouteResult> {
  const quote = await getJupiterQuote(targetMint, usdcAmountRaw, slippageBps);
  const serializedTransaction = await getJupiterSwapTransaction(quote, vaultPda);

  // Fill price = USDC spent / tokens received
  const outAmountRaw = BigInt(quote.outAmount);
  // Note: token decimals matter here — for xStocks (8 dec) vs USDC (6 dec)
  // This is simplified; production code reads decimals from mint account
  const fillPriceUsd = usdcPerToken; // TODO: derive from quote in/out ratio

  return {
    quote,
    serializedTransaction,
    fillPriceUsd,
    minOutAmount: BigInt(quote.otherAmountThreshold),
  };
}

/**
 * Check Meteora pool reserve depth before routing through it.
 * Matka Protocol enforces a $25,000 minimum reserve to avoid slippage traps.
 * This is done off-chain by the agent; on-chain the contract also checks via
 * remaining_accounts in production.
 */
export async function checkMeteoraDbc(
  poolAddress: string
): Promise<{ hasAdequateLiquidity: boolean; reserveUsd: number }> {
  try {
    // Meteora DBC SDK pool state — simplified; use @meteora-ag/dynamic-bonding-curve-sdk in prod
    const res = await axios.get(
      `https://dlmm-api.meteora.ag/pair/${poolAddress}`,
      { timeout: 5_000 }
    );
    const reserveUsd = parseFloat(res.data?.liquidity ?? 0);
    return {
      hasAdequateLiquidity: reserveUsd >= 25_000,
      reserveUsd,
    };
  } catch {
    return { hasAdequateLiquidity: false, reserveUsd: 0 };
  }
}
