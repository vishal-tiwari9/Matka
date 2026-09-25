// ============================================================
//  tokens.ts — Single source of truth for all PreStocks tokens
//  Mint addresses are real on-chain Token-2022 mints from
//  the PreStocks protocol on Solana mainnet.
// ============================================================

export interface PreStock {
  symbol: string;
  name: string;
  mint: string;
  sector: string;
  description: string;
  // Mock reference price for devnet demo (USD cents)
  mockMarkPriceCents: number;
}

export const PRESTOCKS: PreStock[] = [
  {
    symbol: "ANTHROPIC",
    name: "Anthropic",
    mint: "Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw",
    sector: "AI",
    description: "AI safety company behind Claude",
    mockMarkPriceCents: 31550,   // ~$315.50 per share
  },
  {
    symbol: "OPENAI",
    name: "OpenAI",
    mint: "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF",
    sector: "AI",
    description: "Creator of ChatGPT and GPT-4",
    mockMarkPriceCents: 18000,
  },
  {
    symbol: "ANDURIL",
    name: "Anduril Industries",
    mint: "PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB",
    sector: "Defense",
    description: "AI-powered defense technology",
    mockMarkPriceCents: 8500,
  },
  {
    symbol: "NEURALINK",
    name: "Neuralink",
    mint: "PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S",
    sector: "Biotech",
    description: "Brain-computer interface technology",
    mockMarkPriceCents: 31550,
  },
  {
    symbol: "FIGURE_AI",
    name: "Figure AI",
    mint: "PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd",
    sector: "Robotics",
    description: "General-purpose humanoid robots",
    mockMarkPriceCents: 4200,
  },
  {
    symbol: "KALSHI",
    name: "Kalshi",
    mint: "PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua",
    sector: "Fintech",
    description: "Regulated prediction market exchange",
    mockMarkPriceCents: 1250,
  },
  {
    symbol: "POLYMARKET",
    name: "Polymarket",
    mint: "Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP",
    sector: "Fintech",
    description: "Decentralized prediction market",
    mockMarkPriceCents: 890,
  },
  {
    symbol: "SPACEX",
    name: "SpaceX",
    mint: "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
    sector: "Aerospace",
    description: "Private space exploration company",
    mockMarkPriceCents: 22500,
  },
  {
    symbol: "XAI",
    name: "xAI",
    mint: "PreC1KtJ1sBPPqaeeqL6Qb15GTLCYVvyYEwxhdfTwfx",
    sector: "AI",
    description: "Elon Musk's AI company behind Grok",
    mockMarkPriceCents: 5500,
  },
];

// Lookup helpers
export const PRESTOCKS_BY_MINT: Record<string, PreStock> = Object.fromEntries(
  PRESTOCKS.map((s) => [s.mint, s])
);

export const PRESTOCKS_BY_SYMBOL: Record<string, PreStock> = Object.fromEntries(
  PRESTOCKS.map((s) => [s.symbol, s])
);

export const ALL_PRESTOCK_MINTS = PRESTOCKS.map((s) => s.mint);
