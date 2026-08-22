import { describe, it, expect } from 'vitest';
import { classify, orbFor } from '../src/explain/classify.js';

describe('classify', () => {
  it('unlimited approve → UNLIMITED_APPROVAL critical', () => {
    const f = classify({ op: 'erc20.approve', token: '0xt', spender: '0xs', amount: 2n ** 200n, unlimited: true });
    expect(f[0]).toMatchObject({ code: 'UNLIMITED_APPROVAL', severity: 'critical' });
  });
  it('bounded approve → NONE info', () => {
    const f = classify({ op: 'erc20.approve', token: '0xt', spender: '0xs', amount: 10n, unlimited: false });
    expect(f[0]!.code).toBe('NONE');
  });
  it('setApprovalForAll true → APPROVAL_FOR_ALL critical; false → NONE', () => {
    expect(classify({ op: 'nft.setApprovalForAll', collection: '0xc', operator: '0xo', approved: true })[0])
      .toMatchObject({ code: 'APPROVAL_FOR_ALL', severity: 'critical' });
    expect(classify({ op: 'nft.setApprovalForAll', collection: '0xc', operator: '0xo', approved: false })[0]!.code).toBe('NONE');
  });
  it('opaque sign → BLIND_SIGN critical; text sign → NONE', () => {
    expect(classify({ op: 'personalSign.opaqueHex', byteLength: 32 })[0]!.code).toBe('BLIND_SIGN');
    expect(classify({ op: 'personalSign.text', text: 'hello' })[0]!.code).toBe('NONE');
  });
  it('unknown call → UNKNOWN_CALL warning', () => {
    expect(classify({ op: 'unknown', to: '0xu', selector: '0xdeadbeef', dataBytes: 8 })[0])
      .toMatchObject({ code: 'UNKNOWN_CALL', severity: 'warning' });
  });
});

describe('orbFor', () => {
  const allow = { decision: 'ALLOW', ruleName: null, policyId: null, reason: 'x' } as const;
  const deny = { decision: 'DENY', ruleName: 'r', policyId: 'p', reason: 'x' } as const;
  it('ALLOW + info-only → safe', () => {
    expect(orbFor(allow, [{ code: 'NONE', severity: 'info', detail: '' }])).toBe('safe');
  });
  it('ALLOW + warning finding → warning', () => {
    expect(orbFor(allow, [{ code: 'UNKNOWN_CALL', severity: 'warning', detail: '' }])).toBe('warning');
  });
  it('DENY → warning always', () => {
    expect(orbFor(deny, [])).toBe('warning');
  });
});
