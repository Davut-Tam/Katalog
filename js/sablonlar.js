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
    KS.sablon = { uret, sayfayiUyarla, urunleriBelgeyeKat, izgara, kart, urunVeri, sayfaDuzeni, otomatikYerlesim, kimlikleriYenile, haftaMetni };
})();
