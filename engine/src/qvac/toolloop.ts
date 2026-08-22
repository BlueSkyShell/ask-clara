import { completion } from '@qvac/sdk';
import type { ZodObject, ZodRawShape } from 'zod';
import { ensureModel, stripThink, type ModelKey } from './client.js';

export interface LoopTool {
  name: string;
  description: string;
  parameters: ZodObject<ZodRawShape>;
  execute?: (args: Record<string, unknown>) => Promise<unknown>;
}

export type ToolTurnResult =
  | { kind: 'tool'; name: string; args: Record<string, unknown> }
  | { kind: 'text'; text: string }
  | { kind: 'toolError'; code: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_TOOL'; message: string };

type Step =
  | { action: 'terminate'; result: ToolTurnResult }
  | { action: 'continue'; feedback: string };

interface FinalLike {
  contentText: string;
  // Runtime (0.17.1, verified empirically): flat [{id, name, arguments, raw}].
  // The events schema also documents an envelope {type:'toolCall', call:{...}} —
  // accept both so a future SDK change does not silently break the loop.
  toolCalls: ({ name?: string; arguments?: Record<string, unknown> } & { call?: { name: string; arguments: Record<string, unknown> } })[];
}

function firstCall(final: FinalLike): { name: string; arguments: Record<string, unknown> } | undefined {
  const t = final.toolCalls?.[0];
  if (!t) return undefined;
  if (t.call?.name) return t.call;
  if (t.name) return { name: t.name, arguments: t.arguments ?? {} };
  return undefined;
}

// Pure decision core — unit-tested without a model.
export async function stepToolTurn(final: FinalLike, tools: LoopTool[]): Promise<Step> {
  const tc = firstCall(final);
  if (!tc) return { action: 'terminate', result: { kind: 'text', text: final.contentText.trim() } };
  const tool = tools.find((t) => t.name === tc.name);
  if (!tool) return { action: 'terminate', result: { kind: 'toolError', code: 'UNKNOWN_TOOL', message: `unknown tool ${tc.name}` } };
  const parsed = tool.parameters.safeParse(tc.arguments);
  if (!parsed.success) return { action: 'terminate', result: { kind: 'toolError', code: 'VALIDATION_ERROR', message: parsed.error.message } };
  if (!tool.execute) return { action: 'terminate', result: { kind: 'tool', name: tool.name, args: parsed.data } };
  const out = await tool.execute(parsed.data);
  return { action: 'continue', feedback: `[tool ${tool.name} result] ${JSON.stringify(out)}` };
}

export async function runToolTurn(opts: {
  modelKey?: ModelKey; system: string;
  messages: { role: string; content: string }[];
  tools: LoopTool[]; maxIterations?: number;
}): Promise<ToolTurnResult> {
  const key = opts.modelKey ?? 'primary';
  const modelId = await ensureModel(key);
  const system = key === 'toolSpecialist' ? opts.system : opts.system + ' /no_think';
  const history = [{ role: 'system', content: system }, ...opts.messages];
  // TOOL-REDEFINITION DEFENSE: schemas are rebuilt from source objects on every
  // call — nothing from conversation history can alter a tool's contract.
  const sdkTools = opts.tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters }));
  for (let i = 0; i < (opts.maxIterations ?? 3); i++) {
    const run = completion({ modelId, history, stream: true, tools: sdkTools } as never);
    const final = (await run.final) as unknown as FinalLike;
    const step = await stepToolTurn(final, opts.tools);
    if (step.action === 'terminate') {
      // sanitize any free-text result (reasoning-leakage defense)
      if (step.result.kind === 'text') return { kind: 'text', text: stripThink(step.result.text) };
      return step.result;
    }
    history.push({ role: 'assistant', content: final.contentText || '(called a tool)' });
    history.push({ role: 'tool', content: step.feedback }); // fallback variant: role 'user' — see plan Task 3 Step 5
  }
  return { kind: 'toolError', code: 'PARSE_ERROR', message: 'tool loop exceeded maxIterations' };
}
