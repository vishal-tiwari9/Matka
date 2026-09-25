// ============================================================
//  constants.rs — protocol-wide constants
//
//  All PreStocks mint addresses are real on-chain Token-2022
//  mints deployed by the PreStocks protocol on Solana mainnet.
// ============================================================

// ── PDA Seeds ────────────────────────────────────────────────
pub const VAULT_SEED: &[u8] = b"vault";
pub const POLICY_SEED: &[u8] = b"policy";

// ── Basis Point Helpers ───────────────────────────────────────
pub const BPS_DENOMINATOR: u64 = 10_000;
pub const MAX_BPS: u16 = 10_000;

// ── Default Policy Values ─────────────────────────────────────
pub const DEFAULT_MAX_SINGLE_ASSET_BPS: u16 = 2_500;    // 25%
pub const DEFAULT_MIN_STABLE_RESERVE_BPS: u16 = 2_000;  // 20%
pub const DEFAULT_MAX_PREIPO_BPS: u16 = 2_000;           // 20%
pub const DEFAULT_MAX_SLIPPAGE_BPS: u16 = 100;           // 1%
pub const DEFAULT_MAX_TRADE_USDC: u64 = 5_000_000_000;  // $5,000 (6 dec)
pub const DEFAULT_TRADE_COOLDOWN_SECS: u64 = 300;        // 5 minutes
pub const DEFAULT_MAX_ORACLE_AGE_SECS: u64 = 60;         // 1 minute
pub const DEFAULT_MAX_ORACLE_CONFIDENCE_BPS: u16 = 200;  // 2%

// ── Pyth Price Feed IDs (Mainnet / Mainnet-Fork) ─────────────
pub const PYTH_FEED_TSLA: &str = "GpoWLTd6ZgXNP8roT8KmWOijyeFQQJiGGcZkUMeFXsm";
pub const PYTH_FEED_AAPL: &str = "CTpvQJXGDJoLHXKBFMoWfBLPFHMH7kCR4jvg5R7S2GK";
pub const PYTH_FEED_NVDA: &str = "6TPsjFig2fCF6NpLBCz4pJiGLz73xCzUdEBmExgJXmYT";
pub const PYTH_FEED_SOL: &str  = "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG";

// ── Verified PreStocks Mint Addresses (Mainnet, Token-2022) ──
// Source: prestocks.com — real on-chain mints
pub const PRESTOCK_MINT_ANTHROPIC:  &str = "Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw";
pub const PRESTOCK_MINT_OPENAI:     &str = "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF";
pub const PRESTOCK_MINT_ANDURIL:    &str = "PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB";
pub const PRESTOCK_MINT_NEURALINK:  &str = "PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S";
pub const PRESTOCK_MINT_FIGURE_AI:  &str = "PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd";
pub const PRESTOCK_MINT_KALSHI:     &str = "PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua";
pub const PRESTOCK_MINT_POLYMARKET: &str = "Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP";
pub const PRESTOCK_MINT_SPACEX:     &str = "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh";
pub const PRESTOCK_MINT_XAI:        &str = "PreC1KtJ1sBPPqaeeqL6Qb15GTLCYVvyYEwxhdfTwfx";

/// All allowed PreStocks mints — used in execute_trade invariant
pub const ALL_PRESTOCK_MINTS: &[&str] = &[
    PRESTOCK_MINT_ANTHROPIC,
    PRESTOCK_MINT_OPENAI,
    PRESTOCK_MINT_ANDURIL,
    PRESTOCK_MINT_NEURALINK,
    PRESTOCK_MINT_FIGURE_AI,
    PRESTOCK_MINT_KALSHI,
    PRESTOCK_MINT_POLYMARKET,
    PRESTOCK_MINT_SPACEX,
    PRESTOCK_MINT_XAI,
];

// ── xStocks Verified Mints (Mainnet, Token-2022 Scaled UI) ───
pub const XSTOCK_MINT_TSLA: &str = "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB";
pub const XSTOCK_MINT_AAPL: &str = "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp";
pub const XSTOCK_MINT_NVDA: &str = "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh";

// ── USDC Canonical Mint ───────────────────────────────────────
pub const USDC_MINT: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
