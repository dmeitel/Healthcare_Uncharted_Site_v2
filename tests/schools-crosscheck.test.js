'use strict';
/* The accreditor cross-check (2026-10-03, scripts/check-schools.js): the Schools layer held against LCME, AACOM,
   ARC-PA, CoARC, CCNE and ACEN. These checks keep it from going quietly stale: a new IPEDS pull that was never
   cross-checked, a hand-checked pair whose accreditor row is gone, a medical program on the map that no accreditor
   lists, contact details leaking into the saved lists, and the map's accreditation file drifting from the schools. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const read = (/** @type {string[]} */ ...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const SCHOOLS = JSON.parse(read('src', 'assets', 'data', 'us-health-schools.json'));
const X = JSON.parse(read('data-build', 'schools-crosscheck.json'));
const MAP = JSON.parse(read('src', 'assets', 'data', 'us-health-schools-accred.json'));
const ACC = read('data-build', 'accreditors.json');
const fingerprint = crypto.createHash('sha1').update(JSON.stringify(SCHOOLS.programs)).digest('hex').slice(0, 12);

test('the cross-check ran against the school file the map ships', () => {
  assert.strictEqual(X._meta.schools, fingerprint, 'the schools file changed since the last check: run npm run check:schools');
  assert.strictEqual(MAP._meta.schools, fingerprint, 'the map\'s accreditation file is from an older schools file: run npm run check:schools');
});

test('no hand-checked pair has outlived its accreditor row', () => {
  assert.deepStrictEqual(X.stale, []);
});

test('every MD and DO program on the map is on its accreditor\'s list', () => {
  // physicians train only at accredited schools, so a miss here is the matcher's fault or a new problem in the data
  assert.deepStrictEqual(X.mapOnly.filter((/** @type {any} */ r) => r.prog === 'md' || r.prog === 'do').map((/** @type {any} */ r) => r.name), []);
});

test('the saved accreditor lists keep names and places, never a person\'s email or phone', () => {
  assert.doesNotMatch(ACC, /[\w.+-]+@[\w-]+\.[\w.]+/, 'an email address');
  assert.doesNotMatch(ACC, /\(\d{3}\)\s?\d{3}-\d{4}|\b\d{3}-\d{3}-\d{4}\b/, 'a phone number');
});

test('every accreditation row the map reads belongs to a school and program the map draws', () => {
  const has = new Set(SCHOOLS.programs.map((/** @type {any[]} */ p) => p[0] + '|' + p[1]));
  const bad = MAP.rows.filter((/** @type {any[]} */ r) => !has.has(r[0] + '|' + r[1])).map((/** @type {any[]} */ r) => r.slice(0, 3).join(' '));
  assert.deepStrictEqual(bad.slice(0, 5), []);
  for (const r of MAP.rows) assert.ok(MAP._meta.sources[r[2]], 'a source the file names: ' + r[2]);
  assert.ok(MAP.rows.length > 700, MAP.rows.length + ' rows');
});

test('the hollow marks: placed inside their state, never a school the map already counts, never a duplicate', () => {
  // David, 2026-10-03: "show new programs and campus marks". They are drawn apart from the counted schools, so a mark
  // that is really a counted school, or one far outside its state, would be a public mistake.
  const STATES = JSON.parse(read('src', 'assets', 'data', 'geo', 'us-states.json')).features;
  const box = Object.fromEntries(STATES.map((/** @type {any} */ f) => [f.properties.abbr, f.properties.bb || null]));
  const counted = new Set(SCHOOLS.schools.map((/** @type {any[]} */ s) => 'u' + s[0]));
  const ids = new Set();
  for (const x of MAP.extra) {
    const [id, kind, name, , st, lon, lat, how, par, progs] = x;
    assert.ok(!ids.has(id), 'one mark per id: ' + id); ids.add(id);
    assert.ok(['campus', 'new', 'outside'].includes(kind), name + ' kind ' + kind);
    assert.ok(!counted.has(id), name + ' is already a counted school');
    assert.ok(['ipeds', 'address', 'hand', 'city'].includes(how), name + ' placed by ' + how);
    assert.ok(Array.isArray(progs) && progs.length && progs.every((/** @type {any[]} */ p) => ['md', 'do', 'pa', 'rt'].includes(p[0])), name + ' programs');
    if (kind === 'campus') assert.ok(SCHOOLS.schools.some((/** @type {any[]} */ s) => s[0] === par), name + ' counts under a school on the map');
    const bb = box[st];
    if (bb) assert.ok(lon >= bb[0] - 0.5 && lon <= bb[2] + 0.5 && lat >= bb[1] - 0.5 && lat <= bb[3] + 0.5, name + ' sits outside ' + st + ' at ' + lon + ',' + lat);
    else assert.ok(lon > -180 && lon < -60 && lat > 15 && lat < 72, name + ' sits off the map');
  }
  // a new program at a counted school belongs to that school, and is not one it already graduates
  const has = new Set(SCHOOLS.programs.map((/** @type {any[]} */ p) => p[0] + '|' + p[1]));
  for (const [u, k] of MAP.fresh) {
    assert.ok(counted.has('u' + u), 'fresh ' + k + ' at ' + u + ' is at a school on the map');
    assert.ok(!has.has(u + '|' + k), u + ' already graduates ' + k);
  }
});

test('Rocky Vista University carries its Utah campus, and Noorda is reported as missing from IPEDS', () => {
  // the two cases that started this (David, 2026-10-03): a branch campus counted out of state, and a school too new for the federal data
  const rvu = SCHOOLS.schools.find((/** @type {any[]} */ s) => s[1] === 'Rocky Vista University');
  assert.ok(MAP.rows.some((/** @type {any[]} */ r) => r[0] === rvu[0] && r[1] === 'do' && r[5] === 'Ivins' && r[6] === 'UT'));
  assert.ok(X.rows.some((/** @type {any} */ r) => /Noorda/.test(r.name) && r.place === 'not in IPEDS'));
  // and both are marks of their own now: Noorda in Provo, the Utah campus in Ivins under Rocky Vista
  assert.ok(MAP.extra.some((/** @type {any[]} */ x) => /^Noorda/.test(x[2]) && x[1] === 'outside' && x[4] === 'UT'));
  assert.ok(MAP.extra.some((/** @type {any[]} */ x) => x[1] === 'campus' && x[3] === 'Ivins' && x[8] === rvu[0]));
});
