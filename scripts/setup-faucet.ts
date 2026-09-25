import { 
  Connection, 
  Keypair, 
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo 
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

async function setupFaucet() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // 1. Generate new Mint Authority Keypair
  const mintAuthority = Keypair.generate();
  console.log(`Generated Mint Authority: ${mintAuthority.publicKey.toBase58()}`);

  // 2. Airdrop SOL
  console.log('Requesting airdrop of 2 SOL...');
  const airdropSignature = await connection.requestAirdrop(
    mintAuthority.publicKey,
    2 * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSignature);
  console.log('Airdrop complete!');

  // 3. Create Mint (6 decimals for USDC)
  console.log('Creating MATKA-USDC SPL Token Mint...');
  const mint = await createMint(
    connection,
    mintAuthority, // payer
    mintAuthority.publicKey, // mintAuthority
    null, // freezeAuthority
    6 // decimals
  );
  console.log(`✅ Faucet Mint created: ${mint.toBase58()}`);

  // 4. Save to .env.local
  const envContent = `FAUCET_MINT=${mint.toBase58()}\nFAUCET_PRIVATE_KEY=[${mintAuthority.secretKey.toString()}]\n`;
  const envPath = path.join(__dirname, '..', '.env.local');
  
  // Append or write to .env.local
  if (fs.existsSync(envPath)) {
    fs.appendFileSync(envPath, `\n${envContent}`);
  } else {
    fs.writeFileSync(envPath, envContent);
  }
  
  console.log(`\n🎉 Setup Complete!`);
  console.log(`Variables written to ${envPath}`);
  console.log(`To use the real faucet, restart your Next.js server.`);
}

setupFaucet().catch(console.error);
