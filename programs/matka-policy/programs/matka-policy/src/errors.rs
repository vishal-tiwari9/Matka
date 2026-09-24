use anchor_lang::prelude::*;

#[error_code]
pub enum MatkaError {
    // ── Invariant Violations (agent trade blocked) ───────────
    #[msg("Single asset exposure exceeds policy limit")]
    SingleAssetLimitBreached,

    #[msg("Stablecoin reserve would fall below policy floor")]
    StableReserveBreached,

    #[msg("Pre-IPO allocation cap would be exceeded")]
    PreIpoCapBreached,

    #[msg("Trade size exceeds maximum allowed by policy")]
    TradeSizeTooLarge,

    #[msg("Agent must wait for cooldown period before trading again")]
    TradeCooldownActive,

    // ── Oracle / Pyth Violations ─────────────────────────────
    #[msg("Pyth price feed is stale — exceeds max_oracle_age_secs")]
    OraclePriceStale,

    #[msg("Pyth price confidence interval is too wide — market is uncertain")]
    OracleConfidenceTooWide,

    #[msg("Execution price deviates too far from oracle mark price")]
    PriceDeviationTooHigh,

    // ── Authorization Errors ─────────────────────────────────
    #[msg("Caller is not the owner of this vault")]
    NotOwner,

    #[msg("Caller is not the registered agent for this vault")]
    NotAgent,

    // ── Asset Class Errors ───────────────────────────────────
    #[msg("Trading xStocks is disabled by policy")]
    XstocksDisabled,

    #[msg("Trading Pre-IPO assets is disabled by policy")]
    PreIpoDisabled,

    // ── Arithmetic / Config Errors ───────────────────────────
    #[msg("Arithmetic overflow in invariant check")]
    ArithmeticOverflow,

    #[msg("Policy parameter out of valid range (bps must be 0–10000)")]
    InvalidPolicyParam,
}
