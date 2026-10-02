// Ek şablonlar: mevsimler, özel günler, sanat akımları ve farklı dokularla yaratıcı tasarımlar; sosyal medya
// gönderileri (tarif kartı, çekiliş, fiyat düştü…) ve mağaza ekranları (fiyat borsası, QR'lı karşılama…).
// Şablon yapısı ve yardımcılar js/sablonlar.js'tekiyle aynıdır; liste en sonda kategoriye göre (baskı, sosyal, ekran) sıralanır.
(function () {
    "use strict";
    const KS = window.KS;
    const { M, metin, sekil, ortaMetin, grup, buyuk, A4 } = KS.sablon.yardim;
    const { izgara, kart } = KS.sablon;
    const seffaf = "rgba(0,0,0,0)";
    const emoji = (e, x, y, s, oz = {}) => M("gorsel", Object.assign({ emoji: e, x, y, w: s, h: s }, oz));
    const urunGorseli = (u, x, y, w, h, oz = {}) => M("gorsel", Object.assign({ emoji: (u.gorsel && u.gorsel.emoji) || "🛒", varlik: u.gorsel && u.gorsel.varlik, x, y, w, h, sigdir: "sigdir" }, oz));
    const cizgiDikey = (x, y, uz, k, renk) => sekil({ sekil: "cizgi", x: x - uz / 2, y: y + uz / 2 - 5, w: uz, h: 10, aci: 90, cizgi: { k, renk } });
    const parlakTop = (renk) => ({ tip: "dairesel", x: 35, y: 30, duraklar: [{ r: "#ffffff", k: 0 }, { r: renk, k: 42 }, { r: KS.renkKarart(renk, 0.4), k: 100 }] });

    const EK = [
        // ── Baskı (A4) ──────────────────────────────────────────
        {
            id: "bahar", ad: "Bahar Esintisi", etiket: "A4", boyut: A4, renk: "#ec4899",
            olustur(c) {
                const m = c.marka, pembe = "#be185d";
                const stil = { duzen: "daire", kart: "#ffffff", kose: 24, kartGolge: true, adFont: "Montserrat", adKalin: 700, adRenk: "#3f1d2b", aciklamaRenk: "#9d7486", fiyatZemin: pembe, fiyatRenk: "#ffffff", fiyatFont: "Paytone One", eskiRenk: "#c48aa3", rozetZemin: "#86efac", rozetRenk: "#14532d" };
                const kartlar = izgara(c.urunler({ kategori: "Meyve & Sebze", adet: 9 }), { x: 40, y: 292, w: 714, h: 720 }, 3, 3, 16, stil);
                kartlar.forEach((k, i) => { k.stil.gorselZemin = ["#fce7f3", "#dcfce7", "#fef9c3"][i % 3]; });
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#fff1f5", k: 0 }, { r: "#f0fdf4", k: 100 }] }, desen: { tur: "nokta2", renk: "#f9a8d4", opak: 0.14, olcek: 1 } },
                    ogeler: [
                        emoji("🌸", 18, 14, 110, { aci: -14 }), emoji("🌷", 664, 26, 96, { aci: 12 }), emoji("🌿", 36, 186, 70, { aci: -30 }),
                        emoji("🌼", 690, 182, 64, { aci: 18 }), emoji("🌸", 600, 120, 44, { aci: 30, opak: 0.8 }), emoji("🌸", 150, 140, 36, { aci: -20, opak: 0.8 }),
                        ortaMetin({ x: 0, y: 50, w: 794, metin: "Bahar", font: "Dancing Script", kalin: 700, boyut: 112, dolgu: pembe, golgeler: [{ x: 0, y: 4, b: 12, renk: "rgba(190,24,93,.18)" }] }),
                        ortaMetin({ x: 0, y: 190, w: 794, metin: "ESİNTİSİ", font: "Montserrat", kalin: 800, boyut: 26, harf: 600, dolgu: "#15803d" }),
                        ortaMetin({ x: 0, y: 238, w: 794, metin: "Mevsimin ilk tazeleri, en uygun fiyatlarla", font: "Montserrat", kalin: 600, boyut: 15, dolgu: "#6b7280" }),
                        ...kartlar,
                        ortaMetin({ x: 0, y: 1030, w: 794, metin: "Baharı sofranıza taşıyın", font: "Dancing Script", kalin: 700, boyut: 32, dolgu: pembe }),
                        ortaMetin({ x: 0, y: 1084, w: 794, metin: `${buyuk(m.ad)}  •  ${m.telefon}  •  ${c.hafta}`, font: "Montserrat", kalin: 700, boyut: 11, harf: 100, dolgu: "#6b7280" })
                    ]
                }];
            }
        },
        {
            id: "yaz", ad: "Yaz Serinliği", etiket: "A4", boyut: A4, renk: "#0ea5e9",
            olustur(c) {
                const m = c.marka, lacivert = "#0c4a6e";
                const stil = { duzen: "klasik", kart: "#ffffff", kose: 18, kartGolge: true, adFont: "Nunito", adKalin: 800, adRenk: lacivert, aciklamaRenk: "#64748b", fiyatZemin: "#f97316", fiyatRenk: "#ffffff", fiyatFont: "Lilita One", eskiRenk: "#94a3b8", rozetZemin: "#0ea5e9", rozetRenk: "#ffffff" };
                const urunler = c.urunler(["Kola", "Portakal Suyu", "Doğal Maden Suyu", "Çilek", "Üzüm", "Limon", "Muz", "Kremalı Bisküvi", "Sütlü Çikolata"]);
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#38bdf8", k: 0 }, { r: "#bae6fd", k: 30 }, { r: "#fef9e7", k: 60 }, { r: "#fde9b6", k: 100 }] } },
                    ogeler: [
                        sekil({ ad: "Güneş", sekil: "elips", x: 590, y: 30, w: 160, h: 160, dolgu: "#fde047", golge: { x: 0, y: 0, b: 40, renk: "rgba(253,224,71,.8)" } }),
                        emoji("🌴", 6, 40, 170, { aci: -6 }), emoji("🍉", 650, 170, 90, { aci: 16 }), emoji("🕶️", 626, 84, 88, { aci: -8 }),
                        ortaMetin({ x: 0, y: 40, w: 794, metin: "Yaz", font: "Pacifico", boyut: 96, dolgu: "#ffffff", golgeler: [{ x: 0, y: 5, b: 0, renk: "#0369a1" }] }),
                        ortaMetin({ x: 0, y: 176, w: 794, metin: "SERİNLİĞİ", font: "Lilita One", boyut: 62, harf: 80, dolgu: lacivert }),
                        sekil({ ad: "Dalga", sekil: "dalga", x: 0, y: 256, w: 794, h: 40, dolgu: "rgba(255,255,255,.55)", oran: 0.8, uc: 5 }),
                        ...izgara(urunler, { x: 34, y: 298, w: 726, h: 708 }, 3, 3, 14, stil),
                        ortaMetin({ x: 0, y: 1028, w: 794, metin: "Serinleten fiyatlar bütün yaz sürüyor!", font: "Pacifico", boyut: 26, dolgu: "#ea580c" }),
                        ortaMetin({ x: 0, y: 1084, w: 794, metin: `${buyuk(m.ad)}  •  ${m.telefon}`, font: "Nunito", kalin: 800, boyut: 13, harf: 100, dolgu: lacivert })
                    ]
                }];
            }
        },
        {
            id: "kis", ad: "Kış Fırsatları", etiket: "A4", boyut: A4, renk: "#1e4976",
            olustur(c) {
                const m = c.marka, gece = "#0f2a4a";
                const stil = { duzen: "klasik", kart: "#f8fbff", kose: 14, kartGolge: true, adFont: "Quicksand", adKalin: 700, adRenk: gece, aciklamaRenk: "#64748b", fiyatZemin: "#1e4976", fiyatRenk: "#ffffff", fiyatFont: "Righteous", eskiRenk: "#94a3b8", rozetZemin: "#bae6fd", rozetRenk: gece };
                const urunler = c.urunler(["Siyah Çay", "Türk Kahvesi", "Süzme Bal", "Sütlü Çikolata", "Tereyağı", "Tam Yağlı Süt", "Kavrulmuş Fındık", "Portakal", "Limon"]);
                const kar = [[30, 30, 60], [140, 210, 34], [690, 40, 70], [610, 200, 40], [470, 60, 28], [250, 70, 30], [730, 160, 30]];
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: gece, k: 0 }, { r: "#1e4976", k: 100 }] }, desen: { tur: "yildizlar", renk: "#ffffff", opak: 0.07, olcek: 0.8 } },
                    ogeler: [
                        ...kar.map(([x, y, s], i) => emoji("❄️", x, y, s, { aci: i * 17, opak: 0.85 })),
                        ortaMetin({ x: 0, y: 40, w: 794, metin: "Kış", font: "Comfortaa", kalin: 700, boyut: 120, dolgu: "#ffffff", golgeler: [{ x: 0, y: 0, b: 24, renk: "rgba(186,230,253,.6)" }] }),
                        ortaMetin({ x: 0, y: 190, w: 794, metin: "FIRSATLARI", font: "Quicksand", kalin: 700, boyut: 34, harf: 500, dolgu: "#bae6fd" }),
                        ortaMetin({ x: 0, y: 244, w: 794, metin: "Sıcacık lezzetler, içinizi ısıtan fiyatlar", font: "Quicksand", kalin: 600, boyut: 16, dolgu: "#e0f2fe" }),
                        ...izgara(urunler, { x: 36, y: 292, w: 722, h: 712 }, 3, 3, 14, stil),
                        sekil({ ad: "Kar zemini", sekil: "dalga", x: 0, y: 1016, w: 794, h: 107, dolgu: "#ffffff", oran: 0.35, uc: 3 }),
                        ortaMetin({ x: 0, y: 1062, w: 794, metin: `${buyuk(m.ad)}  •  ${m.telefon}  •  ${m.web}`, font: "Quicksand", kalin: 700, boyut: 14, harf: 80, dolgu: gece })
                    ]
                }];
            }
        },
        {
            id: "yilbasi", ad: "Yeni Yıl Sofrası", etiket: "A4", boyut: A4, renk: "#b91c1c",
            olustur(c) {
                const m = c.marka, altin = "#e6c36a";
                const altinDolgu = { tip: "dogrusal", aci: 180, duraklar: [{ r: "#fff1c1", k: 0 }, { r: altin, k: 55 }, { r: "#a8802f", k: 100 }] };
                const stil = { duzen: "serit", kart: "#fffaf3", kose: 10, kartGolge: true, adFont: "Playfair Display", adKalin: 700, adRenk: "#3b0d0d", aciklamaRenk: "#7f5f4a", fiyatZemin: "#b91c1c", fiyatRenk: "#ffffff", fiyatFont: "Playfair Display", rozetZemin: altin, rozetRenk: "#3b0d0d" };
                const urunler = c.urunler(["Sütlü Çikolata", "Kavrulmuş Fındık", "Kola", "Süzme Bal", "Beyaz Peynir", "Tereyağlı Kruvasan", "Somon Fileto", "Natürel Sızma Zeytinyağı", "Türk Kahvesi"]);
                // İpe asılı yılbaşı topları
                const top = (x, uz, r, renk) => [cizgiDikey(x, 0, uz, 1, altin), sekil({ sekil: "elips", x: x - r / 2, y: uz, w: r, h: r, dolgu: parlakTop(renk) }), sekil({ x: x - r * 0.14, y: uz - r * 0.1, w: r * 0.28, h: r * 0.16, dolgu: altin })];
                return [{
                    arka: { dolgu: { tip: "dairesel", x: 50, y: 20, duraklar: [{ r: "#145a41", k: 0 }, { r: "#072118", k: 80 }] }, desen: { tur: "yildizlar", renk: altin, opak: 0.08, olcek: 0.7 } },
                    ogeler: [
                        ...top(70, 70, 46, "#b91c1c"), ...top(140, 130, 34, altin), ...top(210, 50, 28, "#1d4ed8"),
                        ...top(590, 60, 30, altin), ...top(660, 120, 40, "#b91c1c"), ...top(730, 64, 34, "#1d4ed8"),
                        ortaMetin({ x: 0, y: 70, w: 794, metin: "Mutlu Yıllar", font: "Great Vibes", boyut: 96, dolgu: altinDolgu }),
                        ortaMetin({ x: 0, y: 198, w: 794, metin: "YENİ YIL SOFRASINA ÖZEL FİYATLAR", font: "Montserrat", kalin: 800, boyut: 15, harf: 300, dolgu: "#fde68a" }),
                        sekil({ sekil: "cizgi", x: 247, y: 236, w: 300, h: 10, cizgi: { k: 1, renk: altin } }),
                        emoji("🎁", 40, 226, 60, { aci: -10 }), emoji("🎄", 692, 218, 66),
                        ...izgara(urunler, { x: 40, y: 300, w: 714, h: 714 }, 3, 3, 16, stil),
                        ortaMetin({ x: 0, y: 1034, w: 794, metin: "Yeni yılınız kutlu olsun!", font: "Great Vibes", boyut: 34, dolgu: altin }),
                        ortaMetin({ x: 0, y: 1088, w: 794, metin: `${buyuk(m.ad)}  •  ${m.telefon}`, font: "Montserrat", kalin: 700, boyut: 11, harf: 200, dolgu: "#d1fae5" })
                    ]
                }];
            }
        },
        {
            id: "bayram", ad: "Bayram Sofrası", etiket: "A4", boyut: A4, renk: "#0f766e",
            olustur(c) {
                const m = c.marka, yesil = "#0f766e", altin = "#e9c46a";
                const stil = { duzen: "klasik", kart: "#ffffff", kose: 10, kartGolge: true, adFont: "Lora", adKalin: 700, adRenk: "#134e4a", aciklamaRenk: "#5f7f7a", fiyatZemin: yesil, fiyatRenk: "#fde68a", fiyatFont: "Playfair Display", eskiRenk: "#94a3b8", rozetZemin: altin, rozetRenk: "#134e4a" };
                const urunler = c.urunler(["Dana Kıyma", "Tavuk But", "Sucuk", "Baldo Pirinç", "Ayçiçek Yağı", "Toz Şeker", "Siyah Çay", "Türk Kahvesi", "Süzme Bal"]);
                const yildiz8 = ([x, y, s, opak]) => sekil({ sekil: "yildiz", x, y, w: s, h: s, uc: 8, ic: 0.72, dolgu: seffaf, cizgi: { k: 1.5, renk: altin }, opak });
                return [{
                    arka: { dolgu: "#fdf8ec", desen: { tur: "zikzak", renk: yesil, opak: 0.04, olcek: 1 } },
                    ogeler: [
                        sekil({ ad: "Başlık zemini", x: 0, y: 0, w: 794, h: 262, dolgu: { tip: "dogrusal", aci: 135, duraklar: [{ r: "#115e59", k: 0 }, { r: yesil, k: 100 }] } }),
                        ...[[24, 24, 80, 0.5], [100, 150, 54, 0.35], [690, 30, 80, 0.5], [630, 160, 50, 0.35], [376, 4, 40, 0.25]].map(yildiz8),
                        sekil({ ad: "Kemer", sekil: "dalga", x: 0, y: 248, w: 794, h: 30, dolgu: altin, oran: 0.9, uc: 9 }),
                        ortaMetin({ x: 0, y: 54, w: 794, metin: "Bayram Sofrası", font: "Playfair Display", kalin: 800, boyut: 72, dolgu: "#fdf8ec" }),
                        ortaMetin({ x: 0, y: 156, w: 794, metin: "Bayramınız mübarek olsun", font: "Great Vibes", boyut: 44, dolgu: altin }),
                        ...izgara(urunler, { x: 36, y: 300, w: 722, h: 712 }, 3, 3, 14, stil),
                        sekil({ ad: "Alt bilgi zemini", x: 0, y: 1034, w: 794, h: 89, dolgu: yesil }),
                        ortaMetin({ x: 0, y: 1050, w: 794, metin: buyuk(m.ad), font: "Playfair Display", kalin: 700, boyut: 22, harf: 200, dolgu: altin }),
                        ortaMetin({ x: 0, y: 1088, w: 794, metin: `${m.telefon}  •  ${c.hafta}`, font: "Inter", kalin: 600, boyut: 11, harf: 100, dolgu: "#ccfbf1" })
                    ]
                }];
            }
        },
        {
            id: "pop-art", ad: "Pop Art", etiket: "A4", boyut: A4, renk: "#ff1744",
            olustur(c) {
                const m = c.marka, siyah = "#111111";
                const stil = { duzen: "klasik", kart: "#ffffff", kenar: siyah, kalinlik: 4, kose: 0, kartGolge: false, adFont: "Bangers", adKalin: 400, adOlcek: 115, adRenk: siyah, aciklamaRenk: "#444444", fiyatZemin: "#ff1744", fiyatRenk: "#ffffff", fiyatFont: "Bangers", eskiRenk: "#555555", rozetZemin: "#00b0ff", rozetRenk: "#ffffff" };
                const urunler = c.urunler(["Kola", "Sütlü Çikolata", "Kremalı Bisküvi", "Portakal Suyu", "Kavrulmuş Fındık", "Spagetti Makarna", "Muz", "Köy Yumurtası", "Tereyağlı Kruvasan"]);
                // Çizgi roman: kalın konturlu yazılar, kartlarda keskin ofset gölge
                const kartlar = izgara(urunler, { x: 36, y: 300, w: 714, h: 700 }, 3, 3, 18, stil);
                kartlar.forEach((k) => { k.golge = { x: 8, y: 8, b: 0, renk: siyah }; });
                const kalinYazi = (oz) => metin(Object.assign({ font: "Bangers", kontur: { k: 5, renk: siyah }, golgeler: [{ x: 7, y: 7, b: 0, renk: siyah }] }, oz));
                return [{
                    arka: { dolgu: "#ffe600", desen: { tur: "nokta", renk: "#ff3d00", opak: 0.2, olcek: 0.7 } },
                    ogeler: [
                        kalinYazi({ x: 36, y: 34, w: 440, metin: "SÜPER", boyut: 130, dolgu: "#ffffff" }),
                        kalinYazi({ x: 40, y: 166, w: 460, metin: "FİYATLAR!", boyut: 92, dolgu: "#00b0ff" }),
                        ...grup(
                            sekil({ sekil: "balon", x: 470, y: 30, w: 290, h: 200, dolgu: "#ffffff", cizgi: { k: 5, renk: siyah }, aci: 4 }),
                            ortaMetin({ x: 480, y: 60, w: 270, metin: "WOW!", font: "Bangers", boyut: 96, dolgu: "#ff1744", aci: -6, kontur: { k: 3, renk: siyah } })),
                        ...kartlar,
                        sekil({ ad: "Alt bilgi zemini", x: 0, y: 1034, w: 794, h: 89, dolgu: siyah }),
                        ortaMetin({ x: 0, y: 1052, w: 794, metin: `${buyuk(m.ad)} • ${m.telefon}`, font: "Bangers", boyut: 34, harf: 60, dolgu: "#ffe600" })
                    ]
                }];
            }
        },
        {
            id: "bauhaus", ad: "Bauhaus", etiket: "A4", boyut: A4, renk: "#e63946",
            olustur(c) {
                const m = c.marka, kirmizi = "#e63946", mavi = "#1d3557", sari = "#ffb703", siyah = "#111111";
                const stil = { duzen: "minimal", kart: "#ffffff", kose: 0, kartGolge: false, adFont: "Space Grotesk", adKalin: 700, adRenk: siyah, aciklamaRenk: "#6b6b6b", fiyatZemin: kirmizi, fiyatRenk: "#ffffff", fiyatFont: "Archivo Black", eskiRenk: "#8a8a8a", rozetZemin: siyah, rozetRenk: "#ffffff" };
                const kartlar = izgara(c.urunler({ adet: 9 }), { x: 40, y: 336, w: 714, h: 680 }, 3, 3, 12, stil);
                kartlar.forEach((k, i) => { k.stil.fiyatZemin = [kirmizi, mavi, siyah][(i + Math.floor(i / 3)) % 3]; });
                return [{
                    arka: { dolgu: "#f2ede4" },
                    ogeler: [
                        sekil({ x: 0, y: 0, w: 250, h: 300, dolgu: mavi }),
                        sekil({ sekil: "elips", x: 500, y: -90, w: 380, h: 380, dolgu: kirmizi }),
                        sekil({ sekil: "ucgen", x: 190, y: 120, w: 220, h: 190, dolgu: sari }),
                        sekil({ sekil: "halka", x: 40, y: 40, w: 120, h: 120, ic: 0.55, dolgu: "#f2ede4" }),
                        sekil({ sekil: "cizgi", x: 300, y: 300, w: 454, h: 10, cizgi: { k: 6, renk: siyah } }),
                        metin({ x: 420, y: 54, w: 340, hiza: "right", metin: "Biçim\nfiyatı\nizler.", font: "Space Grotesk", kalin: 700, boyut: 62, satir: 0.98, dolgu: siyah }),
                        metin({ x: 430, y: 256, w: 330, hiza: "right", metin: buyuk(m.ad), font: "Space Grotesk", kalin: 700, boyut: 14, harf: 300, dolgu: siyah }),
                        ...kartlar,
                        sekil({ sekil: "cizgi", x: 40, y: 1030, w: 714, h: 10, cizgi: { k: 6, renk: siyah } }),
                        metin({ x: 40, y: 1054, w: 400, metin: `${m.telefon}\n${m.web}`, font: "Space Grotesk", kalin: 700, boyut: 13, satir: 1.4, dolgu: siyah }),
                        metin({ x: 400, y: 1054, w: 354, hiza: "right", metin: c.hafta, font: "Space Grotesk", kalin: 700, boyut: 13, dolgu: kirmizi })
                    ]
                }];
            }
        },
        {
            id: "organik", ad: "Organik Pazar", etiket: "A4", boyut: A4, renk: "#2f5d33",
            olustur(c) {
                const m = c.marka, yesil = "#2f5d33", kahve = "#5c4326";
                const stil = { duzen: "minimal", kart: "#f3e8d2", kenar: kahve, kalinlik: 1, kose: 4, kartGolge: false, adFont: "Patrick Hand", adKalin: 400, adOlcek: 120, adRenk: "#2b2117", aciklamaRenk: "#6b5640", fiyatZemin: yesil, fiyatRenk: "#ffffff", fiyatFont: "Kalam", eskiRenk: "#8a7558", rozetZemin: yesil, rozetRenk: "#f3e8d2" };
                const urunler = c.urunler(["Domates", "Salatalık", "Havuç", "Patates", "Brokoli", "Köy Yumurtası", "Süzme Bal", "Tam Buğday Ekmeği", "Limon"]);
                return [{
                    arka: { dolgu: "#d8c3a0", desen: { tur: "nokta", renk: kahve, opak: 0.08, olcek: 0.45 } },
                    ogeler: [
                        metin({ x: 40, y: 50, w: 520, metin: "Organik Pazar", font: "Kalam", kalin: 700, boyut: 70, dolgu: yesil }),
                        metin({ x: 44, y: 150, w: 520, metin: "Tarladan sofraya, aracısız ve katkısız", font: "Patrick Hand", boyut: 24, dolgu: kahve }),
                        emoji("🌱", 470, 132, 56, { aci: 10 }),
                        ...grup(
                            sekil({ ad: "Mühür", sekil: "muhur", x: 580, y: 34, w: 180, h: 180, uc: 24, ic: 0.9, dolgu: seffaf, cizgi: { k: 3, renk: yesil }, aci: -12 }),
                            sekil({ sekil: "elips", x: 602, y: 56, w: 136, h: 136, dolgu: seffaf, cizgi: { k: 1.5, renk: yesil, kesik: 1 }, aci: -12 }),
                            ortaMetin({ x: 590, y: 92, w: 160, metin: "%100\nDOĞAL", font: "Kalam", kalin: 700, boyut: 32, satir: 1, dolgu: yesil, aci: -12 })),
                        sekil({ sekil: "cizgi", x: 40, y: 220, w: 714, h: 10, cizgi: { k: 2, renk: kahve, kesik: 1 } }),
                        ...izgara(urunler, { x: 40, y: 246, w: 714, h: 770 }, 3, 3, 14, stil),
                        sekil({ sekil: "cizgi", x: 40, y: 1032, w: 714, h: 10, cizgi: { k: 2, renk: kahve, kesik: 1 } }),
                        ortaMetin({ x: 0, y: 1052, w: 794, metin: `${m.ad} • ${m.telefon} • ${m.adres}`, font: "Patrick Hand", boyut: 18, dolgu: "#2b2117" })
                    ]
                }];
            }
        },
        {
            id: "vintage-bakkal", ad: "Vintage Bakkal", etiket: "A4", boyut: A4, renk: "#8b1e1e",
            olustur(c) {
                const m = c.marka, yesil = "#1f3d2b", bordo = "#8b1e1e", krem = "#efe4cf";
                const stil = { duzen: "serit", kart: "#fbf6ea", kenar: yesil, kalinlik: 1.5, kose: 2, kartGolge: false, adFont: "Playfair Display", adKalin: 700, adRenk: yesil, aciklamaRenk: "#6b5f4a", fiyatZemin: yesil, fiyatRenk: krem, fiyatFont: "Alfa Slab One", rozetZemin: bordo, rozetRenk: krem };
                const urunler = c.urunler(["Toz Şeker", "Baldo Pirinç", "Siyah Çay", "Türk Kahvesi", "Ayçiçek Yağı", "Spagetti Makarna", "Siyah Zeytin", "Beyaz Peynir", "Süzme Bal"]);
                const cerceve = (p, k) => sekil({ ad: "Çerçeve", x: p, y: p, w: 794 - p * 2, h: 1123 - p * 2, dolgu: seffaf, cizgi: { k, renk: yesil } });
                const kose = (x, y) => sekil({ sekil: "cokgen", uc: 4, x: x - 9, y: y - 9, w: 18, h: 18, dolgu: bordo });
                return [{
                    arka: { dolgu: krem, desen: { tur: "yatay", renk: "#7c2d12", opak: 0.03, olcek: 1 } },
                    ogeler: [
                        cerceve(18, 3), cerceve(27, 1), kose(27, 27), kose(767, 27), kose(27, 1096), kose(767, 1096),
                        ortaMetin({ x: 0, y: 46, w: 794, metin: "— EST. 1923 —", font: "Playfair Display", kalin: 700, boyut: 13, harf: 400, dolgu: bordo }),
                        ...grup(
                            sekil({ ad: "Kurdele", sekil: "serit", x: 137, y: 78, w: 520, h: 76, oran: 0.3, dolgu: bordo, golge: { x: 0, y: 4, b: 0, renk: "#5a1212" } }),
                            ortaMetin({ x: 157, y: 88, w: 480, metin: buyuk(m.ad), font: "Alfa Slab One", boyut: 38, dolgu: krem })),
                        emoji("🌿", 66, 82, 64, { aci: -30 }), emoji("🌿", 664, 82, 64, { aci: 30, cevirX: true }),
                        ortaMetin({ x: 0, y: 166, w: 794, metin: "Mahallenin güvenilir bakkalı", font: "Playfair Display", italik: true, kalin: 600, boyut: 20, dolgu: yesil }),
                        ...izgara(urunler, { x: 52, y: 214, w: 690, h: 800 }, 3, 3, 14, stil),
                        sekil({ sekil: "cizgi", x: 197, y: 1026, w: 400, h: 10, cizgi: { k: 1, renk: yesil } }),
                        ortaMetin({ x: 0, y: 1044, w: 794, metin: `${m.telefon}  ·  ${m.adres}`, font: "Playfair Display", kalin: 600, boyut: 13, dolgu: yesil })
                    ]
                }];
            }
        },
        {
            id: "dev-kampanya", ad: "Dev Kampanya", etiket: "A4 • 16'lı", boyut: A4, renk: "#e30613",
            olustur(c) {
                const m = c.marka, kirmizi = "#e30613", sari = "#ffd400";
                const stil = { duzen: "klasik", kart: "#ffffff", kenar: "#e5e7eb", kalinlik: 1, kose: 4, kartGolge: false, adFont: "Roboto Condensed", adKalin: 700, adRenk: "#111827", aciklamaRenk: "#6b7280", fiyatZemin: kirmizi, fiyatRenk: "#ffffff", fiyatFont: "Anton", eskiRenk: "#6b7280", rozetZemin: sari, rozetRenk: kirmizi };
                return [{
                    arka: { dolgu: "#f3f4f6" },
                    ogeler: [
                        sekil({ ad: "Başlık zemini", sekil: "paralel", x: -60, y: 0, w: 914, h: 214, oran: 0.3, dolgu: kirmizi }),
                        sekil({ ad: "Sarı şerit", sekil: "paralel", x: -60, y: 206, w: 914, h: 26, oran: 0.3, dolgu: sari }),
                        metin({ x: 36, y: 16, w: 520, metin: "DEV", font: "Anton", boyut: 70, dolgu: sari }),
                        metin({ x: 36, y: 86, w: 560, metin: "KAMPANYA", font: "Anton", boyut: 96, dolgu: "#ffffff" }),
                        ...grup(
                            sekil({ sekil: "patlama", x: 586, y: 16, w: 186, h: 186, uc: 20, ic: 0.85, dolgu: sari, golge: { x: 0, y: 6, b: 14, renk: "rgba(0,0,0,.3)" } }),
                            ortaMetin({ x: 596, y: 52, w: 166, metin: "%40'A", font: "Anton", boyut: 46, dolgu: kirmizi, aci: -10 }),
                            ortaMetin({ x: 596, y: 116, w: 166, metin: "VARAN", font: "Anton", boyut: 30, dolgu: kirmizi, aci: -10 })),
                        ...izgara(c.urunler({ adet: 16 }), { x: 24, y: 248, w: 746, h: 790 }, 4, 4, 8, stil),
                        sekil({ ad: "Alt bilgi zemini", x: 0, y: 1050, w: 794, h: 73, dolgu: kirmizi }),
                        metin({ x: 24, y: 1062, w: 500, metin: `${buyuk(m.ad)} • ${m.telefon}`, font: "Roboto Condensed", kalin: 700, boyut: 18, dolgu: "#ffffff" }),
                        metin({ x: 24, y: 1090, w: 500, metin: m.adres, font: "Roboto Condensed", kalin: 400, boyut: 12, dolgu: "#ffe4e6" }),
                        metin({ x: 470, y: 1070, w: 300, hiza: "right", metin: c.hafta, font: "Anton", boyut: 24, dolgu: sari })
                    ]
                }];
            }
        },
        {
            id: "fiyat-listesi", ad: "Fiyat Listesi", etiket: "A4 • 20'li liste", boyut: A4, renk: "#1e293b",
            olustur(c) {
                const m = c.marka, lacivert = "#1e293b", vurgu = "#f59e0b";
                const stil = { duzen: "yatay", kart: "#ffffff", kenar: "#e2e8f0", kalinlik: 1, kose: 8, kartGolge: false, adFont: "Inter", adKalin: 700, adRenk: lacivert, aciklamaRenk: "#64748b", fiyatZemin: lacivert, fiyatRenk: "#ffffff", fiyatFont: "Roboto Condensed", eskiRenk: "#94a3b8", rozetGoster: false };
                return [{
                    arka: { dolgu: "#f1f5f9" },
                    ogeler: [
                        sekil({ ad: "Başlık zemini", x: 0, y: 0, w: 794, h: 150, dolgu: lacivert }),
                        sekil({ x: 0, y: 150, w: 794, h: 6, dolgu: vurgu }),
                        metin({ x: 40, y: 32, w: 500, metin: "Fiyat Listesi", font: "Montserrat", kalin: 900, boyut: 52, dolgu: "#ffffff" }),
                        metin({ x: 42, y: 104, w: 500, metin: buyuk(m.ad) + " • güncel raf fiyatları", font: "Inter", kalin: 600, boyut: 14, harf: 100, dolgu: "#cbd5e1" }),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 560, y: 52, w: 194, h: 46, kose: 23, dolgu: vurgu }),
                            ortaMetin({ x: 560, y: 64, w: 194, metin: c.hafta, font: "Inter", kalin: 800, boyut: 16, dolgu: lacivert })),
                        ...izgara(c.urunler({ adet: 20 }), { x: 30, y: 178, w: 734, h: 862 }, 2, 10, 8, stil),
                        ortaMetin({ x: 0, y: 1062, w: 794, metin: `Fiyatlarımıza KDV dahildir • ${m.telefon} • ${m.web}`, font: "Inter", kalin: 600, boyut: 11, dolgu: "#64748b" })
                    ]
                }];
            }
        },
        {
            id: "manav-kasasi", ad: "Manav Kasası", etiket: "A4 • 12'li", boyut: A4, renk: "#7a4a22",
            olustur(c) {
                const m = c.marka, ahsap = "#c8955a", koyu = "#3b2614";
                const stil = { duzen: "daire", kart: "#f4e1c1", kose: 8, kartGolge: true, gorselZemin: "#e9cfa3", adFont: "Caveat", adKalin: 700, adOlcek: 130, adRenk: koyu, aciklamaRenk: "#7a5a3a", fiyatZemin: "#2f6b2f", fiyatRenk: "#ffffff", fiyatFont: "Alfa Slab One", eskiRenk: "#8a6a4a", rozetZemin: "#d94f30", rozetRenk: "#ffffff" };
                const civi = (x, y) => sekil({ sekil: "elips", x, y, w: 12, h: 12, dolgu: { tip: "dairesel", x: 35, y: 30, duraklar: [{ r: "#e5e7eb", k: 0 }, { r: "#6b7280", k: 100 }] } });
                return [{
                    // Ahşap kasa: koyu zeminde tahta aralıkları
                    arka: { dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#4a3018", k: 0 }, { r: "#2e1c0d", k: 100 }] }, desen: { tur: "yatay", renk: "#000000", opak: 0.22, olcek: 4 } },
                    ogeler: [
                        ...grup(
                            sekil({ ad: "Tabela", sekil: "yuvarlak", x: 137, y: 36, w: 520, h: 150, kose: 14, dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#d9a66b", k: 0 }, { r: ahsap, k: 100 }] }, cizgi: { k: 6, renk: "#7a4a22" }, golge: { x: 0, y: 10, b: 20, renk: "rgba(0,0,0,.5)" } }),
                            civi(152, 50), civi(630, 50), civi(152, 160), civi(630, 160),
                            ortaMetin({ x: 137, y: 54, w: 520, metin: "MANAV", font: "Alfa Slab One", boyut: 72, dolgu: koyu, golgeler: [{ x: 0, y: 2, b: 0, renk: "rgba(255,255,255,.35)" }] })),
                        ortaMetin({ x: 0, y: 200, w: 794, metin: "Bahçeden bu sabah geldi!", font: "Caveat", kalin: 700, boyut: 40, dolgu: "#f4e1c1" }),
                        ...izgara(c.urunler({ kategori: "Meyve & Sebze", adet: 12 }), { x: 30, y: 270, w: 734, h: 750 }, 4, 3, 12, stil),
                        ortaMetin({ x: 0, y: 1036, w: 794, metin: `${m.ad} • ${m.telefon}`, font: "Caveat", kalin: 700, boyut: 34, dolgu: "#f4e1c1" }),
                        ortaMetin({ x: 0, y: 1088, w: 794, metin: `${c.hafta} • Fiyatlar kg başınadır`, font: "Inter", kalin: 600, boyut: 11, dolgu: "#c8a77f" })
                    ]
                }];
            }
        },
        {
            id: "denizden", ad: "Denizden Sofraya", etiket: "A4", boyut: A4, renk: "#1e3a8a",
            olustur(c) {
                const m = c.marka, lacivert = "#1e3a8a", halat = "#c2a878";
                const stil = { duzen: "yatay", kart: "#ffffff", kenar: lacivert, kalinlik: 2, kose: 12, kartGolge: false, adFont: "Yeseva One", adKalin: 400, adRenk: lacivert, aciklamaRenk: "#64748b", fiyatZemin: "#dc2626", fiyatRenk: "#ffffff", fiyatFont: "Yeseva One", eskiRenk: "#94a3b8", rozetZemin: lacivert, rozetRenk: "#ffffff" };
                const urunler = c.urunler(["Somon Fileto", "Limon", "Natürel Sızma Zeytinyağı", "Tavuk But", "Dana Kıyma", "Baldo Pirinç"]);
                return [{
                    arka: { dolgu: "#f8fafc", desen: { tur: "yatay", renk: lacivert, opak: 0.05, olcek: 2 } },
                    ogeler: [
                        sekil({ ad: "Başlık zemini", x: 0, y: 0, w: 794, h: 250, dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#172554", k: 0 }, { r: lacivert, k: 100 }] } }),
                        sekil({ ad: "Dalga", sekil: "dalga", x: 0, y: 222, w: 794, h: 40, dolgu: "#f8fafc", oran: 0.9, uc: 6 }),
                        emoji("⚓", 40, 44, 110, { aci: -12 }), emoji("🐟", 650, 60, 90, { aci: 10 }),
                        ortaMetin({ x: 0, y: 40, w: 794, metin: "Denizden", font: "Yeseva One", boyut: 64, dolgu: "#ffffff" }),
                        ortaMetin({ x: 0, y: 112, w: 794, metin: "Sofraya", font: "Yeseva One", boyut: 64, dolgu: "#93c5fd" }),
                        ortaMetin({ x: 0, y: 194, w: 794, metin: `HAFTANIN TAZE ÜRÜNLERİ • ${c.hafta}`, font: "Inter", kalin: 700, boyut: 12, harf: 200, dolgu: "#bfdbfe" }),
                        sekil({ ad: "Halat", sekil: "cizgi", x: 40, y: 278, w: 714, h: 10, cizgi: { k: 4, renk: halat, kesik: 1 } }),
                        ...izgara(urunler, { x: 40, y: 304, w: 714, h: 706 }, 2, 3, 16, stil),
                        sekil({ ad: "Halat", sekil: "cizgi", x: 40, y: 1026, w: 714, h: 10, cizgi: { k: 4, renk: halat, kesik: 1 } }),
                        ortaMetin({ x: 0, y: 1046, w: 794, metin: buyuk(m.ad), font: "Yeseva One", boyut: 24, dolgu: lacivert }),
                        ortaMetin({ x: 0, y: 1084, w: 794, metin: `${m.telefon}  •  ${m.adres}`, font: "Inter", kalin: 600, boyut: 11, dolgu: "#64748b" })
                    ]
                }];
            }
        },
        {
            id: "fit-secki", ad: "Fit Seçki", etiket: "A4", boyut: A4, renk: "#a3ff12",
            olustur(c) {
                const m = c.marka, neon = "#a3ff12", zemin = "#0d1117";
                const stil = { duzen: "klasik", kart: "#161b22", kenar: "#30363d", kalinlik: 1, kose: 10, kartGolge: false, adFont: "Kanit", adKalin: 700, adRenk: "#f0f6fc", aciklamaRenk: "#8b949e", fiyatZemin: neon, fiyatRenk: zemin, fiyatFont: "Saira Condensed", eskiRenk: "#8b949e", rozetZemin: neon, rozetRenk: zemin };
                const urunler = c.urunler(["Avokado", "Brokoli", "Muz", "Kavrulmuş Fındık", "Köy Yumurtası", "Tavuk But", "Doğal Maden Suyu", "Natürel Sızma Zeytinyağı", "Tam Buğday Ekmeği"]);
                return [{
                    arka: { dolgu: zemin, desen: { tur: "cizgi", renk: neon, opak: 0.04, olcek: 1.2 } },
                    ogeler: [
                        sekil({ ad: "Neon kesik", sekil: "paralel", x: 400, y: -20, w: 430, h: 290, oran: 0.75, dolgu: neon }),
                        metin({ x: 36, y: 10, w: 420, metin: "FİT", font: "Saira Condensed", kalin: 900, italik: true, boyut: 150, dolgu: "#ffffff" }),
                        metin({ x: 40, y: 196, w: 420, metin: "SEÇKİ", font: "Saira Condensed", kalin: 800, italik: true, boyut: 58, harf: 160, dolgu: neon }),
                        metin({ x: 566, y: 70, w: 210, metin: "SAĞLIKLI\nYAŞAM\nHAFTASI", font: "Kanit", kalin: 800, italik: true, boyut: 36, satir: 0.95, dolgu: zemin }),
                        metin({ x: 40, y: 262, w: 420, metin: "Protein • Lif • Enerji — formda kalmanın en uygun yolu", font: "Kanit", kalin: 400, boyut: 13, dolgu: "#8b949e" }),
                        ...izgara(urunler, { x: 30, y: 300, w: 734, h: 716 }, 3, 3, 12, stil),
                        sekil({ x: 0, y: 1040, w: 794, h: 4, dolgu: neon }),
                        metin({ x: 30, y: 1060, w: 400, metin: buyuk(m.ad), font: "Saira Condensed", kalin: 800, italik: true, boyut: 26, harf: 100, dolgu: "#ffffff" }),
                        metin({ x: 384, y: 1068, w: 380, hiza: "right", metin: `${m.telefon} • ${m.web}`, font: "Kanit", kalin: 400, boyut: 13, dolgu: "#8b949e" })
                    ]
                }];
            }
        },
        {
            id: "zen", ad: "Zen Mutfak", etiket: "A4", boyut: A4, renk: "#c1272d",
            olustur(c) {
                const m = c.marka, kirmizi = "#c1272d", murekkep = "#1a1a1a";
                const stil = { duzen: "minimal", kart: "#ffffff", kenar: "#e7e1d3", kalinlik: 1, kose: 0, kartGolge: false, adFont: "Noto Serif", adKalin: 700, adRenk: murekkep, aciklamaRenk: "#7a7364", fiyatZemin: kirmizi, fiyatRenk: "#ffffff", fiyatFont: "Noto Serif", eskiRenk: "#a39c8c", rozetZemin: murekkep, rozetRenk: "#ffffff" };
                const urunler = c.urunler(["Baldo Pirinç", "Somon Fileto", "Siyah Çay", "Brokoli", "Havuç", "Avokado", "Limon", "Köy Yumurtası", "Salatalık"]);
                const harf = ((m.ad || "M").trim().charAt(0) || "M").toLocaleUpperCase("tr-TR");
                return [{
                    arka: { dolgu: "#f7f3ea" },
                    ogeler: [
                        sekil({ ad: "Güneş", sekil: "elips", x: 506, y: 56, w: 228, h: 228, dolgu: kirmizi }),
                        cizgiDikey(470, 56, 228, 1, murekkep),
                        metin({ x: 60, y: 60, w: 400, metin: "Zen\nMutfak", font: "Noto Serif", kalin: 700, boyut: 84, satir: 1.02, dolgu: murekkep }),
                        metin({ x: 64, y: 250, w: 400, metin: "Sade, dengeli ve mevsiminde.", font: "Noto Serif", italik: true, boyut: 17, dolgu: "#6b6458" }),
                        ...izgara(urunler, { x: 60, y: 320, w: 674, h: 690 }, 3, 3, 16, stil),
                        ...grup(
                            sekil({ ad: "Mühür", x: 60, y: 1040, w: 44, h: 44, dolgu: kirmizi }),
                            ortaMetin({ x: 60, y: 1046, w: 44, metin: harf, font: "Noto Serif", kalin: 700, boyut: 26, dolgu: "#ffffff" })),
                        metin({ x: 120, y: 1040, w: 400, metin: m.ad, font: "Noto Serif", kalin: 700, boyut: 16, dolgu: murekkep }),
                        metin({ x: 120, y: 1066, w: 400, metin: `${m.telefon} · ${m.web}`, font: "Noto Serif", boyut: 11, dolgu: "#6b6458" }),
                        metin({ x: 434, y: 1052, w: 300, hiza: "right", metin: c.hafta, font: "Noto Serif", kalin: 700, boyut: 13, harf: 200, dolgu: kirmizi })
                    ]
                }];
            }
        },
        {
            id: "mantar-pano", ad: "Mantar Pano", etiket: "A4", boyut: A4, renk: "#b98a5e",
            olustur(c) {
                const m = c.marka;
                const stil = { duzen: "minimal", kart: "#ffffff", kose: 2, kartGolge: true, adFont: "Caveat", adKalin: 700, adOlcek: 130, adRenk: "#1f2937", aciklamaRenk: "#6b7280", fiyatZemin: "#dc2626", fiyatRenk: "#ffffff", fiyatFont: "Caveat", fiyatOlcek: 110, eskiRenk: "#9ca3af", rozetZemin: "#fde047", rozetRenk: "#1f2937" };
                const acilar = [-3, 2, -1.5, 2.5, -2, 1.2, -2.6, 3, -1], raptiye = ["#ef4444", "#3b82f6", "#22c55e", "#eab308"];
                // Panoya iğnelenmiş kartlar: her biri biraz eğik, üstünde renkli raptiye
                const kartlar = izgara(c.urunler({ adet: 9 }), { x: 44, y: 262, w: 706, h: 760 }, 3, 3, 26, stil);
                const igneler = kartlar.map((k, i) => {
                    k.aci = acilar[i];
                    return sekil({ ad: "Raptiye", sekil: "elips", x: k.x + k.w / 2 - 10, y: k.y - 8, w: 20, h: 20, dolgu: parlakTop(raptiye[i % 4]), golge: { x: 2, y: 3, b: 3, renk: "rgba(0,0,0,.35)" } });
                });
                return [{
                    arka: { dolgu: "#b98a5e", desen: { tur: "nokta", renk: "#7a5233", opak: 0.28, olcek: 0.45 } },
                    ogeler: [
                        ...grup(
                            sekil({ ad: "Not kâğıdı", x: 160, y: 46, w: 474, h: 160, dolgu: "#fffbe6", aci: -2.5, golge: { x: 0, y: 8, b: 16, renk: "rgba(0,0,0,.3)" } }),
                            ortaMetin({ x: 160, y: 64, w: 474, metin: "Panoda bu hafta", font: "Caveat", kalin: 700, boyut: 62, dolgu: "#1f2937", aci: -2.5 }),
                            ortaMetin({ x: 160, y: 150, w: 474, metin: `${buyuk(m.ad)} • ${c.hafta}`, font: "Inter", kalin: 700, boyut: 13, harf: 150, dolgu: "#b45309", aci: -2.5 }),
                            sekil({ ad: "Bant", x: 357, y: 32, w: 80, h: 28, dolgu: "rgba(255,255,255,.55)", aci: 4 })),
                        ...kartlar, ...igneler,
                        ...grup(
                            sekil({ ad: "Not kâğıdı", x: 220, y: 1046, w: 354, h: 52, dolgu: "#fffbe6", aci: 1.5, golge: { x: 0, y: 4, b: 8, renk: "rgba(0,0,0,.3)" } }),
                            ortaMetin({ x: 220, y: 1052, w: 354, metin: m.telefon, font: "Caveat", kalin: 700, boyut: 30, dolgu: "#1f2937", aci: 1.5 }))
                    ]
                }];
            }
        },
        {
            id: "kupon", ad: "Kuponlu Fırsatlar", etiket: "A4", boyut: A4, renk: "#ea580c",
            olustur(c) {
                const m = c.marka, turuncu = "#ea580c", koyu = "#431407";
                const stil = { duzen: "klasik", kart: "#ffffff", kose: 8, kartGolge: false, adFont: "Rubik", adKalin: 700, adRenk: koyu, aciklamaRenk: "#9a6a4f", fiyatZemin: turuncu, fiyatRenk: "#ffffff", fiyatFont: "Anton", eskiRenk: "#a8a29e", rozetZemin: koyu, rozetRenk: "#ffffff" };
                const kartlar = izgara(c.urunler({ adet: 9 }), { x: 52, y: 252, w: 690, h: 740 }, 3, 3, 34, stil);
                // Her kartın çevresinde kesik çizgili kupon ve makas
                const kuponlar = kartlar.map((k) => sekil({ ad: "Kupon", sekil: "yuvarlak", x: k.x - 9, y: k.y - 9, w: k.w + 18, h: k.h + 18, kose: 12, dolgu: "#fffbf5", cizgi: { k: 2, renk: turuncu, kesik: 1 } }));
                const makaslar = kartlar.map((k) => emoji("✂️", k.x - 22, k.y - 24, 30, { aci: -20 }));
                const barkod = [];
                let bx = 590;
                [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 4, 1, 2].forEach((g, i) => { if (i % 2 === 0) barkod.push(sekil({ ad: "Barkod", x: bx, y: 1038, w: g * 2.2, h: 46, dolgu: koyu })); bx += g * 2.2; });
                return [{
                    arka: { dolgu: "#fff7ed", desen: { tur: "nokta2", renk: turuncu, opak: 0.06, olcek: 1 } },
                    ogeler: [
                        ortaMetin({ x: 0, y: 40, w: 794, metin: "KUPONLU", font: "Anton", boyut: 54, harf: 200, dolgu: koyu }),
                        ortaMetin({ x: 0, y: 96, w: 794, metin: "FIRSATLAR", font: "Anton", boyut: 88, dolgu: turuncu }),
                        ortaMetin({ x: 0, y: 200, w: 794, metin: "Kasada bu sayfayı gösterin, indirimi kapın!", font: "Rubik", kalin: 600, boyut: 16, dolgu: koyu }),
                        ...kuponlar, ...kartlar, ...makaslar,
                        metin({ x: 52, y: 1040, w: 480, metin: `Kupon geçerlilik: ${c.hafta}`, font: "Rubik", kalin: 700, boyut: 15, dolgu: koyu }),
                        metin({ x: 52, y: 1066, w: 480, metin: `${m.ad} • ${m.telefon}`, font: "Rubik", kalin: 500, boyut: 12, dolgu: "#9a6a4f" }),
                        ...barkod
                    ]
                }];
            }
        },

        // ── Sosyal medya ────────────────────────────────────────
        {
            id: "fiyat-dustu", ad: "Fiyat Düştü", etiket: "Instagram", boyut: { g: 1080, y: 1080 }, renk: "#16a34a",
            olustur(c) {
                const m = c.marka, sari = "#fde047";
                const u = c.urunler(["Dana Kıyma"])[0], urunId = u.id || null;
                return [{
                    arka: { dolgu: { tip: "dairesel", x: 30, y: 50, duraklar: [{ r: "#22c55e", k: 0 }, { r: "#14532d", k: 90 }] }, desen: { tur: "isin", renk: "#ffffff", opak: 0.06, olcek: 1 } },
                    ogeler: [
                        ortaMetin({ x: 0, y: 40, w: 1080, metin: "FİYAT DÜŞTÜ!", font: "Anton", boyut: 130, dolgu: "#ffffff", golgeler: [{ x: 0, y: 8, b: 0, renk: "#14532d" }] }),
                        sekil({ ad: "Işık", sekil: "elips", x: 70, y: 260, w: 520, h: 520, dolgu: { tip: "dairesel", duraklar: [{ r: "rgba(255,255,255,.35)", k: 0 }, { r: "rgba(255,255,255,0)", k: 70 }] } }),
                        urunGorseli(u, 100, 290, 460, 460),
                        metin({ x: 620, y: 290, w: 400, metin: "ESKİ FİYAT", font: "Inter", kalin: 800, boyut: 28, harf: 200, dolgu: "#bbf7d0" }),
                        metin({ x: 620, y: 330, w: 420, metin: KS.fiyatMetin(u.eski), font: "Anton", boyut: 84, ustu: true, dolgu: "rgba(255,255,255,.75)" }),
                        sekil({ ad: "Ok", sekil: "ok", x: 700, y: 470, w: 130, h: 110, oran: 0.45, aci: 90, dolgu: sari }),
                        M("fiyat", { x: 600, y: 590, w: 430, h: 220, sekil: "yuvarlak", zemin: sari, renk: "#14532d", ust: "YENİ FİYAT", fiyat: u.fiyat, aci: -4, golge: { x: 0, y: 12, b: 24, renk: "rgba(0,0,0,.3)" }, urunId }),
                        metin({ x: 70, y: 830, w: 940, metin: u.ad, font: "Archivo Black", boyut: 66, dolgu: "#ffffff" }),
                        metin({ x: 72, y: 920, w: 940, metin: `${u.aciklama} • %${KS.indirimYuzde(u.fiyat, u.eski)} indirim`, font: "Inter", kalin: 700, boyut: 32, dolgu: sari }),
                        metin({ x: 72, y: 996, w: 940, metin: `${buyuk(m.ad)}  •  ${m.telefon}`, font: "Inter", kalin: 800, boyut: 24, harf: 80, dolgu: "#dcfce7" })
                    ]
                }];
            }
        },
        {
            id: "kahvalti-sepeti", ad: "Kahvaltı Sepeti", etiket: "Instagram", boyut: { g: 1080, y: 1080 }, renk: "#f59e0b",
            olustur(c) {
                const m = c.marka, kahve = "#7c2d12";
                const urunler = c.urunler(["Tam Yağlı Süt", "Beyaz Peynir", "Köy Yumurtası", "Siyah Zeytin", "Süzme Bal", "Tereyağı"]);
                const toplam = urunler.reduce((t, u) => t + (u.fiyat || 0), 0), paket = Math.floor(toplam * 0.85) + 0.9;
                const mx = 540, my = 570, r = 250;
                return [{
                    arka: { dolgu: "#fff4d6", desen: { tur: "nokta2", renk: "#f59e0b", opak: 0.12, olcek: 1.2 } },
                    ogeler: [
                        ortaMetin({ x: 0, y: 36, w: 1080, metin: "Kahvaltı Sepeti", font: "Kaushan Script", boyut: 100, dolgu: kahve }),
                        ortaMetin({ x: 0, y: 176, w: 1080, metin: "6 ÜRÜN BİR ARADA, TEK FİYAT", font: "Montserrat", kalin: 800, boyut: 28, harf: 200, dolgu: "#ea580c" }),
                        sekil({ sekil: "elips", x: mx - 190, y: my - 190, w: 380, h: 380, dolgu: "#fde68a", cizgi: { k: 4, renk: "#f59e0b", kesik: 1 } }),
                        emoji("🧺", mx - 130, my - 140, 260),
                        ...urunler.map((u, i) => { const a = (-90 + i * 60) * KS.RAD; return urunGorseli(u, mx + Math.cos(a) * r - 75, my + Math.sin(a) * r * 0.82 - 75, 150, 150, { aci: i % 2 ? 8 : -8 }); }),
                        M("fiyat", { x: 730, y: 770, w: 290, h: 290, sekil: "patlama", zemin: "#dc2626", renk: "#ffffff", ust: "HEPSİ", fiyat: paket, eski: toplam, eskiRenk: "#fecaca", aci: -10, golge: { x: 0, y: 10, b: 20, renk: "rgba(0,0,0,.3)" } }),
                        metin({ x: 60, y: 880, w: 640, metin: urunler.map((u) => u.ad).join(" • "), font: "Montserrat", kalin: 700, boyut: 24, satir: 1.4, dolgu: kahve }),
                        metin({ x: 60, y: 1010, w: 640, metin: `${buyuk(m.ad)} • ${m.telefon}`, font: "Montserrat", kalin: 800, boyut: 20, harf: 100, dolgu: "#ea580c" })
                    ]
                }];
            }
        },
        {
            id: "cekilis", ad: "Çekiliş", etiket: "Instagram", boyut: { g: 1080, y: 1080 }, renk: "#a855f7",
            olustur(c) {
                const m = c.marka, sari = "#fde047";
                const adim = (no, yazi, y) => [
                    sekil({ sekil: "elips", x: 470, y, w: 64, h: 64, dolgu: "#ffffff" }),
                    ortaMetin({ x: 470, y: y + 10, w: 64, metin: String(no), font: "Luckiest Guy", boyut: 40, dolgu: "#7c3aed" }),
                    metin({ x: 556, y: y + 10, w: 480, metin: yazi, font: "Poppins", kalin: 700, boyut: 32, dolgu: "#ffffff" })];
                const sonGun = c.hafta.split("–").pop().trim();
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 135, duraklar: [{ r: "#7c3aed", k: 0 }, { r: "#c026d3", k: 55 }, { r: "#ec4899", k: 100 }] }, desen: { tur: "konfeti", renk: "#ffffff", opak: 0.22, olcek: 1.4 } },
                    ogeler: [
                        ortaMetin({ x: 0, y: 46, w: 1080, metin: "ÇEKİLİŞ", font: "Luckiest Guy", boyut: 150, dolgu: "#ffffff", derinlik: { k: 12, aci: 90, renk: "#4c1d95" } }),
                        ortaMetin({ x: 0, y: 236, w: 1080, metin: "Takipçilerimize özel büyük hediye!", font: "Poppins", kalin: 700, boyut: 34, dolgu: "#fce7f3" }),
                        sekil({ ad: "Işık", sekil: "elips", x: 50, y: 340, w: 400, h: 400, dolgu: { tip: "dairesel", duraklar: [{ r: "rgba(255,255,255,.4)", k: 0 }, { r: "rgba(255,255,255,0)", k: 70 }] } }),
                        emoji("🎁", 80, 370, 340, { aci: -8 }),
                        metin({ x: 470, y: 330, w: 560, metin: "500 ₺", font: "Luckiest Guy", boyut: 110, dolgu: sari, derinlik: { k: 6, aci: 90, renk: "#7c2d12" } }),
                        metin({ x: 474, y: 466, w: 560, metin: "alışveriş çeki", font: "Poppins", kalin: 800, boyut: 40, dolgu: "#ffffff" }),
                        ...adim(1, "Hesabımızı takip et", 560), ...adim(2, "Bu gönderiyi beğen", 650), ...adim(3, "3 arkadaşını etiketle", 740),
                        sekil({ sekil: "yuvarlak", x: 120, y: 870, w: 840, h: 90, kose: 45, dolgu: "rgba(255,255,255,.18)", cizgi: { k: 2, renk: "rgba(255,255,255,.5)" } }),
                        ortaMetin({ x: 120, y: 894, w: 840, metin: `Sonuçlar ${sonGun} tarihinde açıklanacak`, font: "Poppins", kalin: 700, boyut: 30, dolgu: "#ffffff" }),
                        ortaMetin({ x: 0, y: 996, w: 1080, metin: `${buyuk(m.ad)} • ${m.web}`, font: "Poppins", kalin: 800, boyut: 26, harf: 100, dolgu: sari })
                    ]
                }];
            }
        },
        {
            id: "yeni-urun", ad: "Raflarda Yeni", etiket: "Instagram dikey", boyut: { g: 1080, y: 1350 }, renk: "#7c3aed",
            olustur(c) {
                const m = c.marka, mor = "#7c3aed", koyu = "#2e1065";
                const u = c.urunler(["Siyah Zeytin"])[0], urunId = u.id || null;
                return [{
                    arka: { dolgu: "#f5f3ff" },
                    ogeler: [
                        sekil({ sekil: "damla", x: 620, y: -120, w: 560, h: 680, aci: 200, dolgu: "#ddd6fe" }),
                        sekil({ sekil: "damla", x: -160, y: 900, w: 460, h: 560, aci: 30, dolgu: "#ede9fe" }),
                        ...grup(
                            sekil({ sekil: "muhur", x: 60, y: 60, w: 230, h: 230, uc: 22, ic: 0.88, dolgu: mor, aci: -12 }),
                            ortaMetin({ x: 60, y: 134, w: 230, metin: "YENİ", font: "Archivo Black", boyut: 62, dolgu: "#ffffff", aci: -12 })),
                        metin({ x: 330, y: 80, w: 700, metin: "Raflarda\nyeni!", font: "Poppins", kalin: 800, boyut: 96, satir: 0.95, dolgu: koyu }),
                        sekil({ ad: "Işık", sekil: "elips", x: 190, y: 360, w: 700, h: 700, dolgu: { tip: "dairesel", duraklar: [{ r: "#ffffff", k: 0 }, { r: "rgba(255,255,255,0)", k: 70 }] } }),
                        urunGorseli(u, 260, 410, 560, 560),
                        ortaMetin({ x: 60, y: 990, w: 960, metin: u.ad, font: "Poppins", kalin: 800, boyut: 72, dolgu: koyu }),
                        ortaMetin({ x: 60, y: 1086, w: 960, metin: u.aciklama, font: "Poppins", kalin: 500, boyut: 32, dolgu: "#6d28d9" }),
                        M("fiyat", { x: 330, y: 1150, w: 420, h: 124, sekil: "hap", zemin: mor, renk: "#ffffff", fiyat: u.fiyat, urunId }),
                        ortaMetin({ x: 0, y: 1294, w: 1080, metin: `${buyuk(m.ad)} • ${m.web}`, font: "Poppins", kalin: 700, boyut: 22, harf: 100, dolgu: koyu })
                    ]
                }];
            }
        },
        {
            id: "son-gun", ad: "Son Gün", etiket: "Hikâye", boyut: { g: 1080, y: 1920 }, renk: "#ef4444",
            olustur(c) {
                const m = c.marka, kirmizi = "#ef4444";
                const stil = { duzen: "yatay", kart: "#1f2937", kenar: "#374151", kalinlik: 2, kose: 22, kartGolge: false, adFont: "Inter", adKalin: 800, adRenk: "#ffffff", aciklamaRenk: "#9ca3af", fiyatZemin: kirmizi, fiyatRenk: "#ffffff", fiyatFont: "Anton", eskiRenk: "#9ca3af", rozetZemin: "#fde047", rozetRenk: "#111827" };
                const urunler = c.urunler(["Tuvalet Kâğıdı", "Sıvı Çamaşır Deterjanı", "Ayçiçek Yağı"]);
                return [{
                    arka: { dolgu: "#111827", desen: { tur: "cizgi", renk: "#ffffff", opak: 0.03, olcek: 2 } },
                    ogeler: [
                        ortaMetin({ x: 0, y: 90, w: 1080, metin: buyuk(m.ad), font: "Inter", kalin: 800, boyut: 30, harf: 300, dolgu: "#9ca3af" }),
                        ortaMetin({ x: 0, y: 130, w: 1080, metin: "SON", font: "Anton", boyut: 280, dolgu: kirmizi, golgeler: [{ x: 0, y: 0, b: 50, renk: "rgba(239,68,68,.5)" }] }),
                        ortaMetin({ x: 0, y: 430, w: 1080, metin: "GÜN", font: "Anton", boyut: 280, dolgu: "#ffffff" }),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 240, y: 800, w: 600, h: 86, kose: 43, dolgu: "#fde047" }),
                            ortaMetin({ x: 240, y: 818, w: 600, metin: "BUGÜN 23:59'A KADAR", font: "Inter", kalin: 900, boyut: 40, dolgu: "#111827" })),
                        ...izgara(urunler, { x: 80, y: 940, w: 920, h: 720 }, 1, 3, 26, stil),
                        ortaMetin({ x: 0, y: 1720, w: 1080, metin: "Kaçırma, yarın normal fiyat!", font: "Inter", kalin: 800, boyut: 44, dolgu: "#ffffff" }),
                        ortaMetin({ x: 0, y: 1800, w: 1080, metin: `${m.telefon}  •  ${m.web}`, font: "Inter", kalin: 600, boyut: 28, dolgu: "#9ca3af" })
                    ]
                }];
            }
        },
        {
            id: "tarif", ad: "Tarif Kartı", etiket: "Hikâye", boyut: { g: 1080, y: 1920 }, renk: "#dc2626",
            olustur(c) {
                const m = c.marka, kahve = "#7c2d12", kirmizi = "#dc2626";
                const stil = { duzen: "yatay", kart: "#ffffff", kose: 20, kartGolge: true, adFont: "Nunito", adKalin: 800, adRenk: kahve, aciklamaRenk: "#9a6a4f", fiyatZemin: kirmizi, fiyatRenk: "#ffffff", fiyatFont: "Lilita One", eskiRenk: "#a8a29e", rozetZemin: "#fbbf24", rozetRenk: kahve };
                const urunler = c.urunler(["Köy Yumurtası", "Domates", "Tereyağı", "Beyaz Peynir"]);
                const toplam = urunler.reduce((t, u) => t + (u.fiyat || 0), 0);
                return [{
                    arka: { dolgu: "#fffbeb", desen: { tur: "kareli", renk: "#f59e0b", opak: 0.1, olcek: 1.6 } },
                    ogeler: [
                        sekil({ ad: "Defter çizgisi", x: 110, y: 0, w: 4, h: 1920, dolgu: "rgba(220,38,38,.35)" }),
                        metin({ x: 150, y: 90, w: 860, metin: "Bugün ne pişirsek?", font: "Courgette", boyut: 62, dolgu: kahve }),
                        emoji("🍳", 800, 160, 210, { aci: 12 }),
                        metin({ x: 150, y: 196, w: 720, metin: "Menemen", font: "Lilita One", boyut: 140, dolgu: kirmizi, golgeler: [{ x: 6, y: 6, b: 0, renk: "#fde68a" }] }),
                        metin({ x: 154, y: 396, w: 620, metin: "2 kişilik • 15 dakika • Kolay", font: "Nunito", kalin: 800, boyut: 32, dolgu: "#9a6a4f" }),
                        metin({ x: 150, y: 476, w: 860, metin: "MALZEMELER", font: "Nunito", kalin: 900, boyut: 30, harf: 300, dolgu: kahve }),
                        ...izgara(urunler, { x: 150, y: 536, w: 860, h: 920 }, 1, 4, 20, stil),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 150, y: 1500, w: 860, h: 170, kose: 30, dolgu: kahve }),
                            metin({ x: 200, y: 1552, w: 400, metin: "Hepsi sepette:", font: "Courgette", boyut: 48, dolgu: "#fde68a" }),
                            metin({ x: 560, y: 1530, w: 410, hiza: "right", metin: KS.fiyatMetin(toplam), font: "Lilita One", boyut: 84, dolgu: "#ffffff" })),
                        metin({ x: 150, y: 1730, w: 860, metin: "Tüm malzemeler mağazamızda, afiyet olsun!", font: "Nunito", kalin: 800, boyut: 32, dolgu: kahve }),
                        metin({ x: 150, y: 1792, w: 860, metin: `${buyuk(m.ad)} • ${m.telefon}`, font: "Nunito", kalin: 800, boyut: 26, harf: 100, dolgu: kirmizi })
                    ]
                }];
            }
        },
        {
            id: "facebook-gonderi", ad: "Facebook Gönderisi", etiket: "Facebook", boyut: { g: 1200, y: 630 }, renk: "#2563eb",
            olustur(c) {
                const m = c.marka, lacivert = "#1e3a8a";
                const stil = { duzen: "daire", kart: "#ffffff", kose: 22, kartGolge: true, gorselZemin: "#dbeafe", adFont: "Poppins", adKalin: 700, adRenk: lacivert, aciklamaRenk: "#64748b", fiyatZemin: "#f97316", fiyatRenk: "#ffffff", fiyatFont: "Archivo Black", eskiRenk: "#94a3b8", rozetZemin: "#facc15", rozetRenk: lacivert };
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 120, duraklar: [{ r: lacivert, k: 0 }, { r: "#2563eb", k: 100 }] }, desen: { tur: "nokta2", renk: "#ffffff", opak: 0.06, olcek: 1 } },
                    ogeler: [
                        sekil({ sekil: "elips", x: -120, y: 380, w: 420, h: 420, dolgu: "rgba(255,255,255,.08)" }),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 50, y: 56, w: 260, h: 46, kose: 23, dolgu: "#facc15" }),
                            ortaMetin({ x: 50, y: 67, w: 260, metin: buyuk(m.ad), font: "Poppins", kalin: 800, boyut: 18, harf: 100, dolgu: lacivert })),
                        metin({ x: 48, y: 130, w: 420, metin: "Haftanın\nfırsatları", font: "Poppins", kalin: 800, boyut: 64, satir: 1, dolgu: "#ffffff" }),
                        metin({ x: 50, y: 282, w: 400, metin: `${c.hafta} tarihleri arasında tüm mağazalarımızda`, font: "Poppins", kalin: 500, boyut: 20, satir: 1.4, dolgu: "#bfdbfe" }),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 50, y: 470, w: 300, h: 70, kose: 35, dolgu: "#ffffff" }),
                            ortaMetin({ x: 50, y: 489, w: 300, metin: "Hemen keşfet  →", font: "Poppins", kalin: 800, boyut: 24, dolgu: lacivert })),
                        ...izgara(c.urunler(["Kola", "Sütlü Çikolata", "Kavrulmuş Fındık"]), { x: 480, y: 60, w: 680, h: 510 }, 3, 1, 20, stil)
                    ]
                }];
            }
        },

        // ── Ekran ───────────────────────────────────────────────
        {
            id: "fiyat-borsasi", ad: "Fiyat Borsası", etiket: "16:9 ekran", boyut: { g: 1920, y: 1080 }, renk: "#22c55e",
            olustur(c) {
                const m = c.marka, yesil = "#22c55e", zemin = "#05070d";
                const stil = { duzen: "raf", kart: "#0b1220", kenar: "#1f2937", kalinlik: 1, kose: 10, kartGolge: false, adFont: "Teko", adKalin: 600, adRenk: "#e5e7eb", aciklamaRenk: "#9ca3af", fiyatZemin: "#111827", fiyatRenk: yesil, fiyatFont: "Teko", eskiRenk: "#ef4444", rozetZemin: yesil, rozetRenk: zemin };
                const urunler = c.urunler({ adet: 8 });
                // Kayan yazı bandı: borsa ekranı gibi düşen fiyatlar
                const bant = urunler.slice(0, 3).map((u) => `${buyuk(u.ad)} ${KS.fiyatMetin(u.fiyat)}${u.eski > u.fiyat ? `  ▼ %${KS.indirimYuzde(u.fiyat, u.eski)}` : ""}`).join("      •      ");
                return [{
                    arka: { dolgu: zemin, desen: { tur: "kareli", renk: yesil, opak: 0.04, olcek: 2 } },
                    ogeler: [
                        sekil({ ad: "Bant", x: 0, y: 0, w: 1920, h: 80, dolgu: "#0b1220" }),
                        sekil({ x: 0, y: 80, w: 1920, h: 3, dolgu: yesil }),
                        metin({ x: 40, y: 12, w: 1840, metin: bant, font: "Teko", kalin: 500, boyut: 44, dolgu: yesil }),
                        metin({ x: 80, y: 120, w: 1300, metin: "FİYAT BORSASI", font: "Teko", kalin: 700, boyut: 150, dolgu: "#ffffff", golgeler: [{ x: 0, y: 0, b: 30, renk: "rgba(34,197,94,.45)" }] }),
                        ...grup(
                            sekil({ sekil: "elips", x: 1570, y: 196, w: 26, h: 26, dolgu: "#ef4444", golge: { x: 0, y: 0, b: 12, renk: "#ef4444" } }),
                            metin({ x: 1610, y: 180, w: 240, metin: "CANLI", font: "Teko", kalin: 600, boyut: 50, dolgu: "#ef4444" })),
                        metin({ x: 84, y: 310, w: 1400, metin: "Bugün düşen fiyatlar — kasalarımızda anında geçerli", font: "Teko", kalin: 400, boyut: 44, dolgu: "#9ca3af" }),
                        ...izgara(urunler, { x: 80, y: 390, w: 1760, h: 570 }, 4, 2, 24, stil),
                        metin({ x: 80, y: 990, w: 1200, metin: `${buyuk(m.ad)} • Fiyatlar her gün güncellenir`, font: "Teko", kalin: 500, boyut: 44, dolgu: "#6b7280" }),
                        metin({ x: 1280, y: 990, w: 560, hiza: "right", metin: m.web, font: "Teko", kalin: 500, boyut: 44, dolgu: yesil })
                    ]
                }];
            }
        },
        {
            id: "bugunun-yildizi", ad: "Bugünün Yıldızı", etiket: "16:9 ekran", boyut: { g: 1920, y: 1080 }, renk: "#e30613",
            olustur(c) {
                const m = c.marka, kirmizi = "#e30613", sari = "#ffd400";
                const u = c.urunler(["Köy Yumurtası"])[0], urunId = u.id || null;
                return [{
                    arka: { dolgu: "#ffffff" },
                    ogeler: [
                        sekil({ ad: "Kırmızı zemin", sekil: "paralel", x: -100, y: 0, w: 1100, h: 1080, oran: 0.3, dolgu: { tip: "dairesel", x: 45, y: 50, duraklar: [{ r: "#ff2a3a", k: 0 }, { r: "#b00010", k: 100 }] } }),
                        sekil({ ad: "Işık", sekil: "elips", x: 120, y: 160, w: 760, h: 760, dolgu: { tip: "dairesel", duraklar: [{ r: "rgba(255,255,255,.3)", k: 0 }, { r: "rgba(255,255,255,0)", k: 70 }] } }),
                        urunGorseli(u, 170, 210, 660, 660),
                        ...grup(
                            sekil({ sekil: "yuvarlak", x: 1060, y: 120, w: 420, h: 80, kose: 40, dolgu: sari }),
                            ortaMetin({ x: 1060, y: 134, w: 420, metin: "BUGÜNE ÖZEL", font: "Anton", boyut: 44, harf: 100, dolgu: kirmizi })),
                        metin({ x: 1060, y: 240, w: 800, metin: u.ad, font: "Anton", boyut: 130, satir: 1, dolgu: "#111111" }),
                        metin({ x: 1064, y: 400, w: 800, metin: u.aciklama, font: "Inter", kalin: 600, boyut: 44, dolgu: "#6b7280" }),
                        M("fiyat", { x: 1060, y: 500, w: 560, h: 300, sekil: "etiket", zemin: kirmizi, renk: "#ffffff", eski: u.eski, eskiRenk: "#fecaca", fiyat: u.fiyat, golge: { x: 0, y: 14, b: 26, renk: "rgba(0,0,0,.25)" }, urunId }),
                        metin({ x: 1064, y: 900, w: 800, metin: `${buyuk(m.ad)}  •  ${m.telefon}`, font: "Inter", kalin: 800, boyut: 34, harf: 80, dolgu: "#111111" })
                    ]
                }];
            }
        },
        {
            id: "hos-geldiniz", ad: "Hoş Geldiniz Ekranı", etiket: "16:9 ekran", boyut: { g: 1920, y: 1080 }, renk: "#0f766e",
            olustur(c) {
                const m = c.marka, web = m.web || "www.ornek.com";
                const qrVeri = /^https?:/i.test(web) ? web : "https://" + web;
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 120, duraklar: [{ r: "#134e4a", k: 0 }, { r: "#0f766e", k: 60 }, { r: "#14b8a6", k: 100 }] }, desen: { tur: "halka", renk: "#ffffff", opak: 0.04, olcek: 2 } },
                    ogeler: [
                        metin({ x: 120, y: 140, w: 1000, metin: buyuk(m.ad), font: "Inter", kalin: 800, boyut: 34, harf: 300, dolgu: "#99f6e4" }),
                        metin({ x: 112, y: 196, w: 1150, metin: "Hoş geldiniz", font: "Playfair Display", kalin: 800, italik: true, boyut: 160, dolgu: "#ffffff" }),
                        metin({ x: 120, y: 420, w: 1000, metin: m.slogan, font: "Inter", kalin: 600, boyut: 44, dolgu: "#ccfbf1" }),
                        sekil({ x: 120, y: 520, w: 120, h: 6, dolgu: "#fde68a" }),
                        metin({ x: 120, y: 568, w: 1000, metin: "Her gün 08:00 – 22:00 açığız", font: "Inter", kalin: 700, boyut: 46, dolgu: "#ffffff" }),
                        metin({ x: 120, y: 648, w: 1100, metin: `📞 ${m.telefon}\n📍 ${m.adres}`, font: "Inter", kalin: 500, boyut: 34, satir: 1.6, dolgu: "#ccfbf1" }),
                        ...grup(
                            sekil({ ad: "QR kartı", sekil: "yuvarlak", x: 1340, y: 220, w: 460, h: 560, kose: 36, dolgu: "#ffffff", golge: { x: 0, y: 20, b: 50, renk: "rgba(0,0,0,.3)" } }),
                            M("qr", { veri: qrVeri, x: 1390, y: 270, w: 360, h: 360, renk: "#134e4a", zemin: "#ffffff" }),
                            ortaMetin({ x: 1340, y: 652, w: 460, metin: "Kampanyaları\ntelefonunuza alın", font: "Inter", kalin: 800, boyut: 32, satir: 1.25, dolgu: "#134e4a" })),
                        metin({ x: 120, y: 960, w: 1700, metin: `${web}  •  Bugünün fırsatlarını kaçırmayın!`, font: "Inter", kalin: 600, boyut: 30, dolgu: "#99f6e4" })
                    ]
                }];
            }
        },
        {
            id: "dikey-menu", ad: "Dikey Ekran Menüsü", etiket: "Dikey ekran", kategori: "ekran", boyut: { g: 1080, y: 1920 }, renk: "#f97316",
            olustur(c) {
                const m = c.marka, turuncu = "#f97316", koyu = "#18181b";
                const stil = { duzen: "yatay", kart: "#27272a", kenar: "#3f3f46", kalinlik: 1, kose: 18, kartGolge: false, adFont: "Oswald", adKalin: 600, adRenk: "#fafafa", aciklamaRenk: "#a1a1aa", fiyatZemin: turuncu, fiyatRenk: koyu, fiyatFont: "Oswald", eskiRenk: "#a1a1aa", rozetZemin: "#facc15", rozetRenk: koyu };
                const urunler = c.urunler(["Dana Kıyma", "Tavuk But", "Sucuk", "Somon Fileto", "Beyaz Peynir", "Köy Yumurtası", "Tereyağı"]);
                return [{
                    arka: { dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: koyu, k: 0 }, { r: "#09090b", k: 100 }] } },
                    ogeler: [
                        sekil({ x: 0, y: 0, w: 1080, h: 12, dolgu: turuncu }),
                        metin({ x: 70, y: 70, w: 940, metin: buyuk(m.ad), font: "Oswald", kalin: 500, boyut: 34, harf: 300, dolgu: turuncu }),
                        metin({ x: 66, y: 120, w: 940, metin: "ŞARKÜTERİ\nVE KASAP", font: "Oswald", kalin: 700, boyut: 120, satir: 0.95, dolgu: "#fafafa" }),
                        metin({ x: 70, y: 372, w: 940, metin: `Günün fiyatları • ${c.hafta}`, font: "Oswald", kalin: 400, boyut: 40, dolgu: "#a1a1aa" }),
                        ...izgara(urunler, { x: 60, y: 460, w: 960, h: 1320 }, 1, 7, 18, stil),
                        sekil({ ad: "Alt bilgi zemini", x: 0, y: 1830, w: 1080, h: 90, dolgu: turuncu }),
                        ortaMetin({ x: 0, y: 1852, w: 1080, metin: `${m.telefon}  •  ${m.web}`, font: "Oswald", kalin: 600, boyut: 34, dolgu: koyu })
                    ]
                }];
            }
        }
    ];

    // Galeride baskı → sosyal medya → ekran sırası (aynı gruptakiler eklenme sırasını korur)
    const SIRA = { A4: 0, sosyal: 1, ekran: 2 };
    const hepsi = KS.SABLONLAR.concat(EK).map((t, i) => [t, i]);
    hepsi.sort((a, b) => (SIRA[KS.sablonKategori(a[0])] - SIRA[KS.sablonKategori(b[0])]) || a[1] - b[1]);
    KS.SABLONLAR.splice(0, KS.SABLONLAR.length, ...hepsi.map((x) => x[0]));
})();
