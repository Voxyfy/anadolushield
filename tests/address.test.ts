import { describe, expect, it } from 'vitest';
import { detectAddress } from '../src/detectors/address.js';

describe('Adres tespiti (sezgisel)', () => {
  it('flags a street name followed by No/Kat/Daire', () => {
    // Not: sezgisel, kelimenin hemen önündeki 1-3 kelimeyi de yakalayabilir
    // ("Adresim" gibi) — bir maskeleme aracı için fazla maskelemek, az
    // maskelemekten daha güvenli bir hata yönüdür.
    const matches = detectAddress('Adresim Moda Caddesi No:12 Kat:3 Daire:5, gönderiyi buraya bırakın.');

    expect(matches).toHaveLength(1);
    expect(matches[0]!.value).toContain('Moda Caddesi No:12 Kat:3 Daire:5');
  });

  it('flags a mahalle name without a trailing No/Kat/Daire', () => {
    const matches = detectAddress('19 Mayıs Mahallesi civarında oturuyorum.');
    expect(matches).toHaveLength(1);
  });

  it('does not flag a sentence with no street-type keyword', () => {
    expect(detectAddress('Kadıköy tarafında oturuyorum.')).toHaveLength(0);
  });
});
