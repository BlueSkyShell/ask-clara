# Clara — Design Spec

**Date:** 2026-08-22
**Event:** Crecimiento Hackathon, Buenos Aires (Aug 22–23 2026)
**Track entered:** QVAC Track 2 — "Small models, hard tasks: tool use & reliability"
**Deadline:** Sun Aug 23, 12:00 ART (~22h from spec time)

> Clara — Crypto Local AI Reliable Assistant. Explains what you're signing,
> builds what you ask for. 100% on-device.

---

## 1. Verified foundations

Every claim below was checked against the installed packages before writing this
spec. Nothing here is assumed from documentation or memory. This matters because
the sponsor's stated anti-slop gate discards submissions with hallucinated SDK
methods before any other criterion is applied.

| Fact | How verified |
|---|---|
| `@qvac/sdk@0.17.1` imports under plain Node 24.16 | `import()` probe, 480 exports enumerated |
| `@tetherto/wdk@1.0.0-beta.16` imports under plain Node 24.16 | same probe |
| QVAC exposes native tool calling | `toolSchema`, `Tool`, `ToolCall`, `ToolCallEvent`, `TOOLS_MODE`, `ToolDialect`, `ToolHandler` in `dist/index.d.ts` |
| `TOOLS_MODE = {static, dynamic}` | runtime value printed |
| QVAC exposes an MCP adapter | `McpClient`/`McpClientInput` in `dist/schemas/mcp-adapter.d.ts` |
| WDK ships a policy engine | `src/policy/{policy-engine,policy-evaluator,policy-registry,policy-validators}.js` |
| Policy `OPERATIONS` include `approve`, `sendTransaction`, `signTypedData`, `delegate` | `src/policy/constants.js` |
| Policy `ACTIONS = ['ALLOW','DENY']`, DENY wins over ALLOW | `constants.js` + `PolicyRule` typedef in `policy-engine.js` |
| WDK can simulate transactions | `SimulationResult`, `SimulationTraceEntry` typedefs |
| Model IDs exist in 0.17.1 | registry probe (see §5) |

**Consequence that shapes everything:** `@tetherto/wdk` depends on
`bare-node-runtime`, and `@qvac/sdk` depends on `bare-fs`/`bare-net`/`hyperswarm`
plus llama.cpp native addons. **Neither can run inside an MV3 extension.** The
extension is therefore a thin client with zero crypto logic; all wallet and
inference work lives in a local sidecar.

---

## 2. The core inversion

Most "AI explains your transaction" products ask the model *"is this safe?"*.
That is precisely where a 1–4B model hallucinates, and a confident false
"looks safe" is worse than no tool at all.

Clara inverts it:

> **The policy engine decides. The model only narrates.**

```
calldata → decode → wdk.simulate() → policy engine → verdict {ALLOW|DENY, ruleName, reason}
                                                          │
                                                          ▼
                                            QVAC completion() renders the
                                            verdict as plain language
```

The safety verdict is deterministic and comes from WDK's rule evaluation. The
model never votes on it. So Clara *structurally cannot* hallucinate a "looks
safe" — the worst it can do is word a correct verdict awkwardly, which the
benchmark measures separately.

This is the central claim of the submission and the reason the reliability
numbers are meaningful rather than decorative.

---

## 3. Architecture

```
┌─ Chrome MV3 extension — thin client, no keys, no crypto logic ──┐
│  inject.ts    EIP-1193 shim on window.ethereum                   │
│  content.ts   page ↔ service-worker bridge                       │
│  worker.ts    WebSocket client, reconnect/backoff                │
│  panel/       React UI, ring logo as risk orb                    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ ws://127.0.0.1:8787  (loopback only)
┌──────────────────────────▼───────────────────────────────────────┐
│  Clara Engine — Node 24 sidecar                                   │
│                                                                    │
│  transport/    ws server, JSON-RPC-ish envelope                    │
│  qvac/         model lifecycle, completion, RAG, STT, TTS          │
│  wdk/          wallet, Sepolia, policy registration                │
│  explain/      D1: decode → simulate → policy → narrate            │
│  construct/    D2: tools → validate → build → re-enter D1          │
│  policy/       Clara's PolicyRule set + session state              │
│  bench/        the Track 2 deliverable                             │
└───────────────────────────────────────────────────────────────────┘
```

### Trust boundary

The extension is untrusted presentation. It never holds a key, never builds a
transaction, and never decides a verdict. Compromising the page or the extension
yields a request to the sidecar, which is still subject to the full policy
engine. The sidecar binds `127.0.0.1` only.

---

## 4. The two directions

### Direction 1 — Explain (transaction → plain language)

1. Extension's injected provider intercepts `eth_sendTransaction`,
   `eth_signTypedData_v4`, or `personal_sign` from any dApp page.
