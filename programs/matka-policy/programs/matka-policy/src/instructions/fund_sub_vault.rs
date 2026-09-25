use anchor_lang::prelude::*;
use crate::constants::VAULT_SEED;
use crate::state::MatkaVault;

#[derive(Accounts)]
#[instruction(sub_vault_id: u8)]
pub struct FundSubVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    // Main vault is always ID 0
    #[account(
        mut,
        seeds = [VAULT_SEED, owner.key().as_ref(), &[0]], 
        bump = main_vault.bump,
        has_one = owner,
    )]
    pub main_vault: Account<'info, MatkaVault>,

    // The agent sub-vault being funded
    #[account(
        mut,
        seeds = [VAULT_SEED, owner.key().as_ref(), &[sub_vault_id]],
        bump = sub_vault.bump,
        has_one = owner,
    )]
    pub sub_vault: Account<'info, MatkaVault>,
}

pub fn handler(ctx: Context<FundSubVault>, sub_vault_id: u8, amount_usdc: u64) -> Result<()> {
    let main_vault = &mut ctx.accounts.main_vault;
    let sub_vault = &mut ctx.accounts.sub_vault;

    // Check if main vault has enough idle USDC
    require!(main_vault.total_deposited_usdc >= amount_usdc, anchor_lang::error::ErrorCode::ConstraintRaw);

    main_vault.total_deposited_usdc -= amount_usdc;
    sub_vault.total_deposited_usdc += amount_usdc;

    msg!("Funded Sub-Vault {} with {} USDC from Main Vault", sub_vault_id, amount_usdc);
    Ok(())
}