// Arayüz bileşenleri: açılır pencere (popover), menü, iletişim penceresi, sayı / kaydırıcı / renk / font denetimleri.
// Her denetim { el, yenile(deger) } döndürür: panel dışarıdan (ör. sürükleyerek) değişen değeri odağı bozmadan günceller.
(function () {
    "use strict";
    const KS = window.KS;
    const { h } = KS;

    // ── Açılır pencere ──────────────────────────────────────────
    let acik = null;
    function konumla(el, capa, yer = "alt", hiza = "bas") {
        const r = capa instanceof Element ? capa.getBoundingClientRect()
            : { left: capa.x, top: capa.y, right: capa.x, bottom: capa.y, width: 0, height: 0 };
        const ew = el.offsetWidth, eh = el.offsetHeight, vw = innerWidth, vh = innerHeight, b = 6;
        let x, y;
        if (yer === "sol" || yer === "sag") {
            x = yer === "sol" ? r.left - ew - b : r.right + b;
            if (yer === "sol" && x < 8) x = r.right + b;
            if (yer === "sag" && x + ew > vw - 8) x = r.left - ew - b;
            y = r.top - 8;
        } else {
            y = yer === "ust" ? r.top - eh - b : r.bottom + b;
            if (yer !== "ust" && y + eh > vh - 8 && r.top - eh - b > 8) y = r.top - eh - b;
            if (yer === "ust" && y < 8) y = r.bottom + b;
            x = hiza === "son" ? r.right - ew : hiza === "orta" ? r.left + r.width / 2 - ew / 2 : r.left;
        }
        el.style.left = Math.round(KS.sinirla(x, 8, Math.max(8, vw - ew - 8))) + "px";
        el.style.top = Math.round(KS.sinirla(y, 8, Math.max(8, vh - eh - 8))) + "px";
    }
    function acilir(icerik, capa, { yer, hiza, sinif, kapaninca } = {}) {
        kapat();
        // Telefonda açılır pencereler ekranın altından, tam genişlikte açılır (perdeyle)
        const mobil = KS.mobil();
        const el = h("div.acilir" + (sinif ? "." + sinif : "") + (mobil ? ".alt-sayfa" : ""), icerik);
        const kap = (capa instanceof Element && capa.closest("dialog[open]")) || document.body;
        const perde = mobil ? h("div.acilir-perde") : null;
        if (perde) kap.append(perde);
        kap.append(el);
        if (!mobil) konumla(el, capa, yer, hiza);
        const disTik = (e) => {
            if (el.contains(e.target)) return;
            if (capa instanceof Element && capa.contains(e.target)) { e.stopPropagation(); e.preventDefault(); kapat(); return; }
            kapat();
        };
        const tus = (e) => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); kapat(); } };
        const t = setTimeout(() => document.addEventListener("pointerdown", disTik, true), 0);
        document.addEventListener("keydown", tus, true);
        if (capa instanceof Element) capa.setAttribute("aria-expanded", "true");
        const kayit = {
            el,
            yenidenKonumla: () => { if (!mobil) konumla(el, capa, yer, hiza); },
            kapat() {
                clearTimeout(t);
                el.remove();
                if (perde) perde.remove();
                document.removeEventListener("pointerdown", disTik, true);
                document.removeEventListener("keydown", tus, true);
                if (capa instanceof Element) capa.setAttribute("aria-expanded", "false");
                if (kapaninca) kapaninca();
            }
        };
        acik = kayit;
        return kayit;
    }
    function kapat() { if (acik) { const a = acik; acik = null; a.kapat(); } }

    function menu(ogeler, capa, secenek = {}) {
        const kap = h("div.menu", { role: "menu" });
        for (const o of ogeler) {
            if (!o) continue;
            if (o === "-") { kap.append(h("div.menu-ayrac")); continue; }
            if (o.baslik) { kap.append(h("div.menu-baslik", o.baslik)); continue; }
            kap.append(h("button.menu-oge" + (o.tehlike ? ".tehlike" : ""), {
                type: "button", role: "menuitem", disabled: !!o.pasif,
                onclick: () => { kapat(); o.fn(); }
            }, o.ikon ? KS.ikon(o.ikon, 17) : h("span", { style: { width: "17px", flex: "none" } }), h("span.etiket", o.etiket),
            o.kisayol ? h("kbd", KS.kisayol(o.kisayol)) : null));
        }
        const a = acilir(kap, capa, secenek);
        const ilk = kap.querySelector(".menu-oge:not([disabled])");
        if (ilk && secenek.odak !== false) ilk.focus({ preventScroll: true });
        kap.addEventListener("keydown", (e) => {
            if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
            e.preventDefault();
            const liste = [...kap.querySelectorAll(".menu-oge:not([disabled])")];
            const i = liste.indexOf(document.activeElement);
            liste[(i + (e.key === "ArrowDown" ? 1 : -1) + liste.length) % liste.length]?.focus();
        });
        return a;
    }

    // ── İletişim penceresi ──────────────────────────────────────
    function pencere({ baslik, aciklama, icerik, dugmeler = [], sinif = "", kapaninca, ilkOdak }) {
        const d = h("dialog.pencere" + (sinif ? "." + sinif.split(" ").join(".") : ""));
        const kapatF = (deger = "") => { if (d.open) d.close(deger); };
        d.append(
            h("div.pencere-kafa", h("div", h("h2", baslik), aciklama ? h("p", aciklama) : null),
                h("button.ikon-dugme", { type: "button", "aria-label": "Kapat", onclick: () => kapatF() }, KS.ikon("kapat"))),
            h("div.pencere-govde", icerik)
        );
        if (dugmeler.length) {
            d.append(h("div.pencere-alt", dugmeler.map((b) => {
                if (!b) return null;
                const el = h("button.dugme" + (b.birincil ? ".birincil" : "") + (b.tehlike ? ".tehlike.dolu" : "") + (b.sol ? ".sol-bosluk" : ""),
                    { type: "button", disabled: !!b.pasif }, b.ikon ? KS.ikon(b.ikon, 17) : null, b.etiket);
                el.addEventListener("click", async () => {
                    if (b.fn) { const s = await b.fn(el); if (s === false) return; }
                    kapatF(b.deger || "tamam");
                });
                if (b.ref) b.ref(el);
                return el;
            })));
        }
        d.addEventListener("close", () => { d.remove(); if (kapaninca) kapaninca(d.returnValue); });
        d.addEventListener("cancel", (e) => { if (acik) { e.preventDefault(); kapat(); } });
        document.body.append(d);
        d.showModal();
        if (ilkOdak) setTimeout(() => ilkOdak.focus(), 30);
        return { el: d, kapat: kapatF };
    }
    function onayla({ baslik, metin, evet = "Tamam", hayir = "Vazgeç", tehlike = false }) {
        return new Promise((coz) => {
            let sonuc = false;
            pencere({
                baslik, icerik: h("p", { style: { margin: "0", color: "var(--yazi-2)", lineHeight: "1.55" } }, metin), sinif: "dar",
                dugmeler: [{ etiket: hayir }, { etiket: evet, birincil: !tehlike, tehlike, fn: () => { sonuc = true; } }],
                kapaninca: () => coz(sonuc)
            });
        });
    }
    function sor({ baslik, etiket = "", deger = "", evet = "Kaydet" }) {
        return new Promise((coz) => {
            let sonuc = null;
            const girdi = h("input.girdi", { value: deger, style: { height: "38px" } });
            const p = pencere({
                baslik, sinif: "dar", ilkOdak: girdi,
                icerik: h("label.form-alan", etiket, girdi),
                dugmeler: [{ etiket: "Vazgeç" }, { etiket: evet, birincil: true, fn: () => { sonuc = girdi.value; } }],
                kapaninca: () => coz(sonuc)
            });
            girdi.addEventListener("keydown", (e) => { if (e.key === "Enter") { sonuc = girdi.value; p.kapat("tamam"); } });
            setTimeout(() => girdi.select(), 40);
        });
    }

    // ── Sayı girişi (sürüklenebilir etiketli) ───────────────────
    function sayi({ on, son, deger, min = -Infinity, max = Infinity, adim = 1, basamak = 0, degisti, ipucu, sinif = "" }) {
        const bicim = (v) => (v == null || Number.isNaN(v) ? "" : String(KS.yuvarla(v, basamak)).replace(".", ","));
        const oku = (s) => { const n = parseFloat(String(s).replace(",", ".")); return Number.isFinite(n) ? KS.sinirla(n, min, max) : null; };
        const girdi = h("input", { type: "text", inputmode: "decimal", value: bicim(deger), "aria-label": ipucu || (typeof on === "string" ? on : "") });
        const onEk = on ? h("span.on-ek", { title: ipucu || "Sürükleyerek değiştir" }, typeof on === "string" ? on : on) : null;
        const el = h("div.sayi" + (sinif ? "." + sinif : ""), onEk, girdi, son ? h("span.son-ek", son) : null);
        let simdiki = deger;
        const uygula = (v, bitti) => { if (v == null) return; simdiki = v; girdi.value = bicim(v); degisti(v, bitti); };
        girdi.addEventListener("change", () => { const v = oku(girdi.value); if (v == null) girdi.value = bicim(simdiki); else uygula(v, true); });
        girdi.addEventListener("keydown", (e) => {
            if (e.key === "Enter") { girdi.blur(); return; }
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const v = oku(girdi.value) ?? simdiki ?? 0;
                uygula(KS.sinirla(v + (e.key === "ArrowUp" ? 1 : -1) * adim * (e.shiftKey ? 10 : 1), min, max), true);
            }
            e.stopPropagation();
        });
        girdi.addEventListener("focus", () => setTimeout(() => girdi.select(), 0));
        if (onEk) {
            onEk.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                onEk.setPointerCapture(e.pointerId);
                const x0 = e.clientX, v0 = simdiki ?? 0;
                let oynadi = false;
                const hareket = (ev) => {
                    const dx = ev.clientX - x0;
                    if (Math.abs(dx) > 2) oynadi = true;
                    if (!oynadi) return;
                    uygula(KS.sinirla(KS.yuvarla(v0 + Math.round(dx / 2) * adim * (ev.shiftKey ? 10 : 1), basamak), min, max), false);
                };
                const bitir = () => {
                    onEk.removeEventListener("pointermove", hareket);
                    onEk.removeEventListener("pointerup", bitir);
                    onEk.removeEventListener("pointercancel", bitir);
                    if (oynadi) degisti(simdiki, true); else girdi.focus();
                };
                onEk.addEventListener("pointermove", hareket);
                onEk.addEventListener("pointerup", bitir);
                onEk.addEventListener("pointercancel", bitir);
            });
        }
        return { el, girdi, yenile(v) { simdiki = v; if (document.activeElement !== girdi) girdi.value = bicim(v); } };
    }

    function kaydirici({ min = 0, max = 100, adim = 1, deger, degisti, son, basamak = 0 }) {
        const aralik = h("input", { type: "range", min, max, step: adim, value: deger });
        const doldur = () => aralik.style.setProperty("--dolu", ((aralik.value - min) / (max - min)) * 100 + "%");
        const kutu = sayi({ deger, min, max, adim, basamak, son, degisti: (v, b) => { aralik.value = v; doldur(); degisti(v, b); } });
        aralik.addEventListener("input", () => { const v = +aralik.value; kutu.yenile(v); doldur(); degisti(v, false); });
        aralik.addEventListener("change", () => degisti(+aralik.value, true));
        aralik.addEventListener("keydown", (e) => e.stopPropagation());
        doldur();
        return { el: h("div.kaydir-sira", aralik, kutu.el), yenile(v) { aralik.value = v; doldur(); kutu.yenile(v); } };
    }

    function bolumlu({ secenekler, deger, degisti, sinif = "" }) {
        const el = h("div.bolumlu" + (sinif ? "." + sinif : ""), { role: "group" });
        const dugmeler = secenekler.map((s) => {
            const b = h("button", { type: "button", title: s.ipucu || s.etiket || "", "aria-pressed": String(s.deger === deger) },
                s.ikon ? KS.ikon(s.ikon, 17) : s.etiket);
            b.addEventListener("click", () => { yenile(s.deger); degisti(s.deger); });
            el.append(b);
            return b;
        });
        function yenile(v) { dugmeler.forEach((b, i) => b.setAttribute("aria-pressed", String(secenekler[i].deger === v))); }
        return { el, yenile };
    }
    // Aç / kapa düğmesi grubu (kalın, italik gibi bağımsız anahtarlar)
    function acKapa({ ikon, ipucu, deger, degisti }) {
        const b = h("button.ikon-dugme.kucuk", { type: "button", title: ipucu, "aria-pressed": String(!!deger) }, KS.ikon(ikon, 17));
        b.addEventListener("click", () => { const v = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(v)); degisti(v); });
        return { el: b, yenile(v) { b.setAttribute("aria-pressed", String(!!v)); } };
    }
    function anahtar({ deger, degisti, etiket }) {
        const b = h("button.anahtar", { type: "button", role: "switch", "aria-checked": String(!!deger), "aria-label": etiket || "" });
        b.addEventListener("click", () => { const v = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", String(v)); degisti(v); });
        return { el: b, yenile(v) { b.setAttribute("aria-checked", String(!!v)); } };
    }
    function secim({ secenekler, deger, degisti }) {
        const el = h("select.secim", secenekler.map((s) => h("option", { value: s.deger, selected: s.deger === deger }, s.etiket)));
        el.addEventListener("change", () => degisti(el.value));
        el.addEventListener("keydown", (e) => e.stopPropagation());
        return { el, yenile(v) { if (document.activeElement !== el) el.value = v; } };
    }
    function metinGir({ deger, degisti, yer, cok, satir = 3 }) {
        const el = cok ? h("textarea.alan-metin", { rows: satir, placeholder: yer || "" }) : h("input.girdi", { value: deger ?? "", placeholder: yer || "" });
        if (cok) el.value = deger ?? "";
        el.addEventListener("input", () => degisti(el.value, false));
        el.addEventListener("change", () => degisti(el.value, true));
        el.addEventListener("keydown", (e) => { e.stopPropagation(); if (!cok && e.key === "Enter") el.blur(); });
        return { el, yenile(v) { if (document.activeElement !== el) el.value = v ?? ""; } };
    }

    // ── Renk düğmesi ve seçici ──────────────────────────────────
    function renkOrnekCss(d) { return KS.dolguCss(d || "transparent"); }
    function renkAdi(d) {
        if (!d || d === "transparent") return "Saydam";
        if (typeof d === "string") { const c = KS.renkCoz(d); return c.a === 0 ? "Saydam" : KS.renkHex(c).slice(1, 7) + (c.a < 1 ? ` ${Math.round(c.a * 100)}%` : ""); }
        return { dogrusal: "Doğrusal gradyan", dairesel: "Dairesel gradyan", isin: "Işın" }[d.tip] || "Gradyan";
    }
    function renkSec({ deger, degisti, gradyan = false, yalniz = false, ipucu = "Renk" }) {
        const ornek = h("span.renk-ornek");
        const yazi = yalniz ? null : h("span.renk-yazi");
        const b = h("button.renk-dugme" + (yalniz ? ".yalniz" : ""), { type: "button", title: ipucu }, ornek, yazi);
        let simdiki = deger;
        const goster = () => { ornek.style.setProperty("--r", renkOrnekCss(simdiki)); if (yazi) yazi.textContent = renkAdi(simdiki); };
        goster();
        b.addEventListener("click", () => {
            KS.renkSecici.ac(b, { deger: simdiki, gradyan, degisti: (v, bitti) => { simdiki = v; goster(); degisti(v, bitti); } });
        });
        return { el: b, yenile(v) { simdiki = v; goster(); } };
    }

    const ONERILEN = [
        "#ffffff", "#f3f4f6", "#d1d5db", "#6b7280", "#1d1d1f", "#000000", "#fff7e6", "#fde68a", "#ffd400",
        "#ffb000", "#f97316", "#ef4444", "#e30613", "#b00010", "#7f1d1d", "#fce7f3", "#ec4899", "#be185d",
        "#ede9fe", "#8b5cf6", "#6c47ff", "#1e3a8a", "#1d4ed8", "#0ea5e9", "#cffafe", "#14b8a6", "#0f766e",
        "#dcfce7", "#84cc16", "#22c55e", "#15803d", "#14532d", "#a16207", "#78350f", "transparent", "#00000080"
    ];
    const HAZIR_GRADYAN = [
        { tip: "dogrusal", aci: 180, duraklar: [{ r: "#e30613", k: 0 }, { r: "#8b0010", k: 100 }] },
        { tip: "dogrusal", aci: 135, duraklar: [{ r: "#ffd400", k: 0 }, { r: "#ff7a00", k: 100 }] },
        { tip: "dogrusal", aci: 135, duraklar: [{ r: "#22c55e", k: 0 }, { r: "#0f766e", k: 100 }] },
        { tip: "dogrusal", aci: 135, duraklar: [{ r: "#6c47ff", k: 0 }, { r: "#ec4899", k: 100 }] },
        { tip: "dogrusal", aci: 180, duraklar: [{ r: "#0b1b3f", k: 0 }, { r: "#1d4ed8", k: 100 }] },
        { tip: "dogrusal", aci: 90, duraklar: [{ r: "#ff9a9e", k: 0 }, { r: "#fad0c4", k: 100 }] },
        { tip: "dairesel", duraklar: [{ r: "#fff3b0", k: 0 }, { r: "#ffb000", k: 100 }] },
        { tip: "dairesel", duraklar: [{ r: "#ff4d4d", k: 0 }, { r: "#8b0010", k: 100 }] },
        { tip: "isin", renk1: "#ffd400", renk2: "#ffb800", sayi: 24, aci: 0 },
        { tip: "isin", renk1: "#e30613", renk2: "#c10010", sayi: 20, aci: 0 },
        { tip: "dogrusal", aci: 180, duraklar: [{ r: "#ffffff", k: 0 }, { r: "#e5e7eb", k: 100 }] },
        { tip: "dogrusal", aci: 180, duraklar: [{ r: "#1d1d1f", k: 0 }, { r: "#4b5563", k: 100 }] }
    ];
    function sonRenkler() { try { return JSON.parse(localStorage.getItem("ks-son-renkler") || "[]"); } catch (h) { return []; } }
    function sonRenkEkle(r) {
        if (!r || typeof r !== "string") return;
        try {
            const l = [r, ...sonRenkler().filter((x) => x !== r)].slice(0, 9);
            localStorage.setItem("ks-son-renkler", JSON.stringify(l));
        } catch (h) { /* yok say */ }
    }

    // Tek renk düzenleyici (SV alanı + ton + alfa + hex); gradyan durağı düzenlemede de kullanılır
    function renkDuzenleyici(baslangic, degisti) {
        let c = KS.renkCoz(baslangic || "#000000");
        let hsv = KS.rgbHsv(c), a = c.a;
        const alan = h("div.rs-alan"), imlec = h("div.rs-imlec");
        alan.append(imlec);
        const tonSerit = h("div.rs-serit.ton"), tonImlec = h("div.rs-imlec");
        tonSerit.append(tonImlec);
        const alfaSerit = h("div.rs-serit.alfa"), alfaImlec = h("div.rs-imlec");
        alfaSerit.append(alfaImlec);
        const hex = h("input.girdi", { spellcheck: "false", "aria-label": "Onaltılık renk" });
        const alfaKutu = sayi({ deger: Math.round(a * 100), min: 0, max: 100, son: "%", degisti: (v, b) => { a = v / 100; ciz(); yay(b); } });
        const damla = window.EyeDropper ? h("button.ikon-dugme.rs-damla", { type: "button", title: "Ekrandan renk al" }, KS.ikon("damla", 18)) : null;
        if (damla) damla.addEventListener("click", async () => {
            try { const s = await new window.EyeDropper().open(); ayarla(s.sRGBHex); yay(true); } catch (h) { /* iptal */ }
        });
        const el = h("div",
            alan,
            h("div.rs-seritler", damla, h("div.seritler", tonSerit, alfaSerit)),
            h("div.rs-girdiler", hex, alfaKutu.el));

        function renk() { const r = KS.hsvRgb(hsv); return KS.renkHex({ r: r.r, g: r.g, b: r.b, a }); }
        function ciz() {
            const r = KS.hsvRgb(hsv);
            alan.style.setProperty("--ton", `hsl(${hsv.h} 100% 50%)`);
            imlec.style.left = hsv.s * 100 + "%";
            imlec.style.top = (1 - hsv.v) * 100 + "%";
            imlec.style.background = KS.renkHex(r);
            tonImlec.style.left = (hsv.h / 360) * 100 + "%";
            tonImlec.style.background = `hsl(${hsv.h} 100% 50%)`;
            alfaSerit.style.setProperty("--duz", KS.renkHex(r));
            alfaImlec.style.left = a * 100 + "%";
            if (document.activeElement !== hex) hex.value = KS.renkHex(r).toUpperCase();
            alfaKutu.yenile(Math.round(a * 100));
        }
        function yay(bitti) { degisti(renk(), bitti); }
        function ayarla(r) { const cc = KS.renkCoz(r); const yeni = KS.rgbHsv(cc); if (yeni.s === 0 || yeni.v === 0) yeni.h = hsv.h; hsv = yeni; a = cc.a; ciz(); }
        function surukle(hedef, fn) {
            hedef.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                hedef.setPointerCapture(e.pointerId);
                const hareket = (ev) => { const r = hedef.getBoundingClientRect(); fn(KS.sinirla((ev.clientX - r.left) / r.width, 0, 1), KS.sinirla((ev.clientY - r.top) / r.height, 0, 1)); ciz(); yay(false); };
                const bitir = () => { hedef.removeEventListener("pointermove", hareket); hedef.removeEventListener("pointerup", bitir); yay(true); };
                hedef.addEventListener("pointermove", hareket);
                hedef.addEventListener("pointerup", bitir, { once: true });
                hareket(e);
            });
        }
        surukle(alan, (x, y) => { hsv.s = x; hsv.v = 1 - y; if (a === 0) a = 1; });
        surukle(tonSerit, (x) => { hsv.h = x * 360; if (a === 0) a = 1; });
        surukle(alfaSerit, (x) => { a = KS.yuvarla(x, 2); });
        hex.addEventListener("change", () => { let v = hex.value.trim(); if (!v.startsWith("#") && /^[0-9a-f]{3,8}$/i.test(v)) v = "#" + v; ayarla(v); yay(true); });
        hex.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") hex.blur(); });
        ciz();
        return { el, ayarla, renk };
    }

    function ornekDugme(r, secili, fn) {
        const b = h("button.rs-ornek" + (secili ? ".sec" : ""), { type: "button", title: renkAdi(r) });
        b.style.setProperty("--r", KS.dolguCss(r));
        b.addEventListener("click", () => fn(r));
        return b;
    }

    KS.renkSecici = {
        ac(capa, { deger, gradyan = false, degisti }) {
            const gradyanMi = deger && typeof deger === "object";
            let kip = gradyanMi ? "gradyan" : "duz";
            // Gradyan durumu (ışın da iki duraklı gradyan gibi düzenlenir)
            let g = gradyanMi ? normalGradyan(deger) : { tip: "dogrusal", aci: 180, sayi: 24, duraklar: [{ r: typeof deger === "string" && deger !== "transparent" ? deger : "#ffd400", k: 0 }, { r: "#e30613", k: 100 }] };
            let secili = 0;
            let duz = typeof deger === "string" ? deger : "#000000";
            const kok = h("div.renk-secici");
            let acilirKayit;

            function normalGradyan(d) {
                if (d.tip === "isin") return { tip: "isin", aci: d.aci || 0, sayi: d.sayi || 24, duraklar: [{ r: d.renk1, k: 0 }, { r: d.renk2, k: 100 }] };
                return { tip: d.tip || "dogrusal", aci: d.aci ?? 180, sayi: 24, duraklar: KS.kopya(d.duraklar || []) };
            }
            function gradyanDeger() {
                if (g.tip === "isin") return { tip: "isin", renk1: g.duraklar[0].r, renk2: (g.duraklar[1] || g.duraklar[0]).r, sayi: g.sayi, aci: g.aci, x: 50, y: 50 };
                const d = { tip: g.tip, duraklar: g.duraklar.map((s) => ({ r: s.r, k: Math.round(s.k) })) };
                if (g.tip === "dogrusal") d.aci = g.aci;
                return d;
            }
            const yay = (bitti) => {
                const v = kip === "duz" ? duz : gradyanDeger();
                degisti(v, bitti);
                if (bitti && kip === "duz") sonRenkEkle(duz);
            };

            function ciz() {
                const parcalar = [];
                if (gradyan) {
                    parcalar.push(h("div.rs-sekme", bolumlu({
                        secenekler: [{ deger: "duz", etiket: "Düz renk" }, { deger: "gradyan", etiket: "Gradyan" }], deger: kip,
                        degisti: (v) => { kip = v; if (v === "duz") duz = g.duraklar[secili]?.r || duz; ciz(); yay(true); }
                    }).el));
                }
                if (kip === "gradyan") {
                    const cubuk = h("div.rs-gradyan");
                    const onizle = () => { cubuk.style.background = g.tip === "isin" ? `linear-gradient(90deg, ${g.duraklar[0].r} 50%, ${(g.duraklar[1] || g.duraklar[0]).r} 50%)` : `linear-gradient(90deg, ${g.duraklar.slice().sort((a, b) => a.k - b.k).map((s) => `${s.r} ${s.k}%`).join(",")})`; };
                    onizle();
                    g.duraklar.forEach((s, i) => {
                        const durak = h("div.rs-durak" + (i === secili ? ".sec" : ""), { style: { left: s.k + "%", background: s.r } });
                        durak.addEventListener("pointerdown", (e) => {
                            e.preventDefault(); e.stopPropagation();
                            secili = i;
                            KS.$$(".rs-durak", cubuk).forEach((d, j) => d.classList.toggle("sec", j === i));
                            duzenleyici.ayarla(s.r);
                            if (g.tip === "isin") return;
                            durak.setPointerCapture(e.pointerId);
                            const hareket = (ev) => { const r = cubuk.getBoundingClientRect(); s.k = KS.sinirla(Math.round((ev.clientX - r.left) / r.width * 100), 0, 100); durak.style.left = s.k + "%"; onizle(); yay(false); };
                            const bitir = () => { durak.removeEventListener("pointermove", hareket); yay(true); };
                            durak.addEventListener("pointermove", hareket);
                            durak.addEventListener("pointerup", bitir, { once: true });
                        });
                        cubuk.append(durak);
                    });
                    cubuk.addEventListener("pointerdown", (e) => {
                        if (e.target !== cubuk || g.tip === "isin" || g.duraklar.length >= 6) return;
                        const r = cubuk.getBoundingClientRect(), k = Math.round((e.clientX - r.left) / r.width * 100);
                        g.duraklar.push({ r: duzenleyici.renk(), k });
                        secili = g.duraklar.length - 1;
                        ciz(); yay(true);
                    });
                    const tipSec = bolumlu({
                        secenekler: [{ deger: "dogrusal", etiket: "Doğrusal" }, { deger: "dairesel", etiket: "Dairesel" }, { deger: "isin", etiket: "Işın" }], deger: g.tip,
                        degisti: (v) => { g.tip = v; if (v === "isin") { g.duraklar = g.duraklar.slice(0, 2); if (g.duraklar.length < 2) g.duraklar.push({ r: "#ffffff", k: 100 }); secili = Math.min(secili, 1); } ciz(); yay(true); }
                    });
                    tipSec.el.style.flex = "1";
                    const arac = h("div.rs-gradyan-arac", tipSec.el);
                    parcalar.push(arac);
                    const ikinci = h("div.rs-gradyan-arac");
                    if (g.tip !== "dairesel") ikinci.append(sayi({ on: "Açı", son: "°", deger: g.aci, min: 0, max: 360, degisti: (v, b) => { g.aci = v; yay(b); } }).el);
                    if (g.tip === "isin") ikinci.append(sayi({ on: "Işın", deger: g.sayi, min: 6, max: 72, degisti: (v, b) => { g.sayi = v; yay(b); } }).el);
                    ikinci.append(h("button.ikon-dugme.kucuk", { type: "button", title: "Ters çevir", onclick: () => { g.duraklar.forEach((s) => { s.k = 100 - s.k; }); if (g.tip === "isin") g.duraklar.reverse(); ciz(); yay(true); } }, KS.ikon("cevirYatay", 16)));
                    if (g.tip !== "isin" && g.duraklar.length > 2) {
                        ikinci.append(h("button.ikon-dugme.kucuk.tehlike", { type: "button", title: "Durağı sil", onclick: () => { g.duraklar.splice(secili, 1); secili = 0; ciz(); yay(true); } }, KS.ikon("sil", 16)));
                    }
                    parcalar.push(cubuk, ikinci);
                }
                const baslangic = kip === "duz" ? duz : g.duraklar[secili]?.r;
                const duzenleyici = renkDuzenleyici(baslangic, (r, bitti) => {
                    if (kip === "duz") duz = r;
                    else {
                        g.duraklar[secili].r = r;
                        const d = KS.$$(".rs-durak", kok)[secili];
                        if (d) d.style.background = r;
                        const cubuk = KS.$(".rs-gradyan", kok);
                        if (cubuk) cubuk.style.background = g.tip === "isin" ? `linear-gradient(90deg, ${g.duraklar[0].r} 50%, ${(g.duraklar[1] || g.duraklar[0]).r} 50%)` : `linear-gradient(90deg, ${g.duraklar.slice().sort((a, b) => a.k - b.k).map((s) => `${s.r} ${s.k}%`).join(",")})`;
                    }
                    yay(bitti);
                });
                parcalar.push(duzenleyici.el);
                const sec = (r) => {
                    if (kip === "duz") { duz = r; duzenleyici.ayarla(r); yay(true); ciz(); }
                    else { g.duraklar[secili].r = r; ciz(); yay(true); }
                };
                const belge = (KS.editor && KS.editor.belgeRenkleri ? KS.editor.belgeRenkleri() : []).slice(0, 18);
                if (belge.length) parcalar.push(h("div.rs-baslik", "Belge renkleri"), h("div.rs-ornekler", belge.map((r) => ornekDugme(r, kip === "duz" && r === duz, sec))));
                const son = sonRenkler();
                if (son.length) parcalar.push(h("div.rs-baslik", "Son kullanılanlar"), h("div.rs-ornekler", son.map((r) => ornekDugme(r, false, sec))));
                parcalar.push(h("div.rs-baslik", "Önerilen"), h("div.rs-ornekler", ONERILEN.map((r) => ornekDugme(r, kip === "duz" && r === duz, sec))));
                if (gradyan) {
                    parcalar.push(h("div.rs-baslik", "Hazır gradyanlar"), h("div.rs-ornekler", HAZIR_GRADYAN.map((gr) => ornekDugme(gr, false, (v) => {
                        kip = "gradyan"; g = normalGradyan(v); secili = 0; ciz(); yay(true);
                    }))));
                }
                kok.replaceChildren(...parcalar);
                if (acilirKayit) acilirKayit.yenidenKonumla();
            }
            ciz();
            acilirKayit = acilir(kok, capa, { yer: capa.closest && capa.closest(".sag-panel") ? "sol" : "alt" });
            return acilirKayit;
        }
    };

    // ── Font seçici ─────────────────────────────────────────────
    function fontSec({ deger, degisti }) {
        const yazi = h("span", deger);
        const b = h("button.font-dugme", { type: "button", title: "Yazı tipi" }, yazi, KS.ikon("asagi", 14));
        let simdiki = deger;
        const goster = () => { yazi.textContent = simdiki; yazi.style.fontFamily = `"${simdiki}", sans-serif`; KS.fontlar.yukle(simdiki); };
        goster();
        b.addEventListener("click", () => KS.fontSecici.ac(b, { deger: simdiki, degisti: (v) => { simdiki = v; goster(); degisti(v); } }));
        return { el: b, yenile(v) { simdiki = v; goster(); } };
    }
    KS.fontSecici = {
        ac(capa, { deger, degisti }) {
            let tur = "hepsi", ara = "";
            const liste = h("div.font-liste");
            const araGirdi = h("input", { type: "search", placeholder: "Yazı tipi ara…", autocomplete: "off" });
            const cipler = h("div.cipler");
            const turler = [["hepsi", "Tümü"], ...Object.entries(KS.fontlar.TURLER)];
            const cipDugmeler = turler.map(([k, ad]) => {
                const c = h("button.cip", { type: "button", "aria-pressed": String(k === tur) }, ad);
                c.addEventListener("click", () => { tur = k; cipDugmeler.forEach((d, i) => d.setAttribute("aria-pressed", String(turler[i][0] === k))); ciz(); });
                return c;
            });
            cipler.append(...cipDugmeler);
            const gozcu = new IntersectionObserver((girdiler) => {
                for (const g of girdiler) if (g.isIntersecting) {
                    const el = g.target;
                    gozcu.unobserve(el);
                    KS.fontlar.yukle(el.dataset.font).then(() => { el.style.fontFamily = `"${el.dataset.font}", sans-serif`; });
                }
            }, { root: liste, rootMargin: "120px" });
            function oge(f) {
                const b = h("button.font-oge" + (f.ad === deger ? ".sec" : ""), { type: "button", dataset: { font: f.ad } }, f.ad, h("small", KS.fontlar.TURLER[f.tur]));
                b.addEventListener("click", () => { deger = f.ad; degisti(f.ad); KS.$$(".font-oge", liste).forEach((x) => x.classList.toggle("sec", x.dataset.font === f.ad)); });
                gozcu.observe(b);
                return b;
            }
            function ciz() {
                const sade = KS.sade(ara);
                const uyan = KS.fontlar.liste.filter((f) => (tur === "hepsi" || f.tur === tur) && (!sade || KS.sade(f.ad).includes(sade)));
                const parcalar = [];
                const belgede = KS.editor && KS.editor.belgeFontlari ? KS.editor.belgeFontlari() : [];
                if (!sade && tur === "hepsi" && belgede.length) {
                    parcalar.push(h("div.font-grup", "Bu katalogda"), ...belgede.map((ad) => KS.fontlar.bul(ad)).filter(Boolean).map(oge), h("div.font-grup", "Tüm yazı tipleri"));
                }
                parcalar.push(...uyan.map(oge));
                if (!uyan.length) parcalar.push(h("div.bos-durum", "Eşleşen yazı tipi yok"));
                liste.replaceChildren(...parcalar);
            }
            araGirdi.addEventListener("input", () => { ara = araGirdi.value; ciz(); });
            araGirdi.addEventListener("keydown", (e) => e.stopPropagation());
            ciz();
            const kok = h("div.font-secici", h("div.ust", h("div.ara-kutu", KS.ikon("ara", 16), araGirdi), cipler), liste);
            const a = acilir(kok, capa, { yer: capa.closest && capa.closest(".sag-panel") ? "sol" : "alt", kapaninca: () => gozcu.disconnect() });
            setTimeout(() => { if (!KS.mobil()) araGirdi.focus(); const s = KS.$(".font-oge.sec", liste); if (s) s.scrollIntoView({ block: "center" }); }, 20);
            return a;
        }
    };

    // ── Panel yardımcıları ──────────────────────────────────────
    function bolum(baslik, icerik, { acik = true, ek } = {}) {
        const d = h("details.oz-bolum", { open: acik },
            h("summary", h("span", baslik), h("span.ek", ek || null, KS.ikon("asagi", 15, "ok-isaret"))),
            icerik);
        if (ek) ek.addEventListener("click", (e) => e.stopPropagation());
        return d;
    }
    function alan(etiket, ...kontroller) {
        return h("div.alan" + (etiket ? "" : ".tam"), etiket ? h("span.etiket", etiket) : null, kontroller.length === 1 ? kontroller[0] : h("div.alan-sira", kontroller));
    }

    KS.ui = {
        acilir, kapat, menu, pencere, onayla, sor, konumla,
        sayi, kaydirici, bolumlu, acKapa, anahtar, secim, metinGir, renkSec, fontSec, bolum, alan,
        acikMi: () => !!acik, ONERILEN, HAZIR_GRADYAN
    };
})();
