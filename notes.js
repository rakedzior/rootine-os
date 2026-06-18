/* ============================================================
   ROOTINE OS — NOTES tab logic
   Masonry board · quick capture · collections filter · pin
   ============================================================ */
(function () {
  'use strict';
  if (!document.getElementById('nboard')) return; // only on Notes page

  const $ = (id) => document.getElementById(id);
  const chk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>';
  const pinIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 3l7 7-3 1-3 4 1 5-3-2-3 3-1-1 3-3-2-3 5-3 1-3z" opacity=".9"/></svg>';
  const pinOutline = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6l-1 7 4 3v2H6v-2l4-3-1-7z"/><path d="M12 16v5"/></svg>';

  const LABELS = { all: 'Wszystkie notatki', personal: 'Osobiste', work: 'Praca', ideas: 'Pomysły', journal: 'Dziennik', recipes: 'Przepisy' };

  let uid = 100;
  let notes = [
    { id: 1, type: 'checklist', coll: 'work', pin: true, title: 'Finanteq Q3 — zadania',
      items: [['Specyfikacja API gateway', true], ['Logika ponawiania płatności', true], ['Test obciążeniowy 10k userów', false], ['Przegląd bezpieczeństwa', false]], date: '16 cze' },
    { id: 2, type: 'quote', coll: 'journal', pin: true,
      q: 'Dyscyplina to wybór między tym, czego chcesz teraz, a tym, czego chcesz najbardziej.', src: '— z „Atomic Habits”', date: '15 cze' },
    { id: 3, type: 'note', coll: 'personal', title: 'Remont mieszkania',
      body: 'Zdobądź wyceny łazienki do końca miesiąca. Płytki z miejsca koło Kazimierza — zapytaj o te matowe, gliniane. Budżet ~8k.', date: '14 cze' },
    { id: 4, type: 'note', coll: 'ideas', title: 'Pomysł na apkę — ogród nawyków',
      body: 'Każdy nawyk wyhodowuje roślinę; serie kwitną, pominięcia więdną. Spokojnie, bez zawstydzania seriami. Można połączyć z Rootine.', date: '13 cze' },
    { id: 5, type: 'checklist', coll: 'personal', title: 'Wyjazd do Japonii 2027 — przygotowania',
      items: [['Odnowić paszport', true], ['Research JR Pass', false], ['Odłożyć 8k zł', false], ['Nauczyć się 50 zwrotów', false]], date: '12 cze' },
    { id: 6, type: 'note', coll: 'work', title: 'System design — notatki',
      body: 'Sharding: zakresowy vs hash vs katalogowy. Consistent hashing ogranicza przetasowania. Wróć do modułu Educative o hot-spottingu.', date: '11 cze' },
    { id: 7, type: 'recipe', coll: 'recipes', title: 'Wysokobiałkowa owsianka na noc',
      body: '50g owsa · 200g skyr · 1 miarka whey · 100g owoców · chia. ~390 kcal, 38g białka. Namocz na noc, polej masłem orzechowym.', date: '10 cze', tagColl: 'recipes' },
    { id: 8, type: 'quote', coll: 'ideas',
      q: 'Nie wznosisz się do poziomu swoich celów. Spadasz do poziomu swoich systemów.', src: '— James Clear', date: '9 cze' },
    { id: 9, type: 'note', coll: 'journal', title: 'Refleksja tydzień 23',
      body: 'Dobry tydzień treningowy, 4 sesje. Żarcie poszło w weekend. Po odcięciu ekranów wieczorem czułem się spokojniej. Tego się trzymaj.', date: '8 cze' },
    { id: 10, type: 'note', coll: 'work', title: 'Przypomnienia o fakturach',
      body: 'Wyślij czerwcową fakturę za integrację (11 200). Dopomnij się u Kamila o rozliczenie wyjazdu. Odłóż na kwartalne ubezpieczenie.', date: '7 cze' },
    { id: 11, type: 'checklist', coll: 'personal', title: 'Weekend',
      items: [['Długi bieg 18k', false], ['Zadzwoń do rodziców', false], ['Meal prep w niedzielę', false]], date: '6 cze' },
  ];

  let filter = 'all';

  // ---------- RENDER BOARD ----------
  function collClass(c) { return 'c-' + c; }
  function render() {
    const host = $('nboard');
    const list = notes.filter((n) => filter === 'all' || n.coll === filter);
    // pinned first, then by recency (array order)
    const ordered = [...list].sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0));
    host.innerHTML = ordered.map(card).join('');

    $('boardTitle').textContent = LABELS[filter];
    const pins = list.filter((n) => n.pin).length;
    $('boardCount').textContent = `${list.length} ${list.length === 1 ? 'notatka' : 'notatek'}${pins ? ' · ' + pins + ' przypięte' : ''}`;
  }

  function card(n) {
    const cls = ['ncard', collClass(n.coll)];
    if (n.pin) cls.push('pinned');
    if (n.type === 'quote') cls.push('quote');
    let inner = '';
    const pinBtn = `<button class="ncard-pin" data-pin="${n.id}" aria-label="Pin">${n.pin ? pinIcon : pinOutline}</button>`;

    if (n.type === 'quote') {
      inner = `<div class="ncard-body"><div class="q">${esc(n.q)}</div><div class="src">${esc(n.src || '')}</div></div>
        <div style="position:absolute;top:12px;right:12px">${pinBtn}</div>`;
    } else if (n.type === 'checklist') {
      const done = n.items.filter((i) => i[1]).length;
      inner = `<div class="ncard-h"><div class="t">${esc(n.title)}</div>${pinBtn}</div>
        <div class="nlist">` +
        n.items.map((it, i) => `<div class="ni ${it[1] ? 'done' : ''}" data-note="${n.id}" data-item="${i}"><span class="box">${chk}</span><span class="x">${esc(it[0])}</span></div>`).join('') +
        `</div>`;
    } else {
      inner = `<div class="ncard-h"><div class="t">${esc(n.title)}</div>${pinBtn}</div>
        <div class="ncard-body"><p>${esc(n.body)}</p></div>`;
    }

    const tagColl = n.coll;
    inner += `<div class="ncard-foot"><span class="ncard-tag ${collClass(tagColl)}"><i></i>${LABELS[tagColl]}</span><span class="ncard-date">${n.date}</span></div>`;
    return `<div class="${cls.join(' ')}" data-id="${n.id}">${inner}</div>`;
  }

  function esc(s) { return (s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // ---------- RECENT ----------
  function renderRecent() {
    const recent = notes.slice(0, 5);
    $('recentList').innerHTML = recent.map((n) => {
      const title = n.title || (n.type === 'quote' ? 'Cytat' : 'Notatka');
      const when = n.date;
      return `<div class="recent ${collClass(n.coll)}" data-id="${n.id}">
        <span class="dot" style="background:var(--cc)"></span>
        <div class="info"><div class="n">${esc(title)}</div><div class="c">${LABELS[n.coll]}</div></div>
        <span class="when">${when}</span>
      </div>`;
    }).join('');
  }

  // ---------- COUNTS ----------
  function updateCounts() {
    const colls = ['personal', 'work', 'ideas', 'journal', 'recipes'];
    document.querySelector('[data-count="all"]').textContent = notes.length;
    colls.forEach((c) => {
      const el = document.querySelector(`[data-count="${c}"]`);
      if (el) el.textContent = notes.filter((n) => n.coll === c).length;
    });
    $('totalCount').textContent = notes.length + ' notatek';
  }

  // ---------- CAPTURE ----------
  let capType = 'note';
  let capColl = 'personal';

  function save() {
    const text = $('capArea').value.trim();
    if (!text) { $('capArea').focus(); return; }
    const lines = text.split('\n').filter((l) => l.trim());
    const note = { id: ++uid, coll: capColl, pin: false, date: 'Przed chwilą', type: capType };
    if (capType === 'checklist') {
      note.title = lines[0] || 'Lista';
      note.items = (lines.length > 1 ? lines.slice(1) : lines).map((l) => [l.replace(/^[-*\s]+/, ''), false]);
    } else if (capType === 'quote') {
      note.q = lines[0];
      note.src = lines[1] || '— zapisane';
    } else {
      note.title = lines[0].length <= 42 && lines.length > 1 ? lines[0] : 'Notatka';
      note.body = (note.title === 'Notatka' ? lines : lines.slice(1)).join(' ');
    }
    notes.unshift(note);
    $('capArea').value = '';
    render(); renderRecent(); updateCounts();
    // pulse the board title
    const bt = $('boardTitle'); bt.style.color = 'var(--acc-a-ink)';
    setTimeout(() => (bt.style.color = ''), 600);
  }

  // ---------- WIRE ----------
  function wire() {
    // board: pin + checklist toggles
    $('nboard').addEventListener('click', (e) => {
      const pin = e.target.closest('.ncard-pin');
      if (pin) {
        e.stopPropagation();
        const n = notes.find((x) => x.id === +pin.getAttribute('data-pin'));
        if (n) { n.pin = !n.pin; render(); }
        return;
      }
      const ni = e.target.closest('.ni');
      if (ni) {
        const n = notes.find((x) => x.id === +ni.getAttribute('data-note'));
        const idx = +ni.getAttribute('data-item');
        if (n && n.items[idx]) { n.items[idx][1] = !n.items[idx][1]; render(); }
      }
    });

    // collections filter
    $('collList').addEventListener('click', (e) => {
      const c = e.target.closest('.coll');
      if (!c) return;
      $('collList').querySelectorAll('.coll').forEach((x) => x.classList.remove('on'));
      c.classList.add('on');
      filter = c.getAttribute('data-coll');
      render();
    });

    // capture type segmented
    $('capType').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-type]');
      if (!b) return;
      $('capType').querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      capType = b.getAttribute('data-type');
      const ph = capType === 'checklist' ? 'Tytuł, potem po jednej pozycji w wierszu…'
        : capType === 'quote' ? 'Wklej cytat lub fragment…' : 'Zapisz myśl, listę, cokolwiek…';
      $('capArea').placeholder = ph;
    });

    // capture collection chips
    document.querySelector('.cap-collrow').addEventListener('click', (e) => {
      const chip = e.target.closest('.cap-chip');
      if (!chip) return;
      document.querySelectorAll('.cap-chip').forEach((x) => x.classList.remove('on'));
      chip.classList.add('on');
      capColl = chip.getAttribute('data-coll');
    });

    $('capSave').addEventListener('click', save);
    $('capArea').addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
    });

    // templates → prefill capture
    document.querySelector('.tmpl-btns').addEventListener('click', (e) => {
      const t = e.target.closest('.tmpl');
      if (!t) return;
      const kind = t.getAttribute('data-tmpl');
      const area = $('capArea');
      if (kind === 'gratitude') {
        setCap('checklist', 'journal', 'Trzy wdzięczności\nCoś małego dzisiaj\nKtoś, kogo doceniam\nSukces wart zapamiętania');
      } else if (kind === 'meeting') {
        setCap('note', 'work', 'Spotkanie — \nUczestnicy: \nNotatki: \nZadania: ');
      } else {
        setCap('note', 'journal', 'Dziś jestem wdzięczny za… a małym sukcesem było…');
      }
      area.focus();
    });
  }

  function setCap(type, coll, text) {
    capType = type; capColl = coll;
    $('capArea').value = text;
    $('capType').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.getAttribute('data-type') === type));
    document.querySelectorAll('.cap-chip').forEach((x) => x.classList.toggle('on', x.getAttribute('data-coll') === coll));
    // ensure the chip for this coll exists in the limited row; if not, leave personal
  }

  function boot() {
    render(); renderRecent(); updateCounts(); wire();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
