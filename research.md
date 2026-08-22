# Background Research

Compiled ahead of brainstorming, so we don't propose something that already exists, already won a prior round, or duplicates an official example app. Five parallel research passes: Tether's broader grants/hackathon history, and prior art specific to each of WDK, Pears, and QVAC.

**Confidence note:** DoraHacks pages are JS-rendered SPAs that resist scraping (405s / empty shells on direct fetch), so several winner lists below are incomplete — "submitted/notable" is not the same as "confirmed winner." Where a gap exists, it's flagged rather than papered over. If precise avoidance of a specific prior winner matters, verify directly on DoraHacks/Superteam Earn before committing to an idea.

---

## Tether ecosystem — grants & hackathon history (general)

### Tether Developer Grants Program
Launched May 11, 2026 (tether.io announcement: "Tether launches developer grants program to fund local-first AI and payments infrastructure"). $1,500–$4,000 per deliverable, paid in USD₮ or BTC, no public recipient list found. Priority funding areas: WDK/QVAC/MDK/Pears **core libraries**, docs/onboarding, apps built on Tether's stack, decentralization/edge-AI/P2P/crypto research, tooling & open standards.

Separately, Tether/Bitfinex has a track record of large FOSS grants outside hackathons: $250K to OpenSats, $100K ×2 to BTCPay Server Foundation, $100K to Qubes OS — all payments/privacy/Bitcoin infra.

**Takeaway:** the grants program (not just hackathon prizes) explicitly favors tooling/infra/documentation contributions to the core libraries. A project that also reads as a plausible grant deliverable (reusable module, not just a demo) has a second life beyond the hackathon.

### Cross-track sponsored events
- **Avalanche × Tether WDK Builder Sprint** (Blockchain Jungle, Costa Rica, Nov 8–9 2025) — 8hr sprint, payment apps on Avalanche C-Chain + WDK, winners advanced to Startup World Cup regionals. No named winners found.
- **Tether Developers Cup** (DoraHacks, football-themed) — 3 tracks (Pears/QVAC/WDK, $1K each) + $5K Cup Champion. Winners not confirmed via search.
- **Tether Frontier Hackathon Track** (Superteam Earn / Solana Colosseum Frontier) — winners not confirmed.
- Tether also sponsors non-crypto-native events (e.g. Cyber Warrior Hackathon 2025, Thailand, cybersecurity) — shows the sponsorship pattern isn't narrowly wallets/AI.

### Pattern by track (from what did place, across all sources)
- **QVAC** entries skew toward on-device assistants (voice/vision/productivity), P2P inference, and dev tooling — not payments.
- **WDK** entries skew toward AI-agent-controlled wallets and payment/lending/tipping bots — Tether's clearest "financial inclusion/payments infra" push.
- **Pears** entries skew toward generic P2P consumer apps (chat, location, whiteboard, chess) — least finance-specific track, more "local-first software" broadly, though Holepunch's own dev-infra repos (hyperbeam, hypershell, hyperssh) lean toward network plumbing.

---

## WDK Track — prior art

