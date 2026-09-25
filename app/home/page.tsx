"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useMatka } from "../lib/useMatka";
import { getVaultBalance, getDeployedToYield } from "../lib/program";
import ClientWalletButton from "../components/ClientWalletButton";

export default function HomePage() {
  const { connected } = useWallet();
  const mainVault = useMatka(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("matka_agents");
      if (stored) setAgents(JSON.parse(stored));
    } catch (e) {}
  }, []);

  if (!connected) {
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
        <ClientWalletButton />
      </div>
    );
  }

  const handleCreateMainVault = async () => {
    try {
      setIsInitializing(true);
      const dummyAgent = "11111111111111111111111111111111";
      await mainVault.initializeVault(dummyAgent, false);
      alert("✅ Main Vault created successfully!");
    } catch (err: any) {
      alert("Failed to create vault: " + err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // Use safe helpers — Anchor v0.30+ returns camelCase fields.
  // Accessing vault.total_deposited_usdc (snake_case) returns undefined → TypeError.
  const mainBalance = getVaultBalance(mainVault.vault);
  const yieldBalance = getDeployedToYield(mainVault.vault);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold">Matka Dashboard</h1>
        <ClientWalletButton />
      </div>

      {mainVault.loading && (
        <p className="text-gray-400 text-center py-10">Loading vault data...</p>
      )}

      {/* Only show unexpected errors, not "vault not found" (that's normal for new users) */}
      {mainVault.error && !mainVault.error.includes("Account not found") && (
        <div className="bg-red-900/20 border border-red-700 text-red-400 p-4 rounded-xl mb-6 text-sm">
          ⚠ {mainVault.error}
          <button onClick={mainVault.refresh} className="ml-4 underline hover:text-red-300">
            Retry
          </button>
        </div>
      )}

      {!mainVault.loading && !mainVault.vaultExists && (
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl text-center">
          <div className="text-5xl mb-4">🏦</div>
          <h2 className="text-2xl font-bold mb-4">Welcome to Matka Protocol</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            You don&apos;t have a Main Vault yet. Create your Matka Vault to start
            depositing funds and deploying AI trading agents.
          </p>
          <button
            onClick={handleCreateMainVault}
            disabled={isInitializing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50"
          >
            {isInitializing ? "Creating Vault..." : "✨ Create Main Vault"}
          </button>
        </div>
      )}

      {!mainVault.loading && mainVault.vaultExists && (
        <div className="space-y-8">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Main Vault Balance (USDC)
              </h2>
              <div className="text-4xl font-black mt-2">${mainBalance.toFixed(2)}</div>
              <div className="text-sm text-green-400 mt-1">
                Deployed to Yield: ${yieldBalance.toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  const raw = prompt("Deposit amount in USDC:");
                  const amt = parseFloat(raw ?? "0");
                  if (amt > 0) {
                    try {
                      await mainVault.deposit(amt);
                      alert(`✅ Deposited $${amt} USDC`);
                    } catch (e: any) {
                      alert("Deposit failed: " + e.message);
                    }
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white text-center px-6 py-2 rounded-lg font-bold"
              >
                + Deposit USDC
              </button>
              <Link
                href="/agents"
                className="bg-blue-600 hover:bg-blue-700 text-center text-white px-6 py-2 rounded-lg font-bold"
              >
                + Create Agent
              </Link>
              <button
                onClick={async () => {
                  if (confirm("Withdraw all funds and close vault?")) {
                    try {
                      await mainVault.withdraw();
                      alert("✅ Vault liquidated.");
                    } catch (e: any) {
                      alert("Withdraw failed: " + e.message);
                    }
                  }
                }}
                className="border border-red-600 text-red-500 hover:bg-red-900/30 px-6 py-2 rounded-lg font-bold"
              >
                Liquidate Vault
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Active Agents (Sub-Vaults)</h2>
              <Link
                href="/agents"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-bold"
              >
                + New Agent
              </Link>
            </div>

            {agents.length === 0 ? (
              <div className="text-center p-8 border border-gray-800 border-dashed rounded-xl text-gray-500">
                No active agents yet. Create one to start autonomous trading!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent, i) => (
                  <Link href={`/agents/${agent.id}`} key={i} className="block">
                    <div className="bg-gray-900 border border-gray-800 hover:border-blue-500 p-5 rounded-xl transition-all cursor-pointer">
                      <div className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-wider">
                        {agent.category}
                      </div>
                      <h3 className="text-lg font-bold mb-2">{agent.name}</h3>
                      <div className="text-gray-400 text-sm">
                        Capital: ${agent.amount.toFixed(2)} USDC
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-400 text-xs font-bold">Active</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}