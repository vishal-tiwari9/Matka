"use client";

import { useEffect, useState, useRef } from "react";

interface AgentEvent {
  type: "SCANNING" | "SIGNAL" | "CHECKING" | "EXECUTING" | "BLOCKED" | "SUCCESS" | "YIELD" | "ERROR" | "HEARTBEAT";
  message: string;
  data?: Record<string, any>;
  timestamp: number;
}

const TYPE_STYLES: Record<string, { color: string; emoji: string }> = {
  SCANNING:  { color: "rgba(255,255,255,0.55)", emoji: "🔍" },
  SIGNAL:    { color: "#3b82f6",                 emoji: "📊" },
  CHECKING:  { color: "rgba(255,255,255,0.6)",   emoji: "🔬" },
  EXECUTING: { color: "#eab308",                 emoji: "⚡" },
  BLOCKED:   { color: "#ef4444",                 emoji: "🔴" },
  SUCCESS:   { color: "#10b981",                 emoji: "✅" },
  YIELD:     { color: "#10b981",                 emoji: "💰" },
  ERROR:     { color: "#ef4444",                 emoji: "❌" },
  HEARTBEAT: { color: "rgba(255,255,255,0.3)",   emoji: "💗" },
};

export default function AgentTerminal() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket("ws://localhost:8080");

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 3s
        reconnectTimeout = setTimeout(connect, 3000);
      };
      ws.onmessage = (msg) => {
        try {
          const event: AgentEvent = JSON.parse(msg.data);
          setEvents((prev) => [...prev.slice(-49), event]); // Keep last 50
        } catch {}
      };
    }

    connect();
    return () => {
      ws?.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace", fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
          Matka Agent Terminal
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", width: 8, height: 8 }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              background: isConnected ? "#10b981" : "#ef4444",
              boxShadow: isConnected ? "0 0 6px #10b981" : "none",
            }} />
            {isConnected && (
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "#10b981", opacity: 0.4,
                animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
              }} />
            )}
          </div>
          <span style={{ color: isConnected ? "#10b981" : "#ef4444", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
            {isConnected ? "Agent Active" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Terminal Body */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 18px",
        fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace",
        fontSize: 12, lineHeight: 1.7,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {events.length === 0 ? (
          <span style={{ color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
            Waiting for agent signals...{!isConnected && " (agent backend not running)"}
          </span>
        ) : (
          events.map((ev, i) => {
            const style = TYPE_STYLES[ev.type] ?? TYPE_STYLES.HEARTBEAT;
            return (
              <div key={i} className="fade-in" style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ color: "rgba(255,255,255,0.25)", minWidth: 72, flexShrink: 0, fontSize: 10, paddingTop: 2 }}>
                  {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span style={{ flexShrink: 0, fontSize: 13 }}>{style.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: style.color, wordBreak: "break-word" }}>{ev.message}</span>
                  {ev.data && ev.type !== "HEARTBEAT" && (
                    <pre style={{
                      marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.3)",
                      background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "8px 10px",
                      border: "1px solid rgba(255,255,255,0.05)", overflowX: "auto", whiteSpace: "pre-wrap",
                    }}>
                      {JSON.stringify(ev.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Ping animation style */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
