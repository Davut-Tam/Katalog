# Katalog Stüdyo

Marketler için ürün kataloğu, aktüel broşür, raf etiketi ve sosyal medya görseli tasarım programı.
Tarayıcıda çalışır; derleme ya da kurulum gerekmez.

## Açmak

- `index.html` dosyasını çift tıklayıp tarayıcıda (Chrome / Edge önerilir) açın, ya da
- VS Code'da **Live Server** eklentisiyle çalıştırın.

Yazı tipleri Google Fonts'tan, PDF / ZIP / Excel / QR kütüphaneleri ihtiyaç anında cdnjs'ten yüklenir; bu yüzden ilk açılışta internet bağlantısı gerekir.
Çalışmalar tarayıcının kendi veritabanında (IndexedDB) otomatik kaydedilir. Başka bilgisayara taşımak için **Dosya → Proje dosyasını indir (.katalog)**.

## Neler yapılabilir

- **Şablonlar:** Haftanın Fırsatları, Taze Manav, Süper Hafta Sonu, Kasap Reyonu, Kahvaltı, Temizlik Günleri, Katalog Kapağı, Raf Etiketleri (24'lü), Instagram gönderisi, hikâye ve mağaza ekranı.
- **Ürünler:** Ürün listesi; Excel / Google E-Tablolar'dan yapıştırma, `.xlsx` / `.csv` içe aktarma (sütunlar otomatik tanınır, `49,90` / `₺49` / `1.249,90` biçimleri okunur).
  Görselleri dosya adına göre toplu eşleştirme. **Ürünleri sayfalara yerleştir:** bir sayfa tasarlanır, tüm liste o düzenle gerektiği kadar sayfaya dağıtılır (istenirse her kategori yeni sayfada).
- **Ürün kartları:** 7 düzen (klasik, patlama, şerit, sade, yatay, daire, raf etiketi), 12 renk teması, kuruş üstte (49⁹⁰) ya da düz, otomatik indirim rozeti.
  Listeye bağlı kartlar ürün değişince birlikte güncellenir. "Serbest öğelere ayır" ile kartın her parçası ayrı düzenlenir.
- **Serbest tasarım:** Metin (100'e yakın Türkçe destekli yazı tipi; kontur, gölge, neon, 3B, retro, vurgu, gradyan, kavisli yazı), 19 şekil, rozetler, fiyat etiketleri, çıkartmalar, QR kod, görsel (kırpma, filtreler, maske, çerçeve, **beyaz arka planı temizleme**).
  Gradyanlı / ışınlı dolgular, desenli arka planlar, karışım modları, opaklık.
- **Düzenleme:** Köşeden boyutlandırma (yazıda font da büyür), döndürme, akıllı hizalama kılavuzları, alan seçimi, gruplama, kilitleme, katmanlar, hizalama ve eşit dağıtma, stil kopyalama, geri al / yinele, sayfalar arası sürükleme, pano ve klavye kısayolları (`?` ile listelenir).
- **Dışa aktarma:** PNG, JPG (çok sayfada ZIP), PDF (yazdırma yoluyla vektörel ya da doğrudan), tek dosyalık **web kataloğu** (HTML, sayfa çevirmeli), proje dosyası. Destekleyen cihazlarda doğrudan paylaşma (WhatsApp vb.).
- **Önizleme:** Kataloğu broşür gibi çift sayfa hâlinde gösterir.

## AbellPro bağlantısı

Stok adları, satış fiyatları, eski fiyatlar, stok türleri, resimler ve firma bilgileri AbellPro API'sinden (`Api/Katalog`) alınabilir.
**Ürünler → AbellPro'ya bağlan**:

1. **Sunucu:** AbellPro uygulamalarının bağlandığı adres (ör. `https://api.marketiniz.com.tr` ya da `http://192.168.1.10:5000`).
2. **Lisans:** Katalog öteki AbellPro uygulamaları gibi lisans koduyla açılır (uygulama adı `AbellPro.Katalog`). Ekranda bu tarayıcının cihaz numarası görünür;
   **Kodu e-postayla iste** kodları yazılım sağlayıcısına gönderir, gelen 16 haneli kod girilir. Lisans bu tarayıcıya bağlıdır.
3. **Kullanıcı:** AbellPro kullanıcı adı (ad soyad, kullanıcı kodu ya da e-posta) ve parola. Kullanıcının Stok menüsünde görme yetkisi olmalı.

Sonra **Stok ekle** ile stoklar aranıp (tür, "fiyatı düşenler", "son 7 / 30 günde fiyatı değişenler", yalnız resimliler) seçilir ve listeye eklenir.
Katalogda ad, fiyat, resim istendiği gibi değiştirilebilir; bunlar AbellPro'ya geri yazılmaz.
**Güncelle** fiyatları ve bilgileri AbellPro'dan tazeler: katalogda elle değiştirilen alanlar korunur, değiştirilmeyenler güncellenir
(ürün formunda hangi alanların değiştirildiği görünür, "AbellPro değerlerine dön" ile geri alınır).
**Marka → AbellPro'dan al** firma adını, telefonu, adresi ve logoyu getirir; sayfalardaki eski yazılar da güncellenir.

Not: Katalog `https` bir adresten açılmışsa `http` sunucuya bağlanamaz (tarayıcı kuralı); bu durumda sunucunun `https` adresini kullanın ya da `index.html`'i bilgisayardan açın.

## Yapı

```
Katalog/
├── index.html          iskelet; betikler sırayla yüklenir (modül değil, file:// ile de çalışsın)
├── css/editor.css      düzenleyici arayüzü (renkler :root değişkenlerinde, açık / koyu tema)
└── js/
    ├── temel.js        DOM üretici, olay yolu, renk / fiyat / dosya araçları
    ├── ikonlar.js      arayüz simgeleri
    ├── fontlar.js      yazı tipi listesi, yükleme, dışa aktarım için gömülü font
    ├── model.js        belge modeli, öğe varsayılanları, geri al / yinele
    ├── cizim.js        çizim motoru: modeli DOM'a çevirir; sayfa CSS'i burada (dışa aktarımda gömülür)
    ├── depo.js         IndexedDB: projeler ve görseller, .katalog dosyası
    ├── veri.js         örnek market ürünleri ve emoji grupları
    ├── ui.js           açılır pencere, menü, iletişim penceresi, renk ve font seçici, denetimler
    ├── editor.js       tuval: seçim, taşıma, boyutlandırma, kılavuzlar, metin düzenleme, pano, kısayollar
    ├── sablonlar.js    hazır şablonlar ve otomatik yerleşim
    ├── paneller.js     sol paneller
    ├── ozellikler.js   sağ panel (seçili öğenin özellikleri)
    ├── disaaktar.js    PNG / JPG / PDF / HTML dışa aktarım
    ├── onizleme.js     tam ekran broşür önizleme
    ├── abellpro.js     AbellPro bağlantısı: lisans, giriş, stok alma, güncelleme
    └── uygulama.js     başlangıç, üst / alt çubuk, dosya menüsü, otomatik kayıt
```

Belge modeli `js/model.js` başındaki açıklamada; yeni şablon eklemek için `js/sablonlar.js`'teki `SABLONLAR` dizisine bir nesne eklemek yeterlidir.
