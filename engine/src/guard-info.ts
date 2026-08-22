import { formatEther } from 'viem';
import { CONFIG } from './config.js';

// Human-readable description of what Clara's policy engine blocks. Names match
// the DENY rules in policy/rules.ts so the UI shows the real protection set.
export const PROTECTIONS = [
  { rule: 'deny-unlimited-approval', title: 'Unlimited token approvals', detail: 'A contract asking to spend an unlimited amount of a token.' },
  { rule: 'deny-approval-for-all', title: 'Blanket NFT approvals', detail: 'Handing control of a whole NFT collection to another address.' },
  { rule: 'deny-permit2-batch', title: 'Permit2 batch drains', detail: 'A signature granting batch token permissions — a common drainer.' },
  { rule: 'deny-allowance-increase', title: 'Runaway allowance increases', detail: 'Raising an existing allowance to an effectively unlimited amount.' },
  { rule: 'deny-blind-sign', title: 'Blind signatures', detail: 'Signing unreadable data you can’t verify.' },
  { rule: 'deny-eoa-delegation', title: 'Account delegation', detail: 'Handing control of your account itself to other code (EIP-7702).' },
  { rule: 'deny-over-per-tx-cap', title: 'Over your per-transaction limit', detail: `A single transaction above ${formatEther(CONFIG.caps.perTxWei)} ETH.` },
  { rule: 'deny-over-session-cap', title: 'Over your session limit', detail: `More than ${formatEther(CONFIG.caps.sessionWei)} ETH total this session.` },
] as const;

export function guardInfo() {
  return {
    chain: 'Ethereum Sepolia (testnet)',
    caps: {
      perTxEth: formatEther(CONFIG.caps.perTxWei),
      sessionEth: formatEther(CONFIG.caps.sessionWei),
    },
    protections: PROTECTIONS.map((p) => ({ title: p.title, detail: p.detail })),
  };
}
