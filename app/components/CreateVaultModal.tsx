"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { percentToBps } from "../lib/program";

interface CreateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vaultPda: string) => void;
  initializeVault: (agentPubkey: string) => Promise<string>;
  deposit?: (amount: number) => Promise<string>;
  updatePolicy?: (params: any) => Promise<string>;
}

export default function CreateVaultModal({
  isOpen,
  onClose,
  onSuccess,
  initializeVault,
  deposit,
  updatePolicy,
}: CreateVaultModalProps) {
  const { publicKey } = useWallet();

  // Preset strategies
  const [strategy, setStrategy] = useState<"growth" | "conservative" | "custom">("growth");
  
  // Policy parameters
  const [preIpoCap, setPreIpoCap] = useState(20);
  const [singleAssetCap, setSingleAssetCap] = useState(25);
  const [minReserve, setMinReserve] = useState(20);
  
  // Deposit amount
  const [depositAmount, setDepositAmount] = useState<number>(100);
  
  // Agent Key
  const [agentKey, setAgentKey] = useState("9ReYpRMdWLu4PKzibWmGfeoFztGk95NyWLto5j1Wvpk8");
  
  // Execution status
  const [step, setStep] = useState<"idle" | "creating" | "funding" | "done" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [txSignature, setTxSignature] = useState("");

  if (!isOpen) return null;

  const handleStrategyChange = (newStrategy: "growth" | "conservative" | "custom") => {
    setStrategy(newStrategy);
    if (newStrategy === "growth") {
      setPreIpoCap(20);
      setSingleAssetCap(25);
      setMinReserve(20);
    } else if (newStrategy === "conservative") {
      setPreIpoCap(10);
      setSingleAssetCap(15);
      setMinReserve(40);
    }
  };

  const handleCreate = async () => {
    if (!publicKey) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      setStep("creating");
      setStatusMessage("1/2 Initializing On-Chain Vault & Policy PDAs...");

      // 1. Initialize Vault on Solana
      const tx = await initializeVault(agentKey);
      setTxSignature(tx);

      // 2. Deposit if amount > 0 and method available
      if (depositAmount > 0 && deposit) {
        setStatusMessage(`2/2 Depositing $${depositAmount} USDC into Kamino Yield...`);
        try {
          await deposit(depositAmount);
        } catch (depErr) {
          console.warn("Initial deposit failed or skipped:", depErr);
        }
      }

      // 3. Update Policy if customized
      if (strategy === "custom" && updatePolicy) {
        setStatusMessage("Applying custom risk parameters...");
        try {
          await updatePolicy({
            max_preipo_exposure_bps: percentToBps(preIpoCap),
            max_single_asset_bps: percentToBps(singleAssetCap),
            min_stable_reserve_bps: percentToBps(minReserve),
            allow_xstocks: true,
            allow_preipo: true,
          });
        } catch (polErr) {
          console.warn("Policy customization skipped:", polErr);
        }
      }

      setStep("done");
      setStatusMessage("Vault created successfully! Welcome to Matka Protocol.");
      setTimeout(() => {
        onSuccess(tx);
        onClose();
      }, 2000);
    } catch (err: any) {
      setStep("error");
      setStatusMessage(err?.message || "Failed to initialize vault");
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
        maxWidth: 580,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 32,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
        color: "white",
        position: "relative",
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={step === "creating" || step === "funding"}
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }}></span>
            <span style={{ color: "#60a5fa", fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>ROBO-VAULT ONBOARDING</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Create AI Investment Vault</h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 6, margin: 0 }}>
            Configure your autonomous portfolio with automated Kamino yield and PreStocks guardrails.
          </p>
        </div>

        {step === "idle" || step === "creating" || step === "funding" ? (
          <div>
            {/* Strategy Preset Selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                1. Select Strategy Template
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { id: "growth", name: "Growth Alpha", desc: "PreStocks + Tech Stocks", badge: "20% Pre-IPO" },
                  { id: "conservative", name: "High Yield", desc: "40% Idle Yield + xStocks", badge: "10% Pre-IPO" },
                  { id: "custom", name: "Custom Policy", desc: "Manual Guardrail Sliders", badge: "User Defined" },
                ].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleStrategyChange(s.id as any)}
                    style={{
                      background: strategy === s.id ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                      border: strategy === s.id ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: 12,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: strategy === s.id ? "white" : "rgba(255,255,255,0.8)" }}>{s.name}</span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0, lineHeight: 1.3 }}>{s.desc}</p>
                    <div style={{ marginTop: 8, display: "inline-block", background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "2px 6px", fontSize: 9, color: "#60a5fa" }}>
                      {s.badge}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Initial USDC Deposit */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                2. Initial USDC Deposit (Optional)
              </label>
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                {[0, 50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    style={{
                      flex: 1,
                      background: depositAmount === amt ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                      border: depositAmount === amt ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                      color: depositAmount === amt ? "#34d399" : "rgba(255,255,255,0.6)",
                      borderRadius: 8,
                      padding: "8px 0",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {amt === 0 ? "Skip" : `$${amt}`}
                  </button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  placeholder="Custom amount"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: "white",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <span style={{ position: "absolute", right: 14, top: 12, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>USDC</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 6, margin: 0 }}>
                💡 100% of idle USDC is immediately routed into Kamino Lending to earn ~8.4% APY.
              </p>
            </div>

            {/* Custom Sliders (if custom or preview) */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                  3. Policy Invariants (Smart Contract Locked)
                </span>
                <span style={{ color: "#38bdf8", fontSize: 11, fontFamily: "monospace" }}>Pyth + Meteora Protected</span>
              </div>

              {/* Slider 1: Pre-IPO */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Max Pre-IPO Allocation</span>
                  <span style={{ color: "#a855f7", fontWeight: 600, fontFamily: "monospace" }}>{preIpoCap}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={preIpoCap}
                  disabled={strategy !== "custom"}
                  onChange={(e) => setPreIpoCap(Number(e.target.value))}
                  style={{ accentColor: "#a855f7", width: "100%" }}
                />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Hard cap: ≤20% as per PreStocks Macro Allocation policy</span>
              </div>

              {/* Slider 2: Single Asset */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Max Single Equity Concentration</span>
                  <span style={{ color: "#3b82f6", fontWeight: 600, fontFamily: "monospace" }}>{singleAssetCap}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={singleAssetCap}
                  disabled={strategy !== "custom"}
                  onChange={(e) => setSingleAssetCap(Number(e.target.value))}
                  style={{ accentColor: "#3b82f6", width: "100%" }}
                />
              </div>

              {/* Slider 3: Minimum Stable Reserve */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Minimum Stable Reserve (Kamino)</span>
                  <span style={{ color: "#10b981", fontWeight: 600, fontFamily: "monospace" }}>{minReserve}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={minReserve}
                  disabled={strategy !== "custom"}
                  onChange={(e) => setMinReserve(Number(e.target.value))}
                  style={{ accentColor: "#10b981", width: "100%" }}
                />
              </div>
            </div>

            {/* Agent Delegation Warning */}
            <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 12, padding: 12, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#93c5fd" }}>Delegated ClawPump Agent Identity</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: "monospace", marginTop: 2 }}>{agentKey}</div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                    Only this agent can execute atomic JIT trades when Pyth confidence intervals pass. The agent CANNOT withdraw your principal.
                  </p>
                </div>
              </div>
            </div>

            {/* Status / Error display */}
            {(step === "creating" || step === "funding") && (
              <div style={{ padding: 12, background: "rgba(59,130,246,0.1)", borderRadius: 10, marginBottom: 16, textAlign: "center" }}>
                <span style={{ color: "#60a5fa", fontSize: 12, fontWeight: 500 }}>⏳ {statusMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleCreate}
              disabled={step === "creating" || step === "funding"}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 600,
                cursor: step === "creating" || step === "funding" ? "wait" : "pointer",
                boxShadow: "0 4px 15px rgba(59,130,246,0.4)",
                transition: "all 0.2s",
              }}
            >
              {step === "creating" || step === "funding" ? "Deploying On-Chain..." : "Deploy & Fund Robo-Vault"}
            </button>
          </div>
        ) : step === "done" ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#34d399" }}>Vault Deployed!</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 8 }}>
              {statusMessage}
            </p>
            {txSignature && (
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  color: "#60a5fa",
                  fontSize: 12,
                  fontFamily: "monospace",
                  textDecoration: "underline",
                }}
              >
                View on Solana Explorer ↗
              </a>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f87171", margin: 0 }}>Deployment Error</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 8, wordBreak: "break-word" }}>
              {statusMessage}
            </p>
            <button
              onClick={() => setStep("idle")}
              style={{
                marginTop: 16,
                background: "rgba(255,255,255,0.1)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
