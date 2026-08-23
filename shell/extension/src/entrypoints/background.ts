import { call } from '../lib/bridge';

// Incoming dApp requests wait here for the user's decision in the panel.
interface PendingReq {
  id: string;
  request: { kind: string; to?: string; value?: string; data?: string; messageHex?: string; payload?: unknown; guard?: boolean; hasDownstream?: boolean };
  explanation: unknown;
  tabId?: number;
}
const queue = new Map<string, PendingReq>();

// Wallets discovered on pages via EIP-6963 (MetaMask, Rabby, Coinbase…).
interface WalletInfo { uuid: string; name: string; icon: string; rdns: string }
let wallets: WalletInfo[] = [];

// Clara-built sends awaiting the page wallet's signature (construct → your wallet).
// id → the panel's sendResponse, resolved when the page reports the tx hash.
const externalPending = new Map<string, { respond: (r: unknown) => void; timer: ReturnType<typeof setTimeout> }>();
function settleExternal(id: string, r: unknown) {
  const e = externalPending.get(id);
  if (!e) return;
  externalPending.delete(id);
  clearTimeout(e.timer);
  e.respond(r);
}

// Toolbar-icon badge — visible even when the side panel is closed.
function updateBadge() {
  const n = queue.size;
  browser.action.setBadgeText({ text: n ? String(n) : '' }).catch(() => {});
  browser.action.setBadgeBackgroundColor({ color: '#ffb020' }).catch(() => {});
  browser.action.setTitle({ title: n ? `Clara — ${n} request${n > 1 ? 's' : ''} to review` : 'Open Clara' }).catch(() => {});
}

// System notification so you're alerted while the panel is closed.
function notify(item: PendingReq) {
  const v = (item.explanation as { verdict?: { decision?: string; ruleName?: string | null }; narration?: string })?.verdict;
  const deny = v?.decision === 'DENY';
  browser.notifications?.create?.(`clara-${item.id}`, {
    type: 'basic',
    iconUrl: browser.runtime.getURL('/icon-128.png' as never),
    title: deny ? '⛔ Clara caught a risky transaction' : 'Clara — transaction to review',
    message: deny
      ? `Blocked by "${v?.ruleName ?? 'policy'}". Open Clara to review before your wallet signs.`
      : 'A site wants your wallet to sign. Open Clara to review.',
    priority: 2,
  }).catch(() => {});
}

export default defineBackground(() => {
  // Clicking the toolbar icon opens the side panel.
  browser.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(() => {});

  browser.runtime.onMessage.addListener((msg: {
    scope?: string; type?: string; id?: string; request?: PendingReq['request'];
    method?: string; params?: unknown;
    tx?: { to?: string; value?: string; data?: string }; ok?: boolean; hash?: string; error?: string;
  }, sender, sendResponse: (r: unknown) => void) => {
    // (wallets messages carry a `wallets` field, handled below)
    // ---- wallet discovery from a page (EIP-6963)
    if (msg.scope === 'clara-page' && msg.type === 'wallets') {
      wallets = ((msg as { wallets?: WalletInfo[] }).wallets ?? []).filter((w) => w && w.name);
      browser.runtime.sendMessage({ scope: 'clara-panel', type: 'walletsUpdated' }).catch(() => {});
      return false;
    }
    // ---- panel asks for the discovered wallets
    if (msg.scope === 'clara-panel' && msg.type === 'getWallets') {
      sendResponse({ ok: true, wallets });
      return false;
    }
    // ---- panel → sign a Clara-built transfer with YOUR wallet on the active tab
    if (msg.scope === 'clara-panel' && msg.type === 'externalSend' && msg.id && msg.tx) {
      (async () => {
        const id = msg.id!;
        const tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true })
          .then((t) => t.length ? t : browser.tabs.query({ active: true })).catch(() => []);
        const tabId = tabs[0]?.id;
        if (tabId === undefined) { sendResponse({ ok: false, error: 'No active tab with a wallet. Open the site where your wallet is connected, then confirm again.' }); return; }
        const timer = setTimeout(() => settleExternal(id, { ok: false, error: 'Your wallet didn’t respond in time.' }), 120_000);
        externalPending.set(id, { respond: sendResponse, timer });
        browser.tabs.sendMessage(tabId, { scope: 'clara-relay', type: 'externalSend', id, tx: msg.tx })
          .catch(() => settleExternal(id, { ok: false, error: 'Couldn’t reach that tab. Reload the page with your wallet and try again.' }));
      })();
      return true; // async — sendResponse fires when the page reports back
    }
    // ---- page → result of a Clara-built send the wallet signed (or rejected)
    if (msg.scope === 'clara-page' && msg.type === 'externalResult' && msg.id) {
      settleExternal(msg.id, msg.ok ? { ok: true, result: { txHash: msg.hash } } : { ok: false, error: msg.error ?? 'Your wallet rejected the transaction.' });
      return false;
    }
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
          const staged = { id: msg.id!, request: msg.request!, explanation, tabId: sender.tab?.id };
          queue.set(msg.id!, staged);
          updateBadge();
          notify(staged);
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
          browser.notifications?.clear?.(`clara-${item.id}`).catch(() => {});
          updateBadge();
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
