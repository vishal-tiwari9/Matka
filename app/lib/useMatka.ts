"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import {
  getMatkaProgram,
  getVaultPda,
  getPolicyPda,
  VaultState,
  PolicyState,
  percentToBps,
} from "./program";

interface UseMatkaReturn {
  vault: VaultState | null;
  policy: PolicyState | null;
  vaultExists: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  initializeVault: (agentPubkey: string, isSubVault?: boolean) => Promise<string>;
  initializeSubVault: (subVaultId: number, agentPubkeyStr: string) => Promise<string>;
  deposit: (amountUsdc: number) => Promise<string>;
  withdraw: () => Promise<string>;
  liquidateVault: () => Promise<string>;
  fundSubVault: (subVaultId: number, amountUsdc: number) => Promise<string>;
  updateSubVaultPolicy: (
    subVaultId: number,
    params: {
      maxTradePct: number;
      maxPreipoPct: number;
      cooldownSecs: number;
      slippageBps: number;
    }
  ) => Promise<string>;
  updatePolicy: (params: {
    maxPreipoExposureBps?: number;
    maxSingleAssetBps?: number;
    minStableReserveBps?: number;
    maxSlippageBps?: number;
    tradeCooldownSecs?: number;
    allowXstocks?: boolean;
    allowPreipo?: boolean;
  }) => Promise<string>;
}

