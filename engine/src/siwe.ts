import { randomBytes } from 'node:crypto';
import { verifyMessage } from 'viem';

// A human-readable "prove you own this wallet" message. Not a transaction —
// no funds move, no permissions are granted. Clara shows this verbatim before
// asking you to sign, because Clara is the tool that tells you what you sign.
export function signInMessage(address: string, nonce: string, issued: string): string {
  return [
    'Clara — verify your wallet',
    '',
    `Wallet: ${address}`,
    '',
    'Signing this proves you control this wallet, so Clara can bind your',
    'protection settings to it. This is a signature only — it moves no funds',
    'and grants no permissions.',
    '',
    `Nonce: ${nonce}`,
    `Issued: ${issued}`,
  ].join('\n');
}

export interface SignInResult {
  verified: boolean;
  address: string;
  message: string;
  signature: string;
}

// Full sign + cryptographic verify using the attached wallet.
export async function verifyOwnership(
  address: string,
  sign: (message: string) => Promise<string>,
): Promise<SignInResult> {
  const nonce = randomBytes(8).toString('hex');
  const message = signInMessage(address, nonce, new Date().toISOString());
  const signature = await sign(message);
  const verified = await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
  return { verified, address, message, signature };
}
