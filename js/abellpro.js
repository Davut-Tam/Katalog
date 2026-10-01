// AbellPro bağlantısı: stok adları, fiyatları, resimleri ve firma bilgileri AbellPro API'sinden (Api/Katalog) alınır.
// Kimlik öteki AbellPro uygulamalarıyla aynıdır: bu tarayıcıya bir cihaz numarası verilir, lisans kodu
// (Mesaj/LisansMail ile e-postayla istenir) Lisans/Dogrula'ya girilip token alınır, sonra kullanıcı adı + parola.
// Katalogda yapılan ad / fiyat / resim değişiklikleri katalogda kalır; "AbellPro'dan güncelle" yalnız
// elle değiştirilmemiş alanları yeniler (her ürün, son alınan AbellPro değerlerini kaynak alanında tutar).
(function () {
    "use strict";
    const KS = window.KS;
    const { h } = KS;
    const E = KS.E;

    const APP_ADI = "AbellPro.Katalog";
    const KOD_BASLIK = ["u675yuhu", "432uhy"];   // giriş öncesi uçların paylaşılan başlığı (sır değil)
    const ANAHTAR = "ks-abellpro";
    const VARSAYILAN = { sunucu: "", token: "", lisansBitis: null, kullaniciId: "", adSoyad: "", kullanici: "", firma: null };

    let ayar = oku();
    // Katalog AbellPro API'nin içinden açıldıysa (https://api.firma.com.tr/katalog/) sunucu adresi bellidir
    const yerelSunucu = (() => {
        if (!/^https?:$/.test(location.protocol)) return "";
        const i = location.pathname.toLowerCase().indexOf("/katalog");
        return i >= 0 ? location.origin + location.pathname.slice(0, i) : "";
    })();
    if (!ayar.sunucu && yerelSunucu) ayar.sunucu = yerelSunucu;
    function oku() {
        try { return Object.assign({}, VARSAYILAN, JSON.parse(localStorage.getItem(ANAHTAR) || "{}")); }
        catch (h) { return Object.assign({}, VARSAYILAN); }
    }
    function yaz(degisen) {
        Object.assign(ayar, degisen);
        try { localStorage.setItem(ANAHTAR, JSON.stringify(ayar)); } catch (h) { /* gizli pencere */ }
        KS.olay.yay("abellpro");
    }
    // Bu tarayıcının kalıcı cihaz numarası; lisans kodu buna göre üretilir.
    function cihazNo() {
        let n = null;
        try { n = localStorage.getItem("ks-cihaz-no"); } catch (h) { /* yok say */ }
        if (!n) {
            const b = crypto.getRandomValues(new Uint8Array(6));
            n = "KTL-" + [...b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase().replace(/(.{4})(?=.)/g, "$1-");
            try { localStorage.setItem("ks-cihaz-no", n); } catch (h) { /* yok say */ }
        }
        return n;
    }
    const lisansli = () => !!ayar.token && (!ayar.lisansBitis || new Date(ayar.lisansBitis) > new Date());
    const bagli = () => lisansli() && !!ayar.kullaniciId && !!ayar.sunucu;

    function sunucuNormal(adres) {
        let a = String(adres || "").trim().replace(/\/+$/, "").replace(/\/api$/i, "");
        if (!a) return "";
        if (!/^https?:\/\//i.test(a)) a = (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$|^localhost(:\d+)?$/i.test(a) ? "http://" : "https://") + a;
        return a;
    }

    // ── API çağrısı ─────────────────────────────────────────────
    async function api(yol, { yontem = "GET", govde, blob = false, sunucu = ayar.sunucu, kimlik = true } = {}) {
        const basliklar = { [KOD_BASLIK[0]]: KOD_BASLIK[1] };
        if (kimlik && ayar.token) basliklar.Authorization = "Bearer " + ayar.token;
        if (kimlik && ayar.kullaniciId) basliklar.UserId = ayar.kullaniciId;
        if (govde !== undefined) basliklar["Content-Type"] = "application/json";
        const url = `${sunucu}/api/${yol}`;
        let yanit;
        try {
            yanit = await fetch(url, { method: yontem, headers: basliklar, body: govde !== undefined ? JSON.stringify(govde) : undefined });
        } catch (hata) {
            const karisik = location.protocol === "https:" && url.startsWith("http:");
            throw new Error(karisik
                ? "Güvenli (https) sayfadan http adresindeki sunucuya bağlanılamaz. Sunucunun https adresini kullanın ya da kataloğu bilgisayarınızdan açın."
                : "Sunucuya ulaşılamadı. Adresi ve internet bağlantısını kontrol edin.");
        }
        if (blob) {
            if (yanit.status === 401) throw Object.assign(new Error("Oturum geçersiz."), { yetkisiz: true });
            if (!yanit.ok) throw new Error(`Resim alınamadı (${yanit.status})`);
            return yanit.blob();
        }
        const metin = await yanit.text();
        let veri;
        try { veri = metin ? JSON.parse(metin) : {}; } catch (h) { veri = { isSuccess: false, message: metin }; }
        if (typeof veri === "string") veri = { isSuccess: false, message: veri };
        if (yanit.status === 401) throw Object.assign(new Error(veri.message || "Oturum geçersiz ya da süresi dolmuş."), { yetkisiz: true });
        if (yanit.status === 400 && /Tanımsız domain/i.test(veri.message || "")) throw new Error("Bu adres sunucuda kayıtlı bir firmaya ait değil: " + veri.message);
        if (!yanit.ok || veri.isSuccess === false) throw new Error(veri.message || `Sunucu hatası (${yanit.status})`);
        return veri.data;
    }
    // Paralel ama sınırlı sayıda iş
    async function sirayla(liste, es, fn) {
        let i = 0;
        const isci = async () => { while (i < liste.length) { const k = i++; await fn(liste[k], k); } };
        await Promise.all(Array.from({ length: Math.min(es, liste.length) }, isci));
    }

    // ── Bağlantı sihirbazı ──────────────────────────────────────
    function baglantiPenceresi({ sonra } = {}) {
        let adim = !ayar.sunucu ? "sunucu" : !lisansli() ? "lisans" : !ayar.kullaniciId ? "giris" : "tamam";
        let kodMaili = true;
        const govde = h("div.ap-sihirbaz");
        const durum = h("p.ipucu-metin", { style: { minHeight: "18px", margin: "10px 0 0" } });
        const adimlar = h("div.ap-adimlar");
        const hata = (m) => { durum.style.color = "var(--tehlike)"; durum.textContent = m; };
        const bilgi = (m) => { durum.style.color = ""; durum.textContent = m; };
        const mesgul = (dugme, f) => async () => {
            dugme.disabled = true; bilgi("");
            try { await f(); } catch (h) { hata(h.message); } finally { dugme.disabled = false; }
        };
        const girdi = (oz) => { const g = h("input.girdi", Object.assign({ style: { height: "40px", fontSize: "14px" } }, oz)); g.addEventListener("keydown", (e) => e.stopPropagation()); return g; };

        function ciz() {
            const sira = ["sunucu", "lisans", "giris"];
            adimlar.replaceChildren(...[["sunucu", "Sunucu"], ["lisans", "Lisans"], ["giris", "Kullanıcı"]].map(([k, ad], i) =>
                h("div.ap-adim" + (k === adim ? ".aktif" : sira.indexOf(adim) > i || adim === "tamam" ? ".bitti" : ""), h("span", sira.indexOf(adim) > i || adim === "tamam" ? "✓" : String(i + 1)), ad)));
            bilgi("");
            if (adim === "sunucu") {
                const adres = girdi({ value: ayar.sunucu, placeholder: "ör. https://api.marketim.com.tr  ya da  http://192.168.1.10:5000" });
                const dugme = h("button.dugme.birincil", { type: "button" }, "Bağlan");
                const bagla = mesgul(dugme, async () => {
                    const s = sunucuNormal(adres.value);
                    if (!s) { hata("Sunucu adresini girin."); return; }
                    bilgi("Bağlanılıyor…");
                    const d = await api("Lisans/Bilgi", { sunucu: s, kimlik: false });
                    kodMaili = d ? d.kodMailiGonderilebilir !== false : true;
                    const degisti = s !== ayar.sunucu;
                    yaz(degisti ? { sunucu: s, token: "", lisansBitis: null, kullaniciId: "", adSoyad: "", firma: null } : { sunucu: s });
                    adim = lisansli() ? "giris" : "lisans";
                    ciz();
                });
                dugme.addEventListener("click", bagla);
                adres.addEventListener("keydown", (e) => { if (e.key === "Enter") bagla(); });
                govde.replaceChildren(
                    h("p", { style: { margin: "0 0 12px", color: "var(--yazi-2)" } }, "AbellPro uygulamalarınızın bağlandığı sunucu adresini yazın (kasa ya da mobil uygulamanın ayarlarındaki adres)."),
                    h("label.form-alan", "Sunucu adresi", h("div", { style: { display: "flex", gap: "8px" } }, adres, dugme)));
                setTimeout(() => adres.focus(), 40);
            } else if (adim === "lisans") {
                const no = cihazNo();
                const kod = girdi({ placeholder: "0000-0000-0000-0000", inputmode: "numeric", maxlength: 19, style: { height: "44px", fontSize: "18px", letterSpacing: "2px", textAlign: "center", fontVariantNumeric: "tabular-nums" } });
                kod.addEventListener("input", () => {
                    const r = kod.value.replace(/\D/g, "").slice(0, 16);
                    kod.value = r.replace(/(\d{4})(?=\d)/g, "$1-");
                });
                const dogrula = h("button.dugme.birincil", { type: "button" }, "Doğrula");
                const iste = h("button.dugme", { type: "button" }, KS.ikon("dosya", 16), "Kodu e-postayla iste");
                const kopyala = h("button.ikon-dugme.kucuk", { type: "button", title: "Kopyala", onclick: () => { navigator.clipboard?.writeText(no); KS.bildir("Cihaz numarası kopyalandı"); } }, KS.ikon("kopyala", 15));
                iste.addEventListener("click", mesgul(iste, async () => {
                    bilgi("Gönderiliyor…");
                    await api("Mesaj/LisansMail", { yontem: "POST", kimlik: false, govde: { SifreliKod: "", AppName: APP_ADI, IslemciNo: no, Demo: false, CihazTuru: "Tarayıcı", Kod: KOD_BASLIK[1] } });
                    bilgi("Lisans kodları yazılım sağlayıcınıza e-postayla gönderildi. Size ilettikleri 16 haneli kodu aşağıya yazın.");
                }));
                const dogrulaF = mesgul(dogrula, async () => {
                    const k = kod.value.replace(/\D/g, "");
                    if (k.length !== 16) { hata("Lisans kodu 16 haneli olmalı."); return; }
                    bilgi("Doğrulanıyor…");
                    const d = await api("Lisans/Dogrula", { yontem: "POST", kimlik: false, govde: { Kod: k, IslemciNo: no, AppName: APP_ADI } });
                    const bitis = d.bitisZamani && new Date(d.bitisZamani).getFullYear() < 9000 ? d.bitisZamani : null;
                    yaz({ token: d.token, lisansBitis: bitis });
                    adim = "giris";
                    ciz();
                    KS.bildir(bitis ? `Lisans doğrulandı (${new Date(bitis).toLocaleDateString("tr-TR")} tarihine kadar)` : "Lisans doğrulandı (süresiz)", { tur: "basari" });
                });
                dogrula.addEventListener("click", dogrulaF);
                kod.addEventListener("keydown", (e) => { if (e.key === "Enter") dogrulaF(); });
                govde.replaceChildren(
                    h("p", { style: { margin: "0 0 12px", color: "var(--yazi-2)" } }, "Katalog, öteki AbellPro uygulamaları gibi lisans koduyla açılır. Lisans bu tarayıcıya bağlıdır."),
                    h("div.ap-cihaz", h("div", h("small", "Bu tarayıcının cihaz numarası"), h("b", no)), kopyala),
                    kodMaili ? h("div", { style: { margin: "12px 0" } }, iste) : null,
                    h("label.form-alan", "Lisans kodu", h("div", { style: { display: "flex", gap: "8px" } }, kod, dogrula)),
                    h("button.dugme.hayalet.kucuk", { type: "button", style: { marginTop: "10px" }, onclick: () => { adim = "sunucu"; ciz(); } }, "← Sunucu adresini değiştir"));
                setTimeout(() => kod.focus(), 40);
            } else if (adim === "giris") {
                const kullanici = girdi({ value: ayar.kullanici || "", placeholder: "Ad soyad, kullanıcı kodu ya da e-posta", autocomplete: "username" });
                const parola = girdi({ type: "password", placeholder: "Parola", autocomplete: "current-password" });
                const dugme = h("button.dugme.birincil", { type: "button", style: { height: "40px" } }, "Giriş yap");
                const giris = mesgul(dugme, async () => {
                    if (!kullanici.value.trim() || !parola.value) { hata("Kullanıcı adı ve parolayı girin."); return; }
                    bilgi("Giriş yapılıyor…");
                    try {
                        const d = await api("Katalog/Giris", { yontem: "POST", govde: { Kullanici: kullanici.value.trim(), Parola: parola.value } });
                        yaz({ kullaniciId: String(d.kullaniciId), adSoyad: d.adSoyad, firma: d.firma, kullanici: kullanici.value.trim() });
                        KS.bildir(`AbellPro'ya bağlandınız: ${d.adSoyad}`, { tur: "basari" });
                        // Bağlantı bir işin önünde açıldıysa (ör. "ürün al") pencere kapanıp o iş sürer
                        if (sonra) { p.kapat(); setTimeout(sonra, 80); return; }
                        adim = "tamam";
                        ciz();
                    } catch (h) {
                        if (h.yetkisiz) { yaz({ token: "", lisansBitis: null }); adim = "lisans"; ciz(); }
                        throw h;
                    }
                });
                dugme.addEventListener("click", giris);
                parola.addEventListener("keydown", (e) => { if (e.key === "Enter") giris(); });
                govde.replaceChildren(
                    h("p", { style: { margin: "0 0 12px", color: "var(--yazi-2)" } }, "AbellPro kullanıcı bilgilerinizle giriş yapın. Stokları görme yetkiniz olmalı."),
                    h("div", { style: { display: "grid", gap: "10px" } },
                        h("label.form-alan", "Kullanıcı", kullanici), h("label.form-alan", "Parola", parola), dugme),
                    h("button.dugme.hayalet.kucuk", { type: "button", style: { marginTop: "10px" }, onclick: () => { adim = "lisans"; ciz(); } }, "← Lisans"));
                setTimeout(() => (kullanici.value ? parola : kullanici).focus(), 40);
            } else {
                const f = ayar.firma || {};
                govde.replaceChildren(
                    h("div.ap-tamam", KS.ikon("tamam", 28),
                        h("div", h("b", f.kisaAd || f.unvan || "AbellPro"), h("small", `${ayar.adSoyad} olarak bağlandınız · ${ayar.sunucu.replace(/^https?:\/\//, "")}`))),
                    h("p.ipucu-metin", ayar.lisansBitis ? `Lisans ${new Date(ayar.lisansBitis).toLocaleDateString("tr-TR")} tarihine kadar geçerli.` : "Lisans süresiz."));
            }
        }
        ciz();
        const p = KS.ui.pencere({
            baslik: "AbellPro bağlantısı", aciklama: "Stok adları, fiyatları ve resimleri AbellPro'dan gelsin.", sinif: "dar",
            icerik: h("div", adimlar, govde, durum),
            dugmeler: [{ etiket: "Kapat" }],
            kapaninca: () => KS.olay.yay("abellpro")
        });
        return p;
    }

    async function oturumGerekli(fn) {
        if (!bagli()) { baglantiPenceresi({ sonra: fn }); return; }
        try { await fn(); }
        catch (h) {
            if (h.yetkisiz) {
                yaz({ kullaniciId: "" });
                KS.bildir("AbellPro oturumu geçersiz; yeniden giriş yapın.", { tur: "hata", sure: 4000 });
                baglantiPenceresi({ sonra: fn });
            } else KS.bildir(h.message, { tur: "hata", sure: 5000 });
        }
    }
    function cikis() { yaz({ kullaniciId: "", adSoyad: "" }); KS.bildir("AbellPro oturumu kapatıldı"); }
    function lisansiSifirla() { yaz({ token: "", lisansBitis: null, kullaniciId: "", adSoyad: "" }); KS.bildir("Lisans bu tarayıcıdan kaldırıldı"); }

    // ── Stok → katalog ürünü ────────────────────────────────────
    const ilkBarkod = (b) => (b ? String(b).split(",")[0].trim() : "");
    // Katalog alanlarının AbellPro karşılığı (güncellemede karşılaştırılan değerler)
    function alanlar(s) {
        const kg = /^(kg|kilo|kilogram)$/i.test((s.brimAdi || "").trim());
        const aciklama = (s.aciklama || "").trim();
        return {
            ad: (s.stokAdi || "").trim(),
            fiyat: Number(s.satisFiyati) || 0,
            eski: Number(s.eskiSatisFiyati) > Number(s.satisFiyati) ? Number(s.eskiSatisFiyati) : 0,
            kategori: (s.stokTuruAdi || "").trim(),
            birim: kg ? "/kg" : "",
            aciklama: aciklama.length <= 40 ? aciklama : ""
        };
    }
    const ALANLAR = ["ad", "fiyat", "eski", "kategori", "birim", "aciklama"];
    async function resimAl(s) {
        const blob = await api(`Katalog/Resim/${s.id}`, { blob: true });
        const dosya = new File([blob], `${s.id}.png`, { type: blob.type || "image/png" });
        const { blob: kucuk, g, y } = await KS.resmiHazirla(dosya, 1400);
        return KS.varlik.ekle(kucuk, { g, y, ad: s.stokAdi });
    }
    // Yeni ürün oluşturur (listeye eklemeden döndürür) ya da listede zaten varsa onu tazeler
    async function urunEkle(s, resimler) {
        let u = E.belge.urunler.find((x) => x.kaynak && x.kaynak.sistem === "abellpro" && x.kaynak.stokId === s.id);
        if (u) return { u, yeni: false, degisti: await urunuGuncelle(u, s, resimler) };
        const a = alanlar(s);
        u = Object.assign({ id: KS.kimlik("u"), rozet: "", gorsel: { varlik: null, emoji: KS.emojiTahmin ? KS.emojiTahmin(a.ad) : "🛒" } }, a, {
            kaynak: Object.assign({ sistem: "abellpro", stokId: s.id, kod: s.kod, barkod: ilkBarkod(s.barkod), resimSurum: null, varlik: null }, a)
        });
        if (resimler && s.resimVar) {
            try {
                const vid = await resimAl(s);
                u.gorsel = { varlik: vid, emoji: null };
                u.kaynak.varlik = vid;
                u.kaynak.resimSurum = s.resimSurum;
            } catch (h) { /* resim alınamazsa emoji kalır */ }
        }
        return { u, yeni: true };
    }
    // Üç yollu birleştirme: kullanıcının katalogda değiştirdiği alan korunur, değiştirmediği güncellenir
    async function urunuGuncelle(u, s, resimler = true) {
        const yeni = alanlar(s);
        const k = u.kaynak;
        const ozet = { fiyat: false, diger: false, resim: false };
        for (const alan of ALANLAR) {
            const elle = String(u[alan] ?? "") !== String(k[alan] ?? "");
            if (!elle && String(u[alan] ?? "") !== String(yeni[alan] ?? "")) {
                u[alan] = yeni[alan];
                if (alan === "fiyat" || alan === "eski") ozet.fiyat = true; else ozet.diger = true;
            }
            k[alan] = yeni[alan];
        }
        k.kod = s.kod;
        k.barkod = ilkBarkod(s.barkod);
        k.pasif = !s.durum;
        const resimElle = u.gorsel && u.gorsel.varlik && u.gorsel.varlik !== k.varlik;
        if (resimler && s.resimVar && s.resimSurum !== k.resimSurum && !resimElle) {
            try {
                const vid = await resimAl(s);
                u.gorsel = { varlik: vid, emoji: null };
                k.varlik = vid;
                k.resimSurum = s.resimSurum;
                ozet.resim = true;
            } catch (h) { /* sonraki güncellemede yeniden denenir */ }
        }
        return ozet;
    }
    // Ürünü AbellPro'daki son değerlerine döndürür (elle yapılan değişiklikleri atar)
    function orijinaleDondur(u) {
        if (!u.kaynak) return;
        for (const alan of ALANLAR) u[alan] = u.kaynak[alan];
        if (u.kaynak.varlik) u.gorsel = { varlik: u.kaynak.varlik, emoji: null };
        KS.editor.urunKartlariniEsitle(u);
        KS.editor.tumunuCiz();
        KS.gecmis.kaydet();
        KS.olay.yay("urunler");
    }
    function baglantiyiKaldir(u) {
        delete u.kaynak;
        KS.gecmis.kaydet();
        KS.olay.yay("urunler");
    }

    // ── Listedeki AbellPro ürünlerini güncelle ──────────────────
    async function guncelle() {
        const bagliUrunler = E.belge.urunler.filter((u) => u.kaynak && u.kaynak.sistem === "abellpro");
        if (!bagliUrunler.length) { KS.bildir("Listede AbellPro'dan alınmış ürün yok"); return; }
        await oturumGerekli(async () => {
            const bildirim = KS.bildir("AbellPro'dan güncel bilgiler alınıyor…", { sure: 120000 });
            try {
                const stoklar = new Map();
                const idler = [...new Set(bagliUrunler.map((u) => u.kaynak.stokId))];
                for (let i = 0; i < idler.length; i += 1000) {
                    for (const s of await api("Katalog/StokSec", { yontem: "POST", govde: idler.slice(i, i + 1000) })) stoklar.set(s.id, s);
                }
                let fiyat = 0, diger = 0, resim = 0, bulunamadi = 0, n = 0;
                await sirayla(bagliUrunler, 4, async (u) => {
                    const s = stoklar.get(u.kaynak.stokId);
                    n++;
                    bildirim.metin(`Güncelleniyor… ${n} / ${bagliUrunler.length}`);
                    if (!s) { u.kaynak.silindi = true; bulunamadi++; return; }
                    const o = await urunuGuncelle(u, s, true);
                    if (o.fiyat) fiyat++;
                    if (o.diger) diger++;
                    if (o.resim) resim++;
                    KS.editor.urunKartlariniEsitle(u);
                });
                KS.editor.tumunuCiz();
                KS.gecmis.kaydet();
                KS.olay.yay("urunler");
                const parcalar = [`${fiyat} ürünün fiyatı`, diger ? `${diger} ürünün bilgisi` : "", resim ? `${resim} resim` : ""].filter(Boolean);
                KS.bildir(fiyat + diger + resim ? `Güncellendi: ${parcalar.join(", ")}.${bulunamadi ? ` ${bulunamadi} ürün AbellPro'da bulunamadı.` : ""}` : "Her şey güncel." + (bulunamadi ? ` ${bulunamadi} ürün AbellPro'da bulunamadı.` : ""), { tur: "basari", sure: 5000 });
            } finally { bildirim(); }
        });
    }

    // ── Firma bilgileri → marka ─────────────────────────────────
    async function firmaBilgisiAl() {
        await oturumGerekli(async () => {
            const f = await api("Katalog/Firma");
            const m = E.belge.marka;
            const once = { ad: m.ad, telefon: m.telefon, adres: m.adres };
            const yeni = { ad: f.kisaAd || f.unvan || m.ad, telefon: f.telefon || m.telefon, adres: f.adres || m.adres };
            Object.assign(m, yeni);
            if (f.logoVar) {
                try {
                    const blob = await api("Katalog/Logo", { blob: true });
                    const { blob: kucuk, g, y } = await KS.resmiHazirla(new File([blob], "logo.png", { type: blob.type || "image/png" }), 1000);
                    m.logo = await KS.varlik.ekle(kucuk, { g, y, ad: "Logo" });
                } catch (h) { /* logo alınamazsa diğerleri yine güncellenir */ }
            }
            // Sayfalardaki eski market adı / telefon / adres yazıları da yenilensin
            let n = 0;
            for (const k of ["ad", "telefon", "adres"]) if (KS.paneller.yaziDegistir) n += KS.paneller.yaziDegistir(once[k], yeni[k]);
            try { localStorage.setItem("ks-marka", JSON.stringify({ ad: m.ad, slogan: m.slogan, telefon: m.telefon, adres: m.adres, web: m.web, renkler: m.renkler, logo: m.logo })); } catch (h) { /* yok say */ }
            KS.editor.tumunuCiz();
            KS.gecmis.kaydet();
            KS.olay.yay("belge");
            KS.bildir(`Firma bilgileri alındı${n ? `; sayfalarda ${n} yazı güncellendi` : ""}`, { tur: "basari" });
        });
    }

    // ── Stok seçme penceresi ────────────────────────────────────
    function stokPenceresi() {
        oturumGerekli(async () => {
            const turler = await api("Katalog/StokTurleri");
            const durum = { ara: "", tur: "", suzgec: "", resimli: false, sayfa: 1, adet: 50, toplam: 0, liste: [] };
            const secili = new Map();
            const resimOnbellek = new Map();
            let ekleDugme;
            const listeEl = h("div.ap-liste");
            const altBilgi = h("span.ap-sayfa");
            const onceki = h("button.ikon-dugme.kucuk", { type: "button", title: "Önceki sayfa" }, KS.ikon("sol", 16));
            const sonraki = h("button.ikon-dugme.kucuk", { type: "button", title: "Sonraki sayfa" }, KS.ikon("sag", 16));
            const ara = h("input", { type: "search", placeholder: "Stok adı, barkod ya da kod…", autocomplete: "off" });
            const turSec = h("select.secim", h("option", { value: "" }, "Tüm türler"), turler.map((t) => h("option", { value: t.id }, `${t.stokTuruAdi} (${t.stokSayisi})`)));
            const suzgec = KS.ui.bolumlu({ secenekler: [{ deger: "", etiket: "Tümü" }, { deger: "indirimli", etiket: "Fiyatı düşenler" }, { deger: "7", etiket: "Son 7 gün" }, { deger: "30", etiket: "Son 30 gün" }], deger: "", degisti: (v) => { durum.suzgec = v; durum.sayfa = 1; yukle(); } });
            const resimli = KS.ui.anahtar({ deger: false, degisti: (v) => { durum.resimli = v; durum.sayfa = 1; yukle(); } });
            const resimleriAl = KS.ui.anahtar({ deger: true, degisti: () => {} });
            ara.addEventListener("keydown", (e) => e.stopPropagation());
            ara.addEventListener("input", KS.gecikmeli(() => { durum.ara = ara.value; durum.sayfa = 1; yukle(); }, 300));
            turSec.addEventListener("change", () => { durum.tur = turSec.value; durum.sayfa = 1; yukle(); });
            onceki.addEventListener("click", () => { if (durum.sayfa > 1) { durum.sayfa--; yukle(); } });
            sonraki.addEventListener("click", () => { if (durum.sayfa * durum.adet < durum.toplam) { durum.sayfa++; yukle(); } });
            const sorgu = (sayfa, adet) => {
                const q = new URLSearchParams({ sayfa, adet });
                if (durum.ara.trim()) q.set("ara", durum.ara.trim());
                if (durum.tur) q.set("stokTuruId", durum.tur);
                if (durum.resimli) q.set("resimli", "true");
                if (durum.suzgec === "indirimli") q.set("indirimli", "true");
                else if (durum.suzgec) q.set("sonGun", durum.suzgec);
                return "Katalog/Stoklar?" + q;
            };
            const gozcu = new IntersectionObserver((girdiler) => {
                for (const g of girdiler) if (g.isIntersecting) { gozcu.unobserve(g.target); kucukResim(g.target); }
            }, { root: listeEl, rootMargin: "100px" });
            async function kucukResim(el) {
                const id = el.dataset.id;
                try {
                    if (!resimOnbellek.has(id)) resimOnbellek.set(id, api(`Katalog/Resim/${id}`, { blob: true }).then((b) => URL.createObjectURL(b)));
                    const url = await resimOnbellek.get(id);
                    el.replaceChildren(h("img", { src: url, alt: "" }));
                } catch (h) { /* emoji kalır */ }
            }
            const listedeVar = (id) => E.belge.urunler.some((u) => u.kaynak && u.kaynak.stokId === id);
            function satir(s) {
                const kutu = h("input", { type: "checkbox", checked: secili.has(s.id) });
                const a = alanlar(s);
                const gorsel = h("div.ap-gorsel", { dataset: { id: s.id } }, h("span", KS.emojiTahmin ? KS.emojiTahmin(a.ad) : "🛒"));
                if (s.resimVar) gozcu.observe(gorsel);
                const el = h("label.ap-satir" + (secili.has(s.id) ? ".secili" : ""), kutu, gorsel,
                    h("div.ap-bilgi", h("b", a.ad), h("small", [a.kategori, "Kod " + String(s.kod).padStart(4, "0"), ilkBarkod(s.barkod)].filter(Boolean).join(" · ")),
                        listedeVar(s.id) ? h("span.ap-rozet", "Listede") : null, !s.durum ? h("span.ap-rozet.pasif", "Pasif") : null),
                    h("div.ap-fiyat", KS.fiyatMetin(a.fiyat), a.eski ? h("s", KS.fiyatMetin(a.eski)) : null, a.birim ? h("small", a.birim) : null));
                kutu.addEventListener("change", () => {
                    if (kutu.checked) secili.set(s.id, s); else secili.delete(s.id);
                    el.classList.toggle("secili", kutu.checked);
                    sayac();
                });
                return el;
            }
            function sayac() {
                if (ekleDugme) {
                    ekleDugme.disabled = !secili.size;
                    ekleDugme.lastChild.textContent = secili.size ? `${secili.size} ürünü ekle` : "Ürün seçin";
                }
            }
            let istekNo = 0;
            async function yukle() {
                const no = ++istekNo;
                listeEl.classList.add("yukleniyor");
                try {
                    const d = await api(sorgu(durum.sayfa, durum.adet));
                    if (no !== istekNo) return;
                    durum.toplam = d.toplam;
                    durum.liste = d.liste;
                    listeEl.replaceChildren(...(d.liste.length ? d.liste.map(satir) : [h("div.bos-durum", "Aramaya uyan stok yok")]));
                    listeEl.scrollTop = 0;
                    const sayfaSayisi = Math.max(1, Math.ceil(d.toplam / durum.adet));
                    altBilgi.textContent = `${d.toplam.toLocaleString("tr-TR")} stok · Sayfa ${durum.sayfa} / ${sayfaSayisi}`;
                    onceki.disabled = durum.sayfa <= 1;
                    sonraki.disabled = durum.sayfa >= sayfaSayisi;
                } catch (hata) {
                    if (no === istekNo) listeEl.replaceChildren(h("div.bos-durum", hata.message));
                    if (hata.yetkisiz) {
                        yaz({ kullaniciId: "" });
                        p.kapat();
                        KS.bildir("AbellPro oturumu geçersiz; yeniden giriş yapın.", { tur: "hata", sure: 4000 });
                        baglantiPenceresi({ sonra: stokPenceresi });
                    }
                } finally { if (no === istekNo) listeEl.classList.remove("yukleniyor"); }
            }
            const sayfayiSec = h("button.dugme.kucuk", { type: "button", onclick: () => { for (const s of durum.liste) secili.set(s.id, s); listeEl.replaceChildren(...durum.liste.map(satir)); sayac(); } }, "Bu sayfayı seç");
            const hepsiniSec = h("button.dugme.kucuk", { type: "button" }, "Tüm sonuçları seç");
            hepsiniSec.addEventListener("click", async () => {
                if (durum.toplam > 1000 && !(await KS.ui.onayla({ baslik: "Çok sayıda stok", metin: `${durum.toplam.toLocaleString("tr-TR")} sonuçtan ilk 1000'i seçilecek. Daha dar bir arama ya da tür seçmeniz önerilir.`, evet: "İlk 1000'i seç" }))) return;
                hepsiniSec.disabled = true;
                try {
                    for (let s = 1; s <= Math.ceil(Math.min(durum.toplam, 1000) / 500); s++) for (const x of (await api(sorgu(s, 500))).liste) secili.set(x.id, x);
                    listeEl.replaceChildren(...durum.liste.map(satir));
                    sayac();
                } catch (h) { KS.bildir(h.message, { tur: "hata" }); } finally { hepsiniSec.disabled = false; }
            });
            const temizle = h("button.dugme.kucuk.hayalet", { type: "button", onclick: () => { secili.clear(); listeEl.replaceChildren(...durum.liste.map(satir)); sayac(); } }, "Seçimi temizle");
            const f = ayar.firma || {};
            const p = KS.ui.pencere({
                baslik: "AbellPro'dan ürün al", aciklama: `${f.kisaAd || f.unvan || "AbellPro"} · ${ayar.adSoyad}`, sinif: "genis",
                icerik: h("div.ap-tarayici",
                    h("div.ap-ust", h("div.ara-kutu", { style: { margin: 0, flex: "1" } }, KS.ikon("ara", 16), ara), turSec),
                    h("div.ap-ust", suzgec.el, h("label.ap-anahtar", resimli.el, "Yalnız resimliler")),
                    listeEl,
                    h("div.ap-alt", h("div", { style: { display: "flex", alignItems: "center", gap: "4px" } }, onceki, altBilgi, sonraki), h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } }, sayfayiSec, hepsiniSec, temizle)),
                    h("label.ap-anahtar", { style: { marginTop: "8px" } }, resimleriAl.el, "Stok resimlerini de al (resmi olmayanlara emoji konur)")),
                kapaninca: () => { gozcu.disconnect(); for (const p2 of resimOnbellek.values()) p2.then((u) => URL.revokeObjectURL(u)).catch(() => {}); },
                dugmeler: [
                    { etiket: "Bağlantı", ikon: "ayar", sol: true, fn: () => { setTimeout(() => baglantiPenceresi({}), 60); } },
                    { etiket: "Vazgeç" },
                    {
                        etiket: "Ürün seçin", birincil: true, ikon: "arti", pasif: true, ref: (b) => { ekleDugme = b; }, fn: () => {
                            const liste = [...secili.values()];
                            const resim = resimleriAl.el.getAttribute("aria-checked") === "true";
                            setTimeout(() => topluEkle(liste, resim), 60);
                        }
                    }
                ]
            });
            yukle();
            setTimeout(() => ara.focus(), 50);
        });
    }
    async function topluEkle(stoklar, resimler) {
        // Liste yalnız şablondan gelen örnek ürünlerden oluşuyorsa, gerçek ürünler gelirken onları kaldırmayı öner
        const ornekAdlar = new Set((KS.ORNEK_URUNLER || []).map((x) => x.ad));
        const ornekler = E.belge.urunler.filter((u) => !u.kaynak && ornekAdlar.has(u.ad));
        if (ornekler.length && ornekler.length === E.belge.urunler.length &&
            await KS.ui.onayla({ baslik: "Örnek ürünler", metin: `Listede şablondan gelen ${ornekler.length} örnek ürün var. AbellPro ürünleri eklenirken bunlar listeden kaldırılsın mı? (Sayfadaki kartlar yerinde kalır.)`, evet: "Kaldır", hayir: "Kalsın" })) {
            E.belge.urunler = [];
        }
        const bildirim = KS.bildir(`Ürünler ekleniyor… 0 / ${stoklar.length}`, { sure: 600000 });
        const yeniler = new Array(stoklar.length);
        let yeni = 0, guncel = 0, n = 0;
        try {
            await sirayla(stoklar, 4, async (s, i) => {
                const r = await urunEkle(s, resimler);
                if (r.yeni) { yeniler[i] = r.u; yeni++; } else { guncel++; KS.editor.urunKartlariniEsitle(r.u); }
                bildirim.metin(`Ürünler ekleniyor… ${++n} / ${stoklar.length}`);
            });
        } catch (h) {
            KS.bildir(h.message, { tur: "hata", sure: 5000 });
        } finally {
            // Yeni ürünler seçim sırasıyla listenin başına
            E.belge.urunler.unshift(...yeniler.filter(Boolean));
            bildirim();
            KS.editor.tumunuCiz();
            KS.gecmis.kaydet();
            KS.olay.yay("urunler");
            if (KS.paneller.aktif() !== "urunler") KS.paneller.ac("urunler");
        }
        KS.bildir(`${yeni} ürün eklendi${guncel ? `, ${guncel} ürün güncellendi` : ""}`, { tur: "basari", sure: 6000, eylem: yeni ? { metin: "Sayfalara yerleştir", fn: () => KS.paneller.yerlesimPenceresi() } : null });
    }

    KS.abellpro = {
        bagli, lisansli, ayar: () => ayar, baglantiPenceresi, stokPenceresi, guncelle, firmaBilgisiAl, cikis, lisansiSifirla,
        orijinaleDondur, baglantiyiKaldir, cihazNo, api
    };
})();
