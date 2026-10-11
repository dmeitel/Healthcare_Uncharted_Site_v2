/* The hub's browser half. Served as it stands at /__hub/client.js by scripts/hub/index.js; it is
   never part of the site. It saves David's marks and ideas, flips the theme, and opens a block's
   detail on the Site tab. Every save reloads the page in place, so what is on screen is always
   what the files say. */
(function () {
  'use strict';
  var root = document.documentElement;

  /** @param {string} url @param {any} body @returns {Promise<any>} */
  function post(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error || 'That did not save.');
          return j;
        });
      });
  }

  /* a save reloads the page; this puts the reader back where they were */
  function reloadInPlace() {
    try { sessionStorage.setItem('hub-y', String(window.scrollY)); } catch (e) { /* private window */ }
    location.reload();
  }
  try {
    var y = sessionStorage.getItem('hub-y');
    if (y !== null) {
      sessionStorage.removeItem('hub-y');
      window.scrollTo(/** @type {any} */ ({ top: Number(y), behavior: 'instant' }));
    }
  } catch (e) { /* private window */ }

  /* ── theme: the site's own key, so the choice is the same one ── */
  var tb = document.getElementById('hubTheme');
  if (tb) tb.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('hu-theme', next); } catch (e) { /* private window */ }
  });

  /* ── the board: a new idea goes to the Inbox ── */
  var form = /** @type {any} */ (document.getElementById('hubInbox'));
  if (form) {
    var ferr = form.querySelector('.hub-err');
    form.addEventListener('submit', function (/** @type {Event} */ e) {
      e.preventDefault();
      var title = String(form.elements.title.value || '').trim();
      if (!title) { ferr.textContent = 'Give the idea a name first.'; form.elements.title.focus(); return; }
      ferr.textContent = '';
      post('/__hub/api/inbox', { title: title, line: String(form.elements.line.value || '').trim() })
        .then(reloadInPlace, function (x) { ferr.textContent = x.message; });
    });
    form.addEventListener('input', function () { ferr.textContent = ''; });
  }

  /* A NOTE IS NEVER LOST QUIETLY (2026-10-04). A tweak note lives only in its box until "Send to
     Claude" saves it, so a reload or a tap on another tab used to drop it without a word. Each box
     now keeps a draft in this browser and puts it back on load, and leaving the page with a draft
     unsent asks first. */
  /** @param {any} item */
  var draftKey = function (item) { return 'hub-note:' + item.getAttribute('data-card') + ':' + item.getAttribute('data-item'); };
  /** @param {string} k @param {string} [v] */
  var draft = function (k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k) || '';
      if (v) localStorage.setItem(k, v); else localStorage.removeItem(k);
    } catch (e) { /* private window: the box still works, it just cannot keep a draft */ }
    return '';
  };
  Array.prototype.forEach.call(document.querySelectorAll('.hub-qa-item'), function (/** @type {any} */ item) {
    var kept = draft(draftKey(item));
    var ta = item.querySelector('textarea');
    if (kept && ta && item.getAttribute('data-state') !== 'tweak') {
      ta.value = kept;
      item.querySelector('.hub-tweak').hidden = false;
      item.querySelector('.hub-err').textContent = 'Not sent yet. Press Send to Claude to save this note.';
    }
  });
  var unsent = function () {
    return Array.prototype.some.call(document.querySelectorAll('.hub-qa-item'), function (/** @type {any} */ item) {
      var ta = item.querySelector('textarea');
      return ta && ta.value.trim() && item.getAttribute('data-state') !== 'tweak' && draft(draftKey(item));
    });
  };
  var leaving = false;
  window.addEventListener('beforeunload', function (e) {
    if (!leaving && unsent()) { e.preventDefault(); e.returnValue = ''; }
  });

  /** @param {any} item @param {string} mark @param {string} note */
  function send(item, mark, note) {
    post('/__hub/api/qa', { card: item.getAttribute('data-card'), item: item.getAttribute('data-item'), mark: mark, note: note })
      .then(function () { draft(draftKey(item), ''); leaving = true; reloadInPlace(); }, function (x) {
        item.querySelector('.hub-tweak').hidden = false;
        item.querySelector('.hub-err').textContent = x.message;
      });
  }

  document.addEventListener('click', function (e) {
    var t = /** @type {any} */ (e.target);
    if (!t || !t.closest) return;

    /* the QA list: every item still to look at, in the folder on screen, marked Good at once (asked first). Back for
       another look is left out: those are fixes he has not seen. */
    var all = t.closest('[data-mark-all]');
    if (all) {
      var open = Array.prototype.filter.call(document.querySelectorAll('.hub-qa-item[data-state="todo"]'), function (/** @type {any} */ i) { return !i.closest('.hub-good'); });
      if (!open.length || !window.confirm('Mark the ' + open.length + ' item' + (open.length === 1 ? '' : 's') + ' still to look at here Good?')) return;
      all.disabled = true;
      open.reduce(function (/** @type {Promise<any>} */ p, /** @type {any} */ i) {
        return p.then(function () { return post('/__hub/api/qa', { card: i.getAttribute('data-card'), item: i.getAttribute('data-item'), mark: 'good', note: '' }); });
      }, Promise.resolve()).then(reloadInPlace, function (/** @type {any} */ x) { all.disabled = false; all.textContent = x.message; });
      return;
    }

    /* the board: promote an idea out of the Inbox */
    var p = t.closest('[data-promote]');
    if (p) {
      p.disabled = true;
      post('/__hub/api/promote', { id: p.getAttribute('data-promote') })
        .then(reloadInPlace, function (x) { p.disabled = false; p.textContent = x.message; });
      return;
    }

    /* the QA list: Good saves at once; Needs a tweak opens the note first */
    var m = t.closest('[data-mark]');
    if (m) {
      var item = m.closest('.hub-qa-item');
      var box = item.querySelector('.hub-tweak');
      if (m.getAttribute('data-mark') === 'tweak') {
        box.hidden = !box.hidden;
        if (!box.hidden) box.querySelector('textarea').focus();
        return;
      }
      send(item, 'good', '');
      return;
    }
    var s = t.closest('[data-send]');
    if (s) {
      var it = s.closest('.hub-qa-item');
      var ta = it.querySelector('textarea');
      var er = it.querySelector('.hub-err');
      var note = String(ta.value || '').trim();
      if (!note) { er.textContent = 'Say what should change first.'; ta.focus(); return; }
      er.textContent = '';
      send(it, 'tweak', note);
    }
  });
  document.addEventListener('input', function (e) {
    var t = /** @type {any} */ (e.target);
    var it = t && t.closest && t.closest('.hub-qa-item');
    if (!it) return;
    it.querySelector('.hub-err').textContent = '';
    if (t.tagName === 'TEXTAREA') draft(draftKey(it), t.value.trim() ? t.value : '');
  });

  /* ── the Site tab: one detail pane. Beside the plates on a wide screen; below 1100px it moves
     under the plate of the block that was picked, so a phone never scrolls away to read it. ── */
  var dock = /** @type {any} */ (document.getElementById('obsDock'));
  if (dock) {
    var home = dock.parentNode;
    var hint = dock.innerHTML;
    var narrow = window.matchMedia('(max-width:1099px)');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)');
    /** @type {any} */
    var on = null;
    var place = function (/** @type {any} */ b) {
      if (narrow.matches && b) b.closest('.obs-plate').appendChild(dock);
      else if (dock.parentNode !== home) home.appendChild(dock);
    };
    var show = function (/** @type {any} */ b) {
      if (on) on.setAttribute('aria-expanded', 'false');
      if (!b || b === on) {
        on = null;
        dock.innerHTML = hint;
        dock.classList.add('is-parked');
        place(null);
        return;
      }
      on = b;
      b.setAttribute('aria-expanded', 'true');
      dock.innerHTML = document.getElementById(b.getAttribute('data-tpl')).innerHTML;
      dock.classList.remove('is-parked');
      place(b);
      if (narrow.matches) dock.scrollIntoView({ block: 'nearest', behavior: still.matches ? 'auto' : 'smooth' });
    };
    Array.prototype.forEach.call(document.querySelectorAll('.obs-brick'), function (/** @type {any} */ b) {
      b.addEventListener('click', function () { show(b); });
    });
    dock.addEventListener('click', function (/** @type {any} */ e) {
      if (e.target.closest && e.target.closest('[data-close]')) { var b = on; show(null); if (b) b.focus(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && on) { var b = on; show(null); b.focus(); }
    });
    narrow.addEventListener('change', function () { place(on); });
  }

  /* ── the Library: the "i" on a block opens its longer note (the site's own peek card) ── */
  var kitJs = /** @type {any} */ (window).HUKit;
  if (kitJs && kitJs.peek) kitJs.peek({ root: '.obs-hub' });
})();
