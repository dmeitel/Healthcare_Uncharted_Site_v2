'use strict';
/* Equipment supplier types (2026-10-03, step 4): what scripts/build-suppliers.js writes into the home equipment,
   orthotics and optical files, and what the Hospital Operations Map reads from them. The map takes the groups, their
   labels and the CMS category names from the files, so the files are what is checked here. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (/** @type {string[]} */ ...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const EQUIP = ['dme', 'optical', 'orthotics-prosthetics'].map((k) => JSON.parse(read('src', 'assets', 'data', 'us-suppliers-' + k + '.json')));
const OPS = read('src', 'assets', 'js', 'tools', 'operators-map.js');

test('the three equipment files share one supply dictionary, and every category sits in exactly one group', () => {
  const [first] = EQUIP;
  for (const f of EQUIP) {
    assert.deepStrictEqual(f._meta.supplies, first._meta.supplies, f._meta.kind + ' has its own dictionary');
    assert.deepStrictEqual(f._meta.groups, first._meta.groups, f._meta.kind + ' has its own groups');
  }
  const { supplies, groups } = first._meta;
  assert.deepStrictEqual(supplies, supplies.slice().sort(), 'the dictionary is alphabetical, so indexes are stable');
  assert.ok(groups.length <= 30, 'groups ride a 31-bit mask');
  const seen = new Map();
  for (const g of groups) {
    assert.match(g.key, /^[a-z]+$/, 'a group key is a plain word');
    assert.ok(g.label && !/—/.test(g.label), 'a group has a plain label');
    for (const i of g.items) { assert.ok(!seen.has(i), supplies[i] + ' is in two groups'); seen.set(i, g.key); }
  }
  const loose = supplies.filter((s, i) => !seen.has(i) && s !== 'Unknown');
  assert.deepStrictEqual(loose, [], 'a CMS category in no group');
});

test('each supplier\'s group mask is exactly the groups of the categories it carries', () => {
  let n = 0;
  for (const f of EQUIP) {
    const { supplies, groups } = f._meta;
    const groupOf = new Map(groups.flatMap((g, gi) => g.items.map((i) => [i, gi])));
    for (const s of f.facilities) {
      const idx = s.sl ? s.sl.match(/.{2}/g).map((x) => parseInt(x, 36)) : [];
      for (const i of idx) assert.ok(supplies[i], s.id + ' names a category the dictionary lacks');
      let mask = 0;
      for (const i of idx) if (groupOf.has(i)) mask |= 1 << groupOf.get(i);
      assert.strictEqual(s.sg || 0, mask, s.id);
      n++;
    }
  }
  assert.ok(n > 15000, n + ' suppliers checked');
});

test('pharmacies keep their file as it was, and the map filters only the equipment layers', () => {
  const ph = JSON.parse(read('src', 'assets', 'data', 'us-suppliers-pharmacy.json'));
  assert.ok(!ph._meta.supplies && !ph._meta.groups, 'no supply dictionary on pharmacies');
  assert.ok(ph.facilities.every((/** @type {any} */ s) => !('sg' in s) && !('sl' in s)), 'no supply fields on pharmacies');
  assert.match(OPS, /const SUPPLY_LAYERS = new Set\(\['dme', 'optical', 'ortho'\]\)/);
  // the orthotics file names its kind in full; the map has to know that name or the layer draws as a hospital type
  assert.match(OPS, /'orthotics-prosthetics':'ortho'/);
  assert.match(OPS, /'orthotics-prosthetics':'pentagon'/);
});

test('every supplier file says which CMS release it is and when it was fetched, and the pharmacy shards match the file', () => {
  // 2026-10-03: the files were built from a June copy for four months because the cache never expired and nothing said
  // its age. build-suppliers.js now writes the release date and the fetch date, and the supplier card reads them.
  const ALL = ['pharmacy', 'dme', 'optical', 'orthotics-prosthetics'].map((k) => JSON.parse(read('src', 'assets', 'data', 'us-suppliers-' + k + '.json')));
  for (const f of ALL) {
    assert.match(String(f._meta.released), /^\d{4}-\d{2}-\d{2}$/, f._meta.kind + ' names its CMS release');
    assert.match(String(f._meta.pulled), /^\d{4}-\d{2}-\d{2}$/, f._meta.kind + ' names the day it was fetched');
    assert.ok(f._meta.pulled >= f._meta.released, f._meta.kind + ' was fetched after it was released');
  }
  assert.strictEqual(new Set(ALL.map((f) => f._meta.released)).size, 1, 'all four files come from one release');
  assert.match(OPS, /SUPPLY_META\.released/, 'the supplier card reads the release from the file');
  assert.doesNotMatch(OPS, /June 2026 pull/, 'no hand-written pull date');
  // the map loads pharmacies by state from shards cut from the pharmacy file (build-geo-serving.js --pharmacy); a refresh
  // that skips that step leaves the map on the old list
  const dir = path.join(ROOT, 'src', 'assets', 'data', 'geo', 'pharmacy');
  const inShards = fs.readdirSync(dir).reduce((n, f) => n + JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).features.length, 0);
  const ph = ALL[0].facilities.filter((/** @type {any} */ x) => x.la != null && x.lo != null && x.s).length;
  assert.strictEqual(inShards, ph, 'run node scripts/build-geo-serving.js --pharmacy after a supplier refresh');
});
