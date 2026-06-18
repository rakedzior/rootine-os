/* ============================================================
   ROOTINE OS — NUTRITION tab logic
   Date history + Day/Week/Month windows · per-meal macros ·
   editable targets · live totals · autofill · trends
   ============================================================ */
(function () {
  'use strict';
  if (!document.getElementById('logBody')) return; // only on Nutrition page

  const $ = (id) => document.getElementById(id);
  const TARGET = { kcal: 2500, p: 180, c: 240, f: 70 };

  const MEALS = [
    { key: 'breakfast', label: 'Śniadanie', icon: 'sun' },
    { key: 'lunch', label: 'Obiad', icon: 'bowl' },
    { key: 'snack', label: 'Przekąski', icon: 'leaf' },
    { key: 'dinner', label: 'Kolacja', icon: 'moon' },
  ];
  const ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/></svg>',
    bowl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M12 3v3"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 16-9 0 8-4 13-9 13z"/><path d="M4 20c2-4 5-6 8-7"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14a8 8 0 1 1-9.9-9.9 7 7 0 0 0 9.9 9.9z"/></svg>',
  };
  const xIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const plusIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  const editIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';

  // ---------- DATES ----------
  const DOW = ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
  const MON = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
  const MONTHF = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
  const TODAY = startOfDay(new Date());
  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return startOfDay(x); }
  function key(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function sameDay(a, b) { return key(a) === key(b); }
  function isFuture(d) { return startOfDay(d) > TODAY; }
  function fmtSub(d) { return DOW[d.getDay()] + ' · ' + MON[d.getMonth()] + ' ' + d.getDate(); }

  // ---------- LOG STORE (per date) ----------
  const todayItems = [
    { meal: 'breakfast', n: 'Płatki owsiane z borówkami', kcal: 320, p: 12, c: 52, f: 8 },
    { meal: 'breakfast', n: 'Koktajl białkowy (whey)', kcal: 180, p: 30, c: 8, f: 3 },
    { meal: 'breakfast', n: 'Czarna kawa', kcal: 5, p: 0, c: 0, f: 0 },
    { meal: 'lunch', n: 'Miska z grillowanym kurczakiem i ryżem', kcal: 620, p: 52, c: 68, f: 16 },
    { meal: 'lunch', n: 'Jogurt grecki, naturalny', kcal: 120, p: 16, c: 9, f: 2 },
    { meal: 'lunch', n: 'Sałata z oliwą', kcal: 90, p: 2, c: 5, f: 7 },
    { meal: 'snack', n: 'Banan', kcal: 105, p: 1, c: 27, f: 0 },
    { meal: 'snack', n: 'Migdały, 20g', kcal: 116, p: 4, c: 4, f: 10 },
    { meal: 'snack', n: 'Wafel ryżowy z miodem', kcal: 64, p: 1, c: 14, f: 0 },
  ];
  const TEMPLATES = [
    [ // -1
      { meal: 'breakfast', n: 'Jajecznica z tostem', kcal: 380, p: 24, c: 30, f: 18 },
      { meal: 'lunch', n: 'Wrap z indykiem i awokado', kcal: 540, p: 38, c: 46, f: 20 },
      { meal: 'snack', n: 'Baton białkowy', kcal: 210, p: 20, c: 22, f: 7 },
      { meal: 'dinner', n: 'Łosoś, ziemniaki i warzywa', kcal: 680, p: 46, c: 52, f: 26 },
      { meal: 'dinner', n: 'Gorzka czekolada, 20g', kcal: 110, p: 1, c: 12, f: 7 },
    ],
    [ // -2
      { meal: 'breakfast', n: 'Skyr z granolą', kcal: 340, p: 26, c: 44, f: 7 },
      { meal: 'lunch', n: 'Wołowina z ryżem (meal-prep)', kcal: 640, p: 50, c: 60, f: 20 },
      { meal: 'snack', n: 'Jabłko z masłem orzechowym', kcal: 240, p: 7, c: 30, f: 12 },
      { meal: 'dinner', n: 'Makaron z kurczakiem', kcal: 720, p: 48, c: 78, f: 18 },
    ],
    [ // -3
      { meal: 'breakfast', n: 'Placki białkowe', kcal: 420, p: 34, c: 48, f: 10 },
      { meal: 'lunch', n: 'Zestaw sushi', kcal: 560, p: 30, c: 88, f: 10 },
      { meal: 'dinner', n: 'Stek z batatem', kcal: 690, p: 52, c: 46, f: 30 },
    ],
  ];
  const logsByDate = {};
  logsByDate[key(TODAY)] = todayItems.slice();
  TEMPLATES.forEach((t, i) => { logsByDate[key(addDays(TODAY, -(i + 1)))] = t.map((x) => Object.assign({}, x)); });

  function getLog(d) { const k = key(d); if (!logsByDate[k]) logsByDate[k] = []; return logsByDate[k]; }

  // deterministic pseudo-totals for days without an explicit log (past only)
  function seeded(d) {
    const n = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    const r = (k) => { const x = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
    return { kcal: Math.round(1850 + r(1) * 1000), p: Math.round(135 + r(2) * 75), c: Math.round(170 + r(3) * 130), f: Math.round(48 + r(4) * 42) };
  }
  function totalsOf(items) { return items.reduce((a, it) => { a.kcal += it.kcal; a.p += it.p; a.c += it.c; a.f += it.f; return a; }, { kcal: 0, p: 0, c: 0, f: 0 }); }
  function dayTotals(d) {
    const k = key(d);
    if (logsByDate[k]) return totalsOf(logsByDate[k]);
    if (isFuture(d)) return { kcal: 0, p: 0, c: 0, f: 0, planned: true };
    return seeded(d);
  }

  // ---------- STATE ----------
  let selDate = new Date(TODAY);
  let win = 'day';

  // ---------- SUGGESTIONS (editable pool) ----------
  let sid = 0;
  let pool = [
    { id: ++sid, n: 'Pierś z kurczaka grillowana 150g', kcal: 248, p: 46, c: 0, f: 6, emoji: '🍗' },
    { id: ++sid, n: 'Filet z łososia 140g', kcal: 290, p: 39, c: 0, f: 14, emoji: '🐟' },
    { id: ++sid, n: 'Twaróg 200g', kcal: 196, p: 28, c: 8, f: 6, emoji: '🥣' },
    { id: ++sid, n: 'Koktajl białkowy z mlekiem', kcal: 240, p: 36, c: 14, f: 4, emoji: '🥤' },
    { id: ++sid, n: 'Tofu smażone 200g', kcal: 220, p: 24, c: 12, f: 10, emoji: '🥡' },
    { id: ++sid, n: 'Jajka na twardo ×3', kcal: 215, p: 19, c: 1, f: 15, emoji: '🥚' },
  ];
  let editingId = null;

  const MYMEALS = [
    { n: 'Koktajl potreningowy', m: 'Whey · banan · owies · masło orzech.', kcal: 480, items: [{ n: 'Koktajl potreningowy', kcal: 480, p: 42, c: 52, f: 10 }], emoji: '🥤' },
    { n: 'Pudełko z kurczakiem (meal-prep)', m: 'Kurczak · ryż · brokuły', kcal: 610, items: [{ n: 'Pudełko z kurczakiem (meal-prep)', kcal: 610, p: 55, c: 62, f: 14 }], emoji: '🍱' },
    { n: 'Owsianka na noc', m: 'Owies · jogurt · owoce · chia', kcal: 390, items: [{ n: 'Owsianka na noc', kcal: 390, p: 22, c: 54, f: 9 }], emoji: '🥣' },
    { n: 'Stek z batatem', m: 'Polędwica · batat · szparagi', kcal: 680, items: [{ n: 'Stek z batatem', kcal: 680, p: 52, c: 48, f: 28 }], emoji: '🥩' },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  function render() {
    updateHistLabels();
    if (win === 'day') renderDay(); else renderPeriod();
    updateSelectionTotals();
    renderSuggest();
  }

  function updateHistLabels() {
    if (win === 'day') {
      let big = fmtSub(selDate).split(' · ')[0] + ', ' + selDate.getDate();
      if (sameDay(selDate, TODAY)) big = 'Dziś';
      else if (sameDay(selDate, addDays(TODAY, -1))) big = 'Wczoraj';
      else if (sameDay(selDate, addDays(TODAY, 1))) big = 'Jutro';
      $('histLabel').textContent = big;
      $('histSub').textContent = fmtSub(selDate);
      $('logTitle').textContent = sameDay(selDate, TODAY) ? 'Dziennik dziś' : 'Dziennik · ' + selDate.getDate() + ' ' + MON[selDate.getMonth()];
    } else if (win === 'week') {
      const mon = weekStart(selDate), sun = addDays(mon, 6);
      const thisWeek = sameDay(mon, weekStart(TODAY));
      $('histLabel').textContent = thisWeek ? 'Ten tydzień' : 'Tydzień ' + mon.getDate() + ' ' + MON[mon.getMonth()];
      $('histSub').textContent = mon.getDate() + ' ' + MON[mon.getMonth()] + ' – ' + sun.getDate() + (sun.getMonth() !== mon.getMonth() ? ' ' + MON[sun.getMonth()] : '');
      $('logTitle').textContent = 'Podsumowanie tygodnia';
    } else {
      const thisMonth = selDate.getMonth() === TODAY.getMonth() && selDate.getFullYear() === TODAY.getFullYear();
      $('histLabel').textContent = thisMonth ? 'Ten miesiąc' : MONTHF[selDate.getMonth()];
      $('histSub').textContent = MONTHF[selDate.getMonth()] + ' ' + selDate.getFullYear();
      $('logTitle').textContent = 'Podsumowanie miesiąca';
    }
    if ($('histPick')) $('histPick').value = selDate.getFullYear() + '-' + pad(selDate.getMonth() + 1) + '-' + pad(selDate.getDate());
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function weekStart(d) { const x = startOfDay(d); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); }

  // ---------- DAY VIEW ----------
  function renderDay() {
    $('logAdd').style.display = '';
    const items = getLog(selDate);
    const host = $('logBody');
    let h = '';
    MEALS.forEach((m) => {
      const mi = items.filter((it) => it.meal === m.key);
      const t = totalsOf(mi);
      h += `<div class="meal-block">
        <div class="meal-h">
          <span class="ic">${ICONS[m.icon]}</span><span class="nm">${m.label}</span>
          <span class="meal-macros"><span>P <b>${Math.round(t.p)}</b></span><span>C <b>${Math.round(t.c)}</b></span><span>F <b>${Math.round(t.f)}</b></span></span>
          <span class="kc tnum">${Math.round(t.kcal)} kcal</span>
        </div>`;
      if (!mi.length) {
        h += `<div class="meal-empty">Nic jeszcze nie dodano</div>`;
      } else {
        mi.forEach((it) => {
          const gi = items.indexOf(it);
          h += `<div class="food">
            <div class="fn"><div class="n">${it.n}</div><div class="m"><span>P <b>${it.p}</b></span><span>C <b>${it.c}</b></span><span>F <b>${it.f}</b></span></div></div>
            <span class="kc tnum">${it.kcal}</span>
            <button class="rm" data-i="${gi}" aria-label="Remove">${xIcon}</button>
          </div>`;
        });
      }
      h += `</div>`;
    });
    host.innerHTML = h;
  }

  // ---------- PERIOD VIEW ----------
  function renderPeriod() {
    $('logAdd').style.display = 'none';
    const host = $('logBody');
    let rows = [];
    if (win === 'week') {
      const mon = weekStart(selDate);
      for (let i = 0; i < 7; i++) {
        const d = addDays(mon, i);
        rows.push({ label: DOW[d.getDay()], sub: MON[d.getMonth()] + ' ' + d.getDate(), t: dayTotals(d), today: sameDay(d, TODAY), future: isFuture(d) });
      }
    } else {
      // month → weekly rows
      const first = new Date(selDate.getFullYear(), selDate.getMonth(), 1);
      const mstart = weekStart(first);
      let wkNo = 1;
      for (let w = 0; w < 6; w++) {
        const ws = addDays(mstart, w * 7);
        if (ws.getMonth() !== selDate.getMonth() && ws > new Date(selDate.getFullYear(), selDate.getMonth(), 1)) break;
        // average over days of this week that fall in the selected month
        let sum = { kcal: 0, p: 0, c: 0, f: 0 }, cnt = 0, anyFuture = false, hasMonthDay = false;
        for (let i = 0; i < 7; i++) {
          const d = addDays(ws, i);
          if (d.getMonth() !== selDate.getMonth() || d.getFullYear() !== selDate.getFullYear()) continue;
          hasMonthDay = true;
          if (isFuture(d)) { anyFuture = true; continue; }
          const t = dayTotals(d); sum.kcal += t.kcal; sum.p += t.p; sum.c += t.c; sum.f += t.f; cnt++;
        }
        if (!hasMonthDay) continue;
        const avg = cnt ? { kcal: sum.kcal / cnt, p: sum.p / cnt, c: sum.c / cnt, f: sum.f / cnt } : { kcal: 0, p: 0, c: 0, f: 0, planned: true };
        const we = addDays(ws, 6);
        rows.push({ label: 'Tydz. ' + wkNo, sub: ws.getDate() + '–' + we.getDate(), t: avg, future: cnt === 0 && anyFuture });
        wkNo++;
      }
    }

    // header average
    const logged = rows.filter((r) => !r.future && r.t.kcal > 0);
    const avg = logged.length ? logged.reduce((a, r) => a + r.t.kcal, 0) / logged.length : 0;
    const onTarget = logged.filter((r) => Math.abs(r.t.kcal - TARGET.kcal) <= 250).length;
    const unit = win === 'week' ? 'dni' : 'tyg.';
    let h = `<div class="psum-head">
        <div><div class="lbl">Średnia / dzień</div><div class="big tnum">${avg ? Math.round(avg).toLocaleString() : '—'}<small> kcal</small></div></div>
        <div style="text-align:right"><div class="lbl">W celu</div><div class="big tnum">${onTarget}<small> / ${logged.length} ${unit}</small></div></div>
      </div>`;
    const scale = 3000;
    rows.forEach((r) => {
      if (r.t.planned || (r.future && r.t.kcal === 0)) {
        h += `<div class="psum-row future"><div class="psum-day ${r.today ? 'today' : ''}"><div class="d">${r.label}</div><div class="s">${r.sub}</div></div><div class="psum-empty">Plan</div></div>`;
        return;
      }
      const pct = Math.min(100, r.t.kcal / scale * 100);
      const over = r.t.kcal > TARGET.kcal;
      h += `<div class="psum-row">
        <div class="psum-day ${r.today ? 'today' : ''}"><div class="d">${r.label}</div><div class="s">${r.sub}</div></div>
        <div class="psum-bar"><i class="${over ? 'over' : ''}" style="width:${pct}%"></i></div>
        <span class="psum-macros"><span>P<b>${Math.round(r.t.p)}</b></span><span>C<b>${Math.round(r.t.c)}</b></span><span>F<b>${Math.round(r.t.f)}</b></span></span>
        <span class="psum-kc tnum">${Math.round(r.t.kcal).toLocaleString()}<small> kcal</small></span>
      </div>`;
    });
    host.innerHTML = h;
  }

  // ---------- SELECTION TOTALS (ring/macros/gap) ----------
  function selectionTotals() {
    if (win === 'day') return totalsOf(getLog(selDate));
    // average of logged days in the period
    let days = [];
    if (win === 'week') { const mon = weekStart(selDate); for (let i = 0; i < 7; i++) days.push(addDays(mon, i)); }
    else { const dim = new Date(selDate.getFullYear(), selDate.getMonth() + 1, 0).getDate(); for (let i = 1; i <= dim; i++) days.push(new Date(selDate.getFullYear(), selDate.getMonth(), i)); }
    const logged = days.filter((d) => !isFuture(d));
    if (!logged.length) return { kcal: 0, p: 0, c: 0, f: 0 };
    const s = logged.reduce((a, d) => { const t = dayTotals(d); a.kcal += t.kcal; a.p += t.p; a.c += t.c; a.f += t.f; return a; }, { kcal: 0, p: 0, c: 0, f: 0 });
    return { kcal: s.kcal / logged.length, p: s.p / logged.length, c: s.c / logged.length, f: s.f / logged.length };
  }

  function updateSelectionTotals() {
    const t = selectionTotals();
    $('targetTitle').textContent = win === 'day'
      ? (sameDay(selDate, TODAY) ? 'Cele na dziś' : 'Cele · ' + selDate.getDate() + ' ' + MON[selDate.getMonth()])
      : 'Śr. / dzień · ' + (win === 'week' ? 'Tydzień' : 'Miesiąc');
    $('kcalConsumed').textContent = Math.round(t.kcal).toLocaleString();
    $('kcalTarget').textContent = TARGET.kcal.toLocaleString();
    const left = Math.max(0, TARGET.kcal - t.kcal);
    $('kcalLeft').textContent = Math.round(left).toLocaleString();
    $('kcalArc').style.strokeDashoffset = 270.2 * (1 - Math.min(1, t.kcal / TARGET.kcal));
    setMacro('p', t.p, TARGET.p); setMacro('c', t.c, TARGET.c); setMacro('f', t.f, TARGET.f);
    $('gapKcal').innerHTML = Math.round(left).toLocaleString() + '<small> kcal</small>';
    $('gapP').innerHTML = Math.max(0, Math.round(TARGET.p - t.p)) + '<small> g</small>';
    $('logCount').textContent = win === 'day' ? (getLog(selDate).length + ' pozycji') : (win === 'week' ? '7 dni' : MON[selDate.getMonth()]);
  }
  function setMacro(k, val, tgt) { $(k + 'Val').textContent = Math.round(val); $(k + 'Bar').style.width = Math.min(100, val / tgt * 100) + '%'; }

  // ---------- SUGGESTIONS ----------
  function renderSuggest() {
    $('suggestList').innerHTML = pool.map((s) => {
      if (s.id === editingId) {
        return `<div class="suggest editing" data-id="${s.id}">
          <div class="sg-form">
            <input class="sg-name" type="text" value="${esc(s.n)}" placeholder="Nazwa produktu">
            <div class="sg-fields">
              <div class="wrap"><span>kcal</span><input data-f="kcal" type="number" inputmode="numeric" value="${s.kcal}"></div>
              <div class="wrap"><span>biał.</span><input data-f="p" type="number" inputmode="numeric" value="${s.p}"></div>
              <div class="wrap"><span>węgl.</span><input data-f="c" type="number" inputmode="numeric" value="${s.c}"></div>
              <div class="wrap"><span>tł.</span><input data-f="f" type="number" inputmode="numeric" value="${s.f}"></div>
            </div>
            <div class="sg-actions">
              <button class="del" data-del="${s.id}">Usuń</button>
              <button class="save" data-save="${s.id}">Zapisz</button>
            </div>
          </div>
        </div>`;
      }
      return `<div class="suggest" data-id="${s.id}">
        <span class="si">${s.emoji || '🍽️'}</span>
        <div class="info"><div class="n">${esc(s.n)}</div><div class="m">${s.kcal} kcal · ${s.p}P ${s.c}C ${s.f}F</div></div>
        <button class="sg-edit" data-edit="${s.id}" aria-label="Edit">${editIcon}</button>
        <button class="plus" data-add="${s.id}" aria-label="Log">${plusIcon}</button>
      </div>`;
    }).join('');
  }
  function esc(s) { return (s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function renderMyMeals() {
    $('myMeals').innerHTML = MYMEALS.map((m) => `
      <div class="mymeal" data-meal='${encodeURIComponent(JSON.stringify(m))}'>
        <span class="mm-ic">${m.emoji}</span>
        <div class="info"><div class="n">${m.n}</div><div class="m">${m.m}</div></div>
        <div class="kc"><div class="v tnum">${m.kcal}</div><div class="s">kcal</div></div>
      </div>`).join('');
  }

  function renderTrend() {
    const host = $('trendChart');
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const mon = weekStart(TODAY);
    const data = [];
    for (let i = 0; i < 7; i++) { const d = addDays(mon, i); data.push(isFuture(d) ? 0 : dayTotals(d).kcal); }
    const todayIdx = (TODAY.getDay() + 6) % 7;
    const scaleMax = 2800;
    const targetPct = TARGET.kcal / scaleMax * 100;
    let bars = `<div class="trend-target" style="bottom:${targetPct}%"><span>cel ${TARGET.kcal.toLocaleString()}</span></div>`;
    data.forEach((v, i) => {
      const hPct = Math.round(v / scaleMax * 100);
      const over = v > TARGET.kcal;
      bars += `<div class="trend-day ${i === todayIdx ? 'today' : ''}"><div class="trend-bar ${over ? 'over' : ''}" style="height:${Math.max(2, hPct)}%" title="${v.toLocaleString()} kcal"></div><span class="lab">${days[i]}</span></div>`;
    });
    host.innerHTML = bars;
  }

  // ============================================================
  // ACTIONS
  // ============================================================
  function addToLog(item, meal) { getLog(selDate).push(Object.assign({ meal: meal || 'snack' }, item)); }
  function refreshDay() { renderDay(); updateSelectionTotals(); renderTrend(); }

  function quickAdd() {
    if (win !== 'day') return;
    const name = $('addName').value.trim();
    const kcal = parseInt($('addKcal').value, 10);
    if (!name || !kcal) return;
    const p = Math.round(kcal * 0.25 / 4), c = Math.round(kcal * 0.45 / 4), f = Math.round(kcal * 0.30 / 9);
    addToLog({ n: name, kcal, p, c, f }, 'snack');
    $('addName').value = ''; $('addKcal').value = ''; $('addName').focus();
    refreshDay();
  }

  function autofill() {
    if (win !== 'day') { $('histWindow').querySelector('[data-win="day"]').click(); }
    const t = totalsOf(getLog(selDate));
    let leftK = TARGET.kcal - t.kcal, leftP = TARGET.p - t.p, guard = 0;
    const ranked = [...pool].sort((a, b) => b.p - a.p);
    while ((leftP > 12 || leftK > 280) && guard < 6 && ranked.length) {
      const pick = ranked.find((s) => s.kcal <= leftK + 120) || ranked[ranked.length - 1];
      addToLog({ n: pick.n, kcal: pick.kcal, p: pick.p, c: pick.c, f: pick.f }, leftP > 12 ? 'snack' : 'dinner');
      leftK -= pick.kcal; leftP -= pick.p; guard++;
    }
    refreshDay();
    const btn = $('autofillBtn');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg> Dzień uzupełniony do celu';
    setTimeout(() => { btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg> Uzupełnij mój dzień'; }, 1800);
  }

  function navigate(dir) {
    if (win === 'day') selDate = addDays(selDate, dir);
    else if (win === 'week') selDate = addDays(selDate, dir * 7);
    else selDate = startOfDay(new Date(selDate.getFullYear(), selDate.getMonth() + dir, Math.min(selDate.getDate(), 28)));
    render();
  }

  // ============================================================
  // WIRE
  // ============================================================
  function wire() {
    $('addBtn').addEventListener('click', quickAdd);
    $('addName').addEventListener('keydown', (e) => { if (e.key === 'Enter') quickAdd(); });
    $('addKcal').addEventListener('keydown', (e) => { if (e.key === 'Enter') quickAdd(); });

    $('logBody').addEventListener('click', (e) => {
      const rm = e.target.closest('.rm');
      if (rm && win === 'day') { getLog(selDate).splice(+rm.getAttribute('data-i'), 1); refreshDay(); }
    });

    // history nav
    $('histPrev').addEventListener('click', () => navigate(-1));
    $('histNext').addEventListener('click', () => navigate(1));
    $('histPick').addEventListener('change', (e) => {
      const v = e.target.value; if (!v) return;
      const [y, m, d] = v.split('-').map(Number);
      selDate = startOfDay(new Date(y, m - 1, d));
      if (win === 'month') { /* keep month */ }
      render();
    });
    $('histWindow').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-win]'); if (!b) return;
      $('histWindow').querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on'); win = b.getAttribute('data-win'); render();
    });

    // suggestions: log / edit / save / delete
    $('suggestList').addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) { const s = pool.find((x) => x.id === +add.getAttribute('data-add')); if (s) { ensureDay(); addToLog({ n: s.n, kcal: s.kcal, p: s.p, c: s.c, f: s.f }, 'snack'); refreshDay(); } return; }
      const ed = e.target.closest('[data-edit]');
      if (ed) { editingId = +ed.getAttribute('data-edit'); renderSuggest(); return; }
      const del = e.target.closest('[data-del]');
      if (del) { pool = pool.filter((x) => x.id !== +del.getAttribute('data-del')); editingId = null; renderSuggest(); return; }
      const save = e.target.closest('[data-save]');
      if (save) {
        const row = save.closest('.suggest'); const s = pool.find((x) => x.id === +save.getAttribute('data-save'));
        if (s) {
          s.n = row.querySelector('.sg-name').value.trim() || s.n;
          ['kcal', 'p', 'c', 'f'].forEach((f) => { const v = parseInt(row.querySelector(`[data-f="${f}"]`).value, 10); if (!isNaN(v)) s[f] = v; });
        }
        editingId = null; renderSuggest();
      }
    });

    $('addSuggestBtn').addEventListener('click', () => {
      const s = { id: ++sid, n: '', kcal: 200, p: 20, c: 10, f: 6, emoji: '🍽️' };
      pool.push(s); editingId = s.id; renderSuggest();
      const el = $('suggestList').querySelector(`.suggest[data-id="${s.id}"] .sg-name`); if (el) el.focus();
    });

    $('autofillBtn').addEventListener('click', autofill);

    $('myMeals').addEventListener('click', (e) => {
      const row = e.target.closest('.mymeal'); if (!row) return;
      ensureDay();
      const m = JSON.parse(decodeURIComponent(row.getAttribute('data-meal')));
      m.items.forEach((it) => addToLog(Object.assign({}, it), 'dinner'));
      refreshDay();
      row.style.transition = 'opacity .3s'; row.style.opacity = '.45'; setTimeout(() => { row.style.opacity = ''; }, 600);
    });

    const glass = $('hydroGlass');
    glass.addEventListener('click', (e) => {
      const cell = e.target.closest('i'); if (!cell) return;
      const cells = [...glass.children]; const idx = cells.indexOf(cell);
      cells.forEach((c, i) => c.classList.toggle('on', i <= idx));
      $('waterVal').textContent = ((idx + 1) * 0.375).toFixed(1);
    });
  }
  function ensureDay() { if (win !== 'day') { win = 'day'; $('histWindow').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.getAttribute('data-win') === 'day')); render(); } }

  function boot() { renderMyMeals(); renderTrend(); render(); wire(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
