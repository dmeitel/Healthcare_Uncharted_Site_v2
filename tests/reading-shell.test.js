'use strict';
/**
 * reading-shell.test.js — the consistency ratchet.
 *
 * Every other gate in this repo asks a question about ONE page: does it overflow, is its text
 * readable, does a label sit outside its box. None of them ask whether page A looks like page B.
 * That is why 225 shell declarations across 26 pages survived a full eight-viewport sweep that
 * passed. Nothing was broken. It was all just slightly different, and slightly different is the
 * thing David could feel and could not point at:
 *
 *   "we keep making content that works as a standalone within its own... single time use."
 *
 * The cause was structural rather than careless. docs/HU-PAGE-RECIPES.md used to say: copy this
 * CSS block, rename the prefix. So every reading page is a fork, and forks drift. Measured
 * 2026-09-22: five different h1 sizes across 14 pages, eight different hero paddings across 13
 * with no majority at all, eight eyebrow letter-spacings, four paragraph line-heights.
 *
 * The rule here is a RATCHET. A page may LOSE shell declarations, never gain them. A new page
 * starts at zero because it uses the .hu-read shell in hu-global.css. That turns "make the site
 * consistent" from a taste argument into a number going to zero, which a script can check and
 * David does not have to.
 *
 * WHEN THIS FAILS BECAUSE YOU CONVERTED A PAGE: that is the good failure. Re-run
 * `node scripts/shell-drift.js --json` and paste the new numbers into BASELINE. The numbers may
 * only go down. Raising one is a review conversation, not an edit.
 */
const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'shell-drift.js');

/* Refreshed 2026-09-22 after the first migration pass: 145 declarations across 19 of 31
   reading pages, down from 225 across 26. What is LEFT is card, grid, hero, note and link,
   which carry real page design (a gradient, a hover border, a column count) rather than pure
   type. scripts/shell-convert.js refuses those on purpose; merging them is a design call. */
const BASELINE = {
  'src/learn/talks/arma-2026/index.html': 29,
  'src/secret-menu/camp-nauvoo/index.html': 17,
  'src/learn/index.html': 11,
  'src/learn/talks/msrc-2026/index.html': 11,
  'src/learn/process-engineering/index.html': 9,
  'src/learn/laws-and-paradoxes/index.html': 8,
  'src/rounds/index.html': 8,
  'src/learn/alarm-fatigue/index.html': 7,
  'src/learn/patient-data-record/index.html': 7,
  'src/learn/request-routing/index.html': 6,
  'src/secret-menu/index.html': 6,
  'src/about/index.html': 5,
  'src/learn/4ps-framework/index.html': 5,
  'src/tools/index.html': 5,
  'src/learn/healthcare-data-sources/index.html': 4,
  'src/404.html': 2,
  'src/learn/home-respiratory-timeline/index.html': 2,
  'src/learn/oxygen-payment-cuts/index.html': 2,
  'src/index.html': 1,
};

function current() {
  return JSON.parse(execFileSync(process.execPath, [SCRIPT, '--json'], { encoding: 'utf8' }));
}

test('no reading page gains its own copy of the shared shell', () => {
  const now = current();
  const risen = [];
  for (const [page, count] of Object.entries(now)) {
    const was = BASELINE[page];
    if (was === undefined) {
      risen.push(page + ' is new and declares ' + count + ' shell concepts; use .hu-read instead');
    } else if (count > was) {
      risen.push(page + ' went from ' + was + ' to ' + count);
    }
  }
  assert.deepEqual(risen, [],
    'a reading page grew its own shell. The shared one is .hu-read in hu-global.css and its '
    + 'classes are listed in docs/HU-PAGE-RECIPES.md section 3.');
});

test('the shell migration only moves forward', () => {
  const now = current();
  const total = Object.values(now).reduce((s, n) => s + n, 0);
  const base = Object.values(BASELINE).reduce((s, n) => s + n, 0);
  assert.ok(total <= base,
    'total shell declarations rose from ' + base + ' to ' + total + '. This number only goes down.');
  if (total < base) {
    console.log('    shell drift: ' + total + ' left, down from ' + base
      + '. Refresh BASELINE with: node scripts/shell-drift.js --json');
  }
});

test('the shared shell holds the majority values it was built from', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'css', 'hu-global.css'), 'utf8');
  /* These are the values most of the site ALREADY used, which is the whole point: adopting the
     shell moves the fewest pages the least distance. Changing one is a site-wide design
     decision, so it breaks this test on purpose rather than sliding through. */
  assert.match(css, /\.hu-read-h1\s*\{[^}]*clamp\(44px,7vw,86px\)/, 'hu-read-h1 lost its size');
  assert.match(css, /\.hu-read-h2\s*\{[^}]*clamp\(28px,4vw,42px\)/, 'hu-read-h2 lost its size');
  assert.match(css, /\.hu-read-eyebrow\s*\{[^}]*letter-spacing:\.22em/, 'hu-read-eyebrow lost its tracking');
  assert.match(css, /\.hu-read\s*\{[^}]*line-height:1\.78/, 'hu-read lost its reading line-height');
});
