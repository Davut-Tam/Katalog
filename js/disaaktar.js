// Dışa aktarım: PNG / JPG (çok sayfada ZIP), PDF (tarayıcı yazdırma ile vektörel ya da doğrudan görsel tabanlı),
// tek dosyalık web kataloğu (HTML) ve proje dosyası. Görseller, sayfa DOM'u fontları ve resimleri gömülü
// bir SVG foreignObject'e konup tuvale çizilerek üretilir: ekranda görünenle birebir aynıdır.
(function () {
    "use strict";
    const KS = window.KS;
    const { h } = KS;
    const E = KS.E;
    const EMOJI_RE = /\p{Extended_Pictographic}/u;

    // ── Sayfayı resme çevirme ───────────────────────────────────
    function sayfaVarliklari(s) {
        return [...KS.depo.varlikKimlikleri({ sayfalar: [s], urunler: [] })];
    }
    async function hazirla(s) {
        const harita = new Map();
        for (const id of sayfaVarliklari(s)) harita.set(id, await KS.varlik.dataUrl(id));
        if (s.ogeler.some((o) => o.tur === "qr") && !window.qrcode) await KS.betikYukle(KS.KUTUPHANE.qr).catch(() => {});
        const kullanim = new Map();
        for (const o of s.ogeler) KS.model.fontKullanimi(o, kullanim);
        const metin = s.ogeler.map(KS.model.ogeMetni).join(" ");
        if (EMOJI_RE.test(metin)) kullanim.set(KS.fontlar.EMOJI, new Set([400]));
        for (const [aile, w] of kullanim) for (const x of w) await KS.fontlar.hazir(aile, x).catch(() => {});
        const fontCss = await KS.fontlar.gomuluCss(kullanim, metin);
        return { harita, fontCss };
    }
    const xmlKacis = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    async function sayfaResmi(s, { olcek = 2, tur = "image/png", kalite = 0.92 } = {}) {
        const b = E.belge, W = b.genislik, H = b.yukseklik;
        const { harita, fontCss } = await hazirla(s);
        const kok = KS.cizim.sayfaDom(s, b, { url: (id) => harita.get(id) || null });
        kok.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        const icerik = new XMLSerializer().serializeToString(kok);
        const cw = Math.round(W * olcek), ch = Math.round(H * olcek);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${W} ${H}"><foreignObject x="0" y="0" width="${W}" height="${H}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${H}px"><style>${xmlKacis(fontCss + KS.SAYFA_CSS)}</style>${icerik}</div></foreignObject></svg>`;
        const img = new Image();
        img.decoding = "sync";
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        await img.decode();
        await KS.bekle(60);
        const c = document.createElement("canvas");
        c.width = cw; c.height = ch;
        const ctx = c.getContext("2d");
        if (tur === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, cw, ch); }
        ctx.drawImage(img, 0, 0, cw, ch);
        return new Promise((coz, red) => c.toBlob((bl) => (bl ? coz(bl) : red(new Error("Görsel oluşturulamadı (çok büyük olabilir)"))), tur, kalite));
    }

    // "1-3, 5" → [0,1,2,4]
    function aralikCoz(metin, n) {
        const sonuc = new Set();
        for (const p of String(metin).split(/[,;\s]+/).filter(Boolean)) {
            const m = /^(\d+)(?:-(\d+))?$/.exec(p);
            if (!m) continue;
            const a = +m[1], z = m[2] ? +m[2] : a;
            for (let i = Math.min(a, z); i <= Math.max(a, z); i++) if (i >= 1 && i <= n) sonuc.add(i - 1);
        }
        return [...sonuc].sort((a, b) => a - b);
    }

    // ── Yazdırma (vektörel PDF) ─────────────────────────────────
    async function yazdir(sayfalar = E.belge.sayfalar) {
        const b = E.belge;
        if (E.duzenlenen) KS.editor.metinBitir();
        const kap = document.getElementById("baski");
        await KS.varlik.hepsiniBekle([...KS.depo.varlikKimlikleri(b)]);
        if (b.sayfalar.some((s) => s.ogeler.some((o) => o.tur === "qr")) && !window.qrcode) await KS.betikYukle(KS.KUTUPHANE.qr).catch(() => {});
        kap.replaceChildren(...sayfalar.map((s) => KS.cizim.sayfaDom(s, b)));
        let st = document.getElementById("baski-sayfa");
        if (!st) { st = h("style#baski-sayfa"); document.head.append(st); }
        st.textContent = `@page { size: ${b.genislik}px ${b.yukseklik}px; margin: 0; } @media print { html, body { height: auto !important; width: ${b.genislik}px; } }`;
        await document.fonts.ready;
        await Promise.all(KS.$$("img", kap).map((i) => i.decode().catch(() => {})));
        const temizle = () => { kap.replaceChildren(); window.removeEventListener("afterprint", temizle); };
        window.addEventListener("afterprint", temizle);
        window.print();
    }

    // ── Doğrudan PDF (görsel tabanlı) ───────────────────────────
    async function pdfOlustur(sayfalar, { olcek, kalite, ilerle }) {
        await KS.betikYukle(KS.KUTUPHANE.pdf);
        const b = E.belge, W = b.genislik, H = b.yukseklik, pt = (px) => px * 0.75;
        const yon = W > H ? "landscape" : "portrait";
        const pdf = new window.jspdf.jsPDF({ orientation: yon, unit: "pt", format: [pt(W), pt(H)], compress: true });
        for (let i = 0; i < sayfalar.length; i++) {
            if (i) pdf.addPage([pt(W), pt(H)], yon);
            const blob = await sayfaResmi(sayfalar[i], { olcek, tur: "image/jpeg", kalite });
            pdf.addImage(await KS.dataUrlOku(blob), "JPEG", 0, 0, pt(W), pt(H), undefined, "FAST");
            ilerle((i + 1) / sayfalar.length);
        }
        pdf.setProperties({ title: b.ad, creator: "Katalog Stüdyo" });
        return pdf.output("blob");
    }

    // ── Web kataloğu (tek HTML dosyası) ─────────────────────────
    async function webKatalogu(sayfalar, { olcek, kalite, ilerle }) {
        const b = E.belge;
        const resimler = [];
        for (let i = 0; i < sayfalar.length; i++) {
            resimler.push(await KS.dataUrlOku(await sayfaResmi(sayfalar[i], { olcek, tur: "image/jpeg", kalite })));
            ilerle((i + 1) / sayfalar.length);
        }
        const baslik = KS.kacis(b.ad), market = KS.kacis(b.marka.ad || "");
        const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${baslik}</title>
<meta name="description" content="${market} — ${baslik}">
<style>
*{box-sizing:border-box}html,body{height:100%;margin:0}body{background:#111318;color:#fff;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;overflow:hidden}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px}header b{font-size:15px}header span{color:#9aa0ae;font-size:13px}
main{flex:1;position:relative;display:flex;align-items:center;justify-content:center;min-height:0;touch-action:pan-y}
#kitap{display:flex;box-shadow:0 30px 70px rgba(0,0,0,.6);transition:opacity .25s,transform .35s cubic-bezier(.2,.8,.2,1);background:#fff}
#kitap img{display:block;height:100%;width:auto;user-select:none;-webkit-user-drag:none;cursor:zoom-in}
.ok{position:absolute;top:50%;transform:translateY(-50%);width:52px;height:52px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:26px;cursor:pointer;z-index:2}
.ok:hover{background:rgba(255,255,255,.22)}.ok:disabled{opacity:.2;cursor:default}#onceki{left:16px}#sonraki{right:16px}
footer{display:flex;gap:8px;justify-content:center;padding:10px;overflow-x:auto}footer button{border:0;padding:0;background:none;opacity:.45;cursor:pointer;border-radius:3px;overflow:hidden;flex:none}
footer button.aktif{opacity:1;outline:2px solid #fff}footer img{height:58px;display:block}
#yakin{position:fixed;inset:0;background:#111318;overflow:auto;display:none;z-index:5;cursor:zoom-out}#yakin img{display:block;margin:0 auto;width:min(1600px,100%)}
@media (max-width:600px){.ok{width:40px;height:40px;font-size:20px}#onceki{left:6px}#sonraki{right:6px}footer img{height:44px}}
</style></head><body>
<header><div><b>${market}</b> <span>${baslik}</span></div><span id="sayac"></span></header>
<main><button class="ok" id="onceki" aria-label="Önceki">‹</button><div id="kitap"></div><button class="ok" id="sonraki" aria-label="Sonraki">›</button></main>
<footer id="kucukler"></footer><div id="yakin"><img alt=""></div>
<script>
const S=${JSON.stringify(resimler)},ORAN=${b.genislik}/${b.yukseklik};let i=0;
const kitap=document.getElementById("kitap"),sayac=document.getElementById("sayac"),kucukler=document.getElementById("kucukler"),yakin=document.getElementById("yakin");
const cift=()=>ORAN<1&&innerWidth>900&&S.length>1;
function adimlar(){if(!cift())return S.map((_,k)=>[k]);const a=[[0]];for(let k=1;k<S.length;k+=2)a.push(S[k+1]!=null?[k,k+1]:[k]);return a}
function ciz(yon){const a=adimlar();i=Math.max(0,Math.min(i,a.length-1));const sayfalar=a[i];
const H=Math.min(innerHeight-170,(innerWidth-140)/(ORAN*sayfalar.length));kitap.style.height=H+"px";
kitap.replaceChildren(...sayfalar.map(k=>{const r=new Image();r.src=S[k];r.alt="Sayfa "+(k+1);r.onclick=()=>{yakin.firstChild.src=S[k];yakin.style.display="block";yakin.scrollTop=0};return r}));
if(yon){kitap.style.transition="none";kitap.style.opacity=0;kitap.style.transform="translateX("+(yon*40)+"px)";requestAnimationFrame(()=>{kitap.style.transition="";kitap.style.opacity=1;kitap.style.transform="none"})}
sayac.textContent=sayfalar.map(k=>k+1).join("–")+" / "+S.length;document.getElementById("onceki").disabled=i===0;document.getElementById("sonraki").disabled=i===a.length-1;
[...kucukler.children].forEach((b,k)=>b.classList.toggle("aktif",sayfalar.includes(k)))}
function git(d){const e=i;i+=d;ciz(d);if(i===e)return}
S.forEach((s,k)=>{const b=document.createElement("button");const r=new Image();r.src=s;b.append(r);b.onclick=()=>{const a=adimlar();i=a.findIndex(x=>x.includes(k));ciz(1)};kucukler.append(b)});
document.getElementById("onceki").onclick=()=>git(-1);document.getElementById("sonraki").onclick=()=>git(1);
yakin.onclick=()=>{yakin.style.display="none"};
addEventListener("keydown",e=>{if(e.key==="ArrowRight")git(1);if(e.key==="ArrowLeft")git(-1);if(e.key==="Escape")yakin.style.display="none"});
let x0=null;document.querySelector("main").addEventListener("pointerdown",e=>{x0=e.clientX});document.querySelector("main").addEventListener("pointerup",e=>{if(x0!=null&&Math.abs(e.clientX-x0)>50)git(e.clientX<x0?1:-1);x0=null});
addEventListener("resize",()=>ciz());ciz();
<\/script></body></html>`;
        return new Blob([html], { type: "text/html;charset=utf-8" });
    }

    // ── Dışa aktarım penceresi ──────────────────────────────────
    const BICIMLER = [
        { id: "png", ad: "PNG", alt: "En yüksek kalite görsel; sosyal medya ve dijital ekranlar için", ikon: "gorsel", raster: true },
        { id: "jpg", ad: "JPG", alt: "Daha küçük dosya; WhatsApp ve e-posta için ideal", ikon: "gorsel", raster: true, kalite: true },
        { id: "pdf-baski", ad: "PDF (baskı)", alt: "Vektörel, en keskin sonuç. Yazdırma penceresinde \"PDF olarak kaydet\"i seçin", ikon: "yazdir" },
        { id: "pdf", ad: "PDF (doğrudan)", alt: "Tek tıkla indirilen, görsel tabanlı PDF", ikon: "pdf", raster: true, kalite: true },
        { id: "web", ad: "Web kataloğu", alt: "Sayfaları çevrilebilen tek HTML dosyası; web sitenize koyun ya da gönderin", ikon: "web", raster: true, kalite: true },
        { id: "proje", ad: "Proje dosyası", alt: "Sonra düzenlemek ya da başka bilgisayarda açmak için (.katalog)", ikon: "kaydet" }
    ];
    let sonAyar = { bicim: "png", kapsam: "hepsi", aralik: "", olcek: 2, kalite: 88 };
    function pencere() {
        if (E.duzenlenen) KS.editor.metinBitir();
        const b = E.belge;
        const ayar = Object.assign({}, sonAyar);
        const kartlar = h("div.secenek-kartlar");
        const ayarlar = h("div", { style: { display: "grid", gap: "4px", marginTop: "16px" } });
        const ilerleme = h("div.ilerleme", { hidden: true }, h("div"));
        const durum = h("p.ipucu-metin", { style: { minHeight: "18px" } });
        let indirDugme, paylasDugme;
        function ciz() {
            // Mobil uygulamanın WebView'inde yazdırma penceresi yok
            kartlar.replaceChildren(...BICIMLER.filter((x) => !(KS.mobilUygulama && x.id === "pdf-baski")).map((x) => {
                const k = h("button.secenek-kart", { type: "button", "aria-pressed": String(ayar.bicim === x.id) }, h("span.ikon-kutu", KS.ikon(x.ikon, 18)), h("b", x.ad), h("small", x.alt));
                k.addEventListener("click", () => { ayar.bicim = x.id; ciz(); });
                return k;
            }));
            const bicim = BICIMLER.find((x) => x.id === ayar.bicim);
            const parcalar = [];
            if (ayar.bicim !== "proje") {
                const aralik = h("input.girdi", { value: ayar.aralik, placeholder: "ör. 1-3, 5", style: { maxWidth: "140px" } });
                aralik.addEventListener("input", () => { ayar.aralik = aralik.value; ayar.kapsam = "aralik"; kapsamK.yenile("aralik"); });
                aralik.addEventListener("keydown", (e) => e.stopPropagation());
                const kapsamK = KS.ui.bolumlu({ secenekler: [{ deger: "hepsi", etiket: `Tümü (${b.sayfalar.length})` }, { deger: "etkin", etiket: "Etkin sayfa" }, { deger: "aralik", etiket: "Aralık" }], deger: ayar.kapsam, degisti: (v) => { ayar.kapsam = v; if (v === "aralik") aralik.focus(); } });
                parcalar.push(KS.ui.alan("Sayfalar", h("div.alan-sira", kapsamK.el, aralik)));
            }
            if (bicim.raster) {
                const W = b.genislik, H = b.yukseklik;
                const olcekler = [1, 1.5, 2, 3, 4].filter((k) => W * k <= 8000 && H * k <= 8000);
                parcalar.push(KS.ui.alan("Çözünürlük", KS.ui.bolumlu({ secenekler: olcekler.map((k) => ({ deger: k, etiket: k + "×", ipucu: `${Math.round(W * k)} × ${Math.round(H * k)} px` })), deger: ayar.olcek, degisti: (v) => { ayar.olcek = v; ciz(); } }).el));
                const dpi = Math.round(ayar.olcek * 96 * (W === 794 || W === 1123 || W === 559 ? 1 : 0));
                parcalar.push(h("p.ipucu-metin", { style: { margin: "2px 0 0 86px" } }, `${Math.round(W * ayar.olcek)} × ${Math.round(H * ayar.olcek)} piksel${dpi ? ` · baskıda yaklaşık ${dpi} DPI` : ""}${ayar.olcek >= 3 ? " · büyük dosya" : ""}`));
            }
            if (bicim.kalite) parcalar.push(KS.ui.alan("Kalite", KS.ui.kaydirici({ min: 40, max: 100, deger: ayar.kalite, son: "%", degisti: (v) => { ayar.kalite = v; } }).el));
            if (ayar.bicim === "pdf-baski") parcalar.push(h("div.bilgi-kutu", KS.ikon("bilgi", 17), h("div", "Açılan yazdırma penceresinde Hedef: ", h("b", "PDF olarak kaydet"), " seçin; Kenar boşlukları: ", h("b", "Yok"), ", ", h("b", "Arka plan grafikleri"), " açık olsun. Matbaaya göndermek için en iyi sonuç budur.")));
            if (ayar.bicim === "web") parcalar.push(h("div.bilgi-kutu", KS.ikon("bilgi", 17), h("div", "İnternet bağlantısı gerektirmeyen tek bir .html dosyası iner. Telefonda açıldığında sayfalar kaydırılarak çevrilir.")));
            ayarlar.replaceChildren(...parcalar);
            if (paylasDugme) paylasDugme.hidden = !(navigator.canShare && ["png", "jpg", "pdf"].includes(ayar.bicim));
        }
        ciz();
        const p = KS.ui.pencere({
            baslik: "Dışa aktar", aciklama: `${b.ad} · ${b.genislik} × ${b.yukseklik} px`, sinif: "genis",
            icerik: h("div", kartlar, ayarlar, ilerleme, durum),
            dugmeler: [
                { etiket: "Paylaş", ikon: "paylas", sol: true, ref: (el) => { paylasDugme = el; el.hidden = !!KS.mobilUygulama || !(navigator.canShare && ["png", "jpg", "pdf"].includes(ayar.bicim)); }, fn: () => calistir(true) },
                { etiket: "Vazgeç" },
                // Mobil uygulamada indirme yerine uygulamanın paylaşım sayfası açılır (kaydet de oradan)
                { etiket: KS.mobilUygulama ? "Kaydet / paylaş" : "İndir", birincil: true, ikon: KS.mobilUygulama ? "paylas" : "indir", ref: (el) => { indirDugme = el; }, fn: () => calistir(false) }
            ]
        });
        async function calistir(paylas) {
            sonAyar = Object.assign({}, ayar);
            const tum = E.belge.sayfalar;
            let sayfalar = ayar.kapsam === "etkin" ? [KS.editor.sayfa()] : ayar.kapsam === "aralik" ? aralikCoz(ayar.aralik, tum.length).map((i) => tum[i]) : tum;
            if (!sayfalar.length) { durum.textContent = "Geçerli bir sayfa aralığı girin (ör. 1-3, 5)."; return false; }
            const ad = KS.dosyaAdi(E.belge.ad);
            if (ayar.bicim === "pdf-baski") { p.kapat(); setTimeout(() => yazdir(sayfalar), 120); return; }
            if (ayar.bicim === "proje") {
                const blob = await KS.depo.dosyaOlustur(E.belge);
                KS.indir(blob, ad + ".katalog");
                return;
            }
            indirDugme.disabled = true;
            if (paylasDugme) paylasDugme.disabled = true;
            ilerleme.hidden = false;
            const ilerle = (o) => { ilerleme.firstChild.style.width = Math.round(o * 100) + "%"; };
            ilerle(0.03);
            try {
                let dosyalar = [];
                const kalite = ayar.kalite / 100;
                if (ayar.bicim === "png" || ayar.bicim === "jpg") {
                    const tur = ayar.bicim === "png" ? "image/png" : "image/jpeg";
                    for (let i = 0; i < sayfalar.length; i++) {
                        durum.textContent = `Sayfa ${i + 1} / ${sayfalar.length} hazırlanıyor…`;
                        const blob = await sayfaResmi(sayfalar[i], { olcek: ayar.olcek, tur, kalite });
                        const no = tum.indexOf(sayfalar[i]) + 1;
                        dosyalar.push(new File([blob], `${ad}${tum.length > 1 ? "-sayfa-" + no : ""}.${ayar.bicim}`, { type: tur }));
                        ilerle((i + 1) / sayfalar.length);
                    }
                } else if (ayar.bicim === "pdf") {
                    durum.textContent = "PDF hazırlanıyor…";
                    dosyalar = [new File([await pdfOlustur(sayfalar, { olcek: ayar.olcek, kalite, ilerle })], ad + ".pdf", { type: "application/pdf" })];
                } else if (ayar.bicim === "web") {
                    durum.textContent = "Web kataloğu hazırlanıyor…";
                    dosyalar = [new File([await webKatalogu(sayfalar, { olcek: Math.min(ayar.olcek, 2), kalite, ilerle })], ad + ".html", { type: "text/html" })];
                }
                if (KS.mobilUygulama) {
                    durum.textContent = "Paylaşılıyor…";
                    await KS.mobilPaylas(dosyalar.map((d) => [d, d.name]));
                } else if (paylas && navigator.canShare && navigator.canShare({ files: dosyalar })) {
                    durum.textContent = "Paylaşılıyor…";
                    try { await navigator.share({ files: dosyalar, title: E.belge.ad }); } catch (h) { if (h.name !== "AbortError") throw h; }
                } else if (dosyalar.length > 1) {
                    durum.textContent = "ZIP dosyası oluşturuluyor…";
                    await KS.betikYukle(KS.KUTUPHANE.zip);
                    const zip = new window.JSZip();
                    for (const d of dosyalar) zip.file(d.name, d);
                    KS.indir(await zip.generateAsync({ type: "blob" }), ad + ".zip");
                } else {
                    KS.indir(dosyalar[0], dosyalar[0].name);
                }
                p.kapat();
                KS.bildir("Dışa aktarma tamamlandı", { tur: "basari" });
            } catch (hata) {
                console.error(hata);
                durum.textContent = "Dışa aktarılamadı: " + (hata.message || hata);
                indirDugme.disabled = false;
                if (paylasDugme) paylasDugme.disabled = false;
                ilerleme.hidden = true;
            }
            return false;
        }
    }

    KS.disaaktar = { pencere, yazdir, sayfaResmi, pdfOlustur, webKatalogu, aralikCoz };
})();
