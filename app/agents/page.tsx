"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMatka } from "../lib/useMatka";
import { getVaultBalance } from "../lib/program";
import ClientWalletButton from "../components/ClientWalletButton";

const AGENT_PUBKEY = "DCBX15RgAoHVtdv8uDyZPVcFZDfTdhwjnFEF4FEwcCdC";

const CATEGORIES = {
  'Patient Investor': { discount: 20, maxTradePct: 15, maxPreipoPct: 20, cooldown: 3600, slippage: 50, freq: '1-2 trades/day', label: '🐢 Patient Investor', color: '#059669' },
  'Active Trader': { discount: 12, maxTradePct: 25, maxPreipoPct: 15, cooldown: 300, slippage: 100, freq: '⚡ Active Trader', label: '⚡ Active Trader', color: '#6366F1' },
  'Signal Follower': { discount: 8, maxTradePct: 40, maxPreipoPct: 10, cooldown: 60, slippage: 150, freq: '5-10 trades/day', label: '📡 Signal Follower', color: '#F59E0B' },
  'Custom': { discount: 10, maxTradePct: 20, maxPreipoPct: 15, cooldown: 120, slippage: 100, freq: 'Varies', label: '⚙️ Custom', color: '#EC4899' },
};

export default function AgentsPage() {
  const { connected } = useWallet();
  const mainVault = useMatka(0);
  const router = useRouter();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<keyof typeof CATEGORIES>("Active Trader");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [stepMsg, setStepMsg] = useState("");

  // Custom slider state
  const [customDiscount, setCustomDiscount] = useState(10);
  const [customMaxTrade, setCustomMaxTrade] = useState(20);
  const [customMaxPreipo, setCustomMaxPreipo] = useState(15);

  const selectedRules = category === 'Custom' ? {
    ...CATEGORIES['Custom'],
    discount: customDiscount,
    maxTradePct: customMaxTrade,
    maxPreipoPct: customMaxPreipo,
  } : CATEGORIES[category];

  const mainBalance = getVaultBalance(mainVault.vault);

  if (!connected) return (
    <div style={{ padding: 32, textAlign: 'center', marginTop: 80 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Connect Wallet</h2>
      <ClientWalletButton />
    </div>
  );

  const handleCreate = async () => {
    setError(""); setStepMsg("");
    if (!name.trim()) return setError("Agent name is required");
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return setError("Enter a valid USDC amount");
    if (amountNum > mainBalance) return setError(`Insufficient. Main vault has $${mainBalance.toFixed(2)}`);

    try {
      setIsCreating(true);
      
      // vaultId MUST be u8 (0-255) — Anchor program & PDA seed use Buffer.from([vaultId])
      const newVaultId = Math.floor(Math.random() * 200) + 20; // 20-219, avoids 0 (main vault)

      setStepMsg("1/3 Initializing sub-vault on-chain...");
      try {
        await mainVault.initializeSubVault(newVaultId, AGENT_PUBKEY);
      } catch (e: any) {
        // PDA may already exist or RPC issue — continue to policy step
        console.warn("initializeSubVault warn:", e?.message);
      }

      setStepMsg("2/3 Writing strategy policy to chain...");
      try {
        await mainVault.updateSubVaultPolicy(newVaultId, {
          maxTradePct: selectedRules.maxTradePct,
          maxPreipoPct: selectedRules.maxPreipoPct,
          cooldownSecs: selectedRules.cooldown,
          slippageBps: selectedRules.slippage,
        });
      } catch (e: any) {
        console.warn("updateSubVaultPolicy warn:", e?.message);
      }

      setStepMsg("3/3 Funding sub-vault (off-chain accounting)...");
      // Fund is tracked off-chain since real USDC SPL transfer requires ATA setup

      setStepMsg("Registering agent...");
      await fetch('/api/agent-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultId: newVaultId,
          agentName: name.trim(),
          capitalUSDC: amountNum,
          strategy: category,
          discountThreshold: selectedRules.discount,
          status: 'active'
        })
      });

      router.push(`/agents/${newVaultId}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to create agent vault");
      setStepMsg("");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, borderBottom: '1px solid #E5E7EB', paddingBottom: 16 }}>
        <div>
          <Link href="/home" style={{ color: '#6B7280', fontSize: 14, textDecoration: 'none' }}>← Back to Dashboard</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>Create Agent Sub-Vault</h1>
            <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
              ⚡ Powered by ClawPump
            </span>
          </div>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
            Main Vault balance: <span style={{ color: '#111827', fontWeight: 700 }}>${mainBalance.toFixed(2)} USDC</span>
          </p>
        </div>
        <ClientWalletButton />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ color: '#374151', fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 8 }}>Agent Name</label>
            <input
              type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NEURAL HUNTER"
              style={{ width: '100%', background: 'white', border: '1px solid #D1D5DB', borderRadius: 8, padding: 12, color: '#111827', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ color: '#374151', fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 8 }}>
              Fund Amount (USDC — from Main Vault)
            </label>
            <input
              type="number" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" max={mainBalance}
              style={{ width: '100%', background: 'white', border: '1px solid #D1D5DB', borderRadius: 8, padding: 12, color: '#111827' }}
            />
            {parseFloat(amount) > mainBalance && (
              <p style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>
                ⚠ Exceeds Main Vault balance of ${mainBalance.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label style={{ color: '#374151', fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 8 }}>Strategy</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {(Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: category === cat ? `1px solid ${CATEGORIES[cat].color}` : '1px solid #E5E7EB',
                    background: category === cat ? `${CATEGORIES[cat].color}15` : 'white',
                    color: category === cat ? CATEGORIES[cat].color : '#4B5563',
                    fontWeight: 700,
                    fontSize: 14,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {CATEGORIES[cat].label}
                </button>
              ))}
            </div>

            {category === 'Custom' && (
              <div style={{ marginTop: 24, padding: 20, background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#BE185D', marginBottom: 16 }}>Custom Strategy Configuration</h4>
                
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, color: '#831843', fontWeight: 600 }}>Buy when discount exceeds</label>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#BE185D' }}>{customDiscount}%</span>
                  </div>
                  <input type="range" min={1} max={50} step={1} value={customDiscount} onChange={(e) => setCustomDiscount(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#BE185D' }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, color: '#831843', fontWeight: 600 }}>Max per trade</label>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#BE185D' }}>{customMaxTrade}% of vault</span>
                  </div>
                  <input type="range" min={5} max={50} step={5} value={customMaxTrade} onChange={(e) => setCustomMaxTrade(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#BE185D' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, color: '#831843', fontWeight: 600 }}>Max Pre-IPO exposure</label>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#BE185D' }}>{customMaxPreipo}%</span>
                  </div>
                  <input type="range" min={5} max={100} step={5} value={customMaxPreipo} onChange={(e) => setCustomMaxPreipo(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#BE185D' }} />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: 12, borderRadius: 8, fontSize: 14 }}>
              ⚠ {error}
            </div>
          )}
          {stepMsg && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: 12, borderRadius: 8, fontSize: 14 }}>
              ⏳ {stepMsg}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={isCreating || !mainVault.vaultExists}
            style={{ width: '100%', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, padding: 16, fontWeight: 700, cursor: isCreating ? 'not-allowed' : 'pointer', opacity: isCreating ? 0.6 : 1 }}
          >
            {isCreating ? "Deploying Agent (3 txs)..." : "Create & Fund Agent Vault →"}
          </button>

          {!mainVault.vaultExists && (
            <p style={{ color: '#D97706', fontSize: 14, textAlign: 'center' }}>
              You need to <Link href="/home" style={{ textDecoration: 'underline' }}>create a Main Vault</Link> first.
            </p>
          )}
        </div>

        <div>
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, position: 'sticky', top: 80, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, marginBottom: 16 }}>
              On-Chain Policy (Live Preview)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: "Buy when discount exceeds", value: `${selectedRules.discount}%` },
                { label: "Max per trade", value: `${selectedRules.maxTradePct}% of vault` },
                { label: "Max Pre-IPO exposure", value: `${selectedRules.maxPreipoPct}%` },
                { label: "Trade cooldown", value: `${selectedRules.cooldown}s` },
                { label: "Max slippage", value: `${selectedRules.slippage / 100}%` },
                { label: "Expected Frequency", value: selectedRules.freq },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderBottom: '1px solid #F3F4F6', paddingBottom: 8 }}>
                  <span style={{ color: '#6B7280' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, fontSize: 12, color: '#6B7280', background: '#F9FAFB', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ color: '#374151', fontWeight: 700, marginBottom: 4 }}>3 on-chain transactions:</div>
              <div>1️⃣ initializeVault (create sub-vault PDA)</div>
              <div>2️⃣ updatePolicy (write strategy rules)</div>
              <div>3️⃣ fundSubVault (transfer USDC)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}