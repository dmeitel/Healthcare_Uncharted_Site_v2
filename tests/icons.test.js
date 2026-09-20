/**
 * The icon subset — src/assets/js/hu-icons.js.
 *
 * The site used to pull the whole Lucide UMD bundle from unpkg on every page:
 * 80 KB over the wire, 355 KB to parse, ~1,500 icons for the 96 this site uses.
 * Now a generated subset ships instead. The risk that buys is silent: add a new
 * data-lucide name, forget to regenerate, and that icon renders as nothing at all
 * with no error anywhere. These tests are what turns that into a build failure.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const GEN = path.join(SRC, 'assets', 'js', 'hu-icons.js');

function walk(dir, hits = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p, hits); continue; }
    if (/\.(njk|html|js)$/i.test(e.name)) hits.push(p);
  }
  return hits;
}

/** every data-lucide name authored anywhere in src/, with the file that uses it */
function usedNames() {
  const used = new Map();
  for (const f of walk(SRC)) {
    if (f === GEN) continue;
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/data-lucide=["']([a-z0-9-]+)["']/g)) {
      if (!used.has(m[1])) used.set(m[1], path.relative(ROOT, f));
    }
  }
  return used;
}

/** the names the generated file actually carries */
function shippedNames() {
  const src = fs.readFileSync(GEN, 'utf8');
  const m = src.match(/var I = (\{.*?\});\n/s);
  assert.ok(m, 'could not find the icon table in hu-icons.js');
  return new Set(Object.keys(JSON.parse(m[1])));
}

test('the generated icon file exists', () => {
  assert.ok(fs.existsSync(GEN), 'run: node scripts/build-icons.js');
});

test('every data-lucide name used in src/ ships in the subset', () => {
  const used = usedNames();
  const shipped = shippedNames();
  const missing = [...used.entries()].filter(([n]) => !shipped.has(n));
  assert.deepEqual(
    missing.map(([n, f]) => n + ' (' + f + ')'), [],
    'icons used but not generated. Run: node scripts/build-icons.js'
  );
});

test('the subset carries no icons the site stopped using', () => {
  const used = usedNames();
  const extra = [...shippedNames()].filter((n) => !used.has(n));
  assert.deepEqual(extra, [], 'stale icons in the bundle. Run: node scripts/build-icons.js');
});

test('it exposes the same API the site calls: window.lucide.createIcons', () => {
  const src = fs.readFileSync(GEN, 'utf8');
  assert.match(src, /window\.lucide = \{ createIcons/, 'iceberg-map.js calls lucide.createIcons() after re-rendering');
});

test('it stays far smaller than the bundle it replaced', () => {
  const kb = fs.statSync(GEN).size / 1024;
  assert.ok(kb < 60, 'subset grew to ' + kb.toFixed(0) + ' KB; the unpkg bundle it replaced parsed at 355 KB');
});

test('nothing loads lucide from a third party any more', () => {
  const offenders = [];
  for (const f of walk(SRC)) {
    if (f === GEN) continue;
    const txt = fs.readFileSync(f, 'utf8');
    if (/(unpkg\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)[^"')\s]*lucide/i.test(txt)) {
      offenders.push(path.relative(ROOT, f));
    }
  }
  assert.deepEqual(offenders, [], 'a third-party lucide is back; the CSP no longer allows unpkg');
});
