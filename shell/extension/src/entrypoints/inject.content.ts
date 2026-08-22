// MAIN-world provider shim. Installs window.ethereum ONLY when no wallet is
// present (Clara never fights a real wallet); every dApp request is relayed to
// Clara for explanation before anything can be signed.
export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    const w = window as unknown as { ethereum?: unknown };
    if (w.ethereum) return; // a real wallet is installed — demo shim stands down
    const replies = new Map<string, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();

    window.addEventListener('message', (ev) => {
      const d = ev.data as { scope?: string; type?: string; id?: string; ok?: boolean; result?: unknown };
      if (ev.source !== window || d?.scope !== 'clara-inject' || d.type !== 'result' || !d.id) return;
      const p = replies.get(d.id);
      if (!p) return;
      replies.delete(d.id);
      if (d.ok) p.resolve(d.result);
      else p.reject({ code: 4001, message: 'Clara: request rejected' });
    });

    const relay = (kind: string, fields: Record<string, unknown>) => {
      const id = crypto.randomUUID();
      return new Promise((resolve, reject) => {
        replies.set(id, { resolve, reject });
        window.postMessage({ scope: 'clara-page', type: 'request', id, request: { kind, ...fields } }, '*');
      });
    };

    const ADDRESS_PLACEHOLDER = '0x0000000000000000000000000000000000000000';
    let address = ADDRESS_PLACEHOLDER;
    window.addEventListener('message', (ev) => {
      const d = ev.data as { scope?: string; type?: string; address?: string };
      if (ev.source === window && d?.scope === 'clara-inject' && d.type === 'address' && d.address) address = d.address;
    });
    window.postMessage({ scope: 'clara-page', type: 'hello' }, '*');

    w.ethereum = {
      isClara: true,
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        switch (method) {
          case 'eth_chainId': return '0xaa36a7'; // Sepolia
          case 'eth_requestAccounts':
          case 'eth_accounts': return [address];
          case 'eth_sendTransaction': {
            const tx = (params?.[0] ?? {}) as { to?: string; value?: string; data?: string };
            return relay('transaction', { to: tx.to, value: tx.value, data: tx.data });
          }
          case 'eth_signTypedData_v4': return relay('typedData', { payload: safeParse(params?.[1]) });
          case 'personal_sign': return relay('personalSign', { messageHex: params?.[0] });
          default: throw { code: 4200, message: `Clara demo provider: ${method} not supported` };
        }
      },
      on() { /* events not needed for the demo */ },
      removeListener() { /* noop */ },
    };
    function safeParse(v: unknown): unknown {
      if (typeof v !== 'string') return v;
      try { return JSON.parse(v); } catch { return v; }
    }
  },
});
