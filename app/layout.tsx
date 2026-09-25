import type { Metadata } from "next";
import "./globals.css";
import { WalletContextProvider } from "./components/WalletProvider";
import ClientNavbar from "./components/ClientNavbar";

export const metadata: Metadata = {
  title: "Matka Protocol — AI Trading Vaults for Pre-IPO Stocks",
  description: "Autonomous AI agents that trade tokenized pre-IPO stocks on Solana using on-chain guardrails.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: '#F8F9FA', minHeight: '100vh' }}>
        <WalletContextProvider>
          <ClientNavbar />
          <main>{children}</main>
        </WalletContextProvider>
      </body>
    </html>
  );
}
