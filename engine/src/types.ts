// What a dApp / user hands Clara to be explained (Direction 1 input).
export type IncomingRequest =
  | { kind: 'transaction'; to: string; from?: string; value?: string; data?: string }
  | { kind: 'typedData'; from?: string; payload: unknown }
  | { kind: 'personalSign'; from?: string; messageHex: string }
  | { kind: 'authorization'; from?: string; delegate: string };

export type DecodedOperation =
  | { op: 'native.transfer'; to: string; valueWei: bigint }
  | { op: 'erc20.transfer'; token: string; to: string; amount: bigint }
  | { op: 'erc20.approve'; token: string; spender: string; amount: bigint; unlimited: boolean }
  | { op: 'erc20.increaseAllowance'; token: string; spender: string; amount: bigint }
  | { op: 'nft.setApprovalForAll'; collection: string; operator: string; approved: boolean }
  | { op: 'permit2.batch'; spender: string; tokenCount: number; sigDeadline: string }
  | { op: 'eip7702.delegate'; delegate: string }
  | { op: 'personalSign.text'; text: string }
  | { op: 'personalSign.opaqueHex'; byteLength: number }
  | { op: 'unknown'; to: string; selector: string | null; dataBytes: number };

export type RiskCode =
  | 'UNLIMITED_APPROVAL' | 'APPROVAL_FOR_ALL' | 'PERMIT2_BATCH'
  | 'ALLOWANCE_INCREASE' | 'BLIND_SIGN' | 'EOA_DELEGATION'
  | 'OVER_CAP' | 'UNKNOWN_CALL' | 'NONE';

export interface RiskFinding {
  code: RiskCode;
  severity: 'info' | 'warning' | 'critical';
  detail: string; // deterministic, human-readable, no model involvement
}

// Mapped 1:1 from WDK SimulationResult {decision, policy_id, matched_rule, reason}.
export interface Verdict {
  decision: 'ALLOW' | 'DENY';
  ruleName: string | null;
  policyId: string | null;
  reason: string;
}

export interface Explanation {
  verdict: Verdict;
  decoded: DecodedOperation;
  findings: RiskFinding[];
  narration: string;
  narrationSource: 'model' | 'policy'; // policy = guard fallback: raw verdict.reason used
  orb: 'safe' | 'warning'; // deterministic: DENY or any warning+ finding → 'warning'
  timingMs: { decode: number; policy: number; narrate: number };
}

export interface BuiltTransfer {
  to: string; // checksummed
  amountWei: bigint;
  token: 'ETH';
  recipientLabel: string | null; // contact label if resolved from one
}

export type ConstructOutcome =
  | { kind: 'built'; confirmId: string; transfer: BuiltTransfer; explanation: Explanation }
  | { kind: 'clarify'; question: string }
  | { kind: 'refused'; reason: string }
  | { kind: 'chat'; reply: string }
  | { kind: 'error'; message: string };

export interface SendResult { txHash: string; explorerUrl: string }

export interface SessionState {
  sentWei: bigint; // cumulative confirmed outbound this session
  recipients: Set<string>; // lowercased addresses sent to this session
  startedAt: number;
}
