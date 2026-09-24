"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import ClientWalletButton from "../components/ClientWalletButton";
import AgentTerminal from "../components/AgentTerminal";
import PolicySliders from "../components/PolicySliders";

const VaultDashboard = dynamic(() => import("../components/VaultDashboard"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card" style={{ padding: 24, minHeight: 140, opacity: 0.4 }} />
      ))}
    </div>
  ),
});

export default function Dashboard() {
  const { publicKey } = useWallet();

  return (
    <main style={{ minHeight: "100vh", padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* ── Dashboard Header ─────────────────────────────────── */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                boxShadow: "0 0 16px rgba(59,130,246,0.5)",
              }} />
              <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
                Matka Terminal
              </h1>
            </div>
          </Link>
          <div style={{ height: 20, width: 1, background: "rgba(255,255,255,0.1)" }} />
          <span style={{
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.25)",
            color: "#60a5fa",
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 100,
          }}>
            Robo-Portfolio Active
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href="/"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            ← Back to Home
          </Link>
          {publicKey && (
            <a
              href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "monospace", textDecoration: "none" }}
            >
              {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)} ↗
            </a>
          )}
          <ClientWalletButton />
        </div>
      </header>

      {/* ── Top Metric Cards (AUM, Kamino Yield, Pre-IPO) ──── */}
      <section style={{ marginBottom: 20 }}>
        <VaultDashboard />
      </section>

      {/* ── Split Section: Policy Sliders (1/3) & Live Agent Terminal (2/3) ── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, height: 580 }}>
        <PolicySliders />
        <AgentTerminal />
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{ marginTop: 36, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, margin: 0 }}>
          Matka Protocol · Built for Solana Renaissance · Program:{" "}
          <a
            href="https://explorer.solana.com/address/HZWTgCyrcrhttgf3mQuMnKpf8E8RVnzjP1Yb3zm9dfNS?cluster=devnet"
            target="_blank"
            rel="noreferrer"
            style={{ color: "rgba(59,130,246,0.6)", textDecoration: "none" }}
          >
            HZWTgC...9dfNS ↗
          </a>
        </p>
      </footer>
    </main>
  );
}
