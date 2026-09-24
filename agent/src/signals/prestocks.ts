import axios from "axios";

// ============================================================
//  prestocks.ts — PreStocks API Integration
//
//  Role in Matka Protocol:
//  1. Fetch live mark prices for Pre-IPO tokens (SpaceX, OpenAI, Stripe, etc.)
//  2. Compare mark price vs on-chain DEX price to detect discounts
//  3. Pass mark price to execute_trade so Smart Contract can log it
//  4. Cross-validate with Tessera NAV (in tessera.ts) before buying
//
//  API: https://prestocks.com/api/prestocks (public, no auth)
//  Rate: polled every POLL_INTERVAL_SECS seconds
// ============================================================

const PRESTOCKS_API = process.env.PRESTOCKS_API_URL!;

export interface PrestocksToken {
  symbol: string;           // e.g. "SPACEX"
  name: string;             // e.g. "SpaceX"
  mintAddress: string;      // Solana Token-2022 mint address
  tokenPrice: number;       // Current DEX price (USD) — may differ from mark
  markPrice: number;        // Official PreStocks mark price (USD) — the "true" valuation
  supply: number;
  volume24h: number;
  holders: number;
}

export interface PrestocksSignal {
  token: PrestocksToken;
  discountPct: number;      // (markPrice - tokenPrice) / markPrice * 100. Positive = discount.
  isPremium: boolean;       // Token trading above mark (sell signal / skip)
  isDiscount: boolean;      // Token trading below mark (buy opportunity)
  markPriceUsdCents: number; // For passing to Matka smart contract
}

/**
 * Fetch all Pre-IPO token data from PreStocks API.
 * Returns the raw list of 8 tokenized private company tokens.
 */
export async function fetchPrestocks(): Promise<PrestocksToken[]> {
  const res = await axios.get(PRESTOCKS_API, { timeout: 10_000 });
  const data = res.data;

  // PreStocks API returns: { tokens: [{...}] } or directly an array.
  const raw: any[] = Array.isArray(data) ? data : data.tokens ?? data.data ?? [];

  return raw.map((t: any) => ({
    symbol: t.symbol ?? t.ticker,
    name: t.name,
    mintAddress: t.mintAddress ?? t.mint,
    tokenPrice: parseFloat(t.tokenPrice ?? t.price ?? 0),
    markPrice: parseFloat(t.markPrice ?? t.mark ?? t.tokenPrice ?? 0),
    supply: parseFloat(t.supply ?? 0),
    volume24h: parseFloat(t.volume24h ?? t.volume ?? 0),
    holders: parseInt(t.holders ?? 0),
  }));
}

/**
 * Analyze each token and generate buy/sell signals based on the
 * gap between on-chain DEX price and PreStocks mark price.
 *
 * Discount = token is CHEAPER than real-world valuation → Buy signal
 * Premium  = token is COSTLIER than real-world valuation → Skip/Sell signal
 */
export async function getPrestocksSignals(
  minDiscountPct: number
): Promise<PrestocksSignal[]> {
  const tokens = await fetchPrestocks();

  return tokens.map((token) => {
    const discountPct =
      token.markPrice > 0
        ? ((token.markPrice - token.tokenPrice) / token.markPrice) * 100
        : 0;

    return {
      token,
      discountPct,
      isPremium: discountPct < -1, // >1% premium over mark
      isDiscount: discountPct >= minDiscountPct,
      markPriceUsdCents: Math.round(token.markPrice * 100),
    };
  });
}

/**
 * Get mark price for a specific symbol in USD cents.
 * Used by execute_trade to pass expected_price_usd_cents to Smart Contract.
 */
export async function getMarkPriceUsdCents(symbol: string): Promise<number> {
  const tokens = await fetchPrestocks();
  const token = tokens.find(
    (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
  );
  if (!token) throw new Error(`PreStocks: symbol ${symbol} not found`);
  return Math.round(token.markPrice * 100);
}
