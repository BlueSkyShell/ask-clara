import { decodeFunctionData, erc20Abi, hexToBytes, slice, size } from 'viem';
import { CONFIG } from '../config.js';
import type { DecodedOperation, IncomingRequest } from '../types.js';

const EXTRA_ABI = [
  { type: 'function', name: 'setApprovalForAll', stateMutability: 'nonpayable',
    inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }], outputs: [] },
  { type: 'function', name: 'increaseAllowance', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'addedValue', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const;

const toWei = (v: string | bigint | undefined): bigint =>
  typeof v === 'bigint' ? v : v ? BigInt(v) : 0n;

export function decodeTransaction(tx: { to: string; value?: string | bigint; data?: string }): DecodedOperation {
  const data = (tx.data ?? '0x') as `0x${string}`;
  if (data === '0x' || size(data) === 0)
    return { op: 'native.transfer', to: tx.to, valueWei: toWei(tx.value) };
  for (const abi of [erc20Abi, EXTRA_ABI] as const) {
    try {
      const { functionName, args } = decodeFunctionData({ abi, data });
      switch (functionName) {
        case 'transfer': {
          const [to, amount] = args as readonly [string, bigint];
          return { op: 'erc20.transfer', token: tx.to, to, amount };
        }
        case 'approve': {
          const [spender, amount] = args as readonly [string, bigint];
          return { op: 'erc20.approve', token: tx.to, spender, amount, unlimited: amount >= CONFIG.unlimitedThreshold };
        }
        case 'increaseAllowance': {
          const [spender, amount] = args as readonly [string, bigint];
          return { op: 'erc20.increaseAllowance', token: tx.to, spender, amount };
        }
        case 'setApprovalForAll': {
          const [operator, approved] = args as readonly [string, boolean];
          return { op: 'nft.setApprovalForAll', collection: tx.to, operator, approved };
        }
      }
    } catch { /* try next abi */ }
  }
  return { op: 'unknown', to: tx.to, selector: size(data) >= 4 ? slice(data, 0, 4) : null, dataBytes: size(data) };
}

export function decodePersonalSign(messageHex: string): DecodedOperation {
  try {
    const bytes = hexToBytes(messageHex as `0x${string}`);
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // printable = every char is common text; control chars → opaque
    if (text.length > 0 && [...text].every((ch) => ch >= ' ' || ch === '\n' || ch === '\t'))
      return { op: 'personalSign.text', text };
    return { op: 'personalSign.opaqueHex', byteLength: bytes.length };
  } catch {
    const len = Math.max(0, (messageHex.length - 2) / 2);
    return { op: 'personalSign.opaqueHex', byteLength: Math.floor(len) };
  }
}

export function decodeTypedData(payload: unknown): DecodedOperation {
  const p = payload as {
    domain?: { verifyingContract?: string };
    types?: Record<string, unknown>;
    message?: { details?: unknown[]; spender?: string; sigDeadline?: unknown };
  } | null;
  const vc = (p?.domain?.verifyingContract ?? '').toLowerCase();
  const typeNames = Object.keys(p?.types ?? {});
  if (vc === CONFIG.permit2 && typeNames.some((t) => t.startsWith('PermitBatch'))) {
    return {
      op: 'permit2.batch',
      spender: p?.message?.spender ?? 'unknown',
      tokenCount: Array.isArray(p?.message?.details) ? p.message.details.length : 0,
      sigDeadline: String(p?.message?.sigDeadline ?? 'unknown'),
    };
  }
  return { op: 'unknown', to: vc || 'typed-data', selector: typeNames[0] ?? null, dataBytes: JSON.stringify(payload ?? {}).length };
}

export function decodeIncoming(req: IncomingRequest): DecodedOperation {
  switch (req.kind) {
    case 'transaction':   return decodeTransaction(req);
    case 'typedData':     return decodeTypedData(req.payload);
    case 'personalSign':  return decodePersonalSign(req.messageHex);
    case 'authorization': return { op: 'eip7702.delegate', delegate: req.delegate };
  }
}
