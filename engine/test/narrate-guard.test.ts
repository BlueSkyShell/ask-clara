import { describe, it, expect } from 'vitest';
import { narrationGuard } from '../src/explain/narrate.js';

const deny = { decision: 'DENY', ruleName: 'deny-unlimited-approval', policyId: 'clara-core', reason: 'r' } as const;
const allow = { decision: 'ALLOW', ruleName: null, policyId: null, reason: 'r' } as const;

describe('narrationGuard', () => {
  it('rejects DENY narration containing approval language', () => {
    expect(narrationGuard(deny, 'This looks safe to proceed.')).toBe(false);
  });
  it('accepts DENY narration that states the block', () => {
    expect(narrationGuard(deny, 'I blocked this: it would let a stranger take all your tokens.')).toBe(true);
  });
  it('rejects ALLOW narration claiming a block', () => {
    expect(narrationGuard(allow, 'I blocked this transaction.')).toBe(false);
  });
  it('accepts plain ALLOW narration', () => {
    expect(narrationGuard(allow, 'This is a normal small transfer to a saved contact.')).toBe(true);
  });
});

describe('narrationGuard — negation awareness on ALLOW', () => {
  const allow2 = { decision: 'ALLOW', ruleName: null, policyId: null, reason: 'r' } as const;
  it('accepts "was not blocked" phrasing', () => {
    expect(narrationGuard(allow2, 'This transfer was not blocked; it fits your limits.')).toBe(true);
  });
  it('still rejects a positive block claim', () => {
    expect(narrationGuard(allow2, 'This was blocked by policy.')).toBe(false);
  });
});
