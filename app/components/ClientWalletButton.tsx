"use client";

import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function ClientWalletButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          color: "rgba(255,255,255,0.6)",
          fontSize: 13,
          fontWeight: 500,
          height: 38,
          padding: "0 16px",
          cursor: "default",
        }}
      >
        Select Wallet
      </button>
    );
  }

  return <WalletMultiButton />;
}
