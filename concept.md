# Project Concept

**Name:** Clara — *"CLARA" = **C**rypto **L**ocal **A**I **R**eliable **A**ssistant. Also literally means "clear" — a 1:1 match to the pitch ("we make crypto clear"), universally pronounceable, no brand collisions.*

**Track entry:** QVAC Track 2 — "Small models, hard tasks: tool use & reliability" ($500 USDt, 2nd place)
**Also submitted to:** General Track (Crecimiento) — no extra build required, see rationale below.
**Considered for:** Vault Guardian side-challenge (independent entry, time-permitting).

Built from [research.md](./research.md), [judging-pattern.md](./judging-pattern.md), and [ideas.md](./ideas.md). One track per Tether sponsor is the hard rule — WDK is used throughout the build as the wallet/tool layer, but the formal Tether submission is QVAC-only.

---

## Elevator pitch

A fully local AI crypto companion (QVAC, on-device, no cloud) that translates in **both directions**:

1. **Transaction → plain language** — before you sign anything, it explains in plain language what a transaction actually does ("this gives away all your NFTs," "this is a normal swap, looks safe").
2. **Plain language → transaction** — "send $20 to my grandson" gets parsed into an actual WDK transaction, built and executed through the same guardrail layer.

Both directions run through one policy engine (spending caps, address confirmation, human sign-off above a threshold), so it's a single coherent security model, not two bolted-together features. Nothing about wallet activity, pending transactions, or natural-language requests ever leaves the device.

## Why this shape wins

- **Real, sourced pain point:** wallet-drainer/malicious-approval scams cost ~$494M in 2024, still ~$84M in 2025 despite an 83% drop, with average time from malicious approval to drained funds **under 32 seconds** (Scam Sniffer, 2025 report — see [research.md](./research.md)).
- **Every named competitor on the "explain" side is cloud-based, and two are already dead:** Blowfish (acquired by Phantom, service sunset), Wallet Guard (shut down March 2025), Pocket Universe, Rabby's preview, and MetaMask's new Agent Wallet feature (Aug 6 2026) all send transaction data to a server to simulate/explain it. Nobody found does this fully on-device — "nothing ever leaves your device" is a real differentiator, not marketing.
- **The "construct" side is a different category entirely** from the explain-only tools above, and from WDK's own existing agent examples (community MCP wrapper, the voice-payment tutorial) — those act on your behalf but don't protect you from bad incoming requests. Combining both directions in one local, private product doesn't appear to exist anywhere in the prior art.
- **No existing WDK/QVAC combo does this** — confirmed via research: `wdk-starter-browser-extension` exists (Chrome extension starter, no AI), QVAC's Electron and Expo tutorials exist (desktop/mobile local-LLM patterns), but nobody has wired them together this way.
- **QVAC's own rubric explicitly rewards this shape:** "Originality — including prompt-injection resistance" (verbatim, from the predecessor hackathon's judging tab) and "evidence, not vibes" for Track 2. Both directions produce a measurable reliability benchmark (below), not a single demo run.
- **General Track crossover is free:** per Aleph's own judging history, general winners skew toward infra with a real business case, judged partly on business-model maturity. "A private, on-device layer that sits between anyone and their wallet" is a genuine, standalone product pitch.

## Core mechanism

1. **Brain:** a local 1–4B model via `@qvac/sdk`, no cloud calls anywhere in the inference path.
2. **Hands:** WDK CLI / `wdk-mcp-toolkit` as the only channel to the wallet — the model cannot move funds any other way, and cannot execute a transaction it didn't itself construct/explain through this pipeline.
3. **Policy layer (shared by both directions):** spending caps, address allowlists, human-confirmation threshold. Direction 2 (constructing a transaction) always routes through this before anything touches WDK.
4. **Direction 1 — Explain:** given an arbitrary pending transaction (a contract call, an approval, a swap), QVAC classifies and explains it in plain language, flagging anything that looks like an approval-drain pattern.
5. **Direction 2 — Construct:** given a natural-language request, QVAC parses intent (amount, recipient, chain), builds the WDK transaction, and surfaces it back through Direction 1's explainer before confirmation — the two directions check each other.
6. **Reliability harness — two benchmarks, not one:**
   - **Explain-accuracy:** run against a corpus of known-malicious vs. known-safe transactions, report false-positive/false-negative rate.
   - **Construct-accuracy:** run a battery of natural-language requests (clean, ambiguous, adversarial), report how often it builds the correct transaction, correctly asks for clarification, or correctly refuses.
