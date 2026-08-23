import { WebSocketServer } from 'ws';
import { createEngine, type Engine } from './index.js';
import { guardInfo } from './guard-info.js';

const json = (v: unknown) => JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x));

// Start the local Clara engine + its loopback WebSocket server. Used by the CLI
// (`pnpm -C engine daemon`) AND embedded in-process by the desktop app, so a
// packaged build has no external node/tsx dependency.
export async function startDaemon(opts?: { host?: string; port?: number; engine?: Engine }): Promise<{ engine: Engine; close: () => Promise<void> }> {
  const host = opts?.host ?? '127.0.0.1';
  const port = opts?.port ?? 8787;
  const engine = opts?.engine ?? (await createEngine());
  const wss = new WebSocketServer({ host, port });
  console.log(`[clara] engine ready on ws://${host}:${port} — address`, engine.address());

  wss.on('connection', (ws) => {
    ws.on('message', async (raw) => {
      let id: string | undefined;
      try {
        const msg = JSON.parse(String(raw)) as { id: string; method: string; params: never };
        id = msg.id;
        const result =
          msg.method === 'explain' ? await engine.explain(msg.params) :
          msg.method === 'construct' ? await engine.construct(msg.params) :
          msg.method === 'confirmSend' ? await engine.confirmSend(msg.params) :
          msg.method === 'sendIncoming' ? await engine.sendIncoming(msg.params) :
          msg.method === 'noteSent' ? engine.noteSent(msg.params) :
          msg.method === 'status' ? { address: engine.address(), contacts: engine.contacts(), verified: engine.isVerified(), ...guardInfo() } :
          msg.method === 'verifyWallet' ? await engine.verifyWallet() :
          (() => { throw new Error(`unknown method ${msg.method}`); })();
        ws.send(json({ id, ok: true, result }));
      } catch (e) {
        ws.send(json({ id, ok: false, error: e instanceof Error ? e.message : String(e) }));
      }
    });
  });

  return {
    engine,
    close: () => new Promise<void>((resolve) => wss.close(() => resolve())),
  };
}
