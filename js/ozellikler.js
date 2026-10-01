// Sağ panel: seçili öğenin (ya da hiçbir şey seçili değilse sayfanın / belgenin) özellikleri.
// Panel seçim değişince yeniden kurulur; öğe başka yoldan (sürükleme, geri al) değişince denetimler yerinde güncellenir.
(function () {
    "use strict";
    const KS = window.KS;
    const { h } = KS;
    const E = KS.E;
    const U = () => KS.ui;

    let kap, baglar = [], kimlikler = [];
    function baslat(el) {
        kap = el;
        KS.olay.on("secim", kur);
        KS.olay.on("belge", kur);
        KS.olay.on("sayfa", () => { if (!E.secim.length) kur(); });
        const yenileF = KS.kareBasi(yenile);
        KS.olay.on("oge-degisti", yenileF);
        KS.olay.on("donusum", yenileF);
        KS.olay.on("metin-yazildi", yenileF);
        KS.olay.on("gecmis", yenileF);
        KS.olay.on("urunler", () => (E.secim.length ? yenileF() : kur()));
        KS.olay.on("odak", odakla);
        kur();
    }

    // ── Yardımcılar ─────────────────────────────────────────────
    const ogeler = () => kimlikler.map((id) => KS.editor.bul(id)).filter(Boolean).map((r) => r.oge);
    const ilk = () => ogeler()[0];
    function seciliTur() { const l = ogeler(); return l.length && l.every((o) => o.tur === l[0].tur) ? l[0].tur : null; }
    function bag(kontrol, oku) { baglar.push({ kontrol, oku }); return kontrol.el; }
    function yenile() {
        const o = ilk();
        if (!o) { if (!E.secim.length) for (const b of baglar) if (b.sayfa) b.kontrol.yenile(b.oku()); return; }
        for (const b of baglar) { try { b.kontrol.yenile(b.oku(o)); } catch (h) { /* alan yok */ } }
    }
    // fn tüm seçili öğelere uygulanır; bitti=false ise geçmişe gecikmeli yazılır
    function uygula(fn, bitti = true) {
        KS.editor.degistir(fn, { idler: kimlikler, gecmis: bitti ? "hemen" : "gecikmeli" });
    }
    const alan = (etiket, ...k) => U().alan(etiket, ...k);
    const bolum = (b, i, s) => U().bolum(b, i, s);
    const sayi = (on, oku, yaz, oz = {}) => bag(U().sayi(Object.assign({ on, deger: oku(ilk()), degisti: (v, b) => uygula((o) => yaz(o, v), b) }, oz)), oku);
    const kaydir = (oku, yaz, oz = {}) => bag(U().kaydirici(Object.assign({ deger: oku(ilk()), degisti: (v, b) => uygula((o) => yaz(o, v), b) }, oz)), oku);
    const renk = (oku, yaz, oz = {}) => bag(U().renkSec(Object.assign({ deger: oku(ilk()), degisti: (v, b) => uygula((o) => yaz(o, v), b) }, oz)), oku);
    const bolumlu = (secenekler, oku, yaz) => bag(U().bolumlu({ secenekler, deger: oku(ilk()), degisti: (v) => uygula((o) => yaz(o, v)) }), oku);
    const anahtar = (oku, yaz) => bag(U().anahtar({ deger: !!oku(ilk()), degisti: (v) => { uygula((o) => yaz(o, v)); kur(); } }), (o) => !!oku(o));
    const secimK = (secenekler, oku, yaz) => bag(U().secim({ secenekler, deger: oku(ilk()), degisti: (v) => uygula((o) => yaz(o, v)) }), oku);
    const dugme = (ikon, ipucu, fn, ek = "") => h("button.ikon-dugme" + ek, { type: "button", title: ipucu, onclick: fn }, KS.ikon(ikon, 18));
    const AGIRLIK_ADI = { 100: "İnce", 200: "Çok ince", 300: "Hafif", 400: "Normal", 500: "Orta", 600: "Yarı kalın", 700: "Kalın", 800: "Ekstra kalın", 900: "Siyah" };
    const agirliklar = (font) => (KS.fontlar.bul(font) || { w: [400, 700] }).w;
    const enYakin = (liste, v) => liste.reduce((en, x) => (Math.abs(x - v) < Math.abs(en - v) ? x : en), liste[0]);

    function kur() {
        if (!kap || !E.belge) return;
        if (E.secim.length === 1) kimlikler = E.secim.slice();
        else kimlikler = E.secim.slice();
        baglar = [];
        const kaydirma = kap.scrollTop;
        const l = ogeler();
        let icerik;
        if (!l.length) icerik = sayfaPaneli();
        else icerik = ogePaneli(l);
        kap.replaceChildren(...[].concat(icerik));
        kap.scrollTop = kimlikler.join() === kur.son ? kaydirma : 0;
        kur.son = kimlikler.join();
        kap.classList.toggle("acik", l.length > 0);
    }

    function odakla(tur) {
        if (tur === "urun" || tur === "fiyat" || tur === "qr" || tur === "metin") {
            setTimeout(() => { const g = kap.querySelector("[data-odak] input, [data-odak] textarea, input[data-odak], textarea[data-odak]"); if (g) { g.focus(); g.select && g.select(); } }, 30);
        }
    }

    // ── Başlık ve eylemler ──────────────────────────────────────
    const TUR_IKON = { metin: "metin", sekil: "ogeler", gorsel: "gorsel", urun: "urun", fiyat: "etiket", qr: "qr" };
    function kafa(l) {
        const tek = l.length === 1 ? l[0] : null;
        const tur = seciliTur();
        const ad = tek ? (KS.ogeAdi ? KS.ogeAdi(tek) : KS.TUR_ADLARI[tek.tur]) : `${l.length} öğe seçili`;
        const alt = tek ? KS.TUR_ADLARI[tek.tur] : tur ? KS.TUR_ADLARI[tur] + " (çoklu)" : "Karışık seçim";
        const kilitli = l.every((o) => o.kilit);
        const grupVar = l.some((o) => o.grup);
        return [
            h("div.oz-kafa", h("span.tur-ikon", KS.ikon(tek ? TUR_IKON[tek.tur] : "izgara", 17)), h("div.baslik", h("b", ad), h("small", alt))),
            h("div.oz-eylemler",
                dugme("kopyala", "Çoğalt (Ctrl+D)", () => KS.editor.cogalt()),
                dugme(kilitli ? "kilit" : "kilitAcik", kilitli ? "Kilidi aç" : "Kilitle", () => { KS.editor.kilitle(); kur(); }, kilitli ? ".aktif" : ""),
                dugme("oneGetir", "Öne getir (Ctrl+])", () => KS.editor.sirala("one")),
                dugme("arkayaGonder", "Arkaya gönder (Ctrl+[)", () => KS.editor.sirala("arka")),
                l.length > 1 && !grupVar ? dugme("grup", "Grupla (Ctrl+G)", () => KS.editor.grupla()) : null,
                grupVar ? dugme("grupCoz", "Grubu çöz", () => KS.editor.grupCoz()) : null,
                dugme("firca", "Stili kopyala (Ctrl+Alt+C)", () => KS.editor.stilKopyala()),
                dugme("sil", "Sil (Del)", () => KS.editor.sil(), ".tehlike"),
                dugme("menu", "Diğer", (e) => KS.editor.baglamMenusu(e.currentTarget)))
        ];
    }

    function ogePaneli(l) {
        const parcalar = [...kafa(l)];
        const tur = seciliTur();
        const tek = l.length === 1;
        if (tur === "urun") parcalar.push(...urunBolumleri(tek));
        else if (tur === "fiyat") parcalar.push(...fiyatBolumleri(tek));
        else if (tur === "metin") parcalar.push(...metinBolumleri(tek));
        else if (tur === "sekil") parcalar.push(...sekilBolumleri());
        else if (tur === "gorsel") parcalar.push(...gorselBolumleri(tek));
        else if (tur === "qr") parcalar.push(qrBolumu());
        parcalar.push(hizaBolumu(l), konumBolumu(l), gorunumBolumu(tur));
        return parcalar;
    }

    // ── Hizalama, konum, görünüm (ortak) ────────────────────────
    function hizaBolumu(l) {
        const d = (ikon, ipucu, t) => dugme(ikon, ipucu, () => KS.editor.hizala(t));
        const ek = l.length >= 3 ? [h("span.ayrac", { style: { height: "20px" } }), dugme("dagitYatay", "Yatay eşit dağıt", () => KS.editor.dagit("yatay")), dugme("dagitDikey", "Dikey eşit dağıt", () => KS.editor.dagit("dikey"))] : [];
        return bolum(l.length > 1 && !(l.every((o) => o.grup && o.grup === l[0].grup)) ? "Hizala (seçime göre)" : "Hizala (sayfaya göre)",
            h("div", { style: { display: "flex", flexWrap: "wrap", gap: "2px", alignItems: "center" } },
                d("hizaSol", "Sola", "sol"), d("hizaOrtaY", "Yatay ortala", "ortaY"), d("hizaSag", "Sağa", "sag"),
                d("hizaUst", "Üste", "ust"), d("hizaOrtaD", "Dikey ortala", "ortaD"), d("hizaAlt", "Alta", "alt"), ...ek));
    }
    let oranKilit = true;
    function konumBolumu(l) {
        if (l.length > 1) {
            const kutu = () => KS.kutuBirlesim(ogeler().map(KS.kutu));
            const tasi = (dx, dy) => uygula((o) => { o.x = KS.yuvarla(o.x + dx, 1); o.y = KS.yuvarla(o.y + dy, 1); });
            const x = bag(U().sayi({ on: "X", deger: kutu().x, basamak: 1, degisti: (v) => tasi(v - kutu().x, 0) }), () => KS.yuvarla(kutu().x, 1));
            const y = bag(U().sayi({ on: "Y", deger: kutu().y, basamak: 1, degisti: (v) => tasi(0, v - kutu().y) }), () => KS.yuvarla(kutu().y, 1));
            return bolum("Konum", h("div.izgara-2", x, y), { acik: false });
        }
        const o = l[0];
        const metinMi = o.tur === "metin";
        const oranli = ["gorsel", "fiyat", "qr"].includes(o.tur);
        const kilitDugme = h("button.ikon-dugme.kucuk", { type: "button", title: "En-boy oranını koru", "aria-pressed": String(oranKilit && oranli) }, KS.ikon("baglanti", 15));
        kilitDugme.addEventListener("click", () => { oranKilit = !oranKilit; kilitDugme.setAttribute("aria-pressed", String(oranKilit)); });
        const boyutYaz = (eksen) => (x, v) => {
            if (x.tur === "metin" && eksen === "h") return;
            const cx = x.x + x.w / 2, cy = x.y + x.h / 2;
            if (x.tur === "metin" && x.egri) { const k = v / x[eksen]; KS.model.olcekle(x, k); }
            else if (oranKilit && oranli) { const k = v / x[eksen]; x.w *= k; x.h *= k; }
            else x[eksen] = v;
            x.x = KS.yuvarla(cx - x.w / 2, 1); x.y = KS.yuvarla(cy - x.h / 2, 1);
        };
        const satirlar = h("div", { style: { display: "grid", gap: "6px" } },
            h("div.izgara-2",
                sayi("X", (x) => KS.yuvarla(x.x, 1), (x, v) => { x.x = v; }, { basamak: 1 }),
                sayi("Y", (x) => KS.yuvarla(x.y, 1), (x, v) => { x.y = v; }, { basamak: 1 })),
            h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "6px", alignItems: "center" } },
                sayi("G", (x) => KS.yuvarla(x.w, 1), boyutYaz("w"), { min: 4, basamak: 1 }),
                metinMi && !o.egri ? h("div.sayi", { title: "Metin yüksekliği içerikten gelir", style: { opacity: ".6" } }, h("span.on-ek", "Y"), h("input", { value: Math.round(o.h), disabled: true })) : sayi("Y", (x) => KS.yuvarla(x.h, 1), boyutYaz("h"), { min: 4, basamak: 1 }),
                oranli ? kilitDugme : h("span")),
            h("div", { style: { display: "grid", gridTemplateColumns: "1fr auto auto", gap: "6px", alignItems: "center" } },
                sayi("Açı", (x) => KS.yuvarla(x.aci || 0, 1), (x, v) => { x.aci = KS.aciNormal(v); }, { son: "°", basamak: 1 }),
                bag(U().acKapa({ ikon: "cevirYatay", ipucu: "Yatay çevir", deger: o.cevirX, degisti: (v) => uygula((x) => { x.cevirX = v; }) }), (x) => x.cevirX),
                bag(U().acKapa({ ikon: "cevirDikey", ipucu: "Dikey çevir", deger: o.cevirY, degisti: (v) => uygula((x) => { x.cevirY = v; }) }), (x) => x.cevirY)));
        return bolum("Konum ve boyut", satirlar, { acik: true });
    }
    const KARISIM = [["normal", "Normal"], ["multiply", "Çoğalt"], ["screen", "Ekran"], ["overlay", "Kaplama"], ["darken", "Koyulaştır"], ["lighten", "Açıklaştır"], ["color-burn", "Renk yakma"], ["soft-light", "Yumuşak ışık"], ["hard-light", "Sert ışık"], ["difference", "Fark"], ["luminosity", "Parlaklık"]];
    function gorunumBolumu(tur) {
        const o = ilk();
        const golgeVar = !!o.golge;
        const golge = tur !== "metin" ? h("div", { style: { marginTop: "12px" } },
            h("div.alan", { style: { gridTemplateColumns: "1fr auto" } }, h("span.etiket", "Gölge"), anahtar((x) => x.golge, (x, v) => { x.golge = v ? { x: 0, y: Math.max(2, x.w / 40), b: Math.max(6, x.w / 14), renk: "rgba(0,0,0,.3)" } : null; })),
            golgeVar ? h("div", { style: { display: "grid", gap: "6px", marginTop: "8px" } },
                h("div.izgara-3",
                    sayi("X", (x) => KS.yuvarla(x.golge?.x ?? 0, 1), (x, v) => { if (x.golge) x.golge.x = v; }, { basamak: 1 }),
                    sayi("Y", (x) => KS.yuvarla(x.golge?.y ?? 0, 1), (x, v) => { if (x.golge) x.golge.y = v; }, { basamak: 1 }),
                    sayi("B", (x) => KS.yuvarla(x.golge?.b ?? 0, 1), (x, v) => { if (x.golge) x.golge.b = v; }, { min: 0, basamak: 1, ipucu: "Bulanıklık" })),
                renk((x) => x.golge?.renk || "rgba(0,0,0,.3)", (x, v) => { if (x.golge) x.golge.renk = v; })) : null) : null;
        return bolum("Görünüm", h("div",
            alan("Opaklık", kaydir((x) => Math.round((x.opak ?? 1) * 100), (x, v) => { x.opak = v / 100; }, { min: 0, max: 100, son: "%" })),
            alan("Karışım", secimK(KARISIM.map(([d, e]) => ({ deger: d, etiket: e })), (x) => x.karisim || "normal", (x, v) => { x.karisim = v; })),
            golge), { acik: tur !== "urun" });
    }

    // ── Metin ───────────────────────────────────────────────────
    const EFEKTLER = [
        { id: "yok", ad: "Yok", uygula: (o) => Object.assign(o, { kontur: null, golgeler: [], derinlik: null, vurgu: null, egri: 0 }) },
        { id: "golge", ad: "Gölge", uygula: (o) => { o.golgeler = [{ x: 0, y: o.boyut * 0.06, b: o.boyut * 0.16, renk: "rgba(0,0,0,.35)" }]; } },
        { id: "sert", ad: "Sert gölge", uygula: (o) => { o.golgeler = [{ x: o.boyut * 0.06, y: o.boyut * 0.06, b: 0, renk: KS.renkKarart(KS.dolguRenk(o.dolgu) === "transparent" ? "#000" : KS.dolguRenk(o.dolgu), 0.6) }]; } },
        { id: "kontur", ad: "Kontur", uygula: (o) => { o.kontur = { k: Math.max(1, o.boyut * 0.05), renk: KS.parlaklik(KS.dolguRenk(o.dolgu)) > 0.6 ? "#1d1d1f" : "#ffffff" }; } },
        { id: "bos", ad: "İçi boş", uygula: (o) => { const r = KS.dolguRenk(o.dolgu); o.kontur = { k: Math.max(1, o.boyut * 0.03), renk: r === "transparent" ? "#1d1d1f" : r }; o.dolgu = "transparent"; o.golgeler = []; } },
        { id: "cikartma", ad: "Çıkartma", uygula: (o) => { o.kontur = { k: Math.max(2, o.boyut * 0.09), renk: "#ffffff" }; o.golgeler = [{ x: 0, y: o.boyut * 0.05, b: o.boyut * 0.1, renk: "rgba(0,0,0,.35)" }]; } },
        { id: "neon", ad: "Neon", uygula: (o) => { const r = KS.dolguRenk(o.dolgu); const c = !r || r === "transparent" || KS.parlaklik(r) > 0.9 ? "#ff3d6e" : r; o.golgeler = [{ x: 0, y: 0, b: o.boyut * 0.06, renk: c }, { x: 0, y: 0, b: o.boyut * 0.2, renk: c }, { x: 0, y: 0, b: o.boyut * 0.45, renk: c }]; o.dolgu = "#fff7fb"; o.kontur = null; } },
        { id: "ucboyut", ad: "3B", uygula: (o) => { const r = KS.dolguRenk(o.dolgu); o.derinlik = { k: Math.max(2, o.boyut * 0.09), aci: 60, renk: KS.renkKarart(r === "transparent" ? "#666" : r, 0.55) }; } },
        { id: "retro", ad: "Retro", uygula: (o) => { const k = o.boyut * 0.045; o.golgeler = [{ x: k, y: k, b: 0, renk: "#ffd400" }, { x: k * 2, y: k * 2, b: 0, renk: "#1d4ed8" }]; } },
        { id: "vurgu", ad: "Vurgu", uygula: (o) => { const r = KS.dolguRenk(o.dolgu); const zemin = !r || r === "transparent" || KS.parlaklik(r) > 0.6 ? "#e30613" : "#ffd400"; o.vurgu = { renk: zemin, bosluk: o.boyut * 0.14, yaricap: o.boyut * 0.12 }; if (KS.parlaklik(r) < 0.6 && zemin === "#e30613") o.dolgu = "#ffffff"; } },
        { id: "parlak", ad: "Gradyan", uygula: (o) => { o.dolgu = { tip: "dogrusal", aci: 180, duraklar: [{ r: "#ffe066", k: 0 }, { r: "#ff8a00", k: 100 }] }; o.kontur = o.kontur || { k: Math.max(1, o.boyut * 0.03), renk: "#7c2d12" }; } },
        { id: "kavis", ad: "Kavis", uygula: (o) => { o.egri = o.egri || 40; } }
    ];
    function efektOnizleme(ef) {
        const o = KS.model.yeni("metin", { x: 0, y: 0, w: 120, metin: "Ag", font: "Archivo Black", boyut: 54, hiza: "center", dolgu: "#6c47ff", satir: 1 });
        ef.uygula(o);
        if (o.egri) { o.metin = "Kavis"; o.boyut = 30; o.egri = 70; const m = KS.egriOlcu(o); o.w = m.w; o.h = m.h; o.x = (120 - m.w) / 2; o.y = (90 - m.h) / 2; }
        else { o.h = 64; o.y = 12; }
        return KS.cizim.kucukResim({ arka: { dolgu: "transparent" }, ogeler: [o] }, { genislik: 120, yukseklik: 90 }, 74);
    }
    function aktifEfekt(o) {
        if (o.egri) return "kavis";
        if (o.vurgu) return "vurgu";
        if (o.derinlik) return "ucboyut";
        if ((o.golgeler || []).length >= 3) return "neon";
        if ((o.golgeler || []).length === 2) return "retro";
        if (o.dolgu === "transparent" && o.kontur) return "bos";
        if (o.kontur && o.kontur.renk === "#ffffff" && o.golgeler.length) return "cikartma";
        if (o.kontur) return "kontur";
        if (o.golgeler && o.golgeler.length) return o.golgeler[0].b ? "golge" : "sert";
        if (o.dolgu && typeof o.dolgu === "object") return "parlak";
        return "yok";
    }
    function metinBolumleri(tek) {
        const o = ilk();
        const icerik = tek ? bag(U().metinGir({ deger: o.metin, cok: true, satir: 3, degisti: (v, b) => uygula((x) => { x.metin = v; }, b) }), (x) => x.metin) : null;
        if (icerik) icerik.dataset.odak = "1";
        const font = bag(U().fontSec({ deger: o.font, degisti: (v) => { uygula((x) => { x.font = v; x.kalin = enYakin(agirliklar(v), x.kalin); }); KS.fontlar.hazir(v, ilk().kalin); kur(); } }), (x) => x.font);
        const agirlik = secimK(agirliklar(o.font).map((w) => ({ deger: String(w), etiket: AGIRLIK_ADI[w] || w })), (x) => String(enYakin(agirliklar(x.font), x.kalin)), (x, v) => { x.kalin = +v; KS.fontlar.hazir(x.font, +v); });
        const boyut = sayi("Boyut", (x) => KS.yuvarla(x.boyut, 1), (x, v) => { x.boyut = v; }, { min: 4, max: 1000, basamak: 1, son: "px" });
        const stilDugmeleri = h("div", { style: { display: "flex", gap: "2px", flexWrap: "wrap" } },
            bag(U().acKapa({ ikon: "kalin", ipucu: "Kalın", deger: o.kalin >= 700, degisti: (v) => uygula((x) => { const w = agirliklar(x.font); x.kalin = v ? enYakin(w, Math.max(700, x.kalin)) : enYakin(w, 400); }) }), (x) => x.kalin >= 700),
            bag(U().acKapa({ ikon: "italik", ipucu: "İtalik", deger: o.italik, degisti: (v) => uygula((x) => { x.italik = v; }) }), (x) => x.italik),
            bag(U().acKapa({ ikon: "alticizili", ipucu: "Altı çizili", deger: o.alti, degisti: (v) => uygula((x) => { x.alti = v; }) }), (x) => x.alti),
            bag(U().acKapa({ ikon: "ustucizili", ipucu: "Üstü çizili (eski fiyat)", deger: o.ustu, degisti: (v) => uygula((x) => { x.ustu = v; }) }), (x) => x.ustu),
            bag(U().acKapa({ ikon: "buyukHarf", ipucu: "BÜYÜK HARF", deger: o.buyuk === "uppercase", degisti: (v) => uygula((x) => { x.buyuk = v ? "uppercase" : "none"; }) }), (x) => x.buyuk === "uppercase"));
        const hiza = bolumlu([{ deger: "left", ikon: "yaziSol", ipucu: "Sola" }, { deger: "center", ikon: "yaziOrta", ipucu: "Ortala" }, { deger: "right", ikon: "yaziSag", ipucu: "Sağa" }, { deger: "justify", ikon: "yaziYasla", ipucu: "İki yana" }], (x) => x.hiza, (x, v) => { x.hiza = v; });
        const metinB = bolum("Metin", h("div", { style: { display: "grid", gap: "8px" } },
            icerik,
            font,
            h("div.izgara-2", agirlik, boyut),
            h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" } }, stilDugmeleri),
            hiza,
            alan("Renk", renk((x) => x.dolgu, (x, v) => { x.dolgu = v; }, { gradyan: true })),
            alan("Satır ara", kaydir((x) => KS.yuvarla(x.satir, 2), (x, v) => { x.satir = v; }, { min: 0.6, max: 3, adim: 0.05, basamak: 2 })),
            alan("Harf ara", kaydir((x) => x.harf || 0, (x, v) => { x.harf = v; }, { min: -100, max: 800, adim: 5 }))));
        // Efektler
        const secili = aktifEfekt(o);
        const efektIzgara = h("div.efekt-izgara", EFEKTLER.map((ef) => {
            const b = h("button.efekt-kart", { type: "button", "aria-pressed": String(ef.id === secili) }, h("span.on", efektOnizleme(ef)), ef.ad);
            b.addEventListener("click", () => {
                uygula((x) => {
                    if (ef.id !== "yok") EFEKTLER[0].uygula(x);
                    if (ef.id !== "kavis" && x.egri) x.egri = 0;
                    if (x.dolgu === "transparent" && ef.id !== "bos" && ef.id !== "yok") x.dolgu = x.kontur ? x.kontur.renk : "#1d1d1f";
                    ef.uygula(x);
                });
                kur();
            });
            return b;
        }));
        const ayrinti = h("div", { style: { display: "grid", gap: "10px", marginTop: "14px" } },
            efektAyari("Kontur", (x) => x.kontur, (x, v) => { x.kontur = v ? { k: Math.max(1, x.boyut * 0.05), renk: "#1d1d1f" } : null; }, () => [
                alan("Renk", renk((x) => x.kontur?.renk || "#000", (x, v) => { if (x.kontur) x.kontur.renk = v; })),
                alan("Kalınlık", kaydir((x) => KS.yuvarla(x.kontur?.k || 0, 1), (x, v) => { if (x.kontur) x.kontur.k = v; }, { min: 0.5, max: 40, adim: 0.5, basamak: 1, son: "px" }))]),
            efektAyari("Gölge", (x) => (x.golgeler || []).length, (x, v) => { x.golgeler = v ? [{ x: 0, y: x.boyut * 0.06, b: x.boyut * 0.16, renk: "rgba(0,0,0,.35)" }] : []; }, () => [
                alan("Renk", renk((x) => x.golgeler?.[0]?.renk || "#000", (x, v) => { if (x.golgeler[0]) x.golgeler[0].renk = v; })),
                h("div.izgara-3",
                    sayi("X", (x) => KS.yuvarla(x.golgeler?.[0]?.x || 0, 1), (x, v) => { if (x.golgeler[0]) x.golgeler[0].x = v; }, { basamak: 1 }),
                    sayi("Y", (x) => KS.yuvarla(x.golgeler?.[0]?.y || 0, 1), (x, v) => { if (x.golgeler[0]) x.golgeler[0].y = v; }, { basamak: 1 }),
                    sayi("B", (x) => KS.yuvarla(x.golgeler?.[0]?.b || 0, 1), (x, v) => { if (x.golgeler[0]) x.golgeler[0].b = v; }, { min: 0, basamak: 1, ipucu: "Bulanıklık" }))]),
            efektAyari("3B derinlik", (x) => x.derinlik, (x, v) => { x.derinlik = v ? { k: Math.max(2, x.boyut * 0.09), aci: 60, renk: "#5a0008" } : null; }, () => [
                alan("Renk", renk((x) => x.derinlik?.renk || "#000", (x, v) => { if (x.derinlik) x.derinlik.renk = v; })),
                alan("Uzunluk", kaydir((x) => KS.yuvarla(x.derinlik?.k || 0, 1), (x, v) => { if (x.derinlik) x.derinlik.k = v; }, { min: 1, max: 60, basamak: 1, son: "px" })),
                alan("Yön", kaydir((x) => x.derinlik?.aci ?? 45, (x, v) => { if (x.derinlik) x.derinlik.aci = v; }, { min: 0, max: 360, son: "°" }))]),
            efektAyari("Vurgu zemini", (x) => x.vurgu, (x, v) => { x.vurgu = v ? { renk: "#ffd400", bosluk: x.boyut * 0.14, yaricap: x.boyut * 0.12 } : null; }, () => [
                alan("Renk", renk((x) => x.vurgu?.renk || "#ffd400", (x, v) => { if (x.vurgu) x.vurgu.renk = v; })),
                alan("Boşluk", kaydir((x) => KS.yuvarla(x.vurgu?.bosluk || 0, 1), (x, v) => { if (x.vurgu) x.vurgu.bosluk = v; }, { min: 0, max: 80, basamak: 1, son: "px" })),
                alan("Köşe", kaydir((x) => KS.yuvarla(x.vurgu?.yaricap || 0, 1), (x, v) => { if (x.vurgu) x.vurgu.yaricap = v; }, { min: 0, max: 80, basamak: 1, son: "px" }))]),
            alan("Kavis", kaydir((x) => x.egri || 0, (x, v) => { x.egri = v; }, { min: -100, max: 100 })));
        return [metinB, bolum("Efektler", h("div", efektIzgara, ayrinti))];
    }
    // Aç/kapa başlıklı efekt alt bölümü
    function efektAyari(baslik, varMi, ac, ayarlar) {
        const o = ilk();
        const acik = !!varMi(o);
        return h("div", { style: { borderTop: "1px solid var(--cizgi)", paddingTop: "10px" } },
            h("div.alan", { style: { gridTemplateColumns: "1fr auto", marginTop: 0 } }, h("span.etiket", { style: { fontWeight: 600, color: "var(--yazi)" } }, baslik), anahtar(varMi, ac)),
            acik ? h("div", { style: { display: "grid", gap: "6px", marginTop: "6px" } }, ayarlar()) : null);
    }

    // ── Şekil ───────────────────────────────────────────────────
    const UC_SEKIL = new Set(["yildiz", "patlama", "cokgen", "muhur", "dalga"]);
    const IC_SEKIL = new Set(["yildiz", "patlama", "muhur", "halka"]);
    const ORAN_SEKIL = new Set(["ok", "serit", "bayrak", "paralel", "dalga", "arti"]);
    const KOSE_SEKIL = new Set(["dikdortgen", "yuvarlak", "balon", "etiket"]);
    function sekilBolumleri() {
        const o = ilk();
        if (o.sekil === "cizgi") {
            return [bolum("Çizgi", h("div", { style: { display: "grid", gap: "8px" } },
                alan("Renk", renk((x) => x.cizgi?.renk || "#000", (x, v) => { x.cizgi = Object.assign({ k: 4 }, x.cizgi, { renk: v }); })),
                alan("Kalınlık", kaydir((x) => KS.yuvarla(x.cizgi?.k || 4, 1), (x, v) => { x.cizgi = Object.assign({ renk: "#000" }, x.cizgi, { k: v }); x.h = Math.max(x.h, v + 6); }, { min: 0.5, max: 60, adim: 0.5, basamak: 1, son: "px" })),
                alan("Stil", bolumlu([{ deger: 0, etiket: "Düz" }, { deger: 1, etiket: "Kesik" }, { deger: 2, etiket: "Nokta" }], (x) => x.cizgi?.kesik || 0, (x, v) => { x.cizgi = Object.assign({}, x.cizgi, { kesik: v }); })),
                alan("Uçlar", bolumlu([{ deger: "yok", etiket: "Yok" }, { deger: "son", etiket: "→" }, { deger: "iki", etiket: "↔" }], (x) => x.uclar || "yok", (x, v) => { x.uclar = v; }))))];
        }
        const tipler = ["dikdortgen", "yuvarlak", "elips", "ucgen", "yildiz", "patlama", "muhur", "cokgen", "kalp", "ok", "serit", "bayrak", "etiket", "balon", "paralel", "dalga", "arti", "halka", "damla"];
        const sekilSec = secimK(tipler.map((t) => ({ deger: t, etiket: KS.SEKILLER[t].ad })), (x) => x.sekil, (x, v) => { x.sekil = v; if (v === "yuvarlak" && !x.kose) x.kose = Math.min(x.w, x.h) * 0.18; });
        const ek = [];
        if (KOSE_SEKIL.has(o.sekil)) ek.push(alan("Köşe", kaydir((x) => KS.yuvarla(x.kose || 0, 1), (x, v) => { x.kose = v; }, { min: 0, max: Math.round(Math.min(o.w, o.h) / 2), basamak: 1, son: "px" })));
        if (UC_SEKIL.has(o.sekil)) ek.push(alan(o.sekil === "dalga" ? "Dalga sayısı" : "Uç sayısı", kaydir((x) => x.uc || 5, (x, v) => { x.uc = v; }, { min: o.sekil === "dalga" ? 1 : 3, max: 48 })));
        if (IC_SEKIL.has(o.sekil)) ek.push(alan(o.sekil === "muhur" ? "Dalga" : "İç oran", kaydir((x) => Math.round((x.ic ?? 0.5) * 100), (x, v) => { x.ic = v / 100; }, { min: 5, max: 98, son: "%" })));
        if (ORAN_SEKIL.has(o.sekil)) ek.push(alan(o.sekil === "dalga" ? "Yükseklik" : "Oran", kaydir((x) => Math.round((x.oran ?? 0.3) * 100), (x, v) => { x.oran = v / 100; }, { min: 5, max: 100, son: "%" })));
        const kenarVar = !!(o.cizgi && o.cizgi.k > 0);
        return [
            bolum("Şekil", h("div", { style: { display: "grid", gap: "8px" } },
                alan("Tür", sekilSec),
                alan("Dolgu", renk((x) => x.dolgu, (x, v) => { x.dolgu = v; }, { gradyan: true })),
                ...ek)),
            bolum("Kenarlık", h("div", { style: { display: "grid", gap: "8px" } },
                h("div.alan", { style: { gridTemplateColumns: "1fr auto", marginTop: 0 } }, h("span.etiket", "Kenarlık"), anahtar((x) => x.cizgi && x.cizgi.k > 0, (x, v) => { x.cizgi = v ? { k: Math.max(2, Math.min(x.w, x.h) / 40), renk: "#1d1d1f", kesik: 0 } : null; })),
                kenarVar ? [
                    alan("Renk", renk((x) => x.cizgi?.renk || "#000", (x, v) => { if (x.cizgi) x.cizgi.renk = v; })),
                    alan("Kalınlık", kaydir((x) => KS.yuvarla(x.cizgi?.k || 0, 1), (x, v) => { if (x.cizgi) x.cizgi.k = v; }, { min: 0.5, max: 60, adim: 0.5, basamak: 1, son: "px" })),
                    alan("Stil", bolumlu([{ deger: 0, etiket: "Düz" }, { deger: 1, etiket: "Kesik" }, { deger: 2, etiket: "Nokta" }], (x) => x.cizgi?.kesik || 0, (x, v) => { if (x.cizgi) x.cizgi.kesik = v; }))
                ] : null), { acik: kenarVar })
        ];
    }

    // ── Görsel ──────────────────────────────────────────────────
    const FILTRELER = [
        ["Orijinal", {}], ["Canlı", { doygun: 145, kontrast: 110 }], ["Sıcak", { sicaklik: 35, doygun: 110 }], ["Soğuk", { sicaklik: -35, doygun: 95 }],
        ["Siyah beyaz", { gri: 100, kontrast: 112 }], ["Vintage", { sepya: 45, kontrast: 92, parlak: 105, doygun: 85 }], ["Parlak", { parlak: 118, kontrast: 106 }],
        ["Dramatik", { kontrast: 138, doygun: 82, parlak: 94 }], ["Soluk", { doygun: 60, kontrast: 86, parlak: 110 }]
    ];
    const MASKELER = [["yok", "Yok"], ["elips", "Daire"], ["yuvarlak", "Yuvarlak"], ["yildiz", "Yıldız"], ["patlama", "Patlama"], ["muhur", "Mühür"], ["kalp", "Kalp"], ["cokgen", "Altıgen"], ["damla", "Damla"], ["ucgen", "Üçgen"]];
    function gorselBolumleri(tek) {
        const o = ilk();
        const emoji = !o.varlik;
        const url = o.varlik ? KS.varlik.url(o.varlik) : null;
        const kaynakSatir = h("div", { style: { display: "flex", gap: "10px", alignItems: "center" } },
            h("div.kucuk-gorsel", { style: { width: "64px", height: "64px", borderRadius: "10px", background: "repeating-conic-gradient(var(--z3) 0 25%, var(--z1) 0 50%) 0 0/12px 12px", display: "grid", placeItems: "center", overflow: "hidden", flex: "none", fontFamily: "'Noto Color Emoji'", fontSize: "38px" } },
                url ? h("img", { src: url, style: { width: "100%", height: "100%", objectFit: "contain" } }) : (o.emoji || "")),
            h("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" } },
                h("button.dugme.kucuk", { type: "button", onclick: (e) => KS.varlikSecici(e.currentTarget, (id) => { KS.editor.gorselDegistir(o.id, { id }); }) }, KS.ikon("yukle", 15), "Değiştir"),
                h("button.dugme.kucuk", { type: "button", onclick: (e) => KS.paneller.emojiSec(e.currentTarget, (em) => { uygula((x) => { x.varlik = null; x.emoji = em; }); kur(); }) }, KS.ikon("emoji", 15), "Emoji")));
        const parcalar = [bolum("Görsel", h("div", { style: { display: "grid", gap: "10px" } },
            tek ? kaynakSatir : null,
            !emoji ? alan("Yerleşim", bolumlu([{ deger: "kapla", etiket: "Kapla" }, { deger: "sigdir", etiket: "Sığdır" }, { deger: "esnet", etiket: "Esnet" }], (x) => x.sigdir || "kapla", (x, v) => { x.sigdir = v; })) : null,
            !emoji && tek ? h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } },
                h("button.dugme.kucuk", { type: "button", onclick: () => KS.editor.kirpBaslat(o.id) }, KS.ikon("kirp", 15), "Kırp"),
                h("button.dugme.kucuk", { type: "button", onclick: arkaTemizlePenceresi }, KS.ikon("sihir", 15), "Arka planı temizle"),
                h("button.dugme.kucuk", { type: "button", onclick: () => KS.olay.yay("arkaplan-yap", o.id) }, KS.ikon("arkaplan", 15), "Arka plan yap")) : null))];
        if (!emoji) {
            parcalar.push(bolum("Kadraj", h("div", { style: { display: "grid", gap: "6px" } },
                alan("Yakınlık", kaydir((x) => Math.round((x.yakin || 1) * 100), (x, v) => { x.yakin = v / 100; }, { min: 100, max: 400, son: "%" })),
                alan("Yatay", kaydir((x) => x.odakX ?? 50, (x, v) => { x.odakX = v; }, { min: 0, max: 100, son: "%" })),
                alan("Dikey", kaydir((x) => x.odakY ?? 50, (x, v) => { x.odakY = v; }, { min: 0, max: 100, son: "%" })),
                h("p.ipucu-metin", { style: { margin: "4px 0 0" } }, "İpucu: Görsele çift tıklayıp sürükleyerek de kadrajlayabilirsiniz.")), { acik: false }));
        }
        // Filtre hazırları
        const fil = o.filtre || {};
        const filtreIzgara = h("div.efekt-izgara", FILTRELER.map(([ad, f]) => {
            const tam = Object.assign({}, KS.FILTRE_VARSAYILAN, f);
            const secili = KS.esit(Object.assign({}, KS.FILTRE_VARSAYILAN, fil), tam);
            const on = url ? h("img", { src: url, style: { width: "100%", height: "100%", objectFit: "cover", filter: KS.filtreCss(tam) } }) : h("span", { style: { fontFamily: "'Noto Color Emoji'", fontSize: "30px", filter: KS.filtreCss(tam) } }, o.emoji);
            const b = h("button.efekt-kart", { type: "button", "aria-pressed": String(secili) }, h("span.on", on), ad);
            b.addEventListener("click", () => { uygula((x) => { x.filtre = Object.keys(f).length ? Object.assign({}, KS.FILTRE_VARSAYILAN, f) : null; }); kur(); });
            return b;
        }));
        const fAyar = (etiket, k, min, max, son) => alan(etiket, kaydir((x) => (x.filtre || KS.FILTRE_VARSAYILAN)[k], (x, v) => { x.filtre = Object.assign({}, KS.FILTRE_VARSAYILAN, x.filtre || {}, { [k]: v }); }, { min, max, son }));
        parcalar.push(bolum("Filtreler", h("div", filtreIzgara, h("div", { style: { display: "grid", gap: "4px", marginTop: "14px" } },
            fAyar("Parlaklık", "parlak", 0, 200, "%"), fAyar("Kontrast", "kontrast", 0, 200, "%"), fAyar("Doygunluk", "doygun", 0, 250, "%"),
            fAyar("Sıcaklık", "sicaklik", -100, 100, ""), fAyar("Bulanıklık", "bulanik", 0, 30, "px"), fAyar("Renk tonu", "ton", -180, 180, "°"))), { acik: false }));
        const cerceveVar = !!(o.cerceve && o.cerceve.k > 0);
        parcalar.push(bolum("Biçim ve çerçeve", h("div", { style: { display: "grid", gap: "8px" } },
            alan("Maske", secimK(MASKELER.map(([d, e]) => ({ deger: d, etiket: e })), (x) => x.maske || "yok", (x, v) => { x.maske = v === "yok" ? null : v; })),
            alan("Köşe", kaydir((x) => KS.yuvarla(x.kose || 0, 1), (x, v) => { x.kose = v; }, { min: 0, max: Math.round(Math.min(o.w, o.h) / 2), basamak: 1, son: "px" })),
            h("div.alan", { style: { gridTemplateColumns: "1fr auto" } }, h("span.etiket", "Çerçeve"), anahtar((x) => x.cerceve && x.cerceve.k > 0, (x, v) => { x.cerceve = v ? { k: Math.max(2, Math.min(x.w, x.h) / 40), renk: "#ffffff" } : null; })),
            cerceveVar ? [alan("Renk", renk((x) => x.cerceve?.renk || "#fff", (x, v) => { if (x.cerceve) x.cerceve.renk = v; })),
                alan("Kalınlık", kaydir((x) => KS.yuvarla(x.cerceve?.k || 0, 1), (x, v) => { if (x.cerceve) x.cerceve.k = v; }, { min: 1, max: 60, basamak: 1, son: "px" }))] : null), { acik: false }));
        return parcalar;
    }
    function arkaTemizlePenceresi() {
        const o = ilk();
        if (!o || !o.varlik) return;
        let esik = 30, sonuc = null;
        const v = KS.varlik.al(o.varlik);
        const once = h("img", { src: v.url, style: { width: "100%", height: "260px", objectFit: "contain" } });
        const sonra = h("img", { style: { width: "100%", height: "260px", objectFit: "contain" } });
        const kutu = (baslik, el) => h("div", h("div.bolum-baslik", { style: { marginTop: 0 } }, baslik), h("div", { style: { borderRadius: "10px", background: "repeating-conic-gradient(var(--z3) 0 25%, var(--z1) 0 50%) 0 0/16px 16px", padding: "8px" } }, el));
        const durum = h("p.ipucu-metin", "Hesaplanıyor…");
        const hesapla = KS.gecikmeli(async () => {
            durum.textContent = "Hesaplanıyor…";
            try {
                sonuc = await KS.arkaPlanTemizle(v.url, esik);
                if (sonra.src) URL.revokeObjectURL(sonra.src);
                sonra.src = URL.createObjectURL(sonuc.blob);
                durum.textContent = "Kenarlardan başlayarak arka plan rengine yakın pikseller saydamlaştırıldı. Ürünün içindeki beyaz alanlar korunur.";
            } catch (h) { durum.textContent = "Görsel işlenemedi: " + h.message; }
        }, 200);
        const toleransK = U().kaydirici({ min: 2, max: 120, deger: esik, degisti: (val) => { esik = val; hesapla(); } });
        hesapla.hemen();
        U().pencere({
            baslik: "Arka planı temizle", aciklama: "Beyaz ya da düz renkli arka planlı ürün fotoğrafları için.", sinif: "genis",
            icerik: h("div", h("div.izgara-2", { style: { gap: "16px" } }, kutu("Önce", once), kutu("Sonra", sonra)), alan("Tolerans", toleransK.el), durum),
            kapaninca: () => { if (sonra.src) setTimeout(() => URL.revokeObjectURL(sonra.src), 1000); },
            dugmeler: [{ etiket: "Vazgeç" }, {
                etiket: "Uygula", birincil: true, fn: async () => {
                    if (!sonuc) return false;
                    const id = await KS.varlik.kopyala(o.varlik, sonuc.blob);
                    KS.editor.degistir((x) => { x.varlik = id; x.sigdir = "sigdir"; }, { idler: [o.id] });
                    for (const u of E.belge.urunler) if (u.gorsel && u.gorsel.varlik === o.varlik) u.gorsel.varlik = id;
                    kur();
                    KS.bildir("Arka plan temizlendi", { tur: "basari" });
                }
            }]
        });
    }

    // ── Ürün kartı ──────────────────────────────────────────────
    const KART_TEMALARI = [
        { ad: "Kırmızı", kart: "#ffffff", fiyatZemin: "#e30613", fiyatRenk: "#ffffff", rozetZemin: "#ffd400", rozetRenk: "#e30613", adRenk: "#1d1d1f", aciklamaRenk: "#6b7280", eskiRenk: "#6b7280", gorselZemin: "#fff1f1", kenar: "#e5e7eb" },
        { ad: "Sarı", kart: "#ffffff", fiyatZemin: "#ffd400", fiyatRenk: "#c1121f", rozetZemin: "#e30613", rozetRenk: "#ffffff", adRenk: "#1d1d1f", aciklamaRenk: "#6b7280", eskiRenk: "#6b7280", gorselZemin: "#fff8d6", kenar: "#e5e7eb" },
        { ad: "Yeşil", kart: "#ffffff", fiyatZemin: "#16a34a", fiyatRenk: "#ffffff", rozetZemin: "#facc15", rozetRenk: "#14532d", adRenk: "#14532d", aciklamaRenk: "#4b5563", eskiRenk: "#6b7280", gorselZemin: "#eef9e4", kenar: "#d1fae5" },
        { ad: "Mavi", kart: "#ffffff", fiyatZemin: "#0284c7", fiyatRenk: "#ffffff", rozetZemin: "#facc15", rozetRenk: "#0c4a6e", adRenk: "#0c4a6e", aciklamaRenk: "#4b5563", eskiRenk: "#64748b", gorselZemin: "#e0f2fe", kenar: "#e0f2fe" },
        { ad: "Lacivert", kart: "#0b1b3f", fiyatZemin: "#ffd400", fiyatRenk: "#0b1b3f", rozetZemin: "#e30613", rozetRenk: "#ffffff", adRenk: "#ffffff", aciklamaRenk: "#93c5fd", eskiRenk: "#93c5fd", gorselZemin: "rgba(255,255,255,.08)", kenar: "#1e3a8a" },
        { ad: "Siyah-altın", kart: "#121212", fiyatZemin: "#d4af37", fiyatRenk: "#121212", rozetZemin: "#d4af37", rozetRenk: "#121212", adRenk: "#ffffff", aciklamaRenk: "#a3a3a3", eskiRenk: "#a3a3a3", gorselZemin: "rgba(255,255,255,.06)", kenar: "#3f3f46" },
        { ad: "Turuncu", kart: "#fff7ed", fiyatZemin: "#ea580c", fiyatRenk: "#ffffff", rozetZemin: "#1d1d1f", rozetRenk: "#ffffff", adRenk: "#431407", aciklamaRenk: "#9a3412", eskiRenk: "#9a3412", gorselZemin: "#ffedd5", kenar: "#fed7aa" },
        { ad: "Mor", kart: "#ffffff", fiyatZemin: "#6c47ff", fiyatRenk: "#ffffff", rozetZemin: "#ff3d6e", rozetRenk: "#ffffff", adRenk: "#1e1b4b", aciklamaRenk: "#6b7280", eskiRenk: "#6b7280", gorselZemin: "#efeaff", kenar: "#ede9fe" },
        { ad: "Pembe", kart: "#fff1f5", fiyatZemin: "#ec4899", fiyatRenk: "#ffffff", rozetZemin: "#6c47ff", rozetRenk: "#ffffff", adRenk: "#500724", aciklamaRenk: "#9d174d", eskiRenk: "#9d174d", gorselZemin: "#fce7f3", kenar: "#fbcfe8" },
        { ad: "Bordo", kart: "#fff8ef", fiyatZemin: "#7f1d1d", fiyatRenk: "#ffe8b6", rozetZemin: "#e9c46a", rozetRenk: "#4a0d14", adRenk: "#2a0a0d", aciklamaRenk: "#7c2d12", eskiRenk: "#9a3412", gorselZemin: "#fdecdc", kenar: "#f5d9b8" },
        { ad: "Gradyan", kart: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#ffffff", k: 0 }, { r: "#fff1d6", k: 100 }] }, fiyatZemin: { tip: "dogrusal", aci: 135, duraklar: [{ r: "#ff3d6e", k: 0 }, { r: "#ff7a00", k: 100 }] }, fiyatRenk: "#ffffff", rozetZemin: "#6c47ff", rozetRenk: "#ffffff", adRenk: "#1d1d1f", aciklamaRenk: "#6b7280", eskiRenk: "#6b7280", gorselZemin: "#fff4e0", kenar: "#fde68a" },
        { ad: "Saydam", kart: "rgba(255,255,255,0)", kartGolge: false, fiyatZemin: "#e30613", fiyatRenk: "#ffffff", rozetZemin: "#ffd400", rozetRenk: "#e30613", adRenk: "#1d1d1f", aciklamaRenk: "#4b5563", eskiRenk: "#4b5563", gorselZemin: "rgba(0,0,0,.05)", kenar: "#e5e7eb" }
    ];
    function urunVerisiYaz(alanlar) {
        // Bağlı ürün varsa listedeki ürünü ve onu gösteren tüm kartları güncelle
        const l = ogeler();
        for (const o of l) {
            const u = o.urunId && E.belge.urunler.find((x) => x.id === o.urunId);
            if (u) { Object.assign(u, KS.kopya(alanlar)); KS.editor.urunKartlariniEsitle(u); }
            else Object.assign(o.veri, KS.kopya(alanlar));
        }
    }
    function urunBolumleri(tek) {
        const o = ilk();
        const v = o.veri;
        const bagli = o.urunId && E.belge.urunler.find((x) => x.id === o.urunId);
        const parcalar = [];
        if (tek) {
            const girdi = (etiket, k, oz = {}) => {
                const fiyatMi = k === "fiyat" || k === "eski";
                const bicim = (x) => (fiyatMi ? (x.veri[k] ? KS.fiyatParca(x.veri[k]).metin : "") : x.veri[k] || "");
                const g = bag(U().metinGir({
                    deger: bicim(o), yer: oz.yer, degisti: (val, b) => {
                        const deger = fiyatMi ? KS.fiyatOku(val) : val;
                        urunVerisiYaz({ [k]: deger });
                        KS.editor.tumunuCiz();
                        if (b) { KS.gecmis.kaydet(); KS.olay.yay("urunler"); } else KS.gecmis.kaydetGecikmeli();
                    }
                }), bicim);
                if (k === "ad") g.dataset.odak = "1";
                return h("label.form-alan", { style: oz.tam ? { gridColumn: "1 / -1" } : null }, etiket, g);
            };
            const gorselSatir = h("div", { style: { display: "flex", gap: "8px", alignItems: "center", gridColumn: "1 / -1" } },
                h("div.kucuk-gorsel", { style: { width: "48px", height: "48px", borderRadius: "10px", background: "var(--z2)", display: "grid", placeItems: "center", overflow: "hidden", fontFamily: "'Noto Color Emoji'", fontSize: "28px", flex: "none" } },
                    v.gorsel.varlik && KS.varlik.url(v.gorsel.varlik) ? h("img", { src: KS.varlik.url(v.gorsel.varlik), style: { width: "100%", height: "100%", objectFit: "contain" } }) : (v.gorsel.emoji || "🛒")),
                h("button.dugme.kucuk", { type: "button", onclick: (e) => KS.varlikSecici(e.currentTarget, (id) => { KS.editor.gorselDegistir(o.id, { id }); kur(); }) }, KS.ikon("yukle", 15), "Görsel"),
                h("button.dugme.kucuk", { type: "button", onclick: (e) => KS.paneller.emojiSec(e.currentTarget, (em) => { urunVerisiYaz({ gorsel: { varlik: null, emoji: em } }); KS.editor.tumunuCiz(); KS.gecmis.kaydet(); kur(); }) }, KS.ikon("emoji", 15), "Emoji"));
            parcalar.push(bolum("Ürün bilgisi", h("div",
                h("div.form-izgara", { style: { gap: "10px" } },
                    girdi("Ürün adı", "ad", { tam: true }), girdi("Açıklama / gramaj", "aciklama", { tam: true }),
                    girdi("Fiyat (₺)", "fiyat"), girdi("Eski fiyat", "eski", { yer: "Yoksa boş" }),
                    girdi("Birim", "birim", { yer: "ör. /kg" }), girdi("Rozet", "rozet", { yer: "Boş: indirim %" }),
                    gorselSatir),
                bagli ? h("div.bilgi-kutu", KS.ikon("baglanti", 16), h("div", "Ürün listesine bağlı: değişiklikler bu ürünü gösteren tüm kartlara uygulanır. ",
                    h("a", { href: "#", style: { color: "var(--vurgu)", fontWeight: 600 }, onclick: (e) => { e.preventDefault(); uygula((x) => { x.urunId = null; }); kur(); KS.bildir("Bu kartın listeyle bağı koparıldı"); } }, "Bağı kopar"))) : null)));
        }
        // Düzen
        const duzenIzgara = h("div.duzen-izgara", Object.entries(KS.URUN_DUZENLERI).map(([k, d]) => {
            const ornek = KS.model.yeni("urun", { x: 0, y: 0, w: k === "yatay" || k === "raf" ? 240 : 200, h: k === "yatay" ? 120 : k === "raf" ? 130 : 220, veri: KS.kopya(o.veri), stil: Object.assign(KS.kopya(o.stil), { duzen: k }) });
            const on = KS.cizim.kucukResim({ arka: { dolgu: "transparent" }, ogeler: [ornek] }, { genislik: ornek.w, yukseklik: ornek.h }, k === "yatay" || k === "raf" ? 76 : 64);
            const b = h("button.duzen-kart", { type: "button", "aria-pressed": String(o.stil.duzen === k) }, h("span.on", on), d.ad);
            b.addEventListener("click", () => { uygula((x) => { x.stil.duzen = k; }); kur(); });
            return b;
        }));
        const temalar = h("div.renk-temalari", KART_TEMALARI.map((t) => {
            const b = h("button.tema-kart", { type: "button", title: t.ad }, h("span", { style: { background: KS.dolguCss(t.kart) } }), h("span", { style: { background: KS.dolguCss(t.fiyatZemin) } }));
            b.addEventListener("click", () => { uygula((x) => { const { ad, ...renkler } = t; void ad; Object.assign(x.stil, KS.kopya(renkler)); if (!("kartGolge" in t)) x.stil.kartGolge = true; }); kur(); });
            return b;
        }));
        const s = (k) => (x) => x.stil[k];
        const sy = (k) => (x, val) => { x.stil[k] = val; };
        parcalar.push(bolum("Kart düzeni", h("div", duzenIzgara, h("div.bolum-baslik", { style: { margin: "16px 0 8px" } }, "Renk teması"), temalar)));
        parcalar.push(bolum("Renkler", h("div", { style: { display: "grid", gap: "6px" } },
            alan("Kart", renk(s("kart"), sy("kart"), { gradyan: true })),
            alan("Fiyat zemini", renk(s("fiyatZemin"), sy("fiyatZemin"), { gradyan: true })),
            alan("Fiyat yazısı", renk(s("fiyatRenk"), sy("fiyatRenk"))),
            alan("Ürün adı", renk(s("adRenk"), sy("adRenk"))),
            alan("Açıklama", renk(s("aciklamaRenk"), sy("aciklamaRenk"))),
            alan("Eski fiyat", renk(s("eskiRenk"), sy("eskiRenk"))),
            alan("Rozet", h("div.izgara-2", renk(s("rozetZemin"), sy("rozetZemin")), renk(s("rozetRenk"), sy("rozetRenk")))),
            o.stil.duzen === "daire" ? alan("Görsel zemini", renk((x) => x.stil.gorselZemin || "rgba(0,0,0,.05)", sy("gorselZemin"))) : null,
            alan("Kenarlık", h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" } }, renk(s("kenar"), sy("kenar")),
                sayi("K", (x) => x.stil.kalinlik || 0, (x, val) => { x.stil.kalinlik = val; }, { min: 0, max: 10, adim: 0.5, basamak: 1, ipucu: "Kenarlık kalınlığı" })))), { acik: false }));
        parcalar.push(bolum("Yazı ve ölçü", h("div", { style: { display: "grid", gap: "8px" } },
            alan("Ad fontu", bag(U().fontSec({ deger: o.stil.adFont, degisti: (val) => { uygula((x) => { x.stil.adFont = val; x.stil.adKalin = enYakin(agirliklar(val), x.stil.adKalin); }); KS.fontlar.hazir(val, 800); kur(); } }), s("adFont"))),
            alan("Ad kalınlığı", secimK(agirliklar(o.stil.adFont).map((w) => ({ deger: String(w), etiket: AGIRLIK_ADI[w] || w })), (x) => String(enYakin(agirliklar(x.stil.adFont), x.stil.adKalin)), (x, val) => { x.stil.adKalin = +val; })),
            alan("Ad boyutu", kaydir(s("adOlcek"), sy("adOlcek"), { min: 40, max: 250, son: "%" })),
            alan("Fiyat fontu", bag(U().fontSec({ deger: o.stil.fiyatFont, degisti: (val) => { uygula((x) => { x.stil.fiyatFont = val; }); KS.fontlar.hazir(val, 400); } }), s("fiyatFont"))),
            alan("Fiyat boyutu", kaydir(s("fiyatOlcek"), sy("fiyatOlcek"), { min: 40, max: 250, son: "%" })),
            alan("Görsel boyutu", kaydir(s("gorselOlcek"), sy("gorselOlcek"), { min: 30, max: 150, son: "%" })),
            alan("Köşe", kaydir((x) => x.stil.kose || 0, sy("kose"), { min: 0, max: 30 })),
            alan("Hizalama", bolumlu([{ deger: "sol", ikon: "yaziSol", ipucu: "Sola" }, { deger: "orta", ikon: "yaziOrta", ipucu: "Ortala" }], (x) => x.stil.hiza || "sol", (x, val) => { x.stil.hiza = val; })),
            alan("Kuruş", bolumlu([{ deger: "ust", etiket: "49⁹⁰" }, { deger: "duz", etiket: "49,90" }, { deger: "gizle", etiket: ",00 gizle" }], s("kurus"), sy("kurus"))),
            alan("Para birimi", bolumlu([{ deger: "₺", etiket: "₺" }, { deger: "TL", etiket: "TL" }, { deger: "", etiket: "Yok" }], s("para"), sy("para"))))));
        const gosterAyar = (etiket, k) => h("div.alan", { style: { gridTemplateColumns: "1fr auto" } }, h("span.etiket", etiket), anahtar(s(k), sy(k)));
        parcalar.push(bolum("Göster / gizle", h("div",
            gosterAyar("Eski fiyat (üstü çizili)", "eskiGoster"), gosterAyar("İndirim rozeti", "rozetGoster"),
            gosterAyar("Açıklama", "aciklamaGoster"), gosterAyar("Kart gölgesi", "kartGolge")), { acik: false }));
        const hepsine = h("button.dugme.genis", { type: "button" }, KS.ikon("firca", 16), "Bu stili tüm kartlara uygula");
        hepsine.addEventListener("click", (e) => KS.ui.menu([
            { ikon: "sayfa", etiket: "Bu sayfadaki kartlar", fn: () => stiliYay(o, "sayfa") },
            { ikon: "katmanlar", etiket: "Katalogdaki tüm kartlar", fn: () => stiliYay(o, "hepsi") }
        ], e.currentTarget, { yer: "ust" }));
        parcalar.push(h("div.oz-bolum", { style: { display: "grid", gap: "8px" } }, hepsine,
            tek ? h("button.dugme.genis", { type: "button", onclick: () => KS.olay.yay("ayristir", o.id) }, KS.ikon("ayristir", 16), "Serbest öğelere ayır") : null));
        return parcalar;
    }
    function stiliYay(kaynak, kapsam) {
        const stil = KS.kopya(kaynak.stil);
        const sayfalar = kapsam === "sayfa" ? [KS.editor.sayfa()] : E.belge.sayfalar;
        let n = 0;
        for (const s of sayfalar) for (const o of s.ogeler) if (o.tur === "urun" && o.id !== kaynak.id) { o.stil = KS.kopya(stil); n++; }
        KS.editor.tumunuCiz();
        KS.gecmis.kaydet();
        KS.bildir(`${n} karta uygulandı`, { tur: "basari", eylem: { metin: "Geri al", fn: () => KS.gecmis.geri() } });
    }

    // ── Fiyat etiketi ───────────────────────────────────────────
    const FIYAT_SEKIL_AD = { patlama: "Patlama", muhur: "Mühür", daire: "Daire", kutu: "Kutu", yuvarlak: "Yuvarlak", hap: "Hap", etiket: "Etiket", bayrak: "Bayrak", paralel: "Eğik", yok: "Yalın" };
    function fiyatBolumleri(tek) {
        const o = ilk();
        const fiyatGir = (etiket, k) => {
            const g = bag(U().metinGir({ deger: o[k] ? KS.fiyatParca(o[k]).metin : "", yer: k === "eski" ? "Yoksa boş" : "", degisti: (val, b) => uygula((x) => { x[k] = KS.fiyatOku(val); }, b) }), (x) => (x[k] ? KS.fiyatParca(x[k]).metin : ""));
            if (k === "fiyat") g.dataset.odak = "1";
            return h("label.form-alan", etiket, g);
        };
        const metinGir = (etiket, k, yer) => h("label.form-alan", etiket, bag(U().metinGir({ deger: o[k], yer, degisti: (val, b) => uygula((x) => { x[k] = val; }, b) }), (x) => x[k]));
        const sekiller = h("div.duzen-izgara", { style: { gridTemplateColumns: "repeat(5, minmax(0, 1fr))" } }, Object.keys(KS.FIYAT_SEKIL).map((k) => {
            const ornek = KS.model.yeni("fiyat", Object.assign(KS.kopya(o), { id: KS.kimlik("o"), x: 0, y: 0, w: 120, h: k === "patlama" || k === "muhur" || k === "daire" ? 120 : 70, sekil: k, aci: 0, golge: null, eski: 0, ust: "", alt: "" }));
            const on = KS.cizim.kucukResim({ arka: { dolgu: "transparent" }, ogeler: [ornek] }, { genislik: 120, yukseklik: ornek.h }, 44);
            const b = h("button.duzen-kart", { type: "button", "aria-pressed": String(o.sekil === k), title: FIYAT_SEKIL_AD[k] }, h("span.on", { style: { aspectRatio: "1" } }, on));
            b.addEventListener("click", () => { uygula((x) => { x.sekil = k; }); kur(); });
            return b;
        }));
        const kenarVar = !!(o.cizgi && o.cizgi.k > 0);
        return [
            bolum("Fiyat", h("div.form-izgara", { style: { gap: "10px" } },
                fiyatGir("Fiyat (₺)", "fiyat"), fiyatGir("Eski fiyat", "eski"),
                metinGir("Üst yazı", "ust", "ör. SADECE"), metinGir("Alt yazı", "alt", "ör. KG"))),
            bolum("Biçim", h("div", { style: { display: "grid", gap: "8px" } }, sekiller,
                alan("Zemin", renk((x) => x.zemin, (x, val) => { x.zemin = val; }, { gradyan: true })),
                alan("Yazı", renk((x) => x.renk, (x, val) => { x.renk = val; })),
                alan("Eski fiyat", renk((x) => x.eskiRenk, (x, val) => { x.eskiRenk = val; })),
                o.sekil === "patlama" || o.sekil === "muhur" ? alan("Uç sayısı", kaydir((x) => x.uc || 18, (x, val) => { x.uc = val; }, { min: 6, max: 48 })) : null,
                o.sekil === "patlama" ? alan("Derinlik", kaydir((x) => Math.round((x.ic ?? 0.86) * 100), (x, val) => { x.ic = val / 100; }, { min: 50, max: 98, son: "%" })) : null,
                h("div.alan", { style: { gridTemplateColumns: "1fr auto" } }, h("span.etiket", "Kenarlık"), anahtar((x) => x.cizgi && x.cizgi.k > 0, (x, val) => { x.cizgi = val ? { k: Math.max(2, Math.min(x.w, x.h) / 40), renk: "#ffffff" } : null; })),
                kenarVar ? [alan("Kenar rengi", renk((x) => x.cizgi?.renk || "#fff", (x, val) => { if (x.cizgi) x.cizgi.renk = val; })),
                    alan("Kalınlık", kaydir((x) => KS.yuvarla(x.cizgi?.k || 0, 1), (x, val) => { if (x.cizgi) x.cizgi.k = val; }, { min: 1, max: 40, basamak: 1, son: "px" }))] : null)),
            bolum("Yazı", h("div", { style: { display: "grid", gap: "8px" } },
                alan("Font", bag(U().fontSec({ deger: o.font, degisti: (val) => { uygula((x) => { x.font = val; }); KS.fontlar.hazir(val, 400); } }), (x) => x.font)),
                alan("Ölçek", kaydir((x) => x.olcek || 100, (x, val) => { x.olcek = val; }, { min: 40, max: 200, son: "%" })),
                alan("Kuruş", bolumlu([{ deger: "ust", etiket: "49⁹⁰" }, { deger: "duz", etiket: "49,90" }, { deger: "gizle", etiket: ",00 gizle" }], (x) => x.kurus, (x, val) => { x.kurus = val; })),
                alan("Para birimi", bolumlu([{ deger: "₺", etiket: "₺" }, { deger: "TL", etiket: "TL" }, { deger: "", etiket: "Yok" }], (x) => x.para, (x, val) => { x.para = val; }))))
        ];
    }

    // ── QR ──────────────────────────────────────────────────────
    function qrBolumu() {
        const o = ilk();
        const g = bag(U().metinGir({ deger: o.veri, yer: "https://…", degisti: (v, b) => uygula((x) => { x.veri = v; }, b) }), (x) => x.veri);
        g.dataset.odak = "1";
        return bolum("QR kod", h("div", { style: { display: "grid", gap: "8px" } },
            h("label.form-alan", "Bağlantı ya da metin", g),
            h("p.ipucu-metin", { style: { margin: 0 } }, "WhatsApp için: https://wa.me/905xxxxxxxxx · Konum için Google Haritalar bağlantısı."),
            alan("Renk", renk((x) => x.renk, (x, v) => { x.renk = v; })),
            alan("Zemin", renk((x) => x.zemin, (x, v) => { x.zemin = v; }))));
    }

    // ── Hiçbir şey seçili değil: sayfa ve belge ─────────────────
    function sayfaPaneli() {
        const b = E.belge;
        const s = KS.editor.sayfa();
        const no = b.sayfalar.indexOf(s) + 1;
        const sayfaRenk = U().renkSec({
            deger: s.arka.dolgu, gradyan: true, degisti: (v, bitti) => {
                KS.editor.sayfa().arka.dolgu = v; KS.editor.sayfaYenidenCiz();
                if (bitti) KS.gecmis.kaydet(); else KS.gecmis.kaydetGecikmeli();
            }
        });
        baglar.push({ kontrol: sayfaRenk, oku: () => KS.editor.sayfa().arka.dolgu, sayfa: true });
        const renkler = KS.editor.belgeRenkleri().slice(0, 24);
        const renkIzgara = h("div.rs-ornekler", { style: { gridTemplateColumns: "repeat(8, 1fr)" } }, renkler.map((r) => {
            const d = h("button.rs-ornek", { type: "button", title: `${r} — tıklayıp değiştirin` });
            d.style.setProperty("--r", r);
            d.addEventListener("click", () => {
                let son = r;
                KS.renkSecici.ac(d, {
                    deger: r, degisti: (yeni, bitti) => {
                        if (!bitti) return;
                        const n = KS.editor.renkDegistirHepsi(son, yeni);
                        son = yeni;
                        d.style.setProperty("--r", yeni);
                        KS.bildir(`${n} yerde değiştirildi`);
                    }
                });
            });
            return d;
        }));
        const kartSayisi = b.sayfalar.reduce((t, x) => t + x.ogeler.filter((o) => o.tur === "urun").length, 0);
        const boyutAd = (KS.BOYUTLAR.find((x) => x.g === b.genislik && x.y === b.yukseklik) || {}).ad || "Özel boyut";
        return [
            h("div.oz-kafa", h("span.tur-ikon", KS.ikon("sayfa", 17)), h("div.baslik", h("b", `Sayfa ${no}`), h("small", "Hiçbir öğe seçili değil"))),
            bolum("Sayfa", h("div", { style: { display: "grid", gap: "8px" } },
                alan("Arka plan", sayfaRenk.el),
                h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } },
                    h("button.dugme.kucuk", { type: "button", onclick: () => KS.paneller.ac("arkaplan") }, KS.ikon("arkaplan", 15), "Desen ve görsel"),
                    h("button.dugme.kucuk", { type: "button", onclick: () => KS.editor.sayfaCogalt() }, KS.ikon("kopyala", 15), "Çoğalt"),
                    h("button.dugme.kucuk", { type: "button", onclick: () => KS.editor.sayfaEkle() }, KS.ikon("sayfaEkle", 15), "Sayfa ekle")))),
            bolum("Katalog", h("div", { style: { display: "grid", gap: "6px" } },
                h("div.hizli-kisayol", h("span", "Boyut"), h("b", `${boyutAd} · ${b.genislik} × ${b.yukseklik} px`),
                    h("span", "Sayfa"), h("b", String(b.sayfalar.length)), h("span", "Ürün kartı"), h("b", String(kartSayisi)), h("span", "Ürün listesi"), h("b", String(b.urunler.length))),
                h("button.dugme.kucuk", { type: "button", style: { marginTop: "8px" }, onclick: (e) => document.getElementById("boyutDugme").click() }, KS.ikon("sigdir", 15), "Boyutu değiştir"))),
            renkler.length ? bolum("Belge renkleri", h("div", h("p.ipucu-metin", { style: { marginTop: 0 } }, "Bir renge tıklayıp değiştirin: katalogdaki tüm kullanımları birlikte değişir. Marka rengini değiştirmek için idealdir."), renkIzgara)) : null,
            kartSayisi ? bolum("Tüm ürün kartları", tumKartlar(), { acik: false }) : null,
            bolum("İpuçları", h("div.hizli-kisayol",
                h("span", "Metni düzenle"), h("kbd", "Çift tık"), h("span", "Çoklu seçim"), h("kbd", "Shift + tık"),
                h("span", "Kopyasını sürükle"), h("kbd", "Alt + sürükle"), h("span", "Yakınlaştır"), h("kbd", KS.kisayol("Ctrl + tekerlek")),
                h("span", "Tüm kısayollar"), h("kbd", "?")), { acik: false })
        ].filter(Boolean);
    }
    function tumKartlar() {
        const kartlar = () => E.belge.sayfalar.flatMap((s) => s.ogeler.filter((o) => o.tur === "urun"));
        const uygulaHepsi = (fn) => { for (const o of kartlar()) fn(o); KS.editor.tumunuCiz(); KS.gecmis.kaydet(); };
        const duzen = h("div.duzen-izgara", Object.entries(KS.URUN_DUZENLERI).map(([k, d]) => h("button.duzen-kart", { type: "button", onclick: () => uygulaHepsi((o) => { o.stil.duzen = k; }) }, h("span.on", { style: { aspectRatio: "2.4", fontSize: "11px" } }, d.ad))));
        const temalar = h("div.renk-temalari", KART_TEMALARI.map((t) => h("button.tema-kart", { type: "button", title: t.ad, onclick: () => uygulaHepsi((o) => { const { ad, ...r } = t; void ad; Object.assign(o.stil, KS.kopya(r)); }) },
            h("span", { style: { background: KS.dolguCss(t.kart) } }), h("span", { style: { background: KS.dolguCss(t.fiyatZemin) } }))));
        return h("div", h("p.ipucu-metin", { style: { marginTop: 0 } }, "Katalogdaki bütün ürün kartlarının düzenini ya da renk temasını tek tıkla değiştirin."), duzen, h("div.bolum-baslik", "Renk teması"), temalar);
    }

    KS.ozellikler = { baslat, kur, yenile, KART_TEMALARI };
})();
