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
  MATKA_PROGRAM_ID,
} from "../lib/program";

interface UseMatkaReturn {
  vault: VaultState | null;
  policy: PolicyState | null;
  vaultExists: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  initializeVault: (agentPubkey: string) => Promise<string>;
  deposit: (amountUsdc: number) => Promise<string>;
  withdraw: () => Promise<string>;
  updatePolicy: (params: {
    max_preipo_exposure_bps?: number;
    max_single_asset_bps?: number;
    min_stable_reserve_bps?: number;
    allow_xstocks?: boolean;
    allow_preipo?: boolean;
  }) => Promise<string>;
}

export function useMatka(): UseMatkaReturn {
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

  const refresh = useCallback(async () => {
    if (!wallet.publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const provider = getProvider();
      if (!provider) return;
      const program = getMatkaProgram(provider);
      const [vaultPda] = getVaultPda(wallet.publicKey);
      const [policyPda] = getPolicyPda(vaultPda);

      const vaultInfo = await connection.getAccountInfo(vaultPda);
      if (!vaultInfo) {
        setVaultExists(false);
        setVault(null);
        setPolicy(null);
        return;
      }

      const [fetchedVault, fetchedPolicy] = await Promise.all([
        program.account.matkaVault.fetch(vaultPda),
        program.account.matkaPolicy.fetch(policyPda),
      ]);

      setVault(fetchedVault as VaultState);
      setPolicy(fetchedPolicy as PolicyState);
      setVaultExists(true);
    } catch (e: any) {
      console.error("refresh error:", e);
      setError(e?.message ?? "Unknown error fetching vault");
      setVaultExists(false);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, connection, getProvider]);

  useEffect(() => {
    if (wallet.publicKey) {
      refresh();
    } else {
      setVault(null);
      setPolicy(null);
      setVaultExists(false);
      setError(null);
    }
  }, [wallet.publicKey]);

  // ── initializeVault ───────────────────────────────────────────
  const initializeVault = useCallback(
    async (agentPubkeyStr: string): Promise<string> => {
      const provider = getProvider();
      if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

      const program = getMatkaProgram(provider);
      const [vaultPda] = getVaultPda(wallet.publicKey);
      const [policyPda] = getPolicyPda(vaultPda);
      const agentPubkey = new anchor.web3.PublicKey(agentPubkeyStr);

      const tx = await program.methods
        .initializeVault(agentPubkey)
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
    [wallet.publicKey, getProvider, refresh]
  );

  // ── deposit ───────────────────────────────────────────────────
  const deposit = useCallback(
    async (amountUsdc: number): Promise<string> => {
      const provider = getProvider();
      if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

      const program = getMatkaProgram(provider);
      const [vaultPda] = getVaultPda(wallet.publicKey);
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
    [wallet.publicKey, getProvider, refresh]
  );

  // ── withdraw ──────────────────────────────────────────────────
  const withdraw = useCallback(async (): Promise<string> => {
    const provider = getProvider();
    if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

    const program = getMatkaProgram(provider);
    const [vaultPda] = getVaultPda(wallet.publicKey);
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
  }, [wallet.publicKey, getProvider, refresh]);

  // ── updatePolicy ──────────────────────────────────────────────
  const updatePolicy = useCallback(
    async (params: {
      max_preipo_exposure_bps?: number;
      max_single_asset_bps?: number;
      min_stable_reserve_bps?: number;
      allow_xstocks?: boolean;
      allow_preipo?: boolean;
    }): Promise<string> => {
      const provider = getProvider();
      if (!provider || !wallet.publicKey) throw new Error("Wallet not connected");

      const program = getMatkaProgram(provider);
      const [vaultPda] = getVaultPda(wallet.publicKey);
      const [policyPda] = getPolicyPda(vaultPda);

      const tx = await program.methods
        .updatePolicy({
          max_single_asset_bps:     params.max_single_asset_bps    ?? null,
          min_stable_reserve_bps:   params.min_stable_reserve_bps  ?? null,
          max_preipo_exposure_bps:  params.max_preipo_exposure_bps ?? null,
          max_slippage_bps:         null,
          max_trade_size_usdc:      null,
          trade_cooldown_secs:      null,
          max_oracle_age_secs:      null,
          max_oracle_confidence_bps:null,
          allow_xstocks:            params.allow_xstocks ?? null,
          allow_preipo:             params.allow_preipo  ?? null,
          allow_solana_native:      null,
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
    [wallet.publicKey, getProvider, refresh]
  );

  return {
    vault,
    policy,
    vaultExists,
    loading,
    error,
    refresh,
    initializeVault,
    deposit,
    withdraw,
    updatePolicy,
  };
}
