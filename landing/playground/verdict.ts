// Runs Clara's REAL deterministic verdict logic in the browser — the same
// decode + classify + policy rules the engine uses. No LLM, no mock: the
// ALLOW/BLOCK decision here is exactly what Clara's engine produces.
import { encodeFunctionData, erc20Abi, maxUint256, parseEther } from 'viem';
import { decodeIncoming, classify } from './_engine.js';
import { claraPolicies, newSession } from './_engine.js';
import type { IncomingRequest } from './_engine.js';

type Ctx = { operation: string; args: readonly unknown[] };
function opFor(req: IncomingRequest): { operation: string; args: unknown[] } {
  switch (req.kind) {
    case 'transaction': return { operation: 'sendTransaction', args: [{ to: req.to, value: req.value ?? '0x0', data: req.data ?? '0x' }] };
    case 'typedData': return { operation: 'signTypedData', args: [req.payload] };
    case 'personalSign': return { operation: 'sign', args: [req.messageHex] };
    case 'authorization': return { operation: 'signAuthorization', args: [{ address: req.delegate }] };
  }
}

export function checkCase(req: IncomingRequest) {
  const decoded = decodeIncoming(req);
  const finding = classify(decoded)[0];
  const { operation, args } = opFor(req);
  const policy = claraPolicies(newSession())[0] as unknown as { rules: { name: string; reason?: string; operation: string | string[]; action: string; conditions: ((c: Ctx) => boolean)[] }[] };
  let decision = 'ALLOW', ruleName: string | null = null, reason = 'No protection rule objected.';
  for (const rule of policy.rules) {
    const ops = Array.isArray(rule.operation) ? rule.operation : [rule.operation];
    if (!ops.includes(operation) && !ops.includes('*')) continue;
    if (rule.conditions.every((c) => c({ operation, args }))) {
      decision = rule.action; ruleName = rule.name; reason = rule.reason ?? rule.name; break;
    }
  }
  const orb: 'safe' | 'warning' = decision === 'DENY' || finding.severity !== 'info' ? 'warning' : 'safe';
  return { decision, ruleName, reason, finding, orb, decoded };
}

// ---- the test cases: real, encoded transactions (same shapes as the engine's corpus)
const DRAINER = '0x9999999999999999999999999999999999999999';
const TOKEN = '0x779877a7b0d9e8603169ddbd7836e478b4624789';
const NFT = '0x3333333333333333333333333333333333333333';
const FRIEND = '0x6666666666666666666666666666666666666666';
const AFA_ABI = [{ type: 'function', name: 'setApprovalForAll', stateMutability: 'nonpayable', inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }], outputs: [] }] as const;
const tx = (to: string, data: string, value = '0x0'): IncomingRequest => ({ kind: 'transaction', to, data, value });
const wei = (e: string) => `0x${parseEther(e).toString(16)}`;

export interface Case { id: string; group: 'scam' | 'safe'; title: string; sub: string; req: IncomingRequest }
export const CASES: Case[] = [
  // ---- scam / dangerous
  { id: 's1', group: 'scam', title: 'Unlimited token approval', sub: 'approve(drainer, ∞)',
    req: tx(TOKEN, encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [DRAINER, maxUint256] })) },
  { id: 's2', group: 'scam', title: 'Give away all your NFTs', sub: 'setApprovalForAll(drainer, true)',
    req: tx(NFT, encodeFunctionData({ abi: AFA_ABI, functionName: 'setApprovalForAll', args: [DRAINER, true] })) },
  { id: 's3', group: 'scam', title: 'Permit2 batch drain', sub: 'signTypedData · PermitBatch',
    req: { kind: 'typedData', payload: { domain: { name: 'Permit2', verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' }, types: { PermitBatch: [], PermitDetails: [] }, message: { details: [{ token: TOKEN }, { token: DRAINER }], spender: DRAINER, sigDeadline: '9999999999' } } } },
  { id: 's4', group: 'scam', title: 'Blind signature', sub: 'personal_sign of unreadable data',
    req: { kind: 'personalSign', messageHex: '0x' + 'de'.repeat(40) } },
  { id: 's5', group: 'scam', title: 'Hand over your account', sub: 'EIP-7702 delegate',
    req: { kind: 'authorization', delegate: DRAINER } },
  { id: 's6', group: 'scam', title: 'Over your spending limit', sub: 'send 0.05 ETH (cap 0.005)',
    req: tx(DRAINER, '0x', wei('0.05')) },
  // ---- safe / normal
  { id: 'g1', group: 'safe', title: 'Small ETH transfer', sub: 'send 0.001 ETH to a contact',
    req: tx(FRIEND, '0x', wei('0.001')) },
  { id: 'g2', group: 'safe', title: 'Bounded token approval', sub: 'approve(dex, 10 USDC)',
    req: tx(TOKEN, encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [FRIEND, 10_000_000n] })) },
  { id: 'g3', group: 'safe', title: 'Normal token transfer', sub: 'transfer 5 USDC',
    req: tx(TOKEN, encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [FRIEND, 5_000_000n] })) },
  { id: 'g4', group: 'safe', title: 'Revoke an approval', sub: 'setApprovalForAll(op, false)',
    req: tx(NFT, encodeFunctionData({ abi: AFA_ABI, functionName: 'setApprovalForAll', args: [DRAINER, false] })) },
  { id: 'g5', group: 'safe', title: 'Readable sign-in', sub: 'personal_sign of a login message',
    req: { kind: 'personalSign', messageHex: '0x' + [...new TextEncoder().encode('Sign in to ExampleDApp - nonce 8231')].map(b=>b.toString(16).padStart(2,'0')).join('') } },
];
