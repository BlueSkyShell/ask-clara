You are helping build **Clara**, a hackathon project for the Crecimiento hackathon (Buenos Aires, Aug 22–23 2026). Below is the full context. Read it fully before writing any code.

## Event constraints (hard rules)

- All code must be written between the official start and the submission deadline — nothing pre-written counts. Submissions due Sunday Aug 23, 12 PM Argentina time.
- Team can be 1–4 people. Cannot use another team's code.
- Judging is entirely async — a 3-minute demo video and the repo, no live Q&A. There is no chance to clarify anything after submission, so the demo and README have to carry the full case on their own.
- Only one Tether track can be formally entered (WDK, Pears, QVAC are separate sponsor tracks). **We are entering QVAC Track 2** ("small models, hard tasks: tool use & reliability," $500 USDt, 2nd place). WDK is used inside the build as the wallet/tool layer, but WDK's own track is not being entered — no need to satisfy WDK-track-specific submission requirements.
- **Anti-slop gate, stated explicitly by the sponsor and treated as a hard filter, not a tiebreaker:** hallucinated SDK methods, dead code, or a README describing features that don't exist gets a submission discarded before the normal criteria are even applied. Keep the QVAC and WDK integrations thin and verifiably correct — permalinks to the exact files/lines using each SDK are what judges check first.
- Use only a testnet wallet with no real funds — WDK is beta, this is a hard rule from the sponsor, not just good practice.
- General judging criteria (apply on top of the QVAC-specific rubric below): Technicality, Originality, UI/UX/DX, Practicality, Presentation.
- QVAC's own published rubric (found on the predecessor hackathon's judging tab): Technical execution & Performance, Innovation & Model creativity, QVAC usage breadth, Artifact quality & Verification, Impact & Market relevance, **Originality — explicitly including prompt-injection resistance**, Awareness/social promotion, early-bird bonus, community social vote.

## The product

**Clara** — a fully local AI crypto companion (browser extension, desktop-first). Runs entirely on-device via `@qvac/sdk` — no cloud calls anywhere in the inference path. Uses WDK's CLI / `wdk-mcp-toolkit` as the only channel to the wallet.

**Core mechanic — bidirectional translation:**
1. **Transaction → plain language.** Before the user signs anything, Clara explains in plain language what it actually does ("this gives away all your NFTs," "this is a normal swap, looks safe"), flagging approval-drain patterns specifically.
2. **Plain language → transaction.** A natural-language request ("send $20 to my grandson") gets parsed into an actual WDK transaction, built and executed through the same guardrail layer. This direction always gets checked back through Direction 1's explainer before final confirmation — the two directions cross-verify each other.

**Shared policy layer:** spending caps, address allowlists, human-confirmation threshold above a limit. One coherent security model behind both directions, not two separate features.

**Reliability harness (this is the actual QVAC Track 2 deliverable — build this, not just the demo):**
- *Explain-accuracy:* run against a corpus of known-malicious vs. known-safe transactions, report false-positive/false-negative rate.
- *Construct-accuracy:* run a battery of natural-language requests (clean, ambiguous, adversarial), report how often Clara builds the correct transaction, correctly asks for clarification, or correctly refuses.
- This is "evidence, not vibes" — the numbers from these two benchmarks are the actual proof-of-work QVAC's rubric rewards, not just a clean demo take.

**Security hardening — apply to BOTH directions, especially Direction 2 (construction) since that's the one that can move money:**
- Function/tool semantic redefinition defense → tool semantics re-derived from source/schema every call, never trusted from conversation context (defends against the exact exploit that beat a prior $47K AI-wallet challenge — an attacker claimed to redefine what a transfer-approval function meant).
- Encoding/obfuscation defense → validation operates on decoded/normalized intent, not raw surface text (defends against Morse-code/base64-style filter bypasses seen in a real $150K wallet drain).
- Multi-turn decomposition defense → policy state persists and is evaluated across the whole session, not per-message (defends against attacks built gradually across several innocuous-looking turns).
- Reasoning-trace leakage defense → no raw chain-of-thought ever surfaced to the user/attacker-facing side.

## Why this shape (context, not instructions — for when you need to explain a decision)

- Every cloud-based "explain this transaction" competitor found in research (Blowfish, Wallet Guard, Pocket Universe, Rabby's preview, MetaMask's Agent Wallet) sends data to a server. Two of the five are already dead (Blowfish sunset into Phantom, Wallet Guard shut down March 2025). Nobody does this fully on-device — that's the real, defensible differentiator.
- Wallet-drainer/malicious-approval scams cost ~$494M in 2024, ~$84M in 2025, average time from bad approval to drained funds is under 32 seconds (Scam Sniffer). Real, sourced pain point.
- No existing WDK/QVAC combo does both directions in one local product — confirmed via research; this is genuinely open ground, not a rebuild of prior art.

## Feature menu (tiered — build Tier 1 first, treat 2–3 as stretch)

