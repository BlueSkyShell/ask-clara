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

export async function narrate(
  verdict: Verdict, decoded: DecodedOperation, findings: RiskFinding[],
): Promise<{ narration: string; source: 'model' | 'policy' }> {
  const messages = [{ role: 'user', content: narrateUser(verdict, decoded, findings) }];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { text } = await generate({
        system: narrateSystem()
          + (attempt > 0 ? `\nYour previous wording contradicted the verdict (${verdict.decision}). State the ${verdict.decision === 'DENY' ? 'block' : 'approval'} clearly.` : ''),
        messages, maxTokens: 160, temperature: 0.2,
      });
      if (narrationGuard(verdict, text)) return { narration: text, source: 'model' };
    } catch { /* retry */ }
  }
  // All model attempts failed the guard — fall back to the raw policy reason.
  // This is deterministic (comes from WDK verdict.reason), never fabricated.
  return { narration: verdict.reason, source: 'policy' };
}
