'use client';

import { useState, useEffect } from 'react';

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

const FALLBACK_DATA: NormalizedToken[] = [
  { symbol: 'ANTHROPIC', name: 'Anthropic', mint: 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw', markPrice: 315.50, tokenPrice: 228.50, discountPct: 27.6, isDiscount: true, isPremium: false, volume24h: 120000, holders: 450 },
  { symbol: 'OPENAI', name: 'OpenAI', mint: 'PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF', markPrice: 180.00, tokenPrice: 165.20, discountPct: 8.2, isDiscount: true, isPremium: false, volume24h: 550000, holders: 1234 },
  { symbol: 'ANDURIL', name: 'Anduril', mint: 'PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB', markPrice: 85.00, tokenPrice: 72.50, discountPct: 14.7, isDiscount: true, isPremium: false, volume24h: 89000, holders: 320 },
  { symbol: 'NEURALINK', name: 'Neuralink', mint: 'PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S', markPrice: 315.50, tokenPrice: 289.30, discountPct: 8.3, isDiscount: true, isPremium: false, volume24h: 420000, holders: 890 },
  { symbol: 'FIGURE_AI', name: 'Figure AI', mint: 'PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd', markPrice: 42.00, tokenPrice: 38.50, discountPct: 8.3, isDiscount: true, isPremium: false, volume24h: 75000, holders: 210 },
  { symbol: 'KALSHI', name: 'Kalshi', mint: 'PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua', markPrice: 12.50, tokenPrice: 11.80, discountPct: 5.6, isDiscount: true, isPremium: false, volume24h: 30000, holders: 150 },
  { symbol: 'POLYMARKET', name: 'Polymarket', mint: 'Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP', markPrice: 8.90, tokenPrice: 8.10, discountPct: 9.0, isDiscount: true, isPremium: false, volume24h: 210000, holders: 670 },
  { symbol: 'SPACEX', name: 'SpaceX', mint: 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh', markPrice: 225.00, tokenPrice: 186.50, discountPct: 17.1, isDiscount: true, isPremium: false, volume24h: 890000, holders: 2100 },
  { symbol: 'XAI', name: 'xAI', mint: 'PreC1KtJ1sBPPqaeeqL6Qb15GTLCYVvyYEwxhdfTwfx', markPrice: 55.00, tokenPrice: 48.30, discountPct: 12.2, isDiscount: true, isPremium: false, volume24h: 150000, holders: 540 }
];

export function usePreStocks() {
  const [marketData, setMarketData] = useState<NormalizedToken[]>(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchPrices() {
      try {
        const res = await fetch('/api/prestocks-prices');
        if (!res.ok) throw new Error('Failed to fetch prices');
        const data = await res.json();
        
        if (mounted && data.tokens) {
          setMarketData(data.tokens);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          // Keep fallback data if error
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // 30 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { marketData, loading, error };
}
