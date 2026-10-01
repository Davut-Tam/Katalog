// Örnek market ürünleri: şablonlar ve yeni kataloglar bunlarla dolar. Gerçek liste Ürünler panelinden
// elle, Excel / CSV yapıştırarak ya da dosyadan içe aktarılır. Görseli olmayan ürünlerde emoji kullanılır.
(function () {
    "use strict";
    const KS = window.KS;
    const u = (kategori, ad, aciklama, fiyat, eski, emoji, ek = {}) =>
        Object.assign({ kategori, ad, aciklama, fiyat, eski, birim: "", rozet: "", gorsel: { varlik: null, emoji } }, ek);

    KS.ORNEK_URUNLER = [
        u("Meyve & Sebze", "Kırmızı Elma", "Yerli, kg", 29.95, 39.9, "🍎", { birim: "/kg" }),
        u("Meyve & Sebze", "Muz", "İthal, kg", 64.5, 79.9, "🍌", { birim: "/kg" }),
        u("Meyve & Sebze", "Domates", "Salkım, kg", 24.9, 34.5, "🍅", { birim: "/kg" }),
        u("Meyve & Sebze", "Salatalık", "Çengelköy, kg", 19.9, 0, "🥒", { birim: "/kg", rozet: "YERLİ" }),
        u("Meyve & Sebze", "Portakal", "Washington, kg", 22.5, 29.9, "🍊", { birim: "/kg" }),
        u("Meyve & Sebze", "Limon", "Lamas, kg", 34.9, 0, "🍋", { birim: "/kg" }),
        u("Meyve & Sebze", "Çilek", "500 g kutu", 59.9, 74.9, "🍓"),
        u("Meyve & Sebze", "Üzüm", "Çekirdeksiz, kg", 49.9, 0, "🍇", { birim: "/kg" }),
        u("Meyve & Sebze", "Avokado", "Adet", 32.5, 42.5, "🥑"),
        u("Meyve & Sebze", "Patates", "Nevşehir, kg", 17.9, 22.9, "🥔", { birim: "/kg" }),
        u("Meyve & Sebze", "Havuç", "kg", 14.9, 0, "🥕", { birim: "/kg" }),
        u("Meyve & Sebze", "Brokoli", "Adet", 39.9, 0, "🥦"),
        u("Süt & Kahvaltılık", "Tam Yağlı Süt", "1 L", 34.9, 42.5, "🥛"),
        u("Süt & Kahvaltılık", "Beyaz Peynir", "Tam yağlı, 500 g", 149.9, 189.9, "🧀"),
        u("Süt & Kahvaltılık", "Köy Yumurtası", "30'lu, L boy", 139, 159, "🥚"),
        u("Süt & Kahvaltılık", "Tereyağı", "250 g", 129.9, 149.9, "🧈"),
        u("Süt & Kahvaltılık", "Süzme Bal", "850 g", 289, 349, "🍯"),
        u("Süt & Kahvaltılık", "Siyah Zeytin", "Gemlik, 1 kg", 219.9, 0, "🫒", { rozet: "YENİ" }),
        u("Et & Tavuk", "Dana Kıyma", "Orta yağlı, kg", 549, 649, "🥩", { birim: "/kg" }),
        u("Et & Tavuk", "Tavuk But", "kg", 129.9, 154.9, "🍗", { birim: "/kg" }),
        u("Et & Tavuk", "Sucuk", "Kangal, 500 g", 279, 329, "🌭"),
        u("Et & Tavuk", "Somon Fileto", "kg", 899, 999, "🐟", { birim: "/kg" }),
        u("Temel Gıda", "Ayçiçek Yağı", "5 L", 389.9, 449.9, "🌻"),
        u("Temel Gıda", "Natürel Sızma Zeytinyağı", "1 L", 449.9, 529, "🫒"),
        u("Temel Gıda", "Baldo Pirinç", "1 kg", 74.9, 89.9, "🍚"),
        u("Temel Gıda", "Spagetti Makarna", "500 g", 19.9, 26.5, "🍝", { rozet: "2 AL 1 ÖDE" }),
        u("Temel Gıda", "Toz Şeker", "3 kg", 119.9, 0, "🧂"),
        u("Temel Gıda", "Siyah Çay", "1 kg", 229.9, 269.9, "🍵"),
        u("Temel Gıda", "Türk Kahvesi", "100 g", 64.9, 0, "☕"),
        u("Fırın", "Tam Buğday Ekmeği", "500 g", 22.5, 0, "🍞"),
        u("Fırın", "Tereyağlı Kruvasan", "4'lü", 54.9, 69.9, "🥐"),
        u("İçecek", "Doğal Maden Suyu", "6 × 200 ml", 39.9, 49.9, "🫧"),
        u("İçecek", "Portakal Suyu", "1 L", 44.9, 0, "🧃"),
        u("İçecek", "Kola", "2,5 L", 52.9, 64.9, "🥤"),
        u("Atıştırmalık", "Sütlü Çikolata", "80 g", 24.9, 32.5, "🍫"),
        u("Atıştırmalık", "Kremalı Bisküvi", "3 × 100 g", 34.9, 0, "🍪"),
        u("Atıştırmalık", "Kavrulmuş Fındık", "200 g", 119.9, 139.9, "🌰"),
        u("Temizlik", "Sıvı Çamaşır Deterjanı", "3 L", 189.9, 249.9, "🧴"),
        u("Temizlik", "Bulaşık Süngeri", "5'li", 29.9, 0, "🧽"),
        u("Temizlik", "Tuvalet Kâğıdı", "32'li", 239.9, 299.9, "🧻"),
        u("Temizlik", "Çamaşır Sepeti", "Plastik, 45 L", 129.9, 159.9, "🧺"),
        u("Kişisel Bakım", "Sıvı Sabun", "1,5 L", 69.9, 89.9, "🧼"),
        u("Kişisel Bakım", "Diş Fırçası", "2'li", 49.9, 0, "🪥", { rozet: "1+1" })
    ];

    // Belgeye eklenecek kopya (her ürüne kimlik)
    KS.ornekUrunler = (kategori) => KS.ORNEK_URUNLER
        .filter((x) => !kategori || x.kategori === kategori)
        .map((x) => Object.assign(KS.kopya(x), { id: KS.kimlik("u") }));

    // Sık kullanılan emojiler (Öğeler → Çıkartmalar ve ürün görseli seçimi)
    KS.EMOJI_GRUPLARI = [
        { ad: "Meyve", liste: "🍎🍏🍐🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🫒🥑" },
        { ad: "Sebze", liste: "🥦🥬🥒🌶️🫑🌽🥕🧄🧅🥔🍠🫛🫘🍄🥜🌰" },
        { ad: "Et & Balık", liste: "🥩🍗🍖🥓🌭🍔🐟🐠🦐🦑🦀🦞🍤🥚🍳" },
        { ad: "Süt & Kahvaltı", liste: "🥛🧀🧈🍯🥞🧇🥐🥯🍞🥖🫓🥨🥣🍳" },
        { ad: "Temel gıda", liste: "🍚🍝🍜🥫🧂🫙🌻🌾🍵☕🫖🧉" },
        { ad: "İçecek", liste: "💧🫧🥤🧃🧋🍹🥥🧊🍶" },
        { ad: "Tatlı & Atıştırmalık", liste: "🍫🍬🍭🍪🍩🍰🎂🧁🥧🍦🍨🍿🥨🍘" },
        { ad: "Hazır yemek", liste: "🍕🌮🌯🥙🥪🍟🍲🥗🍱🍛🥘" },
        { ad: "Temizlik & Bakım", liste: "🧴🧼🧽🧻🪥🧹🧺🪣🧤🪒💊🧷" },
        { ad: "Ev & Diğer", liste: "🛒🛍️🏷️🎁📦🔋💡🕯️🧯🐶🐱🍼👶🌸🌿" },
        { ad: "Süsleme", liste: "⭐🌟✨🔥💥⚡🎉🎊❤️💯✅☀️🌙🎈🍀🏆🔔📣👉👍" }
    ];
})();
