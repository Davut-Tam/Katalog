// Arayüz simgeleri: 24×24 çizgi simgeler (currentColor). KS.ikon("sil", 18) bir <svg> döndürür.
(function () {
    "use strict";
    const KS = window.KS;

    const I = {
        sablon: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M9 21V9"/>',
        urun: '<circle cx="9" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/><path d="M2.5 3.5h2.3l2.6 11.6a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.5-1.2l1.9-7.2H5.9"/>',
        metin: '<path d="M5 7V4.5h14V7M12 4.5v15M9 19.5h6"/>',
        ogeler: '<circle cx="7.5" cy="7.5" r="4"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M17 3l4 7h-8z"/><path d="M5 14l2.5 7M3.5 18.5h6"/>',
        yukle: '<path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/>',
        gorsel: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
        arkaplan: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4.2-4-7.6-9-7.6z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7" r="1.1"/><circle cx="15" cy="7.5" r="1.1"/>',
        katmanlar: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 5 9-5" opacity=".5"/>',
        marka: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4.5 10v10h15V10"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M10 20v-5h4v5"/>',
        geri: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
        ileri: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
        indir: '<path d="M12 4v11.5M7.5 11 12 15.5l4.5-4.5"/><path d="M4 20h16"/>',
        oynat: '<path d="M7 4.5v15l12.5-7.5z"/>',
        durdur: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
        video: '<rect x="2.5" y="5.5" width="13.5" height="13" rx="2.5"/><path d="m16 10.2 5.5-3.2v10l-5.5-3.2"/>',
        muzik: '<path d="M9 18V5.5l11-2.5v12.5"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="15.5" r="3"/>',
        goz: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
        gozKapali: '<path d="m3 3 18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
        kilit: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
        kilitAcik: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 7.7-1.5"/>',
        sil: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="m6 7 1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
        kopyala: '<rect x="8" y="8" width="13" height="13" rx="2.5"/><path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3h-8A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8"/>',
        arti: '<path d="M12 5v14M5 12h14"/>',
        eksi: '<path d="M5 12h14"/>',
        kapat: '<path d="M6 6l12 12M18 6 6 18"/>',
        yukari: '<path d="m6 15 6-6 6 6"/>',
        asagi: '<path d="m6 9 6 6 6-6"/>',
        sol: '<path d="m15 6-6 6 6 6"/>',
        sag: '<path d="m9 6 6 6-6 6"/>',
        oneGetir: '<path d="m4 15 8 5 8-5"/><path d="M12 3v11M8 7l4-4 4 4"/>',
        arkayaGonder: '<path d="m4 9 8-5 8 5"/><path d="M12 21V10M8 17l4 4 4-4"/>',
        enOne: '<rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none"/><path d="M3 11V5a2 2 0 0 1 2-2h6M13 21h6a2 2 0 0 0 2-2v-6"/>',
        enArka: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M3 11V5a2 2 0 0 1 2-2h6M13 21h6a2 2 0 0 0 2-2v-6" opacity=".45"/>',
        hizaSol: '<path d="M4 3v18"/><rect x="8" y="6" width="12" height="4" rx="1"/><rect x="8" y="14" width="7" height="4" rx="1"/>',
        hizaOrtaY: '<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>',
        hizaSag: '<path d="M20 3v18"/><rect x="4" y="6" width="12" height="4" rx="1"/><rect x="9" y="14" width="7" height="4" rx="1"/>',
        hizaUst: '<path d="M3 4h18"/><rect x="6" y="8" width="4" height="12" rx="1"/><rect x="14" y="8" width="4" height="7" rx="1"/>',
        hizaOrtaD: '<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>',
        hizaAlt: '<path d="M3 20h18"/><rect x="6" y="4" width="4" height="12" rx="1"/><rect x="14" y="9" width="4" height="7" rx="1"/>',
        dagitYatay: '<path d="M4 3v18M20 3v18"/><rect x="9" y="7" width="6" height="10" rx="1"/>',
        dagitDikey: '<path d="M3 4h18M3 20h18"/><rect x="7" y="9" width="10" height="6" rx="1"/>',
        yaziSol: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
        yaziOrta: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
        yaziSag: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
        yaziYasla: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
        kalin: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
        italik: '<path d="M10 5h8M6 19h8M14 5l-4 14"/>',
        alticizili: '<path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14"/>',
        ustucizili: '<path d="M5 12h14"/><path d="M16 6.5A4.5 3.2 0 0 0 12 5c-2.4 0-4 1.3-4 3 0 1.3.9 2.2 2.6 2.8M8 17.5a4.5 3.2 0 0 0 4 1.5c2.4 0 4-1.3 4-3 0-.7-.2-1.2-.6-1.7"/>',
        buyukHarf: '<path d="M2.5 18 6.5 6l4 12M4 14h5M13.5 18l4-12 4 12M15 14h5"/>',
        grup: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M3 15v4a2 2 0 0 0 2 2h4M21 9V5a2 2 0 0 0-2-2h-4" stroke-dasharray="2 2.5"/>',
        grupCoz: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
        yakinlas: '<circle cx="11" cy="11" r="7"/><path d="m21 21-5-5M8 11h6M11 8v6"/>',
        uzaklas: '<circle cx="11" cy="11" r="7"/><path d="m21 21-5-5M8 11h6"/>',
        sigdir: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
        ara: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
        menu: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
        dosya: '<path d="M14 3H6.5A2.5 2.5 0 0 0 4 5.5v13A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V9z"/><path d="M14 3v6h6"/>',
        klasor: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.7l2 2.2h7.3A2.5 2.5 0 0 1 21 9.7v8.8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5z"/>',
        kaydet: '<path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v5h8V3M7 21v-7h10v7"/>',
        ayar: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
        efekt: '<path d="m12 3 1.8 4.9L19 9.5l-5.2 1.6L12 16l-1.8-4.9L5 9.5l5.2-1.6z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
        cevirYatay: '<path d="M12 3v18" stroke-dasharray="2 2.5"/><path d="M9 7 4 12l5 5z"/><path d="m15 7 5 5-5 5z"/>',
        cevirDikey: '<path d="M3 12h18" stroke-dasharray="2 2.5"/><path d="m7 9 5-5 5 5z"/><path d="m7 15 5 5 5-5z"/>',
        dondur: '<path d="M20.5 12a8.5 8.5 0 1 1-2.5-6l2.5 2.5"/><path d="M20.5 3.5v5h-5"/>',
        kirp: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
        damla: '<path d="m3 21 1-4 10-10 3 3-10 10z"/><path d="m14 7 2.5-2.5a2.1 2.1 0 0 1 3 3L17 10"/><path d="m13 6 5 5"/>',
        sayfa: '<path d="M6.5 3H14l5 5v11.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3z"/><path d="M14 3v5h5"/>',
        sayfaEkle: '<path d="M6.5 3H14l5 5v11.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3z"/><path d="M12 11v6M9 14h6"/>',
        ay: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>',
        gunes: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        yardim: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7v.5M12 17h.01"/>',
        klavye: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
        baglanti: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
        sihir: '<path d="M15 4V2M15 10V8M11 6H9M21 6h-2M17.8 3.2l1.4-1.4M17.8 8.8l1.4 1.4M12.2 3.2l-1.4-1.4"/><path d="M3 21 14 10"/>',
        izgara: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
        liste: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
        etiket: '<path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
        yildiz: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>',
        tablo: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M3 15h18M9 3v18"/>',
        qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20.5 14v.01M14 20.5h.01M17 17h4v4h-4"/>',
        paylas: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3"/>',
        yazdir: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
        tamam: '<path d="m5 12.5 4.5 4.5L19.5 7"/>',
        uyari: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>',
        ayristir: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M14 3h5.5A1.5 1.5 0 0 1 21 4.5V10M3 14v5.5A1.5 1.5 0 0 0 4.5 21H10" stroke-dasharray="2 2.5"/>',
        cizgi: '<path d="M4 20 20 4"/>',
        emoji: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
        rozet: '<path d="m12 2.5 2.3 2.1 3.1-.4.9 3 2.8 1.4-1 3 1 3-2.8 1.4-.9 3-3.1-.4-2.3 2.1-2.3-2.1-3.1.4-.9-3-2.8-1.4 1-3-1-3 2.8-1.4.9-3 3.1.4z"/>',
        ok: '<path d="M5 12h14M13 6l6 6-6 6"/>',
        yenile: '<path d="M20 11A8 8 0 0 0 5.3 6.7L3.5 8.5M4 13a8 8 0 0 0 14.7 4.3l1.8-1.8"/><path d="M3.5 3.5v5h5M20.5 20.5v-5h-5"/>',
        bilgi: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
        tutamak: '<circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none"/>',
        kalem: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
        tasi: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
        pencere: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18"/>',
        web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
        pdf: '<path d="M14 3H6.5A2.5 2.5 0 0 0 4 5.5v13A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
        zip: '<path d="M14 3H6.5A2.5 2.5 0 0 0 4 5.5v13A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V9z"/><path d="M14 3v6h6M10 5h1M10 8h1M10 11h1M9.5 14h2v3h-2z"/>',
        yuzde: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
        kutu: '<rect x="4" y="4" width="16" height="16" rx="2.5"/>',
        daire: '<circle cx="12" cy="12" r="8.5"/>',
        firca: '<path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L12 14.8 9.2 12z"/><path d="M9 12.5c-2.5 0-4.5 2-4.5 4.5 0 1.6-1 2.5-2 3 1 .7 2.6 1 4 1 2.8 0 5-2.2 5-5z"/>',
        kilavuz: '<path d="M3 8h18M3 16h18M8 3v18M16 3v18" stroke-dasharray="2 2.5"/>',
        miknatis: '<path d="M5 3v8a7 7 0 0 0 14 0V3h-4v8a3 3 0 0 1-6 0V3z"/><path d="M5 7h4M15 7h4"/>',
        cark: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
    };
    KS.IKONLAR = I;

    KS.ikon = (ad, boyut = 20, ek = "") => {
        const s = document.createElementNS(KS.SVGNS, "svg");
        s.setAttribute("viewBox", "0 0 24 24");
        s.setAttribute("width", boyut);
        s.setAttribute("height", boyut);
        s.setAttribute("fill", "none");
        s.setAttribute("stroke", "currentColor");
        s.setAttribute("stroke-width", "1.8");
        s.setAttribute("stroke-linecap", "round");
        s.setAttribute("stroke-linejoin", "round");
        s.setAttribute("aria-hidden", "true");
        s.setAttribute("class", ("ikon " + ek).trim());
        s.innerHTML = I[ad] || I.bilgi;
        return s;
    };
})();
