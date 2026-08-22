import { decodeIncoming } from './decode.js';
import { classify, orbFor } from './classify.js';
import { evaluateVerdict } from './verdict.js';
import { narrate } from './narrate.js';
import type { Explanation, IncomingRequest } from '../types.js';
import type { Wallet } from '../wdk/wallet.js';

export async function explain(wallet: Wallet, req: IncomingRequest): Promise<Explanation> {
  const t0 = performance.now();
  const decoded = decodeIncoming(req);
  const findings = classify(decoded);
  const t1 = performance.now();
  const verdict = await evaluateVerdict(wallet, req);
  const t2 = performance.now();
  const { narration, source } = await narrate(verdict, decoded, findings);
  const t3 = performance.now();
  return {
    verdict, decoded, findings, narration, narrationSource: source,
    orb: orbFor(verdict, findings),
    timingMs: { decode: Math.round(t1 - t0), policy: Math.round(t2 - t1), narrate: Math.round(t3 - t2) },
  };
}
