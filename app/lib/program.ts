import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import IDL from "../../idl.json";

// ── Program Constants ─────────────────────────────────────────
export const MATKA_PROGRAM_ID = new PublicKey(
  "HZWTgCyrcrhttgf3mQuMnKpf8E8RVnzjP1Yb3zm9dfNS"
);

export const VAULT_SEED = anchor.utils.bytes.utf8.encode("vault");
export const POLICY_SEED = anchor.utils.bytes.utf8.encode("policy");

// ── PDA Helpers ───────────────────────────────────────────────
export function getVaultPda(ownerPubkey: PublicKey, vaultId: number = 0): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, ownerPubkey.toBuffer(), Buffer.from([vaultId])],
    MATKA_PROGRAM_ID
  );
}

export function getPolicyPda(vaultPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POLICY_SEED, vaultPda.toBuffer()],
    MATKA_PROGRAM_ID
  );
}

// ── Anchor Program ─────────────────────────────────────────────
// In Anchor v0.32, IDL with `address` field resolves Program ID automatically.
export function getMatkaProgram(
  provider: anchor.AnchorProvider
): anchor.Program<any> {
  // SolPG exports IDLs using "publicKey" which causes Anchor 0.32 to crash.
  // It also exports custom types as "defined": "Name" instead of "defined": { "name": "Name" }.
  // We string replace both to be compatible with Anchor 0.30+.
  let idlString = JSON.stringify(IDL).replace(/"publicKey"/g, '"pubkey"');
  idlString = idlString.replace(/"defined":\s*"([^"]+)"/g, '"defined":{"name":"$1"}');
  const parsedIdl = JSON.parse(idlString);

  // In Anchor v0.30+, IDL needs an explicit `address` field or it throws a '_bn' reading error
  const idlWithAddress = { ...parsedIdl, address: MATKA_PROGRAM_ID.toBase58() };
  return new anchor.Program(idlWithAddress as any, provider);
}

// ── On-chain data types (snake_case matches IDL) ──────────────
export interface VaultState {
  vault_id: number;
  owner: PublicKey;
  agent: PublicKey;
  bump: number;
  is_sub_vault: boolean;
  total_deposited_usdc: anchor.BN;
  deployed_to_yield: anchor.BN;
  current_preipo_usdc: anchor.BN;
  last_trade_ts: anchor.BN;
}

export interface PolicyState {
  vault: PublicKey;
  bump: number;
  is_sub_vault: boolean;
  max_single_asset_bps: number;
  min_stable_reserve_bps: number;
  max_preipo_exposure_bps: number;
  max_slippage_bps: number;
  max_trade_size_usdc: anchor.BN;
  trade_cooldown_secs: anchor.BN;
  max_oracle_age_secs: anchor.BN;
  max_oracle_confidence_bps: number;
  allow_xstocks: boolean;
  allow_preipo: boolean;
  allow_solana_native: boolean;
}

// ── Utility Helpers ───────────────────────────────────────────
export function bpsToPercent(bps: number): number {
  return (bps / 10_000) * 100;
}

export function percentToBps(pct: number): number {
  return Math.round((pct / 100) * 10_000);
}
