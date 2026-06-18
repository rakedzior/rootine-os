/* ============================================================
   ROOTINE OS — SPORT tab logic
   Live workout logger · rest timer · elapsed · volume · sparkline
   ============================================================ */
(function () {
  'use strict';
  if (!document.getElementById('logger')) return;

  const EXERCISES = [
    { name: 'Wyciskanie sztangą leżąc', target: '4 × 6–8 · RIR 2', sets: [[80, 8], [80, 7], [82.5, 6], [82.5, 6]] },
    { name: 'Wyciskanie hantli skośne', target: '3 × 8–10 · RIR 2', sets: [[30, 10], [30, 9], [32, 8]] },
    { name: 'Wyciskanie żołnierskie siedząc', target: '3 × 8–10 · RIR 1', sets: [[24, 10], [24, 9], [24, 8]] },
    { name: 'Rozpiętki na wyciągu', target: '3 × 12–15 · RIR 1', sets: [[15, 14], [15, 13], [15, 12]] },
    { name: 'Wznosy bokiem', target: '4 × 12–15 · RIR 0', sets: [[10, 15], [10, 14], [10, 13], [10, 12]] },
    { name: 'Prostowanie tricepsa na wyciągu', target: '3 × 12–15 · RIR 1', sets: [[25, 15], [25, 14], [25, 12]] },
  ];
  const TOTAL_SETS = EXERCISES.reduce((n, e) => n + e.sets.length, 0);
  const REST_DEFAULT = 120;

  const $ = (id) => document.getElementById(id);
  const chk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>';

  // ---------- PREVIEW ----------
  function renderPreview() {
    const host = $('sessPreview');
    if (!host) return;
    let h = '';
    EXERCISES.forEach((e, i) => {
      const vol = e.sets.reduce((s, [kg, r]) => s + kg * r, 0);
      h += `<div class="ex-row">
        <span class="ex-num">${i + 1}</span>
        <div class="nm"><div class="n">${e.name}</div><div class="t">${e.target}</div></div>
        <div class="vol">${e.sets.length} serii<br>${vol.toLocaleString()} kg</div>
      </div>`;
    });
    host.innerHTML = h;
  }

  // ---------- LOGGER ----------
  function renderLogger() {
    let h = '';
    EXERCISES.forEach((e, ei) => {
      h += `<div class="lg-ex">
        <div class="lg-ex-head"><span class="n">${e.name}</span><span class="t">${e.target}</span></div>
        <div class="set-cols"><div>Seria</div><div>Kg</div><div>Powt.</div><div>RIR</div><div>✓</div></div>
        <div class="set-rows" data-ex="${ei}">`;
      e.sets.forEach(([kg, r], si) => {
        h += setRow(ei, si, kg, r);
      });
      h += `</div><button class="lg-addset" data-add="${ei}">+ Dodaj serię</button></div>`;
    });
    $('logger').innerHTML = h;
  }

  function setRow(ei, si, kg, reps) {
    return `<div class="set-row" data-ex="${ei}" data-set="${si}">
      <span class="sn">${si + 1}</span>
      <input class="set-inp" data-f="kg" type="number" inputmode="decimal" value="${kg}">
      <input class="set-inp" data-f="reps" type="number" inputmode="numeric" value="${reps}">
      <input class="set-inp" data-f="rir" type="number" inputmode="numeric" placeholder="2">
      <button class="set-done" aria-label="Mark set done">${chk}</button>
    </div>`;
  }

  // ---------- STATE ----------
  let started = false, startTs = 0, elapsedTimer = null;

  function recalc() {
    const doneRows = document.querySelectorAll('#logger .set-row.done');
    let vol = 0;
    doneRows.forEach((row) => {
      const kg = parseFloat(row.querySelector('[data-f="kg"]').value) || 0;
      const reps = parseFloat(row.querySelector('[data-f="reps"]').value) || 0;
      vol += kg * reps;
    });
    $('sSetsDone').textContent = doneRows.length;
    $('sVol').textContent = Math.round(vol).toLocaleString();
    if (started && doneRows.length === TOTAL_SETS) $('sessState').textContent = 'Ukończono';
  }

  function fmt(s) { const m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); }

  function startSession() {
    started = true;
    $('presess').style.display = 'none';
    $('sessRunning').style.display = 'block';
    startTs = Date.now();
    elapsedTimer = setInterval(() => {
      $('sElapsed').textContent = fmt(Math.floor((Date.now() - startTs) / 1000));
    }, 1000);
  }

  function finishSession() {
    started = false;
    clearInterval(elapsedTimer);
    $('sessRunning').style.display = 'none';
    $('presess').style.display = 'block';
    $('sessState').textContent = 'Zapisano ✓';
    hideRest();
  }

  // ---------- REST TIMER ----------
  let restLeft = 0, restTotal = REST_DEFAULT, restTimer = null;
  function showRest(sec) {
    restTotal = sec; restLeft = sec;
    $('restBar').classList.remove('hidden');
    paintRest();
    clearInterval(restTimer);
    restTimer = setInterval(() => {
      restLeft--;
      if (restLeft <= 0) { hideRest(); return; }
      paintRest();
    }, 1000);
  }
  function paintRest() {
    $('restTime').textContent = fmt(Math.max(0, restLeft));
    $('restFill').style.width = (restLeft / restTotal * 100) + '%';
  }
  function hideRest() { clearInterval(restTimer); $('restBar').classList.add('hidden'); }

  // ---------- REHAB ----------
  function recalcRehab() {
    const done = document.querySelectorAll('#rehabList .rehab.done').length;
    const total = document.querySelectorAll('#rehabList .rehab').length;
    $('rehabCount').textContent = `${done} / ${total}`;
  }

  // ---------- WEIGHT SPARKLINE ----------
  function renderSpark() {
    const data = [79.6, 79.7, 79.4, 79.5, 79.1, 79.2, 78.9, 78.7, 78.8, 78.5, 78.5, 78.4];
    const W = 260, H = 54, pad = 4;
    const min = Math.min(...data) - 0.2, max = Math.max(...data) + 0.2;
    const x = (i) => pad + i * (W - pad * 2) / (data.length - 1);
    const y = (v) => pad + (1 - (v - min) / (max - min)) * (H - pad * 2);
    const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const line = 'M' + pts.join(' L');
    const area = `M${x(0)},${H} L` + pts.join(' L') + ` L${x(data.length - 1)},${H} Z`;
    const lx = x(data.length - 1), ly = y(data[data.length - 1]);
    $('weightSpark').innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <path class="area" d="${area}"/>
        <path class="line" d="${line}"/>
        <circle class="dot" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="3.2"/>
      </svg>`;
  }

  // ---------- EVENTS ----------
  function wire() {
    $('startBtn').addEventListener('click', startSession);
    $('finishBtn').addEventListener('click', finishSession);

    // Podgląd treningu — toggle exercise list
    $('tmplBtn').addEventListener('click', () => {
      const p = $('sessPreview');
      const showing = p.style.display !== 'none';
      p.style.display = showing ? 'none' : 'flex';
      $('tmplBtn').querySelector('svg + span') && null;
    });

    $('logger').addEventListener('click', (e) => {
      const done = e.target.closest('.set-done');
      if (done) {
        const row = done.closest('.set-row');
        const nowDone = !row.classList.contains('done');
        row.classList.toggle('done');
        recalc();
        if (nowDone) showRest(REST_DEFAULT); else hideRest();
        return;
      }
      const add = e.target.closest('[data-add]');
      if (add) {
        const ei = +add.getAttribute('data-add');
        const rows = $('logger').querySelector(`.set-rows[data-ex="${ei}"]`);
        const last = EXERCISES[ei].sets[EXERCISES[ei].sets.length - 1];
        const si = rows.children.length;
        rows.insertAdjacentHTML('beforeend', setRow(ei, si, last[0], last[1]));
      }
    });

    $('restSkip').addEventListener('click', hideRest);
    $('restAdd').addEventListener('click', () => { restLeft += 15; restTotal += 15; paintRest(); });

    $('rehabList').addEventListener('click', (e) => {
      const r = e.target.closest('.rehab');
      if (r) { r.classList.toggle('done'); recalcRehab(); }
    });
  }

  // ---------- PROGRESSIVE OVERLOAD CHART ----------
  const PO = {
    Bench:    { lbl: 'Wyciskanie leżąc · szac. 1RM', data: [92, 94, 95, 96, 98, 99, 101, 102.5], color: '#bd8769' },
    Squat:    { lbl: 'Przysiad · szac. 1RM', data: [124, 128, 130, 132, 134, 136, 138, 140], color: '#7d9c81' },
    Deadlift: { lbl: 'Martwy ciąg · szac. 1RM', data: [165, 168, 170, 172, 175, 178, 180, 182.5], color: '#7c8aa6' },
    OHP:      { lbl: 'Wyciskanie nad głowę · szac. 1RM', data: [54, 55, 56, 57, 58, 60, 61, 62.5], color: '#9889ac' },
  };
  const PO_DATES = ['11.06', '12.06', '13.06', '14.06', '15.06', '16.06', '17.06', '18.06'];
  let poLift = 'Bench';

  function renderPO() {
    const host = $('poChart');
    if (!host) return;
    const { data: d, color, lbl } = PO[poLift];
    const W = Math.max(320, host.clientWidth || 560), H = 200;
    const padT = 14, padB = 26, padL = 6, padR = 30;
    const min = Math.min(...d), max = Math.max(...d), span = (max - min) || 1;
    const lo = min - span * 0.35, hi = max + span * 0.25;
    const x = (i) => padL + i * (W - padL - padR) / (d.length - 1);
    const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);

    let grid = '', NL = 4;
    for (let i = 0; i < NL; i++) {
      const gy = padT + i * (H - padT - padB) / (NL - 1);
      const val = hi - i * (hi - lo) / (NL - 1);
      grid += `<line x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}"/>`;
      grid += `<text class="po-ylab" x="${W - padR + 5}" y="${(gy + 3).toFixed(1)}">${Math.round(val)}</text>`;
    }
    let xl = '';
    PO_DATES.forEach((m, i) => { xl += `<text class="po-xlab" x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${m}</text>`; });

    const pts = d.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const line = 'M' + pts.join(' L');
    const area = `M${x(0).toFixed(1)},${(H - padB).toFixed(1)} L` + pts.join(' L') + ` L${x(d.length - 1).toFixed(1)},${(H - padB).toFixed(1)} Z`;
    const dots = d.map((v, i) => {
      const last = i === d.length - 1;
      return `<circle class="po-dot" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${last ? 4.2 : 2.6}" style="stroke:${color}${last ? ';fill:' + color : ''}"/>`;
    }).join('');

    host.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <defs><linearGradient id="poGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.20"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient></defs>
        <g class="po-grid">${grid}</g>
        ${xl}
        <path d="${area}" fill="url(#poGrad)"/>
        <path class="po-line" d="${line}" style="stroke:${color}"/>
        ${dots}
      </svg>`;

    $('poLbl').textContent = lbl;
    $('poNow').textContent = d[d.length - 1];
    const gain = (d[d.length - 1] - d[0]).toFixed(1).replace('.0', '');
    $('poDelta').textContent = `▲ +${gain} kg · 8 miesięcy`;
  }

  function wirePO() {
    const tabs = $('poTabs');
    if (!tabs) return;
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-lift]');
      if (!b) return;
      tabs.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      poLift = b.getAttribute('data-lift');
      renderPO();
    });
    let rz;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(renderPO, 150); });
  }

  // ---------- BODY MEASUREMENTS ----------
  let MEAS = [
    { n: 'Klatka piersiowa', v: 104.5, p: 103.8, low: false },
    { n: 'Barki', v: 124.0, p: 123.0, low: false },
    { n: 'Lewy biceps', v: 39.2, p: 38.6, low: false },
    { n: 'Prawy biceps', v: 39.6, p: 39.0, low: false },
    { n: 'Talia', v: 81.5, p: 83.2, low: true },
    { n: 'Udo', v: 60.5, p: 59.8, low: false },
    { n: 'Przedramię', v: 30.2, p: 29.9, low: false },
    { n: 'Łydka', v: 39.0, p: 38.8, low: false },
  ];
  let measEditing = false;

  function renderMeas() {
    const host = $('measList');
    if (!host) return;
    host.innerHTML = MEAS.map((m, i) => {
      const delta = +(m.v - m.p).toFixed(1);
      const good = m.low ? delta < 0 : delta > 0;
      const sign = delta > 0 ? '+' : '';
      const arrow = delta === 0 ? '·' : (delta > 0 ? '▲' : '▼');
      if (measEditing) {
        return `<div class="meas-row editing">
          <span class="mn">${m.n}</span>
          <input data-mi="${i}" type="number" step="0.1" inputmode="decimal" value="${m.v}">
          <span class="mu">cm</span>
        </div>`;
      }
      return `<div class="meas-row">
        <span class="mn">${m.n}</span>
        <span class="md" style="color:${delta === 0 ? 'var(--ink-3)' : good ? 'var(--acc-a-ink)' : 'var(--ink-3)'}">${arrow} ${sign}${delta} cm</span>
        <span class="mv tnum">${m.v.toFixed(1)}<small> cm</small></span>
      </div>`;
    }).join('');
  }

  function wireMeas() {
    const btn = $('measEdit');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (measEditing) {
        document.querySelectorAll('#measList input[data-mi]').forEach((inp) => {
          const i = +inp.getAttribute('data-mi');
          const nv = parseFloat(inp.value);
          if (!isNaN(nv) && nv !== MEAS[i].v) { MEAS[i].p = MEAS[i].v; MEAS[i].v = nv; }
        });
        measEditing = false;
        btn.textContent = 'Aktualizuj';
        btn.classList.remove('saving');
      } else {
        measEditing = true;
        btn.textContent = 'Zapisz';
        btn.classList.add('saving');
      }
      renderMeas();
    });
  }

  // ---------- BOOT ----------
  function boot() {
    renderPreview();
    renderLogger();
    renderSpark();
    renderPO();
    wirePO();
    renderMeas();
    wireMeas();
    recalc();
    recalcRehab();
    wire();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
