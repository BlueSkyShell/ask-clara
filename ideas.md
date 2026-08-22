# 50 Project Ideas — QVAC Track (mixed with WDK / Pears / General)

All entered under **QVAC Track 2** (tool-use reliability) unless noted. Every idea assumes on-device inference via `@qvac/sdk` — no cloud calls. Grounded in [research.md](./research.md) (what already exists, what's crowded) and [judging-pattern.md](./judging-pattern.md) (what each rubric explicitly rewards).

---

## A. Financial agent reliability & safety (QVAC + WDK)

1. **Warden** — A guardian agent operating a WDK wallet through a policy layer: spending caps, address allowlists, human-confirmation thresholds. Benchmarked across N runs, including adversarial prompts.
2. **Guardian Arena** — Two QVAC agents, not one: a defender and an autonomous attacker that runs the four documented wallet-guardian attack patterns round after round, producing a live attack-success leaderboard as the actual product.
3. **Grounded Compliance Gate** — RAG-grounded policy check (QVAC embeddings over an offline rules dataset) sits in front of every WDK send; demo moment is the agent correctly *refusing* an ungrounded request instead of hallucinating approval.
4. **Treasury Copilot** — OCR/extracts invoices and POs, reconciles against WDK transaction history, and — only for clean matches — actually executes the verified payout, closing the loop the official invoice-demo doesn't.
5. **Session Key Broker** — Agent negotiates short-lived, narrowly-scoped session keys per task instead of holding full wallet access, auto-revoking on completion; measures how reliably it scopes permissions down.
6. **Multi-Agent Approval Chain** — A "spender" agent proposes a WDK transfer, a separately-prompted "auditor" agent independently reviews before execution; benchmark is how often the auditor catches what the spender missed.
7. **Anomaly-Triggered Freeze** — Monitors a WDK wallet's transaction history locally, detects anomalous patterns via embeddings, and auto-freezes before the next send; reliability = false-positive/negative rate under synthetic anomaly injection.
8. **Recovery Drill Bot** — Simulates model-restart or lost-context scenarios mid-transaction, measuring whether the agent safely resumes or aborts rather than double-sending.
9. **Explainable Denial Log** — Every blocked WDK send gets a locally-generated, structured justification; benchmarked for whether the stated reason actually matches the real trigger (not a plausible-sounding excuse).
10. **Cross-Chain Consistency Checker** — Before a multi-chain WDK operation executes, locally re-verifies quoted amounts/addresses across chain-specific formats to catch transcription errors before they cost money.
11. **Rate-Limited Autonomy Ladder** — Agent starts with tiny autonomous spending limits that auto-expand only after a streak of correctly-handled tasks; harness measures how fast trust builds safely.
12. **Post-Mortem Generator** — After any blocked/flagged transaction, writes a local incident report explaining what happened — an audit trail that never touches cloud logging, aimed at a real compliance use case.

## B. Operations / back-office automation (QVAC, some + WDK)

13. **Reconciliation Exception Queue** — Cross-references invoice + PO + bank statement, escalates ambiguous matches to a human queue, benchmarked on deliberately messy synthetic data (not one clean PDF).
14. **Expense-to-Ledger Pipeline** — Photographed receipts (multimodal/OCR) become structured ledger entries, cross-checked against a WDK wallet's actual outgoing transactions.
15. **Contract-to-Payment-Schedule Extractor** — Reads a contract PDF, extracts payment milestones, proposes the corresponding WDK payouts automatically.
16. **Duplicate-Charge Hunter** — Scans on-chain WDK history plus off-chain invoice data for duplicate billing, flags with a full evidence trail.
17. **Merchant Categorization Engine** — Classifies WDK transactions into spend categories fully offline, generating a plain-English monthly summary with zero cloud analytics.
18. **Payroll Batch Auditor** — Reads a payroll CSV, cross-verifies against local employee records, previews every WDK transfer, flags mismatches before batch execution.
19. **Grant/Bounty Disbursement Verifier** — Checks submitted deliverable evidence against grant criteria before releasing a WDK payout — verifies humans' claims rather than hunting bounties itself, avoiding the "Atlas" bounty-hunter niche.
20. **Handwritten Delivery Note Digitizer** — Multimodal QVAC turns a photographed handwritten note into structured line items matched against a purchase order.
21. **Credit Memo Workflow Assistant** — Pulls relevant docs, drafts an internal note and next-action recommendation when a risk threshold trips — human-in-the-loop, benchmarked on draft accuracy across many runs.
22. **Cash-Flow Forecaster** — Projects short-term cash flow from a WDK wallet's historical pattern plus scheduled payables, fully offline, with honestly-stated confidence intervals.

## C. P2P / distributed AI (QVAC + Pears)

23. **Swarm Bench** — Distributed reliability benchmarking across peer devices over Hyperswarm, aggregating success-rate stats with no central server.
24. **Federated Model Bake-off** — Peers each run a different local model/config on the same task set and compare results P2P, helping pick the right small model for real hardware without uploading data anywhere.
25. **Peer-Verified Tool Calls** — Before a sensitive WDK action executes, N peer agents independently vote on whether it looks correct — a P2P quorum instead of one point of failure.
26. **Offline Team Knowledge Base** — RAG index built from a team's local docs, synced P2P via Pear/Hyperdrive so every teammate's local agent stays current with no central vector DB.
27. **BLE Local Incident Responder** — No-internet scenario: agents discover nearby peers via BLE and coordinate a shared task with zero network infrastructure — leans into the sponsor's own "turn off the wifi" demo moment.
28. **Distributed Red-Team Swarm** — Multiple peer-hosted attacker agents (from Guardian Arena) run concurrently, sharing newly-found exploits with each other in real time, converging on a defense faster than a solo attacker.
29. **P2P Model Weight Diffing** — Peers compare fine-tuned LoRA adapters for a shared task and collaboratively select the best performer, no central model registry.
30. **Consensus Compliance Oracle** — Several peers' agents each independently judge a transaction's compliance against their own rules copy; only majority agreement unlocks a WDK send.

## D. Tool-use reliability engineering (pure QVAC Track 2, general tool chaining)

31. **ToolBench-Mini** — Generic multi-step tool-chaining harness (calculator, file search, DB query, retry-on-failure) run N times, success rate reported with/without a validation layer.
32. **Adversarial Prompt Fuzzer** — Auto-generates thousands of edge-case prompt variants, mapping exactly where a small model's tool-chaining breaks.
33. **Chain-of-Custody Tool Tracer** — Logs every tool call and its raw return, diffed against what the model claims it did — catches hallucinated tool use.
34. **Retry-Budget Optimizer** — Tests different retry/backoff/validation strategies for the same tool chain, reports the best reliability-per-latency tradeoff.
35. **Grounded Refusal Benchmark** — Deliberately feeds unsupportive tool results, measures how often the agent correctly says "I don't know" instead of confabulating.
36. **Tool Schema Drift Detector** — Catches a model inventing a tool parameter/method that doesn't exist, before execution — direct defense against QVAC's named "hallucinated SDK methods" failure mode.
37. **Multi-Model Tool-Use Leaderboard** — Runs the same task battery across several small open models (1B/3B/4B) locally, publishing a reproducible reliability leaderboard.
38. **Context-Window Stress Test** — Measures at what chain-length a model starts forgetting an earlier step, mapping the practical context budget for reliable agentic use.
39. **Structured-Output Enforcer Benchmark** — Quantifies how much schema-enforced output actually improves tool-call reliability versus raw prompting.
40. **Self-Checking Pass Add-on** — A second lightweight local pass reviews the first pass's proposed tool call before execution; measures reliability gain versus added latency.

## E. Security / prompt-injection / Vault-Guardian-adjacent

41. **Guardian Arena** *(cross-listed from A2)* — self-play defender/attacker producing the reliability evidence directly as the product.
42. **Morse-and-Friends Encoding Screen** — Detector tuned against known obfuscation tricks (Morse, base64, homoglyphs) used in real attacks like the Grok wallet drain, tested against a corpus of known and novel encodings.
43. **Semantic Redefinition Trap** — A test suite that specifically drills the Freysa-style "let me redefine what this function means" attack across many phrasings, hardening the tool-semantics layer against all of them.
44. **Chain-of-Thought Leakage Auditor** — Scans outputs for accidental secret disclosure via reasoning traces, patches the pipeline until it stops leaking.
45. **Honeypot Wallet Logger** — A decoy wallet with fake "real funds" logs every attack attempt against the guardian, building a real attack corpus from actual hackathon-weekend adversaries.
46. **Escalating Stakes Guardian** — The guardian's spending limit grows the longer it survives a live gauntlet of attacker prompts — gamifies the demo video and doubles as literal prep for the real Vault Guardian side-challenge.

## F. Cross-track / General-Track-leaning infra

47. **Local-First Audit Ledger** — A tamper-evident, fully offline log of every AI-agent financial decision (approved and denied), pitched as a reusable compliance primitive — leans into the General Track's "infra with a business case" winning pattern.
48. **Open Reliability Benchmark Suite** — Packages the Track D harness as a standalone open-source tool other QVAC builders could run against their own agents; plausibly also qualifies for Tether's ongoing developer-grants program.
49. **"Prove It" Demo Recorder** — Auto-generates the required N-run reliability evidence and formats it straight into the submission README/video overlay — meta tooling other hackers at this same event would genuinely want.
50. **Guardian-as-a-Service Starter Kit** — Strips Warden/Guardian Arena's core into a minimal, documented starter template (policy layer + reliability harness + attack-hardening) any future WDK+QVAC team could fork — aimed squarely at QVAC's "Artifact quality & Verification" rubric line.

---

## Quick read

- **Highest rubric alignment + least crowded:** #2 Guardian Arena, #35 Grounded Refusal Benchmark, #43 Semantic Redefinition Trap — all make "evidence, not vibes" and "prompt-injection resistance" the literal product mechanic.
- **Best General Track crossover:** #47, #48, #50 — infra/tooling with a real reuse story, matching Aleph's own winning pattern.
- **Riskiest (interesting but furthest from a clean demo in the time available):** #24, #29 (P2P model comparison/merging is a research problem, not a weekend build), #38 (useful data, weak standalone demo).
