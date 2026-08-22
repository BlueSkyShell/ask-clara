import {
  completion, loadModel, unloadModel, close,
  QWEN3_1_7B_INST_Q4, LLAMA_TOOL_CALLING_1B_INST_Q4_K, QWEN3_600M_INST_Q4,
} from '@qvac/sdk';

export type ModelKey = 'primary' | 'toolSpecialist' | 'fallback';
const REGISTRY: Record<ModelKey, unknown> = {
  primary: QWEN3_1_7B_INST_Q4,
  toolSpecialist: LLAMA_TOOL_CALLING_1B_INST_Q4_K,
  fallback: QWEN3_600M_INST_Q4,
};

// Under plain Node the SDK auto-spawns its Bare worker on the first API call
// (verified: dist/client/rpc/node-rpc-client.js) — no explicit boot needed.
// startQVACProvider is P2P-serving only and is deliberately NOT used here.
const loaded = new Map<ModelKey, string>();

export async function ensureModel(key: ModelKey = 'primary'): Promise<string> {
  const hit = loaded.get(key);
  if (hit) return hit;
  // Single-resident: RAM is tight on the demo machine. Unload others first.
  for (const [k, id] of loaded) { await unloadModel({ modelId: id } as never).catch(() => {}); loaded.delete(k); }
  const id = await loadModel({ modelSrc: REGISTRY[key] } as never);
  loaded.set(key, id);
  return id;
}

export interface GenerateOpts {
  modelKey?: ModelKey;
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
  temperature?: number;
}

interface FinalShape { contentText: string; stats?: Record<string, unknown> }

// REASONING-LEAKAGE DEFENSE, part 2: Qwen3-style <think> blocks are stripped
// deterministically — closed blocks AND an unclosed trailing block (truncation).
export function stripThink(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<think>[\s\S]*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generate(opts: GenerateOpts): Promise<{ text: string; stats?: Record<string, unknown> }> {
  const key = opts.modelKey ?? 'primary';
  const modelId = await ensureModel(key);
  // Qwen3 honors /no_think to skip its reasoning phase; harmless no-op text for
  // non-Qwen models is avoided by gating on the model key.
  const system = key === 'toolSpecialist' ? opts.system : opts.system + ' /no_think';
  const run = completion({
    modelId,
    history: [{ role: 'system', content: system }, ...opts.messages],
    stream: true,
    generationParams: {
      ...(opts.temperature !== undefined ? { temp: opts.temperature } : {}),
      ...(opts.maxTokens !== undefined ? { predict: opts.maxTokens } : {}),
    },
  } as never);
  const final = (await run.final) as unknown as FinalShape;
  // REASONING-LEAKAGE DEFENSE: only sanitized contentText leaves this module.
  return { text: stripThink(final.contentText), stats: final.stats };
}

export async function shutdown(): Promise<void> {
  for (const [, id] of loaded) await unloadModel({ modelId: id } as never).catch(() => {});
  loaded.clear();
  await close().catch(() => {});
}
