use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::MatkaError;
use crate::state::{MatkaPolicy, MatkaVault, PolicyParams};

// ============================================================
//  initialize_vault
//
//  Creates a new MatkaVault and its associated MatkaPolicy PDA
//  with safe, conservative defaults.
//
//  The `agent` pubkey passed here is the ClawPump-derived
//  Ed25519 wallet that will later sign execute_trade calls.
//  It has NO withdrawal rights — it can only propose trades.
// ============================================================

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = MatkaVault::LEN,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, MatkaVault>,

    #[account(
        init,
        payer = owner,
        space = MatkaPolicy::LEN,
        seeds = [POLICY_SEED, vault.key().as_ref()],
        bump,
    )]
    pub policy: Account<'info, MatkaPolicy>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeVault>, agent: Pubkey) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let policy = &mut ctx.accounts.policy;

    // ── Vault setup ──────────────────────────────────────────
    vault.owner = ctx.accounts.owner.key();
    vault.agent = agent;
    vault.bump = ctx.bumps.vault;
    vault.total_deposited_usdc = 0;
    vault.deployed_to_yield = 0;
    vault.current_preipo_usdc = 0;
    vault.last_trade_ts = 0;

    // ── Policy: conservative defaults ────────────────────────
    policy.vault = vault.key();
    policy.bump = ctx.bumps.policy;
    policy.max_single_asset_bps = DEFAULT_MAX_SINGLE_ASSET_BPS;
    policy.min_stable_reserve_bps = DEFAULT_MIN_STABLE_RESERVE_BPS;
    policy.max_preipo_exposure_bps = DEFAULT_MAX_PREIPO_BPS;
    policy.max_slippage_bps = DEFAULT_MAX_SLIPPAGE_BPS;
    policy.max_trade_size_usdc = DEFAULT_MAX_TRADE_USDC;
    policy.trade_cooldown_secs = DEFAULT_TRADE_COOLDOWN_SECS;
    policy.max_oracle_age_secs = DEFAULT_MAX_ORACLE_AGE_SECS;
    policy.max_oracle_confidence_bps = DEFAULT_MAX_ORACLE_CONFIDENCE_BPS;
    policy.allow_xstocks = true;
    policy.allow_preipo = true;
    policy.allow_solana_native = false; // conservative default

    msg!(
        "MatkaVault initialized. Owner: {}, Agent: {}, Vault PDA: {}",
        vault.owner,
        vault.agent,
        vault.key()
    );

    Ok(())
}

// ── Policy validation helper used both here and in update_policy ─
pub fn validate_bps(value: u16) -> Result<()> {
    require!(value <= MAX_BPS, MatkaError::InvalidPolicyParam);
    Ok(())
}
