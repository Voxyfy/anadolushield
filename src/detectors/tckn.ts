import { EntityMatch } from '../types.js';

const TCKN_CANDIDATE = /\b\d{11}\b/g;

/**
 * Resmi T.C. Kimlik No kontrol basamağı algoritması. 11. hane (d11) tüm
 * hanelerin toplamının mod 10'u; 10. hane (d10) tek/çift sıradaki hanelerin
 * belirli bir formülüyle hesaplanır. Rastgele 11 haneli bir sayının bu iki
 * kontrolü de geçme olasılığı ~1/100 — yanlış pozitif riski düşük.
 */
export function isValidTckn(value: string): boolean {
  if (!/^\d{11}$/.test(value) || value[0] === '0') {
    return false;
  }

  const d = value.split('').map(Number) as number[];
  const oddSum = d[0]! + d[2]! + d[4]! + d[6]! + d[8]!;
  const evenSum = d[1]! + d[3]! + d[5]! + d[7]!;
  const d10 = (((oddSum * 7 - evenSum) % 10) + 10) % 10;

  if (d10 !== d[9]) {
    return false;
  }

  const sumFirst10 = d.slice(0, 10).reduce((a, b) => a + b, 0);

  return sumFirst10 % 10 === d[10];
}

export function detectTckn(text: string): EntityMatch[] {
  const matches: EntityMatch[] = [];

  for (const m of text.matchAll(TCKN_CANDIDATE)) {
    if (isValidTckn(m[0]) && m.index !== undefined) {
      matches.push({ type: 'TCKN', value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }

  return matches;
}
