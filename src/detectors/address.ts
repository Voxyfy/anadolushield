import { EntityMatch } from '../types.js';

const STREET_KEYWORDS =
  'Mahallesi|Mahalle|Mah\\.|Mh\\.|Sokağı|Sokak|Sok\\.|Sk\\.|Caddesi|Cadde|Cad\\.|Cd\\.|Bulvarı|Bulvar|Bulv\\.|Blv\\.';

/** Sokak/cadde/mahalle adının önündeki 1-3 kelimeyi (örn. "Moda", "19 Mayıs") yakalar. */
const ADDRESS_PATTERN = new RegExp(
  `(?:[A-ZÇĞİÖŞÜ0-9][\\wçğıöşüÇĞİÖŞÜ]*\\s+){1,3}(?:${STREET_KEYWORDS})` +
    `(?:\\s*,?\\s*No:?\\s*\\d+[/-]?\\w*)?` +
    `(?:\\s*,?\\s*Kat:?\\s*\\d+)?` +
    `(?:\\s*,?\\s*Daire:?\\s*\\d+)?`,
  'g',
);

/**
 * Serbest metindeki açık adresleri tam olarak **ayrıştırmaz** (il/ilçe/
 * mahalle gibi alanlara bölmez) — sadece "Mahallesi/Sokak/Caddesi/Bulvarı"
 * gibi bilinen bir sokak-türü kelimesinin önündeki ad + varsa ardından
 * gelen No/Kat/Daire bilgisini tek bir blok olarak yakalayıp maskeler.
 * Bu sezgisel, "Kadıköy" gibi tek başına geçen il/ilçe adlarını (bir sokak
 * türü kelimesi olmadan) YAKALAMAZ — bkz. README "Sınırlamalar". Bazen
 * ("Adresim Moda Caddesi..." gibi) sokak adından önceki sıradan bir
 * kelimeyi de yakalayabilir — bir maskeleme aracı için bu, az maskelemekten
 * daha güvenli bir hata yönüdür, bilerek düzeltilmedi.
 */
export function detectAddress(text: string): EntityMatch[] {
  const matches: EntityMatch[] = [];

  for (const m of text.matchAll(ADDRESS_PATTERN)) {
    if (m.index !== undefined) {
      matches.push({ type: 'ADRES', value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }

  return matches;
}
