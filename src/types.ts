/** Kütüphaneyle birlikte gelen, hazır tespit ediciler. */
export type BuiltInEntityType = 'TCKN' | 'VKN' | 'IBAN' | 'TELEFON' | 'EPOSTA' | 'KART' | 'ISIM' | 'ADRES';

/** Hazır türlere ek olarak, `customDetectors` ile tanımlanan özel tür adları da (düz string) geçerlidir. */
export type EntityType = BuiltInEntityType | string;

export interface EntityMatch {
  type: EntityType;
  value: string;
  start: number;
  end: number;
}

export interface Detector {
  type: EntityType;
  detect(text: string): EntityMatch[];
}

/**
 * Kullanıcının kendi kişisel veri türünü (örn. müşteri numarası, sipariş
 * kodu) `AnadoluShield`'a eklemesini sağlar. `pattern` verilirse global bir
 * regex olarak çalıştırılır; daha karmaşık mantık için `detect` fonksiyonu
 * doğrudan verilebilir. İkisinden en az biri zorunludur.
 */
export interface CustomDetectorDefinition {
  type: string;
  pattern?: RegExp;
  detect?: (text: string) => EntityMatch[];
}
