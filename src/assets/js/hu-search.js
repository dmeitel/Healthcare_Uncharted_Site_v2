/* HU SEARCH v1 · the switchboard (V3 phase 1b, spec: docs/HU-V3-HOME-BUILD-SPEC-2026-08-06.md)
   Four states: opened-empty browses, typing matches label+sub+ALIASES with a
   visible "why", no-match hands over the clusters and logs the miss, phone
   renders as a full sheet. Rides the site's existing popover contract:
   one open at a time, Esc closes and refocuses, outside click closes. */
(function () {
'use strict';

var IDX = null, loading = false, pendingQ = null;
var wrap = null, input = null, body = null, opener = null, hot = -1, flat = [];
var lastMissLogged = '';

var CLUSTERS = [
  { key: 'careers-pay',  label: 'Careers & Pay' },
  { key: 'maps-systems', label: 'Maps & Systems' },
  { key: 'learn-play',   label: 'Learn & Play' }
];
var TYPE_ORDER = ['tool', 'learn', 'talk', 'rounds', 'path'];
var TYPE_LABEL = { tool: 'Tools', learn: 'Learn', talk: 'Talks', rounds: 'Rounds', path: 'Paths' };
var DOORS = [
  { label: 'I work in healthcare', sub: 'Start with the AI reality check', type: 'path', url: '/learn/ai-in-healthcare/' },
  { label: 'I work with the data', sub: 'Try the Clinical SQL Mystery', type: 'path', url: '/tools/sql-mystery/' },
  { label: 'I make the calls', sub: 'Start with the leadership playbook', type: 'path', url: '/learn/leading-the-ai-transition/' }
];
var MAG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.2" y2="16.2"></line></svg>';

function gc(path, title) {
  if (window.goatcounter && window.goatcounter.count) {
    window.goatcounter.count({ path: path, title: title || '', event: true });
  }
}

function loadIndex(cb) {
  if (IDX) { cb(); return; }
  if (loading) { return; }
  loading = true;
  fetch('/assets/data/search-index.json')
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) { IDX = j; loading = false; cb(); })
    .catch(function () { loading = false; });
}

/* their word, our destination: label beats alias beats description */
function scoreEntry(e, q) {
  var L = e.label.toLowerCase(), S = (e.sub || '').toLowerCase();
  var best = 0, why = null;
  if (L.indexOf(q) === 0) best = 100;
  else if (L.indexOf(' ' + q) > -1) best = 80;
  else if (L.indexOf(q) > -1) best = 60;
  var keys = e.keys || [];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i].toLowerCase();
    var s = k.indexOf(q) === 0 ? 90 : k.indexOf(q) > -1 ? 70 : 0;
    if (s > best) { best = s; why = keys[i]; }
  }
  if (!best && S.indexOf(q) > -1) best = 40;
  return best ? { score: best, why: why } : null;
}
function search(q) {
  q = q.trim().toLowerCase();
  var out = [];
  for (var i = 0; i < IDX.length; i++) {
    var m = scoreEntry(IDX[i], q);
    if (m) out.push({ e: IDX[i], score: m.score, why: m.why });
  }
  out.sort(function (a, b) { return b.score - a.score; });
  return out.slice(0, 10);
}

function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

function rowHtml(e, why, idx) {
  return '<a class="hu-sr-row" data-i="' + idx + '" href="' + esc(e.url) + '">' +
    '<b>' + esc(e.label) + '</b>' +
    (why ? '<span class="why">matched: ' + esc(why) + '</span>' : '') +
    '<span class="ty">' + esc(TYPE_LABEL[e.type] || e.type) + '</span></a>';
}
function sectionHtml(title) { return '<div class="hu-sr-sec">' + title + '</div>'; }
function chipsHtml() {
  var h = '<div class="hu-sr-chips">';
  CLUSTERS.forEach(function (c) { h += '<button type="button" class="hu-sr-chip" data-cluster="' + c.key + '">' + c.label + '</button>'; });
  return h + '</div>';
}

