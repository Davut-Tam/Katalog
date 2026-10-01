// Katalog Stüdyo — ortak yardımcılar: DOM üretici, olay yolu, sayı / renk / fiyat araçları, dosya işleri, bildirim.
// Tüm modüller window.KS altında toplanır. Düz betik (modül değil): index.html çift tıklanıp file:// ile açıldığında da çalışsın.
window.KS = window.KS || {};
(function () {
    "use strict";
    const KS = window.KS;
    const SVGNS = "http://www.w3.org/2000/svg";
    KS.SVGNS = SVGNS;

    // ── Kimlik ve sayılar ───────────────────────────────────────
    let sayac = 0;
    KS.kimlik = (onek = "o") =>
        onek + Date.now().toString(36).slice(-6) + (sayac++).toString(36) + Math.random().toString(36).slice(2, 6);
    KS.sinirla = (d, a, b) => Math.min(b, Math.max(a, d));
    KS.yuvarla = (d, basamak = 2) => { const k = 10 ** basamak; return Math.round(d * k) / k; };
    KS.kopya = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
    KS.esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);

    // ── DOM üretici ─────────────────────────────────────────────
    // h("button.dugme.birincil", { onclick, title }, "Metin", altEleman)
    // Seçicide "svg:" öneki SVG ad alanında üretir: h("svg:path", { d: "..." }).
    function ekle(el, cocuklar) {
        for (const c of cocuklar) {
            if (c == null || c === false || c === true) continue;
            if (Array.isArray(c)) ekle(el, c);
            else el.append(c instanceof Node ? c : String(c));
        }
    }
    KS.h = function h(secici, ozellik, ...cocuklar) {
        if (ozellik == null || typeof ozellik !== "object" || ozellik instanceof Node || Array.isArray(ozellik)) {
            if (ozellik != null) cocuklar.unshift(ozellik);
            ozellik = {};
        }
        // "etiket#kimlik.sinif1.sinif2" (kimlik ve sınıflar herhangi bir sırada olabilir)
        let kimlik = null;
        secici = secici.replace(/#([\w-]+)/, (_, k) => { kimlik = k; return ""; });
        const parcalar = secici.split(".");
        let etiket = parcalar.shift() || "div";
        let el;
        if (etiket.startsWith("svg:")) el = document.createElementNS(SVGNS, etiket.slice(4));
        else el = document.createElement(etiket);
        if (kimlik) el.id = kimlik;
        if (parcalar.length) el.setAttribute("class", parcalar.join(" "));
        for (const a in ozellik) {
            const d = ozellik[a];
            if (d == null || d === false) continue;
            if (a.startsWith("on") && typeof d === "function") el.addEventListener(a.slice(2).toLowerCase(), d);
            else if (a === "style" && typeof d === "object") {
                for (const k in d) if (d[k] != null) {
                    if (k.startsWith("--")) el.style.setProperty(k, d[k]); else el.style[k] = d[k];
                }
            }
            else if (a === "class") el.setAttribute("class", ((el.getAttribute("class") || "") + " " + d).trim());
            else if (a === "dataset") Object.assign(el.dataset, d);
            else if (a === "html") el.innerHTML = d;
            else if (a === "metin") el.textContent = d;
            else if (!(el instanceof SVGElement) && (a === "value" || a === "checked" || a === "selected" || a === "disabled" || a === "hidden")) el[a] = d;
            else el.setAttribute(a, d === true ? "" : d);
        }
        ekle(el, cocuklar);
        return el;
    };
    KS.$ = (s, kok = document) => kok.querySelector(s);
    KS.$$ = (s, kok = document) => [...kok.querySelectorAll(s)];
    KS.bosalt = (el) => { while (el.firstChild) el.firstChild.remove(); return el; };

    // ── Olay yolu ───────────────────────────────────────────────
    const dinleyiciler = new Map();
    KS.olay = {
        on(ad, fn) { if (!dinleyiciler.has(ad)) dinleyiciler.set(ad, new Set()); dinleyiciler.get(ad).add(fn); return () => this.off(ad, fn); },
        off(ad, fn) { dinleyiciler.get(ad)?.delete(fn); },
        yay(ad, ...arg) { for (const fn of [...(dinleyiciler.get(ad) || [])]) { try { fn(...arg); } catch (h) { console.error(ad, h); } } }
    };

    // ── Zamanlama ───────────────────────────────────────────────
    KS.gecikmeli = (fn, ms) => {
        let t = 0;
        const g = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
        g.hemen = (...a) => { clearTimeout(t); fn(...a); };
        g.iptal = () => clearTimeout(t);
        return g;
    };
    KS.kareBasi = (fn) => {
        let bekliyor = false, son;
        return (...a) => { son = a; if (!bekliyor) { bekliyor = true; requestAnimationFrame(() => { bekliyor = false; fn(...son); }); } };
    };
    KS.bekle = (ms) => new Promise((r) => setTimeout(r, ms));

    // ── Metin ───────────────────────────────────────────────────
    // "IŞIK" ile "ışık", "cay" ile "çay" eşleşsin diye arama için sadeleştirme.
    KS.sade = (metin) => (metin || "").toLocaleLowerCase("tr-TR").normalize("NFD")
        .replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
    KS.kacis = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

    // ── Fiyat ───────────────────────────────────────────────────
    // 1249.9 → { tam: "1.249", kurus: "90", metin: "1.249,90" }
    KS.fiyatParca = (f) => {
        const s = (Math.round((Number(f) || 0) * 100) / 100).toFixed(2);
        const [t, k] = s.split(".");
        const tam = Number(t).toLocaleString("tr-TR");
        return { tam, kurus: k, metin: tam + "," + k };
    };
    KS.fiyatMetin = (f, para = "₺") => {
        const p = KS.fiyatParca(f);
        return para === "TL" ? p.metin + " TL" : para ? p.metin + " " + para : p.metin;
    };
    // "49,90" / "49.90" / "1.249,90" / "₺ 49" → sayı
    KS.fiyatOku = (s) => {
        if (typeof s === "number") return s;
        let t = String(s || "").replace(/[^\d.,-]/g, "");
        if (!t) return 0;
        const sonVirgul = t.lastIndexOf(","), sonNokta = t.lastIndexOf(".");
        if (sonVirgul > sonNokta) t = t.replace(/\./g, "").replace(",", ".");
        else if (sonNokta > sonVirgul && sonVirgul >= 0) t = t.replace(/,/g, "");
        else if (sonNokta >= 0 && t.length - sonNokta - 1 === 3 && t.split(".").length > 1 && sonVirgul < 0) t = t.replace(/\./g, "");
        const n = parseFloat(t);
        return Number.isFinite(n) ? n : 0;
    };
    KS.indirimYuzde = (fiyat, eski) => (eski > fiyat && fiyat > 0 ? Math.round((1 - fiyat / eski) * 100) : 0);

    // ── Renk ────────────────────────────────────────────────────
    const renkKutu = document.createElement("canvas").getContext("2d");
    KS.renkCoz = (renk) => {
        // Her CSS rengi → {r,g,b,a}
        if (!renk || renk === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
        let m = /^#([0-9a-f]{3,8})$/i.exec(renk.trim());
        if (m) {
            let x = m[1];
            if (x.length === 3 || x.length === 4) x = x.split("").map((c) => c + c).join("");
            return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16), a: x.length === 8 ? parseInt(x.slice(6, 8), 16) / 255 : 1 };
        }
        m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(renk.trim());
        if (m) {
            let a = m[4] == null ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
            return { r: +m[1], g: +m[2], b: +m[3], a };
        }
        renkKutu.fillStyle = "#000"; renkKutu.fillStyle = renk;
        const s = renkKutu.fillStyle;
        return s.startsWith("#") ? KS.renkCoz(s) : KS.renkCoz(s.replace(/^rgba/, "rgba"));
    };
    const iki = (n) => Math.round(KS.sinirla(n, 0, 255)).toString(16).padStart(2, "0");
    KS.renkHex = ({ r, g, b, a = 1 }) => "#" + iki(r) + iki(g) + iki(b) + (a < 1 ? iki(a * 255) : "");
    KS.renkNormal = (renk) => KS.renkHex(KS.renkCoz(renk));
    KS.rgbHsv = ({ r, g, b }) => {
        r /= 255; g /= 255; b /= 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        let hh = 0;
        if (d) {
            if (mx === r) hh = ((g - b) / d) % 6; else if (mx === g) hh = (b - r) / d + 2; else hh = (r - g) / d + 4;
            hh *= 60; if (hh < 0) hh += 360;
        }
        return { h: hh, s: mx ? d / mx : 0, v: mx };
    };
    KS.hsvRgb = ({ h: hh, s, v }) => {
        const f = (n) => { const k = (n + hh / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
        return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255 };
    };
    KS.parlaklik = (renk) => { const { r, g, b } = KS.renkCoz(renk); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
    KS.renkKarart = (renk, oran) => {
        const c = KS.renkCoz(renk);
        const k = (n) => (oran >= 0 ? n * (1 - oran) : n + (255 - n) * -oran);
        return KS.renkHex({ r: k(c.r), g: k(c.g), b: k(c.b), a: c.a });
    };

    // Dolgu: düz renk (dize) ya da { tip: "dogrusal" | "dairesel" | "isin", ... } nesnesi.
    KS.dolguCss = (d) => {
        if (!d) return "transparent";
        if (typeof d === "string") return d;
        if (d.tip === "isin") {
            const n = Math.max(4, d.sayi || 24), a = 360 / n / 2;
            return `repeating-conic-gradient(from ${d.aci || 0}deg at ${d.x ?? 50}% ${d.y ?? 50}%, ${d.renk1} 0deg ${a}deg, ${d.renk2} ${a}deg ${a * 2}deg)`;
        }
        const duraklar = (d.duraklar || []).slice().sort((a, b) => a.k - b.k).map((s) => `${s.r} ${s.k}%`).join(", ");
        if (d.tip === "dairesel") return `radial-gradient(circle at ${d.x ?? 50}% ${d.y ?? 50}%, ${duraklar})`;
        return `linear-gradient(${d.aci ?? 180}deg, ${duraklar})`;
    };
    // Gradyanın temsilî tek rengi (SVG'ye ya da yalnız düz renk kabul eden yerlere)
    KS.dolguRenk = (d) => {
        if (!d) return "transparent";
        if (typeof d === "string") return d;
        if (d.tip === "isin") return d.renk1;
        return d.duraklar?.[0]?.r || "#000000";
    };
    KS.dolguRenkleri = (d) => {
        if (!d) return [];
        if (typeof d === "string") return [d];
        if (d.tip === "isin") return [d.renk1, d.renk2];
        return (d.duraklar || []).map((s) => s.r);
    };

    // ── Dosya ve resim ──────────────────────────────────────────
    KS.dataUrlOku = (blob) => new Promise((coz, red) => {
        const f = new FileReader();
        f.onload = () => coz(f.result);
        f.onerror = () => red(f.error);
        f.readAsDataURL(blob);
    });
    KS.metinOku = (blob) => new Promise((coz, red) => {
        const f = new FileReader();
        f.onload = () => coz(f.result);
        f.onerror = () => red(f.error);
        f.readAsText(blob);
    });
    KS.resimYukle = (src) => new Promise((coz, red) => {
        const r = new Image();
        r.decoding = "async";
        r.onload = () => coz(r);
        r.onerror = () => red(new Error("Resim açılamadı"));
        r.src = src;
    });
    KS.dataUrlBlob = async (url) => (await fetch(url)).blob();

    // Yüklenen fotoğrafı makul boyuta indirir (baskı için uzun kenar en çok 2400 px).
    // Saydamlık varsa WebP (alfa korunur), yoksa JPEG benzeri kalite için yine WebP kullanılır.
    KS.resmiHazirla = async (dosya, uzunKenar = 2400) => {
        const url = URL.createObjectURL(dosya);
        try {
            const r = await KS.resimYukle(url);
            let g = r.naturalWidth, y = r.naturalHeight;
            if (dosya.type === "image/svg+xml" && (!g || !y)) { g = 1000; y = 1000; }
            const o = Math.min(1, uzunKenar / Math.max(g, y));
            const cg = Math.max(1, Math.round(g * o)), cy = Math.max(1, Math.round(y * o));
            if (o === 1 && dosya.size < 1.5e6 && /^image\/(png|jpeg|webp|gif)$/.test(dosya.type)) {
                return { blob: dosya, g: cg, y: cy };
            }
            const c = document.createElement("canvas");
            c.width = cg; c.height = cy;
            const ctx = c.getContext("2d");
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(r, 0, 0, cg, cy);
            const blob = await new Promise((coz) => c.toBlob(coz, "image/webp", 0.92));
            return { blob: blob || dosya, g: cg, y: cy };
        } finally {
            URL.revokeObjectURL(url);
        }
    };

    // Beyaz (ya da verilen renge yakın) arka planı kenarlardan başlayarak saydam yapar.
    // Taşma dolgusu (flood fill) kullanır: ürünün içindeki beyaz alanlar korunur.
    KS.arkaPlanTemizle = async (src, esik = 30) => {
        const r = await KS.resimYukle(src);
        const g = r.naturalWidth, y = r.naturalHeight;
        const c = document.createElement("canvas");
        c.width = g; c.height = y;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(r, 0, 0);
        const veri = ctx.getImageData(0, 0, g, y);
        const p = veri.data;
        // Referans renk: dört köşenin ortalaması
        const kose = [[0, 0], [g - 1, 0], [0, y - 1], [g - 1, y - 1]].map(([x, yy]) => (yy * g + x) * 4);
        const ref = [0, 1, 2].map((i) => kose.reduce((t, k) => t + p[k + i], 0) / 4);
        const esik2 = esik * esik * 3;
        const uzak = (i) => { const dr = p[i] - ref[0], dg = p[i + 1] - ref[1], db = p[i + 2] - ref[2]; return dr * dr + dg * dg + db * db; };
        const goruldu = new Uint8Array(g * y);
        const yigin = [];
        for (let x = 0; x < g; x++) { yigin.push(x, (y - 1) * g + x); }
        for (let yy = 0; yy < y; yy++) { yigin.push(yy * g, yy * g + g - 1); }
        while (yigin.length) {
            const n = yigin.pop();
            if (goruldu[n]) continue;
            goruldu[n] = 1;
            const i = n * 4;
            if (p[i + 3] === 0 || uzak(i) <= esik2) {
                p[i + 3] = 0;
                const x = n % g;
                if (x > 0) yigin.push(n - 1);
                if (x < g - 1) yigin.push(n + 1);
                if (n >= g) yigin.push(n - g);
                if (n < g * (y - 1)) yigin.push(n + g);
            }
        }
        // Kenar yumuşatma: saydam komşusu olan pikselleri yarı saydam yap
        const alfa = new Uint8ClampedArray(g * y);
        for (let n = 0; n < g * y; n++) alfa[n] = p[n * 4 + 3];
        for (let yy = 1; yy < y - 1; yy++) for (let x = 1; x < g - 1; x++) {
            const n = yy * g + x;
            if (!alfa[n]) continue;
            const bos = (!alfa[n - 1]) + (!alfa[n + 1]) + (!alfa[n - g]) + (!alfa[n + g]);
            if (bos) p[n * 4 + 3] = Math.round(alfa[n] * (1 - bos * 0.2));
        }
        ctx.putImageData(veri, 0, 0);
        const blob = await new Promise((coz) => c.toBlob(coz, "image/webp", 0.95));
        return { blob, g, y };
    };

    KS.indir = (veri, ad) => {
        const url = typeof veri === "string" ? veri : URL.createObjectURL(veri);
        const a = KS.h("a", { href: url, download: ad });
        document.body.append(a);
        a.click();
        a.remove();
        if (typeof veri !== "string") setTimeout(() => URL.revokeObjectURL(url), 30000);
    };
    KS.dosyaSec = ({ kabul = "", coklu = false } = {}) => new Promise((coz) => {
        const g = KS.h("input", { type: "file", accept: kabul, multiple: coklu, style: { display: "none" } });
        g.addEventListener("change", () => { coz([...g.files]); g.remove(); });
        document.body.append(g);
        g.click();
    });
    KS.dosyaAdi = (ad) => (ad || "katalog").replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 60) || "katalog";

    // Harici kütüphaneleri ihtiyaç anında yükler (PDF, ZIP, Excel, QR).
    const betikler = new Map();
    KS.betikYukle = (url) => {
        if (!betikler.has(url)) {
            betikler.set(url, new Promise((coz, red) => {
                const s = KS.h("script", { src: url, crossorigin: "anonymous" });
                s.onload = () => coz();
                s.onerror = () => { betikler.delete(url); red(new Error("Kütüphane yüklenemedi (internet bağlantısını kontrol edin)")); };
                document.head.append(s);
            }));
        }
        return betikler.get(url);
    };
    KS.KUTUPHANE = {
        pdf: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        qr: "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js",
        zip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
        excel: "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
    };

    // ── Bildirim (toast) ────────────────────────────────────────
    KS.bildir = (mesaj, { tur = "bilgi", sure = 2600, eylem } = {}) => {
        let kap = document.getElementById("bildirimler");
        if (!kap) { kap = KS.h("div.bildirimler#bildirimler", { role: "status", "aria-live": "polite" }); document.body.append(kap); }
        const b = KS.h("div.bildirim." + tur, KS.h("span", mesaj));
        if (eylem) b.append(KS.h("button.bildirim-eylem", { type: "button", onclick: () => { eylem.fn(); kapat(); } }, eylem.metin));
        kap.append(b);
        requestAnimationFrame(() => b.classList.add("gorunur"));
        let t = setTimeout(kapat, sure);
        b.addEventListener("pointerenter", () => clearTimeout(t));
        b.addEventListener("pointerleave", () => { t = setTimeout(kapat, 1200); });
        function kapat() { b.classList.remove("gorunur"); setTimeout(() => b.remove(), 250); }
        // Uzun işlerde ilerleme yazısını güncellemek için: const b = KS.bildir("…"); b.metin("12 / 40")
        kapat.metin = (yeni) => { b.firstChild.textContent = yeni; };
        return kapat;
    };

    // ── Geometri ────────────────────────────────────────────────
    const RAD = Math.PI / 180;
    KS.RAD = RAD;
    // Döndürülmüş kutunun dört köşesi (sayfa koordinatında)
    KS.koseler = (o) => {
        const cx = o.x + o.w / 2, cy = o.y + o.h / 2, a = (o.aci || 0) * RAD, c = Math.cos(a), s = Math.sin(a);
        return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([ix, iy]) => {
            const lx = ix * o.w / 2, ly = iy * o.h / 2;
            return { x: cx + lx * c - ly * s, y: cy + lx * s + ly * c };
        });
    };
    KS.kutu = (o) => {
        if (!o.aci) return { x: o.x, y: o.y, w: o.w, h: o.h };
        const k = KS.koseler(o);
        const xs = k.map((p) => p.x), ys = k.map((p) => p.y);
        const x = Math.min(...xs), y = Math.min(...ys);
        return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    };
    KS.kutuBirlesim = (kutular) => {
        if (!kutular.length) return null;
        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        for (const b of kutular) { x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.w); y2 = Math.max(y2, b.y + b.h); }
        return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    };
    KS.kesisir = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    KS.dondur = (px, py, cx, cy, aciDer) => {
        const a = aciDer * RAD, c = Math.cos(a), s = Math.sin(a), dx = px - cx, dy = py - cy;
        return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
    };
    KS.aciNormal = (a) => { a = ((a % 360) + 360) % 360; return a > 180 ? a - 360 : a; };

    // Telefon düzeni: alt gezinme çubuğu, alttan açılan paneller (CSS'teki 760 px sınırıyla aynı)
    const mobilSorgu = matchMedia("(max-width: 760px)");
    KS.mobil = () => mobilSorgu.matches;
    mobilSorgu.addEventListener("change", () => KS.olay.yay("mobil", mobilSorgu.matches));

    // Alttan açılan sayfanın tutamağı: dokununca ya da aşağı sürükleyince kapatır
    KS.altSayfaTutamak = (sayfaEl, kapat) => {
        const t = KS.h("div.sayfa-tutamak", { role: "button", "aria-label": "Kapat", title: "Kapat" }, KS.h("span"));
        t.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            t.setPointerCapture(e.pointerId);
            const y0 = e.clientY, t0 = Date.now();
            let dy = 0;
            sayfaEl.style.transition = "none";
            const hareket = (ev) => { dy = Math.max(0, ev.clientY - y0); sayfaEl.style.transform = `translateY(${dy}px)`; };
            const bitir = () => {
                t.removeEventListener("pointermove", hareket);
                sayfaEl.style.transition = "";
                sayfaEl.style.transform = "";
                if (dy > 70 || (dy < 6 && Date.now() - t0 < 400)) kapat();
            };
            t.addEventListener("pointermove", hareket);
            t.addEventListener("pointerup", bitir, { once: true });
            t.addEventListener("pointercancel", bitir, { once: true });
        });
        return t;
    };

    // Platforma göre kısayol yazımı
    KS.MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    KS.kisayol = (s) => (KS.MAC ? s.replace(/Ctrl\+/g, "⌘").replace(/Shift\+/g, "⇧").replace(/Alt\+/g, "⌥") : s);
})();
