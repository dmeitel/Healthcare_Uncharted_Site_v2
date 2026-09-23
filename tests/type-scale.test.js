// THE TYPE SCALE, AND THE TWO WAYS IT BROKE SILENTLY ON 2026-09-20.
//
// 1. A stray `*/` with no opener turned the rest of a comment into CSS garbage.
//    At top level the parser then swallowed the NEXT `{` as the garbage's block,
//    which ate `@media (max-width:699px){ :root{ ... } }` whole. The phone token
//    values never applied to a single page.
// 2. Nothing noticed, because scripts/phone-check.js reads its floor FROM the
//    tokens so the gate and the stylesheet cannot drift. With the media block
//    gone, `--t-micro` fell back to its DESKTOP value of 11px, the gate lowered
//    its own floor to 11, and every page reported clean at a size the standard
//    forbids. A gate that reads its threshold from the thing it is checking has
//    to be told what that threshold may NOT be.
//
// Proven against the real failure: reintroducing the stray `*/` makes the
// balance test fire at that line. The reachability check alone does NOT catch it,
// because the extra closer just shifts where comment-stripping lands. The balance
// check is the tripwire that matters.
// NOTE: this repo is CRLF. Split lines on a CR-tolerant pattern, never on a
// bare newline. A bare-newline replace against this file silently matches
// nothing, which is how the first attempt at proving this test compared the
// file to itself and reported a pass.
// These tests are the two tripwires. They are cheap and they run on every build.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const CSS_DIR = path.join(__dirname, '..', 'src', 'assets', 'css');
const GLOBAL = path.join(CSS_DIR, 'hu-global.css');

const cssFiles = fs.readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));

test('every stylesheet has balanced block comments', () => {
  for (const f of cssFiles) {
    const src = fs.readFileSync(path.join(CSS_DIR, f), 'utf8');
    let depth = 0;
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const opens = (lines[i].match(/\/\*/g) || []).length;
      const closes = (lines[i].match(/\*\//g) || []).length;
      depth += opens - closes;
      assert.ok(depth >= 0,
        `${f}:${i + 1} closes a comment that was never opened, which turns the rest of the `
        + `block into CSS garbage and can swallow the next rule whole:\n    ${lines[i].trim().slice(0, 90)}`);
    }
    assert.equal(depth, 0, `${f} ends inside an unclosed comment`);
  }
});

// Parse the token values out of :root and out of the phone block, so a broken
// media query shows up as a missing phone value rather than as silence.
function tokens(block) {
  const out = {};
  for (const m of block.matchAll(/--t-([a-z]+)\s*:\s*([0-9.]+)px/g)) out[m[1]] = Number(m[2]);
  return out;
}

const css = fs.readFileSync(GLOBAL, 'utf8');
const ROLES = ['lede', 'body', 'sub', 'ui', 'fine', 'label', 'micro'];

test('the desktop scale defines every role', () => {
  const root = css.slice(css.indexOf('--t-lede'), css.indexOf('/* Surface / text aliases'));
  const t = tokens(root);
  for (const r of ROLES) assert.ok(t[r] > 0, `--t-${r} is missing from :root`);
});

test('the phone block is REACHABLE and raises every role', () => {
  // Find the media query as the CSS parser would: it must start a rule, not sit
  // inside a comment or behind a dangling one.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const mq = stripped.match(/@media\s*\(max-width:\s*699px\)\s*,\s*\(max-height:\s*500px\)\s*\{\s*:root\s*\{([^}]*)\}/);
  assert.ok(mq, 'no reachable "@media (max-width:699px), (max-height:500px){ :root{ ... } }" block: '
    + 'the phone type scale is not applying to any page');

  const phone = tokens(mq[1]);
  const root = tokens(css.slice(css.indexOf('--t-lede'), css.indexOf('/* Surface / text aliases')));
  for (const r of ROLES) {
    assert.ok(phone[r] > 0, `--t-${r} is missing from the phone block`);
    // DESIGN.md, "The Two Surfaces", consequence 1: type scales UP on a phone,
    // never down. A phone value below its desktop one is the bug, not a choice.
    assert.ok(phone[r] >= root[r],
      `--t-${r} is ${phone[r]}px on a phone and ${root[r]}px on a desktop; a phone value is never smaller`);
  }
});

test('the phone floors hold the numbers the standard names', () => {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const mq = stripped.match(/@media\s*\(max-width:\s*699px\)\s*,\s*\(max-height:\s*500px\)\s*\{\s*:root\s*\{([^}]*)\}/);
  const phone = tokens(mq[1]);
  // These are the two numbers scripts/phone-check.js reads as its floors. If the
  // stylesheet ever hands it something lower, the gate quietly stops enforcing.
  assert.equal(phone.micro, 12, 'the absolute phone floor must be 12px');
  assert.equal(phone.label, 13, 'the functional phone floor must be 13px');
});

test('the phone token block tests the SHORTER side, not the width', () => {
  // 2026-09-21. A width-only 699 query serves the desktop layout to a phone held
  // sideways (about 740px wide), which is what broke 22 of 54 pages in landscape.
  // The comfort scale is the worst place for it to regress: a landscape phone would
  // silently drop back to the desktop type sizes.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const widthOnly = [...stripped.matchAll(/@media\s*\(max-width:\s*699px\)(?!\s*,\s*\(max-height)/g)];
  assert.deepEqual(widthOnly.map((m) => m[0]), [],
    'a width-only 699px query is back in hu-global.css; the phone query is '
    + '"(max-width:699px), (max-height:500px)", both halves, always');
});

test('no stylesheet reintroduces a sub-floor font-size literal', () => {
  // The migration put every size on a token. A literal creeping back is how the
  // 4,044 sub-floor elements happened the first time.
  for (const f of cssFiles) {
    const src = fs.readFileSync(path.join(CSS_DIR, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const bad = [...src.matchAll(/font-size:\s*([0-9]|10|11)(\.[0-9])?px/g)].map((m) => m[0]);
    assert.deepEqual(bad, [], `${f} sets a sub-floor font-size literal instead of a --t-* token: ${bad.join(', ')}`);
  }
});
