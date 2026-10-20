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

/* Refreshed 2026-10-20. The first pass (2026-09-22) took 225 declarations across 26 pages to
   145 across 19; the passes since moved every reading page onto the shared layout, the brass
   header band, its glows and the aside columns included (.hu-read-band, .hu-read-hero-inner--aside).
   The same day the counter learned that a prefix may carry digits (.a7-hero, .p4-hero); before
   that, seven articles carrying a whole private header read zero.
   The last one, Camp Nauvoo, stands alone on David's call (DECISIONS CN1, 2026-10-20) and is named below instead. */
const BASELINE = {};

/* Pages that write their own whole document and name no layout: the shared shell cannot reach them, so they are not
   counted. Each one is here by name, on David's call, so a page cannot leave the count by writing its own head. */
const STANDALONE = ['src/secret-menu/camp-nauvoo/index.html'];

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

test('the standalone pages are the ones David named', () => {
  const now = JSON.parse(execFileSync(process.execPath, [SCRIPT, '--standalone'], { encoding: 'utf8' }));
  assert.deepEqual(now, STANDALONE, "a page writes its own document with no layout. Put it on base.njk, or, on David's call, "
    + 'name it in STANDALONE with why.');
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
