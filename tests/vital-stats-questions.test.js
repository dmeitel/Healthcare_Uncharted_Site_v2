/**
 * Vital Stats' question bank: src/assets/data/vital-stats-questions.json.
 *
 * The game shows one number a round and then the source it came from, so a bad
 * row is a wrong fact on screen with the site's name under it. These tests hold
 * the shape the game reads, the sourcing rules from CLAUDE.md (every curated
 * number carries its URL and the date it was checked live), the no-em-dash rule,
 * and the promise that the file is exactly what scripts/build-vital-stats.js makes
 * from today's data, so a hand edit or a stale bank fails here.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BANK = path.join(ROOT, 'src', 'assets', 'data', 'vital-stats-questions.json');
const CURATED = path.join(ROOT, 'scripts', 'data', 'vital-stats-curated.json');
const CATS = ['Workforce', 'Coverage', 'Hospitals', 'Money', 'Health'];
const DATE = /^\d{4}-\d{2}(-\d{2})?$/;

const raw = fs.readFileSync(BANK, 'utf8');
const bank = JSON.parse(raw);
const curated = JSON.parse(fs.readFileSync(CURATED, 'utf8'));
const curatedIds = new Set(curated.questions.map((q) => q.id));

test('the bank has the envelope the game reads', () => {
  assert.equal(bank.v, 1);
  assert.match(bank.built, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Array.isArray(bank.questions));
});

test('there are at least 150 questions', () => {
  assert.ok(bank.questions.length >= 150, 'only ' + bank.questions.length + ' questions');
});

test('ids are unique, short and stable-looking', () => {
  const seen = new Set();
  for (const q of bank.questions) {
    assert.match(q.id, /^[a-z0-9-]{3,40}$/, 'bad id ' + q.id);
    assert.ok(!seen.has(q.id), 'duplicate id ' + q.id);
    seen.add(q.id);
  }
});

test('every question has the full schema', () => {
  for (const q of bank.questions) {
    const at = ' (' + q.id + ')';
    assert.ok(CATS.includes(q.cat), 'unknown category ' + q.cat + at);
    for (const k of ['q', 'unit', 'src', 'why', 'checked']) {
      assert.equal(typeof q[k], 'string', k + ' missing' + at);
      assert.ok(q[k].trim().length > 0, k + ' empty' + at);
    }
    assert.equal(typeof q.pre, 'string', 'pre missing' + at);
    assert.equal(typeof q.suf, 'string', 'suf missing' + at);
    assert.ok(Number.isInteger(q.dp) && q.dp >= 0 && q.dp <= 2, 'dp must be 0, 1 or 2' + at);
    assert.ok(Number.isInteger(q.year) && q.year >= 2000 && q.year <= 2100, 'bad year' + at);
    assert.match(q.checked, DATE, 'checked must be YYYY-MM or YYYY-MM-DD' + at);
    if ('url' in q) assert.match(q.url, /^https:\/\//, 'url must be https' + at);
    assert.ok(q.q.endsWith('?'), 'question should end with a question mark' + at);
  }
});

test('every answer is a finite positive number, already rounded to its dp', () => {
  for (const q of bank.questions) {
    assert.equal(typeof q.a, 'number', 'answer is not a number (' + q.id + ')');
    assert.ok(Number.isFinite(q.a) && q.a > 0, 'answer must be finite and positive (' + q.id + ')');
    const f = Math.pow(10, q.dp);
    assert.equal(Math.round(q.a * f) / f, q.a, 'answer carries more decimals than dp (' + q.id + ')');
  }
});

test('every curated question carries a URL and a full check date', () => {
  const inBank = bank.questions.filter((q) => curatedIds.has(q.id));
  assert.equal(inBank.length, curatedIds.size, 'a curated question is missing from the bank');
  for (const q of inBank) {
    assert.match(q.url || '', /^https:\/\//, 'curated question without a url (' + q.id + ')');
    assert.match(q.checked, /^\d{4}-\d{2}-\d{2}$/, 'curated question needs a YYYY-MM-DD check date (' + q.id + ')');
  }
  for (const c of curated.questions) {
    assert.ok(c.quote && c.quote.length > 10, 'curated question has no verification quote (' + c.id + ')');
  }
});

test('the verification quotes stay out of the shipped bank', () => {
  for (const q of bank.questions) assert.ok(!('quote' in q), 'quote leaked into the bank (' + q.id + ')');
});

test('every category is represented', () => {
  for (const c of CATS) {
    const n = bank.questions.filter((q) => q.cat === c).length;
    assert.ok(n >= 10, c + ' has only ' + n + ' questions');
  }
});

test('no em dash anywhere in the bank or the curated source', () => {
  assert.ok(!raw.includes('\u2014'), 'em dash in vital-stats-questions.json');
  assert.ok(!fs.readFileSync(CURATED, 'utf8').includes('\u2014'), 'em dash in vital-stats-curated.json');
});

test('no banned words in the copy', () => {
  const banned = [/\bdelve/i, /straightforward/i, /genuinely/i, /it's worth noting/i, /here's the thing/i, /\breceipts\b/i];
  for (const q of bank.questions) {
    for (const re of banned) {
      assert.ok(!re.test(q.q) && !re.test(q.why), re + ' in ' + q.id);
    }
  }
});

test('re-running the builder reproduces the file byte for byte', () => {
  const { build } = require('../scripts/build-vital-stats.js');
  // The builder writes LF. Git on David's machine checks text out with CRLF
  // (autocrlf, see .gitattributes), so line endings are the one difference allowed.
  assert.equal(build(), raw.replace(/\r\n/g, '\n'), 'vital-stats-questions.json is stale or hand-edited. Run: node scripts/build-vital-stats.js');
});

test('variety: no one way of opening a question takes over the everyday mix', () => {
  const mix = bank.questions.filter((q) => !q.more);
  /** @type {Record<string, number>} */
  const opens = {};
  for (const q of mix) { const w = q.q.split(' ').slice(0, 3).join(' '); opens[w] = (opens[w] || 0) + 1; }
  const [top, n] = Object.entries(opens).sort((a, b) => b[1] - a[1])[0];
  assert.ok(n / mix.length <= 0.25, '"' + top + '" opens ' + n + ' of ' + mix.length + ' everyday questions');
  assert.ok(Object.keys(opens).length >= 20, 'only ' + Object.keys(opens).length + ' different openings');
});

test('the forms keep their answers honest: one in N, a place, and per hour', () => {
  const byId = Object.fromEntries(bank.questions.map((q) => [q.id, q]));
  for (const q of bank.questions) {
    if (q.f === 'in') {
      assert.equal(q.pre, '1 in ', 'one-in-N prints as "1 in N" (' + q.id + ')');
      assert.ok(Number.isInteger(q.a) && q.a >= 2 && q.a <= 34, 'one in ' + q.a + ' (' + q.id + ')');
    }
    if (q.f === 'rank') {
      assert.equal(q.pre, '#', 'a place prints as #N (' + q.id + ')');
      assert.ok(Number.isInteger(q.a) && q.a >= 1 && q.a <= 51, 'place ' + q.a + ' (' + q.id + ')');
    }
    if (q.f === 'hr') {
      const annual = byId[q.id.replace('pay-hr-', 'pay-')];
      assert.ok(annual, 'an hourly question has its annual twin (' + q.id + ')');
      assert.ok(Math.abs(q.a * 2080 - annual.a) < 11, 'hourly times 2,080 is the annual median (' + q.id + ')');
      assert.equal(q.k, annual.k, 'the two never share a game (' + q.id + ')');
    }
  }
});
