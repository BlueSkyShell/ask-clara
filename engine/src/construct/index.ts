import type { SessionState, ConstructOutcome, SendResult } from '../types.js';
import type { Wallet } from '../wdk/wallet.js';
import type { ModelKey } from '../qvac/client.js';

export function makeConstruct(_w: Wallet, _s: SessionState, _m: ModelKey) {
  return {
    construct: async (): Promise<ConstructOutcome> => ({ kind: 'error', message: 'construct lands in Task 11' }),
    confirmSend: async (): Promise<SendResult> => { throw new Error('construct lands in Task 11'); },
  };
}
