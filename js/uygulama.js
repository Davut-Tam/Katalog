// Uygulama: başlangıç, üst çubuk (dosya / boyut menüsü, geri al, belge adı, kayıt durumu), alt çubuk
// (sayfa göstergesi, yakınlaştırma), otomatik kayıt, yeni katalog ve projelerim pencereleri, kısayol listesi.
(function () {
    "use strict";
    const KS = window.KS;
    const { h, $ } = KS;
    const E = KS.E;

    // ── Tema ────────────────────────────────────────────────────
    function temaUygula(t) {
        if (t) document.documentElement.dataset.tema = t; else delete document.documentElement.dataset.tema;
        const koyu = t ? t === "koyu" : matchMedia("(prefers-color-scheme: dark)").matches;
        $("#temaDugme").replaceChildren(KS.ikon(koyu ? "gunes" : "ay", 19));
    }
    function temaDegistir() {
        const simdi = document.documentElement.dataset.tema || (matchMedia("(prefers-color-scheme: dark)").matches ? "koyu" : "acik");
        const yeni = simdi === "koyu" ? "acik" : "koyu";
        try { localStorage.setItem("ks-tema", yeni); } catch (h) { /* yok say */ }
        temaUygula(yeni);
    }

    // ── Otomatik kayıt ──────────────────────────────────────────
    let kayitBekliyor = false;
    function durumGoster(tur) {
        const el = $("#kayitDurumu");
        el.classList.toggle("bekliyor", tur !== "tamam");
        el.replaceChildren(KS.ikon(tur === "tamam" ? "tamam" : tur === "hata" ? "uyari" : "yenile", 14),
            tur === "tamam" ? "Kaydedildi" : tur === "hata" ? "Kaydedilemedi" : "Kaydediliyor…");
        el.title = tur === "tamam" ? "Değişiklikler bu tarayıcıda otomatik kaydedilir" : "";
    }
    const kaydet = KS.gecikmeli(async () => {
        if (!E.belge) return;
        try { await KS.depo.kaydet(E.belge); kayitBekliyor = false; durumGoster("tamam"); }
        catch (h) { console.error(h); durumGoster("hata"); }
    }, 700);
    function degisti() { kayitBekliyor = true; durumGoster("bekliyor"); kaydet(); }

    // ── Belge yükleme ───────────────────────────────────────────
    function belgeAc(belge) {
        KS.editor.belgeYukle(belge);
        $("#belgeAdi").value = E.belge.ad;
        document.title = `${E.belge.ad} — Katalog Stüdyo`;
        KS.depo.kaydet(E.belge).catch(() => {});
        durumGoster("tamam");
    }
    // Şablondan yeni belge
    function sablondanBelge(sablon, { urunler, ad } = {}) {
        const marka = KS.model.markaVarsayilan();
        const kaynak = urunler || KS.ornekUrunler();
        const { sayfalar, urunler: kullanilan } = KS.sablon.uret(sablon, { marka, urunKaynak: kaynak });
        const belge = KS.model.yeniBelge({ ad: ad || sablon.ad, genislik: sablon.boyut.g, yukseklik: sablon.boyut.y });
        belge.urunler = kaynak.slice();
        belge.sayfalar = sayfalar;
        KS.sablon.urunleriBelgeyeKat(belge, sayfalar, kullanilan);
        return belge;
    }
    KS.uygulama = { belgeAc, sablondanBelge, yeniKatalogPenceresi, projelerPenceresi, kisayollarPenceresi, boyutDegistir };

    // ── Dosya menüsü ────────────────────────────────────────────
    function dosyaMenusu(capa) {
        KS.ui.menu([
            { ikon: "sayfaEkle", etiket: "Yeni katalog…", fn: yeniKatalogPenceresi },
            { ikon: "klasor", etiket: "Projelerim…", fn: projelerPenceresi },
            { ikon: "sablon", etiket: "Şablondan başla", fn: () => KS.paneller && KS.paneller.ac("sablonlar") },
            { ikon: "kopyala", etiket: "Kopyasını oluştur", fn: kopyaOlustur },
            { ikon: "kalem", etiket: "Yeniden adlandır…", fn: async () => { const ad = await KS.ui.sor({ baslik: "Kataloğu adlandır", deger: E.belge.ad }); if (ad && ad.trim()) { E.belge.ad = ad.trim(); $("#belgeAdi").value = E.belge.ad; document.title = `${E.belge.ad} — Katalog Stüdyo`; KS.gecmis.kaydet(); } } },
            { ikon: "sigdir", etiket: "Sayfa boyutu…", fn: () => setTimeout(() => boyutMenusu(capa), 0) },
            "-",
            { ikon: "kaydet", etiket: "Proje dosyasını indir (.katalog)", fn: projeDosyasiIndir },
            { ikon: "dosya", etiket: "Proje dosyası aç…", fn: projeDosyasiAc },
            "-",
            { ikon: "indir", etiket: "Dışa aktar…", kisayol: "Ctrl+E", fn: () => KS.disaaktar && KS.disaaktar.pencere() },
            { ikon: "yazdir", etiket: "Yazdır / PDF olarak kaydet", kisayol: "Ctrl+P", fn: () => KS.disaaktar && KS.disaaktar.yazdir() },
            "-",
            { ikon: document.documentElement.dataset.tema === "koyu" || (!document.documentElement.dataset.tema && matchMedia("(prefers-color-scheme: dark)").matches) ? "gunes" : "ay", etiket: "Açık / koyu tema", fn: temaDegistir },
            KS.mobil() ? null : { ikon: "klavye", etiket: "Klavye kısayolları", kisayol: "?", fn: kisayollarPenceresi }
        ], capa);
    }
    async function kopyaOlustur() {
        const k = KS.kopya(E.belge);
        k.id = KS.kimlik("b");
        k.ad = E.belge.ad + " (kopya)";
        await KS.depo.kaydet(E.belge);
        belgeAc(k);
        KS.bildir("Kopya oluşturuldu ve açıldı", { tur: "basari" });
    }
    async function projeDosyasiIndir() {
        const kapat = KS.bildir("Proje dosyası hazırlanıyor…", { sure: 30000 });
        try {
            const blob = await KS.depo.dosyaOlustur(E.belge);
            KS.indir(blob, KS.dosyaAdi(E.belge.ad) + ".katalog");
        } finally { kapat(); }
    }
    async function projeDosyasiAc() {
        const [dosya] = await KS.dosyaSec({ kabul: ".katalog,.json,application/json" });
        if (!dosya) return;
        try {
            await KS.depo.kaydet(E.belge);
            belgeAc(await KS.depo.dosyaOku(dosya));
            KS.bildir("Proje açıldı", { tur: "basari" });
        } catch (h) { KS.bildir(h.message || "Dosya açılamadı", { tur: "hata", sure: 4000 }); }
    }

    // ── Boyut menüsü ────────────────────────────────────────────
    function boyutMenusu(capa) {
        const b = E.belge;
        const ogeler = [];
        let grup = "";
        for (const s of KS.BOYUTLAR) {
            if (s.grup !== grup) { grup = s.grup; ogeler.push({ baslik: grup }); }
            const secili = s.g === b.genislik && s.y === b.yukseklik;
            ogeler.push({ ikon: secili ? "tamam" : null, etiket: `${s.ad}  ·  ${s.not}`, fn: () => boyutDegistir(s.g, s.y) });
        }
        ogeler.push("-", { ikon: "ayar", etiket: "Özel boyut…", fn: ozelBoyut });
        KS.ui.menu(ogeler, capa);
    }
    async function ozelBoyut() {
        const b = E.belge;
        let birim = "mm";
        const g = KS.ui.sayi({ on: "G", deger: KS.pxMm(b.genislik), min: 10, max: 5000, degisti: () => {} });
        const y = KS.ui.sayi({ on: "Y", deger: KS.pxMm(b.yukseklik), min: 10, max: 5000, degisti: () => {} });
        const birimSec = KS.ui.bolumlu({
            secenekler: [{ deger: "mm", etiket: "mm" }, { deger: "px", etiket: "piksel" }], deger: birim,
            degisti: (v) => {
                const gv = parseFloat(g.girdi.value.replace(",", ".")), yv = parseFloat(y.girdi.value.replace(",", "."));
                if (v === "px" && birim === "mm") { g.yenile(KS.mmPx(gv)); y.yenile(KS.mmPx(yv)); }
                if (v === "mm" && birim === "px") { g.yenile(KS.pxMm(gv)); y.yenile(KS.pxMm(yv)); }
                birim = v;
            }
        });
        const olcekle = KS.ui.anahtar({ deger: true, degisti: () => {} });
        KS.ui.pencere({
            baslik: "Özel boyut", sinif: "dar",
            icerik: h("div", { style: { display: "grid", gap: "12px" } },
                birimSec.el, h("div.izgara-2", g.el, y.el),
                h("label.alan", h("span.etiket", "İçeriği ölçekle"), olcekle.el)),
            dugmeler: [{ etiket: "Vazgeç" }, {
                etiket: "Uygula", birincil: true, fn: () => {
                    let gv = parseFloat(g.girdi.value.replace(",", ".")), yv = parseFloat(y.girdi.value.replace(",", "."));
                    if (birim === "mm") { gv = KS.mmPx(gv); yv = KS.mmPx(yv); }
                    boyutDegistir(Math.round(gv), Math.round(yv), olcekle.el.getAttribute("aria-checked") === "true");
                }
            }]
        });
    }
    function boyutDegistir(g, y, olcekle = true) {
        const b = E.belge;
        if (g === b.genislik && y === b.yukseklik) return;
        if (olcekle) for (const s of b.sayfalar) KS.sablon.sayfayiUyarla(s, b.genislik, b.yukseklik, g, y);
        b.genislik = g; b.yukseklik = y;
        KS.editor.egriBoyutla && b.sayfalar.forEach((s) => s.ogeler.forEach(KS.editor.egriBoyutla));
        KS.editor.tumunuCiz();
        KS.editor.sigdir();
        KS.gecmis.kaydet();
        KS.olay.yay("belge");
        KS.bildir(`Boyut ${g} × ${y} px olarak değiştirildi`);
    }

    // ── Yeni katalog ────────────────────────────────────────────
    function yeniKatalogPenceresi() {
        let secili = KS.BOYUTLAR[0], ornek = true, sablonId = null;
        const kartlar = h("div.secenek-kartlar");
        const ciz = () => {
            kartlar.replaceChildren(...KS.BOYUTLAR.map((s) => {
                const oran = s.g / s.y, gw = oran >= 1 ? 30 : 30 * oran, gh = oran >= 1 ? 30 / oran : 30;
                const b = h("button.secenek-kart", { type: "button", "aria-pressed": String(s === secili) },
                    h("span.ikon-kutu", h("span", { style: { width: gw + "px", height: gh + "px", border: "2px solid currentColor", borderRadius: "3px", display: "block" } })),
                    h("b", s.ad), h("small", `${s.grup} · ${s.not}`));
                b.addEventListener("click", () => { secili = s; ciz(); sablonlariCiz(); });
                return b;
            }));
        };
        const sablonKap = h("div.izgara.s4", { style: { marginTop: "6px" } });
        function sablonlariCiz() {
            const uygun = KS.SABLONLAR.filter((t) => t.boyut.g === secili.g && t.boyut.y === secili.y);
            if (!uygun.some((t) => t.id === sablonId)) sablonId = null;
            const bos = h("button.sablon-kart", { type: "button" },
                h("div.onizleme", { style: { aspectRatio: `${secili.g} / ${secili.y}`, display: "grid", placeItems: "center", color: "var(--yazi-3)", boxShadow: sablonId === null ? "0 0 0 2px var(--vurgu)" : "" } }, KS.ikon("arti", 26)),
                h("span.ad", "Boş sayfa"));
            bos.addEventListener("click", () => { sablonId = null; sablonlariCiz(); });
            const liste = uygun.map((t) => {
                const k = h("button.sablon-kart", { type: "button" }, h("div.onizleme", { style: { boxShadow: sablonId === t.id ? "0 0 0 2px var(--vurgu)" : "" } }, sablonOnizleme(t, 150)), h("span.ad", t.ad));
                k.addEventListener("click", () => { sablonId = t.id; sablonlariCiz(); });
                return k;
            });
            sablonKap.replaceChildren(bos, ...liste);
        }
        ciz();
        sablonlariCiz();
        const ad = h("input.girdi", { value: "Yeni katalog", style: { height: "38px" } });
        const ornekA = KS.ui.anahtar({ deger: ornek, degisti: (v) => { ornek = v; } });
        KS.ui.pencere({
            baslik: "Yeni katalog", aciklama: "Bir boyut seçin; isterseniz hazır bir şablonla başlayın.", sinif: "genis",
            icerik: h("div",
                h("label.form-alan", { style: { marginBottom: "16px" } }, "Katalog adı", ad),
                h("div.bolum-baslik", "Boyut"), kartlar,
                h("div.bolum-baslik", "Başlangıç"), sablonKap,
                h("label.alan", { style: { marginTop: "16px", gridTemplateColumns: "1fr auto" } }, h("span.etiket", "Örnek market ürünlerini ürün listesine ekle"), ornekA.el)),
            dugmeler: [{ etiket: "Vazgeç" }, {
                etiket: "Oluştur", birincil: true, ikon: "tamam", fn: async () => {
                    await KS.depo.kaydet(E.belge).catch(() => {});
                    const sablon = KS.SABLONLAR.find((t) => t.id === sablonId);
                    let belge;
                    if (sablon) belge = sablondanBelge(sablon, { ad: ad.value || sablon.ad, urunler: ornek ? undefined : [] });
                    else {
                        belge = KS.model.yeniBelge({ ad: ad.value || "Yeni katalog", genislik: secili.g, yukseklik: secili.y });
                        if (ornek) belge.urunler = KS.ornekUrunler();
                    }
                    belgeAc(belge);
                    if (!sablon && KS.paneller) KS.paneller.ac("sablonlar");
                }
            }]
        });
    }
    function sablonOnizleme(t, genislik) {
        const { sayfalar } = KS.sablon.uret(t, { marka: E.belge ? E.belge.marka : undefined });
        // Önizlemedeki yazılar doğru fontla görünsün (yüklenince küçük resim kendiliğinden güncellenir)
        const kullanim = new Map();
        for (const o of sayfalar[0].ogeler) KS.model.fontKullanimi(o, kullanim);
        for (const [aile, w] of kullanim) for (const x of w) KS.fontlar.hazir(aile, x);
        return KS.cizim.kucukResim(sayfalar[0], { genislik: t.boyut.g, yukseklik: t.boyut.y }, genislik);
    }
    KS.sablonOnizleme = sablonOnizleme;

    // ── Projelerim ──────────────────────────────────────────────
    async function projelerPenceresi() {
        await KS.depo.kaydet(E.belge).catch(() => {});
        const izgara = h("div.proje-izgara");
        const p = KS.ui.pencere({
            baslik: "Projelerim", aciklama: "Projeler bu tarayıcıda saklanır. Başka bir bilgisayara taşımak için proje dosyasını indirin.", sinif: "genis",
            icerik: izgara,
            dugmeler: [
                { etiket: "Proje dosyası aç…", ikon: "dosya", sol: true, fn: () => { projeDosyasiAc(); } },
                { etiket: "Yeni katalog", ikon: "arti", birincil: true, fn: () => { setTimeout(yeniKatalogPenceresi, 50); } }
            ]
        });
        async function ciz() {
            const liste = await KS.depo.liste();
            if (!liste.length) { izgara.replaceChildren(h("div.bos-durum", "Henüz kayıtlı proje yok")); return; }
            izgara.replaceChildren(...liste.map((k) => {
                const onizleme = h("div.onizleme");
                const kart = h("button.proje-kart" + (k.id === E.belge.id ? ".su-an" : ""), { type: "button", title: k.ad },
                    onizleme, h("b", k.ad), h("small", `${k.sayfaSayisi} sayfa · ${new Date(k.guncel).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}`));
                const menu = h("button.ikon-dugme.kucuk.menu-ac", { type: "button", title: "Seçenekler" }, KS.ikon("menu", 16));
                menu.addEventListener("click", (e) => {
                    e.stopPropagation();
                    KS.ui.menu([
                        { ikon: "kalem", etiket: "Yeniden adlandır", fn: async () => {
                            const yeni = await KS.ui.sor({ baslik: "Projeyi yeniden adlandır", deger: k.ad });
                            if (yeni == null) return;
                            const b = await KS.depo.al(k.id); b.ad = yeni || b.ad;
                            if (b.id === E.belge.id) { E.belge.ad = b.ad; $("#belgeAdi").value = b.ad; }
                            await KS.depo.kaydet(b.id === E.belge.id ? E.belge : b); ciz();
                        } },
                        { ikon: "kopyala", etiket: "Kopyala", fn: async () => {
                            const b = await KS.depo.al(k.id); b.id = KS.kimlik("b"); b.ad += " (kopya)";
                            await KS.depo.kaydet(b); await KS.depo.kaydet(E.belge); ciz();
                        } },
                        { ikon: "indir", etiket: "Proje dosyasını indir", fn: async () => {
                            const b = await KS.depo.al(k.id);
                            KS.indir(await KS.depo.dosyaOlustur(b), KS.dosyaAdi(b.ad) + ".katalog");
                        } },
                        "-",
                        { ikon: "sil", etiket: "Sil", tehlike: true, pasif: k.id === E.belge.id, fn: async () => {
                            if (await KS.ui.onayla({ baslik: "Projeyi sil", metin: `"${k.ad}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`, evet: "Sil", tehlike: true })) {
                                await KS.depo.sil(k.id); ciz();
                            }
                        } }
                    ], menu);
                });
                kart.append(menu);
                kart.addEventListener("click", async () => {
                    if (k.id !== E.belge.id) { const b = await KS.depo.al(k.id); if (b) belgeAc(b); }
                    p.kapat();
                });
                // Önizleme: ilk sayfa
                (async () => {
                    try {
                        const b = KS.model.belgeNormallestir(JSON.parse(k.belge));
                        await KS.varlik.hepsiniBekle([...KS.depo.varlikKimlikleri({ sayfalar: [b.sayfalar[0]], urunler: [] })]);
                        const oran = b.genislik / b.yukseklik;
                        const gen = oran > 0.8 ? 190 : 190 * oran / 0.8;
                        onizleme.append(KS.cizim.kucukResim(b.sayfalar[0], b, gen));
                    } catch (h) { onizleme.append(KS.ikon("dosya", 32)); }
                })();
                return kart;
            }));
        }
        ciz();
    }

    // ── Kısayollar ──────────────────────────────────────────────
    function kisayollarPenceresi() {
        const satirlar = [
            ["Geri al / Yinele", "Ctrl+Z / Ctrl+Y"], ["Kopyala / Kes / Yapıştır", "Ctrl+C / X / V"], ["Çoğalt", "Ctrl+D"], ["Sil", "Del"],
            ["Tümünü seç", "Ctrl+A"], ["Grupla / Grubu çöz", "Ctrl+G / Ctrl+Shift+G"], ["Kilitle", "Ctrl+Shift+L"],
            ["Bir öne / arkaya", "Ctrl+] / Ctrl+["], ["En öne / en arkaya", "Ctrl+Shift+] / ["], ["Stili kopyala / uygula", "Ctrl+Alt+C / V"],
            ["1 px kaydır (Shift: 10 px)", "Ok tuşları"], ["Metni düzenle", "Enter / çift tık"], ["Metin ekle", "T"], ["Dikdörtgen / elips / çizgi", "R / O / L"],
            ["Yakınlaştır / uzaklaştır", "Ctrl + / Ctrl −"], ["Ekrana sığdır", "Ctrl+0"], ["Tuvali kaydır", "Boşluk + sürükle"], ["Yakınlaştır (fare)", "Ctrl + tekerlek"],
            ["Grup içindeki öğeyi seç", "Ctrl + tık"], ["Çoklu seçim", "Shift + tık"], ["Kopyasını sürükle", "Alt + sürükle"], ["Kılavuzsuz taşı", "Ctrl + sürükle"],
            ["Oranı serbest bırak / kilitle", "Shift + köşe"], ["Merkezden boyutlandır", "Alt + köşe"], ["15° adımla döndür", "Shift + döndür"], ["Sonraki / önceki sayfa", "PageDown / PageUp"],
            ["Yazdır / PDF", "Ctrl+P"], ["Dışa aktar", "Ctrl+E"]
        ];
        KS.ui.pencere({
            baslik: "Klavye kısayolları", sinif: "genis",
            icerik: h("div.kisayol-tablo", satirlar.map(([a, k]) => h("div", h("span", a), h("kbd", KS.kisayol(k)))))
        });
    }

    // ── Alt çubuk ───────────────────────────────────────────────
    function altCubukKur() {
        const gosterge = h("span.sayfa-gosterge");
        const onceki = h("button.ikon-dugme.kucuk", { type: "button", title: "Önceki sayfa", onclick: () => sayfaGit(-1) }, KS.ikon("sol", 17));
        const sonraki = h("button.ikon-dugme.kucuk", { type: "button", title: "Sonraki sayfa", onclick: () => sayfaGit(1) }, KS.ikon("sag", 17));
        const kaydirici = h("input.zum-kaydirici", { type: "range", min: -2.3, max: 1.6, step: 0.01, "aria-label": "Yakınlaştırma" });
        const yuzde = h("button.zum-deger", { type: "button", title: "Yakınlaştırma seçenekleri" });
        const miknatis = h("button.ikon-dugme.kucuk", { type: "button", title: "Akıllı kılavuzlar (hizalama yapışması)", "aria-pressed": "true" }, KS.ikon("miknatis", 17));
        miknatis.addEventListener("click", () => { E.yapisma = !E.yapisma; miknatis.setAttribute("aria-pressed", String(E.yapisma)); KS.bildir(E.yapisma ? "Akıllı kılavuzlar açık" : "Akıllı kılavuzlar kapalı"); });
        kaydirici.addEventListener("input", () => KS.editor.zumAyarla(Math.exp(+kaydirici.value)));
        kaydirici.addEventListener("keydown", (e) => e.stopPropagation());
        yuzde.addEventListener("click", () => KS.ui.menu([
            ...[0.25, 0.5, 0.75, 1, 1.5, 2, 3].map((z) => ({ etiket: Math.round(z * 100) + "%", fn: () => KS.editor.zumAyarla(z) })),
            "-",
            { ikon: "sigdir", etiket: "Ekrana sığdır", kisayol: "Ctrl+0", fn: () => KS.editor.sigdir() },
            { ikon: "sigdir", etiket: "Genişliğe sığdır", fn: () => KS.editor.sigdir(true) }
        ], yuzde, { yer: "ust", hiza: "son" }));
        $("#altCubuk").append(
            h("div.grup", onceki, gosterge, sonraki, h("span.ayrac"), h("span.ipucu-kisa", "Çift tık: düzenle  ·  Boşluk + sürükle: kaydır")),
            h("div.grup", miknatis, h("span.ayrac"),
                h("button.ikon-dugme.kucuk", { type: "button", title: "Uzaklaştır", onclick: () => KS.editor.zumAyarla(E.zum / 1.2) }, KS.ikon("uzaklas", 17)),
                kaydirici,
                h("button.ikon-dugme.kucuk", { type: "button", title: "Yakınlaştır", onclick: () => KS.editor.zumAyarla(E.zum * 1.2) }, KS.ikon("yakinlas", 17)),
                yuzde,
                h("button.ikon-dugme.kucuk", { type: "button", title: "Ekrana sığdır (Ctrl+0)", onclick: () => KS.editor.sigdir() }, KS.ikon("sigdir", 17))));
        const zumGoster = () => {
            kaydirici.value = Math.log(E.zum);
            kaydirici.style.setProperty("--dolu", ((Math.log(E.zum) + 2.3) / 3.9) * 100 + "%");
            yuzde.textContent = Math.round(E.zum * 100) + "%";
        };
        const sayfaGoster = () => {
            if (!E.belge) return;
            const g = KS.editor.gorunurSayfa();
            const n = E.belge.sayfalar.length;
            gosterge.textContent = g ? `Sayfa ${g.i + 1} / ${n}` : `${n} sayfa`;
        };
        function sayfaGit(yon) {
            const g = KS.editor.gorunurSayfa();
            const l = E.belge.sayfalar;
            const j = KS.sinirla((g ? g.i : 0) + yon, 0, l.length - 1);
            KS.editor.aktifSayfa(l[j].id, { kaydir: true });
        }
        KS.olay.on("zum", zumGoster);
        KS.olay.on("kaydirma", sayfaGoster);
        KS.olay.on("belge", () => { sayfaGoster(); zumGoster(); });
        KS.olay.on("sayfa", sayfaGoster);
    }

    // ── Hızlı ekleme ve panelden bırakma ────────────────────────
    function hizliEkle(tur) {
        const W = E.belge.genislik;
        if (tur === "metin") {
            const [o] = KS.editor.ekle(KS.model.yeni("metin", { w: Math.round(W * 0.5), metin: "Metninizi yazın", boyut: Math.round(W / 22), font: "Inter", kalin: 700 }));
            setTimeout(() => KS.editor.metinDuzenle(o.id), 30);
            return;
        }
        const k = Math.round(W * 0.22);
        if (tur === "cizgi") { KS.editor.ekle(KS.model.yeni("sekil", { sekil: "cizgi", w: k * 1.4, h: 12, cizgi: { k: 4, renk: "#1d1d1f" } })); return; }
        KS.editor.ekle(KS.model.yeni("sekil", { sekil: tur, w: k, h: k, dolgu: tur === "elips" ? "#ffd400" : "#e30613" }));
    }
    function birakildi(veri, { merkez, sayfaId }) {
        if (veri.ogeler) {
            const ogeler = veri.ogeler.map((o) => Object.assign(KS.kopya(o), { id: KS.kimlik("o") }));
            const g = new Map();
            for (const o of ogeler) if (o.grup) { if (!g.has(o.grup)) g.set(o.grup, KS.kimlik("g")); o.grup = g.get(o.grup); }
            KS.editor.ekle(ogeler, { merkez, sayfaId });
        } else if (veri.urunId) {
            KS.paneller && KS.paneller.urunKartiEkle(veri.urunId, { merkez, sayfaId });
        } else if (veri.varlik) {
            const v = KS.varlik.al(veri.varlik) || { g: 400, y: 400 };
            const W = E.belge.genislik, H = E.belge.yukseklik;
            const k = Math.min((W * 0.45) / (v.g || 400), (H * 0.45) / (v.y || 400), 1.2);
            KS.editor.ekle(KS.model.yeni("gorsel", { varlik: veri.varlik, w: KS.yuvarla((v.g || 400) * k, 1), h: KS.yuvarla((v.y || 400) * k, 1) }), { merkez, sayfaId });
        }
    }

    // Görsel öğeyi sayfa arka planı yap
    function arkaplanYap(id) {
        const r = KS.editor.bul(id);
        if (!r) return;
        r.sayfa.arka.resim = { varlik: r.oge.varlik, opak: 1, bulanik: 0, kaplama: "kapla", x: r.oge.odakX ?? 50, y: r.oge.odakY ?? 50 };
        r.sayfa.ogeler = r.sayfa.ogeler.filter((o) => o.id !== id);
        KS.editor.sec([]);
        KS.editor.tumunuCiz();
        KS.gecmis.kaydet();
        KS.bildir("Görsel sayfa arka planı yapıldı");
    }

    // Ürün kartını serbest öğelere ayırır: kartın çizilmiş parçalarının konumları ölçülüp aynı görünümde öğeler üretilir
    function urunuAyristir(id) {
        const r = KS.editor.bul(id);
        if (!r || r.oge.tur !== "urun") return;
        const o = r.oge, v = o.veri, s = o.stil;
        const el = KS.editor.ogeElemani(id);
        if (!el) return;
        const z = E.zum;
        const kart = el.getBoundingClientRect();
        // Döndürülmüş kartta ölçüm bozulur; önce düz ölç
        const eskiAci = o.aci;
        el.style.transform = "none";
        const kok = el.getBoundingClientRect();
        const yer = (parca) => {
            if (!parca) return null;
            const p = parca.getBoundingClientRect();
            return { x: o.x + (p.left - kok.left) / z, y: o.y + (p.top - kok.top) / z, w: p.width / z, h: p.height / z };
        };
        const yeni = [];
        const sk = s.kalinlik ? { k: s.kalinlik * (parseFloat(el.style.getPropertyValue("--u")) || 1), renk: s.kenar } : null;
        const kose = parseFloat(el.style.getPropertyValue("--kose")) || 0;
        const kartRenk = typeof s.kart === "string" ? KS.renkCoz(s.kart).a > 0 : !!s.kart;
        if (kartRenk) yeni.push(KS.model.yeni("sekil", { ad: "Kart zemini", sekil: "dikdortgen", x: o.x, y: o.y, w: o.w, h: o.h, kose, dolgu: KS.kopya(s.kart), cizgi: sk, golge: s.kartGolge ? { x: 0, y: o.w / 100, b: o.w / 25, renk: "rgba(15,23,42,.13)" } : null }));
        const gi = yer(el.querySelector(".u-gi"));
        if (gi) {
            if (s.duzen === "daire") yeni.push(KS.model.yeni("sekil", { sekil: "elips", ad: "Görsel zemini", x: gi.x, y: gi.y, w: gi.w, h: gi.h, dolgu: s.gorselZemin || "rgba(0,0,0,.05)" }));
            const iyer = s.duzen === "daire" ? { x: gi.x + gi.w * 0.13, y: gi.y + gi.h * 0.13, w: gi.w * 0.74, h: gi.h * 0.74 } : gi;
            yeni.push(KS.model.yeni("gorsel", Object.assign({ ad: v.ad, sigdir: "sigdir" }, iyer, v.gorsel.varlik ? { varlik: v.gorsel.varlik } : { emoji: v.gorsel.emoji || "🛒" })));
        }
        const metinOge = (parca, oz) => {
            const p = yer(parca);
            if (!p || !parca.textContent.trim()) return;
            const cs = getComputedStyle(parca);
            yeni.push(KS.model.yeni("metin", Object.assign({ x: p.x, y: p.y, w: p.w + 2, metin: parca.textContent, boyut: parseFloat(cs.fontSize), satir: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) || 1.1, hiza: cs.textAlign === "center" ? "center" : "left" }, oz)));
        };
        metinOge(el.querySelector(".u-ad"), { font: s.adFont, kalin: s.adKalin, dolgu: getComputedStyle(el.querySelector(".u-ad")).color });
        const ac = el.querySelector(".u-ac");
        if (ac) metinOge(ac, { font: s.adFont, kalin: 500, dolgu: getComputedStyle(ac).color });
        const eski = el.querySelector(".u-eski");
        if (eski) metinOge(eski, { font: s.fiyatFont, dolgu: s.eskiRenk, ustu: true });
        const fk = yer(el.querySelector(".u-fiyat"));
        if (fk) {
            const pz = s.duzen === "patlama" ? yer(el.querySelector(".u-fs")) : fk;
            const sekilTur = s.duzen === "patlama" ? "patlama" : s.duzen === "daire" ? "hap" : s.duzen === "minimal" || s.duzen === "raf" || s.duzen === "serit" ? "yok" : "yuvarlak";
            yeni.push(KS.model.yeni("fiyat", {
                ad: "Fiyat", x: pz.x, y: pz.y, w: pz.w, h: pz.h, fiyat: v.fiyat, eski: 0, sekil: sekilTur, zemin: KS.kopya(s.fiyatZemin),
                renk: s.duzen === "minimal" ? KS.dolguRenk(s.fiyatZemin) : s.duzen === "raf" ? s.adRenk : s.fiyatRenk,
                font: s.fiyatFont, kurus: s.kurus, para: s.para, alt: v.birim || "", urunId: o.urunId
            }));
        }
        const rz = el.querySelector(".u-rozet");
        if (rz) {
            const p = yer(rz);
            const g = KS.kimlik("g");
            const yuvarlak = !rz.classList.contains("uzun");
            yeni.push(KS.model.yeni("sekil", { sekil: yuvarlak ? "elips" : "yuvarlak", kose: p.h / 2, x: p.x, y: p.y, w: p.w, h: p.h, dolgu: s.rozetZemin, aci: yuvarlak ? -12 : -6, grup: g }));
            yeni.push(KS.model.yeni("metin", { x: p.x, y: p.y + p.h * 0.28, w: p.w, metin: rz.innerText.replace(/\n+/g, "\n"), hiza: "center", font: "Inter", kalin: 800, boyut: parseFloat(getComputedStyle(rz).fontSize) * 0.85, satir: 1, dolgu: s.rozetRenk, aci: yuvarlak ? -12 : -6, grup: g }));
        }
        el.style.transform = "";
        void kart;
        // Ayrılan parçalar tek grup; kartın döndürmesi korunur
        const g = KS.kimlik("g");
        const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
        for (const x of yeni) {
            x.grup = x.grup && x.tur !== "sekil" && x.tur !== "metin" ? x.grup : g;
            if (eskiAci) {
                const c = KS.dondur(x.x + x.w / 2, x.y + x.h / 2, cx, cy, eskiAci);
                x.x = c.x - x.w / 2; x.y = c.y - x.h / 2; x.aci = KS.aciNormal((x.aci || 0) + eskiAci);
            }
        }
        const i = r.sayfa.ogeler.indexOf(o);
        r.sayfa.ogeler.splice(i, 1, ...yeni);
        KS.editor.tumunuCiz();
        KS.editor.sec(yeni.map((x) => x.id), { genislet: false });
        KS.gecmis.kaydet();
        KS.bildir("Kart serbest öğelere ayrıldı — çift tıklayarak her parçayı ayrı düzenleyebilirsiniz", { sure: 3500 });
    }

    // ── Başlangıç ───────────────────────────────────────────────
    async function baslat() {
        let tema = null;
        try { tema = localStorage.getItem("ks-tema"); } catch (h) { /* yok say */ }
        temaUygula(tema);
        matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => temaUygula(document.documentElement.dataset.tema || null));

        $("#logoSimge").append(KS.ikon("etiket", 18));
        $("#geriDugme").append(KS.ikon("geri", 19));
        $("#ileriDugme").append(KS.ikon("ileri", 19));
        $("#yardimDugme").append(KS.ikon("klavye", 19));
        $("#onizleDugme").append(KS.ikon("oynat", 16), h("span", "Önizle"));
        $("#videoDugme").append(KS.ikon("video", 17), h("span", "Video"));
        $("#disaDugme").append(KS.ikon("indir", 17), h("span", "Dışa aktar"));
        $("#dosyaDugme").append(KS.ikon("asagi", 14));
        $("#boyutDugme").append(KS.ikon("asagi", 14));
        $("#dosyaDugme").addEventListener("click", (e) => dosyaMenusu(e.currentTarget));
        $("#boyutDugme").addEventListener("click", (e) => boyutMenusu(e.currentTarget));
        $("#geriDugme").addEventListener("click", () => KS.gecmis.geri());
        $("#ileriDugme").addEventListener("click", () => KS.gecmis.ileri());
        $("#temaDugme").addEventListener("click", temaDegistir);
        $("#yardimDugme").addEventListener("click", kisayollarPenceresi);
        $("#onizleDugme").addEventListener("click", () => KS.onizleme && KS.onizleme.ac());
        $("#videoDugme").addEventListener("click", () => KS.video && KS.video.ac());
        $("#disaDugme").addEventListener("click", () => KS.disaaktar && KS.disaaktar.pencere());
        const adGirdi = $("#belgeAdi");
        adGirdi.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === "Escape") adGirdi.blur(); });
        adGirdi.addEventListener("change", () => {
            E.belge.ad = adGirdi.value.trim() || "Adsız katalog";
            adGirdi.value = E.belge.ad;
            document.title = `${E.belge.ad} — Katalog Stüdyo`;
            KS.gecmis.kaydet();
        });

        KS.editor.baslat({ tuval: $("#tuval"), tuvalIc: $("#tuvalIc") });
        altCubukKur();
        if (KS.paneller) KS.paneller.baslat($("#ray"), $("#solPanel"));
        if (KS.ozellikler) KS.ozellikler.baslat($("#sagPanel"));
        if (KS.mobilArayuz) KS.mobilArayuz.baslat();

        KS.olay.on("gecmis", () => {
            $("#geriDugme").disabled = !KS.gecmis.geriVar();
            $("#ileriDugme").disabled = !KS.gecmis.ileriVar();
        });
        KS.olay.on("degisti", degisti);
        KS.olay.on("belge", () => { if (document.activeElement !== adGirdi) adGirdi.value = E.belge.ad; });
        KS.olay.on("hizli-ekle", hizliEkle);
        KS.olay.on("birakildi", birakildi);
        KS.olay.on("kisayollar", kisayollarPenceresi);
        KS.olay.on("arkaplan-yap", arkaplanYap);
        KS.olay.on("ayristir", urunuAyristir);
        KS.olay.on("kaydet-iste", () => { kaydet.hemen(); KS.bildir("Kaydedildi", { tur: "basari" }); });
        KS.olay.on("yazdir-iste", () => { if (KS.disaaktar) KS.disaaktar.yazdir(); });
        document.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e" && !document.querySelector("dialog[open]")) { e.preventDefault(); KS.disaaktar && KS.disaaktar.pencere(); }
        });
        document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && kayitBekliyor) kaydet.hemen(); });
        window.addEventListener("beforeunload", (e) => { if (kayitBekliyor) { kaydet.hemen(); e.preventDefault(); } });
        // Sayfaya dosya bırakılırken tarayıcının dosyayı açmasını engelle
        window.addEventListener("dragover", (e) => { if ([...e.dataTransfer.types].includes("Files")) e.preventDefault(); });
        window.addEventListener("drop", (e) => { if (!e.target.closest || !e.target.closest(".tuval, .yukleme-alani, .urun-satir, .panel-ic")) e.preventDefault(); });

        KS.fontlar.yukle(KS.fontlar.EMOJI);
        // Son açılan proje, yoksa ilk şablon
        let belge = null;
        const sonId = KS.depo.sonId();
        if (sonId) { try { belge = await KS.depo.al(sonId); } catch (h) { belge = null; } }
        const ilk = !belge;
        if (!belge) belge = sablondanBelge(KS.SABLONLAR[0], { ad: "Haftanın Fırsatları" });
        belgeAc(belge);
        if (ilk) {
            setTimeout(() => KS.bildir("Hoş geldiniz! Bir öğeyi seçip sağdaki panelden düzenleyin, soldan şablon ve ürün ekleyin.", { sure: 6000 }), 600);
        }
        if (!(await KS.depo.calisiyor())) KS.bildir("Tarayıcı depolaması kullanılamıyor; çalışmanızı proje dosyası olarak indirin.", { tur: "hata", sure: 6000 });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat);
    else baslat();
})();
