import { EntityMatch } from '../types.js';

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function detectEmail(text: string): EntityMatch[] {
  const matches: EntityMatch[] = [];

  for (const m of text.matchAll(EMAIL_PATTERN)) {
    if (m.index !== undefined) {
      matches.push({ type: 'EPOSTA', value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }

  return matches;
}
