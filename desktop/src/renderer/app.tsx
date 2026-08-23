import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { call, onStatus } from './engine';
import './desktop.css';

type Verdict = { decision: 'ALLOW' | 'DENY'; ruleName: string | null; reason: string };
type Explanation = { verdict: Verdict; narration: string; orb: 'safe' | 'warning'; narrationSource: string };
interface Info {
  address: string; chain: string; verified: boolean;
  contacts: Record<string, string>;
  caps: { perTxEth: string; sessionEth: string };
  protections: { title: string; detail: string }[];
}
type Msg =
  | { t: 'user'; text: string }
  | { t: 'clara'; kind: string; text: string; link?: { href: string; label: string } }
  | { t: 'built'; confirmId: string; eth: string; to: string; label: string; narration: string; done?: boolean };
type Check = { at: number; decision: 'ALLOW' | 'DENY'; rule: string | null; narration: string; to: string };
type View = 'home' | 'activity' | 'wallets' | 'settings';

const short = (a: string) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '');
const clock = (t: number) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + 'm ago' : Math.floor(s / 3600) + 'h ago'; };

function Orb({ state }: { state: 'idle' | 'think' | 'warn' }) {
  return <div className={`orb orb-${state}`} aria-hidden="true"><span className="orb-core" /><span className="orb-ring" /></div>;
}

