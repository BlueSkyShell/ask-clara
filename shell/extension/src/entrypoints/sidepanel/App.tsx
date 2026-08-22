import React, { useCallback, useEffect, useRef, useState } from 'react';

type Verdict = { decision: 'ALLOW' | 'DENY'; ruleName: string | null; reason: string };
type Explanation = { verdict: Verdict; narration: string; orb: 'safe' | 'warning'; narrationSource: string };
interface PendingItem {
  id: string;
  request: { kind: string; to?: string; value?: string };
  explanation: Explanation;
}
type FeedItem =
  | { t: 'user'; text: string }
  | { t: 'clara'; kind: string; text: string; link?: { href: string; label: string } }
  | { t: 'built'; confirmId: string; text: string; narration: string; done?: boolean };

const send = (msg: Record<string, unknown>) =>
  browser.runtime.sendMessage({ scope: 'clara-panel', ...msg }) as Promise<{ ok: boolean; result?: unknown; error?: string }>;

export default function App() {
  const [up, setUp] = useState(false);
  const [address, setAddress] = useState('');
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  const orb = pending.some((p) => p.explanation.orb === 'warning') ? 'warning'
    : pending.length || busy ? 'idle'
    : feed.some((f) => f.t === 'built') ? 'safe' : 'idle';

  const refresh = useCallback(async () => {
    try {
      const s = await send({ type: 'call', method: 'status' });
      if (s.ok) { setUp(true); setAddress((s.result as { address: string }).address); setErr(''); }
      else { setUp(false); setErr(s.error ?? ''); }
      const p = await send({ type: 'getPending' });
      if (p.ok) setPending((p as unknown as { pending: PendingItem[] }).pending ?? []);
    } catch (e) { setUp(false); setErr(e instanceof Error ? e.message : String(e)); }
  }, []);

  useEffect(() => {
    refresh();
    const onMsg = (msg: { scope?: string; type?: string; pending?: PendingItem[] }) => {
      if (msg?.scope === 'clara-panel' && msg.type === 'pending') setPending(msg.pending ?? []);
    };
    browser.runtime.onMessage.addListener(onMsg);
    const t = setInterval(refresh, 5000);
    return () => { browser.runtime.onMessage.removeListener(onMsg); clearInterval(t); };
  }, [refresh]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [feed, pending]);

  const decide = async (id: string, action: 'approve' | 'reject') => {
    setBusy(true);
    const r = await send({ type: 'decide', id, params: action });
    setBusy(false);
    if (r.ok && action === 'approve') {
      const res = r.result as { txHash?: string; explorerUrl?: string };
      if (res?.txHash) setFeed((f) => [...f, { t: 'clara', kind: 'sent', text: 'Sent — confirmed on Sepolia.', link: { href: res.explorerUrl!, label: res.txHash!.slice(0, 18) + '…' } }]);
    }
    if (!r.ok) setErr(r.error ?? 'decision failed');
  };

  const ask = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setFeed((f) => [...f, { t: 'user', text }]);
    setBusy(true);
    const r = await send({ type: 'call', method: 'construct', params: text });
    setBusy(false);
    if (!r.ok) { setFeed((f) => [...f, { t: 'clara', kind: 'error', text: r.error ?? 'engine error' }]); return; }
    const o = r.result as { kind: string; reply?: string; question?: string; reason?: string; message?: string;
      confirmId?: string; transfer?: { amountWei: string; recipientLabel: string | null; to: string }; explanation?: Explanation };
    switch (o.kind) {
      case 'chat': setFeed((f) => [...f, { t: 'clara', kind: 'chat', text: o.reply! }]); break;
      case 'clarify': setFeed((f) => [...f, { t: 'clara', kind: 'clarify', text: o.question! }]); break;
      case 'refused': setFeed((f) => [...f, { t: 'clara', kind: 'refused', text: '🛡 ' + o.reason! }]); break;
      case 'error': setFeed((f) => [...f, { t: 'clara', kind: 'error', text: o.message! }]); break;
      case 'built': {
        const eth = (Number(o.transfer!.amountWei) / 1e18).toString();
        setFeed((f) => [...f, { t: 'built', confirmId: o.confirmId!,
          text: `Built: send ${eth} ETH to ${o.transfer!.recipientLabel ?? o.transfer!.to}`,
          narration: o.explanation!.narration }]);
        break;
      }
    }
  };

  const confirm = async (confirmId: string) => {
    setBusy(true);
    const r = await send({ type: 'call', method: 'confirmSend', params: confirmId });
    setBusy(false);
    setFeed((f) => f.map((it) => it.t === 'built' && it.confirmId === confirmId ? { ...it, done: true } : it));
    if (r.ok) {
      const res = r.result as { txHash: string; explorerUrl: string };
      setFeed((f) => [...f, { t: 'clara', kind: 'sent', text: 'Sent — confirmed on Sepolia.', link: { href: res.explorerUrl, label: res.txHash.slice(0, 18) + '…' } }]);
    } else {
      setFeed((f) => [...f, { t: 'clara', kind: 'refused', text: '🛡 ' + (r.error ?? 'send blocked') }]);
    }
  };

  return (
    <>
      <div className="head">
        <img src="/orb.png" alt="" className={`orb-${orb}`} />
        <b>Clara</b>
        <span className="addr">{address ? address.slice(0, 8) + '…' + address.slice(-4) : ''}</span>
        <span className={`dot ${up ? 'up' : ''}`} title={up ? 'engine connected' : 'engine offline'} />
      </div>
      {!up && <div className="err">{err || 'Engine offline. Run: pnpm -C engine daemon'}</div>}
      <div className="feed">
        {pending.length === 0 && feed.length === 0 && (
          <div className="empty">Nothing pending. Browse to a dApp — I read every request before you sign.
          Or just tell me things like “send 0.001 ETH to alice”.</div>
        )}
        {pending.map((p) => (
          <div key={p.id} className={`card ${p.explanation.orb}`}>
            <div className="tag">{p.explanation.verdict.decision === 'DENY' ? `blocked · ${p.explanation.verdict.ruleName}` : 'incoming request'}</div>
            <p>{p.explanation.narration}</p>
            <div className="meta">{p.request.kind} → {p.request.to ?? '(signature)'}</div>
            <div className="row">
              {p.explanation.verdict.decision === 'ALLOW' && (
                <button className="approve" disabled={busy} onClick={() => decide(p.id, 'approve')}>Approve &amp; send</button>
              )}
              <button className="reject" disabled={busy} onClick={() => decide(p.id, 'reject')}>Reject</button>
            </div>
          </div>
        ))}
        {feed.map((m, i) =>
          m.t === 'user' ? <div key={i} className="msg user">{m.text}</div>
          : m.t === 'built' ? (
            <div key={i} className="card safe">
              <div className="tag">ready — needs your confirmation</div>
              <p>{m.text}</p>
              <p style={{ marginTop: 6, color: 'var(--muted)' }}>{m.narration}</p>
              {!m.done && <div className="row">
                <button className="approve" disabled={busy} onClick={() => confirm(m.confirmId)}>Confirm send</button>
              </div>}
            </div>
          ) : (
            <div key={i} className="msg clara">
              <span className="k">{m.kind}</span>{m.text}
              {m.link && <> <a href={m.link.href} target="_blank" rel="noreferrer">{m.link.label}</a></>}
            </div>
          )
        )}
        <div ref={bottom} />
      </div>
      <form className="compose" onSubmit={(e) => { e.preventDefault(); ask(); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? 'thinking…' : 'send 0.001 ETH to alice · what is gas?'} disabled={busy || !up} />
        <button type="submit" disabled={busy || !up}>Ask</button>
      </form>
    </>
  );
}
