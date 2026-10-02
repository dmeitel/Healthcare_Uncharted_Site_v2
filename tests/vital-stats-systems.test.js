/**
 * Vital Stats' health system games (2026-10-01): src/assets/data/vital-stats-systems/, one file per system
 * plus index.json, the picker's list.
 *
 * The game puts a coworker's own hospital on screen with a number and a source under it, so a bad row is a
 * wrong fact about somebody's workplace with the site's name on it. These tests hold the shape the page reads,
 * the sourcing (every question resolves to a source and a check date; every one of the systems' own numbers
 * keeps the phrase it was read from, unshipped), the names people actually say instead of CMS's all-caps list,
 * the no-em-dash rule, and the promise that the folder is exactly what scripts/build-vital-stats-systems.js
 * makes from today's data.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'src', 'assets', 'data', 'vital-stats-systems');
const CURATED = path.join(ROOT, 'scripts', 'data', 'vital-stats-systems-curated.json');
const CATS = ['Workforce', 'Coverage', 'Hospitals', 'Money', 'Health'];
const FEATURED = ['Intermountain Health', 'Kaiser Permanente', 'HCA Healthcare', 'Northwell Health'];

const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
/** @type {Record<string, any>} */
const files = {};
for (const r of index.systems) files[r.id] = JSON.parse(fs.readFileSync(path.join(DIR, r.id + '.json'), 'utf8'));

test('the folder is exactly what the builder makes, byte for byte, with no stray files', () => {
  const { build } = require('../scripts/build-vital-stats-systems.js');
  const want = build();
  const have = fs.readdirSync(DIR).sort();
  assert.deepEqual(have, Object.keys(want).sort(), 'files in the folder vs files the builder writes');
  for (const f of have) {
    assert.equal(want[f], fs.readFileSync(path.join(DIR, f), 'utf8').replace(/\r\n/g, '\n'), f + ' is stale or hand-edited. Run: npm run build:vital-stats');
  }
});

test('the picker lists the four David named first, and every row matches its file', () => {
  const feat = index.systems.filter((/** @type {any} */ r) => r.f).sort((/** @type {any} */ a, /** @type {any} */ b) => a.f - b.f).map((/** @type {any} */ r) => r.name);
  assert.deepEqual(feat, FEATURED);
  assert.ok(index.systems.length >= 100, 'only ' + index.systems.length + ' systems');
  for (const r of index.systems) {
    assert.match(r.id, /^[a-z0-9-]{2,40}$/, 'id ' + r.id);
    const f = files[r.id];
    assert.equal(f.id, r.id); assert.equal(f.name, r.name);
    assert.equal(f.questions.length, r.q, r.id + ' question count');
    assert.ok(r.n >= 3 && Array.isArray(r.st) && r.st.length >= 1, r.id + ' size and states');
  }
});

