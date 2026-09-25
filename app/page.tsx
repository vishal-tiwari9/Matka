"use client";

import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import ClientWalletButton from "./components/ClientWalletButton";
import { useState, useEffect } from "react";

// ── Stock data with local images ──────────────────────────────────────
const STOCKS = [
  { symbol: "SPACEX",     name: "SpaceX",     img: "/stocks/spacex.png",      token: 118.83, mark: 147.18, val: "$1.93T", liq: "$112.3K", ch24: +3.13, disc: -19.26, supply: "12,400", desc: "Aerospace manufacturer & space transport company by Elon Musk." },
  { symbol: "ANTHROPIC",  name: "Anthropic",  img: "/stocks/anthropic.png",   token: 1051.81,mark: 1038.56,val: "$1.70T", liq: "$941.4K", ch24: +0.86, disc: +1.28,  supply: "7,382",  desc: "AI safety company behind Claude — the leading frontier model." },
  { symbol: "OPENAI",     name: "OpenAI",     img: "/stocks/openai.png",      token: 1324.27,mark: 1023.68,val: "$1.27T", liq: "$889.9K", ch24: -0.86, disc: +29.36, supply: "9,100",  desc: "Creator of GPT-4 & ChatGPT, the world's most used AI assistant." },
  { symbol: "ANDURIL",    name: "Anduril",    img: "/stocks/anduril.png",     token: 164.53, mark: 153.34, val: "$135.7B",liq: "$455.1K", ch24: +9.87, disc: +7.30,  supply: "3,200",  desc: "Defense tech company building autonomous weapons systems." },
  { symbol: "NEURALINK",  name: "Neuralink",  img: "/stocks/neuralink.png",   token: 433.48, mark: 336.33, val: "$64.1B", liq: "$244.1K", ch24: +0.44, disc: +28.88, supply: "2,800",  desc: "Brain-computer interface company by Elon Musk." },
  { symbol: "FIGUREAI",   name: "Figure AI",  img: "/stocks/figureai.png",    token: 170.06, mark: 180.56, val: "$39.4B", liq: "$97.1K",  ch24: -2.53, disc: -5.82,  supply: "1,900",  desc: "Humanoid robotics startup building general-purpose robots." },
  { symbol: "KALSHI",     name: "Kalshi",     img: "/stocks/kalshi.png",      token: 885.52, mark: 881.43, val: "$32.1B", liq: "$101.2K", ch24: +3.36, disc: +0.46,  supply: "1,200",  desc: "First regulated prediction market exchange in the US." },
  { symbol: "POLYMARKET", name: "Polymarket", img: "/stocks/polymarket.png",  token: 147.90, mark: 144.34, val: "$15.0B", liq: "$168.9K", ch24: +2.55, disc: +2.47,  supply: "4,600",  desc: "Decentralised prediction market for real-world events." },
];

// Mock volume chart data (sparkline)
function Sparkline({ up }: { up: boolean }) {
  const pts = Array.from({ length: 12 }, (_, i) => 20 + Math.random() * 60);
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const norm = pts.map(v => ((v - min) / (max - min)) * 40 + 10);
  const path = norm.map((y, i) => `${i === 0 ? "M" : "L"} ${(i / 11) * 180} ${50 - y}`).join(" ");
  return (
    <svg viewBox="0 0 180 60" style={{ width: "100%", height: 60 }}>
      <defs>
        <linearGradient id={`g${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={up ? "#22c55e" : "#ef4444"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 180 60 L 0 60 Z`} fill={`url(#g${up})`} />
      <path d={path} fill="none" stroke={up ? "#22c55e" : "#ef4444"} strokeWidth="2" />
    </svg>
  );
}

