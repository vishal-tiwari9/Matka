"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

const DEVNET_RPC = "https://api.devnet.solana.com";

export function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // In the latest Solana wallet adapter, Phantom, Backpack, and Solflare 
  // are auto-detected via Wallet Standard. We don't need manual imports anymore!
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={DEVNET_RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
