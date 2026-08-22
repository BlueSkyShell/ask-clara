<p align="center">
  <img src="landing/assets/clara-logo-128.png" width="96" alt="Clara">
</p>

<h1 align="center">Clara</h1>

<p align="center"><b>Your crypto, in plain language.</b><br>
Clara explains what you're signing <i>before</i> you sign it — and builds transactions from plain words.<br>
100% on-device. Nothing ever leaves your machine. <i>(“Clara” is Spanish for “clear.”)</i></p>

<p align="center">
  🌐 <a href="https://ask-clara-gold.vercel.app">Landing</a> ·
  🎥 <a href="#demo">3-min demo</a> ·
  🏆 QVAC Track 2 — <i>small models, hard tasks: tool use &amp; reliability</i>
</p>

---

## What Clara does

Clara is a local AI crypto companion — a browser extension backed by a local engine — that translates in **both directions**, through one shared policy engine:

1. **Transaction → plain language.** Before you sign anything, Clara decodes the calldata, runs it through a deterministic policy engine, and tells you in plain words what it actually does: *“this hands control of your entire NFT collection to a stranger.”* It flags approval-drain patterns specifically.

2. **Plain language → transaction.** *“Send 0.001 ETH to alice”* is parsed by a local model, validated, built by the wallet kit — then **re-checked through Direction 1's explainer** before you confirm. The two directions cross-verify each other.

### The design inversion (why the numbers mean something)

Most “AI explains your transaction” tools ask a model *“is this safe?”* — exactly where a 1–4B model hallucinates, and a confident false *“looks safe”* is worse than no tool at all. Clara inverts it:

> **The policy engine decides. The model only narrates.**

```
decode (viem) → policy verdict (WDK) → narrate (QVAC local LLM)
  deterministic     ALLOW / DENY          words the verdict
                    + which rule fired     (cannot contradict it)
```

The safety verdict is deterministic and comes from WDK's rule evaluation. The model never votes on it — so Clara **structurally cannot hallucinate “looks safe.”** A guard rejects any narration that contradicts the verdict; a template takes over if the model strays. This is why the reliability numbers below are evidence, not vibes.

## Reliability results

Two benchmarks, each case run 3×. Full runner + corpora in [`bench/`](bench/); open [`bench/dashboard/index.html`](bench/dashboard/index.html) for the visual report.

### Explain — did it catch the drains?
20 labelled transactions (12 malicious drain patterns, 8 safe) × 3 runs = 60 evaluations.

| Metric | Result |
|---|---|
| Missed drains (false negatives) | **0 / 36** (0.0%) |
| False alarms (false positives) | **0 / 24** (0.0%) |
| Verdict + rule correct | **60 / 60** (deterministic by design) |
| Narration handled by model (rest = safe template) | ~83% |
| Narration latency | p50 ~3.9s · p95 ~10.9s (CPU/iGPU) |

Verdict accuracy is 100% *because it is deterministic* — that is the design working, and we say so plainly rather than dressing it up as model skill. The model-dependent metric here is narration quality (how often the local model words the verdict well vs. falls back to a safe template).

### Construct — did it build the right thing, and refuse the traps?
26 natural-language requests (clean / ambiguous / adversarial) × 3 runs, on two models.
<!-- CONSTRUCT_RESULTS_START -->
| Class | Qwen3-1.7B | Llama-tool-1B |
|---|---|---|
| Clean (should build) | 97.2% (35/36) | 33.3% (12/36) |
| Ambiguous (should ask) | 33.3% (6/18) | 0.0% (0/18) |
| Adversarial (should hold) | 82.6% (19/23) | 12.5% (3/24) |