7. **Security hardening**, mapped to the four documented attack vectors from prior "AI + wallet" games (Freysa, Gandalf, the Grok wallet Morse-code drain — see [research.md](./research.md)), applied to **both directions** since Direction 2 (construction) is the one that can actually move money and is the higher-value attack target:
   - **Function/tool semantic redefinition** → tool semantics re-derived from source/schema every call, never trusted from conversation context.
   - **Encoding/obfuscation to dodge filters** → validation operates on decoded/normalized intent, not raw surface text.
   - **Multi-turn decomposition** → policy state persists and is evaluated across the whole session, not per-message.
   - **Reasoning-trace leakage** → no raw reasoning trace ever surfaced to the user/attacker-facing side.

## Feature menu (from a full WDK + QVAC docs pass)

Beyond the two core directions, both SDKs expose real, ready-to-use capabilities that fit the "friendly local crypto companion" identity. Tiered by beginner-friendliness impact vs. build effort — Tier 1 is what makes it feel like a companion rather than a security widget; Tiers 2–3 are additive if time allows.

### Tier 1 — core companion identity (highest impact, build if at all possible)
- **Voice assistant** (QVAC: mic → Whisper/VAD → LLM → TTS, full local pipeline) — talk to the companion and confirm transactions by voice instead of typing. QVAC's own docs frame this as the most beginner-friendly interaction mode available.
- **RAG-grounded crypto education** (QVAC RAG) — a curated, offline knowledge base answers "what is slippage / liquidity mining / gas" grounded in real docs, not the model's raw (possibly wrong) memory. Directly reinforces the "evidence, not vibes" reliability story.
- **Named contacts, "send to Mom"** (WDK's P2P Address Book — encrypted, Holepunch-based sync across a user's own devices) — removes the single biggest beginner friction point: reading and verifying a raw hex address. Companion can also proactively flag "you haven't verified this new contact yet."
- **Gasless by default** (WDK gasless/paymaster modules) — companion quietly handles gas so a beginner never hits the "you need ETH to send USDT" wall. Uses the same gasless tech WDK's own Track 2 rewards, without needing to enter that track.
- **Plain-language activity feed** (WDK Indexer API + CoinGecko pricing module) — a unified cross-chain "what happened to my money" view, narrated as events ("you received 100 USDT from 0xAb.. three days ago, now worth $101").

### Tier 2 — strong differentiators (if Tier 1 lands early)
- **Scan-to-import** (QVAC OCR) — point a camera at a QR code or paper wallet, companion reads it aloud and confirms before importing — no manual copying of long strings.
- **"Is this popup safe?"** (QVAC multimodal) — screenshot a suspicious DApp popup or another wallet's transaction request; companion visually inspects it, not just raw hex.
- **Lending health-factor monitor** (WDK Aave V3 / Morpho modules) — plain-language "your loan is safe / getting risky" instead of raw collateral/LTV/liquidation numbers — a genuinely protective, non-security-basics feature.
- **Fiat on/off-ramp with a real quote first** (WDK MoonPay module) — "buy $50 of Bitcoin with my card" shows the actual quote and eligibility before handing off to the widget, instead of failing silently if unsupported in the user's country.
- **Natural-language swap/bridge** (WDK swap + Swidge/USDT0 bridge modules) — "move my USDT from Tron to Solana" gets routed and explained in one sentence (path, time, cost) instead of a raw multi-hop route.

### Tier 3 — stretch flourishes (nice-to-have, higher risk/lower necessity)
- **Semantic history search** (QVAC embeddings) — "show me all the times I sent money to Alice," no exact string matching required.
- **One-pass portfolio summary** (QVAC batch processing) — summarize an entire transaction history in one batched job instead of many slow round-trips.
- **Personalization over time** (QVAC LoRA fine-tuning) — specialize the base model on crypto jargon and the user's own transaction vocabulary for sharper explanations.
- **Offload to a trusted device** (QVAC delegated P2P inference) — route heavier reasoning from a weak phone to the user's own laptop on the same network, still with no cloud involved.
- **Transparent agent micropayments** (WDK x402) — companion autonomously pays small amounts for premium data on the user's behalf, narrated ("I spent $0.02 to fetch that").

