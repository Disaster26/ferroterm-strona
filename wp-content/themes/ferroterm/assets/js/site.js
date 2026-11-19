(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }

  /* ---------- menu mobilne ---------- */
  var burger = $('.burger'), menu = $('#menu-mob');
  if (burger && menu) {
    var zamknij = function () { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); };
    burger.addEventListener('click', function () {
      var otw = menu.hidden;
      menu.hidden = !otw;
      burger.setAttribute('aria-expanded', String(otw));
      burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { zamknij(); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1240 && !menu.hidden) zamknij(); });
  }

  /* ---------- rozwijana lista działów (komputer) ---------- */
  var of = $('.nav-of'), ofB = $('.nav-of-b'), ofL = $('#nav-dzialy');
  if (of && ofB && ofL) {
    var pokaz = function (t) { ofL.hidden = !t; ofB.setAttribute('aria-expanded', String(t)); of.classList.toggle('otw', t); };
    ofB.addEventListener('click', function () { pokaz(ofL.hidden); });
    var hoverT;
    if (window.matchMedia('(hover: hover)').matches) {
      of.addEventListener('mouseenter', function () { clearTimeout(hoverT); pokaz(true); });
      of.addEventListener('mouseleave', function () { hoverT = setTimeout(function () { pokaz(false); }, 180); });
    }
    d.addEventListener('click', function (e) { if (!of.contains(e.target)) pokaz(false); });
    of.addEventListener('keydown', function (e) { if (e.key === 'Escape') { pokaz(false); ofB.focus(); } });
    of.addEventListener('focusout', function () { setTimeout(function () { if (!of.contains(d.activeElement)) pokaz(false); }, 0); });
  }

  /* ---------- karuzele: palec, mysz, strzałki, klawiatura ---------- */
  $$('[data-karuzela]').forEach(function (k) {
    var tor = $('.kar-tor', k);
    var n = tor.querySelectorAll('img').length;
    var l = $('.kar-l', k), p = $('.kar-p', k), licz = $('.kar-licz', k);
    if (n < 2) return;
    function idx() { return Math.round(tor.scrollLeft / tor.clientWidth); }
    function stan() {
      var i = idx();
      if (licz) licz.textContent = (i + 1) + ' / ' + n;
      if (l) l.disabled = i <= 0;
      if (p) p.disabled = i >= n - 1;
    }
    function idz(dd) {
      var i = Math.max(0, Math.min(n - 1, idx() + dd));
      tor.scrollTo({ left: i * tor.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (l) l.addEventListener('click', function () { idz(-1); });
    if (p) p.addEventListener('click', function () { idz(1); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(stan); }, { passive: true });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); }
    });
    var p0 = null, sl = 0, ruch = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      p0 = e.clientX; sl = tor.scrollLeft; ruch = false;
      tor.setPointerCapture(e.pointerId);
    });
    tor.addEventListener('pointermove', function (e) {
      if (p0 === null) return;
      var dx = e.clientX - p0;
      if (Math.abs(dx) > 4) { ruch = true; tor.classList.add('ciag'); }
      if (ruch) tor.scrollLeft = sl - dx;
    });
    function koniec() {
      if (p0 === null) return;
      var dx = tor.scrollLeft - sl;
      p0 = null;
      if (ruch) {
        tor.classList.remove('ciag');
        var start = Math.round(sl / tor.clientWidth);
        var cel = Math.abs(dx) > tor.clientWidth * 0.15 ? start + (dx > 0 ? 1 : -1) : start;
        cel = Math.max(0, Math.min(n - 1, cel));
        tor.scrollTo({ left: cel * tor.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    tor.addEventListener('pointerup', koniec);
    tor.addEventListener('pointercancel', koniec);
    tor.addEventListener('dragstart', function (e) { e.preventDefault(); });
    window.addEventListener('resize', stan);
    stan();
  });

  /* ---------- dolny pasek na telefonie: po przewinięciu za przycisk pierwszego ekranu, poza sekcją kontaktu ---------- */
  var pasek = $('#mob-pasek'), cta = $('#hero-cta') || $('#cta-ph') || $('.ph');
  var strefy = [$('#kontakt'), $('.stopka')].filter(Boolean);
  if ('IntersectionObserver' in window && pasek && cta) {
    var zaCta = false, wStrefie = strefy.map(function () { return false; });
    var ustaw = function () {
      var w = zaCta && wStrefie.indexOf(true) < 0;
      pasek.classList.toggle('widac', w);
      pasek.setAttribute('aria-hidden', String(!w));
      $$('a', pasek).forEach(function (a) { a.tabIndex = w ? 0 : -1; });
    };
    new IntersectionObserver(function (en) { zaCta = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; ustaw(); }).observe(cta);
    strefy.forEach(function (s, i) { new IntersectionObserver(function (en) { wStrefie[i] = en[0].isIntersecting; ustaw(); }, { threshold: 0.12 }).observe(s); });
  }

  /* ---------- zgoda na cookies (12 miesięcy): statystyki GA4 i mapa Google dopiero po zgodzie ---------- */
  var ck = $('#ck'), ZGODA = null;
  var zgCzytaj = function () {
    var m = d.cookie.match(/(?:^|; )ft_zgoda=([^;]+)/);
    if (!m) return null;
    var a = decodeURIComponent(m[1]).split('|');
    return { mapy: a[0] === '1', stat: a[1] === '1', t: +a[2] || Date.now() };
  };
  var mapaWczytaj = function (el) {
    if ($('iframe', el)) return;
    var f = d.createElement('iframe');
    f.src = el.dataset.src; f.title = el.dataset.tytul || 'Mapa Google'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
    el.insertBefore(f, el.firstChild); el.classList.add('wczytana');
  };
  var mapaZdejmij = function (el) { var f = $('iframe', el); if (f) f.remove(); el.classList.remove('wczytana'); };
  var zastosuj = function () {
    $$('[data-mapa]').forEach(function (el) { if (ZGODA && ZGODA.mapy) mapaWczytaj(el); else mapaZdejmij(el); });
    if (ZGODA && ZGODA.stat && ck && ck.dataset.ga4 && !window.gtag) {
      var g = ck.dataset.ga4, s = d.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(g);
      d.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
      window.gtag('js', new Date()); window.gtag('config', g, { anonymize_ip: true });
    }
  };
  var zgZapisz = function (z) {
    z.t = Date.now(); ZGODA = z;
    d.cookie = 'ft_zgoda=' + encodeURIComponent((z.mapy ? '1' : '0') + '|' + (z.stat ? '1' : '0') + '|' + z.t) + '; max-age=31536000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    zastosuj();
  };
  ZGODA = zgCzytaj();
  zastosuj();
  if (ck) {
    var ust = $('#ckUst'), zapisz = $('[data-ck="zapisz"]', ck), btnUst = $('[data-ck="ustawienia"]', ck);
    var cbMapy = $('#ckMapy'), cbStat = $('#ckStat');
    var pokazBaner = function () {
      ck.hidden = false;
      if (cbMapy) cbMapy.checked = !!(ZGODA && ZGODA.mapy);
      if (cbStat) cbStat.checked = !!(ZGODA && ZGODA.stat);
      ust.hidden = false; zapisz.hidden = false; btnUst.setAttribute('aria-expanded', 'true');
    };
    var schowaj = function () { ck.hidden = true; ust.hidden = true; zapisz.hidden = true; btnUst.setAttribute('aria-expanded', 'false'); };
    ck.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]'); if (!b) return;
      var co = b.dataset.ck;
      if (co === 'wszystkie') { zgZapisz({ mapy: true, stat: true }); schowaj(); }
      if (co === 'niezbedne') { zgZapisz({ mapy: false, stat: false }); schowaj(); }
      if (co === 'ustawienia') { var o = ust.hidden; ust.hidden = !o; zapisz.hidden = !o; btnUst.setAttribute('aria-expanded', o ? 'true' : 'false'); }
      if (co === 'zapisz') { zgZapisz({ mapy: !!(cbMapy && cbMapy.checked), stat: !!(cbStat && cbStat.checked) }); schowaj(); }
    });
    $$('[data-cookies-ustaw]').forEach(function (b) { b.addEventListener('click', function () { pokazBaner(); var t = $('.ck-tak', ck); if (t) t.focus(); }); });
    $$('.mz-pokaz').forEach(function (b) { b.addEventListener('click', function () { zgZapisz({ mapy: true, stat: !!(ZGODA && ZGODA.stat) }); schowaj(); }); });
    if (!ZGODA) ck.hidden = false;
  }

  /* ---------- formularz zapytania ---------- */
  var f = $('#zapytanie'), info = $('#form-info');
  var plik = f && $('.plik input', f), plikNazwa = $('#plik-nazwa');
  var plikDom = plikNazwa ? plikNazwa.innerHTML : '';
  var pokazPliki = function () {
    if (!plik || !plikNazwa) return;
    var fl = plik.files;
    if (!fl || !fl.length) { plikNazwa.innerHTML = plikDom; return; }
    var b = d.createElement('b'); b.textContent = fl.length === 1 ? 'Dodano 1 plik' : 'Dodano pliki: ' + fl.length;
    plikNazwa.textContent = ''; plikNazwa.appendChild(b);
    plikNazwa.appendChild(d.createTextNode([].map.call(fl, function (x) { return x.name; }).join(', ')));
  };
  if (plik) plik.addEventListener('change', pokazPliki);
  if (f && f.dataset.test) {
    f.addEventListener('submit', function (e) { e.preventDefault(); info.textContent = f.dataset.test; info.className = 'form-info ok'; });
  } else if (f && f.dataset.endpoint) {
    var bilet = '', biletT = 0;
    var pobierzBilet = function () {
      return fetch(f.dataset.endpoint, { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { bilet = j.tk || ''; biletT = Date.now(); }).catch(function () {});
    };
    var start = function () { if (!bilet) pobierzBilet(); };
    f.addEventListener('focusin', start, { once: true });
    f.addEventListener('pointerdown', start, { once: true });
    var komunikat = function (t, blad) { info.textContent = t; info.className = 'form-info ' + (blad ? 'blad' : 'ok'); };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var im = f.elements.imie, tel = f.elements.tel, em = f.elements.email;
      [im, tel, em].forEach(function (el) { el.removeAttribute('aria-invalid'); });
      if (!im.value.trim()) { im.setAttribute('aria-invalid', 'true'); im.focus(); komunikat('Podaj imię i nazwisko.', true); return; }
      var cyfry = tel.value.replace(/\D/g, ''), mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim());
      if (em.value.trim() && !mailOk) { em.setAttribute('aria-invalid', 'true'); em.focus(); komunikat('Sprawdź adres e-mail.', true); return; }
      if (cyfry.length < 9 && !mailOk) { tel.setAttribute('aria-invalid', 'true'); tel.focus(); komunikat('Podaj numer telefonu albo adres e-mail, żebyśmy mogli odpowiedzieć.', true); return; }
      if (!f.elements.zgoda.checked) { komunikat('Zaznacz zgodę na kontakt w sprawie zapytania.', true); return; }
      var pl = f.elements['pliki[]'];
      if (pl && pl.files) {
        if (pl.files.length > 3) { komunikat('Można dołączyć najwyżej 3 pliki. Większe paczki prosimy przesłać e-mailem.', true); return; }
        for (var i = 0; i < pl.files.length; i++) { if (pl.files[i].size > 10 * 1024 * 1024) { komunikat('Plik „' + pl.files[i].name + '” jest większy niż 10 MB. Prosimy przesłać go e-mailem.', true); return; } }
      }
      var btn = $('button[type=submit]', f);
      btn.disabled = true; komunikat('Wysyłanie…', false);
      (bilet ? Promise.resolve() : pobierzBilet()).then(function () {
        var czekaj = Math.max(0, 4600 - (Date.now() - biletT));
        return new Promise(function (ok) { setTimeout(ok, czekaj); });
      }).then(function () {
        var dane = new FormData(f); dane.append('tk', bilet);
        return fetch(f.dataset.endpoint, { method: 'POST', body: dane, credentials: 'same-origin' });
      }).then(function (r) { return r.json().catch(function () { return { ok: false, msg: 'Nie udało się wysłać. Prosimy o telefon albo e-mail.' }; }); })
        .then(function (j) {
          btn.disabled = false;
          komunikat(j.msg || (j.ok ? 'Dziękujemy.' : 'Nie udało się wysłać.'), !j.ok);
          if (j.ok) { f.reset(); pokazPliki(); bilet = ''; pobierzBilet(); if (window.gtag) window.gtag('event', 'generate_lead', { form: 'zapytanie' }); }
        }).catch(function () { btn.disabled = false; komunikat('Brak połączenia. Spróbuj ponownie albo zadzwoń.', true); });
    });
  }
})();