test('every question has the full schema and resolves to a source with a check date', () => {
  const seen = new Set();
  for (const r of index.systems) {
    const f = files[r.id];
    for (const q of f.questions) {
      const at = ' (' + q.id + ')';
      assert.ok(!seen.has(q.id), 'duplicate id' + at); seen.add(q.id);
      assert.match(q.id, /^sy-[a-z0-9-]{3,64}$/, 'id' + at);
      assert.equal(q.sys, r.id, 'sys' + at);
      assert.ok(CATS.includes(q.cat), 'category' + at);
      assert.match(q.k, /^(sy|cur)-[a-z-]+$/, 'template' + at);
      assert.ok(typeof q.q === 'string' && q.q.endsWith('?'), 'question' + at);
      for (const k of ['unit', 'why']) assert.ok(typeof q[k] === 'string' && q[k].trim(), k + at);
      assert.ok(Number.isInteger(q.dp) && q.dp >= 0 && q.dp <= 2, 'dp' + at);
      assert.ok(Number.isFinite(q.a) && q.a > 0, 'answer' + at);
      const k = Math.pow(10, q.dp); assert.equal(Math.round(q.a * k) / k, q.a, 'answer rounded to dp' + at);
      assert.ok(Number.isInteger(q.year) && q.year >= 2020 && q.year <= 2030, 'year' + at);
      const S = q.s ? f.src[q.s] : q;
      assert.ok(S, 'source ' + q.s + at);
      assert.ok(typeof S.src === 'string' && S.src.length > 10, 'src' + at);
      assert.match(S.checked, /^\d{4}-\d{2}(-\d{2})?$/, 'checked' + at);
      if (S.url) assert.match(S.url, /^https:\/\//, 'url' + at);
      assert.ok(!('quote' in q), 'a verification quote leaked into the shipped file' + at);
      assert.ok(!('sub' in q), 'a line under the question ships once in the file\'s table, by u' + at);
      if (q.u != null) {
        const sub = f.subs[q.u];
        assert.ok(typeof sub === 'string' && /\.$/.test(sub) && !sub.includes('?') && sub.length <= 140, 'the line under the question' + at);
      }
    }
  }
});

test('one wording per template: the same fact about another hospital reads the same, only the name and year change', () => {
  /** @type {Record<string, Set<string>>} */
  const forms = {};
  const STATES = require('../scripts/build-vital-stats.js').STATE_NAMES;
  for (const r of index.systems) {
    for (const q of files[r.id].questions) {
      if (/-own-/.test(q.id) || /-biggest$/.test(q.id)) continue;         // the systems' own facts are one of a kind
      let t = q.q;
      if (q.h) t = t.split(q.h).join('{H}');                              // first: a hospital's name can hold its system's
      t = t.split(r.name).join('{SYS}');
      if (q.st) t = t.split(STATES[q.st]).join('{S}');
      t = t.replace(/\b(fiscal )?(19|20)\d{2}\b/g, '{Y}');
      (forms[q.k] = forms[q.k] || new Set()).add(t);
    }
  }
  for (const [k, set] of Object.entries(forms)) assert.equal(set.size, 1, k + ' is asked ' + set.size + ' ways:\n' + Array.from(set).slice(0, 4).join('\n'));
  for (const k of ['sy-beds', 'sy-icu', 'sy-dc', 'sy-los', 'sy-occ', 'sy-mcr', 'sy-mcd', 'sy-fte', 'sy-res', 'sy-count', 'sy-state', 'sy-share']) {
    assert.ok(forms[k], k + ' exists');
  }
});

test('every system can fill a game: at least eight templates, so ten rounds rarely repeat one', () => {
  for (const r of index.systems) {
    const ks = new Set(files[r.id].questions.map((/** @type {any} */ q) => q.k));
    assert.ok(ks.size >= 8, r.id + ' has ' + ks.size + ' templates');
  }
});

test('hospital names read the way people say them, not as CMS prints them', () => {
  /** @param {string} id */
  const names = (id) => new Set(files[id].questions.filter((/** @type {any} */ q) => q.h).map((/** @type {any} */ q) => q.h));
  const ih = names('intermountain-health');
  for (const n of ['Intermountain Medical Center', 'McKay-Dee Hospital', 'LDS Hospital', 'Utah Valley Hospital', 'St. James Hospital', "Primary Children's Hospital"]) assert.ok(ih.has(n), 'Intermountain: ' + n);
  assert.ok(names('kaiser-permanente').has('Kaiser San Jose'), 'Kaiser Foundation Hospital - San Jose reads as Kaiser San Jose');
  assert.ok(names('northwell-health').has('Southside Hospital'), 'the old NS/LIJ HS prefix is gone');
  for (const r of index.systems) {
    for (const q of files[r.id].questions) {
      if (!q.h) continue;
      assert.notEqual(q.h, q.h.toUpperCase(), 'an all-caps name: ' + q.h);
      assert.ok(!/\b(LLC|INC|DBA)\b/i.test(q.h), 'a legal suffix in a name: ' + q.h);
    }
  }
});

test('the systems\' own numbers carry a URL, a full check date and the phrase they came from', () => {
  const cur = JSON.parse(fs.readFileSync(CURATED, 'utf8'));
  assert.deepEqual(Object.keys(cur.systems).sort(), FEATURED.slice().sort());
  for (const [name, list] of Object.entries(cur.systems)) {
    for (const c of /** @type {any[]} */ (list)) {
      assert.match(c.url, /^https:\/\//, name + ' ' + c.id);
      assert.match(c.checked, /^\d{4}-\d{2}-\d{2}$/, name + ' ' + c.id);
      assert.ok(c.quote && c.quote.length > 5 && c.quote.split(/\s+/).length < 15, 'quote kept and short: ' + name + ' ' + c.id);
    }
  }
});

test('no em dash and no banned words in any shipped system file', () => {
  const banned = [/\bdelve/i, /straightforward/i, /genuinely/i, /it's worth noting/i, /here's the thing/i, /\breceipts\b/i];
  for (const f of fs.readdirSync(DIR)) {
    const text = fs.readFileSync(path.join(DIR, f), 'utf8');
    assert.ok(!text.includes('\u2014'), 'em dash in ' + f);
    for (const re of banned) assert.ok(!re.test(text), re + ' in ' + f);
  }
  assert.ok(!fs.readFileSync(CURATED, 'utf8').includes('\u2014'), 'em dash in the curated source');
});
