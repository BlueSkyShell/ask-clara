import React, { useCallback, useEffect, useRef, useState } from 'react';

type Verdict = { decision: 'ALLOW' | 'DENY'; ruleName: string | null; reason: string };
type Explanation = { verdict: Verdict; narration: string; orb: 'safe' | 'warning'; narrationSource: string };
interface PendingItem { id: string; request: { kind: string; to?: string }; explanation: Explanation }
interface Info {
  address: string; chain: string; verified: boolean;
  contacts: Record<string, string>;
  caps: { perTxEth: string; sessionEth: string };
  protections: { title: string; detail: string }[];
}
type Activity = { kind: 'block' | 'allow'; label: string; sub: string; at: number };
type Chat =
  | { t: 'user'; text: string }
  | { t: 'clara'; kind: string; text: string; link?: { href: string; label: string } }
  | { t: 'built'; confirmId: string; text: string; narration: string; done?: boolean };
type Tab = 'shield' | 'chat' | 'settings';

const send = (msg: Record<string, unknown>) =>
  browser.runtime.sendMessage({ scope: 'clara-panel', ...msg }) as Promise<{ ok: boolean; result?: unknown; error?: string }>;
const short = (a: string) => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';
const clock = (t: number) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'now' : s < 3600 ? Math.floor(s / 60) + 'm' : Math.floor(s / 3600) + 'h'; };

