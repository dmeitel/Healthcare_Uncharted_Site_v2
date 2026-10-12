/**
 * David's page review marks (scripts/lib/reviews.js, 2026-10-11): a page takes a NIGHT and a DAY mark, each with its
 * note, a mark goes stale when the page's source changes after it, and an old single mark reads as "before the
 * refresh" and counts for neither. Run against a temporary file, never his real one.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const R = require('../scripts/lib/reviews');

function tmp(initial) {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hu-rev-')), 'page-reviews.json');
  fs.writeFileSync(f, JSON.stringify(initial || {}));
  return f;
}

test('a page takes a night mark and a day mark, each with its own note', () => {
  const f = tmp();
  R.set('/fun/', 'night', 'brass reads well', true, f);
  R.set('/fun/', 'day', '', true, f);
  const e = R.read(f)['/fun/'];
  assert.strictEqual(e.night.note, 'brass reads well');
  assert.ok(e.night.date && e.night.at, 'a date and a time');
  assert.strictEqual(e.day.note, '');
  R.set('/fun/', 'night', '', false, f);
  assert.ok(!R.read(f)['/fun/'].night, 'clearing night leaves day');
  R.set('/fun/', 'day', '', false, f);
  assert.ok(!('/fun/' in R.read(f)), 'clearing both removes the page');
});

test('an old single mark reads as before the refresh and counts for neither theme', () => {
  const f = tmp({ '/learn/': { date: '2026-10-10', note: '' } });
  const m = R.marks(R.read(f)['/learn/']);
  assert.deepStrictEqual([m.night, m.day], [null, null]);
  assert.strictEqual(m.legacy.date, '2026-10-10');
  R.set('/learn/', 'night', '', true, f);
  const m2 = R.marks(R.read(f)['/learn/']);
  assert.ok(m2.night && m2.legacy && m2.legacy.date === '2026-10-10', 'the old mark is kept beside the new one');
});

test('a mark goes stale when the page changes after it', () => {
  const entry = { night: { date: '2026-10-01', at: '2026-10-01T12:00:00.000Z', note: '' } };
  // package.json changes far more recently than 2026-10-01 in this repo; any real file newer than the mark will do
  const src = 'package.json';
  assert.strictEqual(R.marks(entry, src).nightChanged, R.changedAt(src) > Date.parse(entry.night.at) + 1000);
  assert.strictEqual(R.marks({ night: { date: '2099-01-01', at: '2099-01-01T00:00:00.000Z', note: '' } }, src).nightChanged, false, 'a mark after the change is still good');
  assert.throws(() => R.set('/x/', /** @type {any} */ ('dusk'), '', true, tmp()), /night or day/);
});

test('a new note never erases an old one: the note it replaces goes on the mark\'s earlier list', () => {
  const f = tmp();
  R.set('/', 'night', 'drop the example searches', true, f);
  R.set('/', 'night', 'centered now, good', true, f);
  R.set('/', 'night', 'centered now, good', true, f);   // the same note again adds nothing
  R.set('/', 'night', '', true, f);                      // an empty note on a later pass keeps the last words too
  const e = R.read(f)['/'].night;
  assert.strictEqual(e.note, '');
  assert.deepStrictEqual(e.earlier.map((x) => x.note), ['drop the example searches', 'centered now, good']);
});

test('the review run (data-build/review-run.json) names live pages, each once', () => {
  // 2026-10-11: the review screen walks the run's pages first; a page that moved or left would strand the one button
  const run = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data-build', 'review-run.json'), 'utf8'));
  assert.ok(run.name && Array.isArray(run.pages) && run.pages.length, 'a run has a name and pages');
  assert.strictEqual(new Set(run.pages).size, run.pages.length, 'no page twice');
  const SRC = path.join(__dirname, '..', 'src');
  for (const p of run.pages) {
    const dir = path.join(SRC, p);
    const found = ['index.html', 'index.njk', 'index.md', 'index.11ty.js'].some((f) => fs.existsSync(path.join(dir, f)));
    assert.ok(found, p + ' has no source page under src/');
  }
});

test('a finished page (data-build/review-finished.json) is a live page, and its marks never go stale', () => {
  // 2026-10-11, his first full review: five pages "do not need to be reviewed every time"
  const list = R.finished();
  const SRC = path.join(__dirname, '..', 'src');
  assert.ok(Object.keys(list).length, 'the list has pages');
  for (const [p, v] of Object.entries(list)) {
    assert.ok(v.since, p + ' says since when');
    const dir = path.join(SRC, p);
    const found = ['index.html', 'index.njk', 'index.md', 'index.11ty.js'].some((f) => fs.existsSync(path.join(dir, f)));
    assert.ok(found, p + ' has no source page under src/');
  }
  // a mark from long ago on a page whose source changed since still reads as done once the page is finished
  const p = Object.keys(list)[0];
  const src = ['index.html', 'index.njk'].map((f) => path.join('src', p, f)).find((f) => fs.existsSync(path.join(__dirname, '..', f)));
  const old = { night: { date: '2000-01-01', at: '2000-01-01T00:00:00.000Z', note: '' } };
  assert.strictEqual(R.marks(old, src).nightChanged, true, 'without the url the old mark is stale');
  const m = R.marks(old, src, p);
  assert.ok(m.finished, 'finished');
  assert.strictEqual(m.nightChanged, false, 'and never stale');
});
