import { NextResponse } from 'next/server';

const globalAny: any = global;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vaultIdStr = searchParams.get('vaultId');
  const limitStr = searchParams.get('limit');
  
  let events = globalAny.tradeEvents || [];

  if (vaultIdStr) {
    const vaultId = parseInt(vaultIdStr, 10);
    events = events.filter((e: any) => e.vaultId === vaultId);
  }

  if (limitStr) {
    const limit = parseInt(limitStr, 10);
    events = events.slice(0, limit);
  }

  return NextResponse.json({
    trades: events,
    count: events.length
  });
}
