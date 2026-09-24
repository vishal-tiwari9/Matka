import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";

import { emit, startWsServer } from "./stream";
import { getAgentKeypair, getConnection, deriveVaultPda, derivePolicyPda } from "./wallet";
import { getPrestocksSignals } from "./signals/prestocks";
import { crossValidatePreIpo } from "./signals/tessera";
import { getPythPrice, validatePriceDeviation, PYTH_FEED_IDS } from "./signals/pyth";
import { buildJupiterRoute, checkMeteoraDbc } from "./execution/jupiter";

dotenv.config();

// ── Config ────────────────────────────────────────────────────
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_SECS ?? "30") * 1000;
const MIN_DISCOUNT_PCT = parseFloat(process.env.MIN_DISCOUNT_THRESHOLD_PCT ?? "2");
const MAX_PRESTOCKS_TESSERA_DIVERGENCE = parseFloat(
  process.env.MAX_PRESTOCKS_TESSERA_DIVERGENCE_PCT ?? "5"
);

// xStocks mint addresses (Mainnet)
const XSTOCK_MINTS: Record<string, string> = {
  TSLA: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
  AAPL: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
  NVDA: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
};

/**
 * Main agent loop.
 *
 * Every POLL_INTERVAL_MS seconds:
 * 1. Scan PreStocks for Pre-IPO discount signals
 * 2. Scan Pyth for public equity signals (xStocks)
 * 3. For each signal, validate Pyth oracle + Meteora liquidity
 * 4. For Pre-IPO signals, cross-validate with Tessera NAV
 * 5. Build Jupiter swap route
 * 6. Submit to Matka Smart Contract (execute_trade)
 * 7. Stream every step to frontend via WebSocket
 */
