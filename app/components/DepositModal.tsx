"use client";

import { useState } from "react";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => Promise<string>;
}

export default function DepositModal({ isOpen, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [tx, setTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    if (amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const signature = await onDeposit(amount);
      setTx(signature);
      setTimeout(() => {
        onClose();
        setTx(null);
      }, 2500);
    } catch (e: any) {
      setError(e?.message || "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: 16,
    }}>
      <div style={{
        background: "#0c0c16",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 24,
        width: "100%",
        maxWidth: 440,
        padding: 28,
        color: "white",
        position: "relative",
      }}>
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px 0" }}>Deposit USDC to Vault</h3>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 20px 0" }}>
          Deposited funds earn 8.4% APY on Kamino while waiting for stock trading signals.
        </p>

        {/* Quick Amount Buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[50, 100, 250, 500].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setAmount(val)}
              style={{
                flex: 1,
                background: amount === val ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                border: amount === val ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.08)",
                color: amount === val ? "#60a5fa" : "rgba(255,255,255,0.6)",
                borderRadius: 8,
                padding: "8px 0",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ${val}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "12px 14px",
              color: "white",
              fontSize: 16,
              outline: "none",
            }}
          />
          <span style={{ position: "absolute", right: 14, top: 14, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>USDC</span>
        </div>

        {error && (
          <div style={{ padding: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 11, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {tx && (
          <div style={{ padding: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, color: "#34d399", fontSize: 11, marginBottom: 16 }}>
            ✅ Deposited! <a href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: "#60a5fa" }}>View Explorer ↗</a>
          </div>
        )}

        <button
          onClick={handleDeposit}
          disabled={loading}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Confirming Transaction..." : `Deposit $${amount} USDC`}
        </button>
      </div>
    </div>
  );
}