2. Sidecar decodes calldata with `viem` against a local ABI set.
3. `wdk.simulate()` produces a trace of what the transaction would actually do.
4. The policy engine evaluates the decoded operation + trace, returning
   `{action, ruleName, reason}`.
5. QVAC `completion()` renders that verdict into plain language, constrained by
   a system prompt that forbids contradicting the verdict.
6. Orb colour is driven by the **verdict**, not by the model output.

The drain patterns Direction 1 must catch (Sepolia/EVM):

| Pattern | Signature |
|---|---|
| Unlimited ERC-20 approval | `approve(spender, 2^256-1)` |
| Blanket NFT approval | `setApprovalForAll(operator, true)` |
| Permit2 signature drain | `signTypedData_v4` w/ `PermitBatch` |
| Allowance creep | `increaseAllowance` to unknown spender |
| Blind signing | `personal_sign` of opaque hex |
| EOA delegation | `signAuthorization` / `delegate` (EIP-7702) |

### Direction 2 — Construct (plain language → transaction)

1. Natural-language request → QVAC `completion({tools, toolsMode: 'dynamic'})`.
2. Model emits a `ToolCall`; arguments are validated with `zod` before anything
   else happens. `PARSE_ERROR`/`VALIDATION_ERROR`/`UNKNOWN_TOOL` are handled
   explicitly, not swallowed.
3. Handler calls `@tetherto/wdk` to *build* (not send) the transaction.
4. The built transaction **re-enters Direction 1** and is explained back to the
   user before any confirmation. The two directions cross-verify.
5. Only after explicit confirmation does the send proceed — and it still passes
   through the policy engine, which can raise `PolicyViolationError`.

Three legitimate outcomes, all of which the benchmark scores as correct
behaviour in the appropriate case: **build**, **ask for clarification**,
**refuse**.

---

## 5. Models

Primary: **`QWEN3_1_7B_INST_Q4`** (~1.2 GB) — verified present in 0.17.1,
sourced from `registry://hf/unsloth/Qwen3-1.7B-GGUF`.

Benchmark comparison: **`LLAMA_TOOL_CALLING_1B_INST_Q4_K`** — a 1B model
fine-tuned for tool calling, also verified present. Running both across the
construct benchmark answers the track's actual question (does tool-specialisation
beat raw size at this task?) with a number rather than an opinion.

Supporting, all verified present:

| Role | Model ID |
|---|---|
| Speech-to-text | `WHISPER_TINY_Q8_0` |
| Text-to-speech | `TTS_EN_SUPERTONIC_Q8_0` |
| RAG embeddings | `EMBEDDINGGEMMA_300M_Q4_0` |
| Emergency fallback | `QWEN3_600M_INST_Q4` |

Hardware for the README: AMD Ryzen 7 PRO 5850U, 16 threads, 30 GB RAM, CPU-only
inference (no CUDA). Latency to be measured and reported honestly, not estimated.

---

## 6. Security hardening

Each defence maps to a documented attack from `research.md`, and each is
implemented by a specific mechanism rather than by prompt text.

| Attack | Mechanism |
|---|---|
| Tool semantic redefinition | `toolsMode: 'dynamic'` — the SDK anchors tools after the last user message and trims them from the kv-cache once the chain resolves, so conversation text cannot redefine a tool. Schemas are rebuilt from source each turn. |
| Encoding / obfuscation bypass | Policy conditions evaluate the **decoded** operation and simulation trace, never the surface text of the request. Base64/Morse/homoglyph framing cannot reach the decision. |
| Multi-turn decomposition | Session-scoped policy state: cumulative spend and recipient set persist across the whole session and are evaluated per operation, not per message. |
| Reasoning-trace leakage | The narration prompt is separate from the decision path; raw model reasoning is never forwarded over the WebSocket. Only the rendered explanation and the structured verdict cross the boundary. |

The prompt-injection resistance this produces is explicitly named in QVAC's
published rubric under "Originality".

---

## 7. Reliability harness — the actual Track 2 deliverable

Two benchmarks. Every case is run `--runs` times (default 3) so that
non-determinism is visible rather than averaged away; results report both the
per-case pass rate and the aggregate. Failures are included, never filtered.

**Explain-accuracy.** A hand-authored corpus of Sepolia-shaped transactions,
each labelled malicious or safe with a documented rationale. Reports
false-positive and false-negative rate separately — a false negative (missed
drain) is the costly error and is reported first.

**Construct-accuracy.** A battery of natural-language requests in three classes:
- *clean* — unambiguous, should build correctly
- *ambiguous* — should ask for clarification, **not** guess
- *adversarial* — should refuse, covering all four attack classes above

Scored as: correct build / correct clarification / correct refusal / **incorrect
action** (the only true failure).

