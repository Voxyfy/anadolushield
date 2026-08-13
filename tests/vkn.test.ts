import { describe, expect, it } from 'vitest';
import { isValidVkn, detectVkn } from '../src/detectors/vkn.js';

describe('VKN', () => {
  it('validates a hand-computed checksum-valid VKN', () => {
    expect(isValidVkn('1234567890')).toBe(true);
  });

  it('rejects a VKN with a tampered check digit', () => {
    expect(isValidVkn('1234567891')).toBe(false);
  });

  it('rejects non-10-digit strings', () => {
    expect(isValidVkn('123')).toBe(false);
  });

  it('finds a valid VKN inside a sentence', () => {
    const matches = detectVkn('VKN: 1234567890 olarak kayıtlı.');
    expect(matches).toHaveLength(1);
    expect(matches[0]!.value).toBe('1234567890');
  });
});
