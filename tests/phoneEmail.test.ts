import { describe, expect, it } from 'vitest';
import { detectPhone } from '../src/detectors/phone.js';
import { detectEmail } from '../src/detectors/email.js';

describe('Telefon', () => {
  it('detects common Turkish mobile formats', () => {
    expect(detectPhone('0532 123 45 67')).toHaveLength(1);
    expect(detectPhone('+90 532 123 45 67')).toHaveLength(1);
    expect(detectPhone('5321234567')).toHaveLength(1);
  });
});

describe('E-posta', () => {
  it('detects an email address inside a sentence', () => {
    const matches = detectEmail('Bana ahmet@ornek.com adresinden yazabilirsiniz.');
    expect(matches).toHaveLength(1);
    expect(matches[0]!.value).toBe('ahmet@ornek.com');
  });
});