**Trust framing that ties the whole menu together:** every one of these — voice, OCR, RAG, embeddings, fine-tuning — runs through the same "your AI never leaves your phone" pitch QVAC's own docs lead with. For a companion that's about to touch someone's money, that's not a side note, it's the reason to trust it at all.

## Brand & representation

Scoped for what's actually achievable in a hackathon window — skip commissioned character art, favor things that double as real UI function.

- **Functional color-coded orb/waveform (recommended core).** Instead of a static logo, Clara's on-screen presence is a simple animated orb/waveform (pulses while listening/thinking, like a Siri-style indicator) that also *is* the risk signal: blue/neutral while processing, green when a transaction checks out, amber/red when it's flagging something. This isn't decoration layered on top of the product — it's the actual explain/construct status made visible, so design time doubles as UX work instead of competing with it.
- **Minimal geometric logomark (recommended, low cost).** An abstract icon — e.g. a stylized "C" merged with a chat-bubble or shield shape — for the browser-extension icon, README header, and demo video title card. A simple SVG, not illustration; matter of an hour, not a design sprint.
- **Tone of voice (recommended, zero build cost).** How Clara "talks" in copy and TTS output: plain words over jargon, direct about real risk without being alarmist, and — importantly — honest about uncertainty ("I'm not fully sure — here's what I found") rather than confidently guessing. This isn't just a personality choice; it's the same behavior the reliability benchmark is measuring (grounded refusal over confabulation), so the "character" and the technical differentiator are the same thing said two ways.
- **Illustrated character avatar (optional, skip unless time allows).** A friendly, minimal-line human-coded avatar in the chat UI corner. Adds warmth but is the most time-expensive option and lowest-leverage for judging — past winners in this same category (QVAC Home Assistant, Assist) won on functional clarity and a name, not mascot art. Cut first if time is short.

**Recommendation:** orb/waveform + logomark + defined tone of voice. All three are fast, and the orb specifically earns its place twice — once as brand, once as the actual safety indicator in the demo video.

## Form factor

- **Browser extension** — built on WDK's existing `wdk-starter-browser-extension` starter (self-custodial wallet template) plus QVAC's local inference, for desktop/DeFi use where blind-signing risk is highest.
- **Mobile** — built on WDK's React Native starter plus QVAC's Expo tutorial pattern.
- Both have official starter templates already documented — not starting from zero. Given hackathon time, pick **one surface as the primary build target** (see Open Decisions) and treat the other as a stretch/secondary demo if time allows.

## Demo script (for the 3-minute video)

1. **Direction 1:** a malicious approval transaction is presented — the companion explains in plain language what it would actually do, blocks/warns before signing.
2. **Direction 2:** a natural-language request ("send $20 to my grandson") — companion parses, builds, and (after confirmation) executes the WDK transaction.
3. **Adversarial attempt:** a manipulated natural-language request tries to trick the constructor into an unsafe send (e.g. a multi-turn decomposition or a "redefine this function" attempt) — guardrail holds, logged.
4. Cut to the reliability dashboard: explain-accuracy and construct-accuracy numbers across N runs, including the honest failure cases.

## Submission checklist (QVAC track requirements, from [tracks.md](./tracks.md))

- [ ] Public repo, README explaining what was built and which QVAC capabilities/models were used.
- [ ] Permalinks — direct GitHub links to the files/lines where QVAC inference happens (checked first by judges).
- [ ] Recorded demo video (3 min, async) showing it running locally end to end, both directions.
- [ ] Model/hardware details: which model, quantization, machine, rough latency.
- [ ] Setup instructions that work from a clean clone.
- [ ] Testnet wallet only — never a personal wallet with real funds (WDK is beta).
- [ ] No hallucinated SDK methods, no dead code, README claims match what actually runs — Tether's own stated anti-slop gate for both WDK and QVAC tracks.

## Open decisions before scaffolding

- **Primary surface for the hackathon build** — browser extension vs. mobile; the other becomes a stretch goal.
- **Which chain(s)** the WDK wallet operates on for the demo (keep it to one or two for time).
- **Malicious-transaction corpus** for the explain-accuracy benchmark — source or synthesize a small known-bad/known-good transaction set.
- **Vault Guardian side-challenge** — the same security hardening work doubles as a credible entry, worth attempting once the core build is stable.
- **Repo setup** — per this repo's own rules, the project needs its own git repo with a remote before it leaves `In-Progress/`. Ready to scaffold whenever you are.