**Tier 1 (core companion identity, highest priority):**
- Voice assistant (QVAC: mic → Whisper/VAD → LLM → TTS) — talk to Clara, confirm transactions by voice.
- RAG-grounded crypto education (QVAC RAG) — explains jargon ("slippage," "gas") from a curated local knowledge base, not raw model memory.
- Named contacts, "send to Mom" (WDK's P2P Address Book, Holepunch-based, encrypted sync) — removes address-copying friction.
- Gasless by default (WDK gasless/paymaster modules) — no "you need ETH to send USDT" wall.
- Plain-language activity feed (WDK Indexer API + CoinGecko pricing module) — cross-chain history narrated as events.

**Tier 2 (if Tier 1 lands early):**
- Scan-to-import (QVAC OCR) — camera-read a QR code/paper wallet.
- "Is this popup safe?" (QVAC multimodal) — screenshot a suspicious DApp popup, Clara inspects it visually.
- Lending health-factor monitor (WDK Aave V3/Morpho) — plain-language "your loan is safe/getting risky."
- Fiat on/off-ramp with a real quote first (WDK MoonPay module).
- Natural-language swap/bridge (WDK swap + Swidge/USDT0 bridge modules).

**Tier 3 (stretch, only if time remains):** semantic history search (QVAC embeddings), one-pass portfolio summary (QVAC batch processing), LoRA personalization, delegated P2P inference offload, transparent x402 micropayments.

## Brand

- **Name: Clara.** Backronym: **C**rypto **L**ocal **A**I **R**eliable **A**ssistant. Also literally means "clear" in Spanish — reinforces the plain-language pitch on every mention. No brand collisions found.
- **Visual style: soft cyberpunk.** Pastel neon (soft cyan/lavender/pink, NOT harsh red/green/black), rounded friendly forms not sharp angular edges, gentle bloom/glow — conceptually tied to "your AI, your device, no cloud" (digital sovereignty) without reading as dystopian or intimidating. Full image-gen prompt already drafted (see below) — do not redesign from scratch, iterate on it.
- **The avatar's glow is functional, not decorative** — it doubles as the actual risk indicator: neutral/cyan while processing, green-tinted when a transaction checks out, amber-tinted when something's flagged. Three illustrated states needed: idle/listening, safe/confirmed, warning/flagged.
- **Tone of voice:** plain words over jargon, direct about real risk without being alarmist, and explicitly honest about uncertainty ("I'm not fully sure — here's what I found") rather than confidently guessing. This is the same behavior the reliability benchmark measures — the personality and the technical differentiator are the same thing said two ways.

**Avatar image-gen prompt (base):**
```
Digital illustration of a friendly young woman, AI companion persona,
soft cyberpunk aesthetic — pastel neon glow in cyan, lavender and soft
pink (NOT harsh red/green, NOT dystopian or aggressive), rounded gentle
facial features and soft flowing hair with subtle glowing highlights,
calm confident warm expression, small delicate glowing circuit-line
accents along cheekbone/temple (subtle, elegant, not heavy tech armor),
soft bloom lighting, gentle rim light, semi-flat modern digital
illustration style with clean shading, front-facing bust portrait,
dark navy/deep-indigo background to let the glow pop, high detail on
face, minimal detail elsewhere, trustworthy and approachable despite
futuristic style, no aggressive/edgy expression, no harsh contrast,
1:1 square composition, centered
```
Generate 3 state variants (idle/neutral cyan, safe/mint-green, warning/soft-amber) from the same seed lineage for facial consistency — see full variant prompts in `concept.md` if needed.

## Form factor & build order

- **Primary surface: browser extension**, built on WDK's existing `wdk-starter-browser-extension` (self-custodial wallet template). Chosen over mobile because: (1) the core pain point — malicious dApp signature requests — happens almost entirely in-browser, and (2) desktop-class hardware is a safer bet for running a 1–4B local model live without lag during the recorded demo, versus mobile's tighter RAM budget.
- Mobile (WDK React Native starter + QVAC Expo tutorial pattern) is a stretch/secondary surface only if the extension is solid with time to spare.
- **Still open, needs a decision before/while building:** which chain(s) the demo wallet operates on (keep to one or two), and the source/synthesis of the known-malicious-vs-safe transaction corpus for the explain-accuracy benchmark.

## Demo script (3-minute video)

1. Direction 1: a malicious approval transaction is presented — Clara explains what it would actually do, blocks/warns before signing.
2. Direction 2: natural-language request ("send $20 to my grandson") — Clara parses, builds, executes after confirmation.
3. Adversarial attempt: a manipulated request tries to trick the constructor into an unsafe send — guardrail holds, logged.
4. Reliability dashboard: explain-accuracy and construct-accuracy numbers across N runs, including honest failure cases.

## Repo

- **Name: `clara`** (or `clara-qvac` if you want the track visible in the name, matching this account's existing `faraday-qvac` naming convention).
- **Description:** "Clara — a local AI crypto companion. Explains what you're signing, builds what you ask for. 100% on-device, nothing ever leaves your phone."
- **License: Apache 2.0** — matches QVAC's own license, includes a patent grant (relevant given this touches transaction-construction/security logic), fully satisfies the hackathon's open-source requirement.
- ⚠️ Check the existing `faraday-qvac` repo in this account first — unclear if it's earlier related work or unrelated; don't duplicate or conflict with it unintentionally.

## Submission checklist

- [ ] Public repo, README explaining what was built and which QVAC capabilities/models were used.
- [ ] Permalinks — direct GitHub links to the exact files/lines where QVAC inference happens (checked first by judges).
- [ ] Recorded 3-minute demo video showing both directions running locally end to end.
- [ ] Model/hardware details: which model, quantization, machine, rough latency.
- [ ] Setup instructions that work from a clean clone.
- [ ] Testnet wallet only.
- [ ] No hallucinated SDK methods, no dead code — README claims must match what actually runs.

## Full supporting research

The complete research, competitive analysis, and decision trail behind every choice above lives in `/root/Hackathons/In-Progress/crecimiento-hackathon/`: `research.md` (prior art, competitive landscape, judge backgrounds), `judging-pattern.md` (inferred scoring emphasis per track), `ideas.md` (the full 50-idea brainstorm this concept was selected from), `concept.md` (this brief's source of truth, kept in sync with it).
