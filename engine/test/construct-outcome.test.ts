import { describe, it, expect } from 'vitest';
import { normalizeUtterance, resolveRecipient, mapOutcome } from '../src/construct/outcome.js';

const wallet = {
  address: '0x0000000000000000000000000000000000000001',
  contacts: { alice: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', mom: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
} as never;

describe('normalizeUtterance', () => {
  it('strips zero-width chars and NFC-normalizes', () => {
    expect(normalizeUtterance('se​nd 5 to ali﻿ce')).toBe('send 5 to alice');
  });
});

describe('resolveRecipient', () => {
  it('resolves contact label case-insensitively', () => {
    expect(resolveRecipient(wallet, 'Alice')).toEqual({ address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', label: 'alice' });
  });
  it('accepts a valid checksummed address', () => {
    const r = resolveRecipient(wallet, '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
    expect(r?.label).toBe('mom'); // reverse-matched to a known contact
  });
  it('rejects unknown label', () => {
    expect(resolveRecipient(wallet, 'grandson')).toBeNull();
  });
  it('rejects malformed address', () => {
    expect(resolveRecipient(wallet, '0x1234')).toBeNull();
  });
});

describe('mapOutcome', () => {
  it('build_transfer with contact → proposal in wei', () => {
    const r = mapOutcome(wallet, { kind: 'tool', name: 'build_transfer', args: { recipient: 'alice', amountEth: '0.002' } });
    expect(r).toEqual({ kind: 'proposal', to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', amountWei: 2000000000000000n, label: 'alice' });
  });
  it('build_transfer with unknown recipient → clarify, not error', () => {
    const r = mapOutcome(wallet, { kind: 'tool', name: 'build_transfer', args: { recipient: 'grandson', amountEth: '0.002' } });
    expect(r).toMatchObject({ kind: 'clarify' });
  });
  it('build_transfer with non-numeric amount → clarify', () => {
    const r = mapOutcome(wallet, { kind: 'tool', name: 'build_transfer', args: { recipient: 'alice', amountEth: 'twenty bucks' } });
    expect(r).toMatchObject({ kind: 'clarify' });
  });
  it('ask_clarification → clarify with question', () => {
    expect(mapOutcome(wallet, { kind: 'tool', name: 'ask_clarification', args: { question: 'How much ETH?' } }))
      .toEqual({ kind: 'clarify', question: 'How much ETH?' });
  });
  it('refuse_request → refused', () => {
    expect(mapOutcome(wallet, { kind: 'tool', name: 'refuse_request', args: { reason: 'tool redefinition attempt' } }))
      .toEqual({ kind: 'refused', reason: 'tool redefinition attempt' });
  });
  it('plain text → chat', () => {
    expect(mapOutcome(wallet, { kind: 'text', text: 'Gas is the fee.' })).toEqual({ kind: 'chat', reply: 'Gas is the fee.' });
  });
  it('toolError → refused with validator message (never a silent retry loop)', () => {
    expect(mapOutcome(wallet, { kind: 'toolError', code: 'VALIDATION_ERROR', message: 'bad args' }))
      .toMatchObject({ kind: 'refused' });
  });
});
