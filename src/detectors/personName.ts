import { EntityMatch } from '../types.js';
import { TURKISH_FIRST_NAMES } from '../support/turkishFirstNames.js';

const UPPER = 'A-ZÇĞİÖŞÜ';
const LOWER = 'a-zçğıöşü';
const WORD_PATTERN = new RegExp(`[${UPPER}][${LOWER}]+`, 'g');

/**
 * İsim tespiti bu kütüphanenin en zayıf halkasıdır — gerçek bir NER modeli
 * değil, "bilinen bir Türkçe ad + onu takip eden büyük harfli kelime
 * (muhtemelen soyisim)" sezgiseli. Bilinmeyen adları (yabancı isimler,
 * listede olmayan Türkçe adlar) YAKALAMAZ; listedeki bir adın normal bir
 * kelime olarak kullanıldığı nadir durumlarda yanlış pozitif üretebilir.
 * KVKK riskini sıfıra indirmez, azaltır — bkz. README "Sınırlamalar".
 *
 * Tek tek büyük-harfli kelimeleri bulup ardışık çiftleri kontrol ediyoruz
 * (regex'e iki kelimeyi birden yazdırmak yerine) — aksi halde cümle başı
 * gibi ilgisiz bir büyük harfli kelime + hemen ardından gelen bilinen bir
 * ad, regex'in ilk (yanlış) çifti "yiyip" asıl adı atlamasına yol açıyordu.
 */
export function detectPersonName(text: string): EntityMatch[] {
  const words = [...text.matchAll(WORD_PATTERN)].map((m) => ({
    value: m[0],
    start: m.index!,
    end: m.index! + m[0].length,
  }));

  const matches: EntityMatch[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const first = words[i]!;
    const second = words[i + 1]!;
    const between = text.slice(first.end, second.start);

    if (/^\s+$/.test(between) && TURKISH_FIRST_NAMES.has(first.value.toLocaleLowerCase('tr'))) {
      matches.push({
        type: 'ISIM',
        value: `${first.value} ${second.value}`,
        start: first.start,
        end: second.end,
      });
    }
  }

  return matches;
}
