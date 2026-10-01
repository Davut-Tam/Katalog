// Çizim motoru: modeli (sayfa + öğeler) DOM'a çevirir. Aynı kod düzenleyicide, küçük önizlemelerde ve
// dışa aktarımda (SVG foreignObject → PNG/JPG/PDF) kullanılır; bu yüzden sayfa CSS'i burada dize olarak durur
// ve dışa aktarılan belgeye aynen gömülür. Değişmeyen öğeler yeniden çizilmez (öğe başına imza karşılaştırması).
(function () {
    "use strict";
    const KS = window.KS;
    const { h } = KS;

    const CSS = `
.ks-sayfa{position:relative;overflow:hidden;background:#fff;isolation:isolate;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;font-kerning:normal;line-height:normal;color:#000;text-align:left}
.ks-sayfa *,.ks-sayfa *::before,.ks-sayfa *::after{box-sizing:border-box}
.ks-arka,.ks-arka>div{position:absolute;inset:0;pointer-events:none}
.ks-sayfa .o{position:absolute;transform-origin:50% 50%}
.o-metin .m-k{white-space:pre-wrap;overflow-wrap:break-word;margin:0;padding:0}
.o-metin .m-v,.o-metin .m-g{position:absolute;left:0;top:0;right:0;pointer-events:none;color:transparent;user-select:none}
.o-metin .m-v span{-webkit-box-decoration-break:clone;box-decoration-break:clone}
.o-metin .m-y{position:relative;outline:none;min-height:1em}
.o-metin .m-egri{position:absolute;left:0;top:0;overflow:visible}
.o-sekil .s-d,.o-fiyat .f-z{position:absolute;inset:0}
.o-sekil>svg,.o-fiyat>svg{position:absolute;left:0;top:0;overflow:visible}
.o-gorsel .g-c{position:absolute;inset:0;overflow:hidden}
.o-gorsel img,.o-urun img{display:block;width:100%;height:100%;user-select:none;-webkit-user-drag:none;pointer-events:none}
.o-gorsel .g-e{display:flex;align-items:center;justify-content:center;width:100%;height:100%;line-height:1;font-family:"Noto Color Emoji",sans-serif;user-select:none}
.o-gorsel .g-s{position:absolute;inset:0;mix-blend-mode:soft-light;pointer-events:none}
.o-gorsel .g-cer{position:absolute;inset:0;pointer-events:none}
.ks-bos{width:100%;height:100%;background:repeating-conic-gradient(#e7e7ee 0 25%,#f5f5f8 0 50%) 0 0/18px 18px;display:flex;align-items:center;justify-content:center;color:#a3a3b5}
.p-yeni{display:inline-flex;align-items:flex-start;line-height:.8;white-space:nowrap;letter-spacing:-.01em}
.p-sag{display:inline-flex;flex-direction:column;align-items:flex-start;font-size:.42em;line-height:.9;margin-left:.06em;padding-top:.04em}
.p-para{font-size:.9em;margin-top:.14em}
.p-duz{align-self:flex-end;font-size:.48em;margin-left:.14em;margin-bottom:.05em}
.o-fiyat .f-ic{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;line-height:1;white-space:nowrap}
.o-fiyat .f-ust,.o-fiyat .f-alt{font-weight:700;letter-spacing:.02em}
.o-fiyat .f-eski{text-decoration:line-through;text-decoration-thickness:.09em;margin-bottom:.1em;opacity:.95}
.o-urun .u-kart{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--kart);border:var(--kal) solid var(--kenar);border-radius:var(--kose);overflow:hidden}
.o-urun.golgeli .u-kart{box-shadow:0 calc(var(--u)*1) calc(var(--u)*4) rgba(15,23,42,.13),0 0 0 .5px rgba(15,23,42,.04)}
.o-urun .u-gorsel{position:relative;flex:1 1 0;min-height:0;display:flex;align-items:center;justify-content:center}
.o-urun .u-gi{position:relative;width:var(--gw);height:var(--gw);display:flex;align-items:center;justify-content:center;container-type:size}
.o-urun .u-gi img{object-fit:contain}
.o-urun .u-emoji{font-size:var(--es,84cqmin);line-height:1;font-family:"Noto Color Emoji",sans-serif}
.o-urun .u-metinler{display:contents}
.o-urun .u-ad{font-family:var(--adf);font-weight:var(--adw);font-size:var(--adb);line-height:1.08;color:var(--ad);overflow-wrap:break-word}
.o-urun .u-ac{font-family:var(--adf);font-weight:500;font-size:var(--acb);line-height:1.2;color:var(--ac);margin-top:calc(var(--u)*.9)}
.o-urun .u-fs{position:relative}
.o-urun .u-fiyat{font-family:var(--fif);color:var(--fy);background:var(--fz);font-size:var(--fb);line-height:.8;white-space:nowrap}
.o-urun .u-eski{font-family:var(--fif);color:var(--ez);font-size:var(--eb);line-height:1;text-decoration:line-through;text-decoration-thickness:.09em;white-space:nowrap}
.o-urun .u-birim{font-family:var(--adf);font-weight:700;font-size:var(--acb);color:inherit;opacity:.9;margin-left:.3em;align-self:flex-end}
.o-urun .u-rozet{position:absolute;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--rz);color:var(--ry);font-family:Inter,sans-serif;font-weight:800;border-radius:50%;width:calc(var(--u)*21);height:calc(var(--u)*21);left:calc(var(--u)*3);top:calc(var(--u)*3);transform:rotate(-12deg);line-height:.95;font-size:calc(var(--u)*6.6);text-align:center;box-shadow:0 calc(var(--u)*.6) calc(var(--u)*1.8) rgba(0,0,0,.2)}
.o-urun .u-rozet small{font-size:.4em;letter-spacing:.03em;margin-top:.2em}
.o-urun .u-rozet.uzun{width:auto;height:auto;border-radius:calc(var(--u)*2);padding:calc(var(--u)*1.7) calc(var(--u)*2.8) calc(var(--u)*1.5);font-size:calc(var(--u)*5.2);transform:rotate(-6deg);white-space:nowrap}
.o-urun.orta .u-bilgi{text-align:center}
.d-klasik .u-kart{padding:calc(var(--u)*5) calc(var(--u)*5) calc(var(--u)*4.5)}
.d-klasik .u-bilgi{margin-top:calc(var(--u)*2.5)}
.d-klasik .u-fs{display:flex;align-items:flex-end;justify-content:space-between;gap:calc(var(--u)*2);margin-top:calc(var(--u)*2.4);margin-right:calc(var(--u)*-5)}
.d-klasik .u-fiyat{display:flex;padding:calc(var(--u)*1.8) calc(var(--u)*4) calc(var(--u)*1.5) calc(var(--u)*3.4);border-radius:calc(var(--u)*3.2) 0 0 calc(var(--u)*3.2);margin-left:auto}
.d-klasik .u-eski{padding-bottom:calc(var(--u)*1.2)}
.d-patlama .u-kart{padding:calc(var(--u)*5)}
.d-patlama .u-bilgi{order:-1;margin-bottom:calc(var(--u)*1.5);padding-right:calc(var(--u)*2)}
.d-patlama .u-gorsel{margin:0 calc(var(--u)*10) calc(var(--u)*6) 0}
.d-patlama .u-fs{position:absolute;right:calc(var(--u)*1);bottom:calc(var(--u)*1);width:calc(var(--u)*47);height:calc(var(--u)*47);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2}
.d-patlama .u-pz{position:absolute;inset:0;background:var(--fz);z-index:-1;filter:drop-shadow(0 calc(var(--u)*.8) calc(var(--u)*1.2) rgba(0,0,0,.22))}
.d-patlama .u-fiyat{background:none;transform:rotate(-8deg);display:flex;flex-direction:column;align-items:center}
.d-patlama .u-birim{align-self:center;margin:.25em 0 0}
.d-patlama .u-eski{transform:rotate(-8deg);margin-bottom:calc(var(--u)*1)}
.d-patlama .u-rozet{top:auto;bottom:calc(var(--u)*4)}
.d-serit .u-kart{padding:0}
.d-serit .u-gorsel{margin:calc(var(--u)*5) calc(var(--u)*5) calc(var(--u)*2.5)}
.d-serit .u-bilgi{padding:0 calc(var(--u)*5) calc(var(--u)*3)}
.d-serit .u-fs{display:flex;align-items:center;justify-content:space-between;gap:calc(var(--u)*2);background:var(--fz);padding:calc(var(--u)*2.6) calc(var(--u)*5) calc(var(--u)*2.2)}
.d-serit .u-fiyat{background:none;margin-left:auto;display:flex}
.d-serit .u-eski{color:var(--fy);opacity:.75}
.d-minimal .u-kart{padding:calc(var(--u)*3);align-items:center;text-align:center}
.d-minimal .u-gorsel{width:100%}
.d-minimal .u-bilgi{margin-top:calc(var(--u)*2);width:100%}
.d-minimal .u-fs{display:flex;align-items:flex-end;justify-content:center;gap:calc(var(--u)*2.5);margin-top:calc(var(--u)*2)}
.d-minimal .u-fiyat{background:none;color:var(--fz);display:flex}
.d-minimal .u-eski{padding-bottom:calc(var(--u)*.8)}
.d-yatay .u-kart{flex-direction:row;padding:calc(var(--u)*4);gap:calc(var(--u)*4);align-items:stretch}
.d-yatay .u-gorsel{flex:0 0 42%}
.d-yatay .u-metinler{display:flex;flex:1;flex-direction:column;justify-content:center;min-width:0}
.d-yatay .u-fs{display:flex;flex-direction:column;align-items:flex-start;gap:calc(var(--u)*1);margin-top:calc(var(--u)*3)}
.d-yatay .u-fiyat{display:flex;padding:calc(var(--u)*1.8) calc(var(--u)*3.6) calc(var(--u)*1.5);border-radius:calc(var(--u)*3)}
.d-raf .u-kart{padding:0}
.d-raf .u-gorsel{display:none}
.d-raf .u-bilgi{order:-1;background:var(--fz);padding:calc(var(--u)*3) calc(var(--u)*4) calc(var(--u)*2.6)}
.d-raf .u-ad{color:var(--fy)}
.d-raf .u-ac{color:var(--fy);opacity:.85}
.d-raf .u-fs{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u)*1.5);padding:calc(var(--u)*2)}
.d-raf .u-fiyat{background:none;color:var(--ad);display:flex}
.d-raf .u-rozet{left:auto;top:auto;right:calc(var(--u)*3);bottom:calc(var(--u)*3)}
.d-daire .u-kart{padding:calc(var(--u)*4);align-items:center;text-align:center}
.d-daire .u-gorsel{width:100%}
.d-daire .u-gi{border-radius:50%;background:var(--gz);height:var(--gw);width:auto;aspect-ratio:1;max-width:100%;--es:62cqmin}
.d-daire .u-gi img{width:74%;height:74%}
.d-daire .u-bilgi{margin-top:calc(var(--u)*2.5);width:100%}
.d-daire .u-fs{display:flex;align-items:center;justify-content:center;gap:calc(var(--u)*2);margin-top:calc(var(--u)*2)}
.d-daire .u-fiyat{display:flex;border-radius:999px;padding:calc(var(--u)*1.7) calc(var(--u)*4.5) calc(var(--u)*1.4)}
.o-qr svg{display:block;width:100%;height:100%}
`;
    KS.SAYFA_CSS = CSS;
    if (!document.getElementById("ks-sayfa-css")) {
        document.head.append(h("style#ks-sayfa-css", CSS));
    }

    // ── Şekil yolları ───────────────────────────────────────────
    const f = (n) => Math.round(n * 100) / 100;
    function cokgenYol(noktalar) { return "M" + noktalar.map((p) => f(p[0]) + " " + f(p[1])).join("L") + "Z"; }

    const SEKILLER = {
        dikdortgen: { ad: "Dikdörtgen" }, yuvarlak: { ad: "Yuvarlak köşe" }, elips: { ad: "Elips" }, ucgen: { ad: "Üçgen" },
        yildiz: { ad: "Yıldız" }, patlama: { ad: "Patlama" }, muhur: { ad: "Mühür" }, cokgen: { ad: "Çokgen" },
        kalp: { ad: "Kalp" }, ok: { ad: "Ok" }, serit: { ad: "Şerit" }, bayrak: { ad: "Bayrak" }, etiket: { ad: "Etiket" },
        balon: { ad: "Konuşma balonu" }, paralel: { ad: "Eğik" }, dalga: { ad: "Dalga" }, arti: { ad: "Artı" },
        halka: { ad: "Halka" }, damla: { ad: "Damla" }, cizgi: { ad: "Çizgi" }
    };
    KS.SEKILLER = SEKILLER;

    // x, y, w, h: çizilecek kutu. p: öğe (uc, ic, kose, oran).
    function sekilYolu(tur, x, y, w, h, p = {}) {
        w = Math.max(w, 0.01); h = Math.max(h, 0.01);
        const cx = x + w / 2, cy = y + h / 2;
        switch (tur) {
            case "yuvarlak":
            case "dikdortgen": {
                const r = Math.max(0, Math.min(p.kose || 0, w / 2, h / 2));
                if (!r) return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
                return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`;
            }
            case "elips":
                return `M${f(x)} ${f(cy)}A${f(w / 2)} ${f(h / 2)} 0 1 0 ${f(x + w)} ${f(cy)}A${f(w / 2)} ${f(h / 2)} 0 1 0 ${f(x)} ${f(cy)}Z`;
            case "ucgen":
                return cokgenYol([[cx, y], [x + w, y + h], [x, y + h]]);
            case "yildiz":
            case "patlama": {
                const n = Math.max(3, Math.round(p.uc || (tur === "patlama" ? 18 : 5)));
                const k = KS.sinirla(p.ic ?? (tur === "patlama" ? 0.84 : 0.45), 0.05, 1);
                const nk = [];
                for (let i = 0; i < n * 2; i++) {
                    const a = (-90 + i * 180 / n) * KS.RAD, r = i % 2 ? k : 1;
                    nk.push([cx + Math.cos(a) * r * w / 2, cy + Math.sin(a) * r * h / 2]);
                }
                return cokgenYol(nk);
            }
            case "muhur": {
                const n = Math.max(6, Math.round(p.uc || 14)), d = 0.1 * (1 - KS.sinirla(p.ic ?? 0.5, 0, 1)) + 0.03;
                const nk = [], adim = n * 8;
                for (let i = 0; i < adim; i++) {
                    const t = i / adim * Math.PI * 2, r = 1 - d * (1 - (0.5 + 0.5 * Math.cos(n * t)));
                    nk.push([cx + Math.cos(t - Math.PI / 2) * r * w / 2, cy + Math.sin(t - Math.PI / 2) * r * h / 2]);
                }
                return cokgenYol(nk);
            }
            case "cokgen": {
                const n = Math.max(3, Math.round(p.uc || 6)), nk = [];
                for (let i = 0; i < n; i++) {
                    const a = (-90 + i * 360 / n) * KS.RAD;
                    nk.push([cx + Math.cos(a) * w / 2, cy + Math.sin(a) * h / 2]);
                }
                return cokgenYol(nk);
            }
            case "kalp": {
                const X = (v) => f(x + v * w), Y = (v) => f(y + v * h);
                return `M${X(.5)} ${Y(1)}C${X(.18)} ${Y(.78)} ${X(0)} ${Y(.56)} ${X(0)} ${Y(.3)}C${X(0)} ${Y(.12)} ${X(.14)} ${Y(0)} ${X(.3)} ${Y(0)}C${X(.4)} ${Y(0)} ${X(.47)} ${Y(.06)} ${X(.5)} ${Y(.15)}C${X(.53)} ${Y(.06)} ${X(.6)} ${Y(0)} ${X(.7)} ${Y(0)}C${X(.86)} ${Y(0)} ${X(1)} ${Y(.12)} ${X(1)} ${Y(.3)}C${X(1)} ${Y(.56)} ${X(.82)} ${Y(.78)} ${X(.5)} ${Y(1)}Z`;
            }
            case "ok": {
                const t = KS.sinirla(p.oran ?? 0.4, 0.1, 1) * h / 2, hl = Math.min(w * 0.5, h * 0.9);
                return cokgenYol([[x, cy - t], [x + w - hl, cy - t], [x + w - hl, y], [x + w, cy], [x + w - hl, y + h], [x + w - hl, cy + t], [x, cy + t]]);
            }
            case "serit": {
                const n = Math.min(h * 0.4, w * 0.2) * (p.oran != null ? p.oran / 0.3 : 1);
                return cokgenYol([[x, y], [x + w, y], [x + w - n, cy], [x + w, y + h], [x, y + h], [x + n, cy]]);
            }
            case "bayrak": {
                const n = Math.min(h * 0.4, w * 0.25) * (p.oran != null ? p.oran / 0.3 : 1);
                return cokgenYol([[x, y], [x + w, y], [x + w - n, cy], [x + w, y + h], [x, y + h]]);
            }
            case "etiket": {
                const u = Math.min(h * 0.5, w * 0.3), r = Math.min(p.kose || h * 0.12, h / 2, (w - u) / 2);
                const hr = Math.min(h * 0.1, u * 0.3), hx = x + u * 0.72, deliksiz = p.oran === 0;
                let d = `M${f(x + u)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + u)}L${f(x)} ${f(cy)}Z`;
                if (!deliksiz) d += `M${f(hx - hr)} ${f(cy)}a${f(hr)} ${f(hr)} 0 1 0 ${f(hr * 2)} 0a${f(hr)} ${f(hr)} 0 1 0 ${f(-hr * 2)} 0Z`;
                return d;
            }
            case "balon": {
                const bh = h * 0.8, r = Math.max(0, Math.min(p.kose || h * 0.15, w / 2, bh / 2));
                return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + bh - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + bh)}H${f(x + w * 0.36)}L${f(x + w * 0.16)} ${f(y + h)}L${f(x + w * 0.2)} ${f(y + bh)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + bh - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`;
            }
            case "paralel": {
                const s = Math.min(w * 0.45, h * KS.sinirla(p.oran ?? 0.3, 0, 2));
                return cokgenYol([[x + s, y], [x + w, y], [x + w - s, y + h], [x, y + h]]);
            }
            case "dalga": {
                const a = h * KS.sinirla(p.oran ?? 0.3, 0.02, 1) * 0.5, n = Math.max(1, p.uc || 3), nk = [];
                for (let i = 0; i <= 96; i++) {
                    const xx = x + (w * i) / 96;
                    nk.push([xx, y + a * (0.5 - 0.5 * Math.cos(2 * Math.PI * n * (i / 96)))]);
                }
                nk.push([x + w, y + h], [x, y + h]);
                return cokgenYol(nk);
            }
            case "arti": {
                const t = Math.min(w, h) * KS.sinirla(p.oran ?? 0.3, 0.05, 0.95) / 2;
                return cokgenYol([[cx - t, y], [cx + t, y], [cx + t, cy - t], [x + w, cy - t], [x + w, cy + t], [cx + t, cy + t], [cx + t, y + h], [cx - t, y + h], [cx - t, cy + t], [x, cy + t], [x, cy - t], [cx - t, cy - t]]);
            }
            case "halka": {
                const k = KS.sinirla(p.ic ?? 0.6, 0.05, 0.95), iw = w * k / 2, ih = h * k / 2;
                return `M${f(x)} ${f(cy)}A${f(w / 2)} ${f(h / 2)} 0 1 0 ${f(x + w)} ${f(cy)}A${f(w / 2)} ${f(h / 2)} 0 1 0 ${f(x)} ${f(cy)}Z` +
                    `M${f(cx - iw)} ${f(cy)}A${f(iw)} ${f(ih)} 0 1 1 ${f(cx + iw)} ${f(cy)}A${f(iw)} ${f(ih)} 0 1 1 ${f(cx - iw)} ${f(cy)}Z`;
            }
            case "damla": {
                const X = (v) => f(x + v * w), Y = (v) => f(y + v * h);
                return `M${X(.5)} ${Y(0)}C${X(.62)} ${Y(.2)} ${X(1)} ${Y(.45)} ${X(1)} ${Y(.68)}A${f(w / 2)} ${f(h * .32)} 0 0 1 ${X(0)} ${Y(.68)}C${X(0)} ${Y(.45)} ${X(.38)} ${Y(.2)} ${X(.5)} ${Y(0)}Z`;
            }
            default:
                return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
        }
    }
    const CIFT_KURAL = new Set(["etiket", "halka"]);
    KS.sekilYolu = sekilYolu;

    // CSS polygon() dizesi (ürün kartındaki patlama zemini için yüzde tabanlı)
    function patlamaPoligon(n = 18, k = 0.84) {
        const nk = [];
        for (let i = 0; i < n * 2; i++) {
            const a = (-90 + i * 180 / n) * KS.RAD, r = i % 2 ? k : 1;
            nk.push(`${f(50 + Math.cos(a) * r * 50)}% ${f(50 + Math.sin(a) * r * 50)}%`);
        }
        return `polygon(${nk.join(",")})`;
    }
    const PATLAMA = patlamaPoligon();

    // ── Ortak ───────────────────────────────────────────────────
    function ortakStil(o, yukseklikVar) {
        let s = `left:${f(o.x)}px;top:${f(o.y)}px;width:${f(o.w)}px;`;
        if (yukseklikVar) s += `height:${f(o.h)}px;`;
        const tf = [];
        if (o.aci) tf.push(`rotate(${f(o.aci)}deg)`);
        if (o.cevirX || o.cevirY) tf.push(`scale(${o.cevirX ? -1 : 1},${o.cevirY ? -1 : 1})`);
        if (tf.length) s += `transform:${tf.join(" ")};`;
        if (o.opak != null && o.opak < 1) s += `opacity:${o.opak};`;
        if (o.karisim && o.karisim !== "normal") s += `mix-blend-mode:${o.karisim};`;
        if (o.golge) s += `filter:drop-shadow(${f(o.golge.x)}px ${f(o.golge.y)}px ${f(o.golge.b)}px ${o.golge.renk});`;
        if (o.gizli) s += "display:none;";
        return s;
    }
    // Emoji fontu genel aileden sonra: o font rakam (keycap) glifleri de içerir; yazı tipi yüklenirken
    // rakamların emoji fontundan çizilmesini önler, emoji karakterleri yine ondan gelir.
    const fontAile = (ad) => `"${ad}",sans-serif,"Noto Color Emoji"`;
    const buyukHarf = (metin, buyuk) => buyuk === "uppercase" ? metin.toLocaleUpperCase("tr-TR")
        : buyuk === "lowercase" ? metin.toLocaleLowerCase("tr-TR") : metin;

    function svgDolgu(defs, d, id) {
        // SVG'de düz renk ya da gradyan dolgusu; dönen değer fill özniteliği
        if (!d || typeof d === "string") return d || "none";
        if (d.tip === "isin") return d.renk1;
        const duraklar = (d.duraklar || []).slice().sort((a, b) => a.k - b.k);
        let g;
        if (d.tip === "dairesel") {
            g = h("svg:radialGradient", { id, cx: (d.x ?? 50) / 100, cy: (d.y ?? 50) / 100, r: 0.6 });
        } else {
            const a = ((d.aci ?? 180) - 90) * KS.RAD, dx = Math.cos(a) / 2, dy = Math.sin(a) / 2;
            g = h("svg:linearGradient", { id, x1: f(0.5 - dx), y1: f(0.5 - dy), x2: f(0.5 + dx), y2: f(0.5 + dy) });
        }
        for (const s of duraklar) g.append(h("svg:stop", { offset: s.k + "%", "stop-color": s.r }));
        defs.append(g);
        return `url(#${id})`;
    }

    // ── Metin ───────────────────────────────────────────────────
    function metinTemel(o) {
        const dek = [o.alti && "underline", o.ustu && "line-through"].filter(Boolean).join(" ") || "none";
        return `font-family:${fontAile(o.font)};font-size:${f(o.boyut)}px;font-weight:${o.kalin};font-style:${o.italik ? "italic" : "normal"};` +
            `line-height:${o.satir};letter-spacing:${(o.harf || 0) / 1000}em;text-align:${o.hiza};text-transform:${o.buyuk};text-decoration:${dek};`;
    }
    function metinGolgeleri(o) {
        const liste = [];
        if (o.derinlik && o.derinlik.k > 0) {
            const n = Math.min(48, Math.max(1, Math.ceil(o.derinlik.k))), a = (o.derinlik.aci ?? 45) * KS.RAD;
            const adim = o.derinlik.k / n;
            for (let i = 1; i <= n; i++) liste.push(`${f(Math.cos(a) * adim * i)}px ${f(Math.sin(a) * adim * i)}px 0 ${o.derinlik.renk}`);
        }
        for (const g of o.golgeler || []) liste.push(`${f(g.x)}px ${f(g.y)}px ${f(g.b)}px ${g.renk}`);
        return liste.join(",");
    }
    function metinDolguStil(d) {
        if (!d || typeof d === "string") return `color:${d || "transparent"};`;
        return `background:${KS.dolguCss(d)};-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;`;
    }

    function metinCiz(o, el) {
        el.className = "o o-metin";
        if (o.egri) return egriMetinCiz(o, el);
        el.style.cssText = ortakStil(o, false);
        const temel = metinTemel(o);
        const cocuklar = [];
        if (o.vurgu) {
            const v = o.vurgu;
            cocuklar.push(h("div.m-k.m-v", { style: temel, "aria-hidden": "true" },
                h("span", { style: `background:${v.renk};box-shadow:0 0 0 ${f(v.bosluk)}px ${v.renk};border-radius:${f(v.yaricap)}px;` }, o.metin)));
        }
        const golgeler = metinGolgeleri(o);
        if (o.kontur || golgeler) {
            let s = temel;
            if (o.kontur && o.kontur.k > 0) s += `-webkit-text-stroke:${f(o.kontur.k * 2)}px ${o.kontur.renk};`;
            if (golgeler) s += `text-shadow:${golgeler};`;
            cocuklar.push(h("div.m-k.m-g", { style: s, "aria-hidden": "true" }, o.metin));
        }
        cocuklar.push(h("div.m-k.m-y", { style: temel + metinDolguStil(o.dolgu) }, o.metin));
        el.replaceChildren(...cocuklar);
    }

    // Kavisli metin ölçüsü: yazı genişliğinden yay yarıçapı ve kutu hesaplanır.
    const olcuTuval = document.createElement("canvas").getContext("2d");
    function egriOlcu(o) {
        const metin = buyukHarf(o.metin.replace(/\n/g, " "), o.buyuk);
        olcuTuval.font = `${o.italik ? "italic " : ""}${o.kalin} ${o.boyut}px ${fontAile(o.font)}`;
        if ("letterSpacing" in olcuTuval) olcuTuval.letterSpacing = `${(o.harf || 0) / 1000 * o.boyut}px`;
        const L = Math.max(1, olcuTuval.measureText(metin).width);
        const teta = Math.max(0.05, Math.abs(o.egri) / 100 * Math.PI * 1.9);
        const R = L / teta;
        const ust = o.boyut * 0.78, alt = o.boyut * 0.24;
        const yukari = o.egri > 0;
        // Yay merkezi (0,0); yazının ortası yukarı kavisle tepede (-90°), aşağı kavisle dipte (90°)
        const merkezAci = yukari ? -Math.PI / 2 : Math.PI / 2;
        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        const yar = teta / 2 + (o.boyut * 0.3) / R;
        for (let i = 0; i <= 48; i++) {
            const a = merkezAci - yar + (2 * yar * i) / 48;
            for (const r of yukari ? [R - alt, R + ust] : [R + alt, R - ust]) {
                const px = Math.cos(a) * r, py = Math.sin(a) * r;
                x1 = Math.min(x1, px); y1 = Math.min(y1, py); x2 = Math.max(x2, px); y2 = Math.max(y2, py);
            }
        }
        return { metin, R, yukari, vb: [x1, y1, x2 - x1, y2 - y1], w: x2 - x1, h: y2 - y1 };
    }
    KS.egriOlcu = egriOlcu;
    // Düz metnin en uzun satırının genişliği (kutuyu yazıya oturtmak için)
    KS.metinGenisligi = (o) => {
        olcuTuval.font = `${o.italik ? "italic " : ""}${o.kalin} ${o.boyut}px ${fontAile(o.font)}`;
        if ("letterSpacing" in olcuTuval) olcuTuval.letterSpacing = `${(o.harf || 0) / 1000 * o.boyut}px`;
        const satirlar = buyukHarf(o.metin, o.buyuk).split("\n");
        const en = Math.max(...satirlar.map((s) => olcuTuval.measureText(s).width));
        return Math.ceil(en + (o.kontur ? o.kontur.k * 2 : 0) + (o.vurgu ? o.vurgu.bosluk * 2 : 0) + o.boyut * 0.08 + 2);
    };

    function egriMetinCiz(o, el) {
        el.style.cssText = ortakStil(o, true);
        const m = egriOlcu(o);
        const R = m.R, id = "e" + o.id;
        const yol = m.yukari
            ? `M0 ${f(R)}A${f(R)} ${f(R)} 0 1 1 0 ${f(-R)}A${f(R)} ${f(R)} 0 1 1 0 ${f(R)}`
            : `M0 ${f(-R)}A${f(R)} ${f(R)} 0 1 0 0 ${f(R)}A${f(R)} ${f(R)} 0 1 0 0 ${f(-R)}`;
        const defs = h("svg:defs", h("svg:path", { id, d: yol }));
        const dolgu = svgDolgu(defs, o.dolgu, id + "g");
        const yaziOz = {
            "font-family": fontAile(o.font).replace(/"/g, "'"), "font-size": o.boyut, "font-weight": o.kalin,
            "font-style": o.italik ? "italic" : "normal", "letter-spacing": `${(o.harf || 0) / 1000}em`, "text-anchor": "middle"
        };
        const yazi = (ek) => h("svg:text", Object.assign({}, yaziOz, ek), h("svg:textPath", { href: "#" + id, startOffset: "50%" }, m.metin));
        const katmanlar = [];
        const filtreler = (o.golgeler || []).map((g) => `drop-shadow(${f(g.x)}px ${f(g.y)}px ${f(g.b)}px ${g.renk})`);
        if (o.derinlik && o.derinlik.k > 0) {
            const a = (o.derinlik.aci ?? 45) * KS.RAD;
            filtreler.unshift(`drop-shadow(${f(Math.cos(a) * o.derinlik.k)}px ${f(Math.sin(a) * o.derinlik.k)}px 0 ${o.derinlik.renk})`);
        }
        if (o.kontur && o.kontur.k > 0) {
            katmanlar.push(yazi({ fill: o.kontur.renk, stroke: o.kontur.renk, "stroke-width": f(o.kontur.k * 2), "stroke-linejoin": "round" }));
        }
        katmanlar.push(yazi({ fill: dolgu }));
        const [vx, vy, vw, vh] = m.vb;
        const svg = h("svg:svg", {
            class: "m-egri", width: f(o.w), height: f(o.h), viewBox: `${f(vx)} ${f(vy)} ${f(vw)} ${f(vh)}`,
            preserveAspectRatio: "none", style: filtreler.length ? `filter:${filtreler.join(" ")}` : null
        }, defs, h("svg:g", { "text-decoration": [o.alti && "underline", o.ustu && "line-through"].filter(Boolean).join(" ") || null }, katmanlar));
        el.replaceChildren(svg);
    }

    // ── Şekil ───────────────────────────────────────────────────
    function sekilCiz(o, el) {
        el.className = "o o-sekil";
        el.style.cssText = ortakStil(o, true);
        if (o.sekil === "cizgi") return cizgiCiz(o, el);
        const k = o.cizgi && o.cizgi.k > 0 ? o.cizgi.k : 0;
        const kural = CIFT_KURAL.has(o.sekil) ? "evenodd," : "";
        const d = sekilYolu(o.sekil, 0, 0, o.w, o.h, o);
        const cocuklar = [h("div.s-d", { style: `clip-path:path(${kural}'${d}');background:${KS.dolguCss(o.dolgu)};` })];
        if (k) {
            const ic = sekilYolu(o.sekil, k / 2, k / 2, o.w - k, o.h - k, Object.assign({}, o, { kose: Math.max(0, (o.kose || 0) - k / 2) }));
            cocuklar.push(h("svg:svg", { width: f(o.w), height: f(o.h), viewBox: `0 0 ${f(o.w)} ${f(o.h)}` },
                h("svg:path", {
                    d: ic, fill: "none", stroke: o.cizgi.renk, "stroke-width": f(k), "stroke-linejoin": "round",
                    "stroke-dasharray": kesikDizi(o.cizgi, k), "stroke-linecap": o.cizgi.kesik === 2 ? "round" : "butt"
                })));
        }
        el.replaceChildren(...cocuklar);
    }
    function kesikDizi(c, k) {
        if (!c || !c.kesik) return null;
        return c.kesik === 2 ? `0 ${f(k * 2)}` : `${f(k * 3)} ${f(k * 2)}`;
    }
    function cizgiCiz(o, el) {
        const c = o.cizgi || { k: 4, renk: KS.dolguRenk(o.dolgu) };
        const k = Math.max(0.5, c.k), y = o.h / 2, uc = o.uclar || "yok";
        const bas = uc === "iki" ? k * 1.6 : 0, son = uc === "son" || uc === "iki" ? k * 1.6 : 0;
        const x1 = c.kesik === 2 ? k / 2 : 0, x2 = o.w - (c.kesik === 2 ? k / 2 : 0);
        const parcalar = [h("svg:line", {
            x1: f(x1 + bas), y1: f(y), x2: f(x2 - son), y2: f(y), stroke: c.renk, "stroke-width": f(k),
            "stroke-dasharray": kesikDizi(c, k), "stroke-linecap": c.kesik === 2 ? "round" : "butt"
        })];
        const okUcu = (x, yon) => {
            const L = k * 3.2, W = k * 2.2;
            return h("svg:path", { d: cokgenYol([[x, y], [x - yon * L, y - W], [x - yon * L, y + W]]), fill: c.renk });
        };
        if (son) parcalar.push(okUcu(o.w, 1));
        if (bas) parcalar.push(okUcu(0, -1));
        el.replaceChildren(h("svg:svg", { width: f(o.w), height: f(o.h), viewBox: `0 0 ${f(o.w)} ${f(o.h)}` }, parcalar));
    }

    // ── Görsel ──────────────────────────────────────────────────
    function filtreCss(fl) {
        if (!fl) return "";
        const p = [];
        if (fl.parlak !== 100) p.push(`brightness(${fl.parlak / 100})`);
        if (fl.kontrast !== 100) p.push(`contrast(${fl.kontrast / 100})`);
        if (fl.doygun !== 100) p.push(`saturate(${fl.doygun / 100})`);
        if (fl.gri) p.push(`grayscale(${fl.gri / 100})`);
        if (fl.sepya) p.push(`sepia(${fl.sepya / 100})`);
        if (fl.ton) p.push(`hue-rotate(${fl.ton}deg)`);
        if (fl.bulanik) p.push(`blur(${fl.bulanik}px)`);
        return p.join(" ");
    }
    KS.filtreCss = filtreCss;

    function gorselIcerik(kaynak, url, emojiOlcek = 0.84, kutu) {
        if (kaynak && kaynak.varlik) {
            const u = url(kaynak.varlik);
            if (u) return h("img", { src: u, alt: "", draggable: "false" });
            return h("div.ks-bos", KS.ikon ? KS.ikon("gorsel", 28) : "");
        }
        if (kaynak && kaynak.emoji) {
            const boyut = kutu ? `font-size:${f(Math.min(kutu.w, kutu.h) * emojiOlcek)}px` : "";
            return h("div.g-e", { style: boyut }, kaynak.emoji);
        }
        return h("div.ks-bos", KS.ikon ? KS.ikon("gorsel", 28) : "");
    }

    function gorselCiz(o, el, sec) {
        el.className = "o o-gorsel";
        el.style.cssText = ortakStil(o, true);
        const maske = o.maske && o.maske !== "yok" ? o.maske : null;
        let cStil = "";
        if (maske) {
            const d = sekilYolu(maske, 0, 0, o.w, o.h, { kose: o.kose, uc: maske === "yildiz" ? 5 : maske === "cokgen" ? 6 : undefined });
            cStil += `clip-path:path(${CIFT_KURAL.has(maske) ? "evenodd," : ""}'${d}');`;
        } else if (o.kose) cStil += `border-radius:${f(o.kose)}px;`;
        const ic = gorselIcerik(o.varlik ? { varlik: o.varlik } : { emoji: o.emoji }, sec.url, 0.84, o);
        if (ic.tagName === "IMG") {
            const odak = `${o.odakX ?? 50}% ${o.odakY ?? 50}%`;
            let s = `object-fit:${o.sigdir === "sigdir" ? "contain" : o.sigdir === "esnet" ? "fill" : "cover"};object-position:${odak};`;
            if (o.yakin && o.yakin !== 1) s += `transform:scale(${o.yakin});transform-origin:${odak};`;
            const fc = filtreCss(o.filtre);
            if (fc) s += `filter:${fc};`;
            ic.style.cssText = s;
        } else if (ic.classList.contains("g-e")) {
            const fc = filtreCss(o.filtre);
            if (fc) ic.style.filter = fc;
        }
        const cocuklar = [ic];
        const sicak = o.filtre && o.filtre.sicaklik;
        if (sicak) cocuklar.push(h("div.g-s", { style: `background:${sicak > 0 ? `rgba(255,140,0,${f(sicak / 100 * 0.7)})` : `rgba(0,120,255,${f(-sicak / 100 * 0.7)})`}` }));
        const c = h("div.g-c", { style: cStil }, cocuklar);
        const liste = [c];
        if (o.cerceve && o.cerceve.k > 0) {
            const k = o.cerceve.k;
            if (maske) {
                const d = sekilYolu(maske, k / 2, k / 2, o.w - k, o.h - k, { kose: Math.max(0, o.kose - k / 2) });
                liste.push(h("svg:svg", { class: "g-cer", width: f(o.w), height: f(o.h), viewBox: `0 0 ${f(o.w)} ${f(o.h)}`, style: "position:absolute;left:0;top:0;overflow:visible" },
                    h("svg:path", { d, fill: "none", stroke: o.cerceve.renk, "stroke-width": f(k) })));
            } else {
                liste.push(h("div.g-cer", { style: `border:${f(k)}px solid ${o.cerceve.renk};border-radius:${f(o.kose || 0)}px` }));
            }
        }
        el.replaceChildren(...liste);
    }

    // ── Fiyat parçası (kart ve etiket ortak) ─────────────────────
    function fiyatDom(fiyat, { kurus = "ust", para = "₺" } = {}) {
        const p = KS.fiyatParca(fiyat);
        if (kurus === "duz") {
            return h("span.p-yeni", h("span.p-tam", p.tam + "," + p.kurus), para ? h("span.p-duz", para) : null);
        }
        if (kurus === "gizle" && p.kurus === "00") {
            return h("span.p-yeni", h("span.p-tam", p.tam), para ? h("span.p-duz", para) : null);
        }
        return h("span.p-yeni", h("span.p-tam", p.tam), h("span.p-sag", h("span.p-kurus", "," + p.kurus), para ? h("span.p-para", para) : null));
    }
    KS.fiyatDom = fiyatDom;
    function basamakCarpani(fiyat, kurus) {
        const n = KS.fiyatParca(fiyat).tam.length + (kurus === "duz" ? 2.4 : 0);
        return n <= 1 ? 1.12 : n <= 2 ? 1 : n <= 3 ? 0.84 : n <= 4 ? 0.7 : n <= 5 ? 0.6 : n <= 6 ? 0.52 : 0.45;
    }

    // ── Fiyat etiketi ───────────────────────────────────────────
    const FIYAT_SEKIL = {
        patlama: { sekil: "patlama", fx: 0.62, fy: 0.6 },
        muhur: { sekil: "muhur", fx: 0.66, fy: 0.64 },
        daire: { sekil: "elips", fx: 0.7, fy: 0.66 },
        kutu: { sekil: "dikdortgen", fx: 0.86, fy: 0.8 },
        yuvarlak: { sekil: "yuvarlak", fx: 0.86, fy: 0.8, kose: 0.18 },
        hap: { sekil: "yuvarlak", fx: 0.82, fy: 0.78, kose: 1 },
        etiket: { sekil: "etiket", fx: 0.7, fy: 0.8, sol: 0.24 },
        bayrak: { sekil: "bayrak", fx: 0.76, fy: 0.8 },
        paralel: { sekil: "paralel", fx: 0.72, fy: 0.8 },
        yok: { sekil: null, fx: 0.98, fy: 0.96 }
    };
    KS.FIYAT_SEKIL = FIYAT_SEKIL;

    function fiyatCiz(o, el) {
        el.className = "o o-fiyat";
        el.style.cssText = ortakStil(o, true);
        const sk = FIYAT_SEKIL[o.sekil] || FIYAT_SEKIL.patlama;
        const cocuklar = [];
        if (sk.sekil) {
            const p = { uc: o.uc, ic: o.ic, kose: sk.kose ? Math.min(o.w, o.h) * sk.kose : 0, oran: sk.sekil === "etiket" ? 1 : 0.3 };
            const d = sekilYolu(sk.sekil, 0, 0, o.w, o.h, p);
            cocuklar.push(h("div.f-z", { style: `clip-path:path(${CIFT_KURAL.has(sk.sekil) ? "evenodd," : ""}'${d}');background:${KS.dolguCss(o.zemin)};` }));
            const k = o.cizgi && o.cizgi.k > 0 ? o.cizgi.k : 0;
            if (k) {
                const ic = sekilYolu(sk.sekil, k / 2, k / 2, o.w - k, o.h - k, Object.assign({}, p, { kose: Math.max(0, p.kose - k / 2) }));
                cocuklar.push(h("svg:svg", { width: f(o.w), height: f(o.h), viewBox: `0 0 ${f(o.w)} ${f(o.h)}` },
                    h("svg:path", { d: ic, fill: "none", stroke: o.cizgi.renk, "stroke-width": f(k), "stroke-linejoin": "round", "stroke-dasharray": kesikDizi(o.cizgi, k) })));
            }
        }
        // Yazı boyutu: kullanılabilir genişlik ve yüksekliğe göre
        const aw = o.w * sk.fx, ah = o.h * sk.fy;
        const p = KS.fiyatParca(o.fiyat);
        const hane = p.tam.replace(/\./g, "").length, nokta = (p.tam.match(/\./g) || []).length;
        const genislikKatsayi = hane * 0.56 + nokta * 0.22 + (o.kurus === "duz" ? 1.6 + (o.para ? 0.55 : 0) : (o.kurus === "gizle" && p.kurus === "00") ? (o.para ? 0.55 : 0) : 0.5);
        const ekSatir = (o.ust ? 0.3 : 0) + (o.eski > 0 ? 0.36 : 0) + (o.alt ? 0.3 : 0);
        let fb = Math.min(aw / genislikKatsayi, ah / (0.86 + ekSatir));
        fb *= (o.olcek || 100) / 100;
        const solBosluk = sk.sol ? o.w * sk.sol : 0;
        const icStil = `left:${f((o.w - aw) / 2 + solBosluk / 2)}px;top:${f((o.h - ah) / 2)}px;width:${f(aw - solBosluk / 2)}px;height:${f(ah)}px;` +
            `font-family:${fontAile(o.font)};color:${o.renk};`;
        const ic = h("div.f-ic", { style: icStil });
        if (o.ust) ic.append(h("div.f-ust", { style: `font-size:${f(fb * 0.26)}px;margin-bottom:${f(fb * 0.06)}px` }, o.ust));
        if (o.eski > 0) ic.append(h("div.f-eski", { style: `font-size:${f(fb * 0.3)}px;color:${o.eskiRenk}` }, KS.fiyatMetin(o.eski, o.para)));
        const yeni = fiyatDom(o.fiyat, o);
        yeni.style.fontSize = f(fb) + "px";
        ic.append(yeni);
        if (o.alt) ic.append(h("div.f-alt", { style: `font-size:${f(fb * 0.24)}px;margin-top:${f(fb * 0.08)}px` }, o.alt));
        cocuklar.push(ic);
        el.replaceChildren(...cocuklar);
    }

    // ── Ürün kartı ──────────────────────────────────────────────
    const DUZENLER = {
        klasik: { ad: "Klasik", birim: (w, hh) => Math.min(w, hh * 0.84), ad_: 7.4, fiyat: 16.5 },
        patlama: { ad: "Patlama", birim: (w, hh) => Math.min(w, hh * 0.9), ad_: 7.4, fiyat: 16.5 },
        serit: { ad: "Şerit", birim: (w, hh) => Math.min(w, hh * 0.84), ad_: 7.4, fiyat: 15 },
        minimal: { ad: "Sade", birim: (w, hh) => Math.min(w, hh * 0.84), ad_: 7.4, fiyat: 19 },
        yatay: { ad: "Yatay", birim: (w, hh) => Math.min(w * 0.55, hh), ad_: 11, fiyat: 25 },
        daire: { ad: "Daire", birim: (w, hh) => Math.min(w, hh * 0.8), ad_: 7, fiyat: 14 },
        raf: { ad: "Raf etiketi", birim: (w, hh) => Math.min(w, hh * 1.7), ad_: 8, fiyat: 30 }
    };
    KS.URUN_DUZENLERI = DUZENLER;

    function urunCiz(o, el, sec) {
        const v = o.veri, s = o.stil;
        const dz = DUZENLER[s.duzen] || DUZENLER.klasik;
        el.className = `o o-urun d-${s.duzen in DUZENLER ? s.duzen : "klasik"}${s.kartGolge ? " golgeli" : ""}${s.hiza === "orta" ? " orta" : ""}`;
        const u = dz.birim(o.w, o.h) / 100;
        const adb = u * dz.ad_ * (s.adOlcek || 100) / 100;
        const fb = u * dz.fiyat * basamakCarpani(v.fiyat, s.kurus) * (s.fiyatOlcek || 100) / 100;
        const degiskenler = {
            "--u": f(u) + "px", "--kart": KS.dolguCss(s.kart), "--kenar": s.kenar || "transparent", "--kal": f((s.kalinlik || 0) * u) + "px",
            "--kose": f((s.kose || 0) * u) + "px", "--ad": s.adRenk, "--ac": s.aciklamaRenk, "--fz": KS.dolguCss(s.fiyatZemin), "--fy": s.fiyatRenk,
            "--ez": s.eskiRenk, "--rz": s.rozetZemin, "--ry": s.rozetRenk, "--adf": fontAile(s.adFont), "--adw": s.adKalin,
            "--adb": f(adb) + "px", "--acb": f(Math.max(adb * 0.66, u * 4.2)) + "px", "--fif": fontAile(s.fiyatFont), "--fb": f(fb) + "px",
            "--eb": f(Math.max(fb * 0.34, u * 4.6)) + "px", "--gw": (s.gorselOlcek || 100) + "%", "--gz": s.gorselZemin || "rgba(0,0,0,.05)"
        };
        let stil = ortakStil(o, true);
        for (const k in degiskenler) stil += `${k}:${degiskenler[k]};`;
        el.style.cssText = stil;

        const gorsel = h("div.u-gorsel", h("div.u-gi", urunGorsel(v.gorsel, sec.url)));
        const bilgi = h("div.u-bilgi", h("div.u-ad", v.ad), s.aciklamaGoster && v.aciklama ? h("div.u-ac", v.aciklama) : null);
        const fiyatKutu = h("div.u-fiyat", fiyatDom(v.fiyat, s));
        if (v.birim) fiyatKutu.append(h("span.u-birim", v.birim));
        const fs = h("div.u-fs");
        if (s.duzen === "patlama") fs.append(h("div.u-pz", { style: `clip-path:${PATLAMA}` }));
        const eskiVar = s.eskiGoster && v.eski > v.fiyat;
        if (eskiVar) fs.append(h("div.u-eski", KS.fiyatMetin(v.eski, s.para)));
        fs.append(fiyatKutu);
        const kart = h("div.u-kart", gorsel, h("div.u-metinler", bilgi, fs));
        const yuzde = KS.indirimYuzde(v.fiyat, v.eski);
        if (s.rozetGoster && (v.rozet || yuzde > 0)) {
            const metin = v.rozet || `%${yuzde}`;
            const uzun = v.rozet && v.rozet.length > 4;
            kart.append(h("div.u-rozet" + (uzun ? ".uzun" : ""), uzun ? metin : [h("span", metin), v.rozet ? null : h("small", "İNDİRİM")]));
        }
        el.replaceChildren(kart);
    }
    function urunGorsel(g, url) {
        if (g && g.varlik) {
            const u = url(g.varlik);
            return u ? h("img", { src: u, alt: "", draggable: "false" }) : h("div.ks-bos", KS.ikon ? KS.ikon("gorsel", 24) : "");
        }
        return h("span.u-emoji", (g && g.emoji) || "🛒");
    }

    // ── QR ──────────────────────────────────────────────────────
    let qrYukleniyor = false;
    function qrCiz(o, el) {
        el.className = "o o-qr";
        el.style.cssText = ortakStil(o, true);
        if (!window.qrcode) {
            el.replaceChildren(h("div.ks-bos", KS.ikon ? KS.ikon("qr", 32) : "QR"));
            if (!qrYukleniyor) {
                qrYukleniyor = true;
                KS.betikYukle(KS.KUTUPHANE.qr).then(() => KS.olay.yay("yeniden-ciz")).catch(() => { qrYukleniyor = false; });
            }
            return;
        }
        let q;
        try {
            window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs["UTF-8"];
            q = window.qrcode(0, "M");
            q.addData(o.veri || " ");
            q.make();
        } catch (hata) {
            el.replaceChildren(h("div.ks-bos", "Metin çok uzun"));
            return;
        }
        const n = q.getModuleCount();
        let d = "";
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
        el.replaceChildren(h("svg:svg", { viewBox: `-2 -2 ${n + 4} ${n + 4}`, preserveAspectRatio: "none", "shape-rendering": "crispEdges" },
            h("svg:rect", { x: -2, y: -2, width: n + 4, height: n + 4, fill: o.zemin || "transparent" }),
            h("svg:path", { d, fill: o.renk })));
    }

    // ── Arka plan ───────────────────────────────────────────────
    const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    const DESENLER = {
        nokta: { ad: "Nokta", css: (r, s) => ({ backgroundImage: `radial-gradient(${r} 22%, transparent 24%)`, backgroundSize: `${22 * s}px ${22 * s}px` }) },
        nokta2: { ad: "Puantiye", css: (r, s) => ({ backgroundImage: `radial-gradient(${r} 18%, transparent 20%),radial-gradient(${r} 18%, transparent 20%)`, backgroundSize: `${34 * s}px ${34 * s}px`, backgroundPosition: `0 0,${17 * s}px ${17 * s}px` }) },
        cizgi: { ad: "Çapraz çizgi", css: (r, s) => ({ backgroundImage: `repeating-linear-gradient(45deg, ${r} 0 ${6 * s}px, transparent ${6 * s}px ${18 * s}px)` }) },
        yatay: { ad: "Yatay çizgi", css: (r, s) => ({ backgroundImage: `repeating-linear-gradient(0deg, ${r} 0 ${3 * s}px, transparent ${3 * s}px ${16 * s}px)` }) },
        kareli: { ad: "Kareli", css: (r, s) => ({ backgroundImage: `linear-gradient(${r} ${1.5 * s}px, transparent ${1.5 * s}px),linear-gradient(90deg, ${r} ${1.5 * s}px, transparent ${1.5 * s}px)`, backgroundSize: `${26 * s}px ${26 * s}px` }) },
        dama: { ad: "Dama", css: (r, s) => ({ backgroundImage: `conic-gradient(${r} 25%, transparent 0 50%, ${r} 0 75%, transparent 0)`, backgroundSize: `${40 * s}px ${40 * s}px` }) },
        zikzak: { ad: "Zikzak", css: (r, s) => ({ backgroundImage: `linear-gradient(135deg, ${r} 25%, transparent 25%),linear-gradient(225deg, ${r} 25%, transparent 25%),linear-gradient(315deg, ${r} 25%, transparent 25%),linear-gradient(45deg, ${r} 25%, transparent 25%)`, backgroundSize: `${40 * s}px ${40 * s}px`, backgroundPosition: `-${20 * s}px 0,-${20 * s}px 0,0 0,0 0` }) },
        isin: { ad: "Güneş ışını", css: (r, s) => { const a = 180 / Math.max(6, Math.round(24 / s)); return { backgroundImage: `repeating-conic-gradient(from 0deg at 50% 42%, ${r} 0deg ${f(a)}deg, transparent ${f(a)}deg ${f(a * 2)}deg)` }; } },
        halka: { ad: "Halka", css: (r, s) => ({ backgroundImage: `repeating-radial-gradient(circle at 50% 42%, ${r} 0 ${4 * s}px, transparent ${4 * s}px ${26 * s}px)` }) },
        dalga: { ad: "Dalga", css: (r, s) => ({ backgroundImage: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='48' height='24'><path d='M0 12 Q12 0 24 12 T48 12' fill='none' stroke='${r}' stroke-width='2.5'/></svg>`), backgroundSize: `${48 * s}px ${24 * s}px` }) },
        konfeti: { ad: "Konfeti", css: (r, s) => ({ backgroundImage: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' fill='${r}'><rect x='10' y='14' width='10' height='4' rx='2' transform='rotate(35 15 16)'/><circle cx='62' cy='22' r='3.5'/><rect x='92' y='40' width='12' height='4' rx='2' transform='rotate(-25 98 42)'/><path d='M30 70l4 8 8 1-6 6 2 8-8-4-7 4 2-8-6-6 8-1z'/><circle cx='100' cy='96' r='3'/><rect x='58' y='92' width='11' height='4' rx='2' transform='rotate(60 63 94)'/><circle cx='18' cy='108' r='2.5'/><rect x='76' y='64' width='4' height='4'/></svg>`), backgroundSize: `${120 * s}px ${120 * s}px` }) },
        yildizlar: { ad: "Yıldızlar", css: (r, s) => ({ backgroundImage: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='${r}'><path d='M20 8l2.9 6.9 7.1.6-5.4 4.7 1.7 7.1L20 23.4l-6.3 3.9 1.7-7.1L10 15.5l7.1-.6z'/><path d='M60 48l1.9 4.4 4.6.4-3.5 3 1.1 4.6L60 58l-4.1 2.4 1.1-4.6-3.5-3 4.6-.4z'/></svg>`), backgroundSize: `${80 * s}px ${80 * s}px` }) },
        vinyet: { ad: "Kenar gölgesi", css: (r) => ({ backgroundImage: `radial-gradient(ellipse at center, transparent 45%, ${r} 100%)` }) }
    };
    KS.DESENLER = DESENLER;

    function arkaCiz(arka, kok, sec) {
        let el = kok.firstElementChild;
        if (!el || !el.classList.contains("ks-arka")) { el = h("div.ks-arka"); kok.prepend(el); }
        const resimUrl = arka.resim && arka.resim.varlik ? sec.url(arka.resim.varlik) : null;
        const imza = JSON.stringify(arka) + "|" + (resimUrl || "");
        if (el._imza === imza) return;
        el._imza = imza;
        el.style.background = KS.dolguCss(arka.dolgu || "#ffffff");
        const cocuklar = [];
        if (arka.resim && resimUrl) {
            const r = arka.resim;
            const st = { backgroundImage: `url("${resimUrl}")`, opacity: r.opak ?? 1 };
            if (r.kaplama === "dose") { st.backgroundSize = `${r.olcek || 30}%`; st.backgroundRepeat = "repeat"; }
            else { st.backgroundSize = r.kaplama === "sigdir" ? "contain" : "cover"; st.backgroundPosition = `${r.x ?? 50}% ${r.y ?? 50}%`; st.backgroundRepeat = "no-repeat"; }
            const fc = filtreCss(Object.assign({}, KS.FILTRE_VARSAYILAN, { bulanik: r.bulanik || 0, parlak: r.parlak ?? 100, doygun: r.doygun ?? 100 }));
            if (fc) { st.filter = fc; if (r.bulanik) st.inset = `-${r.bulanik * 2}px`; }
            cocuklar.push(h("div", { style: st }));
        }
        if (arka.desen && DESENLER[arka.desen.tur]) {
            const d = arka.desen;
            const st = DESENLER[d.tur].css(d.renk || "#000000", d.olcek || 1);
            st.opacity = d.opak ?? 0.15;
            cocuklar.push(h("div", { style: st }));
        }
        el.replaceChildren(...cocuklar);
    }

    // ── Öğe ve sayfa ────────────────────────────────────────────
    const CIZICILER = { metin: metinCiz, sekil: sekilCiz, gorsel: gorselCiz, urun: urunCiz, fiyat: fiyatCiz, qr: qrCiz };
    const varsayilanUrl = (id) => (KS.varlik ? KS.varlik.url(id) : null);

    function ogeImza(o, url) {
        let ek = "";
        if (o.tur === "gorsel" && o.varlik) ek = url(o.varlik) || "";
        else if (o.tur === "urun" && o.veri.gorsel && o.veri.gorsel.varlik) ek = url(o.veri.gorsel.varlik) || "";
        else if (o.tur === "qr") ek = window.qrcode ? "1" : "0";
        return JSON.stringify(o) + "|" + ek;
    }

    function ogeCiz(o, el, sec = {}) {
        sec.url = sec.url || varsayilanUrl;
        el = el || h("div");
        el.dataset.id = o.id;
        const ciz = CIZICILER[o.tur];
        if (ciz) ciz(o, el, sec);
        else { el.className = "o"; el.style.cssText = ortakStil(o, true); }
        return el;
    }

    // Sayfayı kök elemana çizer / günceller. Değişen öğelerin elemanlarını döndürür.
    function sayfaCiz(sayfa, kok, sec = {}) {
        sec.url = sec.url || varsayilanUrl;
        if (!kok.classList.contains("ks-sayfa")) kok.classList.add("ks-sayfa");
        kok.lang = "tr";
        if (sec.belge) { kok.style.width = sec.belge.genislik + "px"; kok.style.height = sec.belge.yukseklik + "px"; }
        arkaCiz(sayfa.arka || {}, kok, sec);
        const mevcut = new Map();
        for (const c of kok.children) if (c.dataset && c.dataset.id) mevcut.set(c.dataset.id, c);
        const degisen = [];
        let onceki = kok.firstElementChild; // .ks-arka
        for (const o of sayfa.ogeler) {
            let el = mevcut.get(o.id);
            const imza = ogeImza(o, sec.url);
            if (!el) el = h("div");
            if (el._imza !== imza && !(sec.atla && sec.atla(o))) {
                ogeCiz(o, el, sec);
                el._imza = imza;
                degisen.push(el);
            }
            if (onceki.nextSibling !== el) kok.insertBefore(el, onceki.nextSibling);
            onceki = el;
            mevcut.delete(o.id);
        }
        for (const el of mevcut.values()) el.remove();
        return degisen;
    }

    // Bağımsız (düzenleyiciden ayrı) sayfa elemanı: önizleme, şablon kartı, dışa aktarım
    function sayfaDom(sayfa, belge, sec = {}) {
        const kok = h("div.ks-sayfa");
        sayfaCiz(sayfa, kok, Object.assign({ belge }, sec));
        return kok;
    }

    // Belirli genişliğe sığan küçük önizleme (ölçekli sarmal)
    function kucukResim(sayfa, belge, genislik, sec) {
        const olcek = genislik / belge.genislik;
        const kok = sayfaDom(sayfa, belge, sec);
        kok.style.transform = `scale(${olcek})`;
        kok.style.transformOrigin = "0 0";
        kok.style.pointerEvents = "none";
        return h("div.ks-kucuk", { style: { width: genislik + "px", height: Math.round(belge.yukseklik * olcek) + "px", overflow: "hidden", position: "relative" } }, kok);
    }

    KS.cizim = { ogeCiz, sayfaCiz, sayfaDom, kucukResim, fiyatDom, egriOlcu, patlamaPoligon, CIZICILER };
})();
