// MAIN-world GUARD provider (Mode B). Clara sits IN FRONT of your real wallet:
// it wraps window.ethereum, checks every signing request against the policy
// engine, BLOCKS dangerous ones before they reach your wallet, and FORWARDS
// safe/approved ones to the real wallet downstream. Clara never holds keys here.
export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    type Provider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; on?: (...a: unknown[]) => void; removeListener?: (...a: unknown[]) => void };
    const w = window as unknown as { ethereum?: Provider };

    // The user's real wallet, captured as the downstream signer. If a wallet
    // was injected before us, take it now; otherwise our setter grabs it when
    // the wallet assigns window.ethereum (handles any injection order).
    let downstream: Provider | undefined = w.ethereum && !(w.ethereum as { isClara?: boolean }).isClara ? w.ethereum : undefined;

    const replies = new Map<string, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
    window.addEventListener('message', (ev) => {
      const d = ev.data as { scope?: string; type?: string; id?: string; ok?: boolean; result?: unknown };
      if (ev.source !== window || d?.scope !== 'clara-inject' || d.type !== 'result' || !d.id) return;
      const p = replies.get(d.id);
      if (!p) return;
      replies.delete(d.id);
      d.ok ? p.resolve(d.result) : p.reject({ code: 4001, message: 'Clara blocked this request' });
    });

    // Ask Clara for a verdict + user decision on a signing request.
    // Resolves to { decision: 'approved' } or rejects (blocked).
    const check = (kind: string, fields: Record<string, unknown>) => {
      const id = crypto.randomUUID();
      return new Promise<{ decision: string }>((resolve, reject) => {
        replies.set(id, { resolve: (v) => resolve(v as { decision: string }), reject });
        window.postMessage({ scope: 'clara-page', type: 'request', id, request: { kind, ...fields, guard: true, hasDownstream: !!downstream } }, '*');
      });
    };

    // Clara's own wallet address (used only when there is NO downstream wallet).
    let claraAddress = '0x0000000000000000000000000000000000000000';
    window.addEventListener('message', (ev) => {
      const d = ev.data as { scope?: string; type?: string; address?: string };
      if (ev.source === window && d?.scope === 'clara-inject' && d.type === 'address' && d.address) claraAddress = d.address;
    });
    window.postMessage({ scope: 'clara-page', type: 'hello' }, '*');

    const SIGNING = new Set(['eth_sendTransaction', 'eth_signTypedData_v4', 'personal_sign']);

    const guard: Provider & { isClara: boolean } = {
      isClara: true,
      request: async (args) => {
        const { method, params } = args;
        // Read-only calls: transparently forward to the real wallet if present.
        if (!SIGNING.has(method)) {
          if (downstream) return downstream.request(args);
          switch (method) {
            case 'eth_chainId': return '0xaa36a7';
            case 'eth_requestAccounts':
            case 'eth_accounts': return [claraAddress];
            default: throw { code: 4200, message: `Clara: ${method} not supported (no wallet attached)` };
          }
        }
        // Signing calls: CHECK first, then block or forward.
        let staged: Record<string, unknown>;
        if (method === 'eth_sendTransaction') {
          const tx = (params?.[0] ?? {}) as { to?: string; value?: string; data?: string };
          staged = { kind: 'transaction', to: tx.to, value: tx.value, data: tx.data };
        } else if (method === 'eth_signTypedData_v4') {
          staged = { kind: 'typedData', payload: safeParse(params?.[1]) };
        } else {
          staged = { kind: 'personalSign', messageHex: params?.[0] };
        }
        // Throws (code 4001) if Clara/user blocks it — dApp never reaches a signer.
        await check(staged.kind as string, staged);
        // Approved: forward the ORIGINAL request to the real wallet, which signs.
        if (downstream) return downstream.request(args);
        // No downstream wallet attached → Clara's own testnet wallet executes.
        return execViaClara(staged);
      },
      on: (...a) => downstream?.on?.(...a),
      removeListener: (...a) => downstream?.removeListener?.(...a),
    };

    // When there is no real wallet, an approved transaction is executed by
    // Clara's attached testnet wallet through the engine (custody fallback).
    const execViaClara = (staged: Record<string, unknown>) => {
      const id = crypto.randomUUID();
      return new Promise((resolve, reject) => {
        replies.set(id, { resolve, reject });
        window.postMessage({ scope: 'clara-page', type: 'exec', id, request: staged }, '*');
      });
    };

    // Install the guard, capturing any wallet that assigns window.ethereum later.
    try {
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        get: () => guard,
        set: (v: Provider) => { if (v && !(v as { isClara?: boolean }).isClara) downstream = v; },
      });
    } catch {
      w.ethereum = guard; // fallback if the property is locked
    }

    // ---- EIP-6963: discover every installed wallet (MetaMask, Rabby, Coinbase…)
    // so Clara can show them and guard whichever one a dApp uses.
    type Eip6963 = { info: { uuid: string; name: string; icon: string; rdns: string }; provider: Provider };
    const wallets = new Map<string, { uuid: string; name: string; icon: string; rdns: string }>();
    let reportTimer: ReturnType<typeof setTimeout> | undefined;
    const reportWallets = () => {
      clearTimeout(reportTimer);
      reportTimer = setTimeout(() => {
        const list = [...wallets.values()];
        // include the legacy injected wallet if it did not announce via 6963
        if (downstream && !list.some((w) => (downstream as { _rdns?: string })._rdns === w.rdns))
          list.push({ uuid: 'legacy', name: 'Injected wallet', icon: '', rdns: 'legacy.injected' });
        window.postMessage({ scope: 'clara-page', type: 'wallets', wallets: list }, '*');
      }, 250);
    };
    window.addEventListener('eip6963:announceProvider', (e) => {
      const d = (e as CustomEvent<Eip6963>).detail;
      if (!d?.info) return;
      wallets.set(d.info.rdns || d.info.uuid, { uuid: d.info.uuid, name: d.info.name, icon: d.info.icon, rdns: d.info.rdns });
      // capture the first announced provider as the downstream signer if none yet
      if (!downstream && d.provider && !(d.provider as { isClara?: boolean }).isClara) downstream = d.provider;
      reportWallets();
    });
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    setTimeout(reportWallets, 600); // report legacy-only wallets too

    function safeParse(v: unknown): unknown {
      if (typeof v !== 'string') return v;
      try { return JSON.parse(v); } catch { return v; }
    }
  },
});
