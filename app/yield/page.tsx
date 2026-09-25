"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useMatka } from "../lib/useMatka";
import { getVaultBalance, getDeployedToYield } from "../lib/program";
import ClientWalletButton from "../components/ClientWalletButton";

export default function YieldPage() {
  const { connected } = useWallet();
  const mainVault = useMatka(0);

  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!connected) {
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Connect Wallet</h2>
        <ClientWalletButton />
      </div>
    );
  }

  const totalDeposited = getVaultBalance(mainVault.vault);
  const deployedToYield = getDeployedToYield(mainVault.vault);
  const mockApy = 8.4;
  const mockEarned = deployedToYield * (mockApy / 100) * (15 / 365); // ~15 days

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return alert("Enter a valid amount");
    if (amt > totalDeposited) return alert(`Insufficient funds. Main vault has $${totalDeposited.toFixed(2)}`);
    try {
      setIsDepositing(true);
      const tx = await mainVault.deposit(amt);
      setTxHash(tx);
      setDepositAmount("");
    } catch (e: any) {
      alert("Deposit failed: " + e.message);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("Withdraw all yield positions back to Main Vault?")) return;
    try {
      setIsWithdrawing(true);
      const tx = await mainVault.withdraw();
      setTxHash(tx);
    } catch (e: any) {
      alert("Withdraw failed: " + e.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
        <div>
          <Link href="/home" className="text-gray-500 text-sm hover:text-gray-900 font-medium">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold mt-1 text-gray-900">Kamino Yield</h1>
        </div>
        <ClientWalletButton />
      </div>

      {mainVault.loading && <p className="text-gray-500">Loading vault...</p>}

      {!mainVault.vaultExists && !mainVault.loading && (
        <div className="text-center p-8 border border-gray-200 rounded-xl bg-white shadow-sm">
          <p className="text-gray-500 mb-4">No Main Vault found.</p>
          <Link href="/home" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold">Create Vault →</Link>
        </div>
      )}

      {mainVault.vaultExists && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white shadow-sm border border-gray-200 p-5 rounded-xl">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1 font-bold">Deployed to Yield</div>
              <div className="text-2xl font-bold text-gray-900">${deployedToYield.toFixed(2)}</div>
              <div className="text-emerald-600 text-xs mt-1 font-semibold">via Kamino Lending</div>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 p-5 rounded-xl">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1 font-bold">Current APY</div>
              <div className="text-2xl font-bold text-emerald-600">{mockApy}%</div>
              <div className="text-gray-500 text-xs mt-1 font-medium">USDC Lending Pool</div>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 p-5 rounded-xl">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1 font-bold">Est. Yield Earned</div>
              <div className="text-2xl font-bold text-emerald-600">+${mockEarned.toFixed(4)}</div>
              <div className="text-gray-500 text-xs mt-1 font-medium">~15 day estimate</div>
            </div>
          </div>

          {/* Deposit Form */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Add Funds to Kamino Yield</h2>
            <p className="text-gray-500 text-sm mb-4">
              Deposits are routed directly to the Kamino USDC lending pool. Funds earn yield
              every block and can be JIT-unwound by agents for trades.
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount (USDC)"
                  className="w-full bg-white border border-gray-300 rounded p-3 text-gray-900 outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  Main Vault balance: ${totalDeposited.toFixed(2)} USDC
                </p>
              </div>
              <button
                onClick={handleDeposit}
                disabled={isDepositing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                {isDepositing ? "Depositing..." : "Deposit"}
              </button>
            </div>
          </div>

          {/* Withdraw */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Withdraw from Yield</h2>
            <p className="text-gray-500 text-sm mb-4">
              Unwind all Kamino positions and return USDC to the Main Vault.
            </p>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || deployedToYield === 0}
              className="border border-gray-300 hover:border-red-500 text-gray-600 hover:text-red-600 px-6 py-2 rounded-lg font-bold disabled:opacity-40 transition-colors bg-white shadow-sm"
            >
              {isWithdrawing ? "Withdrawing..." : "Withdraw All → Main Vault"}
            </button>
          </div>

          {txHash && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
              <p className="text-emerald-700 font-bold mb-1">Transaction Confirmed ✓</p>
              <a
                href={`https://solscan.io/tx/${txHash}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 text-sm hover:underline font-mono break-all font-medium"
              >
                {txHash}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
