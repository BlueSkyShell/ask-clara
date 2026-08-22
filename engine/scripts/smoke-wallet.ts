import { initWallet } from '../src/wdk/wallet.js';
const w = await initWallet();
console.log('address :', w.address);
console.log('contacts:', w.contacts);
console.log('balance :', String(await (w.account as unknown as { getBalance(): Promise<unknown> }).getBalance()), 'wei');
process.exit(0);
