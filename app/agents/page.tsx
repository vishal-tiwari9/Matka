"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { usePreStocks } from "../lib/usePreStocks";
import { useMatka } from "../lib/useMatka";
import ClientWalletButton from "../components/ClientWalletButton";

// ClawPump agent public key — your single agent key
const AGENT_PUBKEY = "11111111111111111111111111111111"; // Replace with your real ClawPump wallet pubkey

const CATEGORIES = {
  "Patient Investor": {
    discount: 20, max_trade_pct: 15, max_preipo_pct: 20,
    cooldown: 3600, slippage: 50, description: "Low frequency, only buys at deep discounts >20%"
  },
  "Active Trader": {
    discount: 12, max_trade_pct: 25, max_preipo_pct: 15,
    cooldown: 300, slippage: 100, description: "Medium frequency, buys at 12%+ discount"
  },
  "Signal Follower": {
    discount: 8, max_trade_pct: 40, max_preipo_pct: 10,
    cooldown: 60, slippage: 150, description: "High frequency, follows signals aggressively"
  },
};

export default function AgentsPage() {
  const { connected } = useWallet();
  const mainVault = useMatka(0);
  const { marketData } = usePreStocks();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<keyof typeof CATEGORIES>("Active Trader");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const selectedRules = CATEGORIES[category];
  const mainBalance = mainVault.vault
    ? mainVault.vault.total_deposited_usdc.toNumber() / 1_000_000
    : 0;

  if (!connected) return (
    <div className="p-8 text-center mt-20">
      <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
      <ClientWalletButton />
    </div>
  );

  const handleCreate = async () => {
    setError("");
    if (!name.trim()) return setError("Agent name is required");
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return setError("Enter a valid amount");
    if (amountNum > mainBalance) return setError(`Insufficient. Main vault only has $${mainBalance.toFixed(2)}`);

    try {
      setIsCreating(true);

      const stored = localStorage.getItem("matka_agents");
      const agents = stored ? JSON.parse(stored) : [];
      const newVaultId = agents.length + 1;

      // Step 1: Initialize the sub-vault on-chain
      // We call mainVault.initializeVault with vaultId but useMatka(0) doesn't know about the new vault.
      // The correct pattern is to call the program directly via the provider:
      // For hackathon: we save metadata and the chain calls happen via the page-level hook.
      // Full on-chain flow requires instantiating useMatka(newVaultId) dynamically — handled via fundSubVault.

      const newAgent = {
        id: newVaultId,
        name: name.trim(),
        amount: amountNum,
        category,
        rules: {
          discount: selectedRules.discount,
          max_trade: selectedRules.max_trade_pct,
          max_preipo: selectedRules.max_preipo_pct,
          cooldown: selectedRules.cooldown,
          slippage: selectedRules.slippage,
        },
        createdAt: Date.now(),
        // fundSubVault will be called by the dedicated agent page
        status: "active",
      };

      localStorage.setItem("matka_agents", JSON.stringify([...agents, newAgent]));

      // Trigger fund transfer from main vault to sub-vault
      await mainVault.fundSubVault(newVaultId, amountNum);

      window.location.href = `/agents/${newVaultId}`;
    } catch (e: any) {
      setError(e.message ?? "Failed to create agent vault");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <Link href="/home" className="text-gray-500 text-sm hover:text-white">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold mt-1">Create Agent Sub-Vault</h1>
          <p className="text-gray-500 text-sm mt-1">
            Main Vault balance: <span className="text-white font-bold">${mainBalance.toFixed(2)} USDC</span>
          </p>
        </div>
        <ClientWalletButton />
      </div>

      <div className="grid grid-cols-5 gap-8">
        {/* Form — 3 cols */}
        <div className="col-span-3 space-y-5">
          <div>
            <label className="text-gray-400 text-sm font-bold block mb-2">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NEURAL HUNTER"
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white uppercase tracking-widest font-bold"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-bold block mb-2">
              Fund Amount (USDC — from Main Vault)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              max={mainBalance}
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white"
            />
            {parseFloat(amount) > mainBalance && (
              <p className="text-red-500 text-xs mt-1">⚠ Exceeds Main Vault balance of ${mainBalance.toFixed(2)}</p>
            )}
          </div>

          <div>
            <label className="text-gray-400 text-sm font-bold block mb-2">Strategy</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat as keyof typeof CATEGORIES)}
                  className={`p-3 rounded-lg border text-sm font-bold transition-all text-left ${
                    category === cat
                      ? "border-blue-500 bg-blue-900/30 text-blue-300"
                      : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 p-3 rounded-lg text-sm">
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={isCreating || !mainVault.vaultExists}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-4 rounded-lg transition-colors"
          >
            {isCreating ? "Deploying Agent..." : "Create & Fund Agent Vault →"}
          </button>

          {!mainVault.vaultExists && (
            <p className="text-yellow-600 text-sm text-center">
              You need to <Link href="/home" className="underline">create a Main Vault</Link> first.
            </p>
          )}
        </div>

        {/* Rules Preview — 2 cols */}
        <div className="col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sticky top-20">
            <h3 className="font-bold text-blue-400 uppercase tracking-wider text-xs mb-4">On-Chain Policy</h3>
            <div className="space-y-3">
              {[
                { label: "Buy when discount exceeds", value: `${selectedRules.discount}%` },
                { label: "Max per trade", value: `${selectedRules.max_trade_pct}% of vault` },
                { label: "Max Pre-IPO exposure", value: `${selectedRules.max_preipo_pct}%` },
                { label: "Trade cooldown", value: `${selectedRules.cooldown}s` },
                { label: "Max slippage", value: `${selectedRules.slippage / 100}%` },
                { label: "Tokens to watch", value: `All ${marketData.length}` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm border-b border-gray-800 pb-2">
                  <span className="text-gray-400">{row.label}</span>
                  <span className="font-bold text-white">{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-4">{selectedRules.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
