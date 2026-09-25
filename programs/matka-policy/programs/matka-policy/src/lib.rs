// ============================================================
//  Matka Protocol — On-Chain Core
//
//  An autonomous yield-bearing robo-portfolio for tokenized
//  equities on Solana.  The protocol enforces user-defined
//  financial invariants (policy guardrails) against every
//  trade an AI agent proposes.
//
//  Program ID: DPue9pkxExeSKCPQutH6tnDMAkYeGn1nzKcsc6wQLBr
//
//  Instructions
//  ─────────────────────────────────────────────────────────
//  initialize_vault  → Owner creates Vault + Policy PDAs
//  update_policy     → Owner patches risk guardrails (sliders)
//  deposit           → Owner deposits USDC → auto-routed to yield
//  execute_trade     → Agent proposes trade (5-step invariant check)
//  withdraw          → Owner fully exits: unwind → liquidate → return
// ============================================================

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::{
    deposit::*, execute_trade::*, initialize_vault::*, update_policy::*, withdraw::*, fund_sub_vault::*,
};
use state::{PolicyParams, TradeParams};

declare_id!("HZWTgCyrcrhttgf3mQuMnKpf8E8RVnzjP1Yb3zm9dfNS");

#[program]
pub mod matka_policy {
    use super::*;

    /// Create a new Vault + Policy PDA pair for the calling owner.
    /// `agent` is the ClawPump Ed25519 wallet that will trade on behalf.
    pub fn initialize_vault(ctx: Context<InitializeVault>, vault_id: u8, is_sub_vault: bool, agent: Pubkey) -> Result<()> {
        instructions::initialize_vault::handler(ctx, vault_id, is_sub_vault, agent)
    }

    /// Patch one or more policy parameters.  Only the owner can call this.
    pub fn update_policy(ctx: Context<UpdatePolicy>, params: PolicyParams) -> Result<()> {
        instructions::update_policy::handler(ctx, params)
    }

    /// Deposit USDC into the vault.  Funds are immediately routed to Kamino yield.
    pub fn deposit(ctx: Context<Deposit>, amount_usdc: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount_usdc)
    }

    /// AI agent proposes a trade.  Contract validates 5 invariants and executes
    /// the atomic JIT unwind → Jupiter swap → Kamino rewind flow.
    pub fn execute_trade(ctx: Context<ExecuteTrade>, params: TradeParams) -> Result<()> {
        instructions::execute_trade::handler(ctx, params)
    }

    /// Owner exits fully: all positions unwound, tokens liquidated, USDC returned.
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        instructions::withdraw::handler(ctx)
    }
    // This acts as your Emergency Kill Switch
    pub fn liquidate_vault(ctx: Context<Withdraw>) -> Result<()> {
        instructions::withdraw::handler(ctx)
    }
     // NEW: Transfer funds internally from Main Vault to an Agent Vault
    pub fn fund_sub_vault(ctx: Context<FundSubVault>, sub_vault_id: u8, amount_usdc: u64) -> Result<()> {
        instructions::fund_sub_vault::handler(ctx, sub_vault_id, amount_usdc)
    }
}
