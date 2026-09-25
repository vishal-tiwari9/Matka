"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import ClientWalletButton from "./components/ClientWalletButton";

export default function LandingPage() {
  const { connected } = useWallet();

  return (
    <div style={{ minHeight: "100vh", color: "white", overflowX: "hidden" }}>
      {/* ── Navigation Bar ──────────────────────────────────── */}
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 48px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(8, 8, 16, 0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            boxShadow: "0 0 20px rgba(59,130,246,0.6)",
          }} />
          <div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Matka Protocol</span>
          
          </div>
        </div>

        {/* Center Links */}
       
        {/* Right CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <ClientWalletButton />
          <Link
            href="/home"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "white",
              padding: "9px 20px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 15px rgba(59,130,246,0.4)",
              transition: "transform 0.15s ease",
            }}
          >
            {connected ? "Launch Terminal →" : "Open App →"}
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────── */}
      <section style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "100px 24px 80px 24px",
        textAlign: "center",
        position: "relative",
      }}>
        {/* Glow backdrop */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 350,
          background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(139,92,246,0.15) 50%, transparent 80%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 100,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            marginBottom: 24,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} className="pulse-green" />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,0.9)" }}>
              PRIMARY TRACK: INVESTING → ROBO-PORTFOLIOS ($100,000)
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            margin: "0 auto 24px auto",
            maxWidth: 950,
          }}>
            The Missing Trading Layer for{" "}
            <span style={{
              background: "linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Tokenized Stocks & Pre-IPO Equities
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "rgba(255,255,255,0.6)",
            maxWidth: 760,
            margin: "0 auto 40px auto",
            lineHeight: 1.6,
          }}>
            Deposit once. Earn automatic Kamino lending yield on idle USDC. Your autonomous ClawPump agent executes arbitrage and rebalancing across TSLAx, AAPLx, and SPACEXx under strictly enforced smart contract guardrails.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            <Link
              href="/home"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "white",
                padding: "16px 36px",
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 6px 25px rgba(59,130,246,0.5)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              ⚡ Launch Trading Terminal
            </Link>
            <a
              href="#how-it-works"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "16px 32px",
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              How It Works ↓
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            marginTop: 70,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 24,
            backdropFilter: "blur(12px)",
          }}>
            {[
              { val: "8.4% APY", label: "Automated Idle Yield", sub: "Kamino JIT Integration" },
              { val: "≤ 20%", label: "Pre-IPO Exposure Cap", sub: "PreStocks Bounty Rule" },
              { val: "Dual Mark", label: "Oracle Pricing Engine", sub: "Pyth Pro Confidence Bounds" },
              { val: "$25,000+", label: "Meteora Reserve Floor", sub: "DBC Slippage Protection" },
            ].map((m, i) => (
              <div key={i} style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none", padding: "0 12px" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#60a5fa" }}>{m.val}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginTop: 4 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem Statement Section ───────────────────────── */}
      <section id="problem" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>The Real Problem</span>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.5, marginTop: 8 }}>
            Tokenized Stocks are Growing Fast. But the Tooling is Broken.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: 640, margin: "12px auto 0 auto", fontSize: 15 }}>
            Traders jump between fragmented charts, DEXs, and order forms. Capital sits idle without yield. And there are zero guardrails against agent liquidation.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            {
              icon: "📉",
              title: "2021-Era Memecoin Interfaces",
              desc: "After launching a token against TSLAx or AAPLx, traders get no single-screen professional terminal, no visual trailing stop-loss, and zero portfolio analytics.",
            },
            {
              icon: "💸",
              title: "Capital Inefficiency & Zero Idle Yield",
              desc: "Funds parked waiting for good stock entry points sit 100% idle earning 0%. In traditional finance and modern DeFi, cash reserves must generate compounding yield.",
            },
            {
              icon: "🤖",
              title: "Rogue AI Agent Risk",
              desc: "Delegating trading to autonomous bots without on-chain invariant enforcement invites catastrophic drain, MEV front-running, and over-allocation into illiquid assets.",
            },
          ].map((c, i) => (
            <div key={i} className="glass-card" style={{ padding: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{c.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px 0" }}>{c.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sponsor Tracks Bento Grid ───────────────────────── */}
      <section id="tracks" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <span style={{ color: "#3b82f6", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Strategic Sponsor Matrix</span>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.5, marginTop: 8 }}>
            Built Cleanly Across 3 Core Sponsor Bounties
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {/* Track 1: Pyth Pro */}
          <div className="glass-card" style={{ padding: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 20, right: 20, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 100, padding: "2px 10px", fontSize: 11, color: "#c084fc", fontWeight: 600 }}>
              Pyth Pro Track
            </div>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🔮</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>Pyth Dual-Feed Pricing</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Mark-to-market valuations powered by Pyth Hermes. Trades are automatically rejected if oracle age exceeds 60 seconds or confidence intervals (±σ) widen beyond safe parameters.
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, paddingLeft: 16, margin: 0, lineHeight: 1.7 }}>
              <li>Stale-quote rejection engine</li>
              <li>Dual-feed confidence interval checking</li>
              <li>Tracking error anomaly detection</li>
            </ul>
          </div>

          {/* Track 2: PreStocks */}
          <div className="glass-card" style={{ padding: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 20, right: 20, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 100, padding: "2px 10px", fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>
              $10,000 Bounty
            </div>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🚀</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>PreStocks Universe</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Autonomous allocation into unlisted private tech giants (SPACEXx, OPENAIx, STRIPEx). Macro asset class policies cap total Pre-IPO allocation at 20% on-chain.
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, paddingLeft: 16, margin: 0, lineHeight: 1.7 }}>
              <li>Hardcoded ≤20% Pre-IPO Smart Contract Cap</li>
              <li>Tessera 409A NAV cross-attestation</li>
              <li>Automated discount signal discovery</li>
            </ul>
          </div>

          {/* Track 3: Meteora DBC */}
          <div className="glass-card" style={{ padding: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 20, right: 20, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 100, padding: "2px 10px", fontSize: 11, color: "#34d399", fontWeight: 600 }}>
              $5,000 Bounty
            </div>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🌊</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>Meteora DBC Liquidity</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Dynamic Bonding Curve (DBC) verification. Swaps only execute when pool reserve depth exceeds the $25,000 safety floor, preventing predatory price slippage.
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, paddingLeft: 16, margin: 0, lineHeight: 1.7 }}>
              <li>$25,000 reserve depth verification floor</li>
              <li>Dynamic fee monitoring via Jupiter V6</li>
              <li>Bidirectional market manipulation shield</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── How It Works Flow ───────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <span style={{ color: "#10b981", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>End-To-End Lifecycle</span>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.5, marginTop: 8 }}>
            How Matka Operates Autonomously
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { step: "01", title: "Initialize Vault", desc: "User connects Backpack/Phantom and configures their initial risk sliders (Max Pre-IPO, Single Asset Cap)." },
            { step: "02", title: "Instant Kamino Yield", desc: "USDC deposits are 100% deployed to Kamino lending pools, generating ~8.4% APY every single block." },
            { step: "03", title: "Agent Signal Scan", desc: "ClawPump agent monitors Pyth dual feeds and PreStocks orderbooks for arbitrage and undervalued discounts." },
            { step: "04", title: "Atomic JIT Execution", desc: "Funds unwind just-in-time from Kamino, swap via Jupiter/Meteora, and enforce smart contract invariant checks." },
          ].map((item, i) => (
            <div key={i} className="glass-card" style={{ padding: 24, position: "relative" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "rgba(255,255,255,0.1)", marginBottom: 8 }}>{item.step}</div>
              <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px 0" }}>{item.title}</h4>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────── */}
      <section style={{ maxWidth: 900, margin: "40px auto 100px auto", textAlign: "center", padding: "0 24px" }}>
        <div className="glass-card" style={{ padding: "60px 40px", background: "linear-gradient(180deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.05) 100%)" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 16px 0" }}>Ready to Experience Autonomous Stock Trading?</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, maxWidth: 550, margin: "0 auto 32px auto" }}>
            Open the terminal, configure your custom robo-vault, and monitor the live AI agent thoughts stream in real time.
          </p>
          <Link
            href="/home"
            style={{
              background: "white",
              color: "black",
              padding: "16px 36px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 10px 30px rgba(255,255,255,0.2)",
              display: "inline-block",
            }}
          >
            Launch Matka Terminal →
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 48px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
        Matka Protocol · Built on Solana for the Global Hackathon · Deployed Program: HZWTgCyrcrhttgf3mQuMnKpf8E8RVnzjP1Yb3zm9dfNS
      </footer>
    </div>
  );
}
