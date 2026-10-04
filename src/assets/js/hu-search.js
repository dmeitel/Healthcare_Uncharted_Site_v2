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
  { key: 'learn-play',   label: 'Learn & Play' },
  { key: 'fun',          label: 'Fun' }   // the games' shelf on the Tools page (2026-10-02)
];
var TYPE_ORDER = ['tool', 'learn', 'talk', 'rounds', 'fun', 'path'];
var TYPE_LABEL = { tool: 'Tools', learn: 'Learn', talk: 'Talks', rounds: 'Rounds', fun: 'Fun', path: 'Paths' };
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

/* The word pass (2026-10-04). The phrase pass above needs the whole query inside one label or
   key, so "rt pay" and "travel pay in Sacramento" found nothing. This pass takes a question the
   way people type it: drop the filler words, fold plurals, swap in everyday synonyms, then score
   each word where it lands (label 3, key 2.5, description 1). A state name only nudges (half
   weight), and a label or key holding every matched word earns a bonus, so "travel pay in
   Sacramento" lands on the tool whose key IS "travel pay". Capped below a phrase hit on a key. */
var STOP = {};
('a an the and or of in on at to for from with by about into is are was be do does did can could should would ' +
 'how what which who why where when me my i im you your near best good find get show tell need want vs versus ' +
 'much many some any this that it its healthcare').split(' ').forEach(function (w) { STOP[w] = 1; });
var SYN = {
  rt: ['respiratory'], rrt: ['respiratory'], crt: ['respiratory'], resp: ['respiratory'],
  vent: ['ventilator', 'respiratory'], ventilator: ['respiratory'], o2: ['oxygen'],
  rn: ['nurse'], lpn: ['nurse'], cna: ['nurse'], nursing: ['nurse'],
  md: ['physician', 'doctor'], doctor: ['physician'], physician: ['doctor'],
  salary: ['pay'], wage: ['pay'], income: ['pay'], earn: ['pay'], earning: ['pay'], paid: ['pay'], paycheck: ['pay'], compensation: ['pay'],
  price: ['cost', 'charge'], cost: ['price'], charge: ['price', 'cost'], chargemaster: ['price', 'charge'], expensive: ['cost', 'price'],
  job: ['career'], career: ['job'], profession: ['career'],
  school: ['program', 'education'], college: ['school', 'education'], program: ['school'], degree: ['education', 'school'], training: ['education'],
  insurance: ['payer', 'insurer'], insurer: ['payer', 'insurance'], payer: ['insurance', 'insurer'],
  billing: ['bill', 'claim'], bill: ['billing', 'claim'], claim: ['billing'], coding: ['code'], code: ['coding'], denial: ['claim'],
  authorization: ['auth'], preauth: ['auth'], preauthorization: ['auth'], auth: ['authorization'],
  emr: ['ehr'], ehr: ['emr'], chart: ['ehr', 'record'], charting: ['ehr', 'record'], record: ['ehr'],
  artificial: ['ai'], intelligence: ['ai'], llm: ['ai'], chatgpt: ['ai'], ml: ['ai'],
  game: ['play'], play: ['game'], quiz: ['trivia', 'game'], trivia: ['quiz', 'game'], fun: ['game'],
  atlas: ['map'], map: ['atlas'],
  traveler: ['travel'], traveling: ['travel'], travelling: ['travel'],
  relocate: ['relocation', 'moving'], move: ['moving', 'relocation'], moving: ['relocation'],
  burned: ['burnout'], burnt: ['burnout'],
  database: ['sql', 'data'], query: ['sql'], sql: ['database'],
  law: ['policy', 'regulation'], legislation: ['law', 'policy'], regulation: ['law', 'policy'], rule: ['law', 'policy'], policy: ['law'],
  hack: ['cyberattack'], hacked: ['cyberattack'], ransomware: ['cyberattack'], breach: ['cyberattack'], cyber: ['cyberattack'],
  fhir: ['interoperability'], hl7: ['interoperability'], interop: ['interoperability']
};
var STATES = ('alabama alaska arizona arkansas california colorado connecticut delaware florida georgia hawaii idaho illinois ' +
  'indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri montana ' +
  'nebraska nevada ohio oklahoma oregon pennsylvania tennessee texas utah vermont virginia washington wisconsin wyoming')
  .split(' ').concat(['new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota',
    'rhode island', 'south carolina', 'south dakota', 'west virginia', 'district of columbia'])
  .sort(function (a, b) { return b.length - a.length; });

