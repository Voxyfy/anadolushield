import { EntityMatch } from '../types.js';

const CARD_CANDIDATE = /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g;

/** Luhn algoritması — kart şemasına (Visa/Mastercard/Amex) özgü değil, evrensel kontrol. */
export function isValidLuhn(raw: string): boolean {
  const digits = raw.replace(/[ -]/g, '');

  if (!/^\d{12,19}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function detectCreditCard(text: string): EntityMatch[] {
  const matches: EntityMatch[] = [];

  for (const m of text.matchAll(CARD_CANDIDATE)) {
    if (isValidLuhn(m[0]) && m.index !== undefined) {
      matches.push({ type: 'KART', value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }

  return matches;
}
