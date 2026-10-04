#!/usr/bin/env node
'use strict';
/**
 * pull/telehealth.js: Medicare telehealth use by state (clinical lens), from CMS's Medicare Telehealth Trends.
 *
 * Replaced the hand-entered "Telehealth adoption" measure on 2026-10-03 (DECISIONS M1, David: "go, fix the telehealth
 * measure next"). That one claimed "share of outpatient visits delivered via telehealth" from "mixed: AHA, payer
 * reports", and no public source gives that for every state and every payer. This is the closest measure that does
 * exist for every state, from Medicare's own claims, and it says plainly whose visits it counts.
 *
 * The measure is CMS's Pct_Telehealth for a full calendar year (the "Overall" quarter), every beneficiary group "All":
 * people in Original Medicare (Part B fee-for-service) with at least one paid telehealth visit, video or audio-only,
 * divided by those with at least one service on Medicare's telehealth list, in person or not. The state is the
 * beneficiary's mailing address. The year is the latest one with all four quarters in the file. CMS calls its periods
 * preliminary while claims keep arriving, so a re-run can move a value a little.
 * Definitions: data.cms.gov/resources/medicare-telehealth-trends-data-dictionary (read 2026-10-03).
 *
 * SAFE BY DEFAULT
 *   node scripts/pull/telehealth.js            dry run (writes nothing)
 *   node scripts/pull/telehealth.js --write    apply
 *   node scripts/pull/telehealth.js --refresh  re-download (ignore the cache)
 */
const fs = require('fs');
const path = require('path');
const { metricIndexById } = require('../lib/metric-id');

