import { BuiltInEntityType, CustomDetectorDefinition, EntityMatch, EntityType } from './types.js';
import { detectTckn } from './detectors/tckn.js';
import { detectVkn } from './detectors/vkn.js';
import { detectIban } from './detectors/iban.js';
import { detectPhone } from './detectors/phone.js';
import { detectEmail } from './detectors/email.js';
import { detectCreditCard } from './detectors/creditCard.js';
import { detectPersonName } from './detectors/personName.js';
import { detectAddress } from './detectors/address.js';

export interface AnadoluShieldConfig {
  /** Hangi hazır varlık türleri tespit edilsin. Varsayılan: hepsi. */
  types?: BuiltInEntityType[];
  /** Kendi kişisel veri türlerinizi (regex veya fonksiyon) eklemenizi sağlar. */
  customDetectors?: CustomDetectorDefinition[];
}

/** Bir LLM yanıtı parça parça (streaming) geldiğinde placeholder'ları güvenle geri doldurmak için. */
export interface StreamRestorer {
  /** Yeni gelen parçayı işler, güvenle yayınlanabilecek (tamamlanmamış placeholder içermeyen) kısmı döner. */
  push(chunk: string): string;
  /** Akış bittiğinde, arabellekte kalan son parçayı işler. */
  flush(): string;
}

export interface RedactResult {
  /** LLM'e gönderilecek, kişisel verileri placeholder'la değiştirilmiş metin. */
  redactedText: string;
  /** Bulunan eşleşmeler — denetim/log amaçlı; bunu asla LLM'e veya dışarıya göndermeyin. */
  matches: EntityMatch[];
  /** LLM'den dönen (tek parça hâlindeki) yanıttaki placeholder'ları orijinal değerlerle geri değiştirir. */
  restore(llmOutput: string): string;
  /** LLM yanıtı parça parça (streaming) geliyorsa kullanılır — bkz. README "Streaming yanıtlarda kullanım". */
  restoreStream(): StreamRestorer;
}

const BUILT_IN_DETECTORS: Record<BuiltInEntityType, (text: string) => EntityMatch[]> = {
  TCKN: detectTckn,
  VKN: detectVkn,
  IBAN: detectIban,
  TELEFON: detectPhone,
  EPOSTA: detectEmail,
  KART: detectCreditCard,
  ISIM: detectPersonName,
  ADRES: detectAddress,
};

/**
 * Çakışan eşleşmelerde (örn. bir IBAN'ın içindeki 10 haneli bir alt dizi
 * yanlışlıkla VKN kontrolünü de geçebilir) hangi türün kazanacağını
 * belirler. Kontrol basamaklı, daha güvenilir türler (IBAN/TCKN/KART) daha
 * gevşek eşleşen türlerden (VKN/TELEFON/ADRES) önce gelir. Özel tespit
 * ediciler (`customDetectors`) listede yoksa en sona, en düşük önceliğe
 * eklenir.
 */
const BUILT_IN_PRIORITY: BuiltInEntityType[] = ['IBAN', 'TCKN', 'KART', 'VKN', 'EPOSTA', 'TELEFON', 'ADRES', 'ISIM'];

function toDetectorFn(definition: CustomDetectorDefinition): (text: string) => EntityMatch[] {
  if (definition.detect) {
    return definition.detect;
  }

  if (definition.pattern) {
    const pattern = definition.pattern.global ? definition.pattern : new RegExp(definition.pattern, 'g');

    return (text: string) => {
      const matches: EntityMatch[] = [];
      for (const m of text.matchAll(pattern)) {
        if (m.index !== undefined) {
          matches.push({ type: definition.type, value: m[0], start: m.index, end: m.index + m[0].length });
        }
      }
      return matches;
    };
  }

  throw new Error(`Özel tespit edici "${definition.type}" için ne \`pattern\` ne \`detect\` verildi.`);
}

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
    const enabledTypes = this.config.types ?? (Object.keys(BUILT_IN_DETECTORS) as BuiltInEntityType[]);
    const customDefinitions = this.config.customDetectors ?? [];

    const priority: EntityType[] = [...BUILT_IN_PRIORITY, ...customDefinitions.map((d) => d.type)];

    const builtInMatches = enabledTypes.flatMap((type) => BUILT_IN_DETECTORS[type](text));
    const customMatches = customDefinitions.flatMap((definition) => toDetectorFn(definition)(text));

    const allMatches = [...builtInMatches, ...customMatches].sort((a, b) =>
      a.start !== b.start ? a.start - b.start : priority.indexOf(a.type) - priority.indexOf(b.type),
    );

    const accepted: EntityMatch[] = [];
    let lastEnd = -1;

    for (const match of allMatches) {
      if (match.start >= lastEnd) {
        accepted.push(match);
        lastEnd = match.end;
      }
    }

    const counters: Record<string, number> = {};
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

    const restore = (llmOutput: string): string => {
      let result = llmOutput;
      for (const [placeholder, original] of placeholderMap) {
        result = result.split(placeholder).join(original);
      }
      return result;
    };

    return {
      redactedText,
      matches: accepted,
      restore,
      restoreStream: (): StreamRestorer => {
        let buffer = '';

        return {
          push(chunk: string): string {
            buffer += chunk;

            // Arabellekte tamamlanmamış bir placeholder ("[TCKN_" gibi, henüz
            // kapanış "]" gelmemiş) varsa, o kısmı bir sonraki parçaya kadar
            // bekletiyoruz — aksi halde placeholder ikiye bölünürse geri
            // doldurma başarısız olur.
            const lastOpen = buffer.lastIndexOf('[');
            const safeEnd = lastOpen !== -1 && buffer.indexOf(']', lastOpen) === -1 ? lastOpen : buffer.length;

            const toEmit = buffer.slice(0, safeEnd);
            buffer = buffer.slice(safeEnd);

            return restore(toEmit);
          },
          flush(): string {
            const rest = buffer;
            buffer = '';
            return restore(rest);
          },
        };
      },
    };
  }
}

export function createAnadoluShield(config?: AnadoluShieldConfig): AnadoluShield {
  return new AnadoluShield(config);
}
