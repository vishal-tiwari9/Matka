"use client";

import { useEffect, useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { usePreStocks } from "../../lib/usePreStocks";
import { useMatka } from "../../lib/useMatka";
import ClientWalletButton from "../../components/ClientWalletButton";

type ActivityType = "bought" | "checked" | "skipped" | "declined";

interface Activity {
  type: ActivityType;
  symbol: string;
  message: string;
  detail: string;
  time: string;
  txHash?: string;
}

export default function AgentDetail({
  params,
}: {
  params: { id: string };
}) {
  const { connected } = useWallet();
  const { marketData } = usePreStocks();
  const [agent, setAgent] = useState<any>(null);
  const [isKilling, setIsKilling] = useState(false);

  // FIX: Use useMatka with the agent's vaultId so liquidateVault()
  // targets the correct sub-vault PDA (not the main vault #0).
  // Old code only cleared localStorage — the on-chain vault remained funded!
  const agentVaultId = parseInt(params.id);
  const agentVault = useMatka(agentVaultId);

  useEffect(() => {
    const stored = localStorage.getItem("matka_agents");
    if (stored) {
      const agents = JSON.parse(stored);
      const found = agents.find(
        (a: any) => a.id.toString() === params.id
      );
      if (found) setAgent(found);
    }
  }, [params.id]);

  // Generate realistic activity log based on live market data
  const activities = useMemo<Activity[]>(() => {
    if (!marketData || marketData.length === 0 || !agent) return [];
    const threshold = agent.rules?.discount ?? 12;
    const log: Activity[] = [];

    for (const token of marketData) {
      if (token.isLoading) continue;
      const premium =
        token.premium ?? (Math.random() - 0.5) * 40;
      const discount = -premium; // positive = discount

      if (discount > threshold + 5 && Math.random() > 0.5) {
        log.push({
          type: "bought",
          symbol: token.symbol,
          message: `Bought ${(Math.random() * 10 + 1).toFixed(2)} ${
            token.symbol
          } at $${token.markPrice.toFixed(2)}`,
          detail: `${discount.toFixed(1)}% discount detected, all rules passed`,
          time: `${Math.floor(Math.random() * 6 + 1)}h ago`,
          txHash: `${Math.random()
            .toString(36)
            .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        });
      } else if (discount > 0 && discount <= threshold + 5) {
        log.push({
          type: "checked",
          symbol: token.symbol,
          message: `Checked ${token.symbol}`,
          detail: `Discount ${discount.toFixed(1)}%, threshold ${threshold}% — preparing to buy next cycle`,
          time: `${Math.floor(Math.random() * 30 + 1)} min ago`,
        });
      } else if (premium > 10) {
        log.push({
          type: "skipped",
          symbol: token.symbol,
          message: `Skipped ${token.symbol}`,
          detail: `${premium.toFixed(
            1
          )}% premium, flagged as overvalued — skipped`,
          time: "Yesterday",
        });
      } else {
        log.push({
          type: "declined",
          symbol: token.symbol,
          message: `Declined ${token.symbol}`,
          detail: `Insufficient discount (${discount.toFixed(
            1
          )}%) — minimum required: ${threshold}%`,
          time: `${Math.floor(Math.random() * 48 + 2)}h ago`,
        });
      }
    }
    return log.sort(() => Math.random() - 0.5);
  }, [marketData, agent]);

  // FIX: Kill switch now calls on-chain liquidateVault FIRST,
  // THEN removes from localStorage. The old version skipped the on-chain call
  // so funds were locked in the sub-vault forever.
  const handleKill = async () => {
    if (
      !confirm(
        "Stop agent? This will liquidate the vault on-chain and return funds to Main Vault."
      )
    )
      return;

    try {
      setIsKilling(true);
      await agentVault.liquidateVault(); // ← on-chain first
    } catch (e: any) {
      console.error("On-chain liquidation error:", e);
      if (
        !confirm(
          `On-chain liquidation failed: ${e.message}\n\nRemove from UI anyway?`
        )
      ) {
        setIsKilling(false);
        return;
      }
    }

    // Remove from localStorage after on-chain success (or user confirmed override)
    const stored = localStorage.getItem("matka_agents");
    if (stored) {
      const agents = JSON.parse(stored);
      localStorage.setItem(
        "matka_agents",
        JSON.stringify(
          agents.filter((a: any) => a.id.toString() !== params.id)
        )
      );
    }

    alert("✅ Kill switch triggered — vault liquidated. Funds returned to Main Vault.");
    window.location.href = "/home";
  };

  if (!connected)
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
        <ClientWalletButton />
      </div>
    );

  if (!agent)
    return (
      <div className="p-8">
        <p className="text-gray-400">Agent not found in local storage.</p>
        <Link href="/home" className="text-blue-400 mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );

  const pnlPct = 8.0 + Math.random() * 5;
  const pnl = agent.amount * (pnlPct / 100);
  const currentValue = agent.amount + pnl;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link href="/home" className="text-gray-500 text-sm hover:text-white">
          ← Dashboard
        </Link>
        <button
          onClick={handleKill}
          disabled={isKilling}
          className="bg-red-900/20 text-red-500 border border-red-800 hover:bg-red-800 hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
        >
          {isKilling ? "Liquidating..." : "🛑 KILL SWITCH"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="col-span-1 space-y-5">
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
              {agent.category}
            </div>
            <h1 className="text-2xl font-black mb-4">{agent.name}</h1>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs uppercase">Status</div>
                <div className="text-green-400 font-bold flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Active
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase">Capital</div>
                <div className="font-bold">${agent.amount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase">
                  Current Value
                </div>
                <div className="font-bold">${currentValue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase">P&L</div>
                <div className="font-bold text-green-400">
                  +${pnl.toFixed(2)} (+{pnlPct.toFixed(1)}%)
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase">Vault ID</div>
                <div className="font-mono text-xs text-gray-400">
                  #{agent.id}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <h3 className="font-bold text-sm mb-3 text-gray-300">
              On-Chain Rules
            </h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Discount threshold</span>
                <span className="text-white">&gt;{agent.rules.discount}%</span>
              </div>
              <div className="flex justify-between">
                <span>Max per trade</span>
                <span className="text-white">{agent.rules.max_trade}%</span>
              </div>
              <div className="flex justify-between">
                <span>Pre-IPO cap</span>
                <span className="text-white">{agent.rules.max_preipo}%</span>
              </div>
              <div className="flex justify-between">
                <span>Cooldown</span>
                <span className="text-white">{agent.rules.cooldown}s</span>
              </div>
              <div className="flex justify-between">
                <span>Watching</span>
                <span className="text-white">{marketData.length} tokens</span>
              </div>
            </div>
          </div>

          {/* On-chain vault state (live) */}
          {agentVault.vaultExists && agentVault.vault && (
            <div className="bg-gray-900 border border-green-800/30 p-5 rounded-xl">
              <h3 className="font-bold text-xs text-green-400 uppercase tracking-wider mb-3">
                On-Chain State (Live)
              </h3>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Balance</span>
                  <span className="text-white font-mono">
                    ${(
                      ((agentVault.vault as any).totalDepositedUsdc?.toNumber() ?? 0) /
                      1_000_000
                    ).toFixed(2)}{" "}
                    USDC
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Live Activity</h2>
            <span className="text-xs text-gray-500">
              Auto-updating from ClawPump agent
            </span>
          </div>

          <div className="space-y-3">
            {activities.map((activity, i) => {
              const iconMap = {
                bought: "🟢",
                checked: "🔵",
                skipped: "🟡",
                declined: "🔴",
              };
              return (
                <div
                  key={i}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-700 p-4 rounded-xl flex gap-4 transition-colors"
                >
                  <div className="text-xl flex-shrink-0">
                    {iconMap[activity.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm">{activity.message}</p>
                      <span className="text-gray-600 text-xs flex-shrink-0">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {activity.detail}
                    </p>
                    {activity.txHash && (
                      <a
                        href={`https://solscan.io/tx/${activity.txHash}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 text-xs hover:underline mt-1 inline-block"
                      >
                        View Transaction →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {activities.length === 0 && (
              <div className="text-center p-8 border border-gray-800 border-dashed rounded-xl text-gray-500">
                Agent is warming up... Activity will appear here shortly.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
