import { describe, it, expect } from 'vitest';
import { encodeFunctionData, erc20Abi, maxUint256, parseEther } from 'viem';
import { decodeTransaction, decodePersonalSign, decodeTypedData, decodeIncoming } from '../src/explain/decode.js';

const TOKEN = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const SPENDER = '0x2222222222222222222222222222222222222222';
const NFT_ABI = [{ type: 'function', name: 'setApprovalForAll', stateMutability: 'nonpayable',
  inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }], outputs: [] }] as const;
const INCREASE_ABI = [{ type: 'function', name: 'increaseAllowance', stateMutability: 'nonpayable',
  inputs: [{ name: 'spender', type: 'address' }, { name: 'addedValue', type: 'uint256' }], outputs: [{ type: 'bool' }] }] as const;

describe('decodeTransaction', () => {
  it('plain value send → native.transfer', () => {
    const d = decodeTransaction({ to: SPENDER, value: parseEther('0.001'), data: '0x' });
    expect(d).toEqual({ op: 'native.transfer', to: SPENDER, valueWei: parseEther('0.001') });
  });
  it('erc20 approve MAX → unlimited approve', () => {
    const d = decodeTransaction({ to: TOKEN, data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [SPENDER, maxUint256] }) });
    expect(d.op).toBe('erc20.approve');
    if (d.op === 'erc20.approve') { expect(d.unlimited).toBe(true); expect(d.spender.toLowerCase()).toBe(SPENDER); }
  });
  it('erc20 approve 1000 → bounded', () => {
    const d = decodeTransaction({ to: TOKEN, data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [SPENDER, 1000n] }) });
    if (d.op === 'erc20.approve') expect(d.unlimited).toBe(false); else expect.fail(d.op);
  });
  it('erc20 transfer decodes amount and recipient', () => {
    const d = decodeTransaction({ to: TOKEN, data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [SPENDER, 5_000_000n] }) });
    expect(d).toMatchObject({ op: 'erc20.transfer', amount: 5_000_000n });
  });
  it('setApprovalForAll(true) → nft.setApprovalForAll approved', () => {
    const d = decodeTransaction({ to: TOKEN, data: encodeFunctionData({ abi: NFT_ABI, functionName: 'setApprovalForAll', args: [SPENDER, true] }) });
    expect(d).toMatchObject({ op: 'nft.setApprovalForAll', approved: true });
  });
  it('increaseAllowance decodes', () => {
    const d = decodeTransaction({ to: TOKEN, data: encodeFunctionData({ abi: INCREASE_ABI, functionName: 'increaseAllowance', args: [SPENDER, 7n] }) });
    expect(d).toMatchObject({ op: 'erc20.increaseAllowance', amount: 7n });
  });
  it('unknown selector → unknown with selector preserved', () => {
    const d = decodeTransaction({ to: SPENDER, data: '0xdeadbeef00000000' });
    expect(d).toMatchObject({ op: 'unknown', selector: '0xdeadbeef' });
  });
});

describe('personal_sign / typed data / incoming', () => {
  it('readable utf8 → personalSign.text', () => {
    const hex = '0x' + Buffer.from('login to example.com').toString('hex');
    expect(decodePersonalSign(hex)).toEqual({ op: 'personalSign.text', text: 'login to example.com' });
  });
  it('opaque 32 bytes → personalSign.opaqueHex', () => {
    expect(decodePersonalSign('0x' + 'ab'.repeat(32))).toEqual({ op: 'personalSign.opaqueHex', byteLength: 32 });
  });
  it('permit2 PermitBatch typed data → permit2.batch', () => {
    const d = decodeTypedData({
      domain: { name: 'Permit2', verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' },
      types: { PermitBatch: [], PermitDetails: [] },
      message: { details: [{ token: TOKEN }, { token: SPENDER }], spender: SPENDER, sigDeadline: '9999999999' },
    });
    expect(d).toMatchObject({ op: 'permit2.batch', tokenCount: 2 });
  });
  it('authorization request → eip7702.delegate', () => {
    expect(decodeIncoming({ kind: 'authorization', delegate: SPENDER })).toEqual({ op: 'eip7702.delegate', delegate: SPENDER });
  });
});
