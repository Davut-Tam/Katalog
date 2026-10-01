// Kalıcı depo: projeler ve yüklenen görseller tarayıcının IndexedDB veritabanında tutulur.
// Görseller Blob olarak saklanır, ekranda nesne adresleriyle (blob:) gösterilir; dışa aktarımda data: adresine çevrilir.
// Proje dosyası (.katalog) belge + görselleri tek JSON'da taşır; başka bilgisayara aktarmak için.
(function () {
    "use strict";
    const KS = window.KS;

    const DB_AD = "katalog-studyo", SURUM = 1;
    let dbSozu = null;
    function db() {
        if (!dbSozu) {
            dbSozu = new Promise((coz, red) => {
                if (!window.indexedDB) return red(new Error("IndexedDB yok"));
                const r = indexedDB.open(DB_AD, SURUM);
                r.onupgradeneeded = () => {
                    const d = r.result;
                    if (!d.objectStoreNames.contains("projeler")) d.createObjectStore("projeler", { keyPath: "id" });
                    if (!d.objectStoreNames.contains("varliklar")) d.createObjectStore("varliklar", { keyPath: "id" });
                };
                r.onsuccess = () => coz(r.result);
                r.onerror = () => red(r.error);
            }).catch((h) => { console.warn("Depo kullanılamıyor:", h); return null; });
        }
        return dbSozu;
    }
    async function islem(depoAdi, mod, fn) {
        const d = await db();
        if (!d) return undefined;
        return new Promise((coz, red) => {
            const t = d.transaction(depoAdi, mod);
            let sonuc;
            const r = fn(t.objectStore(depoAdi));
            if (r) r.onsuccess = () => { sonuc = r.result; };
            t.oncomplete = () => coz(sonuc);
            t.onerror = () => red(t.error);
            t.onabort = () => red(t.error || new Error("İşlem iptal"));
        });
    }

    // ── Görsel varlıkları ───────────────────────────────────────
    const bellek = new Map();        // id → { id, blob, url, g, y, ad, tarih }
    const bekleyen = new Map();      // id → Promise (IDB'den okunuyor)
    const dataOnbellek = new Map();  // id → Promise<dataURL>
    const hazirBildir = KS.gecikmeli(() => KS.olay.yay("varlik-hazir"), 30);

    function bellegeAl(kayit) {
        if (!kayit || !kayit.blob) return null;
        const v = Object.assign({}, kayit, { url: URL.createObjectURL(kayit.blob) });
        bellek.set(kayit.id, v);
        return v;
    }
    function yukleIste(id) {
        if (bellek.has(id) || bekleyen.has(id)) return bekleyen.get(id);
        const p = islem("varliklar", "readonly", (s) => s.get(id)).then((k) => {
            bekleyen.delete(id);
            if (k) { bellegeAl(k); hazirBildir(); }
            return k;
        }).catch(() => { bekleyen.delete(id); });
        bekleyen.set(id, p);
        return p;
    }

    KS.varlik = {
        async ekle(blob, { g = 0, y = 0, ad = "", id } = {}) {
            id = id || KS.kimlik("v");
            const kayit = { id, blob, g, y, ad, tarih: Date.now(), tur: blob.type };
            bellegeAl(kayit);
            try { await islem("varliklar", "readwrite", (s) => s.put(kayit)); } catch (h) { console.warn(h); }
            KS.olay.yay("varliklar");
            return id;
        },
        // Dosyayı küçültüp depoya ekler; { id, g, y } döndürür
        async dosyadan(dosya) {
            const { blob, g, y } = await KS.resmiHazirla(dosya);
            const id = await this.ekle(blob, { g, y, ad: dosya.name || "" });
            return { id, g, y };
        },
        url(id) {
            const v = bellek.get(id);
            if (v) return v.url;
            if (id) yukleIste(id);
            return null;
        },
        al: (id) => bellek.get(id),
        async bekle(id) { if (!bellek.has(id)) await yukleIste(id); return bellek.get(id); },
        async hepsiniBekle(idler) { await Promise.all([...new Set(idler)].filter(Boolean).map((id) => this.bekle(id))); },
        async dataUrl(id) {
            if (!dataOnbellek.has(id)) {
                dataOnbellek.set(id, (async () => {
                    const v = await this.bekle(id);
                    return v ? KS.dataUrlOku(v.blob) : null;
                })());
            }
            return dataOnbellek.get(id);
        },
        async liste() {
            const hepsi = (await islem("varliklar", "readonly", (s) => s.getAll())) || [];
            for (const k of hepsi) if (!bellek.has(k.id)) bellegeAl(k);
            const kayitli = new Set(hepsi.map((k) => k.id));
            // Depoya yazılamamış (ör. gizli pencere) ama bellekte olanlar da listelensin
            const ek = [...bellek.values()].filter((v) => !kayitli.has(v.id));
            return [...hepsi.map((k) => bellek.get(k.id)), ...ek].filter(Boolean).sort((a, b) => b.tarih - a.tarih);
        },
        async sil(id) {
            const v = bellek.get(id);
            if (v) URL.revokeObjectURL(v.url);
            bellek.delete(id);
            dataOnbellek.delete(id);
            await islem("varliklar", "readwrite", (s) => s.delete(id));
            KS.olay.yay("varliklar");
        },
        // Mevcut bir varlığın içeriğini değiştirir (ör. arka plan temizleme sonrası yeni kopya)
        async kopyala(id, blob, ek = {}) {
            const v = await this.bekle(id);
            return this.ekle(blob, Object.assign({ g: v?.g, y: v?.y, ad: (v?.ad || "") + " (düzenlendi)" }, ek));
        }
    };

    // ── Projeler ────────────────────────────────────────────────
    KS.depo = {
        async kaydet(belge) {
            const kayit = {
                id: belge.id, ad: belge.ad, guncel: Date.now(), genislik: belge.genislik, yukseklik: belge.yukseklik,
                sayfaSayisi: belge.sayfalar.length, belge: JSON.stringify(belge)
            };
            await islem("projeler", "readwrite", (s) => s.put(kayit));
            try { localStorage.setItem("ks-son", belge.id); } catch (h) { /* yok say */ }
            return kayit;
        },
        async al(id) {
            const k = await islem("projeler", "readonly", (s) => s.get(id));
            return k ? KS.model.belgeNormallestir(JSON.parse(k.belge)) : null;
        },
        async liste() {
            const hepsi = (await islem("projeler", "readonly", (s) => s.getAll())) || [];
            return hepsi.sort((a, b) => b.guncel - a.guncel);
        },
        async sil(id) { await islem("projeler", "readwrite", (s) => s.delete(id)); },
        sonId() { try { return localStorage.getItem("ks-son"); } catch (h) { return null; } },
        calisiyor: async () => !!(await db()),

        // Belgede kullanılan tüm varlık kimlikleri
        varlikKimlikleri(belge) {
            const idler = new Set();
            if (belge.marka && belge.marka.logo) idler.add(belge.marka.logo);
            for (const u of belge.urunler || []) if (u.gorsel && u.gorsel.varlik) idler.add(u.gorsel.varlik);
            for (const s of belge.sayfalar) {
                if (s.arka && s.arka.resim && s.arka.resim.varlik) idler.add(s.arka.resim.varlik);
                for (const o of s.ogeler) {
                    if (o.tur === "gorsel" && o.varlik) idler.add(o.varlik);
                    if (o.tur === "urun" && o.veri.gorsel && o.veri.gorsel.varlik) idler.add(o.veri.gorsel.varlik);
                }
            }
            return idler;
        },

        // .katalog dosyası: { tur, surum, belge, varliklar: { id: { veri, g, y, ad } } }
        async dosyaOlustur(belge) {
            const varliklar = {};
            for (const id of this.varlikKimlikleri(belge)) {
                const v = await KS.varlik.bekle(id);
                if (!v) continue;
                varliklar[id] = { veri: await KS.varlik.dataUrl(id), g: v.g, y: v.y, ad: v.ad };
            }
            const metin = JSON.stringify({ tur: "katalog-studyo", surum: 1, belge, varliklar });
            return new Blob([metin], { type: "application/json" });
        },
        async dosyaOku(dosya) {
            const veri = JSON.parse(await KS.metinOku(dosya));
            if (!veri || veri.tur !== "katalog-studyo" || !veri.belge) throw new Error("Bu bir Katalog Stüdyo proje dosyası değil.");
            for (const [id, v] of Object.entries(veri.varliklar || {})) {
                if (bellek.has(id)) continue;
                const blob = await KS.dataUrlBlob(v.veri);
                await KS.varlik.ekle(blob, { id, g: v.g, y: v.y, ad: v.ad });
            }
            const belge = KS.model.belgeNormallestir(veri.belge);
            belge.id = KS.kimlik("b"); // aynı dosya iki kez açılırsa eskisinin üstüne yazılmasın
            return belge;
        }
    };
})();
