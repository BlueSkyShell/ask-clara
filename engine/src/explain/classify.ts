import { formatEther } from 'viem';
import type { DecodedOperation, RiskFinding, Verdict } from '../types.js';

export function classify(d: DecodedOperation): RiskFinding[] {
  switch (d.op) {
    case 'erc20.approve':
      return d.unlimited
        ? [{ code: 'UNLIMITED_APPROVAL', severity: 'critical', detail: `unlimited approval of token ${d.token} to ${d.spender}` }]
        : [{ code: 'NONE', severity: 'info', detail: `bounded approval of ${d.amount} to ${d.spender}` }];
    case 'erc20.increaseAllowance':
      return [{ code: 'ALLOWANCE_INCREASE', severity: 'warning', detail: `raises allowance for ${d.spender} by ${d.amount}` }];
    case 'nft.setApprovalForAll':
      return d.approved
        ? [{ code: 'APPROVAL_FOR_ALL', severity: 'critical', detail: `grants ${d.operator} control over ALL tokens in ${d.collection}` }]
        : [{ code: 'NONE', severity: 'info', detail: `revokes collection-wide approval for ${d.operator}` }];
    case 'permit2.batch':
      return [{ code: 'PERMIT2_BATCH', severity: 'critical', detail: `Permit2 batch permission for ${d.tokenCount} token(s) to ${d.spender}` }];
    case 'personalSign.opaqueHex':
      return [{ code: 'BLIND_SIGN', severity: 'critical', detail: `unreadable ${d.byteLength}-byte payload` }];
    case 'eip7702.delegate':
      return [{ code: 'EOA_DELEGATION', severity: 'critical', detail: `delegates account control to ${d.delegate}` }];
    case 'unknown':
      return [{ code: 'UNKNOWN_CALL', severity: 'warning', detail: `unrecognized call ${d.selector ?? '(no selector)'} to ${d.to}` }];
    case 'native.transfer':
      return [{ code: 'NONE', severity: 'info', detail: `sends ${formatEther(d.valueWei)} ETH to ${d.to}` }];
    case 'erc20.transfer':
      return [{ code: 'NONE', severity: 'info', detail: `sends ${d.amount} of token ${d.token} to ${d.to}` }];
    case 'personalSign.text':
      return [{ code: 'NONE', severity: 'info', detail: `signs readable message: "${d.text.slice(0, 80)}"` }];
  }
}

export function orbFor(verdict: Verdict, findings: RiskFinding[]): 'safe' | 'warning' {
  if (verdict.decision === 'DENY') return 'warning';
  return findings.some((f) => f.severity !== 'info') ? 'warning' : 'safe';
}
