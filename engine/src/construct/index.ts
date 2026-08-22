import { randomUUID } from 'node:crypto';
import { formatEther } from 'viem';
import { PolicyViolationError } from '@tetherto/wdk';
import { runToolTurn } from '../qvac/toolloop.js';
import { constructSystem } from '../qvac/prompts.js';
import { constructTools } from './tools.js';
import { mapOutcome, normalizeUtterance, type Proposal } from './outcome.js';
import { explain } from '../explain/index.js';
import { recordSend } from '../policy/session.js';
import { CONFIG } from '../config.js';
import type { ModelKey } from '../qvac/client.js';
import type { ConstructOutcome, SendResult, SessionState } from '../types.js';
import type { Wallet } from '../wdk/wallet.js';

interface Pending { to: string; amountWei: bigint; label: string | null }

export function makeConstruct(wallet: Wallet, session: SessionState, modelKey: ModelKey) {
  // Rolling history: MULTI-TURN DEFENSE — one session, one history, one policy state.
  const messages: { role: string; content: string }[] = [];
  const pending = new Map<string, Pending>();

  async function construct(utteranceRaw: string): Promise<ConstructOutcome> {
    const utterance = normalizeUtterance(utteranceRaw);
    messages.push({ role: 'user', content: utterance });
    let outcome: Proposal | ConstructOutcome;
    try {
      const r = await runToolTurn({
        modelKey,
        system: constructSystem(Object.keys(wallet.contacts)),
        messages,
        tools: constructTools(wallet), // semantics re-derived from source EVERY call
      });
      outcome = mapOutcome(wallet, r);
    } catch (e) {
      return { kind: 'error', message: e instanceof Error ? e.message : String(e) };
    }
    if (outcome.kind !== 'proposal') {
      const assistantLine = outcome.kind === 'chat' ? outcome.reply
        : outcome.kind === 'clarify' ? outcome.question
        : outcome.kind === 'refused' ? `refused: ${outcome.reason}` : 'error';
      messages.push({ role: 'assistant', content: assistantLine });
      return outcome;
    }
    // CROSS-CHECK: Direction 2's product re-enters Direction 1 before any confirm (spec §4).
    const explanation = await explain(wallet, {
      kind: 'transaction', to: outcome.to, value: `0x${outcome.amountWei.toString(16)}`, data: '0x',
    });
    if (explanation.verdict.decision === 'DENY') {
      messages.push({ role: 'assistant', content: `refused by policy: ${explanation.verdict.reason}` });
      return { kind: 'refused', reason: `${explanation.verdict.reason} (rule: ${explanation.verdict.ruleName})` };
    }
    const confirmId = randomUUID();
    pending.set(confirmId, { to: outcome.to, amountWei: outcome.amountWei, label: outcome.label });
    messages.push({ role: 'assistant', content: `built transfer of ${formatEther(outcome.amountWei)} ETH to ${outcome.label ?? outcome.to}, awaiting confirmation` });
    return {
      kind: 'built', confirmId,
      transfer: { to: outcome.to, amountWei: outcome.amountWei, token: 'ETH', recipientLabel: outcome.label },
      explanation,
    };
  }

  async function confirmSend(confirmId: string): Promise<SendResult> {
    const p = pending.get(confirmId);
    if (!p) throw new Error('nothing pending under that confirmation id');
    pending.delete(confirmId);
    try {
      // The proxied account re-runs the SAME policy rules at send time (enforcement, not advice).
      const { hash } = await (wallet.account as unknown as {
        sendTransaction(tx: { to: string; value: bigint }): Promise<{ hash: string }>;
      }).sendTransaction({ to: p.to, value: p.amountWei });
      recordSend(session, p.to, p.amountWei);
      return { txHash: hash, explorerUrl: `${CONFIG.chain.explorer}/tx/${hash}` };
    } catch (e) {
      if (e instanceof PolicyViolationError) throw new Error(`policy blocked at send time: ${(e as unknown as { reason?: string }).reason ?? (e as Error).message}`);
      throw e;
    }
  }

  return { construct, confirmSend };
}
