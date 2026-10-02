// Düzenleyici çekirdeği: sayfaları tuvale çizer; seçim, taşıma, boyutlandırma, döndürme, akıllı kılavuzlar,
// alan seçimi, metin düzenleme, kırpma, pano, sürükle-bırak ve klavye kısayolları burada.
// Durum KS.E'de: belge, seçili öğe kimlikleri, etkin sayfa, yakınlaştırma.
(function () {
    "use strict";
    const KS = window.KS;
    const { h } = KS;

    const E = KS.E = { belge: null, secim: [], sayfaId: null, zum: 0.6, duzenlenen: null, kirpilan: null, yapisma: true, donusum: false };
    const sayfaEl = new Map();   // sayfaId → { id, blok, cerceve, kok, ust, no, adGirdi }
    let tuval, tuvalIc, ekleDugme;
    const PANO_ONEK = "KATALOG-STUDYO:";

    // ── Erişim yardımcıları ─────────────────────────────────────
    const sayfa = (id = E.sayfaId) => E.belge.sayfalar.find((s) => s.id === id);
    const bul = (id) => KS.model.ogeBul(E.belge, id);
    const aktifP = () => sayfaEl.get(E.sayfaId);
    const seciliOgeler = () => { const s = sayfa(); return s ? s.ogeler.filter((o) => E.secim.includes(o.id)) : []; };
    const ogeElemani = (id) => { const r = bul(id); const p = r && sayfaEl.get(r.sayfa.id); return p ? p.kok.querySelector(`:scope > [data-id="${id}"]`) : null; };
    const girdiOdakta = () => { const a = document.activeElement; return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT" || a.isContentEditable); };

    function sayfaKoordinat(p, cx, cy) {
        const r = p.cerceve.getBoundingClientRect();
        return { x: (cx - r.left) / E.zum, y: (cy - r.top) / E.zum };
    }

    // ── Kurulum ─────────────────────────────────────────────────
    function baslat(kok) {
        tuval = kok.tuval;
        tuvalIc = kok.tuvalIc;
        ekleDugme = h("button.sayfa-ekle-alt", { type: "button", onclick: () => sayfaEkle() }, KS.ikon("arti", 18), "Sayfa ekle");
        tuval.addEventListener("pointerdown", pointerDown);
        tuval.addEventListener("pointermove", KS.kareBasi(uzerindeGez));
        tuval.addEventListener("pointerleave", () => hoverCiz(null));
        tuval.addEventListener("dblclick", ciftTik);
        tuval.addEventListener("contextmenu", sagTik);
        tuval.addEventListener("wheel", tekerlek, { passive: false });
        tuval.addEventListener("touchstart", tutamBaslat, { passive: false });
        tuval.addEventListener("touchmove", tutamHareket, { passive: false });
        tuval.addEventListener("touchend", tutamBitir);
        tuval.addEventListener("touchcancel", tutamBitir);
        tuval.addEventListener("scroll", KS.kareBasi(() => KS.olay.yay("kaydirma")));
        tuval.addEventListener("dragover", suruklemeUzerinde);
        tuval.addEventListener("dragleave", () => birakHedef(null));
        tuval.addEventListener("drop", birak);
        document.addEventListener("keydown", tusBasildi);
        document.addEventListener("keyup", tusBirakildi);
        document.addEventListener("copy", (e) => panoOlay(e, "kopyala"));
        document.addEventListener("cut", (e) => panoOlay(e, "kes"));
        document.addEventListener("paste", yapistirOlay);
        new ResizeObserver(KS.kareBasi(() => secimCiz())).observe(tuval);
        KS.olay.on("varlik-hazir", () => tumunuCiz());
        KS.olay.on("yeniden-ciz", () => tumunuCiz());
        document.fonts.addEventListener("loadingdone", KS.gecikmeli(() => { egrileriBoyutla(); tumunuCiz(true); }, 60));
        KS.gecmis.baglan({
            al: () => E.belge,
            yukle: (b) => {
                E.belge = b;
                if (E.duzenlenen) E.duzenlenen = null;
                E.secim = E.secim.filter((id) => bul(id));
                if (!E.belge.sayfalar.some((s) => s.id === E.sayfaId)) E.sayfaId = E.belge.sayfalar[0].id;
                tumunuCiz();
                KS.olay.yay("belge");
                KS.olay.yay("secim");
            }
        });
    }

    // ── Belge ───────────────────────────────────────────────────
    function belgeYukle(belge) {
        if (E.duzenlenen) metinBitir(false);
        E.belge = KS.model.belgeNormallestir(belge);
        E.secim = [];
        E.sayfaId = E.belge.sayfalar[0].id;
        for (const p of sayfaEl.values()) p.blok.remove();
        sayfaEl.clear();
        fontlariYukle();
        // Yalnız sayfalardaki görseller beklenir; ürün listesinin resimleri panelde göründükçe yüklenir
        KS.varlik.hepsiniBekle([...KS.depo.varlikKimlikleri(E.belge, { urunler: false })]).then(() => tumunuCiz());
        tumunuCiz();
        requestAnimationFrame(() => sigdir());
        KS.gecmis.baslat();
        KS.olay.yay("belge");
        KS.olay.yay("secim");
    }
    function fontlariYukle() {
        const kullanim = new Map();
        for (const s of E.belge.sayfalar) for (const o of s.ogeler) KS.model.fontKullanimi(o, kullanim);
        for (const [aile, agirliklar] of kullanim) for (const w of agirliklar) KS.fontlar.hazir(aile, w);
    }

    // ── Çizim ───────────────────────────────────────────────────
    function sayfaBlokOlustur(s) {
        const no = h("span.no");
        const adGirdi = h("input.sayfa-adi", { placeholder: "Sayfa başlığı ekle", "aria-label": "Sayfa başlığı" });
        adGirdi.addEventListener("change", () => { const ss = sayfa(s.id); if (ss) { ss.ad = adGirdi.value; KS.gecmis.kaydet(); } });
        adGirdi.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") adGirdi.blur(); });
        const dugme = (ikon, ipucu, fn, ek = "") => h("button.ikon-dugme" + ek, { type: "button", title: ipucu, onclick: (e) => { e.stopPropagation(); fn(); } }, KS.ikon(ikon, 17));
        const baslik = h("div.sayfa-baslik",
            h("div.sol", no, adGirdi),
            h("div.sag",
                dugme("yukari", "Yukarı taşı", () => sayfaTasi(s.id, -1)),
                dugme("asagi", "Aşağı taşı", () => sayfaTasi(s.id, 1)),
                dugme("kopyala", "Sayfayı çoğalt", () => sayfaCogalt(s.id)),
                dugme("sil", "Sayfayı sil", () => sayfaSil(s.id), ".tehlike"),
                dugme("sayfaEkle", "Sonrasına sayfa ekle", () => sayfaEkle(s.id))));
        const kok = h("div.ks-sayfa");
        const ust = h("div.sayfa-ust");
        const cerceve = h("div.sayfa-cerceve", kok, ust);
        const blok = h("section.sayfa-blok", { dataset: { sayfa: s.id } }, baslik, cerceve);
        const p = { id: s.id, blok, cerceve, kok, ust, no, adGirdi };
        sayfaEl.set(s.id, p);
        return p;
    }
    function boyutla(p) {
        const b = E.belge;
        p.cerceve.style.width = b.genislik * E.zum + "px";
        p.cerceve.style.height = b.yukseklik * E.zum + "px";
        p.blok.style.width = Math.max(b.genislik * E.zum, 150) + "px";
        p.kok.style.transform = `scale(${E.zum})`;
    }

    // tamamı: yazı tipleri yüklendiğinde tüm metinleri yeniden ölç
    function tumunuCiz(tamami = false) {
        if (!E.belge) return;
        const b = E.belge;
        const kalan = new Set(sayfaEl.keys());
        let onceki = null;
        b.sayfalar.forEach((s, i) => {
            let p = sayfaEl.get(s.id) || sayfaBlokOlustur(s);
            kalan.delete(s.id);
            const hedef = onceki ? onceki.blok.nextSibling : tuvalIc.firstChild;
            if (p.blok !== hedef) tuvalIc.insertBefore(p.blok, hedef);
            p.no.textContent = `Sayfa ${i + 1}`;
            if (document.activeElement !== p.adGirdi) p.adGirdi.value = s.ad || "";
            boyutla(p);
            const degisen = KS.cizim.sayfaCiz(s, p.kok, { belge: b, atla: (o) => o.id === E.duzenlenen });
            olc(tamami ? KS.$$(":scope > .o-metin", p.kok) : degisen);
            p.blok.classList.toggle("aktif", s.id === E.sayfaId);
            onceki = p;
        });
        for (const id of kalan) { sayfaEl.get(id).blok.remove(); sayfaEl.delete(id); }
        if (ekleDugme.parentNode !== tuvalIc || tuvalIc.lastChild !== ekleDugme) tuvalIc.append(ekleDugme);
        ekleDugme.style.width = b.genislik * E.zum + "px";
        secimCiz();
    }
    function sayfaYenidenCiz(sayfaId = E.sayfaId) {
        const s = sayfa(sayfaId), p = sayfaEl.get(sayfaId);
        if (!s || !p) return;
        const degisen = KS.cizim.sayfaCiz(s, p.kok, { belge: E.belge, atla: (o) => o.id === E.duzenlenen });
        olc(degisen);
    }

    // Metin yüksekliği içerikten gelir: çizimden sonra ölçülüp modele yazılır (üst kenar sabit kalır).
    function olc(elemanlar) {
        const olculer = [];
        for (const el of elemanlar) {
            if (!el.classList || !el.classList.contains("o-metin")) continue;
            const r = bul(el.dataset.id);
            if (!r || r.oge.egri) continue;
            olculer.push([r.oge, el.offsetHeight]);
        }
        for (const [o, yeni] of olculer) metinYuksekligi(o, yeni);
    }
    function metinYuksekligi(o, yeni) {
        if (!yeni || Math.abs(yeni - o.h) < 0.5) return;
        if (o.aci) {
            // Döndürülmüş kutuda üst kenarın ortası sabit kalsın
            const a = o.aci * KS.RAD, cx = o.x + o.w / 2, cy = o.y + o.h / 2;
            const ux = cx + Math.sin(a) * (o.h / 2), uy = cy - Math.cos(a) * (o.h / 2);
            const ncx = ux - Math.sin(a) * (yeni / 2), ncy = uy + Math.cos(a) * (yeni / 2);
            o.x = ncx - o.w / 2; o.y = ncy - yeni / 2;
        }
        o.h = yeni;
    }
    // Kavisli yazının kutusu yazıya göre hesaplanır; merkez sabit kalır.
    function egriBoyutla(o) {
        if (o.tur !== "metin" || !o.egri) return;
        const m = KS.egriOlcu(o);
        const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
        o.w = m.w; o.h = m.h; o.x = cx - m.w / 2; o.y = cy - m.h / 2;
    }
    function egrileriBoyutla() { if (E.belge) for (const s of E.belge.sayfalar) for (const o of s.ogeler) egriBoyutla(o); }

    // ── Seçim katmanı ───────────────────────────────────────────
    const IMLECLER = ["ew-resize", "nwse-resize", "ns-resize", "nesw-resize"];
    const TUTAMAC_ACI = { e: 0, se: 45, s: 90, sw: 135, w: 180, nw: 225, n: 270, ne: 315 };
    const TUTAMAC_YER = { nw: [0, 0], n: [50, 0], ne: [100, 0], e: [100, 50], se: [100, 100], s: [50, 100], sw: [0, 100], w: [0, 50] };
    function imlec(t, aci) { return IMLECLER[Math.round((((TUTAMAC_ACI[t] + aci) % 180) + 180) % 180 / 45) % 4]; }
    function tutamaclar(tur, o, genis, yuksek) {
        if (tur === "coklu") return ["nw", "ne", "se", "sw"];
        if (o.kilit) return [];
        let l;
        if (o.tur === "metin") l = o.egri ? ["nw", "ne", "se", "sw"] : ["nw", "ne", "se", "sw", "e", "w"];
        else if (o.tur === "sekil" && o.sekil === "cizgi") l = ["e", "w"];
        else if (o.tur === "qr") l = ["nw", "ne", "se", "sw"];
        else l = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
        if (genis < 34) l = l.filter((t) => !(t === "n" || t === "s"));
        if (yuksek < 34) l = l.filter((t) => !(t === "e" || t === "w") || (o.tur === "sekil" && o.sekil === "cizgi") || o.tur === "metin");
        return l;
    }
    // Ekran ölçeğinde (yakınlaştırılmış) kutu; döndürme kutunun merkezi etrafında
    function kutuEl(sinif, x, y, w, hh, aci) {
        const z = E.zum, W = w * z, H = hh * z;
        const el = h("div." + sinif);
        el.style.width = W + "px";
        el.style.height = H + "px";
        el.style.transform = aci
            ? `translate(${(x + w / 2) * z}px,${(y + hh / 2) * z}px) rotate(${aci}deg) translate(${-W / 2}px,${-H / 2}px)`
            : `translate(${x * z}px,${y * z}px)`;
        return el;
    }
    function seciliKutu(ogeler = seciliOgeler()) { return KS.kutuBirlesim(ogeler.map(KS.kutu)); }
    function tekMi(ogeler) { return ogeler.length === 1; }

    let katmanDurumu = { kilavuz: [], ipucu: null, alan: null };
    function secimCiz(durum) {
        if (durum) katmanDurumu = Object.assign({ kilavuz: [], ipucu: null, alan: null }, durum);
        for (const p of sayfaEl.values()) if (p.id !== E.sayfaId && p.ust.childElementCount) KS.bosalt(p.ust);
        const p = aktifP();
        if (!p || !E.belge) return;
        const z = E.zum, parcalar = [];
        const ogeler = seciliOgeler();
        if (ogeler.length) {
            if (tekMi(ogeler)) {
                const o = ogeler[0];
                const kutu = kutuEl("secim-kutu" + (o.kilit ? ".kilitli" : "") + (E.kirpilan === o.id ? ".kirpma" : ""), o.x, o.y, o.w, o.h, o.aci);
                if (!E.duzenlenen && !E.kirpilan) {
                    for (const t of tutamaclar("tek", o, o.w * z, o.h * z)) kutu.append(tutamacEl(t, o.aci));
                    if (!o.kilit) kutu.append(dondurmeEl());
                }
                parcalar.push(kutu);
            } else {
                for (const o of ogeler) parcalar.push(kutuEl("oge-cerceve", o.x, o.y, o.w, o.h, o.aci));
                const b = seciliKutu(ogeler);
                const kilitli = ogeler.some((o) => o.kilit);
                const kutu = kutuEl("secim-kutu.coklu" + (kilitli ? ".kilitli" : ""), b.x, b.y, b.w, b.h, 0);
                if (!kilitli) { for (const t of tutamaclar("coklu")) kutu.append(tutamacEl(t, 0)); kutu.append(dondurmeEl()); }
                parcalar.push(kutu);
            }
            if (!E.donusum && !E.duzenlenen && !katmanDurumu.alan) parcalar.push(yuzenArac(ogeler));
        }
        const s = sayfa();
        for (const k of katmanDurumu.kilavuz) {
            parcalar.push(k.x != null
                ? h("div.kilavuz-cizgi.dikey", { style: { left: k.x * z + "px", top: (k.a ?? 0) * z + "px", height: ((k.b ?? E.belge.yukseklik) - (k.a ?? 0)) * z + "px" } })
                : h("div.kilavuz-cizgi.yatay", { style: { top: k.y * z + "px", left: (k.a ?? 0) * z + "px", width: ((k.b ?? E.belge.genislik) - (k.a ?? 0)) * z + "px" } }));
        }
        if (katmanDurumu.alan) {
            const a = katmanDurumu.alan;
            parcalar.push(h("div.secim-alani", { style: { left: a.x * z + "px", top: a.y * z + "px", width: a.w * z + "px", height: a.h * z + "px" } }));
        }
        if (katmanDurumu.ipucu && ogeler.length) {
            const b = seciliKutu(ogeler);
            parcalar.push(h("div.boyut-ipucu", { style: { left: (b.x + b.w / 2) * z + "px", top: (b.y + b.h) * z + 40 + "px" } }, katmanDurumu.ipucu));
        }
        if (urunAlaniGoster && s) {
            const a = urunAlaniGoster;
            parcalar.push(h("div.urun-alani-cizgi", { style: { left: a.x * z + "px", top: a.y * z + "px", width: a.w * z + "px", height: a.h * z + "px" } }, h("span", "Ürün alanı")));
        }
        p.ust.replaceChildren(...parcalar, ...(hoverEl && hoverEl.parentNode === p.ust ? [hoverEl] : []));
    }
    let urunAlaniGoster = null;
    function tutamacEl(t, aci) {
        const [px, py] = TUTAMAC_YER[t];
        const kenar = t.length === 1 ? ((t === "e" || t === "w") ? ".kenar-y" : ".kenar-x") : "";
        return h("div.tutamac" + kenar, { dataset: { tutamac: t }, style: { left: px + "%", top: py + "%", cursor: imlec(t, aci) } });
    }
    function dondurmeEl() {
        return h("div.tutamac.dondur", { dataset: { tutamac: "dondur" }, title: "Döndür (Shift: 15°)", style: { left: "50%", top: "calc(100% + 30px)" } }, KS.ikon("dondur", 15));
    }
    function yuzenArac(ogeler) {
        const b = seciliKutu(ogeler), z = E.zum;
        const kilitli = ogeler.every((o) => o.kilit);
        const dugme = (ikon, ipucu, fn) => h("button.ikon-dugme", { type: "button", title: ipucu, onclick: (e) => { e.stopPropagation(); fn(e.currentTarget); } }, KS.ikon(ikon, 17));
        const grupVar = ogeler.some((o) => o.grup);
        const el = h("div.yuzen-arac",
            ogeler.length > 1 && !grupVar ? dugme("grup", "Grupla (Ctrl+G)", grupla) : null,
            grupVar && ogeler.length > 1 ? dugme("grupCoz", "Grubu çöz (Ctrl+Shift+G)", grupCoz) : null,
            dugme("kopyala", "Çoğalt (Ctrl+D)", () => cogalt()),
            dugme(kilitli ? "kilit" : "kilitAcik", kilitli ? "Kilidi aç" : "Kilitle", () => kilitle()),
            dugme("sil", "Sil (Del)", () => sil()),
            h("span.ayrac"),
            dugme("menu", "Diğer", (d) => baglamMenusu(d)));
        let y = b.y * z - 14;
        if (y < 40) y = (b.y + b.h) * z + 64;
        el.style.left = (b.x + b.w / 2) * z + "px";
        el.style.top = y + "px";
        if (y > (b.y + b.h) * z) el.style.transform = "translate(-50%, 0)";
        return el;
    }

    // Üzerinde gezinme çerçevesi
    let hoverEl = null, hoverId = null;
    function hoverCiz(id, p) {
        if (id === hoverId && hoverEl && hoverEl.parentNode) return;
        if (hoverEl) hoverEl.remove();
        hoverEl = null; hoverId = id;
        if (!id || E.secim.includes(id) || E.donusum) return;
        const r = bul(id);
        if (!r) return;
        p = p || sayfaEl.get(r.sayfa.id);
        const o = r.oge;
        hoverEl = kutuEl("hover-kutu", o.x, o.y, o.w, o.h, o.aci);
        p.ust.append(hoverEl);
    }
    function uzerindeGez(e) {
        if (E.donusum || e.buttons) return;
        const ogeEl = e.target.closest && e.target.closest(".ks-sayfa > .o");
        if (!ogeEl) { hoverCiz(null); return; }
        const blok = ogeEl.closest(".sayfa-blok");
        hoverCiz(ogeEl.dataset.id, sayfaEl.get(blok.dataset.sayfa));
    }

    // ── Seçim işlemleri ─────────────────────────────────────────
    function grupGenislet(idler) {
        const s = sayfa();
        const sonuc = new Set(idler);
        for (const id of idler) {
            const o = s.ogeler.find((x) => x.id === id);
            if (o && o.grup) for (const x of s.ogeler) if (x.grup === o.grup) sonuc.add(x.id);
        }
        return s.ogeler.filter((o) => sonuc.has(o.id)).map((o) => o.id);
    }
    function sec(idler, { genislet = true, sessiz = false } = {}) {
        if (E.duzenlenen && !idler.includes(E.duzenlenen)) metinBitir();
        if (E.kirpilan && !idler.includes(E.kirpilan)) kirpBitir();
        E.secim = genislet ? grupGenislet(idler) : idler.slice();
        hoverCiz(null);
        secimCiz();
        if (!sessiz) KS.olay.yay("secim");
    }
    function secimTemizle() { if (E.secim.length || E.duzenlenen || E.kirpilan) sec([]); }
    function aktifSayfa(id, { kaydir = false } = {}) {
        if (!id || id === E.sayfaId) { if (kaydir) sayfayaKaydir(id); return; }
        if (E.duzenlenen) metinBitir();
        if (E.kirpilan) kirpBitir();
        E.secim = [];
        const eski = aktifP();
        E.sayfaId = id;
        if (eski) { eski.blok.classList.remove("aktif"); KS.bosalt(eski.ust); }
        aktifP()?.blok.classList.add("aktif");
        if (kaydir) sayfayaKaydir(id);
        secimCiz();
        KS.olay.yay("sayfa");
        KS.olay.yay("secim");
    }
    function sayfayaKaydir(id = E.sayfaId) {
        const p = sayfaEl.get(id);
        if (!p) return;
        const tr = tuval.getBoundingClientRect(), br = p.blok.getBoundingClientRect();
        tuval.scrollTo({ top: tuval.scrollTop + br.top - tr.top - 24, behavior: "smooth" });
    }

    // ── İşaretçi ────────────────────────────────────────────────
    let boslukBasili = false;
    function pointerDown(e) {
        if (e.button === 2) return;
        if (e.button === 1 || boslukBasili) { e.preventDefault(); kaydirBaslat(e); return; }
        if (e.button !== 0) return;
        const tut = e.target.closest("[data-tutamac]");
        if (tut) { e.preventDefault(); e.stopPropagation(); donusumBaslat(e, tut.dataset.tutamac); return; }
        if (e.target.closest(".yuzen-arac")) return;
        const blok = e.target.closest(".sayfa-blok");
        if (!blok) {
            if (e.target.closest(".sayfa-ekle-alt")) return;
            if (E.duzenlenen) metinBitir();
            secimTemizle();
            return;
        }
        if (e.target.closest(".sayfa-baslik")) { aktifSayfa(blok.dataset.sayfa); return; }
        const p = sayfaEl.get(blok.dataset.sayfa);
        const ogeEl = e.target.closest(".ks-sayfa > .o");
        if (E.duzenlenen) {
            if (ogeEl && ogeEl.dataset.id === E.duzenlenen) return; // imleç yerleştirme tarayıcıda
            metinBitir();
        }
        if (E.kirpilan) {
            if (ogeEl && ogeEl.dataset.id === E.kirpilan) { e.preventDefault(); kirpSurukle(e, p); return; }
            kirpBitir();
        }
        if (document.activeElement && document.activeElement !== document.body && !tuval.contains(document.activeElement)) document.activeElement.blur();
        aktifSayfa(p.id);
        const nokta = sayfaKoordinat(p, e.clientX, e.clientY);
        const dokunma = e.pointerType === "touch";
        if (ogeEl) {
            e.preventDefault();
            const id = ogeEl.dataset.id;
            // Dokunmatikte çift dokunuş = çift tık (metni düzenle, görseli kırp, kartı düzenle)
            if (dokunma) {
                const simdi = Date.now();
                if (sonDokunus.id === id && simdi - sonDokunus.t < 350) { sonDokunus = {}; ciftTik({ target: e.target }); return; }
                sonDokunus = { id, t: simdi };
            }
            const derin = e.ctrlKey || e.metaKey;
            if (e.shiftKey) {
                const grup = derin ? [id] : grupGenislet([id]);
                const hepsi = grup.every((g) => E.secim.includes(g));
                sec(hepsi ? E.secim.filter((x) => !grup.includes(x)) : [...E.secim, ...grup], { genislet: false });
                if (hepsi) return;
            } else if (!E.secim.includes(id)) {
                sec(derin ? [id] : [id], { genislet: !derin });
            }
            suruklemeBaslat(e, p, nokta);
            return;
        }
        // Boş alana tıklama: çoklu seçimin kutusu içindeyse onu taşı, değilse alan seçimi
        if (E.secim.length > 1) {
            const b = seciliKutu();
            if (b && nokta.x >= b.x && nokta.x <= b.x + b.w && nokta.y >= b.y && nokta.y <= b.y + b.h) { e.preventDefault(); suruklemeBaslat(e, p, nokta); return; }
        }
        if (dokunma) {
            // Parmakla boş alanda sürükleme sayfayı kaydırır (tarayıcı yapar); dokunup bırakmak seçimi kaldırır
            const x0 = e.clientX, y0 = e.clientY;
            const temizle = () => { window.removeEventListener("pointerup", birak); window.removeEventListener("pointercancel", temizle); };
            const birak = (ev) => { temizle(); if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 10) secimTemizle(); };
            window.addEventListener("pointerup", birak);
            window.addEventListener("pointercancel", temizle);
            return;
        }
        e.preventDefault();
        alanSecimBaslat(e, p, nokta);
    }
    let sonDokunus = {};

    // İki parmakla yakınlaştırma ve kaydırma (tuvalde tarayıcının kendi yakınlaştırması kapalı: touch-action)
    let tutam = null;
    const mesafe = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const orta = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
    function tutamBaslat(e) {
        if (e.touches.length !== 2) return;
        e.preventDefault();
        tutam = { d0: mesafe(e.touches[0], e.touches[1]), z0: E.zum, m: orta(e.touches[0], e.touches[1]) };
        E.tutam = true;
    }
    function tutamHareket(e) {
        if (!tutam || e.touches.length !== 2) return;
        e.preventDefault();
        const m = orta(e.touches[0], e.touches[1]);
        zumAyarla(tutam.z0 * mesafe(e.touches[0], e.touches[1]) / tutam.d0, m);
        tuval.scrollLeft -= m.x - tutam.m.x;
        tuval.scrollTop -= m.y - tutam.m.y;
        tutam.m = m;
    }
    function tutamBitir(e) {
        if (!tutam || e.touches.length >= 2) return;
        tutam = null;
        setTimeout(() => { E.tutam = false; }, 80);
    }

    function izle(e, hareket, bitis) {
        const hedef = e.target;
        try { hedef.setPointerCapture(e.pointerId); } catch (h) { /* yok say */ }
        const mv = (ev) => { if (ev.pointerId === e.pointerId) hareket(ev); };
        const up = (ev) => {
            if (ev.pointerId !== e.pointerId) return;
            window.removeEventListener("pointermove", mv);
            window.removeEventListener("pointerup", up);
            window.removeEventListener("pointercancel", up);
            bitis(ev);
        };
        window.addEventListener("pointermove", mv);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
    }

    function kaydirBaslat(e) {
        const x0 = e.clientX, y0 = e.clientY, sl = tuval.scrollLeft, st = tuval.scrollTop;
        tuval.classList.add("tasiniyor");
        izle(e, (ev) => { tuval.scrollLeft = sl - (ev.clientX - x0); tuval.scrollTop = st - (ev.clientY - y0); }, () => tuval.classList.remove("tasiniyor"));
    }

    // Yapışma hedefleri: sayfa kenarları / ortası ve diğer öğelerin kenarları / ortaları
    function yapismaHedefleri(s, haric) {
        const W = E.belge.genislik, H = E.belge.yukseklik;
        const xs = [{ v: 0 }, { v: W / 2, orta: true }, { v: W }], ys = [{ v: 0 }, { v: H / 2, orta: true }, { v: H }];
        for (const o of s.ogeler) {
            if (haric.has(o.id) || o.gizli) continue;
            const b = KS.kutu(o);
            xs.push({ v: b.x, b }, { v: b.x + b.w / 2, b }, { v: b.x + b.w, b });
            ys.push({ v: b.y, b }, { v: b.y + b.h / 2, b }, { v: b.y + b.h, b });
        }
        return { xs, ys };
    }
    function yapis(kutu, hedef, esik, eksenler = { x: [0, 0.5, 1], y: [0, 0.5, 1] }) {
        let enX = null, enY = null;
        for (const k of eksenler.x) {
            const v = kutu.x + kutu.w * k;
            for (const t of hedef.xs) { const d = t.v - v; if (Math.abs(d) <= esik && (!enX || Math.abs(d) < Math.abs(enX.d))) enX = { d, t }; }
        }
        for (const k of eksenler.y) {
            const v = kutu.y + kutu.h * k;
            for (const t of hedef.ys) { const d = t.v - v; if (Math.abs(d) <= esik && (!enY || Math.abs(d) < Math.abs(enY.d))) enY = { d, t }; }
        }
        const dx = enX ? enX.d : 0, dy = enY ? enY.d : 0;
        const son = { x: kutu.x + dx, y: kutu.y + dy, w: kutu.w, h: kutu.h };
        const cizgiler = [];
        // Aynı değere denk gelen tüm hedefler için çizgi (kutular arasında uzanan)
        if (enX) {
            const v = enX.t.v;
            let a = son.y, b = son.y + son.h;
            for (const t of hedef.xs) if (Math.abs(t.v - v) < 0.5) { if (t.b) { a = Math.min(a, t.b.y); b = Math.max(b, t.b.y + t.b.h); } else { a = 0; b = E.belge.yukseklik; } }
            cizgiler.push({ x: v, a, b });
        }
        if (enY) {
            const v = enY.t.v;
            let a = son.x, b = son.x + son.w;
            for (const t of hedef.ys) if (Math.abs(t.v - v) < 0.5) { if (t.b) { a = Math.min(a, t.b.x); b = Math.max(b, t.b.x + t.b.w); } else { a = 0; b = E.belge.genislik; } }
            cizgiler.push({ y: v, a, b });
        }
        return { dx, dy, cizgiler };
    }

    function suruklemeBaslat(e, p, nokta) {
        let secili = seciliOgeler();
        let tasinan = secili.filter((o) => !o.kilit);
        if (!tasinan.length) return;
        let baslangic = tasinan.map((o) => ({ id: o.id, x: o.x, y: o.y }));
        const bb0 = seciliKutu(tasinan);
        let hedef = yapismaHedefleri(sayfa(), new Set(E.secim));
        let oynadi = false;
        const x0 = e.clientX, y0 = e.clientY;
        izle(e, (ev) => {
            if (E.tutam) return; // iki parmakla yakınlaştırma sürerken öğe yerinde kalsın
            if (!oynadi) {
                if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < (e.pointerType === "touch" ? 8 : 4)) return;
                oynadi = true;
                E.donusum = true;
                hoverCiz(null);
                if (ev.altKey) {
                    // Alt ile sürükleme: kopyasını taşı
                    const kopyalar = ogeleriCogalt(tasinan, 0);
                    tasinan = kopyalar;
                    baslangic = kopyalar.map((o) => ({ id: o.id, x: o.x, y: o.y }));
                    hedef = yapismaHedefleri(sayfa(), new Set(E.secim));
                }
                p.blok.classList.add("suruklenen");
                document.body.style.cursor = "move";
            }
            const q = sayfaKoordinat(p, ev.clientX, ev.clientY);
            let dx = q.x - nokta.x, dy = q.y - nokta.y;
            if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
            let kilavuz = [];
            if (E.yapisma && !(ev.ctrlKey || ev.metaKey)) {
                const y = yapis({ x: bb0.x + dx, y: bb0.y + dy, w: bb0.w, h: bb0.h }, hedef, 6 / E.zum);
                dx += y.dx; dy += y.dy; kilavuz = y.cizgiler;
            }
            for (const b of baslangic) {
                const r = bul(b.id);
                if (!r) continue;
                r.oge.x = KS.yuvarla(b.x + dx, 1);
                r.oge.y = KS.yuvarla(b.y + dy, 1);
                const el = ogeElemani(b.id);
                if (el) { el.style.left = r.oge.x + "px"; el.style.top = r.oge.y + "px"; }
            }
            secimCiz({ kilavuz });
            KS.olay.yay("donusum");
        }, (ev) => {
            p.blok.classList.remove("suruklenen");
            document.body.style.cursor = "";
            E.donusum = false;
            if (!oynadi) { secimCiz({}); return; }
            // Başka sayfanın üzerine bırakıldıysa öğeleri oraya taşı
            const alt = document.elementFromPoint(ev.clientX, ev.clientY);
            const hedefBlok = alt && alt.closest && alt.closest(".sayfa-blok");
            if (hedefBlok && hedefBlok.dataset.sayfa !== p.id) sayfayaTasi(E.secim, p, sayfaEl.get(hedefBlok.dataset.sayfa));
            sayfaYenidenCiz();
            secimCiz({});
            KS.gecmis.kaydet();
            KS.olay.yay("secim");
        });
    }
    function sayfayaTasi(idler, kaynakP, hedefP) {
        const kaynak = sayfa(kaynakP.id), hedef = sayfa(hedefP.id);
        const kr = kaynakP.cerceve.getBoundingClientRect(), hr = hedefP.cerceve.getBoundingClientRect();
        const dx = (kr.left - hr.left) / E.zum, dy = (kr.top - hr.top) / E.zum;
        const tasinan = kaynak.ogeler.filter((o) => idler.includes(o.id));
        kaynak.ogeler = kaynak.ogeler.filter((o) => !idler.includes(o.id));
        for (const o of tasinan) { o.x += dx; o.y += dy; hedef.ogeler.push(o); }
        E.sayfaId = hedef.id;
        tumunuCiz();
        sec(tasinan.map((o) => o.id), { genislet: false });
        KS.olay.yay("sayfa");
    }

    function alanSecimBaslat(e, p, nokta) {
        const onceki = e.shiftKey ? E.secim.slice() : [];
        let oynadi = false;
        izle(e, (ev) => {
            const q = sayfaKoordinat(p, ev.clientX, ev.clientY);
            if (!oynadi && Math.hypot((q.x - nokta.x) * E.zum, (q.y - nokta.y) * E.zum) < 4) return;
            oynadi = true;
            const alan = { x: Math.min(q.x, nokta.x), y: Math.min(q.y, nokta.y), w: Math.abs(q.x - nokta.x), h: Math.abs(q.y - nokta.y) };
            const icerde = sayfa().ogeler.filter((o) => !o.gizli && !o.kilit && KS.kesisir(KS.kutu(o), alan)).map((o) => o.id);
            E.secim = grupGenislet([...new Set([...onceki, ...icerde])]);
            secimCiz({ alan });
        }, () => {
            if (!oynadi && !e.shiftKey) { E.secim = []; }
            secimCiz({});
            KS.olay.yay("secim");
        });
    }

    // ── Boyutlandırma / döndürme ────────────────────────────────
    const ORAN_KILITLI = new Set(["gorsel", "fiyat", "qr", "metin"]);
    function donusumBaslat(e, tur) {
        const p = aktifP();
        const ogeler = seciliOgeler().filter((o) => !o.kilit);
        if (!ogeler.length) return;
        const tek = ogeler.length === 1;
        const bas = ogeler.map((o) => KS.kopya(o));
        const bb0 = seciliKutu(ogeler);
        const nokta0 = sayfaKoordinat(p, e.clientX, e.clientY);
        const hedef = yapismaHedefleri(sayfa(), new Set(E.secim));
        E.donusum = true;
        hoverCiz(null);
        izle(e, (ev) => {
            if (E.tutam) return;
            const q = sayfaKoordinat(p, ev.clientX, ev.clientY);
            let ipucu = null, kilavuz = [];
            if (tur === "dondur") ipucu = dondur(bas, bb0, nokta0, q, ev, tek);
            else if (tek) ({ ipucu, kilavuz } = tekBoyutla(bas[0], tur, q, ev, hedef));
            else ipucu = cokluOlcekle(bas, bb0, tur, q, ev);
            sayfaYenidenCiz();
            secimCiz({ ipucu, kilavuz });
            KS.olay.yay("donusum");
        }, () => {
            E.donusum = false;
            sayfaYenidenCiz();
            secimCiz({});
            KS.gecmis.kaydet();
            KS.olay.yay("secim");
        });
    }
    function tekBoyutla(o0, t, q, ev, hedef) {
        const o = bul(o0.id).oge;
        const a = (o0.aci || 0) * KS.RAD, c = Math.cos(a), s = Math.sin(a);
        const cx0 = o0.x + o0.w / 2, cy0 = o0.y + o0.h / 2;
        const dx = q.x - cx0, dy = q.y - cy0;
        const lx = dx * c + dy * s, ly = -dx * s + dy * c;
        const hx = t.includes("e") ? 1 : t.includes("w") ? -1 : 0;
        const hy = t.includes("s") ? 1 : t.includes("n") ? -1 : 0;
        const merkezden = ev.altKey;
        const kose = hx && hy;
        let oranKilit = kose && (ORAN_KILITLI.has(o0.tur) ? !ev.shiftKey || o0.tur === "metin" : ev.shiftKey);
        if (o0.tur === "metin" && o0.egri) oranKilit = true;
        const MIN = 6;
        let w = o0.w, hh = o0.h, olcek = null;
        if (oranKilit) {
            const ax = merkezden ? 0 : -hx * o0.w / 2, ay = merkezden ? 0 : -hy * o0.h / 2;
            const Dx = hx * o0.w * (merkezden ? 0.5 : 1), Dy = hy * o0.h * (merkezden ? 0.5 : 1);
            olcek = Math.max(MIN / Math.min(o0.w, o0.h), ((lx - ax) * Dx + (ly - ay) * Dy) / (Dx * Dx + Dy * Dy));
            w = o0.w * olcek; hh = o0.h * olcek;
        } else {
            if (hx) w = Math.max(MIN, merkezden ? 2 * Math.abs(lx) : hx * lx + o0.w / 2);
            if (hy) hh = Math.max(MIN, merkezden ? 2 * Math.abs(ly) : hy * ly + o0.h / 2);
        }
        // Döndürülmemiş öğede hareket eden kenarı kılavuzlara yapıştır
        let kilavuz = [];
        if (!o0.aci && !oranKilit && E.yapisma && !(ev.ctrlKey || ev.metaKey) && !merkezden) {
            const esik = 6 / E.zum;
            const kutu = { x: hx === -1 ? o0.x + o0.w - w : o0.x, y: hy === -1 ? o0.y + o0.h - hh : o0.y, w, h: hh };
            const y = yapis(kutu, hedef, esik, { x: hx === 1 ? [1] : hx === -1 ? [0] : [], y: hy === 1 ? [1] : hy === -1 ? [0] : [] });
            if (hx === 1) w += y.dx; if (hx === -1) w -= y.dx;
            if (hy === 1) hh += y.dy; if (hy === -1) hh -= y.dy;
            kilavuz = y.cizgiler;
        }
        // Yeni merkez (yerel) → dünya
        let ncx = 0, ncy = 0;
        if (!merkezden) {
            ncx = hx ? -hx * o0.w / 2 + hx * w / 2 : 0;
            ncy = hy ? -hy * o0.h / 2 + hy * hh / 2 : 0;
            if (oranKilit && !hy) ncy = 0;
            if (oranKilit && !hx) ncx = 0;
        }
        const wx = cx0 + ncx * c - ncy * s, wy = cy0 + ncx * s + ncy * c;
        if (o0.tur === "metin" && olcek != null) {
            Object.assign(o, KS.kopya(o0));
            KS.model.olcekle(o, olcek);
        } else if (o0.tur === "metin") {
            o.w = w; // yükseklik içerikten ölçülür
            hh = o0.h;
        } else {
            o.w = w; o.h = hh;
        }
        o.w = KS.yuvarla(o.w, 1); o.h = KS.yuvarla(o.tur === "metin" ? o.h : hh, 1);
        o.x = KS.yuvarla(wx - o.w / 2, 1); o.y = KS.yuvarla(wy - (o.tur === "metin" && olcek == null ? o0.h : o.h) / 2, 1);
        if (o.tur === "metin" && olcek == null) o.y = KS.yuvarla(wy - o0.h / 2, 1);
        const ipucu = o.tur === "metin" && olcek != null ? `${Math.round(o.boyut)} pt` : `${Math.round(o.w)} × ${Math.round(o.tur === "metin" ? o.h : hh)}`;
        return { ipucu, kilavuz };
    }
    function cokluOlcekle(bas, bb0, t, q, ev) {
        const hx = t.includes("e") ? 1 : -1, hy = t.includes("s") ? 1 : -1;
        const merkezden = ev.altKey;
        const ax = merkezden ? bb0.x + bb0.w / 2 : hx === 1 ? bb0.x : bb0.x + bb0.w;
        const ay = merkezden ? bb0.y + bb0.h / 2 : hy === 1 ? bb0.y : bb0.y + bb0.h;
        const Dx = hx * bb0.w * (merkezden ? 0.5 : 1), Dy = hy * bb0.h * (merkezden ? 0.5 : 1);
        const olcek = Math.max(0.05, ((q.x - ax) * Dx + (q.y - ay) * Dy) / (Dx * Dx + Dy * Dy));
        for (const o0 of bas) {
            const o = bul(o0.id).oge;
            Object.assign(o, KS.kopya(o0));
            const cx = o0.x + o0.w / 2, cy = o0.y + o0.h / 2;
            KS.model.olcekle(o, olcek);
            const ncx = ax + (cx - ax) * olcek, ncy = ay + (cy - ay) * olcek;
            o.x = KS.yuvarla(ncx - o.w / 2, 1); o.y = KS.yuvarla(ncy - o.h / 2, 1);
        }
        return `${Math.round(bb0.w * olcek)} × ${Math.round(bb0.h * olcek)}`;
    }
    function dondur(bas, bb0, n0, q, ev, tek) {
        const cx = tek ? bas[0].x + bas[0].w / 2 : bb0.x + bb0.w / 2;
        const cy = tek ? bas[0].y + bas[0].h / 2 : bb0.y + bb0.h / 2;
        const a0 = Math.atan2(n0.y - cy, n0.x - cx), a1 = Math.atan2(q.y - cy, q.x - cx);
        let fark = (a1 - a0) / KS.RAD;
        if (tek) {
            let yeni = (bas[0].aci || 0) + fark;
            if (ev.shiftKey) yeni = Math.round(yeni / 15) * 15;
            else { const en = Math.round(yeni / 45) * 45; if (Math.abs(yeni - en) < 4) yeni = en; }
            yeni = KS.aciNormal(KS.yuvarla(yeni, 1));
            bul(bas[0].id).oge.aci = yeni;
            return `${Math.round(yeni)}°`;
        }
        if (ev.shiftKey) fark = Math.round(fark / 15) * 15;
        for (const o0 of bas) {
            const o = bul(o0.id).oge;
            const c = KS.dondur(o0.x + o0.w / 2, o0.y + o0.h / 2, cx, cy, fark);
            o.x = KS.yuvarla(c.x - o0.w / 2, 1); o.y = KS.yuvarla(c.y - o0.h / 2, 1);
            o.aci = KS.aciNormal(KS.yuvarla((o0.aci || 0) + fark, 1));
        }
        return `${Math.round(fark)}°`;
    }

    // ── Çift tıklama: metin düzenleme, kırpma ───────────────────
    function ciftTik(e) {
        const ogeEl = e.target.closest(".ks-sayfa > .o");
        if (!ogeEl) return;
        const r = bul(ogeEl.dataset.id);
        if (!r || r.oge.kilit) return;
        const o = r.oge;
        if (o.tur === "metin") { if (o.egri) KS.olay.yay("odak", "metin"); else metinDuzenle(o.id); }
        else if (o.tur === "gorsel" && o.varlik) kirpBaslat(o.id);
        else if (o.tur === "urun") { sec([o.id], { genislet: false }); KS.olay.yay("odak", "urun"); }
        else if (o.tur === "fiyat") { sec([o.id], { genislet: false }); KS.olay.yay("odak", "fiyat"); }
        else if (o.tur === "qr") { sec([o.id], { genislet: false }); KS.olay.yay("odak", "qr"); }
    }

    function metinDuzenle(id) {
        const r = bul(id);
        if (!r || r.oge.tur !== "metin" || r.oge.egri) return;
        if (E.duzenlenen === id) return;
        if (r.sayfa.id !== E.sayfaId) aktifSayfa(r.sayfa.id);
        sec([id], { genislet: false, sessiz: true });
        const o = r.oge;
        const el = ogeElemani(id);
        if (!el) return;
        E.duzenlenen = id;
        el.classList.add("duzenleniyor");
        document.body.classList.add("duzenleme-var");
        const my = el.querySelector(".m-y");
        try { my.contentEditable = "plaintext-only"; } catch (h) { my.contentEditable = "true"; }
        if (my.contentEditable !== "plaintext-only") my.contentEditable = "true";
        my.spellcheck = false;
        my.style.caretColor = "#6c47ff";
        my.focus({ preventScroll: true });
        const sec2 = window.getSelection(), aralik = document.createRange();
        aralik.selectNodeContents(my);
        sec2.removeAllRanges();
        sec2.addRange(aralik);
        const esitle = () => {
            let t = my.innerText;
            if (t.endsWith("\n") && !my.textContent.endsWith("\n")) t = t.slice(0, -1);
            o.metin = t.replace(/ /g, " ");
            for (const k of el.querySelectorAll(".m-g, .m-v span")) k.textContent = o.metin;
            metinYuksekligi(o, el.offsetHeight);
            secimCiz();
            KS.olay.yay("metin-yazildi");
        };
        const tus = (ev) => {
            ev.stopPropagation();
            if (ev.key === "Escape") { ev.preventDefault(); metinBitir(); }
        };
        const bulanik = () => setTimeout(() => { if (E.duzenlenen === id && document.activeElement !== my) metinBitir(); }, 0);
        my.addEventListener("input", esitle);
        my.addEventListener("keydown", tus);
        my.addEventListener("blur", bulanik);
        E._metin = { my, el, esitle, tus, bulanik };
        secimCiz();
        KS.olay.yay("secim");
    }
    function metinBitir(kaydet = true) {
        if (!E.duzenlenen) return;
        const id = E.duzenlenen;
        E.duzenlenen = null;
        const m = E._metin;
        E._metin = null;
        document.body.classList.remove("duzenleme-var");
        if (m) {
            m.my.removeEventListener("input", m.esitle);
            m.my.removeEventListener("keydown", m.tus);
            m.my.removeEventListener("blur", m.bulanik);
            m.my.contentEditable = "false";
            m.my.removeAttribute("contenteditable");
            m.el.classList.remove("duzenleniyor");
            m.el._imza = null;
        }
        window.getSelection()?.removeAllRanges();
        const r = bul(id);
        if (r && !r.oge.metin.trim()) {
            r.sayfa.ogeler = r.sayfa.ogeler.filter((o) => o.id !== id);
            E.secim = E.secim.filter((x) => x !== id);
        }
        tumunuCiz();
        if (kaydet) KS.gecmis.kaydet();
        KS.olay.yay("secim");
    }

    // Kırpma: görselin kadraj içindeki odağını sürükleyerek, yakınlığını tekerlekle değiştir
    function kirpBaslat(id) {
        sec([id], { genislet: false, sessiz: true });
        E.kirpilan = id;
        secimCiz();
        KS.olay.yay("secim");
        KS.bildir("Görseli sürükleyerek kadrajı ayarlayın, tekerlekle yakınlaştırın. Bitirmek için Enter.", { sure: 3500 });
    }
    function kirpBitir() {
        if (!E.kirpilan) return;
        E.kirpilan = null;
        secimCiz();
        KS.gecmis.kaydet();
        KS.olay.yay("secim");
    }
    function kirpSurukle(e, p) {
        const o = bul(E.kirpilan).oge;
        const v = KS.varlik.al(o.varlik);
        const oran = v && v.g && v.y ? v.g / v.y : 1;
        // Taşan miktar (kapla kipinde): görselin kadrajdan ne kadar büyük olduğu
        const olcek = Math.max(o.w / (oran * o.h), 1) ;
        const gw = Math.max(o.w, o.h * oran) * (o.yakin || 1), gh = Math.max(o.h, o.w / oran) * (o.yakin || 1);
        const tasX = Math.max(1, gw - o.w), tasY = Math.max(1, gh - o.h);
        const x0 = e.clientX, y0 = e.clientY, ox = o.odakX ?? 50, oy = o.odakY ?? 50;
        void olcek;
        izle(e, (ev) => {
            const dx = (ev.clientX - x0) / E.zum, dy = (ev.clientY - y0) / E.zum;
            o.odakX = KS.yuvarla(KS.sinirla(ox - dx / tasX * 100, 0, 100), 1);
            o.odakY = KS.yuvarla(KS.sinirla(oy - dy / tasY * 100, 0, 100), 1);
            sayfaYenidenCiz();
            KS.olay.yay("donusum");
        }, () => KS.gecmis.kaydetGecikmeli());
    }

    // ── Tekerlek: Ctrl ile yakınlaştırma, kırpmada görsel yakınlığı ──
    function tekerlek(e) {
        if (E.kirpilan && e.target.closest(`[data-id="${E.kirpilan}"]`)) {
            e.preventDefault();
            const o = bul(E.kirpilan).oge;
            o.yakin = KS.yuvarla(KS.sinirla((o.yakin || 1) * (e.deltaY < 0 ? 1.06 : 1 / 1.06), 1, 5), 2);
            sayfaYenidenCiz();
            KS.olay.yay("donusum");
            KS.gecmis.kaydetGecikmeli();
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const carpan = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0022));
            zumAyarla(E.zum * carpan, { x: e.clientX, y: e.clientY });
        }
    }
    function zumAyarla(z, odak) {
        z = KS.sinirla(z, 0.08, 5);
        if (!E.belge || Math.abs(z - E.zum) < 1e-4) return;
        const tr = tuval.getBoundingClientRect();
        odak = odak || { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 };
        // Odak noktasının altındaki sayfa ve o sayfadaki konumu sabit kalsın
        let p = null;
        for (const x of sayfaEl.values()) { const r = x.cerceve.getBoundingClientRect(); if (odak.y >= r.top - 20 && odak.y <= r.bottom + 20) { p = x; break; } }
        p = p || aktifP();
        const r0 = p.cerceve.getBoundingClientRect();
        const px = (odak.x - r0.left) / E.zum, py = (odak.y - r0.top) / E.zum;
        E.zum = z;
        for (const x of sayfaEl.values()) boyutla(x);
        ekleDugme.style.width = E.belge.genislik * z + "px";
        const r1 = p.cerceve.getBoundingClientRect();
        tuval.scrollLeft += r1.left + px * z - odak.x;
        tuval.scrollTop += r1.top + py * z - odak.y;
        secimCiz();
        KS.olay.yay("zum");
    }
    function sigdir(genislik = false) {
        if (!E.belge) return;
        const dar = tuval.clientWidth < 600;
        const pw = tuval.clientWidth - (dar ? 32 : 128), ph = tuval.clientHeight - (dar ? 70 : 100);
        const z = genislik ? pw / E.belge.genislik : Math.min(pw / E.belge.genislik, ph / E.belge.yukseklik);
        E.zum = KS.sinirla(z, 0.08, 5);
        for (const x of sayfaEl.values()) boyutla(x);
        ekleDugme.style.width = E.belge.genislik * E.zum + "px";
        secimCiz();
        const p = aktifP();
        if (p) {
            const tr = tuval.getBoundingClientRect(), br = p.blok.getBoundingClientRect();
            tuval.scrollTop += br.top - tr.top - 16;
            tuval.scrollLeft = (tuval.scrollWidth - tuval.clientWidth) / 2;
        }
        KS.olay.yay("zum");
    }
    function gorunurSayfa() {
        const tr = tuval.getBoundingClientRect(), orta = tr.top + tr.height * 0.4;
        let en = null, enUzak = Infinity;
        E.belge.sayfalar.forEach((s, i) => {
            const p = sayfaEl.get(s.id);
            if (!p) return;
            const r = p.cerceve.getBoundingClientRect();
            const d = orta < r.top ? r.top - orta : orta > r.bottom ? orta - r.bottom : 0;
            if (d < enUzak) { enUzak = d; en = { s, i }; }
        });
        return en;
    }
    function gorunurMerkez(p = aktifP()) {
        const tr = tuval.getBoundingClientRect(), pr = p.cerceve.getBoundingClientRect();
        const x1 = Math.max(tr.left, pr.left), x2 = Math.min(tr.right, pr.right), y1 = Math.max(tr.top, pr.top), y2 = Math.min(tr.bottom, pr.bottom);
        if (x2 - x1 < 40 || y2 - y1 < 40) return { x: E.belge.genislik / 2, y: E.belge.yukseklik / 2 };
        return { x: ((x1 + x2) / 2 - pr.left) / E.zum, y: ((y1 + y2) / 2 - pr.top) / E.zum };
    }

    // ── Öğe ekleme / silme / düzenleme ──────────────────────────
    function ekle(ogeler, { merkez, sayfaId, secilsin = true, konumla = true } = {}) {
        if (!Array.isArray(ogeler)) ogeler = [ogeler];
        if (!ogeler.length) return [];
        const s = sayfa(sayfaId || E.sayfaId) || sayfa();
        if (s.id !== E.sayfaId) aktifSayfa(s.id);
        ogeler = ogeler.map((o) => KS.model.normallestir(o));
        for (const o of ogeler) egriBoyutla(o);
        if (konumla) {
            const b = KS.kutuBirlesim(ogeler.map(KS.kutu));
            const m = merkez || gorunurMerkez(sayfaEl.get(s.id) || aktifP());
            let dx = m.x - (b.x + b.w / 2), dy = m.y - (b.y + b.h / 2);
            // Sayfanın dışına taşmasın
            const W = E.belge.genislik, H = E.belge.yukseklik;
            if (b.w < W) dx = KS.sinirla(dx, -b.x, W - b.x - b.w);
            if (b.h < H) dy = KS.sinirla(dy, -b.y, H - b.y - b.h);
            for (const o of ogeler) { o.x = KS.yuvarla(o.x + dx, 1); o.y = KS.yuvarla(o.y + dy, 1); }
        }
        s.ogeler.push(...ogeler);
        for (const o of ogeler) { const k = KS.model.fontKullanimi(o); for (const [aile, w] of k) for (const x of w) KS.fontlar.hazir(aile, x); }
        tumunuCiz();
        if (secilsin) sec(ogeler.map((o) => o.id), { genislet: false });
        KS.gecmis.kaydet();
        KS.olay.yay("eklendi", ogeler);
        return ogeler;
    }
    function sil(idler = E.secim) {
        if (!idler.length) return;
        if (E.duzenlenen) metinBitir(false);
        const kume = new Set(idler);
        for (const s of E.belge.sayfalar) s.ogeler = s.ogeler.filter((o) => !kume.has(o.id) || o.kilit && !E.secim.includes(o.id));
        E.secim = E.secim.filter((id) => bul(id));
        tumunuCiz();
        KS.gecmis.kaydet();
        KS.olay.yay("secim");
    }
    // Seçili öğelere fn uygular; ids verilirse onlara
    function degistir(fn, { idler = E.secim, gecmis = "hemen" } = {}) {
        const liste = idler.map(bul).filter(Boolean);
        for (const r of liste) {
            fn(r.oge, r.sayfa);
            if (r.oge.tur === "metin") egriBoyutla(r.oge);
        }
        const sayfalar = new Set(liste.map((r) => r.sayfa.id));
        for (const id of sayfalar) sayfaYenidenCiz(id);
        secimCiz();
        if (gecmis === "hemen") KS.gecmis.kaydet();
        else if (gecmis === "gecikmeli") KS.gecmis.kaydetGecikmeli();
        KS.olay.yay("oge-degisti");
    }
    function ogeleriCogalt(ogeler, kayma = 20) {
        const s = sayfa();
        const grupEsle = new Map();
        const kopyalar = ogeler.map((o) => {
            const k = KS.kopya(o);
            k.id = KS.kimlik("o");
            k.x += kayma; k.y += kayma;
            if (k.grup) { if (!grupEsle.has(k.grup)) grupEsle.set(k.grup, KS.kimlik("g")); k.grup = grupEsle.get(k.grup); }
            return k;
        });
        // Kopyalar, orijinallerin en üstündekinin hemen üstüne
        const enUst = Math.max(...ogeler.map((o) => s.ogeler.indexOf(o)));
        s.ogeler.splice(enUst + 1, 0, ...kopyalar);
        tumunuCiz();
        sec(kopyalar.map((o) => o.id), { genislet: false });
        return kopyalar;
    }
    function cogalt() {
        const ogeler = seciliOgeler();
        if (!ogeler.length) return;
        ogeleriCogalt(ogeler, 20);
        KS.gecmis.kaydet();
    }
    function kilitle() {
        const ogeler = seciliOgeler();
        if (!ogeler.length) return;
        const hepsi = ogeler.every((o) => o.kilit);
        degistir((o) => { o.kilit = !hepsi; });
        KS.olay.yay("secim");
    }
    function gizle(idler = E.secim) {
        degistir((o) => { o.gizli = !o.gizli; }, { idler });
    }
    function grupla() {
        const ogeler = seciliOgeler();
        if (ogeler.length < 2) return;
        const g = KS.kimlik("g");
        degistir((o) => { o.grup = g; });
        KS.olay.yay("secim");
        KS.bildir("Gruplandı");
    }
    function grupCoz() {
        const ogeler = seciliOgeler();
        if (!ogeler.some((o) => o.grup)) return;
        degistir((o) => { o.grup = null; });
        KS.olay.yay("secim");
    }
    function sirala(yon) {
        const s = sayfa();
        const sec2 = new Set(E.secim);
        if (!sec2.size) return;
        const secili = s.ogeler.filter((o) => sec2.has(o.id));
        const diger = s.ogeler.filter((o) => !sec2.has(o.id));
        if (yon === "enOne") s.ogeler = [...diger, ...secili];
        else if (yon === "enArka") s.ogeler = [...secili, ...diger];
        else {
            const liste = s.ogeler.slice();
            if (yon === "one") {
                for (let i = liste.length - 2; i >= 0; i--) if (sec2.has(liste[i].id) && !sec2.has(liste[i + 1].id)) [liste[i], liste[i + 1]] = [liste[i + 1], liste[i]];
            } else {
                for (let i = 1; i < liste.length; i++) if (sec2.has(liste[i].id) && !sec2.has(liste[i - 1].id)) [liste[i], liste[i - 1]] = [liste[i - 1], liste[i]];
            }
            s.ogeler = liste;
        }
        sayfaYenidenCiz();
        secimCiz();
        KS.gecmis.kaydet();
        KS.olay.yay("oge-degisti");
    }
    // Hizalama: tek öğe (ya da tek grup) sayfaya, çoklu seçim seçim kutusuna göre. Gruplar tek birim sayılır.
    function birimler(ogeler) {
        const m = new Map();
        for (const o of ogeler) { const k = o.grup || o.id; if (!m.has(k)) m.set(k, []); m.get(k).push(o); }
        return [...m.values()].map((liste) => ({ liste, kutu: KS.kutuBirlesim(liste.map(KS.kutu)) }));
    }
    function hizala(tur) {
        const ogeler = seciliOgeler().filter((o) => !o.kilit);
        if (!ogeler.length) return;
        const b = birimler(ogeler);
        const ref = b.length === 1 ? { x: 0, y: 0, w: E.belge.genislik, h: E.belge.yukseklik } : KS.kutuBirlesim(b.map((x) => x.kutu));
        for (const { liste, kutu } of b) {
            let dx = 0, dy = 0;
            if (tur === "sol") dx = ref.x - kutu.x;
            if (tur === "ortaY") dx = ref.x + ref.w / 2 - (kutu.x + kutu.w / 2);
            if (tur === "sag") dx = ref.x + ref.w - (kutu.x + kutu.w);
            if (tur === "ust") dy = ref.y - kutu.y;
            if (tur === "ortaD") dy = ref.y + ref.h / 2 - (kutu.y + kutu.h / 2);
            if (tur === "alt") dy = ref.y + ref.h - (kutu.y + kutu.h);
            for (const o of liste) { o.x = KS.yuvarla(o.x + dx, 1); o.y = KS.yuvarla(o.y + dy, 1); }
        }
        sayfaYenidenCiz(); secimCiz(); KS.gecmis.kaydet(); KS.olay.yay("oge-degisti");
    }
    function dagit(eksen) {
        const b = birimler(seciliOgeler().filter((o) => !o.kilit));
        if (b.length < 3) { KS.bildir("Eşit dağıtmak için en az 3 öğe seçin"); return; }
        const k = eksen === "yatay" ? "x" : "y", u = eksen === "yatay" ? "w" : "h";
        b.sort((a, c) => a.kutu[k] - c.kutu[k]);
        const bas = b[0].kutu[k], son = b[b.length - 1].kutu[k] + b[b.length - 1].kutu[u];
        const toplam = b.reduce((t, x) => t + x.kutu[u], 0);
        const aralik = (son - bas - toplam) / (b.length - 1);
        let konum = bas;
        for (const x of b) {
            const d = konum - x.kutu[k];
            for (const o of x.liste) o[k] = KS.yuvarla(o[k] + d, 1);
            konum += x.kutu[u] + aralik;
        }
        sayfaYenidenCiz(); secimCiz(); KS.gecmis.kaydet(); KS.olay.yay("oge-degisti");
    }
    function tasi(dx, dy) {
        const ogeler = seciliOgeler().filter((o) => !o.kilit);
        if (!ogeler.length) return;
        for (const o of ogeler) { o.x = KS.yuvarla(o.x + dx, 1); o.y = KS.yuvarla(o.y + dy, 1); }
        sayfaYenidenCiz(); secimCiz();
        KS.gecmis.kaydetGecikmeli();
        KS.olay.yay("donusum");
    }

    // Stil kopyala / yapıştır (biçim boyacısı)
    const STIL_DISI = new Set(["id", "tur", "x", "y", "w", "h", "aci", "metin", "grup", "kilit", "gizli", "ad", "varlik", "emoji", "veri", "urunId", "fiyat", "eski", "egriVB"]);
    let stilPanosu = null;
    function stilKopyala() {
        const o = seciliOgeler()[0];
        if (!o) return;
        const stil = {};
        for (const k in o) if (!STIL_DISI.has(k)) stil[k] = KS.kopya(o[k]);
        stilPanosu = { tur: o.tur, stil };
        KS.bildir("Stil kopyalandı — başka öğeleri seçip Ctrl+Alt+V ile uygulayın");
    }
    function stilYapistir() {
        if (!stilPanosu) return;
        let n = 0;
        degistir((o) => {
            if (o.tur !== stilPanosu.tur) {
                // Farklı türlere ortak görünüm alanları uygulanır
                for (const k of ["opak", "karisim", "golge"]) if (k in stilPanosu.stil) o[k] = KS.kopya(stilPanosu.stil[k]);
            } else Object.assign(o, KS.kopya(stilPanosu.stil));
            n++;
        });
        if (n) KS.bildir("Stil uygulandı");
    }

    // ── Sayfalar ────────────────────────────────────────────────
    function sayfaEkle(sonraId = E.sayfaId, yeni) {
        const i = E.belge.sayfalar.findIndex((s) => s.id === sonraId);
        const onceki = E.belge.sayfalar[i];
        yeni = yeni || KS.model.yeniSayfa({ arka: onceki ? KS.kopya(onceki.arka) : undefined });
        E.belge.sayfalar.splice(i + 1, 0, yeni);
        tumunuCiz();
        aktifSayfa(yeni.id, { kaydir: true });
        KS.gecmis.kaydet();
        KS.olay.yay("belge");
        return yeni;
    }
    function sayfaCogalt(id = E.sayfaId) {
        const s = sayfa(id);
        const k = KS.kopya(s);
        k.id = KS.kimlik("s");
        const grupEsle = new Map();
        for (const o of k.ogeler) {
            o.id = KS.kimlik("o");
            if (o.grup) { if (!grupEsle.has(o.grup)) grupEsle.set(o.grup, KS.kimlik("g")); o.grup = grupEsle.get(o.grup); }
        }
        return sayfaEkle(id, k);
    }
    async function sayfaSil(id = E.sayfaId) {
        const s = sayfa(id);
        if (E.belge.sayfalar.length === 1) {
            if (!s.ogeler.length) { KS.bildir("Katalogda en az bir sayfa olmalı"); return; }
            if (!(await KS.ui.onayla({ baslik: "Sayfayı temizle", metin: "Tek sayfa olduğu için sayfa silinmeyecek, içindeki tüm öğeler kaldırılacak.", evet: "Temizle", tehlike: true }))) return;
            s.ogeler = [];
            E.secim = [];
            tumunuCiz(); KS.gecmis.kaydet(); KS.olay.yay("secim");
            return;
        }
        const i = E.belge.sayfalar.indexOf(s);
        E.belge.sayfalar.splice(i, 1);
        if (E.sayfaId === id) { E.sayfaId = E.belge.sayfalar[Math.max(0, i - 1)].id; E.secim = []; }
        tumunuCiz();
        KS.gecmis.kaydet();
        KS.olay.yay("belge");
        KS.olay.yay("secim");
        KS.bildir("Sayfa silindi", { eylem: { metin: "Geri al", fn: () => KS.gecmis.geri() } });
    }
    function sayfaTasi(id, yon) {
        const l = E.belge.sayfalar, i = l.findIndex((s) => s.id === id), j = i + yon;
        if (j < 0 || j >= l.length) return;
        [l[i], l[j]] = [l[j], l[i]];
        tumunuCiz();
        KS.gecmis.kaydet();
        KS.olay.yay("belge");
        sayfayaKaydir(id);
    }

    // ── Pano ────────────────────────────────────────────────────
    let yapistirmaSayaci = 0;
    function panoVerisi() {
        const ogeler = seciliOgeler();
        return ogeler.length ? { sayfaId: E.sayfaId, ogeler: KS.kopya(ogeler) } : null;
    }
    function panoOlay(e, tur) {
        if (girdiOdakta() || !E.secim.length || KS.ui.acikMi()) return;
        const veri = panoVerisi();
        if (!veri) return;
        e.preventDefault();
        e.clipboardData.setData("text/plain", PANO_ONEK + JSON.stringify(veri));
        E.pano = veri;
        yapistirmaSayaci = 0;
        if (tur === "kes") sil();
        else KS.bildir(veri.ogeler.length > 1 ? `${veri.ogeler.length} öğe kopyalandı` : "Kopyalandı");
    }
    function yapistirOlay(e) {
        if (girdiOdakta() || document.querySelector("dialog[open]")) return;
        const dosyalar = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith("image/"));
        if (dosyalar.length) { e.preventDefault(); gorselDosyalariEkle(dosyalar); return; }
        const metin = e.clipboardData?.getData("text/plain") || "";
        if (metin.startsWith(PANO_ONEK)) {
            e.preventDefault();
            try { yapistir(JSON.parse(metin.slice(PANO_ONEK.length))); } catch (h) { /* bozuk */ }
            return;
        }
        if (metin.trim()) {
            e.preventDefault();
            const s = seciliOgeler();
            if (s.length === 1 && s[0].tur === "metin") { degistir((o) => { o.metin = metin; }); return; }
            ekle(KS.model.yeni("metin", { w: Math.min(E.belge.genislik * 0.7, 520), metin: metin.trim(), boyut: 28, font: "Inter", kalin: 500 }));
        }
    }
    function yapistir(veri = E.pano) {
        if (!veri || !veri.ogeler || !veri.ogeler.length) return;
        yapistirmaSayaci++;
        const ayniSayfa = veri.sayfaId === E.sayfaId;
        const kayma = ayniSayfa ? 20 * yapistirmaSayaci : 0;
        const grupEsle = new Map();
        const ogeler = veri.ogeler.map((o) => {
            const k = KS.kopya(o);
            k.id = KS.kimlik("o");
            k.x += kayma; k.y += kayma;
            if (k.grup) { if (!grupEsle.has(k.grup)) grupEsle.set(k.grup, KS.kimlik("g")); k.grup = grupEsle.get(k.grup); }
            return k;
        });
        ekle(ogeler, { konumla: false });
    }

    // ── Görsel dosyaları ────────────────────────────────────────
    async function gorselDosyalariEkle(dosyalar, { merkez, sayfaId, hedefId } = {}) {
        dosyalar = dosyalar.filter((f) => f.type.startsWith("image/"));
        if (!dosyalar.length) return;
        const kapat = KS.bildir(dosyalar.length > 1 ? `${dosyalar.length} görsel yükleniyor…` : "Görsel yükleniyor…", { sure: 60000 });
        try {
            const sonuc = [];
            for (const f of dosyalar) sonuc.push(await KS.varlik.dosyadan(f));
            if (hedefId && sonuc.length === 1 && gorselDegistir(hedefId, sonuc[0])) return;
            const W = E.belge.genislik, H = E.belge.yukseklik;
            const ogeler = sonuc.map((v, i) => {
                const olcek = Math.min((W * 0.45) / v.g, (H * 0.45) / v.y, 1.2);
                return KS.model.yeni("gorsel", { varlik: v.id, w: KS.yuvarla(v.g * olcek, 1), h: KS.yuvarla(v.y * olcek, 1), x: i * 24, y: i * 24, sigdir: "kapla" });
            });
            ekle(ogeler, { merkez, sayfaId });
        } catch (h) {
            KS.bildir("Görsel eklenemedi: " + h.message, { tur: "hata" });
        } finally { kapat(); }
    }
    // Görsel ya da ürün kartının resmini değiştirir
    function gorselDegistir(hedefId, v) {
        const r = bul(hedefId);
        if (!r) return false;
        const o = r.oge;
        if (o.tur === "gorsel") {
            o.varlik = v.id; o.emoji = null; o.odakX = 50; o.odakY = 50; o.yakin = 1;
        } else if (o.tur === "urun") {
            o.veri.gorsel = { varlik: v.id, emoji: null };
            if (o.urunId) {
                const u = E.belge.urunler.find((x) => x.id === o.urunId);
                if (u) { u.gorsel = { varlik: v.id, emoji: null }; urunKartlariniEsitle(u); }
            }
        } else return false;
        tumunuCiz();
        sec([hedefId], { genislet: false });
        KS.gecmis.kaydet();
        KS.olay.yay("urunler");
        KS.bildir("Görsel değiştirildi", { tur: "basari" });
        return true;
    }

    // ── Ürün kartları ile ürün listesi eşitleme ─────────────────
    function urunKartlariniEsitle(u) {
        for (const s of E.belge.sayfalar) for (const o of s.ogeler) {
            if (o.tur === "urun" && o.urunId === u.id) {
                Object.assign(o.veri, { ad: u.ad, aciklama: u.aciklama, fiyat: u.fiyat, eski: u.eski, birim: u.birim, kategori: u.kategori, rozet: u.rozet || "", gorsel: KS.kopya(u.gorsel) });
            }
        }
    }

    // ── Sürükle-bırak (panelden ve dosyadan) ────────────────────
    let birakEl = null;
    function birakHedef(el) {
        if (birakEl === el) return;
        if (birakEl) birakEl.classList.remove("birak-hedef");
        birakEl = el;
        if (el) el.classList.add("birak-hedef");
    }
    function suruklemeUzerinde(e) {
        const turler = [...e.dataTransfer.types];
        const dosya = turler.includes("Files"), ks = turler.includes("application/x-ks");
        if (!dosya && !ks) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        const ogeEl = e.target.closest && e.target.closest(".ks-sayfa > .o");
        const s = KS.surukleme;
        const uygun = ogeEl && (s === "urun" ? ogeEl.classList.contains("o-urun")
            : (dosya || s === "varlik") && (ogeEl.classList.contains("o-gorsel") || ogeEl.classList.contains("o-urun")));
        birakHedef(uygun ? ogeEl : null);
    }
    // Karttaki ürünü listedeki başka bir ürünle değiştirir (stil, boyut ve konum korunur)
    function urunDegistir(kartId, urunId) {
        const r = bul(kartId), u = E.belge.urunler.find((x) => x.id === urunId);
        if (!r || !u || r.oge.tur !== "urun") return false;
        r.oge.urunId = u.id;
        r.oge.veri = KS.sablon.urunVeri(u);
        sayfaYenidenCiz(r.sayfa.id);
        sec([kartId], { genislet: false });
        KS.gecmis.kaydet();
        KS.bildir(`Kart "${u.ad}" ile değiştirildi`, { tur: "basari" });
        return true;
    }
    function birak(e) {
        birakHedef(null);
        const blok = e.target.closest && e.target.closest(".sayfa-blok");
        const veriMetni = e.dataTransfer.getData("application/x-ks");
        const dosyalar = [...e.dataTransfer.files];
        if (!veriMetni && !dosyalar.length) return;
        e.preventDefault();
        if (!blok) { KS.bildir("Bir sayfanın üzerine bırakın"); return; }
        const p = sayfaEl.get(blok.dataset.sayfa);
        aktifSayfa(p.id);
        const merkez = sayfaKoordinat(p, e.clientX, e.clientY);
        const ogeEl = e.target.closest(".ks-sayfa > .o");
        const hedefId = ogeEl && (ogeEl.classList.contains("o-gorsel") || ogeEl.classList.contains("o-urun")) ? ogeEl.dataset.id : null;
        if (dosyalar.length) { gorselDosyalariEkle(dosyalar, { merkez, sayfaId: p.id, hedefId }); return; }
        let veri;
        try { veri = JSON.parse(veriMetni); } catch (h) { return; }
        if (veri.varlik && hedefId && gorselDegistir(hedefId, { id: veri.varlik })) return;
        if (veri.urunId && ogeEl && ogeEl.classList.contains("o-urun") && urunDegistir(ogeEl.dataset.id, veri.urunId)) return;
        KS.olay.yay("birakildi", veri, { merkez, sayfaId: p.id });
    }

    // ── Sağ tık menüsü ──────────────────────────────────────────
    function sagTik(e) {
        const blok = e.target.closest(".sayfa-blok");
        if (!blok || e.target.closest(".sayfa-baslik")) return;
        e.preventDefault();
        if (E.duzenlenen) return;
        const p = sayfaEl.get(blok.dataset.sayfa);
        aktifSayfa(p.id);
        const ogeEl = e.target.closest(".ks-sayfa > .o");
        if (ogeEl && !E.secim.includes(ogeEl.dataset.id)) sec([ogeEl.dataset.id]);
        if (!ogeEl && E.secim.length) sec([]);
        baglamMenusu({ x: e.clientX, y: e.clientY });
    }
    function baglamMenusu(capa) {
        const ogeler = seciliOgeler();
        const var_ = ogeler.length > 0;
        const tek = ogeler.length === 1 ? ogeler[0] : null;
        const kilitli = var_ && ogeler.every((o) => o.kilit);
        const liste = var_ ? [
            { ikon: "kopyala", etiket: "Kopyala", kisayol: "Ctrl+C", fn: () => { E.pano = panoVerisi(); yapistirmaSayaci = 0; KS.bildir("Kopyalandı"); } },
            { ikon: "dosya", etiket: "Yapıştır", kisayol: "Ctrl+V", pasif: !E.pano, fn: () => yapistir() },
            { ikon: "kopyala", etiket: "Çoğalt", kisayol: "Ctrl+D", fn: cogalt },
            { ikon: "sil", etiket: "Sil", kisayol: "Del", tehlike: true, fn: () => sil() },
            "-",
            { ikon: "firca", etiket: "Stili kopyala", kisayol: "Ctrl+Alt+C", pasif: !tek, fn: stilKopyala },
            { ikon: "firca", etiket: "Stili yapıştır", kisayol: "Ctrl+Alt+V", pasif: !stilPanosu, fn: stilYapistir },
            "-",
            { ikon: "enOne", etiket: "En öne getir", kisayol: "Ctrl+Shift+]", fn: () => sirala("enOne") },
            { ikon: "oneGetir", etiket: "Bir öne", kisayol: "Ctrl+]", fn: () => sirala("one") },
            { ikon: "arkayaGonder", etiket: "Bir arkaya", kisayol: "Ctrl+[", fn: () => sirala("arka") },
            { ikon: "enArka", etiket: "En arkaya gönder", kisayol: "Ctrl+Shift+[", fn: () => sirala("enArka") },
            "-",
            ogeler.length > 1 && !ogeler.every((o) => o.grup && o.grup === ogeler[0].grup) ? { ikon: "grup", etiket: "Grupla", kisayol: "Ctrl+G", fn: grupla } : null,
            ogeler.some((o) => o.grup) ? { ikon: "grupCoz", etiket: "Grubu çöz", kisayol: "Ctrl+Shift+G", fn: grupCoz } : null,
            { ikon: kilitli ? "kilitAcik" : "kilit", etiket: kilitli ? "Kilidi aç" : "Kilitle", kisayol: "Ctrl+Shift+L", fn: kilitle },
            tek && tek.tur === "urun" ? { ikon: "ayristir", etiket: "Serbest öğelere ayır", fn: () => KS.olay.yay("ayristir", tek.id) } : null,
            tek && tek.tur === "gorsel" && tek.varlik ? { ikon: "arkaplan", etiket: "Sayfa arka planı yap", fn: () => KS.olay.yay("arkaplan-yap", tek.id) } : null
        ] : [
            { ikon: "dosya", etiket: "Yapıştır", kisayol: "Ctrl+V", pasif: !E.pano, fn: () => yapistir() },
            { ikon: "izgara", etiket: "Tümünü seç", kisayol: "Ctrl+A", fn: tumunuSec },
            "-",
            { ikon: "sayfaEkle", etiket: "Sayfa ekle", fn: () => sayfaEkle() },
            { ikon: "kopyala", etiket: "Sayfayı çoğalt", fn: () => sayfaCogalt() },
            { ikon: "sil", etiket: "Sayfayı sil", tehlike: true, fn: () => sayfaSil() }
        ];
        KS.ui.menu(liste, capa, { yer: "alt", odak: false });
    }
    function tumunuSec() {
        const s = sayfa();
        sec(s.ogeler.filter((o) => !o.gizli && !o.kilit).map((o) => o.id), { genislet: false });
    }

    // ── Klavye ──────────────────────────────────────────────────
    function tusBasildi(e) {
        if (e.key === " " && !girdiOdakta() && !boslukBasili) {
            if (e.target === document.body || tuval.contains(e.target)) { e.preventDefault(); boslukBasili = true; tuval.classList.add("bosluk-basili"); }
            return;
        }
        if (girdiOdakta() || document.querySelector("dialog[open]") || document.querySelector(".onizleme-kap")) return;
        if (KS.ui.acikMi()) return;
        const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase(), kod = e.code;
        const yap = (fn) => { e.preventDefault(); fn(); };
        if (ctrl && !e.altKey && k === "z" && !e.shiftKey) return yap(() => KS.gecmis.geri());
        if (ctrl && ((k === "z" && e.shiftKey) || k === "y")) return yap(() => KS.gecmis.ileri());
        if (ctrl && k === "d") return yap(cogalt);
        if (ctrl && k === "a") return yap(tumunuSec);
        if (ctrl && k === "g" && !e.shiftKey) return yap(grupla);
        if (ctrl && k === "g" && e.shiftKey) return yap(grupCoz);
        if (ctrl && e.shiftKey && k === "l") return yap(kilitle);
        if (ctrl && e.altKey && kod === "KeyC") return yap(stilKopyala);
        if (ctrl && e.altKey && kod === "KeyV") return yap(stilYapistir);
        if (ctrl && kod === "BracketRight") return yap(() => sirala(e.shiftKey ? "enOne" : "one"));
        if (ctrl && kod === "BracketLeft") return yap(() => sirala(e.shiftKey ? "enArka" : "arka"));
        if (ctrl && (k === "+" || k === "=" || kod === "NumpadAdd")) return yap(() => zumAyarla(E.zum * 1.2));
        if (ctrl && (k === "-" || kod === "NumpadSubtract")) return yap(() => zumAyarla(E.zum / 1.2));
        if (ctrl && (k === "0" || kod === "Numpad0")) return yap(() => sigdir());
        if (ctrl && k === "s") return yap(() => KS.olay.yay("kaydet-iste"));
        if (ctrl && k === "p") return yap(() => KS.olay.yay("yazdir-iste"));
        if (k === "delete" || k === "backspace") { if (E.secim.length) yap(() => sil()); return; }
        if (k === "escape") {
            if (E.kirpilan) return yap(kirpBitir);
            if (E.secim.length) return yap(() => sec([]));
            return;
        }
        if (k === "enter") {
            if (E.kirpilan) return yap(kirpBitir);
            const s = seciliOgeler();
            if (s.length === 1 && s[0].tur === "metin" && !s[0].egri && !s[0].kilit) return yap(() => metinDuzenle(s[0].id));
            return;
        }
        if (k.startsWith("arrow")) {
            if (!E.secim.length) {
                if (k === "arrowdown" || k === "arrowright") return yap(() => sayfaGec(1));
                if (k === "arrowup" || k === "arrowleft") return yap(() => sayfaGec(-1));
                return;
            }
            const d = e.shiftKey ? 10 : 1;
            return yap(() => tasi(k === "arrowleft" ? -d : k === "arrowright" ? d : 0, k === "arrowup" ? -d : k === "arrowdown" ? d : 0));
        }
        if (k === "pagedown") return yap(() => sayfaGec(1));
        if (k === "pageup") return yap(() => sayfaGec(-1));
        if (!ctrl && !e.altKey) {
            if (k === "t") return yap(() => KS.olay.yay("hizli-ekle", "metin"));
            if (k === "r") return yap(() => KS.olay.yay("hizli-ekle", "dikdortgen"));
            if (k === "o") return yap(() => KS.olay.yay("hizli-ekle", "elips"));
            if (k === "l") return yap(() => KS.olay.yay("hizli-ekle", "cizgi"));
            if (k === "?" || e.key === "F1") return yap(() => KS.olay.yay("kisayollar"));
        }
    }
    function tusBirakildi(e) {
        if (e.key === " ") { boslukBasili = false; tuval.classList.remove("bosluk-basili"); }
    }
    function sayfaGec(yon) {
        const l = E.belge.sayfalar, i = l.findIndex((s) => s.id === E.sayfaId);
        const j = KS.sinirla(i + yon, 0, l.length - 1);
        if (j !== i) aktifSayfa(l[j].id, { kaydir: true });
    }

    // ── Belge renkleri ve yazı tipleri ──────────────────────────
    function belgeRenkleri() {
        if (!E.belge) return [];
        const sayim = new Map();
        const say = (r) => {
            if (!r || typeof r !== "string") return;
            const c = KS.renkCoz(r);
            if (c.a === 0) return;
            const hx = KS.renkHex(c);
            sayim.set(hx, (sayim.get(hx) || 0) + 1);
        };
        for (const s of E.belge.sayfalar) {
            KS.dolguRenkleri(s.arka.dolgu).forEach(say);
            for (const o of s.ogeler) KS.model.renkleriGez(o, (r) => { say(r); });
        }
        return [...sayim.entries()].sort((a, b) => b[1] - a[1]).map(([r]) => r);
    }
    function renkDegistirHepsi(eski, yeni) {
        const hedef = KS.renkNormal(eski);
        const eslesir = (r) => typeof r === "string" && KS.renkNormal(r) === hedef;
        let n = 0;
        for (const s of E.belge.sayfalar) {
            const d = s.arka;
            if (eslesir(d.dolgu)) { d.dolgu = yeni; n++; }
            else if (d.dolgu && typeof d.dolgu === "object") {
                if (d.dolgu.tip === "isin") { if (eslesir(d.dolgu.renk1)) { d.dolgu.renk1 = yeni; n++; } if (eslesir(d.dolgu.renk2)) { d.dolgu.renk2 = yeni; n++; } }
                else for (const st of d.dolgu.duraklar || []) if (eslesir(st.r)) { st.r = yeni; n++; }
            }
            for (const o of s.ogeler) KS.model.renkleriGez(o, (r) => { if (eslesir(r)) { n++; return yeni; } return undefined; });
        }
        tumunuCiz();
        KS.gecmis.kaydet();
        return n;
    }
    function belgeFontlari() {
        if (!E.belge) return [];
        const m = new Map();
        for (const s of E.belge.sayfalar) for (const o of s.ogeler) KS.model.fontKullanimi(o, m);
        return [...m.keys()];
    }

    KS.editor = {
        baslat, belgeYukle, tumunuCiz, sayfaYenidenCiz, secimCiz, sec, secimTemizle, aktifSayfa, sayfayaKaydir,
        seciliOgeler, sayfa, bul, ogeElemani, ekle, sil, degistir, cogalt, kilitle, gizle, grupla, grupCoz, sirala, hizala, dagit,
        metinDuzenle, metinBitir, kirpBaslat, kirpBitir, zumAyarla, sigdir, gorunurSayfa, gorunurMerkez,
        sayfaEkle, sayfaCogalt, sayfaSil, sayfaTasi, yapistir, gorselDosyalariEkle, gorselDegistir, urunKartlariniEsitle,
        belgeRenkleri, renkDegistirHepsi, belgeFontlari, egriBoyutla, stilKopyala, stilYapistir, baglamMenusu, tumunuSec,
        urunAlani: (a) => { urunAlaniGoster = a; secimCiz(); },
        sayfaElemani: (id = E.sayfaId) => sayfaEl.get(id),
        tuval: () => tuval
    };
})();
