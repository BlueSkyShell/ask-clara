# Tracks

You can enter 1 track per sponsor. Four tracks total: WDK, Pears, and QVAC (Tether), plus a sponsor-agnostic General track (Crecimiento).

---

## 🟧 WDK Track (Tether)

*You can enter 1 track from this sponsor.*

### Overview

WDK (Wallet Development Kit) by Tether is an open-source, non-custodial toolkit for building wallets and payment flows into any app: one consistent interface across Bitcoin, Lightning, EVM, Solana, TON, TRON, and more, plus modules for swaps, bridging, lending, and fiat on/off-ramps. Keys stay on the user's device.

Modular: install only the chains/protocols you need. Available as an SDK (Node.js, Bare, React Native), a CLI with a bundled MCP server (so AI agents can operate a wallet), and gasless modules that let users pay fees in USD₮ instead of native gas tokens.

No smart contracts required to win this track — WDK handles keys, addresses, balances, and transactions.

### Prize breakdown

Total pool: up to $1,500 USDt, distributed at judges' discretion by merit, quality, originality, and impact.

- 🥇 1st — $1,000 USDt — **Best project built with the WDK CLI.** Uses the WDK CLI (and/or its bundled MCP server) as a core building block: agents with wallets, scripted payment flows, local wallet tooling, developer utilities.
- 🥈 2nd — $500 USDt — **Best gasless project.** Uses WDK's gasless wallet modules so users can transact without holding native gas.

### Track 1 — Build with the WDK CLI

The CLI is a local command-line wallet: create/unlock wallets, derive addresses, read balances/history, send native assets and tokens, manage networks/custom tokens, generate MoonPay on/off-ramp links. Ships `wdk-mcp`, an MCP server exposing wallet operations to MCP clients (Claude Desktop, Claude Code, OpenClaw).

Ideas:
- **AI agent with a wallet.** Wire `wdk mcp` into an MCP client; agent checks balances, quotes and sends USD₮ under user-defined guardrails (spending caps, allowlists, confirmation prompts). Bonus for a thoughtful safety model.
- **Scripted treasury/payouts.** Shell-based payroll/grants/bounty tool: read a CSV, preview transfers with `wdk send`, batch-execute, produce a receipt log via `--json`.
- **Merchant/invoicing tooling.** Terminal POS or invoice checker watching an address with `wdk get`, detects incoming USD₮, fires a webhook or prints a receipt.
- **Developer utilities.** Faucet bot, testnet ops helper, portfolio TUI, CI job using the CLI as wallet backend.
- **Agentic payments.** Combine CLI/MCP server with x402 so an agent can pay per API call.

### Track 2 — Build something gasless

Gasless modules: fees paid by a paymaster and settled in USD₮/USD₮0, or fully sponsored.

Ideas:
- **Zero-to-first-payment onboarding.** Empty wallet receives USD₮ and can send immediately, no "buy gas first" step. Show fee quote in USD₮ before signing.
- **EIP-7702**: upgrade an existing EOA, keep the address, delegate execution, run sponsored ERC-4337 UserOperations (batching, "first 10 tx free" growth mechanics).
- **Solana remittances/P2P payments** via the gasless Solana module (Kora-compatible paymaster), recipient ATA created automatically.
- **Subscriptions/tipping/in-game economies** — recurring or micro-value payments where gas would kill UX.
- **Cross-chain gasless flows** combining a gasless wallet with the USDT0 bridge or a swap module.

Judges look at: does it solve a real user problem, does it work end-to-end in the demo, is the WDK integration meaningful (not a thin wrapper), is the UX usable by a non-crypto person or an agent.

### Tech requirements

- Must use WDK as a core dependency: `@tetherto/wdk`.
- Track 1: `@tetherto/wdk-cli` (scoped package — the unscoped `wdk-cli` on npm is a different project).
- Track 2: at least one gasless wallet module (`wdk-wallet-solana-gasless`, `wdk-wallet-evm-7702-gasless`, `wdk-wallet-evm-erc-4337`, `wdk-wallet-ton-gasless`, `wdk-wallet-tron-gasfree`) and gas token USD₮.
- Node.js 22.18.0+.
- WDK packages are in beta — use a dedicated test wallet with limited funds, never a personal wallet with real money.

