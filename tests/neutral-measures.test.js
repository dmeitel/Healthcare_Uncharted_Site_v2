'use strict';
/* Neutral measures on the Population Health Map (2026-10-03, David: "go, fix the neutral measures next"). A measure
   with no better or worse (metricsConfig dir 0) used to run on the worse → better scale and rank "1 = best". It now
   runs lower → higher on the Career Tree's pay ramp, so no color is new, and nothing calls a state better or worse. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (/** @type {string[]} */ ...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const CFG = JSON.parse(read('src', '_data', 'metricsConfig.json'));
const MAP = read('src', 'assets', 'js', 'tools', 'multi-lens-map.js');
const TREE = read('src', 'assets', 'js', 'tools', 'career-tree.js');

test('every measure says which way it reads: better higher, better lower, or neither', () => {
  for (const [lens, v] of Object.entries(CFG)) {
    if (!v || !Array.isArray(/** @type {any} */ (v).items)) continue;
    for (const it of /** @type {any} */ (v).items) assert.ok([-1, 0, 1].includes(it.dir), lens + ' ' + it.id + ' dir ' + it.dir);
  }
});

test('the neutral ramp is the Career Tree pay ramp in quarters, so the map brings no new color', () => {
  const [, lo, hi] = TREE.match(/mode === 'pay'\s*\?\s*lerpHex\('(#[0-9a-fA-F]{6})', '(#[0-9a-fA-F]{6})'/) || [];
  assert.ok(lo && hi, 'the Career Tree pay ramp');
  const lerp = (/** @type {number} */ t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(lo.slice(i, i + 2), 16) + (parseInt(hi.slice(i, i + 2), 16) - parseInt(lo.slice(i, i + 2), 16)) * t).toString(16).padStart(2, '0')).join('');
  const level = (MAP.match(/const LEVEL = \[([^\]]+)\]/) || [])[1];
  assert.ok(level, 'the map names its neutral ramp');
  assert.deepStrictEqual(level.split(',').map((s) => s.trim().replace(/'/g, '').toLowerCase()), [0, 0.25, 0.5, 0.75, 1].map(lerp));
});

test('a neutral measure is colored, labelled, ranked and compared without better or worse', () => {
  assert.match(MAP, /neutral\(item\(\)\) \? LEVEL\[i\]/, 'its colors come from the neutral ramp');
  assert.match(MAP, /'lower → higher' : 'worse → better'/, 'its legend reads lower to higher');
  assert.match(MAP, /'1 = highest on this metric' : '1 = best on this metric'/, 'its rank reads 1 = highest');
  assert.match(MAP, /'Highest first' : 'Best first'/, 'its rankings list reads highest first');
  assert.match(MAP, /' higher' \}/, 'a comparison names the higher state, not the better one');
  const n = Object.values(CFG).reduce((a, v) => a + (Array.isArray(/** @type {any} */ (v).items) ? /** @type {any} */ (v).items.filter((/** @type {any} */ it) => it.dir === 0).length : 0), 0);
  assert.ok(n >= 10, n + ' neutral measures');
});
