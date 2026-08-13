import { EntityMatch, EntityType } from './types.js';
import { detectTckn } from './detectors/tckn.js';
import { detectVkn } from './detectors/vkn.js';
import { detectIban } from './detectors/iban.js';
import { detectPhone } from './detectors/phone.js';
import { detectEmail } from './detectors/email.js';
import { detectCreditCard } from './detectors/creditCard.js';
import { detectPersonName } from './detectors/personName.js';

export interface AnadoluShieldConfig {
  /** Hangi varlık türleri tespit edilsin. Varsayılan: hepsi. */
  types?: EntityType[];
}

export interface RedactResult {
  /** LLM'e gönderilecek, kişisel verileri placeholder'la değiştirilmiş metin. */
  redactedText: string;
  /** Bulunan eşleşmeler — denetim/log amaçlı; bunu asla LLM'e veya dışarıya göndermeyin. */
  matches: EntityMatch[];
  /** LLM'den dönen yanıttaki placeholder'ları orijinal değerlerle geri değiştirir. */
  restore(llmOutput: string): string;
}

const ALL_DETECTORS: Record<EntityType, (text: string) => EntityMatch[]> = {
  TCKN: detectTckn,
  VKN: detectVkn,
  IBAN: detectIban,
  TELEFON: detectPhone,
  EPOSTA: detectEmail,
  KART: detectCreditCard,
  ISIM: detectPersonName,
};

/**
 * Çakışan eşleşmelerde (örn. bir IBAN'ın içindeki 10 haneli bir alt dizi
 * yanlışlıkla VKN kontrolünü de geçebilir) hangi türün kazanacağını
 * belirler. Kontrol basamaklı, daha güvenilir türler (IBAN/TCKN/KART) daha
 * gevşek eşleşen türlerden (VKN/TELEFON) önce gelir.
 */
const PRIORITY: EntityType[] = ['IBAN', 'TCKN', 'KART', 'VKN', 'EPOSTA', 'TELEFON', 'ISIM'];

/**
 * AnadoluShield
 *
 * LLM API'lerine (OpenAI, Anthropic, Gemini vb.) gönderilecek metindeki
 * Türkçe kişisel verileri tespit edip placeholder'la değiştirir, yanıt
 * dönünce geri yerine koyar. Ağ çağrısı yapmaz, tamamen yerelde çalışır —
 * eşleme tablosu (`placeholderMap`) hiçbir zaman dışarı çıkmaz.
 *
 * Hukuki tavsiye değildir, KVKK uyumluluğunu garanti etmez — riski azaltan
 * teknik bir katmandır. Bkz. README "Sınırlamalar".
 */
export class AnadoluShield {
  constructor(private readonly config: AnadoluShieldConfig = {}) {}

  redact(text: string): RedactResult {
    const enabledTypes = this.config.types ?? (Object.keys(ALL_DETECTORS) as EntityType[]);

    const allMatches = enabledTypes
      .flatMap((type) => ALL_DETECTORS[type](text))
      .sort((a, b) => (a.start !== b.start ? a.start - b.start : PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type)));

    const accepted: EntityMatch[] = [];
    let lastEnd = -1;

    for (const match of allMatches) {
      if (match.start >= lastEnd) {
        accepted.push(match);
        lastEnd = match.end;
      }
    }

    const counters: Partial<Record<EntityType, number>> = {};
    const placeholderMap = new Map<string, string>();
    let redactedText = '';
    let cursor = 0;

    for (const match of accepted) {
      redactedText += text.slice(cursor, match.start);
      counters[match.type] = (counters[match.type] ?? 0) + 1;
      const placeholder = `[${match.type}_${counters[match.type]}]`;
      placeholderMap.set(placeholder, match.value);
      redactedText += placeholder;
      cursor = match.end;
    }

    redactedText += text.slice(cursor);

    return {
      redactedText,
      matches: accepted,
      restore: (llmOutput: string) => {
        let result = llmOutput;
        for (const [placeholder, original] of placeholderMap) {
          result = result.split(placeholder).join(original);
        }
        return result;
      },
    };
  }
}

export function createAnadoluShield(config?: AnadoluShieldConfig): AnadoluShield {
  return new AnadoluShield(config);
}
