import type { SessionState } from '../types.js';

export function newSession(): SessionState {
  return { sentWei: 0n, recipients: new Set(), startedAt: Date.now() };
}

export function recordSend(s: SessionState, to: string, valueWei: bigint): void {
  s.sentWei += valueWei;
  s.recipients.add(to.toLowerCase());
}
