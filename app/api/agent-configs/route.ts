import { NextResponse } from 'next/server';

const globalAny: any = global;
if (!globalAny.agentConfigs) {
  globalAny.agentConfigs = new Map<number, any>();
}

export async function GET() {
  const configs = Array.from(globalAny.agentConfigs.values());
  return NextResponse.json({ configs });
}

export async function POST(request: Request) {
  try {
    const config = await request.json();
    if (config && typeof config.vaultId === 'number') {
      globalAny.agentConfigs.set(config.vaultId, config);
      return NextResponse.json({ success: true, config });
    }
    return NextResponse.json({ error: 'Invalid config payload' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const vaultId = searchParams.get('vaultId');
  
  if (vaultId) {
    const id = parseInt(vaultId, 10);
    const deleted = globalAny.agentConfigs.delete(id);
    return NextResponse.json({ success: deleted });
  }
  return NextResponse.json({ error: 'Missing vaultId' }, { status: 400 });
}
