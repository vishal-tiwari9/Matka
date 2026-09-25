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
  // vaultId must be a valid u8 (0-255). Clamp defensively.
  const safeId = Math.max(0, Math.min(255, Math.floor(vaultId)));
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, ownerPubkey.toBuffer(), Buffer.from([safeId])],
    MATKA_PROGRAM_ID
  );
}

export function getPolicyPda(vaultPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POLICY_SEED, vaultPda.toBuffer()],
    MATKA_PROGRAM_ID
  );
}

// ── Anchor Program Factory ─────────────────────────────────────
//
// SolPG exports IDLs in the OLD Anchor ≤0.29 format.
// Anchor v0.30+ (and v0.32 which you're using) requires a different format.
// We apply 4 string transforms to convert the old IDL to the new format:
//
//  FIX 1: "publicKey" → "pubkey"          (field type name changed)
//  FIX 2: "defined":"Name" → "defined":{"name":"Name"}  (defined type refs)
//  FIX 3: "isMut":bool → "writable":bool  (account mutability flag renamed)
//         "isSigner":bool → "signer":bool  (account signer flag renamed)
//  FIX 4: "MatkaVault" → "matkaVault"     (account names must be camelCase)
//         "MatkaPolicy" → "matkaPolicy"   ← THIS WAS THE ROOT CAUSE of
//                                           "Account not found: matkaVault"
//
export function getMatkaProgram(
  provider: anchor.AnchorProvider
): anchor.Program<any> {
  return new anchor.Program(IDL as any, MATKA_PROGRAM_ID, provider);
}

// ── On-chain data types ───────────────────────────────────────
// Anchor v0.30+ deserializes using exact field names from the IDL.
// Our IDL uses camelCase fields (e.g. totalDepositedUsdc).
export interface VaultState {
  vaultId: number;
  owner: PublicKey;
  agent: PublicKey;
  bump: number;
  isSubVault: boolean;
  totalDepositedUsdc: anchor.BN;
  deployedToYield: anchor.BN;
  currentPreipoUsdc: anchor.BN;
  lastTradeTs: anchor.BN;
}

export interface PolicyState {
  vault: PublicKey;
  bump: number;
  maxSingleAssetBps: number;
  minStableReserveBps: number;
  maxPreipoExposureBps: number;
  maxSlippageBps: number;
  maxTradeSizeUsdc: anchor.BN;
  tradeCooldownSecs: anchor.BN;
  maxOracleAgeSecs: anchor.BN;
  maxOracleConfidenceBps: number;
  allowXstocks: boolean;
  allowPreipo: boolean;
  allowSolanaNative: boolean;
}

// ── Safe accessor helpers ─────────────────────────────────────
// Handles both camelCase (Anchor v0.30+) and snake_case (old code) safely.
export function getVaultBalance(vault: any): number {
  if (!vault) return 0;
  const raw = vault.totalDepositedUsdc ?? vault.total_deposited_usdc;
  if (!raw) return 0;
  return (typeof raw.toNumber === "function" ? raw.toNumber() : Number(raw)) / 1_000_000;
}

export function getDeployedToYield(vault: any): number {
  if (!vault) return 0;
  const raw = vault.deployedToYield ?? vault.deployed_to_yield;
  if (!raw) return 0;
  return (typeof raw.toNumber === "function" ? raw.toNumber() : Number(raw)) / 1_000_000;
}

export function getCurrentPreipo(vault: any): number {
  if (!vault) return 0;
  const raw = vault.currentPreipoUsdc ?? vault.current_preipo_usdc;
  if (!raw) return 0;
  return (typeof raw.toNumber === "function" ? raw.toNumber() : Number(raw)) / 1_000_000;
}

// ── Utility ───────────────────────────────────────────────────
export function formatUsdc(raw: anchor.BN | number | undefined): string {
  if (raw === undefined || raw === null) return "0.00";
  const n = typeof raw === "number" ? raw : raw.toNumber();
  return (n / 1_000_000).toFixed(2);
}

export function bpsToPercent(bps: number): number {
  return (bps / 10_000) * 100;
}

export function percentToBps(pct: number): number {
  return Math.round((pct / 100) * 10_000);
}

export function getPolicyBps(policy: any, field: string): number {
  if (!policy) return 0;
  const raw = policy[field] ?? policy[field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)];
  if (!raw) return 0;
  return typeof raw.toNumber === "function" ? raw.toNumber() : Number(raw);
}