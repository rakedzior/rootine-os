/* ============================================================
   ROOTINE OS — TRAVEL tab logic
   Top trip rail · overview ⇄ trip detail (legs · stay · transport
   · packing · budget · plan) · packing + view persistence
   ============================================================ */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var railEl = $('tripRail');
  var overviewEl = $('overview');
  var detailEl = $('detail');
  if (!railEl || !overviewEl || !detailEl) return;

  /* ---------- icons ---------- */
  var IC = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5z"/></svg>',
    train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 11h14M9 3v8M15 3v8M8 20l-2 2M16 20l2 2"/><circle cx="9" cy="16" r="0.5"/><circle cx="15" cy="16" r="0.5"/></svg>',
    hotel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M13 9h6a2 2 0 0 1 2 2v10M7 7h2M7 11h2M7 15h2"/></svg>',
    bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16M8 17v2M16 17v2"/><circle cx="8" cy="14" r="0.5"/><circle cx="16" cy="14" r="0.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>'
  };

  function tagColor(tag) {
    return ({ vac: 'var(--ev-green)', work: 'var(--ev-blue)', plan: 'var(--ev-lav)', city: 'var(--ev-clay)' })[tag] || 'var(--acc-a)';
  }

  /* ============================================================
     TRIP DATA
     ============================================================ */
  var TRIPS = [
    {
      id: 'bcn', dest: 'Barcelona', cc: 'ES', tag: 'vac', kind: 'Wakacje',
      when: '15–18 czerwca 2026', railWhen: '15–18 cze 2026', status: 'za 3 dni', soon: true,
      note: 'Z partnerką · 3 noce',
      info: [['Wylot', '15 cze · 09:40'], ['Powrót', '18 cze · 21:15'], ['Lot', 'KRK → BCN'], ['Nocleg', 'Eixample · 3 noce']],
      legs: [
        { label: 'Tam', route: 'KRK → BCN', date: '15 cze', mode: 'Ryanair FR8394', dep: '09:40', arr: '12:25', status: 'Zarezerwowany', ok: true, ic: 'plane' },
        { label: 'Powrót', route: 'BCN → KRK', date: '18 cze', mode: 'Ryanair FR8395', dep: '18:30', arr: '21:15', status: 'Zarezerwowany', ok: true, ic: 'plane' }
      ],
      stay: [{ name: 'Hotel Eixample Boutique', addr: 'Carrer de Mallorca · Eixample', dates: '15–18 cze · 3 noce', price: '1 350 zł', status: 'Opłacone', ok: true }],
      transport: [
        { n: 'Aerobús A1 · transfer z lotniska', t: 'W obie strony · 2 osoby', s: 'kupić na miejscu', ic: 'bus' },
        { n: 'Bilet metra T-casual', t: '10 przejazdów', s: 'kupić na miejscu', ic: 'bus' }
      ],
      plan: [
        { n: 'Sagrada Família', t: 'Bilet 14:30 · zarezerwowany', dot: 'green' },
        { n: 'Park Güell', t: 'Poranek · 16 cze', dot: 'blue' },
        { n: 'Dzielnica Gotycka + La Rambla', t: 'Spacer wieczorny', dot: 'lav' },
        { n: 'Barceloneta', t: 'Plaża · ostatni dzień', dot: 'clay' }
      ],
      budget: {
        rows: [['Loty · 2 osoby', '1 240 zł', 'var(--ev-blue)'], ['Nocleg · 3 noce', '1 350 zł', 'var(--ev-lav)'], ['Jedzenie i wyjścia', '800 zł', 'var(--acc-b)'], ['Atrakcje i bilety', '450 zł', 'var(--ev-green)'], ['Transport lokalny', '160 zł', 'var(--ink-3)']],
        paid: 2590, total: 4000
      },
      packTitle: 'Lista pakowania',
      packing: [
        { g: 'Dokumenty i finanse', items: ['Paszport / dowód osobisty', 'Karty pokładowe (w telefonie)', 'Karta EKUZ + polisa Allianz', 'Gotówka w euro + karta'] },
        { g: 'Ubrania', items: ['Lekkie ubrania na ciepło', 'Strój kąpielowy', 'Wygodne buty na spacery', 'Lekka kurtka na wieczór'] },
        { g: 'Elektronika', items: ['Ładowarka + powerbank', 'Słuchawki'] },
        { g: 'Kosmetyki', items: ['Krem z filtrem SPF 50', 'Kosmetyczka podręczna', 'Leki podręczne + plastry'] }
      ],
      packDone: ['Paszport / dowód osobisty', 'Karty pokładowe (w telefonie)', 'Lekkie ubrania na ciepło', 'Ładowarka + powerbank']
    },

    {
      id: 'gdn', dest: 'Gdańsk', cc: 'PL', tag: 'vac', kind: 'Kawalerski',
      when: '3–5 lipca 2026', railWhen: '3–5 lip 2026', status: '3 tyg.', soon: false,
      note: 'Kawalerski · ekipa 8 osób',
      info: [['Wyjazd', '3 lip · 07:10'], ['Powrót', '5 lip · 19:40'], ['Dojazd', 'Pociąg PKP IC'], ['Nocleg', 'Stare Miasto · 2 noce']],
      legs: [
        { label: 'Tam', route: 'Kraków → Gdańsk', date: '3 lip', mode: 'PKP IC 5402', dep: '07:10', arr: '13:25', status: 'Bilet kupiony', ok: true, ic: 'train' },
        { label: 'Powrót', route: 'Gdańsk → Kraków', date: '5 lip', mode: 'PKP IC 5409', dep: '19:40', arr: '01:55', status: 'Bilet kupiony', ok: true, ic: 'train' }
      ],
      stay: [{ name: 'Apartament Stare Miasto', addr: 'ul. Mariacka · 8 osób', dates: '3–5 lip · 2 noce', price: '480 zł', status: 'Udział opłacony', ok: true }],
      transport: [{ n: 'Tramwaj / autobus ZTM', t: 'Bilet 72h', s: 'kupić na miejscu', ic: 'bus' }],
      plan: [
        { n: 'Rejs po Motławie', t: 'Piątek po południu', dot: 'blue' },
        { n: 'Stare Miasto + Długi Targ', t: 'Wieczór', dot: 'clay' },
        { n: 'Sopot · molo', t: 'Sobota', dot: 'green' }
      ],
      budget: {
        rows: [['Pociąg w obie strony', '320 zł', 'var(--ev-blue)'], ['Nocleg · udział', '480 zł', 'var(--ev-lav)'], ['Jedzenie i wyjścia', '600 zł', 'var(--acc-b)'], ['Atrakcje', '300 zł', 'var(--ev-green)']],
        paid: 800, total: 1700
      },
      packTitle: 'Lista pakowania',
      packing: [
        { g: 'Dokumenty', items: ['Dowód osobisty', 'Bilety na pociąg', 'Gotówka + karta'] },
        { g: 'Ubrania', items: ['Ubrania na 3 dni', 'Coś eleganckiego na wieczór', 'Kurtka przeciwdeszczowa'] },
        { g: 'Inne', items: ['Ładowarka + powerbank', 'Leki podręczne'] }
      ],
      packDone: ['Bilety na pociąg']
    },

    {
      id: 'vie', dest: 'Wiedeń', cc: 'AT', tag: 'city', kind: 'City break',
      when: '12–14 września 2026', railWhen: '12–14 wrz 2026', status: 'planowane', soon: false,
      note: 'Przedłużony weekend · w planach',
      info: [['Wylot', 'do kupienia'], ['Powrót', 'do kupienia'], ['Lot', 'KRK → VIE'], ['Nocleg', 'lista skrócona']],
      legs: [
        { label: 'Tam', route: 'KRK → VIE', date: '12 wrz', mode: 'Lot ~1h', dep: '—', arr: '—', status: 'Do kupienia', ok: false, ic: 'plane' },
        { label: 'Powrót', route: 'VIE → KRK', date: '14 wrz', mode: 'Lot ~1h', dep: '—', arr: '—', status: 'Do kupienia', ok: false, ic: 'plane' }
      ],
      stay: [
        { name: 'Hotel przy Stephansplatz', addr: 'Śródmieście · do potwierdzenia', dates: '12–14 wrz · 2 noce', price: '~1 100 zł', status: 'Do rezerwacji', ok: false },
        { name: 'Apartament Mariahilf', addr: 'Alternatywa · tańszy', dates: '2 noce', price: '~820 zł', status: 'Opcja', ok: false }
      ],
      transport: [{ n: 'Bilet dobowy U-Bahn', t: 'Komunikacja miejska', s: 'kupić na miejscu', ic: 'bus' }],
      plan: [
        { n: 'Schönbrunn', t: 'Pałac i ogrody', dot: 'green' },
        { n: 'Belvedere · Klimt', t: '„Pocałunek”', dot: 'lav' },
        { n: 'Kawa i Sachertorte', t: 'Café Central', dot: 'clay' }
      ],
      budget: {
        rows: [['Loty · 2 osoby', '~900 zł', 'var(--ev-blue)'], ['Nocleg · 2 noce', '~1 100 zł', 'var(--ev-lav)'], ['Jedzenie', '~700 zł', 'var(--acc-b)'], ['Atrakcje', '~350 zł', 'var(--ev-green)'], ['Transport', '~120 zł', 'var(--ink-3)']],
        paid: 0, total: 3170
      },
      packTitle: 'Lista pakowania',
      packing: [
        { g: 'Dokumenty', items: ['Dowód osobisty', 'Karty pokładowe', 'Karta EKUZ'] },
        { g: 'Ubrania', items: ['Warstwy na chłodniejsze dni', 'Wygodne buty', 'Elegancki zestaw na operę'] },
        { g: 'Elektronika', items: ['Ładowarka + powerbank', 'Aparat'] }
      ],
      packDone: []
    },

    {
      id: 'jpn', dest: 'Japonia', cc: 'JP', tag: 'plan', kind: 'Marzenie',
      when: 'Wiosna 2027', railWhen: 'Wiosna 2027', status: 'oszczędności 53%', soon: false,
      note: 'Tokio + Kioto · 14 dni',
      info: [['Termin', 'Wiosna 2027'], ['Trasa', 'Tokio → Kioto'], ['Czas', '~14 dni'], ['Budżet', 'cel 8 000 zł']],
      legsNote: 'Loty jeszcze nie kupione — orientacyjnie wiosna 2027 (sezon kwitnących wiśni). Śledź ceny KRK/WAW → HND.',
      stayNote: 'Nocleg jeszcze nie wybrany. Pomysły: ryokan w Kioto, hotel kapsułowy w Tokio na 1–2 noce dla doświadczenia.',
      plan: [
        { n: 'Tokio · Shibuya, Shinjuku', t: '5 dni', dot: 'blue' },
        { n: 'Kioto · świątynie', t: '4 dni', dot: 'clay' },
        { n: 'Hakone · Fuji', t: '2 dni · onsen', dot: 'green' },
        { n: 'Osaka · jedzenie', t: '2 dni', dot: 'lav' }
      ],
      saving: { have: 4200, goal: 8000, pct: 53, per: '+600 zł / mies.' },
      packTitle: 'Przygotowania',
      packing: [
        { g: 'Formalności', items: ['Paszport ważny > 6 mies.', 'JR Pass · research', 'eSIM / internet', 'Kieszonkowe w ¥'] },
        { g: 'Research', items: ['Trasa Tokio ↔ Kioto', 'Rezerwacja noclegów', 'Lista świątyń i atrakcji', '50 zwrotów po japońsku'] }
      ],
      packDone: ['Paszport ważny > 6 mies.']
    }
  ];

  var byId = {};
  TRIPS.forEach(function (t) { byId[t.id] = t; });

  /* ---------- packing persistence ---------- */
  var PKEY = 'rootine.travel.packed';
  function loadPacked() {
    try { return new Set(JSON.parse(localStorage.getItem(PKEY) || 'null') || seedPacked()); }
    catch (e) { return new Set(seedPacked()); }
  }
  function seedPacked() {
    var arr = [];
    TRIPS.forEach(function (t) { (t.packDone || []).forEach(function (lbl) { arr.push(t.id + '|' + lbl); }); });
    return arr;
  }
  var packed = loadPacked();
  function savePacked() { try { localStorage.setItem(PKEY, JSON.stringify([].concat(Array.from(packed)))); } catch (e) {} }

  /* ============================================================
     RAIL
     ============================================================ */
  function renderRail(active) {
    var h = '<button class="trip-chip ov' + (active === 'overview' ? ' active' : '') + '" data-trip="overview">' +
      '<div class="tc-top"><span class="tc-ico">' + IC.home + '</span><span class="tc-dest sm">Przegląd</span></div>' +
      '<div class="tc-meta">Wszystkie podróże</div></button>';
    TRIPS.forEach(function (t) {
      h += '<button class="trip-chip' + (active === t.id ? ' active' : '') + '" data-trip="' + t.id + '" style="--tc:' + tagColor(t.tag) + '">' +
        '<div class="tc-top"><span class="tc-dest">' + t.dest + '</span>' + (t.cc ? '<span class="tc-cc">' + t.cc + '</span>' : '') + '</div>' +
        '<div class="tc-meta">' + (t.railWhen || t.when) + '</div>' +
        '<div class="tc-st' + (t.soon ? ' soon' : '') + '">' + t.status + '</div></button>';
    });
    railEl.innerHTML = h;
  }

  /* ============================================================
     DETAIL CARDS
     ============================================================ */
  function heroCard(t) {
    var info = (t.info || []).map(function (c) {
      return '<div class="th-cell"><div class="k">' + c[0] + '</div><div class="v">' + c[1] + '</div></div>';
    }).join('');
    return '<article class="card">' +
      '<div class="card-head"><div class="lhs"><span class="idx">01</span><span class="card-title">Wyjazd</span></div>' +
      '<span class="pill accent"><span class="led"></span>' + t.status + '</span></div>' +
      '<div class="th-dest">' + t.dest + (t.cc ? '<span class="cc">' + t.cc + '</span>' : '') + '</div>' +
      '<div class="th-sub">' + t.kind + ' · ' + t.when + '</div>' +
      '<div class="th-grid">' + info + '</div>' +
      (t.note ? '<div class="th-note"><span class="l">Plan</span><span class="r">' + t.note + '</span></div>' : '') +
      '</article>';
  }

  function moneyCard(t) {
    if (t.saving) {
      var s = t.saving;
      return '<article class="card">' +
        '<div class="card-head"><div class="lhs"><span class="idx">02</span><span class="card-title">Oszczędności</span></div>' +
        '<span class="pill">' + s.pct + '%</span></div>' +
        '<div class="sv-top"><div class="sv-have tnum">' + s.have.toLocaleString('pl-PL') + ' zł</div>' +
        '<div class="sv-goal">z celu ' + s.goal.toLocaleString('pl-PL') + ' zł</div></div>' +
        '<div class="goal"><div class="track"><i style="width:' + s.pct + '%"></i></div></div>' +
        '<div class="th-note"><span class="l">Tempo odkładania</span><span class="r">' + s.per + '</span></div>' +
        '</article>';
    }
    var b = t.budget; if (!b) return '';
    var rows = b.rows.map(function (r) {
      return '<div class="bud-row"><span class="lbl"><span class="tag" style="background:' + r[2] + '"></span>' + r[0] + '</span><span class="val tnum">' + r[1] + '</span></div>';
    }).join('');
    var remain = b.total - b.paid;
    var pPaid = b.total ? Math.round(b.paid / b.total * 100) : 0;
    return '<article class="card">' +
      '<div class="card-head"><div class="lhs"><span class="idx">02</span><span class="card-title">Budżet</span></div>' +
      '<span class="pill">' + (b.paid ? pPaid + '% opłacone' : 'szacunek') + '</span></div>' +
      '<div class="bud-rows">' + rows + '</div>' +
      '<div class="bud-split"><div class="bar"><i style="width:' + pPaid + '%;background:var(--acc-a)"></i><i style="width:' + (100 - pPaid) + '%;background:var(--acc-b-soft)"></i></div>' +
      '<div class="legend"><div>Opłacone <b>' + b.paid.toLocaleString('pl-PL') + ' zł</b></div><div>Pozostało <b>' + remain.toLocaleString('pl-PL') + ' zł</b></div></div></div>' +
      '<div class="th-note" style="margin-top:16px"><span class="l">Budżet całkowity</span><span class="r tnum">' + b.total.toLocaleString('pl-PL') + ' zł</span></div>' +
      '</article>';
  }

  function packingCard(t) {
    if (!t.packing) return '';
    var done = 0, total = 0, body = '';
    t.packing.forEach(function (grp) {
      body += '<div class="pack-gh">' + grp.g + '</div>';
      grp.items.forEach(function (lbl) {
        total++;
        var key = t.id + '|' + lbl;
        var isDone = packed.has(key);
        if (isDone) done++;
        body += '<div class="pack' + (isDone ? ' done' : '') + '" data-key="' + key + '">' +
          '<span class="check">' + IC.check + '</span><span class="n">' + lbl + '</span></div>';
      });
    });
    return '<article class="card">' +
      '<div class="card-head"><div class="lhs"><span class="idx">03</span><span class="card-title">' + (t.packTitle || 'Lista pakowania') + '</span></div>' +
      '<span class="pill" data-packcount>' + done + ' / ' + total + '</span></div>' +
      '<div class="pack-groups" data-packlist>' + body + '</div></article>';
  }

  function planCard(t) {
    if (!t.plan) return '';
    var rows = t.plan.map(function (p) {
      return '<div class="r"><span class="n"><i style="background:var(--ev-' + p.dot + ')"></i>' + p.n + '</span><span class="d">' + p.t + '</span></div>';
    }).join('');
    return '<article class="card">' +
      '<div class="card-head"><div class="lhs"><span class="idx">04</span><span class="card-title">Plan i atrakcje</span></div>' +
      '<span class="pill">' + t.plan.length + ' punktów</span></div>' +
      '<div class="recent" style="border-top:0;margin-top:0;padding-top:0">' + rows + '</div></article>';
  }

  function legsCard(t) {
    if (!t.legs && !t.legsNote) return '';
    var body;
    if (t.legs) {
      body = t.legs.map(function (l) {
        return '<div class="leg"><span class="ldir">' + l.label + '</span>' +
          '<span class="lic">' + IC[l.ic || 'plane'] + '</span>' +
          '<div class="lmain"><div class="r">' + l.route + '</div><div class="x">' + l.date + ' · ' + l.mode + '</div></div>' +
          '<div class="ltime"><div class="h tnum">' + l.dep + (l.arr && l.arr !== '—' ? '–' + l.arr : '') + '</div><div class="s ' + (l.ok ? 's-ok' : 's-warn') + '">' + l.status + '</div></div></div>';
      }).join('');
    } else {
      body = '<div class="note-line">' + t.legsNote + '</div>';
    }
    return '<article class="card">' +
      '<div class="card-head"><div class="lhs"><span class="idx">05</span><span class="card-title">Dojazd i loty</span></div></div>' +
      body + '</article>';
  }

  function stayCard(t) {
    if (!t.stay && !t.stayNote) return '';
    var body;
    if (t.stay) {
      body = t.stay.map(function (s) {
        return '<div class="drow"><span class="di" style="background:var(--ev-lav-bg);color:var(--ev-lav)">' + IC.hotel + '</span>' +
          '<div class="dinfo"><div class="n">' + s.name + '</div><div class="t">' + s.addr + ' · ' + s.dates + '</div></div>' +
          '<div class="damt"><div class="v tnum">' + (s.price || '') + '</div><div class="s ' + (s.ok ? 's-ok' : 's-muted') + '">' + s.status + '</div></div></div>';
      }).join('');
    } else {
      body = '<div class="note-line">' + t.stayNote + '</div>';
    }
    return '<article class="card">' +
      '<div class="card-head"><div class="lhs"><span class="idx">06</span><span class="card-title">Nocleg</span></div></div>' +
      body + '</article>';
  }

  function transportCard(t) {
    if (!t.transport) return '';
    var body = t.transport.map(function (r) {
      return '<div class="drow"><span class="di" style="background:var(--surface-inset);color:var(--ink-2)">' + IC[r.ic || 'bus'] + '</span>' +
        '<div class="dinfo"><div class="n">' + r.n + '</div><div class="t">' + r.t + '</div></div>' +
        '<div class="damt"><div class="s s-muted">' + r.s + '</div></div></div>';
    }).join('');
    return '<article class="card">' +
      '<div class="card-head"><div class="lhs"><span class="idx">07</span><span class="card-title">Transport lokalny</span></div></div>' +
      body + '</article>';
  }

  function renderDetail(t) {
    detailEl.innerHTML =
      '<section class="col">' + heroCard(t) + moneyCard(t) + '</section>' +
      '<section class="col">' + packingCard(t) + planCard(t) + '</section>' +
      '<section class="col">' + legsCard(t) + stayCard(t) + transportCard(t) + '</section>';
  }

  /* ============================================================
     VIEW SWITCH
     ============================================================ */
  var VKEY = 'rootine.travel.view';
  function show(view) {
    var t = byId[view];
    if (t) {
      renderDetail(t);
      detailEl.hidden = false;
      overviewEl.hidden = true;
      detailEl.setAttribute('data-screen-label', 'Trip: ' + t.dest);
    } else {
      view = 'overview';
      detailEl.hidden = true;
      detailEl.innerHTML = '';
      overviewEl.hidden = false;
    }
    renderRail(view);
    try { localStorage.setItem(VKEY, view); } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-trip]');
    if (chip) { show(chip.getAttribute('data-trip')); return; }

    var pk = e.target.closest('.pack[data-key]');
    if (pk && detailEl.contains(pk)) {
      var key = pk.getAttribute('data-key');
      if (packed.has(key)) { packed.delete(key); pk.classList.remove('done'); }
      else { packed.add(key); pk.classList.add('done'); }
      savePacked();
      var list = pk.closest('[data-packlist]');
      var pill = list && list.closest('.card').querySelector('[data-packcount]');
      if (pill) {
        var d = list.querySelectorAll('.pack.done').length;
        var tot = list.querySelectorAll('.pack').length;
        pill.textContent = d + ' / ' + tot;
      }
    }
  });

  /* ---------- init ---------- */
  var start = 'overview';
  try { var v = localStorage.getItem(VKEY); if (v && (v === 'overview' || byId[v])) start = v; } catch (e) {}
  show(start);
})();