function stem(w) {
  if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
  if (w.length > 4 && /(xes|ses|ches|shes|zes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && /s$/.test(w) && !/(ss|us|is|as)$/.test(w)) return w.slice(0, -1);
  return w;
}
function tokens(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ')
    .filter(function (t) { return t.length > 1; }).map(stem);
}
/** the query as words to look for: [{ alts: [stem, ...synonyms], imp: 1, or 0.5 for a place }] */
function queryWords(q) {
  var W = [], seen = {}, place = false;
  STATES.forEach(function (s) {
    var re = new RegExp('\\b' + s + '\\b');
    if (re.test(q)) { q = q.replace(re, ' '); place = true; }
  });
  if (place) W.push({ alts: ['state', 'county'], imp: 0.5 });
  q.replace(/[^a-z0-9]+/g, ' ').split(' ').forEach(function (raw) {
    if (raw.length < 2 || STOP[raw]) return;
    var s = stem(raw);
    if (seen[s]) return;
    seen[s] = 1;
    W.push({ alts: [s].concat(SYN[s] || SYN[raw] || []), imp: 1 });
  });
  return W;
}
function prep(e) {
  if (!e._p) {
    var keys = (e.keys || []).map(tokens);
    e._p = { label: tokens(e.label), keys: keys, keyAll: [].concat.apply([], keys), text: tokens((e.sub || '') + ' ' + (e.text || '')) };
  }
  return e._p;
}
/* What was typed (alts[0]) matches whole when short ("pay" is not "payer") and the front of a word
   from four letters up ("hosp", "cardio"). A synonym always matches whole: "auth" must not find
   "author". */
function hits(list, alts) {
  for (var i = 0; i < list.length; i++) {
    for (var j = 0; j < alts.length; j++) {
      var a = alts[j];
      if (list[i] === a || (j === 0 && a.length >= 4 && list[i].indexOf(a) === 0)) return true;
    }
  }
  return false;
}
function wordScore(e, W) {
  var P = prep(e), sum = 0, tot = 0, got = [];
  W.forEach(function (w) {
    tot += w.imp;
    var s = hits(P.label, w.alts) ? 3 : hits(P.keyAll, w.alts) ? 2.5 : hits(P.text, w.alts) ? 1 : 0;
    if (s) { sum += s * w.imp; got.push(w); }
  });
  var core = got.filter(function (w) { return w.imp === 1; });
  if (!core.length && W.some(function (w) { return w.imp === 1; })) return null;   // only the place matched
  if (!got.length) return null;
  var score = sum / tot * 25, why = null, k;
  if (core.length >= 2) {
    if (core.every(function (w) { return hits(P.label, w.alts); })) score += 12;
    else for (k = 0; k < P.keys.length; k++) {
      if (core.every(function (w) { return hits(P.keys[k], w.alts); })) { score += 12; why = e.keys[k]; break; }
    }
  }
  if (!why && !core.every(function (w) { return hits(P.label, w.alts); })) {
    var most = 0;
    P.keys.forEach(function (kt, i) {
      var n = got.filter(function (w) { return hits(kt, w.alts); }).length;
      if (n > most) { most = n; why = e.keys[i]; }
    });
  }
  return score >= 15 ? { score: Math.min(score, 85), why: why } : null;
}

function searchIn(list, q) {
  q = q.trim().toLowerCase();
  var W = queryWords(q), out = [];
  for (var i = 0; i < list.length; i++) {
    var m = scoreEntry(list[i], q), w = W.length ? wordScore(list[i], W) : null;
    var best = !m ? w : !w ? m : (w.score > m.score ? w : m);
    if (best) out.push({ e: list[i], score: best.score, why: best.why });
  }
  out.sort(function (a, b) { return b.score - a.score; });
  return out.slice(0, 10);
}
function search(q) { return searchIn(IDX, q); }

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
        '<input id="huSearchInput" type="text" autocomplete="off" spellcheck="false" placeholder="What are you trying to figure out?" aria-label="Search the site">' +
        '<button type="button" class="hu-sr-cancel" aria-label="Close search">Cancel</button>' +
      '</div>' +
      '<div class="hu-sr-body" id="huSearchBody"></div>' +
      '<div class="hu-sr-kbd"><span>&uarr;&darr; move</span><span>&crarr; go</span><span>esc close</span></div>' +
    '</div>';
  document.body.appendChild(wrap);
  input = document.getElementById('huSearchInput');
  body = document.getElementById('huSearchBody');

  input.addEventListener('input', function () {
    if (!IDX) return;   // still loading: open() paints whatever is typed once it lands
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

/* q, when given, arrives typed in: an example chip opens straight onto its results */
function open(from, q) {
  if (!wrap) build();
  opener = from || document.activeElement;
  wrap.hidden = false;
  document.documentElement.classList.add('hu-search-open');
  input.value = q || '';
  input.focus();
  if (q) { try { input.setSelectionRange(q.length, q.length); } catch (e) { /* older engines */ } }
  function paint() { if (wrap.hidden) return; var v = input.value.trim(); if (v) renderResults(v); else renderEmpty(); }
  if (IDX) paint();
  else { body.innerHTML = '<div class="hu-sr-none">Loading the map&hellip;</div>'; loadIndex(paint); }
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
  if (btn) {
    ev.preventDefault();
    var q = btn.getAttribute('data-q') || '';
    if (q) gc('search/chip', q);
    open(btn, q);
  }
});

/* rank is the matcher alone, for tests: rank(index, query) -> [{ e, score, why }] */
window.HUSearch = { open: open, close: close, rank: searchIn };
})();
