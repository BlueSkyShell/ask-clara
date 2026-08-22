# Judging Pattern

What each track's judge is likely to weight most heavily, derived from their public background plus each sponsor's own written criteria and prior-event patterns. Use this to prioritize *where* to spend polish time per track — not as a substitute for the official criteria in [judging.md](./judging.md) (Technicality, Originality, UI/UX/DX, Practicality, Presentation), which still apply to everything.

**Confidence note:** the WDK/QVAC judge (Raquel Raigal) has a very thin public footprint — no personal talks, blog, or stated judging philosophy were found. Her section below leans on the sponsor's own written track rules rather than personal preference, and that's flagged explicitly. The Pears judge (David Mark Clements) has a well-documented public philosophy, so that section is on firmer ground.

---

## WDK & QVAC tracks — Judge: Raquel Raigal (Tether DevRel)

**What we actually know:** her role is Tether DevRel for WDK and QVAC. No talks, blog posts, or public judging statements surfaced. Anything about her *personal* taste below would be speculation — so the signal to use instead is what **Tether itself wrote into both track briefs**, which is unusually explicit for a hackathon:

- **"Obvious AI slop... gets discarded without further review."** Stated near-verbatim in both the WDK and QVAC track text: hallucinated APIs, dead code, a README describing features that aren't there. This is a hard gate, not a tiebreaker — a project can be discarded before the five official criteria are even applied.
- **"Permalinks... direct GitHub links to the specific files/lines... This is what we look at first."** Both tracks say this literally. The integration-depth check happens before the demo video is watched.
- **"The integration has to actually do something in your product"** — both tracks explicitly warn against bolting the sponsor's SDK onto an existing product in parallel just for the prize. This reads as a real disqualifier they've pre-committed to using, not boilerplate.
- **"WDK integrations are only a few lines of code; models tend to over-engineer them, invent methods."** A specific, pre-stated failure mode to avoid — the fix is a thin, correct integration over an elaborate one.

**Inferred weighting for WDK/QVAC submissions:**
1. Integration correctness and depth (verifiable via permalinks) — gates everything else.
2. Absence of AI-slop tells: no invented SDK methods, no dead code, README claims match what actually runs.
3. Meaningful use of the SDK as the core mechanism, not a wrapper — mirrors the "Originality"/"Technicality" criteria but sponsor-specific.
4. Then the five general criteria apply, with Practicality and Presentation mattering for the demo video since judging is entirely async (no live Q&A to recover a weak demo).

