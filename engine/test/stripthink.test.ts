import { describe, it, expect } from 'vitest';
import { stripThink } from '../src/qvac/client.js';

describe('stripThink (reasoning-leakage defense)', () => {
  it('removes a closed think block', () => {
    expect(stripThink('<think>secret reasoning</think>The answer is 4.')).toBe('The answer is 4.');
  });
  it('removes an UNCLOSED think block entirely (truncation case)', () => {
    expect(stripThink('<think>reasoning that got cut off mid-')).toBe('');
  });
  it('removes multiple blocks and trims', () => {
    expect(stripThink('<think>a</think>Hello <think>b</think>world')).toBe('Hello world');
  });
  it('passes clean text through', () => {
    expect(stripThink('Gas is the fee you pay.')).toBe('Gas is the fee you pay.');
  });
});
