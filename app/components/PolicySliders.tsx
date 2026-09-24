"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMatka } from "../lib/useMatka";
import { bpsToPercent, percentToBps } from "../lib/program";

export default function PolicySliders() {
  const { publicKey } = useWallet();
  const { policy, vaultExists, updatePolicy } = useMatka();

  const [maxPreipo, setMaxPreipo] = useState(20);
  const [maxSingleAsset, setMaxSingleAsset] = useState(25);
  const [minStableReserve, setMinStableReserve] = useState(20);
  const [allowXstocks, setAllowXstocks] = useState(true);
  const [allowPreipo, setAllowPreipo] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);

  // Sync sliders from on-chain policy when available
  useEffect(() => {
    if (policy) {
      const maxPre = (policy as any).maxPreipoExposureBps ?? policy.max_preipo_exposure_bps;
      const maxSingle = (policy as any).maxSingleAssetBps ?? policy.max_single_asset_bps;
      const minRes = (policy as any).minStableReserveBps ?? policy.min_stable_reserve_bps;
      const xstocks = (policy as any).allowXstocks ?? policy.allow_xstocks;
      const preipo = (policy as any).allowPreipo ?? policy.allow_preipo;

      if (typeof maxPre === "number") setMaxPreipo(bpsToPercent(maxPre));
      if (typeof maxSingle === "number") setMaxSingleAsset(bpsToPercent(maxSingle));
      if (typeof minRes === "number") setMinStableReserve(bpsToPercent(minRes));
      if (typeof xstocks === "boolean") setAllowXstocks(xstocks);
      if (typeof preipo === "boolean") setAllowPreipo(preipo);
    }
  }, [policy]);

  const handleUpdate = async () => {
    if (!publicKey || !vaultExists) return;
    setIsUpdating(true);
    setLastTx(null);
    try {
      const tx = await updatePolicy({
        max_preipo_exposure_bps: percentToBps(maxPreipo),
        max_single_asset_bps: percentToBps(maxSingleAsset),
        min_stable_reserve_bps: percentToBps(minStableReserve),
        allow_xstocks: allowXstocks,
        allow_preipo: allowPreipo,
      });
      setLastTx(tx);
    } catch (e: any) {
      alert(`❌ Error updating policy: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!publicKey || !vaultExists) {
    return (
      <div className="glass-card" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 12 }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Connect wallet & create vault to manage policies</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: "white", fontSize: 18, fontWeight: 600, margin: 0 }}>Agent Guardrails</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 4, margin: 0 }}>Smart Contract Enforced Policies</p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          style={{
            background: isUpdating ? "rgba(255,255,255,0.05)" : "white",
            color: isUpdating ? "rgba(255,255,255,0.3)" : "black",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: isUpdating ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {isUpdating ? "Updating..." : "Update Policy"}
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Max Pre-IPO Exposure */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500 }}>Max Pre-IPO Exposure</label>
            <span style={{ color: "#8b5cf6", fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>{maxPreipo}%</span>
          </div>
          <input type="range" min="0" max="50" step="1" value={maxPreipo} onChange={(e) => setMaxPreipo(Number(e.target.value))} className="purple" />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>Maximum vault % in PreStocks/Tessera tokens (SpaceX, OpenAI).</p>
        </div>

        {/* Max Single Asset */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500 }}>Max Single Asset</label>
            <span style={{ color: "#3b82f6", fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>{maxSingleAsset}%</span>
          </div>
          <input type="range" min="5" max="100" step="5" value={maxSingleAsset} onChange={(e) => setMaxSingleAsset(Number(e.target.value))} />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>Prevents agent from dumping everything into one stock.</p>
        </div>

        {/* Min Stable Reserve */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500 }}>Min Stable Reserve</label>
            <span style={{ color: "#10b981", fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>{minStableReserve}%</span>
          </div>
          <input type="range" min="0" max="80" step="5" value={minStableReserve} onChange={(e) => setMinStableReserve(Number(e.target.value))} className="green" />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>Minimum % held in USDC (earning Kamino yield).</p>
        </div>

        {/* Toggles */}
        <div style={{ display: "flex", gap: 12 }}>
          <div
            onClick={() => setAllowXstocks(!allowXstocks)}
            style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: allowXstocks ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${allowXstocks ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>xStocks</span>
            <span style={{ color: allowXstocks ? "#10b981" : "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 600 }}>{allowXstocks ? "ON" : "OFF"}</span>
          </div>
          <div
            onClick={() => setAllowPreipo(!allowPreipo)}
            style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: allowPreipo ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${allowPreipo ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Pre-IPO</span>
            <span style={{ color: allowPreipo ? "#10b981" : "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 600 }}>{allowPreipo ? "ON" : "OFF"}</span>
          </div>
        </div>
      </div>

      {/* Enforcement notice */}
      <div style={{ marginTop: 20, padding: "12px 14px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: 10 }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.6, margin: 0 }}>
          🔒 Enforced by <code style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace", fontSize: 11 }}>execute_trade</code>. The AI agent cannot violate these constraints, even if it tries.
        </p>
      </div>

      {lastTx && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8 }}>
          <p style={{ color: "#10b981", fontSize: 11, margin: 0, fontFamily: "monospace" }}>
            ✅ Policy updated! <a href={`https://explorer.solana.com/tx/${lastTx}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>View tx ↗</a>
          </p>
        </div>
      )}
    </div>
  );
}
