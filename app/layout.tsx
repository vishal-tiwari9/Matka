import type { Metadata } from "next";
import "./globals.css";
import { WalletContextProvider } from "./components/WalletProvider";

export const metadata: Metadata = {
  title: "Matka Protocol | Autonomous Robo-Portfolio",
  description:
    "AI-driven tokenized stock and Pre-IPO portfolio on Solana. Earn Kamino yield automatically, with cryptographic guardrails.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
