# @voxyfy/anadolushield — LLM API'leri için KVKK Veri Maskeleme Kütüphanesi

**anadolushield**, OpenAI/Anthropic/Gemini gibi LLM API'lerine göndermeden
önce metindeki Türkçe kişisel verileri (TCKN, VKN, IBAN, telefon, e-posta,
kredi kartı, isim) tespit edip maskeleyen; LLM yanıtı dönünce gerçek
değerlerle geri değiştiren, framework'e bağımlı olmayan bir **Node.js /
TypeScript kütüphanesidir**. KVKK uyum riskini azaltmak isteyen, müşteri
verisiyle çalışan Türk yazılım ekipleri için tasarlandı.

> ⚠️ **Hukuki tavsiye değildir, KVKK uyumluluğunu garanti etmez.** Riski
> azaltan teknik bir katmandır — ne yapıp ne yapmadığı için aşağıdaki
> [Sınırlamalar](#sınırlamalar) bölümüne bakın.

## Neden bu kütüphane

Bir Türk şirketi müşteri destek talebini, CRM notunu veya sözleşme metnini
bir LLM'e gönderdiği anda, içindeki isim/TCKN/telefon/adres gibi veriler
teknik olarak **yurt dışına kişisel veri aktarımı** oluyor (KVKK madde 9) —
bu yüzden birçok ekip AI özelliği eklemekten çekiniyor ya da bunu manuel,
tutarsız bir şekilde (regex parçaları, ad-hoc `.replace()` çağrıları)
çözmeye çalışıyor.

`anadolushield` bunun için tek, test edilmiş bir katman sağlar: **ağ çağrısı
yapmaz, tamamen yerelde çalışır** — eşleme tablosu (hangi placeholder hangi
gerçek değere karşılık geliyor) hiçbir zaman dışarı çıkmaz, sadece
`restore()` çağrısında kendi process'iniz içinde kullanılır.

## Kurulum

```bash
npm install @voxyfy/anadolushield
```

Node.js 18+ gerekir, harici bağımlılığı yoktur.

## Kullanım

```ts
import { createAnadoluShield } from '@voxyfy/anadolushield';

const shield = createAnadoluShield();

const { redactedText, restore } = shield.redact(
  'Müşterimiz Ahmet Yılmaz (TCKN: 10000000146) IBAN TR33 0006 1005 1978 6457 8413 26 ' +
    'hesabına para gönderemiyor, telefonu 0532 123 45 67.',
);

console.log(redactedText);
// "Müşterimiz [ISIM_1] (TCKN: [TCKN_1]) IBAN [IBAN_1] hesabına para
//  gönderemiyor, telefonu [TELEFON_1]."

const llmResponse = await openai.chat.completions.create({
  messages: [{ role: 'user', content: redactedText }],
  // ...
});

const finalAnswer = restore(llmResponse.choices[0].message.content!);
// Placeholder'lar gerçek değerlerle geri değiştirilmiş, kullanıcıya
// gösterilecek nihai metin.
```

Hangi varlık türlerinin tespit edileceğini sınırlayabilirsiniz (örn. isim
tespiti daha yüksek yanlış pozitif riski taşıdığı için kapatılabilir):

```ts
const shield = createAnadoluShield({ types: ['TCKN', 'VKN', 'IBAN', 'TELEFON', 'EPOSTA', 'KART'] });
```

Denetim/log amaçlı, hangi eşleşmelerin bulunduğunu (gerçek değerleriyle,
**dikkatli kullanın**) görmek isterseniz:

```ts
const { matches } = shield.redact(text);
// [{ type: 'TCKN', value: '10000000146', start: 24, end: 35 }, ...]
```

## Desteklenen varlık türleri

| Tür | Tespit yöntemi | Güvenilirlik |
|---|---|---|
| `TCKN` | Resmi kontrol basamağı algoritması (2 kontrol hanesi) | Yüksek — rastgele 11 haneli bir sayının yanlışlıkla geçme olasılığı ~1/100 |
| `VKN` | Resmi kontrol basamağı algoritması (1 kontrol hanesi) | Orta — yanlışlıkla geçme olasılığı ~1/10, TCKN'den daha gevşek |
| `IBAN` | ISO 7064 mod-97 (evrensel IBAN kontrolü) | Yüksek |
| `KART` | Luhn algoritması | Yüksek (şemaya özgü değil, tüm kart ağları için geçerli) |
| `TELEFON` | Türk cep telefonu örüntüsü (05XX / +90 5XX) | Örüntü eşleşmesi, kontrol basamağı yok |
| `EPOSTA` | Standart e-posta örüntüsü | Örüntü eşleşmesi |
| `ISIM` | ~90 yaygın Türkçe ad listesi + ardından gelen büyük harfli kelime sezgiseli | **En düşük** — bkz. Sınırlamalar |

## Sınırlamalar

- **İsim tespiti bir NER (Varlık Tanıma) modeli değil.** Listede olmayan
  adları (yabancı isimler, nadir Türkçe adlar, tek isimler) **yakalamaz**.
  Yüksek hassasiyet gerektiren senaryolarda `types` ile isim tespitini
  kapatıp kendi çözümünüzü (örn. bulut NER API'si — ama bu da başka bir
  üçüncü tarafa veri gönderme anlamına gelir) eklemeniz gerekebilir.
- **VKN'de yanlış pozitif riski gerçek.** Tek kontrol hanesi kullanıldığı
  için rastgele 10 haneli bir sipariş kodu/referans numarası yanlışlıkla
  VKN sanılabilir. `AnadoluShield`, çakışan eşleşmelerde daha güvenilir
  türleri (IBAN/TCKN/KART) önceliklendirir ama bu riski sıfırlamaz.
- **Adres tespiti henüz yok.** Serbest metindeki açık adresler (örn. "Moda
  Cd. No:5 Kadıköy") şu an maskelenmiyor — planlanan bir sonraki eklenti.
  Bkz. [Yol haritası](#yol-haritası).
- **Bu bir hukuki uyum garantisi değildir.** KVKK'nın gerektirdiği diğer
  yükümlülükler (aydınlatma metni, açık rıza, veri işleme envanteri vb.)
  bu kütüphanenin kapsamı dışındadır — riski azaltan teknik bir katmandır.

## Yol haritası

1. Çekirdek tespit ediciler (TCKN, VKN, IBAN, kredi kartı, telefon,
   e-posta, isim) + `redact()`/`restore()` motoru — ✅ tamam, 25 test yeşil
2. Serbest metin adres tespiti/maskeleme
3. Özel/genişletilebilir tespit edici ekleme API'si (kullanıcı kendi regex/
   fonksiyonunu ekleyebilsin)
4. Akış (streaming) LLM yanıtlarında placeholder geri değişimi

## İlgili projeler

Aynı ekip tarafından geliştirilen, aynı "framework-bağımsız, tek amaca
odaklı" yaklaşımıyla yazılmış diğer kütüphaneler:

- **[Voxyfy/anadolupay](https://github.com/Voxyfy/anadolupay)** (PHP/Laravel)
  ve **[Voxyfy/anadolupay-node](https://github.com/Voxyfy/anadolupay-node)**
  ([npm](https://www.npmjs.com/package/@voxyfy/anadolupay)) — Türk banka/
  ödeme sağlayıcıları için tek arayüz.
- **[Voxyfy/anadoluship](https://github.com/Voxyfy/anadoluship)**
  ([npm](https://www.npmjs.com/package/@voxyfy/anadoluship)) — Türk kargo
  firmaları (MNG, UPS, Yurtiçi, Aras, PTT, Sürat) için tek arayüz.

## Lisans

MIT
