type StompHandler = (body: unknown) => void;

export interface GroupRealtimeSubscription {
  disconnect: () => void;
}

function resolveWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    return `${proto}//${host}:8080/ws`;
  }
  return "ws://localhost:8080/ws";
}

function buildFrame(command: string, headers: Record<string, string>, body = ""): string {
  const lines = [command];
  for (const [key, val] of Object.entries(headers)) {
    lines.push(`${key}:${val}`);
  }
  return `${lines.join("\n")}\n\n${body}\0`;
}

export function subscribeGroupTopics(
  groupId: string,
  handlers: {
    onChat?: StompHandler;
    onWheel?: StompHandler;
    onObligation?: StompHandler;
  }
): GroupRealtimeSubscription {
  if (typeof window === "undefined") {
    return { disconnect: () => undefined };
  }

  let closed = false;
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    try {
      socket = new WebSocket(resolveWsUrl());
    } catch {
      return;
    }

    socket.onopen = () => {
      socket?.send(
        buildFrame("CONNECT", {
          "accept-version": "1.2,1.1",
          "heart-beat": "10000,10000",
        })
      );
    };

    socket.onmessage = (event) => {
      const raw = String(event.data ?? "");
      const frames = raw.split("\0");
      for (const frame of frames) {
        if (!frame.trim()) continue;
        const idx = frame.indexOf("\n\n");
        if (idx === -1) continue;
        const headerBlock = frame.slice(0, idx);
        const body = frame.slice(idx + 2);
        const lines = headerBlock.split(/\r?\n/);
        const command = lines[0]?.trim();

        if (command === "CONNECTED") {
          socket?.send(
            buildFrame("SUBSCRIBE", {
              id: `chat-${groupId}`,
              destination: `/topic/group/${groupId}/chat`,
            })
          );
          socket?.send(
            buildFrame("SUBSCRIBE", {
              id: `wheel-${groupId}`,
              destination: `/topic/group/${groupId}/wheel`,
            })
          );
          socket?.send(
            buildFrame("SUBSCRIBE", {
              id: `obligations-${groupId}`,
              destination: `/topic/group/${groupId}/obligations`,
            })
          );
          continue;
        }

        if (command === "MESSAGE") {
          const destLine = lines.find((l) => l.startsWith("destination:"));
          const dest = destLine?.slice("destination:".length).trim() ?? "";
          let parsed: unknown = body;
          try {
            parsed = JSON.parse(body);
          } catch {
            // plain text fallback
          }

          if (dest.endsWith("/chat")) handlers.onChat?.(parsed);
          else if (dest.endsWith("/wheel")) handlers.onWheel?.(parsed);
          else if (dest.endsWith("/obligations")) handlers.onObligation?.(parsed);
        }
      }
    };

    socket.onclose = () => {
      if (!closed) {
        reconnectTimer = setTimeout(connect, 4000);
      }
    };
  };

  connect();

  return {
    disconnect: () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(buildFrame("DISCONNECT", {}));
        }
        socket?.close();
      } catch {
        // ignore close errors
      }
    },
  };
}
