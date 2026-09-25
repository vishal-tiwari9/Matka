import { NextResponse } from 'next/server';

interface AgentConfig {
  vaultId: number;
  agentName: string;
  strategy: string;
  discountThreshold: number; // e.g. 12 for 12%
  maxTradePct: number; // e.g. 25 for 25%
  capitalUSDC: number; // current capital
  ownerWallet: string;
}

interface TradeEvent {
  id: string;
  vaultId: number;
  agentName: string;
  type: 'BUY' | 'SKIP' | 'DECLINED';
  symbol: string;
  mint?: string;                    // ← add this
  tokenPrice: number;
  markPrice: number;
  discountPct: number;
  amountUSDC: number;
  tokensReceived: number;
  reason: string;
  timestamp: number;
  txHash?: string;
  jupiterRoute?: {                  // optional: make this typed too
    minOut: number;
    priceImpact: string;
    provider: string;
  };
}



// Global store for in-memory events
const globalAny: any = global;
if (!globalAny.tradeEvents) {
  globalAny.tradeEvents = [];
}
if (!globalAny.agentConfigs) {
  globalAny.agentConfigs = new Map<number, AgentConfig>();
}

export async function GET(request: Request) {
  return handleTick();
}

export async function POST(request: Request) {
  return handleTick();
}

async function handleTick() {
  try {
    // 1. Fetch from PreStocks API
    const response = await fetch('https://prestocks.com/api/prestocks').catch(() => null);
    let apiData = [];
    if (response && response.ok) {
      apiData = await response.json();
    } else {
      // Fallback or empty if failed
      apiData = [
        { symbol: 'ANTHROPIC', tokenPrice: 228.50, markPrice: 315.50 },
        { symbol: 'OPENAI', tokenPrice: 165.20, markPrice: 180.00 },
        { symbol: 'ANDURIL', tokenPrice: 72.50, markPrice: 85.00 },
        { symbol: 'NEURALINK', tokenPrice: 289.30, markPrice: 315.50 },
        { symbol: 'FIGURE_AI', tokenPrice: 38.50, markPrice: 42.00 },
        { symbol: 'KALSHI', tokenPrice: 11.80, markPrice: 12.50 },
        { symbol: 'POLYMARKET', tokenPrice: 8.10, markPrice: 8.90 },
        { symbol: 'SPACEX', tokenPrice: 186.50, markPrice: 225.00 },
        { symbol: 'XAI', tokenPrice: 48.30, markPrice: 55.00 },
      ];
    }

    // 2. Parse token prices & calculate discount
    const tokens = apiData.map((t: any) => {
      const discountPct = t.markPrice ? ((t.markPrice - t.tokenPrice) / t.markPrice) * 100 : 0;
      return { ...t, discountPct };
    });

    // 3. Read agent configs
    let configs: AgentConfig[] = Array.from(globalAny.agentConfigs.values());
    if (configs.length === 0) {
      // Try to parse from env if available
      try {
        if (process.env.AGENT_CONFIGS) {
          configs = JSON.parse(process.env.AGENT_CONFIGS);
          configs.forEach(c => globalAny.agentConfigs.set(c.vaultId, c));
        }
      } catch (e) {
        console.error('Failed to parse AGENT_CONFIGS from env');
      }
    }

    // If still no configs, return early
    if (configs.length === 0) {
      return NextResponse.json({ message: 'No agent configs found', scannedTokens: tokens.length, events: [] });
    }

    const newEvents: TradeEvent[] = [];

    // 4. For each agent, check each token
    for (const agent of configs) {
      for (const token of tokens) {
        let type: TradeEvent['type'] = 'DECLINED';
        let reason = '';
        let amountUSDC = 0;
        let tokensReceived = 0;
        let txHash;

        if (token.discountPct < 0) {
          type = 'SKIP';
          reason = `Token trading at a premium (${Math.abs(token.discountPct).toFixed(2)}%)`;
        } else if (token.discountPct >= agent.discountThreshold) {
          type = 'BUY';
          reason = `Discount ${token.discountPct.toFixed(2)}% >= threshold ${agent.discountThreshold}%`;
          amountUSDC = agent.capitalUSDC * (agent.maxTradePct / 100);
          tokensReceived = amountUSDC / token.tokenPrice;
          
          if (amountUSDC > 0) {
            txHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

            // Deduct capital
            agent.capitalUSDC -= amountUSDC;
            globalAny.agentConfigs.set(agent.vaultId, agent);
          } else {
            type = 'DECLINED';
            reason = 'Insufficient capital';
          }
        } else {
          type = 'DECLINED';
          reason = `Discount ${token.discountPct.toFixed(2)}% < threshold ${agent.discountThreshold}%`;
        }

        const event: TradeEvent = {
          id: Math.random().toString(36).substring(2, 9),
          vaultId: agent.vaultId,
          agentName: agent.agentName,
          type,
          symbol: token.symbol,
          mint: token.mint || '',
          tokenPrice: token.tokenPrice,
          markPrice: token.markPrice,
          discountPct: token.discountPct,
          amountUSDC,
          tokensReceived,
          reason,
          timestamp: Date.now(),
          txHash
        };
        
        if (type === 'BUY') {
          (event as any).jupiterRoute = {
            minOut: tokensReceived * 0.995,
            priceImpact: (Math.random() * 0.5).toFixed(2),
            provider: 'Jupiter V6',
          };
        }

        newEvents.push(event);
      }
    }

    // Accumulate events
    const allEvents = globalAny.tradeEvents as TradeEvent[];
    allEvents.unshift(...newEvents);

    // Keep max 200 events
    if (allEvents.length > 200) {
      allEvents.length = 200;
    }

    return NextResponse.json({
      message: 'Agent tick completed',
      scannedTokens: tokens.length,
      agentsProcessed: configs.length,
      newEvents: newEvents.length
    });
  } catch (error: any) {
    console.error('Agent tick error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
