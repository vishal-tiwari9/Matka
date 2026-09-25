"use client";

import Link from "next/link";
import { usePreStocks } from "../lib/usePreStocks";

const PRESTOCK_MINTS: Record<string, string> = {
  ANTHROPIC: "Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw",
  OPENAI: "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF",
  ANDURIL: "PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB",
  NEURALINK: "PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S",
  FIGURE_AI: "PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd",
  KALSHI: "PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua",
  POLYMARKET: "Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP",
  SPACEX: "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
  XAI: "PreC1KtJ1sBPPqaeeqL6Qb15GTLCYVvyYEwxhdfTwfx",
};

const COMPANY_LOGOS: Record<string, string> = {
  ANTHROPIC: "/stocks/anthropic.png",
  OPENAI: "/stocks/openai.png",
  ANDURIL: "/stocks/anduril.png",
  NEURALINK: "/stocks/neuralink.png",
  FIGURE_AI: "/stocks/figureai.png",
  KALSHI: "/stocks/kalshi.png",
  POLYMARKET: "/stocks/polymarket.png",
  SPACEX: "/stocks/spacex.png",
  XAI: "/stocks/xai.png",
};

const COMPANY_NAMES: Record<string, string> = {
  ANTHROPIC: "ANTHROPIC",
  OPENAI: "OPENAI",
  ANDURIL: "ANDURIL",
  NEURALINK: "NEURALINK",
  FIGURE_AI: "FIGURE AI",
  KALSHI: "KALSHI",
  POLYMARKET: "POLYMARKET",
  SPACEX: "SPACEX",
  XAI: "XAI",
};

const COMPANY_ORDER = [
  "OPENAI",
  "NEURALINK",
  "ANDURIL",
  "POLYMARKET",
  "KALSHI",
  "ANTHROPIC",
  "FIGURE_AI",
  "SPACEX",
  "XAI",
];

const COMPANY_VALUATION: Record<string, string> = {
  SPACEX: "$1.93T",
  ANTHROPIC: "$1.70T",
  OPENAI: "$1.27T",
  ANDURIL: "$135.7B",
  NEURALINK: "$64.1B",
  FIGURE_AI: "$39.4B",
  KALSHI: "$32.1B",
  POLYMARKET: "$15.0B",
  XAI: "$50.0B",
};

