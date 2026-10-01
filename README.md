# Katalog Stüdyo

Marketler için ürün kataloğu, aktüel broşür, raf etiketi ve sosyal medya görseli tasarım programı.
Tarayıcıda çalışır; derleme ya da kurulum gerekmez.

## Açmak

- `index.html` dosyasını çift tıklayıp tarayıcıda (Chrome / Edge önerilir) açın, ya da
- VS Code'da **Live Server** eklentisiyle çalıştırın.

Yazı tipleri Google Fonts'tan, PDF / ZIP / Excel / QR kütüphaneleri ihtiyaç anında cdnjs'ten yüklenir; bu yüzden ilk açılışta internet bağlantısı gerekir.
Çalışmalar tarayıcının kendi veritabanında (IndexedDB) otomatik kaydedilir. Başka bilgisayara taşımak için **Dosya → Proje dosyasını indir (.katalog)**.

## Neler yapılabilir

- **Şablonlar (50):** 33 baskı, 11 sosyal medya, 6 ekran şablonu.
  - *Klasik market:* Haftanın Fırsatları, Taze Manav, Süper Hafta Sonu, Kasap Reyonu, Kahvaltı, Temizlik Günleri, Katalog Kapağı, Raf Etiketleri (24'lü), Dev Kampanya (16'lı), Fiyat Listesi (20'li).
  - *Tarzlar:* Gurme Seçki (siyah-altın), Retro Pazar (70'ler), Neon Gece (synthwave), Gazete İlanı, Sade Seçki (İskandinav), Pop Art (çizgi roman), Bauhaus, Zen Mutfak,
    Organik Pazar (kraft kâğıt), Vintage Bakkal, Manav Kasası (ahşap), Mantar Pano (iğnelenmiş polaroidler), Kuponlu Fırsatlar, Denizden Sofraya, Fit Seçki.
  - *Mevsim ve özel gün:* Bahar, Yaz, Kış, Yeni Yıl, Ramazan, Bayram, Kara Cuma, Beslenme Çantası (okula dönüş).
  - *Sosyal medya:* Günün Fırsatı, Kampanya Hikâyesi, Haftanın Yıldızları, Flaş Ürün, Fiyat Düştü, Kahvaltı Sepeti (paket fiyat), Çekiliş, Raflarda Yeni, Son Gün, Tarif Kartı, Facebook gönderisi.
  - *Ekran:* Mağaza Ekranı, Kara Tahta Menü, Fiyat Borsası (kayan bantlı), Bugünün Yıldızı, Hoş Geldiniz (QR kodlu), Dikey Ekran Menüsü.
- **Ürünler:** Ürün listesi; Excel / Google E-Tablolar'dan yapıştırma, `.xlsx` / `.csv` içe aktarma (sütunlar otomatik tanınır, `49,90` / `₺49` / `1.249,90` biçimleri okunur).
  Görselleri dosya adına göre toplu eşleştirme. **Ürünleri sayfalara yerleştir:** bir sayfa tasarlanır, tüm liste o düzenle gerektiği kadar sayfaya dağıtılır (istenirse her kategori yeni sayfada).
- **Ürün kartları:** 7 düzen (klasik, patlama, şerit, sade, yatay, daire, raf etiketi), 12 renk teması, kuruş üstte (49⁹⁰) ya da düz, otomatik indirim rozeti.
  Listeye bağlı kartlar ürün değişince birlikte güncellenir. "Serbest öğelere ayır" ile kartın her parçası ayrı düzenlenir.
- **Serbest tasarım:** Metin (100'e yakın Türkçe destekli yazı tipi; kontur, gölge, neon, 3B, retro, vurgu, gradyan, kavisli yazı), 19 şekil, rozetler, fiyat etiketleri, çıkartmalar, QR kod, görsel (kırpma, filtreler, maske, çerçeve, **beyaz arka planı temizleme**).
  Gradyanlı / ışınlı dolgular, desenli arka planlar, karışım modları, opaklık.
- **Düzenleme:** Köşeden boyutlandırma (yazıda font da büyür), döndürme, akıllı hizalama kılavuzları, alan seçimi, gruplama, kilitleme, katmanlar, hizalama ve eşit dağıtma, stil kopyalama, geri al / yinele, sayfalar arası sürükleme, pano ve klavye kısayolları (`?` ile listelenir).
- **Dışa aktarma:** PNG, JPG (çok sayfada ZIP), PDF (yazdırma yoluyla vektörel ya da doğrudan), tek dosyalık **web kataloğu** (HTML, sayfa çevirmeli), proje dosyası. Destekleyen cihazlarda doğrudan paylaşma (WhatsApp vb.).
- **Önizleme:** Kataloğu broşür gibi çift sayfa hâlinde gösterir.
- **Video katalog** (üst çubukta **Video** ya da Dışa aktar → Video): MP4 video, canlı önizlemeli.
  - *Katalog sayfaları:* Sayfa öğeleri okuma sırasıyla canlanır (metin silerek, ürün kartı zıplayarak, fiyat elastik patlayarak, görsel yakınlaşarak),
    indirimli fiyatlar nabız gibi atıp üstünden ışık geçer; sayfalar arasında 8 geçiş (kaydır, yakınlaş, 3B kart çevir, perde, daire, panjur, bulanık, flaş).
  - *Ürün vitrini:* Seçilen ürünler tek tek ya da 2'li / 3'lü ekrana gelir. **3B** stilde ürün dönerek kaideye iner, salınır, zemine yansır;
    **2B** stilde zıplayarak gelir. İndirim rozeti, fiyat patlaması, üstü çizilen eski fiyat sırayla canlanır.
  - Hikâye 9:16, kare, yatay 16:9 ya da sayfa oranı; 720p / 1080p, 30 / 60 fps. Markadan açılış ve kapanış kartı (logo, telefon, adres, web), isteğe bağlı müzik.
  - Akıcılık: sahneler önceden katmanlara ayrılıp resme çevrilir, kareler yalnız bu resimlerden çizilir. Video WebCodecs ile kare kare
    sabit zaman damgasıyla kodlanır (kare atlamaz; Chrome / Edge / Safari güncel sürüm). WebCodecs yoksa gerçek zamanlı kayda düşülür.
- **Telefon ve tablet:** 760 px'in altında paneller alttan açılan sayfalara, sol ray alt gezinme çubuğuna dönüşür. Bir öğe seçilince
  alttaki çubuk işlem çubuğu olur (Düzenle, Yazı, Kırp, Çoğalt, Öne / Arkaya, Kilitle, Sil); özellikler "Düzenle" ile açılır.
  İki parmakla yakınlaştırma, çift dokunuşla yazı düzenleme; dokunmatik ekranda tutamaçlar parmak boyunda.

## IIS'te yayınlama

`yayin\yayinla.bat` dosyasına çift tıklayın. Yönetici izni ister, kataloğu IIS'te **http://localhost:8080/** adresinde yayınlar,
tarayıcıda açar ve proje klasörünü izler: `index.html`, `css`, `js` altında bir dosya kaydedildiğinde yayın birkaç saniyede güncellenir.
Pencere kapanınca izleme durur, site yayında kalır.

Bot (`yayin\iis-yayinla.ps1`) şunları yapar:
- Dosyaları `C:\inetpub\katalog` klasörüne eşler.
- JS / CSS bağlantılarına sürüm ekler; tarayıcı önbelleği eski dosya göstermez.
- `web.config` yazar: MIME türleri, sıkıştırma, önbellek, güvenlik başlıkları.
- "Katalog" sitesini ve "No Managed Code" uygulama havuzunu kurar ya da günceller.
- Sağlık denetimi yapar. Günlük: `%ProgramData%\KatalogYayin\bot.log`.

Seçenekler (PowerShell'den `yayin\iis-yayinla.ps1 …` ya da `.bat` içine eklenerek):

| Seçenek | Ne yapar |
|---|---|
| `-Port 9090` | Başka bağlantı noktası |
| `-Site "Default Web Site" -Uygulama katalog` | Var olan sitenin altında: http://localhost/katalog/ |
| `-Site "AbellPro.Api" -Uygulama katalog` | AbellPro API'nin içinde; katalog sunucu adresini kendisi bulur |
| `-IISKur` | Eksik IIS bileşenlerini kurar |
| `-GuvenlikDuvari` | Ağdaki diğer cihazlar da açabilsin diye bağlantı noktasını açar |
| `-HostAdi katalog.firma.local -SertifikaParmakIzi <parmak izi>` | 443'te https |
| `-Otomatik -Dakika 10` | Zamanlanmış görev: git deposundan çeker, değişiklik varsa yayınlar (`-OtomatikKaldir`) |
| `-YalnizDosyalar -Hedef <klasör>` | IIS'e dokunmadan yalnız dosyaları yazar |

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
├── yayin/              IIS yayın botu: yayinla.bat (çift tıklayın), iis-yayinla.ps1
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
    ├── sablonlar-ek.js ek şablonlar (mevsim, özel gün, farklı tarzlar, sosyal medya, ekran)
    ├── paneller.js     sol paneller
    ├── ozellikler.js   sağ panel (seçili öğenin özellikleri)
    ├── disaaktar.js    PNG / JPG / PDF / HTML dışa aktarım
    ├── onizleme.js     tam ekran broşür önizleme
    ├── video.js        video katalog ve ürün vitrini: sahne hazırlığı, kare çizici, geçişler, MP4 kodlama, stüdyo penceresi
    ├── abellpro.js     AbellPro bağlantısı: lisans, giriş, stok alma, güncelleme
    ├── mobil.js        telefon düzeni: seçim işlem çubuğu, "Sayfa" düğmesi
    └── uygulama.js     başlangıç, üst / alt çubuk, dosya menüsü, otomatik kayıt
```

Belge modeli `js/model.js` başındaki açıklamada; yeni şablon eklemek için `js/sablonlar.js`'teki `SABLONLAR` dizisine bir nesne eklemek yeterlidir.
