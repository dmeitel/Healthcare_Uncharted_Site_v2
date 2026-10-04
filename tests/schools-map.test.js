'use strict';
/* The Schools layer of the Hospital Operations Map (2026-10-03; its own page until David folded it in the same day):
   the school file pull/ipeds.js writes, and the engine that reads it. The hospital layers' checks live in the other
   map tests; this file keeps the schools honest. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (/** @type {string[]} */ ...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const D = JSON.parse(read('src', 'assets', 'data', 'us-health-schools.json'));
const OPS = read('src', 'assets', 'js', 'tools', 'operators-map.js');
const PULL = read('scripts', 'pull', 'ipeds.js');
const STATES = new Set(JSON.parse(read('src', 'assets', 'data', 'geo', 'us-states.json')).features.map((/** @type {any} */ f) => f.properties.abbr));
const keysOf = (/** @type {string} */ src, /** @type {string} */ name) => {
  const block = (src.match(new RegExp('const ' + name + ' = \\{([\\s\\S]*?)\\n\\s*\\};')) || [])[1] || '';
  return new Set(Array.from(block.matchAll(/^\s*([a-z]+)\s*:/gm), (m) => m[1]));
};

test('every program row belongs to a school on the map, with awards at levels its rule allows', () => {
  const S = new Map(D.schools.map((/** @type {any[]} */ s) => [s[0], s]));
  assert.strictEqual(S.size, D.schools.length, 'one row per school');
  const seen = new Set();
  for (const [u, k, lv] of D.programs) {
    assert.ok(S.has(u), 'program for an unknown school ' + u);
    assert.ok(!seen.has(u + '/' + k), 'a school lists a program once: ' + u + '/' + k); seen.add(u + '/' + k);
    const rule = D._meta.programs[k];
    assert.ok(rule, 'unknown program ' + k);
    const allowed = new Set(Object.values(rule.codes).flat());
    for (const part of lv.split('|')) {
      const [l, n] = part.split(':').map(Number);
      assert.ok(allowed.has(l), k + ' at level ' + l + ' is not in its rule (' + u + ')');
      assert.ok(n > 0, 'a listed level has at least one award (' + u + '/' + k + ')');
      assert.ok(D._meta.levels[l], 'level ' + l + ' has a label');
    }
  }
});

