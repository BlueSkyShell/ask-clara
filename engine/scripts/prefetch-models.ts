// Downloads models once so later tasks never block on network.
// Under plain Node the SDK auto-spawns its Bare worker on first call
// (verified: dist/client/rpc/node-rpc-client.js).
import { loadModel, unloadModel, close, QWEN3_1_7B_INST_Q4, LLAMA_TOOL_CALLING_1B_INST_Q4_K } from '@qvac/sdk';

for (const m of [QWEN3_1_7B_INST_Q4, LLAMA_TOOL_CALLING_1B_INST_Q4_K]) {
  const name = (m as { name?: string }).name ?? String(m);
  console.log('[prefetch] loading', name);
  const t0 = Date.now();
  const id = await loadModel({ modelSrc: m } as never, undefined);
  console.log('[prefetch] loaded', name, 'as', id, 'in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
  await unloadModel({ modelId: id } as never);
}
console.log('[prefetch] done');
await close();
process.exit(0);
