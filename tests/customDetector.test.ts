import { describe, expect, it } from 'vitest';
import { createAnadoluShield } from '../src/AnadoluShield.js';

describe('Özel tespit ediciler (customDetectors)', () => {
  it('redacts a custom entity defined via a regex pattern', () => {
    const shield = createAnadoluShield({
      customDetectors: [{ type: 'MUSTERI_NO', pattern: /MUS-\d{6}/ }],
    });

    const { redactedText, matches } = shield.redact('Müşteri kodu MUS-123456 ile arandı.');

    expect(redactedText).toBe('Müşteri kodu [MUSTERI_NO_1] ile arandı.');
    expect(matches).toEqual([{ type: 'MUSTERI_NO', value: 'MUS-123456', start: 13, end: 23 }]);
  });

  it('redacts a custom entity defined via a detect function', () => {
    const shield = createAnadoluShield({
      customDetectors: [
        {
          type: 'SIPARIS_NO',
          detect: (text) => {
            const i = text.indexOf('SIP-9999');
            return i === -1 ? [] : [{ type: 'SIPARIS_NO', value: 'SIP-9999', start: i, end: i + 8 }];
          },
        },
      ],
    });

    const { redactedText } = shield.redact('Siparişiniz SIP-9999 kargoya verildi.');
    expect(redactedText).toBe('Siparişiniz [SIPARIS_NO_1] kargoya verildi.');
  });

  it('throws a clear error when neither pattern nor detect is provided', () => {
    const shield = createAnadoluShield({ customDetectors: [{ type: 'BOS' } as never] });
    expect(() => shield.redact('herhangi bir metin')).toThrow(/pattern.*detect/);
  });
});
