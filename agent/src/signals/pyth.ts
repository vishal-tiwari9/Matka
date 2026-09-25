import { HermesClient } from "@pythnetwork/hermes-client";

// ============================================================
//  pyth.ts — Pyth Network Integration
//
//  Role in Matka Protocol:
//  - Fetches live oracle prices for public equities (TSLAx, AAPLx, NVDAx)
//  - The Smart Contract on-chain reads the Pyth PriceUpdateV2 account
//    to validate the agent's trade price hasn't deviated from reality.
//  - Agent ALSO reads Pyth off-chain to build intelligent trade signals
//    (e.g., "TSLAx on Jupiter is trading 3% below Pyth oracle → buy")
//
//  On mainnet-fork (localnet): uses cloned real Pyth mainnet accounts.
//  On devnet: uses Pyth Hermes REST API (free tier covers crypto).
//  On mainnet: requires Pyth Pro for equity feeds.
// ============================================================

// Use the new dourolabs hermes endpoint or the env variable
const PYTH_ENDPOINT = "https://hermes.pyth.network";

// Pyth Price Feed IDs for equities (mainnet)
export const PYTH_FEED_IDS = {
  TSLA:  "0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad5d8f7",
  AAPL:  "0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad5d8f8", // placeholder
  NVDA:  "0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad5d8f9", // placeholder
  SOL:   "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
};

export interface PythPrice {
  symbol: string;
  price: number;            // USD price
  conf: number;             // Confidence interval (± USD)
  confBps: number;          // conf/price as basis points
  publishTime: number;      // Unix timestamp of last update
  ageSeconds: number;       // How old is this price right now
  isStale: boolean;         // true if older than max_oracle_age_secs
}

// Initialize Hermes Client
const hermes = new HermesClient(PYTH_ENDPOINT);

/**
 * Fetch latest price from Pyth Hermes REST API.
 * Hermes is Pyth's off-chain price aggregator.
 */
export async function getPythPrice(
  symbol: keyof typeof PYTH_FEED_IDS,
  maxAgeSecs: number = 60
): Promise<PythPrice> {
  const feedId = PYTH_FEED_IDS[symbol];
  
  try {
    const res = await hermes.getLatestPriceUpdates([feedId]);
    const feed = res.parsed?.[0];
    
    if (!feed || !feed.price) throw new Error(`Pyth: no price data for ${symbol}`);
    
    // Pyth prices are integers scaled by an exponent
    const priceStr = feed.price.price;
    const expo = feed.price.expo;
    const confStr = feed.price.conf;
    const publishTime = feed.price.publishTime;
    
    const price = Number(priceStr) * Math.pow(10, expo);
    const conf = Number(confStr) * Math.pow(10, expo);
    const ageSeconds = Math.floor(Date.now() / 1000) - publishTime;
    const confBps = price > 0 ? Math.round((conf / price) * 10_000) : 9999;
    
    return {
      symbol,
      price,
      conf,
      confBps,
      publishTime,
      ageSeconds,
      isStale: ageSeconds > maxAgeSecs,
    };
  } catch (error: any) {
    throw new Error(`Pyth fetch failed: ${error.message}`);
  }
}

/**
 * Check if a Jupiter quote price is within slippage tolerance of Pyth oracle.
 * Used to generate the expected_price_usd_cents field for execute_trade.
 */
export function validatePriceDeviation(
  jupiterPriceUsd: number,
  pythPriceUsd: number,
  maxSlippageBps: number
): { valid: boolean; deviationBps: number } {
  const deviationBps = Math.round(
    (Math.abs(jupiterPriceUsd - pythPriceUsd) / pythPriceUsd) * 10_000
  );
  return {
    valid: deviationBps <= maxSlippageBps,
    deviationBps,
  };
}
