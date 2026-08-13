import { describe, expect, it } from 'vitest';
import { createAnadoluShield } from '../src/AnadoluShield.js';

describe('restoreStream — parça parça (streaming) gelen yanıtlar', () => {
  it('restores a placeholder that arrives split across two chunks', () => {
    const shield = createAnadoluShield();
    const { restoreStream } = shield.redact('Müşteri Ahmet Yılmaz aradı.');

    const stream = restoreStream();
    let output = '';

    // Placeholder "[ISIM_1]" tam ortadan ikiye bölünerek geliyor.
    output += stream.push('Elbette, [ISIM');
    output += stream.push('_1] için not aldım.');
    output += stream.flush();

    expect(output).toBe('Elbette, Ahmet Yılmaz için not aldım.');
  });

  it('handles multiple placeholders arriving across many small chunks', () => {
    const shield = createAnadoluShield();
    const { redactedText, restoreStream } = shield.redact(
      'Ahmet Yılmaz, TCKN 10000000146 ile aradı, telefonu 0532 123 45 67.',
    );

    const stream = restoreStream();
    let output = '';

    // redactedText'i tek karakterlik parçalara bölüp gönderiyoruz — en zorlu senaryo.
    for (const char of redactedText) {
      output += stream.push(char);
    }
    output += stream.flush();

    expect(output).toContain('Ahmet Yılmaz');
    expect(output).toContain('10000000146');
    expect(output).toContain('0532 123 45 67');
    expect(output).not.toContain('[ISIM_1]');
  });

  it('emits plain text immediately when there is nothing to restore', () => {
    const shield = createAnadoluShield();
    const { restoreStream } = shield.redact('Hiç kişisel veri yok.');

    const stream = restoreStream();
    expect(stream.push('Sadece düz metin.')).toBe('Sadece düz metin.');
    expect(stream.flush()).toBe('');
  });
});
