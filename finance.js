/* ============================================================
   ROOTINE OS — FINANCE tab logic
   Cash-flow grouped bars · net-worth sparkline
   ============================================================ */
(function () {
  'use strict';
  if (!document.getElementById('cfChart')) return; // only on Finance page

  const $ = (id) => document.getElementById(id);

  // ---------- CASH FLOW (income vs spend, last 6 months) ----------
  const CF = [
    { m: 'sty', inc: 11200, spd: 8600 },
    { m: 'lut', inc: 12400, spd: 9100 },
    { m: 'mar', inc: 11380, spd: 7800 },
    { m: 'kwi', inc: 11200, spd: 10200 },
    { m: 'maj', inc: 13600, spd: 8900 },
    { m: 'cze', inc: 11200, spd: 7340, cur: true },
  ];

  function renderCashFlow() {
    const host = $('cfChart');
    if (!host) return;
    const max = Math.max(...CF.map((d) => Math.max(d.inc, d.spd)));
    host.innerHTML = CF.map((d) => {
      const ih = Math.round(d.inc / max * 100);
      const sh = Math.round(d.spd / max * 100);
      return `<div class="cf-month${d.cur ? ' cur' : ''}">
        <div class="cf-bars">
          <i class="inc" style="height:${ih}%" title="Przychód ${d.inc.toLocaleString()} zł"></i>
          <i class="spd" style="height:${sh}%" title="Wydatki ${d.spd.toLocaleString()} zł"></i>
        </div>
        <span class="lab">${d.m}</span>
      </div>`;
    }).join('');
  }

  // ---------- NET WORTH SPARKLINE (12 months, thousands) ----------
  function renderNwSpark() {
    const host = $('nwSpark');
    if (!host) return;
    const data = [78.1, 79.4, 80.2, 81.8, 83.0, 84.6, 85.9, 87.2, 88.4, 89.9, 91.0, 92.26];
    const W = 280, H = 46, pad = 4;
    const min = Math.min(...data) - 1, max = Math.max(...data) + 1;
    const x = (i) => pad + i * (W - pad * 2) / (data.length - 1);
    const y = (v) => pad + (1 - (v - min) / (max - min)) * (H - pad * 2);
    const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const line = 'M' + pts.join(' L');
    const area = `M${x(0)},${H} L` + pts.join(' L') + ` L${x(data.length - 1)},${H} Z`;
    const lx = x(data.length - 1), ly = y(data[data.length - 1]);
    host.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <path class="area" d="${area}"/>
        <path class="line" d="${line}"/>
        <circle class="dot" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="3.2"/>
      </svg>`;
  }

  function boot() {
    renderCashFlow();
    renderNwSpark();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
