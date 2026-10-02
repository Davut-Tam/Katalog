// Video katalog: sayfalar öğe öğe canlanarak, sinematik geçişlerle ve yavaş kamera hareketiyle videoya dönüşür.
// Marka bilgilerinden açılış ve kapanış kartı üretilir; isteğe bağlı müzik eklenir.
//
// Akıcılık: her sahne oynatılmadan önce bir kez katmanlara ayrılır (zemin + öğeler; aynı gruptakiler birlikte) ve
// her katman dışa aktarımdaki gibi SVG foreignObject ile ImageBitmap'e çevrilir. Kare çizimi yalnız bu hazır
// bitmaplerin 2B tuvalde dönüştürülüp kopyalanmasıdır; oynatma sırasında DOM / SVG işi yoktur. Önizleme bütün
// sahneler hazır olmadan oynamaz. Video WebCodecs (H.264) ile kare kare, sabit zaman damgasıyla kodlanıp mp4-muxer
// ile MP4'e yazılır: makine yavaş olsa da çıkan video kare atlamaz. WebCodecs yoksa MediaRecorder'a düşülür.
(function () {
    "use strict";
    const KS = window.KS;
    const { h } = KS;
    const E = KS.E;
    const MUXER = "https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.min.js";
    const EMOJI_RE = /\p{Extended_Pictographic}/u;

    // ── Zamanlama eğrileri ──────────────────────────────────────
    const kes = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
    const ara = (a, b, t) => a + (b - a) * t;
    const C3 = (t) => 1 - (1 - t) ** 3;
    const C5 = (t) => 1 - (1 - t) ** 5;
    const IC = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const GERI = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
    const ELASTIK = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * 2.0944) + 1);
    // Aynı tohumdan hep aynı dizi: önizleme ile video birebir aynı olsun
    function tohumlu(n) {
        return () => {
            n = (n + 0x6d2b79f5) | 0;
            let t = Math.imul(n ^ (n >>> 15), 1 | n);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    const tuval = (w, y) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(y)); return c; };
    const sureMetni = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

    // ── Ayarlar ─────────────────────────────────────────────────
    const GECIS = 0.9;                 // sahneler arası geçiş (s)
    const ACILIS = 2.6, KAPANIS = 4.4;
    const BICIMLER = [
        { id: "sayfa", ad: "Sayfa oranı" }, { id: "hikaye", ad: "Hikâye 9:16" },
        { id: "kare", ad: "Kare 1:1" }, { id: "yatay", ad: "Yatay 16:9" }
    ];
    const GECISLER = [
        { id: "karisik", ad: "Karışık" }, { id: "kaydir", ad: "Kaydır" }, { id: "yakinlas", ad: "Yakınlaş" },
        { id: "cevir", ad: "Kart çevir" }, { id: "perde", ad: "Perde" }, { id: "daire", ad: "Daire" },
        { id: "panjur", ad: "Panjur" }, { id: "bulanik", ad: "Bulanık" }, { id: "flas", ad: "Flaş" }
    ];
    const KARISIK = ["kaydir", "daire", "cevir", "perde", "yakinlas", "panjur", "bulanik"];
    const ANIMLER = [
        { id: "karisik", ad: "Karışık" }, { id: "yumusak", ad: "Yumuşak" }, { id: "zipla", ad: "Zıpla" },
        { id: "ucus", ad: "Uçarak" }, { id: "sil", ad: "Silerek" }, { id: "yok", ad: "Yok" }
    ];
    const STILLER = [{ id: "3b", ad: "3B derinlikli" }, { id: "2b", ad: "2B düz" }];
    const VARSAYILAN = {
        mod: "katalog",                 // katalog: sayfalar · urun: seçilen ürünler tek tek (ürün vitrini)
        bicim: "sayfa", kalite: 1080, fps: 60, sure: 4, gecis: "karisik", anim: "karisik",
        stil: "3b", urunSay: 1, urunSure: 3.5,
        kamera: true, vurgu: true, acilis: true, kapanis: true, kapanisYazi: "Sizi bekliyoruz!",
        ses: 80, kapsam: "hepsi", aralik: ""
    };
    // Ürün vitrininde seçili ürünler (belge başına, oturum boyunca)
    const urunSecimleri = new Map();
    function urunListesi() {
        const b = E.belge;
        if (b.urunler && b.urunler.length) return b.urunler;
        const gorulen = new Map();
        for (const s of b.sayfalar) for (const o of s.ogeler) {
            const id = o.urunId || o.id;
            if (o.tur === "urun" && !gorulen.has(id)) gorulen.set(id, Object.assign({ id }, o.veri));
        }
        return [...gorulen.values()];
    }
    function urunSecimi() {
        const b = E.belge;
        if (!urunSecimleri.has(b.id)) {
            // Varsayılan: sayfalarda kullanılan ürünler; hiçbiri yoksa listenin ilk 8'i
            const liste = urunListesi(), kullanilan = new Set();
            for (const s of b.sayfalar) for (const o of s.ogeler) if (o.tur === "urun" && o.urunId) kullanilan.add(o.urunId);
            const ilk = liste.filter((u) => kullanilan.has(u.id));
            urunSecimleri.set(b.id, new Set((ilk.length ? ilk : liste.slice(0, 8)).map((u) => u.id)));
        }
        return urunSecimleri.get(b.id);
    }
    const seciliUrunler = () => { const s = urunSecimi(); return urunListesi().filter((u) => s.has(u.id)); };
    let ayar = (() => {
        try { return Object.assign({}, VARSAYILAN, JSON.parse(localStorage.getItem("ks-video") || "{}")); }
        catch (hata) { return Object.assign({}, VARSAYILAN); }
    })();
    const ayarKaydet = () => { try { localStorage.setItem("ks-video", JSON.stringify(ayar)); } catch (hata) { /* gizli pencere */ } };

    // Video boyutu ve sayfanın video içindeki yeri. Oran tutuyorsa sayfa kareyi kaplar, tutmuyorsa
    // bulanıklaştırılmış kopyasının ortasında gölgeli durur.
    function olcuHesapla(a, b) {
        const uzun = a.kalite === 720 ? 1280 : 1920, kisa = uzun * 9 / 16;
        const cift = (v) => Math.max(2, Math.round(v / 2) * 2);
        const bicim = a.mod === "urun" && a.bicim === "sayfa" ? "hikaye" : a.bicim;
        let W, H;
        if (bicim === "hikaye") { W = kisa; H = uzun; }
        else if (bicim === "kare") { W = H = kisa; }
        else if (bicim === "yatay") { W = uzun; H = kisa; }
        else { const o = b.genislik / b.yukseklik; if (o >= 1) { W = uzun; H = uzun / o; } else { H = uzun; W = uzun * o; } }
        W = cift(W); H = cift(H);
        const tam = Math.abs(b.genislik / b.yukseklik - W / H) / (W / H) < 0.03;
        const k = tam ? Math.max(W / b.genislik, H / b.yukseklik) : Math.min(W * 0.86 / b.genislik, H * 0.86 / b.yukseklik);
        const pw = b.genislik * k, ph = b.yukseklik * k;
        return { W, H, tam, k, sayfa: { x: (W - pw) / 2, y: (H - ph) / 2, w: pw, h: ph } };
    }

    // Sahneler ve zaman çizelgesi. Her sahne bir öncekinin bitişinden GECIS kadar önce başlar (örtüşen geçiş);
    // böylece her sayfa zaman çizelgesinde tam "sure" saniye yer tutar.
    function planla(a, sayfalar, urunler = []) {
        const sahneler = [];
        if (a.acilis) sahneler.push({ tur: "acilis", uzun: ACILIS + GECIS });
        if (a.mod === "urun") {
            const n = KS.sinirla(a.urunSay || 1, 1, 3);
            for (let i = 0; i < urunler.length; i += n) {
                const grup = urunler.slice(i, i + n);
                sahneler.push({ tur: "urun", urunler: grup, no: i / n, uzun: a.urunSure + 0.35 * (grup.length - 1) + GECIS });
            }
        } else sayfalar.forEach((s, i) => sahneler.push({ tur: "sayfa", sayfa: s, no: i, uzun: a.sure + GECIS }));
        if (a.kapanis) sahneler.push({ tur: "kapanis", uzun: KAPANIS });
        let t = 0;
        sahneler.forEach((s, i) => {
            s.bas = i ? t - GECIS : 0;
            s.son = s.bas + s.uzun;
            t = s.son;
            s.ilk = i === 0;
            s.gecis = i ? (a.gecis === "karisik" ? KARISIK[(i - 1) % KARISIK.length] : a.gecis) : null;
            s.anahtar = s.tur === "sayfa" ? "s:" + s.sayfa.id : s.tur === "urun" ? "u:" + s.urunler.map((u) => u.id).join(",") : s.tur;
        });
        return { sahneler, toplam: t, ayar: Object.assign({}, a), anahtar: JSON.stringify([a.sure, a.anim, a.vurgu]) };
    }
    function sahneBul(plan, t) {
        const ss = plan.sahneler;
        let k = 0;
        while (k + 1 < ss.length && ss[k + 1].bas <= t) k++;
        return k;
    }

    // ── Sahne hazırlığı (katmanlar → bitmap) ────────────────────
    const fiyatliMi = (o) => o.tur === "fiyat" || (o.tur === "urun" && (o.veri.eski > o.veri.fiyat || !!o.veri.rozet));
    function kutuHesapla(ogeler, W, H) {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const o of ogeler) {
            const a = (o.aci || 0) * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
            const bw = o.w * c + o.h * s, bh = o.w * s + o.h * c, cx = o.x + o.w / 2, cy = o.y + o.h / 2;
            // Gölge, kontur, 3B derinlik ve rozet gibi kutudan taşan süslemeler için pay
            let pay = 6 + Math.max(o.w, o.h) * 0.04;
            if (o.golge) pay += Math.abs(o.golge.x) + Math.abs(o.golge.y) + o.golge.b * 2;
            if (o.tur === "metin") {
                for (const g of o.golgeler || []) pay = Math.max(pay, Math.abs(g.x) + Math.abs(g.y) + g.b * 2 + 6);
                if (o.kontur) pay += o.kontur.k || 0;
                if (o.derinlik) pay += (o.derinlik.k || 0) * 1.5;
                if (o.vurgu) pay += o.vurgu.bosluk || 0;
                if (o.egri) pay += Math.max(o.w, o.h) * 0.3;
            }
            if (o.tur === "urun") pay += Math.min(o.w, o.h) * 0.08;
            x0 = Math.min(x0, cx - bw / 2 - pay); y0 = Math.min(y0, cy - bh / 2 - pay);
            x1 = Math.max(x1, cx + bw / 2 + pay); y1 = Math.max(y1, cy + bh / 2 + pay);
        }
        x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
        x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
        return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
    }
    async function katmanFontu(ogeler) {
        const kullanim = new Map();
        for (const o of ogeler) KS.model.fontKullanimi(o, kullanim);
        const metin = ogeler.map(KS.model.ogeMetni).join(" ");
        if (EMOJI_RE.test(metin)) kullanim.set(KS.fontlar.EMOJI, new Set([400]));
        return kullanim.size ? KS.fontlar.gomuluCss(kullanim, metin) : "";
    }
    async function bitmapYap(img, w, y) {
        const c = tuval(w, y);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        if (window.createImageBitmap) {
            try { const b = await createImageBitmap(c); c.width = c.height = 0; return b; } catch (hata) { /* tuvalle devam */ }
        }
        return c;
    }
    async function katmanResmi(s, kutu, cz, harita, seffaf) {
        const fontCss = await katmanFontu(s.ogeler);
        const { img, cw, ch } = await KS.disaaktar.svgResmi(s, { harita, fontCss, olcek: cz, kutu, seffaf, bekle: 30 });
        return bitmapYap(img, cw, ch);
    }
    async function sirayla(liste, es, fn) {
        let i = 0;
        const isci = async () => { while (i < liste.length) { const k = i++; await fn(liste[k], k); } };
        await Promise.all(Array.from({ length: Math.min(es, liste.length) }, isci));
    }

    // cz: sayfa pikseli başına bitmap pikseli
    async function sayfaHazirla(s, cz, olcu) {
        const b = E.belge, W = b.genislik, H = b.yukseklik;
        const { harita } = await KS.disaaktar.hazirla(s);
        const gorunen = s.ogeler.filter((o) => !o.gizli);
        const alan = (o) => Math.max(0, Math.min(o.x + o.w, W) - Math.max(o.x, 0)) * Math.max(0, Math.min(o.y + o.h, H) - Math.max(o.y, 0));
        // Altta kalan ve sayfanın büyük bölümünü kaplayan öğeler (zemin şekilleri, büyük görseller) zeminle birlikte durur
        let i = 0;
        while (i < gorunen.length && alan(gorunen[i]) >= W * H * 0.4) i++;
        const zeminOgeleri = gorunen.slice(0, i);
        let parcalar = [];
        const gruplar = new Map();
        for (const o of gorunen.slice(i)) {
            if (o.grup && gruplar.has(o.grup)) { gruplar.get(o.grup).push(o); continue; }
            const p = [o];
            if (o.grup) gruplar.set(o.grup, p);
            parcalar.push(p);
        }
        // Çok kalabalık sayfada (raf etiketleri gibi) katman sayısı sınırlı: komşu katmanlar birleşir
        while (parcalar.length > 40) {
            const y = [];
            for (let j = 0; j < parcalar.length; j += 2) y.push(parcalar[j].concat(parcalar[j + 1] || []));
            parcalar = y;
        }
        const katmanlar = parcalar.map((ogeler) => {
            const kutu = kutuHesapla(ogeler, W, H);
            const cx = kutu.x + kutu.w / 2, cy = kutu.y + kutu.h / 2;
            let nx = cx / W - 0.5, ny = cy / H - 0.5;
            const l = Math.hypot(nx, ny);
            if (l < 0.04) { nx = 0; ny = 1; } else { nx /= l; ny /= l; }
            const turler = new Set(ogeler.map((o) => o.tur));
            const tur = turler.size === 1 ? ogeler[0].tur : turler.has("urun") ? "urun" : turler.has("fiyat") ? "fiyat" : "karma";
            return {
                ogeler, kutu, tur, fiyatli: ogeler.some(fiyatliMi),
                okuma: Math.round(cy / (H * 0.06)) * 1e5 + cx,      // satır satır, soldan sağa
                ux: nx * 0.75, uy: ny * 0.75, yon: nx >= 0 ? 1 : -1,  // uçarak gelişte sayfanın en yakın kenarından
                bitmap: null, pc: null, gecikme: 0, sure: 0.7, anim: "yumusak", vurgu: -1
            };
        }).filter((L) => L.kutu.w > 0.5 && L.kutu.h > 0.5);
        const zemin = await katmanResmi({ id: s.id, arka: s.arka, ogeler: zeminOgeleri }, null, cz, harita, false);
        const seffafArka = { dolgu: "transparent", resim: null, desen: null };
        await sirayla(katmanlar, 4, async (L) => {
            L.bitmap = await katmanResmi({ id: s.id, arka: seffafArka, ogeler: L.ogeler }, L.kutu, cz, harita, true);
        });
        return { tur: "sayfa", zemin, katmanlar, fon: olcu.tam ? null : fonYap(zemin, katmanlar, olcu), anahtar: "" };
    }

    // Sayfanın küçük kopyasından bulanık, koyulaştırılmış tam ekran zemin
    function fonYap(zemin, katmanlar, olcu) {
        const b = E.belge, kw = 72, kh = Math.max(1, Math.round(72 * b.yukseklik / b.genislik)), ks = kw / b.genislik;
        const kucuk = tuval(kw, kh), x = kucuk.getContext("2d");
        x.drawImage(zemin, 0, 0, kw, kh);
        for (const L of katmanlar) x.drawImage(L.bitmap, L.kutu.x * ks, L.kutu.y * ks, L.kutu.w * ks, L.kutu.h * ks);
        const fon = tuval(olcu.W / 6, olcu.H / 6), f = fon.getContext("2d");
        const fw = fon.width, fh = fon.height, o = Math.max(fw / kw, fh / kh) * 1.2;
        f.imageSmoothingQuality = "high";
        f.filter = `blur(${Math.max(2, Math.round(fw / 36))}px) saturate(1.3)`;
        f.drawImage(kucuk, (fw - kw * o) / 2, (fh - kh * o) / 2, kw * o, kh * o);
        f.filter = "none";
        const g = f.createLinearGradient(0, 0, 0, fh);
        g.addColorStop(0, "rgba(0,0,0,.42)"); g.addColorStop(0.5, "rgba(0,0,0,.28)"); g.addColorStop(1, "rgba(0,0,0,.55)");
        f.fillStyle = g;
        f.fillRect(0, 0, fw, fh);
        kucuk.width = 0;
        return fon;
    }

    function markaRenkleri() {
        const r = (E.belge.marka && E.belge.marka.renkler) || [];
        const r1 = r[0] || "#e30613";
        let r2 = r[1] || "#ffd400";
        if (Math.abs(KS.parlaklik(r1) - KS.parlaklik(r2)) < 0.12) r2 = KS.parlaklik(r1) > 0.5 ? "#1d1d1f" : "#ffffff";
        const yazi = (c) => (KS.parlaklik(c) > 0.62 ? "#15171c" : "#ffffff");
        return { r1, r2, y1: yazi(r1), y2: yazi(r2) };
    }
    async function kartHazirla(tur) {
        const m = E.belge.marka || {};
        let logo = null;
        if (m.logo) {
            try { const v = await KS.varlik.bekle(m.logo); if (v && v.blob) logo = await createImageBitmap(v.blob); } catch (hata) { /* logosuz devam */ }
        }
        // Tuvale yazılacak her metnin glifleri (Türkçe harfler dahil) önceden yüklensin
        const metin = [m.ad, m.slogan, m.telefon, m.adres, m.web, E.belge.ad, ayar.kapanisYazi, "TELEFONADRESWEB"].join(" ");
        await Promise.all([900, 800, 700, 600].map((w) => document.fonts.load(`${w} 40px Inter`, metin).catch(() => {})));
        const r = tohumlu(tur === "acilis" ? 7 : 11);
        const parcaciklar = Array.from({ length: 34 }, () => ({
            x: r(), faz: r(), hiz: 0.05 + r() * 0.09, boy: 0.006 + r() * 0.012, don: (r() - 0.5) * 6, renk: r() < 0.5, serit: r() < 0.55
        }));
        return { tur, logo, parcaciklar, renk: markaRenkleri(), harfler: null, duzen: null };
    }
    // ── Ürün vitrini hazırlığı ──────────────────────────────────
    // Saydam görsel (dekupe ürün, emoji) boş kenarlarından kırpılır ve serbest durur; dolu zeminli fotoğraf
    // beyaz, yuvarlak köşeli bir karta oturtulur — iki durumda da 3B dönüşte tek parça hareket eder.
    async function tuvaldenBitmap(c) {
        if (window.createImageBitmap) { try { const b = await createImageBitmap(c); c.width = c.height = 0; return b; } catch (hata) { /* tuvalle devam */ } }
        return c;
    }
    function saydamKutu(kaynak) {
        const n = 96, o = Math.min(1, n / Math.max(kaynak.width, kaynak.height));
        const w = Math.max(1, Math.round(kaynak.width * o)), y = Math.max(1, Math.round(kaynak.height * o));
        const c = tuval(w, y), x = c.getContext("2d", { willReadFrequently: true });
        x.drawImage(kaynak, 0, 0, w, y);
        const d = x.getImageData(0, 0, w, y).data;
        const a = (i, j) => d[(j * w + i) * 4 + 3];
        const saydam = [a(0, 0), a(w - 1, 0), a(0, y - 1), a(w - 1, y - 1)].some((v) => v < 200);
        if (!saydam) return null;
        let x0 = w, y0 = y, x1 = -1, y1 = -1;
        for (let j = 0; j < y; j++) for (let i = 0; i < w; i++) if (a(i, j) > 12) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
        if (x1 < 0) return null;
        return { x: Math.max(0, (x0 - 1) / o), y: Math.max(0, (y0 - 1) / o), w: Math.min(kaynak.width, (x1 - x0 + 3) / o), h: Math.min(kaynak.height, (y1 - y0 + 3) / o) };
    }
    async function urunGorseli(u, enCok) {
        const g = u.gorsel || {};
        let kaynak = null;
        if (g.varlik) {
            try { const v = await KS.varlik.bekle(g.varlik); if (v && v.blob) kaynak = await createImageBitmap(v.blob); } catch (hata) { /* emojiye düş */ }
        }
        if (!kaynak) {
            const e = g.emoji || "🛒", c = tuval(512, 512), x = c.getContext("2d");
            await document.fonts.load('400 300px "Noto Color Emoji"', e).catch(() => {});
            x.font = '400 380px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
            x.textAlign = "center"; x.textBaseline = "middle";
            x.fillText(e, 256, 270);
            kaynak = c;
        }
        const k = saydamKutu(kaynak);
        if (k) {
            const o = Math.min(1, enCok / Math.max(k.w, k.h)), c = tuval(k.w * o, k.h * o), x = c.getContext("2d");
            x.imageSmoothingQuality = "high";
            x.drawImage(kaynak, k.x, k.y, k.w, k.h, 0, 0, c.width, c.height);
            if (kaynak.close) kaynak.close();
            return { bitmap: await tuvaldenBitmap(c), kart: false };
        }
        // Fotoğraf kartı: beyaz kenarlık, yuvarlak köşe
        const o = Math.min(1, enCok * 0.9 / Math.max(kaynak.width, kaynak.height));
        const iw = kaynak.width * o, ih = kaynak.height * o, pay = Math.max(iw, ih) * 0.045, r = pay * 1.6;
        const c = tuval(iw + pay * 2, ih + pay * 2), x = c.getContext("2d");
        const yol = (px, py, w, y, rr) => { x.beginPath(); x.moveTo(px + rr, py); x.arcTo(px + w, py, px + w, py + y, rr); x.arcTo(px + w, py + y, px, py + y, rr); x.arcTo(px, py + y, px, py, rr); x.arcTo(px, py, px + w, py, rr); x.closePath(); };
        yol(0, 0, c.width, c.height, r); x.fillStyle = "#ffffff"; x.fill();
        x.save(); yol(pay, pay, iw, ih, r * 0.6); x.clip();
        x.imageSmoothingQuality = "high";
        x.drawImage(kaynak, pay, pay, iw, ih);
        x.restore();
        if (kaynak.close) kaynak.close();
        return { bitmap: await tuvaldenBitmap(c), kart: true };
    }
    async function urunHazirla(urunler, olcu, piksel) {
        const enCok = Math.min(1400, Math.round(Math.min(olcu.W, olcu.H) * 0.8 * piksel));
        await Promise.all([KS.fontlar.hazir("Anton", 400).catch(() => {})]);
        const metin = urunler.map((u) => `${u.ad} ${u.aciklama || ""} ${u.birim || ""} ${u.rozet || ""}`).join(" ") + " İNDİRİM ₺0123456789,%";
        await Promise.all([900, 800, 600].map((w) => document.fonts.load(`${w} 40px Inter`, metin).catch(() => {})).concat(document.fonts.load("400 40px Anton", "0123456789,₺").catch(() => {})));
        const kart = await kartHazirla("urun");
        kart.tur = "urun";
        kart.urunler = [];
        for (const u of urunler) kart.urunler.push(Object.assign({ u }, await urunGorseli(u, enCok)));
        return kart;
    }

    function hzBirak(hz) {
        const kapat = (b) => { if (!b) return; if (b.close) b.close(); else b.width = 0; };
        if (!hz) return;
        kapat(hz.zemin); kapat(hz.logo);
        if (hz.fon) hz.fon.width = 0;
        for (const L of hz.katmanlar || []) { kapat(L.bitmap); if (L.pc) L.pc.width = 0; }
        for (const g of hz.urunler || []) kapat(g.bitmap);
    }

    // Sahneleri anahtarına göre hazırlar ve saklar (plan değişince — süre, geçiş — yeniden hazırlanmaz)
    function hazirlayici(olcu, cz) {
        const sozler = new Map(), hazir = new Map();
        let kapali = false;
        function al(s) {
            if (!sozler.has(s.anahtar)) {
                const anahtar = s.anahtar;
                const is = (s.tur === "sayfa" ? sayfaHazirla(s.sayfa, cz, olcu) : s.tur === "urun" ? urunHazirla(s.urunler, olcu, cz / olcu.k) : kartHazirla(s.tur)).then((hz) => {
                    if (kapali || sozler.get(anahtar) !== is) { hzBirak(hz); return null; }
                    hazir.set(anahtar, hz);
                    return hz;
                });
                sozler.set(anahtar, is);
            }
            return sozler.get(s.anahtar);
        }
        function birak(s) { hzBirak(hazir.get(s.anahtar)); hazir.delete(s.anahtar); sozler.delete(s.anahtar); }
        return {
            al, birak, olcu, cz,
            hazir: (s) => hazir.get(s.anahtar) || null,
            kapat() { kapali = true; for (const hz of hazir.values()) hzBirak(hz); hazir.clear(); sozler.clear(); }
        };
    }

    // ── Kare çizici ─────────────────────────────────────────────
    function cizici(hedef, olcu, plan, hzc) {
        const { W, H } = olcu, M = Math.min(W, H);
        const ctx = hedef.getContext("2d", { alpha: false });
        const taban = hedef.width / W;
        const a = plan.ayar;
        const filtreVar = "filter" in ctx;
        const RENK = markaRenkleri();
        // Geçiş tamponları baştan: ilk geçişte bellek ayırma takılması olmasın
        const A = tuval(hedef.width, hedef.height), B = tuval(hedef.width, hedef.height);
        const actx = A.getContext("2d", { alpha: false }), bctx = B.getContext("2d", { alpha: false });
        const XS = new Float32Array(65), FS = new Float32Array(65);

        function kare(t) {
            t = KS.sinirla(t, 0, plan.toplam - 1e-6);
            const ss = plan.sahneler, k = sahneBul(plan, t), s = ss[k];
            if (k > 0 && t < ss[k - 1].son) {
                sahneCiz(actx, ss[k - 1], t - ss[k - 1].bas);
                sahneCiz(bctx, s, t - s.bas);
                ctx.setTransform(taban, 0, 0, taban, 0, 0);
                gecisCiz(s.gecis, kes((t - s.bas) / GECIS), k);
            } else sahneCiz(ctx, s, t - s.bas);
            // Başta siyahtan açılış, sonda siyaha kararma
            const kar = Math.max(1 - t / 0.35, 1 - (plan.toplam - t) / 0.6);
            if (kar > 0) {
                ctx.setTransform(taban, 0, 0, taban, 0, 0);
                ctx.globalAlpha = kes(kar); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
            }
        }
        function hazirMi(t) {
            const ss = plan.sahneler, k = sahneBul(plan, t);
            return !!hzc.hazir(ss[k]) && !(k > 0 && t < ss[k - 1].son && !hzc.hazir(ss[k - 1]));
        }
        // Bitmaplerin ekran kartına yüklenmesi ilk görünüşte takılma yapmasın diye önceden bir kez çizilir;
        // sayfanın zamanlaması ve parıltı tuvalleri de oynatmadan önce hazırlanır
        function isit(hz) {
            if (!hz) return;
            if (hz.tur === "sayfa") {
                for (const s of plan.sahneler) if (hzc.hazir(s) === hz) zamanla(hz, s);
                for (const L of hz.katmanlar) if (L.pc) parlat(L, 0);
            }
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 0.004;
            for (const b of [hz.zemin, hz.fon, hz.logo, ...(hz.katmanlar || []).map((L) => L.bitmap), ...(hz.urunler || []).map((g) => g.bitmap)]) if (b) ctx.drawImage(b, 0, 0, 1, 1);
            ctx.restore();
        }

        function sahneCiz(c, s, u) {
            c.setTransform(taban, 0, 0, taban, 0, 0);
            c.globalAlpha = 1;
            const hz = hzc.hazir(s);
            if (!hz) { c.fillStyle = "#0b0c10"; c.fillRect(0, 0, W, H); return; }
            if (hz.tur === "sayfa") sayfaCiz(c, s, u, hz); else if (hz.tur === "urun") urunCiz(c, s, u, hz); else kartCiz(c, u, hz);
        }

        // ── Sayfa sahnesi
        function zamanla(hz, s) {
            const anahtar = plan.anahtar + s.ilk;
            if (hz.anahtar === anahtar) return;
            const L = hz.katmanlar, n = L.length, yok = a.anim === "yok";
            const basla = s.ilk ? 0.3 : GECIS * 0.6;
            const pencere = yok || n < 2 ? 0 : Math.min(1.8, Math.max(0.35, (a.sure - 1.5) * 0.45));
            const sira = L.slice().sort((p, q) => p.okuma - q.okuma);
            sira.forEach((x, i) => {
                x.gecikme = basla + (n > 1 ? i / (n - 1) : 0) * pencere;
                x.anim = yok ? "yok" : a.anim !== "karisik" ? a.anim
                    : ({ metin: "sil", urun: "zipla", fiyat: "pat", gorsel: "yakin" })[x.tur] || "yumusak";
                x.sure = x.anim === "pat" ? 0.95 : x.anim === "ucus" ? 0.85 : 0.7;
                x.vurgu = -1;
            });
            // Fiyat vurgusu: öğeler yerine oturduktan sonra fiyatlar sırayla nabız gibi atar, üstünden ışık geçer
            if (a.vurgu) {
                const fiyatlar = sira.filter((x) => x.fiyatli);
                const vb = basla + pencere + (yok ? 0.4 : 0.9);
                const adim = fiyatlar.length > 1 ? Math.min(0.16, 1.4 / (fiyatlar.length - 1)) : 0;
                fiyatlar.forEach((x, i) => {
                    const z = vb + i * adim;
                    if (z + 0.75 > a.sure + GECIS * 0.4) return;
                    x.vurgu = z;
                    if (!x.pc) x.pc = tuval(x.bitmap.width, x.bitmap.height);
                });
            }
            hz.anahtar = anahtar;
        }
        function parlat(L, v) {
            const c = L.pc, x = c.getContext("2d"), w = c.width, y = c.height;
            x.setTransform(1, 0, 0, 1, 0, 0);
            x.globalCompositeOperation = "copy";
            x.drawImage(L.bitmap, 0, 0);
            x.globalCompositeOperation = "source-atop";
            const bant = Math.max(w, y) * 0.32, mx = ara(-bant - y * 0.4, w + bant + y * 0.4, C3(v));
            x.setTransform(1, 0, -0.45, 1, y * 0.45, 0);
            const g = x.createLinearGradient(mx - bant, 0, mx + bant, 0);
            g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
            x.fillStyle = g;
            x.fillRect(mx - bant, 0, bant * 2, y);
            x.setTransform(1, 0, 0, 1, 0, 0);
            x.globalCompositeOperation = "source-over";
            return c;
        }
        function sayfaCiz(c, s, u, hz) {
            const r = olcu.sayfa, k = olcu.k;
            zamanla(hz, s);
            if (hz.fon) c.drawImage(hz.fon, 0, 0, W, H);
            else { c.fillStyle = "#000"; c.fillRect(0, 0, W, H); }
            c.save();
            if (a.kamera) {
                // Yavaş, sabit hızlı yakınlaşma ve kayma (Ken Burns); yön sayfadan sayfaya değişir
                const q = u / s.uzun, z = 1 + (olcu.tam ? 0.07 : 0.04) * q, yon = s.no % 2 ? 1 : -1;
                c.translate(W / 2 + yon * W * 0.012 * q, H / 2 - H * 0.008 * q);
                c.scale(z, z);
                c.translate(-W / 2, -H / 2);
            }
            if (!olcu.tam) golgeCiz(c, r);
            c.drawImage(hz.zemin, r.x, r.y, r.w, r.h);
            for (const L of hz.katmanlar) {
                const x = r.x + L.kutu.x * k, y = r.y + L.kutu.y * k, w = L.kutu.w * k, hh = L.kutu.h * k;
                const p = L.anim === "yok" ? 1 : (u - L.gecikme) / L.sure;
                if (p <= 0) continue;
                const v = L.vurgu >= 0 ? (u - L.vurgu) / 0.75 : -1;
                const vurguda = v > 0 && v < 1;
                if (p >= 1 && !vurguda) { c.drawImage(L.bitmap, x, y, w, hh); continue; }
                let al = 1, tx = 0, ty = 0, sx = 1, sy = 1, don = 0, acik = 1;
                if (p < 1) {
                    switch (L.anim) {
                        case "zipla": { const e = GERI(p); al = kes(p * 3); sx = sy = 0.25 + 0.75 * e; don = (1 - C3(p)) * -0.12 * L.yon; break; }
                        case "pat": { al = kes(p * 4); sx = sy = ELASTIK(p); don = (1 - C3(p)) * -0.4 * L.yon; break; }
                        case "ucus": { const e = C5(p); al = kes(p * 2.5); tx = (1 - e) * L.ux * r.w; ty = (1 - e) * L.uy * r.h; don = (1 - e) * 0.3 * L.yon; sx = sy = 1 + (1 - e) * 0.08; break; }
                        case "sil": { acik = C5(p); al = kes(p * 4); ty = (1 - C3(p)) * r.h * 0.012; break; }
                        case "yakin": { const e = C5(p); al = kes(p * 2); sx = sy = 1.3 - 0.3 * e; break; }
                        default: { const e = C3(p); al = kes(p * 1.8); ty = (1 - e) * r.h * 0.04; sx = sy = 0.94 + 0.06 * e; }
                    }
                }
                if (vurguda) { const n = Math.sin(v * Math.PI); sx *= 1 + 0.08 * n; sy *= 1 + 0.08 * n; }
                if (sx < 0.002 || acik < 0.002 || al <= 0) continue;
                const kaynak = vurguda ? parlat(L, v) : L.bitmap;
                c.save();
                c.globalAlpha = al;
                c.translate(x + w / 2 + tx, y + hh / 2 + ty);
                if (don) c.rotate(don);
                if (sx !== 1 || sy !== 1) c.scale(sx, sy);
                if (acik < 1) c.drawImage(kaynak, 0, 0, kaynak.width * acik, kaynak.height, -w / 2, -hh / 2, w * acik, hh);
                else c.drawImage(kaynak, -w / 2, -hh / 2, w, hh);
                c.restore();
            }
            c.restore();
        }
        // Sayfa gölgesi bir kez, düşük çözünürlükte çizilir (bulanık olduğu için büyütülünce bozulmaz)
        const golge = olcu.tam ? null : (() => {
            const r = olcu.sayfa, m = Math.max(r.w, r.h) * 0.06, o = 0.25;
            const g = tuval((r.w + m * 4) * o, (r.h + m * 4) * o), x = g.getContext("2d");
            x.shadowColor = "rgba(0,0,0,.6)"; x.shadowBlur = m * o; x.shadowOffsetY = m * 0.35 * o;
            x.fillStyle = "#000";
            x.fillRect(m * 2 * o, m * 2 * o, r.w * o, r.h * o);
            return { g, m };
        })();
        function golgeCiz(c, r) {
            const m = golge.m;
            c.drawImage(golge.g, r.x - m * 2, r.y - m * 2, r.w + m * 4, r.h + m * 4);
        }

        // ── Açılış / kapanış kartı
        function duzen(c, hz) {
            const anahtar = a.kapanisYazi;
            if (hz.duzen && hz.duzen.anahtar === anahtar) return hz.duzen;
            const m = E.belge.marka || {}, acilis = hz.tur === "acilis", maxW = W * 0.84;
            const sig = (metin, agirlik, boy, ek = 0) => {
                c.font = `${agirlik} ${boy}px Inter`;
                const w = c.measureText(metin).width + ek * boy;
                return w > maxW ? boy * maxW / w : boy;
            };
            const ad = (m.ad || E.belge.ad || "").trim(), slogan = (m.slogan || "").trim();
            const bloklar = [];
            const dr = M * (acilis ? 0.22 : 0.16);
            bloklar.push({ tur: "daire", yuk: dr * 2.55, dr });
            if (ad) { const boy = sig(ad, 900, M * 0.1); bloklar.push({ tur: "ad", yuk: boy * 1.3, boy, metin: ad }); }
            if (slogan) { const boy = sig(slogan, 600, M * 0.042); bloklar.push({ tur: "yazi", yuk: boy * 2, boy, metin: slogan }); }
            if (acilis) {
                const t = (E.belge.ad || "").toLocaleUpperCase("tr-TR");
                if (t && t !== ad.toLocaleUpperCase("tr-TR")) { const boy = sig(t, 800, M * 0.036, 1.8); bloklar.push({ tur: "hap", yuk: boy * 3.2, boy, metin: t }); }
            } else {
                for (const [etiket, deger] of [["TELEFON", m.telefon], ["ADRES", m.adres], ["WEB", m.web]]) {
                    const d = String(deger || "").trim();
                    if (!d) continue;
                    const boy = sig(d, 600, M * 0.04), eboy = M * 0.022;
                    bloklar.push({ tur: "satir", yuk: eboy * 1.5 + boy * 1.5 + M * 0.022, boy, eboy, etiket, metin: d });
                }
                const cta = (a.kapanisYazi || "").trim();
                if (cta) { const boy = sig(cta, 800, M * 0.046, 1.8); bloklar.push({ tur: "hap", yuk: boy * 3.4, boy, metin: cta, nabiz: true }); }
            }
            const toplam = bloklar.reduce((t, x) => t + x.yuk, 0);
            const olc = Math.min(1, H * 0.86 / toplam);
            let y = (H - toplam * olc) / 2;
            for (const x of bloklar) {
                x.yuk *= olc; x.y = y + x.yuk / 2; y += x.yuk;
                for (const z of ["boy", "eboy", "dr"]) if (x[z]) x[z] *= olc;
            }
            hz.duzen = { anahtar, bloklar };
            return hz.duzen;
        }
        function kartCiz(c, u, hz) {
            const R = hz.renk, acilis = hz.tur === "acilis", { bloklar } = duzen(c, hz);
            const daire = bloklar[0], cx = W / 2, cy = daire.y;
            const g = c.createLinearGradient(0, 0, W * 0.45, H);
            g.addColorStop(0, KS.renkKarart(R.r1, -0.12));
            g.addColorStop(1, KS.renkKarart(R.r1, 0.42));
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);
            // Dönen ışınlar
            c.save();
            c.translate(cx, cy);
            c.rotate(u * 0.16 + (acilis ? 0 : 0.6));
            c.globalAlpha = 0.09 * C3(kes(u / 0.9));
            c.fillStyle = "#ffffff";
            c.beginPath();
            const n = 16, R0 = Math.hypot(W, H);
            for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2; c.moveTo(0, 0); c.arc(0, 0, R0, a0, a0 + Math.PI / n); c.closePath(); }
            c.fill();
            c.restore();
            parcacikCiz(c, u, hz);
            // Daire + logo (logo yoksa markanın baş harfi)
            const dr = daire.dr * GERI(kes((u - 0.1) / 0.75));
            if (dr > 0) {
                c.save();
                c.globalAlpha = 0.4 * C3(kes((u - 0.3) / 0.8));
                c.strokeStyle = "#ffffff";
                c.lineWidth = M * 0.007;
                c.beginPath(); c.arc(cx, cy, dr * (1.13 + 0.025 * Math.sin(u * 2.4)), 0, Math.PI * 2); c.stroke();
                c.globalAlpha = 1;
                c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = M * 0.04; c.shadowOffsetY = M * 0.012;
                c.fillStyle = hz.logo ? "#ffffff" : R.r2;
                c.beginPath(); c.arc(cx, cy, dr, 0, Math.PI * 2); c.fill();
                c.restore();
                const lp = GERI(kes((u - 0.35) / 0.6));
                if (lp > 0) {
                    if (hz.logo) {
                        const L = hz.logo, o = Math.min(dr * 1.3 / L.width, dr * 1.3 / L.height) * lp;
                        c.drawImage(L, cx - L.width * o / 2, cy - L.height * o / 2, L.width * o, L.height * o);
                    } else {
                        const harf = ((E.belge.marka && E.belge.marka.ad) || E.belge.ad || "K").trim().charAt(0).toLocaleUpperCase("tr-TR");
                        c.save();
                        c.fillStyle = R.y2; c.font = `900 ${dr * 1.1}px Inter`; c.textAlign = "center"; c.textBaseline = "middle";
                        c.translate(cx, cy + dr * 0.05); c.scale(lp, lp); c.fillText(harf, 0, 0);
                        c.restore();
                    }
                }
            }
            // Metin blokları sırayla
            let bas = acilis ? 0.55 : 0.45;
            for (let i = 1; i < bloklar.length; i++) {
                const x = bloklar[i], yu = u - bas;
                if (x.tur === "ad") { harfHarf(c, x, R.y1, yu, hz); bas += 0.45; continue; }
                if (x.tur === "yazi") yazi(c, x.metin, `600 ${x.boy}px Inter`, x.y, R.y1, 0.92, yu);
                else if (x.tur === "satir") {
                    yazi(c, x.etiket, `800 ${x.eboy}px Inter`, x.y - x.boy * 0.62, R.r2 === R.r1 ? R.y1 : R.r2, 1, yu);
                    yazi(c, x.metin, `600 ${x.boy}px Inter`, x.y + x.eboy * 0.5, R.y1, 1, yu - 0.08);
                } else if (x.tur === "hap") hap(c, x, R, yu);
                bas += x.tur === "satir" ? 0.18 : 0.3;
            }
        }
        function harfHarf(c, x, renk, u, hz) {
            if (u <= 0) return;
            c.font = `900 ${x.boy}px Inter`;
            const anahtar = x.metin + "|" + x.boy;
            if (!hz.harfler || hz.harfler.anahtar !== anahtar) {
                const harfler = [...x.metin];
                const konum = harfler.map((_, i) => c.measureText(harfler.slice(0, i).join("")).width);
                hz.harfler = { anahtar, harfler, konum, toplam: c.measureText(x.metin).width };
            }
            const { harfler, konum, toplam } = hz.harfler, x0 = W / 2 - toplam / 2, by = x.y + x.boy * 0.36;
            c.save();
            c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillStyle = renk;
            c.shadowColor = "rgba(0,0,0,.25)"; c.shadowBlur = x.boy * 0.12; c.shadowOffsetY = x.boy * 0.04;
            for (let i = 0; i < harfler.length; i++) {
                const p = kes((u - i * 0.035) / 0.55);
                if (p <= 0) break;
                const w = (i + 1 < konum.length ? konum[i + 1] : toplam) - konum[i], s = 0.5 + 0.5 * GERI(p);
                c.globalAlpha = kes(p * 2.5);
                c.setTransform(taban, 0, 0, taban, 0, 0);
                c.translate(x0 + konum[i] + w / 2, by - (1 - C5(p)) * x.boy * 0.55);
                c.rotate((1 - C3(p)) * 0.3 * (i % 2 ? 1 : -1));
                c.scale(s, s);
                c.fillText(harfler[i], -w / 2, 0);
            }
            c.restore();
        }
        function yazi(c, metin, font, y, renk, opak, u) {
            if (u <= 0) return;
            const p = kes(u / 0.6);
            c.save();
            c.globalAlpha = kes(p * 2) * opak;
            c.font = font; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = renk;
            c.fillText(metin, W / 2, y + (1 - C5(p)) * M * 0.03);
            c.restore();
        }
        function hap(c, x, R, u) {
            if (u <= 0) return;
            const p = kes(u / 0.6);
            c.save();
            c.font = `800 ${x.boy}px Inter`;
            const w = c.measureText(x.metin).width + x.boy * 1.8, y = x.boy * 2;
            const s = GERI(p) * (x.nabiz && p >= 1 ? 1 + 0.035 * Math.sin((u - 0.6) * 5) : 1);
            c.translate(W / 2, x.y);
            c.scale(s, s);
            c.globalAlpha = kes(p * 3);
            c.shadowColor = "rgba(0,0,0,.25)"; c.shadowBlur = x.boy * 0.5; c.shadowOffsetY = x.boy * 0.15;
            c.fillStyle = R.r2;
            c.beginPath();
            const r = y / 2;
            c.moveTo(-w / 2 + r, -y / 2); c.lineTo(w / 2 - r, -y / 2); c.arc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
            c.lineTo(-w / 2 + r, y / 2); c.arc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5); c.closePath();
            c.fill();
            c.shadowColor = "transparent";
            c.fillStyle = R.y2; c.textAlign = "center"; c.textBaseline = "middle";
            c.fillText(x.metin, 0, x.boy * 0.05);
            c.restore();
        }
        function parcacikCiz(c, u, hz) {
            const g = C3(kes(u / 0.8));
            for (const p of hz.parcaciklar) {
                const yy = (p.faz + u * p.hiz) % 1;
                const s = p.boy * M;
                c.globalAlpha = 0.6 * g * Math.sin(yy * Math.PI);
                c.fillStyle = p.renk ? hz.renk.r2 : "#ffffff";
                c.setTransform(taban, 0, 0, taban, 0, 0);
                c.translate(p.x * W + Math.sin(u * 1.3 + p.faz * 9) * M * 0.03, H * (1.05 - yy * 1.1));
                c.rotate(u * p.don);
                if (p.serit) c.fillRect(-s, -s * 0.35, s * 2, s * 0.7);
                else { c.beginPath(); c.arc(0, 0, s * 0.6, 0, Math.PI * 2); c.fill(); }
            }
            c.setTransform(taban, 0, 0, taban, 0, 0);
            c.globalAlpha = 1;
        }

        // ── Geçişler (A: giden sahne, B: gelen sahne; ikisi de tam kare)
        function gecisCiz(tur, p, k) {
            const c = ctx, e = IC(p);
            const ciz = (img, dx, dy, s, al) => {
                c.globalAlpha = al == null ? 1 : kes(al);
                if (s === 1) c.drawImage(img, dx, dy, W, H);
                else c.drawImage(img, dx + W * (1 - s) / 2, dy + H * (1 - s) / 2, W * s, H * s);
                c.globalAlpha = 1;
            };
            const karart = () => { c.fillStyle = "#0b0c10"; c.fillRect(0, 0, W, H); };
            switch (tur) {
                case "kaydir": {
                    karart();
                    const s = 1 - 0.12 * Math.sin(Math.PI * p);
                    ciz(A, -e * W, 0, s); ciz(B, (1 - e) * W, 0, s);
                    break;
                }
                case "yakinlas": {
                    karart();
                    ciz(B, 0, 0, 0.7 + 0.3 * C3(p), (p - 0.12) / 0.5);
                    ciz(A, 0, 0, 1 + 0.9 * p * p, 1 - p / 0.55);
                    break;
                }
                case "cevir": {
                    karart();
                    const aci = e * Math.PI, s = 1 - 0.14 * Math.sin(Math.PI * p);
                    if (aci < Math.PI / 2) donuk(A, aci, s); else donuk(B, aci - Math.PI, s);
                    break;
                }
                case "perde": {
                    ciz(A, 0, 0, 1);
                    const sl = W * 0.2, bw = W * 0.06, ex = ara(-sl / 2 - bw * 1.7, W + sl / 2, e);
                    const egim = (x0, x1) => { c.beginPath(); c.moveTo(x0 + sl / 2, -1); c.lineTo(x1 + sl / 2, -1); c.lineTo(x1 - sl / 2, H + 1); c.lineTo(x0 - sl / 2, H + 1); c.closePath(); };
                    c.save(); egim(-W - sl, ex); c.clip(); ciz(B, 0, 0, 1); c.restore();
                    egim(ex, ex + bw); c.fillStyle = RENK.r1; c.fill();
                    egim(ex + bw, ex + bw * 1.6); c.fillStyle = RENK.r2; c.fill();
                    break;
                }
                case "daire": {
                    ciz(A, 0, 0, 1);
                    const r = e * Math.hypot(W, H) / 2 * 1.02, R = RENK;
                    c.save(); c.beginPath(); c.arc(W / 2, H / 2, r, 0, Math.PI * 2); c.clip(); ciz(B, 0, 0, 1.08 - 0.08 * e); c.restore();
                    if (p < 1 && r > 0) {
                        const lw = M * 0.03 * (1 - p) + 1;
                        c.lineWidth = lw;
                        c.strokeStyle = R.r2; c.beginPath(); c.arc(W / 2, H / 2, r + lw / 2, 0, Math.PI * 2); c.stroke();
                        c.strokeStyle = R.r1; c.beginPath(); c.arc(W / 2, H / 2, r + lw * 1.5, 0, Math.PI * 2); c.stroke();
                    }
                    break;
                }
                case "panjur": {
                    ciz(A, 0, 0, 1);
                    const N = 8, gec = 0.07, sw = W / N, kx = B.width / W;
                    for (let i = 0; i < N; i++) {
                        const q = C5(kes((p - i * gec) / (1 - (N - 1) * gec)));
                        if (q <= 0) continue;
                        const sx = Math.min(B.width - 1, i * sw * kx);
                        c.drawImage(B, sx, 0, Math.min(sw * kx, B.width - sx), B.height, i * sw, (i % 2 ? 1 : -1) * (1 - q) * H, sw + 0.6, H);
                    }
                    break;
                }
                case "bulanik": {
                    const bl = hedef.width / 60;
                    if (filtreVar) c.filter = `blur(${(p * bl).toFixed(2)}px)`;
                    ciz(A, 0, 0, 1 + 0.05 * p);
                    if (filtreVar) c.filter = `blur(${((1 - p) * bl).toFixed(2)}px)`;
                    ciz(B, 0, 0, 1.05 - 0.05 * e, C3(p));
                    if (filtreVar) c.filter = "none";
                    break;
                }
                case "flas": {
                    ciz(p < 0.5 ? A : B, 0, 0, p < 0.5 ? 1 + 0.06 * p : 1.03 - 0.03 * p);
                    c.globalAlpha = kes(1 - Math.abs(p - 0.5) * 2.6);
                    c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H);
                    c.globalAlpha = 1;
                    break;
                }
                default: ciz(p < 0.5 ? A : B, 0, 0, 1);
            }
        }
        // Dikey eksen etrafında perspektifli dönüş: resim ince şeritlere bölünür, her şerit kendi derinliğine göre
        // ölçeklenir (2B tuvalde gerçek 3B görünüm). golge: dönüş açısıyla koyulaşan yan ışık.
        function perspektif(c, img, cx, cy, w, hh, aci, N, golge) {
            const D = w * 2.4, co = Math.cos(aci), si = Math.sin(aci), sw = w / N, kx = img.width / w;
            for (let i = 0; i <= N; i++) {
                const u = i * sw - w / 2, f = D / (D + u * si);
                XS[i] = cx + u * co * f; FS[i] = f;
            }
            for (let i = 0; i < N; i++) {
                const ys = hh * (FS[i] + FS[i + 1]) / 2;
                c.drawImage(img, i * sw * kx, 0, sw * kx, img.height, XS[i], cy - ys / 2, XS[i + 1] - XS[i] + 0.7, ys);
            }
            if (golge > 0.004) {
                c.fillStyle = `rgba(0,0,0,${golge.toFixed(3)})`;
                c.beginPath();
                c.moveTo(XS[0], cy - hh * FS[0] / 2); c.lineTo(XS[N], cy - hh * FS[N] / 2);
                c.lineTo(XS[N], cy + hh * FS[N] / 2); c.lineTo(XS[0], cy + hh * FS[0] / 2);
                c.closePath(); c.fill();
            }
        }
        function donuk(img, aci, olc) {
            perspektif(ctx, img, W / 2, H / 2, W * olc, H * olc, aci, 64, 0.55 * Math.abs(Math.sin(aci)));
        }

        // ── Ürün vitrini sahnesi
        // Yumuşak elips gölge (bir kez çizilir, her karede gerilerek kullanılır)
        const elipsGolge = (() => {
            const g = tuval(64, 64), x = g.getContext("2d"), r = x.createRadialGradient(32, 32, 0, 32, 32, 32);
            r.addColorStop(0, "rgba(0,0,0,.55)"); r.addColorStop(0.55, "rgba(0,0,0,.22)"); r.addColorStop(1, "rgba(0,0,0,0)");
            x.fillStyle = r; x.fillRect(0, 0, 64, 64);
            return g;
        })();
        // 3B yansıma için ara tuval (zemine düşen, aşağı doğru solan ayna görüntüsü)
        const yansima = a.mod === "urun" && a.stil !== "2b" ? tuval(M * 0.95 * taban, M * 0.45 * taban) : null;
        const yctx = yansima ? yansima.getContext("2d") : null;
        const PATLAMA = Array.from({ length: 36 }, (_, i) => { const r = i % 2 ? 0.84 : 1, aci = (-90 + i * 10) * Math.PI / 180; return [Math.cos(aci) * r, Math.sin(aci) * r]; });

        function satirla(c, metin, font, maxW, enCok) {
            c.font = font;
            const kelimeler = String(metin || "").trim().split(/\s+/).filter(Boolean), satirlar = [];
            let s = "";
            for (const k of kelimeler) {
                const dene = s ? s + " " + k : k;
                if (!s || c.measureText(dene).width <= maxW) s = dene; else { satirlar.push(s); s = k; }
            }
            if (s) satirlar.push(s);
            if (satirlar.length > enCok) {
                satirlar.length = enCok;
                let son = satirlar[enCok - 1] + "…";
                while (son.length > 2 && c.measureText(son).width > maxW) son = son.slice(0, -2) + "…";
                satirlar[enCok - 1] = son;
            }
            return satirlar;
        }
        function urunDuzeni(c, hz) {
            if (hz.duzen) return hz.duzen;
            const m = E.belge.marka || {}, pay = M * 0.06, hb = M * 0.075;
            // Üst şerit: logo + market adı
            const markaAd = (m.ad || "").trim(), mb = hb * 0.42;
            c.font = `800 ${mb}px Inter`;
            const mw = markaAd ? c.measureText(markaAd).width : 0, lr = hb * 0.36, ara2 = hb * 0.22;
            const toplamW = (hz.logo ? lr * 2 + (markaAd ? ara2 : 0) : 0) + mw;
            const ust = { y: pay * 0.55 + hb / 2, x0: W / 2 - toplamW / 2, lr, mb, ad: markaAd };
            const alan = { x: pay, y: pay * 0.55 + hb + pay * 0.35, w: W - pay * 2 };
            alan.h = H - alan.y - pay * 0.7;
            const n = hz.urunler.length, alt = W <= H * 1.15;  // dikey / karede alt alta, yatayda yan yana
            const hucreler = hz.urunler.map((g, i) => hucreDuzeni(c, alt
                ? { x: alan.x, y: alan.y + alan.h * i / n, w: alan.w, h: alan.h / n }
                : { x: alan.x + alan.w * i / n, y: alan.y, w: alan.w / n, h: alan.h }, g, i));
            hz.duzen = { ust, hucreler };
            return hz.duzen;
        }
        function hucreDuzeni(c, h0, g, i) {
            const u = g.u, yat = h0.w / h0.h > 1.25;
            const d = { yat, yon: i % 2 ? -1 : 1 };
            if (yat) {
                d.S = Math.min(h0.w * 0.44, h0.h * 0.8);
                d.ix = h0.x + h0.w * 0.25; d.iy = h0.y + h0.h * 0.48;
            } else {
                d.S = Math.min(h0.w * 0.8, h0.h * 0.52);
                d.ix = h0.x + h0.w / 2; d.iy = h0.y + h0.h * 0.35;   // metin ölçülünce blok dikeyde ortalanır
            }
            const img = g.bitmap, o = Math.min(d.S / img.width, d.S / img.height);
            d.iw = img.width * o; d.ih = img.height * o;
            d.taban = d.iy + d.ih / 2;
            // Metinler
            const tw = yat ? h0.w * 0.44 : h0.w * 0.92;
            let ab = Math.min(M * 0.085, yat ? h0.h * 0.12 : h0.h * 0.068);
            let satirlar = satirla(c, u.ad, `900 ${ab}px Inter`, tw, 2);
            for (let k = 0; k < 3 && satirlar.length > 1 && c.measureText(satirlar[satirlar.length - 1]).width > tw; k++) { ab *= 0.9; satirlar = satirla(c, u.ad, `900 ${ab}px Inter`, tw, 2); }
            d.ad = { satirlar, boy: ab };
            const detay = [u.aciklama, u.birim].filter((x) => x && String(x).trim()).join(" · ");
            d.detay = detay ? { metin: satirla(c, detay, `600 ${ab * 0.46}px Inter`, tw, 1)[0], boy: ab * 0.46 } : null;
            d.eski = u.eski > u.fiyat && u.fiyat > 0 ? { metin: KS.fiyatMetin(u.eski), boy: ab * 0.62 } : null;
            d.yuzde = KS.indirimYuzde(u.fiyat, u.eski);
            d.rozet = u.rozet && String(u.rozet).trim() ? String(u.rozet).trim().toLocaleUpperCase("tr-TR") : null;
            d.hiza = yat ? "left" : "center";
            d.tx = yat ? h0.x + h0.w * 0.53 : h0.x + h0.w / 2;
            d.tw = tw;
            const metinYuk = satirlar.length * ab * 1.08 + (d.detay ? d.detay.boy * 1.7 : 0) + (d.eski ? d.eski.boy * 1.6 : 0);
            // Fiyat patlaması: dikeyde görselin sağ altında, yatayda metinlerin altında
            if (u.fiyat > 0) {
                const R = yat ? Math.min(h0.h * 0.2, tw * 0.3) : d.S * 0.25;
                d.fiyat = { R, parca: KS.fiyatParca(u.fiyat) };
                c.font = `400 ${R * 0.74}px Anton`;
                const wt = c.measureText(d.fiyat.parca.tam).width;
                c.font = `400 ${R * 0.32}px Anton`;
                const wk = c.measureText(d.fiyat.parca.kurus).width;
                d.fiyat.olc = Math.min(1, R * 1.42 / (wt + wk + R * 0.08));
                d.fiyat.wt = wt; d.fiyat.wk = wk;
            }
            if (yat) {
                const blok = metinYuk + (d.fiyat ? d.fiyat.R * 2.35 : 0);
                d.ty = h0.y + h0.h / 2 - blok / 2;
                if (d.fiyat) { d.fiyat.x = d.tx + d.fiyat.R * 1.05; d.fiyat.y = d.ty + metinYuk + d.fiyat.R * 1.2; }
            } else {
                // Görsel + boşluk + metinler tek blok olarak hücrede ortalanır (indirim rozeti için üstte pay)
                const bosluk = h0.h * 0.06, blok = d.S * 0.5 + d.ih / 2 + bosluk + metinYuk;
                const ust = Math.max(h0.y + d.S * 0.12, h0.y + (h0.h - blok) / 2);
                d.iy = ust + d.S * 0.5;
                d.taban = d.iy + d.ih / 2;
                d.ty = d.taban + bosluk;
                if (d.fiyat) { d.fiyat.x = d.ix + d.S * 0.4; d.fiyat.y = d.iy + d.S * 0.3; }
            }
            return d;
        }

        function urunCiz(c, s, u, hz) {
            const R = hz.renk, uc = a.stil !== "2b", D = urunDuzeni(c, hz);
            // Zemin
            if (uc) {
                const g = c.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, Math.hypot(W, H) * 0.62);
                g.addColorStop(0, KS.renkKarart(R.r1, -0.18)); g.addColorStop(0.45, R.r1); g.addColorStop(1, KS.renkKarart(R.r1, 0.7));
                c.fillStyle = g; c.fillRect(0, 0, W, H);
            } else {
                c.fillStyle = R.r1; c.fillRect(0, 0, W, H);
                // Düz stil: kayan eğik şeritler ve büyük renk daireleri
                c.save();
                c.globalAlpha = 0.07; c.fillStyle = "#ffffff";
                const aralik = M * 0.11, kay = (u * M * 0.04) % (aralik * 2);
                c.translate(W / 2, H / 2); c.rotate(-0.5);
                const L = Math.hypot(W, H);
                for (let x = -L / 2 - aralik * 2 + kay; x < L / 2; x += aralik * 2) c.fillRect(x, -L / 2, aralik, L);
                c.restore();
                c.globalAlpha = 0.16; c.fillStyle = R.r2;
                c.beginPath(); c.arc(W * 0.9, H * 0.08 + Math.sin(u * 0.6) * M * 0.02, M * 0.32, 0, Math.PI * 2); c.fill();
                c.beginPath(); c.arc(W * 0.06, H * 0.94 - Math.sin(u * 0.5) * M * 0.02, M * 0.24, 0, Math.PI * 2); c.fill();
                c.globalAlpha = 1;
            }
            c.save();
            if (a.kamera) { const z = 1 + 0.04 * (u / s.uzun); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2); }
            if (uc) {
                // Görselin arkasında dönen ışık hüzmeleri
                for (const x of D.hucreler) {
                    c.save();
                    c.translate(x.ix, x.iy);
                    c.rotate(u * 0.2 * x.yon);
                    c.globalAlpha = 0.1 * C3(kes(u / 1.2));
                    c.fillStyle = "#ffffff";
                    c.beginPath();
                    const n = 12, R0 = x.S * 1.25;
                    for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2; c.moveTo(0, 0); c.arc(0, 0, R0, a0, a0 + Math.PI / n / 1.4); c.closePath(); }
                    c.fill();
                    c.restore();
                }
            }
            parcacikCiz(c, u, hz);
            ustSerit(c, u, hz, D.ust);
            const basla = s.ilk ? 0.25 : GECIS * 0.55;
            D.hucreler.forEach((x, i) => urunHucre(c, x, hz.urunler[i], u - basla - i * 0.35, uc, R));
            c.restore();
        }
        function ustSerit(c, u, hz, d) {
            const p = kes((u - 0.1) / 0.6);
            if (p <= 0 || (!hz.logo && !d.ad)) return;
            c.save();
            c.globalAlpha = kes(p * 2);
            c.translate(0, -(1 - C5(p)) * d.lr * 2);
            let x = d.x0;
            if (hz.logo) {
                c.fillStyle = "#ffffff";
                c.beginPath(); c.arc(x + d.lr, d.y, d.lr, 0, Math.PI * 2); c.fill();
                const L = hz.logo, o = Math.min(d.lr * 1.45 / L.width, d.lr * 1.45 / L.height);
                c.drawImage(L, x + d.lr - L.width * o / 2, d.y - L.height * o / 2, L.width * o, L.height * o);
                x += d.lr * 2 + d.lr * 0.6;
            }
            if (d.ad) {
                c.font = `800 ${d.mb}px Inter`; c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = hz.renk.y1;
                c.fillText(d.ad, x, d.y);
            }
            c.restore();
        }
        function urunHucre(c, x, g, yu, uc, R) {
            if (yu <= -0.2) return;
            const img = g.bitmap, S = x.S;
            const p = kes(yu / 0.95), e = C5(p), dur = kes((yu - 0.8) / 0.8);
            const bob = Math.sin(yu * 2.1) * S * 0.022 * dur;
            // Zemin süsü: 3B'de dönen kaide ve yansıma, 2B'de elastik renk dairesi
            if (uc) {
                const pp = C5(kes((yu + 0.2) / 0.8));
                if (pp > 0) {
                    const kx = x.ix, ky = x.taban + S * 0.035, rx = S * 0.52 * pp, ry = S * 0.1 * pp, kal = S * 0.055 * pp;
                    c.fillStyle = KS.renkKarart(R.r1, 0.45);
                    c.beginPath(); c.ellipse(kx, ky + kal, rx, ry, 0, 0, Math.PI * 2); c.fill();
                    c.fillRect(kx - rx, ky, rx * 2, kal);
                    const kg = c.createLinearGradient(kx - rx, 0, kx + rx, 0);
                    kg.addColorStop(0, KS.renkKarart(R.r1, -0.05)); kg.addColorStop(0.5, KS.renkKarart(R.r1, -0.32)); kg.addColorStop(1, KS.renkKarart(R.r1, 0.05));
                    c.fillStyle = kg;
                    c.beginPath(); c.ellipse(kx, ky, rx, ry, 0, 0, Math.PI * 2); c.fill();
                    c.strokeStyle = R.r2; c.lineWidth = Math.max(1, S * 0.008); c.globalAlpha = 0.85;
                    c.beginPath(); c.ellipse(kx, ky, rx, ry, 0, 0, Math.PI * 2); c.stroke();
                    c.globalAlpha = 1;
                }
            } else {
                const bp = ELASTIK(kes((yu + 0.1) / 0.9));
                if (bp > 0) {
                    c.fillStyle = KS.renkKarart(R.r1, -0.22);
                    c.beginPath(); c.arc(x.ix, x.iy, S * 0.5 * bp, 0, Math.PI * 2); c.fill();
                    c.save();
                    c.strokeStyle = R.r2; c.lineWidth = S * 0.012; c.setLineDash([S * 0.03, S * 0.025]);
                    c.translate(x.ix, x.iy); c.rotate(yu * 0.35);
                    c.beginPath(); c.arc(0, 0, S * 0.56 * bp, 0, Math.PI * 2); c.stroke();
                    c.restore();
                }
            }
            if (yu > 0) {
                // Gölge
                const ga = kes(p * 2) * (1 - (bob / S) * 3);
                c.globalAlpha = kes(ga);
                const gw = x.iw * (uc ? 0.95 : 0.8) * (1 - bob / S), gy = x.taban + S * (uc ? 0.03 : 0.04);
                c.drawImage(elipsGolge, x.ix - gw / 2, gy - S * 0.05, gw, S * 0.1);
                c.globalAlpha = 1;
                if (uc) {
                    // Kenardan dönerek ve yükselerek gelir, sonra hafifçe salınır
                    const aci = (1 - e) * 1.3 * x.yon + 0.2 * Math.sin(yu * 1.25) * dur;
                    const sc = 0.55 + 0.45 * e, iw = x.iw * sc, ih = x.ih * sc;
                    const cy = x.taban - ih / 2 + (1 - e) * S * 0.28 - bob;
                    const al = kes(p * 2.5);
                    if (yansima && x.ih > 0) {
                        // Yansıma: kaidenin üst çizgisine göre ayna, aşağı doğru solar
                        const rw = Math.min(S * 1.3, yansima.width / taban), rh = Math.min(S * 0.6, yansima.height / taban), x0 = x.ix - rw / 2;
                        yctx.setTransform(1, 0, 0, 1, 0, 0);
                        yctx.globalCompositeOperation = "source-over";
                        yctx.clearRect(0, 0, rw * taban + 2, rh * taban + 2);
                        yctx.setTransform(taban, 0, 0, -taban, -x0 * taban, x.taban * taban);
                        perspektif(yctx, img, x.ix, cy, iw, ih, aci, 24, 0);
                        yctx.setTransform(1, 0, 0, 1, 0, 0);
                        yctx.globalCompositeOperation = "destination-in";
                        const yg = yctx.createLinearGradient(0, 0, 0, rh * taban);
                        yg.addColorStop(0, "rgba(0,0,0,.32)"); yg.addColorStop(0.55, "rgba(0,0,0,0)");
                        yctx.fillStyle = yg; yctx.fillRect(0, 0, rw * taban + 2, rh * taban + 2);
                        yctx.globalCompositeOperation = "source-over";
                        c.globalAlpha = al;
                        c.drawImage(yansima, 0, 0, rw * taban, rh * taban, x0, x.taban, rw, rh);
                    }
                    c.globalAlpha = al;
                    perspektif(c, img, x.ix, cy, iw, ih, aci, 32, 0.4 * Math.abs(Math.sin(aci)));
                    c.globalAlpha = 1;
                } else {
                    // Zıplayarak büyür, döner; sonra süzülür ve nefes alır
                    const sc = Math.max(0, GERI(p)) * (1 + 0.018 * Math.sin(yu * 2.6) * dur);
                    if (sc > 0.002) {
                        c.save();
                        c.globalAlpha = kes(p * 3);
                        c.translate(x.ix, x.iy - bob);
                        c.rotate((1 - C3(p)) * -0.6 * x.yon);
                        c.scale(sc, sc);
                        c.drawImage(img, -x.iw / 2, -x.ih / 2, x.iw, x.ih);
                        c.restore();
                    }
                }
            }
            // İndirim rozeti: yukarıdan düşer, sallanarak oturur
            if (x.yuzde) {
                const q = kes((yu - 0.95) / 0.7);
                if (q > 0) {
                    const r = S * 0.15, bx = x.ix - S * 0.4, by = x.iy - S * 0.36 - (1 - GERI(q)) * S * 0.35;
                    c.save();
                    c.globalAlpha = kes(q * 3);
                    c.translate(bx, by); c.rotate(-0.2 + Math.sin(yu * 2) * 0.05 * kes(q * 2 - 1));
                    c.shadowColor = "rgba(0,0,0,.3)"; c.shadowBlur = r * 0.35; c.shadowOffsetY = r * 0.08;
                    c.fillStyle = "#ffffff"; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
                    c.shadowColor = "transparent";
                    c.strokeStyle = R.r2; c.lineWidth = r * 0.1; c.beginPath(); c.arc(0, 0, r * 0.86, 0, Math.PI * 2); c.stroke();
                    c.fillStyle = R.r1 === "#ffffff" ? "#e30613" : R.r1; c.textAlign = "center"; c.textBaseline = "middle";
                    c.font = `900 ${r * 0.62}px Inter`; c.fillText("%" + x.yuzde, 0, -r * 0.1);
                    c.font = `800 ${r * 0.22}px Inter`; c.fillText("İNDİRİM", 0, r * 0.42);
                    c.restore();
                }
            }
            if (x.rozet) {
                const q = kes((yu - 1.1) / 0.6);
                if (q > 0) {
                    const by = x.iy - S * 0.44, bx = x.ix + S * 0.28 + (1 - C5(q)) * S * 0.5;
                    c.save();
                    c.globalAlpha = kes(q * 3);
                    c.font = `800 ${S * 0.055}px Inter`;
                    const w = c.measureText(x.rozet).width + S * 0.07, y = S * 0.095;
                    c.translate(bx, by); c.rotate(0.08);
                    c.fillStyle = R.r2; c.beginPath(); c.ellipse(0, 0, w / 2 + y * 0.2, y / 2, 0, 0, Math.PI * 2); c.fill();
                    c.fillRect(-w / 2, -y / 2, w, y);
                    c.fillStyle = R.y2; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(x.rozet, 0, S * 0.004);
                    c.restore();
                }
            }
            urunMetinleri(c, x, yu, R);
            if (x.fiyat) fiyatPatlamasi(c, x, yu, R);
        }
        function urunMetinleri(c, x, yu, R) {
            let y = x.ty;
            c.save();
            c.textBaseline = "alphabetic"; c.textAlign = "left";
            c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = x.ad.boy * 0.12; c.shadowOffsetY = x.ad.boy * 0.04;
            c.font = `900 ${x.ad.boy}px Inter`;
            x.ad.satirlar.forEach((satir, j) => {
                const q = kes((yu - 0.45 - j * 0.12) / 0.6);
                const by = y + x.ad.boy * (0.9 + j * 1.08);
                if (q > 0) {
                    const w = c.measureText(satir).width, sx = x.hiza === "center" ? x.tx - w / 2 : x.tx;
                    c.save();
                    c.beginPath(); c.rect(sx - x.ad.boy * 0.2, by - x.ad.boy * 1.2, (w + x.ad.boy * 0.4) * C5(q), x.ad.boy * 1.6); c.clip();
                    c.globalAlpha = kes(q * 3); c.fillStyle = R.y1;
                    c.fillText(satir, sx, by + (1 - C3(q)) * x.ad.boy * 0.4);
                    c.restore();
                }
            });
            y += x.ad.satirlar.length * x.ad.boy * 1.08;
            c.shadowColor = "transparent";
            c.textAlign = x.hiza;
            if (x.detay) {
                const q = kes((yu - 0.75) / 0.6);
                if (q > 0) {
                    c.globalAlpha = kes(q * 2) * 0.85; c.fillStyle = R.y1; c.font = `600 ${x.detay.boy}px Inter`;
                    c.fillText(x.detay.metin, x.tx, y + x.detay.boy * 1.35 + (1 - C5(q)) * x.detay.boy * 0.6);
                }
                y += x.detay.boy * 1.7;
            }
            if (x.eski) {
                const q = kes((yu - 0.85) / 0.5);
                if (q > 0) {
                    c.globalAlpha = kes(q * 2) * 0.9; c.fillStyle = R.y1; c.font = `700 ${x.eski.boy}px Inter`;
                    const by = y + x.eski.boy * 1.25, w = c.measureText(x.eski.metin).width, sx = x.hiza === "center" ? x.tx - w / 2 : x.tx;
                    c.fillText(x.eski.metin, x.tx, by);
                    // Üstünü çizen çizgi soldan sağa çekilir
                    const cz = C5(kes((yu - 1.05) / 0.4));
                    if (cz > 0) {
                        c.strokeStyle = R.r2; c.lineWidth = x.eski.boy * 0.13; c.lineCap = "round";
                        c.beginPath(); c.moveTo(sx - x.eski.boy * 0.1, by - x.eski.boy * 0.32);
                        c.lineTo(sx - x.eski.boy * 0.1 + (w + x.eski.boy * 0.2) * cz, by - x.eski.boy * 0.32 - x.eski.boy * 0.12 * cz); c.stroke();
                    }
                }
            }
            c.restore();
        }
        function fiyatPatlamasi(c, x, yu, R) {
            const q = kes((yu - 0.6) / 1.0);
            if (q <= 0) return;
            const f = x.fiyat, sc0 = ELASTIK(q);
            let sc = sc0;
            // Vurgu: yerine oturduktan sonra nabız ve dışa yayılan halka
            let halka = -1;
            if (a.vurgu) { const v = (yu - 1.9) / 0.7; if (v > 0 && v < 1) { sc *= 1 + 0.1 * Math.sin(v * Math.PI); halka = v; } }
            if (halka >= 0) {
                c.save();
                c.globalAlpha = (1 - halka) * 0.8; c.strokeStyle = R.r2; c.lineWidth = f.R * 0.08 * (1 - halka) + 1;
                c.beginPath(); c.arc(f.x, f.y, f.R * (1 + halka * 0.9), 0, Math.PI * 2); c.stroke();
                c.restore();
            }
            if (sc < 0.002) return;
            c.save();
            c.translate(f.x, f.y);
            c.scale(sc, sc);
            c.globalAlpha = kes(q * 4);
            // Işınlı yıldız yavaşça döner, yazı sabit açıda kalır
            c.save();
            c.rotate(yu * 0.25);
            c.shadowColor = "rgba(0,0,0,.3)"; c.shadowBlur = f.R * 0.25; c.shadowOffsetY = f.R * 0.06;
            c.fillStyle = R.r2;
            c.beginPath();
            PATLAMA.forEach(([px, py], i) => (i ? c.lineTo(px * f.R, py * f.R) : c.moveTo(px * f.R, py * f.R)));
            c.closePath(); c.fill();
            c.restore();
            c.rotate((1 - C3(q)) * -0.9 - 0.14);
            c.scale(f.olc, f.olc);
            const yazi = KS.parlaklik(R.r2) > 0.62 ? (KS.parlaklik(R.r1) < 0.62 ? R.r1 : "#15171c") : "#ffffff";
            c.fillStyle = yazi; c.textBaseline = "alphabetic"; c.textAlign = "left";
            const top = f.wt + f.wk + f.R * 0.06, x0 = -top / 2, by = f.R * 0.27;
            c.font = `400 ${f.R * 0.74}px Anton`; c.fillText(f.parca.tam, x0, by);
            c.font = `400 ${f.R * 0.32}px Anton`; c.fillText(f.parca.kurus, x0 + f.wt + f.R * 0.06, by - f.R * 0.3);
            c.font = `800 ${f.R * 0.26}px Inter`; c.fillText("₺", x0 + f.wt + f.R * 0.07, by);
            c.restore();
        }

        return { kare, hazirMi, isit, tuval: hedef };
    }

    // ── Kodlama ─────────────────────────────────────────────────
    async function videoYapilandirma(W, H, fps) {
        if (!window.VideoEncoder) return null;
        const mb = Math.ceil(W / 16) * Math.ceil(H / 16), mbs = mb * fps;
        // H.264 seviyeleri: [kod, en çok makroblok, saniyede en çok makroblok]
        const seviyeler = [[0x28, 8192, 245760], [0x2a, 8704, 522240], [0x32, 22080, 589824], [0x33, 36864, 983040], [0x34, 36864, 2073600]]
            .filter(([, m1, m2]) => mb <= m1 && mbs <= m2).map((x) => x[0].toString(16));
        const bitrate = Math.round(Math.min(24e6, W * H * fps * 0.055));
        for (const profil of ["6400", "4d00", "42e0"]) {
            for (const sv of seviyeler) {
                const y = { codec: `avc1.${profil}${sv}`, width: W, height: H, bitrate, framerate: fps, avc: { format: "avc" } };
                try { if ((await VideoEncoder.isConfigSupported(y)).supported) return y; } catch (hata) { /* sonrakini dene */ }
            }
        }
        return null;
    }
    async function sesYapilandirma() {
        if (!window.AudioEncoder) return null;
        for (const [codec, muxer] of [["mp4a.40.2", "aac"], ["opus", "opus"]]) {
            const y = { codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 160000 };
            try { if ((await AudioEncoder.isConfigSupported(y)).supported) return { y, muxer }; } catch (hata) { /* sonrakini dene */ }
        }
        return null;
    }
    // Müziği video boyunca döngüyle uzatır; başta yumuşak giriş, sonda 2 saniyelik kısılma
    async function sesIsle(dosya, sure, seviye) {
        const veri = await dosya.arrayBuffer();
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ac = new Ctx();
        let kaynak;
        try { kaynak = await ac.decodeAudioData(veri); } finally { ac.close(); }
        const oac = new OfflineAudioContext(2, Math.ceil(sure * 48000), 48000);
        const src = oac.createBufferSource();
        src.buffer = kaynak; src.loop = true;
        const g = oac.createGain();
        g.gain.setValueAtTime(0, 0);
        g.gain.linearRampToValueAtTime(seviye, 0.5);
        g.gain.setValueAtTime(seviye, Math.max(0.6, sure - 2));
        g.gain.linearRampToValueAtTime(0, sure);
        src.connect(g); g.connect(oac.destination);
        src.start(0);
        return oac.startRendering();
    }
    async function sesKodla(muxer, tampon, yap) {
        let hata = null;
        const enc = new AudioEncoder({ output: (p, m) => muxer.addAudioChunk(p, m), error: (e) => { hata = e; } });
        enc.configure(yap.y);
        const N = tampon.length, sol = tampon.getChannelData(0), sag = tampon.getChannelData(tampon.numberOfChannels > 1 ? 1 : 0), PARCA = 4800;
        for (let i = 0; i < N; i += PARCA) {
            const n = Math.min(PARCA, N - i), veri = new Float32Array(n * 2);
            veri.set(sol.subarray(i, i + n), 0);
            veri.set(sag.subarray(i, i + n), n);
            const ad = new AudioData({ format: "f32-planar", sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / 48000 * 1e6), data: veri });
            enc.encode(ad);
            ad.close();
            if (enc.encodeQueueSize > 20) await KS.bekle(0);
        }
        await enc.flush();
        enc.close();
        if (hata) throw hata;
    }

    async function videoYap(a, sayfalar, urunler, muzik, { ilerle, durum, iptalMi }) {
        const b = E.belge, olcu = olcuHesapla(a, b), plan = planla(a, sayfalar, urunler);
        if (!plan.sahneler.length) throw new Error("Videoya eklenecek bir şey yok: ürün seçin ya da açılış / kapanış kartını açın.");
        const hedef = tuval(olcu.W, olcu.H);
        const hzc = hazirlayici(olcu, olcu.k);
        const ciz = cizici(hedef, olcu, plan, hzc);
        const ortak = { a, plan, olcu, hzc, ciz, hedef, muzik, ilerle, durum, iptalMi };
        try {
            const yap = window.VideoFrame ? await videoYapilandirma(olcu.W, olcu.H, a.fps) : null;
            return yap ? await webCodecsIle(ortak, yap) : await kayitIle(ortak);
        } finally { hzc.kapat(); hedef.width = 0; }
    }

    async function webCodecsIle({ a, plan, olcu, hzc, ciz, hedef, muzik, ilerle, durum, iptalMi }, yap) {
        durum("Kodlayıcı hazırlanıyor…");
        await KS.betikYukle(MUXER);
        const Mx = window.Mp4Muxer;
        let sesTampon = null, sesYap = null;
        if (muzik) {
            sesYap = await sesYapilandirma();
            if (sesYap) { durum("Müzik hazırlanıyor…"); sesTampon = await sesIsle(muzik.dosya, plan.toplam, a.ses / 100); }
            else KS.bildir("Bu tarayıcı ses kodlayamıyor; video müziksiz oluşturulacak.", { tur: "hata", sure: 5000 });
        }
        const hedefBellek = new Mx.ArrayBufferTarget();
        const muxer = new Mx.Muxer({
            target: hedefBellek, fastStart: "in-memory", firstTimestampBehavior: "offset",
            video: { codec: "avc", width: olcu.W, height: olcu.H, frameRate: a.fps },
            audio: sesTampon ? { codec: sesYap.muxer, numberOfChannels: 2, sampleRate: 48000 } : undefined
        });
        if (sesTampon) await sesKodla(muxer, sesTampon, sesYap);
        let hata = null;
        const enc = new VideoEncoder({ output: (p, m) => muxer.addVideoChunk(p, m), error: (e) => { hata = e; } });
        enc.configure(yap);
        const bosalma = () => new Promise((r) => { if ("ondequeue" in enc) enc.addEventListener("dequeue", r, { once: true }); else setTimeout(r, 2); });
        const fps = a.fps, kareSayisi = Math.ceil(plan.toplam * fps), ss = plan.sahneler;
        let sonSahne = -1;
        try {
            for (let i = 0; i < kareSayisi; i++) {
                if (iptalMi()) return null;
                if (hata) throw hata;
                const t = i / fps, k = sahneBul(plan, t);
                if (k !== sonSahne) {
                    // Gereken sahneler hazır olsun; sonraki şimdiden arka planda hazırlansın; geride kalanlar bellekten çıksın
                    for (let j = 0; j < k - 1; j++) hzc.birak(ss[j]);
                    durum(ss[k].tur === "sayfa" ? `Sayfa ${ss[k].no + 1} / ${plan.sahneler.filter((x) => x.tur === "sayfa").length} işleniyor…` : ss[k].tur === "acilis" ? "Açılış kartı işleniyor…" : "Kapanış kartı işleniyor…");
                    if (k > 0) await hzc.al(ss[k - 1]);
                    await hzc.al(ss[k]);
                    if (k + 1 < ss.length) hzc.al(ss[k + 1]).catch(() => {});
                    sonSahne = k;
                }
                ciz.kare(t);
                const kare = new VideoFrame(hedef, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
                enc.encode(kare, { keyFrame: i % (fps * 2) === 0 });
                kare.close();
                while (enc.encodeQueueSize > 6) await bosalma();
                if (i % 4 === 0) { ilerle(i / kareSayisi); await KS.bekle(0); }
            }
            durum("Video tamamlanıyor…");
            await enc.flush();
        } finally { if (enc.state !== "closed") enc.close(); }
        if (hata) throw hata;
        muxer.finalize();
        ilerle(1);
        return { blob: new Blob([hedefBellek.buffer], { type: "video/mp4" }), uzanti: "mp4" };
    }

    // WebCodecs olmayan tarayıcılar: gerçek zamanlı kayıt. Takılma olmasın diye bütün sahneler önceden hazırlanır.
    async function kayitIle({ a, plan, olcu, hzc, ciz, hedef, muzik, ilerle, durum, iptalMi }) {
        if (!window.MediaRecorder || !hedef.captureStream) throw new Error("Bu tarayıcı video oluşturmayı desteklemiyor. Chrome, Edge ya da Safari'nin güncel sürümünü kullanın.");
        const ss = plan.sahneler;
        for (let i = 0; i < ss.length; i++) {
            if (iptalMi()) return null;
            durum(`Sahneler hazırlanıyor ${i + 1} / ${ss.length}…`);
            ciz.isit(await hzc.al(ss[i]));
            ilerle((i + 1) / ss.length * 0.3);
        }
        const akis = hedef.captureStream(a.fps);
        let ac = null, kaynak = null;
        if (muzik) {
            const tampon = await sesIsle(muzik.dosya, plan.toplam, a.ses / 100);
            ac = new (window.AudioContext || window.webkitAudioContext)();
            const cikis = ac.createMediaStreamDestination();
            kaynak = ac.createBufferSource();
            kaynak.buffer = tampon;
            kaynak.connect(cikis);
            akis.addTrack(cikis.stream.getAudioTracks()[0]);
        }
        const tur = ["video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
            .find((x) => MediaRecorder.isTypeSupported(x)) || "";
        const kayit = new MediaRecorder(akis, { mimeType: tur || undefined, videoBitsPerSecond: Math.round(olcu.W * olcu.H * a.fps * 0.055) });
        const parcalar = [];
        kayit.ondataavailable = (e) => { if (e.data && e.data.size) parcalar.push(e.data); };
        const bitti = new Promise((r) => { kayit.onstop = r; });
        durum("Kaydediliyor — bu sekmeyi açık tutun…");
        ciz.kare(0);
        kayit.start(250);
        if (kaynak) kaynak.start();
        const bas = performance.now();
        await new Promise((coz) => {
            const adim = () => {
                const t = (performance.now() - bas) / 1000;
                if (iptalMi() || t >= plan.toplam) { coz(); return; }
                ciz.kare(t);
                ilerle(0.3 + 0.7 * t / plan.toplam);
                requestAnimationFrame(adim);
            };
            requestAnimationFrame(adim);
        });
        kayit.stop();
        await bitti;
        if (ac) ac.close();
        akis.getTracks().forEach((x) => x.stop());
        if (iptalMi()) return null;
        const mime = kayit.mimeType || tur || "video/webm";
        return { blob: new Blob(parcalar, { type: mime.split(";")[0] }), uzanti: mime.includes("mp4") ? "mp4" : "webm" };
    }

    // ── Video stüdyosu penceresi ────────────────────────────────
    function ac() {
        if (E.duzenlenen) KS.editor.metinBitir();
        const b = E.belge;
        const a = Object.assign({}, ayar);
        let muzik = null;              // { dosya, url, ses: HTMLAudioElement }
        let plan = null, olcu = null, hzc = null, ciz = null;
        let acik = true, raf = 0, oynuyor = false, zaman = 0, bazZaman = 0, bazAn = 0, kirli = true;
        let hazirlikNo = 0, hepsiHazir = false, ilkOynatma = true, bosPlan = false;
        let disaAktariliyor = false, iptal = false, sonuc = null;

        // Sahne (önizleme)
        const onizTuval = h("canvas.video-tuval", { "aria-label": "Video önizleme" });
        const sonucVideo = h("video.video-sonuc", { controls: true, playsinline: true, loop: true, hidden: true });
        const bilgi = h("div.video-rozetler");
        const ortuBaslik = h("b"), ortuAlt = h("small"), ortuIlerleme = h("div.ilerleme", h("div"));
        const iptalDugme = h("button.dugme.kucuk", { type: "button", hidden: true }, "İptal");
        const ortu = h("div.video-ortu", h("div.kutu", ortuBaslik, ortuAlt, ortuIlerleme, iptalDugme));
        const ekran = h("div.video-ekran", onizTuval, sonucVideo, ortu, bilgi);
        const oynatDugme = h("button.video-oynat", { type: "button", "aria-label": "Oynat" });
        const cizgi = h("input.video-cizgi", { type: "range", min: 0, max: 1000, value: 0, "aria-label": "Zaman" });
        const zamanYazi = h("span.video-zaman");
        const kontrol = h("div.video-kontrol", oynatDugme, cizgi, zamanYazi);
        const sahneEl = h("div.video-sahne", ekran, kontrol);
        const ayarlarEl = h("div.video-ayarlar");

        function oynatIkonu() {
            oynatDugme.replaceChildren(KS.ikon(oynuyor ? "durdur" : "oynat", 18));
            oynatDugme.setAttribute("aria-label", oynuyor ? "Duraklat" : "Oynat");
        }
        function ortuGoster(baslik, alt, oran) {
            ortu.hidden = false;
            ortuBaslik.textContent = baslik;
            ortuAlt.textContent = alt || "";
            ortuIlerleme.hidden = oran == null;
            if (oran != null) ortuIlerleme.firstChild.style.width = Math.round(oran * 100) + "%";
        }

        // ── Oynatma
        function sesAyarla() {
            if (!muzik) return;
            const m = muzik, s = m.ses;
            s.volume = KS.sinirla((a.ses / 100) * Math.min(1, zaman / 0.5, Math.max(0, (plan.toplam - zaman) / 2)), 0, 1);
            if (oynuyor && hepsiHazir && s.paused && !m.basliyor) {
                m.basliyor = true;
                if (s.duration) s.currentTime = zaman % s.duration;
                s.play().catch(() => {}).finally(() => { m.basliyor = false; });
            }
            if ((!oynuyor || !hepsiHazir) && !s.paused) s.pause();
        }
        function oynat(v) {
            if (disaAktariliyor || sonuc) return;
            oynuyor = v;
            if (v && zaman >= plan.toplam - 0.05) zaman = 0;
            bazZaman = zaman; bazAn = performance.now();
            if (muzik && muzik.ses.duration) muzik.ses.currentTime = zaman % muzik.ses.duration;
            oynatIkonu();
            sesAyarla();
            kirli = true;
        }
        function git(t, oynasin) {
            zaman = KS.sinirla(t, 0, plan.toplam - 0.001);
            bazZaman = zaman; bazAn = performance.now();
            if (muzik && muzik.ses.duration) muzik.ses.currentTime = zaman % muzik.ses.duration;
            if (oynasin != null) oynat(oynasin);
            kirli = true;
        }
        function dongu(an) {
            if (!acik) return;
            raf = requestAnimationFrame(dongu);
            if (!plan || !ciz || sonuc) return;
            if (oynuyor && hepsiHazir) {
                zaman = bazZaman + (an - bazAn) / 1000;
                if (zaman >= plan.toplam) { zaman = 0; bazZaman = 0; bazAn = an; if (muzik) muzik.ses.currentTime = 0; }
                kirli = true;
            } else { bazAn = an; bazZaman = zaman; }
            if (!kirli) return;
            kirli = false;
            if (ciz.hazirMi(zaman)) ciz.kare(zaman);
            if (document.activeElement !== cizgi) cizgi.value = Math.round(zaman / plan.toplam * 1000);
            cizgi.style.setProperty("--dolu", (zaman / plan.toplam * 100).toFixed(2) + "%");
            zamanYazi.textContent = `${sureMetni(zaman)} / ${sureMetni(plan.toplam)}`;
            sesAyarla();
        }

        // ── Kurulum: plan değişir (süre, geçiş…) ya da hazırlık baştan (biçim, sayfalar)
        function sayfalarSec() {
            const tum = b.sayfalar;
            if (a.kapsam !== "aralik") return tum;
            const l = KS.disaaktar.aralikCoz(a.aralik, tum.length).map((i) => tum[i]);
            return l.length ? l : tum;
        }
        function tuvalBoyutla() {
            const ew = Math.max(160, ekran.clientWidth - 28), eh = Math.max(160, ekran.clientHeight - 28);
            const o = Math.min(ew / olcu.W, eh / olcu.H);
            const cw = olcu.W * o, ch = olcu.H * o, dpr = Math.min(window.devicePixelRatio || 1, 2);
            onizTuval.style.width = cw + "px"; onizTuval.style.height = ch + "px";
            const pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
            if (onizTuval.width !== pw || onizTuval.height !== ph) { onizTuval.width = pw; onizTuval.height = ph; return true; }
            return false;
        }
        function yerlestir() {
            // Pencere boyutu değişince yalnız CSS boyutu güncellenir; çözünürlük (ve hazırlık) aynı kalır
            if (!olcu || sonuc) return;
            const ew = Math.max(160, ekran.clientWidth - 28), eh = Math.max(160, ekran.clientHeight - 28);
            const o = Math.min(ew / olcu.W, eh / olcu.H);
            onizTuval.style.width = olcu.W * o + "px"; onizTuval.style.height = olcu.H * o + "px";
        }
        function kur({ hazirlik = false } = {}) {
            plan = planla(a, sayfalarSec(), seciliUrunler());
            const bos = bosPlan = !plan.sahneler.length;
            if (anaDugme && !sonuc) anaDugme.disabled = bos || disaAktariliyor;
            if (bos) {
                // Hiç sahne yok (ürün seçilmemiş, açılış / kapanış kapalı)
                plan = planla(Object.assign({}, a, { acilis: true }), [], []);
                ortuGoster("Videoya eklenecek ürün seçin", "Sağdaki listeden en az bir ürün işaretleyin.");
            }
            if (hazirlik || !hzc) {
                olcu = olcuHesapla(a, b);
                tuvalBoyutla();
                if (hzc) hzc.kapat();
                hzc = hazirlayici(olcu, olcu.k * onizTuval.width / olcu.W);
            }
            ciz = cizici(onizTuval, olcu, plan, hzc);
            zaman = Math.min(zaman, plan.toplam - 0.001);
            bilgiYaz();
            hepsiniHazirla();
            kirli = true;
        }
        async function hepsiniHazirla() {
            const no = ++hazirlikNo, ss = plan.sahneler, z = hzc;
            const eksik = ss.filter((s) => !z.hazir(s));
            if (!eksik.length) {
                hepsiHazir = true;
                if (!disaAktariliyor && !bosPlan) ortu.hidden = true;
                for (const s of ss) ciz.isit(z.hazir(s));
                return;
            }
            hepsiHazir = false;
            // Önce şu anki sahne: ilk kare hemen görünsün
            const k = sahneBul(plan, zaman);
            const sira = [ss[k], ...ss.filter((s, i) => i !== k)];
            let biten = ss.length - eksik.length;
            for (const s of sira) {
                if (no !== hazirlikNo || !acik) return;
                if (z.hazir(s)) continue;
                ortuGoster("Önizleme hazırlanıyor…", `${biten + 1} / ${ss.length} sahne`, biten / ss.length);
                try { const hz = await z.al(s); if (hz && ciz) ciz.isit(hz); }
                catch (hata) { console.error(hata); ortuGoster("Önizleme hazırlanamadı", hata.message || String(hata)); return; }
                biten++;
                kirli = true;
            }
            if (no !== hazirlikNo || !acik) return;
            hepsiHazir = true;
            for (const s of ss) ciz.isit(z.hazir(s));
            if (!disaAktariliyor && !bosPlan) ortu.hidden = true;
            bazZaman = zaman; bazAn = performance.now();
            if (ilkOynatma) { ilkOynatma = false; oynat(true); }
            sesAyarla();
        }
        function bilgiYaz() {
            const o = olcuHesapla(a, b);
            bilgi.replaceChildren(h("span", sureMetni(plan.toplam)), h("span", `${o.W} × ${o.H}`), h("span", `${a.fps} fps · ${window.VideoEncoder ? "MP4" : "video"}`));
        }
        // Ayar değişince: kaydet, planı / hazırlığı yenile, değişikliğin görüleceği âna git
        function degisti(alan, { hazirlik = false, oynat: oynasin = true } = {}) {
            Object.assign(ayar, a);
            delete ayar.muzik;
            ayarKaydet();
            if (sonuc) return;
            kur({ hazirlik });
            const ss = plan.sahneler;
            if (alan === "gecis") { const i = ss.findIndex((s) => s.gecis); if (i > 0) git(ss[i].bas - 0.35, oynasin); }
            else if (alan === "anim" || alan === "vurgu") { const s = ss.find((x) => x.tur === "sayfa"); if (s) git(s.bas, oynasin); }
            else if (alan === "acilis") git(0, oynasin);
            else if (alan === "kapanis") git(a.kapanis ? ss[ss.length - 1].bas - 0.3 : plan.toplam - 2.5, oynasin);
            else if (alan === "bicim" || alan === "sayfa") git(0, oynasin);
            else if (["mod", "urunler", "urunSay", "stil"].includes(alan)) { const s = ss.find((x) => x.tur === "urun" || x.tur === "sayfa"); git(s ? s.bas : 0, oynasin); }
            if (bosPlan) oynat(false);
        }

        // ── Ayar paneli
        function cipler(liste, deger, fn) {
            const el = h("div.video-cipler", { role: "group" });
            const dugmeler = liste.map((x) => {
                const d = h("button.video-cip", { type: "button", "aria-pressed": String(x.id === deger) }, x.ad);
                d.addEventListener("click", () => { dugmeler.forEach((y) => y.setAttribute("aria-pressed", String(y === d))); fn(x.id); });
                return d;
            });
            el.append(...dugmeler);
            return el;
        }
        const baslik = (metin) => h("div.video-baslik", metin);
        function anahtarSatiri(ad, alt, alan, ek) {
            const an = KS.ui.anahtar({ deger: a[alan], etiket: ad, degisti: (v) => { a[alan] = v; if (ek) ek(v); degisti(alan); } });
            return h("label.video-anahtar", h("span", ad, alt ? h("small", alt) : null), an.el);
        }
        function muzikSatiri() {
            const kap = h("div.video-muzik-kap");
            const ciz2 = () => {
                if (!muzik) {
                    const d = h("button.dugme.kucuk.video-muzik-ekle", { type: "button" }, KS.ikon("muzik", 16), "Müzik ekle…");
                    d.addEventListener("click", async () => {
                        const [dosya] = await KS.dosyaSec({ kabul: "audio/*" });
                        if (!dosya) return;
                        const url = URL.createObjectURL(dosya);
                        const ses = new Audio(url);
                        ses.loop = true; ses.preload = "auto";
                        muzik = { dosya, url, ses };
                        ses.addEventListener("loadedmetadata", () => { kirli = true; if (oynuyor) git(zaman, true); });
                        ciz2();
                        kirli = true;
                    });
                    kap.replaceChildren(d, h("p.ipucu-metin", { style: { margin: "6px 0 0" } }, "MP3, M4A, WAV… Video boyunca döner, sonda yumuşakça kısılır."));
                    return;
                }
                const kaldir = h("button.ikon-dugme.kucuk", { type: "button", title: "Müziği kaldır", "aria-label": "Müziği kaldır" }, KS.ikon("kapat", 15));
                kaldir.addEventListener("click", () => { muzik.ses.pause(); URL.revokeObjectURL(muzik.url); muzik = null; ciz2(); });
                kap.replaceChildren(
                    h("div.video-muzik", KS.ikon("muzik", 16), h("span", { title: muzik.dosya.name }, muzik.dosya.name), kaldir),
                    KS.ui.alan("Ses", KS.ui.kaydirici({ min: 0, max: 100, deger: a.ses, son: "%", degisti: (v, son) => { a.ses = v; sesAyarla(); if (son) degisti("ses", { oynat: null }); } }).el));
            };
            ciz2();
            return kap;
        }
        function ayarlariCiz() {
            const aralik = h("input.girdi", { value: a.aralik, placeholder: "ör. 1-3, 5", style: { maxWidth: "130px" } });
            aralik.addEventListener("keydown", (e) => e.stopPropagation());
            aralik.addEventListener("change", () => { a.aralik = aralik.value; a.kapsam = "aralik"; kapsamCip.querySelectorAll("button").forEach((d, i) => d.setAttribute("aria-pressed", String(i === 1))); degisti("sayfa"); });
            const kapsamCip = cipler([{ id: "hepsi", ad: `Tümü (${b.sayfalar.length})` }, { id: "aralik", ad: "Aralık" }], a.kapsam, (v) => { a.kapsam = v; if (v === "aralik") aralik.focus(); degisti("sayfa"); });
            const kapanisYazi = KS.ui.metinGir({ deger: a.kapanisYazi, yer: "ör. Sizi bekliyoruz!", degisti: (v, son) => { a.kapanisYazi = v; if (son) degisti("kapanis"); } });
            const kapanisAlan = h("div", { hidden: !a.kapanis, style: { margin: "2px 0 6px" } }, kapanisYazi.el);
            const urunModu = a.mod === "urun";
            const bicimDegeri = urunModu && a.bicim === "sayfa" ? "hikaye" : a.bicim;
            ayarlarEl.replaceChildren(
                h("div.video-mod", { role: "tablist" }, ...[["katalog", "sayfa", "Katalog sayfaları"], ["urun", "urun", "Ürün vitrini"]].map(([id, ikon, ad]) => {
                    const d = h("button", { type: "button", role: "tab", "aria-selected": String(a.mod === id) }, KS.ikon(ikon, 16), ad);
                    d.addEventListener("click", () => { if (a.mod === id) return; a.mod = id; ayarlariCiz(); degisti("mod", { hazirlik: true }); });
                    return d;
                })),
                baslik("Biçim"),
                cipler(urunModu ? BICIMLER.filter((x) => x.id !== "sayfa") : BICIMLER, bicimDegeri, (v) => { a.bicim = v; degisti("bicim", { hazirlik: true }); }),
                h("div.video-ikili",
                    h("div", baslik("Kalite"), cipler([{ id: 720, ad: "720p" }, { id: 1080, ad: "1080p" }], a.kalite, (v) => { a.kalite = v; degisti("kalite", { oynat: null }); })),
                    h("div", baslik("Akıcılık"), cipler([{ id: 30, ad: "30 fps" }, { id: 60, ad: "60 fps" }], a.fps, (v) => { a.fps = v; degisti("fps", { oynat: null }); }))),
                ...(urunModu ? [
                    baslik("Ürünler"),
                    urunSecici(),
                    h("div.video-ikili",
                        h("div", baslik("Stil"), cipler(STILLER, a.stil, (v) => { a.stil = v; degisti("stil"); })),
                        h("div", baslik("Ekranda"), cipler([1, 2, 3].map((n) => ({ id: n, ad: n + " ürün" })), a.urunSay, (v) => { a.urunSay = v; degisti("urunSay"); }))),
                    baslik("Ürün başına süre"),
                    KS.ui.kaydirici({ min: 2, max: 8, adim: 0.5, basamak: 1, deger: a.urunSure, son: "sn", degisti: (v, son) => { a.urunSure = v; if (son !== false) degisti("sure", { oynat: null }); } }).el,
                    baslik("Geçiş"),
                    cipler(GECISLER, a.gecis, (v) => { a.gecis = v; degisti("gecis"); })
                ] : [
                    baslik("Sayfa başına süre"),
                    KS.ui.kaydirici({ min: 2, max: 10, adim: 0.5, basamak: 1, deger: a.sure, son: "sn", degisti: (v, son) => { a.sure = v; if (son !== false) degisti("sure", { oynat: null }); } }).el,
                    baslik("Sayfa geçişi"),
                    cipler(GECISLER, a.gecis, (v) => { a.gecis = v; degisti("gecis"); }),
                    baslik("Öğe animasyonu"),
                    cipler(ANIMLER, a.anim, (v) => { a.anim = v; degisti("anim"); })
                ]),
                baslik("Efektler"),
                anahtarSatiri("Kamera hareketi", "Yavaş yakınlaşma ve kayma", "kamera"),
                anahtarSatiri("Fiyat vurgusu", urunModu ? "Fiyat nabız gibi atar, halka yayılır" : "İndirimli fiyatlar nabız gibi atar, ışık geçer", "vurgu"),
                anahtarSatiri("Açılış kartı", "Logo ve market adıyla giriş", "acilis"),
                anahtarSatiri("Kapanış kartı", "Telefon, adres ve web adresi", "kapanis", (v) => { kapanisAlan.hidden = !v; }),
                kapanisAlan,
                baslik("Müzik"),
                muzikSatiri(),
                ...(urunModu ? [] : [baslik("Sayfalar"), h("div.alan-sira", kapsamCip, aralik)]));
        }
        // Ürün seçici: işaretlenen ürünler listedeki sırayla videoya girer
        function urunSecici() {
            const liste = urunListesi(), secim = urunSecimi();
            if (!liste.length) return h("p.ipucu-metin", { style: { margin: "0" } }, "Katalogda ürün yok. Soldaki Ürünler panelinden ürün ekleyin.");
            const say = h("span.video-urun-say");
            const sayYaz = () => { say.textContent = `${liste.filter((u) => secim.has(u.id)).length} / ${liste.length} seçili`; };
            const bildir = KS.gecikmeli(() => degisti("urunler"), 350);
            const satirlar = liste.map((u) => {
                const kutu = h("input", { type: "checkbox", checked: secim.has(u.id) });
                const url = u.gorsel && u.gorsel.varlik ? KS.varlik.url(u.gorsel.varlik) : null;
                const resim = url ? h("img", { src: url, alt: "" }) : h("span", (u.gorsel && u.gorsel.emoji) || "🛒");
                kutu.addEventListener("change", () => { if (kutu.checked) secim.add(u.id); else secim.delete(u.id); sayYaz(); bildir(); });
                const satir = h("label.video-urun", kutu, h("span.video-urun-resim", resim), h("span.video-urun-ad", u.ad || "Ürün"), h("b", u.fiyat > 0 ? KS.fiyatMetin(u.fiyat) : ""));
                satir._u = u; satir._kutu = kutu;
                return satir;
            });
            const kap = h("div.video-urun-liste", satirlar);
            const ara = h("input.girdi", { placeholder: "Ürün ara…", type: "search" });
            ara.addEventListener("keydown", (e) => e.stopPropagation());
            ara.addEventListener("input", () => { const q = KS.sade(ara.value); for (const s of satirlar) s.hidden = q && !KS.sade(s._u.ad).includes(q); });
            const hepsi = (v) => () => { for (const s of satirlar) if (!s.hidden) { s._kutu.checked = v; if (v) secim.add(s._u.id); else secim.delete(s._u.id); } sayYaz(); bildir(); };
            sayYaz();
            return h("div.video-urunler",
                h("div.video-urun-ust", liste.length > 6 ? ara : null, say,
                    h("button.dugme.kucuk.hayalet", { type: "button", onclick: hepsi(true) }, "Tümü"),
                    h("button.dugme.kucuk.hayalet", { type: "button", onclick: hepsi(false) }, "Hiçbiri")),
                kap);
        }

        // ── Dışa aktarma
        let anaDugme, paylasDugme, geriDugme;
        function sonucuGoster(s) {
            sonuc = s;
            sonuc.url = URL.createObjectURL(s.blob);
            sonuc.ad = KS.dosyaAdi(b.ad) + "." + s.uzanti;
            oynat(false);
            if (muzik) muzik.ses.pause();
            onizTuval.hidden = true; bilgi.hidden = true; kontrol.hidden = true; ortu.hidden = true;
            sonucVideo.hidden = false;
            sonucVideo.src = sonuc.url;
            sonucVideo.play().catch(() => {});
            ayarlarEl.classList.add("kilitli");
            anaDugme.replaceChildren(KS.ikon("indir", 17), "İndir");
            anaDugme.disabled = false;
            const dosya = new File([s.blob], sonuc.ad, { type: s.blob.type });
            paylasDugme.hidden = !(navigator.canShare && navigator.canShare({ files: [dosya] }));
            geriDugme.hidden = false;
            KS.bildir(`Video hazır · ${(s.blob.size / 1048576).toFixed(1)} MB`, { tur: "basari" });
            if (!KS.mobil()) KS.indir(s.blob, sonuc.ad);
        }
        function duzenlemeyeDon() {
            if (sonuc) { sonucVideo.pause(); sonucVideo.removeAttribute("src"); sonucVideo.load(); URL.revokeObjectURL(sonuc.url); }
            sonuc = null;
            sonucVideo.hidden = true; onizTuval.hidden = false; bilgi.hidden = false; kontrol.hidden = false;
            ayarlarEl.classList.remove("kilitli");
            anaDugme.replaceChildren(KS.ikon("video", 17), "Videoyu oluştur");
            paylasDugme.hidden = true; geriDugme.hidden = true;
            kirli = true;
            if (!hepsiHazir) hepsiniHazirla();
        }
        async function olustur() {
            if (sonuc) { KS.indir(sonuc.blob, sonuc.ad); return; }
            if (disaAktariliyor) return;
            oynat(false);
            disaAktariliyor = true; iptal = false;
            anaDugme.disabled = true;
            ayarlarEl.classList.add("kilitli");
            iptalDugme.textContent = "İptal";
            iptalDugme.hidden = false;
            let hataVar = false;
            ortuGoster("Video oluşturuluyor…", "Hazırlanıyor…", 0);
            let yuzde = 0, durumMetni = "";
            const guncelle = () => ortuGoster(`Video oluşturuluyor · %${yuzde}`, durumMetni, yuzde / 100);
            try {
                const s = await videoYap(Object.assign({}, a), sayfalarSec(), seciliUrunler(), muzik, {
                    ilerle: (o) => { const y = Math.floor(o * 100); if (y !== yuzde) { yuzde = y; guncelle(); } },
                    durum: (m) => { durumMetni = m; guncelle(); },
                    iptalMi: () => iptal || !acik
                });
                if (!acik) return;
                if (s) sonucuGoster(s);
                else { ortu.hidden = hepsiHazir; KS.bildir("Video oluşturma iptal edildi"); }
            } catch (hata) {
                console.error(hata);
                if (acik) ortuGoster("Video oluşturulamadı", hata.message || String(hata));
                hataVar = true;
            } finally {
                disaAktariliyor = false;
                // Hata mesajı "Tamam" ile kapatılıp önizlemeye dönülür
                iptalDugme.textContent = "Tamam";
                iptalDugme.hidden = !hataVar;
                if (acik) {
                    anaDugme.disabled = false;
                    if (!sonuc) { ayarlarEl.classList.remove("kilitli"); kirli = true; }
                }
            }
        }
        iptalDugme.addEventListener("click", () => {
            if (disaAktariliyor) { iptal = true; ortuGoster("İptal ediliyor…"); return; }
            iptalDugme.hidden = true;
            if (hepsiHazir && !bosPlan) ortu.hidden = true; else hepsiniHazirla();
            kirli = true;
        });

        const p = KS.ui.pencere({
            baslik: "Video katalog",
            aciklama: "Sayfalarınız animasyonlu, müzikli bir videoya dönüşür — Instagram, WhatsApp durumu ve mağaza ekranları için.",
            sinif: "genis video-pencere",
            icerik: h("div.video-duzen", sahneEl, ayarlarEl),
            dugmeler: [
                { etiket: "Paylaş", ikon: "paylas", sol: true, ref: (el) => { paylasDugme = el; el.hidden = true; }, fn: async () => {
                    try { await navigator.share({ files: [new File([sonuc.blob], sonuc.ad, { type: sonuc.blob.type })], title: b.ad }); }
                    catch (hata) { if (hata.name !== "AbortError") KS.bildir(hata.message, { tur: "hata" }); }
                    return false;
                } },
                { etiket: "Düzenlemeye dön", ref: (el) => { geriDugme = el; el.hidden = true; }, fn: () => { duzenlemeyeDon(); return false; } },
                { etiket: "Kapat" },
                { etiket: "Videoyu oluştur", birincil: true, ikon: "video", ref: (el) => { anaDugme = el; }, fn: () => { olustur(); return false; } }
            ],
            kapaninca: () => {
                acik = false;
                iptal = true;
                cancelAnimationFrame(raf);
                window.removeEventListener("resize", yeniden);
                if (muzik) { muzik.ses.pause(); URL.revokeObjectURL(muzik.url); }
                if (sonuc) URL.revokeObjectURL(sonuc.url);
                if (hzc) hzc.kapat();
                onizTuval.width = onizTuval.height = 0;
            }
        });

        oynatDugme.addEventListener("click", () => oynat(!oynuyor));
        onizTuval.addEventListener("click", () => oynat(!oynuyor));
        cizgi.addEventListener("input", () => git(cizgi.value / 1000 * plan.toplam));
        cizgi.addEventListener("keydown", (e) => e.stopPropagation());
        p.el.addEventListener("keydown", (e) => {
            const a2 = document.activeElement;
            if (e.key === " " && !(a2 && (a2.tagName === "INPUT" || a2.tagName === "TEXTAREA" || a2.tagName === "BUTTON"))) { e.preventDefault(); oynat(!oynuyor); }
        });
        const yeniden = KS.gecikmeli(yerlestir, 100);
        window.addEventListener("resize", yeniden);

        oynatIkonu();
        ayarlariCiz();
        // Pencere yerleştikten sonra ölç
        requestAnimationFrame(() => { kur({ hazirlik: true }); raf = requestAnimationFrame(dongu); });
    }

    // Tek kare (tam çözünürlük): kapak görseli ve denetim için
    async function kareResmi(ayarlar, t) {
        const a = Object.assign({}, ayar, ayarlar), b = E.belge, olcu = olcuHesapla(a, b);
        const plan = planla(a, b.sayfalar, seciliUrunler());
        const hedef = tuval(olcu.W, olcu.H), hzc = hazirlayici(olcu, olcu.k);
        try {
            const ss = plan.sahneler, k = sahneBul(plan, t);
            if (k > 0) await hzc.al(ss[k - 1]);
            await hzc.al(ss[k]);
            cizici(hedef, olcu, plan, hzc).kare(t);
            return hedef;
        } finally { hzc.kapat(); }
    }

    KS.video = { ac, planla, olcuHesapla, kareResmi };
})();
