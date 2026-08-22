# Verified SDK surfaces (read from installed package source)

Log discipline: no SDK call ships unless its signature appears here with a
source location. Update on every new surface. "Installed source wins."

## @qvac/sdk 0.17.1
- `completion(params): CompletionRun` — params: `{modelId, history: {role,content}[], stream?, generationParams?, tools?: Tool[]|ToolInput[], mcp?, captureThinking?, responseFormat?}` (dist/client/api/completion-stream.d.ts:3-9,105)
- `CompletionRun`: `{requestId, events: AsyncIterable<CompletionEvent>, final: Promise<CompletionFinal>}`; `tokenStream`/`toolCallStream` deprecated (dist/schemas/completion-event.d.ts:212-230)
- `CompletionFinal`: `{contentText, thinkingText?, toolCalls: ToolCallWithCall[], stats?, stopReason?}` (completion-event.d.ts:188-193)
- `ToolInput = {name, description, parameters: z.ZodObject, handler?}` (dist/utils/tool-helpers.d.ts)
- Tool-call errors: `PARSE_ERROR | VALIDATION_ERROR | UNKNOWN_TOOL` (dist/schemas/tools.d.ts:55-74)
- `TOOLS_MODE = {static,dynamic}`; `toolsMode` is a **llamacpp model-config key** (load-time), not a completion param (dist/schemas/llamacpp-config.d.ts:39, tools.d.ts:13)
- `loadModel({modelSrc: <registry descriptor>}) → Promise<string>` (modelId) — descriptor overload, e.g. `loadModel({ modelSrc: WHISPER_TINY })` per SDK's own JSDoc example (dist/client/api/load-model.d.ts:17,20); options overload `loadModel(options: LoadModelOptions)` at :118, `modelConfig` forwarded to plugin (:123-127)
- **Node runtime boot is automatic**: first API call spawns a Bare worker via `bare-runtime/spawn`, unix-socket RPC; worker resolution: `QVAC_WORKER_PATH` env → packaged Electron resources → `qvac/worker.entry.mjs` in project root → SDK default `dist/server/worker.js` (dist/client/rpc/node-rpc-client.js:1-140). `startQVACProvider` is **P2P providing only** (firewall/publicKey — dist/client/api/provide.d.ts:18), NOT local boot — do not call it for local inference.
- `close()` exported from '@qvac/sdk' shuts the client/worker down (dist/index.d.ts → client/index).
- Registry constants verified in 0.17.1: QWEN3_1_7B_INST_Q4, LLAMA_TOOL_CALLING_1B_INST_Q4_K, QWEN3_600M_INST_Q4, WHISPER_TINY_Q8_0, TTS_EN_SUPERTONIC_Q8_0, EMBEDDINGGEMMA_300M_Q4_0

## @tetherto/wdk 1.0.0-beta.16
- `new WDK(seedPhrase: string | Uint8Array, options?)` — BIP-39 phrase (src/wdk.js:74)
- `wdk.registerWallet(blockchain, WalletManager, config)` (src/wdk.js:132)
- `wdk.registerPolicy(policies, options?)` — stacking, replace-by-id (src/wdk.js:224)
- `wdk.getAccount(blockchain, index=0)` → Proxy-wrapped account; wrapped write methods throw `PolicyViolationError` on DENY (src/wdk.js:241)
- Policy: `{id, name, scope: 'project'|'account', wallet?, accounts?, rules: PolicyRule[]}`; `PolicyRule {name, reason?, operation: string|string[]|'*', action: 'ALLOW'|'DENY', conditions: ((ctx)=>boolean|Promise<boolean>)[]}`; DENY wins (src/policy/policy-engine.js:75-105)
- `PolicyContext = {operation, wallet, account (read-only), args (frozen snapshot)}` (src/policy/policy-context.js:47-56)
- **Simulation mirror:** policy-wrapped accounts expose `account.simulate.<operation>(...args)` → `SimulationResult {decision, policy_id, matched_rule, reason, trace}` (src/policy/policy-account-proxy.js:194,258-301; policy-engine.js:139-145)
- OPERATIONS include: sendTransaction, signTransaction, transfer, approve, sign, signTypedData, signAuthorization, delegate (src/policy/constants.js)
- Exports: `PolicyViolationError`, `PolicyConfigurationError` (index.js)

## @tetherto/wdk-wallet-evm 1.0.0-beta.17
- `WalletManagerEvm(seedOrSigner, config)`; `EvmWalletConfig {provider: rpcUrl|Eip1193|array, chainId?, transferMaxFee?, transactionMaxFee?, retries?}` (src/wallet-account-read-only-evm.js:83-89)
- Account: `getAddress()`, `getBalance()`, `getTokenBalance(addr)`, `sign(message)`, `signTypedData({domain,types,message})`, `sendTransaction(tx)`, `quoteSendTransaction(tx)`, `transfer(options)`, `approve(options)`, `signAuthorization(auth)`, `delegate(addr)` (src/wallet-account-evm.js:141-378, read-only:160-198)

## Measured
(filled during Tasks 2/4/9/12 — ttft, tok/s, funded balance, bench p50/p95)

## Empirical (run-verified)
- Plain-Node inference boot WORKS: `loadModel({modelSrc: QWEN3_1_7B_INST_Q4})` → modelId `3eca44ec77fbe672`, 108.8s cold (download+load) on Ryzen 7 PRO 5850U.
- `unloadModel({ modelId })` — object param, NOT the bare string (zod: "expected string at modelId").
- Qwen3 `<think>` blocks arrive INSIDE contentText → stripped deterministically by `stripThink()` (closed + unclosed); `/no_think` appended to system prompt for Qwen models. (engine/src/qvac/client.ts)

## Measured (Ryzen 7 PRO 5850U, 30GB RAM, backendDevice: "gpu" — Radeon Vega iGPU)
- QWEN3_1_7B_INST_Q4: cold load 108.8s (download incl.), warm ttft 297ms, ~30 tok/s
- LLAMA_TOOL_CALLING_1B_INST_Q4_K: load 85.4s (download incl.)
