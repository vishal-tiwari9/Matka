"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { usePreStocks } from "../lib/usePreStocks";
import ClientWalletButton from "../components/ClientWalletButton";

export default function MeteoraPage() {
  const { connected } = useWallet();
  const { marketData } = usePreStocks();

  const [selectedToken, setSelectedToken] = useState(marketData[0]?.mint ?? "");
  const [usdcAmount, setUsdcAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const token = marketData.find((t) => t.mint === selectedToken);

  if (!connected) {
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
        <ClientWalletButton />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!usdcAmount || !tokenAmount || !minPrice || !maxPrice) {
      return alert("Please fill in all fields");
    }
    if (parseFloat(minPrice) >= parseFloat(maxPrice)) {
      return alert("Max price must be greater than Min price");
    }
    try {
      setIsSubmitting(true);
      // [STUB] In production: CPI to Meteora DLMM program to add liquidity
      await new Promise((r) => setTimeout(r, 1500));
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <Link href="/home" className="text-gray-500 text-sm hover:text-white">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold mt-1">Meteora DLMM</h1>
          <p className="text-gray-500 text-sm mt-1">Provide manual concentrated liquidity for PreStocks pairs</p>
        </div>
        <ClientWalletButton />
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl space-y-5">
          <h2 className="text-xl font-bold">Add Liquidity</h2>

          <div>
            <label className="text-gray-400 text-sm block mb-2">Select PreStock Token</label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded p-3 text-white"
            >
              {marketData.map((t) => (
                <option key={t.mint} value={t.mint}>
                  {t.symbol} — {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-2">USDC Amount</label>
            <input
              type="number"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-black border border-gray-700 rounded p-3 text-white"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-2">
              Token Amount ({token?.symbol ?? "—"})
            </label>
            <input
              type="number"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              placeholder="0.000"
              className="w-full bg-black border border-gray-700 rounded p-3 text-white"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-2">Price Range (USDC per token)</label>
            <div className="flex gap-3">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-full bg-black border border-gray-700 rounded p-3 text-white"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-full bg-black border border-gray-700 rounded p-3 text-white"
              />
            </div>
            {token && (
              <p className="text-xs text-gray-500 mt-1">
                Current mark: ${token.markPrice.toFixed(2)} • DEX: ${token.tokenPrice?.toFixed(4) ?? "—"}
              </p>
            )}
          </div>

          {submitted ? (
            <div className="bg-green-900/20 border border-green-700 p-3 rounded-lg text-green-400 text-sm font-bold">
              ✓ Liquidity position submitted! You will earn fees when trades route through your range.
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Add Liquidity to Meteora"}
            </button>
          )}
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <h3 className="font-bold mb-3 text-gray-300">How Meteora DLMM Works</h3>
            <ul className="text-gray-400 text-sm space-y-3">
              <li className="flex gap-2">
                <span className="text-blue-400 mt-0.5">1.</span>
                <span>You deposit USDC + PreStock token into a concentrated liquidity range</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 mt-0.5">2.</span>
                <span>Every time someone swaps through your price range, you earn a % of fees</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 mt-0.5">3.</span>
                <span>Narrower price ranges = higher fee concentration but more rebalancing risk</span>
              </li>
            </ul>
          </div>

          {token && (
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
              <h3 className="font-bold mb-3 text-gray-300">{token.symbol} Info</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Mark Price</span><span className="text-white font-mono">${token.markPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>DEX Price</span><span className="text-white font-mono">${token.tokenPrice?.toFixed(4) ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium/Discount</span>
                  <span className={token.premium === null ? "text-gray-500" : (token.premium < 0 ? "text-green-400" : "text-red-400")}>
                    {token.premium === null ? "—" : `${token.premium.toFixed(2)}%`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mint</span>
                  <a href={`https://solscan.io/token/${token.mint}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-mono text-xs">
                    {token.mint.slice(0, 8)}...
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
