"use client";
import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useMatka } from "../lib/useMatka";
import { getVaultBalance, getDeployedToYield, getCurrentPreipo } from "../lib/program";
import ClientWalletButton from "../components/ClientWalletButton";

export default function HomePage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const mainVault = useMatka(0);
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [solBalance, setSolBalance] = useState(0);
  const [matkaBalance, setMatkaBalance] = useState(0); // from faucet grants
  const [agents, setAgents] = useState<any[]>([]);
  const [txFeedback, setTxFeedback] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  // Fetch SOL balance
  useEffect(() => {
    if (!publicKey || !connection) return;
    connection.getBalance(publicKey).then(b => setSolBalance(b / 1e9));
  }, [publicKey, connection, mainVault.vault]);

  // Fetch MATKA-USDC balance from faucet API
  useEffect(() => {
    if (!publicKey) return;
    fetch(`/api/faucet?wallet=${publicKey.toBase58()}`)
      .then(r => r.json())
      .then(d => setMatkaBalance(d.claimed ? d.amount : 0))
      .catch(() => {});
  }, [publicKey]);

  // Load agents from API
  useEffect(() => {
    fetch('/api/agent-configs')
      .then(r => r.json())
      .then(d => setAgents(d.configs || []))
      .catch(() => {});
  }, [mainVault.vaultExists]);

  const handleClaimFaucet = async () => {
    if (!publicKey) return;
    setIsClaiming(true);
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (data.success) {
        setMatkaBalance(data.amount);
        setTxFeedback('✅ Claimed 50,000 MATKA-USDC!');
      } else {
        setTxFeedback(data.message || 'Already claimed');
      }
    } catch (e: any) {
      setTxFeedback('Faucet error: ' + e.message);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCreateVault = async () => {
    setIsCreatingVault(true);
    setTxFeedback('');
    try {
      const AGENT_PUBKEY = "DCBX15RgAoHVtdv8uDyZPVcFZDfTdhwjnFEF4FEwcCdC";
      const tx = await mainVault.initializeVault(AGENT_PUBKEY, false);
      setTxFeedback('✅ Main Vault created! Tx: ' + tx.slice(0, 20) + '...');
      setShowVaultModal(false);
    } catch (e: any) {
      setTxFeedback('❌ ' + e.message);
    } finally {
      setIsCreatingVault(false);
    }
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return setTxFeedback('Enter a valid amount');
    if (amt > matkaBalance) return setTxFeedback(`Insufficient MATKA-USDC. You have ${matkaBalance.toLocaleString()}`);
    setIsDepositing(true);
    setTxFeedback('');
    try {
      const tx = await mainVault.deposit(amt);
      setMatkaBalance(prev => prev - amt);
      setTxFeedback('✅ Deposited ' + amt + ' USDC! Tx: ' + tx.slice(0, 20) + '...');
      setShowDepositModal(false);
      setDepositAmount('');
    } catch (e: any) {
      setTxFeedback('❌ ' + e.message);
    } finally {
      setIsDepositing(false);
    }
  };

  if (!connected) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Connect Your Wallet</h1>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>Connect a Solana wallet to access your Matka trading vaults</p>
          <ClientWalletButton />
        </div>
      </div>
    );
  }

  const balance = getVaultBalance(mainVault.vault);
  const yieldBalance = getDeployedToYield(mainVault.vault);
  const preipoBalance = getCurrentPreipo(mainVault.vault);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>Matka Dashboard</h1>
        <p style={{ color: '#6B7280', marginTop: 4 }}>Your AI trading vault for tokenized pre-IPO stocks</p>
      </div>

      {txFeedback && (
        <div style={{ background: txFeedback.startsWith('✅') ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${txFeedback.startsWith('✅') ? '#A7F3D0' : '#FECACA'}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: txFeedback.startsWith('✅') ? '#065F46' : '#991B1B', fontSize: 14 }}>
          {txFeedback}
        </div>
      )}

      {/* Main Vault Card */}
      {mainVault.loading ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 32, border: '1px solid #E5E7EB', marginBottom: 24, textAlign: 'center', color: '#9CA3AF' }}>Loading vault...</div>
      ) : !mainVault.vaultExists ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 40, border: '1px solid #E5E7EB', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Create Your Matka Vault</h2>
          <p style={{ color: '#6B7280', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>Your Main Vault holds USDC and funds your AI trading agents. Create it once — it lives on Solana forever.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {matkaBalance === 0 && (
              <button onClick={handleClaimFaucet} disabled={isClaiming} style={{ background: '#F59E0B', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                {isClaiming ? 'Claiming...' : '🚰 Claim 50k MATKA-USDC'}
              </button>
            )}
            <button onClick={handleCreateVault} disabled={isCreatingVault} style={{ background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              {isCreatingVault ? 'Creating...' : '+ Create Main Vault'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Main Vault (Matka Vault)</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#111827', marginTop: 4 }}>${balance.toFixed(2)}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>MATKA-USDC Balance</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <button onClick={() => setShowDepositModal(true)} style={{ background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ Deposit USDC</button>
              <Link href="/agents" style={{ background: '#111827', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>+ Create Agent</Link>
              <button onClick={() => mainVault.liquidateVault && mainVault.liquidateVault()} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>🛑 Emergency Stop</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '16px 24px', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>In Yield (Kamino)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#059669', marginTop: 2 }}>${yieldBalance.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>In Pre-IPO Trades</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#6366F1', marginTop: 2 }}>${preipoBalance.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>SOL Balance</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#F59E0B', marginTop: 2 }}>{solBalance.toFixed(4)} SOL</div>
            </div>
          </div>
        </div>
      )}

      {/* Agents Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Active Agents (Sub-Vaults)</h2>
        <Link href="/agents" style={{ background: '#6366F1', color: 'white', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ New Agent</Link>
      </div>

      {agents.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: 40, textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', marginBottom: 16 }}>No active agents yet. Create one to start autonomous trading!</p>
          <Link href="/agents" style={{ background: '#6366F1', color: 'white', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Create First Agent →</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {agents.map((agent) => (
            <Link key={agent.vaultId} href={`/agents/${agent.vaultId}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20, cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{agent.agentName}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{agent.strategy}</div>
                  </div>
                  <span style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>● Active</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' }}>Capital</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>${agent.capitalUSDC?.toFixed(0) ?? '0'}</div>
                  </div>
                  <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' }}>Buy at</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#6366F1' }}>{agent.discountThreshold}% disc.</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid #E5E7EB', paddingTop: 10 }}>
                  <span style={{ color: '#4F46E5', fontWeight: 700 }}>⚡ Powered by ClawPump</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDepositModal(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 420, boxShadow: '0 25px 80px rgba(0,0,0,0.2)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDepositModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Deposit MATKA-USDC</h2>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>Fund your Main Vault with MATKA-USDC. Your wallet balance: <strong>{matkaBalance.toLocaleString()} USDC</strong></p>
            <input
              type="number"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="Amount (USDC)"
              style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: 8, padding: '12px 14px', fontSize: 16, outline: 'none', marginBottom: 12 }}
            />
            {parseFloat(depositAmount) > matkaBalance && (
              <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>⚠ Insufficient balance. You have {matkaBalance.toLocaleString()} USDC</div>
            )}
            {matkaBalance === 0 && (
              <button onClick={handleClaimFaucet} disabled={isClaiming} style={{ width: '100%', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginBottom: 12 }}>
                {isClaiming ? 'Claiming...' : '🚰 Claim 50,000 Free MATKA-USDC First'}
              </button>
            )}
            <button
              onClick={handleDeposit}
              disabled={isDepositing || !depositAmount}
              style={{ width: '100%', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, padding: '12px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}
            >
              {isDepositing ? 'Depositing...' : 'Deposit →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}