"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { usePreStocks } from "../lib/usePreStocks";
import ClientWalletButton from "../components/ClientWalletButton";

export default function MeteoraPage() {
  const { connected } = useWallet();
  const { marketData } = usePreStocks();

  const [usdcAmount, setUsdcAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agentHoldings, setAgentHoldings] = useState<{ symbol: string; amount: number }[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trades')
      .then(r => r.json())
      .then(d => {
        const trades = d.trades || [];
        const holdingsMap: Record<string, number> = {};
        trades.forEach((t: any) => {
          if (t.type === 'BUY') {
            holdingsMap[t.symbol] = (holdingsMap[t.symbol] || 0) + (t.tokensReceived || t.amount || 0);
          }
        });
        const arr = Object.entries(holdingsMap).map(([symbol, amount]) => ({ symbol, amount }));
        setAgentHoldings(arr);
        if (arr.length > 0) setSelectedSymbol(arr[0].symbol);
      }).catch(() => {});
  }, []);

  const selectedHolding = agentHoldings.find(h => h.symbol === selectedSymbol);
  const token = marketData.find(t => t.symbol === selectedSymbol);

  useEffect(() => {
    if (token) {
      setMinPrice((token.markPrice * 0.9).toFixed(2));
      setMaxPrice((token.markPrice * 1.1).toFixed(2));
      if (usdcAmount) setTokenAmount((parseFloat(usdcAmount) / token.markPrice).toFixed(4));
    }
  }, [selectedSymbol, token, usdcAmount]);

  if (!connected) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Connect Wallet</h2>
        <ClientWalletButton />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!usdcAmount || !tokenAmount || !minPrice || !maxPrice) return alert("Fill in all fields");
    if (parseFloat(minPrice) >= parseFloat(maxPrice)) return alert("Max price must be greater than Min price");
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const hasHoldings = agentHoldings.length > 0;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto", color: "#111827" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, borderBottom: "1px solid #E5E7EB", paddingBottom: 20 }}>
        <div>
          <Link href="/home" style={{ color: "#6B7280", fontSize: 13, textDecoration: "none" }}>← Back to Dashboard</Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Meteora DLMM</h1>
            <span style={{ background: "#DBEAFE", color: "#1D4ED8", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
              💧 Meteora DLMM
            </span>
          </div>
          <p style={{ color: "#6B7280", fontSize: 14, marginTop: 4 }}>Add your agent-acquired tokens as concentrated liquidity and earn trading fees</p>
        </div>
        <ClientWalletButton />
      </div>

      {/* Holdings Picker */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
          Tokens Available for Liquidity
        </h2>

        {!hasHoldings ? (
          <div style={{ background: "#FFFBEB", border: "1px dashed #FCD34D", borderRadius: 12, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            <div style={{ fontWeight: 700, color: "#92400E", fontSize: 16, marginBottom: 8 }}>No tokens acquired yet</div>
            <div style={{ color: "#B45309", fontSize: 14, marginBottom: 20 }}>
              Your agents haven't bought any PreStock tokens yet. Create an agent and let it run first.
            </div>
            <Link href="/agents" style={{ background: "#F59E0B", color: "white", padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              Create an Agent →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {agentHoldings.map(h => {
              const t = marketData.find(m => m.symbol === h.symbol);
              const selected = h.symbol === selectedSymbol;
              return (
                <button
                  key={h.symbol}
                  onClick={() => setSelectedSymbol(h.symbol)}
                  style={{ background: selected ? "#4F46E5" : "white", color: selected ? "white" : "#374151", border: `2px solid ${selected ? "#4F46E5" : "#E5E7EB"}`, borderRadius: 12, padding: "12px 20px", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}
                >
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{h.symbol}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{h.amount.toFixed(4)} tokens</div>
                  {t && <div style={{ fontSize: 12, opacity: 0.75 }}>Mark: ${t.markPrice.toFixed(2)}</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Form - only shown when token is selected */}
      {hasHoldings && selectedSymbol && token && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {/* Left: Form */}
          <div style={{ background: "white", border: "1px solid #E5E7EB", padding: 28, borderRadius: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, margin: "0 0 24px 0" }}>
              Add Liquidity — {selectedSymbol}/USDC
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                  USDC Amount
                </label>
                <input
                  type="number"
                  value={usdcAmount}
                  onChange={e => setUsdcAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 8, padding: "12px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                  {selectedSymbol} Amount (max: {selectedHolding?.amount.toFixed(4)})
                </label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={e => setTokenAmount(e.target.value)}
                  placeholder="0.0000"
                  max={selectedHolding?.amount}
                  style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 8, padding: "12px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                  Price Range (USDC per {selectedSymbol})
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min"
                    style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 8, padding: "12px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
                  <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max"
                    style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 8, padding: "12px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
                </div>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>
                  Mark: ${token.markPrice.toFixed(2)} • Auto-suggested ±10%
                </p>
              </div>

              {submitted ? (
                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", padding: 16, borderRadius: 10, color: "#065F46", fontWeight: 700, fontSize: 14 }}>
                  ✓ Liquidity position created! You'll earn fees as trades route through your range.
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{ background: "#4F46E5", color: "white", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? "Submitting..." : "Add Liquidity to Meteora"}
                </button>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "white", border: "1px solid #E5E7EB", padding: 24, borderRadius: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, margin: "0 0 16px 0" }}>How Meteora DLMM Works</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "1️⃣", text: "Deposit USDC + PreStock token into a concentrated range" },
                  { icon: "2️⃣", text: "Every swap through your range earns you a % fee" },
                  { icon: "3️⃣", text: "Narrower range = higher fee yield, more active management" },
                ].map(item => (
                  <div key={item.icon} style={{ display: "flex", gap: 12, fontSize: 14, color: "#374151" }}>
                    <span>{item.icon}</span><span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "white", border: "1px solid #E5E7EB", padding: 24, borderRadius: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, margin: "0 0 16px 0" }}>{token.name} Info</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Mark Price", value: `$${token.markPrice.toFixed(2)}` },
                  { label: "DEX Price", value: token.tokenPrice ? `$${token.tokenPrice.toFixed(4)}` : "—" },
                  { label: "Discount", value: token.discountPct > 0 ? `−${token.discountPct.toFixed(2)}%` : `+${Math.abs(token.discountPct).toFixed(2)}%` },
                  { label: "Volume 24h", value: `$${(token.volume24h / 1000).toFixed(0)}K` },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#9CA3AF" }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
