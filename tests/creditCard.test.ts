import { describe, expect, it } from 'vitest';
import { isValidLuhn, detectCreditCard } from '../src/detectors/creditCard.js';

describe('Kredi kartı (Luhn)', () => {
  it('validates well-known test card numbers', () => {
    expect(isValidLuhn('4111111111111111')).toBe(true);
    expect(isValidLuhn('5500005555555559')).toBe(true);
  });

  it('rejects a tampered card number', () => {
    expect(isValidLuhn('4111111111111112')).toBe(false);
  });

  it('finds a formatted card number inside a sentence', () => {
    const matches = detectCreditCard('Kart numaram 4111 1111 1111 1111 lütfen kaydedin.');
    expect(matches).toHaveLength(1);
  });
});