const ROOT = path.join(__dirname, '..', '..');
const P = (/** @type {string[]} */ ...p) => path.join(ROOT, ...p);
const CACHE = P('scripts', '.cache', 'telehealth');
const ID = 'clinical/medicare-telehealth-use';
const DATASET = '939226be-b107-476e-8777-f199a840138a';   // the dataset's id: its data-viewer always names the current file
const META_URL = `https://data.cms.gov/data-api/v1/dataset/${DATASET}/data-viewer?size=1`;
const SOURCE_URL = 'https://data.cms.gov/summary-statistics-on-use-and-payments/medicare-medicaid-service-type-reports/medicare-telehealth-trends';
const WRITE = process.argv.includes('--write'), REFRESH = process.argv.includes('--refresh');
const read = (/** @type {string} */ rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const round1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
// a state's share of Medicare patients using telehealth has run roughly 10 to 35 percent since 2022; outside 3 to 60
// means the file or the rule changed
const RANGE = [3, 60];

/** the current CSV and when CMS last changed it */
async function current() {
  const res = await fetch(META_URL);
  if (!res.ok) throw new Error('data-viewer ' + res.status);
  const m = (await res.json()).meta;
  const url = 'https://data.cms.gov' + m.data_file_url;
  const t = (m.data_file_meta_data || {}).csvFileModifiedTime;   // seconds since 1970
  const modified = /^\d+$/.test(String(t)) ? new Date(+t * 1000).toISOString().slice(0, 10) : String(t || '').slice(0, 10);
  return { url, name: m.data_file_name, modified };
}

(async () => {
  console.log('Medicare telehealth use by state, from CMS Medicare Telehealth Trends.');
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);
  const { url, name, modified } = await current();
  const file = path.join(CACHE, name);
  if (REFRESH || !fs.existsSync(file)) {
    console.log('  downloading ' + url);
    const r = await fetch(url);
    if (!r.ok) throw new Error('csv ' + r.status);
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(file, await r.text());
  }
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  const head = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ n) => { const i = head.indexOf(n.toLowerCase()); if (i < 0) throw new Error('no column ' + n + ' (the file changed shape)'); return i; };
  const C = { y: col('Year'), q: col('quarter'), geo: col('Bene_Geo_Desc'), dual: col('Bene_Mdcd_Mdcr_Enrl_Stus'), race: col('Bene_Race_Desc'), sex: col('Bene_Sex_Desc'),
    ent: col('Bene_Mdcr_Entlmt_Stus'), age: col('Bene_Age_Desc'), ruca: col('Bene_RUCA_Desc'), elig: col('Total_Bene_TH_Elig'), users: col('Total_Bene_Telehealth'), pct: col('Pct_Telehealth') };
  // the file has no quoted commas; a row that splits wrong fails the column count and is skipped
  const rows = lines.slice(1).map((l) => l.split(',')).filter((f) => f.length === head.length);
  const all = (/** @type {string[]} */ f) => [C.dual, C.race, C.sex, C.ent, C.age, C.ruca].every((i) => f[i] === 'All');

  // the latest year with all four quarters for the nation
  const quarters = new Map();
  for (const f of rows) if (f[C.geo] === 'National' && all(f) && /^[1-4]$/.test(f[C.q])) { if (!quarters.has(f[C.y])) quarters.set(f[C.y], new Set()); quarters.get(f[C.y]).add(f[C.q]); }
  const year = [...quarters].filter(([, q]) => q.size === 4).map(([y]) => +y).sort((a, b) => b - a)[0];
  if (!year) throw new Error('no year with four quarters');

  const stateData = read('src/_data/stateData.json');
  const cfg = read('src/_data/metricsConfig.json');
  const { lens, index } = metricIndexById(cfg, ID);
  const expected = new Set(Object.keys(stateData[lens][index] || {}));
  const nameToAbbr = Object.fromEntries(read('src/assets/data/geo/us-states.json').features.map((/** @type {any} */ f) => [f.properties.name.toLowerCase(), f.properties.abbr]));
  /** @type {Record<string, number>} */
  const values = {};
  let national = null;
  for (const f of rows) {
    if (+f[C.y] !== year || f[C.q] !== 'Overall' || !all(f)) continue;
    const pct = parseFloat(f[C.pct]);
    if (!Number.isFinite(pct)) continue;
    if (f[C.geo] === 'National') { national = round1(pct * 100); continue; }
    const ab = nameToAbbr[f[C.geo].toLowerCase()];
    if (ab && expected.has(ab)) values[ab] = round1(pct * 100);
  }
  const missing = [...expected].filter((s) => values[s] == null);
  const odd = Object.entries(values).filter(([, v]) => v < RANGE[0] || v > RANGE[1]);
  const sorted = Object.entries(values).sort((a, b) => b[1] - a[1]);
  console.log(`  ${year} (all four quarters), file ${name}, CMS modified ${modified || 'unknown'}`);
  console.log(`  national ${national}% · ${Object.keys(values).length}/${expected.size} states · highest ${sorted.slice(0, 3).map(([s, v]) => s + ' ' + v).join(', ')} · lowest ${sorted.slice(-3).map(([s, v]) => s + ' ' + v).join(', ')}`);
  const cur = stateData[lens][index] || {};
  const moved = [...expected].filter((s) => values[s] != null && cur[s] !== values[s]).length;
  console.log(`  ${moved} states differ from the current values`);
  if (missing.length || odd.length || national == null) {
    console.error(`\nrefusing to write: missing ${missing.join(',') || 'none'}; outside ${RANGE.join('-')}: ${odd.map(([s, v]) => s + ' ' + v).join(', ') || 'none'}`);
    process.exitCode = 1; return;
  }
  if (!WRITE) { console.log('\nDry run complete. Nothing written. Re-run with --write to apply.'); return; }

  stateData[lens][index] = values;
  fs.writeFileSync(P('src/_data/stateData.json'), JSON.stringify(stateData, null, 2) + '\n');
  const years = read('src/_data/dataYears.json');
  if (years[lens]) years[lens][index] = year;
  fs.writeFileSync(P('src/_data/dataYears.json'), JSON.stringify(years, null, 2) + '\n');
  const item = cfg[lens].items[+index];
  const now = new Date();
  item.source = 'CMS Medicare Telehealth Trends';
  item.sourceUrl = SOURCE_URL;
  item.retrievedDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  fs.writeFileSync(P('src/_data/metricsConfig.json'), JSON.stringify(cfg, null, 2) + '\n');
  console.log(`\nWrote ${lens}[${index}] for ${year} to stateData.json, dataYears.json, metricsConfig.json. Next: npm run build.`);
})().catch((e) => { console.error('\npull/telehealth FAILED:', e.message); process.exitCode = 1; });
