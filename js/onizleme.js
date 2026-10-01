// Önizleme: kataloğu tam ekranda broşür gibi gösterir (dikey sayfalarda geniş ekranda çift sayfa).
// Ok tuşları, kaydırma hareketi ve alttaki küçük resimlerle gezilir; Esc ile kapanır.
(function () {
    "use strict";
    const KS = window.KS;
    const { h } = KS;
    const E = KS.E;

    function ac(baslangic) {
        if (E.duzenlenen) KS.editor.metinBitir();
        const b = E.belge, sayfalar = b.sayfalar;
        const oran = b.genislik / b.yukseklik;
        let adim = 0;
        const sahne = h("div.onizleme-sahne");
        const yayim = h("div.onizleme-yayim");
        const onceki = h("button.onizleme-ok.sol", { type: "button", "aria-label": "Önceki" }, KS.ikon("sol", 26));
        const sonraki = h("button.onizleme-ok.sag", { type: "button", "aria-label": "Sonraki" }, KS.ikon("sag", 26));
        const sayac = h("span", { style: { color: "#cfd2da", fontVariantNumeric: "tabular-nums" } });
        const alt = h("div.onizleme-alt");
        const kapatDugme = h("button.ikon-dugme", { type: "button", title: "Kapat (Esc)" }, KS.ikon("kapat", 20));
        const tamEkran = h("button.ikon-dugme", { type: "button", title: "Tam ekran" }, KS.ikon("sigdir", 19));
        const kok = h("div.onizleme-kap", { role: "dialog", "aria-label": "Önizleme" },
            h("div.onizleme-ust", h("div", { style: { display: "flex", alignItems: "center", gap: "12px" } }, h("b", b.ad), sayac), h("div", { style: { display: "flex", gap: "4px" } }, tamEkran, kapatDugme)),
            sahne, alt);
        sahne.append(onceki, yayim, sonraki);
        const cift = () => oran < 1 && innerWidth > 900 && sayfalar.length > 1;
        const adimlar = () => {
            if (!cift()) return sayfalar.map((_, i) => [i]);
            const a = [[0]];
            for (let i = 1; i < sayfalar.length; i += 2) a.push(sayfalar[i + 1] ? [i, i + 1] : [i]);
            return a;
        };
        function ciz(yon = 0) {
            const a = adimlar();
            adim = KS.sinirla(adim, 0, a.length - 1);
            const goster = a[adim];
            const sh = sahne.clientHeight - 40, sw = sahne.clientWidth - 160;
            const yuk = Math.min(sh, sw / (oran * (cift() ? 2 : 1)));
            const gen = yuk * oran;
            const olcek = gen / b.genislik;
            yayim.classList.toggle("cift", goster.length === 2);
            const yapraklar = goster.map((i) => {
                const el = KS.cizim.sayfaDom(sayfalar[i], b);
                el.style.transform = `scale(${olcek})`;
                el.style.transformOrigin = "0 0";
                return h("div.yaprak", { style: { width: gen + "px", height: yuk + "px" } }, el);
            });
            // Kapak tek başına sağda dursun (çift görünümde)
            if (cift() && goster.length === 1 && goster[0] === 0) yapraklar.unshift(h("div.yaprak.bos", { style: { width: gen + "px", height: yuk + "px" } }));
            if (cift() && goster.length === 1 && goster[0] !== 0) yapraklar.push(h("div.yaprak.bos", { style: { width: gen + "px", height: yuk + "px" } }));
            yayim.replaceChildren(...yapraklar);
            yayim.classList.remove("cevir-sol", "cevir-sag");
            if (yon) { void yayim.offsetWidth; yayim.classList.add(yon > 0 ? "cevir-sol" : "cevir-sag"); }
            onceki.disabled = adim === 0;
            sonraki.disabled = adim === a.length - 1;
            sayac.textContent = `${goster.map((i) => i + 1).join("–")} / ${sayfalar.length}`;
            [...alt.children].forEach((k, i) => k.classList.toggle("aktif", goster.includes(i)));
        }
        sayfalar.forEach((s, i) => {
            const k = h("button.onizleme-kucuk", { type: "button", title: `Sayfa ${i + 1}` }, KS.cizim.kucukResim(s, b, oran >= 1 ? 90 : 50));
            k.addEventListener("click", () => { const a = adimlar(); const yeni = a.findIndex((x) => x.includes(i)); const yon = Math.sign(yeni - adim); adim = yeni; ciz(yon); });
            alt.append(k);
        });
        const git = (d) => { const once = adim; adim = KS.sinirla(adim + d, 0, adimlar().length - 1); if (adim !== once) ciz(d); };
        onceki.addEventListener("click", () => git(-1));
        sonraki.addEventListener("click", () => git(1));
        const tus = (e) => {
            if (e.key === "Escape") { e.preventDefault(); kapat(); }
            else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); git(1); }
            else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); git(-1); }
        };
        let x0 = null;
        sahne.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
        sahne.addEventListener("pointerup", (e) => { if (x0 != null && Math.abs(e.clientX - x0) > 60) git(e.clientX < x0 ? 1 : -1); x0 = null; });
        const yeniden = KS.gecikmeli(() => ciz(), 120);
        tamEkran.addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen(); else kok.requestFullscreen?.(); });
        function kapat() {
            document.removeEventListener("keydown", tus, true);
            window.removeEventListener("resize", yeniden);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            kok.remove();
        }
        kapatDugme.addEventListener("click", kapat);
        document.addEventListener("keydown", tus, true);
        window.addEventListener("resize", yeniden);
        document.body.append(kok);
        const bas = baslangic ?? sayfalar.findIndex((s) => s.id === E.sayfaId);
        adim = adimlar().findIndex((x) => x.includes(Math.max(0, bas)));
        requestAnimationFrame(() => ciz());
    }

    KS.onizleme = { ac };
})();
