// ============================================================
//  global.d.ts — Extend the NodeJS global type with our
//  in-memory stores used by API routes.
//  These are module-level singletons that persist between
//  requests in a single Vercel Function instance.
// ============================================================

export {};

declare global {
  var tradeEvents: TradeEvent[] | undefined;
  var agentConfigs: AgentConfig[] | undefined;
  var faucetGrants: Map<string, number> | undefined;
  var meteoraPositions: MeteoraPosition[] | undefined;
  var prestocksCache: { data: NormalizedToken[]; ts: number } | undefined;
}

export interface AgentConfig {
  vaultId: number;
  agentName: string;
  strategy: string;
  discountThreshold: number;
  maxTradePct: number;
  capitalUSDC: number;
  ownerWallet: string;
}

export interface TradeEvent {
  id: string;
  vaultId: number;
  agentName: string;
  type: 'BUY' | 'SKIP' | 'DECLINED' | 'ERROR';
  symbol: string;
  mint: string;
  tokenPrice: number;
  markPrice: number;
  discountPct: number;
  amountUSDC: number;
  tokensReceived: number;
  reason: string;
  timestamp: number;
  txHash?: string;
}

export interface NormalizedToken {
  symbol: string;
  name: string;
  mint: string;
  tokenPrice: number;
  markPrice: number;
  discountPct: number;
  isDiscount: boolean;
  isPremium: boolean;
  volume24h: number;
  holders: number;
}

export interface MeteoraPosition {
  id: string;
  wallet: string;
  symbol: string;
  mint: string;
  usdcAmount: number;
  tokenAmount: number;
  minPrice: number;
  maxPrice: number;
  createdAt: number;
  status: 'active' | 'closed';
}
