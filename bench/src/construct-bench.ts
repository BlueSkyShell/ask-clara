import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createEngine } from '@clara/engine';

type Case = { id: string; class: 'clean' | 'ambiguous' | 'adversarial'; turns: string[]; expect: string; expectTransfer?: { toLabel: string | null; amountEth: string }; note: string };
const args = process.argv.slice(2);
const runs = Number(args[args.indexOf('--runs') + 1] || 3);
const modelKey = (args.includes('--model') ? args[args.indexOf('--model') + 1] : 'primary') as 'primary' | 'toolSpecialist';
const corpus = JSON.parse(readFileSync(new URL('../corpus/construct.json', import.meta.url), 'utf8')) as { cases: Case[] };

const rows: Record<string, unknown>[] = [];
const tally = { clean: [0, 0], ambiguous: [0, 0], adversarial: [0, 0] } as Record<string, [number, number]>;
let incorrectActions = 0, safeMisses = 0;

for (let r = 0; r < runs; r++) {
  for (const c of corpus.cases) {
    const engine = await createEngine({ modelKey }); // fresh session per case
    let last: Awaited<ReturnType<typeof engine.construct>> = { kind: 'error', message: 'no turns' };
    const t0 = Date.now();
    for (const turn of c.turns) last = await engine.construct(turn);
    const ms = Date.now() - t0;
    let pass = last.kind === c.expect;
    if (pass && last.kind === 'built' && c.expectTransfer) {
      const amt = Number(last.transfer.amountWei) / 1e18;
      const labelOk = c.expectTransfer.toLabel === null || last.transfer.recipientLabel === c.expectTransfer.toLabel;
      pass = labelOk && amt === Number(c.expectTransfer.amountEth);
    }
    const heldInstead = !pass && c.expect !== 'built' && (last.kind === 'clarify' || last.kind === 'refused');
    if (heldInstead) safeMisses++;
    const builtWrong = last.kind === 'built' && (c.expect !== 'built' || !pass);
    if (builtWrong) incorrectActions++;
    tally[c.class]![1]++; if (pass) tally[c.class]![0]++;
    rows.push({ run: r, id: c.id, class: c.class, expect: c.expect, got: last.kind, pass, heldInstead, builtWrong, ms,
      detail: last.kind === 'built' ? { to: last.transfer.to, label: last.transfer.recipientLabel, amountWei: last.transfer.amountWei.toString() } : last });
    console.log(`[${r}] ${pass ? 'PASS' : builtWrong ? 'DANGER' : heldInstead ? 'held' : 'MISS'} ${c.id} (${c.class}): expected ${c.expect}, got ${last.kind} (${ms}ms)`);
    await engine.close();
  }
}

const out = {
  benchmark: 'construct', model: modelKey, runs, startedAt: new Date().toISOString(), cases: rows,
  summary: {
    byClass: Object.fromEntries(Object.entries(tally).map(([k, [ok, n]]) => [k, { correct: ok, total: n, rate: ok / n }])),
    incorrectActions, incorrectActionRate: incorrectActions / rows.length, safeMisses,
  },
};
mkdirSync(new URL('../results/', import.meta.url), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
writeFileSync(new URL(`../results/construct-${modelKey}-${stamp}.json`, import.meta.url), JSON.stringify(out, null, 2));
writeFileSync(new URL(`../results/construct-${modelKey}-latest.json`, import.meta.url), JSON.stringify(out, null, 2));

// merge results.js for the dashboard (file:// friendly)
const read = (p: string) => existsSync(new URL(p, import.meta.url)) ? JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8')) : null;
const merged = {
  explain: read('../results/explain-latest.json'),
  construct: { primary: read('../results/construct-primary-latest.json'), toolSpecialist: read('../results/construct-toolSpecialist-latest.json') },
};
writeFileSync(new URL('../results/results.js', import.meta.url), `window.CLARA_RESULTS = ${JSON.stringify(merged, null, 2)};`);
console.log('\nSUMMARY', JSON.stringify(out.summary, null, 2));
process.exit(0);
