/* ============================================================
   module-tabs.js — wspólna lokalna nawigacja sekcji
   Reużywalny kontroler dla wszystkich modułów Rootine OS.

   Markup:
   <main class="module" data-module="sport">
     <header class="module-hd">…</header>
     <nav class="section-tabs" data-section-tabs>
       <button class="sec-tab" data-section="dzisiaj">Dzisiaj</button>
       …
     </nav>
     <div class="section-panels">
       <section class="section-panel" data-panel="dzisiaj">…</section>
       …
     </div>
   </main>

   Dodatkowo dowolny element może przełączać sekcję:
     <button data-section-link="analiza">Zobacz analizę</button>
   oraz opcjonalnie wywołać akcję po przełączeniu:
     <button data-section-link="dzisiaj" data-cta-click="#startBtn">Start</button>

   Aktywna sekcja: hash URL > localStorage > pierwsza zakładka.
   ============================================================ */
(function () {
  'use strict';

  function initModule(root) {
    var tabBar = root.querySelector('[data-section-tabs]');
    if (!tabBar) return;

    var tabs = Array.prototype.slice.call(tabBar.querySelectorAll('[data-section]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-panel]'));
    if (!tabs.length) return;

    var moduleId = root.getAttribute('data-module') || location.pathname;
    var storeKey = 'rootine:section:' + moduleId;

    function has(id) {
      return tabs.some(function (t) { return t.getAttribute('data-section') === id; });
    }

    function activate(id, opts) {
      opts = opts || {};
      if (!has(id)) id = tabs[0].getAttribute('data-section');

      tabs.forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-section') === id);
        t.setAttribute('aria-selected', t.getAttribute('data-section') === id ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-panel') === id);
      });

      try { localStorage.setItem(storeKey, id); } catch (e) {}
      if (opts.push) {
        try { history.replaceState(null, '', '#' + id); } catch (e) {}
      }

      // Wykresy zależne od szerokości kontenera przerysowują się na resize.
      window.dispatchEvent(new Event('resize'));
      root.dispatchEvent(new CustomEvent('sectionchange', {
        detail: { section: id }, bubbles: true
      }));

      // Przewiń aktywną zakładkę do widoku (mobile).
      var btn = tabs.filter(function (t) { return t.getAttribute('data-section') === id; })[0];
      if (btn && btn.scrollIntoView) {
        try { btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (e) {}
      }
      // Przewiń stronę do paska zakładek przy ręcznym przełączeniu.
      if (opts.scrollTop) {
        try { tabBar.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {}
      }
    }

    // Klik w zakładkę.
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        activate(t.getAttribute('data-section'), { push: true });
      });
    });

    // Skróty z wnętrza paneli (np. „Zobacz analizę →”).
    root.addEventListener('click', function (e) {
      var link = e.target.closest('[data-section-link]');
      if (!link || !root.contains(link)) return;
      e.preventDefault();
      var target = link.getAttribute('data-section-link');
      activate(target, { push: true, scrollTop: true });
      var ctaSel = link.getAttribute('data-cta-click');
      if (ctaSel) {
        var el = document.querySelector(ctaSel);
        if (el) { setTimeout(function () { el.click(); }, 60); }
      }
    });

    // Reakcja na zmianę hasha (np. nawigacja wstecz).
    window.addEventListener('hashchange', function () {
      var h = (location.hash || '').replace('#', '');
      if (has(h)) activate(h, { push: false });
    });

    // Sekcja startowa: hash > localStorage > pierwsza.
    var initId = (location.hash || '').replace('#', '');
    if (!has(initId)) {
      try { initId = localStorage.getItem(storeKey) || ''; } catch (e) { initId = ''; }
    }
    if (!has(initId)) initId = tabs[0].getAttribute('data-section');
    activate(initId, { push: false });
  }

  function boot() {
    Array.prototype.slice.call(document.querySelectorAll('[data-module]')).forEach(initModule);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Udostępnij na wszelki wypadek (np. ręczne przełączanie z konsoli/innych skryptów).
  window.RootineModuleTabs = { init: boot };
})();
