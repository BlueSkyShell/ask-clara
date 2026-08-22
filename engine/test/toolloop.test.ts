import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { stepToolTurn, type LoopTool } from '../src/qvac/toolloop.js';

const echo: LoopTool = {
  name: 'echo', description: 'echoes', parameters: z.object({ msg: z.string() }),
  execute: async (a) => ({ echoed: a.msg }),
};
const done: LoopTool = { name: 'done', description: 'terminal', parameters: z.object({ result: z.string() }) };

const finalWith = (toolCalls: unknown[], contentText = '') => ({ contentText, toolCalls }) as never;
const call = (name: string, args: Record<string, unknown>) => ({ type: 'toolCall', call: { id: '1', name, arguments: args } });

describe('stepToolTurn', () => {
  it('terminal tool call → terminate with validated args', async () => {
    const r = await stepToolTurn(finalWith([call('done', { result: 'ok' })]), [echo, done]);
    expect(r).toEqual({ action: 'terminate', result: { kind: 'tool', name: 'done', args: { result: 'ok' } } });
  });
  it('executable tool call → continue with tool result message', async () => {
    const r = await stepToolTurn(finalWith([call('echo', { msg: 'hi' })]), [echo, done]);
    expect(r.action).toBe('continue');
    if (r.action === 'continue') expect(r.feedback).toContain('echoed');
  });
  it('no tool call → terminate with text', async () => {
    const r = await stepToolTurn(finalWith([], 'plain answer'), [echo, done]);
    expect(r).toEqual({ action: 'terminate', result: { kind: 'text', text: 'plain answer' } });
  });
  it('zod-invalid args on terminal tool → toolError VALIDATION_ERROR', async () => {
    const r = await stepToolTurn(finalWith([call('done', { result: 42 })]), [echo, done]);
    expect(r.action).toBe('terminate');
    if (r.action === 'terminate') expect(r.result.kind).toBe('toolError');
  });
  it('unknown tool name → toolError UNKNOWN_TOOL', async () => {
    const r = await stepToolTurn(finalWith([call('nope', {})]), [echo, done]);
    if (r.action === 'terminate' && r.result.kind === 'toolError') expect(r.result.code).toBe('UNKNOWN_TOOL');
    else expect.fail('expected toolError');
  });
});
