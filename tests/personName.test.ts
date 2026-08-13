import { describe, expect, it } from 'vitest';
import { detectPersonName } from '../src/detectors/personName.js';

describe('İsim tespiti (sezgisel)', () => {
  it('flags a known Turkish first name followed by a capitalized word', () => {
    const matches = detectPersonName('Müşterimiz Ahmet Yılmaz bugün aradı.');
    expect(matches).toHaveLength(1);
    expect(matches[0]!.value).toBe('Ahmet Yılmaz');
  });

  it('does not flag a sentence with no known first name', () => {
    expect(detectPersonName('Sipariş Numarası bugün geldi.')).toHaveLength(0);
  });
});
