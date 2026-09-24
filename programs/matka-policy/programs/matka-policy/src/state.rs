use anchor_lang::prelude::*;

// ============================================================
//  MatkaVault — the on-chain treasury for one user
//
//  One vault per user wallet.  PDA seeds: [b"vault", owner].
//  The vault is the *only* authority over deposited funds.
//  The AI agent wallet is stored here as `agent` — it can
//  call execute_trade but can NEVER withdraw to an arbitrary
//  address.
// ============================================================
#[account]
#[derive(Debug)]
pub struct MatkaVault {
    /// The user who owns this vault (signs deposit / withdraw)
    pub owner: Pubkey,
    /// The delegated AI agent wallet (signs execute_trade only)
    pub agent: Pubkey,
    /// Vault bump for PDA re-derivation
    pub bump: u8,
    /// Total USDC deposited (raw 6-decimal units, mirrors Token-2022)
    pub total_deposited_usdc: u64,
    /// Amount currently deployed to Kamino as collateral (tracked for JIT unwind)
    pub deployed_to_yield: u64,
    /// Amount currently allocated to Pre-IPO assets (PreStocks / Tessera tokens)
    pub current_preipo_usdc: u64,
    /// Unix timestamp of last rebalance / trade
    pub last_trade_ts: i64,
}

impl MatkaVault {
    pub const LEN: usize = 8
        + 32  // owner
        + 32  // agent
        + 1   // bump
        + 8   // total_deposited_usdc
        + 8   // deployed_to_yield
        + 8   // current_preipo_usdc
        + 8;  // last_trade_ts
}

// ============================================================
//  MatkaPolicy — the on-chain rule book written by the user
//
//  PDA seeds: [b"policy", vault].
//  Every instruction that moves money reads this account and
//  enforces the invariants BEFORE committing state.
//
//  All percentage limits are stored in BASIS POINTS (bps).
//  1 bps = 0.01%.  100 bps = 1%.  10_000 bps = 100%.
// ============================================================
#[account]
#[derive(Debug)]
pub struct MatkaPolicy {
    /// The vault this policy belongs to
    pub vault: Pubkey,
    pub bump: u8,

    // ── Risk Allocation Limits (in basis points) ─────────────
    /// Max single-asset exposure.  Default: 2500 (25%)
    pub max_single_asset_bps: u16,
    /// Minimum USDC reserve the agent must NEVER touch.  Default: 2000 (20%)
    pub min_stable_reserve_bps: u16,
    /// Max Pre-IPO asset exposure (PreStocks / Tessera).  Default: 2000 (20%)
    pub max_preipo_exposure_bps: u16,
    /// Max allowed slippage per trade in bps.  Default: 100 (1%)
    pub max_slippage_bps: u16,

    // ── Execution Controls ───────────────────────────────────
    /// Max single-trade size in USDC (raw 6-dec units).  Default: $5000
    pub max_trade_size_usdc: u64,
    /// Minimum seconds between two agent-initiated trades (cooldown)
    pub trade_cooldown_secs: u64,

    // ── Pyth Oracle Controls ─────────────────────────────────
    /// Max age (seconds) of a Pyth price before it is considered stale.  Default: 60
    pub max_oracle_age_secs: u64,
    /// Max allowed confidence interval in bps before trade is blocked.  Default: 200 (2%)
    pub max_oracle_confidence_bps: u16,

    // ── Asset Class Flags ────────────────────────────────────
    /// Allow trading xStocks (public equities: AAPLx, TSLAx ...)
    pub allow_xstocks: bool,
    /// Allow trading PreStocks / Tessera pre-IPO tokens
    pub allow_preipo: bool,
    /// Allow trading Solana-native tokens (SOL, JTO, JUP ...)
    pub allow_solana_native: bool,
}

impl MatkaPolicy {
    pub const LEN: usize = 8
        + 32 // vault
        + 1  // bump
        + 2  // max_single_asset_bps
        + 2  // min_stable_reserve_bps
        + 2  // max_preipo_exposure_bps
        + 2  // max_slippage_bps
        + 8  // max_trade_size_usdc
        + 8  // trade_cooldown_secs
        + 8  // max_oracle_age_secs
        + 2  // max_oracle_confidence_bps
        + 1  // allow_xstocks
        + 1  // allow_preipo
        + 1; // allow_solana_native
}

// ============================================================
//  PolicyParams — instruction argument used in update_policy
//  All fields are Option<T> so the user can patch only what
//  they want to change without resetting everything.
// ============================================================
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PolicyParams {
    pub max_single_asset_bps: Option<u16>,
    pub min_stable_reserve_bps: Option<u16>,
    pub max_preipo_exposure_bps: Option<u16>,
    pub max_slippage_bps: Option<u16>,
    pub max_trade_size_usdc: Option<u64>,
    pub trade_cooldown_secs: Option<u64>,
    pub max_oracle_age_secs: Option<u64>,
    pub max_oracle_confidence_bps: Option<u16>,
    pub allow_xstocks: Option<bool>,
    pub allow_preipo: Option<bool>,
    pub allow_solana_native: Option<bool>,
}

// ============================================================
//  TradeParams — instruction argument passed by the AI agent
//  Contains the Jupiter-built swap route and metadata that
//  the contract uses for Pyth validation and invariant checks.
// ============================================================
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TradeParams {
    /// Amount of USDC (raw 6-dec) to withdraw from yield and swap
    pub usdc_in: u64,
    /// Minimum output tokens after slippage (from Jupiter /quote)
    pub min_out_amount: u64,
    /// Is the output token a Pre-IPO asset?  (Enables PreStocks cap check)
    pub is_preipo_asset: bool,
    /// Expected Pyth price in USD cents (for confidence validation)
    pub expected_price_usd_cents: u64,
}
