import { initWallet } from '../src/wdk/wallet.js';
import { verifyOwnership } from '../src/siwe.js';
const w = await initWallet();
const r = await verifyOwnership(w.address, (m) => (w.account as unknown as { sign(m: string): Promise<string> }).sign(m));
console.log('address :', r.address);
console.log('verified:', r.verified);
console.log('sig     :', r.signature.slice(0, 24) + '…');
console.log('\n--- message that was signed ---\n' + r.message);
process.exit(0);
