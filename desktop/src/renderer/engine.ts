// Renderer-side client for the local Clara engine. Same protocol the browser
// extension uses ({id,method,params} → {id,ok,result|error}), over the loopback
// WebSocket the desktop main process guarantees is running.
const URL = (window as unknown as { claraDesktop?: { engineUrl?: string } }).claraDesktop?.engineUrl ?? 'ws://127.0.0.1:8787';

const uuid = () =>
  (crypto as { randomUUID?: () => string }).randomUUID?.()
  ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };
let ws: WebSocket | null = null;
let opening: Promise<WebSocket> | null = null;
const pending = new Map<string, Pending>();
const listeners = new Set<(up: boolean) => void>();

export function onStatus(fn: (up: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const emit = (up: boolean) => listeners.forEach((l) => l(up));

function open(): Promise<WebSocket> {
  if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve(ws);
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    const sock = new WebSocket(URL);
    const timer = setTimeout(() => { sock.close(); opening = null; reject(new Error('Clara engine not reachable on 127.0.0.1:8787')); }, 4000);
    sock.onopen = () => { clearTimeout(timer); ws = sock; opening = null; emit(true); resolve(sock); };
    sock.onerror = () => { clearTimeout(timer); opening = null; emit(false); reject(new Error('Clara engine not reachable on 127.0.0.1:8787')); };
    sock.onclose = () => { ws = null; emit(false); for (const [, p] of pending) p.reject(new Error('engine connection closed')); pending.clear(); };
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
  const id = uuid();
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    sock.send(JSON.stringify({ id, method, params }));
  });
}
