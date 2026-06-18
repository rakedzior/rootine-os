/* ============================================================
   ROOTINE OS — EditList: reusable editable-list engine
   Inline rename (contenteditable) · ⋯ menu (Edytuj / Usuń) ·
   "+ Dodaj" row · localStorage persistence.
   Used across tabs to make list features editable.
   ------------------------------------------------------------
   EditList({
     list, key, seed, rowClass, rowClassFor(item),
     numericFields:[], rowHTML(item, esc), onToggle(item,e,row)->bool,
     afterChange(data), blank(id)->item, addLabel, addAfter
   })
   ============================================================ */
(function () {
  'use strict';

  var DOTS = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>';
  var PENCIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>';
  var PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  window.EditList = function (opts) {
    var list = typeof opts.list === 'string' ? document.getElementById(opts.list) : opts.list;
    if (!list) return null;
    var KEY = opts.key;
    var numeric = opts.numericFields || [];
    var data = load();
    var uid = data.reduce(function (m, x) { return Math.max(m, +x.id || 0); }, 0) + 1;

    function load() {
      try { var s = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(s)) return s; } catch (e) {}
      return (opts.seed || []).map(function (x) { return JSON.parse(JSON.stringify(x)); });
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
    function find(row) {
      var id = row.getAttribute('data-id');
      for (var i = 0; i < data.length; i++) { if (String(data[i].id) === id) return data[i]; }
      return null;
    }

    function rowHTML(item) {
      var extra = opts.rowClassFor ? (' ' + opts.rowClassFor(item)) : '';
      return '<div class="' + opts.rowClass + ' ed-row' + extra + '" data-id="' + item.id + '">' +
        opts.rowHTML(item, esc) +
        '<button class="ed-trigger" type="button" aria-label="Opcje">' + DOTS + '</button>' +
        '<div class="ed-menu">' +
        '<button type="button" data-act="edit">' + PENCIL + 'Edytuj</button>' +
        '<button type="button" data-act="delete" class="danger">' + TRASH + 'Usuń</button>' +
        '</div></div>';
    }
    function render() {
      list.innerHTML = data.map(rowHTML).join('');
      if (opts.afterChange) opts.afterChange(data);
    }
    function closeMenus() {
      Array.prototype.forEach.call(list.querySelectorAll('.ed-menu.open'), function (m) { m.classList.remove('open'); });
      Array.prototype.forEach.call(list.querySelectorAll('.ed-trigger.open'), function (t) { t.classList.remove('open'); });
    }
    function enterEdit(row) {
      closeMenus();
      row.classList.add('editing');
      Array.prototype.forEach.call(row.querySelectorAll('[data-f]'), function (el) { el.contentEditable = 'true'; });
      var n = row.querySelector('[data-f]');
      if (n) { n.focus(); try { document.getSelection().selectAllChildren(n); } catch (e) {} }
    }
    function commit(row) {
      var item = find(row);
      if (!item) { row.classList.remove('editing'); return; }
      Array.prototype.forEach.call(row.querySelectorAll('[data-f]'), function (el) {
        var f = el.dataset.f, v = el.textContent.trim();
        if (numeric.indexOf(f) >= 0) { v = parseInt(v, 10); if (isNaN(v) || v < 0) v = 0; el.textContent = v; }
        else if (!v) { v = item[f]; el.textContent = v; }
        item[f] = v;
        el.contentEditable = 'false';
      });
      row.classList.remove('editing');
      save();
      if (opts.afterChange) opts.afterChange(data);
    }
    function addItem() {
      var item = opts.blank(uid++);
      data.push(item);
      save();
      render();
      var row = list.querySelector('.' + opts.rowClass + '[data-id="' + item.id + '"]');
      if (row) enterEdit(row);
    }

    list.addEventListener('click', function (e) {
      var trig = e.target.closest('.ed-trigger');
      if (trig) {
        e.stopPropagation();
        var m = trig.parentElement.querySelector('.ed-menu');
        var open = m.classList.contains('open');
        closeMenus();
        if (!open) { m.classList.add('open'); trig.classList.add('open'); }
        return;
      }
      var act = e.target.closest('.ed-menu button');
      if (act) {
        e.stopPropagation();
        var arow = act.closest('.' + opts.rowClass);
        var a = act.getAttribute('data-act');
        closeMenus();
        if (a === 'edit') {
          if (opts.onEdit) opts.onEdit(find(arow), arow, { save: save, render: render });
          else enterEdit(arow);
        }
        else if (a === 'delete') {
          var victim = find(arow);
          data = data.filter(function (x) { return x !== victim; });
          save(); render();
        }
        return;
      }
      var row = e.target.closest('.' + opts.rowClass);
      if (!row || row.classList.contains('editing')) return;
      if (opts.onToggle) {
        var handled = opts.onToggle(find(row), e, row);
        if (handled) { save(); if (opts.afterChange) opts.afterChange(data); }
      }
    });

    list.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var f = e.target.closest('[data-f]');
        if (f) { e.preventDefault(); commit(f.closest('.' + opts.rowClass)); }
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.ed-menu') && !e.target.closest('.ed-trigger')) closeMenus();
      var ed = list.querySelector('.' + opts.rowClass + '.editing');
      if (ed && !ed.contains(e.target)) commit(ed);
    });

    if (opts.addLabel) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ed-add';
      btn.innerHTML = PLUS + opts.addLabel;
      (opts.addAfter || list).after(btn);
      btn.addEventListener('click', addItem);
    }

    render();
    return {
      data: function () { return data; },
      render: render,
      save: save,
      add: function (partial) {
        var item = opts.blank(uid++);
        if (partial) for (var k in partial) item[k] = partial[k];
        data.push(item); save(); render();
        return item;
      }
    };
  };
})();
