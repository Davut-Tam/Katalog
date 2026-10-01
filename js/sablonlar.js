// Hazır şablonlar ve ürün yerleşimi. Her şablon, marka bilgisi ve ürün listesiyle sayfa üreten bir işlevdir;
// böylece galerideki önizleme ile uygulanan tasarım aynı koddan çıkar. Otomatik yerleşim de burada:
// bir sayfa tasarlanır, ürünler o sayfanın düzeniyle gerektiği kadar sayfaya dağıtılır.
(function () {
    "use strict";
    const KS = window.KS;
    const M = (tur, oz) => KS.model.yeni(tur, oz);
    const metin = (oz) => M("metin", oz);
    const sekil = (oz) => M("sekil", oz);

    const AYLAR = ["OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN", "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"];
    function haftaMetni(gun = 6, yil = false) {
        const a = new Date(), b = new Date(a.getTime() + gun * 864e5);
        const y = yil ? " " + b.getFullYear() : "";
        return a.getMonth() === b.getMonth()
            ? `${a.getDate()} – ${b.getDate()} ${AYLAR[b.getMonth()]}${y}`
            : `${a.getDate()} ${AYLAR[a.getMonth()]} – ${b.getDate()} ${AYLAR[b.getMonth()]}${y}`;
    }
    KS.haftaMetni = haftaMetni;
    const buyuk = (s) => String(s || "").toLocaleUpperCase("tr-TR");

    function urunVeri(u) {
        return { ad: u.ad, aciklama: u.aciklama || "", fiyat: u.fiyat || 0, eski: u.eski || 0, birim: u.birim || "", kategori: u.kategori || "", rozet: u.rozet || "", gorsel: KS.kopya(u.gorsel || { emoji: "🛒" }) };
    }
    function kart(u, x, y, w, h, stil) {
        return M("urun", { x: KS.yuvarla(x, 1), y: KS.yuvarla(y, 1), w: KS.yuvarla(w, 1), h: KS.yuvarla(h, 1), urunId: u.id || null, veri: urunVeri(u), stil: KS.kopya(stil || {}) });
    }
    function izgara(urunler, alan, sutun, satir, bosluk, stil) {
        const w = (alan.w - bosluk * (sutun - 1)) / sutun, hh = (alan.h - bosluk * (satir - 1)) / satir;
        return urunler.slice(0, sutun * satir).map((u, i) =>
            kart(u, alan.x + (i % sutun) * (w + bosluk), alan.y + Math.floor(i / sutun) * (hh + bosluk), w, hh, stil));
    }
    const grup = (...ogeler) => { const g = KS.kimlik("g"); ogeler.forEach((o) => { o.grup = g; }); return ogeler; };
    const ortaMetin = (oz) => metin(Object.assign({ hiza: "center" }, oz));

    // ── Şablonlar ───────────────────────────────────────────────
    // c = { marka, urunler(adlar | {kategori, adet}) → ürün dizisi, hafta }
    const A4 = { g: 794, y: 1123 };
    const SABLONLAR = [
        {
            id: "haftanin-firsatlari", ad: "Haftanın Fırsatları", etiket: "A4", boyut: A4, renk: "#e30613",
            olustur(c) {
                const m = c.marka;
                const stil = { duzen: "klasik", kart: "#ffffff", kose: 5, fiyatZemin: "#e30613", fiyatRenk: "#ffffff", rozetZemin: "#ffd400", rozetRenk: "#e30613", adFont: "Inter", adKalin: 800, fiyatFont: "Anton" };
                const urunler = c.urunler(["Tam Yağlı Süt", "Beyaz Peynir", "Köy Yumurtası", "Domates", "Muz", "Ayçiçek Yağı", "Baldo Pirinç", "Siyah Çay", "Sıvı Çamaşır Deterjanı"]);
                return [{
                    arka: { dolgu: "#f4efe6", desen: { tur: "nokta", renk: "#7a1b12", opak: 0.06, olcek: 1 } },
                    ogeler: [
                        sekil({ ad: "Başlık zemini", x: 0, y: 0, w: 794, h: 268, dolgu: { tip: "isin", renk1: "#e30613", renk2: "#d0000e", sayi: 30, x: 50, y: 120 } }),
                        sekil({ ad: "Dalga", sekil: "dalga", x: 0, y: 236, w: 794, h: 40, dolgu: "#f4efe6", oran: 0.9, uc: 4 }),
                        ...grup(
                            sekil({ sekil: "elips", x: 32, y: 26, w: 58, h: 58, dolgu: "#ffffff", golge: { x: 0, y: 3, b: 8, renk: "rgba(0,0,0,.25)" } }),
                            M("gorsel", { emoji: "🛒", x: 41, y: 35, w: 40, h: 40 }),
                            metin({ x: 102, y: 30, w: 380, metin: buyuk(m.ad), font: "Archivo Black", boyut: 24, dolgu: "#ffffff" }),
                            metin({ x: 102, y: 62, w: 380, metin: m.slogan, font: "Inter", kalin: 600, boyut: 13, dolgu: "#ffe1e1" })),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 574, y: 32, w: 188, h: 46, kose: 23, dolgu: "#ffd400", golge: { x: 0, y: 3, b: 8, renk: "rgba(0,0,0,.25)" } }),
                            ortaMetin({ x: 574, y: 43.5, w: 188, metin: c.hafta, font: "Archivo Black", boyut: 19, dolgu: "#b00010" })),
                        ortaMetin({ x: 0, y: 92, w: 794, metin: "HAFTANIN", font: "Anton", boyut: 50, harf: 120, dolgu: "#ffffff", golgeler: [{ x: 0, y: 3, b: 0, renk: "#8b0010" }] }),
                        ortaMetin({ x: 0, y: 140, w: 794, metin: "FIRSATLARI", font: "Anton", boyut: 96, dolgu: "#ffd400", kontur: { k: 4, renk: "#8b0010" }, derinlik: { k: 7, aci: 90, renk: "#5a0008" } }),
                        ...izgara(urunler, { x: 30, y: 292, w: 734, h: 742 }, 3, 3, 14, stil),
                        sekil({ ad: "Alt şerit", x: 0, y: 1046, w: 794, h: 6, dolgu: "#ffd400" }),
                        sekil({ ad: "Alt bilgi zemini", x: 0, y: 1052, w: 794, h: 71, dolgu: "#8b0010" }),
                        metin({ x: 30, y: 1066, w: 400, metin: "📞 " + m.telefon, font: "Inter", kalin: 800, boyut: 17, dolgu: "#ffffff" }),
                        metin({ x: 30, y: 1093, w: 420, metin: m.adres, font: "Inter", kalin: 500, boyut: 11.5, dolgu: "#ffd7d7" }),
                        metin({ x: 414, y: 1068, w: 350, hiza: "right", metin: "Kampanya stoklarla sınırlıdır.\nFiyatlarımıza KDV dahildir.", font: "Inter", kalin: 500, boyut: 11, satir: 1.45, dolgu: "#ffd7d7" })
                    ]
                }];
            }
        },
        {
            id: "taze-manav", ad: "Taze Manav", etiket: "A4", boyut: A4, renk: "#16a34a",
            olustur(c) {
                const stil = { duzen: "daire", kart: "#ffffff", kose: 8, gorselZemin: "#eef9e4", adFont: "Nunito", adKalin: 800, fiyatZemin: "#16a34a", fiyatRenk: "#ffffff", fiyatFont: "Lilita One", rozetZemin: "#facc15", rozetRenk: "#14532d" };
                const urunler = c.urunler({ kategori: "Meyve & Sebze", adet: 12 });
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#e8f6df", k: 0 }, { r: "#fbfff7", k: 100 }] } },
                    ogeler: [
                        sekil({ ad: "Başlık zemini", x: 0, y: 0, w: 794, h: 232, dolgu: { tip: "dogrusal", aci: 135, duraklar: [{ r: "#15803d", k: 0 }, { r: "#4d9c1f", k: 100 }] } }),
                        M("gorsel", { emoji: "🌿", x: 14, y: 140, w: 84, h: 84, aci: -24 }),
                        M("gorsel", { emoji: "🍃", x: 702, y: 18, w: 70, h: 70, aci: 18 }),
                        sekil({ ad: "Dalga", sekil: "dalga", x: 0, y: 194, w: 794, h: 46, dolgu: "#e9f6e0", oran: 1, uc: 3 }),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 24, y: 20, w: 164, h: 32, kose: 16, dolgu: "rgba(255,255,255,.2)" }),
                            ortaMetin({ x: 24, y: 27.5, w: 164, metin: buyuk(c.marka.ad), font: "Inter", kalin: 800, boyut: 13, harf: 80, dolgu: "#ffffff" })),
                        ortaMetin({ x: 0, y: 6, w: 794, metin: "taze", font: "Pacifico", boyut: 70, dolgu: "#fef9c3", golgeler: [{ x: 0, y: 4, b: 10, renk: "rgba(0,0,0,.25)" }] }),
                        ortaMetin({ x: 0, y: 104, w: 794, metin: "MEYVE & SEBZE", font: "Anton", boyut: 62, harf: 60, dolgu: "#ffffff", golgeler: [{ x: 0, y: 4, b: 0, renk: "#14532d" }] }),
                        ...izgara(urunler, { x: 30, y: 262, w: 734, h: 760 }, 4, 3, 12, stil),
                        ortaMetin({ x: 0, y: 1036, w: 794, metin: "Her gün taze, her gün uygun!", font: "Pacifico", boyut: 28, dolgu: "#15803d" }),
                        ortaMetin({ x: 0, y: 1090, w: 794, metin: `${c.hafta} tarihleri arasında geçerlidir • Stoklarla sınırlıdır`, font: "Inter", kalin: 500, boyut: 11, dolgu: "#4b5563" })
                    ]
                }];
            }
        },
        {
            id: "super-hafta-sonu", ad: "Süper Hafta Sonu", etiket: "A4", boyut: A4, renk: "#1e3a8a",
            olustur(c) {
                const stil = { duzen: "patlama", kart: "#ffffff", kose: 6, fiyatZemin: "#ffd400", fiyatRenk: "#e30613", adFont: "Oswald", adKalin: 600, fiyatFont: "Anton", eskiRenk: "#475569", rozetZemin: "#e30613", rozetRenk: "#ffffff" };
                const urunler = c.urunler(["Kola", "Sütlü Çikolata", "Kremalı Bisküvi", "Kavrulmuş Fındık", "Portakal Suyu", "Doğal Maden Suyu", "Spagetti Makarna", "Tereyağlı Kruvasan", "Türk Kahvesi"]);
                return [{
                    arka: { dolgu: { tip: "dairesel", x: 50, y: 18, duraklar: [{ r: "#1e40af", k: 0 }, { r: "#0b1b3f", k: 72 }] }, desen: { tur: "isin", renk: "#ffffff", opak: 0.05, olcek: 1 } },
                    ogeler: [
                        metin({ x: 40, y: 34, w: 520, metin: "SÜPER", font: "Bebas Neue", boyut: 150, satir: 0.95, dolgu: "#ffd400", golgeler: [{ x: 0, y: 0, b: 22, renk: "rgba(255,212,0,.45)" }] }),
                        metin({ x: 44, y: 176, w: 520, metin: "HAFTA SONU", font: "Bebas Neue", boyut: 64, satir: 1, harf: 160, dolgu: "#ffffff" }),
                        metin({ x: 46, y: 244, w: 440, metin: "Cumartesi & Pazar • " + c.hafta2, font: "Inter", kalin: 600, boyut: 16, dolgu: "#bfdbfe" }),
                        ...grup(
                            sekil({ sekil: "patlama", x: 548, y: 38, w: 214, h: 214, uc: 20, ic: 0.86, dolgu: "#e30613", golge: { x: 0, y: 8, b: 18, renk: "rgba(0,0,0,.35)" } }),
                            ortaMetin({ x: 558, y: 96, w: 194, metin: "%50'YE VARAN", font: "Bebas Neue", boyut: 34, dolgu: "#ffffff", aci: -8 }),
                            ortaMetin({ x: 558, y: 128, w: 194, metin: "İNDİRİM", font: "Bebas Neue", boyut: 62, dolgu: "#ffd400", aci: -8 })),
                        ...izgara(urunler, { x: 30, y: 296, w: 734, h: 730 }, 3, 3, 14, stil),
                        sekil({ ad: "Alt bilgi zemini", x: 0, y: 1050, w: 794, h: 73, dolgu: "#ffd400" }),
                        ortaMetin({ x: 0, y: 1058, w: 794, metin: `${buyuk(c.marka.ad)}  •  ${c.marka.telefon}`, font: "Bebas Neue", boyut: 32, dolgu: "#0b1b3f" }),
                        ortaMetin({ x: 0, y: 1097, w: 794, metin: "Kampanya yalnızca hafta sonu geçerlidir. Stoklarla sınırlıdır.", font: "Inter", kalin: 600, boyut: 11, dolgu: "#0b1b3f" })
                    ]
                }];
            }
        },
        {
            id: "kasap", ad: "Kasap Reyonu", etiket: "A4", boyut: A4, renk: "#7f1d1d",
            olustur(c) {
                const stil = { duzen: "yatay", kart: "#fff8ef", kose: 4, adFont: "Playfair Display", adKalin: 700, aciklamaRenk: "#7c2d12", fiyatZemin: "#7f1d1d", fiyatRenk: "#ffe8b6", fiyatFont: "Oswald", rozetZemin: "#e9c46a", rozetRenk: "#4a0d14", eskiRenk: "#9a3412" };
                const urunler = c.urunler(["Dana Kıyma", "Tavuk But", "Sucuk", "Somon Fileto", "Beyaz Peynir", "Tereyağı"]);
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#4a0d14", k: 0 }, { r: "#22060a", k: 100 }] }, desen: { tur: "kareli", renk: "#ffffff", opak: 0.035, olcek: 1.2 } },
                    ogeler: [
                        ortaMetin({ x: 0, y: 54, w: 794, metin: "TAZE  •  GÜVENİLİR  •  YERLİ", font: "Inter", kalin: 700, boyut: 13, harf: 300, dolgu: "#e9c46a" }),
                        ortaMetin({ x: 0, y: 78, w: 794, metin: "Kasap Reyonu", font: "Playfair Display", kalin: 800, boyut: 76, dolgu: "#fff3e0" }),
                        sekil({ sekil: "cizgi", x: 197, y: 196, w: 170, h: 10, cizgi: { k: 1.5, renk: "#e9c46a" } }),
                        sekil({ sekil: "cokgen", uc: 4, x: 389, y: 193, w: 16, h: 16, dolgu: "#e9c46a" }),
                        sekil({ sekil: "cizgi", x: 427, y: 196, w: 170, h: 10, cizgi: { k: 1.5, renk: "#e9c46a" } }),
                        ortaMetin({ x: 0, y: 214, w: 794, metin: "Haftanın kasap fırsatları", font: "Playfair Display", italik: true, boyut: 20, dolgu: "#f5d9b8" }),
                        ...izgara(urunler, { x: 40, y: 272, w: 714, h: 748 }, 2, 3, 18, stil),
                        sekil({ sekil: "cizgi", x: 40, y: 1036, w: 714, h: 10, cizgi: { k: 1, renk: "rgba(233,196,106,.6)" } }),
                        ortaMetin({ x: 0, y: 1056, w: 794, metin: `${c.marka.ad}  |  ${c.marka.telefon}`, font: "Playfair Display", kalin: 600, boyut: 18, dolgu: "#fff3e0" }),
                        ortaMetin({ x: 0, y: 1088, w: 794, metin: "Etlerimiz günlük kesim ve soğuk zincirle gelir.", font: "Inter", kalin: 500, boyut: 11, dolgu: "#e9c46a" })
                    ]
                }];
            }
        },
        {
            id: "kahvalti", ad: "Kahvaltı Keyfi", etiket: "A4", boyut: A4, renk: "#ea580c",
            olustur(c) {
                const stil = { duzen: "minimal", kart: "#ffffff", kose: 10, kartGolge: true, adFont: "Montserrat", adKalin: 700, fiyatZemin: "#ea580c", fiyatRenk: "#ffffff", fiyatFont: "Paytone One", rozetZemin: "#ea580c", rozetRenk: "#ffffff" };
                const urunler = c.urunler(["Tam Yağlı Süt", "Beyaz Peynir", "Köy Yumurtası", "Tereyağı", "Süzme Bal", "Siyah Zeytin"]);
                return [{
                    arka: { dolgu: "#fff7e8", desen: { tur: "nokta2", renk: "#f59e0b", opak: 0.1, olcek: 1 } },
                    ogeler: [
                        sekil({ sekil: "muhur", x: 584, y: -70, w: 270, h: 270, uc: 18, ic: 0.4, dolgu: "#ffd166" }),
                        M("gorsel", { emoji: "☀️", x: 628, y: 26, w: 130, h: 130 }),
                        metin({ x: 50, y: 62, w: 520, metin: "KAHVALTILIK FIRSATLAR", font: "Montserrat", kalin: 900, boyut: 18, harf: 260, dolgu: "#c2410c" }),
                        metin({ x: 46, y: 90, w: 560, metin: "Güne lezzetli\nbaşlayın", font: "Kaushan Script", boyut: 70, satir: 1.05, dolgu: "#3f1d0b" }),
                        ...izgara(urunler, { x: 40, y: 290, w: 714, h: 722 }, 3, 2, 18, stil),
                        sekil({ ad: "Alt dalga", sekil: "dalga", x: 0, y: 1030, w: 794, h: 93, dolgu: "#ea580c", oran: 0.4, uc: 3 }),
                        ortaMetin({ x: 0, y: 1066, w: 794, metin: `${buyuk(c.marka.ad)}  •  ${c.marka.telefon}`, font: "Montserrat", kalin: 800, boyut: 16, dolgu: "#ffffff" }),
                        ortaMetin({ x: 0, y: 1093, w: 794, metin: `${c.hafta} • Kampanya stoklarla sınırlıdır.`, font: "Inter", kalin: 500, boyut: 11, dolgu: "#ffedd5" })
                    ]
                }];
            }
        },
        {
            id: "temizlik", ad: "Temizlik Günleri", etiket: "A4", boyut: A4, renk: "#0284c7",
            olustur(c) {
                const stil = { duzen: "klasik", kart: "#ffffff", kose: 8, fiyatZemin: "#0284c7", fiyatRenk: "#ffffff", rozetZemin: "#facc15", rozetRenk: "#0c4a6e", adFont: "Rubik", adKalin: 700, fiyatFont: "Russo One" };
                const urunler = c.urunler(["Sıvı Çamaşır Deterjanı", "Bulaşık Süngeri", "Tuvalet Kâğıdı", "Çamaşır Sepeti", "Sıvı Sabun", "Diş Fırçası"]);
                const kopuk = (x, y, r, opak) => sekil({ sekil: "elips", x, y, w: r, h: r, opak, dolgu: { tip: "dairesel", x: 35, y: 30, duraklar: [{ r: "#ffffff", k: 0 }, { r: "rgba(255,255,255,.15)", k: 100 }] }, cizgi: { k: 1.5, renk: "rgba(255,255,255,.95)" } });
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#cdeefe", k: 0 }, { r: "#f4fbff", k: 60 }] } },
                    ogeler: [
                        kopuk(616, 30, 150, 0.7), kopuk(720, 176, 64, 0.6), kopuk(560, 196, 42, 0.75), kopuk(470, 40, 54, 0.55), kopuk(28, 210, 40, 0.5),
                        M("gorsel", { emoji: "🧽", x: 640, y: 66, w: 92, h: 92, aci: -12 }),
                        metin({ x: 40, y: 56, w: 560, metin: "TEMİZLİK", font: "Russo One", boyut: 84, dolgu: "#0369a1", golgeler: [{ x: 0, y: 6, b: 0, renk: "#bae6fd" }] }),
                        metin({ x: 44, y: 160, w: 560, metin: "GÜNLERİ", font: "Russo One", boyut: 42, harf: 300, dolgu: "#0ea5e9" }),
                        metin({ x: 44, y: 226, w: 520, metin: "Eviniz pırıl pırıl, cebiniz rahat!", font: "Inter", kalin: 600, boyut: 16, dolgu: "#0c4a6e" }),
                        ...izgara(urunler, { x: 40, y: 290, w: 714, h: 732 }, 3, 2, 18, stil),
                        sekil({ ad: "Alt bilgi zemini", x: 0, y: 1050, w: 794, h: 73, dolgu: "#0369a1" }),
                        ortaMetin({ x: 0, y: 1063, w: 794, metin: `${buyuk(c.marka.ad)}  •  ${c.marka.telefon}`, font: "Rubik", kalin: 700, boyut: 18, dolgu: "#ffffff" }),
                        ortaMetin({ x: 0, y: 1094, w: 794, metin: `${c.hafta} tarihleri arasında geçerlidir.`, font: "Inter", kalin: 500, boyut: 11, dolgu: "#bae6fd" })
                    ]
                }];
            }
        },
        {
            id: "kapak", ad: "Katalog Kapağı", etiket: "A4", boyut: A4, renk: "#c1121f",
            olustur(c) {
                const cevre = [["🍎", -90], ["🥖", -30], ["🧀", 30], ["🍇", 90], ["🥦", 150], ["🥛", 210]];
                const mx = 397, my = 430, r = 228;
                return [{
                    arka: { dolgu: { tip: "dairesel", x: 50, y: 38, duraklar: [{ r: "#ff5a5f", k: 0 }, { r: "#c1121f", k: 55 }, { r: "#6e0a12", k: 100 }] }, desen: { tur: "isin", renk: "#ffffff", opak: 0.07, olcek: 1 } },
                    ogeler: [
                        ortaMetin({ x: 0, y: 64, w: 794, metin: buyuk(c.marka.ad), font: "Archivo Black", boyut: 34, harf: 200, dolgu: "#ffffff" }),
                        ortaMetin({ x: 0, y: 114, w: 794, metin: c.marka.slogan, font: "Inter", kalin: 600, boyut: 16, dolgu: "#ffd6d6" }),
                        sekil({ sekil: "elips", x: mx - 170, y: my - 170, w: 340, h: 340, dolgu: "rgba(255,255,255,.12)", cizgi: { k: 3, renk: "rgba(255,255,255,.35)", kesik: 1 } }),
                        M("gorsel", { emoji: "🛒", x: mx - 120, y: my - 120, w: 240, h: 240 }),
                        ...cevre.map(([e, a], i) => M("gorsel", { emoji: e, x: mx + Math.cos(a * KS.RAD) * r - 58, y: my + Math.sin(a * KS.RAD) * r - 58, w: 116, h: 116, aci: (i % 2 ? 10 : -10) })),
                        ortaMetin({ x: 0, y: 704, w: 794, metin: "AKTÜEL", font: "Anton", boyut: 124, dolgu: "#ffd400", derinlik: { k: 8, aci: 90, renk: "#5a0008" } }),
                        ortaMetin({ x: 0, y: 856, w: 794, metin: "ÜRÜNLER KATALOĞU", font: "Anton", boyut: 46, harf: 120, dolgu: "#ffffff" }),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 237, y: 946, w: 320, h: 56, kose: 28, dolgu: "#ffd400", golge: { x: 0, y: 4, b: 12, renk: "rgba(0,0,0,.3)" } }),
                            ortaMetin({ x: 237, y: 960.5, w: 320, metin: c.haftaYil, font: "Archivo Black", boyut: 22, dolgu: "#b00010" })),
                        ortaMetin({ x: 0, y: 1060, w: 794, metin: `📞 ${c.marka.telefon}   •   ${c.marka.web}`, font: "Inter", kalin: 700, boyut: 15, dolgu: "#ffffff" })
                    ]
                }];
            }
        },
        {
            id: "gurme", ad: "Gurme Seçki", etiket: "A4", boyut: A4, renk: "#c9a45c",
            olustur(c) {
                const m = c.marka, altin = "#c9a45c";
                const altinDolgu = { tip: "dogrusal", aci: 180, duraklar: [{ r: "#f6e7b8", k: 0 }, { r: "#d4af6a", k: 50 }, { r: "#9a7535", k: 100 }] };
                const stil = { duzen: "yatay", kart: "#16130e", kenar: "#3b3020", kalinlik: 1, kose: 2, kartGolge: false, adFont: "Playfair Display", adKalin: 700, adRenk: "#f3e6c8", aciklamaRenk: "#a89366", fiyatZemin: altin, fiyatRenk: "#14110c", fiyatFont: "Playfair Display", eskiRenk: "#8c7a55", rozetZemin: altin, rozetRenk: "#14110c" };
                const urunler = c.urunler(["Somon Fileto", "Natürel Sızma Zeytinyağı", "Süzme Bal", "Beyaz Peynir", "Kavrulmuş Fındık", "Türk Kahvesi"]);
                const cerceve = (p, k, opak) => sekil({ ad: "Çerçeve", x: p, y: p, w: 794 - p * 2, h: 1123 - p * 2, dolgu: "rgba(0,0,0,0)", cizgi: { k, renk: altin }, opak });
                return [{
                    arka: { dolgu: { tip: "dairesel", x: 50, y: 0, duraklar: [{ r: "#2a2419", k: 0 }, { r: "#0d0c0a", k: 70 }] } },
                    ogeler: [
                        cerceve(22, 1.2, 0.9), cerceve(30, 0.6, 0.6),
                        ortaMetin({ x: 0, y: 64, w: 794, metin: buyuk(m.ad), font: "Cormorant Garamond", kalin: 700, boyut: 16, harf: 420, dolgu: altin }),
                        ortaMetin({ x: 0, y: 92, w: 794, metin: "Gurme Seçki", font: "Playfair Display", kalin: 800, italik: true, boyut: 88, dolgu: altinDolgu }),
                        sekil({ sekil: "cizgi", x: 227, y: 214, w: 140, h: 10, cizgi: { k: 1, renk: altin } }),
                        sekil({ sekil: "cokgen", uc: 4, x: 389, y: 211, w: 16, h: 16, dolgu: altin }),
                        sekil({ sekil: "cizgi", x: 427, y: 214, w: 140, h: 10, cizgi: { k: 1, renk: altin } }),
                        ortaMetin({ x: 0, y: 238, w: 794, metin: "Özenle seçilmiş lezzetler, haftaya özel fiyatlarla", font: "Cormorant Garamond", italik: true, kalin: 600, boyut: 20, dolgu: "#e9dcbc" }),
                        ...izgara(urunler, { x: 56, y: 292, w: 682, h: 706 }, 2, 3, 18, stil),
                        sekil({ sekil: "cizgi", x: 56, y: 1016, w: 682, h: 10, cizgi: { k: 0.8, renk: altin } }),
                        ortaMetin({ x: 0, y: 1038, w: 794, metin: `${m.telefon}  ·  ${m.web}`, font: "Cormorant Garamond", kalin: 700, boyut: 17, harf: 60, dolgu: "#f3e6c8" }),
                        ortaMetin({ x: 0, y: 1068, w: 794, metin: `${c.hafta} · Stoklarla sınırlıdır`, font: "Inter", kalin: 500, boyut: 10, harf: 200, dolgu: "#8c7a55" })
                    ]
                }];
            }
        },
        {
            id: "retro-pazar", ad: "Retro Pazar", etiket: "A4", boyut: A4, renk: "#e76f2a",
            olustur(c) {
                const m = c.marka, krem = "#f6e7c8", kahve = "#5b2e12";
                const stil = { duzen: "serit", kart: "#fffaf0", kenar: kahve, kalinlik: 2, kose: 16, kartGolge: false, adFont: "Righteous", adKalin: 400, adRenk: kahve, aciklamaRenk: "#8a5a3b", fiyatZemin: "#d94f30", fiyatRenk: "#fff3dc", fiyatFont: "Shrikhand", eskiRenk: "#fde2c4", rozetZemin: "#f2a541", rozetRenk: kahve };
                const urunler = c.urunler(["Tam Yağlı Süt", "Kremalı Bisküvi", "Türk Kahvesi", "Portakal Suyu", "Kola", "Sütlü Çikolata", "Tereyağlı Kruvasan", "Süzme Bal", "Spagetti Makarna"]);
                // 70'ler gökkuşağı: iç içe daireler, alt yarısı zeminle örtülür
                const yay = (r, renk) => sekil({ sekil: "elips", x: 397 - r, y: 250 - r, w: r * 2, h: r * 2, dolgu: renk });
                return [{
                    arka: { dolgu: krem },
                    ogeler: [
                        yay(330, "#d94f30"), yay(275, "#e76f2a"), yay(220, "#f2a541"), yay(165, "#f6c453"),
                        sekil({ ad: "Yay kesiği", x: 0, y: 250, w: 794, h: 340, dolgu: krem }),
                        M("gorsel", { emoji: "🛒", x: 352, y: 112, w: 90, h: 90 }),
                        ortaMetin({ x: 0, y: 206, w: 794, metin: buyuk(m.ad), font: "Rubik Mono One", boyut: 17, dolgu: kahve }),
                        ortaMetin({ x: 0, y: 252, w: 794, metin: "Retro Pazar", font: "Shrikhand", boyut: 80, dolgu: kahve, golgeler: [{ x: 4, y: 4, b: 0, renk: "#f2a541" }] }),
                        ortaMetin({ x: 0, y: 356, w: 794, metin: "ESKİ USUL LEZZET • YENİ USUL FİYAT", font: "Rubik Mono One", boyut: 13, harf: 60, dolgu: "#d94f30" }),
                        ...izgara(urunler, { x: 40, y: 394, w: 714, h: 620 }, 3, 3, 14, stil),
                        sekil({ x: 0, y: 1028, w: 794, h: 8, dolgu: "#d94f30" }),
                        sekil({ x: 0, y: 1040, w: 794, h: 8, dolgu: "#e76f2a" }),
                        sekil({ x: 0, y: 1052, w: 794, h: 8, dolgu: "#f2a541" }),
                        sekil({ ad: "Alt bilgi zemini", x: 0, y: 1064, w: 794, h: 59, dolgu: kahve }),
                        ortaMetin({ x: 0, y: 1074, w: 794, metin: `${buyuk(m.ad)} • ${m.telefon}`, font: "Rubik Mono One", boyut: 14, dolgu: krem }),
                        ortaMetin({ x: 0, y: 1099, w: 794, metin: `${c.hafta} tarihleri arasında geçerlidir`, font: "Inter", kalin: 600, boyut: 10, dolgu: "#f2c79a" })
                    ]
                }];
            }
        },
        {
            id: "neon-gece", ad: "Neon Gece", etiket: "A4", boyut: A4, renk: "#ff2bd6",
            olustur(c) {
                const m = c.marka, pembe = "#ff2bd6", turkuaz = "#00e5ff";
                const isilti = (r) => [{ x: 0, y: 0, b: 6, renk: r }, { x: 0, y: 0, b: 18, renk: r }, { x: 0, y: 0, b: 36, renk: r }];
                const stil = { duzen: "klasik", kart: "#150a33", kenar: pembe, kalinlik: 1.5, kose: 14, kartGolge: false, adFont: "Exo 2", adKalin: 800, adRenk: "#f5f3ff", aciklamaRenk: "#a5b4fc", fiyatZemin: turkuaz, fiyatRenk: "#0b0221", fiyatFont: "Russo One", eskiRenk: "#c4b5fd", rozetZemin: pembe, rozetRenk: "#ffffff" };
                const urunler = c.urunler(["Kola", "Sütlü Çikolata", "Kremalı Bisküvi", "Kavrulmuş Fındık", "Portakal Suyu", "Doğal Maden Suyu", "Türk Kahvesi", "Tereyağlı Kruvasan", "Sıvı Sabun"]);
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#0b0221", k: 0 }, { r: "#1d0b45", k: 60 }, { r: "#2a0b52", k: 100 }] }, desen: { tur: "kareli", renk: pembe, opak: 0.07, olcek: 1.6 } },
                    ogeler: [
                        // Retro gün batımı: şeritlerle kesilmiş neon güneş
                        sekil({ sekil: "elips", x: 500, y: 40, w: 250, h: 250, dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#ffe259", k: 0 }, { r: pembe, k: 100 }] }, golge: { x: 0, y: 0, b: 30, renk: "rgba(255,43,214,.7)" } }),
                        sekil({ x: 500, y: 192, w: 250, h: 7, dolgu: "#11052c" }),
                        sekil({ x: 500, y: 216, w: 250, h: 10, dolgu: "#13062f" }),
                        sekil({ x: 500, y: 243, w: 250, h: 13, dolgu: "#150733" }),
                        metin({ x: 44, y: 56, w: 460, metin: "GECE", font: "Bungee", boyut: 96, dolgu: "#e6fdff", golgeler: isilti(turkuaz) }),
                        metin({ x: 44, y: 166, w: 460, metin: "YARISI", font: "Bungee", boyut: 70, dolgu: "#ffe6fa", golgeler: isilti(pembe) }),
                        metin({ x: 48, y: 262, w: 460, metin: "Sadece bu gece • Stoklarla sınırlı", font: "Exo 2", kalin: 700, boyut: 17, harf: 80, dolgu: "#c4b5fd" }),
                        sekil({ ad: "Neon çerçeve", sekil: "yuvarlak", x: 30, y: 314, w: 734, h: 716, kose: 22, dolgu: "rgba(0,0,0,0)", cizgi: { k: 2, renk: turkuaz }, golge: { x: 0, y: 0, b: 10, renk: turkuaz } }),
                        ...izgara(urunler, { x: 50, y: 334, w: 694, h: 676 }, 3, 3, 14, stil),
                        ortaMetin({ x: 0, y: 1046, w: 794, metin: buyuk(m.ad), font: "Bungee", boyut: 26, dolgu: "#ffe6fa", golgeler: isilti(pembe) }),
                        ortaMetin({ x: 0, y: 1090, w: 794, metin: `${m.telefon}  •  ${m.web}`, font: "Exo 2", kalin: 600, boyut: 12, harf: 100, dolgu: "#a5b4fc" })
                    ]
                }];
            }
        },
        {
            id: "gazete", ad: "Gazete İlanı", etiket: "A4", boyut: A4, renk: "#151515",
            olustur(c) {
                const m = c.marka, murekkep = "#151515", kirmizi = "#b91c1c";
                const ortak = { kart: "#fbf8f1", kenar: murekkep, kalinlik: 1, kose: 0, kartGolge: false, adFont: "Playfair Display", adKalin: 800, adRenk: murekkep, aciklamaRenk: "#4b4b4b", fiyatZemin: kirmizi, fiyatRenk: "#ffffff", fiyatFont: "Alfa Slab One", eskiRenk: "#6b6b6b", rozetZemin: murekkep, rozetRenk: "#ffffff" };
                const [manset, ...digerleri] = c.urunler(["Ayçiçek Yağı", "Beyaz Peynir", "Baldo Pirinç", "Siyah Çay", "Tavuk But", "Toz Şeker", "Tam Buğday Ekmeği"]);
                const cizgi = (y, k = 1) => sekil({ sekil: "cizgi", x: 40, y: y - 5, w: 714, h: 10, cizgi: { k, renk: murekkep } });
                const kucuk = { font: "Inter", kalin: 700, boyut: 10, harf: 200, dolgu: murekkep };
                return [{
                    arka: { dolgu: "#f3efe6", desen: { tur: "nokta", renk: "#000000", opak: 0.03, olcek: 0.6 } },
                    ogeler: [
                        cizgi(40, 3), cizgi(47),
                        ortaMetin({ x: 0, y: 56, w: 794, metin: buyuk(m.ad), font: "Abril Fatface", boyut: 60, dolgu: murekkep }),
                        cizgi(140),
                        metin(Object.assign({ x: 40, y: 148, w: 240, metin: "SAYI 42" }, kucuk)),
                        ortaMetin(Object.assign({ x: 207, y: 148, w: 380, metin: c.haftaYil }, kucuk)),
                        metin(Object.assign({ x: 514, y: 148, w: 240, hiza: "right", metin: "ÜCRETSİZ" }, kucuk)),
                        cizgi(168), cizgi(173, 3),
                        metin({ x: 40, y: 190, w: 714, metin: "FİYATLAR YERE İNDİ!", font: "Alfa Slab One", boyut: 52, satir: 1, dolgu: murekkep }),
                        metin({ x: 40, y: 254, w: 714, metin: "Haftanın en çok konuşulan indirimleri bu sayfada. Mutfak alışverişinde bütçenizi rahatlatacak fırsatlar raflardaki yerini aldı.", font: "Lora", italik: true, boyut: 15, satir: 1.45, dolgu: "#3a3a3a" }),
                        kart(manset, 40, 318, 714, 250, Object.assign({}, ortak, { duzen: "yatay", fiyatOlcek: 115 })),
                        metin({ x: 40, y: 586, w: 714, metin: "DİĞER FIRSATLAR", font: "Inter", kalin: 800, boyut: 11, harf: 300, dolgu: kirmizi }),
                        cizgi(608),
                        ...izgara(digerleri, { x: 40, y: 622, w: 714, h: 396 }, 3, 2, 14, Object.assign({}, ortak, { duzen: "minimal" })),
                        cizgi(1036, 3), cizgi(1043),
                        metin({ x: 40, y: 1058, w: 400, metin: m.adres, font: "Lora", boyut: 11.5, satir: 1.4, dolgu: "#3a3a3a" }),
                        metin({ x: 420, y: 1058, w: 334, hiza: "right", metin: `${m.telefon}\n${m.web}`, font: "Inter", kalin: 700, boyut: 12, satir: 1.45, dolgu: murekkep })
                    ]
                }];
            }
        },
        {
            id: "sade", ad: "Sade Seçki", etiket: "A4", boyut: A4, renk: "#2f6b4f",
            olustur(c) {
                const m = c.marka, yesil = "#2f6b4f", koyu = "#141414";
                const stil = { duzen: "minimal", kart: "#f3f3f0", kose: 0, kartGolge: false, adFont: "Manrope", adKalin: 700, adRenk: koyu, aciklamaRenk: "#7a7a7a", fiyatZemin: yesil, fiyatRenk: "#ffffff", fiyatFont: "Bricolage Grotesque", eskiRenk: "#9a9a9a", rozetZemin: koyu, rozetRenk: "#ffffff" };
                const urunler = c.urunler(["Avokado", "Brokoli", "Limon", "Çilek", "Üzüm", "Natürel Sızma Zeytinyağı", "Tam Buğday Ekmeği", "Siyah Zeytin", "Süzme Bal"]);
                return [{
                    arka: { dolgu: "#ffffff" },
                    ogeler: [
                        metin({ x: 48, y: 46, w: 400, metin: buyuk(m.ad), font: "Manrope", kalin: 800, boyut: 12, harf: 300, dolgu: koyu }),
                        metin({ x: 346, y: 46, w: 400, hiza: "right", metin: c.hafta, font: "Manrope", kalin: 500, boyut: 12, harf: 100, dolgu: "#7a7a7a" }),
                        sekil({ sekil: "cizgi", x: 48, y: 70, w: 698, h: 10, cizgi: { k: 1, renk: koyu } }),
                        metin({ x: 44, y: 100, w: 460, metin: "Haftalık\nseçki.", font: "Bricolage Grotesque", kalin: 800, boyut: 92, satir: 0.92, harf: -20, dolgu: koyu }),
                        metin({ x: 466, y: 92, w: 280, hiza: "right", metin: "%30", font: "Bricolage Grotesque", kalin: 800, boyut: 116, dolgu: "rgba(0,0,0,0)", kontur: { k: 0.9, renk: yesil } }),
                        metin({ x: 470, y: 248, w: 276, hiza: "right", metin: "varan indirimle\nmevsimin en tazeleri", font: "Manrope", kalin: 600, boyut: 13, satir: 1.4, dolgu: "#555555" }),
                        sekil({ sekil: "elips", x: 48, y: 300, w: 9, h: 9, dolgu: yesil }),
                        metin({ x: 64, y: 295, w: 400, metin: "Taze • Yerel • Mevsiminde", font: "Manrope", kalin: 600, boyut: 12, harf: 120, dolgu: yesil }),
                        ...izgara(urunler, { x: 48, y: 336, w: 698, h: 688 }, 3, 3, 10, stil),
                        sekil({ sekil: "cizgi", x: 48, y: 1042, w: 698, h: 10, cizgi: { k: 1, renk: koyu } }),
                        metin({ x: 48, y: 1066, w: 400, metin: m.adres, font: "Manrope", kalin: 500, boyut: 10.5, dolgu: "#7a7a7a" }),
                        metin({ x: 346, y: 1066, w: 400, hiza: "right", metin: `${m.telefon}  ·  ${m.web}`, font: "Manrope", kalin: 700, boyut: 10.5, dolgu: koyu })
                    ]
                }];
            }
        },
        {
            id: "ramazan", ad: "Ramazan Kolisi", etiket: "A4", boyut: A4, renk: "#12355b",
            olustur(c) {
                const m = c.marka, altin = "#e2b85c", lacivert = "#12355b";
                const altinDolgu = { tip: "dogrusal", aci: 180, duraklar: [{ r: "#fbe7a8", k: 0 }, { r: "#e2b85c", k: 55 }, { r: "#b07f2a", k: 100 }] };
                const stil = { duzen: "daire", kart: "#fdf8ec", kose: 14, kartGolge: true, gorselZemin: "#f4e6c1", adFont: "Lora", adKalin: 700, adRenk: lacivert, aciklamaRenk: "#6b7a8f", fiyatZemin: lacivert, fiyatRenk: "#f6d98b", fiyatFont: "Playfair Display", eskiRenk: "#8a94a6", rozetZemin: altin, rozetRenk: lacivert };
                const urunler = c.urunler(["Baldo Pirinç", "Ayçiçek Yağı", "Toz Şeker", "Siyah Çay", "Süzme Bal", "Siyah Zeytin", "Beyaz Peynir", "Tereyağı", "Türk Kahvesi"]);
                // İpe asılı yıldızlar
                const asili = (x, uz, r) => [
                    sekil({ sekil: "cizgi", x: x - uz / 2, y: uz / 2 - 5, w: uz, h: 10, aci: 90, cizgi: { k: 1, renk: altin } }),
                    sekil({ sekil: "yildiz", x: x - r / 2, y: uz - r * 0.12, w: r, h: r, uc: 5, ic: 0.45, dolgu: altinDolgu })];
                return [{
                    arka: { dolgu: { tip: "dairesel", x: 50, y: 22, duraklar: [{ r: "#1d4d80", k: 0 }, { r: "#0a1b33", k: 75 }] }, desen: { tur: "yildizlar", renk: altin, opak: 0.1, olcek: 1 } },
                    ogeler: [
                        ...asili(80, 90, 30), ...asili(140, 140, 22), ...asili(200, 66, 18), ...asili(594, 70, 18), ...asili(654, 130, 24), ...asili(714, 84, 30),
                        M("gorsel", { emoji: "🌙", x: 342, y: 20, w: 110, h: 110, aci: -20 }),
                        ortaMetin({ x: 0, y: 126, w: 794, metin: "Hoş geldin", font: "Great Vibes", boyut: 52, dolgu: altin }),
                        ortaMetin({ x: 0, y: 178, w: 794, metin: "RAMAZAN", font: "Cormorant Garamond", kalin: 700, boyut: 84, harf: 220, dolgu: altinDolgu }),
                        ortaMetin({ x: 0, y: 288, w: 794, metin: "Bereketli sofralar için özel fiyatlar", font: "Lora", italik: true, boyut: 17, dolgu: "#f3e9d2" }),
                        ...izgara(urunler, { x: 36, y: 336, w: 722, h: 676 }, 3, 3, 14, stil),
                        sekil({ sekil: "cizgi", x: 197, y: 1030, w: 400, h: 10, cizgi: { k: 1, renk: altin } }),
                        ortaMetin({ x: 0, y: 1040, w: 794, metin: "Hayırlı Ramazanlar", font: "Great Vibes", boyut: 34, dolgu: altin }),
                        ortaMetin({ x: 0, y: 1088, w: 794, metin: `${buyuk(m.ad)}  •  ${m.telefon}`, font: "Inter", kalin: 700, boyut: 11, harf: 150, dolgu: "#c9d6e8" })
                    ]
                }];
            }
        },
        {
            id: "kara-cuma", ad: "Kara Cuma", etiket: "A4", boyut: A4, renk: "#ffd400",
            olustur(c) {
                const m = c.marka, sari = "#ffd400", siyah = "#0a0a0a";
                // Çapraz uyarı şeridi
                const serit = (y, aci, yazi, zemin, renk) => grup(
                    sekil({ ad: "Şerit", x: -80, y, w: 954, h: 58, aci, dolgu: zemin, golge: { x: 0, y: 6, b: 14, renk: "rgba(0,0,0,.5)" } }),
                    ortaMetin({ x: -80, y: y + 13, w: 954, aci, metin: yazi, font: "Black Ops One", boyut: 26, harf: 40, dolgu: renk }));
                const stil = { duzen: "patlama", kart: "#161616", kenar: "#2b2b2b", kalinlik: 1, kose: 4, kartGolge: false, adFont: "Barlow Condensed", adKalin: 800, adRenk: "#ffffff", aciklamaRenk: "#a3a3a3", fiyatZemin: sari, fiyatRenk: siyah, fiyatFont: "Anton", eskiRenk: "#a3a3a3", rozetZemin: "#ff2d2d", rozetRenk: "#ffffff" };
                const urunler = c.urunler(["Sıvı Çamaşır Deterjanı", "Tuvalet Kâğıdı", "Ayçiçek Yağı", "Dana Kıyma", "Somon Fileto", "Natürel Sızma Zeytinyağı", "Süzme Bal", "Kavrulmuş Fındık", "Çamaşır Sepeti"]);
                return [{
                    arka: { dolgu: siyah, desen: { tur: "cizgi", renk: sari, opak: 0.045, olcek: 1.4 } },
                    ogeler: [
                        ...serit(38, -4, "KARA CUMA ★ KARA CUMA ★ KARA CUMA ★ KARA CUMA", sari, siyah),
                        metin({ x: 40, y: 128, w: 440, metin: "KARA\nCUMA", font: "Black Ops One", boyut: 104, satir: 0.92, dolgu: "#ffffff" }),
                        metin({ x: 44, y: 324, w: 440, metin: "Yılın en büyük indirimi başladı!", font: "Barlow Condensed", kalin: 700, boyut: 22, harf: 40, dolgu: sari }),
                        ...grup(
                            sekil({ sekil: "patlama", x: 490, y: 108, w: 264, h: 264, uc: 22, ic: 0.84, dolgu: sari, golge: { x: 0, y: 10, b: 24, renk: "rgba(255,212,0,.35)" } }),
                            ortaMetin({ x: 500, y: 150, w: 244, metin: "%70", font: "Dela Gothic One", boyut: 86, dolgu: siyah, aci: -8 }),
                            ortaMetin({ x: 500, y: 280, w: 244, metin: "'E VARAN İNDİRİM", font: "Barlow Condensed", kalin: 800, boyut: 22, harf: 60, dolgu: siyah, aci: -8 })),
                        ...izgara(urunler, { x: 30, y: 372, w: 734, h: 620 }, 3, 3, 12, stil),
                        ...serit(1012, 2, "SON GÜN PAZAR ★ STOKLARLA SINIRLI ★ KAÇIRMA", "#ffffff", siyah),
                        ortaMetin({ x: 0, y: 1094, w: 794, metin: `${buyuk(m.ad)}  •  ${m.telefon}  •  ${m.web}`, font: "Barlow Condensed", kalin: 700, boyut: 14, harf: 80, dolgu: "#d4d4d4" })
                    ]
                }];
            }
        },
        {
            id: "beslenme", ad: "Beslenme Çantası", etiket: "A4", boyut: A4, renk: "#ec4899",
            olustur(c) {
                const m = c.marka, mor = "#4c1d95", PASTEL = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#ddd6fe"];
                const bulut = (x, y, s) => grup(
                    sekil({ sekil: "elips", x, y: y + 18 * s, w: 120 * s, h: 52 * s, dolgu: "#ffffff" }),
                    sekil({ sekil: "elips", x: x + 22 * s, y, w: 58 * s, h: 58 * s, dolgu: "#ffffff" }),
                    sekil({ sekil: "elips", x: x + 56 * s, y: y + 6 * s, w: 50 * s, h: 50 * s, dolgu: "#ffffff" }));
                const stil = { duzen: "daire", kart: "#ffffff", kose: 28, kartGolge: true, adFont: "Fredoka", adKalin: 600, adRenk: mor, aciklamaRenk: "#7c6f9b", fiyatZemin: "#ec4899", fiyatRenk: "#ffffff", fiyatFont: "Lilita One", eskiRenk: "#a78bfa", rozetZemin: "#22c55e", rozetRenk: "#ffffff" };
                const urunler = c.urunler(["Sütlü Çikolata", "Kremalı Bisküvi", "Portakal Suyu", "Tam Yağlı Süt", "Muz", "Kırmızı Elma", "Kavrulmuş Fındık", "Tereyağlı Kruvasan", "Çilek"]);
                // Her kartın görsel dairesi başka bir pastel
                const kartlar = izgara(urunler, { x: 34, y: 330, w: 726, h: 680 }, 3, 3, 16, stil);
                kartlar.forEach((k, i) => { k.stil.gorselZemin = PASTEL[i % PASTEL.length]; });
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#e0f2fe", k: 0 }, { r: "#fdf2f8", k: 45 }, { r: "#fff7ed", k: 100 }] }, desen: { tur: "konfeti", renk: "#a855f7", opak: 0.12, olcek: 1 } },
                    ogeler: [
                        ...bulut(36, 36, 1), ...bulut(624, 64, 0.9), ...bulut(560, 236, 0.55),
                        M("gorsel", { emoji: "🎒", x: 34, y: 176, w: 96, h: 96, aci: -10 }),
                        M("gorsel", { emoji: "☀️", x: 676, y: 168, w: 86, h: 86 }),
                        ortaMetin({ x: 0, y: 44, w: 794, metin: "OKULA DÖNÜŞ FIRSATLARI", font: "Fredoka", kalin: 700, boyut: 22, harf: 120, dolgu: "#f97316" }),
                        ortaMetin({ x: 0, y: 92, w: 794, metin: "Beslenme\nÇantası", font: "Baloo 2", kalin: 800, boyut: 80, satir: 0.92, dolgu: mor, kontur: { k: 5, renk: "#ffffff" }, derinlik: { k: 6, aci: 90, renk: "#f9a8d4" } }),
                        ortaMetin({ x: 0, y: 284, w: 794, metin: "Minik kahramanlar için lezzetli ve uygun seçimler", font: "Fredoka", kalin: 600, boyut: 17, dolgu: "#7c3aed" }),
                        ...kartlar,
                        sekil({ ad: "Alt dalga", sekil: "dalga", x: 0, y: 1028, w: 794, h: 95, dolgu: "#c4b5fd", oran: 0.5, uc: 5 }),
                        sekil({ ad: "Alt dalga", sekil: "dalga", x: 0, y: 1052, w: 794, h: 71, dolgu: mor, oran: 0.5, uc: 4 }),
                        ortaMetin({ x: 0, y: 1080, w: 794, metin: `${buyuk(m.ad)} • ${m.telefon}`, font: "Fredoka", kalin: 700, boyut: 16, dolgu: "#ffffff" })
                    ]
                }];
            }
        },
        {
            id: "raf-etiketi", ad: "Raf Etiketleri", etiket: "A4 • 24'lü", boyut: A4, renk: "#334155",
            olustur(c) {
                const stil = { duzen: "raf", kart: "#ffffff", kenar: "#cbd5e1", kalinlik: 0.5, kose: 0, kartGolge: false, fiyatZemin: "#e30613", fiyatRenk: "#ffffff", adRenk: "#111111", fiyatFont: "Anton", adFont: "Inter", adKalin: 800 };
                return [{ arka: { dolgu: "#ffffff" }, ogeler: izgara(c.urunler({ adet: 24 }), { x: 20, y: 20, w: 754, h: 1083 }, 3, 8, 0, stil) }];
            }
        },
        {
            id: "gunun-firsati", ad: "Günün Fırsatı", etiket: "Instagram", boyut: { g: 1080, y: 1080 }, renk: "#ffd400",
            olustur(c) {
                const u = c.urunler(["Tam Yağlı Süt"])[0];
                const urunId = u.id || null;
                return [{
                    arka: { dolgu: { tip: "isin", renk1: "#ffd400", renk2: "#ffc300", sayi: 36, x: 50, y: 55 } },
                    ogeler: [
                        sekil({ sekil: "elips", x: 190, y: 230, w: 600, h: 600, dolgu: { tip: "dairesel", duraklar: [{ r: "#fff6c2", k: 0 }, { r: "rgba(255,214,0,0)", k: 70 }] } }),
                        sekil({ sekil: "paralel", x: 150, y: 50, w: 780, h: 130, oran: 0.35, dolgu: "#e30613", golge: { x: 0, y: 10, b: 0, renk: "#8b0010" } }),
                        ortaMetin({ x: 150, y: 57, w: 780, metin: "GÜNÜN FIRSATI", font: "Anton", boyut: 96, harf: 30, dolgu: "#ffffff" }),
                        M("gorsel", { emoji: (u.gorsel && u.gorsel.emoji) || "🛒", varlik: u.gorsel && u.gorsel.varlik, x: 230, y: 240, w: 540, h: 540, sigdir: "sigdir" }),
                        M("fiyat", { x: 650, y: 560, w: 380, h: 380, sekil: "patlama", zemin: "#e30613", renk: "#ffffff", ust: "SADECE", fiyat: u.fiyat, eski: u.eski, eskiRenk: "#ffe4e6", aci: -10, golge: { x: 0, y: 12, b: 24, renk: "rgba(0,0,0,.25)" }, cizgi: { k: 6, renk: "#ffffff" }, urunId }),
                        metin({ x: 64, y: 822, w: 620, metin: u.ad, font: "Archivo Black", boyut: 62, satir: 1.1, dolgu: "#1d1d1f", vurgu: { renk: "#ffffff", bosluk: 12, yaricap: 10 } }),
                        metin({ x: 64, y: 924, w: 620, metin: u.aciklama, font: "Inter", kalin: 700, boyut: 34, dolgu: "#7a2e00" }),
                        metin({ x: 64, y: 994, w: 960, metin: `${buyuk(c.marka.ad)}  •  ${c.marka.telefon}`, font: "Inter", kalin: 800, boyut: 26, harf: 40, dolgu: "#1d1d1f" })
                    ]
                }];
            }
        },
        {
            id: "hikaye", ad: "Kampanya Hikâyesi", etiket: "Hikâye", boyut: { g: 1080, y: 1920 }, renk: "#c026d3",
            olustur(c) {
                const stil = { duzen: "yatay", kart: "#ffffff", kose: 8, fiyatZemin: "#ff3d6e", fiyatRenk: "#ffffff", adFont: "Poppins", adKalin: 800, fiyatFont: "Anton", rozetZemin: "#ffd400", rozetRenk: "#6c47ff" };
                const urunler = c.urunler(["Kola", "Sütlü Çikolata", "Kavrulmuş Fındık"]);
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 160, duraklar: [{ r: "#6c47ff", k: 0 }, { r: "#c026d3", k: 55 }, { r: "#ff3d6e", k: 100 }] }, desen: { tur: "konfeti", renk: "#ffffff", opak: 0.18, olcek: 1.6 } },
                    ogeler: [
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 310, y: 110, w: 460, h: 70, kose: 35, dolgu: "rgba(255,255,255,.18)" }),
                            ortaMetin({ x: 310, y: 126, w: 460, metin: buyuk(c.marka.ad), font: "Inter", kalin: 800, boyut: 30, harf: 150, dolgu: "#ffffff" })),
                        ortaMetin({ x: 0, y: 220, w: 1080, metin: "KAÇIRMA!", font: "Bangers", boyut: 200, dolgu: "#ffffff", derinlik: { k: 14, aci: 60, renk: "#3b0764" }, aci: -5 }),
                        ortaMetin({ x: 0, y: 486, w: 1080, metin: "Hafta sonuna özel fiyatlar", font: "Inter", kalin: 800, boyut: 50, dolgu: "#fde68a" }),
                        ...urunler.map((u, i) => kart(u, 90, 600 + i * 350, 900, 320, stil)),
                        sekil({ sekil: "yuvarlak", x: 190, y: 1690, w: 700, h: 120, kose: 60, dolgu: "#ffffff", golge: { x: 0, y: 14, b: 30, renk: "rgba(0,0,0,.25)" } }),
                        ortaMetin({ x: 190, y: 1722, w: 700, metin: "Hemen mağazaya gel  →", font: "Inter", kalin: 900, boyut: 46, dolgu: "#6c47ff" })
                    ]
                }];
            }
        },
        {
            id: "haftanin-yildizlari", ad: "Haftanın Yıldızları", etiket: "Instagram dikey", boyut: { g: 1080, y: 1350 }, renk: "#a3e635",
            olustur(c) {
                const m = c.marka, gece = "#1e1b4b", limon = "#d9f99d";
                const stil = { duzen: "klasik", kart: "#ffffff", kose: 30, kartGolge: true, adFont: "Outfit", adKalin: 700, adRenk: gece, aciklamaRenk: "#6b7280", fiyatZemin: gece, fiyatRenk: limon, fiyatFont: "Archivo Black", eskiRenk: "#9ca3af", rozetZemin: "#a3e635", rozetRenk: gece };
                const urunler = c.urunler(["Çilek", "Avokado", "Süzme Bal", "Kavrulmuş Fındık"]);
                return [{
                    arka: { dolgu: "#ece7ff" },
                    ogeler: [
                        sekil({ sekil: "elips", x: 640, y: -160, w: 560, h: 560, dolgu: limon }),
                        sekil({ sekil: "elips", x: -180, y: 1010, w: 520, h: 520, dolgu: "#c4b5fd" }),
                        sekil({ sekil: "yildiz", x: 860, y: 110, w: 130, h: 130, uc: 4, ic: 0.38, dolgu: gece, aci: 12 }),
                        sekil({ sekil: "yildiz", x: 788, y: 258, w: 60, h: 60, uc: 4, ic: 0.38, dolgu: "#7c3aed", aci: -8 }),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 70, y: 70, w: 320, h: 56, kose: 28, dolgu: gece }),
                            ortaMetin({ x: 70, y: 84, w: 320, metin: buyuk(m.ad), font: "Outfit", kalin: 700, boyut: 22, harf: 120, dolgu: limon })),
                        metin({ x: 64, y: 150, w: 760, metin: "Haftanın\nyıldızları", font: "Outfit", kalin: 800, boyut: 116, satir: 0.92, harf: -20, dolgu: gece }),
                        metin({ x: 70, y: 380, w: 700, metin: `${c.hafta} • Kaçırmayın!`, font: "Outfit", kalin: 600, boyut: 28, dolgu: "#5b21b6" }),
                        ...izgara(urunler, { x: 70, y: 450, w: 940, h: 790 }, 2, 2, 28, stil),
                        ortaMetin({ x: 0, y: 1272, w: 1080, metin: `${m.telefon}  •  ${m.web}`, font: "Outfit", kalin: 700, boyut: 24, dolgu: gece })
                    ]
                }];
            }
        },
        {
            id: "flas-urun", ad: "Flaş Ürün", etiket: "Hikâye", boyut: { g: 1080, y: 1920 }, renk: "#facc15",
            olustur(c) {
                const m = c.marka, sari = "#facc15", gece = "#0b0b0b";
                const u = c.urunler(["Ayçiçek Yağı"])[0], urunId = u.id || null;
                return [{
                    arka: { dolgu: { tip: "dairesel", x: 50, y: 42, duraklar: [{ r: "#3a3a3a", k: 0 }, { r: gece, k: 70 }] }, desen: { tur: "isin", renk: "#ffffff", opak: 0.035, olcek: 1 } },
                    ogeler: [
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 320, y: 110, w: 440, h: 70, kose: 35, dolgu: "rgba(255,255,255,.1)", cizgi: { k: 2, renk: "rgba(255,255,255,.25)" } }),
                            ortaMetin({ x: 320, y: 127, w: 440, metin: buyuk(m.ad), font: "Inter", kalin: 800, boyut: 28, harf: 160, dolgu: "#ffffff" })),
                        ortaMetin({ x: 0, y: 214, w: 1080, metin: "⚡ FLAŞ ÜRÜN ⚡", font: "Bebas Neue", boyut: 170, dolgu: sari, golgeler: [{ x: 0, y: 0, b: 40, renk: "rgba(250,204,21,.55)" }] }),
                        ...grup(
                            sekil({ sekil: "paralel", x: 320, y: 432, w: 440, h: 80, oran: 0.35, dolgu: "#ef4444" }),
                            ortaMetin({ x: 320, y: 447, w: 440, metin: "SON 24 SAAT", font: "Inter", kalin: 900, boyut: 40, harf: 80, dolgu: "#ffffff" })),
                        sekil({ ad: "Işık", sekil: "elips", x: 140, y: 560, w: 800, h: 800, dolgu: { tip: "dairesel", duraklar: [{ r: "rgba(255,255,255,.16)", k: 0 }, { r: "rgba(255,255,255,0)", k: 70 }] } }),
                        sekil({ ad: "Zemin ışığı", sekil: "elips", x: 190, y: 1170, w: 700, h: 120, dolgu: { tip: "dairesel", duraklar: [{ r: "rgba(250,204,21,.45)", k: 0 }, { r: "rgba(250,204,21,0)", k: 70 }] } }),
                        M("gorsel", { emoji: (u.gorsel && u.gorsel.emoji) || "🛒", varlik: u.gorsel && u.gorsel.varlik, x: 240, y: 560, w: 600, h: 640, sigdir: "sigdir" }),
                        M("fiyat", { x: 650, y: 950, w: 380, h: 380, sekil: "daire", zemin: sari, renk: gece, ust: "SADECE", fiyat: u.fiyat, eski: u.eski, eskiRenk: "#3f3f46", aci: -8, cizgi: { k: 8, renk: gece }, golge: { x: 0, y: 14, b: 30, renk: "rgba(0,0,0,.5)" }, urunId }),
                        ortaMetin({ x: 60, y: 1340, w: 960, metin: u.ad, font: "Archivo Black", boyut: 88, satir: 1.05, dolgu: "#ffffff" }),
                        ortaMetin({ x: 60, y: 1460, w: 960, metin: u.aciklama, font: "Inter", kalin: 600, boyut: 40, dolgu: "#a1a1aa" }),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 160, y: 1630, w: 760, h: 130, kose: 65, dolgu: sari, golge: { x: 0, y: 14, b: 30, renk: "rgba(250,204,21,.3)" } }),
                            ortaMetin({ x: 160, y: 1664, w: 760, metin: "Hemen mağazaya gel  →", font: "Inter", kalin: 900, boyut: 48, dolgu: gece })),
                        ortaMetin({ x: 0, y: 1806, w: 1080, metin: `${m.telefon}  •  ${m.web}`, font: "Inter", kalin: 600, boyut: 28, dolgu: "#a1a1aa" })
                    ]
                }];
            }
        },
        {
            id: "ekran", ad: "Mağaza Ekranı", etiket: "16:9 ekran", boyut: { g: 1920, y: 1080 }, renk: "#0f172a",
            olustur(c) {
                const stil = { duzen: "klasik", kart: "#ffffff", kose: 6, fiyatZemin: "#e30613", fiyatRenk: "#ffffff", rozetZemin: "#ffd400", rozetRenk: "#e30613", adFont: "Inter", adKalin: 800, fiyatFont: "Anton" };
                const urunler = c.urunler(["Ayçiçek Yağı", "Dana Kıyma", "Köy Yumurtası", "Siyah Çay"]);
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 120, duraklar: [{ r: "#0f172a", k: 0 }, { r: "#1e293b", k: 100 }] }, desen: { tur: "cizgi", renk: "#ffffff", opak: 0.03, olcek: 2 } },
                    ogeler: [
                        metin({ x: 90, y: 70, w: 1300, metin: "BUGÜNE ÖZEL FİYATLAR", font: "Anton", boyut: 120, dolgu: "#ffd400" }),
                        metin({ x: 94, y: 226, w: 1300, metin: "Kasalarımızda geçerlidir • Stoklarla sınırlıdır", font: "Inter", kalin: 600, boyut: 34, dolgu: "#cbd5e1" }),
                        ...izgara(urunler, { x: 90, y: 320, w: 1740, h: 640 }, 4, 1, 20, stil),
                        metin({ x: 90, y: 996, w: 1740, metin: `${buyuk(c.marka.ad)}  •  ${c.marka.web}`, font: "Inter", kalin: 800, boyut: 30, harf: 60, dolgu: "#ffffff" })
                    ]
                }];
            }
        },
        {
            id: "kara-tahta", ad: "Kara Tahta Menü", etiket: "16:9 ekran", boyut: { g: 1920, y: 1080 }, renk: "#2d3b33",
            olustur(c) {
                const m = c.marka, tebesir = "#f4f1e8", sari = "#f6d365";
                const stil = { duzen: "yatay", kart: "rgba(255,255,255,.04)", kenar: "rgba(244,241,232,.45)", kalinlik: 2, kose: 18, kartGolge: false, adFont: "Caveat", adKalin: 700, adOlcek: 150, adRenk: tebesir, aciklamaRenk: "#c9d3c4", fiyatZemin: sari, fiyatRenk: "#24302a", fiyatFont: "Amatic SC", fiyatOlcek: 150, eskiRenk: "#a7b5a2", rozetZemin: "#f28c8c", rozetRenk: "#24302a" };
                const urunler = c.urunler(["Tam Buğday Ekmeği", "Tereyağlı Kruvasan", "Türk Kahvesi", "Siyah Çay", "Kremalı Bisküvi", "Sütlü Çikolata"]);
                return [{
                    arka: { dolgu: { tip: "dairesel", x: 50, y: 45, duraklar: [{ r: "#34463c", k: 0 }, { r: "#1d2722", k: 80 }] }, desen: { tur: "vinyet", renk: "rgba(0,0,0,.55)", opak: 1, olcek: 1 } },
                    ogeler: [
                        sekil({ ad: "Ahşap çerçeve", x: 0, y: 0, w: 1920, h: 1080, dolgu: "rgba(0,0,0,0)", cizgi: { k: 34, renk: "#6b4423" } }),
                        sekil({ ad: "Çerçeve iç kenarı", x: 32, y: 32, w: 1856, h: 1016, dolgu: "rgba(0,0,0,0)", cizgi: { k: 4, renk: "#3d2614" } }),
                        ortaMetin({ x: 0, y: 64, w: 1920, metin: "Fırından Taze", font: "Amatic SC", kalin: 700, boyut: 140, dolgu: tebesir, golgeler: [{ x: 0, y: 0, b: 6, renk: "rgba(244,241,232,.35)" }] }),
                        ortaMetin({ x: 0, y: 236, w: 1920, metin: "~ günün menüsü ~", font: "Caveat", kalin: 700, boyut: 54, dolgu: sari }),
                        M("gorsel", { emoji: "☕", x: 360, y: 96, w: 110, h: 110, aci: -12, opak: 0.9 }),
                        M("gorsel", { emoji: "🥐", x: 1450, y: 96, w: 110, h: 110, aci: 12, opak: 0.9 }),
                        ...izgara(urunler, { x: 120, y: 340, w: 1680, h: 590 }, 3, 2, 30, stil),
                        sekil({ sekil: "cizgi", x: 560, y: 952, w: 800, h: 10, cizgi: { k: 2, renk: "rgba(244,241,232,.4)", kesik: 1 } }),
                        ortaMetin({ x: 0, y: 972, w: 1920, metin: `Afiyet olsun! • ${m.ad} • ${m.telefon}`, font: "Caveat", kalin: 700, boyut: 44, dolgu: tebesir })
                    ]
                }];
            }
        }
    ];

    // ── Şablon bağlamı ──────────────────────────────────────────
    // kaynak: ürünlerin alınacağı liste (belgedekiler ya da örnekler)
    function baglam(marka, kaynak) {
        const kullanilan = [];
        const al = (u) => { if (!kullanilan.includes(u)) kullanilan.push(u); return u; };
        return {
            marka,
            hafta: haftaMetni(6),
            hafta2: haftaMetni(1),
            haftaYil: haftaMetni(6, true),
            kullanilan,
            urunler(istek) {
                if (Array.isArray(istek)) {
                    return istek.map((ad) => kaynak.find((u) => u.ad === ad) || KS.ORNEK_URUNLER.find((u) => u.ad === ad)).filter(Boolean).map(al);
                }
                const { kategori, adet = 9 } = istek || {};
                let l = kaynak.filter((u) => !kategori || u.kategori === kategori);
                if (l.length < adet) l = l.concat(kaynak.filter((u) => !l.includes(u)));
                return l.slice(0, adet).map(al);
            }
        };
    }
    function ornekKaynak() { return KS.ornekUrunler(); }

    // Şablonun sayfalarını üretir. urunKaynak verilmezse örnek ürünler kullanılır.
    function uret(sablon, { marka, urunKaynak } = {}) {
        const kaynak = urunKaynak || ornekKaynak();
        const c = baglam(marka || KS.model.markaVarsayilan(), kaynak);
        const sayfalar = sablon.olustur(c).map((s) => {
            const sayfa = KS.model.yeniSayfa({ arka: Object.assign({ dolgu: "#ffffff", resim: null, desen: null }, s.arka) });
            sayfa.ogeler = s.ogeler.map(KS.model.normallestir);
            return sayfa;
        });
        return { sayfalar, urunler: c.kullanilan };
    }

    // Boyut farklıysa sayfa içeriğini yeni boyuta orantılı olarak sığdırır
    function sayfayiUyarla(s, g1, y1, g2, y2) {
        if (g1 === g2 && y1 === y2) return s;
        const k = Math.min(g2 / g1, y2 / y1), dx = (g2 - g1 * k) / 2, dy = (y2 - y1 * k) / 2;
        for (const o of s.ogeler) {
            const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
            KS.model.olcekle(o, k);
            o.x = cx * k + dx - o.w / 2; o.y = cy * k + dy - o.h / 2;
        }
        return s;
    }

    // Belgeye ürünleri ekler; aynı adlı ürün varsa onu kullanır. Kartların urunId'lerini eşler.
    function urunleriBelgeyeKat(belge, sayfalar, urunler) {
        const esle = new Map();
        for (const u of urunler) {
            let mevcut = belge.urunler.find((x) => x.ad === u.ad);
            if (!mevcut) { mevcut = Object.assign(KS.kopya(u), { id: u.id || KS.kimlik("u") }); belge.urunler.push(mevcut); }
            esle.set(u.id, mevcut);
        }
        for (const s of sayfalar) for (const o of s.ogeler) {
            if ((o.tur === "urun" || o.tur === "fiyat") && o.urunId && esle.has(o.urunId)) {
                const u = esle.get(o.urunId);
                o.urunId = u.id;
                if (o.tur === "urun") o.veri = urunVeri(u);
            }
        }
    }

    // ── Otomatik yerleşim ───────────────────────────────────────
    // Sayfadaki ürün kartlarından alanı, ızgarayı ve kart stilini çıkarır
    function sayfaDuzeni(s, belge) {
        const kartlar = s.ogeler.filter((o) => o.tur === "urun");
        const W = belge.genislik, H = belge.yukseklik;
        if (!kartlar.length) {
            return { alan: { x: Math.round(W * 0.04), y: Math.round(H * 0.24), w: Math.round(W * 0.92), h: Math.round(H * 0.68) }, sutun: W > H ? 4 : 3, satir: W > H ? 2 : 3, bosluk: 14, stil: null, kartSayisi: 0 };
        }
        const alan = KS.kutuBirlesim(kartlar.map(KS.kutu));
        const benzersiz = (dizi) => dizi.sort((a, b) => a - b).filter((v, i, l) => i === 0 || Math.abs(v - l[i - 1]) > 4);
        const xs = benzersiz(kartlar.map((o) => o.x)), ys = benzersiz(kartlar.map((o) => o.y));
        const sutun = Math.max(1, xs.length), satir = Math.max(1, ys.length);
        const bosluk = sutun > 1 ? Math.max(0, Math.round(xs[1] - xs[0] - kartlar[0].w)) : satir > 1 ? Math.max(0, Math.round(ys[1] - ys[0] - kartlar[0].h)) : 14;
        return { alan: { x: alan.x, y: alan.y, w: alan.w, h: alan.h }, sutun, satir, bosluk, stil: KS.kopya(kartlar[0].stil), kartSayisi: kartlar.length };
    }

    function kimlikleriYenile(s) {
        s.id = KS.kimlik("s");
        const g = new Map();
        for (const o of s.ogeler) {
            o.id = KS.kimlik("o");
            if (o.grup) { if (!g.has(o.grup)) g.set(o.grup, KS.kimlik("g")); o.grup = g.get(o.grup); }
        }
        return s;
    }

    // Ürünleri, kaynak sayfanın tasarımıyla (arka plan, başlık, alt bilgi) gerektiği kadar sayfaya dağıtır.
    // gruplar: [{ ad, urunler }] — her grup yeni sayfadan başlar (ör. kategoriye göre). İlk sayfa kaynak sayfanın kendisidir.
    function otomatikYerlesim(belge, { gruplar, kaynakId, sutun, satir, bosluk, alan, stil, oncekileriSil = true }) {
        const kaynak = belge.sayfalar.find((s) => s.id === kaynakId);
        if (oncekileriSil) belge.sayfalar = belge.sayfalar.filter((s) => s.otomatik !== kaynak.id);
        // Kartlar, eski kartların katman sırasına girer: üstteki süslemeler (rozet, fiyat etiketi) üstte kalır
        const ilkKart = kaynak.ogeler.findIndex((o) => o.tur === "urun");
        const sira = ilkKart < 0 ? kaynak.ogeler.filter((o) => o.tur !== "urun").length : kaynak.ogeler.slice(0, ilkKart).filter((o) => o.tur !== "urun").length;
        const sablonSayfa = KS.kopya(kaynak);
        sablonSayfa.ogeler = sablonSayfa.ogeler.filter((o) => o.tur !== "urun");
        delete sablonSayfa.otomatik;
        const adet = Math.max(1, sutun * satir);
        const parcalar = [];
        for (const g of gruplar) for (let i = 0; i < g.urunler.length; i += adet) parcalar.push({ ad: g.ad, urunler: g.urunler.slice(i, i + adet) });
        if (!parcalar.length) parcalar.push({ ad: "", urunler: [] });
        const yeniler = [];
        parcalar.forEach((p, i) => {
            let s;
            if (i === 0) { s = kaynak; s.ogeler = s.ogeler.filter((o) => o.tur !== "urun"); }
            else { s = kimlikleriYenile(KS.kopya(sablonSayfa)); s.otomatik = kaynak.id; yeniler.push(s); }
            if (p.ad && gruplar.length > 1) s.ad = p.ad;
            s.ogeler.splice(sira, 0, ...izgara(p.urunler, alan, sutun, satir, bosluk, stil));
        });
        const konum = belge.sayfalar.indexOf(kaynak);
        belge.sayfalar.splice(konum + 1, 0, ...yeniler);
        return { sayfaSayisi: yeniler.length + 1, urunSayisi: parcalar.reduce((t, p) => t + p.urunler.length, 0) };
    }

    KS.SABLONLAR = SABLONLAR;
    // Galeri filtresi: baskı (A4), sosyal medya, ekran. Şablon "kategori" ile açıkça belirtebilir (ör. dikey mağaza ekranı).
    KS.sablonKategori = (t) => t.kategori || (t.boyut.g === 1920 && t.boyut.y === 1080 ? "ekran" : t.boyut.g === 794 ? "A4" : "sosyal");
    KS.sablon = {
        uret, sayfayiUyarla, urunleriBelgeyeKat, izgara, kart, urunVeri, sayfaDuzeni, otomatikYerlesim, kimlikleriYenile, haftaMetni,
        yardim: { M, metin, sekil, ortaMetin, grup, buyuk, A4 }   // ek şablon dosyaları için
    };
})();