**Corroborating evidence — the actual rubric from the predecessor QVAC Hackathon I** (found on its DoraHacks "Prizes & Judging" tab, see [research.md](./research.md)): Technical execution & Performance (quality, optimization, TTFT/TPS, P2P/delegated inference), Innovation & Model creativity, QVAC usage (breadth of the stack used), Artifact quality & Verification, Impact & Market relevance, Originality (**explicitly including prompt-injection resistance** — notable groundwork for this event's Vault Guardian side-challenge), Awareness/social promotion, an early-bird bonus, plus a community social vote. No per-project judge write-ups were published against this rubric, so it's evidence of *what gets measured*, not evidence of Raquel's personal taste specifically — but it's the closest thing to a real scoring model available for this sponsor.

**Track-specific tie-breakers already stated by the sponsor:**
- WDK Track 1: "does it solve a real user problem," "does it actually work end-to-end in the demo," "is the WDK integration meaningful," "is the UX something a non-crypto person could use, or an agent."
- QVAC: strong submissions "work on messy real inputs, not one hand-picked clean PDF," "show their reasoning so a human can audit it," and are "honest about what it can't do" — an agent that flags uncertainty beats one that confidently hallucinates. For Track 2 specifically: "evidence, not vibes" — run the same task N times, report the success rate, show failures alongside successes.

---

## Pears Track — Judge: David Mark Clements (creator of Pear, Holepunch)

**Strong public signal — including a direct quote about a project he personally judged.** From the Global Pears Hackathon (~2025) winners press release, on **WhereFam** (1st place, private P2P location sharing — see [research.md](./research.md)), Clements is quoted verbatim:

> *"Nothing is more important to users than the privacy of their family, and WhereFam is an excellent example of how peer-to-peer technology enables safety and security."*

That's the single most directly transferable data point in this entire research pass — it explicitly names **privacy delivered through genuinely P2P architecture** as what impressed him, on a project he judged in the predecessor event to this one. Everything below is corroborating context from his talks, but this quote is the primary evidence, not an inference.

Long-time Node.js core community figure, now Platform Principal Architect at Holepunch. His GitNation talks ("Pear Runtime: Zero-Infrastructure, P2P High-Scale Applications," "No Servers, No Cloud, No Masters") lay out the same technical philosophy in more general terms:

- **Anti-centralization is a stated value, not just an architecture preference**: *"The more you monopolize, the more you centralize... the more chance there is for mass-scale abuse."* A submission that's P2P in name but funnels data through a central server it controls runs directly against his stated worldview.
- **Zero-infrastructure as a concrete win, not an abstraction**: he cites no servers, no cloud fees, no outages, and richer media (no forced compression) as tangible benefits of real P2P over client-server. A project that name-drops Hyperswarm but still needs a coordinating backend won't land this point.
- **Production-readiness over demoware**: he repeatedly cites Keet (Holepunch's own P2P chat app) reaching ~1M monthly users as proof the stack isn't merely experimental — "production practices, principles and tooling," multisig/quorum signoff, OTA updates running at real scale. A submission that visibly took OTA updates and seeding seriously (not just a one-off `pear install` that happens to work once) fits this bias.

**Inferred weighting for the Pears submission:**
1. Is the P2P architecture *real* — does removing the network still leave a working peer, or is there a hidden central dependency? This is likely the single biggest lever with this judge.
2. Does it actually ship the way Pear intends: seeded, installable via `pear install pear://<key>`, with a genuine OTA update demonstrated live (not just claimed in the README) — this is also the sponsor's own hard entry requirement, so it's doubly weighted.
3. Process-shape fit (worker-thread vs single-thread vs daemon) suggests engineering care rather than boilerplate copy-paste — small detail, but signals the "production practices" instinct he talks about.
4. Novelty relative to the showcase (see [research.md](./research.md) — nearly everything polished is a GUI consumer app; a genuinely useful CLI-native tool is underrepresented) plays to both Originality and to his implicit "is this a serious use of the stack" bar.

**No formal written rubric was found for him**, but the WhereFam quote above is a real, project-specific data point from an event he actually judged — treat that one as solid, and the talk-derived inferences around it as directional support.

---

## General Track — Crecimiento

No specific judge was named for this track in the tracks brief — only "multiple mentors available in the Mentor's Directory." But unlike the sponsor tracks, this one has real history: Crecimiento's own "Aleph Hackathon" series has run 5 prior editions (see [research.md](./research.md)), and a standalone overall/general prize appeared in 3 of them (Ed. 1, 2, 5) with enough detail in one case to extract an actual judging rationale.

**What's confirmed from that history:**
- **Ed. 1 judge Hanna Schiuma's stated criteria**: *"many good ideas and few business models"* — she was explicitly weighing **business-model maturity**, not just technical impressiveness. This is a real, sourced signal about what this specific organizer's judges look for in an overall winner, distinct from the five generic stated criteria.
- **Winners skew toward infrastructure/primitive-layer tooling** (privacy/access management, identity, DeSci reproducibility) rather than flashy consumer-facing demos — in the editions with enough detail to characterize.
- **A general winner doesn't need to also win a sponsor track** — 3 of 4 confirmed general winners (TornadoCodes, ValidAR, Certo) won *only* the general prize, meaning cross-cutting polish and completeness across all five criteria stands on its own, without needing to also satisfy a sponsor's specific technical requirement (unlike WDK/QVAC, there's no permalink-to-SDK-usage gate here).
- **The track itself isn't guaranteed to exist every edition** — it disappeared in editions 3 and 4. This year's explicit $500 General Track with a stated 5-criteria rubric is a deliberate revival, which may mean Crecimiento is intentionally re-emphasizing it this time.

**Inferred weighting:** the five official criteria (Technicality, Originality, UI/UX/DX, Practicality, Presentation) apply at face value, but weight **Practicality** a notch higher than a naive reading might suggest — "does it have real-world applications, and can it be implemented effectively" is the closest of the five to Schiuma's "business model" framing, and it's the one axis with a real precedent of being explicitly invoked by an Aleph judge. This track is explicitly cross-category ("Crypto, Web3, AI, Robotics or another"), so completeness and coherence across all five criteria — not depth on any single sponsor's SDK — is the safest read of what wins here.

---

## Practical checklist before finalizing any submission

- [ ] **WDK/QVAC**: Have I linked the exact files/lines where the SDK is used? Does every method I call actually exist in the SDK (not invented by an AI assistant)? Would the README survive someone reading the code right after?
- [ ] **WDK/QVAC**: Is the integration the *mechanism* of the product, or decoration bolted onto something that already worked without it?
- [ ] **QVAC Track 2 specifically**: Do I have a success-rate number from repeated runs, not just one clean demo take?
- [ ] **Pears**: Does the app still function as a peer if my machine is the only one online with no server I control anywhere in the loop?
- [ ] **Pears**: Have I actually triggered and shown a real OTA update landing on an installed copy, on camera?
- [ ] **Pears**: Is my `pear://` link still seeded at judging time (Sunday 1–5 PM ARG)?
- [ ] **General Track**: Can I articulate a real-world business case or adoption path for this, not just "it's a cool build" — Aleph's own judging history shows business-model maturity gets explicitly weighed?
- [ ] **All tracks**: Async-only judging, no live pitch — does the 3-minute demo video alone make the case, since there's no chance to clarify afterward?
