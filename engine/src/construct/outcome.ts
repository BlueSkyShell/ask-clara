import { getAddress, parseEther } from 'viem';
import type { ConstructOutcome } from '../types.js';
import type { Wallet } from '../wdk/wallet.js';
import type { ToolTurnResult } from '../qvac/toolloop.js';

// ENCODING/OBFUSCATION DEFENSE (spec §6): normalize before the model sees it;
// and nothing downstream ever trusts surface text — policy sees only the built tx.
export function normalizeUtterance(s: string): string {
  return s.normalize('NFC').replace(/[​-‍﻿]/g, '');
}

export function resolveRecipient(wallet: Wallet, recipient: string): { address: string; label: string | null } | null {
  const contacts = wallet.contacts as Record<string, string>;
  const byLabel = Object.entries(contacts).find(([l]) => l.toLowerCase() === recipient.trim().toLowerCase());
  if (byLabel) return { address: byLabel[1], label: byLabel[0] };
  try {
    const addr = getAddress(recipient.trim()); // throws on malformed/bad checksum
    const known = Object.entries(contacts).find(([, a]) => a.toLowerCase() === addr.toLowerCase());
    return { address: addr, label: known?.[0] ?? null };
  } catch { return null; }
}

export type Proposal = { kind: 'proposal'; to: string; amountWei: bigint; label: string | null };

export function mapOutcome(wallet: Wallet, r: ToolTurnResult): Proposal | ConstructOutcome {
  switch (r.kind) {
    case 'text': return { kind: 'chat', reply: r.text };
    case 'toolError': return { kind: 'refused', reason: `I could not act on that safely (${r.code}: ${r.message}). Try rephrasing.` };
    case 'tool': break;
  }
  const { name, args } = r;
  if (name === 'ask_clarification') return { kind: 'clarify', question: String(args.question) };
  if (name === 'refuse_request') return { kind: 'refused', reason: String(args.reason) };
  if (name === 'build_transfer') {
    const resolved = resolveRecipient(wallet, String(args.recipient));
    if (!resolved) return { kind: 'clarify', question: `I don't know "${String(args.recipient)}". Give me a saved contact (${Object.keys(wallet.contacts).join(', ')}) or a full 0x address.` };
    const amountStr = String(args.amountEth).trim();
    if (!/^\d+(\.\d+)?$/.test(amountStr)) return { kind: 'clarify', question: `I need a plain ETH amount (like 0.002) — "${amountStr}" isn't one. How much ETH?` };
    return { kind: 'proposal', to: resolved.address, amountWei: parseEther(amountStr), label: resolved.label };
  }
  return { kind: 'refused', reason: `unexpected tool ${name}` };
}
