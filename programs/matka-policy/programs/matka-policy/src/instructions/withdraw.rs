use anchor_lang::prelude::*;
use crate::constants::{VAULT_SEED, POLICY_SEED};
use crate::errors::MatkaError;
use crate::state::{MatkaVault, MatkaPolicy};

// ============================================================
//  withdraw
//
//  The vault OWNER can withdraw their entire balance at any
//  time.  Flow:
//    1. Unwind ALL positions from Kamino
//    2. Swap all non-USDC tokens back to USDC via Jupiter
//    3. Transfer full USDC balance to owner's wallet
//
//  The AI agent CANNOT call this instruction.
// ============================================================

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner @ MatkaError::NotOwner,
    )]
    pub vault: Account<'info, MatkaVault>,

    #[account(
        seeds = [POLICY_SEED, vault.key().as_ref()],
        bump = policy.bump,
    )]
    pub policy: Account<'info, MatkaPolicy>,
}

pub fn handler(ctx: Context<Withdraw>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let withdraw_amount = vault.total_deposited_usdc;

    // [STUB] In production:
    // 1. Kamino: close all lending positions and redeem collateral
    // 2. Jupiter: swap all received tokens (AAPLx, TSLAx etc) → USDC
    // 3. SPL Transfer: vault USDC ATA → owner USDC ATA

    msg!(
        "[Kamino → Full Unwind] Closing all yield positions. Deployed: {}",
        vault.deployed_to_yield
    );
    msg!(
        "[Jupiter → Liquidate] Swapping all portfolio tokens back to USDC"
    );
    msg!(
        "[Transfer → Owner] {} USDC returned to {}",
        withdraw_amount,
        vault.owner
    );

    // Reset vault state
    vault.total_deposited_usdc = 0;
    vault.deployed_to_yield = 0;
    vault.last_trade_ts = 0;

    Ok(())
}
