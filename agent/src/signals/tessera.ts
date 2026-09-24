import axios from "axios";

// ============================================================
//  tessera.ts — Tessera API Integration
//
//  Role in Matka Protocol:
//  Tessera tokenizes private company exposure via LOAN PARTICIPATION
//  RIGHTS (not equity SPV like PreStocks). It publishes 409A-attested
//  NAV valuations via its REST API.
//
//  How Matka uses Tessera:
//  → Cross-validation: Before buying any Pre-IPO token, agent checks
//    BOTH PreStocks mark AND Tessera NAV. If they diverge by >5%,
//    the agent holds off (too much uncertainty about true valuation).
//  → This protects users from buying SpaceX tokens when two different
//    data sources disagree dramatically on the company's worth.
//
//  Example scenario:
//  PreStocks SpaceX mark: $150
//  Tessera T-SpaceX NAV:  $160  → 6.25% divergence → HOLD
//  Tessera T-SpaceX NAV:  $153  → 2% divergence → OK to buy
//
//  API: https://rest-api.tessera.pe/v1/public/token-details (public)
// ============================================================

const TESSERA_API = process.env.TESSERA_API_URL!;

export interface TesseraTokenDetail {
  symbol: string;           // e.g. "T-SpaceX"
  underlyingName: string;   // e.g. "SpaceX"
  navPerToken: number;      // 409A-attested NAV in USD
  lastUpdated: string;      // ISO timestamp
  loanParticipationRate: number; // Effective loan rate
}

/**
 * Fetch Tessera token details for a specific underlying company.
 * Returns null if Tessera doesn't list this company.
 */
export async function getTesseraNav(
  underlyingSymbol: string
): Promise<TesseraTokenDetail | null> {
  try {
    const res = await axios.get(`${TESSERA_API}/token-details`, {
      params: { symbol: underlyingSymbol },
      timeout: 8_000,
    });

    const t = res.data;
    if (!t || !t.navPerToken) return null;

    return {
      symbol: t.symbol ?? `T-${underlyingSymbol}`,
      underlyingName: t.underlyingName ?? underlyingSymbol,
      navPerToken: parseFloat(t.navPerToken ?? t.nav ?? 0),
      lastUpdated: t.lastUpdated ?? new Date().toISOString(),
      loanParticipationRate: parseFloat(t.loanParticipationRate ?? 0),
    };
  } catch (err) {
    // Tessera API may not list all assets. Return null gracefully.
    return null;
  }
}

/**
 * Cross-validate PreStocks mark price vs Tessera NAV.
 *
 * Returns:
 *   - validated: true if both sources agree within maxDivergencePct
 *   - divergencePct: actual divergence between the two sources
 *   - action: 'buy' | 'hold' | 'no_tessera_data'
 */
export async function crossValidatePreIpo(
  symbol: string,
  prestocksMarkUsd: number,
  maxDivergencePct: number
): Promise<{
  validated: boolean;
  divergencePct: number;
  action: "buy" | "hold" | "no_tessera_data";
  tesseraNav: number | null;
}> {
  const tessera = await getTesseraNav(symbol);

  if (!tessera || tessera.navPerToken <= 0) {
    // Tessera doesn't have data for this asset — proceed with PreStocks only
    return {
      validated: true, // Allow trade but log it
      divergencePct: 0,
      action: "no_tessera_data",
      tesseraNav: null,
    };
  }

  const divergencePct =
    Math.abs(prestocksMarkUsd - tessera.navPerToken) /
    Math.max(prestocksMarkUsd, tessera.navPerToken) *
    100;

  const validated = divergencePct <= maxDivergencePct;

  return {
    validated,
    divergencePct,
    action: validated ? "buy" : "hold",
    tesseraNav: tessera.navPerToken,
  };
}
