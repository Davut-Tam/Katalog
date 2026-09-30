// Katalog: ürünleri çizer; arama, kategori süzgeci ve sıralama. Durum tek nesnede (durum), her değişiklikte ciz().
(function () {
    "use strict";

    const urunler = Array.isArray(window.KATALOG) ? window.KATALOG : [];
    const TUMU = "Tümü";

    const durum = { arama: "", kategori: TUMU, siralama: "onerilen" };

    const $ = (id) => document.getElementById(id);
    const izgara = $("izgara");
    const kategorilerKutu = $("kategoriler");
    const aramaKutu = $("aramaKutu");
    const siralamaKutu = $("siralama");
    const sonucBilgi = $("sonucBilgi");
    const bos = $("bos");
    const ayrinti = $("ayrinti");

    const para = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

    // Türkçe küçük harf + aksanları sadeleştirme: "IŞIK" ile "ışık", "cay" ile "çay" eşleşsin.
    const sade = (metin) => (metin || "")
        .toLocaleLowerCase("tr-TR")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/ı/g, "i");

    // ── Kategoriler ─────────────────────────────────────────────
    function kategorileriCiz() {
        const kategoriler = [TUMU, ...new Set(urunler.map((u) => u.kategori))];
        kategorilerKutu.replaceChildren(...kategoriler.map((k) => {
            const d = document.createElement("button");
            d.type = "button";
            d.className = "cip";
            d.textContent = k;
            d.setAttribute("role", "tab");
            d.setAttribute("aria-selected", String(k === durum.kategori));
            d.addEventListener("click", () => { durum.kategori = k; ciz(); });
            return d;
        }));
    }

    // ── Süzme ve sıralama ───────────────────────────────────────
    function gorunenler() {
        const aranan = sade(durum.arama).split(/\s+/).filter(Boolean);
        const liste = urunler.filter((u) => {
            if (durum.kategori !== TUMU && u.kategori !== durum.kategori) return false;
            const metin = sade(`${u.ad} ${u.marka} ${u.aciklama} ${u.kategori}`);
            return aranan.every((p) => metin.includes(p));
        });

        const sirala = {
            "fiyat-artan": (a, b) => a.fiyat - b.fiyat,
            "fiyat-azalan": (a, b) => b.fiyat - a.fiyat,
            "ad": (a, b) => a.ad.localeCompare(b.ad, "tr")
        }[durum.siralama];
        return sirala ? [...liste].sort(sirala) : liste;
    }

    // ── Kartlar ─────────────────────────────────────────────────
    function kart(u) {
        const k = document.createElement("article");
        k.className = "kart";
        k.tabIndex = 0;
        k.setAttribute("aria-label", `${u.ad}, ${para.format(u.fiyat)}`);
        k.style.setProperty("--kart-renk", u.renk);
        k.innerHTML = `
            <div class="kart-gorsel" aria-hidden="true"><span>${u.simge}</span></div>
            <div class="kart-icerik">
                <p class="kart-kategori"></p>
                <h3 class="kart-ad"></h3>
                <p class="kart-marka"></p>
                <p class="kart-fiyat">${para.format(u.fiyat)}</p>
            </div>`;
        // Metinler textContent ile: veri ileride dışarıdan gelirse HTML olarak yorumlanmasın.
        k.querySelector(".kart-kategori").textContent = u.kategori;
        k.querySelector(".kart-ad").textContent = u.ad;
        k.querySelector(".kart-marka").textContent = u.marka;

        const ac = () => ayrintiAc(u);
        k.addEventListener("click", ac);
        k.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ac(); } });
        return k;
    }

    function ciz() {
        kategorileriCiz();
        const liste = gorunenler();
        izgara.replaceChildren(...liste.map(kart));
        bos.hidden = liste.length > 0;
        sonucBilgi.textContent = liste.length === urunler.length
            ? `${urunler.length} ürün`
            : `${urunler.length} üründen ${liste.length} tanesi gösteriliyor`;
    }

    // ── Ayrıntı penceresi ───────────────────────────────────────
    function ayrintiAc(u) {
        $("ayrintiGorsel").textContent = u.simge;
        $("ayrintiGorsel").style.setProperty("--kart-renk", u.renk);
        $("ayrintiKategori").textContent = u.kategori;
        $("ayrintiBaslik").textContent = u.ad;
        $("ayrintiMarka").textContent = u.marka;
        $("ayrintiAciklama").textContent = u.aciklama;
        $("ayrintiFiyat").textContent = para.format(u.fiyat);
        if (typeof ayrinti.showModal === "function") ayrinti.showModal();
    }
    // Pencerenin dışına tıklayınca kapansın.
    ayrinti.addEventListener("click", (e) => { if (e.target === ayrinti) ayrinti.close(); });

    // ── Tema ────────────────────────────────────────────────────
    const TEMA_ANAHTARI = "katalog-tema";
    function temaUygula(tema) {
        if (tema) document.documentElement.dataset.tema = tema;
        else delete document.documentElement.dataset.tema;
    }
    try { temaUygula(localStorage.getItem(TEMA_ANAHTARI)); } catch { /* depolama kapalı olabilir */ }
    $("temaDugme").addEventListener("click", () => {
        const koyuMu = document.documentElement.dataset.tema
            ? document.documentElement.dataset.tema === "koyu"
            : window.matchMedia("(prefers-color-scheme: dark)").matches;
        const yeni = koyuMu ? "acik" : "koyu";
        temaUygula(yeni);
        try { localStorage.setItem(TEMA_ANAHTARI, yeni); } catch { /* yok say */ }
    });

    // ── Olaylar ─────────────────────────────────────────────────
    let zaman;
    aramaKutu.addEventListener("input", () => {
        clearTimeout(zaman);
        zaman = setTimeout(() => { durum.arama = aramaKutu.value; ciz(); }, 150);
    });
    siralamaKutu.addEventListener("change", () => { durum.siralama = siralamaKutu.value; ciz(); });
    $("temizleDugme").addEventListener("click", () => {
        durum.arama = ""; durum.kategori = TUMU; durum.siralama = "onerilen";
        aramaKutu.value = ""; siralamaKutu.value = "onerilen";
        ciz();
    });

    $("yil").textContent = new Date().getFullYear();
    ciz();
})();
