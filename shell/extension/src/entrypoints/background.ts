import { call } from '../lib/bridge';

// Incoming dApp requests wait here for the user's decision in the panel.
interface PendingReq {
  id: string;
  request: { kind: string; to?: string; value?: string; data?: string; messageHex?: string; payload?: unknown };
  explanation: unknown;
  tabId?: number;
}
const queue = new Map<string, PendingReq>();

export default defineBackground(() => {
  // Clicking the toolbar icon opens the side panel.
  browser.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(() => {});

  browser.runtime.onMessage.addListener((msg: {
    scope?: string; type?: string; id?: string; request?: PendingReq['request'];
    method?: string; params?: unknown;
  }, sender, sendResponse: (r: unknown) => void) => {
    // ---- from the relay content script: a dApp request intercepted on a page
    if (msg.scope === 'clara-page' && msg.type === 'request' && msg.id && msg.request) {
      (async () => {
        try {
          const explanation = await call('explain', msg.request);
          queue.set(msg.id!, { id: msg.id!, request: msg.request!, explanation, tabId: sender.tab?.id });
          browser.runtime.sendMessage({ scope: 'clara-panel', type: 'pending', pending: [...queue.values()] }).catch(() => {});
          sendResponse({ ok: true, staged: true });
        } catch (e) {
          sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      })();
      return true; // async sendResponse
    }
    // ---- from the panel: decide a staged request
    if (msg.scope === 'clara-panel' && msg.type === 'decide' && msg.id) {
      (async () => {
        const item = queue.get(msg.id!);
        if (!item) return sendResponse({ ok: false, error: 'no such pending request' });
        queue.delete(msg.id!);
        let result: unknown = { rejected: true };
        try {
          if (msg.params === 'approve' && item.request.kind === 'transaction') {
            result = await call('sendIncoming', { to: item.request.to, value: item.request.value, data: item.request.data });
          }
          // notify the page (approve → tx result; reject → error)
          if (item.tabId !== undefined) {
            browser.tabs.sendMessage(item.tabId, { scope: 'clara-relay', type: 'result', id: item.id,
              ok: msg.params === 'approve', result }).catch(() => {});
          }
          browser.runtime.sendMessage({ scope: 'clara-panel', type: 'pending', pending: [...queue.values()] }).catch(() => {});
          sendResponse({ ok: true, result });
        } catch (e) {
          sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      })();
      return true;
    }
    // ---- from the panel: plain engine calls (status / construct / confirmSend / explain)
    if (msg.scope === 'clara-panel' && msg.type === 'call' && msg.method) {
      call(msg.method, msg.params)
        .then((result) => sendResponse({ ok: true, result }))
        .catch((e: Error) => sendResponse({ ok: false, error: e.message }));
      return true;
    }
    if (msg.scope === 'clara-panel' && msg.type === 'getPending') {
      sendResponse({ ok: true, pending: [...queue.values()] });
      return false;
    }
    return false;
  });
});
