// ISOLATED-world relay: page window messages ⇄ extension runtime messages.
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  main() {
    // page → background
    window.addEventListener('message', (ev) => {
      const d = ev.data as { scope?: string; type?: string; id?: string; request?: { to?: string; value?: string; data?: string }; wallets?: unknown };
      if (ev.source !== window || d?.scope !== 'clara-page') return;
      if ((d.type === 'request' || d.type === 'exec') && d.id) {
        browser.runtime.sendMessage({ scope: 'clara-page', type: d.type, id: d.id, request: d.request })
          .catch(() => window.postMessage({ scope: 'clara-inject', type: 'result', id: d.id, ok: false }, '*'));
      }
      if (d.type === 'wallets') {
        browser.runtime.sendMessage({ scope: 'clara-page', type: 'wallets', wallets: (d as { wallets?: unknown }).wallets }).catch(() => {});
      }
      if (d.type === 'hello') {
        browser.runtime.sendMessage({ scope: 'clara-panel', type: 'call', method: 'status' })
          .then((r: { ok: boolean; result?: { address?: string } }) => {
            if (r?.ok && r.result?.address)
              window.postMessage({ scope: 'clara-inject', type: 'address', address: r.result.address }, '*');
          }).catch(() => {});
      }
    });
    // background → page (decision results)
    browser.runtime.onMessage.addListener((msg: { scope?: string; type?: string; id?: string; ok?: boolean; result?: unknown }) => {
      if (msg?.scope === 'clara-relay' && msg.type === 'result' && msg.id) {
        window.postMessage({ scope: 'clara-inject', type: 'result', id: msg.id, ok: msg.ok, result: msg.result }, '*');
      }
    });
  },
});
