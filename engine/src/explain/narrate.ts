import { generate } from '../qvac/client.js';
import { narrateSystem, narrateUser } from '../qvac/prompts.js';
import type { DecodedOperation, RiskFinding, Verdict } from '../types.js';

const APPROVAL_PHRASES = ['looks safe', 'is safe', 'safe to proceed', 'go ahead', 'nothing to worry', 'perfectly normal', 'feel free to sign'];
const BLOCK_PHRASES = ['blocked', 'denied', 'stopped', "won't go through", 'not allowed', 'refused'];

export function narrationGuard(verdict: Verdict, text: string): boolean {
  const t = text.toLowerCase();
  if (verdict.decision === 'DENY') {
    if (APPROVAL_PHRASES.some((p) => t.includes(p))) return false;
    return BLOCK_PHRASES.some((p) => t.includes(p));
  }
  // ALLOW: negated block mentions ("this was not blocked") are fine — only a
  // positive claim of blocking contradicts the verdict.
  const withoutNegated = t.replace(/\b(?:not|never|no|isn't|isnt|wasn't|wasnt|won't|wont)(?:\s+\w+){0,2}\s+(?:blocked|denied|stopped|refused)\b/g, '');
  return !BLOCK_PHRASES.some((p) => withoutNegated.includes(p));
}

const TEMPLATES: Record<string, string> = {
  UNLIMITED_APPROVAL: 'this would let another address take an unlimited amount of one of your tokens, at any time, without asking again',
  APPROVAL_FOR_ALL: 'this hands control of an entire NFT collection of yours to another address',
  PERMIT2_BATCH: 'this signature would grant batch token permissions through Permit2 — a pattern used by wallet drainers',
  ALLOWANCE_INCREASE: 'this raises an existing token allowance far beyond any normal amount',
  BLIND_SIGN: 'this asks you to sign unreadable data — there is no way to know what you would be agreeing to',
  EOA_DELEGATION: 'this would put other code in control of your account itself',
  OVER_CAP: 'this is larger than the spending limit you set',
  UNKNOWN_CALL: 'I could not fully identify what this contract call does',
  NONE: 'this is a routine operation',
};

export function templateNarration(verdict: Verdict, findings: RiskFinding[], _decoded: DecodedOperation): string {
  const key = findings[0]?.code ?? 'NONE';
  const what = TEMPLATES[key] ?? TEMPLATES.NONE!;
  return verdict.decision === 'DENY'
    ? `I blocked this: ${what}. Policy rule "${verdict.ruleName ?? 'clara-core'}" stopped it (${verdict.reason}). If you meant to do this, adjust your limits in settings first.`
    : `This checks out: ${what}. No policy rule objected, so it is allowed. ${findings[0]?.severity !== 'info' ? "I'm not fully sure about every detail — double-check the recipient." : ''}`.trim();
}

export async function narrate(
  verdict: Verdict, decoded: DecodedOperation, findings: RiskFinding[],
): Promise<{ narration: string; source: 'model' | 'template' }> {
  const messages = [{ role: 'user', content: narrateUser(verdict, decoded, findings) }];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { text } = await generate({
        system: narrateSystem()
          + (attempt === 1 ? `\nYour previous wording contradicted the verdict (${verdict.decision}). State the ${verdict.decision === 'DENY' ? 'block' : 'approval'} clearly.` : ''),
        messages, maxTokens: 160, temperature: 0.2,
      });
      if (narrationGuard(verdict, text)) return { narration: text, source: 'model' };
    } catch { /* fall through to template */ }
  }
  return { narration: templateNarration(verdict, findings, decoded), source: 'template' };
}
