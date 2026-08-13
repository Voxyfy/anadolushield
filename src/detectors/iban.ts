import { EntityMatch } from '../types.js';

const IBAN_CANDIDATE = /\bTR\d{2}(?:[ ]?\d{4}){5}[ ]?\d{2}\b/gi;

/** ISO 7064 mod-97 IBAN kontrolü — Türkiye'ye özel değil, tüm IBAN'lar için geçerli evrensel algoritma. */
export function isValidTrIban(raw: string): boolean {
  const value = raw.replace(/\s+/g, '').toUpperCase();

  if (!/^TR\d{24}$/.test(value)) {
    return false;
  }

  const rearranged = value.slice(4) + value.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));

  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }

  return remainder === 1;
}

export function detectIban(text: string): EntityMatch[] {
  const matches: EntityMatch[] = [];

  for (const m of text.matchAll(IBAN_CANDIDATE)) {
    if (isValidTrIban(m[0]) && m.index !== undefined) {
      matches.push({ type: 'IBAN', value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }

  return matches;
}
