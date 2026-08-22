import { WebSocketServer } from 'ws';
import { createEngine } from './index.js';
import { guardInfo } from './guard-info.js';

const engine = await createEngine();
const wss = new WebSocketServer({ host: '127.0.0.1', port: 8787 });
const json = (v: unknown) => JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x));
console.log('[clara] engine ready on ws://127.0.0.1:8787 — address', engine.address());

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
        msg.method === 'status' ? { address: engine.address(), contacts: engine.contacts(), verified: engine.isVerified(), ...guardInfo() } :
        msg.method === 'verifyWallet' ? await engine.verifyWallet() :
        (() => { throw new Error(`unknown method ${msg.method}`); })();
      ws.send(json({ id, ok: true, result }));
    } catch (e) {
      ws.send(json({ id, ok: false, error: e instanceof Error ? e.message : String(e) }));
    }
  });
});
