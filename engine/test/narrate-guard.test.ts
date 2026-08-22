import { describe, it, expect } from 'vitest';
import { narrationGuard, templateNarration } from '../src/explain/narrate.js';

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

describe('templateNarration', () => {
  it('produces text for every risk code without a model', () => {
    for (const code of ['UNLIMITED_APPROVAL','APPROVAL_FOR_ALL','PERMIT2_BATCH','ALLOWANCE_INCREASE','BLIND_SIGN','EOA_DELEGATION','OVER_CAP','UNKNOWN_CALL','NONE'] as const) {
      const t = templateNarration(deny, [{ code, severity: 'critical', detail: 'd' }],
        { op: 'unknown', to: '0x0', selector: null, dataBytes: 0 });
      expect(t.length).toBeGreaterThan(20);
    }
  });
});
