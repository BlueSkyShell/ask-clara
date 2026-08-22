import { initWallet, type Wallet } from './wdk/wallet.js';
import { claraPolicies } from './policy/rules.js';
import { newSession } from './policy/session.js';
import { explain as explainImpl } from './explain/index.js';
import { shutdown, type ModelKey } from './qvac/client.js';
import { makeConstruct } from './construct/index.js';
import type { ConstructOutcome, Explanation, IncomingRequest, SendResult, SessionState } from './types.js';

export * from './types.js';
export type { ModelKey } from './qvac/client.js';

export interface Engine {
  explain(req: IncomingRequest): Promise<Explanation>;
  construct(utterance: string): Promise<ConstructOutcome>;
  confirmSend(confirmId: string): Promise<SendResult>;
  address(): string;
  contacts(): Record<string, string>;
  session(): SessionState;
  close(): Promise<void>;
}

export async function createEngine(opts?: { modelKey?: ModelKey }): Promise<Engine> {
  const session = newSession();
  const wallet: Wallet = await initWallet(claraPolicies(session));
  const c = makeConstruct(wallet, session, opts?.modelKey ?? 'primary');
  return {
    explain: (req) => explainImpl(wallet, req),
    construct: c.construct,
    confirmSend: c.confirmSend,
    address: () => wallet.address,
    contacts: () => wallet.contacts,
    session: () => session,
    close: () => shutdown(),
  };
}
