// CLI entry: `pnpm -C engine daemon`. The engine + WebSocket server live in
// daemon-core so the desktop app can embed the exact same thing in-process.
import { startDaemon } from './daemon-core.js';

await startDaemon();
