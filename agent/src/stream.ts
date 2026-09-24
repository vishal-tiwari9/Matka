import { WebSocketServer, WebSocket } from "ws";

// ============================================================
//  stream.ts — WebSocket Server for Frontend Agent Terminal
//
//  The frontend AgentTerminal.tsx connects to this WebSocket
//  to receive real-time agent activity logs. This makes the
//  "Agent Brain" visible to the user — they can see exactly
//  what the agent is thinking and doing in real time.
//
//  Message types:
//  - SCANNING:  Agent polling price feeds
//  - SIGNAL:    A buy/sell opportunity identified
//  - CHECKING:  Validating Pyth oracle / Meteora liquidity
//  - EXECUTING: Submitting trade to Smart Contract
//  - BLOCKED:   Smart Contract rejected the trade + reason
//  - SUCCESS:   Trade executed on-chain with tx signature
//  - YIELD:     Kamino yield update
//  - ERROR:     Something failed (with context)
// ============================================================

export type AgentEventType =
  | "SCANNING"
  | "SIGNAL"
  | "CHECKING"
  | "EXECUTING"
  | "BLOCKED"
  | "SUCCESS"
  | "YIELD"
  | "ERROR"
  | "HEARTBEAT";

export interface AgentEvent {
  type: AgentEventType;
  message: string;
  data?: Record<string, any>;
  timestamp: number;
}

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

/**
 * Start the WebSocket server on the configured port.
 * Frontend connects to ws://localhost:{WS_PORT}
 */
export function startWsServer(port: number = 8080): void {
  wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`[Stream] Client connected. Total: ${clients.size}`);

    // Send welcome + current status
    emit("HEARTBEAT", "Matka Agent connected. Monitoring markets...");

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`[Stream] Client disconnected. Total: ${clients.size}`);
    });
  });

  console.log(`[Stream] WebSocket server started on port ${port}`);
}

/**
 * Emit an event to ALL connected frontend clients.
 * The frontend AgentTerminal component renders these in real-time.
 */
export function emit(
  type: AgentEventType,
  message: string,
  data?: Record<string, any>
): void {
  const event: AgentEvent = {
    type,
    message,
    data,
    timestamp: Date.now(),
  };

  const payload = JSON.stringify(event);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }

  // Also log to console for debugging
  const emoji = {
    SCANNING: "🔍",
    SIGNAL: "📊",
    CHECKING: "🔬",
    EXECUTING: "⚡",
    BLOCKED: "🔴",
    SUCCESS: "✅",
    YIELD: "💰",
    ERROR: "❌",
    HEARTBEAT: "💗",
  }[type];

  console.log(`${emoji} [${type}] ${message}`, data ? JSON.stringify(data) : "");
}
