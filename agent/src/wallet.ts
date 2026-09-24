import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
//  wallet.ts — ClawPump Agent Wallet Management
//
//  The agent's Ed25519 keypair is the "ClawPump Identity".
//  In production ClawPump manages the key server-side and
//  you call their API to sign. For self-hosted deployment,
//  load the keypair from AGENT_PRIVATE_KEY env variable.
//
//  Security model:
//  - This wallet is ONLY registered as vault.agent on-chain
//  - It can sign execute_trade instructions
//  - It CANNOT withdraw funds (only vault.owner can)
//  - Even if this key is compromised, attacker can only propose
//    trades that pass the Smart Contract's invariant checks
// ============================================================

let _agentKeypair: Keypair | null = null;

/**
 * Load the ClawPump agent keypair from environment.
 * Supports base58-encoded private key.
 */
export function getAgentKeypair(): Keypair {
  if (_agentKeypair) return _agentKeypair;

  const privateKeyB58 = process.env.AGENT_PRIVATE_KEY;
  if (!privateKeyB58) {
    throw new Error("AGENT_PRIVATE_KEY not set in environment");
  }

  const secretKey = bs58.decode(privateKeyB58);
  _agentKeypair = Keypair.fromSecretKey(secretKey);

  console.log(`[ClawPump Agent] Loaded wallet: ${_agentKeypair.publicKey.toBase58()}`);
  return _agentKeypair;
}

/**
 * Get Solana connection. Uses SOLANA_RPC_URL from env.
 * On mainnet-fork: SOLANA_RPC_URL=http://127.0.0.1:8899
 * On mainnet: SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...
 */
export function getConnection(): Connection {
  return new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
}

/**
 * Derive the vault PDA for a given owner pubkey.
 * Must match the seeds used in the Matka Smart Contract.
 */
export function deriveVaultPda(
  ownerPubkey: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), ownerPubkey.toBuffer()],
    programId
  );
}

/**
 * Derive the policy PDA for a given vault pubkey.
 */
export function derivePolicyPda(
  vaultPubkey: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), vaultPubkey.toBuffer()],
    programId
  );
}
