// Telefon düzeninin parçaları: seçim işlem çubuğu (alt gezinme çubuğunun yerine geçer), "Sayfa" düğmesi
// (sayfa / belge özellikleri) ve ekrana sığdır düğmesi. Görünürlük CSS'te 760 px sınırıyla yönetilir.
(function () {
    "use strict";
    const KS = window.KS;
    const { h } = KS;
    const E = KS.E;

    function baslat() {
        const cubuk = document.getElementById("secimCubugu");
        const dugme = (ikon, ad, fn, ek = "") => h("button.ray-dugme" + ek, { type: "button", onclick: fn }, h("span.ikon-kap", KS.ikon(ikon, 20)), h("span", ad));

        function ciz() {
            const l = E.belge ? KS.editor.seciliOgeler() : [];
            const mod = E.duzenlenen ? "metin" : E.kirpilan ? "kirp" : l.length ? "secim" : "";
            document.body.classList.toggle("secim-var", !!mod);
            if (mod === "metin") { cubuk.replaceChildren(dugme("tamam", "Bitti", () => KS.editor.metinBitir())); return; }
            if (mod === "kirp") { cubuk.replaceChildren(h("span.secim-ipucu", "Görseli sürükleyin, iki parmakla büyütün"), dugme("tamam", "Bitti", () => KS.editor.kirpBitir())); return; }
            if (!mod) { cubuk.replaceChildren(); return; }
            const tek = l.length === 1 ? l[0] : null;
            const kilitli = l.every((o) => o.kilit);
            const grupVar = l.some((o) => o.grup);
            cubuk.replaceChildren(...[
                dugme("ayar", "Düzenle", () => KS.ozellikler.ac(), ".birincil"),
                tek && tek.tur === "metin" && !tek.egri && !tek.kilit ? dugme("metin", "Yazı", () => KS.editor.metinDuzenle(tek.id)) : null,
                tek && tek.tur === "gorsel" && tek.varlik && !tek.kilit ? dugme("kirp", "Kırp", () => KS.editor.kirpBaslat(tek.id)) : null,
                dugme("kopyala", "Çoğalt", () => KS.editor.cogalt()),
                dugme("oneGetir", "Öne", () => KS.editor.sirala("one")),
                dugme("arkayaGonder", "Arkaya", () => KS.editor.sirala("arka")),
                l.length > 1 && !grupVar ? dugme("grup", "Grupla", () => KS.editor.grupla()) : null,
                grupVar ? dugme("grupCoz", "Çöz", () => KS.editor.grupCoz()) : null,
                dugme(kilitli ? "kilit" : "kilitAcik", kilitli ? "Kilidi aç" : "Kilitle", () => { KS.editor.kilitle(); ciz(); }),
                dugme("sil", "Sil", () => KS.editor.sil(), ".tehlike"),
                dugme("kapat", "Kapat", () => KS.editor.sec([]))].filter(Boolean));
        }
        KS.olay.on("secim", ciz);
        KS.olay.on("belge", ciz);
        ciz();

        // Alt gezinme çubuğuna "Sayfa": hiçbir şey seçili değilken sayfa ve belge özellikleri
        const ray = document.getElementById("ray");
        ray.append(h("button.ray-dugme.yalniz-mobil", { type: "button", title: "Sayfa ve katalog ayarları", onclick: () => { if (KS.paneller.aktif()) KS.paneller.kapat(); KS.editor.sec([]); KS.ozellikler.ac(); } },
            h("span.ikon-kap", KS.ikon("sayfa", 21)), h("span", "Sayfa")));

        // Ekrana sığdır (telefonda yakınlaştırma çubuğu yok; iki parmakla yakınlaştırılır)
        document.querySelector(".calisma").append(h("button.mobil-sigdir", { type: "button", title: "Ekrana sığdır", onclick: () => KS.editor.sigdir() }, KS.ikon("sigdir", 18)));

        // Telefona geçilince açık kalan tablet paneli kapansın; masaüstüne dönünce seçim çubuğu sınıfı temizlensin
        KS.olay.on("mobil", (m) => { if (m) KS.ozellikler.kapat(); ciz(); KS.editor.sigdir(); });

        // Mobil uygulamanın içinde logo "AbellPro'ya dön" düğmesidir (iOS'ta geri tuşu yok)
        if (KS.mobilUygulama) {
            const logo = document.querySelector(".logo");
            logo.removeAttribute("href");
            logo.setAttribute("role", "button");
            logo.title = "AbellPro'ya dön";
            logo.setAttribute("aria-label", "AbellPro'ya dön");
            logo.querySelector(".logo-simge").replaceChildren(KS.ikon("sol", 20));
            logo.addEventListener("click", (e) => { e.preventDefault(); mobilKapat(); });
        }
    }

    // Uygulamaya dönüş: bekleyen kayıt yazılır, sonra uygulama sayfayı kapatır
    async function mobilKapat() {
        await KS.uygulama.hemenKaydet();
        await fetch("/kopru/kapat", { method: "POST", headers: { Authorization: "Bearer " + KS.mobilUygulama.token } }).catch(() => {});
    }
    KS.mobilKapat = mobilKapat;

    // Telefonun geri tuşu (mobil uygulama WebView'i çağırır): en üstteki açık katmanı kapatır.
    // Kapatacak bir şey yoksa false döner; uygulama o zaman katalog sayfasından çıkar.
    function geriTusu() {
        if (document.querySelector(".acilir")) { KS.ui.kapat(); return true; }
        if (document.querySelector(".onizleme-kap")) { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); return true; }
        const pencereler = document.querySelectorAll("dialog[open]");
        if (pencereler.length) { pencereler[pencereler.length - 1].dispatchEvent(new Event("cancel", { cancelable: true })) && pencereler[pencereler.length - 1].close(); return true; }
        if (E.duzenlenen) { KS.editor.metinBitir(); return true; }
        if (E.kirpilan) { KS.editor.kirpBitir(); return true; }
        if (KS.mobil() && KS.ozellikler.acikMi()) { KS.ozellikler.kapat(); return true; }
        if (KS.mobil() && !document.getElementById("solPanel").classList.contains("kapali")) { KS.paneller.kapat(); return true; }
        if (E.secim.length) { KS.editor.sec([]); return true; }
        return false;
    }

    KS.mobilArayuz = { baslat, geriTusu };
    KS.geriTusu = geriTusu;
})();
