// ISOLATED-world relay: page window messages ⇄ extension runtime messages.
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  main() {
    // page → background
    window.addEventListener('message', (ev) => {
      const d = ev.data as { scope?: string; type?: string; id?: string; request?: unknown };
      if (ev.source !== window || d?.scope !== 'clara-page') return;
      if (d.type === 'request' && d.id) {
        browser.runtime.sendMessage({ scope: 'clara-page', type: 'request', id: d.id, request: d.request })
          .catch(() => window.postMessage({ scope: 'clara-inject', type: 'result', id: d.id, ok: false }, '*'));
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
