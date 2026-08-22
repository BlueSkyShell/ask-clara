import { generate, shutdown } from '../src/qvac/client.js';
const t0 = Date.now();
const r = await generate({
  system: 'You are Clara, a concise crypto companion. Answer in one sentence.',
  messages: [{ role: 'user', content: 'What is gas on Ethereum?' }],
  maxTokens: 80, temperature: 0.2,
});
console.log('text:', r.text);
console.log('stats:', JSON.stringify(r.stats));
console.log('wall ms:', Date.now() - t0);
await shutdown();
process.exit(0);