async function runAgentLoop(): Promise<void> {
  const agentKeypair = getAgentKeypair();
  const connection = getConnection();
  const programId = new PublicKey(process.env.MATKA_PROGRAM_ID!);
  const ownerPubkey = new PublicKey(process.env.VAULT_OWNER_PUBKEY!);

  const [vaultPda] = deriveVaultPda(ownerPubkey, programId);
  const [policyPda] = derivePolicyPda(vaultPda, programId);

  // Load Anchor program
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(agentKeypair),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  // TODO: import IDL from target/types/matka_policy.json after build
  // const program = new anchor.Program(IDL, programId, provider);

  emit("HEARTBEAT", `Agent started. Vault: ${vaultPda.toBase58()}`);

  while (true) {
    try {
      await runCycle(vaultPda, policyPda, programId, agentKeypair);
    } catch (err: any) {
      emit("ERROR", `Agent cycle failed: ${err.message}`, { error: err.message });
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

async function runCycle(
  vaultPda: PublicKey,
  policyPda: PublicKey,
  programId: PublicKey,
  agentKeypair: any
): Promise<void> {

  // ── PHASE 1: Scan PreStocks (Pre-IPO Signals) ────────────
  emit("SCANNING", "Scanning PreStocks API for Pre-IPO price discounts...");

  const prestocksSignals = await getPrestocksSignals(MIN_DISCOUNT_PCT);

  for (const signal of prestocksSignals) {
    if (!signal.isDiscount) continue;

    emit("SIGNAL", `📊 ${signal.token.symbol}: DEX price $${signal.token.tokenPrice.toFixed(2)} vs Mark $${signal.token.markPrice.toFixed(2)} (${signal.discountPct.toFixed(1)}% discount)`, {
      symbol: signal.token.symbol,
      tokenPrice: signal.token.tokenPrice,
      markPrice: signal.token.markPrice,
      discountPct: signal.discountPct,
    });

    // ── Cross-validate with Tessera ─────────────────────────
    emit("CHECKING", `🔬 Cross-validating ${signal.token.symbol} with Tessera NAV...`);

    const tesseraValidation = await crossValidatePreIpo(
      signal.token.symbol,
      signal.token.markPrice,
      MAX_PRESTOCKS_TESSERA_DIVERGENCE
    );

    if (tesseraValidation.action === "hold") {
      emit("BLOCKED", `🔴 ${signal.token.symbol} HELD: PreStocks/Tessera diverge ${tesseraValidation.divergencePct.toFixed(1)}% (>${MAX_PRESTOCKS_TESSERA_DIVERGENCE}% threshold). Too uncertain.`, {
        prestocksMark: signal.token.markPrice,
        tesseraNav: tesseraValidation.tesseraNav,
        divergencePct: tesseraValidation.divergencePct,
      });
      continue;
    }

    if (tesseraValidation.action === "no_tessera_data") {
      emit("CHECKING", `ℹ️ ${signal.token.symbol}: No Tessera data. Proceeding with PreStocks mark only.`);
    } else {
      emit("CHECKING", `✅ ${signal.token.symbol}: PreStocks/Tessera agree. Divergence ${tesseraValidation.divergencePct.toFixed(1)}% < ${MAX_PRESTOCKS_TESSERA_DIVERGENCE}% threshold.`);
    }

    // ── Execute pre-IPO trade (would call program.methods.executeTrade) ──
    emit("EXECUTING", `⚡ Submitting execute_trade for ${signal.token.symbol}...`, {
      mint: signal.token.mintAddress,
      markPriceUsdCents: signal.markPriceUsdCents,
      isPreIpo: true,
    });

    // [LIVE CODE] In production:
    // const tx = await program.methods.executeTrade({
    //   usdcIn: new BN(tradeAmountUsdc),
    //   minOutAmount: new BN(route.minOutAmount.toString()),
    //   isPreipoAsset: true,
    //   expectedPriceUsdCents: new BN(signal.markPriceUsdCents),
    // }).accounts({ agent: agentKeypair.publicKey, vault: vaultPda, ... }).rpc();
    // emit("SUCCESS", `✅ ${signal.token.symbol} trade confirmed! Tx: ${tx}`, { tx });
  }

  // ── PHASE 2: Scan Pyth + xStocks (Public Equity Signals) ─
  emit("SCANNING", "Scanning Pyth oracle for public equity price feeds...");

  for (const [symbol, mint] of Object.entries(XSTOCK_MINTS)) {
    if (!(symbol in PYTH_FEED_IDS)) continue;

    try {
      const pythPrice = await getPythPrice(symbol as keyof typeof PYTH_FEED_IDS);

      if (pythPrice.isStale) {
        emit("BLOCKED", `🔴 ${symbol}: Pyth price stale (${pythPrice.ageSeconds}s old). Skipping.`);
        continue;
      }

      if (pythPrice.confBps > 200) {
        emit("BLOCKED", `🔴 ${symbol}: Pyth confidence too wide (${pythPrice.confBps} bps). Market uncertain. Skipping.`);
        continue;
      }

      emit("CHECKING", `✅ ${symbol}: Pyth oracle OK. Price: $${pythPrice.price.toFixed(2)} ± $${pythPrice.conf.toFixed(2)} (${pythPrice.confBps} bps conf, ${pythPrice.ageSeconds}s old)`, {
        symbol,
        price: pythPrice.price,
        confBps: pythPrice.confBps,
        ageSeconds: pythPrice.ageSeconds,
      });

      // TODO: Compare with Jupiter quote price, check deviation, execute if within band
      // This is where the "buy xStock at discount vs oracle" logic lives

    } catch (err: any) {
      emit("ERROR", `Pyth fetch failed for ${symbol}: ${err.message}`);
    }
  }

  // ── PHASE 3: Yield Status Update ─────────────────────────
  // In production: read Kamino position via Kamino SDK
  emit("YIELD", "💰 Kamino yield positions active. APY tracked on dashboard.", {
    kaminoPositionActive: true,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Entry Point ───────────────────────────────────────────────
async function main(): Promise<void> {
  const wsPort = parseInt(process.env.WS_PORT ?? "8080");
  startWsServer(wsPort);

  console.log("🚀 Matka Agent starting...");
  console.log(`   RPC: ${process.env.SOLANA_RPC_URL}`);
  console.log(`   Poll interval: ${POLL_INTERVAL_MS / 1000}s`);
  console.log(`   Min discount threshold: ${MIN_DISCOUNT_PCT}%`);
  console.log(`   Max PreStocks/Tessera divergence: ${MAX_PRESTOCKS_TESSERA_DIVERGENCE}%`);

  await runAgentLoop();
}

main().catch((err) => {
  console.error("Fatal agent error:", err);
  process.exit(1);
});