export function useMatka(vaultId: number = 0): UseMatkaReturn {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [vault, setVault] = useState<VaultState | null>(null);
  const [policy, setPolicy] = useState<PolicyState | null>(null);
  const [vaultExists, setVaultExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback((): anchor.AnchorProvider | null => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return null;
    return new anchor.AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      },
      { commitment: "confirmed", preflightCommitment: "confirmed" }
    );
  }, [connection, wallet]);

  // ── refresh ───────────────────────────────────────────────────
  // Checks if vault PDA exists on-chain. If not → vaultExists=false (normal
  // for new users). Only sets error for unexpected failures, not "not found".
  const refresh = useCallback(async () => {
    if (!wallet.publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const provider = getProvider();
      if (!provider) return;

      const [vaultPda] = getVaultPda(wallet.publicKey, vaultId);
      const [policyPda] = getPolicyPda(vaultPda);

      // Check if the account exists BEFORE trying to parse it.
      // getAccountInfo returns null for non-existent accounts (not an error).
      const vaultInfo = await connection.getAccountInfo(vaultPda);
      if (!vaultInfo) {
        setVaultExists(false);
        setVault(null);
        setPolicy(null);
        return; // ← normal path for new users
      }

      // Account exists — now parse it with the fixed IDL
      const program = getMatkaProgram(provider) as any;
      const [fetchedVault, fetchedPolicy] = await Promise.all([
        program.account.matkaVault.fetch(vaultPda),
        program.account.matkaPolicy.fetch(policyPda),
      ]);

      setVault(fetchedVault as VaultState);
      setPolicy(fetchedPolicy as PolicyState);
      setVaultExists(true);
    } catch (e: any) {
      console.error(`refresh error for vaultId ${vaultId}:`, e);
      // Don't surface IDL parse errors as user-visible — they're dev errors
      setError(e?.message ?? "Unknown error fetching vault");
      setVaultExists(false);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, connection, getProvider, vaultId]);

  useEffect(() => {
    if (wallet.publicKey) {
      refresh();
    } else {
      setVault(null);
      setPolicy(null);
      setVaultExists(false);
      setError(null);
    }
  }, [wallet.publicKey, vaultId, refresh]);

  // ── initializeVault (main vault, uses hook's own vaultId) ─────
  const initializeVault = useCallback(
    async (agentPubkeyStr: string, isSubVault: boolean = false): Promise<string> => {
      const provider = getProvider();
      if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

      const program = getMatkaProgram(provider) as any;
      const [vaultPda] = getVaultPda(wallet.publicKey, vaultId);
      const [policyPda] = getPolicyPda(vaultPda);
      const agentPubkey = new anchor.web3.PublicKey(agentPubkeyStr);

      const tx = await program.methods
        .initializeVault(vaultId, isSubVault, agentPubkey)
        .accounts({
          owner: wallet.publicKey,
          vault: vaultPda,
          policy: policyPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await refresh();
      return tx;
    },
    [wallet.publicKey, getProvider, refresh, vaultId]
  );

  // ── initializeSubVault (for agent creation, explicit subVaultId) ──
  // MUST be called before fundSubVault — the chain needs the account to exist
  // before reading sub_vault.bump in the fund instruction.
  const initializeSubVault = useCallback(
    async (subVaultId: number, agentPubkeyStr: string): Promise<string> => {
      const provider = getProvider();
      if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

      const program = getMatkaProgram(provider) as any;
      const [subVaultPda] = getVaultPda(wallet.publicKey, subVaultId);
      const [subPolicyPda] = getPolicyPda(subVaultPda);
      const agentPubkey = new anchor.web3.PublicKey(agentPubkeyStr);

      return program.methods
        .initializeVault(subVaultId, true, agentPubkey)
        .accounts({
          owner: wallet.publicKey,
          vault: subVaultPda,
          policy: subPolicyPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    [wallet.publicKey, getProvider]
  );

  // ── deposit ───────────────────────────────────────────────────
  const deposit = useCallback(
    async (amountUsdc: number): Promise<string> => {
      const provider = getProvider();
      if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

      const program = getMatkaProgram(provider) as any;
      const [vaultPda] = getVaultPda(wallet.publicKey, vaultId);
      const [policyPda] = getPolicyPda(vaultPda);
      const rawAmount = new anchor.BN(Math.round(amountUsdc * 1_000_000));

      const tx = await program.methods
        .deposit(rawAmount)
        .accounts({
          owner: wallet.publicKey,
          vault: vaultPda,
          policy: policyPda,
        })
        .rpc();

      await refresh();
      return tx;
    },
    [wallet.publicKey, getProvider, refresh, vaultId]
  );

  // ── withdraw ──────────────────────────────────────────────────
  const withdraw = useCallback(async (): Promise<string> => {
    const provider = getProvider();
    if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

    const program = getMatkaProgram(provider);
    const [vaultPda] = getVaultPda(wallet.publicKey, vaultId);
    const [policyPda] = getPolicyPda(vaultPda);

    const tx = await program.methods
      .withdraw()
      .accounts({
        owner: wallet.publicKey,
        vault: vaultPda,
        policy: policyPda,
      })
      .rpc();

    await refresh();
    return tx;
  }, [wallet.publicKey, getProvider, refresh, vaultId]);

  // ── liquidateVault ────────────────────────────────────────────
  // Kill switch — calls on-chain liquidateVault for THIS vaultId (not always 0)
  const liquidateVault = useCallback(async (): Promise<string> => {
    const provider = getProvider();
    if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

    const program = getMatkaProgram(provider);
    const [vaultPda] = getVaultPda(wallet.publicKey, vaultId);
    const [policyPda] = getPolicyPda(vaultPda);

    const tx = await program.methods
      .liquidateVault()
      .accounts({
        owner: wallet.publicKey,
        vault: vaultPda,
        policy: policyPda,
      })
      .rpc();

    await refresh();
    return tx;
  }, [wallet.publicKey, getProvider, refresh, vaultId]);

  // ── fundSubVault ──────────────────────────────────────────────
  // NOTE: sub-vault must already be initialized (initializeSubVault called first)
  const fundSubVault = useCallback(
    async (subVaultId: number, amountUsdc: number): Promise<string> => {
      const provider = getProvider();
      if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

      const program = getMatkaProgram(provider) as any;
      const [mainVaultPda] = getVaultPda(wallet.publicKey, 0);
      const [subVaultPda] = getVaultPda(wallet.publicKey, subVaultId);
      const rawAmount = new anchor.BN(Math.round(amountUsdc * 1_000_000));

      const tx = await program.methods
        .fundSubVault(subVaultId, rawAmount)
        .accounts({
          owner: wallet.publicKey,
          mainVault: mainVaultPda,
          subVault: subVaultPda,
        })
        .rpc();

      await refresh();
      return tx;
    },
    [wallet.publicKey, getProvider, refresh]
  );

  // ── updateSubVaultPolicy ──────────────────────────────────────
  // Writes strategy rules to a specific sub-vault's policy PDA.
  // All PolicyParams fields MUST be camelCase to match the IDL.
  const updateSubVaultPolicy = useCallback(
    async (
      subVaultId: number,
      params: {
        maxTradePct: number;
        maxPreipoPct: number;
        cooldownSecs: number;
        slippageBps: number;
      }
    ): Promise<string> => {
      const provider = getProvider();
      if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

      const program = getMatkaProgram(provider) as any;
      const [subVaultPda] = getVaultPda(wallet.publicKey, subVaultId);
      const [subPolicyPda] = getPolicyPda(subVaultPda);

      return program.methods
        .updatePolicy({
          maxSingleAssetBps:      percentToBps(params.maxTradePct),
          minStableReserveBps:    null,
          maxPreipoExposureBps:   percentToBps(params.maxPreipoPct),
          maxSlippageBps:         params.slippageBps,
          maxTradeSizeUsdc:       null,
          tradeCooldownSecs:      new anchor.BN(params.cooldownSecs),
          maxOracleAgeSecs:       null,
          maxOracleConfidenceBps: null,
          allowXstocks:           true,
          allowPreipo:            true,
          allowSolanaNative:      null,
        })
        .accounts({
          owner: wallet.publicKey,
          vault: subVaultPda,
          policy: subPolicyPda,
        })
        .rpc();
    },
    [wallet.publicKey, getProvider]
  );

  // ── updatePolicy (for main vault) ─────────────────────────────
  // All PolicyParams fields MUST be camelCase — snake_case serializes as null.
  const updatePolicy = useCallback(
    async (params: {
      maxPreipoExposureBps?: number;
      maxSingleAssetBps?: number;
      minStableReserveBps?: number;
      maxSlippageBps?: number;
      tradeCooldownSecs?: number;
      allowXstocks?: boolean;
      allowPreipo?: boolean;
    }): Promise<string> => {
      const provider = getProvider();
      if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

      const program = getMatkaProgram(provider) as any;
      const [vaultPda] = getVaultPda(wallet.publicKey, vaultId);
      const [policyPda] = getPolicyPda(vaultPda);

      const tx = await program.methods
        .updatePolicy({
          maxSingleAssetBps:      params.maxSingleAssetBps      ?? null,
          minStableReserveBps:    params.minStableReserveBps    ?? null,
          maxPreipoExposureBps:   params.maxPreipoExposureBps   ?? null,
          maxSlippageBps:         params.maxSlippageBps         ?? null,
          maxTradeSizeUsdc:       null,
          tradeCooldownSecs:      params.tradeCooldownSecs != null
                                    ? new anchor.BN(params.tradeCooldownSecs)
                                    : null,
          maxOracleAgeSecs:       null,
          maxOracleConfidenceBps: null,
          allowXstocks:           params.allowXstocks  ?? null,
          allowPreipo:            params.allowPreipo   ?? null,
          allowSolanaNative:      null,
        })
        .accounts({
          owner: wallet.publicKey,
          vault: vaultPda,
          policy: policyPda,
        })
        .rpc();

      await refresh();
      return tx;
    },
    [wallet.publicKey, getProvider, refresh, vaultId]
  );

  return {
    vault,
    policy,
    vaultExists,
    loading,
    error,
    refresh,
    initializeVault,
    initializeSubVault,
    deposit,
    withdraw,
    liquidateVault,
    fundSubVault,
    updateSubVaultPolicy,
    updatePolicy,
  };
}