**What exists already:**
- **Official showcase** (docs.wdk.tether.io/overview/showcase): Rumble Wallet (creator-tipping), Tether Wallet (flagship consumer wallet), `wdk-starter-browser-extension` (Chrome extension starter), `wdk-wallet-evm-x402-facilitator` (WDK EVM wallets as x402 facilitators), `x402-usdt0` (full x402 reference impl on Plasma), `wdk-mcp` (community MCP wrapper, separate from official `wdk-mcp-toolkit`), a React Native starter (alpha).
- **Blog tutorial**: a voice-enabled payment agent (speech → LLM → WDK transfer, name-based address book, Whisper-alike transcription + Ollama/Llama 3.1 + Fulcrum for BTC) — dev.to/chideraao.
- **Directly relevant predecessor hackathon**: *Hackathon Galactica: WDK Edition 1* (DoraHacks, Feb 25–Mar 22 2026), $30K pool ($6K/$3K/$1K overall + four $3K/$2K tracks: Agent Wallets, Lending Bot, Autonomous DeFi Agent, Tipping Bot), framed around "agents as economic infrastructure." **No winners list is published or indexed anywhere** — exhaustively checked: DoraHacks itself hard-blocks non-browser fetches (405/403 on `/detail`, `/buidl`, and `/winner` URLs alike), a hackathons.space mirror confirms the event "has ended" but lists no winner names, and no Tether channel, DoraHacks newsletter (Feb–Apr 2026 editions), or press coverage published results after the March 22 close. **Atlas** (github.com/Gitthack/atlas-wdk-hackathon) — an autonomous agent that hunts bounty platforms, evaluates ROI, executes tasks, and self-settles via WDK wallets — is a confirmed *submission* to the Agent Wallets track, referenced in secondary coverage as an example project, but **its win/placement status is unconfirmed** — do not treat it as a known winner. If this matters later, the only remaining path to certainty is rendering the DoraHacks page with a real browser (it's a JS SPA that blocks plain HTTP fetch) rather than search/fetch tools.
- **Broader industry (non-Tether)**: Coinbase's x402 (now Linux Foundation-hosted, $50B+ processed), Google's Agentic Payments Protocol interop with x402, Nevermined's MCP monetization pattern, generic "MCP server + EVM wallet" repos (`wallet-agent`, `Agent Wallet` on mcpmarket) already commoditize "AI agent that checks balance / sends tx via MCP."

**Already crowded — avoid:**
- Another x402 facilitator (two of six community showcase entries already are one).
- Another single-chain voice/chat-to-wallet agent (already demoed in the official blog tutorial).
- Another "autonomous bounty-hunter agent" (Atlas already did this in the predecessor hackathon).

**Genuine gaps / opportunities:**
1. **Multi-chain gasless orchestration as the product** — an agent/router that picks the cheapest or fastest gasless rail *across* EVM-7702, TON-gasless, and TRON-gasfree per transaction. Nothing in the showcase composes across gasless modules; every community entry is single-chain.
2. **MCP-server-as-policy-layer** — spending limits, session keys, multi-agent approval workflows built on the elicitation/human-confirmation hooks already present in `wdk-mcp-toolkit`. Flagged as a toolkit capability but no showcase project demos it as the core UX (this maps well to the CLI track's "bonus points for a thoughtful safety model" callout).

---

## Pears Track — prior art

**What exists already:**
- **Official showcases** (pears.com/?section=showcases) — all GUI/consumer apps, none CLI-only: Keet.io (Holepunch's flagship E2E encrypted chat), QV.AC (local-only AI assistant), Holesail.io (P2P tunnels), Wherefam.com (private location sharing), Rewindbitcoin.com (theft-reversible BTC wallet). News also mentions PearPass (Tether Data password manager) and P2P Chess.
- **Global Pears Hackathon** (~2025, 1,000+ registrations, with Code With Harry). All consumer/GUI apps, not CLIs. A separate Pear × Anthropic Hackathon (pear.vc) exists — worth checking for rules overlap.

   **Winners and why:**
   - **🥇 WhereFam** — private P2P location sharing, built on Pear Runtime with Bare Kit for the native mobile build; shares live location directly device-to-device with no time/user caps and no server ever seeing the data. **Explicit judge rationale exists** — David Mark Clements (the Pears track judge for this new hackathon) is quoted verbatim in the winners press release: *"Nothing is more important to users than the privacy of their family, and WhereFam is an excellent example of how peer-to-peer technology enables safety and security."* This is the single clearest, most directly transferable signal in all of this research — it names privacy-through-genuine-P2P-architecture as exactly what impressed him.
   - **🥈 Peer-to-Peer Chess** — low-latency real-time chess with no server intermediary; players connect via a shared game ID using Hyperswarm for peer discovery, plus hypercore-crypto and b4a. No project-specific rationale published — the release only credits it generically for "demonstrating direct peer connection capabilities."
   - **🥉 Hypersketch** — real-time collaborative P2P whiteboard "built entirely on Pear Runtime," three-person team. No explicit judge rationale found; the creators' own interview praises the dev experience (docs, no server costs) but that's their opinion, not the judges'.
   - **Honorable mention — Alaric** — a decentralized app/"room store," a marketplace for discovering and sharing P2P apps/rooms in the Pear ecosystem. No rationale published.
   - **General (non-project-specific) judge commentary** from the release: Holepunch CEO Mathias Buus Madsen on ecosystem growth; Clements on how fast entrants integrated the P2P infra; judge Guy Swann on achieving sovereignty/privacy without sacrificing UX.
- **pears.com/news** ecosystem spotlights: `swap` (the atomic-file-swap CLI given as this track's reference), "Hello Pear Boilerplates," and a "P2P from Scratch" educational series — Holepunch is actively pushing devs toward standalone-binary CLI tools as a category but has few flagship examples besides `swap` itself.
- **github.com/holepunchto** highest-starred non-core repos are dev-infra CLI tools riding on Hyperswarm's NAT traversal: hyperbeam (542★, E2E encrypted pipe/screen-share), hypershell (253★, spawn P2P authenticated shells), hyperssh (156★, SSH over Hyperswarm), mininet (116★, virtual network sim). None ship via `pear install pear://<key>` + OTA as their headline feature — that pattern is essentially only demonstrated by `swap`, which is intentionally trivial.
- **ble-swarm** (mafintosh, 62★, 3 forks, ~12 commits) — essentially dormant. A bare BLE-UUID-swarm-to-Node-stream primitive, not a finished tool. Nobody has built a real offline/no-internet P2P CLI app on top of it.

**Pattern / gap:**
1. Nearly everything polished and showcased is a GUI/Electron consumer app (chat, wallets, location, whiteboards, password managers).
2. The **CLI-native, standalone-binary** niche (Bare executables, `pear install pear://<key>`, OTA-first) is where Holepunch is actively pushing the ecosystem, but has almost no real-world examples beyond toy/reference tools and older network-plumbing utilities.
3. **BLE/offline P2P discovery is essentially unbuilt** — `ble-swarm` is a stub, not a product.

**Opportunity:** a genuinely useful, non-trivial developer/ops CLI utility (not a toy like `swap`, not another tunnel/SSH clone) whose real selling point is P2P OTA updates as a *feature* — e.g. zero-registry distribution that works across a team without npm/GitHub — optionally with a BLE offline-discovery mode as a bonus differentiator. This combination doesn't appear to exist yet anywhere in the showcase, hackathon history, or holepunchto org.

---

## QVAC Track — prior art

**How many QVAC hackathons have actually happened:** just one QVAC-specific event so far, plus one broader multi-track event that included QVAC. Verified directly against the live DoraHacks page (not just search snippets), since two earlier research passes on this topic gave inconsistent-looking summaries that turned out to be two different slices of the same event:

1. **QVAC Hackathon I — "Unleash Edge AI"** (dorahacks.io/hackathon/qvac-unleach-edge-ai-i) — the DoraHacks page explicitly calls itself "the first official QVAC Hackathon." Registration opened May 25 2026, build period June 1–21 2026, winners announced July 3 2026. Organized by the QVAC team at Tether. The public portfolio microsite (hds-t.github.io/qvac-hackathon-alpha-landing, informally labeled "Alpha Edition" — same event, not a separate one) showcases 46 of the ~102–136 submitted projects from 446 registered hackers. Other featured (non-winning) projects from the same 46: **Mina Bot** (AI invoice sorter for chat apps), **QVAC Document Analyzer** (Q&A over fed documents), **UnDocOmplex AI** (private legal document analysis), **QashFlow** (privacy-focused financial management desktop app), **Barrymore** (AI calendar assistant), **Slack Scribe**/**Daily Updates Slack Bot** (office automation), **AI Folder Analyzer**, **XLR8**, **QVAC Web Relay**, **Pi Camera Analytics**, **Pear Epub Reader**, **QVAC Model Bench Mini**, **Talk to Bitfinex**, **LocalLingo**, and **TaleTrip** (bilingual family-trip picture-book generator, part of the same ~102-136 submissions, just not one of the 46 highlighted).

   **Winners and why (as far as it's published):**
   - **🥇 QVAC Home Assistant** — also won **Best Hardware**. A residential-automation app running QVAC inference locally on home hardware to control lighting, ventilation, doors, etc. No judge quote or written rationale was published for either award; the double win (Overall 1st + Best Hardware) is the strongest available signal it scored well on the stated rubric (see below), but that's an inference, not a stated reason.
   - **🥈 Assist** — also won **Most Entertaining**. A real-time vision-assistance app doing continuous visual scene analysis to help users understand their environment (multimodal/computer-vision). No rationale published beyond the category label itself, which implies its demo/presentation style stood out.
   - **🥉 QMesh** — P2P distributed inference infrastructure letting multiple devices share inference load instead of relying on centralized cloud compute. Its own framing ("addressing expensive centralized AI infra") maps directly onto the rubric's "Technical execution & Performance — P2P/delegated inference" line — the closest thing to a stated "why" found, though it's still the project's self-description, not a judge's comment.
   - **Best Design — Lucy** — a productivity-app automation assistant. "Best Design" is the only stated reason; implies it won specifically on UI/UX polish, a separate axis from the core technical criteria.
   - **Published judging rubric** (found on the DoraHacks page's "Prizes & Judging" tab): Technical execution & Performance (quality, optimization, TTFT/TPS, P2P/delegated inference), Innovation & Model creativity, QVAC usage (breadth of the QVAC stack used), Artifact quality & Verification, Impact & Market relevance, Originality (including prompt-injection resistance — notable, given this event predates the Vault Guardian side-challenge concept), Awareness/social promotion, an Early-bird bonus, plus a community social vote on Discord/Keet.
   - **No per-project judge write-ups exist anywhere** (DoraHacks results page, qvac.tether.io/blog, X) — only the rubric above and the award-category labels. Any more specific "why" would be invented, so none is offered here.
2. **Tether Developers Cup** (dorahacks.io/hackathon/tether-developers-cup) — a separate, broader event, June 28–July 15 2026 (finalist pitches July 15–18, winners announced July 19), 245 hackers, 8,000 USDt total across **three tracks: Pears, QVAC, and WDK** (1,000 USDt per track winner + 5,000 USDt Cup Champion). QVAC is one of three tracks here, not the event's sole focus — specific per-track winners weren't confirmed via search.

**No "QVAC Hackathon II" was found** as a distinct named follow-up — checked DoraHacks directly (a guessed `qvac-hackathon-ii` slug 404s), qvac.tether.io/blog, github.com/tetherto/qvac, and X/@qvac. If a second QVAC-specific edition exists, it isn't publicly indexed yet; the Developers Cup is the closest thing to a successor, and it's multi-track rather than QVAC-only. Worth a manual DoraHacks check closer to brainstorming in case a new listing has gone up since this research pass.

**Also relevant:** the **official examples repo** (github.com/tetherto/qvac-examples, 11 apps) includes **qvac-invoice-manager-demo** — OCR + structured extraction from invoices/receipts with schema validation — as an *official reference app*, plus `qvac-desk-tidy-demo` (file org by content classification) and `qvac-natural-language-to-sql`.

No project across either event or the examples repo does **general back-office ops automation with reliability/success-rate benchmarking**, and none combines QVAC with WDK for a wallet-guarding agent.

**Already crowded — avoid:** a bare invoice-OCR demo (it's the official example app), a generic document-Q&A assistant, a generic calendar/Slack office bot (all directly precedented).

**Genuine gap:** rigorous **tool-use reliability engineering** (Track 2's brief) — running the same task N times and reporting success rate, honestly mapping where a small model breaks — doesn't appear to have been done by any prior QVAC entry. This track rewards evidence over demos, and no one has produced that evidence publicly yet.

### The "Vault Guardian" genre (prompt-injection wallet games)
This concept isn't new — worth knowing the playbook before designing either the Guardian or an attack:
- **Freysa AI** (Nov 2024, $47K pot) — beaten after ~482 attempts. Winning exploit: impersonated an admin, redefined the `approveTransfer` function's semantics (told the agent it authorized *incoming* funds, not outgoing), then triggered it with an innocuous "$100 donation" message. A function-semantics/social-engineering exploit, not a base-model jailbreak.
- **Gandalf** (Lakera) — effective tactics: semantic obfuscation/indirect phrasing, request decomposition (ask for sentence counts, then per-sentence summaries), and forcing chain-of-thought exposure to leak the secret via reasoning traces instead of the direct answer.
- **JailbreakMe/Zynx** (Solana) — same escalating pay-to-message pattern, AI self-judges whether it was cracked.
- **Real-world analog**: a Grok-linked wallet was drained ($150–180K) via an NFT containing a Morse-code-encoded instruction — decode-then-follow-instruction bypassed keyword-based input filters.

**Design implication:** winning attacks consistently exploit (1) function/tool semantic redefinition, (2) encoding/obfuscation to dodge input filters, (3) multi-turn decomposition, and (4) reasoning-trace leakage — not brute-force refusal-breaking. If building or attacking a guardian, plan around these four vectors rather than direct "ignore your instructions" prompts.

---

## General Track — Aleph Hackathon (Crecimiento) history

The Aug 22–23 2026 event is the **6th edition** of Crecimiento's recurring "Aleph Hackathon" series (not a one-off) — this is the sponsor of the General Track, and its own past events are the most directly relevant prior art for that track specifically.

| # | Edition | Dates | Scale | Overall/General prize? |
|---|---|---|---|---|
| 1 | First edition | Aug 2024 (Aleph pop-up city) | 300 hackers, 20 countries, 55 projects | Yes — 3 overall finalists |
| 2 | Aleph Hackathon de Verano | Dec 12–15 2024 | 280 builders, 30 countries, hybrid | Yes — 3 overall winners + 1 special mention |
| 3 | Aleph March '25 | Mar 21–23 2025 | 260 hackers, 61 projects | **No** — only 5 sponsor-track winners |
| 4 | Aleph Hackathon 2025 | Aug 29–31 2025 | 1,300 builders, 320 projects, 25 chapters — largest in LatAm history | **No** — only 10 sponsor-track winners |
| 5 | Aleph March '26 | Mar 2026 | 800+ participants, 142 projects, 12 chapters/5 countries, 4 verticals (crypto/AI/biotech/robotics) | Yes — "Best Project – PL Genesis" |
| 6 | **This edition** | **Aug 22–23 2026** | Upcoming | The $500 General Track you're prepping for |

**A standalone overall/general prize is not a constant fixture** — present in editions 1, 2, and 5, absent in 3 and 4. This year's explicit General Track (with a stated 5-criteria rubric) reads closer to a revival of that pattern than an established yearly tradition.

**Winners, by edition, where a general/overall prize existed:**
- **Ed. 1 (Aug 2024)** — three overall finalists, no track breakdown: **TornadoCodes** (address-free, privacy-preserving access management for crypto transactions, using Pedersen hashes/Merkle trees, Tornado-Cash-inspired), **ValidAR** ("Identity simplified"), **Certo** ("Bring replicability back to science" — DeSci reproducibility tooling). Judge **Hanna Schiuma** gave explicit stated criteria: *"many good ideas and few business models"* — she was weighing business-model maturity as much as raw technical execution.
- **Ed. 2 (Dec 2024)** — overall winners with no track breakdown: **Adversarium**, **Superswap**, **Underloans** (special mention: OptimismPay). No descriptions found; names suggest adversarial/security testing, a DEX, and undercollateralized lending — unverified beyond the names.
- **Ed. 5 (Mar 2026)** — overall award **"Best Project – PL Genesis"** went to **AutoBounty**, which *also* won the sponsor-specific Avalanche track (an explicit "double win" per Crecimiento's own recap). No project description found despite multiple searches.

**Pattern:** where a general prize exists, it has gone to **infrastructure/primitive-layer tooling rather than flashy consumer apps** — privacy/access tooling, identity, DeSci reproducibility being the only editions with enough detail to characterize. In the one case with a stated judging rationale (Ed. 1), business-model maturity was weighed alongside technical execution, not just "is it impressive to build." A general winner *can* also win a sponsor track (AutoBounty did), but that's not required — three of the four confirmed general winners (TornadoCodes, ValidAR, Certo) won **only** the general prize, meaning cross-category polish and completeness stood on its own without needing to also satisfy a sponsor's specific technical requirement.

**Honest gaps:** no source uses the literal phrase "General Track" for past editions — equivalence to "overall winner"/"Best Project" is inferred from context. Project-level detail beyond one-line summaries is thin for Ed. 2 and Ed. 5 winners. DoraHacks' hackathon listing/detail pages for this series (`aleph25`, `aleph-hackathon`, `aleph`) blocked automated fetching (405s); a manual DoraHacks pass would likely surface fuller project pages and judge scorecards.

---

## Sources

- [Tether developer grants program announcement](https://tether.io/news/tether-launches-developer-grants-program-to-fund-local-first-ai-and-payments-infrastructure/)
- [tetherto/wdk](https://github.com/tetherto/wdk), [wdk-mcp-toolkit](https://github.com/tetherto/wdk-mcp-toolkit), [docs.wdk.tether.io/overview/showcase](https://docs.wdk.tether.io/overview/showcase), [docs.wdk.tether.io/ai/mcp-toolkit](https://docs.wdk.tether.io/ai/mcp-toolkit)
- [Hackathon Galactica: WDK Edition 1](https://dorahacks.io/hackathon/hackathon-galactica-wdk-2026-01/detail), [Atlas repo](https://github.com/Gitthack/atlas-wdk-hackathon)
- [Coinbase x402](https://www.coinbase.com/developer-platform/discover/launches/x402), [Google x402/AP2](https://www.coinbase.com/developer-platform/discover/launches/google_x402)
- [Voice-payment WDK tutorial](https://dev.to/chideraao/how-to-build-an-ai-agent-for-voice-enabled-payments-with-the-tether-wdk-3dg7)
- [pears.com showcases](https://pears.com/?section=showcases), [pears.com/news](https://pears.com/news/), [holepunchto/swap](https://github.com/holepunchto/swap), [mafintosh/ble-swarm](https://github.com/mafintosh/ble-swarm)
- [Global Pears Hackathon Winners](https://www.einpresswire.com/article/793642253/global-pears-hackathon-winners-announced), [Pear × Anthropic Hackathon](https://pear.vc/pear-x-anthropic-hackathon/), [holepunchto org repos](https://github.com/orgs/holepunchto/repositories)
- [github.com/tetherto/qvac](https://github.com/tetherto/qvac), [github.com/tetherto/qvac-examples](https://github.com/tetherto/qvac-examples)
- [QVAC Hackathon I — Unleash Edge AI](https://dorahacks.io/hackathon/qvac-unleach-edge-ai-i), [QVAC Hackathon Portfolio, 46 projects](https://hds-t.github.io/qvac-hackathon-alpha-landing/)
- [Tether Developers Cup](https://dorahacks.io/hackathon/tether-developers-cup/detail)
- [Freysa AI writeup](https://www.theblock.co/post/328747/human-player-outwits-freysa-ai-agent-in-47000-crypto-challenge)
- [Gandalf tactics](https://medium.com/@onmouse0ver/prompt-injection-playground-mastering-ai-attacks-with-lakeras-gandalf-5e7481b22e9d)
- [JailbreakMe](https://github.com/jailbreakme-xyz/jailbreak)
- [Grok wallet Morse-code drain](https://www.giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet)
