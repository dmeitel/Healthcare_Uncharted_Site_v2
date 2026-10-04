/**
 * Site search (src/assets/js/hu-search.js) against the built index (_site/assets/data/search-index.json).
 * Written 2026-10-04 when two of the three examples in the home page's search box ("travel pay in
 * Sacramento", "hospital prices") found nothing: the matcher needed the whole query inside one label or
 * key. Now every example a page shows must find a page, and plain questions must land where a person
 * would expect.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, '_site', 'assets', 'data', 'search-index.json');
if (!fs.existsSync(INDEX)) require('node:child_process').execSync('npx @11ty/eleventy', { stdio: 'inherit', cwd: ROOT });

function loadSearch() {
  const win = {};
  const doc = { addEventListener() {}, documentElement: { classList: { add() {}, remove() {} } } };
  const ctx = vm.createContext({ window: win, document: doc, location: {}, fetch: () => Promise.reject(new Error('no network')) });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/assets/js/hu-search.js'), 'utf8'), ctx);
  return win.HUSearch;
}
const S = loadSearch();
const idx = () => JSON.parse(fs.readFileSync(INDEX, 'utf8'));   // fresh copy: rank caches tokens on entries
const top = q => { const r = S.rank(idx(), q); return r.length ? r[0].e.url : null; };

test('the matcher is exposed for testing', () => {
  assert.equal(typeof S.rank, 'function');
});

test('every example chip on the home page finds the page it promises', () => {
  const home = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');
  const chips = [...home.matchAll(/data-q="([^"]+)"/g)].map(m => m[1]);
  assert.ok(chips.length >= 3, 'the home page shows example searches');
  const want = {
    'Travel pay': '/tools/cost-of-living/',
    'Hospitals near me': '/tools/operators-map/',
    'Respiratory therapist': '/tools/career-tree/',
    'Prior auth': /\/learn\//
  };
  for (const q of chips) {
    const url = top(q);
    assert.ok(url, '"' + q + '" finds nothing');
    if (want[q] instanceof RegExp) assert.match(url, want[q], q);
    else if (want[q]) assert.equal(url, want[q], q);
  }
});

test('every "Try:" example in a hub search box finds a page other than that hub', () => {
  // 2026-10-04: the Learn hub offered "FHIR", which only found the Learn hub, and the Rounds hub
  // offered "wound care" for a piece since retitled.
  const pages = { 'src/tools/index.html': '/tools/', 'src/learn/index.html': '/learn/', 'src/rounds/index.html': '/rounds/', 'src/secret-menu/index.html': '/secret-menu/', 'src/index.html': '/' };
  for (const [p, self] of Object.entries(pages)) {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    const m = html.match(/<b>Try:\s*([^<]+)<\/b>/);
    if (!m) continue;
    for (const q of m[1].split('&middot;').map(s => s.trim()).filter(Boolean)) {
      const url = top(q);
      assert.ok(url, p + ': the example "' + q + '" finds nothing');
      assert.notEqual(url, self, p + ': the example "' + q + '" only finds the hub it sits on');
    }
  }
});

test('a synonym matches whole words only', () => {
  // "authorization" brings in "auth"; it once matched the front of "author" and pulled up the About page
  const urls = S.rank(idx(), 'prior authorization').map(r => r.e.url);
  assert.ok(!urls.includes('/about/'), 'prior authorization should not find the About page');
});

test('plain questions land on the right tool', () => {
  const cases = [
    ['travel pay in Sacramento', '/tools/cost-of-living/'],
    ['rt pay', '/tools/career-tree/'],
    ['rt pay in utah', '/tools/career-tree/'],
    ['nurse pay', '/tools/career-tree/'],
    ['respiratory therapist salary', '/tools/career-tree/'],
    ['nursing jobs', '/tools/career-tree/'],
    ['nurse', '/tools/career-tree/'],
    ['how do i become a nurse', '/tools/career-tree/'],
    ['burnout', /\/rounds\//],
    ['Medicare AI', /\/rounds\//],
    ['hospitals near me', '/tools/operators-map/'],
    ['dialysis centers', '/tools/operators-map/'],
    ['sql practice', '/tools/sql-mystery/'],
    ['ehr vendors', '/tools/vendor-directory/']
  ];
  for (const [q, url] of cases) {
    if (url instanceof RegExp) assert.match(String(top(q)), url, '"' + q + '"');
    else assert.equal(top(q), url, '"' + q + '"');
  }
});

test('a search that worked before still ranks the same page first', () => {
  /** @type {Array<[string, string | RegExp]>} */
  const cases = [['travel pay', '/tools/cost-of-living/'], ['sql', '/tools/sql-mystery/'], ['epic', '/tools/vendor-directory/'], ['steward', /\/rounds\//]];
  for (const [q, url] of cases) {
    if (url instanceof RegExp) assert.match(String(top(q)), url, q); else assert.equal(top(q), url, q);
  }
});

test('filler words alone fall back to the phrase match and do not throw', () => {
  assert.doesNotThrow(() => S.rank(idx(), 'the'));
  assert.doesNotThrow(() => S.rank(idx(), '   '));
});

test('no redirect page sits in the index', () => {
  for (const e of idx()) assert.ok(!/^Moved to /.test(e.label), 'redirect stub in search: ' + e.label);
});
