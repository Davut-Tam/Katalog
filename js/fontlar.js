// Yazı tipleri: Türkçe karakterleri (ğ ş ı İ) destekleyen Google Fonts seçkisi, ihtiyaç anında yükleme
// ve dışa aktarım için yalnız kullanılan harf kümelerini içeren gömülü @font-face üretimi.
(function () {
    "use strict";
    const KS = window.KS;

    // [ad, tür, ağırlıklar]  — ağırlık listeleri Google Fonts'ta gerçekten bulunanlardır (yanlışı isteği bozar).
    const LISTE = [
        ["Inter", "duz", [400, 500, 600, 700, 800, 900]],
        ["Poppins", "duz", [300, 400, 500, 600, 700, 800, 900]],
        ["Montserrat", "duz", [400, 500, 600, 700, 800, 900]],
        ["Roboto", "duz", [400, 500, 700, 900]],
        ["Open Sans", "duz", [400, 600, 700, 800]],
        ["Nunito", "duz", [400, 600, 700, 800, 900]],
        ["Rubik", "duz", [400, 500, 600, 700, 800, 900]],
        ["Work Sans", "duz", [400, 500, 600, 700, 800, 900]],
        ["Raleway", "duz", [400, 500, 600, 700, 800, 900]],
        ["Barlow", "duz", [400, 500, 600, 700, 800, 900]],
        ["Outfit", "duz", [400, 500, 600, 700, 800, 900]],
        ["Plus Jakarta Sans", "duz", [400, 500, 600, 700, 800]],
        ["Manrope", "duz", [400, 500, 600, 700, 800]],
        ["DM Sans", "duz", [400, 500, 600, 700, 800, 900]],
        ["Figtree", "duz", [400, 600, 700, 800, 900]],
        ["Lexend", "duz", [400, 600, 700, 800, 900]],
        ["Sora", "duz", [400, 600, 700, 800]],
        ["Space Grotesk", "duz", [400, 500, 600, 700]],
        ["Kanit", "duz", [400, 500, 600, 700, 800, 900]],
        ["Exo 2", "duz", [400, 600, 700, 800, 900]],
        ["Archivo", "duz", [400, 600, 700, 800, 900]],
        ["Bricolage Grotesque", "duz", [400, 600, 700, 800]],
        ["Quicksand", "duz", [400, 500, 600, 700]],
        ["Comfortaa", "duz", [400, 600, 700]],
        ["Varela Round", "duz", [400]],
        ["Josefin Sans", "duz", [400, 600, 700]],
        ["Ubuntu", "duz", [400, 500, 700]],

        ["Anton", "dar", [400]],
        ["Bebas Neue", "dar", [400]],
        ["Oswald", "dar", [400, 500, 600, 700]],
        ["Barlow Condensed", "dar", [400, 500, 600, 700, 800, 900]],
        ["Roboto Condensed", "dar", [400, 700, 900]],
        ["Saira Condensed", "dar", [400, 600, 700, 800, 900]],
        ["Archivo Narrow", "dar", [400, 600, 700]],
        ["Fjalla One", "dar", [400]],
        ["Teko", "dar", [400, 500, 600, 700]],
        ["League Gothic", "dar", [400]],
        ["Antonio", "dar", [400, 700]],
        ["Big Shoulders Display", "dar", [400, 700, 900]],

        ["Archivo Black", "gosteris", [400]],
        ["Titan One", "gosteris", [400]],
        ["Lilita One", "gosteris", [400]],
        ["Luckiest Guy", "gosteris", [400]],
        ["Bangers", "gosteris", [400]],
        ["Alfa Slab One", "gosteris", [400]],
        ["Paytone One", "gosteris", [400]],
        ["Russo One", "gosteris", [400]],
        ["Righteous", "gosteris", [400]],
        ["Bungee", "gosteris", [400]],
        ["Chango", "gosteris", [400]],
        ["Shrikhand", "gosteris", [400]],
        ["Passion One", "gosteris", [400, 700, 900]],
        ["Black Ops One", "gosteris", [400]],
        ["Rowdies", "gosteris", [400, 700]],
        ["Fredoka", "gosteris", [400, 500, 600, 700]],
        ["Baloo 2", "gosteris", [400, 600, 700, 800]],
        ["Rubik Mono One", "gosteris", [400]],
        ["Sniglet", "gosteris", [400, 800]],
        ["Dela Gothic One", "gosteris", [400]],
        ["Rammetto One", "gosteris", [400]],
        ["Ultra", "gosteris", [400]],
        ["Knewave", "gosteris", [400]],
        ["Coiny", "gosteris", [400]],
        ["Bagel Fat One", "gosteris", [400]],
        ["Abril Fatface", "gosteris", [400]],

        ["Playfair Display", "serif", [400, 600, 700, 800, 900]],
        ["DM Serif Display", "serif", [400]],
        ["Yeseva One", "serif", [400]],
        ["Merriweather", "serif", [400, 700, 900]],
        ["Lora", "serif", [400, 600, 700]],
        ["Roboto Slab", "serif", [400, 600, 700, 800, 900]],
        ["Bitter", "serif", [400, 600, 700, 800, 900]],
        ["Zilla Slab", "serif", [400, 600, 700]],
        ["Cormorant Garamond", "serif", [400, 600, 700]],
        ["Libre Baskerville", "serif", [400, 700]],
        ["Crimson Pro", "serif", [400, 600, 700]],
        ["Noto Serif", "serif", [400, 700]],

        ["Lobster", "el", [400]],
        ["Pacifico", "el", [400]],
        ["Dancing Script", "el", [400, 600, 700]],
        ["Caveat", "el", [400, 600, 700]],
        ["Kaushan Script", "el", [400]],
        ["Courgette", "el", [400]],
        ["Great Vibes", "el", [400]],
        ["Sacramento", "el", [400]],
        ["Allura", "el", [400]],
        ["Parisienne", "el", [400]],
        ["Marck Script", "el", [400]],
        ["Playball", "el", [400]],
        ["Damion", "el", [400]],
        ["Yellowtail", "el", [400]],
        ["Grand Hotel", "el", [400]],
        ["Norican", "el", [400]],
        ["Merienda", "el", [400, 700]],
        ["Patrick Hand", "el", [400]],
        ["Kalam", "el", [400, 700]],
        ["Amatic SC", "el", [400, 700]]
    ];

    const TURLER = { duz: "Düz", dar: "Dar", gosteris: "Gösterişli", serif: "Tırnaklı", el: "El yazısı" };
    const EMOJI = "Noto Color Emoji";

    const fontlar = LISTE.map(([ad, tur, w]) => ({ ad, tur, w }));
    const harita = new Map(fontlar.map((f) => [f.ad, f]));

    const cssUrl = (f) => {
        const aile = encodeURIComponent(f.ad).replace(/%20/g, "+");
        const agirlik = f.w.length === 1 && f.w[0] === 400 ? "" : ":wght@" + f.w.join(";");
        return `https://fonts.googleapis.com/css2?family=${aile}${agirlik}&display=swap`;
    };

    const yuklenen = new Map();
    function yukle(ad) {
        if (!ad) return Promise.resolve(false);
        if (yuklenen.has(ad)) return yuklenen.get(ad);
        const f = ad === EMOJI ? { ad: EMOJI, w: [400] } : harita.get(ad);
        if (!f) { yuklenen.set(ad, Promise.resolve(false)); return yuklenen.get(ad); }
        const p = new Promise((coz) => {
            const l = KS.h("link", { rel: "stylesheet", href: cssUrl(f) });
            l.onload = () => coz(true);
            l.onerror = () => coz(false);
            document.head.append(l);
        });
        yuklenen.set(ad, p);
        return p;
    }

    // Font dosyasının kendisini (belirli ağırlık ve harflerle) indirmeyi bekler.
    async function hazir(ad, agirlik = 400, ornek = "AaĞğŞşİı") {
        await yukle(ad);
        try { await document.fonts.load(`${agirlik} 24px "${ad}"`, ornek); } catch (h) { /* çevrimdışı */ }
    }

    // ── Dışa aktarım için gömülü font CSS'i ──────────────────────
    const cssOnbellek = new Map();
    const dosyaOnbellek = new Map();
    async function cssMetni(url) {
        if (!cssOnbellek.has(url)) cssOnbellek.set(url, fetch(url).then((r) => (r.ok ? r.text() : "")).catch(() => ""));
        return cssOnbellek.get(url);
    }
    async function dosyaDataUrl(url) {
        if (!dosyaOnbellek.has(url)) {
            dosyaOnbellek.set(url, fetch(url).then((r) => r.blob()).then(KS.dataUrlOku).catch(() => null));
        }
        return dosyaOnbellek.get(url);
    }
    function aralikIcinde(blok, kodlar) {
        const m = /unicode-range:\s*([^;]+);/.exec(blok);
        if (!m) return true;
        const araliklar = m[1].split(",").map((r) => {
            r = r.trim().replace(/^U\+/i, "");
            if (r.includes("?")) return [parseInt(r.replace(/\?/g, "0"), 16), parseInt(r.replace(/\?/g, "F"), 16)];
            const [a, z] = r.includes("-") ? r.split("-") : [r, r];
            return [parseInt(a, 16), parseInt(z, 16)];
        });
        for (const k of kodlar) for (const [a, z] of araliklar) if (k >= a && k <= z) return true;
        return false;
    }
    // kullanim: Map<aile, Set<ağırlık>>, metin: sayfadaki tüm yazılar
    async function gomuluCss(kullanim, metin) {
        const kodlar = new Set();
        for (const ch of metin + "0123456789,.₺%") kodlar.add(ch.codePointAt(0));
        let css = "";
        for (const [aile, agirliklar] of kullanim) {
            const f = aile === EMOJI ? { ad: EMOJI, w: [400] } : harita.get(aile);
            if (!f) continue;
            const kaynak = await cssMetni(cssUrl(f));
            const bloklar = kaynak.match(/@font-face\s*{[^}]*}/g) || [];
            // Her kullanılan ağırlık için en yakın mevcut ağırlık
            const mevcut = f.w;
            const gerekli = new Set([...agirliklar].map((a) => mevcut.reduce((en, m) => (Math.abs(m - a) < Math.abs(en - a) ? m : en), mevcut[0])));
            for (const b of bloklar) {
                const w = +(/font-weight:\s*(\d+)/.exec(b)?.[1] || 400);
                if (aile !== EMOJI && !gerekli.has(w)) continue;
                if (!aralikIcinde(b, kodlar)) continue;
                const u = /url\((https:[^)]+)\)/.exec(b)?.[1];
                if (!u) continue;
                const d = await dosyaDataUrl(u);
                if (d) css += b.replace(u, d) + "\n";
            }
        }
        return css;
    }

    KS.fontlar = { liste: fontlar, TURLER, EMOJI, bul: (ad) => harita.get(ad), yukle, hazir, gomuluCss, cssUrl };
})();