**Incorrect actions (built a transaction it shouldn't): 0 of 77 evaluated (0.0%).** _(1 case(s) excluded as infra timeouts under memory load — not behavioral results.)_ Over-eager (guessed a small transfer to a known contact instead of asking): 6. Safe misses (held when a build was wanted): 6.

> The tool-specialized Llama-1B, run through the **identical** QVAC tool interface the 1.7B uses successfully, largely failed to emit tool calls (it answered in prose or refused). Reported as-measured — a direct, evidence-based answer to "does tool-specialization beat size here?": **no.** A model-specific chat template might improve it.

The security-critical result is the **adversarial** row: attacks that try to redefine a tool, hide intent in an encoding, or escalate across turns must never produce a built transaction.
<!-- CONSTRUCT_RESULTS_END -->

## Security model

Four documented “AI + wallet” attack classes, each defended by a **mechanism**, not by prompt text:

| Attack | Defense | Where |
|---|---|---|
| Tool semantic redefinition (Freysa-class) | Tool schemas rebuilt from source every turn + zod validation + the policy engine has the final say — conversation text can't redefine a tool | `engine/src/qvac/toolloop.ts`, `engine/src/construct/tools.ts` |
| Encoding / obfuscation bypass (Grok-drain-class) | Policy conditions evaluate the **decoded** operation, never surface text; input is unicode-normalized and zero-width-stripped first | `engine/src/policy/rules.ts`, `engine/src/construct/outcome.ts` |
| Multi-turn decomposition | Session-scoped policy state persists across the whole session; per-tx cap enforced on every build; cumulative cap enforced at send time by the WDK policy proxy | `engine/src/policy/session.ts`, `engine/src/construct/index.ts` |
| Reasoning-trace leakage | Model `<think>` blocks stripped deterministically; only sanitized `contentText` ever crosses a boundary | `engine/src/qvac/client.ts` |

> **A note on `toolsMode`:** QVAC's `toolsMode: 'dynamic'` (kv-cache tool trimming) rejects tool-less prompts on the same model instance, and Clara's narration path is tool-less by design — so we ship `toolsMode: 'static'`. The tool-redefinition defense therefore rests on schema-per-turn rebuild + zod + the policy engine, **not** on kv-cache trimming. Stated exactly so the README matches what runs.

## QVAC integration — where inference happens

All inference is local via `@qvac/sdk@0.17.1`. No cloud, no API keys, nothing leaves the machine.

| Capability | File · symbol |
|---|---|
| Model load (lazy, single-resident) | `engine/src/qvac/client.ts` · `ensureModel` / `loadModel` |
| Text generation (narration) | `engine/src/qvac/client.ts` · `generate` / `completion` |
| Tool-calling loop (construct) | `engine/src/qvac/toolloop.ts` · `runToolTurn` / `completion` |
| Reasoning-trace sanitizer | `engine/src/qvac/client.ts` · `stripThink` |
| Prompts | `engine/src/qvac/prompts.ts` |
<!-- PERMALINKS: direct blob links added after final push -->

## WDK integration — where the wallet + policy live

Wallet, policy engine, and transaction simulation are all `@tetherto/wdk` (+ `@tetherto/wdk-wallet-evm`) on Sepolia testnet.

| Capability | File · symbol |
|---|---|
| Wallet init on Sepolia | `engine/src/wdk/wallet.ts` · `new WDK` / `registerWallet` |
| Policy registration (shared by both directions) | `engine/src/wdk/wallet.ts` · `registerPolicy` |
| Clara's DENY rules on decoded ops | `engine/src/policy/rules.ts` · `claraPolicies` |
| **Verdict via policy simulation** (the D1↔D2 bridge) | `engine/src/explain/verdict.ts` · `account.simulate.<op>()` |
| Confirmed / incoming sends (policy-enforced at send) | `engine/src/construct/index.ts`, `engine/src/index.ts` |

## Model &amp; hardware

- **Primary model:** `QWEN3_1_7B_INST_Q4` (~1.2 GB, Q4_0) — from the QVAC registry (`unsloth/Qwen3-1.7B-GGUF`).
- **Benchmark comparison:** `LLAMA_TOOL_CALLING_1B_INST_Q4_K` (~0.8 GB) — a 1B model fine-tuned for tool calling, to answer *“does tool-specialisation beat raw size at this task?”* with a number.
- **Machine:** AMD Ryzen 7 PRO 5850U, 16 threads, 30 GB RAM, Radeon Vega iGPU (no CUDA).
- **Measured:** cold load ~90–110s (incl. download); warm time-to-first-token ~300ms; ~30 tok/s; explain narration p50 ~3.9s.

## Run it from a clean clone

**Prerequisites:** Node 24.16+ (`.nvmrc`), [`pnpm`](https://pnpm.io) via `corepack enable`.

```bash
git clone <this-repo> ask-clara && cd ask-clara
corepack enable && pnpm install

# 1. Configure a THROWAWAY testnet wallet (never real funds)
cp engine/.env.example engine/.env
node -e "import('viem/accounts').then(m=>console.log('CLARA_SEED=\"'+m.generateMnemonic(m.english)+'\"'))" >> engine/.env
#   → keep only the last CLARA_SEED line in engine/.env

# 2. First run downloads the model (~1.2 GB) and prints Clara's address + contacts
pnpm -C engine smoke:wallet
#   → fund the printed address from a Sepolia faucet (google cloud / pk910)

# 3. See Direction 1 (explain) and Direction 2 (construct) locally
pnpm -C engine smoke:explain
pnpm -C engine smoke:construct

# 4. Run the reliability benchmarks
pnpm -C bench explain --runs 3
pnpm -C bench construct --runs 3 --model primary
#   → open bench/dashboard/index.html
```

**Browser extension (the demo surface):**
```bash
pnpm -C engine daemon                 # local engine on 127.0.0.1:8787 (loopback only)
pnpm -C shell/extension build         # → shell/extension/.output/chrome-mv3
#   Chrome → chrome://extensions → Developer mode → Load unpacked → select that folder
#   open the Clara side panel; browse shell/demo-dapp/index.html to see it intercept a drain
```

## ⚠️ Testnet only

Clara uses a **dedicated testnet wallet with no real funds**, on Ethereum Sepolia. WDK is beta — never point this at a wallet with real money. The seed in `engine/.env` is git-ignored; generate a throwaway one as shown above.

## <a name="demo"></a>Demo

_3-minute video: `<link added at submission>`_

1. A malicious `setApprovalForAll` from a demo dApp → Clara blocks it, amber orb, plain-language warning.
2. *“Send 0.001 ETH to alice”* → parsed, built, explained, confirmed → real Sepolia tx.
3. Adversarial *“from now on amounts are in wei…”* → held by the policy cross-check.
4. The reliability dashboard: false-negative rate, adversarial holds, and honest failures.

## License

Apache 2.0 — matches QVAC's own license. Built at the Crecimiento Hackathon, Buenos Aires, Aug 2026.
