// Sol paneller: Şablonlar, Ürünler, Metin, Öğeler, Yüklemeler, Arka plan, Katmanlar, Marka.
// Panelden öğe eklemek için tıklanır ya da sayfaya sürüklenir (application/x-ks veri türüyle).
(function () {
    "use strict";
    const KS = window.KS;
    const { h } = KS;
    const E = KS.E;

    const PANELLER = [
        { id: "sablonlar", ad: "Şablonlar", ikon: "sablon" },
        { id: "urunler", ad: "Ürünler", ikon: "urun" },
        { id: "metin", ad: "Metin", ikon: "metin" },
        { id: "ogeler", ad: "Öğeler", ikon: "ogeler" },
        { id: "yuklemeler", ad: "Yüklemeler", ikon: "yukle" },
        { id: "arkaplan", ad: "Arka plan", ikon: "arkaplan" },
        { id: "katmanlar", ad: "Katmanlar", ikon: "katmanlar" },
        { id: "marka", ad: "Marka", ikon: "marka" }
    ];
    let ray, kap, acik = null, dugmeler = {}, govde, kapatDugme;
    const cizimler = {};

    function baslat(rayEl, kapEl) {
        ray = rayEl; kap = kapEl;
        for (const p of PANELLER) {
            const b = h("button.ray-dugme", { type: "button", role: "tab", "aria-selected": "false", title: p.ad },
                h("span.ikon-kap", KS.ikon(p.ikon, 21)), h("span", p.ad));
            b.addEventListener("click", () => (acik === p.id && !kap.classList.contains("kapali") ? kapat() : ac(p.id)));
            dugmeler[p.id] = b;
            ray.append(b);
        }
        govde = h("div.panel-ic");
        kapatDugme = h("button.panel-kapat", { type: "button", title: "Paneli gizle", onclick: () => (kap.classList.contains("kapali") ? ac(acik || "sablonlar") : kapat()) }, KS.ikon("sol", 12));
        kap.append(KS.altSayfaTutamak(kap, kapat), govde, kapatDugme);
        // Telefonda panelden öğe eklenince sayfa kapansın, eklenen öğe görünsün
        KS.olay.on("eklendi", () => { if (KS.mobil() && !kap.classList.contains("kapali")) kapat(); });
        const yenile = (ad) => () => { if (acik === ad && !kap.classList.contains("kapali")) ciz(); };
        KS.olay.on("belge", () => { if (!kap.classList.contains("kapali")) ciz(); });
        KS.olay.on("urunler", yenile("urunler"));
        KS.olay.on("abellpro", () => { if (acik === "urunler" || acik === "marka") ciz(); });
        KS.olay.on("varliklar", yenile("yuklemeler"));
        KS.olay.on("sayfa", yenile("arkaplan"));
        KS.olay.on("degisti", () => { if (acik === "katmanlar" || acik === "arkaplan") yenile(acik)(); });
        KS.olay.on("secim", yenile("katmanlar"));
        KS.olay.on("donusum", KS.kareBasi(() => { if (acik === "katmanlar") ciz(); }));
        const dar = matchMedia("(max-width: 900px)").matches;
        ac(dar ? "sablonlar" : "sablonlar");
        if (dar) kapat();
    }
    function ac(id) {
        acik = id;
        kap.classList.remove("kapali");
        for (const [k, b] of Object.entries(dugmeler)) b.setAttribute("aria-selected", String(k === id));
        kapatDugme.replaceChildren(KS.ikon("sol", 12));
        ciz();
        govde.scrollTop = 0;
    }
    function kapat() {
        kap.classList.add("kapali");
        kapatDugme.replaceChildren(KS.ikon("sag", 12));
        for (const b of Object.values(dugmeler)) b.setAttribute("aria-selected", "false");
        requestAnimationFrame(() => KS.editor.secimCiz());
    }
    function ciz() {
        if (!E.belge || !acik) return;
        const p = PANELLER.find((x) => x.id === acik);
        const kaydirma = govde.scrollTop;
        const icerik = cizimler[acik]();
        govde.replaceChildren(h("div.panel-kafa", { style: { padding: "16px 0 10px" } }, h("h2", p.ad)), icerik);
        govde.scrollTop = kaydirma;
    }

    // ── Ortak yardımcılar ───────────────────────────────────────
    const W = () => E.belge.genislik;
    const olcekli = (ogeler, hedefGen) => {
        // A4 genişliğine (794) göre tasarlanmış hazır öğeleri sayfa genişliğine ölçekler
        const k = (hedefGen || W()) / 794;
        return ogeler.map((o) => { const x = KS.model.normallestir(KS.kopya(o)); KS.model.olcekle(x, k); x.x *= k; x.y *= k; return x; });
    };
    function grupla(ogeler) { const g = KS.kimlik("g"); ogeler.forEach((o) => { o.grup = g; }); return ogeler; }
    function surukle(el, veriFn) {
        el.draggable = true;
        el.addEventListener("dragstart", (e) => {
            const veri = veriFn();
            e.dataTransfer.setData("application/x-ks", JSON.stringify(veri));
            e.dataTransfer.effectAllowed = "copy";
            KS.surukleme = veri.varlik ? "varlik" : veri.urunId ? "urun" : "oge";
        });
        el.addEventListener("dragend", () => { KS.surukleme = null; });
    }
    // Bir öğe kümesini küçük kutuda gösterir
    function onizleme(ogeler, gen, yuk, { arka = "transparent", dolgu = 0.12 } = {}) {
        const kopyalar = ogeler.map((o) => KS.model.normallestir(KS.kopya(o)));
        for (const o of kopyalar) if (o.tur === "metin" && !o.egri) {
            o.h = o.h > 20 ? o.h : o.boyut * o.satir * (o.metin.split("\n").length);
            if (ogeler.length === 1) o.w = Math.min(o.w, KS.metinGenisligi(o));
        }
        for (const o of kopyalar) if (o.tur === "metin" && o.egri) { const m = KS.egriOlcu(o); o.w = m.w; o.h = m.h; }
        const b = KS.kutuBirlesim(kopyalar.map(KS.kutu));
        const pay = Math.max(b.w, b.h) * dolgu;
        const sw = b.w + pay * 2, sh = b.h + pay * 2;
        const k = Math.min(gen / sw, yuk / sh);
        for (const o of kopyalar) { o.x -= b.x - pay; o.y -= b.y - pay; }
        const sayfa = { arka: { dolgu: arka }, ogeler: kopyalar };
        const el = KS.cizim.kucukResim(sayfa, { genislik: sw, yukseklik: sh }, sw * k);
        el.style.margin = "auto";
        el.firstChild.style.background = "transparent";
        return el;
    }
    function kutucuk(icerik, { ipucu, tikla, veri, sinif = "", stil } = {}) {
        const b = h("button.kutucuk" + sinif, { type: "button", title: ipucu || "", style: stil }, icerik);
        if (tikla) b.addEventListener("click", tikla);
        if (veri) surukle(b, veri);
        return b;
    }
    function bolumBaslik(metin, ek) { return h("div.bolum-baslik", h("div", metin), ek || null); }

    // ── Şablonlar ───────────────────────────────────────────────
    let sablonFiltre = "hepsi";
    const sablonOnbellek = new Map();
    cizimler.sablonlar = () => {
        const filtreler = [["hepsi", "Tümü"], ["A4", "Baskı (A4)"], ["sosyal", "Sosyal medya"], ["ekran", "Ekran"]];
        const cipler = h("div.cipler", filtreler.map(([k, ad]) => h("button.cip", { type: "button", "aria-pressed": String(sablonFiltre === k), onclick: () => { sablonFiltre = k; ciz(); } }, ad)));
        const uygun = KS.SABLONLAR.filter((t) => sablonFiltre === "hepsi" || KS.sablonKategori(t) === sablonFiltre);
        const izgara = h("div.izgara.s2", { style: { gap: "14px 10px" } }, uygun.map((t) => {
            const anahtar = t.id + JSON.stringify(E.belge.marka);
            if (!sablonOnbellek.has(anahtar)) sablonOnbellek.set(anahtar, KS.sablonOnizleme(t, 145));
            const kart = h("button.sablon-kart", { type: "button", title: t.ad },
                h("div.onizleme", sablonOnbellek.get(anahtar), h("span.rozet-mini", t.etiket)),
                h("span.ad", t.ad));
            kart.addEventListener("click", () => sablonSec(t, kart));
            return kart;
        }));
        const duzenler = [[2, 2], [2, 3], [3, 3], [3, 4], [4, 4], [4, 5], [1, 3], [5, 6]];
        const duzenIzgara = h("div.izgara.s4", duzenler.map(([s, r]) => kutucuk(
            h("div", { style: { display: "grid", gridTemplateColumns: `repeat(${s}, 1fr)`, gap: "2px", width: "70%", aspectRatio: "0.8", padding: "2px" } },
                Array.from({ length: s * r }, () => h("span", { style: { background: "var(--vurgu-orta)", borderRadius: "2px" } }))),
            { ipucu: `${s} × ${r} ürün`, sinif: ".kare", tikla: () => izgaraUygula(s, r) })));
        return h("div", cipler, izgara,
            bolumBaslik("Ürün ızgarası", h("span", "etkin sayfaya")),
            h("p.ipucu-metin", "Etkin sayfadaki ürün kartlarını seçtiğiniz ızgarayla yeniden dizer; başlık ve süslemeler korunur."),
            duzenIzgara);
    };
    function sablonSec(t, capa) {
        const ayni = t.boyut.g === E.belge.genislik && t.boyut.y === E.belge.yukseklik;
        const uyarla = ayni ? "" : " (boyuta uyarlanır)";
        KS.ui.menu([
            { ikon: "sayfa", etiket: "Bu sayfaya uygula" + uyarla, fn: () => sablonUygula(t, "sayfa") },
            { ikon: "sayfaEkle", etiket: "Yeni sayfa olarak ekle" + uyarla, fn: () => sablonUygula(t, "ekle") },
            "-",
            { ikon: "dosya", etiket: "Yeni katalog olarak aç", fn: () => sablonUygula(t, "yeni") }
        ], capa, { yer: "sag" });
    }
    async function sablonUygula(t, hedef) {
        if (hedef === "yeni") {
            await KS.depo.kaydet(E.belge).catch(() => {});
            const belge = KS.uygulama.sablondanBelge(t, { urunler: E.belge.urunler.length ? KS.kopya(E.belge.urunler) : undefined });
            belge.marka = KS.kopya(E.belge.marka);
            KS.uygulama.belgeAc(belge);
            return;
        }
        const kaynak = E.belge.urunler.length ? E.belge.urunler : KS.ornekUrunler();
        const { sayfalar, urunler } = KS.sablon.uret(t, { marka: E.belge.marka, urunKaynak: kaynak });
        const yeni = sayfalar[0];
        KS.sablon.sayfayiUyarla(yeni, t.boyut.g, t.boyut.y, E.belge.genislik, E.belge.yukseklik);
        KS.sablon.urunleriBelgeyeKat(E.belge, [yeni], urunler);
        if (hedef === "sayfa") {
            const s = KS.editor.sayfa();
            if (s.ogeler.length && !(await KS.ui.onayla({ baslik: "Sayfaya şablon uygula", metin: "Etkin sayfadaki tüm öğeler şablonla değiştirilecek. (Geri al ile dönebilirsiniz.)", evet: "Uygula" }))) return;
            s.arka = yeni.arka; s.ogeler = yeni.ogeler;
            KS.editor.sec([]);
            KS.editor.tumunuCiz();
            KS.gecmis.kaydet();
        } else {
            KS.editor.sayfaEkle(E.sayfaId, yeni);
        }
        KS.olay.yay("urunler");
        KS.bildir(`"${t.ad}" uygulandı`, { tur: "basari" });
    }
    function izgaraUygula(sutun, satir) {
        const s = KS.editor.sayfa();
        const d = KS.sablon.sayfaDuzeni(s, E.belge);
        const mevcut = s.ogeler.filter((o) => o.tur === "urun");
        const kaynak = mevcut.length ? mevcut.map((o) => Object.assign({ id: o.urunId }, o.veri)) : [];
        const liste = kaynak.concat(E.belge.urunler.filter((u) => !kaynak.some((k) => k.id && k.id === u.id))).slice(0, sutun * satir);
        if (!liste.length) liste.push(...KS.ornekUrunler().slice(0, sutun * satir));
        const yeni = KS.sablon.izgara(liste, d.alan, sutun, satir, d.bosluk, d.stil || {});
        const ilk = s.ogeler.findIndex((o) => o.tur === "urun");
        s.ogeler = s.ogeler.filter((o) => o.tur !== "urun");
        s.ogeler.splice(ilk >= 0 ? ilk : s.ogeler.length, 0, ...yeni);
        KS.editor.tumunuCiz();
        KS.editor.sec(yeni.map((o) => o.id), { genislet: false });
        KS.gecmis.kaydet();
    }

    // ── Ürünler ─────────────────────────────────────────────────
    let urunAra = "", urunKategori = "Tümü", acikUrun = null;
    // Binlerce ürün olabilir: liste parça parça çizilir, kaydırdıkça devamı gelir.
    // Gösterilen satır sayısı panel yeniden çizilince korunur (düzenlenen ürün ve kaydırma konumu kaybolmasın).
    const URUN_PARTI = 120;
    let urunGosterim = URUN_PARTI;
    const EMOJI_SOZLUK = [
        ["zeytinyağ", "🫒"], ["meyve suyu", "🧃"], ["portakal suyu", "🧃"], ["süt", "🥛"], ["ayran", "🥛"], ["peynir", "🧀"], ["kaşar", "🧀"], ["yumurta", "🥚"], ["tereyağ", "🧈"], ["margarin", "🧈"],
        ["bal", "🍯"], ["reçel", "🍯"], ["zeytin", "🫒"], ["yoğurt", "🥣"], ["elma", "🍎"], ["armut", "🍐"], ["portakal", "🍊"], ["mandalina", "🍊"], ["limon", "🍋"], ["muz", "🍌"],
        ["karpuz", "🍉"], ["üzüm", "🍇"], ["çilek", "🍓"], ["kiraz", "🍒"], ["şeftali", "🍑"], ["ananas", "🍍"], ["kivi", "🥝"], ["avokado", "🥑"], ["mango", "🥭"], ["kavun", "🍈"],
        ["domates", "🍅"], ["patlıcan", "🍆"], ["patates", "🥔"], ["havuç", "🥕"], ["mısır", "🌽"], ["biber", "🫑"], ["salatalık", "🥒"], ["hıyar", "🥒"], ["marul", "🥬"], ["ıspanak", "🥬"],
        ["lahana", "🥬"], ["brokoli", "🥦"], ["sarımsak", "🧄"], ["soğan", "🧅"], ["mantar", "🍄"], ["kıyma", "🥩"], ["dana", "🥩"], ["kuzu", "🥩"], ["et", "🥩"], ["tavuk", "🍗"],
        ["piliç", "🍗"], ["sucuk", "🌭"], ["sosis", "🌭"], ["salam", "🥓"], ["pastırma", "🥓"], ["balık", "🐟"], ["somon", "🐟"], ["hamsi", "🐟"], ["karides", "🦐"], ["ekmek", "🍞"],
        ["simit", "🥯"], ["poğaça", "🥐"], ["kruvasan", "🥐"], ["kek", "🧁"], ["pasta", "🍰"], ["bisküvi", "🍪"], ["kurabiye", "🍪"], ["çikolata", "🍫"], ["gofret", "🍫"], ["şeker", "🍬"],
        ["lokum", "🍬"], ["cips", "🥔"], ["kraker", "🍘"], ["fındık", "🌰"], ["fıstık", "🥜"], ["ceviz", "🌰"], ["dondurma", "🍦"], ["pirinç", "🍚"], ["bulgur", "🍚"], ["makarna", "🍝"],
        ["erişte", "🍝"], ["un", "🌾"], ["mercimek", "🫘"], ["nohut", "🫘"], ["fasulye", "🫘"], ["salça", "🥫"], ["konserve", "🥫"], ["tuz", "🧂"], ["yağ", "🌻"], ["çay", "🍵"],
        ["kahve", "☕"], ["maden", "🫧"], ["soda", "🫧"], ["su", "💧"], ["kola", "🥤"], ["gazoz", "🥤"], ["limonata", "🍋"], ["deterjan", "🧴"], ["çamaşır", "🧺"], ["bulaşık", "🧽"],
        ["sünger", "🧽"], ["kağıt", "🧻"], ["kâğıt", "🧻"], ["peçete", "🧻"], ["mendil", "🧻"], ["sabun", "🧼"], ["şampuan", "🧴"], ["diş", "🪥"], ["çöp", "🗑️"], ["mama", "🐾"], ["pil", "🔋"], ["ampul", "💡"]
    ].map(([k, e]) => [KS.sade(k), e]).sort((a, b) => b[0].length - a[0].length);
    function emojiTahmin(ad) {
        const kelimeler = KS.sade(ad).split(/[^a-z0-9ğüşöçıâ]+/i).filter(Boolean);
        for (const [k, e] of EMOJI_SOZLUK) {
            if (k.includes(" ")) { if (KS.sade(ad).includes(k)) return e; continue; }
            if (kelimeler.some((w) => w.startsWith(k))) return e;
        }
        return "🛒";
    }
    KS.emojiTahmin = emojiTahmin;

    function urunGorselEl(u, boyut = 44) {
        if (u.gorsel && u.gorsel.varlik) {
            const id = u.gorsel.varlik, url = KS.varlik.url(id);
            if (url) return h("img", { src: url, alt: "" });
            // Henüz depodan okunmadı (ürün resimleri açılışta topluca yüklenmez): gelince yerine konur
            const yer = h("span", "🖼️");
            KS.varlik.bekle(id).then((v) => { if (v && yer.isConnected) yer.replaceWith(h("img", { src: v.url, alt: "" })); });
            return yer;
        }
        return h("span", { style: { fontSize: boyut * 0.6 + "px" } }, (u.gorsel && u.gorsel.emoji) || "🛒");
    }
    function urunlerSuzulmus() {
        const a = KS.sade(urunAra).split(/\s+/).filter(Boolean);
        return E.belge.urunler.filter((u) => (urunKategori === "Tümü" || u.kategori === urunKategori) &&
            a.every((p) => KS.sade(`${u.ad} ${u.aciklama} ${u.kategori}`).includes(p)));
    }
    cizimler.urunler = () => {
        const urunler = E.belge.urunler;
        const iceAktar = h("button.dugme.kucuk", { type: "button" }, KS.ikon("tablo", 16), "İçe aktar");
        iceAktar.addEventListener("click", () => KS.ui.menu([
            { ikon: "baglanti", etiket: "AbellPro'dan tüm ürünleri al", fn: () => KS.abellpro.hepsiniAl() },
            { ikon: "tablo", etiket: "Excel / tablo yapıştır…", fn: () => iceAktarPenceresi() },
            { ikon: "dosya", etiket: "Dosyadan (.xlsx, .csv)…", fn: async () => { const [d] = await KS.dosyaSec({ kabul: ".xlsx,.xls,.csv,.txt,.tsv" }); if (d) iceAktarPenceresi(d); } },
            { ikon: "gorsel", etiket: "Görselleri toplu eşleştir…", pasif: !urunler.length, fn: gorselEslestirPenceresi },
            "-",
            { ikon: "urun", etiket: "Örnek market ürünlerini ekle", fn: () => { E.belge.urunler.push(...KS.ornekUrunler()); KS.gecmis.kaydet(); KS.olay.yay("urunler"); } },
            { ikon: "indir", etiket: "Listeyi CSV olarak indir", pasif: !urunler.length, fn: csvIndir },
            { ikon: "sil", etiket: "Tüm listeyi temizle", tehlike: true, pasif: !urunler.length, fn: async () => {
                if (await KS.ui.onayla({ baslik: "Ürün listesini temizle", metin: "Listedeki tüm ürünler silinecek. Sayfadaki kartlar yerinde kalır.", evet: "Temizle", tehlike: true })) {
                    E.belge.urunler = []; KS.gecmis.kaydet(); KS.olay.yay("urunler");
                }
            } }
        ], iceAktar));
        const ekle = h("button.dugme.kucuk.birincil", { type: "button", onclick: yeniUrun }, KS.ikon("arti", 16), "Ürün ekle");
        const ara = h("input", { type: "search", placeholder: "Ürün ara…", value: urunAra });
        ara.addEventListener("input", () => { urunAra = ara.value; urunGosterim = URUN_PARTI; listeCiz(); });
        ara.addEventListener("keydown", (e) => e.stopPropagation());
        const kategoriler = ["Tümü", ...new Set(urunler.map((u) => u.kategori).filter(Boolean))];
        if (!kategoriler.includes(urunKategori)) urunKategori = "Tümü";
        const cipler = h("div.cipler", kategoriler.map((k) => h("button.cip", { type: "button", "aria-pressed": String(k === urunKategori), onclick: () => { urunKategori = k; urunGosterim = URUN_PARTI; ciz(); } }, k)));
        const liste = h("div");
        let gozcu = null;
        function listeCiz() {
            if (gozcu) { gozcu.disconnect(); gozcu = null; }
            const l = urunlerSuzulmus();
            if (!urunler.length) {
                liste.replaceChildren(h("div.bos-durum", KS.ikon("urun", 34), h("p", "Ürün listeniz boş."), h("p.ipucu-metin", "Ürünleri tek tek ekleyin ya da Excel'den kopyalayıp yapıştırın."),
                    h("button.dugme.kucuk", { type: "button", onclick: () => iceAktarPenceresi() }, KS.ikon("tablo", 16), "Excel'den yapıştır")));
                return;
            }
            if (!l.length) { liste.replaceChildren(h("div.bos-durum", "Aramaya uyan ürün yok")); return; }
            // Düzenlenen ürün görünür kalsın
            const acikSira = acikUrun ? l.findIndex((u) => u.id === acikUrun) : -1;
            if (acikSira >= urunGosterim) urunGosterim = acikSira + 20;
            liste.replaceChildren(...l.slice(0, urunGosterim).map(urunSatiri));
            devamEkle(l);
        }
        function devamEkle(l) {
            const kalan = l.length - liste.querySelectorAll(":scope > .urun-satir").length;
            if (kalan <= 0) return;
            const d = h("button.dugme.kucuk.genis.liste-devam", { type: "button" }, `${kalan.toLocaleString("tr-TR")} ürün daha`);
            const yukle = () => {
                if (gozcu) { gozcu.disconnect(); gozcu = null; }
                const bas = urunGosterim;
                urunGosterim += URUN_PARTI;
                d.replaceWith(...l.slice(bas, urunGosterim).map(urunSatiri));
                devamEkle(l);
            };
            d.addEventListener("click", yukle);
            liste.append(d);
            // Kaydırıp sona yaklaşınca kendiliğinden
            if (window.IntersectionObserver) {
                gozcu = new IntersectionObserver((g) => { if (g.some((x) => x.isIntersecting)) yukle(); }, { rootMargin: "300px" });
                gozcu.observe(d);
            }
        }
        listeCiz();
        const yerlestir = h("button.dugme.birincil.genis", { type: "button", onclick: yerlesimPenceresi, disabled: !urunler.length }, KS.ikon("sihir", 17), "Ürünleri sayfalara yerleştir");
        return h("div",
            abellproKarti(),
            h("div.urun-arac", ekle, iceAktar),
            // Arama ve kategoriler liste kaydırılırken üstte sabit kalır
            h("div.yapiskan-ust", h("div.ara-kutu", KS.ikon("ara", 16), ara), kategoriler.length > 2 ? cipler : null),
            h("p.ipucu-metin", { style: { margin: "0 0 8px" } }, `${urunler.length} ürün · Sayfaya sürükleyin ya da + ile ekleyin. Bir kartın üzerine bırakırsanız o kartın ürünü değişir.`),
            liste,
            h("div.yapiskan-alt", yerlestir));
    };
    // AbellPro bağlantı kartı (Ürünler panelinin başında)
    function abellproKarti() {
        const ap = KS.abellpro;
        if (!ap) return null;
        const bagliSayi = E.belge.urunler.filter((u) => u.kaynak && u.kaynak.sistem === "abellpro").length;
        if (!ap.bagli()) {
            return h("button.buyuk-dugme.ap-kart", { type: "button", onclick: () => ap.baglantiPenceresi({ sonra: ap.hepsiniAl }) },
                h("span.ikon-kutu", KS.ikon("baglanti", 19)),
                h("div", h("b", "AbellPro'ya bağlan"), h("small", "Stok adları, fiyatları ve resimleri otomatik gelsin")));
        }
        const a = ap.ayar(), f = a.firma || {};
        const menu = h("button.ikon-dugme.kucuk", { type: "button", title: "AbellPro seçenekleri" }, KS.ikon("menu", 16));
        menu.addEventListener("click", () => KS.ui.menu([
            { ikon: "liste", etiket: "Seçerek ürün ekle…", fn: ap.stokPenceresi },
            { ikon: "marka", etiket: "Firma bilgilerini al (ad, telefon, logo)", fn: ap.firmaBilgisiAl },
            { ikon: "ayar", etiket: "Bağlantı bilgileri", fn: () => ap.baglantiPenceresi({}) },
            "-",
            { ikon: "kilitAcik", etiket: "Oturumu kapat", fn: ap.cikis },
            { ikon: "sil", etiket: "Lisansı bu tarayıcıdan kaldır", tehlike: true, fn: ap.lisansiSifirla }
        ], menu));
        return h("div.ap-kart.bagli",
            h("div.ap-kart-ust", h("span.ap-nokta"), h("div", h("b", f.kisaAd || f.unvan || "AbellPro"), h("small", a.adSoyad)), menu),
            h("div.ap-kart-eylem",
                h("button.dugme.kucuk.birincil", { type: "button", onclick: ap.hepsiniAl, title: "AbellPro'daki bütün aktif stoklar resimleriyle gelir; listede olanlar güncellenir" }, KS.ikon("indir", 15), "Tüm ürünleri al"),
                h("button.dugme.kucuk", { type: "button", onclick: ap.guncelle, disabled: !bagliSayi, title: "Fiyat, ad ve resimleri AbellPro'dan tazele (elle değiştirdikleriniz korunur)" }, KS.ikon("yenile", 15), bagliSayi ? `Güncelle (${bagliSayi})` : "Güncelle")));
    }
    function urunSatiri(u) {
        const acikMi = acikUrun === u.id;
        const fiyat = h("div.fiyat", KS.fiyatMetin(u.fiyat), u.eski > u.fiyat ? h("s", KS.fiyatMetin(u.eski)) : null);
        const ap = u.kaynak && u.kaynak.sistem === "abellpro";
        const satir = h("div.urun-satir" + (acikMi ? ".acik" : ""), { dataset: { id: u.id } },
            h("div.kucuk-gorsel", urunGorselEl(u)),
            h("div.bilgi", h("b", ap ? h("span.ap-cip", { title: "AbellPro'dan" + (u.kaynak.silindi ? " (AbellPro'da artık yok)" : "") }, u.kaynak.silindi ? "AP!" : "AP") : null, u.ad || "Adsız ürün"),
                h("small", [u.aciklama, u.kategori].filter(Boolean).join(" · ") || "—")),
            fiyat);
        if (!acikMi) {
            const eylem = h("div.satir-eylem",
                h("button.ikon-dugme.kucuk", { type: "button", title: "Sayfaya ekle", onclick: (e) => { e.stopPropagation(); urunKartiEkle(u.id); } }, KS.ikon("arti", 16)),
                h("button.ikon-dugme.kucuk", { type: "button", title: "Düzenle", onclick: (e) => { e.stopPropagation(); acikUrun = u.id; ciz(); } }, KS.ikon("kalem", 15)));
            satir.append(eylem);
            satir.addEventListener("click", () => { acikUrun = u.id; ciz(); });
            surukle(satir, () => ({ urunId: u.id }));
            // Satırın üzerine görsel bırakma
            satir.addEventListener("dragover", (e) => { if ([...e.dataTransfer.types].includes("Files")) { e.preventDefault(); satir.classList.add("birak-hedef"); } });
            satir.addEventListener("dragleave", () => satir.classList.remove("birak-hedef"));
            satir.addEventListener("drop", async (e) => {
                const d = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
                satir.classList.remove("birak-hedef");
                if (!d) return;
                e.preventDefault();
                const v = await KS.varlik.dosyadan(d);
                urunGuncelle(u, { gorsel: { varlik: v.id, emoji: null } }, true);
            });
        } else {
            satir.append(urunFormu(u));
        }
        return satir;
    }
    // AbellPro'dan gelen üründe kaynak bilgisi ve katalogda elle değiştirilen alanlar
    function abellproBilgi(u) {
        const k = u.kaynak;
        const AD = { ad: "ad", fiyat: "fiyat", eski: "eski fiyat", kategori: "kategori", birim: "birim", aciklama: "açıklama" };
        const elle = Object.keys(AD).filter((a) => String(u[a] ?? "") !== String(k[a] ?? ""));
        if (k.varlik && u.gorsel && u.gorsel.varlik !== k.varlik) elle.push("resim");
        return h("div.tam.ap-bilgi-kutu",
            h("div", h("span.ap-cip", "AP"), h("small", [`Kod ${String(k.kod ?? "").padStart(4, "0")}`, k.barkod ? `Barkod ${k.barkod}` : "", k.pasif ? "Pasif" : "", k.silindi ? "AbellPro'da bulunamadı" : ""].filter(Boolean).join(" · "))),
            h("small", elle.length ? `Katalogda değiştirildi: ${elle.map((a) => AD[a] || a).join(", ")}. Güncellemede bunlar korunur.` : "AbellPro ile aynı. \"Güncelle\" fiyatı ve bilgileri tazeler."),
            h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } },
                elle.length ? h("button.dugme.kucuk", { type: "button", onclick: () => { KS.abellpro.orijinaleDondur(u); ciz(); } }, KS.ikon("geri", 14), "AbellPro değerlerine dön") : null,
                h("button.dugme.kucuk.hayalet", { type: "button", onclick: () => { KS.abellpro.baglantiyiKaldir(u); ciz(); } }, "Bağlantıyı kaldır")));
    }
    function urunFormu(u) {
        const alan = (etiket, el, tam) => h("label" + (tam ? ".tam" : ""), etiket, el);
        const girdi = (k, oz = {}) => {
            const g = h("input.girdi", Object.assign({ value: u[k] ?? "" }, oz));
            g.addEventListener("input", () => urunGuncelle(u, { [k]: oz.inputmode === "decimal" ? KS.fiyatOku(g.value) : g.value }, false));
            g.addEventListener("change", () => { if (oz.inputmode === "decimal") g.value = KS.fiyatParca(KS.fiyatOku(g.value)).metin; KS.gecmis.kaydet(); });
            g.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") g.blur(); });
            return g;
        };
        const kategoriListe = h("datalist#kategoriListesi", [...new Set(E.belge.urunler.map((x) => x.kategori).filter(Boolean))].map((k) => h("option", { value: k })));
        const birimListe = h("datalist#birimListesi", ["/kg", "/adet", "/lt", "/paket", "/100 g", "/demet"].map((k) => h("option", { value: k })));
        const gorsel = h("div.kucuk-gorsel", { style: { width: "56px", height: "56px" } }, urunGorselEl(u, 56));
        const gorselSatir = h("div.tam", { style: { display: "flex", gap: "8px", alignItems: "center" } }, gorsel,
            h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } },
                h("button.dugme.kucuk", { type: "button", onclick: async () => { const [d] = await KS.dosyaSec({ kabul: "image/*" }); if (!d) return; const v = await KS.varlik.dosyadan(d); urunGuncelle(u, { gorsel: { varlik: v.id, emoji: null } }, true); ciz(); } }, KS.ikon("yukle", 15), "Görsel yükle"),
                h("button.dugme.kucuk", { type: "button", onclick: (e) => emojiSec(e.currentTarget, (em) => { urunGuncelle(u, { gorsel: { varlik: null, emoji: em } }, true); ciz(); }) }, KS.ikon("emoji", 15), "Emoji")));
        const form = h("div.urun-form",
            alan("Ürün adı", girdi("ad", { placeholder: "ör. Tam Yağlı Süt" }), true),
            alan("Açıklama / gramaj", girdi("aciklama", { placeholder: "ör. 1 L" }), true),
            alan("Fiyat (₺)", girdi("fiyat", { inputmode: "decimal", value: KS.fiyatParca(u.fiyat).metin })),
            alan("Eski fiyat", girdi("eski", { inputmode: "decimal", value: u.eski ? KS.fiyatParca(u.eski).metin : "", placeholder: "Yoksa boş" })),
            alan("Birim", girdi("birim", { list: "birimListesi", placeholder: "ör. /kg" })),
            alan("Kategori", girdi("kategori", { list: "kategoriListesi", placeholder: "ör. Meyve & Sebze" })),
            alan("Rozet", girdi("rozet", { placeholder: "Boşsa indirim % gösterilir" }), true),
            gorselSatir, kategoriListe, birimListe,
            u.kaynak && u.kaynak.sistem === "abellpro" ? abellproBilgi(u) : null,
            h("div.form-eylem",
                h("button.dugme.kucuk.tehlike", { type: "button", onclick: () => urunSil(u) }, KS.ikon("sil", 15), "Sil"),
                h("div", { style: { display: "flex", gap: "6px" } },
                    h("button.dugme.kucuk", { type: "button", onclick: () => urunKartiEkle(u.id) }, KS.ikon("arti", 15), "Sayfaya ekle"),
                    h("button.dugme.kucuk.birincil", { type: "button", onclick: () => { acikUrun = null; ciz(); } }, "Bitti"))));
        form.addEventListener("click", (e) => e.stopPropagation());
        setTimeout(() => form.querySelector("input")?.focus(), 30);
        return form;
    }
    const urunKayitGecikmeli = KS.gecikmeli(() => KS.gecmis.kaydet(), 600);
    function urunGuncelle(u, alanlar, hemen) {
        Object.assign(u, alanlar);
        if ("ad" in alanlar && (!u.gorsel || (!u.gorsel.varlik && (u.gorsel.emoji === "🛒" || !u.gorsel.emoji)))) u.gorsel = { varlik: null, emoji: emojiTahmin(u.ad) };
        KS.editor.urunKartlariniEsitle(u);
        KS.editor.tumunuCiz();
        // Satırın özetini (ad, fiyat) anında yenile; formu bozmadan
        const satir = KS.$(`.urun-satir[data-id="${u.id}"]`, govde);
        if (satir) {
            satir.querySelector(".bilgi b").textContent = u.ad || "Adsız ürün";
            satir.querySelector(".bilgi small").textContent = [u.aciklama, u.kategori].filter(Boolean).join(" · ") || "—";
            satir.querySelector(".fiyat").replaceChildren(KS.fiyatMetin(u.fiyat), u.eski > u.fiyat ? h("s", KS.fiyatMetin(u.eski)) : "");
            satir.querySelector(".kucuk-gorsel").replaceChildren(urunGorselEl(u));
        }
        if (hemen) KS.gecmis.kaydet(); else urunKayitGecikmeli();
    }
    function yeniUrun() {
        const u = { id: KS.kimlik("u"), ad: "Yeni ürün", aciklama: "", fiyat: 0, eski: 0, birim: "", kategori: urunKategori !== "Tümü" ? urunKategori : "", rozet: "", gorsel: { varlik: null, emoji: "🛒" } };
        E.belge.urunler.unshift(u);
        acikUrun = u.id;
        urunAra = "";
        KS.gecmis.kaydet();
        ciz();
        setTimeout(() => { const g = govde.querySelector(".urun-form input"); if (g) g.select(); }, 40);
    }
    async function urunSil(u) {
        const kart = E.belge.sayfalar.some((s) => s.ogeler.some((o) => o.urunId === u.id));
        if (kart && !(await KS.ui.onayla({ baslik: "Ürünü sil", metin: "Bu ürün sayfalarda kullanılıyor. Listeden silinir; sayfadaki kartlar bağımsız olarak kalır.", evet: "Sil", tehlike: true }))) return;
        E.belge.urunler = E.belge.urunler.filter((x) => x !== u);
        for (const s of E.belge.sayfalar) for (const o of s.ogeler) if (o.urunId === u.id) o.urunId = null;
        acikUrun = null;
        KS.gecmis.kaydet();
        ciz();
    }
    function emojiSec(capa, fn) {
        const kok = h("div", { style: { width: "320px", padding: "10px", maxHeight: "360px", overflow: "auto" } },
            KS.EMOJI_GRUPLARI.map((g) => [h("div.menu-baslik", g.ad), h("div.izgara.s6", [...new Intl.Segmenter("tr", { granularity: "grapheme" }).segment(g.liste)].map((s) => s.segment).map((em) =>
                h("button.kutucuk.emoji-kutu", { type: "button", onclick: () => { KS.ui.kapat(); fn(em); } }, em)))]));
        KS.ui.acilir(kok, capa, { yer: "sag" });
    }
    // Ürün kartı: sayfadaki kartlarla aynı boyut ve stil
    function urunKartiEkle(urunId, { merkez, sayfaId } = {}) {
        const u = E.belge.urunler.find((x) => x.id === urunId);
        if (!u) return;
        const s = KS.editor.sayfa(sayfaId || E.sayfaId);
        const ornek = s.ogeler.find((o) => o.tur === "urun");
        const w = ornek ? ornek.w : Math.round(W() * 0.3), hh = ornek ? ornek.h : Math.round(W() * 0.32);
        const kart = KS.sablon.kart(u, 0, 0, w, hh, ornek ? ornek.stil : {});
        KS.editor.ekle(kart, { merkez, sayfaId });
    }
    function csvIndir() {
        const kac = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
        const satirlar = [["Ürün adı", "Açıklama", "Fiyat", "Eski fiyat", "Birim", "Kategori", "Rozet"].map(kac).join(";")];
        for (const u of E.belge.urunler) satirlar.push([u.ad, u.aciklama, KS.fiyatParca(u.fiyat).metin, u.eski ? KS.fiyatParca(u.eski).metin : "", u.birim, u.kategori, u.rozet].map(kac).join(";"));
        KS.indir(new Blob(["﻿" + satirlar.join("\r\n")], { type: "text/csv;charset=utf-8" }), KS.dosyaAdi(E.belge.ad) + "-urunler.csv");
    }

    // ── İçe aktarma (Excel / CSV) ───────────────────────────────
    const ALANLAR = [
        { k: "eski", ad: "Eski fiyat", anahtar: ["eski", "önceki", "liste fiyat", "normal fiyat", "piyasa", "raf fiyat"] },
        { k: "kategori", ad: "Kategori", anahtar: ["kategori", "reyon", "grup", "bölüm"] },
        { k: "birim", ad: "Birim", anahtar: ["birim", "unit"] },
        { k: "rozet", ad: "Rozet", anahtar: ["rozet", "etiket", "kampanya", "not"] },
        { k: "aciklama", ad: "Açıklama", anahtar: ["açıklama", "gramaj", "detay", "ölçü", "miktar", "ambalaj", "hacim", "ağırlık"] },
        { k: "fiyat", ad: "Fiyat", anahtar: ["fiyat", "satış", "indirimli", "yeni", "tutar", "price"] },
        { k: "ad", ad: "Ürün adı", anahtar: ["ürün", "ad", "isim", "tanım", "malzeme", "name", "ürün adı"] }
    ];
    function csvAyristir(metin) {
        const ilk = metin.split(/\r?\n/).find((s) => s.trim()) || "";
        const say = (c) => ilk.split(c).length - 1;
        const ayrac = say("\t") ? "\t" : say(";") >= say(",") && say(";") ? ";" : ",";
        const satirlar = []; let satir = [], alan = "", tirnak = false;
        for (let i = 0; i < metin.length; i++) {
            const c = metin[i];
            if (tirnak) { if (c === '"') { if (metin[i + 1] === '"') { alan += '"'; i++; } else tirnak = false; } else alan += c; }
            else if (c === '"' && alan === "") tirnak = true;
            else if (c === ayrac) { satir.push(alan); alan = ""; }
            else if (c === "\n" || c === "\r") { if (c === "\r" && metin[i + 1] === "\n") i++; satir.push(alan); satirlar.push(satir); satir = []; alan = ""; }
            else alan += c;
        }
        if (alan !== "" || satir.length) { satir.push(alan); satirlar.push(satir); }
        return satirlar.map((s) => s.map((x) => x.trim())).filter((s) => s.some(Boolean));
    }
    const sayiMi = (s) => /^[₺$€\s]*-?\d[\d.,\s]*(tl|₺)?\s*$/i.test(String(s || "").trim());
    function eslesmeBul(satirlar) {
        const n = Math.max(...satirlar.map((s) => s.length));
        const bas = satirlar[0] || [];
        const baslikVar = bas.some((c) => !sayiMi(c) && ALANLAR.some((a) => a.anahtar.some((k) => KS.sade(c).includes(KS.sade(k))))) && bas.filter((c) => sayiMi(c)).length === 0;
        const esle = new Array(n).fill("");
        if (baslikVar) {
            const kullanildi = new Set();
            bas.forEach((c, i) => {
                const s = KS.sade(c);
                const a = ALANLAR.find((x) => !kullanildi.has(x.k) && x.anahtar.some((k) => s.includes(KS.sade(k))));
                if (a) { esle[i] = a.k; kullanildi.add(a.k); }
            });
        } else {
            const veri = satirlar.slice(0, 30);
            const sayisal = [], metinsel = [];
            for (let i = 0; i < n; i++) {
                const hucreler = veri.map((s) => s[i]).filter(Boolean);
                const oran = hucreler.filter(sayiMi).length / Math.max(1, hucreler.length);
                (oran > 0.7 ? sayisal : metinsel).push(i);
            }
            if (metinsel[0] != null) esle[metinsel[0]] = "ad";
            if (metinsel[1] != null) esle[metinsel[1]] = "aciklama";
            if (metinsel[2] != null) esle[metinsel[2]] = "kategori";
            const ort = (i) => veri.reduce((t, s) => t + KS.fiyatOku(s[i] || 0), 0) / veri.length;
            const sirali = sayisal.slice().sort((a, b) => ort(a) - ort(b));
            if (sirali[0] != null) esle[sirali[0]] = "fiyat";
            if (sirali[1] != null) esle[sirali[1]] = "eski";
        }
        return { esle, baslikVar };
    }
    async function iceAktarPenceresi(dosya) {
        let satirlar = [], esle = [], baslikVar = false, mod = "ekle";
        const alan = h("textarea.alan-metin", { rows: 6, placeholder: "Excel'de ürün tablonuzu seçip kopyalayın (Ctrl+C), buraya yapıştırın (Ctrl+V).\n\nÖrnek:\nÜrün adı\tAçıklama\tFiyat\tEski fiyat\nTam Yağlı Süt\t1 L\t34,90\t42,50" });
        const onizlemeKap = h("div");
        const bilgi = h("p.ipucu-metin");
        let ekleDugme;
        alan.addEventListener("keydown", (e) => e.stopPropagation());
        alan.addEventListener("input", () => yukle(alan.value));
        function yukle(metin) { satirlar = csvAyristir(metin); ({ esle, baslikVar } = eslesmeBul(satirlar)); goster(); }
        function urunlerOlustur() {
            const veri = baslikVar ? satirlar.slice(1) : satirlar;
            return veri.map((s) => {
                const u = { id: KS.kimlik("u"), ad: "", aciklama: "", fiyat: 0, eski: 0, birim: "", kategori: "", rozet: "", gorsel: { varlik: null, emoji: "🛒" } };
                esle.forEach((k, i) => { if (!k) return; const v = s[i] ?? ""; u[k] = k === "fiyat" || k === "eski" ? KS.fiyatOku(v) : v; });
                u.gorsel.emoji = emojiTahmin(u.ad);
                return u;
            }).filter((u) => u.ad);
        }
        function goster() {
            if (!satirlar.length) { onizlemeKap.replaceChildren(); bilgi.textContent = ""; if (ekleDugme) ekleDugme.disabled = true; return; }
            const n = Math.max(...satirlar.map((s) => s.length));
            const secimler = Array.from({ length: n }, (_, i) => {
                const s = h("select.secim", h("option", { value: "" }, "— Kullanma —"), ALANLAR.slice().reverse().map((a) => h("option", { value: a.k, selected: esle[i] === a.k }, a.ad)));
                s.addEventListener("change", () => { esle[i] = s.value; goster(); });
                return h("th", s);
            });
            const veri = (baslikVar ? satirlar.slice(1) : satirlar).slice(0, 50);
            const tablo = h("table.veri", h("thead", h("tr", secimler), baslikVar ? h("tr", satirlar[0].map((c) => h("th", { style: { fontWeight: 500, color: "var(--yazi-3)" } }, c))) : null),
                h("tbody", veri.map((s) => h("tr", Array.from({ length: n }, (_, i) => h("td", s[i] || ""))))));
            onizlemeKap.replaceChildren(h("div.tablo-kap", tablo));
            const sayi = urunlerOlustur().length;
            bilgi.textContent = `${sayi} ürün bulundu${baslikVar ? " (ilk satır başlık olarak algılandı)" : ""}. Sütunların ne olduğunu üstteki seçimlerle düzeltebilirsiniz.`;
            if (ekleDugme) { ekleDugme.disabled = !sayi || !esle.includes("ad"); ekleDugme.lastChild.textContent = `${sayi} ürünü ekle`; }
        }
        const dosyaDugme = h("button.dugme.kucuk", { type: "button" }, KS.ikon("dosya", 15), "Dosya seç (.xlsx, .csv)");
        dosyaDugme.addEventListener("click", async () => { const [d] = await KS.dosyaSec({ kabul: ".xlsx,.xls,.csv,.txt,.tsv" }); if (d) dosyaOku(d); });
        async function dosyaOku(d) {
            try {
                if (/\.xlsx?$/i.test(d.name)) {
                    await KS.betikYukle(KS.KUTUPHANE.excel);
                    const wb = window.XLSX.read(await d.arrayBuffer(), { type: "array" });
                    const sayfa = wb.Sheets[wb.SheetNames[0]];
                    const dizi = window.XLSX.utils.sheet_to_json(sayfa, { header: 1, raw: false, defval: "" });
                    alan.value = dizi.map((s) => s.map((x) => String(x).replace(/\t|\n/g, " ")).join("\t")).join("\n");
                } else alan.value = await KS.metinOku(d);
                yukle(alan.value);
            } catch (h) { KS.bildir("Dosya okunamadı: " + h.message, { tur: "hata", sure: 4000 }); }
        }
        const modSec = KS.ui.bolumlu({ secenekler: [{ deger: "ekle", etiket: "Listeye ekle" }, { deger: "degistir", etiket: "Listeyi değiştir" }], deger: mod, degisti: (v) => { mod = v; } });
        modSec.el.style.flex = "none";
        KS.ui.pencere({
            baslik: "Ürünleri içe aktar", aciklama: "Excel, Google E-Tablolar ya da CSV'den ürün listenizi aktarın. Fiyatlar 49,90 / 49.90 / ₺49 biçimlerinde okunur.", sinif: "genis",
            icerik: h("div", { style: { display: "grid", gap: "12px" } },
                h("div", { style: { display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between" } }, dosyaDugme, modSec.el),
                alan, bilgi, onizlemeKap),
            ilkOdak: alan,
            dugmeler: [{ etiket: "Vazgeç" }, {
                etiket: "Ürünleri ekle", birincil: true, ikon: "tamam", pasif: true, ref: (b) => { ekleDugme = b; }, fn: () => {
                    const yeni = urunlerOlustur();
                    if (!yeni.length) return false;
                    if (mod === "degistir") E.belge.urunler = yeni; else E.belge.urunler.push(...yeni);
                    urunKategori = "Tümü";
                    KS.gecmis.kaydet();
                    KS.olay.yay("urunler");
                    if (acik !== "urunler") ac("urunler");
                    KS.bildir(`${yeni.length} ürün eklendi`, { tur: "basari", eylem: { metin: "Sayfalara yerleştir", fn: yerlesimPenceresi } });
                }
            }]
        });
        if (dosya) dosyaOku(dosya);
    }

    // ── Görselleri dosya adına göre eşleştirme ──────────────────
    async function gorselEslestirPenceresi() {
        const dosyalar = (await KS.dosyaSec({ kabul: "image/*", coklu: true })).filter((f) => f.type.startsWith("image/"));
        if (!dosyalar.length) return;
        const kelimeler = (s) => KS.sade(s).replace(/\.[a-z0-9]+$/, "").split(/[^a-z0-9ğüşöçı]+/).filter((w) => w.length > 1);
        const eslesmeler = dosyalar.map((d) => {
            const dk = kelimeler(d.name);
            let en = null, enPuan = 0;
            for (const u of E.belge.urunler) {
                const uk = kelimeler(u.ad + " " + (u.aciklama || ""));
                const ortak = dk.filter((w) => uk.some((x) => x.startsWith(w) || w.startsWith(x))).length;
                const puan = ortak / Math.max(dk.length, 1);
                if (puan > enPuan) { enPuan = puan; en = u; }
            }
            return { dosya: d, urun: enPuan >= 0.34 ? en : null, url: URL.createObjectURL(d) };
        });
        const satirlar = eslesmeler.map((e) => {
            const s = h("select.secim", h("option", { value: "" }, "— Eşleştirme —"), E.belge.urunler.map((u) => h("option", { value: u.id, selected: e.urun === u }, u.ad)));
            s.addEventListener("change", () => { e.urun = E.belge.urunler.find((u) => u.id === s.value) || null; });
            return h("tr", h("td", h("img", { src: e.url, style: { width: "44px", height: "44px", objectFit: "contain", borderRadius: "6px", background: "var(--z2)" } })),
                h("td", { style: { maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis" } }, e.dosya.name), h("td", s));
        });
        KS.ui.pencere({
            baslik: "Görselleri ürünlerle eşleştir", aciklama: "Dosya adları ürün adlarıyla karşılaştırıldı. Gerekirse eşleşmeleri düzeltin.", sinif: "genis",
            icerik: h("div.tablo-kap", { style: { maxHeight: "460px" } }, h("table.veri", h("thead", h("tr", h("th", "Görsel"), h("th", "Dosya"), h("th", "Ürün"))), h("tbody", satirlar))),
            kapaninca: () => eslesmeler.forEach((e) => URL.revokeObjectURL(e.url)),
            dugmeler: [{ etiket: "Vazgeç" }, {
                etiket: "Görselleri uygula", birincil: true, fn: async () => {
                    let n = 0;
                    for (const e of eslesmeler) {
                        if (!e.urun) continue;
                        const v = await KS.varlik.dosyadan(e.dosya);
                        e.urun.gorsel = { varlik: v.id, emoji: null };
                        KS.editor.urunKartlariniEsitle(e.urun);
                        n++;
                    }
                    KS.editor.tumunuCiz();
                    KS.gecmis.kaydet();
                    KS.olay.yay("urunler");
                    KS.bildir(`${n} ürünün görseli güncellendi`, { tur: "basari" });
                }
            }]
        });
    }

    // ── Otomatik yerleşim penceresi ─────────────────────────────
    function yerlesimPenceresi() {
        const s = KS.editor.sayfa();
        const d = KS.sablon.sayfaDuzeni(s, E.belge);
        const ayar = { sutun: d.sutun, satir: d.satir, bosluk: d.bosluk, alan: Object.assign({}, d.alan), kaynak: urunKategori !== "Tümü" ? urunKategori : E.belge.urunler.some((u) => u.kaynak && u.kaynak.sistem === "abellpro") ? "abellpro" : "hepsi", sira: "liste", kategoriSayfa: false, duzen: d.stil ? "mevcut" : "klasik" };
        const urunListesi = () => {
            let l = ayar.kaynak === "hepsi" ? E.belge.urunler.slice() : ayar.kaynak === "arama" ? urunlerSuzulmus() : ayar.kaynak === "abellpro" ? E.belge.urunler.filter((u) => u.kaynak && u.kaynak.sistem === "abellpro") : E.belge.urunler.filter((u) => u.kategori === ayar.kaynak);
            if (ayar.sira === "fiyat") l.sort((a, b) => a.fiyat - b.fiyat);
            else if (ayar.sira === "ad") l.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
            else if (ayar.sira === "indirim") l.sort((a, b) => KS.indirimYuzde(b.fiyat, b.eski) - KS.indirimYuzde(a.fiyat, a.eski));
            return l;
        };
        const ozet = h("div.bilgi-kutu");
        const onizlemeKutu = h("div", { style: { position: "relative", alignSelf: "start" } });
        const alanCizgi = h("div.urun-alani-cizgi", h("span", "Ürün alanı"));
        const kucukGen = 220, oran = kucukGen / E.belge.genislik;
        onizlemeKutu.append(KS.cizim.kucukResim(Object.assign({}, s, { ogeler: s.ogeler.filter((o) => o.tur !== "urun") }), E.belge, kucukGen), alanCizgi);
        onizlemeKutu.firstChild.style.borderRadius = "6px";
        onizlemeKutu.firstChild.style.boxShadow = "0 0 0 1px var(--cizgi)";
        function guncelle() {
            const a = ayar.alan;
            Object.assign(alanCizgi.style, { left: a.x * oran + "px", top: a.y * oran + "px", width: a.w * oran + "px", height: a.h * oran + "px" });
            alanCizgi.replaceChildren(h("span", { style: { fontSize: "10px", top: "-18px" } }, `${ayar.sutun} × ${ayar.satir}`));
            // ızgara çizgileri
            const gw = (a.w - ayar.bosluk * (ayar.sutun - 1)) / ayar.sutun, gh = (a.h - ayar.bosluk * (ayar.satir - 1)) / ayar.satir;
            for (let i = 0; i < ayar.sutun * ayar.satir; i++) {
                alanCizgi.append(h("div", { style: { position: "absolute", left: (i % ayar.sutun) * (gw + ayar.bosluk) * oran + "px", top: Math.floor(i / ayar.sutun) * (gh + ayar.bosluk) * oran + "px", width: gw * oran + "px", height: gh * oran + "px", background: "rgba(108,71,255,.18)", borderRadius: "2px" } }));
            }
            const l = urunListesi();
            const adet = ayar.sutun * ayar.satir;
            let sayfa = Math.max(1, Math.ceil(l.length / adet));
            if (ayar.kategoriSayfa) sayfa = [...new Set(l.map((u) => u.kategori || ""))].reduce((t, k) => t + Math.max(1, Math.ceil(l.filter((u) => (u.kategori || "") === k).length / adet)), 0);
            ozet.replaceChildren(KS.ikon("bilgi", 17), h("div", h("b", `${l.length} ürün → ${sayfa} sayfa`), h("div", `Etkin sayfanın tasarımı (arka plan, başlık, alt bilgi) her yeni sayfaya kopyalanır. Sayfa başına ${adet} ürün.`)));
        }
        const kategoriler = [...new Set(E.belge.urunler.map((u) => u.kategori).filter(Boolean))];
        const apSayi = E.belge.urunler.filter((u) => u.kaynak && u.kaynak.sistem === "abellpro").length;
        const kaynakSec = KS.ui.secim({ secenekler: [{ deger: "hepsi", etiket: `Tüm ürünler (${E.belge.urunler.length})` }, ...(urunAra ? [{ deger: "arama", etiket: `Arama sonucu (${urunlerSuzulmus().length})` }] : []), ...(apSayi ? [{ deger: "abellpro", etiket: `AbellPro ürünleri (${apSayi})` }] : []), ...kategoriler.map((k) => ({ deger: k, etiket: `${k} (${E.belge.urunler.filter((u) => u.kategori === k).length})` }))], deger: ayar.kaynak, degisti: (v) => { ayar.kaynak = v; guncelle(); } });
        const siraSec = KS.ui.secim({ secenekler: [{ deger: "liste", etiket: "Liste sırası" }, { deger: "fiyat", etiket: "Fiyat (artan)" }, { deger: "indirim", etiket: "İndirim oranı" }, { deger: "ad", etiket: "Ada göre (A–Z)" }], deger: ayar.sira, degisti: (v) => { ayar.sira = v; } });
        const sayiAlan = (on, k, min, max, alt) => KS.ui.sayi({ on, deger: alt ? ayar.alan[k] : ayar[k], min, max, degisti: (v) => { if (alt) ayar.alan[k] = v; else ayar[k] = v; guncelle(); } }).el;
        const duzenSecenek = [...(d.stil ? [{ deger: "mevcut", etiket: "Sayfadaki kart stili" }] : []), ...Object.entries(KS.URUN_DUZENLERI).map(([k, v]) => ({ deger: k, etiket: v.ad }))];
        const duzenSec = KS.ui.secim({ secenekler: duzenSecenek, deger: ayar.duzen, degisti: (v) => { ayar.duzen = v; } });
        const katSayfa = KS.ui.anahtar({ deger: false, degisti: (v) => { ayar.kategoriSayfa = v; guncelle(); } });
        const form = h("div", { style: { display: "grid", gap: "4px", alignContent: "start" } },
            KS.ui.alan("Ürünler", kaynakSec.el), KS.ui.alan("Sıralama", siraSec.el), KS.ui.alan("Kart stili", duzenSec.el),
            h("div.bolum-baslik", { style: { margin: "14px 0 4px" } }, "Izgara"),
            h("div.izgara-3", sayiAlan("Sütun", "sutun", 1, 8), sayiAlan("Satır", "satir", 1, 12), sayiAlan("Ara", "bosluk", 0, 200)),
            h("div.bolum-baslik", { style: { margin: "14px 0 4px" } }, "Ürün alanı (px)"),
            h("div.izgara-2", sayiAlan("X", "x", -2000, 6000, true), sayiAlan("Y", "y", -2000, 6000, true), sayiAlan("G", "w", 20, 6000, true), sayiAlan("Y", "h", 20, 6000, true)),
            h("label.alan", { style: { gridTemplateColumns: "1fr auto", marginTop: "12px" } }, h("span.etiket", "Her kategori yeni sayfadan başlasın"), katSayfa.el),
            ozet);
        guncelle();
        KS.ui.pencere({
            baslik: "Ürünleri sayfalara yerleştir", aciklama: "Ürün listeniz, etkin sayfanın düzeniyle otomatik olarak sayfalara dağıtılır.", sinif: "genis",
            icerik: h("div.iki-sutun", form, onizlemeKutu),
            dugmeler: [{ etiket: "Vazgeç" }, {
                etiket: "Yerleştir", birincil: true, ikon: "sihir", fn: () => {
                    const l = urunListesi();
                    if (!l.length) { KS.bildir("Yerleştirilecek ürün yok"); return false; }
                    const stil = ayar.duzen === "mevcut" ? d.stil : Object.assign({}, d.stil || {}, { duzen: ayar.duzen });
                    let gruplar = [{ ad: "", urunler: l }];
                    if (ayar.kategoriSayfa) {
                        const m = new Map();
                        for (const u of l) { const k = u.kategori || "Diğer"; if (!m.has(k)) m.set(k, []); m.get(k).push(u); }
                        gruplar = [...m.entries()].map(([ad, urunler]) => ({ ad, urunler }));
                    }
                    const sonuc = KS.sablon.otomatikYerlesim(E.belge, { gruplar, kaynakId: s.id, sutun: ayar.sutun, satir: ayar.satir, bosluk: ayar.bosluk, alan: ayar.alan, stil });
                    KS.editor.sec([]);
                    KS.editor.tumunuCiz();
                    KS.gecmis.kaydet();
                    KS.olay.yay("belge");
                    KS.bildir(`${sonuc.urunSayisi} ürün ${sonuc.sayfaSayisi} sayfaya yerleştirildi`, { tur: "basari", eylem: { metin: "Geri al", fn: () => KS.gecmis.geri() } });
                }
            }]
        });
    }

    // ── Metin ───────────────────────────────────────────────────
    const T = (oz) => Object.assign({ tur: "metin", x: 0, y: 0 }, oz);
    const YAZI_STILLERI = [
        [T({ w: 520, metin: "SÜPER FİYAT", font: "Anton", boyut: 72, dolgu: "#ffd400", kontur: { k: 4, renk: "#b00010" }, derinlik: { k: 6, aci: 90, renk: "#5a0008" }, hiza: "center" })],
        [T({ w: 380, metin: "İNDİRİM", font: "Bebas Neue", boyut: 80, dolgu: "#ffffff", harf: 60, hiza: "center", vurgu: { renk: "#e30613", bosluk: 12, yaricap: 6 } })],
        [T({ w: 560, metin: "Haftanın Fırsatları", font: "Lobster", boyut: 56, dolgu: "#e30613", hiza: "center", golgeler: [{ x: 3, y: 3, b: 0, renk: "#ffd400" }] })],
        [T({ w: 440, metin: "taze & doğal", font: "Pacifico", boyut: 54, hiza: "center", dolgu: { tip: "dogrusal", aci: 90, duraklar: [{ r: "#16a34a", k: 0 }, { r: "#84cc16", k: 100 }] }, golgeler: [{ x: 0, y: 4, b: 8, renk: "rgba(0,0,0,.18)" }] })],
        [T({ w: 300, metin: "%50", font: "Archivo Black", boyut: 110, dolgu: "#e30613", hiza: "center", derinlik: { k: 8, aci: 135, renk: "#ffd400" } })],
        [T({ w: 420, metin: "KAÇIRMA!", font: "Bangers", boyut: 84, dolgu: "#ffd400", hiza: "center", kontur: { k: 3, renk: "#1d1d1f" }, derinlik: { k: 6, aci: 60, renk: "#1d1d1f" } })],
        [T({ w: 420, metin: "Sadece bu hafta", font: "Kaushan Script", boyut: 48, dolgu: "#1d4ed8", hiza: "center" })],
        [T({ w: 380, metin: "YENİ ÜRÜN", font: "Montserrat", kalin: 900, boyut: 36, dolgu: "#ffffff", harf: 120, hiza: "center", vurgu: { renk: "#16a34a", bosluk: 10, yaricap: 30 } })],
        [T({ w: 420, metin: "GECE FIRSATI", font: "Bebas Neue", boyut: 70, dolgu: "#fff0f6", hiza: "center", golgeler: [{ x: 0, y: 0, b: 6, renk: "#ff3d6e" }, { x: 0, y: 0, b: 18, renk: "#ff3d6e" }, { x: 0, y: 0, b: 36, renk: "#c026d3" }] })],
        [T({ w: 420, metin: "1 ALANA 1 BEDAVA", font: "Russo One", boyut: 34, dolgu: "#ffffff", hiza: "center", vurgu: { renk: "#6c47ff", bosluk: 12, yaricap: 8 } })],
        [T({ w: 380, metin: "FIRSAT", font: "Anton", boyut: 96, dolgu: "transparent", hiza: "center", harf: 40, kontur: { k: 2.5, renk: "#1d1d1f" } })],
        [T({ w: 420, metin: "LEZZET", font: "Shrikhand", boyut: 72, dolgu: "#ff3d6e", hiza: "center", golgeler: [{ x: 3, y: 3, b: 0, renk: "#ffd400" }, { x: 6, y: 6, b: 0, renk: "#1d4ed8" }] })],
        [T({ w: 420, metin: "KAMPANYA ÜRÜNLERİ", font: "Bebas Neue", boyut: 50, dolgu: "#e30613", hiza: "center", egri: 45 })],
        [T({ w: 460, metin: "Stoklarla sınırlıdır", font: "Playfair Display", italik: true, boyut: 40, dolgu: "#7f1d1d", hiza: "center" })],
        [T({ w: 360, metin: "BUGÜNE ÖZEL", font: "Oswald", kalin: 700, boyut: 54, dolgu: { tip: "dogrusal", aci: 180, duraklar: [{ r: "#ffe066", k: 0 }, { r: "#ff8a00", k: 100 }] }, hiza: "center", kontur: { k: 2, renk: "#7c2d12" } })],
        [T({ w: 520, metin: "Kampanya 1–7 Ekim tarihleri arasında geçerlidir.\nStoklarla sınırlıdır. Fiyatlara KDV dahildir.", font: "Inter", kalin: 500, boyut: 14, satir: 1.45, dolgu: "#4b5563" })]
    ];
    cizimler.metin = () => {
        const ekleDugme = (ornek, oz, alt) => {
            const b = h("button.metin-ekle", { type: "button" }, h("span", { style: ornek }, alt));
            const uret = () => KS.model.yeni("metin", Object.assign({ w: Math.round(W() * 0.6), hiza: "left" }, oz, { boyut: Math.round(oz.boyut * W() / 794) }));
            b.addEventListener("click", () => { const [o] = KS.editor.ekle(uret()); setTimeout(() => KS.editor.metinDuzenle(o.id), 30); });
            surukle(b, () => ({ ogeler: [uret()] }));
            return b;
        };
        yaziFontlariniYukle();
        const stiller = h("div.izgara.s2", YAZI_STILLERI.map((liste) => {
            const uret = () => olcekli(liste.map((o) => Object.assign(KS.kopya(o), { id: KS.kimlik("o") }))).map((o) => {
                // Kutu yazıya otursun (ortalı yazıda merkez korunur)
                if (o.tur === "metin" && !o.egri) { const g = Math.min(o.w, KS.metinGenisligi(o)); if (o.hiza === "center") o.x += (o.w - g) / 2; o.w = g; }
                return o;
            });
            return kutucuk(onizleme(liste, 112, 58), { ipucu: liste[0].metin, sinif: ".kagit", stil: { height: "78px", padding: "6px" }, tikla: () => KS.editor.ekle(uret()), veri: () => ({ ogeler: uret() }) });
        }));
        return h("div",
            ekleDugme({ fontSize: "22px", fontWeight: 800 }, { metin: "Başlık", font: "Inter", kalin: 800, boyut: 56 }, "Başlık ekle"),
            ekleDugme({ fontSize: "16px", fontWeight: 600 }, { metin: "Alt başlık", font: "Inter", kalin: 600, boyut: 32 }, "Alt başlık ekle"),
            ekleDugme({ fontSize: "13px" }, { metin: "Gövde metni", font: "Inter", kalin: 400, boyut: 18, satir: 1.45 }, "Gövde metni ekle"),
            bolumBaslik("Hazır yazı stilleri"),
            h("p.ipucu-metin", "Tıklayın ya da sayfaya sürükleyin; ardından yazıyı çift tıklayıp değiştirin."),
            stiller);
    };

    // Hazır stillerin fontları yüklenince önizlemeler doğru ölçüyle yeniden çizilsin
    let yaziFontlari = null;
    function yaziFontlariniYukle() {
        if (yaziFontlari) return;
        const aileler = new Map();
        for (const liste of YAZI_STILLERI) for (const o of liste) aileler.set(o.font, o.kalin || 400);
        for (const r of ROZETLER) for (const o of r()) if (o.tur === "metin") aileler.set(o.font, o.kalin || 400);
        for (const f of FIYATLAR) aileler.set(f.font || "Anton", 400);
        yaziFontlari = Promise.all([...aileler].map(([a, w]) => KS.fontlar.hazir(a, w))).then(() => {
            if (acik === "metin" || acik === "ogeler") ciz();
        });
    }

    // ── Öğeler ──────────────────────────────────────────────────
    const S = (oz) => Object.assign({ tur: "sekil", x: 0, y: 0 }, oz);
    const MT = (oz) => Object.assign({ tur: "metin", hiza: "center" }, oz);
    const ROZETLER = [
        () => grupla([S({ sekil: "patlama", w: 190, h: 190, uc: 18, ic: 0.84, dolgu: "#e30613" }), MT({ x: 0, y: 46, w: 190, metin: "%50", font: "Anton", boyut: 64, dolgu: "#ffffff" }), MT({ x: 0, y: 122, w: 190, metin: "İNDİRİM", font: "Inter", kalin: 800, boyut: 17, harf: 60, dolgu: "#ffd400" })]),
        () => grupla([S({ sekil: "muhur", w: 160, h: 160, uc: 16, ic: 0.4, dolgu: "#ffd400" }), MT({ x: 0, y: 58, w: 160, metin: "YENİ", font: "Archivo Black", boyut: 34, dolgu: "#e30613" })]),
        () => grupla([S({ sekil: "serit", w: 320, h: 66, dolgu: "#e30613", golge: { x: 0, y: 4, b: 0, renk: "#8b0010" } }), MT({ x: 0, y: 12, w: 320, metin: "SÜPER FİYAT", font: "Anton", boyut: 34, dolgu: "#ffffff" })]),
        () => grupla([S({ sekil: "yuvarlak", w: 300, h: 56, kose: 28, dolgu: "#1d1d1f" }), MT({ x: 0, y: 15, w: 300, metin: "SADECE BU HAFTA", font: "Inter", kalin: 800, boyut: 20, harf: 60, dolgu: "#ffd400" })]),
        () => grupla([S({ sekil: "elips", w: 150, h: 150, dolgu: "#16a34a", cizgi: { k: 3, renk: "#ffffff", kesik: 1 } }), MT({ x: 0, y: 48, w: 150, metin: "YERLİ\nÜRETİM", font: "Inter", kalin: 900, boyut: 21, satir: 1.1, dolgu: "#ffffff" })]),
        () => grupla([S({ sekil: "etiket", w: 220, h: 96, dolgu: "#6c47ff" }), MT({ x: 30, y: 14, w: 190, metin: "1+1", font: "Anton", boyut: 56, dolgu: "#ffffff" })]),
        () => grupla([S({ sekil: "bayrak", w: 280, h: 62, dolgu: "#ffd400" }), MT({ x: 0, y: 11, w: 250, metin: "KAMPANYA", font: "Anton", boyut: 32, dolgu: "#e30613" })]),
        () => grupla([S({ sekil: "yildiz", w: 180, h: 172, uc: 5, ic: 0.5, dolgu: "#ffd400" }), MT({ x: 0, y: 76, w: 180, metin: "FIRSAT", font: "Bangers", boyut: 28, dolgu: "#e30613" })]),
        () => grupla([S({ sekil: "patlama", w: 190, h: 190, uc: 22, ic: 0.88, dolgu: "#ffd400" }), MT({ x: 0, y: 52, w: 190, metin: "2. ÜRÜN", font: "Anton", boyut: 30, dolgu: "#1d1d1f" }), MT({ x: 0, y: 90, w: 190, metin: "%50", font: "Anton", boyut: 48, dolgu: "#e30613" })]),
        () => grupla([S({ sekil: "balon", w: 260, h: 140, kose: 24, dolgu: "#ffffff", cizgi: { k: 3, renk: "#1d1d1f" } }), MT({ x: 0, y: 34, w: 260, metin: "Bunu kaçırma!", font: "Kalam", kalin: 700, boyut: 30, dolgu: "#1d1d1f" })]),
        () => grupla([S({ sekil: "paralel", w: 320, h: 54, oran: 0.4, dolgu: "#1d1d1f" }), MT({ x: 0, y: 15, w: 320, metin: "STOKLARLA SINIRLI", font: "Inter", kalin: 800, boyut: 19, harf: 40, dolgu: "#ffffff" })]),
        () => grupla([S({ sekil: "muhur", w: 160, h: 160, uc: 20, ic: 0.6, dolgu: "#0f766e" }), MT({ x: 0, y: 50, w: 160, metin: "%100\nDOĞAL", font: "Inter", kalin: 900, boyut: 22, satir: 1.1, dolgu: "#ffffff" })])
    ];
    const F = (oz) => Object.assign({ tur: "fiyat", x: 0, y: 0, w: 220, h: 220, fiyat: 49.9 }, oz);
    const FIYATLAR = [
        F({ sekil: "patlama", zemin: "#ffd400", renk: "#e30613", eski: 64.9 }),
        F({ sekil: "patlama", zemin: "#e30613", renk: "#ffffff", ust: "SADECE", cizgi: { k: 5, renk: "#ffffff" } }),
        F({ sekil: "daire", zemin: "#e30613", renk: "#ffffff", eski: 59.9, eskiRenk: "#ffd7d7" }),
        F({ sekil: "kutu", w: 260, h: 130, zemin: "#1d1d1f", renk: "#ffd400" }),
        F({ sekil: "yuvarlak", w: 260, h: 140, zemin: "#ffd400", renk: "#1d1d1f", eski: 64.9, eskiRenk: "#7c2d12" }),
        F({ sekil: "etiket", w: 280, h: 120, zemin: "#e30613", renk: "#ffffff", alt: "ADET" }),
        F({ sekil: "hap", w: 260, h: 100, zemin: "#6c47ff", renk: "#ffffff" }),
        F({ sekil: "muhur", zemin: "#16a34a", renk: "#ffffff", ust: "KG", uc: 16, ic: 0.5 }),
        F({ sekil: "bayrak", w: 280, h: 110, zemin: "#ffd400", renk: "#e30613" }),
        F({ sekil: "paralel", w: 280, h: 110, zemin: "#0284c7", renk: "#ffffff" }),
        F({ sekil: "yok", w: 260, h: 110, renk: "#e30613", eski: 64.9 }),
        F({ sekil: "daire", zemin: "#ffffff", renk: "#e30613", cizgi: { k: 6, renk: "#e30613" } })
    ];
    const SEKIL_LISTESI = ["dikdortgen", "yuvarlak", "elips", "ucgen", "yildiz", "patlama", "muhur", "cokgen", "kalp", "ok", "serit", "bayrak", "etiket", "balon", "paralel", "dalga", "arti", "halka", "damla"];
    cizimler.ogeler = () => {
        yaziFontlariniYukle();
        const k = () => Math.round(W() * 0.24);
        const sekilUret = (tur) => {
            const a = k();
            const oz = { sekil: tur, w: a, h: a, dolgu: "#6c47ff" };
            if (tur === "yuvarlak") oz.kose = a * 0.18;
            if (["serit", "bayrak", "paralel", "ok"].includes(tur)) { oz.w = a * 1.6; oz.h = a * 0.42; }
            if (tur === "etiket") { oz.w = a * 1.4; oz.h = a * 0.6; }
            if (tur === "balon") { oz.w = a * 1.3; oz.h = a * 0.8; oz.kose = a * 0.15; }
            if (tur === "dalga") { oz.w = W(); oz.h = a * 0.5; oz.oran = 0.5; }
            if (tur === "patlama") oz.dolgu = "#e30613";
            if (tur === "yildiz" || tur === "muhur") oz.dolgu = "#ffd400";
            return KS.model.yeni("sekil", oz);
        };
        const sekiller = h("div.izgara.s4", SEKIL_LISTESI.map((tur) => {
            const d = KS.sekilYolu(tur, 4, 4, tur === "serit" || tur === "bayrak" || tur === "paralel" || tur === "ok" ? 40 : 32, tur === "serit" || tur === "bayrak" || tur === "paralel" || tur === "ok" ? 18 : 32, { kose: tur === "yuvarlak" ? 7 : 0, uc: tur === "yildiz" ? 5 : undefined, ic: undefined, oran: tur === "dalga" ? 0.6 : undefined });
            const svg = h("svg:svg", { viewBox: "0 0 48 40", width: 46, height: 38 }, h("svg:path", { d, fill: "currentColor", "fill-rule": tur === "etiket" || tur === "halka" ? "evenodd" : null, transform: tur === "serit" || tur === "bayrak" || tur === "paralel" || tur === "ok" ? "translate(0 7)" : "translate(6 0)" }));
            return kutucuk(svg, { ipucu: KS.SEKILLER[tur].ad, sinif: ".kare.sekil-kart", tikla: () => KS.editor.ekle(sekilUret(tur)), veri: () => ({ ogeler: [sekilUret(tur)] }) });
        }));
        const cizgiUret = (oz) => KS.model.yeni("sekil", Object.assign({ sekil: "cizgi", w: Math.round(W() * 0.4), h: 14, cizgi: { k: 4, renk: "#1d1d1f" } }, oz));
        const cizgiler = h("div.izgara.s4", [
            [{ cizgi: { k: 4, renk: "#1d1d1f" } }, "Düz çizgi"],
            [{ cizgi: { k: 4, renk: "#1d1d1f", kesik: 1 } }, "Kesik çizgi"],
            [{ cizgi: { k: 5, renk: "#1d1d1f", kesik: 2 } }, "Noktalı çizgi"],
            [{ cizgi: { k: 4, renk: "#1d1d1f" }, uclar: "son" }, "Ok"]
        ].map(([oz, ad]) => {
            const o = cizgiUret(oz);
            return kutucuk(onizleme([Object.assign({}, o, { w: 120, h: 14, cizgi: Object.assign({}, o.cizgi, { k: o.cizgi.k * 1.4 }) })], 60, 40, { dolgu: 0.05 }), { ipucu: ad, sinif: ".kare", tikla: () => KS.editor.ekle(cizgiUret(oz)), veri: () => ({ ogeler: [cizgiUret(oz)] }) });
        }));
        const rozetler = h("div.izgara.s3", ROZETLER.map((uret) => {
            const ornek = uret();
            return kutucuk(onizleme(ornek, 84, 70, { dolgu: 0.06 }), { sinif: ".kare.kagit", ipucu: ornek.filter((o) => o.tur === "metin").map((o) => o.metin).join(" "), tikla: () => KS.editor.ekle(olcekli(uret())), veri: () => ({ ogeler: olcekli(uret()) }) });
        }));
        const fiyatlar = h("div.izgara.s3", FIYATLAR.map((oz) => {
            const uret = () => olcekli([Object.assign(KS.kopya(oz), { id: KS.kimlik("o") })]);
            return kutucuk(onizleme([oz], 84, 70, { dolgu: 0.05 }), { sinif: ".kare.kagit", ipucu: "Fiyat etiketi", tikla: () => KS.editor.ekle(uret()), veri: () => ({ ogeler: uret() }) });
        }));
        const emojiUret = (em) => KS.model.yeni("gorsel", { emoji: em, w: Math.round(W() * 0.2), h: Math.round(W() * 0.2), sigdir: "sigdir" });
        const segment = (s) => [...new Intl.Segmenter("tr", { granularity: "grapheme" }).segment(s)].map((x) => x.segment);
        const emojiler = KS.EMOJI_GRUPLARI.map((g) => [
            h("div.menu-baslik", { style: { padding: "10px 0 4px" } }, g.ad),
            h("div.izgara.s6", segment(g.liste).map((em) => kutucuk(em, { sinif: ".emoji-kutu", ipucu: "Çıkartma", tikla: () => KS.editor.ekle(emojiUret(em)), veri: () => ({ ogeler: [emojiUret(em)] }) })))
        ]);
        const qr = h("button.buyuk-dugme", { type: "button" }, h("span.ikon-kutu", KS.ikon("qr", 20)), h("div", h("b", "QR kod"), h("small", "Web sitesi, menü ya da WhatsApp bağlantısı")));
        qr.addEventListener("click", () => KS.editor.ekle(KS.model.yeni("qr", { w: Math.round(W() * 0.18), h: Math.round(W() * 0.18), veri: E.belge.marka.web ? (E.belge.marka.web.startsWith("http") ? E.belge.marka.web : "https://" + E.belge.marka.web) : "https://" })));
        return h("div",
            bolumBaslik("Rozetler ve etiketler"), rozetler,
            bolumBaslik("Fiyat etiketleri"), fiyatlar,
            bolumBaslik("Şekiller"), sekiller,
            bolumBaslik("Çizgiler"), cizgiler,
            bolumBaslik("Diğer"), qr,
            bolumBaslik("Çıkartmalar"), emojiler);
    };

    // ── Yüklemeler ──────────────────────────────────────────────
    cizimler.yuklemeler = () => {
        const alan = h("div.yukleme-alani",
            KS.ikon("yukle", 28), h("p", "Ürün fotoğraflarını, logonuzu ya da arka planları buraya sürükleyin"),
            h("button.dugme.birincil.kucuk", { type: "button", onclick: async () => { const d = await KS.dosyaSec({ kabul: "image/*", coklu: true }); if (d.length) yukle(d); } }, KS.ikon("yukle", 15), "Görsel yükle"));
        alan.addEventListener("dragover", (e) => { e.preventDefault(); alan.classList.add("uzerinde"); });
        alan.addEventListener("dragleave", () => alan.classList.remove("uzerinde"));
        alan.addEventListener("drop", (e) => { e.preventDefault(); alan.classList.remove("uzerinde"); yukle([...e.dataTransfer.files]); });
        async function yukle(dosyalar) {
            dosyalar = dosyalar.filter((f) => f.type.startsWith("image/"));
            const kapat = KS.bildir(`${dosyalar.length} görsel yükleniyor…`, { sure: 60000 });
            for (const d of dosyalar) await KS.varlik.dosyadan(d).catch((h) => KS.bildir(h.message, { tur: "hata" }));
            kapat();
            KS.bildir("Görseller yüklendi — tıklayın ya da sayfaya sürükleyin", { tur: "basari" });
        }
        const izgara = h("div.izgara.s3");
        KS.varlik.liste().then((liste) => {
            if (!liste.length) { izgara.replaceChildren(h("p.ipucu-metin", { style: { gridColumn: "1 / -1" } }, "Henüz görsel yüklemediniz. Ctrl+V ile panodan da yapıştırabilirsiniz.")); return; }
            izgara.replaceChildren(...liste.map((v) => {
                const b = h("button.varlik-kutu", { type: "button", title: v.ad || "Görsel" }, h("img", { src: v.url, alt: "", loading: "lazy" }));
                const sil = h("button.sil-mini", { type: "button", title: "Kitaplıktan sil" }, KS.ikon("kapat", 13));
                sil.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    const kullanimda = KS.depo.varlikKimlikleri(E.belge).has(v.id);
                    if (!(await KS.ui.onayla({ baslik: "Görseli sil", metin: kullanimda ? "Bu görsel katalogda kullanılıyor; silinirse o yerlerde boş kutu görünür." : "Görsel kitaplıktan silinecek.", evet: "Sil", tehlike: true }))) return;
                    await KS.varlik.sil(v.id);
                    KS.editor.tumunuCiz();
                });
                b.append(sil);
                b.addEventListener("click", () => {
                    const s = KS.editor.seciliOgeler();
                    if (s.length === 1 && (s[0].tur === "gorsel" || s[0].tur === "urun")) { KS.editor.gorselDegistir(s[0].id, { id: v.id }); return; }
                    KS.olay.yay("birakildi", { varlik: v.id }, {});
                });
                surukle(b, () => ({ varlik: v.id }));
                return b;
            }));
        });
        return h("div", alan,
            h("p.ipucu-metin", "İpucu: Bir görsel ya da ürün kartı seçiliyken buradaki görsele tıklarsanız resmi değiştirilir."),
            bolumBaslik("Kitaplık"), izgara);
    };

    // ── Arka plan ───────────────────────────────────────────────
    cizimler.arkaplan = () => {
        const s = KS.editor.sayfa();
        const a = s.arka;
        const uygula = (fn, gecmis = "hemen") => {
            fn(KS.editor.sayfa().arka);
            KS.editor.sayfaYenidenCiz();
            if (gecmis === "hemen") KS.gecmis.kaydet(); else KS.gecmis.kaydetGecikmeli();
        };
        const renk = KS.ui.renkSec({ deger: a.dolgu, gradyan: true, degisti: (v, b) => uygula((x) => { x.dolgu = v; }, b ? "hemen" : "gecikmeli") });
        const hazir = ["#ffffff", "#f4efe6", "#fff7e8", "#fef3c7", "#ffd400", "#e30613", "#8b0010", "#16a34a", "#e8f6df", "#0284c7", "#e0f2fe", "#0b1b3f", "#1d1d1f", "#6c47ff", "#fce7f3", "#f3f4f6"];
        const ornekler = h("div.rs-ornekler", { style: { gridTemplateColumns: "repeat(8, 1fr)", marginTop: "10px" } },
            [...hazir, ...KS.ui.HAZIR_GRADYAN].map((r) => {
                const b = h("button.rs-ornek", { type: "button", title: typeof r === "string" ? r : "Gradyan" });
                b.style.setProperty("--r", KS.dolguCss(r));
                b.addEventListener("click", () => { uygula((x) => { x.dolgu = KS.kopya(r); }); renk.yenile(r); });
                return b;
            }));
        // Desenler
        const desenler = h("div.izgara.s4", [
            kutucuk(h("span", { style: { fontSize: "11px", fontWeight: 600 } }, "Yok"), { sinif: ".kare", ipucu: "Desen yok", tikla: () => { uygula((x) => { x.desen = null; }); ciz(); } }),
            ...Object.entries(KS.DESENLER).map(([tur, d]) => {
                const st = d.css("#1d1d1f", 0.45);
                const on = h("div", { style: Object.assign({ position: "absolute", inset: "0", opacity: ".55" }, st) });
                return kutucuk(on, {
                    sinif: ".kare", ipucu: d.ad, stil: a.desen && a.desen.tur === tur ? { boxShadow: "0 0 0 2px var(--vurgu)" } : null,
                    tikla: () => { uygula((x) => { x.desen = Object.assign({ renk: "#000000", opak: 0.12, olcek: 1 }, x.desen || {}, { tur }); }); ciz(); }
                });
            })]);
        const desenAyar = a.desen ? h("div", { style: { marginTop: "10px" } },
            KS.ui.alan("Renk", KS.ui.renkSec({ deger: a.desen.renk, degisti: (v, b) => uygula((x) => { x.desen.renk = v; }, b ? "hemen" : "gecikmeli") }).el),
            KS.ui.alan("Opaklık", KS.ui.kaydirici({ min: 0, max: 100, deger: Math.round((a.desen.opak ?? 0.15) * 100), son: "%", degisti: (v, b) => uygula((x) => { x.desen.opak = v / 100; }, b ? "hemen" : "gecikmeli") }).el),
            KS.ui.alan("Ölçek", KS.ui.kaydirici({ min: 30, max: 400, deger: Math.round((a.desen.olcek || 1) * 100), son: "%", degisti: (v, b) => uygula((x) => { x.desen.olcek = v / 100; }, b ? "hemen" : "gecikmeli") }).el)) : null;
        // Görsel
        const resimSec = h("button.dugme.kucuk", { type: "button" }, KS.ikon("gorsel", 15), a.resim ? "Görseli değiştir" : "Görsel seç");
        resimSec.addEventListener("click", () => varlikSecici(resimSec, (id) => { uygula((x) => { x.resim = Object.assign({ opak: 1, bulanik: 0, kaplama: "kapla", x: 50, y: 50 }, x.resim || {}, { varlik: id }); }); ciz(); }));
        const resimAyar = a.resim ? h("div", { style: { marginTop: "10px" } },
            KS.ui.alan("Yerleşim", KS.ui.bolumlu({ secenekler: [{ deger: "kapla", etiket: "Kapla" }, { deger: "sigdir", etiket: "Sığdır" }, { deger: "dose", etiket: "Döşe" }], deger: a.resim.kaplama || "kapla", degisti: (v) => uygula((x) => { x.resim.kaplama = v; }) }).el),
            KS.ui.alan("Opaklık", KS.ui.kaydirici({ min: 0, max: 100, deger: Math.round((a.resim.opak ?? 1) * 100), son: "%", degisti: (v, b) => uygula((x) => { x.resim.opak = v / 100; }, b ? "hemen" : "gecikmeli") }).el),
            KS.ui.alan("Bulanıklık", KS.ui.kaydirici({ min: 0, max: 40, deger: a.resim.bulanik || 0, son: "px", degisti: (v, b) => uygula((x) => { x.resim.bulanik = v; }, b ? "hemen" : "gecikmeli") }).el),
            KS.ui.alan("Parlaklık", KS.ui.kaydirici({ min: 20, max: 180, deger: a.resim.parlak ?? 100, son: "%", degisti: (v, b) => uygula((x) => { x.resim.parlak = v; }, b ? "hemen" : "gecikmeli") }).el),
            a.resim.kaplama === "dose" ? KS.ui.alan("Döşeme", KS.ui.kaydirici({ min: 5, max: 100, deger: a.resim.olcek || 30, son: "%", degisti: (v, b) => uygula((x) => { x.resim.olcek = v; }, b ? "hemen" : "gecikmeli") }).el) : null,
            h("button.dugme.kucuk.tehlike", { type: "button", style: { marginTop: "8px" }, onclick: () => { uygula((x) => { x.resim = null; }); ciz(); } }, KS.ikon("sil", 15), "Görseli kaldır")) : null;
        const hepsine = h("button.dugme.genis", { type: "button", style: { marginTop: "18px" } }, KS.ikon("kopyala", 16), "Bu arka planı tüm sayfalara uygula");
        hepsine.addEventListener("click", () => {
            for (const x of E.belge.sayfalar) x.arka = KS.kopya(KS.editor.sayfa().arka);
            KS.editor.tumunuCiz(); KS.gecmis.kaydet(); KS.bildir("Tüm sayfalara uygulandı", { tur: "basari" });
        });
        const no = E.belge.sayfalar.findIndex((x) => x.id === s.id) + 1;
        return h("div",
            h("p.ipucu-metin", { style: { marginTop: 0 } }, `Sayfa ${no} için. Başka sayfayı düzenlemek için o sayfaya tıklayın.`),
            bolumBaslik("Renk ve gradyan"), renk.el, ornekler,
            bolumBaslik("Desen"), desenler, desenAyar,
            bolumBaslik("Arka plan görseli"), resimSec, resimAyar,
            hepsine);
    };
    // Yüklenmiş görsellerden seçim (ya da yeni yükleme)
    async function varlikSecici(capa, fn) {
        const liste = await KS.varlik.liste();
        const kok = h("div", { style: { width: "300px", padding: "12px" } });
        const yukle = h("button.dugme.kucuk.genis", { type: "button", style: { marginBottom: "10px" } }, KS.ikon("yukle", 15), "Bilgisayardan yükle");
        yukle.addEventListener("click", async () => { const [d] = await KS.dosyaSec({ kabul: "image/*" }); if (!d) return; const v = await KS.varlik.dosyadan(d); KS.ui.kapat(); fn(v.id); });
        kok.append(yukle, liste.length ? h("div.izgara.s3", liste.map((v) => h("button.varlik-kutu", { type: "button", onclick: () => { KS.ui.kapat(); fn(v.id); } }, h("img", { src: v.url, alt: "" })))) : h("p.ipucu-metin", "Kitaplıkta görsel yok."));
        KS.ui.acilir(kok, capa, { yer: "sag" });
    }
    KS.varlikSecici = varlikSecici;

    // ── Katmanlar ───────────────────────────────────────────────
    function ogeAdi(o) {
        if (o.ad) return o.ad;
        if (o.tur === "metin") return o.metin.replace(/\s+/g, " ").slice(0, 40) || "Metin";
        if (o.tur === "urun") return o.veri.ad;
        if (o.tur === "fiyat") return "Fiyat " + KS.fiyatMetin(o.fiyat);
        if (o.tur === "sekil") return (KS.SEKILLER[o.sekil] || {}).ad || "Şekil";
        if (o.tur === "gorsel") return o.emoji ? "Çıkartma " + o.emoji : "Görsel";
        return KS.TUR_ADLARI[o.tur] || "Öğe";
    }
    KS.ogeAdi = ogeAdi;
    const TUR_IKON = { metin: "metin", sekil: "ogeler", gorsel: "gorsel", urun: "urun", fiyat: "etiket", qr: "qr" };
    cizimler.katmanlar = () => {
        const s = KS.editor.sayfa();
        const liste = s.ogeler.slice().reverse();
        if (!liste.length) return h("div.bos-durum", KS.ikon("katmanlar", 32), h("p", "Bu sayfada öğe yok"));
        const kap2 = h("div", { style: { display: "flex", flexDirection: "column", gap: "2px" } });
        const gruplar = new Map();
        let renkSira = 0;
        const GRUP_RENK = ["#6c47ff", "#e30613", "#16a34a", "#0284c7", "#f59e0b", "#c026d3"];
        for (const o of liste) if (o.grup && !gruplar.has(o.grup)) gruplar.set(o.grup, GRUP_RENK[renkSira++ % GRUP_RENK.length]);
        for (const o of liste) {
            const secili = E.secim.includes(o.id);
            const ad = h("span", { style: { flex: "1", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: o.gizli ? ".45" : "1" } }, ogeAdi(o));
            const satir = h("div.urun-satir", {
                dataset: { id: o.id },
                style: { gridTemplateColumns: "28px 1fr auto", padding: "5px 6px", background: secili ? "var(--vurgu-acik)" : "", borderColor: secili ? "var(--vurgu-orta)" : "", cursor: "pointer", borderLeft: o.grup ? `3px solid ${gruplar.get(o.grup)}` : "" }
            },
                h("div", { style: { display: "grid", placeItems: "center", color: secili ? "var(--vurgu)" : "var(--yazi-3)" } }, KS.ikon(TUR_IKON[o.tur] || "kutu", 16)),
                ad,
                h("div", { style: { display: "flex", gap: "0" } },
                    h("button.ikon-dugme.kucuk", { type: "button", title: o.kilit ? "Kilidi aç" : "Kilitle", onclick: (e) => { e.stopPropagation(); KS.editor.degistir((x) => { x.kilit = !x.kilit; }, { idler: [o.id] }); ciz(); } }, KS.ikon(o.kilit ? "kilit" : "kilitAcik", 15)),
                    h("button.ikon-dugme.kucuk", { type: "button", title: o.gizli ? "Göster" : "Gizle", onclick: (e) => { e.stopPropagation(); KS.editor.gizle([o.id]); ciz(); } }, KS.ikon(o.gizli ? "gozKapali" : "goz", 15))));
            satir.addEventListener("click", (e) => {
                if (e.shiftKey) KS.editor.sec(E.secim.includes(o.id) ? E.secim.filter((x) => x !== o.id) : [...E.secim, o.id], { genislet: false });
                else KS.editor.sec([o.id], { genislet: false });
            });
            satir.addEventListener("dblclick", async () => {
                const yeni = await KS.ui.sor({ baslik: "Katmanı adlandır", deger: ogeAdi(o) });
                if (yeni != null) KS.editor.degistir((x) => { x.ad = yeni; }, { idler: [o.id] });
            });
            satir.addEventListener("pointerenter", () => { const el = KS.editor.ogeElemani(o.id); if (el) el.style.outline = "2px solid var(--secim)"; });
            satir.addEventListener("pointerleave", () => { const el = KS.editor.ogeElemani(o.id); if (el) el.style.outline = ""; });
            katmanSurukle(satir, o, kap2);
            kap2.append(satir);
        }
        return h("div", h("p.ipucu-metin", { style: { marginTop: 0 } }, "Üstteki katman önde görünür. Sıralamak için sürükleyin; adlandırmak için çift tıklayın."), kap2);
    };
    function katmanSurukle(satir, o, kap2) {
        satir.addEventListener("pointerdown", (e) => {
            if (e.button !== 0 || e.target.closest("button")) return;
            const y0 = e.clientY;
            let surukleniyor = false, hedefIndex = null, isaret = null;
            const hareket = (ev) => {
                if (!surukleniyor && Math.abs(ev.clientY - y0) < 5) return;
                surukleniyor = true;
                satir.style.opacity = ".5";
                const satirlar = [...kap2.children].filter((x) => x.dataset.id);
                let i = satirlar.findIndex((x) => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
                if (i < 0) i = satirlar.length;
                hedefIndex = i;
                if (!isaret) { isaret = h("div", { style: { height: "2px", background: "var(--vurgu)", borderRadius: "2px", margin: "-1px 0" } }); }
                kap2.insertBefore(isaret, satirlar[i] || null);
            };
            const bitir = () => {
                window.removeEventListener("pointermove", hareket);
                window.removeEventListener("pointerup", bitir);
                satir.style.opacity = "";
                if (isaret) isaret.remove();
                if (!surukleniyor || hedefIndex == null) return;
                const s = KS.editor.sayfa();
                const ters = s.ogeler.slice().reverse();
                const eski = ters.indexOf(o);
                ters.splice(eski, 1);
                ters.splice(hedefIndex > eski ? hedefIndex - 1 : hedefIndex, 0, o);
                s.ogeler = ters.reverse();
                KS.editor.sayfaYenidenCiz();
                KS.editor.secimCiz();
                KS.gecmis.kaydet();
                ciz();
            };
            window.addEventListener("pointermove", hareket);
            window.addEventListener("pointerup", bitir);
        });
    }

    // ── Marka ───────────────────────────────────────────────────
    cizimler.marka = () => {
        const m = E.belge.marka;
        const kaydetVarsayilan = KS.gecikmeli(() => {
            try { localStorage.setItem("ks-marka", JSON.stringify({ ad: m.ad, slogan: m.slogan, telefon: m.telefon, adres: m.adres, web: m.web, renkler: m.renkler, logo: m.logo })); } catch (h) { /* yok say */ }
        }, 500);
        const alan = (etiket, k, yer) => {
            let eski = m[k];
            const g = KS.ui.metinGir({
                deger: m[k], yer, degisti: (v, b) => {
                    m[k] = v; kaydetVarsayilan();
                    if (!b) return;
                    // Sayfalardaki eski bilgiyi yenisiyle değiştir (MARKET ADI → YILDIZ MARKET gibi büyük harfli hâli de)
                    const n = yaziDegistir(eski, v);
                    eski = v;
                    KS.gecmis.kaydet();
                    if (n) KS.bildir(`Katalogdaki ${n} yazı güncellendi`, { tur: "basari", eylem: { metin: "Geri al", fn: () => KS.gecmis.geri() } });
                }
            });
            return h("label.form-alan", { style: { marginBottom: "10px" } }, etiket, g.el);
        };
        const logoKutu = h("div.kucuk-gorsel", { style: { width: "64px", height: "64px", borderRadius: "12px", background: "var(--z2)", display: "grid", placeItems: "center", overflow: "hidden" } },
            m.logo && KS.varlik.url(m.logo) ? h("img", { src: KS.varlik.url(m.logo), style: { width: "100%", height: "100%", objectFit: "contain" } }) : KS.ikon("marka", 26));
        const logoYukle = h("button.dugme.kucuk", { type: "button" }, KS.ikon("yukle", 15), m.logo ? "Değiştir" : "Logo yükle");
        logoYukle.addEventListener("click", async () => {
            const [d] = await KS.dosyaSec({ kabul: "image/*" });
            if (!d) return;
            const v = await KS.varlik.dosyadan(d);
            m.logo = v.id; kaydetVarsayilan(); KS.gecmis.kaydet(); ciz();
        });
        const renkler = h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } },
            ...(m.renkler || []).map((r, i) => {
                const k = KS.ui.renkSec({ deger: r, yalniz: true, degisti: (v, b) => { m.renkler[i] = v; kaydetVarsayilan(); if (b) KS.gecmis.kaydet(); } });
                k.el.addEventListener("contextmenu", (e) => { e.preventDefault(); m.renkler.splice(i, 1); kaydetVarsayilan(); ciz(); });
                return k.el;
            }),
            (m.renkler || []).length < 8 ? h("button.renk-dugme.yalniz", { type: "button", title: "Renk ekle", onclick: () => { m.renkler = [...(m.renkler || []), "#6c47ff"]; kaydetVarsayilan(); ciz(); } }, KS.ikon("arti", 16)) : null);
        const ekleDugme = (ikon, baslik, alt, fn) => h("button.buyuk-dugme", { type: "button", onclick: fn }, h("span.ikon-kutu", KS.ikon(ikon, 19)), h("div", h("b", baslik), h("small", alt)));
        const ana = (m.renkler && m.renkler[0]) || "#e30613";
        return h("div",
            h("p.ipucu-metin", { style: { marginTop: 0 } }, "Bu bilgiler şablonlarda kullanılır ve yeni kataloglar için hatırlanır."),
            KS.abellpro ? h("button.buyuk-dugme.ap-kart", { type: "button", onclick: () => KS.abellpro.firmaBilgisiAl() },
                h("span.ikon-kutu", KS.ikon("baglanti", 19)),
                h("div", h("b", "AbellPro'dan al"), h("small", "Firma adı, telefon, adres ve logo işletme ayarlarından gelsin"))) : null,
            h("div", { style: { display: "flex", gap: "12px", alignItems: "center", marginBottom: "14px" } }, logoKutu,
                h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } }, logoYukle,
                    m.logo ? h("button.dugme.kucuk.hayalet", { type: "button", onclick: () => { m.logo = null; kaydetVarsayilan(); KS.gecmis.kaydet(); ciz(); } }, "Kaldır") : null)),
            alan("Market adı", "ad", "ör. Yıldız Market"), alan("Slogan", "slogan", "ör. Taze, uygun, yakın"),
            alan("Telefon", "telefon"), alan("Adres", "adres"), alan("Web / sosyal medya", "web"),
            h("div.form-alan", "Marka renkleri", renkler),
            h("p.ipucu-metin", "Renkler, renk seçicide 'Belge renkleri' altında da görünür. Silmek için sağ tıklayın."),
            bolumBaslik("Sayfaya ekle"),
            ekleDugme("gorsel", "Logo", m.logo ? "Yüklediğiniz logo" : "Önce logo yükleyin", () => {
                if (!m.logo) { logoYukle.click(); return; }
                const v = KS.varlik.al(m.logo) || { g: 300, y: 300 };
                const k = Math.min(W() * 0.22 / v.g, W() * 0.22 / v.y);
                KS.editor.ekle(KS.model.yeni("gorsel", { varlik: m.logo, w: v.g * k, h: v.y * k, sigdir: "sigdir" }));
            }),
            ekleDugme("metin", "Market adı", m.ad, () => KS.editor.ekle(KS.model.yeni("metin", { w: W() * 0.6, metin: m.ad.toLocaleUpperCase("tr-TR"), font: "Archivo Black", boyut: Math.round(W() / 20), dolgu: ana, hiza: "center" }))),
            ekleDugme("liste", "İletişim bloğu", "Telefon, adres, web", () => {
                const g = KS.kimlik("g"), w = W() * 0.6, b = Math.round(W() / 50);
                KS.editor.ekle([
                    KS.model.yeni("metin", { x: 0, y: 0, w, metin: "📞 " + m.telefon, font: "Inter", kalin: 800, boyut: b * 1.3, dolgu: "#1d1d1f", grup: g }),
                    KS.model.yeni("metin", { x: 0, y: b * 2.1, w, metin: m.adres, font: "Inter", kalin: 500, boyut: b, dolgu: "#4b5563", grup: g }),
                    KS.model.yeni("metin", { x: 0, y: b * 3.7, w, metin: m.web, font: "Inter", kalin: 700, boyut: b, dolgu: ana, grup: g })
                ]);
            }),
            ekleDugme("qr", "Web sitesi QR kodu", m.web || "Web adresi girin", () => KS.editor.ekle(KS.model.yeni("qr", { w: W() * 0.16, h: W() * 0.16, veri: m.web ? (m.web.startsWith("http") ? m.web : "https://" + m.web) : "https://" }))),
            ekleDugme("yenile", "Şablon yazılarını güncelle", "Sayfalardaki eski market adını yenisiyle değiştir", markaYazilariniGuncelle));
    };
    function yaziDegistir(eski, yeni) {
        if (!eski || !eski.trim() || eski === yeni) return 0;
        const ciftler = [[eski, yeni]];
        const eb = eski.toLocaleUpperCase("tr-TR");
        if (eb !== eski) ciftler.push([eb, yeni.toLocaleUpperCase("tr-TR")]);
        let n = 0;
        for (const s of E.belge.sayfalar) for (const o of s.ogeler) {
            if (o.tur !== "metin") continue;
            let t = o.metin;
            for (const [a, b] of ciftler) if (t.includes(a)) t = t.split(a).join(b);
            if (t !== o.metin) { o.metin = t; KS.editor.egriBoyutla(o); n++; }
        }
        if (n) KS.editor.tumunuCiz();
        return n;
    }
    async function markaYazilariniGuncelle() {
        const eski = await KS.ui.sor({ baslik: "Eski metni değiştir", etiket: "Sayfalarda aranacak eski market adı ya da telefon (ör. MARKET ADI)", deger: "MARKET ADI", evet: "Devam" });
        if (!eski) return;
        const m = E.belge.marka;
        const yeni = /^\d|\(/.test(eski.trim()) ? m.telefon : (eski === eski.toLocaleUpperCase("tr-TR") ? m.ad.toLocaleUpperCase("tr-TR") : m.ad);
        let n = 0;
        for (const s of E.belge.sayfalar) for (const o of s.ogeler) if (o.tur === "metin" && o.metin.includes(eski)) { o.metin = o.metin.split(eski).join(yeni); n++; }
        KS.editor.tumunuCiz();
        KS.gecmis.kaydet();
        KS.bildir(n ? `${n} yazı güncellendi` : "Eşleşen yazı bulunamadı", { tur: n ? "basari" : "bilgi" });
    }

    KS.paneller = { baslat, ac, kapat, ciz, urunKartiEkle, emojiSec, emojiTahmin, yerlesimPenceresi, iceAktarPenceresi, yaziDegistir, aktif: () => acik };
})();
