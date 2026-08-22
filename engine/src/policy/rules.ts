import { CONFIG } from '../config.js';
import type { SessionState } from '../types.js';
import { decodeTransaction, decodePersonalSign } from '../explain/decode.js';
import type { Policy } from '../wdk/wallet.js';

type Ctx = { operation: string; args: readonly unknown[] };
type TxArg = { to: string; value?: string | bigint; data?: string };

const txOf = (c: Ctx): TxArg => c.args[0] as TxArg;
const valueOf = (tx: TxArg): bigint =>
  typeof tx.value === 'bigint' ? tx.value : tx.value ? BigInt(tx.value) : 0n;

// One project-scope policy; DENY-only rules (WDK default-allows when nothing
// matches, and DENY beats ALLOW — verified, policy-engine.js:104).
// Conditions receive WDK's frozen PolicyContext; they DECODE args and never
// look at any surface text (encoding-bypass defense). `session` is captured
// by reference so cumulative state spans the whole session (multi-turn defense).
export function claraPolicies(session: SessionState): Policy[] {
  return [{
    id: 'clara-core',
    name: 'Clara core protections',
    scope: 'project',
    rules: [
      { name: 'deny-unlimited-approval', action: 'DENY',
        reason: 'This approval would let the spender take an unlimited amount of this token.',
        operation: ['sendTransaction', 'signTransaction'],
        conditions: [(c: Ctx) => { const d = decodeTransaction(txOf(c)); return d.op === 'erc20.approve' && d.unlimited; }] },
      { name: 'deny-allowance-increase', action: 'DENY',
        reason: 'This raises an existing token allowance to an effectively unlimited amount.',
        operation: ['sendTransaction', 'signTransaction'],
        conditions: [(c: Ctx) => { const d = decodeTransaction(txOf(c)); return d.op === 'erc20.increaseAllowance' && d.amount >= CONFIG.unlimitedThreshold; }] },
      { name: 'deny-approval-for-all', action: 'DENY',
        reason: 'This hands control of your entire NFT collection to another address.',
        operation: ['sendTransaction', 'signTransaction'],
        conditions: [(c: Ctx) => { const d = decodeTransaction(txOf(c)); return d.op === 'nft.setApprovalForAll' && d.approved; }] },
      { name: 'deny-permit2-batch', action: 'DENY',
        reason: 'This signature authorizes batch token permissions through Permit2 — a common drain pattern.',
        operation: 'signTypedData',
        conditions: [(c: Ctx) => {
          const p = c.args[0] as { domain?: { verifyingContract?: string }; types?: Record<string, unknown> };
          return (p?.domain?.verifyingContract ?? '').toLowerCase() === CONFIG.permit2
            && !!p?.types && Object.keys(p.types).some((t) => t.startsWith('PermitBatch'));
        }] },
      { name: 'deny-blind-sign', action: 'DENY',
        reason: 'This asks you to sign raw data that cannot be read — signing blind is how wallets get drained.',
        operation: 'sign',
        conditions: [(c: Ctx) => decodePersonalSign(String(c.args[0])).op === 'personalSign.opaqueHex'] },
      { name: 'deny-eoa-delegation', action: 'DENY',
        reason: 'This would delegate control of your account itself to other code (EIP-7702).',
        operation: ['signAuthorization', 'delegate'],
        conditions: [() => true] },
      { name: 'deny-over-per-tx-cap', action: 'DENY',
        reason: 'This is above the per-transaction limit you set.',
        operation: ['sendTransaction', 'signTransaction', 'transfer'],
        conditions: [(c: Ctx) => valueOf(txOf(c)) > CONFIG.caps.perTxWei] },
      { name: 'deny-over-session-cap', action: 'DENY',
        reason: 'Together with what you already sent this session, this passes your session limit.',
        operation: ['sendTransaction', 'signTransaction', 'transfer'],
        conditions: [(c: Ctx) => session.sentWei + valueOf(txOf(c)) > CONFIG.caps.sessionWei] },
      // WDK fail-closes: a governed operation with no matching rule is DENIED
      // ('governed-but-unmatched' — verified empirically). This explicit ALLOW
      // floor turns that into default-allow; every DENY above still wins.
      { name: 'allow-by-default', action: 'ALLOW',
        reason: 'No protection rule objected.',
        operation: '*',
        conditions: [() => true] },
    ],
  }];
}
