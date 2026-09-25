import { NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

const globalAny: any = global;
if (!globalAny.faucetGrants) {
  globalAny.faucetGrants = new Map<string, number>();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  
  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
  }
  
  const amount = globalAny.faucetGrants.get(wallet) || 0;
  return NextResponse.json({ claimed: amount > 0, amount });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress } = body;
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
    }
    
    // Allow re-claiming in the same session (for hackathon demo purposes)
    // Production would use a DB check here
    
    const amount = 50000;
    
    // Check if env vars are present for REAL SPL minting
    if (process.env.FAUCET_PRIVATE_KEY && process.env.FAUCET_MINT) {
      try {
        const secretKey = Uint8Array.from(JSON.parse(process.env.FAUCET_PRIVATE_KEY));
        const mintAuthority = Keypair.fromSecretKey(secretKey);
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const mintPubkey = new PublicKey(process.env.FAUCET_MINT);
        const recipientPubkey = new PublicKey(walletAddress);

        // Get or Create ATA for recipient
        const ata = await getOrCreateAssociatedTokenAccount(
          connection,
          mintAuthority, // payer
          mintPubkey,
          recipientPubkey
        );

        // Mint 50,000 * 10^6
        const rawAmount = amount * Math.pow(10, 6);
        const txSig = await mintTo(
          connection,
          mintAuthority, // payer
          mintPubkey,
          ata.address, // destination
          mintAuthority, // mint authority
          rawAmount
        );
        
        console.log(`SPL Mint success! Tx: ${txSig}`);
        globalAny.faucetGrants.set(walletAddress, amount);

        return NextResponse.json({ 
          success: true, 
          amount, 
          message: `Minted 50,000 Real SPL MATKA-USDC! Tx: ${txSig.slice(0,10)}...` 
        });
      } catch (err: any) {
        console.error('Real SPL mint failed, falling back to mock:', err);
        // Fallback below
      }
    }

    // Fallback Mock Behavior
    globalAny.faucetGrants.set(walletAddress, amount);
    return NextResponse.json({ 
      success: true, 
      amount, 
      message: 'Minted 50,000 Mock MATKA-USDC to your wallet' 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
