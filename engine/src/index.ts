import { initWallet, type Wallet } from './wdk/wallet.js';
import { claraPolicies } from './policy/rules.js';
import { newSession } from './policy/session.js';
import { explain as explainImpl } from './explain/index.js';
import { shutdown, type ModelKey } from './qvac/client.js';
import { makeConstruct } from './construct/index.js';
import { recordSend } from './policy/session.js';
import { verifyOwnership, type SignInResult } from './siwe.js';
import { mnemonicToAccount } from 'viem/accounts';
import { CONFIG } from './config.js';
import type { ConstructOutcome, Explanation, IncomingRequest, SendResult, SessionState } from './types.js';

export * from './types.js';
export type { ModelKey } from './qvac/client.js';

export interface Engine {
  explain(req: IncomingRequest): Promise<Explanation>;
  construct(utterance: string): Promise<ConstructOutcome>;
  confirmSend(confirmId: string): Promise<SendResult>;
  /** Send a user-approved INCOMING dApp transaction. Still passes the policy
   *  proxy at send time — approval in the UI cannot override a DENY. */
  sendIncoming(req: { to: string; value?: string; data?: string }): Promise<SendResult>;
  address(): string;
  contacts(): Record<string, string>;
  session(): SessionState;
  /** Prove control of the attached wallet via a readable sign-in signature. */
  verifyWallet(): Promise<SignInResult>;
  isVerified(): boolean;
  close(): Promise<void>;
}

export async function createEngine(opts?: { modelKey?: ModelKey }): Promise<Engine> {
  const session = newSession();
  let verified = false;
  const wallet: Wallet = await initWallet(claraPolicies(session));
  const c = makeConstruct(wallet, session, opts?.modelKey ?? 'primary');
  return {
    explain: (req) => explainImpl(wallet, req),
    construct: c.construct,
    confirmSend: c.confirmSend,
    sendIncoming: async (req) => {
      const value = req.value ? BigInt(req.value) : 0n;
      const { hash } = await (wallet.account as unknown as {
        sendTransaction(tx: { to: string; value: bigint; data?: string }): Promise<{ hash: string }>;
      }).sendTransaction({ to: req.to, value, ...(req.data && req.data !== '0x' ? { data: req.data } : {}) });
      recordSend(session, req.to, value);
      return { txHash: hash, explorerUrl: `${CONFIG.chain.explorer}/tx/${hash}` };
    },
    address: () => wallet.address,
    contacts: () => wallet.contacts,
    session: () => session,
    verifyWallet: async () => {
      // Clara's own ownership check — signs the readable message directly from
      // the seed (viem), so it is NOT gated by the dApp-facing guard policy.
      const signer = mnemonicToAccount(CONFIG.seedPhrase);
      const r = await verifyOwnership(signer.address, (m) => signer.signMessage({ message: m }));
      verified = r.verified;
      return r;
    },
    isVerified: () => verified,
    close: () => shutdown(),
  };
}
