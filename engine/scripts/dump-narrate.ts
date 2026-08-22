import { generate } from '../src/qvac/client.js';
import { narrateSystem, narrateUser } from '../src/qvac/prompts.js';
const verdict = { decision: 'DENY' as const, ruleName: 'deny-unlimited-approval', policyId: 'clara-core', reason: 'unlimited approval' };
const decoded = { op: 'erc20.approve' as const, token: '0xt', spender: '0xs', amount: 2n ** 256n - 1n, unlimited: true };
const findings = [{ code: 'UNLIMITED_APPROVAL' as const, severity: 'critical' as const, detail: 'unlimited approval to 0xs' }];
for (let i = 0; i < 2; i++) {
  const t0 = Date.now();
  const { text, stats } = await generate({ system: narrateSystem(), messages: [{ role: 'user', content: narrateUser(verdict, decoded, findings) }], maxTokens: 160, temperature: 0.2 });
  console.log(`--- attempt ${i} (${Date.now()-t0}ms, ${JSON.stringify((stats as {generatedTokens?: number})?.generatedTokens)} tok):`);
  console.log(JSON.stringify(text));
}
process.exit(0);