test('every school sits in a state the map draws, inside the country, with a known control and online share', () => {
  for (const s of D.schools) {
    const [u, name, city, st, , lo, la, ctl, web, ol] = s;
    assert.ok(name && city, 'named and placed: ' + u);
    assert.ok(STATES.has(st), u + ' is in ' + st + ', which the map does not draw');
    assert.ok(lo > -180 && lo < -60 && la > 15 && la < 72, u + ' sits off the map at ' + lo + ',' + la);
    assert.ok([0, 1, 2, 3].includes(ctl), 'control code ' + ctl);
    assert.ok(web === '' || /^https?:\/\//.test(web), 'website ' + web);
    assert.ok(Number.isInteger(ol) && ol >= -1 && ol <= 100, 'online share ' + ol);
  }
});

test('the counts land where a real year does, and the label says which release they are', () => {
  const per = {};
  for (const [, k] of D.programs) per[k] = (per[k] || 0) + 1;
  // the pull refuses to write outside these; the test holds the shipped file to the same ranges
  const ranges = Object.fromEntries(Array.from(PULL.matchAll(/^\s+([a-z]+): \{ label: '[^']+', codes: .*?range: \[(\d+), (\d+)\] \},?$/gm), (m) => [m[1], [+m[2], +m[3]]]));
  assert.deepStrictEqual(Object.keys(ranges).sort(), Object.keys(D._meta.programs).sort(), 'every program has a range in the pull');
  for (const [k, [lo, hi]] of Object.entries(ranges)) assert.ok(per[k] >= lo && per[k] <= hi, k + ': ' + per[k] + ' outside ' + lo + '-' + hi);
  assert.match(D._meta.release.completions, /release/i);
  assert.strictEqual(D._meta.provisional, /provisional/i.test(D._meta.release.completions), 'the flag follows the dictionary line');
  assert.match(D._meta.pulled, /^\d{4}-\d{2}-\d{2}$/);
});

test('the engine knows every program in the file, and schools are a layer of the one operations map', () => {
  assert.deepStrictEqual([...keysOf(OPS, 'PROGRAMS')].sort(), Object.keys(D._meta.programs).sort());
  const shapes = Array.from(((OPS.match(/const PROGRAM_SHAPES = \{([^}]*)\}/) || [])[1] || '').matchAll(/([a-z]+):'/g), (m) => m[1]);
  assert.deepStrictEqual(shapes.sort(), Object.keys(D._meta.programs).sort(), 'every program has its pop-out shape');
  assert.ok(keysOf(OPS, 'HOSP_DATASETS').has('school'), 'Schools is a layer');
  assert.match(OPS, /school:\s*\{ label:'Schools',\s*noun:'schools',\s*file:'\/assets\/data\/us-health-schools\.json' \}/);
  // the separate page is gone, and nothing on the site still sends people to it
  assert.ok(!fs.existsSync(path.join(ROOT, 'src', 'tools', 'healthcare-schools-map')), 'the old schools page was folded in');
  assert.doesNotMatch(read('src', '_data', 'tools.js'), /healthcare-schools-map/);
  assert.doesNotMatch(read('src', 'fun', 'vital-stats', 'index.html'), /healthcare-schools-map/);
});

test('every Vital Stats school question answers with the number its map view shows', () => {
  // under ?layers=school&programs=, the state card counts the schools offering a program (a school lists a program
  // once, so that is its program count) and adds their graduates in it, places the state the way stateRank does (ties
  // share the better place), and a program's card shows its graduates; this recomputes each from the same file.
  // tmp/schools/vs-check.js reads them off the live map.
  const bank = JSON.parse(read('src', 'assets', 'data', 'vital-stats-questions.json')).questions.filter((/** @type {any} */ q) => q.see && /^ops\|layers=school&/.test(q.see));
  const S = new Map(D.schools.map((/** @type {any[]} */ s) => [s[0], s]));
  const P = D.programs.map((/** @type {any[]} */ p) => ({ u: String(p[0]), k: p[1], st: S.get(p[0])[3], g: p[2].split('|').reduce((a, x) => a + Number(x.split(':')[1]), 0) }));
  const fifty = [...STATES].filter((s) => !['DC', 'PR'].includes(s));
  let n = 0;
  for (const q of bank) {
    const a = new URLSearchParams(q.see.split('|')[1]), fac = a.get('fac'), st = a.get('state');
    const k = fac ? a.get('prog') : a.get('programs');
    let want;
    if (fac) want = P.find((p) => 'u' + p.u === fac && p.k === k).g;
    else if (!st) want = /^sch-grads-/.test(q.id) ? P.filter((p) => p.k === k).reduce((s, p) => s + p.g, 0) : P.filter((p) => p.k === k).length;
    else {
      const here = P.filter((p) => p.k === k && p.st === st);
      if (q.f === 'rank') want = 1 + fifty.filter((s) => P.filter((p) => p.k === k && p.st === s).length > here.length).length;
      else want = /^sch-grads-/.test(q.id) ? here.reduce((s, p) => s + p.g, 0) : here.length;
    }
    assert.strictEqual(q.a, want, q.id);
    n++;
  }
  assert.ok(n > 300, n + ' school questions checked');
});

test('a selected school pops out its programs on spokes wide enough that no two touch targets overlap', () => {
  // a school is one mark however many programs it lists; selecting it opens one 44px button per program around it
  const per = new Map();
  for (const [u] of D.programs) per.set(u, (per.get(u) || 0) + 1);
  const most = Math.max(...per.values());
  const expr = (OPS.match(/const R = (n === 1 \? \d+ : [^;]+);/) || [])[1];
  assert.ok(expr, 'the pop-out radius rule');
  const radius = /** @type {(n: number) => number} */ (new Function('n', 'return ' + expr));
  for (let n = 1; n <= most; n++) {
    const R = radius(n);
    assert.ok(R - 22 >= 10, n + ' programs: a button sits on the school mark');
    if (n > 1) assert.ok(2 * R * Math.sin(Math.PI / n) >= 44, n + ' programs: neighbors overlap at radius ' + R);
  }
});
