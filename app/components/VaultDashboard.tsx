"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import ClientWalletButton from "./ClientWalletButton";
import { useMatka } from "../lib/useMatka";
// FIX: formatUsdc was imported here but didn't exist in program.ts → compilation error.
// It's now exported from program.ts (see the fix there).
import {
  formatUsdc,
  bpsToPercent,
  getVaultBalance,
  getDeployedToYield,
  getCurrentPreipo,
  getPolicyBps,
} from "../lib/program";
import CreateVaultModal from "./CreateVaultModal";
import DepositModal from "./DepositModal";

export default function VaultDashboard() {
  const { publicKey } = useWallet();
  const {
    vault,
    policy,
    vaultExists,
    loading,
    initializeVault,
    deposit,
    withdraw,
    updatePolicy,
    refresh,
  } = useMatka();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const handleWithdraw = async () => {
    if (
      !confirm(
        "Are you sure you want to withdraw ALL funds from the vault? This will unwind all positions and return USDC to your wallet."
      )
    )
      return;
    try {
      const tx = await withdraw();
      alert(`✅ Funds Withdrawn!\nTx: ${tx}`);
    } catch (e: any) {
      alert(`❌ Error: ${e.message}`);
    }
  };

  // FIX: Use safe accessor helpers.
  // Anchor v0.30+ returns camelCase fields (totalDepositedUsdc),
  // but raw access like vault.total_deposited_usdc returns undefined.
  // The helpers try both camelCase and snake_case and handle BN → number safely.
  const aum = getVaultBalance(vault);
  const yieldDeployed = getDeployedToYield(vault);
  const preIpo = getCurrentPreipo(vault);

  // FIX: PolicyState no longer has phantom is_sub_vault field.
  // Use getPolicyBps which handles camelCase/snake_case duality.
  const rawCap = getPolicyBps(policy, "maxPreipoExposureBps");
  const preIpoCap = rawCap > 0 ? bpsToPercent(rawCap) : 20;
  const currentPreIpoPct = aum > 0 ? (preIpo / aum) * 100 : 0;

  if (!publicKey) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center gap-4 min-h-[220px]">
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15 }}>
          Connect your wallet to view your Matka vault
        </p>
        <ClientWalletButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center min-h-[220px]">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
          }}
        >
          <span style={{ animation: "spin 1s linear infinite" }}>🔄</span>{" "}
          Loading on-chain vault data...
        </div>
      </div>
    );
  }

  if (!vaultExists) {
    return (
      <>
        <div
          className="glass-card"
          style={{
            padding: "40px 32px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 300,
              height: 100,
              background:
                "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
              filter: "blur(20px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))",
              border: "1px solid rgba(59,130,246,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              margin: "0 auto 16px auto",
            }}
          >
            🏦
          </div>
          <h2
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 8px 0",
            }}
          >
            No Active Robo-Vault Found
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 14,
              maxWidth: 500,
              margin: "0 auto 24px auto",
              lineHeight: 1.5,
            }}
          >
            Create your decentralized vault to deploy funds automatically into
            Kamino yield and let the ClawPump agent execute stock-paired
            arbitrage within your custom policy limits.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "12px 28px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15,
              boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
              transition: "transform 0.2s",
            }}
          >
            ✨ Configure & Initialize Vault
          </button>
        </div>

        <CreateVaultModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => refresh()}
          initializeVault={initializeVault}
          deposit={deposit}
          updatePolicy={updatePolicy}
        />
      </>
    );
  }

  return (
    <>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
      >
        {/* Total AUM */}
        <div
          className="glass-card"
          style={{ padding: 24, position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(59,130,246,0.15)",
              borderRadius: 20,
              padding: "2px 10px",
              border: "1px solid rgba(59,130,246,0.3)",
            }}
          >
            <span
              style={{
                color: "#3b82f6",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              DEVNET LIVE
            </span>
          </div>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Total Vault AUM
          </p>
          {/* FIX: was vault.total_deposited_usdc.toNumber() / 1e6 — undefined crash.
              Now uses getVaultBalance() safe helper above. */}
          <p
            style={{
              color: "white",
              fontSize: 36,
              fontWeight: 300,
              letterSpacing: -1,
              margin: "0 0 16px 0",
            }}
          >
            ${aum.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              USDC
            </span>
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setIsDepositModalOpen(true)}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              + Deposit USDC
            </button>
            <button
              onClick={handleWithdraw}
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Withdraw All
            </button>
          </div>
        </div>

        {/* Kamino Yield */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Active Kamino Yield
            </p>
            <span
              style={{
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 20,
                border: "1px solid rgba(16,185,129,0.25)",
              }}
            >
              8.4% APY
            </span>
          </div>
          <p
            style={{
              color: "white",
              fontSize: 32,
              fontWeight: 300,
              letterSpacing: -1,
              margin: "0 0 8px 0",
            }}
          >
            ${yieldDeployed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 12,
              margin: "0 0 12px 0",
              lineHeight: 1.4,
            }}
          >
            100% of idle USDC deployed to Kamino. Instantly unwound for trade
            execution.
          </p>
          <div
            style={{
              height: 4,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width:
                  aum > 0 ? `${(yieldDeployed / aum) * 100}%` : "0%",
                background: "linear-gradient(90deg, #10b981, #3b82f6)",
                borderRadius: 4,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>

        {/* Pre-IPO Allocation */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Pre-IPO Allocation
            </p>
            <span
              style={{
                background: "rgba(139,92,246,0.15)",
                color: "#8b5cf6",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 20,
                border: "1px solid rgba(139,92,246,0.25)",
              }}
            >
              {currentPreIpoPct.toFixed(1)}% / {preIpoCap.toFixed(1)}% Cap
            </span>
          </div>
          <p
            style={{
              color: "white",
              fontSize: 32,
              fontWeight: 300,
              letterSpacing: -1,
              margin: "0 0 8px 0",
            }}
          >
            ${preIpo.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 12,
              margin: "0 0 12px 0",
              lineHeight: 1.4,
            }}
          >
            Tokens (SPACEXx, OPENAIx) governed by PreStocks policy cap.
          </p>
          <div
            style={{
              height: 4,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(
                  preIpoCap > 0
                    ? (currentPreIpoPct / preIpoCap) * 100
                    : 0,
                  100
                )}%`,
                background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
                borderRadius: 4,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDeposit={async (amt) => {
          const res = await deposit(amt);
          await refresh();
          return res;
        }}
      />
    </>
  );
}
