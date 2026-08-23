// MAIN-world GUARD provider (Mode B). Clara sits IN FRONT of your real wallet.
// Two coverage paths:
//   1. Legacy `window.ethereum` — wrapped directly (older dApps).
//   2. EIP-6963 — Clara intercepts every wallet's announcement, wraps that
//      wallet's provider in the guard, and re-announces it under the SAME name,
//      so a modern dApp routes signing through Clara → check → forward to the
//      real wallet. Wallet-agnostic: any EIP-1193/6963 wallet, no per-wallet code.
export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    type Provider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; on?: (...a: unknown[]) => void; removeListener?: (...a: unknown[]) => void; isClara?: boolean };
    type Info = { uuid: string; name: string; icon: string; rdns: string };
    const w = window as unknown as { ethereum?: Provider };
    let downstream: Provider | undefined = w.ethereum && !w.ethereum.isClara ? w.ethereum : undefined;

    // ---- engine round-trip (verdict + user decision); resolves on approve, rejects (blocked) on deny
    const replies = new Map<string, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
    window.addEventListener('message', (ev) => {
      const d = ev.data as { scope?: string; type?: string; id?: string; ok?: boolean; result?: unknown };
      if (ev.source !== window || d?.scope !== 'clara-inject' || d.type !== 'result' || !d.id) return;
      const p = replies.get(d.id); if (!p) return;
      replies.delete(d.id);
      d.ok ? p.resolve(d.result) : p.reject({ code: 4001, message: 'Clara blocked this request' });
    });
    const check = (kind: string, fields: Record<string, unknown>) => {
      const id = crypto.randomUUID();
      return new Promise((resolve, reject) => {
        replies.set(id, { resolve, reject });
        window.postMessage({ scope: 'clara-page', type: 'request', id, request: { kind, ...fields, guard: true, hasDownstream: true } }, '*');
      });
    };
    const execViaClara = (staged: Record<string, unknown>) => {
      const id = crypto.randomUUID();
      return new Promise((resolve, reject) => { replies.set(id, { resolve, reject });
        window.postMessage({ scope: 'clara-page', type: 'exec', id, request: staged }, '*'); });
    };

    let claraAddress = '0x0000000000000000000000000000000000000000';
    window.addEventListener('message', (ev) => {
      const d = ev.data as { scope?: string; type?: string; address?: string };
      if (ev.source === window && d?.scope === 'clara-inject' && d.type === 'address' && d.address) claraAddress = d.address;
    });
    window.postMessage({ scope: 'clara-page', type: 'hello' }, '*');

    const SIGNING = new Set(['eth_sendTransaction', 'eth_signTypedData_v4', 'personal_sign']);
    const stageFrom = (method: string, params?: unknown[]): { kind: string } & Record<string, unknown> => {
      if (method === 'eth_sendTransaction') { const tx = (params?.[0] ?? {}) as { to?: string; value?: string; data?: string }; return { kind: 'transaction', to: tx.to, value: tx.value, data: tx.data }; }
      if (method === 'eth_signTypedData_v4') return { kind: 'typedData', payload: safeParse(params?.[1]) };
      return { kind: 'personalSign', messageHex: params?.[0] };
    };

    // Wrap ANY wallet's provider: read calls pass through; signing calls are
    // checked first, then blocked or forwarded to the real wallet to sign.
    const guardProvider = (real: Provider): Provider => ({
      isClara: true,
      request: async (args) => {
        if (!SIGNING.has(args.method)) return real.request(args);
        const staged = stageFrom(args.method, args.params);
        await check(staged.kind, staged);        // throws (4001) if blocked — real wallet never sees it
        return real.request(args);               // approved → the real wallet signs
      },
      on: (...a) => real.on?.(...a),
      removeListener: (...a) => real.removeListener?.(...a),
    });

    // ---- Path 1: legacy window.ethereum guard (dApps that use it directly)
    const legacyGuard: Provider = {
      isClara: true,
      request: async (args) => {
        const { method, params } = args;
        if (!SIGNING.has(method)) {
          if (downstream) return downstream.request(args);
          switch (method) {
            case 'eth_chainId': return '0xaa36a7';
            case 'eth_requestAccounts':
            case 'eth_accounts': return [claraAddress];
            default: throw { code: 4200, message: `Clara: ${method} not supported (no wallet attached)` };
          }
        }
        const staged = stageFrom(method, params);
        await check(staged.kind, staged);
        if (downstream) return downstream.request(args);
        return execViaClara(staged);             // no real wallet → Clara's testnet wallet executes
      },
      on: (...a) => downstream?.on?.(...a),
      removeListener: (...a) => downstream?.removeListener?.(...a),
    };
    try {
      Object.defineProperty(window, 'ethereum', {
        configurable: true, get: () => legacyGuard,
        set: (v: Provider) => { if (v && !v.isClara) downstream = v; },
      });
    } catch { w.ethereum = legacyGuard; }

    // ---- Path 2: EIP-6963 — wrap and re-announce every wallet transparently
    type Announce = { info: Info; provider: Provider };
    const guarded = new Map<string, Announce>();
    let reportTimer: ReturnType<typeof setTimeout> | undefined;
    const reportWallets = () => {
      clearTimeout(reportTimer);
      reportTimer = setTimeout(() => {
        const list = [...guarded.values()].map((e) => e.info);
        if (list.length === 0 && downstream) list.push({ uuid: 'legacy', name: 'Injected wallet', icon: '', rdns: 'legacy.injected' });
        window.postMessage({ scope: 'clara-page', type: 'wallets', wallets: list }, '*');
      }, 250);
    };

    const realDispatch = window.dispatchEvent.bind(window);
    // Intercept a wallet's announcement, swap its provider for a guarded one
    // (same info/name/icon), so the dApp only ever sees the Clara-guarded wallet.
    (window as unknown as { dispatchEvent: (e: Event) => boolean }).dispatchEvent = function (ev: Event) {
      if (ev.type === 'eip6963:announceProvider') {
        const d = (ev as CustomEvent<Announce>).detail;
        if (d?.info && d.provider && !d.provider.isClara) {
          let entry = guarded.get(d.info.rdns);
          if (!entry) { entry = { info: d.info, provider: guardProvider(d.provider) }; guarded.set(d.info.rdns, entry); reportWallets(); }
          return realDispatch(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: d.info, provider: entry.provider }) }));
        }
      }
      return realDispatch(ev);
    };
    // When a dApp asks for providers, (re-)announce the guarded versions.
    window.addEventListener('eip6963:requestProvider', () => {
      setTimeout(() => { for (const e of guarded.values()) realDispatch(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze(e) })); }, 0);
    });
    // Prompt any wallets already present to announce (so we catch + wrap them).
    realDispatch(new Event('eip6963:requestProvider'));
    setTimeout(reportWallets, 600);

    function safeParse(v: unknown): unknown {
      if (typeof v !== 'string') return v;
      try { return JSON.parse(v); } catch { return v; }
    }
  },
});
