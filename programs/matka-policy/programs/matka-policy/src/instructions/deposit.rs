use anchor_lang::prelude::*;
use crate::constants::{VAULT_SEED, POLICY_SEED};
use crate::errors::MatkaError;
use crate::state::{MatkaVault, MatkaPolicy};

// ============================================================
//  deposit
//
//  Called by the vault owner to add USDC into the vault.
//  In a production build this would transfer USDC from the
//  owner's ATA into the vault's ATA and then CPI into Kamino
//  to deploy 100% to yield immediately.
//
//  For the hackathon localnet demo we update vault state and
//  emit logs that the frontend "Yield Dashboard" reads.
// ============================================================

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.owner.as_ref(), &[vault.vault_id]],
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

pub fn handler(ctx: Context<Deposit>, amount_usdc: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // [STUB] In production: SPL Token transfer from owner ATA → vault ATA
    // then CPI to Kamino to deposit the full amount.
    vault.total_deposited_usdc = vault
        .total_deposited_usdc
        .checked_add(amount_usdc)
        .ok_or(MatkaError::ArithmeticOverflow)?;

    vault.deployed_to_yield = vault
        .deployed_to_yield
        .checked_add(amount_usdc)
        .ok_or(MatkaError::ArithmeticOverflow)?;

    msg!(
        "[Kamino → Deposit] {} USDC deployed to yield in Vault {}. Total AUM: {}",
        amount_usdc,
        vault.vault_id,
        vault.total_deposited_usdc
    );

    Ok(())
}
