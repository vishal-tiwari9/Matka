use anchor_lang::prelude::*;
use crate::constants::{POLICY_SEED, VAULT_SEED, MAX_BPS};
use crate::errors::MatkaError;
use crate::state::{MatkaPolicy, MatkaVault, PolicyParams};
use crate::instructions::initialize_vault::validate_bps;

// ============================================================
//  update_policy
//
//  The vault OWNER can update any or all policy parameters.
//  Uses Option<T> fields so a partial update (e.g., only
//  changing slippage) doesn't reset everything else.
//
//  The AI agent CANNOT call this — only the owner can.
// ============================================================

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner @ MatkaError::NotOwner,
    )]
    pub vault: Account<'info, MatkaVault>,

    #[account(
        mut,
        seeds = [POLICY_SEED, vault.key().as_ref()],
        bump = policy.bump,
        has_one = vault @ MatkaError::NotOwner,
    )]
    pub policy: Account<'info, MatkaPolicy>,
}

pub fn handler(ctx: Context<UpdatePolicy>, params: PolicyParams) -> Result<()> {
    let policy = &mut ctx.accounts.policy;

    // Apply only the fields that were provided (Option pattern)
    if let Some(v) = params.max_single_asset_bps {
        validate_bps(v)?;
        policy.max_single_asset_bps = v;
    }
    if let Some(v) = params.min_stable_reserve_bps {
        validate_bps(v)?;
        policy.min_stable_reserve_bps = v;
    }
    if let Some(v) = params.max_preipo_exposure_bps {
        validate_bps(v)?;
        policy.max_preipo_exposure_bps = v;
    }
    if let Some(v) = params.max_slippage_bps {
        validate_bps(v)?;
        policy.max_slippage_bps = v;
    }
    if let Some(v) = params.max_trade_size_usdc {
        policy.max_trade_size_usdc = v;
    }
    if let Some(v) = params.trade_cooldown_secs {
        policy.trade_cooldown_secs = v;
    }
    if let Some(v) = params.max_oracle_age_secs {
        policy.max_oracle_age_secs = v;
    }
    if let Some(v) = params.max_oracle_confidence_bps {
        validate_bps(v)?;
        policy.max_oracle_confidence_bps = v;
    }
    if let Some(v) = params.allow_xstocks {
        policy.allow_xstocks = v;
    }
    if let Some(v) = params.allow_preipo {
        policy.allow_preipo = v;
    }
    if let Some(v) = params.allow_solana_native {
        policy.allow_solana_native = v;
    }

    msg!(
        "MatkaPolicy updated. max_single={} bps, min_stable={} bps, preipo_cap={} bps",
        policy.max_single_asset_bps,
        policy.min_stable_reserve_bps,
        policy.max_preipo_exposure_bps
    );

    Ok(())
}
