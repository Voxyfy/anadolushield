import { EntityMatch } from '../types.js';

const VKN_CANDIDATE = /\b\d{10}\b/g;

/**
 * Resmi Vergi Kimlik No kontrol basamağı algoritması. TCKN'nin aksine
 * tek bir kontrol hanesi kullanır — rastgele 10 haneli bir sayının bu
 * kontrolü geçme olasılığı ~1/10, yani TCKN'ye göre yanlış pozitif riski
 * daha yüksek (örn. bir telefon numarasının parçası veya sipariş kodu
 * yanlışlıkla VKN sanılabilir). `AnadoluShield` bunu TCKN ile çakışan
 * eşleşmelerde TCKN'yi önceliklendirerek kısmen azaltır.
 */
export function isValidVkn(value: string): boolean {
  if (!/^\d{10}$/.test(value)) {
    return false;
  }

  const d = value.split('').map(Number) as number[];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    const shifted = (d[i]! + (9 - i)) % 10;
    sum += shifted === 9 ? shifted : (shifted * Math.pow(2, 9 - i)) % 9;
  }

  const last = (10 - (sum % 10)) % 10;

  return last === d[9];
}

export function detectVkn(text: string): EntityMatch[] {
  const matches: EntityMatch[] = [];

  for (const m of text.matchAll(VKN_CANDIDATE)) {
    if (isValidVkn(m[0]) && m.index !== undefined) {
      matches.push({ type: 'VKN', value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }

  return matches;
}
