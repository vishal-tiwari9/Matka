"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import ClientWalletButton from "./ClientWalletButton";

const NAV_LINKS = [
  { href: '/home', label: 'Dashboard' },
  { href: '/markets', label: 'Markets' },
  { href: '/yield', label: 'Yield' },
  { href: '/agents', label: 'Agents' },
  { href: '/meteora', label: 'Meteora LP' },
];

export default function ClientNavbar() {
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const [faucetStatus, setFaucetStatus] = useState<'idle'|'loading'|'done'|'error'>('idle');

  const handleFaucet = async () => {
    if (!publicKey) return alert('Connect your wallet first!');
    setFaucetStatus('loading');
    try {
      const res = await fetch('/api/faucet', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }) 
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFaucetStatus('done');
        setTimeout(() => setFaucetStatus('idle'), 3000);
      } else {
        setFaucetStatus('error');
        setTimeout(() => setFaucetStatus('idle'), 3000);
      }
    } catch (e) {
      setFaucetStatus('error');
      setTimeout(() => setFaucetStatus('idle'), 3000);
    }
  };
  return (
    <nav style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 18, color: '#6366F1', letterSpacing: '-0.5px', textDecoration: 'none' }}>MATKA</Link>
        <div style={{ display: 'flex', gap: 4 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                color: pathname === href ? '#6366F1' : '#374151',
                background: pathname === href ? '#EEF2FF' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button 
          onClick={handleFaucet}
          disabled={faucetStatus === 'loading' || faucetStatus === 'done'}
          style={{ 
            background: faucetStatus === 'done' ? '#D1FAE5' : faucetStatus === 'error' ? '#FEE2E2' : '#EEF2FF', 
            border: '1px solid', 
            borderColor: faucetStatus === 'done' ? '#A7F3D0' : faucetStatus === 'error' ? '#FCA5A5' : '#C7D2FE', 
            borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, 
            color: faucetStatus === 'done' ? '#065F46' : faucetStatus === 'error' ? '#991B1B' : '#4338CA', 
            cursor: faucetStatus === 'loading' ? 'wait' : 'pointer', transition: 'all 0.15s',
            whiteSpace: 'nowrap'
          }}
        >
          {faucetStatus === 'loading' ? '⏳ Minting...' : faucetStatus === 'done' ? '✅ 50k USDC Minted!' : faucetStatus === 'error' ? '❌ Error' : '🚰 Get 50k USDC'}
        </button>
        <ClientWalletButton />
      </div>
    </nav>
  );
}