// Stock Detail Modal
function StockModal({ stock, onClose }: { stock: typeof STOCKS[0]; onClose: () => void }) {
  const isDisc = stock.disc < 0;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 20, padding: 40, maxWidth: 800, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Image src={stock.img} alt={stock.name} width={56} height={56} style={{ borderRadius: "50%", border: "2px solid #E5E7EB" }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>{stock.name}</div>
              <div style={{ color: "#9CA3AF", fontSize: 13, marginTop: 2 }}>
                {stock.symbol} · <a href="https://prestocks.com" target="_blank" rel="noreferrer" style={{ color: "#4F46E5" }}>prestocks.com</a> · <a href="#" style={{ color: "#4F46E5" }}>Trade on Jupiter ↗</a>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 18, color: "#6B7280" }}>×</button>
        </div>

        {/* Price Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32, marginBottom: 28, paddingBottom: 28, borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>Token price</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#111827" }}>${stock.token.toFixed(2)}</div>
            <div style={{ fontSize: 13, color: stock.ch24 >= 0 ? "#059669" : "#DC2626", fontWeight: 600, marginTop: 4 }}>
              {stock.ch24 >= 0 ? "+" : ""}{stock.ch24.toFixed(2)}% 24h
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>Mark price</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#111827" }}>${stock.mark.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>Premium / Discount</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: isDisc ? "#059669" : "#DC2626" }}>
              {isDisc ? "" : "+"}{stock.disc.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Mark valuation", value: stock.val },
            { label: "Implied valuation", value: stock.val },
            { label: "On-chain liquidity", value: stock.liq },
            { label: "Supply (tokenized)", value: stock.supply },
          ].map(s => (
            <div key={s.label} style={{ background: "#F9FAFB", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Daily volume (last 90 days)</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>USD traded per day, all venues</div>
            <Sparkline up={stock.disc < 0} />
          </div>
          <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Holders (weekly)</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>Unique holders on Solana</div>
            <Sparkline up={true} />
          </div>
        </div>

        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: 16, color: "#166534", fontSize: 14 }}>
          <strong>What is {stock.name}?</strong> {stock.desc} These tokens are backed by an SPV that holds real shares or contracts, tracked live on Solana via PreStocks.
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { connected } = useWallet();
  const [selectedStock, setSelectedStock] = useState<typeof STOCKS[0] | null>(null);
  const [tickOffset, setTickOffset] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTickOffset(p => p - 0.5), 30);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", color: "#111827", fontFamily: "'Inter', -apple-system, sans-serif", overflowX: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* ── Live ticker (sits right below the main navbar) ── */}
      <div style={{ background: "#111827", padding: "8px 0", overflow: "hidden", position: "sticky", top: 60, zIndex: 40 }}>
        <div style={{ display: "flex", transform: `translateX(${tickOffset % 900}px)`, transition: "none" }}>
          {[...STOCKS, ...STOCKS, ...STOCKS].map((s, i) => (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "0 24px", borderRight: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap", cursor: "pointer" }}
              onClick={() => setSelectedStock(s)}>
              <Image src={s.img} alt={s.name} width={18} height={18} style={{ borderRadius: "50%" }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: "white" }}>{s.symbol}x</span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>${s.token.toFixed(2)}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: s.disc < 0 ? "#4ade80" : "#f87171" }}>
                {s.disc > 0 ? "+" : ""}{s.disc.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, background: "#EEF2FF", border: "1px solid #C7D2FE", marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366F1" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#4338CA" }}>Live on Solana Devnet</span>
          </div>

          <h1 style={{ fontSize: "clamp(38px,4vw,56px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: -1.5, margin: "0 0 20px 0", color: "#0F172A" }}>
            Buy tokenized<br />pre-IPO stocks —<br /><span style={{ color: "#6366F1" }}>autonomously.</span>
          </h1>

          <p style={{ fontSize: 17, color: "#6B7280", lineHeight: 1.65, marginBottom: 36, maxWidth: 460 }}>
            SpaceX, Anthropic, OpenAI — now tradeable on Solana. Matka agents spot price gaps and buy automatically when conditions match your rules.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/home" style={{ background: "#6366F1", color: "white", padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
              Start Trading →
            </Link>
            <a href="#markets" style={{ background: "white", color: "#374151", border: "1px solid #E5E7EB", padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              See Markets ↓
            </a>
          </div>
        </div>

        {/* Problem vs Solution card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 700, color: "#991B1B", marginBottom: 8, fontSize: 15 }}>😤 The Problem</div>
            <p style={{ color: "#7F1D1D", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              OPENAI token trades at <strong>+29% premium</strong> on DEX while its real valuation says $1,023. SPACEX trades at <strong>−19% discount</strong>. 
              These gaps close — but only if you're watching 24/7.
            </p>
          </div>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 700, color: "#166534", marginBottom: 8, fontSize: 15 }}>✅ The Matka Solution</div>
            <p style={{ color: "#14532D", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Create a vault, set rules (<em>"buy when discount &gt; 15%"</em>), and your ClawPump agent monitors markets 24/7 — buying automatically when conditions hit, enforced on-chain by the smart contract.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[["Kamino Yield", "Idle USDC earns APY"], ["Jupiter Swaps", "Best price execution"], ["On-chain Rules", "Enforced by Anchor"]].map(([t, d]) => (
              <div key={t} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", marginBottom: 4 }}>{t}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PreStocks Cards Section ── */}
      <section id="markets" style={{ background: "#F1F5F9", padding: "80px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#6366F1", textTransform: "uppercase", marginBottom: 10 }}>PreStocks Universe</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, margin: 0, color: "#0F172A" }}>Pre-IPO market, live on Solana</h2>
            <p style={{ color: "#6B7280", marginTop: 10, fontSize: 15 }}>Token price vs mark price. Discount = price below fair value = buy opportunity for your agent. Click any card for full detail.</p>
          </div>

          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 36 }}>
            {[["Tokens tracked", "8"], ["Combined mark valuation", "$5.19T"], ["On-chain liquidity", "$3.0M"], ["Avg premium to mark", "+5.58%"]].map(([l, v]) => (
              <div key={l} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginBottom: 6 }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
            {STOCKS.map(s => {
              const isDisc = s.disc < 0;
              return (
                <div key={s.symbol}
                  onClick={() => setSelectedStock(s)}
                  style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.18s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                  onMouseOver={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseOut={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Image src={s.img} alt={s.name} width={36} height={36} style={{ borderRadius: "50%", border: "1px solid #E5E7EB" }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.symbol}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: isDisc ? "#ECFDF5" : "#FEF2F2", color: isDisc ? "#065F46" : "#991B1B", whiteSpace: "nowrap" }}>
                      {isDisc ? `${s.disc.toFixed(2)}% disc` : `+${s.disc.toFixed(2)}% prem`}
                    </span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 14 }}>${s.token.toFixed(2)}</div>
                  <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                    {[["Mark price", `$${s.mark.toFixed(2)}`], ["Valuation", s.val], ["24h", `${s.ch24 >= 0 ? "+" : ""}${s.ch24.toFixed(2)}%`], ["Liquidity", s.liq]].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#9CA3AF" }}>{l}</span>
                        <span style={{ fontWeight: 600, color: l === "24h" ? (s.ch24 >= 0 ? "#059669" : "#DC2626") : "#374151" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, margin: "0 0 12px 0", color: "#0F172A" }}>How it works</h2>
          <p style={{ color: "#6B7280", fontSize: 16 }}>Four steps from deposit to autonomous trading</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
          {[
            { n: "1", title: "Deposit USDC", desc: "Fund your Matka Vault. Idle USDC earns Kamino yield while you wait." },
            { n: "2", title: "Create an Agent", desc: "Name your agent, set a strategy (discount threshold, max trade size, cooldown)." },
            { n: "3", title: "Agent Monitors 24/7", desc: "ClawPump polls PreStocks API & Pyth oracle. When discount hits your rule — it acts." },
            { n: "4", title: "Jupiter Executes", desc: "Trade is verified on-chain by the smart contract, then swapped via Jupiter V6." },
          ].map(s => (
            <div key={s.n} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
              <div style={{ width: 36, height: 36, background: "#EEF2FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#4F46E5", fontSize: 16, marginBottom: 16 }}>{s.n}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#4F46E5", margin: "0 40px 80px", borderRadius: 24, padding: "60px 48px", textAlign: "center", maxWidth: 1120, marginLeft: "auto", marginRight: "auto" }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: "white", margin: "0 0 16px 0" }}>Ready to trade autonomously?</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, marginBottom: 32 }}>Connect wallet → Claim free devnet USDC → Create your agent</p>
        <Link href="/home" style={{ background: "white", color: "#4F46E5", padding: "16px 40px", borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: "none", display: "inline-block", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          Launch Matka →
        </Link>
      </section>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "28px 48px", textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>
        Matka Protocol · Solana Devnet · Program: HZWTgCyrcrhttgf3mQuMnKpf8E8RVnzjP1Yb3zm9dfNS
      </footer>

      {/* ── Stock Detail Modal ── */}
      {selectedStock && <StockModal stock={selectedStock} onClose={() => setSelectedStock(null)} />}
    </div>
  );
}
