import { describe, expect, it } from 'vitest';
import { isValidTckn, detectTckn } from '../src/detectors/tckn.js';

describe('TCKN', () => {
  it('validates a well-known checksum-valid TCKN', () => {
    expect(isValidTckn('10000000146')).toBe(true);
  });

  it('rejects a TCKN with a tampered last digit', () => {
    expect(isValidTckn('10000000147')).toBe(false);
  });

  it('rejects a TCKN starting with 0', () => {
    expect(isValidTckn('00000000146')).toBe(false);
  });

  it('rejects non-11-digit strings', () => {
    expect(isValidTckn('123')).toBe(false);
    expect(isValidTckn('abcdefghijk')).toBe(false);
  });

  it('finds a valid TCKN inside a sentence and reports correct offsets', () => {
    const text = 'Müşterimiz TCKN 10000000146 numaralı kişidir.';
    const matches = detectTckn(text);

    expect(matches).toHaveLength(1);
    expect(matches[0]!.value).toBe('10000000146');
    expect(text.slice(matches[0]!.start, matches[0]!.end)).toBe('10000000146');
  });

  it('does not flag an 11-digit number that fails the checksum', () => {
    expect(detectTckn('Sipariş no: 12345678901')).toHaveLength(0);
  });
});
