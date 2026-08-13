import { describe, expect, it } from 'vitest';
import { isValidTrIban, detectIban } from '../src/detectors/iban.js';

describe('IBAN', () => {
  it('validates a mod-97 checksum-valid TR IBAN', () => {
    expect(isValidTrIban('TR330006100519786457841326')).toBe(true);
  });

  it('rejects a tampered IBAN', () => {
    expect(isValidTrIban('TR330006100519786457841327')).toBe(false);
  });

  it('validates an IBAN with spaces exactly as a human would type it', () => {
    expect(isValidTrIban('TR33 0006 1005 1978 6457 8413 26')).toBe(true);
  });

  it('finds a valid IBAN inside a sentence', () => {
    const text = 'Lütfen ödemeyi TR33 0006 1005 1978 6457 8413 26 hesabına yapın.';
    const matches = detectIban(text);
    expect(matches).toHaveLength(1);
    expect(matches[0]!.value.replace(/\s/g, '')).toBe('TR330006100519786457841326');
  });
});