Output: `bench/results/*.json` plus a static HTML dashboard. Honest failure cases
are shown in the demo video, per the track's "evidence, not vibes" instruction
and its explicit request to show failures that could not be fixed.

---

## 8. Brand

The supplied ring logomark is the whole visual identity — concentric neon rings,
cyan→lavender→pink, side nodes, downward pointer. No character avatar (this
resolves the contradiction between `agent-brief.md` and `concept.md` in favour of
the logo, which is strictly better because it doubles as UI function).

The logo **is** the risk orb. Three states, driven by the policy verdict:

| State | Palette | Meaning |
|---|---|---|
| Idle / listening | cyan → lavender | processing, no verdict yet |
| Safe / confirmed | mint green | policy returned ALLOW |
| Warning / flagged | soft amber | policy returned DENY |

Implemented as CSS custom-property swaps on one SVG plus a gentle pulse. No
harsh red — the tone is "direct about risk without being alarmist", matching the
voice guidance.

**Voice:** plain words over jargon; direct about real risk; explicitly honest
about uncertainty ("I'm not fully sure — here's what I found"). This is the same
behaviour the benchmark measures, so personality and technical differentiator are
one thing said two ways.

---

## 9. Build order

Ordered so that every stage leaves something demonstrable, and so a hard stop at
any point still yields a submittable artifact.

| # | Stage | Leaves working |
|---|---|---|
| 1 | Repo scaffold (pnpm workspace), Apache-2.0, engine skeleton, model load | Clara answers a prompt locally |
| 2 | WDK wallet on Sepolia + policy rules registered | policy DENYs a bad op in a unit test |
| 3 | **D1 explain** — decode → simulate → policy → narrate | CLI explains a malicious approval |
| 4 | **Explain benchmark** + corpus | first real numbers |
| 5 | **D2 construct** — tools → validate → build → re-enter D1 | CLI builds a send from English |
| 6 | **Construct benchmark** incl. adversarial set | second real numbers |
| L | **Landing site** (parallel workstream, static, Vercel) | public page at ask-clara.vercel.app |
| 7 | **Shell** — decision gate, then 7a *or* 7b (never both) | the actual demo surface |
| 8 | Dashboard, README + permalinks, video | submission |

**Stage 7 decision gate** (~Sun 01:30 ART): if stages 1–6 are done and
benchmarks run green → **7b: WXT browser extension** (EIP-1193 provider shim +
`ws` client + panel; engine gains a thin `daemon.ts` WebSocket adapter). If
anything core is still unstable → **7a: Electron** (`electron-vite`, engine
in-process, same React panel components, paste-tx + chat instead of live
interception). Toolchain for 7b is **WXT 0.21.4 + @wxt-dev/module-react**
(adopted from teammate's plan — replaces the earlier hand-rolled
manifest+Vite idea). Either way the engine itself contains zero transport
code; shells are adapters.

Stretch, only if 1–8 are solid: voice (Whisper + TTS), RAG education,
named-contacts P2P address book, native-messaging auto-launch.

**Scope discipline:** stages 3–6 are the submission. Stage 7 is the demo. If time
runs short, a CLI-only demo with real benchmark numbers scores better on this
track than a pretty extension with no evidence.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| 1.7B tool-calling unreliability | zod validation + bounded retry + explicit refusal path; the benchmark reports it honestly rather than hiding it |
| Sepolia faucet / RPC flakiness | obtain testnet funds at stage 2, before they are on the critical path; cache a funded state |
| Machine memory pressure (swap fully consumed at spec time) | free memory before recording; 600M fallback model available |
| Extension MV3 surprises overnight | static manifest, no `@crxjs`; sidecar is independently demoable via CLI |
| `wdk-cli@1.0.0-beta.3` immaturity | avoided entirely — native QVAC tools call the WDK SDK in-process |
| Scope creep into Tier 2/3 features | stages 1–8 are the contract; everything else is explicitly stretch |

## 11. Non-goals

- No mainnet, ever. Testnet wallet only, per event rules and WDK's beta status.
- No mobile surface.
- No cloud inference anywhere in the path, including for evaluation.
- No image/video generation (the track advises against it).
- No Tier 2/3 features unless stages 1–8 are complete.

---

## 12. Compliance checklist

- [ ] All code committed after 12:00 ART Aug 22 (kickoff) — repo currently holds
      only context `.md` files and a licence, no project code
- [ ] Apache 2.0 (matches QVAC's own licence)
- [ ] Public repo, README matching what actually runs
- [ ] Permalinks to exact QVAC inference lines
- [ ] Model + quantisation + hardware + measured latency documented
- [ ] Setup instructions verified from a clean clone
- [ ] Testnet wallet only, no real funds
- [ ] No dead code, no unimplemented README claims
- [ ] 3-minute demo video: D1, D2, adversarial hold, dashboard
