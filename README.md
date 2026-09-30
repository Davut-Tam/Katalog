# Katalog

HTML, CSS ve JavaScript ile yazılmış ürün kataloğu. Derleme ya da paket kurulumu gerekmez.

## Açmak

- `index.html` dosyasını çift tıklayıp tarayıcıda açın, ya da
- VS Code'da **Live Server** eklentisiyle çalıştırın (değişiklikler kaydedince sayfa yenilenir).

## Özellikler

- Ürün kartları (ızgara, dar ekranda iki sütun)
- Arama: ad, marka, açıklama ve kategoride; Türkçe harf duyarsız (ı/i, ş/s, ç/c…)
- Kategori süzgeci ve sıralama (önerilen, fiyat, ad)
- Karta tıklayınca ayrıntı penceresi
- Açık / koyu tema (sistem temasını izler, ☾ düğmesiyle değiştirilir ve hatırlanır)

## Yapı

```
Katalog/
├── index.html      sayfa iskeleti
├── css/style.css   görünüm (renkler :root değişkenlerinde)
├── js/veri.js      örnek ürün listesi (window.KATALOG)
└── js/app.js       çizim, arama, süzgeç, sıralama, tema
```

Ürün eklemek için `js/veri.js`'e yeni bir nesne ekleyin:

```js
{ id: 13, ad: "Ürün adı", marka: "Marka", kategori: "Kategori", fiyat: 99.90, simge: "🛒", renk: "#4f46e5",
  aciklama: "Kısa açıklama." }
```
