// One WebSocket to the local Clara engine, shared by the background worker.
// Loopback only — nothing here can reach the network beyond 127.0.0.1.
const URL = 'ws://127.0.0.1:8787';

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

let ws: WebSocket | null = null;
let opening: Promise<WebSocket> | null = null;
const pending = new Map<string, Pending>();

function open(): Promise<WebSocket> {
  if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve(ws);
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    const sock = new WebSocket(URL);
    const timer = setTimeout(() => { sock.close(); reject(new Error('Clara engine not reachable on 127.0.0.1:8787 — is `pnpm -C engine daemon` running?')); }, 4000);
    sock.onopen = () => { clearTimeout(timer); ws = sock; opening = null; resolve(sock); };
    sock.onerror = () => { clearTimeout(timer); opening = null; reject(new Error('Clara engine not reachable on 127.0.0.1:8787 — is `pnpm -C engine daemon` running?')); };
    sock.onclose = () => { ws = null; for (const [, p] of pending) p.reject(new Error('engine connection closed')); pending.clear(); };
    sock.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as { id: string; ok: boolean; result?: unknown; error?: string };
        const p = pending.get(msg.id);
        if (!p) return;
        pending.delete(msg.id);
        msg.ok ? p.resolve(msg.result) : p.reject(new Error(msg.error ?? 'engine error'));
      } catch { /* ignore malformed frames */ }
    };
  });
  return opening;
}

export async function call<T>(method: string, params?: unknown): Promise<T> {
  const sock = await open();
  const id = crypto.randomUUID();
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    sock.send(JSON.stringify({ id, method, params }));
  });
}
