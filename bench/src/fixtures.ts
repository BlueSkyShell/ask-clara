import { encodeFunctionData, erc20Abi, maxUint256, parseEther } from 'viem';
import type { IncomingRequest } from '@clara/engine';

const T = { // synthetic Sepolia-shaped addresses
  token: '0x779877a7b0d9e8603169ddbd7836e478b4624789',
  nft: '0x3333333333333333333333333333333333333333',
  drainer: '0x9999999999999999999999999999999999999999',
  dex: '0x4444444444444444444444444444444444444444',
  fresh: '0x5555555555555555555555555555555555555555',
  friend: '0x6666666666666666666666666666666666666666',
} as const;
const AFA_ABI = [{ type: 'function', name: 'setApprovalForAll', stateMutability: 'nonpayable',
  inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }], outputs: [] }] as const;
const INC_ABI = [{ type: 'function', name: 'increaseAllowance', stateMutability: 'nonpayable',
  inputs: [{ name: 'spender', type: 'address' }, { name: 'addedValue', type: 'uint256' }], outputs: [{ type: 'bool' }] }] as const;

const tx = (to: string, data: `0x${string}`, value: string = '0x0'): IncomingRequest => ({ kind: 'transaction', to, data, value });
const permit2 = (batch: boolean, tokens: number, deadline: string): IncomingRequest => ({
  kind: 'typedData',
  payload: {
    domain: { name: 'Permit2', verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' },
    types: batch ? { PermitBatch: [], PermitDetails: [] } : { PermitSingle: [], PermitDetails: [] },
    message: { details: Array.from({ length: tokens }, () => ({ token: T.token })), spender: T.drainer, sigDeadline: deadline },
  },
});
const wei = (eth: string): `0x${string}` => `0x${parseEther(eth).toString(16)}`;

export const FIXTURES: Record<string, () => IncomingRequest> = {
  // -------- malicious (12)
  m_approve_max:      () => tx(T.token, encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [T.drainer, maxUint256] })),
  m_approve_2pow200:  () => tx(T.token, encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [T.drainer, 2n ** 200n] })),
  m_increase_max:     () => tx(T.token, encodeFunctionData({ abi: INC_ABI, functionName: 'increaseAllowance', args: [T.drainer, 2n ** 200n] })),
  m_afa_true:         () => tx(T.nft, encodeFunctionData({ abi: AFA_ABI, functionName: 'setApprovalForAll', args: [T.drainer, true] })),
  m_afa_true_2:       () => tx(T.fresh, encodeFunctionData({ abi: AFA_ABI, functionName: 'setApprovalForAll', args: [T.drainer, true] })),
  m_permit2_batch:    () => permit2(true, 3, '99999999999'),
  m_blind_sign_32:    () => ({ kind: 'personalSign', messageHex: '0x' + 'de'.repeat(32) }),
  m_blind_sign_96:    () => ({ kind: 'personalSign', messageHex: '0x' + '77'.repeat(96) }),
  m_delegation:       () => ({ kind: 'authorization', delegate: T.drainer }),
  m_over_cap_send:    () => tx(T.drainer, '0x', wei('0.05')),
  m_unknown_value:    () => tx(T.fresh, '0xdeadbeef00000000', wei('0.02')),
  m_over_session:     () => tx(T.friend, '0x', wei('0.009')),
  // -------- safe (8)
  s_native_small:     () => tx(T.friend, '0x', wei('0.001')),
  s_native_small_2:   () => tx(T.fresh, '0x', wei('0.002')),
  s_erc20_transfer:   () => tx(T.token, encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [T.friend, 5_000_000n] })),
  s_erc20_transfer_2: () => tx(T.token, encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [T.dex, 1_000n] })),
  s_approve_bounded:  () => tx(T.token, encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [T.dex, 10_000_000n] })),
  s_afa_revoke:       () => tx(T.nft, encodeFunctionData({ abi: AFA_ABI, functionName: 'setApprovalForAll', args: [T.drainer, false] })),
  s_sign_text:        () => ({ kind: 'personalSign', messageHex: ('0x' + Buffer.from('Sign in to ExampleDApp at 2026-08-23T01:00Z nonce=8231').toString('hex')) }),
  s_unknown_zero:     () => tx(T.fresh, '0xdeadbeef00000000'),
} as const;
