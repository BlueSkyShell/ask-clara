import { describe, it, expect } from 'vitest';
import { encodeFunctionData, erc20Abi, maxUint256, parseEther } from 'viem';
import { claraPolicies } from '../src/policy/rules.js';
import { newSession, recordSend } from '../src/policy/session.js';

const SPENDER = '0x1111111111111111111111111111111111111111';
const ctx = (operation: string, ...args: unknown[]) => ({ operation, wallet: 'ethereum', account: {}, args }) as never;

// Find a rule by name and evaluate all its conditions against a context.
async function matches(session: ReturnType<typeof newSession>, operation: string, args: unknown[], ruleName: string) {
  const policy = claraPolicies(session)[0]!;
  const rule = (policy as unknown as { rules: { name: string; operation: string | string[]; conditions: ((c: unknown) => boolean | Promise<boolean>)[] }[] })
    .rules.find((r) => r.name === ruleName)!;
  const ops = Array.isArray(rule.operation) ? rule.operation : [rule.operation];
  if (!ops.includes(operation) && !ops.includes('*')) return false;
  for (const c of rule.conditions) if (!(await c(ctx(operation, ...args)))) return false;
  return true;
}

const approveTx = (amount: bigint) => ({
  to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(),
  value: '0x0',
  data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [SPENDER, amount] }),
});

describe('clara-core rules', () => {
  it('unlimited approve matches deny-unlimited-approval', async () => {
    expect(await matches(newSession(), 'sendTransaction', [approveTx(maxUint256)], 'deny-unlimited-approval')).toBe(true);
  });
  it('bounded approve does not match', async () => {
    expect(await matches(newSession(), 'sendTransaction', [approveTx(1000n)], 'deny-unlimited-approval')).toBe(false);
  });
  it('setApprovalForAll(true) matches deny-approval-for-all', async () => {
    const data = encodeFunctionData({
      abi: [{ type: 'function', name: 'setApprovalForAll', stateMutability: 'nonpayable',
        inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }], outputs: [] }],
      functionName: 'setApprovalForAll', args: [SPENDER, true],
    });
    expect(await matches(newSession(), 'sendTransaction', [{ to: SPENDER, value: '0x0', data }], 'deny-approval-for-all')).toBe(true);
  });
  it('per-tx cap: 0.006 ETH send matches deny-over-per-tx-cap', async () => {
    expect(await matches(newSession(), 'sendTransaction',
      [{ to: SPENDER, value: parseEther('0.006'), data: '0x' }], 'deny-over-per-tx-cap')).toBe(true);
  });
  it('session cap accumulates: third 0.004 send matches deny-over-session-cap', async () => {
    const s = newSession();
    recordSend(s, SPENDER, parseEther('0.004'));
    recordSend(s, SPENDER, parseEther('0.004'));
    expect(await matches(s, 'sendTransaction',
      [{ to: SPENDER, value: parseEther('0.004'), data: '0x' }], 'deny-over-session-cap')).toBe(true);
    expect(await matches(newSession(), 'sendTransaction',
      [{ to: SPENDER, value: parseEther('0.004'), data: '0x' }], 'deny-over-session-cap')).toBe(false);
  });
  it('opaque personal_sign matches deny-blind-sign; readable text does not', async () => {
    expect(await matches(newSession(), 'sign', ['0x' + 'ab'.repeat(32)], 'deny-blind-sign')).toBe(true);
    const hexOfText = '0x' + Buffer.from('login to example.com at 12:00').toString('hex');
    expect(await matches(newSession(), 'sign', [hexOfText], 'deny-blind-sign')).toBe(false);
  });
  it('signAuthorization always matches deny-eoa-delegation', async () => {
    expect(await matches(newSession(), 'signAuthorization', [{ address: SPENDER }], 'deny-eoa-delegation')).toBe(true);
  });
});
