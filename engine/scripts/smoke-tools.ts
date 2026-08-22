import { z } from 'zod';
import { runToolTurn } from '../src/qvac/toolloop.js';
import { shutdown } from '../src/qvac/client.js';

const r = await runToolTurn({
  system: 'You have tools. To report the weather you MUST call report_weather. First fetch it with get_weather.',
  messages: [{ role: 'user', content: 'What is the weather in Buenos Aires?' }],
  tools: [
    { name: 'get_weather', description: 'Fetch weather for a city', parameters: z.object({ city: z.string() }),
      execute: async ({ city }) => ({ city, tempC: 18, sky: 'clear' }) },
    { name: 'report_weather', description: 'Report final weather to user', parameters: z.object({ summary: z.string() }) },
  ],
});
console.log(JSON.stringify(r, null, 2));
await shutdown();
process.exit(0);
