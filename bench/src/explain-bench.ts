import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createEngine } from '@clara/engine';
import { FIXTURES } from './fixtures.js';

const args = process.argv.slice(2);
const runs = Number(args[args.indexOf('--runs') + 1] || 3);
const modelKey = (args.includes('--model') ? args[args.indexOf('--model') + 1] : 'primary') as 'primary' | 'toolSpecialist';

const corpus = JSON.parse(readFileSync(new URL('../corpus/explain.json', import.meta.url), 'utf8')) as {
  cases: { id: string; label: string; expectVerdict: string; expectRule: string | null; fixture: string; rationale: string }[];
};

const results: Record<string, unknown>[] = [];
const narrateTimes: number[] = [];
let correct = 0, fp = 0, fn = 0, policyFallbacks = 0, total = 0;

for (let r = 0; r < runs; r++) {
  // Fresh engine per run so the session cap never bleeds between runs.
  const engine = await createEngine({ modelKey });
  for (const c of corpus.cases) {
    const t0 = Date.now();
    const e = await engine.explain(FIXTURES[c.fixture]!());
    const pass = e.verdict.decision === c.expectVerdict && (c.expectRule === null || e.verdict.ruleName === c.expectRule);
    total++;
    if (pass) correct++;
    if (c.label === 'safe' && e.verdict.decision === 'DENY') fp++;
    if (c.label === 'malicious' && e.verdict.decision === 'ALLOW') fn++; // the costly error
    if (e.narrationSource === 'policy') policyFallbacks++;
    narrateTimes.push(e.timingMs.narrate);
    results.push({ run: r, id: c.id, label: c.label, expected: c.expectVerdict, got: e.verdict.decision,
      verdictRule: e.verdict.ruleName, orb: e.orb, narrationSource: e.narrationSource, pass, ms: Date.now() - t0,
      narration: e.narration });
    console.log(`[${r}] ${pass ? 'PASS' : 'FAIL'} ${c.id}: ${e.verdict.decision}/${e.verdict.ruleName} (${e.narrationSource}, ${Date.now() - t0}ms)`);
  }
  await engine.close();
}

narrateTimes.sort((a, b) => a - b);
const pct = (p: number) => narrateTimes[Math.min(narrateTimes.length - 1, Math.floor((p / 100) * narrateTimes.length))];
const out = {
  benchmark: 'explain', model: modelKey, runs, startedAt: new Date().toISOString(), cases: results,
  summary: { total, correct, falsePositives: fp, falseNegatives: fn,
    fpRate: fp / (runs * corpus.cases.filter((c) => c.label === 'safe').length),
    fnRate: fn / (runs * corpus.cases.filter((c) => c.label === 'malicious').length),
    narrationFallbackRate: policyFallbacks / total, p50NarrateMs: pct(50), p95NarrateMs: pct(95) },
};
mkdirSync(new URL('../results/', import.meta.url), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
writeFileSync(new URL(`../results/explain-${modelKey}-${stamp}.json`, import.meta.url), JSON.stringify(out, null, 2));
writeFileSync(new URL('../results/explain-latest.json', import.meta.url), JSON.stringify(out, null, 2));
console.log('\nSUMMARY', JSON.stringify(out.summary, null, 2));
process.exit(0);
