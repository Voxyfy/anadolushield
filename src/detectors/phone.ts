import { EntityMatch } from '../types.js';

/** Türk cep telefonu: opsiyonel +90/0 öneki + 5XX + 3+2+2 hane, boşluk/tire/nokta ayraçlı. */
const PHONE_PATTERN = /(?:\+90[ ]?|0)?5\d{2}[ .-]?\d{3}[ .-]?\d{2}[ .-]?\d{2}\b/g;

export function detectPhone(text: string): EntityMatch[] {
  const matches: EntityMatch[] = [];

  for (const m of text.matchAll(PHONE_PATTERN)) {
    if (m.index !== undefined) {
      matches.push({ type: 'TELEFON', value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }

  return matches;
}
