/* ============================================================
   ROOTINE OS — app logic
   ============================================================ */
(function () {
  'use strict';

  // ---------- CALENDAR ----------
  // June 2026 starts on a Monday; 30 days. Grid = Mon-start, 5 rows (Jun 1 – Jul 5).
  const TODAY = 18;
  let calView = 'month';
  const events = {
    11: [{ t: 'Spotkanie Krzyski', c: 'blue' }],
    12: [{ t: 'Stay at DTŚ Apartments', c: 'lav' }, { t: 'Festiwal', c: 'green' }],
    13: [{ t: 'Festiwal', c: 'green' }],
    15: [{ t: 'Tańce', c: 'blue', tm: '18:00' }, { t: 'Barcelona', c: 'clay' }],
    16: [{ t: 'Barcelona', c: 'clay' }],
    17: [{ t: 'Taniec', c: 'blue', tm: '18:00' }],
    18: [{ t: 'Miłosz Dawid', c: 'lav' }],
    19: [{ t: 'Klaudii — panieński', c: 'clay' }],
    22: [{ t: 'Tańce', c: 'blue', tm: '18:00' }],
    23: [{ t: 'Dzień Ojca', c: 'green' }],
    27: [{ t: 'Wizyta u księdza', c: 'blue', tm: '16:30' }],
    28: [{ t: 'Ala Hojcak — urodziny', c: 'clay' }],
    29: [{ t: 'Tańce', c: 'blue', tm: '18:00' }],
  };
  // July overflow cells (out of month)
  const julEvents = {
    3: [{ t: 'Kawalerski', c: 'lav' }, { t: 'Finanteq integracyjny', c: 'blue' }],
    4: [{ t: 'Kawalerski', c: 'lav' }, { t: 'Ania K. — urodziny', c: 'clay' }],
    5: [{ t: 'Kawalerski', c: 'lav' }],
  };

  function renderCalendar() {
    const grid = document.getElementById('calGrid');
    if (!grid) return;
    const dow = document.querySelector('.cal-dow');
    grid.classList.remove('cal-agenda', 'cal-week');
    if (dow) dow.style.display = '';
    if (calView === 'day') { renderDay(grid, dow); return; }
    if (calView === 'week') { renderWeek(grid); return; }
    let html = '';
    for (let d = 1; d <= 30; d++) html += cell(d, events[d], d === TODAY, false);
    for (let d = 1; d <= 5; d++) html += cell(d, julEvents[d], false, true);
    grid.innerHTML = html;
  }

  function renderWeek(grid) {
    grid.classList.add('cal-week');
    let html = '';
    for (let d = 8; d <= 14; d++) {
      const evs = events[d] || [];
      let inner = `<div class="dn tnum">${d}</div>`;
      if (evs.length) {
        inner += '<div class="evs">';
        evs.forEach((e) => {
          const tm = e.tm ? `<span class="tm">${e.tm}</span>` : '';
          inner += `<div class="ev ${e.c}" title="${e.t}">${e.t}${tm}</div>`;
        });
        inner += '</div>';
      }
      html += `<div class="cal-cell week${d === TODAY ? ' today' : ''}">${inner}</div>`;
    }
    grid.innerHTML = html;
  }

  function renderDay(grid, dow) {
    if (dow) dow.style.display = 'none';
    grid.classList.add('cal-agenda');
    const evs = (events[TODAY] || []).slice().sort((a, b) => (a.tm || '99').localeCompare(b.tm || '99'));
    let rows = '';
    if (!evs.length) rows = '<div class="agenda-empty">Brak wydarzeń tego dnia</div>';
    else evs.forEach((e) => {
      rows += `<div class="agenda-row ${e.c}"><span class="atm">${e.tm || 'cały dzień'}</span><span class="adot"></span><span class="atitle">${e.t}</span></div>`;
    });
    grid.innerHTML = `<div class="agenda"><div class="agenda-head">Piątek, 12 czerwca</div>${rows}</div>`;
  }

  function cell(day, evs, isToday, isOut) {
    const cls = ['cal-cell'];
    if (isToday) cls.push('today');
    if (isOut) cls.push('out');
    let inner = `<div class="dn tnum">${day}</div>`;
    if (evs && evs.length) {
      const shown = evs.slice(0, 2);
      inner += '<div class="evs">';
      shown.forEach((e) => {
        const tm = e.tm ? `<span class="tm">${e.tm}</span>` : '';
        inner += `<div class="ev ${e.c}" title="${e.t}">${e.t}${tm}</div>`;
      });
      inner += '</div>';
      if (evs.length > 2) inner += `<div class="cal-more">+${evs.length - 2} więcej</div>`;
    }
    return `<div class="${cls.join(' ')}">${inner}</div>`;
  }

  // ---------- WEATHER ICONS (minimal geometric) ----------
  const ICONS = {
    sun: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="32" cy="32" r="12" fill="currentColor" stroke="none" opacity=".92"/><g opacity=".8"><path d="M32 8v6M32 50v6M8 32h6M50 32h6M15 15l4 4M45 45l4 4M49 15l-4 4M19 45l-4 4"/></g></svg>`,
    partly: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="24" cy="22" r="9" fill="currentColor" stroke="none" opacity=".85"/><g opacity=".7"><path d="M24 6v4M10 22h4M13 11l3 3"/></g><path d="M28 44a11 11 0 0 1 .6-3.3A10 10 0 0 1 48 42a8 8 0 0 1-.6 16H26a9 9 0 0 1-1-17.9" fill="currentColor" stroke="none" opacity=".22"/><path d="M26 50h22a8 8 0 0 0 .4-16A12 12 0 0 0 26 33a9 9 0 0 0 0 17z"/></svg>`,
    cloud: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 48h24a9 9 0 0 0 .5-18A14 14 0 0 0 18 33a10 10 0 0 0 2 19z" fill="currentColor" fill-opacity=".14"/></svg>`,
    rain: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 40h24a9 9 0 0 0 .5-18A14 14 0 0 0 18 25a10 10 0 0 0 2 19z" fill="currentColor" fill-opacity=".14"/><path d="M24 50l-2 6M34 50l-2 6M44 50l-2 6" opacity=".7"/></svg>`,
    snow: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 40h24a9 9 0 0 0 .5-18A14 14 0 0 0 18 25a10 10 0 0 0 2 19z" fill="currentColor" fill-opacity=".14"/><g opacity=".75"><circle cx="24" cy="52" r="1.6" fill="currentColor" stroke="none"/><circle cx="34" cy="55" r="1.6" fill="currentColor" stroke="none"/><circle cx="44" cy="52" r="1.6" fill="currentColor" stroke="none"/></g></svg>`,
    fog: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><g opacity=".8"><path d="M12 24h40M16 34h36M12 44h34"/></g></svg>`,
  };

  // WMO weather code → {label, icon}
  function decodeWmo(code, isDay) {
    const m = {
      0: ['Bezchmurnie', isDay ? 'sun' : 'sun'],
      1: ['Przeważnie słonecznie', 'partly'],
      2: ['Częściowe zachmurzenie', 'partly'],
      3: ['Zachmurzenie', 'cloud'],
      45: ['Mgła', 'fog'], 48: ['Mgła osadzająca', 'fog'],
      51: ['Lekka mżawka', 'rain'], 53: ['Mżawka', 'rain'], 55: ['Gęsta mżawka', 'rain'],
      56: ['Marznąca mżawka', 'rain'], 57: ['Marznąca mżawka', 'rain'],
      61: ['Słaby deszcz', 'rain'], 63: ['Deszcz', 'rain'], 65: ['Silny deszcz', 'rain'],
      66: ['Marznący deszcz', 'rain'], 67: ['Marznący deszcz', 'rain'],
      71: ['Słaby śnieg', 'snow'], 73: ['Śnieg', 'snow'], 75: ['Silny śnieg', 'snow'],
      77: ['Ziarna śniegu', 'snow'],
      80: ['Przelotny deszcz', 'rain'], 81: ['Przelotny deszcz', 'rain'], 82: ['Ulewa', 'rain'],
      85: ['Przelotny śnieg', 'snow'], 86: ['Przelotny śnieg', 'snow'],
      95: ['Burza', 'rain'], 96: ['Burza', 'rain'], 99: ['Burza', 'rain'],
    };
    return m[code] || ['Częściowe zachmurzenie', 'partly'];
  }

  // ---------- CLOCK ----------
  let TZ = 'Europe/Warsaw';
  function pad(n) { return String(n).padStart(2, '0'); }
  function tick() {
    const now = new Date();
    let hh, mm, ss, weekday, day, month;
    try {
      const parts = new Intl.DateTimeFormat('pl-PL', {
        timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        weekday: 'long', day: 'numeric', month: 'long',
      }).formatToParts(now);
      const get = (t) => (parts.find((p) => p.type === t) || {}).value || '';
      hh = get('hour'); mm = get('minute'); ss = get('second');
      weekday = get('weekday'); day = get('day'); month = get('month');
    } catch (e) {
      hh = pad(now.getHours()); mm = pad(now.getMinutes()); ss = pad(now.getSeconds());
    }
    if (hh === '24') hh = '00';
    const hm = `${hh}:${mm}`;
    set('topClock', hm); set('topClockSec', ':' + ss);
    set('bigClock', hm); set('bigClockSec', ss);
    if (weekday) { const ds = weekday.charAt(0).toUpperCase() + weekday.slice(1) + `, ${day} ${month}`; set('bigDate', ds); set('topDate', ds); set('todayDateSub', ds); }
  }
  function set(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  function setHtml(id, v) { const el = document.getElementById(id); if (el) el.innerHTML = v; }

  // ---------- HOURLY FORECAST (mini chart, every 3h) ----------
  function renderHours(d) {
    const host = document.getElementById('wxHours');
    if (!host || !d.hourly || !d.hourly.time) return;
    const times = d.hourly.time, temps = d.hourly.temperature_2m || [], pops = d.hourly.precipitation_probability || [], codes = d.hourly.weather_code || [];
    const now = new Date();
    let start = 0;
    for (let i = 0; i < times.length; i++) { if (new Date(times[i]) >= now) { start = i; break; } }
    const pts = [];
    for (let k = 0; k < 8; k++) { const i = start + k * 3; if (i >= temps.length) break; pts.push({ t: temps[i], p: pops[i] || 0, c: codes[i], time: times[i] }); }
    if (pts.length < 2) return;
    const mn = Math.min.apply(null, pts.map((p) => p.t)), mx = Math.max.apply(null, pts.map((p) => p.t));
    const span = Math.max(1, mx - mn);
    host.innerHTML = pts.map((p) => {
      const hh = new Date(p.time).getHours();
      const barH = 8 + Math.round(((p.t - mn) / span) * 28);
      const rain = Math.max(0, Math.min(100, Math.round(p.p)));
      return '<div class="wx-h"><div class="wx-t tnum">' + Math.round(p.t) + '°</div>' +
        '<div class="wx-bar"><i style="height:' + barH + 'px"></i></div>' +
        '<div class="wx-rain" style="opacity:' + (rain > 5 ? 0.4 + rain / 100 * 0.6 : 0) + '">' + (rain > 5 ? rain + '%' : '') + '</div>' +
        '<div class="wx-hh">' + pad(hh) + '</div></div>';
    }).join('');
  }

  // ---------- WEATHER FETCH ----------
  function windDir(d) { const dirs=['N','NE','E','SE','S','SW','W','NW']; return dirs[Math.round((d||0)/45)%8]; }
  async function loadWeather(lat, lon, label) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,windspeed_10m,winddirection_10m` +
        `&hourly=temperature_2m,precipitation_probability,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('weather');
      const d = await res.json();
      const c = d.current;
      const [cond, icon] = decodeWmo(c.weather_code, c.is_day === 1);
      const t = Math.round(c.temperature_2m);
      set('wTemp', t);
      set('topTemp', t + '°');
      set('wCond', cond);
      set('wFeels', Math.round(c.apparent_temperature) + '°');
      set('wHum', Math.round(c.relative_humidity_2m) + '%');
      if (d.daily) set('wHiLo', `${Math.round(d.daily.temperature_2m_max[0])}° / ${Math.round(d.daily.temperature_2m_min[0])}°`);
      set('wWindSpeed', Math.round(c.windspeed_10m || 0) + ' km/h');
      set('wWindDir', windDir(c.winddirection_10m || 0));
      renderHours(d);
      setHtml('weatherIc', ICONS[icon]);
      setHtml('topWeatherIc', ICONS[icon]);
      if (d.timezone) {
        TZ = d.timezone;
        set('bigTz', d.timezone.replace('/', ' / ').replace('_', ' '));
        tick();
      }
      if (label) { set('topLoc', label); set('locPillText', label); }
    } catch (e) {
      // keep static fallback already in markup
    }
  }

  async function reverseGeocode(lat, lon) {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pl`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      const city = d.city || d.locality || d.principalSubdivision || '';
      const cc = d.countryCode || '';
      return { short: city || 'Tutaj', pill: city ? `${city}, ${cc}` : 'Wykryto' };
    } catch (e) { return null; }
  }

  function initWeather() {
    const KRK = { lat: 50.0647, lon: 19.9450 };
    // default render with icon
    setHtml('weatherIc', ICONS.partly);
    setHtml('topWeatherIc', ICONS.partly);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const geo = await reverseGeocode(latitude, longitude);
          loadWeather(latitude, longitude, geo ? geo.short : null);
          if (geo) set('locPillText', geo.pill);
        },
        () => loadWeather(KRK.lat, KRK.lon, 'Kraków'),
        { timeout: 8000, maximumAge: 600000 }
      );
    } else {
      loadWeather(KRK.lat, KRK.lon, 'Kraków');
    }
  }

  // ---------- HABITS & ROUTINES (editable) ----------
  const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>';
  const FLAME_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c2 3 4 4.5 4 8a4 4 0 11-8 0c0-1.2.4-2.2 1-3 .3 1 1 1.6 1.8 1.8C10.5 8 11 5 12 3z"/></svg>';

  const HABIT_CATS = ['Regeneracja', 'Dieta', 'Ruch', 'Umysł', 'Sen', 'Skupienie', 'Rutyna', 'Praca', 'Finanse'];
  const HABIT_RECUR = [
    ['daily', 'Codziennie'],
    ['weekdays', 'W dni robocze'],
    ['weekends', 'W weekendy'],
    ['weekly', 'Co tydzień'],
    ['monthly', 'Co miesiąc']
  ];
  function recurLabel(v) { const r = HABIT_RECUR.find((x) => x[0] === v); return r ? r[1] : 'Codziennie'; }

  function initStartHabits() {
    const list = document.getElementById('habitList');
    if (!list || !window.EditList) return;
    function recalc(data) {
      const done = data.filter((h) => h.done).length;
      const total = data.length;
      set('habitCount', `${done} / ${total}`);
      set('hbPct', total ? Math.round((done / total) * 100) : 0);
      const arc = document.getElementById('hbArc');
      if (arc) { const C = 2 * Math.PI * 43; arc.style.strokeDashoffset = total ? C * (1 - done / total) : C; }
    }

    function closeEditor() { const ex = list.querySelector('.habit-editor'); if (ex) ex.remove(); }

    function openEditor(h, row, helpers) {
      closeEditor();
      if (!h) return;
      const ed = document.createElement('div');
      ed.className = 'habit-editor';
      const catOpts = HABIT_CATS.map((c) => '<option value="' + c + '"' + (c === h.cat ? ' selected' : '') + '>' + c + '</option>').join('');
      const recOpts = HABIT_RECUR.map(([v, lbl]) => '<option value="' + v + '"' + (v === (h.recur || 'daily') ? ' selected' : '') + '>' + lbl + '</option>').join('');
      ed.innerHTML =
        '<label class="he-field he-wide"><span class="he-lbl">Nazwa</span>' +
          '<input type="text" class="he-input" data-he="name" value="" /></label>' +
        '<div class="he-grid">' +
          '<label class="he-field"><span class="he-lbl">Kategoria</span>' +
            '<select class="he-select" data-he="cat">' + catOpts + '</select></label>' +
          '<label class="he-field"><span class="he-lbl">Powtarzalność</span>' +
            '<select class="he-select" data-he="recur">' + recOpts + '</select></label>' +
        '</div>' +
        '<label class="he-field he-wide"><span class="he-lbl">Cel</span>' +
          '<input type="text" class="he-input" data-he="goal" placeholder="np. 20 minut · 180 g · 10 000 kroków" value="" /></label>' +
        '<div class="he-actions">' +
          '<button type="button" class="he-btn ghost" data-he-act="cancel">Anuluj</button>' +
          '<button type="button" class="he-btn primary" data-he-act="save">Zapisz</button>' +
        '</div>';
      row.after(ed);
      ed.querySelector('[data-he="name"]').value = h.name || '';
      ed.querySelector('[data-he="goal"]').value = h.goal || '';
      const nameInput = ed.querySelector('[data-he="name"]');
      nameInput.focus(); nameInput.select();

      ed.addEventListener('click', (e) => e.stopPropagation());
      ed.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); save(); }
        if (e.key === 'Escape') { e.preventDefault(); closeEditor(); }
      });
      function save() {
        const nm = ed.querySelector('[data-he="name"]').value.trim();
        if (nm) h.name = nm;
        h.cat = ed.querySelector('[data-he="cat"]').value;
        h.recur = ed.querySelector('[data-he="recur"]').value;
        h.goal = ed.querySelector('[data-he="goal"]').value.trim();
        helpers.save();
        helpers.render();
      }
      ed.querySelector('[data-he-act="save"]').addEventListener('click', save);
      ed.querySelector('[data-he-act="cancel"]').addEventListener('click', closeEditor);
    }

    window.EditList({
      list: list,
      key: 'rootine.start.habits',
      rowClass: 'habit',
      rowClassFor: (h) => (h.done ? 'done' : ''),
      numericFields: ['streak'],
      seed: [
        { id: 1, name: 'Test stretching', cat: 'Regeneracja', recur: 'daily', goal: '15 min', streak: 21, done: true },
        { id: 2, name: 'Białko ≥ 180g', cat: 'Dieta', recur: 'daily', goal: '180 g', streak: 9, done: true },
        { id: 3, name: '10 000 kroków', cat: 'Ruch', recur: 'daily', goal: '10 000 kroków', streak: 34, done: true },
        { id: 4, name: 'Czytaj 20 minut', cat: 'Umysł', recur: 'daily', goal: '20 minut', streak: 6, done: false },
        { id: 5, name: 'Zgaś światło do 23:00', cat: 'Sen', recur: 'daily', goal: 'do 23:00', streak: 12, done: false },
        { id: 6, name: 'Bez ekranów po kolacji', cat: 'Świadomość', recur: 'weekdays', goal: '', streak: 3, done: false }
      ],
      rowHTML: (h, esc) => {
        const TOD = 3;
        const dots = Array.from({length: 7}, (_, i) => {
          if (i < TOD) return (h.streak || 0) > (TOD - i - 1) ? 1 : 0;
          if (i === TOD) return h.done ? 1 : 0;
          return 0;
        });
        const dotsHtml = '<div class="hab-dots">' + dots.map(function(d) { return '<i class="hd-dot' + (d ? ' on' : '') + '"></i>'; }).join('') + '</div>';
        return '<span class="check">' + CHECK_SVG + '</span>' +
          '<div class="info"><div class="n">' + esc(h.name) + '</div></div>' +
          '<span class="hab-cat">' + esc(h.cat) + '</span>' +
          dotsHtml +
          '<span class="streak">' + FLAME_SVG + '<span>' + h.streak + '</span></span>';
      },
      onToggle: (h, e, row) => { h.done = !h.done; row.classList.toggle('done'); return true; },
      onEdit: (h, row, helpers) => openEditor(h, row, helpers),
      afterChange: recalc,
      blank: (id) => ({ id: id, name: 'Nowy nawyk', cat: 'Rutyna', recur: 'daily', goal: '', streak: 0, done: false }),
      addLabel: 'Dodaj nawyk'
    });
  }

  // ---------- DIET CARD (editable targets · water · macros) ----------
  function initStartDiet() {
    const card = document.getElementById('dietCard');
    if (!card) return;
    const KEY = 'rootine.start.diet';
    const DEF = { eaten: 1420, goal: 2500, p: { v: 126, g: 180 }, c: { v: 142, g: 240 }, f: { v: 38, g: 70 }, water: 1600, waterGoal: 3000 };
    let s = loadDiet();
    let editing = false;
    const pctEl = document.getElementById('dietPct');
    const eatenEl = document.getElementById('dietEaten');
    const goalEl = document.getElementById('dietGoal');
    const leftEl = document.getElementById('dietLeft');
    const macrosEl = document.getElementById('dietMacros');
    const hydroEl = document.getElementById('dietHydro');
    const editBtn = document.getElementById('dietEdit');

    function loadDiet() { try { const o = JSON.parse(localStorage.getItem(KEY)); if (o && o.p) return o; } catch (e) {} return JSON.parse(JSON.stringify(DEF)); }
    function saveDiet() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
    function nf(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
    function lf(ml) { return (Math.round(ml / 100) / 10).toFixed(1).replace('.', ','); }
    function cleanInt(t, fb) { const n = parseInt(String(t).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? fb : n; }
    const MACROS = [['Białko', 'p', 'var(--acc-a)'], ['Węglowodany', 'c', 'var(--ev-blue)'], ['Tłuszcze', 'f', 'var(--acc-b)']];

    function renderRing() {
      const pct = s.goal ? Math.round((s.eaten / s.goal) * 100) : 0;
      if (pctEl) pctEl.textContent = Math.min(999, pct);
      if (eatenEl) { eatenEl.textContent = editing ? s.eaten : nf(s.eaten); eatenEl.contentEditable = editing ? 'true' : 'false'; eatenEl.classList.add('diet-val'); eatenEl.dataset.eaten = '1'; }
      if (goalEl) { goalEl.textContent = editing ? s.goal : nf(s.goal); goalEl.contentEditable = editing ? 'true' : 'false'; goalEl.classList.add('diet-goal'); goalEl.dataset.goal = '1'; }
      if (leftEl) leftEl.textContent = nf(Math.max(0, s.goal - s.eaten));
      const arc = document.getElementById('dietArc');
      if (arc) { const C = 263.9; arc.style.strokeDashoffset = C * (1 - Math.min(1, s.goal ? s.eaten / s.goal : 0)); }
    }
    function renderMacros() {
      macrosEl.innerHTML = MACROS.map(([lbl, key, col]) => {
        const m = s[key];
        const pct = m.g ? Math.min(100, Math.round((m.v / m.g) * 100)) : 0;
        const vH = editing ? '<span class="diet-val" contenteditable="true" data-v="' + key + '">' + m.v + '</span>' : m.v;
        const gH = editing ? '<span class="diet-goal" contenteditable="true" data-g="' + key + '">' + m.g + '</span>' : m.g;
        return '<div class="macro"><div class="mh"><span class="k">' + lbl + '</span>' +
          '<span class="v tnum">' + vH + ' / ' + gH + ' g</span></div>' +
          '<div class="track"><i style="width:' + pct + '%;background:' + col + '"></i></div></div>';
      }).join('');
    }
    function renderHydro() {
      const drops = Math.max(1, Math.min(16, Math.ceil(s.waterGoal / 250)));
      const filled = Math.min(drops, Math.round(s.water / 250));
      let d = '';
      for (let i = 0; i < drops; i++) d += '<i class="' + (i < filled ? 'on' : '') + '" data-i="' + i + '"></i>';
      hydroEl.innerHTML =
        '<div class="hydro-row"><div class="drops" id="dietDrops">' + d + '</div>' +
        '<div class="txt"><b>' + lf(s.water) + '</b> / <span class="wgoal" id="waterGoalField" contenteditable="true" data-wg="1" title="Kliknij, aby edytować cel">' + lf(s.waterGoal) + '</span> L</div></div>' +
        '<div class="bev">' +
          '<div class="bev-group"><span class="bev-lbl">Woda</span>' +
            '<button class="wbtn" data-add="250" type="button">250 ml</button>' +
            '<button class="wbtn" data-add="500" type="button">500 ml</button>' +
            '<span class="wcustom"><input type="number" inputmode="numeric" placeholder="ml" data-cust="1" aria-label="Własna ilość wody"><button class="wmini" data-addcust="1" type="button">Dodaj</button></span></div>' +
          '<div class="bev-group"><span class="bev-lbl">Kawa</span>' +
            '<button class="wbtn" data-add="200" type="button">Cappuccino 200 ml</button>' +
            '<button class="wbtn" data-add="120" type="button">Czarna kawa 120 ml</button></div>' +
          '<div class="bev-group"><span class="bev-lbl">Inny płyn</span>' +
            '<button class="wbtn" data-add="250" type="button">250 ml</button>' +
            '<span class="wcustom"><input type="number" inputmode="numeric" placeholder="ml" data-cust="2" aria-label="Własna ilość płynu"><button class="wmini" data-addcust="2" type="button">Dodaj</button></span></div>' +
        '</div>';
    }
    function commitWaterGoal(el) {
      const L = parseFloat(String(el.textContent).replace(',', '.'));
      if (!isNaN(L) && L > 0) { s.waterGoal = Math.round(L * 1000); saveDiet(); }
      renderHydro();
    }
    function render() { renderRing(); renderMacros(); renderHydro(); }

    function readEdits() {
      card.querySelectorAll('[data-eaten]').forEach((el) => { s.eaten = cleanInt(el.textContent, s.eaten); });
      card.querySelectorAll('[data-goal]').forEach((el) => { s.goal = Math.max(1, cleanInt(el.textContent, s.goal)); });
      card.querySelectorAll('[data-v]').forEach((el) => { s[el.dataset.v].v = cleanInt(el.textContent, s[el.dataset.v].v); });
      card.querySelectorAll('[data-g]').forEach((el) => { s[el.dataset.g].g = Math.max(1, cleanInt(el.textContent, s[el.dataset.g].g)); });
      card.querySelectorAll('[data-wg]').forEach((el) => { const L = parseFloat(String(el.textContent).replace(',', '.')); if (!isNaN(L) && L > 0) s.waterGoal = Math.round(L * 1000); });
    }

    editBtn.addEventListener('click', () => {
      if (editing) { readEdits(); editing = false; editBtn.textContent = 'Cele'; editBtn.classList.remove('on'); saveDiet(); render(); }
      else { editing = true; editBtn.textContent = 'Zapisz'; editBtn.classList.add('on'); render(); const f = card.querySelector('[data-eaten]'); if (f) { f.focus(); try { document.getSelection().selectAllChildren(f); } catch (e) {} } }
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && editing) { e.preventDefault(); editBtn.click(); }
    });
    hydroEl.addEventListener('click', (e) => {
      const drop = e.target.closest('#dietDrops i');
      if (drop) { const i = parseInt(drop.dataset.i, 10); const lvl = (i + 1) * 250; s.water = (s.water === lvl) ? i * 250 : lvl; saveDiet(); renderHydro(); return; }
      const add = e.target.closest('[data-add]');
      if (add) { s.water += parseInt(add.dataset.add, 10) || 0; saveDiet(); renderHydro(); return; }
      const ac = e.target.closest('[data-addcust]');
      if (ac) { const inp = ac.closest('.wcustom').querySelector('input'); const v = parseInt(inp.value, 10); if (!isNaN(v) && v !== 0) { s.water = Math.max(0, s.water + v); saveDiet(); renderHydro(); } return; }
    });
    hydroEl.addEventListener('keydown', (e) => {
      const wg = e.target.closest && e.target.closest('#waterGoalField');
      if (wg && e.key === 'Enter') { e.preventDefault(); wg.blur(); }
    });
    hydroEl.addEventListener('focusout', (e) => {
      const wg = e.target.closest && e.target.closest('#waterGoalField');
      if (wg) { const el = wg; setTimeout(() => commitWaterGoal(el), 120); }
    });

    render();
  }

  // ---------- FINANCE PULSE (editable) ----------
  function initStartFinance() {
    const card = document.getElementById('finCard');
    if (!card) return;
    const head = card.querySelector('.card-head');
    card.innerHTML = '';
    card.appendChild(head);
    const body = document.createElement('div');
    body.id = 'finBody';
    card.appendChild(body);
    const editBtn = document.getElementById('finEdit');
    const KEY = 'rootine.start.finance';
    const DEF = {
      account: 24860, savings: 38500, trend: 3.1,
      payouts: [
        { id: 1, label: 'Wpłata – Finanseq', days: 9, amount: 11200, recur: 'monthly' },
        { id: 2, label: 'Wyjazd do Japonii', days: 2, amount: 3600, recur: 'monthly' }
      ],
      income: 11800, expenses: 7340, mortgage: 312000, loan: 18400, debt: 4100, lent: 2500
    };
    let s = loadFin();
    let editing = false;
    let payUid = (s.payouts || []).reduce((m, p) => Math.max(m, +p.id || 0), 0) + 1;
    function loadFin() {
      try {
        const o = JSON.parse(localStorage.getItem(KEY));
        if (o && o.account != null) {
          if (!Array.isArray(o.payouts)) {
            // migrate from the old fixed pay1*/pay2* shape
            o.payouts = [];
            if (o.pay1a != null) o.payouts.push({ id: 1, label: 'Wypłata', days: o.pay1d || 0, amount: o.pay1a, recur: 'monthly' });
            if (o.pay2a != null) o.payouts.push({ id: 2, label: 'Druga wypłata', days: o.pay2d || 0, amount: o.pay2a, recur: 'monthly' });
            if (!o.payouts.length) o.payouts = JSON.parse(JSON.stringify(DEF.payouts));
          }
          return o;
        }
      } catch (e) {}
      return JSON.parse(JSON.stringify(DEF));
    }
    function esc(t) { return String(t == null ? '' : t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
    const FIN_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>';
    const FIN_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
    function saveFin() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
    function nf(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
    function ci(t, fb) { const n = parseInt(String(t).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? fb : n; }
    function fe(key, val) { return '<span data-fe="' + key + '"' + (editing ? ' contenteditable="true" class="fe-edit"' : '') + '>' + val + '</span>'; }
    function fp(id, field, val) { return '<span data-pe="' + id + ':' + field + '"' + (editing ? ' contenteditable="true" class="fe-edit"' : '') + '>' + val + '</span>'; }
    function row(col, label, sign, valHtml) { return '<div class="fin-row"><span class="lbl"><span class="tag" style="background:' + col + '"></span>' + label + '</span><span class="val tnum">' + sign + valHtml + '</span></div>'; }
    const PAYOUT_RECUR = { monthly: 'Miesięcznie', daily: 'Codziennie' };
    function payoutChip(p, i) {
      const cls = 'salary-chip payout' + (i > 0 ? ' second' : '');
      const rl = PAYOUT_RECUR[p.recur] || PAYOUT_RECUR.monthly;
      const recurEl = editing
        ? '<button type="button" class="recur-toggle" data-recur="' + p.id + '" title="Przełącz powtarzalność">' + rl + '</button>'
        : '<span class="recur-badge">' + rl + '</span>';
      const del = editing ? '<button type="button" class="payout-del" data-del="' + p.id + '" aria-label="Usuń wypłatę">' + FIN_TRASH + '</button>' : '';
      return '<div class="' + cls + '" data-pid="' + p.id + '">' +
        '<div class="pc-main"><span class="l">' + fp(p.id, 'label', esc(p.label)) + ' · za ' + fp(p.id, 'days', p.days) + ' dni</span>' + recurEl + '</div>' +
        '<span class="r tnum">+' + fp(p.id, 'amount', editing ? p.amount : nf(p.amount)) + ' <small>PLN</small></span>' +
        del + '</div>';
    }
    function render() {
      const tot = (s.debt + s.lent) || 1;
      const dPct = Math.round(s.debt / tot * 100), lPct = 100 - dPct;
      const DOC_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
      function flRow(icCls, name, ctx, sign, valHtml) {
        const ac = sign === '+' ? 'positive' : sign === '-' ? 'negative' : '';
        const sg = sign === '+' ? '+' : sign === '-' ? '\u2212' : '';
        return '<div class="fl-row"><span class="fl-ic ' + icCls + '">' + DOC_IC + '</span>' +
          '<div class="fl-info"><span class="fl-name">' + name + '</span>' +
          (ctx ? '<span class="fl-ctx">' + ctx + '</span>' : '') + '</div>' +
          '<span class="fl-amt tnum ' + ac + '">' + sg + valHtml + '</span></div>';
      }
      const payRows = s.payouts.map((p) => {
        const delBtn = editing ? '<button type="button" class="fl-del payout-del" data-del="' + p.id + '">' + FIN_TRASH + '</button>' : '';
        return '<div class="fl-row"><span class="fl-ic green">' + DOC_IC + '</span>' +
          '<div class="fl-info"><span class="fl-name">' + fp(p.id, 'label', esc(p.label)) + '</span>' +
          '<span class="fl-ctx">za ' + fp(p.id, 'days', p.days) + ' dni</span></div>' +
          '<span class="fl-amt tnum positive">+' + fp(p.id, 'amount', editing ? p.amount : nf(p.amount)) + ' z\u0142</span>' +
          delBtn + '</div>';
      }).join('');
      const addBtn = editing ? '<button type="button" class="payout-add" id="payoutAdd">' + FIN_PLUS + 'Dodaj wp\u0142at\u0119</button>' : '';
      body.innerHTML =
        '<div class="fin-bal"><span class="amt tnum">' + fe('account', editing ? s.account : nf(s.account)) + '</span><span class="cur"> z\u0142</span></div>' +
        '<div class="fin-sub">Oszcz\u0119dno\u015bci: <b class="tnum">' + fe('savings', editing ? s.savings : nf(s.savings)) + '</b> z\u0142</div>' +
        '<div class="fin-ledger">' + payRows +
          flRow('clay', 'Wydatki w czerwcu', '', '-', fe('expenses', editing ? s.expenses : nf(s.expenses)) + ' z\u0142') +
          flRow('grey', 'Hipoteka \u2013 pozosta\u0142o', '', '', fe('mortgage', editing ? s.mortgage : nf(s.mortgage)) + ' z\u0142') +
          flRow('grey', 'Kredyt got\u00f3wkowy', '', '', fe('loan', editing ? s.loan : nf(s.loan)) + ' z\u0142') +
        '</div>' + addBtn +
        '<div class="split"><div class="bar"><i style="width:' + dPct + '%;background:var(--acc-b)"></i><i style="width:' + lPct + '%;background:var(--acc-a)"></i></div>' +
        '<div class="legend"><div>Tw\u00f3j d\u0142ug <b class="tnum">' + fe('debt', editing ? s.debt : nf(s.debt)) + '</b> z\u0142</div><div><b class="tnum">' + fe('lent', editing ? s.lent : nf(s.lent)) + '</b> z\u0142 po\u017cyczono</div></div></div>';
    }
    function readEdits() {
      body.querySelectorAll('[data-fe]').forEach((el) => {
        const k = el.dataset.fe;
        if (k === 'trend') { const v = parseFloat(String(el.textContent).replace(',', '.')); if (!isNaN(v)) s.trend = v; }
        else s[k] = ci(el.textContent, s[k]);
      });
      body.querySelectorAll('[data-pe]').forEach((el) => {
        const parts = el.dataset.pe.split(':');
        const p = s.payouts.find((x) => String(x.id) === parts[0]);
        if (!p) return;
        const f = parts[1];
        if (f === 'label') { const v = el.textContent.trim(); if (v) p.label = v; }
        else if (f === 'days') { p.days = ci(el.textContent, p.days); }
        else if (f === 'amount') { p.amount = ci(el.textContent, p.amount); }
      });
    }
    body.addEventListener('click', (e) => {
      const rt = e.target.closest('.recur-toggle');
      if (rt) {
        readEdits();
        const p = s.payouts.find((x) => String(x.id) === rt.dataset.recur);
        if (p) { p.recur = p.recur === 'daily' ? 'monthly' : 'daily'; saveFin(); render(); }
        return;
      }
      const del = e.target.closest('.payout-del');
      if (del) {
        readEdits();
        s.payouts = s.payouts.filter((x) => String(x.id) !== del.dataset.del);
        saveFin(); render();
        return;
      }
      const add = e.target.closest('#payoutAdd');
      if (add) {
        readEdits();
        s.payouts.push({ id: payUid++, label: 'Nowa wypłata', days: 30, amount: 0, recur: 'monthly' });
        saveFin(); render();
        const nu = body.querySelector('.payout:last-of-type [data-pe]');
        if (nu) { nu.focus(); try { document.getSelection().selectAllChildren(nu); } catch (err) {} }
        return;
      }
    });
    editBtn.addEventListener('click', () => {
      if (editing) { readEdits(); editing = false; editBtn.textContent = 'Edytuj'; editBtn.classList.remove('on'); saveFin(); render(); }
      else { editing = true; editBtn.textContent = 'Zapisz'; editBtn.classList.add('on'); render(); const f = body.querySelector('[data-fe]'); if (f) { f.focus(); try { document.getSelection().selectAllChildren(f); } catch (e) {} } }
    });
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' && editing) { e.preventDefault(); editBtn.click(); } });
    render();
  }

  // ---------- TODAY'S GOALS (editable · shared with Cele) ----------
  function initTodayGoals() {
    const list = document.getElementById('todoList');
    if (!list || !window.EditList) return;
    const CAT_COLORS = {
      'Rutyna': 'var(--ev-green)', 'Trening': 'var(--ev-clay)',
      'Praca': 'var(--ev-blue)', 'Regeneracja': 'var(--acc-a)',
      'Cel': 'var(--ev-lav)', 'Umysł': 'var(--ev-lav)', 'Sen': 'var(--ev-blue)'
    };
    function recount(data) {
      const el = document.getElementById('goalCount'); if (el) el.textContent = data.filter((t) => t.done).length + ' / ' + data.length;
      const tc = document.getElementById('todayTaskCount'); if (tc) tc.textContent = data.length;
    }
    const api = window.EditList({
      list: list,
      key: 'rootine.today.goals',
      rowClass: 'todo',
      rowClassFor: (t) => (t.done ? 'done' : ''),
      seed: [
        { id: 1, name: 'Poranna mobilność + koktajl białkowy', cat: 'Rutyna', time: '07:00', done: true },
        { id: 2, name: 'Trening push — klatka i barki', cat: 'Trening', time: '16:00', done: false },
        { id: 3, name: 'Wyślij fakturę za integrację Finanteq', cat: 'Praca', time: '16:00', done: false },
        { id: 4, name: 'Rehabilitacja — ćwiczenia z gumą na bark, 10 min', cat: 'Regeneracja', time: '20:30', done: false },
        { id: 5, name: 'Ukochać Bebisia', cat: 'Cel', time: '', fav: true, done: false }
      ],
      rowHTML: (t, esc) => {
        const col = CAT_COLORS[t.cat] || 'var(--ink-4)';
        const catHtml = '<span class="todo-cat"><i style="background:' + col + '"></i>' + esc(t.cat) + '</span>';
        const rightHtml = t.time ? '<span class="todo-time tnum">' + esc(t.time) + '</span>' : (t.fav ? '<span class="todo-fav">♥</span>' : '');
        return '<span class="check">' + CHECK_SVG + '</span>' +
          '<span class="t ed-field" data-f="name">' + esc(t.name) + '</span>' +
          catHtml + rightHtml;
      },
      onToggle: (t, e, row) => { t.done = !t.done; row.classList.toggle('done'); return true; },
      afterChange: recount,
      blank: (id) => ({ id: id, name: 'Nowy cel', cat: 'Cel', time: '', done: false })
    });
    const btn = document.getElementById('captureBtn');
    const input = document.getElementById('goalInput');
    if (btn && input) {
      const addGoal = () => { const v = input.value.trim(); if (!v) { input.focus(); return; } api.add({ name: v, cat: 'Cel', time: '' }); input.value = ''; };
      btn.addEventListener('click', addGoal);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addGoal(); } });
    }
    const addBtn = document.getElementById('addTaskBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        api.add({ name: 'Nowy cel', cat: 'Cel', time: '' });
        setTimeout(() => {
          const items = list.querySelectorAll('.todo');
          const last = items[items.length - 1];
          if (last) { const f = last.querySelector('.t'); if (f) { f.focus(); try { document.getSelection().selectAllChildren(f); } catch(e) {} } }
        }, 60);
      });
    }
  }

  function initInteractions() {
    document.addEventListener('click', (e) => {
      // focus range segmented
      const segBtn = e.target.closest('.seg button');
      if (segBtn) {
        segBtn.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
        segBtn.classList.add('on');
      }
      const cv = e.target.closest('#calViews button');
      if (cv) { calView = cv.getAttribute('data-cv'); renderCalendar(); }
    });
  }

  // ---------- BOOT ----------
  function boot() {
    renderCalendar();
    tick();
    setInterval(tick, 1000);
    initWeather();
    initInteractions();
    initStartHabits();
    initStartDiet();
    initStartFinance();
    initTodayGoals();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