export default function App() {
  const [up, setUp] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState<Info | null>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [feed, setFeed] = useState<Chat[]>([]);
  const [tab, setTab] = useState<Tab>('shield');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedMsg, setSignedMsg] = useState('');
  const [wallets, setWallets] = useState<{ uuid: string; name: string; icon: string; rdns: string }[]>([]);
  const bottom = useRef<HTMLDivElement>(null);

  const warn = pending.some((p) => p.explanation.orb === 'warning');
  const orb = warn ? 'warning' : busy ? 'thinking' : activity[0]?.kind === 'allow' ? 'safe' : 'idle';

  const refresh = useCallback(async () => {
    try {
      const s = await send({ type: 'call', method: 'status' });
      if (s.ok) { setUp(true); setInfo(s.result as Info); setErr(''); }
      else { setUp(false); setErr(s.error ?? ''); }
      const p = await send({ type: 'getPending' });
      if (p.ok) setPending((p as unknown as { pending: PendingItem[] }).pending ?? []);
      const w = await send({ type: 'getWallets' });
      if (w.ok) setWallets((w as unknown as { wallets: { uuid: string; name: string; icon: string; rdns: string }[] }).wallets ?? []);
    } catch (e) { setUp(false); setErr(e instanceof Error ? e.message : String(e)); }
  }, []);

  useEffect(() => {
    refresh();
    const onMsg = (m: { scope?: string; type?: string; pending?: PendingItem[] }) => {
      if (m?.scope === 'clara-panel' && m.type === 'pending') setPending(m.pending ?? []);
      if (m?.scope === 'clara-panel' && m.type === 'walletsUpdated') refresh();
    };
    browser.runtime.onMessage.addListener(onMsg);
    const t = setInterval(refresh, 5000);
    return () => { browser.runtime.onMessage.removeListener(onMsg); clearInterval(t); };
  }, [refresh]);
  useEffect(() => { if (tab === 'chat') bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [feed, tab]);
  useEffect(() => { if (warn) setTab('shield'); }, [warn]);

  const decide = async (item: PendingItem, action: 'approve' | 'reject') => {
    setBusy(true);
    await send({ type: 'decide', id: item.id, params: action });
    setBusy(false);
    const to = item.request.to ?? '(signature)';
    const entry: Activity = action === 'approve'
      ? { kind: 'allow', label: 'Allowed — forwarded to your wallet', sub: `${item.request.kind} → ${short(to)}`, at: Date.now() }
      : { kind: 'block', label: `Blocked · ${item.explanation.verdict.ruleName ?? 'policy'}`, sub: `${item.request.kind} → ${short(to)}`, at: Date.now() };
    setActivity((a) => [entry, ...a].slice(0, 30));
  };

  const ask = async () => {
    const text = input.trim(); if (!text || busy) return;
    setInput(''); setFeed((f) => [...f, { t: 'user', text }]); setBusy(true);
    const r = await send({ type: 'call', method: 'construct', params: text }); setBusy(false);
    if (!r.ok) { setFeed((f) => [...f, { t: 'clara', kind: 'error', text: r.error ?? 'engine error' }]); return; }
    const o = r.result as { kind: string; reply?: string; question?: string; reason?: string; message?: string;
      confirmId?: string; transfer?: { amountWei: string; recipientLabel: string | null; to: string }; explanation?: Explanation };
    if (o.kind === 'chat') setFeed((f) => [...f, { t: 'clara', kind: 'answer', text: o.reply! }]);
    else if (o.kind === 'clarify') setFeed((f) => [...f, { t: 'clara', kind: 'needs a detail', text: o.question! }]);
    else if (o.kind === 'refused') setFeed((f) => [...f, { t: 'clara', kind: 'refused', text: '🛡 ' + o.reason! }]);
    else if (o.kind === 'error') setFeed((f) => [...f, { t: 'clara', kind: 'error', text: o.message! }]);
    else if (o.kind === 'built') {
      const eth = (Number(o.transfer!.amountWei) / 1e18).toString();
      setFeed((f) => [...f, { t: 'built', confirmId: o.confirmId!, narration: o.explanation!.narration,
        text: `Send ${eth} ETH to ${o.transfer!.recipientLabel ?? short(o.transfer!.to)}` }]);
    }
  };
  const confirm = async (confirmId: string) => {
    setBusy(true);
    const r = await send({ type: 'call', method: 'confirmSend', params: confirmId }); setBusy(false);
    setFeed((f) => f.map((it) => it.t === 'built' && it.confirmId === confirmId ? { ...it, done: true } : it));
    if (r.ok) { const res = r.result as { txHash: string; explorerUrl: string };
      setFeed((f) => [...f, { t: 'clara', kind: 'sent', text: 'Sent — confirmed on Sepolia.', link: { href: res.explorerUrl, label: short(res.txHash) } }]); }
    else setFeed((f) => [...f, { t: 'clara', kind: 'blocked', text: '🛡 ' + (r.error ?? 'send blocked') }]);
  };

  const verify = async () => {
    setBusy(true);
    const r = await send({ type: 'call', method: 'verifyWallet' });
    setBusy(false);
    if (r.ok) { const res = r.result as { verified: boolean; message: string }; setSignedMsg(res.message); await refresh(); }
    else setErr(r.error ?? 'verification failed');
  };

  return (
    <>
      <div className="hdr">
        <div className="orb"><img src="/orb.png" alt="" className={`orb-${orb}`} /></div>
        <div>
          <div className="name">Clara</div>
          <div className={`status ${warn ? 'warn' : up ? 'ok' : ''}`}>
            {!up ? 'engine offline' : warn ? `${pending.length} request${pending.length > 1 ? 's' : ''} need${pending.length > 1 ? '' : 's'} you` : 'guarding your wallet'}
          </div>
        </div>
        <div className="right">
          {info && <span className="addr">{short(info.address)}</span>}
          <span className={`dot ${up ? 'up' : ''}`} title={up ? 'engine connected' : 'engine offline'} />
        </div>
      </div>
      {!up && <div className="offline">{err || 'Engine offline — run: pnpm -C engine daemon'}</div>}

      <div className="body">
        {tab === 'shield' && (
          <>
            {pending.length > 0 && <div className="lbl">needs your decision</div>}
            {pending.map((p) => (
              <div key={p.id} className={`card ${p.explanation.orb}`}>
                <div className="tag">{p.explanation.verdict.decision === 'DENY'
                  ? <>⛔ would block · {p.explanation.verdict.ruleName}</> : <>✓ looks safe · your wallet will sign</>}</div>
                <p>{p.explanation.narration}</p>
                <div className="meta">{p.request.kind} → {p.request.to ?? '(signature request)'}</div>
                <div className="row">
                  {p.explanation.verdict.decision === 'ALLOW' &&
                    <button className="btn allow" disabled={busy} onClick={() => decide(p, 'approve')}>Allow</button>}
                  <button className="btn block" disabled={busy} onClick={() => decide(p, 'reject')}>Block</button>
                </div>
              </div>
            ))}

            <div className={`hero ${orb}`}>
              <div className="bigorb"><div className="glow" /><img src="/orb.png" alt="" className={`orb-${orb}`} /></div>
              <h1>{warn ? 'One thing needs you' : 'You’re protected'}</h1>
              <p>{warn ? 'Review the request above — I’ll block it if you don’t want it.'
                : 'I check every transaction your wallet is about to make and stop anything dangerous before it signs.'}</p>
              {info && <span className="chip">🛡 <b>guarding</b> · {info.chain}</span>}
            </div>

            <div className="lbl">recent activity</div>
            {activity.length === 0
              ? <div className="empty"><span className="e-icn">🌙</span>Nothing yet. When a site asks your wallet to sign, I’ll show it here first.</div>
              : activity.map((a, i) => (
                <div key={i} className="act">
                  <span className={`adot ${a.kind}`} />
                  <div className="atext">{a.label}<small>{a.sub}</small></div>
                  <span className="atime">{clock(a.at)}</span>
                </div>
              ))}
          </>
        )}

        {tab === 'chat' && (
          <div className="feed">
            {feed.length === 0 && <div className="empty"><span className="e-icn">💬</span>Ask me to send funds, or explain anything.
              Try “send 0.001 ETH to alice” or “what is gas?”</div>}
            {feed.map((m, i) => m.t === 'user' ? <div key={i} className="msg user">{m.text}</div>
              : m.t === 'built' ? (
                <div key={i} className="card safe" style={{ margin: 0, alignSelf: 'flex-start', maxWidth: '92%' }}>
                  <div className="tag">ready — needs your confirmation</div>
                  <p>{m.text}</p><p style={{ color: 'var(--muted)', marginTop: 5 }}>{m.narration}</p>
                  {!m.done && <div className="row"><button className="btn allow" disabled={busy} onClick={() => confirm(m.confirmId)}>Confirm send</button></div>}
                </div>
              ) : (
                <div key={i} className="msg clara"><span className="k">{m.kind}</span>{m.text}
                  {m.link && <> <a href={m.link.href} target="_blank" rel="noreferrer">{m.link.label}</a></>}</div>
              ))}
            <div ref={bottom} />
          </div>
        )}

        {tab === 'settings' && info && (
          <div className="pad" style={{ padding: '16px 0' }}>
            <div className="lbl">wallet ownership</div>
            <div className="set">
              {info.verified ? (
                <div className="srow"><div className="sk">Verified as yours<small>you signed a message proving control</small></div><div className="sv mint">✓ verified</div></div>
              ) : (
                <div className="verify">
                  <p>Prove this wallet is yours by signing a short message. It moves no funds and grants no
                  permissions — and Clara shows you exactly what you sign.</p>
                  <button className="btn allow" onClick={verify} disabled={busy} style={{ width: '100%' }}>
                    {busy ? 'signing…' : 'Verify ownership'}</button>
                </div>
              )}
              {signedMsg && <pre className="siwe">{signedMsg}</pre>}
            </div>
            <div className="lbl">connected wallets</div>
            <div className="set">
              {wallets.length === 0
                ? <div className="srow"><div className="sk">No browser wallet detected<small>install MetaMask, Rabby, etc. — Clara guards it automatically</small></div></div>
                : wallets.map((w, i) => (
                  <div key={w.rdns} className="wal">
                    {w.icon ? <img className="wicn" src={w.icon} alt="" /> : <span className="wicn ph">{w.name.slice(0, 1)}</span>}
                    <div className="wname">{w.name}<small>{w.rdns}</small></div>
                    {i === 0 && <span className="wbadge">🛡 guarded</span>}
                  </div>
                ))}
            </div>
            <div className="lbl">Clara’s wallet <span style={{ color: 'var(--faint)', textTransform: 'none', letterSpacing: 0 }}>· for building sends</span></div>
            <div className="set">
              <div className="srow"><div className="sk">Address</div><div className="sv">{info.address}</div></div>
              <div className="srow"><div className="sk">Network</div><div className="sv mint">{info.chain}</div></div>
            </div>
            <div className="lbl">spending limits</div>
            <div className="set">
              <div className="srow"><div className="sk">Per transaction<small>a single transfer can’t exceed this</small></div><div className="sv">{info.caps.perTxEth} ETH</div></div>
              <div className="srow"><div className="sk">This session<small>total across the session</small></div><div className="sv">{info.caps.sessionEth} ETH</div></div>
            </div>
            <div className="lbl">saved contacts</div>
            <div className="set">
              {Object.entries(info.contacts).map(([name, addr]) => (
                <div key={name} className="srow"><div className="sk" style={{ textTransform: 'capitalize' }}>{name}</div><div className="sv">{short(addr)}</div></div>
              ))}
            </div>
            <div className="lbl">what I block</div>
            <div className="set">
              {info.protections.map((p) => (
                <div key={p.title} className="prot"><span className="shield">🛡</span><div><div className="pt">{p.title}</div><div className="pd">{p.detail}</div></div></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {tab === 'chat' && (
        <form className="compose" onSubmit={(e) => { e.preventDefault(); ask(); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} disabled={busy || !up}
            placeholder={busy ? 'thinking…' : 'send 0.001 ETH to alice…'} />
          <button className="send" type="submit" disabled={busy || !up}>Ask</button>
        </form>
      )}

      <nav className="tabs">
        <button className={tab === 'shield' ? 'on' : ''} onClick={() => setTab('shield')}>
          <span className="ti">🛡</span><span className="tl">Shield</span>
          {pending.length > 0 && <span className="badge">{pending.length}</span>}
        </button>
        <button className={tab === 'chat' ? 'on' : ''} onClick={() => setTab('chat')}><span className="ti">💬</span><span className="tl">Chat</span></button>
        <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}><span className="ti">⚙️</span><span className="tl">Settings</span></button>
      </nav>
    </>
  );
}
