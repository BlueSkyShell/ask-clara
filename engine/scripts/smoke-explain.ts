import { encodeFunctionData, erc20Abi, maxUint256 } from 'viem';
import { createEngine } from '../src/index.js';

const engine = await createEngine();
const cases = [
  { name: 'MALICIOUS unlimited approve', req: { kind: 'transaction' as const,
    to: '0x779877a7b0d9e8603169ddbd7836e478b4624789',
    data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: ['0x9999999999999999999999999999999999999999', maxUint256] }) } },
  { name: 'SAFE small native send', req: { kind: 'transaction' as const,
    to: engine.contacts().alice!, value: '0x38d7ea4c68000' /* 0.001 ETH */, data: '0x' } },
  { name: 'MALICIOUS blind sign', req: { kind: 'personalSign' as const, messageHex: '0x' + 'ab'.repeat(32) } },
];
for (const c of cases) {
  const e = await engine.explain(c.req);
  console.log(`\n=== ${c.name}\nverdict: ${e.verdict.decision} (${e.verdict.ruleName})  orb: ${e.orb}  src: ${e.narrationSource}`);
  console.log('narration:', e.narration);
  console.log('timing:', JSON.stringify(e.timingMs));
}
await engine.close();
process.exit(0);
