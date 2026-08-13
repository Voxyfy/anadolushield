export type EntityType = 'TCKN' | 'VKN' | 'IBAN' | 'TELEFON' | 'EPOSTA' | 'KART' | 'ISIM';

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
