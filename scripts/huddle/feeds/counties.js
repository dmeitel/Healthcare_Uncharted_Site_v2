'use strict';
/**
 * FEED: the Population Health Map's counties (2026-10-18).
 *
 * Reads: src/assets/data/countyData.json (every county's value, with each measure's name and year in its own meta),
 * src/assets/data/us-counties.json (population, to pick the counties people know) and the county names in
 * src/assets/data/geo/counties/. The source, link and check date are the measure's own in metricsConfig, read through
 * the state feed (state-metrics.js, measures), which also words each measure; so only a measure a pull script refreshed
 * is asked, the same rule as the states.
 * Asks, inside one state, among its biggest counties: which of four had the highest (or lowest) figure, and which of
 * two had the higher one. A county a hair from another is never asked (3 percent for four, 6 for two).
 * A new row: a measure the pulls add at the county grain joins these on the next build.
 * Left out: Alaska (boroughs and census areas), Connecticut (planning regions), Virginia and the other independent
 * cities (a city and a county can share a name), and states with fewer than four counties of 100,000 people.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, readJson, rngFrom, STATES, FIFTY, kOf, idOf } = require('../lib');
const { measures } = require('./state-metrics');

const reads = ['src/assets/data/countyData.json', 'src/assets/data/us-counties.json', 'src/assets/data/geo/counties/'];

const SKIP_STATES = ['AK', 'CT', 'VA', 'DC'];
const CITY = new Set(['24510', '29510', '32510']);                 // Baltimore city, St. Louis city, Carson City
const FIPS = { AL: '01', AZ: '04', AR: '05', CA: '06', CO: '08', DE: '10', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17', IN: '18', IA: '19',
  KS: '20', KY: '21', LA: '22', ME: '23', MD: '24', MA: '25', MI: '26', MN: '27', MS: '28', MO: '29', MT: '30', NE: '31', NV: '32', NH: '33',
  NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38', OH: '39', OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46', TN: '47', TX: '48',
  UT: '49', VT: '50', WA: '53', WV: '54', WI: '55', WY: '56' };

function countyNames() {
  const dir = path.join(ROOT, reads[2]);
  const names = {};
  for (const f of fs.readdirSync(dir).sort()) {
    const txt = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of txt.matchAll(/"fips":"(\d{5})","name":"([^"]+)"/g)) names[m[1]] = m[2];
  }
  return names;
}

function build(ctx) {
  const C = readJson(reads[0]);
  const pop = readJson(reads[1]);
  const names = countyNames();
  const stateData = readJson('src/_data/stateData.json');
  const label = (fips, st) => (fips === '36047' ? 'Kings County (Brooklyn)' : st === 'LA' ? names[fips] + ' Parish' : names[fips] + ' County');
  // the county grain of a measure: its own lens and index, or the same measure filed under another lens
  const byName = {};
  for (const [lens, idx] of Object.entries(C.meta || {})) for (const [i, m] of Object.entries(idx)) byName[m.name] = [lens, i];
  // each state's biggest counties, most populous first
  const big = {};
  for (const st of FIFTY) {
    if (SKIP_STATES.includes(st) || !FIPS[st]) continue;
    big[st] = Object.keys(pop).filter((f) => f.slice(0, 2) === FIPS[st] && !CITY.has(f) && names[f] && pop[f].p >= 100000)
      .sort((a, b) => pop[b].p - pop[a].p || a.localeCompare(b)).slice(0, 6);
  }
  const out = [];
  for (const m of measures(ctx)) {
    if (!m.fresh || !m.S) continue;
    const at = (C[m.lens] && C[m.lens][m.index]) ? [m.lens, m.index] : byName[m.it.name];
    const vals = at && C[at[0]] && C[at[0]][at[1]];
    if (!vals) continue;
    const S = m.S, r = rngFrom('huddle|co|' + m.it.id);
    const base = { ...m.base, f: 'Counties', src: m.base.src + ', county estimates' };
    const see = (f, st) => `plm|lens=${m.lens}&metric=${m.slug}&state=${st}&county=${f}|${label(f, st)}, ${STATES[st]}`;
    const states = r.shuffle(Object.keys(big).filter((st) => big[st].length >= 4 && big[st].every((f) => typeof vals[f] === 'number')));
    const stateVal = (st) => (stateData[m.lens] && stateData[m.lens][m.index] ? stateData[m.lens][m.index][st] : null);
    let four = 0, two = 0;
    for (const st of states) {
      if (four >= 6 && two >= 6) break;
      const rows = big[st].map((f) => ({ f, v: vals[f] }));
      const sv = stateVal(st);
      if (typeof sv !== 'number') continue;
      const hint = `${STATES[st]}'s statewide figure: ${S.fmt(sv)}.`;
      if (four < 6) {
        const pick = r.shuffle(rows).slice(0, 4);
        const lo = m.low && four % 2 === 1;
        const vs = pick.map((x) => x.v), best = lo ? Math.min(...vs) : Math.max(...vs), rest = vs.filter((v) => v !== best);
        const next = lo ? Math.min(...rest) : Math.max(...rest);
        if (rest.length === 3 && Math.abs(best - next) >= Math.max(Math.abs(best) * 0.03, S.dp >= 2 ? 0.03 : S.dp === 1 ? 0.3 : 1)) {
          const ans = vs.indexOf(best);
          out.push({ ...base, id: `co-${idOf(m.it.id.split('/')[1])}-${st.toLowerCase()}-four-0`, k: kOf('co', m.it.id, 'four'), d: 3, t: 'choice',
            q: `Which of these ${STATES[st]} ${st === 'LA' ? 'parishes' : 'counties'} had the ${lo ? 'lowest' : 'highest'} ${m.what}?`, o: pick.map((x) => label(x.f, st)), a: ans,
            v: pick.map((x) => S.fmt(x.v)), h: hint, see: see(pick[ans].f, st) });
          four++;
          continue;                                                   // one question a state, so a state is not asked twice
        }
      }
      if (two < 6) {
        const pair = r.shuffle(rows).slice(0, 2);
        const [x, y] = pair.map((p) => p.v);
        if (Math.abs(x - y) >= Math.max(Math.max(Math.abs(x), Math.abs(y)) * 0.06, S.dp >= 2 ? 0.05 : S.dp === 1 ? 0.5 : 1)) {
          const ans = x > y ? 0 : 1;
          out.push({ ...base, id: `co-${idOf(m.it.id.split('/')[1])}-${st.toLowerCase()}-two-0`, k: kOf('co', m.it.id, 'two'), d: 2, t: 'choice',
            q: `Which ${STATES[st]} ${st === 'LA' ? 'parish' : 'county'} had the higher ${m.what}?`, o: pair.map((p) => label(p.f, st)), a: ans,
            v: pair.map((p) => S.fmt(p.v)), h: hint, see: see(pair[ans].f, st) });
          two++;
        }
      }
    }
  }
  return out;
}

module.exports = { name: 'counties', prefix: 'co-', reads, build };
