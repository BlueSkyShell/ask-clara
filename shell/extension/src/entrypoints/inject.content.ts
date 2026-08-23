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
    // Keep the wrapped provider (for the dApp) AND the real one (for Clara-built
    // sends, which are already policy-checked and go straight to the wallet).
    const guarded = new Map<string, { info: Info; provider: Provider; real: Provider }>();

    // Pick a wallet to sign a Clara-built transfer: the legacy provider if the
    // page uses one, else the first EIP-6963 wallet discovered.
    const pickWallet = (): Provider | undefined => {
      if (downstream) return downstream;
      for (const e of guarded.values()) return e.real;
      return undefined;
    };

    // ---- Clara-built send: your OWN wallet signs (construct → external wallet).
    // Calls the REAL provider directly (guard already ran the policy re-check in
    // the engine), so MetaMask/Rabby shows its own confirmation and broadcasts.
    window.addEventListener('message', (ev) => {
      const d = ev.data as { scope?: string; type?: string; id?: string; tx?: { to?: string; value?: string; data?: string } };
      if (ev.source !== window || d?.scope !== 'clara-cmd' || d.type !== 'externalSend' || !d.id) return;
      (async () => {
        try {
          const real = pickWallet();
          if (!real) throw new Error('No wallet is connected on this page. Open the site where your wallet is connected, then try again.');
          let accounts = (await real.request({ method: 'eth_accounts' })) as string[] | undefined;
          if (!accounts?.length) accounts = (await real.request({ method: 'eth_requestAccounts' })) as string[];
          const from = accounts?.[0];
          if (!from) throw new Error('Your wallet has no account available to sign.');
          const hash = await real.request({ method: 'eth_sendTransaction', params: [{ from, to: d.tx!.to, value: d.tx!.value, data: d.tx!.data ?? '0x' }] });
          window.postMessage({ scope: 'clara-page', type: 'externalResult', id: d.id, ok: true, hash }, '*');
        } catch (e) {
          const m = e as { code?: number; message?: string };
          const error = m?.code === 4001 ? 'You rejected the transaction in your wallet.' : (m?.message ?? 'Your wallet rejected the transaction.');
          window.postMessage({ scope: 'clara-page', type: 'externalResult', id: d.id, ok: false, error }, '*');
        }
      })();
    });
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
          if (!entry) { entry = { info: d.info, provider: guardProvider(d.provider), real: d.provider }; guarded.set(d.info.rdns, entry); reportWallets(); }
          return realDispatch(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: d.info, provider: entry.provider }) }));
        }
      }
      return realDispatch(ev);
    };
    // When a dApp asks for providers, (re-)announce the guarded versions.
    window.addEventListener('eip6963:requestProvider', () => {
      setTimeout(() => { for (const e of guarded.values()) realDispatch(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: e.info, provider: e.provider }) })); }, 0);
    });
    // Prompt any wallets already present to announce (so we catch + wrap them).
    realDispatch(new Event('eip6963:requestProvider'));
    setTimeout(reportWallets, 600);

    // ---- Announce Clara ITSELF as a discoverable EIP-6963 wallet, so modern
    // dApps (which use EIP-6963, not window.ethereum) route signing through the
    // guard even when no other wallet is installed. Approved sends execute via
    // Clara's own testnet wallet; every request still passes check() first.
    const CLARA_ICON = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">'
      + '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fd6ff"/><stop offset="1" stop-color="#b9a8ff"/></linearGradient></defs>'
      + '<rect width="96" height="96" rx="24" fill="#0a0e1f"/>'
      + '<circle cx="48" cy="48" r="22" fill="none" stroke="url(#g)" stroke-width="5"/>'
      + '<circle cx="48" cy="48" r="8" fill="url(#g)"/></svg>');
    const claraInfo: Info = { uuid: 'c1a7a000-0000-4000-8000-00000000c1a7', name: 'Clara', icon: CLARA_ICON, rdns: 'app.askclara.guard' };
    const announceClara = () => realDispatch(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: claraInfo, provider: legacyGuard }) }));
    window.addEventListener('eip6963:requestProvider', () => setTimeout(announceClara, 0));
    announceClara();

    function safeParse(v: unknown): unknown {
      if (typeof v !== 'string') return v;
      try { return JSON.parse(v); } catch { return v; }
    }
  },
});
