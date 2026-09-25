"use client";

import { usePreStocks } from "../lib/usePreStocks";
import Link from "next/link";

export default function MarketsPage() {
  const { marketData } = usePreStocks();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold">PreStocks Markets</h1>
          <p className="text-gray-500 text-sm mt-1">9 live pre-IPO tokens • prices from Jupiter Price API</p>
        </div>
        <Link href="/home" className="text-blue-400 hover:text-blue-300 text-sm">← Dashboard</Link>
      </div>

      {/* Market Table */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="text-left p-4 font-medium">Token</th>
              <th className="text-right p-4 font-medium">Sector</th>
              <th className="text-right p-4 font-medium">Mark Price</th>
              <th className="text-right p-4 font-medium">DEX Price</th>
              <th className="text-right p-4 font-medium">Premium / Discount</th>
              <th className="text-right p-4 font-medium">24h Change</th>
              <th className="text-right p-4 font-medium">Volume 24h</th>
              <th className="text-right p-4 font-medium">Mint</th>
            </tr>
          </thead>
          <tbody>
            {marketData.map((token, i) => {
              const isDiscount = (token.premium ?? 0) < 0;
              const premiumAbs = Math.abs(token.premium ?? 0).toFixed(2);
              return (
                <tr
                  key={token.mint}
                  className={`border-t border-gray-800 hover:bg-gray-900/50 transition-colors ${
                    i % 2 === 0 ? "bg-black" : "bg-gray-900/20"
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-900/60 border border-blue-700/40 flex items-center justify-center text-xs font-bold text-blue-300">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold">{token.symbol}</div>
                        <div className="text-gray-500 text-xs">{token.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-400 text-xs">{token.sector}</span>
                  </td>
                  <td className="p-4 text-right font-mono">
                    ${token.markPrice.toFixed(2)}
                  </td>
                  <td className="p-4 text-right font-mono">
                    {token.isLoading ? (
                      <span className="text-gray-600">Loading...</span>
                    ) : (
                      `$${token.tokenPrice?.toFixed(4) ?? "—"}`
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {token.premium === null ? (
                      <span className="text-gray-600">—</span>
                    ) : (
                      <span
                        className={`font-bold ${
                          isDiscount ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isDiscount ? "▼" : "▲"} {premiumAbs}%
                        <span className="text-xs font-normal ml-1">
                          {isDiscount ? "discount" : "premium"}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <span
                      className={
                        token.priceChange24h >= 0 ? "text-green-400" : "text-red-400"
                      }
                    >
                      {token.priceChange24h >= 0 ? "+" : ""}
                      {token.priceChange24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-4 text-right text-gray-400">
                    ${(token.volume24h / 1000).toFixed(0)}K
                  </td>
                  <td className="p-4 text-right">
                    <a
                      href={`https://solscan.io/token/${token.mint}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:text-blue-300 text-xs font-mono"
                    >
                      {token.mint.slice(0, 6)}...{token.mint.slice(-4)}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-gray-600 text-xs mt-4 text-center">
        Prices auto-refresh every 15s via Jupiter Price API v2 • Devnet: mock prices shown as fallback
      </p>
    </div>
  );
}
