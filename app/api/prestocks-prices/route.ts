import { NextResponse } from 'next/server';

interface NormalizedToken {
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

let cachedData: NormalizedToken[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

// Fallback static prices for tokens
const FALLBACK_DATA = [
  { symbol: 'ANTHROPIC', name: 'Anthropic', mint: 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw', markPrice: 315.50, tokenPrice: 228.50, volume24h: 120000, holders: 450 },
  { symbol: 'OPENAI', name: 'OpenAI', mint: 'PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF', markPrice: 180.00, tokenPrice: 165.20, volume24h: 550000, holders: 1234 },
  { symbol: 'ANDURIL', name: 'Anduril', mint: 'PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB', markPrice: 85.00, tokenPrice: 72.50, volume24h: 89000, holders: 320 },
  { symbol: 'NEURALINK', name: 'Neuralink', mint: 'PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S', markPrice: 315.50, tokenPrice: 289.30, volume24h: 420000, holders: 890 },
  { symbol: 'FIGURE_AI', name: 'Figure AI', mint: 'PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd', markPrice: 42.00, tokenPrice: 38.50, volume24h: 75000, holders: 210 },
  { symbol: 'KALSHI', name: 'Kalshi', mint: 'PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua', markPrice: 12.50, tokenPrice: 11.80, volume24h: 30000, holders: 150 },
  { symbol: 'POLYMARKET', name: 'Polymarket', mint: 'Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP', markPrice: 8.90, tokenPrice: 8.10, volume24h: 210000, holders: 670 },
  { symbol: 'SPACEX', name: 'SpaceX', mint: 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh', markPrice: 225.00, tokenPrice: 186.50, volume24h: 890000, holders: 2100 },
  { symbol: 'XAI', name: 'xAI', mint: 'PreC1KtJ1sBPPqaeeqL6Qb15GTLCYVvyYEwxhdfTwfx', markPrice: 55.00, tokenPrice: 48.30, volume24h: 150000, holders: 540 }
];

export async function GET() {
  const now = Date.now();
  if (cachedData && (now - lastFetchTime) < CACHE_TTL) {
    return NextResponse.json({ tokens: cachedData, lastUpdated: lastFetchTime });
  }

  let rawData = [];
  try {
    const res = await fetch('https://prestocks.com/api/prestocks');
    if (res.ok) {
      rawData = await res.json();
    } else {
      rawData = FALLBACK_DATA;
    }
  } catch (error) {
    rawData = FALLBACK_DATA;
  }

  // Normalize
  const tokens: NormalizedToken[] = rawData.map((item: any) => {
    // Attempt to merge with fallback if some fields are missing
    const fallbackItem = FALLBACK_DATA.find(f => f.symbol === item.symbol) || FALLBACK_DATA[0];
    
    const markPrice = item.markPrice || fallbackItem.markPrice;
    const tokenPrice = item.tokenPrice || fallbackItem.tokenPrice;
    const discountPct = markPrice > 0 ? ((markPrice - tokenPrice) / markPrice) * 100 : 0;
    
    return {
      symbol: item.symbol || fallbackItem.symbol,
      name: item.name || fallbackItem.name,
      mint: item.mintAddress || item.mint || fallbackItem.mint,
      tokenPrice,
      markPrice,
      discountPct,
      isDiscount: discountPct > 0,
      isPremium: discountPct < 0,
      volume24h: item.volume24h || fallbackItem.volume24h || 0,
      holders: item.holders || fallbackItem.holders || 0
    };
  });

  cachedData = tokens;
  lastFetchTime = now;

  return NextResponse.json({ tokens, lastUpdated: lastFetchTime });
}
