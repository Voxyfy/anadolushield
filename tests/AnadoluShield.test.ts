import { describe, expect, it } from 'vitest';
import { createAnadoluShield } from '../src/AnadoluShield.js';

describe('AnadoluShield (redact + restore)', () => {
  it('redacts multiple entity types and restores an LLM-style response', () => {
    const shield = createAnadoluShield();

    const original =
      'Müşterimiz Ahmet Yılmaz (TCKN: 10000000146) IBAN TR33 0006 1005 1978 6457 8413 26 ' +
      'hesabına ödeme yapamıyor. Telefonu 0532 123 45 67, e-postası ahmet@ornek.com.';

    const { redactedText, matches, restore } = shield.redact(original);

    expect(redactedText).not.toContain('10000000146');
    expect(redactedText).not.toContain('Ahmet Yılmaz');
    expect(redactedText).not.toContain('ahmet@ornek.com');
    expect(redactedText).toContain('[TCKN_1]');
    expect(redactedText).toContain('[ISIM_1]');
    expect(matches.length).toBeGreaterThanOrEqual(4);

    // LLM placeholder'ları değiştirmeden aynen geri döndürdüğünü simüle eder.
    const simulatedLlmResponse = `Elbette, ${redactedText.match(/\[ISIM_\d+\]/)![0]} için yardımcı olayım.`;
    const restored = restore(simulatedLlmResponse);

    expect(restored).toContain('Ahmet Yılmaz');
    expect(restored).not.toContain('[ISIM_1]');
  });

  it('leaves text with no personal data unchanged', () => {
    const shield = createAnadoluShield();
    const { redactedText, matches } = shield.redact('Bugün hava çok güzel.');

    expect(redactedText).toBe('Bugün hava çok güzel.');
    expect(matches).toHaveLength(0);
  });

  it('only detects the configured entity types', () => {
    const shield = createAnadoluShield({ types: ['EPOSTA'] });
    const { redactedText, matches } = shield.redact('TCKN 10000000146, e-posta ahmet@ornek.com');

    expect(matches).toHaveLength(1);
    expect(matches[0]!.type).toBe('EPOSTA');
    expect(redactedText).toContain('10000000146');
    expect(redactedText).not.toContain('ahmet@ornek.com');
  });

  it('never leaks placeholder mappings outside of restore()', () => {
    const shield = createAnadoluShield();
    const result = shield.redact('TCKN 10000000146');

    expect(Object.keys(result)).toEqual(['redactedText', 'matches', 'restore', 'restoreStream']);
  });
});
