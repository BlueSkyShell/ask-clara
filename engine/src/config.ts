export const CONFIG = {
  llm: {
    primary: 'QWEN3_1_7B_INST_Q4',
    toolSpecialist: 'LLAMA_TOOL_CALLING_1B_INST_Q4_K',
    fallback: 'QWEN3_600M_INST_Q4',
  },
  chain: {
    name: 'ethereum',
    rpc: process.env.CLARA_RPC ?? 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId: 11155111,
    explorer: 'https://sepolia.etherscan.io',
  },
  // BIP-39 seed for the DEMO TESTNET wallet only. Never real funds.
  seedPhrase: process.env.CLARA_SEED ?? '',
  caps: {
    perTxWei: 5_000_000_000_000_000n, // 0.005 ETH
    sessionWei: 10_000_000_000_000_000n, // 0.01 ETH
  },
  // Contacts resolve to the engine wallet's own accounts 1..3 at runtime
  // (self-owned → demo funds recycle). Labels are the public contract.
  contactLabels: ['alice', 'bob', 'mom'] as const,
  // amounts >= this are treated as "effectively unlimited" approvals
  unlimitedThreshold: 2n ** 128n,
  permit2: '0x000000000022d473030f116ddee9f6b43ac78ba3',
} as const;
