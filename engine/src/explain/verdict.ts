import type { IncomingRequest, Verdict } from '../types.js';
import type { Wallet } from '../wdk/wallet.js';

interface SimResult { decision: 'ALLOW' | 'DENY'; policy_id: string | null; matched_rule: string | null; reason: string | null }
type SimulateMap = Record<string, (...args: unknown[]) => Promise<SimResult>>;

// Verified surface: account.simulate.<operation>(...) (policy-account-proxy.js:194,258).
export async function evaluateVerdict(wallet: Wallet, req: IncomingRequest): Promise<Verdict> {
  const sim = (wallet.account as unknown as { simulate: SimulateMap }).simulate;
  let r: SimResult;
  switch (req.kind) {
    case 'transaction':   r = await sim.sendTransaction!({ to: req.to, value: req.value ?? '0x0', data: req.data ?? '0x' }); break;
    case 'typedData':     r = await sim.signTypedData!(req.payload); break;
    case 'personalSign':  r = await sim.sign!(req.messageHex); break;
    case 'authorization': r = await sim.signAuthorization!({ address: req.delegate }); break;
  }
  return {
    decision: r.decision,
    policyId: r.policy_id,
    ruleName: r.matched_rule,
    reason: r.reason ?? (r.decision === 'ALLOW' ? 'no rule matched — allowed by default' : 'denied by policy'),
  };
}
