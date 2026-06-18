/* ============================================================
   ROOTINE OS — GOALS tab logic
   Roadmap (Gantt) · task board · learning plan · habit grids
   ============================================================ */
(function () {
  'use strict';
  if (!document.getElementById('roadmap')) return; // only on Goals page

  const $ = (id) => document.getElementById(id);
  const chk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>';
  const TODAY_MONTH = 5; // June (0-indexed) — fraction below
  const TODAY_FRAC = 5 + 16 / 30; // ~June 17

  // ---------- ROADMAP ----------
  // months are 0..11; bars span [start,end] in month units; ms = milestone month positions
  let calYear = 2026, calMonth = 5, selDay = null;

  const GOALS = [
    { name: 'Wyciskanie 100 kg', kind: 'k-clay',  start: 0,   end: 9,    prog: 0.82, ms: [1.5, 4, 6.5, 9],  cat: 'Siła',     deadline: 'wrz', value: '82 kg',   target: '100 kg'     },
    { name: 'System Design',     kind: 'k-blue',  start: 1,   end: 11,   prog: 0.58, ms: [3, 6.2, 9, 11],   cat: 'Nauka',    deadline: 'lis', value: '7/12',    target: '12 modułów' },
    { name: 'Fundusz awar. 30k', kind: 'k-jade',  start: 0,   end: 11.5, prog: 0.60, ms: [3, 7, 11.5],      cat: 'Finanse',  deadline: 'gru', value: '18k zł',  target: '30k zł'     },
    { name: 'Półmaraton <1:45',  kind: 'k-lav',   start: 2,   end: 9.5,  prog: 0.71, ms: [4, 6.7, 9.5],     cat: 'Bieganie', deadline: 'paź', value: '1:46:20', target: '<1:45'      },
    { name: '24 książki',        kind: 'k-green', start: 0,   end: 11.5, prog: 0.41, ms: [3, 7.5, 11.5],    cat: 'Umysł',    deadline: 'gru', value: '10/24',   target: '24 książki' },
  ];
  const MONTHS = ['S', 'L', 'M', 'K', 'M', 'C', 'L', 'S', 'W', 'P', 'L', 'G'];
  const QSTART = [0, 3, 6, 9];

  function renderRoadmap() {
    const host = $('roadmap');
    let months = '<div class="rmap-months">';
    MONTHS.forEach((m, i) => {
      months += `<div class="${QSTART.includes(i) ? 'q' : ''}">${m}</div>`;
    });
    months += '</div>';

    let rows = '';
    GOALS.forEach((g) => {
      const leftPct = (g.start / 12) * 100;
      const widthPct = ((g.end - g.start) / 12) * 100;
      // milestone dots positioned relative to the bar
      let dots = '';
      g.ms.forEach((m, idx) => {
        const within = ((m - g.start) / (g.end - g.start)) * 100;
        const done = (m - g.start) / (g.end - g.start) <= g.prog + 0.001;
        dots += `<span class="rmap-ms ${done ? 'done' : ''}" style="left:${within}%"></span>`;
      });
      rows += `<div class="rmap-row ${g.kind}">
        <div class="rmap-label">
          <div class="n"><span class="pin"></span>${g.name}</div>
          <div class="rmap-lsub">${g.cat} · ${g.deadline}</div>
        </div>
        <div class="rmap-track">
          <div class="rmap-bar" style="left:${leftPct}%; width:${widthPct}%">
            <div class="rmap-fill" style="width:${g.prog * 100}%"></div>
            ${dots}
          </div>
        </div>
        <div class="rmap-stat">
          <div class="rmap-pct">${Math.round(g.prog * 100)}%</div>
          <div class="rmap-val">${g.value}</div>
        </div>
      </div>`;
    });

    // today line — positioned over the track area (which starts after the 118px label)
    const todayPct = (TODAY_FRAC / 12) * 100;
    const todayLine = `<div class="rmap-today" style="left:calc(118px + ${todayPct}% * (100% - 118px) / 100%)"></div>`;

    host.innerHTML = months + rows + todayLine;
    // place today line precisely using the track geometry
    positionToday();
  }

  function positionToday() {
    const host = $('roadmap');
    const line = host.querySelector('.rmap-today');
    const track = host.querySelector('.rmap-track');
    if (!line || !track) return;
    const hostRect = host.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const x = (trackRect.left - hostRect.left) + (TODAY_FRAC / 12) * trackRect.width;
    line.style.left = x + 'px';
  }

  function renderGoalsStrip() {
    const host = $('roadmapStrip');
    if (!host) return;
    host.innerHTML = GOALS.map(g => `<div class="rgs-cell ${g.kind}">
      <div class="rgs-n">${g.cat}</div>
      <div class="rgs-pct tnum">${Math.round(g.prog * 100)}<small>%</small></div>
      <div class="rgs-bar"><i style="width:${g.prog * 100}%"></i></div>
      <div class="rgs-v">${g.value} <span class="rgs-t">/ ${g.target}</span></div>
    </div>`).join('');
  }

  // ---------- CALENDAR DATA ----------
  const TASK_CALENDAR = {
    0: { 8:[{kind:'k-clay',l:'Trening'},{kind:'k-green',l:'Czytanie'}], 12:[{kind:'k-jade',l:'Budżet sty'}], 15:[{kind:'k-clay',l:'Trening'},{kind:'k-lav',l:'Bieg'}], 20:[{kind:'k-jade',l:'ZUS'}], 22:[{kind:'k-green',l:'Czytanie'}], 25:[{kind:'k-clay',l:'Trening'}], 28:[{kind:'k-blue',l:'SQL · joiny'}] },
    1: { 3:[{kind:'k-clay',l:'Trening'},{kind:'k-blue',l:'Python ETL'}], 7:[{kind:'k-lav',l:'Bieg 12km'}], 10:[{kind:'k-clay',l:'Trening'}], 14:[{kind:'k-green',l:'Czytanie'}], 17:[{kind:'k-clay',l:'Trening'},{kind:'k-jade',l:'Auto-przelew'}], 20:[{kind:'k-jade',l:'ZUS'}], 24:[{kind:'k-blue',l:'NumPy workshop'}], 28:[{kind:'k-clay',l:'Trening'},{kind:'k-lav',l:'Bieg 14km'}] },
    2: { 2:[{kind:'k-clay',l:'Trening'}], 5:[{kind:'k-blue',l:'Airflow DAGs'},{kind:'k-green',l:'Czytanie'}], 10:[{kind:'k-lav',l:'Bieg 15km'},{kind:'k-clay',l:'Trening'}], 15:[{kind:'k-jade',l:'Budżet'},{kind:'k-blue',l:'System Design'}], 20:[{kind:'k-jade',l:'ZUS'},{kind:'k-clay',l:'Trening'}], 25:[{kind:'k-lav',l:'Bieg tempowy'},{kind:'k-green',l:'Czytanie'}], 28:[{kind:'k-clay',l:'Trening'}] },
    3: { 1:[{kind:'k-lav',l:'Bieg 16km'},{kind:'k-blue',l:'dbt modele'}], 5:[{kind:'k-clay',l:'Trening'}], 8:[{kind:'k-clay',l:'Trening'},{kind:'k-jade',l:'Auto-przelew'}], 12:[{kind:'k-lav',l:'Bieg 17km'},{kind:'k-green',l:'Czytanie'}], 15:[{kind:'k-clay',l:'Trening'},{kind:'k-blue',l:'Kafka tematy'}], 20:[{kind:'k-jade',l:'ZUS'},{kind:'k-lav',l:'Bieg interwały'}], 22:[{kind:'k-clay',l:'Trening'}], 26:[{kind:'k-blue',l:'AWS stack'},{kind:'k-green',l:'Czytanie'}], 29:[{kind:'k-lav',l:'Bieg 18km'}] },
    4: { 3:[{kind:'k-clay',l:'Trening'},{kind:'k-lav',l:'Bieg'}], 6:[{kind:'k-blue',l:'CAP Theorem'},{kind:'k-jade',l:'Fundusz 15k'}], 10:[{kind:'k-clay',l:'Trening'},{kind:'k-green',l:'Czytanie'}], 13:[{kind:'k-lav',l:'Bieg 18km'}], 17:[{kind:'k-clay',l:'Trening'},{kind:'k-blue',l:'Cache strategie'}], 20:[{kind:'k-jade',l:'ZUS'},{kind:'k-lav',l:'Interwały'}], 24:[{kind:'k-clay',l:'Trening'},{kind:'k-green',l:'Czytanie'}], 27:[{kind:'k-blue',l:'Bazy w skali'},{kind:'k-lav',l:'Bieg 19km'}], 31:[{kind:'k-clay',l:'Trening'}] },
    5: { 2:[{kind:'k-blue',l:'System Design'},{kind:'k-clay',l:'Trening'}], 3:[{kind:'k-jade',l:'Auto-przelew'}], 5:[{kind:'k-lav',l:'Bieg 16km'},{kind:'k-green',l:'Czytanie'}], 7:[{kind:'k-clay',l:'Trening'}], 9:[{kind:'k-blue',l:'Mock interview'},{kind:'k-lav',l:'Interwały 5×1km'}], 10:[{kind:'k-clay',l:'Trening'},{kind:'k-green',l:'Czytanie'},{kind:'k-jade',l:'Budżet'}], 12:[{kind:'k-lav',l:'Bieg 17km'}], 14:[{kind:'k-lav',l:'Długi bieg 16km'},{kind:'k-green',l:'Czytanie'}], 15:[{kind:'k-clay',l:'Trening'}], 16:[{kind:'k-blue',l:'Sharding · lekcja 1-2'}], 17:[{kind:'k-clay',l:'Trening'},{kind:'k-lav',l:'Bieg tempowy'}], 18:[{kind:'k-blue',l:'Sharding lekcje 3+4'},{kind:'k-clay',l:'Top seria 85kg×5'}], 19:[{kind:'k-jade',l:'ZUS 1600zł'},{kind:'k-lav',l:'Interwały 6×1km'}], 20:[{kind:'k-clay',l:'Trening'},{kind:'k-jade',l:'Zaliczka PIT'}], 21:[{kind:'k-lav',l:'Długi bieg 18km'},{kind:'k-green',l:'Czytanie'}], 23:[{kind:'k-blue',l:'Kolejki komunikatów'}], 24:[{kind:'k-clay',l:'Trening'}], 25:[{kind:'k-lav',l:'Bieg tempowy'},{kind:'k-jade',l:'VAT-7 JPK'}], 26:[{kind:'k-blue',l:'Mock interview'},{kind:'k-clay',l:'Trening'}], 28:[{kind:'k-green',l:'Czytanie'},{kind:'k-lav',l:'Długi bieg'}], 30:[{kind:'k-clay',l:'Trening'},{kind:'k-blue',l:'Moduł kolejek'}] },
  };

  const YEAR_STATS = {
    2026: [
      {tasks:18,done:16,kinds:['k-clay','k-jade','k-green']},
      {tasks:22,done:20,kinds:['k-clay','k-blue','k-lav','k-green']},
      {tasks:19,done:17,kinds:['k-clay','k-blue','k-jade','k-lav']},
      {tasks:24,done:21,kinds:['k-clay','k-lav','k-blue','k-green']},
      {tasks:26,done:22,kinds:['k-clay','k-lav','k-blue','k-jade','k-green']},
      {tasks:21,done:11,kinds:['k-clay','k-blue','k-jade','k-lav','k-green']},
      {tasks:0,done:0,kinds:[]},{tasks:0,done:0,kinds:[]},{tasks:0,done:0,kinds:[]},
      {tasks:0,done:0,kinds:[]},{tasks:0,done:0,kinds:[]},{tasks:0,done:0,kinds:[]},
    ],
  };

  // ---------- TASKS ----------
  const TASKS = {
    today: [
      { goal: 'Wyciskanie 100 kg', kind: 'k-clay', items: [
        { t: 'Trening push — top seria 85kg × 5', pri: 'hi', subs: [1, 2], due: 'Dziś', dk: 'today', done: false },
      ]},
      { goal: 'System Design', kind: 'k-blue', items: [
        { t: 'Sharding DB — lekcje 3 i 4', pri: 'hi', subs: [0, 2], due: '18:00', dk: 'today', done: false },
        { t: 'Notatki o consistent hashing', pri: 'md', subs: null, due: 'Dziś', dk: 'today', done: true },
      ]},
      { goal: 'Fundusz awaryjny', kind: 'k-jade', items: [
        { t: 'Potwierdź auto-przelew 1 200 zł', pri: 'lo', subs: null, due: 'Zrobione', dk: 'later', done: true },
      ]},
    ],
    week: [
      { goal: 'System Design', kind: 'k-blue', items: [
        { t: 'Skończ moduł shardingu DB', pri: 'hi', subs: [2, 5], due: 'Czw', dk: 'soon', done: false },
        { t: 'Mock interview — zaprojektuj feed Twittera', pri: 'md', subs: null, due: 'Sob', dk: 'soon', done: false },
      ]},
      { goal: 'Półmaraton <1:45', kind: 'k-lav', items: [
        { t: 'Długi bieg 18 km · sobota', pri: 'md', subs: null, due: 'Sob', dk: 'soon', done: false },
        { t: 'Interwały tempowe 6×1km', pri: 'lo', subs: null, due: 'Śr', dk: 'soon', done: false },
      ]},
      { goal: '24 książki', kind: 'k-green', items: [
        { t: 'Skończ „Thinking in Systems”', pri: 'lo', subs: [3, 5], due: 'Ndz', dk: 'soon', done: false },
      ]},
    ],
    backlog: [
      { goal: 'Wyciskanie 100 kg', kind: 'k-clay', items: [
        { t: 'Tydzień deload — zaplanuj', pri: 'lo', subs: null, due: 'lip', dk: 'later', done: false },
      ]},
      { goal: 'System Design', kind: 'k-blue', items: [
        { t: 'Moduł kolejek komunikatów', pri: 'md', subs: [0, 5], due: 'lip', dk: 'later', done: false },
        { t: 'Zbuduj projekt rate-limitera', pri: 'lo', subs: null, due: 'sie', dk: 'later', done: false },
      ]},
      { goal: 'Fundusz awaryjny', kind: 'k-jade', items: [
        { t: 'Zbadaj drabinkę lokat 6-mies.', pri: 'lo', subs: null, due: 'sie', dk: 'later', done: false },
      ]},
    ],
  };

  const TODAY_GOALS_DEF = [
    { id: 1, name: 'Poranna mobilność + koktajl białkowy', cat: 'Rutyna', done: true },
    { id: 2, name: 'Trening push — klatka i barki', cat: 'Trening', done: false },
    { id: 3, name: 'Wyślij fakturę za integrację Finanteq', cat: '16:00', done: false },
    { id: 4, name: 'Rehabilitacja — ćwiczenia z gumą na bark, 10 min', cat: 'Regeneracja', done: false }
  ];
  function loadTodayGoals() { try { const s = JSON.parse(localStorage.getItem('rootine.today.goals')); if (Array.isArray(s)) return s; } catch (e) {} return TODAY_GOALS_DEF.map((x) => Object.assign({}, x)); }
  function saveTodayGoals(d) { try { localStorage.setItem('rootine.today.goals', JSON.stringify(d)); } catch (e) {} }
  function escG(s) { return String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  function todayGoalsGroupHTML() {
    const tg = loadTodayGoals();
    if (!tg.length) return '';
    let h = '<div class="tgroup k-jade" data-tg-group><div class="tgroup-h"><span class="gp"></span><span class="gn">Dzisiejsze cele</span><span class="gc">' + tg.length + (tg.length === 1 ? ' cel' : ' celów') + '</span></div>';
    tg.forEach((t) => {
      h += '<div class="titem ' + (t.done ? 'done' : '') + '" data-tg-id="' + t.id + '">' +
        '<span class="check">' + chk + '</span>' +
        '<div class="body"><div class="tn">' + escG(t.name) + '</div>' +
        '<div class="tmeta"><span class="pri-wrap"><span class="pri lo"></span>' + escG(t.cat || 'Cel') + '</span></div></div>' +
        '<span class="tdue today">Dziś</span></div>';
    });
    return h + '</div>';
  }

  function renderTasks(range) {
    const board = $('taskBoard');
    const groups = TASKS[range] || [];
    let h = '';
    if (range === 'today') h += todayGoalsGroupHTML();
    groups.forEach((g) => {
      const count = g.items.length;
      h += `<div class="tgroup ${g.kind}">
        <div class="tgroup-h"><span class="gp"></span><span class="gn">${g.goal}</span><span class="gc">${count} ${count === 1 ? 'zadanie' : 'zadań'}</span></div>`;
      g.items.forEach((it) => {
        const subs = it.subs ? `<span class="subs"><i></i>${it.subs[0]}/${it.subs[1]} podzadań</span>` : '';
        h += `<div class="titem ${it.done ? 'done' : ''}">
          <span class="check">${chk}</span>
          <div class="body">
            <div class="tn">${it.t}</div>
            <div class="tmeta"><span class="pri-wrap"><span class="pri ${it.pri}"></span>${it.pri === 'hi' ? 'Wysoki' : it.pri === 'md' ? 'Średni' : 'Niski'}</span>${subs}</div>
          </div>
          <span class="tdue ${it.dk}">${it.due}</span>
        </div>`;
      });
      h += `</div>`;
    });
    board.innerHTML = h;
  }

  // ---------- LEARNING PATHS ----------
  const PATHS = [
    { id: 'de', name: 'Ścieżka Data Engineer', meta: 'Samodzielna mapa', color: 'var(--ev-blue)', skills: [
      { n: 'SQL i modelowanie danych', subs: [['Zaawansowane joiny i funkcje okna', true], ['Normalizacja i schemat gwiazdy', true], ['Optymalizacja zapytań', true], ['Strategie indeksowania', false]] },
      { n: 'Python do danych', subs: [['Pandas i NumPy', true], ['Wzorce skryptów ETL', true], ['Podstawy PySpark', false], ['Testowanie potoków danych', false]] },
      { n: 'Orkiestracja · Airflow', subs: [['DAG-i i operatory', true], ['Harmonogramy i backfille', false], ['XCom i sensory', false]] },
      { n: 'Hurtownie · dbt + Snowflake', subs: [['Modele i testy dbt', true], ['Modele przyrostowe', false], ['Strojenie Snowflake', false], ['Warstwa semantyczna', false]] },
      { n: 'Streaming · Kafka', subs: [['Tematy i partycje', false], ['Kafka Connect', false], ['Exactly-once', false]] },
      { n: 'Chmura i IaC', subs: [['Stack danych AWS', true], ['Podstawy Terraform', false], ['CI/CD dla potoków', false]] },
    ]},
    { id: 'sd', name: 'Ścieżka System Design', meta: 'Educative', color: 'var(--acc-b)', skills: [
      { n: 'Podstawy skalowania', subs: [['Pionowe vs poziome', true], ['Usługi bezstanowe', true], ['Twierdzenie CAP', true]] },
      { n: 'Cache', subs: [['Strategie cache', true], ['Polityki usuwania', true], ['Cache CDN', false]] },
      { n: 'Bazy danych w skali', subs: [['Sharding', true], ['Replikacja', false], ['Consistent hashing', false], ['Hot-spotting', false]] },
      { n: 'Komunikacja', subs: [['Kolejki vs strumienie', false], ['Backpressure', false], ['Kolejki dead-letter', false]] },
      { n: 'Niezawodność', subs: [['Rate limiting', false], ['Circuit breakers', false], ['Obserwowalność', false]] },
    ]},
    { id: 'es', name: 'Hiszpański · B2', meta: 'Język', color: 'var(--ev-green)', skills: [
      { n: 'Gramatyka', subs: [['Czasy przeszłe', true], ['Tryb łączący', false], ['Tryby warunkowe', false]] },
      { n: 'Słownictwo', subs: [['1000 słów bazowych', true], ['Idiomy', true], ['Hiszpański biznesowy', false]] },
      { n: 'Mówienie', subs: [['Cotygodniowy lektor', true], ['Shadowing', false]] },
      { n: 'Słuchanie', subs: [['Podcasty', true], ['Filmy bez napisów', false]] },
    ]},
  ];
  let curPath = 'de';
  const expanded = {}; // skillKey -> bool

  function pathById(id) { return PATHS.find((p) => p.id === id); }
  function pathStats(p) {
    let done = 0, total = 0;
    p.skills.forEach((s) => { s.subs.forEach((x) => { total++; if (x[1]) done++; }); });
    return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
  }
  function skillStats(s) { const t = s.subs.length, d = s.subs.filter((x) => x[1]).length; return { d, t, pct: t ? Math.round(d / t * 100) : 0 }; }

  function renderPaths() {
    // tabs
    $('pathTabs').innerHTML = PATHS.map((p) => {
      const st = pathStats(p);
      return `<button class="lpath-tab ${p.id === curPath ? 'on' : ''}" data-path="${p.id}" style="--pc:${p.color}"><span class="lpd"></span>${p.name.replace('Ścieżka ', '').split(' ·')[0]}<span class="lpp">${st.pct}%</span></button>`;
    }).join('');

    const p = pathById(curPath);
    const st = pathStats(p);
    document.querySelector('#lpArc').style.stroke = p.color;
    document.querySelector('#lpPct').style.color = p.color;
    $('pathPct').textContent = st.pct + '%';
    $('lpPct').textContent = st.pct;
    $('lpArc').style.strokeDashoffset = 270.2 * (1 - st.pct / 100);
    $('pathName').textContent = p.name;
    $('pathMeta').textContent = `${p.meta} · ${p.skills.length} obszarów · ${st.done}/${st.total} zrobione`;

    $('pathSkills').innerHTML = p.skills.map((s, si) => {
      const ss = skillStats(s);
      const ekey = curPath + ':' + si;
      const open = !!expanded[ekey];
      const subs = s.subs.map((x, xi) => `<div class="psub ${x[1] ? 'done' : ''}" data-skill="${si}" data-sub="${xi}"><span class="pcheck">${chk}</span><span class="px">${x[0]}</span></div>`).join('');
      return `<div class="pskill ${open ? 'open' : ''}" data-skey="${ekey}">
        <div class="pskill-h" data-toggle="${si}">
          <span class="pchev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>
          <div class="pskill-main">
            <div class="pskill-n">${s.n}</div>
            <div class="pskill-bar"><i style="width:${ss.pct}%;background:${p.color}"></i></div>
          </div>
          <span class="pskill-ct">${ss.d}/${ss.t}</span>
        </div>
        <div class="pskill-subs">${subs}</div>
      </div>`;
    }).join('');
  }

  // ---------- CALENDAR VIEWS ----------
  function renderMonthCalendar(yr, mo) {
    const MN = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
    const DN = ['Pn','Wt','Śr','Cz','Pt','Sb','Nd'];
    const board = $('taskBoard');
    const firstDow = new Date(yr, mo, 1).getDay();
    const dim = new Date(yr, mo + 1, 0).getDate();
    const startOff = (firstDow + 6) % 7;
    const mTasks = TASK_CALENDAR[mo] || {};
    const totalAct = Object.values(mTasks).reduce((s, a) => s + a.length, 0);
    const now = new Date();

    let h = `<div class="tcal-header">
      <button class="tcal-nav" id="tcalPrev">←</button>
      <div class="tcal-meta">
        <div class="tcal-title">${MN[mo]} ${yr}</div>
        ${totalAct ? `<div class="tcal-summary">${totalAct} aktywności</div>` : ''}
      </div>
      <button class="tcal-nav" id="tcalNext">→</button>
    </div>
    <div class="tcal-grid">
      ${DN.map(d => `<div class="tcal-dh">${d}</div>`).join('')}
      ${Array(startOff).fill('<div class="tcal-cell empty"></div>').join('')}`;

    for (let d = 1; d <= dim; d++) {
      const isToday = yr === now.getFullYear() && mo === now.getMonth() && d === now.getDate();
      const isPast = new Date(yr, mo, d) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const isSel = selDay === d;
      const dt = mTasks[d] || [];
      const dots = dt.map(t => `<span class="tcal-dot ${t.kind}"></span>`).join('');
      h += `<div class="tcal-cell${isToday ? ' today' : ''}${isPast && !isToday ? ' past' : ''}${isSel ? ' sel' : ''}" data-day="${d}">
        <div class="tcal-dn">${d}</div>
        <div class="tcal-dots">${dots}</div>
      </div>`;
    }
    h += '</div>';

    if (selDay) {
      const dt = mTasks[selDay] || [];
      if (dt.length) {
        h += `<div class="tcal-day-panel">
          <div class="tcal-day-title">${selDay} ${MN[mo].toLowerCase()}</div>
          ${dt.map(t => `<div class="tcal-day-task"><span class="tcal-dot ${t.kind}" style="width:9px;height:9px;border-radius:3px;flex-shrink:0"></span><span class="tn">${t.l}</span></div>`).join('')}
        </div>`;
      }
    }

    board.innerHTML = h;
    $('tcalPrev').onclick = () => { selDay = null; calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderMonthCalendar(calYear, calMonth); };
    $('tcalNext').onclick = () => { selDay = null; calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderMonthCalendar(calYear, calMonth); };
    board.querySelectorAll('.tcal-cell:not(.empty)').forEach(cell => {
      cell.addEventListener('click', () => {
        const d = +cell.dataset.day;
        selDay = selDay === d ? null : d;
        renderMonthCalendar(yr, mo);
      });
    });
  }

  function renderYearOverview(yr) {
    const MS = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];
    const board = $('taskBoard');
    const stats = YEAR_STATS[yr] || Array(12).fill({tasks:0,done:0,kinds:[]});
    const now = new Date();
    const totT = stats.reduce((s, m) => s + m.tasks, 0);
    const totD = stats.reduce((s, m) => s + m.done, 0);

    let h = `<div class="tyear-header">
      <div class="tyear-title">
        <button class="tcal-nav" id="tyearPrev">←</button>
        <span class="tnum">${yr}</span>
        <button class="tcal-nav" id="tyearNext">→</button>
      </div>
      <div class="tyear-summary">${totD}/${totT} zadań · ${totT ? Math.round(totD / totT * 100) : 0}% ukończonych</div>
    </div>
    <div class="tyear-grid">`;

    stats.forEach((s, i) => {
      const pct = s.tasks ? Math.round(s.done / s.tasks * 100) : 0;
      const isCur = yr === now.getFullYear() && i === now.getMonth();
      const isFut = yr > now.getFullYear() || (yr === now.getFullYear() && i > now.getMonth());
      h += `<div class="tyear-cell${isCur ? ' current' : ''}${isFut ? ' future' : ''}" data-month="${i}">
        <div class="tyear-mon">${MS[i]}</div>
        ${s.tasks ? `<div class="tyear-n tnum">${s.tasks}</div>
        <div class="tyear-bar"><i style="width:${pct}%"></i></div>
        <div class="tyear-dots">${s.kinds.map(k => `<span class="tcal-dot ${k}"></span>`).join('')}</div>` : `<div class="tyear-empty">—</div>`}
      </div>`;
    });
    h += '</div>';

    board.innerHTML = h;
    $('tyearPrev').onclick = () => renderYearOverview(yr - 1);
    $('tyearNext').onclick = () => renderYearOverview(yr + 1);
    board.querySelectorAll('.tyear-cell:not(.future)').forEach(cell => {
      cell.addEventListener('click', () => {
        calYear = yr; calMonth = +cell.dataset.month; selDay = null;
        document.querySelectorAll('#taskSeg button').forEach(b => b.classList.remove('on'));
        document.querySelector('#taskSeg button[data-range="month"]').classList.add('on');
        renderMonthCalendar(calYear, calMonth);
      });
    });
  }

  // ---------- INTERACTIONS ----------
  function wire() {
    // task range segmented
    $('taskSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-range]');
      if (!b) return;
      $('taskSeg').querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      const range = b.getAttribute('data-range');
      if (range === 'month') { selDay = null; renderMonthCalendar(calYear, calMonth); }
      else if (range === 'year') { renderYearOverview(calYear); }
      else { renderTasks(range); }
    });

    // task check toggle
    $('taskBoard').addEventListener('click', (e) => {
      const it = e.target.closest('.titem');
      if (!it) return;
      const tg = it.getAttribute('data-tg-id');
      if (tg) {
        const d = loadTodayGoals();
        const item = d.filter((x) => String(x.id) === tg)[0];
        if (item) { item.done = !item.done; saveTodayGoals(d); it.classList.toggle('done'); }
        return;
      }
      it.classList.toggle('done');
    });

    // learning paths: tab switch
    $('pathTabs').addEventListener('click', (e) => {
      const b = e.target.closest('.lpath-tab');
      if (b) { curPath = b.getAttribute('data-path'); renderPaths(); }
    });
    // learning paths: expand skill + toggle subpoint
    $('pathSkills').addEventListener('click', (e) => {
      const sub = e.target.closest('.psub');
      if (sub) {
        const p = pathById(curPath);
        const si = +sub.getAttribute('data-skill'), xi = +sub.getAttribute('data-sub');
        p.skills[si].subs[xi][1] = !p.skills[si].subs[xi][1];
        expanded[curPath + ':' + si] = true;
        renderPaths();
        return;
      }
      const h = e.target.closest('.pskill-h');
      if (h) {
        const skey = h.parentElement.getAttribute('data-skey');
        expanded[skey] = !expanded[skey];
        renderPaths();
      }
    });

    let rz;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(positionToday, 120); });
  }

  // ---------- KEYSTONE HABITS (editable) ----------
  const FLAME_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c2 3 4 4.5 4 8a4 4 0 11-8 0c0-1.2.4-2.2 1-3 .3 1 1 1.6 1.8 1.8C10.5 8 11 5 12 3z"/></svg>';

  function initKeystone() {
    const list = document.getElementById('ghabitList');
    if (!list || !window.EditList) return;
    window.EditList({
      list: list,
      key: 'rootine.goals.keystone',
      rowClass: 'ghabit',
      numericFields: ['streak'],
      seed: [
        { id: 1, name: 'Trening na siłowni', goal: 'Wyciskanie 100kg', week: [1, 1, 0, 1, 1, 0, 0], streak: 18, today: 4 },
        { id: 2, name: 'Deep work · 90 min', goal: 'System Design', week: [1, 1, 1, 1, 0, 0, 0], streak: 12, today: 4 },
        { id: 3, name: 'Czytaj 20 min', goal: '24 książki', week: [1, 0, 1, 1, 0, 0, 0], streak: 6, today: 4 },
        { id: 4, name: 'Auto-oszczędzanie 1 200 zł', goal: 'Fundusz awaryjny', week: [1, 1, 1, 1, 1, 1, 1], streak: 21, today: 4 }
      ],
      rowHTML: (h, esc) => {
        const td = (h.today == null ? 4 : h.today);
        const dots = h.week.map((on, i) => '<i class="' + (on ? 'on' : '') + (i === td ? ' today' : '') + '"></i>').join('');
        return '<div class="info"><div class="n ed-field" data-f="name">' + esc(h.name) + '</div>' +
          '<div class="c">→ <span class="ed-field" data-f="goal">' + esc(h.goal) + '</span></div></div>' +
          '<div class="hweek">' + dots + '</div>' +
          '<span class="streak">' + FLAME_SVG + '<span class="ed-field" data-f="streak">' + h.streak + '</span></span>';
      },
      onToggle: (h, e, row) => {
        const dot = e.target.closest('.hweek i');
        if (!dot) return false;
        const idx = Array.prototype.indexOf.call(dot.parentElement.children, dot);
        h.week[idx] = h.week[idx] ? 0 : 1;
        dot.classList.toggle('on');
        return true;
      },
      blank: (id) => ({ id: id, name: 'Nowy nawyk', goal: 'Cel', week: [0, 0, 0, 0, 0, 0, 0], streak: 0, today: 4 }),
      addLabel: 'Dodaj nawyk'
    });
  }

  function boot() {
    renderRoadmap();
    renderGoalsStrip();
    renderTasks('today');
    renderPaths();
    initKeystone();
    wire();
    // re-position today line after layout settles
    setTimeout(positionToday, 100);
    setTimeout(positionToday, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