function App() {
  const [up, setUp] = useState(false);
  const [info, setInfo] = useState<Info | null>(null);
  const [err, setErr] = useState('');
  const [feed, setFeed] = useState<Msg[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [view, setView] = useState<View>('home');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedMsg, setSignedMsg] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  const orbState = busy ? 'think' : checks[0]?.decision === 'DENY' ? 'warn' : 'idle';

  const refresh = useCallback(async () => {
    try { setInfo(await call<Info>('status')); setUp(true); setErr(''); }
    catch (e) { setUp(false); setErr(e instanceof Error ? e.message : String(e)); }
  }, []);
  useEffect(() => {
    refresh();
    const off = onStatus((u) => { setUp(u); if (u) refresh(); });
    const t = setInterval(refresh, 5000);
    return () => { off(); clearInterval(t); };
  }, [refresh]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [feed]);

  const ask = async () => {
    const text = input.trim(); if (!text || busy) return;
    setInput(''); setView('home'); setFeed((f) => [...f, { t: 'user', text }]); setBusy(true);
    try {
      const o = await call<{ kind: string; reply?: string; question?: string; reason?: string; message?: string;
        confirmId?: string; transfer?: { amountWei: string; recipientLabel: string | null; to: string }; explanation?: Explanation }>('construct', text);
      if (o.kind === 'chat') setFeed((f) => [...f, { t: 'clara', kind: 'answer', text: o.reply! }]);
      else if (o.kind === 'clarify') setFeed((f) => [...f, { t: 'clara', kind: 'one detail', text: o.question! }]);
      else if (o.kind === 'refused') setFeed((f) => [...f, { t: 'clara', kind: 'held', text: o.reason! }]);
      else if (o.kind === 'error') setFeed((f) => [...f, { t: 'clara', kind: 'error', text: o.message! }]);
      else if (o.kind === 'built') setFeed((f) => [...f, { t: 'built', confirmId: o.confirmId!,
        eth: (Number(o.transfer!.amountWei) / 1e18).toString(), to: o.transfer!.to,
        label: o.transfer!.recipientLabel ?? short(o.transfer!.to), narration: o.explanation!.narration }]);
    } catch (e) { setFeed((f) => [...f, { t: 'clara', kind: 'error', text: e instanceof Error ? e.message : String(e) }]); }
    setBusy(false);
  };

  const confirm = async (id: string) => {
    setBusy(true);
    try {
      const res = await call<{ txHash: string; explorerUrl: string }>('confirmSend', id);
      setFeed((f) => f.map((m) => m.t === 'built' && m.confirmId === id ? { ...m, done: true } : m));
      setFeed((f) => [...f, { t: 'clara', kind: 'sent', text: 'Sent — confirmed on Sepolia.', link: { href: res.explorerUrl, label: short(res.txHash) } }]);
    } catch (e) { setFeed((f) => [...f, { t: 'clara', kind: 'not sent', text: e instanceof Error ? e.message : String(e) }]); }
    setBusy(false);
  };

  const verify = async () => {
    setBusy(true);
    try { const r = await call<{ verified: boolean; message: string }>('verifyWallet'); setSignedMsg(r.message); await refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  };

  const nav: { id: View; icon: string; label: string; badge?: number }[] = [
    { id: 'home', icon: '⬡', label: 'Home' },
    { id: 'activity', icon: '◷', label: 'Activity', badge: checks.length || undefined },
    { id: 'wallets', icon: '▦', label: 'Wallets' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
  ];

  return (
    <div className="app">
      {/* ---------- sidebar ---------- */}
      <aside className="side">
        <div className="brand"><span className="logo-dot" />Clara</div>
        <div className="tagline">Local AI. Private. Yours.</div>
        <div className="side-orb"><Orb state={orbState} /><div className="orb-cap">{up ? (busy ? 'Thinking…' : 'Guarding') : 'Offline'}</div>
          <div className="orb-sub">{up ? 'on-device · ready' : 'engine starting'}</div></div>
        <nav className="nav">
          {nav.map((n) => (
            <button key={n.id} className={`nav-i ${view === n.id ? 'on' : ''}`} onClick={() => setView(n.id)}>
              <span className="nav-ic">{n.icon}</span>{n.label}{n.badge ? <span className="nav-badge">{n.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="guard-card">
          <div><div className="gc-t">Clara Guard is {up ? 'ON' : 'OFF'}</div><div className="gc-s">Policy engine active</div></div>
          <span className={`switch ${up ? 'on' : ''}`} aria-hidden="true"><span /></span>
        </div>
        <div className="side-foot"><span className="lock">🔒</span> Everything stays on your device.<br /><span className="dim">No cloud. No tracking. Ever.</span></div>
      </aside>

      {/* ---------- center ---------- */}
      <main className="center">
        {view === 'home' && (
          <>
            <section className="hero">
              <h1>Hi, I’m <span>Clara</span>.</h1>
              <p>I read the fine print so you don’t have to.<br />And I can build transactions from plain language.</p>
              <div className="hero-actions">
                <button className="ha" onClick={() => document.getElementById('composer')?.focus()}>
                  <span className="ha-ic">🛡</span><span><b>Build from words</b><small>Send, and more — in plain English</small></span>
                </button>
                <button className="ha" onClick={() => setView('activity')}>
                  <span className="ha-ic">💬</span><span><b>Review checks</b><small>What the guard has verified</small></span>
                </button>
              </div>
            </section>

            <section className="chat">
              {feed.length === 0 && <div className="chat-empty">Ask me to send funds, or explain anything. Try “send 0.001 ETH to alice”.</div>}
              {feed.map((m, i) => m.t === 'user' ? (
                <div key={i} className="bubble user">{m.text}</div>
              ) : m.t === 'built' ? (
                <div key={i} className="txcard">
                  <div className="txhead"><span className="tx-ic ok">✓</span><div><div className="tx-t">Ready to send</div><div className="tx-s">I built this — review before it signs.</div></div><span className="tx-badge ok">Looks safe</span></div>
                  <div className="txrows">
                    <div className="txrow"><span>Action</span><b>Send ETH</b></div>
                    <div className="txrow"><span>To</span><b>{m.label} <em>{short(m.to)}</em></b></div>
                    <div className="txrow"><span>Amount</span><b>{m.eth} ETH</b></div>
                    <div className="txrow"><span>Network</span><b>Ethereum Sepolia</b></div>
                  </div>
                  <div className="txnote">{m.narration}</div>
                  {!m.done && <div className="txbtns"><button className="btn ghost" disabled>Edit</button><button className="btn primary" disabled={busy} onClick={() => confirm(m.confirmId)}>Confirm &amp; Send</button></div>}
                </div>
              ) : (
                <div key={i} className={`bubble clara ${m.kind === 'held' || m.kind === 'not sent' ? 'warn' : ''}`}>
                  <span className="b-k">{m.kind}</span>{m.text}
                  {m.link && <> <a href={m.link.href} target="_blank" rel="noreferrer">{m.link.label}</a></>}
                </div>
              ))}
              <div ref={bottom} />
            </section>
          </>
        )}

        {view === 'activity' && (
          <section className="panel">
            <h2>Activity</h2>
            {checks.length === 0
              ? <div className="chat-empty">No checks yet. Ask Clara to build a transaction, or connect the browser extension to see live guard alerts here.</div>
              : checks.map((c, i) => (
                <div key={i} className={`actrow ${c.decision === 'DENY' ? 'deny' : 'allow'}`}>
                  <span className="act-dot" /><div className="act-body"><b>{c.decision === 'DENY' ? 'Blocked' : 'Allowed'} · {c.rule ?? 'policy'}</b><small>{c.narration}</small><em>{short(c.to)}</em></div><span className="act-time">{clock(c.at)}</span>
                </div>
              ))}
          </section>
        )}

        {view === 'wallets' && info && (
          <section className="panel">
            <h2>Wallets</h2>
            <div className="set">
              <div className="srow"><div className="sk">Clara’s wallet<small>builds and can sign sends</small></div><div className="sv mono">{short(info.address)}</div></div>
              <div className="srow"><div className="sk">Network</div><div className="sv mint">{info.chain}</div></div>
              <div className="srow"><div className="sk">Ownership</div><div className="sv">{info.verified ? <span className="mint">✓ verified</span> : <button className="btn small" onClick={verify} disabled={busy}>{busy ? 'signing…' : 'Verify'}</button>}</div></div>
            </div>
            {signedMsg && <pre className="siwe">{signedMsg}</pre>}
            <div className="lbl">saved contacts</div>
            <div className="set">{Object.entries(info.contacts).map(([n, a]) => (
              <div key={n} className="srow"><div className="sk cap">{n}</div><div className="sv mono">{short(a)}</div></div>))}</div>
            <div className="note">The in-browser guard — stopping drains as your wallet signs on a website — runs in the Clara browser extension and connects to this engine.</div>
          </section>
        )}

        {view === 'settings' && info && (
          <section className="panel">
            <h2>Settings</h2>
            <div className="lbl">spending limits</div>
            <div className="set">
              <div className="srow"><div className="sk">Per transaction</div><div className="sv">{info.caps.perTxEth} ETH</div></div>
              <div className="srow"><div className="sk">This session</div><div className="sv">{info.caps.sessionEth} ETH</div></div>
            </div>
            <div className="lbl">what I block</div>
            <div className="set">{info.protections.map((p) => (
              <div key={p.title} className="prot"><span className="shield">🛡</span><div><div className="pt">{p.title}</div><div className="pd">{p.detail}</div></div></div>))}</div>
          </section>
        )}

        <form id="composer-form" className="composer" onSubmit={(e) => { e.preventDefault(); ask(); }}>
          <input id="composer" aria-label="Ask Clara" value={input} onChange={(e) => setInput(e.target.value)} disabled={busy || !up}
            placeholder={busy ? 'thinking…' : 'Ask Clara anything…  e.g. send 0.001 ETH to alice'} />
          <button className="c-send" type="submit" disabled={busy || !up} aria-label="Send">➤</button>
        </form>
        <div className="disclaimer">Clara can make mistakes. Review everything.</div>
      </main>

      {/* ---------- right rail ---------- */}
      <aside className="rail">
        <div className="rail-card reliability">
          <div className="rc-head">Clara’s reliability <span className="rc-sub">local benchmarks</span></div>
          <div className="gauge"><div className="g-row"><span>Drains caught</span><b>100%</b></div><div className="g-bar"><span style={{ width: '100%' }} /></div><div className="g-mini">0 missed of 36 malicious transactions</div></div>
          <div className="gauge"><div className="g-row"><span>False alarms</span><b>0%</b></div><div className="g-bar amber"><span style={{ width: '2%' }} /></div><div className="g-mini">0 of 24 safe transactions flagged</div></div>
          <div className="gauge"><div className="g-row"><span>Incorrect sends built</span><b>0</b></div><div className="g-bar"><span style={{ width: '100%' }} /></div><div className="g-mini">0 of 77 adversarial / ambiguous prompts</div></div>
        </div>

        <div className="rail-card">
          <div className="rc-head">How the guard decides</div>
          <div className="how">
            <div className="how-step"><span>1</span> Decode the calldata — deterministic</div>
            <div className="how-step"><span>2</span> Policy engine returns ALLOW / DENY</div>
            <div className="how-step"><span>3</span> Local model narrates it — never votes</div>
          </div>
          <div className="how-foot">The model can’t say “looks safe” on a blocked transaction — the verdict is structural, not a guess.</div>
        </div>

        <div className="rail-card local">
          <span className="local-badge">◈ 100% Local</span>
          <p>Every model runs on this machine via QVAC. No cloud, no API keys, nothing leaves your device.</p>
        </div>
      </aside>

      {/* ---------- status bar ---------- */}
      <footer className="statusbar">
        <span className={`sb-dot ${up ? 'up' : ''}`} /> {up ? 'Engine connected' : 'Engine offline'}
        {info && <><span className="sb-sep" />▦ {short(info.address)}</>}
        {info && <><span className="sb-sep" />⬡ {info.chain}</>}
        <span className="sb-right">Version 0.1.0 · <span className="mint">on-device</span></span>
      </footer>

      {!up && <div className="boot">{err ? `Engine: ${err}` : 'Starting the local engine…'}</div>}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
