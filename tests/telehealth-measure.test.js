'use strict';
/* The Population Health Map's telehealth measure (2026-10-03, DECISIONS M1, David: "go, fix the telehealth measure
   next"). It was "Telehealth adoption" from "Mixed: AHA, payer reports" with no traceable state numbers; it is now
   Medicare telehealth use from CMS's Medicare Telehealth Trends, pulled by scripts/pull/telehealth.js. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (/** @type {string[]} */ ...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const CFG = JSON.parse(read('src', '_data', 'metricsConfig.json'));
const STATE = JSON.parse(read('src', '_data', 'stateData.json'));
const YEARS = JSON.parse(read('src', '_data', 'dataYears.json'));

test('the telehealth measure is Medicare telehealth use, from CMS, with a value for every state', () => {
  const items = CFG.clinical.items;
  const i = items.findIndex((/** @type {any} */ x) => x.id === 'clinical/medicare-telehealth-use');
  assert.ok(i >= 0, 'the measure exists under its new id');
  assert.ok(!items.some((/** @type {any} */ x) => x.id === 'clinical/telehealth-adoption'), 'the old id is retired, not reused');
  const it = items[i];
  assert.match(it.sourceUrl, /^https:\/\/data\.cms\.gov\/.*medicare-telehealth-trends$/);
  assert.match(String(it.retrievedDate), /^\d{4}-\d{2}$/);
  assert.match(it.caveat, /Original Medicare only/, 'the card says whose visits it counts');
  const vals = STATE.clinical[String(i)];
  const states = Object.keys(STATE.payer['0']);
  assert.deepStrictEqual(Object.keys(vals).sort(), states.sort(), 'every state the map draws');
  for (const [st, v] of Object.entries(vals)) assert.ok(typeof v === 'number' && v >= 3 && v <= 60, st + ' ' + v);
  assert.ok(YEARS.clinical[String(i)] >= 2025, 'a full calendar year from the CMS file');
});

test('no measure on the map leans on "mixed" or "various" sources any more', () => {
  for (const [lens, v] of Object.entries(CFG)) {
    if (!v || !Array.isArray(/** @type {any} */ (v).items)) continue;
    for (const it of /** @type {any} */ (v).items) assert.doesNotMatch(String(it.source) + ' ' + String(it.method), /\bmixed\b|\bvarious\b/i, lens + ' ' + it.id);
  }
});

test('every pull script is a dry run unless given --write (pull/all.js runs them all)', () => {
  const dir = path.join(ROOT, 'scripts', 'pull');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js') && x !== 'all.js')) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.match(src, /process\.argv\.includes\('--write'\)/, f + ' reads --write');
  }
});
