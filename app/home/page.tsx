"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useMatka } from "../lib/useMatka";
import ClientWalletButton from "../components/ClientWalletButton";

export default function HomePage() {
  const { connected, publicKey } = useWallet();
  const mainVault = useMatka(0); // Vault 0 is Main Vault
  const [isInitializing, setIsInitializing] = useState(false);

  // We load a mock list of agents from localStorage for now
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    // Load local storage agents
    try {
      const stored = localStorage.getItem("matka_agents");
      if (stored) {
        setAgents(JSON.parse(stored));
      }
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
      // Dummy agent pubkey for main vault since it doesn't trade itself
      const dummyAgent = "11111111111111111111111111111111"; 
      await mainVault.initializeVault(dummyAgent, false);
      alert("Main Vault Created successfully!");
    } catch (err: any) {
      alert("Failed to create vault: " + err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold">Matka Dashboard</h1>
        <ClientWalletButton />
      </div>

      {mainVault.loading && <p>Loading vault data...</p>}
      
      {!mainVault.loading && !mainVault.vaultExists && (
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to Matka Protocol</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            You don't have a Main Vault yet. Create your Main Vault (Matka Vault) to start depositing funds and deploying AI trading agents.
          </p>
          <button
            onClick={handleCreateMainVault}
            disabled={isInitializing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {isInitializing ? "Creating Vault..." : "Create Main Vault"}
          </button>
        </div>
      )}

      {!mainVault.loading && mainVault.vaultExists && mainVault.vault && (
        <div className="space-y-8">
          {/* Main Vault Stats */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-400">Main Vault Balance (USDC)</h2>
              <div className="text-4xl font-black mt-2">
                ${(mainVault.vault.total_deposited_usdc.toNumber() / 1_000_000).toFixed(2)}
              </div>
              <div className="text-sm text-green-400 mt-1">
                Deployed to Yield: ${(mainVault.vault.deployed_to_yield.toNumber() / 1_000_000).toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/yield" className="bg-blue-600 hover:bg-blue-700 text-center text-white px-6 py-2 rounded-lg font-bold">
                Add to Kamino Yield
              </Link>
              <button 
                onClick={async () => {
                  if (confirm("Are you sure you want to withdraw all funds and close positions?")) {
                     await mainVault.withdraw();
                  }
                }}
                className="border border-red-600 text-red-500 hover:bg-red-900/30 px-6 py-2 rounded-lg font-bold"
              >
                Liquidate Vault
              </button>
            </div>
          </div>

          {/* Sub Vaults */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Active Sub-Vaults (Agents)</h2>
              <Link href="/agents" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-bold">
                + Create Sub-Vault
              </Link>
            </div>

            {agents.length === 0 ? (
              <div className="text-center p-8 border border-gray-800 border-dashed rounded-xl text-gray-500">
                No active sub-vaults. Create one to start autonomous trading!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent, i) => (
                  <Link href={`/agents/${agent.id}`} key={i} className="block">
                    <div className="bg-gray-900 border border-gray-800 hover:border-blue-500 p-5 rounded-xl transition-all cursor-pointer">
                      <div className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-wider">{agent.category}</div>
                      <h3 className="text-lg font-bold mb-4">{agent.name}</h3>
                      <div className="text-gray-400 text-sm">Vault ID: {agent.id}</div>
                      <div className="mt-4 text-right text-blue-500 text-sm font-bold">View Details →</div>
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
