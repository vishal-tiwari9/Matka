"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ClientWalletButton from "../../components/ClientWalletButton";

export default function AgentDetailPage() {
  const { connected } = useWallet();
  const params = useParams();
  const vaultId = params.id;

  const [agent, setAgent] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vaultId) return;
    Promise.all([
      fetch(`/api/agent-configs?vaultId=${vaultId}`).then(r => r.json()),
      fetch(`/api/trades?vaultId=${vaultId}`).then(r => r.json())
    ]).then(([agentData, tradeData]) => {
      // Find the specific agent if it returns an array
      if (agentData.configs) {
        const found = agentData.configs.find((c: any) => c.vaultId === Number(vaultId));
        setAgent(found || null);
      } else {
        setAgent(agentData.config || null);
      }
      setTrades(tradeData.trades || []);
    }).catch(e => console.error(e)).finally(() => setLoading(false));
  }, [vaultId]);

  if (!connected) return (
    <div style={{ padding: 32, textAlign: 'center', marginTop: 80 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Connect Wallet</h2>
      <ClientWalletButton />
    </div>
  );

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Loading agent...</div>;
  if (!agent) return <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Agent not found.</div>;

  // Calculate Holdings & Mock P&L Calculation based on buys
  const holdings: Record<string, number> = {};
  let buyVolume = 0;
  
  trades.forEach(t => {
    if (t.type === 'BUY') {
      buyVolume += (t.amountUSDC || 0); // Using new fields
      holdings[t.symbol] = (holdings[t.symbol] || 0) + (t.tokensReceived || 0);
    }
  });
  
  const mockPnL = buyVolume > 0 ? (buyVolume * 0.045) : 0; // Fake 4.5% profit on deployed capital for visuals
  const hasHoldings = Object.keys(holdings).length > 0;

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, borderBottom: '1px solid #E5E7EB', paddingBottom: 16 }}>
        <div>
          <Link href="/home" style={{ color: '#6B7280', fontSize: 14, textDecoration: 'none' }}>← Back to Dashboard</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>{agent.agentName}</h1>
            <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
              ⚡ Powered by ClawPump
            </span>
            <span style={{ background: agent.status === 'active' ? '#D1FAE5' : '#FEE2E2', color: agent.status === 'active' ? '#065F46' : '#991B1B', padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700 }}>
              {agent.status === 'active' ? '● ACTIVE' : 'PAUSED'}
            </span>
          </div>
        </div>
        <ClientWalletButton />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Capital (USDC)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 4 }}>${agent.capitalUSDC?.toFixed(2)}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Strategy</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#6366F1', marginTop: 4 }}>{agent.strategy}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Buy Threshold</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 4 }}>{agent.discountThreshold}%</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Total P&L</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>+${mockPnL.toFixed(2)}</div>
        </div>
      </div>

      {hasHoldings && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Agent Token Holdings</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(holdings).map(([symbol, amount]) => (
              <div key={symbol} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontWeight: 800, color: '#111827' }}>{symbol}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{amount.toFixed(2)} tokens</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 16 }}>Activity Feed</h2>
      
      {trades.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 40, textAlign: 'center', color: '#6B7280' }}>
          No activity yet. The agent is monitoring the market.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trades.map((t, idx) => (
            <div key={idx} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {t.type === 'BUY' && <div style={{ background: '#D1FAE5', color: '#065F46', padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>BUY</div>}
                {t.type === 'SKIP' && <div style={{ background: '#F3F4F6', color: '#374151', padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>SKIP</div>}
                {t.type === 'DECLINED' && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>DECLINE</div>}
                
                <div>
                  <div style={{ fontWeight: 800, color: '#111827' }}>{t.symbol}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    {t.type === 'BUY' && `Bought ${t.tokensReceived?.toFixed(2) || 0} at $${t.tokenPrice?.toFixed(2) || 0} (-${t.discountPct?.toFixed(2) || 0}%)`}
                    {t.type === 'SKIP' && `Skipped due to ${t.reason}`}
                    {t.type === 'DECLINED' && (t.reason || `Discount ${t.discountPct?.toFixed(2)}% < Threshold`)}
                  </div>
                  
                  {t.type === 'BUY' && t.jupiterRoute && (
                    <div style={{ marginTop: 8, fontSize: 11, background: '#F9FAFB', padding: '6px 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #E5E7EB' }}>
                      <span style={{ color: '#047857', fontWeight: 700 }}>Routed via {t.jupiterRoute.provider}</span>
                      <span style={{ color: '#9CA3AF' }}>•</span>
                      <span style={{ color: '#4B5563' }}>Min out: {t.jupiterRoute.minOut.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {t.type === 'BUY' && t.txHash && (
                <a href={`https://solscan.io/tx/${t.txHash}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: '#6366F1', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                  View Tx ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