function renderEmpty() {
  var h = sectionHtml('Jump in') + chipsHtml() + sectionHtml('Three ways in');
  flat = [];
  DOORS.forEach(function (d) { h += rowHtml(d, null, flat.length); flat.push(d); });
  var dated = IDX.filter(function (e) { return e.date; })
    .sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 3);
  if (dated.length) {
    h += sectionHtml('New on the site');
    dated.forEach(function (e) { h += rowHtml(e, null, flat.length); flat.push(e); });
  }
  hot = -1;
  body.innerHTML = h;
}
function renderCluster(key) {
  var hits = IDX.filter(function (e) { return e.cluster === key; });
  var h = sectionHtml(CLUSTERS.filter(function (c) { return c.key === key; })[0].label);
  flat = [];
  hits.slice(0, 10).forEach(function (e) { h += rowHtml(e, null, flat.length); flat.push(e); });
  hot = flat.length ? 0 : -1;
  body.innerHTML = h;
  paintHot();
}
function renderResults(q) {
  var hits = search(q);
  if (!hits.length) {
    flat = []; hot = -1;
    body.innerHTML = '<div class="hu-sr-none">Nothing matches <b>' + esc(q) + '</b> yet. The clusters cover everything on the site:</div>' + chipsHtml();
    if (q !== lastMissLogged && q.length > 2) { lastMissLogged = q; gc('search/miss', q); }
    return;
  }
  var byType = {};
  hits.forEach(function (h) { (byType[h.e.type] = byType[h.e.type] || []).push(h); });
  var h = ''; flat = [];
  TYPE_ORDER.forEach(function (t) {
    if (!byType[t]) return;
    h += sectionHtml(TYPE_LABEL[t]);
    byType[t].forEach(function (hit) { h += rowHtml(hit.e, hit.why, flat.length); flat.push(hit.e); });
  });
  hot = 0;
  body.innerHTML = h;
  paintHot();
}
function paintHot() {
  var rows = body.querySelectorAll('.hu-sr-row');
  for (var i = 0; i < rows.length; i++) rows[i].classList.toggle('hot', i === hot);
  if (hot > -1 && rows[hot]) rows[hot].scrollIntoView({ block: 'nearest' });
}

function build() {
  wrap = document.createElement('div');
  wrap.id = 'huSearch';
  wrap.hidden = true;
  wrap.innerHTML =
    '<div class="hu-sr-back"></div>' +
    '<div class="hu-sr-panel" role="dialog" aria-modal="true" aria-label="Site search">' +
      '<div class="hu-sr-in">' + MAG +
        '<input id="huSearchInput" type="text" autocomplete="off" spellcheck="false" placeholder="Where do you want to go?" aria-label="Search the site">' +
        '<button type="button" class="hu-sr-cancel" aria-label="Close search">Cancel</button>' +
      '</div>' +
      '<div class="hu-sr-body" id="huSearchBody"></div>' +
      '<div class="hu-sr-kbd"><span>&uarr;&darr; move</span><span>&crarr; go</span><span>esc close</span></div>' +
    '</div>';
  document.body.appendChild(wrap);
  input = document.getElementById('huSearchInput');
  body = document.getElementById('huSearchBody');

  input.addEventListener('input', function () {
    var q = input.value.trim();
    if (!q) { renderEmpty(); return; }
    renderResults(q);
  });
  input.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); if (flat.length) { hot = Math.min(hot + 1, flat.length - 1); paintHot(); } }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); if (flat.length) { hot = Math.max(hot - 1, 0); paintHot(); } }
    else if (ev.key === 'Enter') {
      ev.preventDefault();
      var pick = hot > -1 ? flat[hot] : flat[0];
      if (pick) { gc('search/go', pick.url); location.href = pick.url; }
    }
  });
  body.addEventListener('click', function (ev) {
    var chip = ev.target.closest('.hu-sr-chip');
    if (chip) { renderCluster(chip.getAttribute('data-cluster')); input.focus(); return; }
    var row = ev.target.closest('.hu-sr-row');
    if (row) gc('search/go', row.getAttribute('href'));
  });
  wrap.querySelector('.hu-sr-back').addEventListener('click', close);
  wrap.querySelector('.hu-sr-cancel').addEventListener('click', close);
}

function open(from) {
  if (!wrap) build();
  opener = from || document.activeElement;
  wrap.hidden = false;
  document.documentElement.classList.add('hu-search-open');
  input.value = '';
  input.focus();
  loadIndex(function () { if (!wrap.hidden && !input.value.trim()) renderEmpty(); });
  if (IDX) renderEmpty(); else body.innerHTML = '<div class="hu-sr-none">Loading the map&hellip;</div>';
}
function close() {
  if (!wrap || wrap.hidden) return;
  wrap.hidden = true;
  document.documentElement.classList.remove('hu-search-open');
  if (opener && opener.focus) opener.focus();
}
function isOpen() { return wrap && !wrap.hidden; }

document.addEventListener('keydown', function (ev) {
  if (ev.key === 'Escape' && isOpen()) { close(); return; }
  if (ev.key === '/' && !isOpen()) {
    var t = /** @type {HTMLElement} */ (document.activeElement);
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (!typing) { ev.preventDefault(); open(null); }
  }
});

/* any element carrying data-hu-search opens the switchboard */
document.addEventListener('click', function (ev) {
  var target = /** @type {Element} */ (ev.target);
  var btn = target.closest && target.closest('[data-hu-search]');
  if (btn) { ev.preventDefault(); open(btn); }
});

window.HUSearch = { open: open, close: close };
})();
