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
      <body className="bg-black text-white min-h-screen">
        <WalletContextProvider>
          <nav style={{borderBottom:"1px solid #1f2937",background:"#0a0a0a",padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:32}}>
              <a href="/home" style={{fontWeight:800,fontSize:18,color:"#60a5fa",textDecoration:"none",letterSpacing:-0.5}}>MATKA</a>
              <div style={{display:"flex",gap:24,fontSize:13,fontWeight:500}}>
                <a href="/home" style={{color:"#9ca3af",textDecoration:"none"}}>Dashboard</a>
                <a href="/markets" style={{color:"#9ca3af",textDecoration:"none"}}>Markets</a>
                <a href="/yield" style={{color:"#9ca3af",textDecoration:"none"}}>Yield</a>
                <a href="/agents" style={{color:"#9ca3af",textDecoration:"none"}}>Agents</a>
                <a href="/meteora" style={{color:"#9ca3af",textDecoration:"none"}}>Meteora LP</a>
              </div>
            </div>
            <div id="wallet-button-portal"></div>
          </nav>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