**Paymaster setup (Track 2):** no paymaster endpoints provided — get your own from Candide or Pimlico (a few minutes via their dashboards). Each gasless module's docs list what's needed (RPC, bundler URL, paymaster URL, paymaster token, and for EIP-7702 a delegation address); per-chain setup posts are on the WDK blog.

Testnet vs mainnet:
- Testnet USD₮ only available on Sepolia (via Candide/Pimlico).
- Other chains (Solana, TON, TRON, other EVMs): deploy your own mock USD₮ token, point paymaster config at it. Don't substitute another stablecoin's faucet token.
- Or work on mainnet with small amounts.

### Reusing code

- Reuse allowed; only what's built during the hackathon is judged.
- The WDK integration itself must be new, written this weekend.
- Don't bolt WDK on in parallel next to an existing wallet/payment layer just for the prize — will be discarded. The integration must actually do something in the product.

### AI-assisted coding

Fully allowed and encouraged (tooling provided: Build with AI, MCP Toolkit, Agent Skills, OpenClaw, x402). WDK integrations are only a few lines — models tend to over-engineer them, invent methods, hallucinate config. Obvious AI slop (hallucinated APIs, dead code, a README describing features that don't exist) gets discarded without further review. Use the Agent Skills/docs to stay grounded, and run the thing before submitting.

### Submission must include

- Public repo with README explaining what was built and which WDK modules were used.
- Permalinks to the WDK integration — direct GitHub links to specific files/lines where WDK is used (this is checked first).
- Recorded demo video (async) showing the flow running.
- List of WDK packages and versions installed.
- Setup instructions that work from a clean clone: install steps, `.env.example` with needed variables (RPC, bundler, paymaster, token addresses), and the run command.
- Network and token details: which chain was demoed, and the mock USD₮ contract address if deployed.

### Developer resources

- Docs home: https://docs.wdk.tether.io
- Node.js & Bare quickstart: https://docs.wdk.tether.io/start-building/nodejs-bare-quickstart/
- React Native quickstart: https://docs.wdk.tether.io/start-building/react-native-quickstart/
- Which wallet module do I need?: https://docs.wdk.tether.io/sdk/wallet-modules/which-wallet-module/
- Concepts & glossary: https://docs.wdk.tether.io/resources/concepts/
- Build with AI: https://docs.wdk.tether.io/start-building/build-with-ai/
- MCP Toolkit: https://docs.wdk.tether.io/ai/mcp-toolkit/
- Agent Skills: https://docs.wdk.tether.io/ai/agent-skills/
- OpenClaw: https://docs.wdk.tether.io/ai/openclaw/
- x402: https://docs.wdk.tether.io/ai/x402/
- WDK CLI overview: https://docs.wdk.tether.io/cli/
- CLI get started: https://docs.wdk.tether.io/cli/guides/get-started/
- CLI API reference: https://docs.wdk.tether.io/cli/api-reference/
- CLI configuration: https://docs.wdk.tether.io/cli/configuration/
- Use the MCP server: https://docs.wdk.tether.io/cli/guides/use-mcp-server/
- CLI security model (read before unlocking a funded wallet): https://docs.wdk.tether.io/cli/reference/security-model/
- Gasless Solana: https://docs.wdk.tether.io/sdk/wallet-modules/wallet-solana-gasless/
- EIP-7702 accounts: https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm-7702-gasless/
- Smart accounts (ERC-4337): https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm-erc-4337/
- Gasless TON: https://docs.wdk.tether.io/sdk/wallet-modules/wallet-ton-gasless/
- Gas-free TRON: https://docs.wdk.tether.io/sdk/wallet-modules/wallet-tron-gasfree/
- Paymaster setup guides, per chain: https://wdk.tether.io/blog
- Indexer API: https://docs.wdk.tether.io/tools/indexer-api/
- React Native starter: https://docs.wdk.tether.io/examples-and-starters/react-native-starter/
- React Native UI Kit: https://docs.wdk.tether.io/ui-kits/react-native-ui-kit/
- Changelog: https://docs.wdk.tether.io/overview/changelog/
- GitHub: https://github.com/tetherto/wdk
- Discord: https://discord.gg/tetherdev
- X/Twitter: https://x.com/WDK_tether

### Mentors & judge

- Raquel, DevRel — Telegram: @rraigal, Twitter: @rraigal_
- Dedicated topic in the hackathon Telegram group; deeper technical questions go to Discord (https://discord.gg/tetherdev) or Keet (`keet://chat/gfo4d3jdeokkg3uouq4obczt1wzepyb1e5ip9694f8c4ow9opsof6nnnj4mis3aer3acu1do14hgax8anggkd4i4w8ssonwa7icctc4t1c85anm518x45mendcrqjcntn9d1zm31wi8g9xosqtuid7cf6sfhcyedtjnjgnbszntxzenp4p3jpn8pueo4yya`).
- Judging starts 1 PM (ARG) Sunday 23rd, ~4 hours. Async demo video attached to submission.

### Workshop

**WDK Essentials: and how to vibe-code with it without shipping slop** — Saturday 10 AM (ARG time), at the venue and streamed. Covers CLI install, creating/unlocking a wallet, reading balances, sending a transfer, setting up a gasless account, plus AI-assistant practices (Agent Skills, MCP Toolkit) to avoid hallucinated methods and over-engineered wrappers. Bring a laptop.

---

## 🍐 Pears Track (Tether/Holepunch)

*You can enter 1 track from this sponsor.*

### Overview

Pear is a peer-to-peer runtime, development, and deployment platform by Holepunch. Build an app, deploy it with the Pear CLI, and it reaches users directly through the swarm — no servers, no app store, no package registry, no infrastructure to pay for. Updates flow peer-to-peer too.

Underneath is Bare, a small embeddable JS runtime. The app + runtime compile into a single standalone binary per OS/architecture — users need no Node.js, no Bare, not even the Pear CLI.

The weekend's loop: build a terminal tool, ship it as one executable, have anyone install it with `pear install pear://<your-key>`, then push an update that reaches them automatically.

### Prize breakdown

Total pool: up to $1,500 USDt, judges' discretion. Both prizes go to the same challenge — one brief, not separate categories.

- 🥇 1st — $1,000 USDt
- 🥈 2nd — $500 USDt

### The challenge

Build a standalone CLI tool, deploy it with the Pear CLI, make it installable with `pear install`, with peer-to-peer OTA updates. Start from any variant of `hello-pear-bare`.

**Hard requirement:** the tool must be installable with `pear install pear://<key>` — genuinely deployed with the Pear CLI and seeded (a repo that just builds locally isn't enough). Judges install it the same way any user would.

Everything else is open — the tool itself doesn't have to be peer-to-peer.

### Track focus

Ideas:
- **A system tool.** Small, does one job well, benefits from being an evergreen self-updating binary. Reference: `swap` CLI (https://github.com/holepunchto/swap) — tiny-scoped evergreen one-shot CLI.
- **A command-line game.** Self-contained, fun to demo; OTA updates let you patch balance/add levels mid-event.
- **A messaging TUI.** Chat, notes, file drop, presence — natural fit for going peer-to-peer with Hyperswarm.
- **A developer tool.** Something that would've been a shell script, shipped as a real cross-platform binary.
- **Anything else** — services, daemons, REPLs, transport hooks.

Pick your process shape from `hello-pear-bare`'s three branches:

| Branch | Shape | Use it for |
|---|---|---|
| `main` | Updater in a Bare worker thread | Long-lived programs (TUIs, REPLs, services) keeping P2P logic off the main thread |
| `variant/single-thread` | Updater in the main process | Long-lived programs that don't need a separate thread |
| `variant/daemon` | Detached daemon updates in background; command returns immediately | Short-lived one-shot commands (like `git`) |

**Bonus direction — BLE-Swarm:** peer discovery over Bluetooth Low Energy, no internet at all. Local-first chat, file drop between nearby laptops, a game that finds opponents in the room, offline sync — anything where "no network" is a feature. Reference: `ble-swarm` (https://github.com/mafintosh/ble-swarm).

Judges look at: clean `pear install`, whether OTA updates actually work end to end, whether the process shape fits the tool, whether it's something a person would genuinely use.

### Tech requirements

- Start from any variant of `hello-pear-bare`.
- Deploy with the Pear CLI and seed it so it's installable via `pear install pear://<key>` — this is the entry requirement.
- Ship working P2P OTA updates; demonstrate a real update reaching an installed copy.
- Submit the `pear://` link — without it the project can't be installed or judged.
- Have P2P connectivity. Using Hyperswarm, Hypercore, Hyperdrive, etc. is encouraged.

Setup:
```
# Install the Pear CLI
curl https://install.pears.com/pear.sh | sh          # macOS / Linux
irm https://install.pears.com/pear.ps1 | iex          # Windows

# Start from the terminal boilerplate
git clone https://github.com/holepunchto/hello-pear-bare
cd hello-pear-bare && npm install

pear touch                    # generates your upgrade link
# paste it into the "upgrade" field in package.json — the app won't start without it

npm start                     # dev mode, updates disabled
npm run make                  # build a standalone binary into out/<platform>-<arch>
```

`pear --menu` (3.2.0+) browses every command as a filterable list with a form for the flags.

Gotchas: the template ships a placeholder upgrade link and fails with `INVALID_URL` until replaced with a real one from `pear touch`. On the daemon variant, that error goes to `<storage>/updates.log` instead of the terminal.

### Reusing code

- Reuse allowed; only what's built during the hackathon is judged.
- The Pear deployment (app, `pear://` link, release) must be new, from this weekend.
- Starting from `hello-pear-bare` is the recommended path, not just allowed.

### AI-assisted coding

Allowed. Pear and Bare are not Node.js, and models confidently assume they are — expect hallucinated Node APIs, wrong module names, imaginary CLI flags. Ground the assistant in the actual docs and test on a clean machine before submitting.

### Submission must include

- Public repo with README explaining what was built and which branch/variant it started from.
- The `pear://` link — how judges install and run the entry. Keep it seeded through judging.
- Recorded demo video (async) showing installation and an OTA update landing.
- Which platforms binaries were built for.

### Developer resources

- Pear: https://pears.com/
- Docs home: https://docs.pears.com/
- Install the Pear CLI: https://install.pears.com
- Getting started: https://docs.pears.com/getting-started/
- `hello-pear-bare` template guide: https://docs.pears.com/getting-started/from-a-template/start-from-hello-pear-bare/
- `hello-pear-bare` repo: https://github.com/holepunchto/hello-pear-bare
- Peer-to-peer, demystified: https://docs.pears.com/explanation/peer-to-peer-demystified/
- How Pear and Bare fit together: https://docs.pears.com/explanation/pear-and-bare/
- Troubleshooting: https://docs.pears.com/how-to/troubleshooting/
- Release & distribute your app: https://docs.pears.com/how-to/operate-an-app/
- Manual deployment: https://docs.pears.com/how-to/operate-an-app/manual-deployment/
- Build & package: https://docs.pears.com/how-to/operate-an-app/build-and-package/
- Multisig releases: https://docs.pears.com/how-to/operate-an-app/multisig/
- Publish with GitHub Actions: https://docs.pears.com/how-to/operate-an-app/github-actions/
- Seeding with `pear seed`: https://docs.pears.com/explanation/availability-and-blind-peering/
- Release pipeline, explained: https://docs.pears.com/explanation/deployment-releasing-apps-p2p/
- Storage and distribution: https://docs.pears.com/explanation/storage-and-distribution/
- Pear OTA / pear-runtime API: https://docs.pears.com/reference/pear/runtime/
- Pear CLI reference: https://docs.pears.com/reference/pear/cli/
- Interactive command menu: https://docs.pears.com/how-to/browse-commands-with-the-interactive-menu/
- Connect to peers (HyperDHT, Hyperswarm): https://docs.pears.com/how-to/connect-to-peers/
- Store and replicate (Hypercore, Corestore, Hyperbee): https://docs.pears.com/how-to/store-and-replicate/
- Stream and share media (Hyperdrive): https://docs.pears.com/how-to/stream-and-share-media/
- Blind peering: https://docs.pears.com/how-to/blind-peering/
- Manage identity: https://docs.pears.com/how-to/manage-identity/
- Module catalog: https://docs.pears.com/reference/modules/pear-modules/
- Bare modules: https://docs.pears.com/reference/modules/bare-modules/
- Bare runtime API: https://docs.pears.com/reference/bare/runtime/
- `ble-swarm` (bonus direction): https://github.com/mafintosh/ble-swarm
- Ecosystem Spotlight — `swap`: https://pears.com/news/ecosystem-spotlight-swap-evergreen-one-shot-atomic-exchange-cli/
- Hello Pear Boilerplates: https://pears.com/news/hello-pear-boilerplates/
- Pear Revolution (CLI v3): https://pears.com/news/pear-revolution/
- All news: https://pears.com/news
- GitHub: https://github.com/holepunchto
- X/Twitter: https://twitter.com/Pears_p2p
- YouTube: https://www.youtube.com/@Pears_p2p
- Showcases: https://pears.com/?section=showcases

### Mentors & judge

- Mentorship IRL & online; dedicated Telegram topic. Deeper technical questions go to Keet, Pear Development room (https://keet.io/chat/#yfo6dbyb4iz9bhhdq6nzq888dto4b4mxttz94i8ttaidrppwnmtehgn4so6u5jy9cfg41x7aoht5egf8354wjaz7eip5am37ie9ffy3gpq4bngkz35fx4f9zxpeo53qt679q4e8bjazbxoo356pz96c9munhaye). Pear has no Discord — Keet is where the team is.
- Judge: dmc, Creator of Pear — Keet: @dmc0, Twitter: @davidmarkclem
- Judging starts 1 PM (ARG) Sunday 23rd, ~4 hours. Async demo. **Keep the `pear://` link seeded through judging** — if judges can't install it, they can't score it.

---

## 🔷 QVAC Track (Tether)

*You can enter 1 track from this sponsor.*

### Overview

QVAC by Tether is a local AI SDK: runs models entirely on-device (no cloud, no API keys, no data leaving the machine) through one unified interface in JS/TS (`@qvac/sdk`) or Python (`tetherto-qvac-sdk`). Same code runs on Linux, macOS, Windows, Android, iOS.

Covers text generation, embeddings, RAG, fine-tuning, multimodal, OCR, transcription, text-to-speech, translation, and more. Open source (Apache 2.0). Also ships an HTTP server with an OpenAI-compatible endpoint — point any existing AI tool at `localhost` and it works.

Local means private (sensitive data never leaves the device), cheap (no inference bill), offline-capable. The craft is getting a 1–4B model to do real work reliably.

### Prize breakdown

Total pool: up to $2,000 USDt — $1,500 across two project prizes, plus a $500 Vault Guardian pool. Judges' discretion.

- 🥇 1st — $1,000 USDt — **Local agents that replace operations work.** Build an agent doing back-office document/judgment work entirely on-device.
- 🥈 2nd — $500 USDt — **Small models, hard tasks: tool use & reliability.** Best project at chaining tools correctly with a small local model (without forgetting a step, ignoring a result, or inventing an answer).
- 🛡️ **Vault Guardian** — $500 USDt, split between everyone who beats it. Not judged, not tied to your project — an open side challenge (see below).

### Track 1 — Local agents for operations work

Ideas:
- **Invoice reconciliation.** Ingest invoices (PDF/photo/scan) via OCR, extract line items, match against POs/bank statements, flag mismatches with a human-checkable explanation. Flagship use case.
- **Post-trigger credit risk workflow.** Not scoring risk — the operations around it: pull relevant docs, summarize exposure, draft the internal note, propose next actions, route to the right person.
- **Payment/transaction analysis.** Anomaly triage, merchant categorization, duplicate-charge detection, plain-English monthly summaries.
- **NLP-to-finance, generally.** Contract terms → payment schedule, receipts → ledger, email thread → reconciliation task.
- **Multimodal document understanding.** Bad-lighting receipt photo → structured data; handwritten delivery note → line items; combine OCR + multimodal in one pipeline.

Strong submissions: work on messy real inputs (not one cherry-picked clean PDF), show their reasoning for human audit, and are honest about uncertainty rather than confidently hallucinating.

### Track 2 — Tool use and small-model reliability

Ideas:
- **Multi-step tool chaining.** Search, calculator, local DB, file reader in sequence — genuinely uses returned results without dropping context.
- **Grounded answers from live sources.** Wire a local model to external search/an API so output is anchored in retrieval; show it refusing to answer when the tool returns nothing useful.
- **Reliability engineering.** Validation layers, retries, structured-output enforcement, self-checking passes. Show the failure modes hit and how they were designed around.

Strong submissions: evidence, not vibes — run the same task N times, show the success rate, show failures that couldn't be fixed as well as ones that could.

### Extra challenge — The Vault Guardian

Open to everyone, independent of your project submission. $500 USDt split between everyone who beats it.

A local-first prompt-injection game: a defender AI holds a secret (for the hackathon, a WDK wallet with real funds). Chat with it and try to get it to release them. All inference runs locally via `@qvac/sdk` on Bare (no cloud, no API calls). Reference implementation shared at the hackathon.

### Tech requirements

- Must use QVAC as the inference layer: `@qvac/sdk` (JS/TS) or `tetherto-qvac-sdk` (Python). All model inference must run locally.
- Using QVAC's OpenAI-compatible HTTP server as the local model provider counts; calling a cloud model API does not.
- Vault Guardian is separate from project submission — enter it regardless of whether you're competing for a project prize.
- Check system requirements first: https://docs.qvac.tether.io/system-requirements/ (platforms, runtimes, compatibility matrix).
- Budget RAM: 4B model at Q4 needs ~4 GB (practical ceiling on a normal laptop); 8B wants ~8 GB. Models download once on first run (~2.5 GB for a 4B).
- Models on Hugging Face: https://huggingface.co/qvac — any open-source model is fine.
- VisionPsy is not yet supported by the SDK — use the SDK's multimodal/OCR capabilities instead.
- Skip image/video generation — output quality isn't judge-ready; projects leaning on them won't score well.

### Reusing code

- Reuse allowed; only what's built during the hackathon is judged.
- The QVAC integration itself must be new, written this weekend.
- Don't bolt QVAC on in parallel next to an existing cloud AI layer just for the prize — will be discarded. Local inference must do real work in the product.

### AI-assisted coding

Allowed and encouraged — QVAC ships an OpenAI-compatible server specifically so it plugs into existing tooling. But review what the model writes: small-model orchestration is easy to fake. Hallucinated SDK methods, dead code, a README describing capabilities that don't exist, or a demo that only works on one cherry-picked input all get discarded without further review. Run it on inputs not chosen in advance before submitting.

### Submission must include

- Public repo with README explaining what was built and which QVAC capabilities/models were used.
- Permalinks to the QVAC integration — direct GitHub links to files/lines where inference happens (checked first).
- Recorded demo video (async) showing it running locally, end to end.
- Model and hardware details: which model, quantization, machine, rough latency.
- Setup instructions that work from a clean clone.

### Developer resources

- Docs home: https://docs.qvac.tether.io/
- Introduction & core concepts: https://docs.qvac.tether.io/introduction/
- System requirements & compatibility matrix: https://docs.qvac.tether.io/system-requirements/
- JS/TS SDK quickstart: https://docs.qvac.tether.io/js-ts-sdk/
- Python SDK quickstart: https://docs.qvac.tether.io/python-sdk/
- API reference: https://docs.qvac.tether.io/reference/api/
- Troubleshooting: https://docs.qvac.tether.io/troubleshooting/
- Text generation: https://docs.qvac.tether.io/ai-capabilities/text-generation/
- OCR: https://docs.qvac.tether.io/ai-capabilities/ocr/
- Multimodal: https://docs.qvac.tether.io/ai-capabilities/multimodal/
- RAG: https://docs.qvac.tether.io/ai-capabilities/rag/
- Text embeddings: https://docs.qvac.tether.io/ai-capabilities/text-embeddings/
- Fine-tuning (LoRA): https://docs.qvac.tether.io/ai-capabilities/fine-tuning/
- Batch processing: https://docs.qvac.tether.io/ai-capabilities/batch-processing/
- Transcription: https://docs.qvac.tether.io/ai-capabilities/transcription/
- Voice assistant: https://docs.qvac.tether.io/ai-capabilities/voice-assistant/
- Delegated inference (P2P): https://docs.qvac.tether.io/p2p-capabilities/delegated-inference/
- CLI: https://docs.qvac.tether.io/cli/
- OpenAI-compatible HTTP server: https://docs.qvac.tether.io/cli/http-server/
- Configuration & plugins: https://docs.qvac.tether.io/configuration/
- Model download lifecycle: https://docs.qvac.tether.io/models/download-lifecycle/
- Electron tutorial: https://docs.qvac.tether.io/tutorials/electron/
- Expo tutorial: https://docs.qvac.tether.io/tutorials/expo/
- Models overview: https://qvac.tether.io/models/
- Hugging Face: https://huggingface.co/qvac
- Fabric LLM (fine-tuning engine): https://qvac.tether.io/dev/fabric
- Genesis (synthetic pre-training dataset): https://qvac.tether.io/dev/genesis
- Bare runtime: https://bare.pears.com
- GitHub: https://github.com/tetherto/qvac
- Discord: https://discord.com/invite/tetherdev
- Blog: https://qvac.tether.io/blog
- X/Twitter: https://x.com/QVAC
- QV.AC (see QVAC in action): https://qv.ac

### Mentors & judges

- Raquel, DevRel — Telegram: @rraigal, Twitter: @rraigal_
- Dedicated Telegram topic; deeper technical questions go to Discord (https://discord.com/invite/tetherdev) or Keet (`keet://chat/gfo61f4e6zc5t1ifncyh9yp7s5eynbruz5bs95oc5ufn3e79entmhicijfysdat4uqz3s71sdqenc5iaufamq96afr1u8k15jntooq3wae8zzfqxeqapfspke3u5uthzquc7kwmyyzz9xcx61jjojxwpage3nyedtmrawhnjaktxzenpnhd4f67yjsa5aya`).
- Judging starts 1 PM (ARG) Sunday 23rd, ~4 hours. Async demo.

### Workshop

**Local AI That Actually Ships — QVAC Essentials and AI Coding Good Practices** — Saturday 9:30 AM (ARG time), at the venue and streamed. Covers SDK install, loading/running a model locally, picking the right model for available RAM, OCR/multimodal/RAG/tool-calling setup, where small models break, validation/structured-output patterns, and grounding AI assistants to avoid hallucinated methods. Bring a laptop.

---

## 🌞 General Track (Crecimiento)

*You can enter 1 track from this sponsor.*

### Overview

Recognizes the most outstanding projects built during the hackathon, regardless of category — Crypto, Web3, AI, Robotics, or anything else. Rewards strong execution and high-impact solutions.

### Prize breakdown

Total pool: $500

- 🥇 1st — $300 USDC
- 🥈 2nd — $200 USDC

### Mentors

Multiple mentors available in the Mentor's Directory.

---

## Shared hackathon schedule

- Kickoff: Saturday 12 PM (ARG time).
- Wraps: Sunday 12 PM (ARG time) — submission deadline.
- Judging: Sunday 1 PM–5 PM (ARG time), async.
- Closing Ceremony: Sunday 5 PM (ARG time), streamed.
- Workshops Saturday morning: QVAC Essentials (9:30 AM ARG), WDK Essentials (10 AM ARG).
