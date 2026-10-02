// Belge modeli: sayfa boyutları, öğe varsayılanları, fabrika işlevleri, ölçekleme ve geri al / yinele geçmişi.
//
// Belge  = { surum, id, ad, genislik, yukseklik, sayfalar: [Sayfa], urunler: [Urun], marka }
// Sayfa  = { id, ad, arka: { dolgu, resim, desen }, ogeler: [Oge] }   (ogeler dizisi alttan üste çizim sırasıdır)
// Oge    = ortak alanlar (x, y, w, h, aci, opak …) + türe özgü alanlar (metin, sekil, gorsel, urun, fiyat, qr)
// Görseller belgenin içinde değil, KS.varlik deposunda tutulur; öğe yalnızca varlık kimliğini taşır.
(function () {
    "use strict";
    const KS = window.KS;

    KS.BOYUTLAR = [
        { ad: "A4 Dikey", g: 794, y: 1123, grup: "Baskı", not: "210 × 297 mm" },
        { ad: "A4 Yatay", g: 1123, y: 794, grup: "Baskı", not: "297 × 210 mm" },
        { ad: "A3 Dikey", g: 1123, y: 1587, grup: "Baskı", not: "297 × 420 mm" },
        { ad: "A5 Dikey", g: 559, y: 794, grup: "Baskı", not: "148 × 210 mm" },
        { ad: "Üçlü broşür paneli", g: 374, y: 794, grup: "Baskı", not: "99 × 210 mm" },
        { ad: "Instagram gönderi", g: 1080, y: 1080, grup: "Sosyal medya", not: "1080 × 1080" },
        { ad: "Instagram dikey", g: 1080, y: 1350, grup: "Sosyal medya", not: "1080 × 1350" },
        { ad: "Hikâye / Durum", g: 1080, y: 1920, grup: "Sosyal medya", not: "1080 × 1920" },
        { ad: "Facebook gönderi", g: 1200, y: 630, grup: "Sosyal medya", not: "1200 × 630" },
        { ad: "Mağaza ekranı (16:9)", g: 1920, y: 1080, grup: "Ekran", not: "1920 × 1080" },
        { ad: "Mağaza ekranı dikey", g: 1080, y: 1920, grup: "Ekran", not: "1080 × 1920" }
    ];
    KS.mmPx = (mm) => Math.round(mm / 25.4 * 96);
    KS.pxMm = (px) => Math.round(px / 96 * 25.4 * 10) / 10;

    const ORTAK = {
        ad: "", x: 0, y: 0, w: 100, h: 100, aci: 0, opak: 1, karisim: "normal",
        golge: null, kilit: false, gizli: false, grup: null, cevirX: false, cevirY: false
    };

    const URUN_VERI = { ad: "Ürün adı", aciklama: "", fiyat: 0, eski: 0, birim: "", kategori: "", gorsel: { varlik: null, emoji: "🛒" }, rozet: "" };
    const URUN_STIL = {
        duzen: "klasik",
        kart: "#ffffff", kenar: "#e5e7eb", kalinlik: 0, kose: 6, kartGolge: true,
        adRenk: "#1d1d1f", aciklamaRenk: "#6b7280", adFont: "Inter", adKalin: 800, adOlcek: 100,
        fiyatZemin: "#e30613", fiyatRenk: "#ffffff", fiyatFont: "Anton", fiyatOlcek: 100,
        eskiRenk: "#6b7280", rozetZemin: "#ffd400", rozetRenk: "#e30613",
        gorselOlcek: 100, gorselZemin: "",
        eskiGoster: true, rozetGoster: true, aciklamaGoster: true,
        kurus: "ust", para: "₺", hiza: "sol"
    };

    const TUR = {
        metin: {
            metin: "Metin", font: "Inter", boyut: 32, kalin: 400, italik: false, alti: false, ustu: false,
            buyuk: "none", hiza: "left", satir: 1.2, harf: 0, dolgu: "#1d1d1f",
            kontur: null, golgeler: [], derinlik: null, vurgu: null, egri: 0, egriVB: null
        },
        sekil: { sekil: "dikdortgen", dolgu: "#6d4aff", cizgi: null, kose: 0, uc: 5, ic: 0.5, oran: 0.3 },
        gorsel: {
            varlik: null, emoji: null, sigdir: "kapla", odakX: 50, odakY: 50, yakin: 1,
            filtre: null, kose: 0, maske: null, cerceve: null
        },
        urun: { urunId: null, veri: URUN_VERI, stil: URUN_STIL },
        fiyat: {
            fiyat: 49.9, eski: 0, ust: "", alt: "", sekil: "patlama", zemin: "#ffd400", cizgi: null,
            renk: "#e30613", eskiRenk: "#1d1d1f", font: "Anton", kurus: "ust", para: "₺", olcek: 100, uc: 18, ic: 0.86
        },
        qr: { veri: "https://www.ornek.com", renk: "#111111", zemin: "#ffffff" }
    };
    KS.VARSAYILAN = { ORTAK, TUR, URUN_VERI, URUN_STIL };
    KS.FILTRE_VARSAYILAN = { parlak: 100, kontrast: 100, doygun: 100, bulanik: 0, gri: 0, sepya: 0, ton: 0, sicaklik: 0 };

    const TUR_ADLARI = { metin: "Metin", sekil: "Şekil", gorsel: "Görsel", urun: "Ürün kartı", fiyat: "Fiyat etiketi", qr: "QR kod" };
    KS.TUR_ADLARI = TUR_ADLARI;

    // Eksik alanları varsayılanla doldurur (eski sürüm belgeler ve kısmi şablon tanımları için).
    function normallestir(o) {
        const t = TUR[o.tur] || {};
        for (const k in ORTAK) if (o[k] === undefined) o[k] = KS.kopya(ORTAK[k]);
        for (const k in t) if (o[k] === undefined) o[k] = KS.kopya(t[k]);
        if (o.tur === "urun") {
            o.veri = Object.assign(KS.kopya(URUN_VERI), o.veri || {});
            o.stil = Object.assign(KS.kopya(URUN_STIL), o.stil || {});
            if (!o.veri.gorsel) o.veri.gorsel = { varlik: null, emoji: "🛒" };
        }
        if (!o.id) o.id = KS.kimlik("o");
        return o;
    }

    function yeni(tur, ozellik = {}) {
        const o = Object.assign({ id: KS.kimlik("o"), tur }, KS.kopya(ozellik));
        if (tur === "urun") {
            o.veri = Object.assign(KS.kopya(URUN_VERI), ozellik.veri || {});
            o.stil = Object.assign(KS.kopya(URUN_STIL), ozellik.stil || {});
        }
        return normallestir(o);
    }

    function yeniSayfa(ozellik = {}) {
        return Object.assign({
            id: KS.kimlik("s"), ad: "",
            arka: { dolgu: "#ffffff", resim: null, desen: null },
            ogeler: []
        }, KS.kopya(ozellik));
    }

    function yeniBelge({ ad = "Adsız katalog", genislik = 794, yukseklik = 1123 } = {}) {
        return {
            surum: 1, id: KS.kimlik("b"), ad, genislik, yukseklik,
            sayfalar: [yeniSayfa()],
            urunler: [],
            marka: markaVarsayilan()
        };
    }

    function belgeNormallestir(d) {
        d.surum = d.surum || 1;
        d.id = d.id || KS.kimlik("b");
        d.ad = d.ad || "Adsız katalog";
        d.genislik = d.genislik || 794;
        d.yukseklik = d.yukseklik || 1123;
        d.urunler = d.urunler || [];
        d.marka = Object.assign(markaVarsayilan(), d.marka || {});
        d.sayfalar = (d.sayfalar || []).map((s) => {
            s.id = s.id || KS.kimlik("s");
            s.arka = Object.assign({ dolgu: "#ffffff", resim: null, desen: null }, s.arka || {});
            s.ogeler = (s.ogeler || []).map(normallestir);
            return s;
        });
        if (!d.sayfalar.length) d.sayfalar.push(yeniSayfa());
        for (const u of d.urunler) { u.id = u.id || KS.kimlik("u"); u.gorsel = u.gorsel || { varlik: null, emoji: "🛒" }; }
        return d;
    }

    function markaVarsayilan() {
        let kayitli = {};
        try { kayitli = JSON.parse(localStorage.getItem("ks-marka") || "{}"); } catch (h) { /* gizli pencere */ }
        return Object.assign({
            ad: "Market Adı", slogan: "Taze, uygun, yakın", telefon: "0 (212) 000 00 00",
            adres: "Örnek Mah. Çarşı Cad. No: 1", web: "www.marketadi.com",
            logo: null, renkler: ["#e30613", "#ffd400", "#1d1d1f", "#ffffff"]
        }, kayitli);
    }

    // Öğeyi merkezine göre değil, verilen çarpanla boyuta bağlı tüm özellikleriyle birlikte büyütür.
    function olcekle(o, s) {
        o.w *= s; o.h *= s;
        if (o.golge) { o.golge.x *= s; o.golge.y *= s; o.golge.b *= s; }
        if (o.tur === "metin") {
            o.boyut = KS.yuvarla(o.boyut * s, 2);
            if (o.kontur) o.kontur.k *= s;
            for (const g of o.golgeler || []) { g.x *= s; g.y *= s; g.b *= s; }
            if (o.derinlik) o.derinlik.k *= s;
            if (o.vurgu) { o.vurgu.bosluk *= s; o.vurgu.yaricap *= s; }
            if (o.egriVB) o.egriVB = o.egriVB.map((v) => v * s);
        } else if (o.tur === "sekil") {
            if (o.cizgi) o.cizgi.k *= s;
            o.kose *= s;
        } else if (o.tur === "gorsel") {
            o.kose *= s;
            if (o.cerceve) o.cerceve.k *= s;
        } else if (o.tur === "fiyat") {
            if (o.cizgi) o.cizgi.k *= s;
        }
        return o;
    }

    function ogeBul(belge, id) {
        for (const sayfa of belge.sayfalar) {
            const i = sayfa.ogeler.findIndex((o) => o.id === id);
            if (i >= 0) return { oge: sayfa.ogeler[i], sayfa, i };
        }
        return null;
    }

    // Öğedeki tüm renkleri dolaşır (belge renkleri listesi ve "hepsini değiştir" için).
    function renkleriGez(o, fn) {
        const dolgu = (nesne, alan) => {
            const d = nesne[alan];
            if (!d) return;
            if (typeof d === "string") { const y = fn(d); if (y !== undefined) nesne[alan] = y; return; }
            if (d.tip === "isin") { for (const k of ["renk1", "renk2"]) { const y = fn(d[k]); if (y !== undefined) d[k] = y; } return; }
            for (const s of d.duraklar || []) { const y = fn(s.r); if (y !== undefined) s.r = y; }
        };
        const renk = (nesne, alan) => { if (nesne && nesne[alan]) { const y = fn(nesne[alan]); if (y !== undefined) nesne[alan] = y; } };
        renk(o.golge, "renk");
        if (o.tur === "metin") {
            dolgu(o, "dolgu"); renk(o.kontur, "renk"); renk(o.derinlik, "renk"); renk(o.vurgu, "renk");
            for (const g of o.golgeler || []) renk(g, "renk");
        } else if (o.tur === "sekil") { dolgu(o, "dolgu"); renk(o.cizgi, "renk"); }
        else if (o.tur === "gorsel") { renk(o.cerceve, "renk"); }
        else if (o.tur === "fiyat") { dolgu(o, "zemin"); renk(o, "renk"); renk(o, "eskiRenk"); renk(o.cizgi, "renk"); }
        else if (o.tur === "qr") { renk(o, "renk"); renk(o, "zemin"); }
        else if (o.tur === "urun") {
            for (const k of ["kart", "kenar", "adRenk", "aciklamaRenk", "fiyatZemin", "fiyatRenk", "eskiRenk", "rozetZemin", "rozetRenk"]) {
                if (k === "fiyatZemin" || k === "kart") dolgu(o.stil, k); else renk(o.stil, k);
            }
        }
    }

    // Öğede geçen yazı tipleri ve ağırlıkları (font yükleme ve dışa aktarım için)
    function fontKullanimi(o, harita = new Map()) {
        const ekle = (aile, w) => { if (!aile) return; if (!harita.has(aile)) harita.set(aile, new Set()); harita.get(aile).add(w || 400); };
        if (o.tur === "metin") ekle(o.font, o.kalin);
        else if (o.tur === "fiyat") { ekle(o.font, 400); ekle(o.font, 700); ekle("Inter", 700); }
        else if (o.tur === "urun") {
            ekle(o.stil.adFont, o.stil.adKalin); ekle(o.stil.adFont, 400); ekle(o.stil.adFont, 500);
            ekle(o.stil.fiyatFont, 400); ekle(o.stil.fiyatFont, 700); ekle("Inter", 700); ekle("Inter", 800);
        }
        return harita;
    }
    function ogeMetni(o) {
        if (o.tur === "metin") return o.metin;
        if (o.tur === "fiyat") return `${o.ust} ${o.alt} ${KS.fiyatParca(o.fiyat).metin} ${KS.fiyatParca(o.eski).metin} ${o.para}`;
        if (o.tur === "urun") { const v = o.veri; return `${v.ad} ${v.aciklama} ${v.birim} ${v.rozet} ${KS.fiyatParca(v.fiyat).metin} ${KS.fiyatParca(v.eski).metin} ${o.stil.para} İNDİRİM % ${v.gorsel?.emoji || ""}`; }
        if (o.tur === "gorsel") return o.emoji || "";
        return "";
    }

    KS.model = {
        yeni, yeniSayfa, yeniBelge, normallestir, belgeNormallestir, markaVarsayilan,
        olcekle, ogeBul, renkleriGez, fontKullanimi, ogeMetni
    };

    // ── Geri al / yinele ────────────────────────────────────────
    // Her kayıt belgenin JSON dizesidir (görseller dışarıda olduğu için küçüktür).
    const SINIR = 80;
    // Toplam boyut sınırı (karakter): binlerce ürünlü belgede 80 tam kopya yüzlerce MB eder; eskiler atılır (en az 10 adım kalır)
    const BOYUT_SINIRI = 40e6;
    let yigin = [], konum = -1, baglam = null, bekleyen = false;
    const gecikmeliIc = KS.gecikmeli(() => kaydet(), 450);
    const kaydetGecikmeli = () => { bekleyen = true; gecikmeliIc(); };
    kaydetGecikmeli.iptal = () => { bekleyen = false; gecikmeliIc.iptal(); };

    function baglan(b) { baglam = b; }
    function baslat() { yigin = [JSON.stringify(baglam.al())]; konum = 0; KS.olay.yay("gecmis"); }
    function kaydet() {
        kaydetGecikmeli.iptal();
        if (!baglam) return;
        const s = JSON.stringify(baglam.al());
        if (s === yigin[konum]) return;
        yigin = yigin.slice(0, konum + 1);
        yigin.push(s);
        let toplam = 0;
        for (const x of yigin) toplam += x.length;
        while (yigin.length > SINIR || (yigin.length > 10 && toplam > BOYUT_SINIRI)) toplam -= yigin.shift().length;
        konum = yigin.length - 1;
        KS.olay.yay("gecmis");
        KS.olay.yay("degisti");
    }
    function git(yon) {
        // Bekleyen gecikmeli kayıt varsa önce onu kesinleştir ki son değişiklik kaybolmasın.
        // (Ölçümden gelen küçük farklar — metin yüksekliği gibi — yeni geri alma adımı açmaz.)
        if (bekleyen) kaydet();
        const hedef = konum + yon;
        if (hedef < 0 || hedef >= yigin.length) return false;
        konum = hedef;
        baglam.yukle(JSON.parse(yigin[konum]));
        KS.olay.yay("gecmis");
        KS.olay.yay("degisti");
        return true;
    }
    KS.gecmis = {
        baglan, baslat, kaydet, kaydetGecikmeli,
        geri: () => git(-1), ileri: () => git(1),
        geriVar: () => konum > 0, ileriVar: () => konum < yigin.length - 1
    };
})();
