import { call } from '../lib/bridge';

// Incoming dApp requests wait here for the user's decision in the panel.
interface PendingReq {
  id: string;
  request: { kind: string; to?: string; value?: string; data?: string; messageHex?: string; payload?: unknown; guard?: boolean; hasDownstream?: boolean };
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
    // ---- GUARD custody-fallback: no real wallet attached, execute via Clara's testnet wallet
    if (msg.scope === 'clara-page' && msg.type === 'exec' && msg.id && msg.request) {
      (async () => {
        try {
          const r = msg.request!;
          const result = await call('sendIncoming', { to: r.to, value: r.value, data: r.data });
          if (sender.tab?.id !== undefined)
            browser.tabs.sendMessage(sender.tab.id, { scope: 'clara-relay', type: 'result', id: msg.id, ok: true, result }).catch(() => {});
          sendResponse({ ok: true });
        } catch (e) {
          if (sender.tab?.id !== undefined)
            browser.tabs.sendMessage(sender.tab.id, { scope: 'clara-relay', type: 'result', id: msg.id, ok: false }).catch(() => {});
          sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      })();
      return true;
    }
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
        const approve = msg.params === 'approve';
        let result: unknown = approve ? { decision: 'approved' } : { rejected: true };
        try {
          // GUARD MODE (Mode B): don't execute — hand the decision back to the page,
          // which forwards an approved request to your real wallet to sign.
          // LEGACY custody mode (no guard flag): Clara's own wallet executes on approve.
          if (approve && !item.request.guard && item.request.kind === 'transaction') {
            result = await call('sendIncoming', { to: item.request.to, value: item.request.value, data: item.request.data });
          }
          // notify the page (approve → decision/tx result; reject → block)
          if (item.tabId !== undefined) {
            browser.tabs.sendMessage(item.tabId, { scope: 'clara-relay', type: 'result', id: item.id,
              ok: approve, result }).catch(() => {});
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
