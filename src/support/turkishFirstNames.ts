/**
 * En yaygın ~90 Türkçe ad — isim tespitinin yanlış pozitif oranını
 * düşürmek için kullanılır (salt büyük harf örüntüsüne güvenmek yerine).
 * Tam bir isim veritabanı değil, pratik bir kısayol — kapsam dışı kalan
 * isimler tespit edilemez (bkz. README "Sınırlamalar").
 */
export const TURKISH_FIRST_NAMES = new Set(
  [
    'Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'Osman', 'Yusuf', 'Murat',
    'Ömer', 'Halil', 'İsmail', 'Ramazan', 'Mahmut', 'Fatih', 'Kemal', 'Süleyman', 'Bülent', 'Serkan',
    'Emre', 'Burak', 'Onur', 'Cem', 'Caner', 'Tolga', 'Volkan', 'Erhan', 'Barış', 'Kaan',
    'Batuhan', 'Berk', 'Deniz', 'Enes', 'Furkan', 'Gökhan', 'Hakan', 'Kadir', 'Levent', 'Metin',
    'Nihat', 'Orhan', 'Selim', 'Taner', 'Uğur', 'Yasin', 'Yavuz', 'Ziya',
    'Ayşe', 'Fatma', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Meryem', 'Şule', 'Sultan', 'Hülya',
    'Zehra', 'Merve', 'Esra', 'Büşra', 'Dilek', 'Ebru', 'Gül', 'Gamze', 'İrem', 'Nur',
    'Nurcan', 'Özlem', 'Pınar', 'Seda', 'Selin', 'Sevgi', 'Tuğba', 'Yasemin', 'Yeliz', 'Aslı',
    'Ceren', 'Damla', 'Duygu', 'Ece', 'Gizem', 'Hande', 'Melis', 'Naz', 'Sena', 'Sude',
  ].map((n) => n.toLocaleLowerCase('tr')),
);
