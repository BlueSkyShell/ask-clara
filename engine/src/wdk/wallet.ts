import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { CONFIG } from '../config.js';

// Policy objects are WDK's own shape (docs/verified-apis.md); we build them in
// policy/rules.ts and pass them straight through registerPolicy.
export type Policy = Record<string, unknown>;

export interface Wallet {
  wdk: InstanceType<typeof WDK>;
  account: Awaited<ReturnType<InstanceType<typeof WDK>['getAccount']>>;
  address: string;
  contacts: Record<string, string>;
}

export async function initWallet(policies?: Policy[]): Promise<Wallet> {
  if (!CONFIG.seedPhrase) throw new Error('CLARA_SEED missing — set engine/.env (testnet-only seed)');
  const wdk = new WDK(CONFIG.seedPhrase);
  wdk.registerWallet(CONFIG.chain.name, WalletManagerEvm as never, {
    provider: CONFIG.chain.rpc,
    chainId: CONFIG.chain.chainId,
  } as never);
  if (policies?.length) wdk.registerPolicy(policies as never);
  const account = await wdk.getAccount(CONFIG.chain.name, 0);
  const address = await account.getAddress();
  const contacts: Record<string, string> = {};
  // 'self' = your own address (account 0). Sending here is a real on-chain tx
  // that returns the value to you in the same transaction — you only pay gas.
  // Perfect for testing the send flow without losing funds.
  contacts['self'] = address;
  for (let i = 0; i < CONFIG.contactLabels.length; i++) {
    const a = await wdk.getAccount(CONFIG.chain.name, i + 1);
    contacts[CONFIG.contactLabels[i]!] = await a.getAddress();
  }
  return { wdk, account, address, contacts };
}
