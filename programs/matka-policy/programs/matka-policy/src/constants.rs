// ============================================================
//  constants.rs — protocol-wide constants
//
//  These are Mainnet addresses.  When running on localnet /
//  devnet, pass the correct cluster-equivalent or fork the
//  mainnet accounts with solana-test-validator.
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
// Source: https://pyth.network/price-feeds/crypto
// Equity feeds require Pyth Pro subscription.
pub const PYTH_FEED_TSLA: &str  = "GpoWLTd6ZgXNP8roT8KmWOijyeFQQJiGGcZkUMeFXsm";
pub const PYTH_FEED_AAPL: &str  = "CTpvQJXGDJoLHXKBFMoWfBLPFHMH7kCR4jvg5R7S2GK";
pub const PYTH_FEED_NVDA: &str  = "6TPsjFig2fCF6NpLBCz4pJiGLz73xCzUdEBmExgJXmYT";
pub const PYTH_FEED_SOL: &str   = "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG";

// ── Verified PreStocks Mint Addresses (Mainnet, Token-2022) ──
// Source: https://prestocks.com/api/prestocks
// These are the ONLY mints allowed for pre-IPO allocation checks.
pub const PRESTOCK_MINT_SPACEX: &str    = "PreSPACE1111111111111111111111111111111111";  // placeholder
pub const PRESTOCK_MINT_OPENAI: &str    = "PreOPENAI111111111111111111111111111111111";  // placeholder
pub const PRESTOCK_MINT_STRIPE: &str    = "PreSTRIPE111111111111111111111111111111111";  // placeholder
pub const PRESTOCK_MINT_ANDURIL: &str   = "PreANDURIL11111111111111111111111111111111"; // placeholder

// ── xStocks Verified Mints (Mainnet, Token-2022 Scaled UI) ───
// Source: https://docs.xstocks.fi/developers
pub const XSTOCK_MINT_TSLA: &str  = "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB";
pub const XSTOCK_MINT_AAPL: &str  = "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp";
pub const XSTOCK_MINT_NVDA: &str  = "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh";

// ── USDC Canonical Mint ───────────────────────────────────────
pub const USDC_MINT: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