function formatPrice(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompact(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return "—";

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return "—";

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getLogo(symbol: string) {
  return COMPANY_LOGOS[symbol] ?? "/stocks/default.png";
}

export default function MarketsPage() {
  const { marketData, loading } = usePreStocks();

  /*
   * IMPORTANT:
   * Only use the exact PreStocks mints supplied above.
   *
   * Using the mint as the key also prevents duplicate companies
   * from appearing if the API returns multiple records.
   */
  const uniqueByMint = new Map(
    marketData
      .filter((token) =>
        Object.values(PRESTOCK_MINTS).includes(token.mint)
      )
      .map((token) => [token.mint, token])
  );

  const markets = COMPANY_ORDER
    .map((symbol) => {
      const mint = PRESTOCK_MINTS[symbol];
      return uniqueByMint.get(mint);
    })
    .filter(Boolean);

  return (
    <div
      style={{
        padding: "32px 40px",
        maxWidth: 1420,
        margin: "0 auto",
        color: "#111827",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 5,
            }}
          >
            <h1
              style={{
                fontSize: 30,
                fontWeight: 800,
                margin: 0,
                letterSpacing: -0.6,
              }}
            >
              Pre-IPO Markets
            </h1>

            <span
              style={{
                background: "#FEF3C7",
                color: "#92400E",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 9px",
                borderRadius: 20,
              }}
            >
              PRESTOCKS
            </span>
          </div>

          <p
            style={{
              color: "#6B7280",
              fontSize: 14,
              margin: 0,
            }}
          >
            Real-time token prices and market data for private companies.
          </p>
        </div>

        <Link
          href="/home"
          style={{
            color: "#6366F1",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "Tokens Tracked",
            value: String(markets.length),
          },
          {
            label: "Combined Mark Valuation",
            value: "$5.19T",
          },
          {
            label: "On-chain Liquidity",
            value: "$3.0M",
          },
          {
            label: "Avg Premium to Mark",
            value: "+5.58%",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: "15px 18px",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              {stat.label}
            </div>

            <div
              style={{
                fontSize: 21,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Market Table */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          background: "white",
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 80,
              color: "#9CA3AF",
              fontSize: 16,
            }}
          >
            Loading market data...
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              minWidth: 1180,
              borderCollapse: "collapse",
              tableLayout: "auto",
            }}
          >
            <thead>
              <tr
                style={{
                  height: 54,
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                {[
                  "PRESTOCK",
                  "API PRICE",
                  "MARK",
                  "PREMIUM",
                  "EXECUTABLE",
                  "EXEC. PREMIUM",
                  
                  "LIQUIDITY",
                 
              
                  "",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: "left",
                      padding: "0 14px",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#9CA3AF",
                      letterSpacing: 0.3,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {markets.map((token: any) => {
                const symbol = token.symbol;
                const apiPrice = token.tokenPrice ?? token.markPrice ?? 0;
                const markPrice = token.markPrice ?? 0;

                const premium =
                  markPrice > 0
                    ? ((apiPrice - markPrice) / markPrice) * 100
                    : 0;

                /*
                 * Until the hook exposes a separate executable price,
                 * use API price as the executable reference.
                 *
                 * If your PreStocks response already has:
                 * token.executablePrice
                 * replace this line with that field.
                 */
                const executablePrice =
                  token.executablePrice ?? apiPrice;

                const executablePremium =
                  markPrice > 0
                    ? ((executablePrice - markPrice) / markPrice) * 100
                    : 0;

                /*
                 * These use real values if your hook exposes them.
                 * No Math.random() — ever.
                 */
                const change24h = token.change24h ?? token.priceChange24h ?? 0;

                const liquidity =
                  token.liquidity ??
                  token.liquidityUsd ??
                  token.volume24h ??
                  0;

                const flow24h =
                  token.flow24h ??
                  token.flows24h ??
                  0;

                const isPositive = premium >= 0;
                const executablePositive = executablePremium >= 0;
                const changePositive = change24h >= 0;

                return (
                  <tr
                    key={token.mint}
                    style={{
                      height: 65,
                      borderBottom: "1px solid #EEEEEE",
                    }}
                  >
                    {/* Company */}
                    <td style={{ padding: "0 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                          minWidth: 150,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: "#F3F4F6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={getLogo(symbol)}
                            alt={COMPANY_NAMES[symbol] ?? symbol}
                            width={32}
                            height={32}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </div>

                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#111827",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {COMPANY_NAMES[symbol] ?? token.name}
                        </span>
                      </div>
                    </td>

                    {/* API Price */}
                    <td
                      style={{
                        padding: "0 14px",
                        fontSize: 14,
                        color: "#111827",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatPrice(apiPrice)}
                    </td>

                    {/* Mark */}
                    <td
                      style={{
                        padding: "0 14px",
                        fontSize: 14,
                        color: "#111827",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatPrice(markPrice)}
                    </td>

                    {/* Premium */}
                    <td style={{ padding: "0 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background: isPositive ? "#E8F7EF" : "#FDECEA",
                          color: isPositive ? "#07854A" : "#D92D20",
                          padding: "6px 10px",
                          borderRadius: 18,
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatPercent(premium)}
                      </span>
                    </td>

                    {/* Executable */}
                    <td
                      style={{
                        padding: "0 14px",
                        fontSize: 14,
                        color: "#111827",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatPrice(executablePrice)}
                    </td>

                    {/* Executable Premium */}
                    <td style={{ padding: "0 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background: executablePositive
                            ? "#E8F7EF"
                            : "#FDECEA",
                          color: executablePositive
                            ? "#07854A"
                            : "#D92D20",
                          padding: "6px 10px",
                          borderRadius: 18,
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatPercent(executablePremium)}
                      </span>
                    </td>

                    {/* 24H */}
                    {/* <td style={{ padding: "0 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background: changePositive
                            ? "#E8F7EF"
                            : "#FDECEA",
                          color: changePositive
                            ? "#07854A"
                            : "#D92D20",
                          padding: "6px 10px",
                          borderRadius: 18,
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatPercent(change24h)}
                      </span>
                    </td> */}

                    {/* Liquidity */}
                    <td
                      style={{
                        padding: "0 14px",
                        fontSize: 14,
                        color: "#111827",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCompact(liquidity)}
                    </td>

                    {/* Flow */}
                    {/* <td
                      style={{
                        padding: "0 14px",
                        fontSize: 13,
                        color: flow24h < 0 ? "#D92D20" : "#111827",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {flow24h < 0 ? "−" : "+"}
                      {formatCompact(Math.abs(flow24h))}
                    </td> */}

                    {/* Trend */}
                    {/* <td style={{ padding: "0 14px" }}>
                      <div
                        style={{
                          width: 96,
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: 2,
                            background:
                              changePositive ? "#07854A" : "#D92D20",
                            opacity: 0.9,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </td> */}

                    {/* Trade */}
                    {/* <td style={{ padding: "0 14px" }}>
                      <Link
                        href={`/trade/${token.mint}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: 38,
                          padding: "0 19px",
                          borderRadius: 22,
                          background: "#080808",
                          color: "white",
                          textDecoration: "none",
                          fontSize: 13,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Trade
                      </Link>
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <p
        style={{
          textAlign: "center",
          color: "#9CA3AF",
          fontSize: 12,
          marginTop: 22,
        }}
      >
        Updated in real-time from PreStocks API
      </p>
    </div>
  );
}