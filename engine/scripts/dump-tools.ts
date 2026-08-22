import { completion } from '@qvac/sdk';
import { ensureModel } from '../src/qvac/client.js';
import { z } from 'zod';

const modelId = await ensureModel('primary');
const run = completion({
  modelId,
  history: [
    { role: 'system', content: 'You have tools. Use get_weather to fetch weather for a city. /no_think' },
    { role: 'user', content: 'What is the weather in Buenos Aires?' },
  ],
  stream: true,
  tools: [{ name: 'get_weather', description: 'Fetch weather for a city', parameters: z.object({ city: z.string() }) }],
} as never);
const final = await run.final;
console.log('FINAL KEYS:', Object.keys(final as object));
console.log('FULL FINAL:', JSON.stringify(final, null, 2).slice(0, 2500));
process.exit(0);
