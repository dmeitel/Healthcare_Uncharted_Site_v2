'use strict';
/**
 * FEED: the hospitals' Medicare cost reports (2026-10-18).
 *
 * Reads: src/assets/data/us-hospital-cost-reports.json (CMS HCRIS Worksheet S-3, written by
 * scripts/build-vital-stats-systems.js with the same numbers Vital Stats asks; its _meta carries the source, the link
 * and the pull date), and src/assets/data/us-hospitals.json for each hospital's name, state and kind. The facts asked
 * are the cost report's; the hospital list only says which hospital is which.
 * Asks:
 *   - which of four health systems reported the most beds, ICU beds, discharges, employees or residents, or the
 *     highest Medicare or Medicaid share of inpatient days (systems with five or more hospitals on file);
 *   - in each state, which of four general or children's hospitals reported the most beds, and which trained the
 *     most residents;
 *   - in each state, which of four of its largest hospitals had the highest Medicaid share of inpatient days.
 * A new row: a new pull of the cost reports, or a hospital added to the list, re-deals these on the next build.
 */
const { readJson, rngFrom, STATES, FIFTY, commas, median, kOf, idOf } = require('../lib');
const { shortName, RENAMED } = require('../../build-vital-stats-systems.js');

const reads = ['src/assets/data/us-hospital-cost-reports.json', 'src/assets/data/us-hospitals.json'];

const MCR_SUB = 'Medicare Advantage plans included. Counted in days spent in a bed, not in people.';
const MCD_SUB = 'Medicaid managed care plans included. Counted in days spent in a bed, not in people.';
/* the system questions, by the file's own field names; `of` is the index in a system's row */
const REPORTS = 'its hospitals\' latest Medicare cost reports';
const SYS = [
  { key: 'beds', of: 3, z: 'prv', f: 'Systems', q: `reported the most hospital beds on ${REPORTS}`, sub: 'Every hospital in the system with a full year on file, added up.' },
  { key: 'icu', of: 4, z: 'prv', f: 'Systems', q: `reported the most intensive care beds on ${REPORTS}`, sub: 'Every intensive and special care unit counts, added up across its hospitals.' },
  { key: 'dc', of: 5, z: 'prv', f: 'Systems', q: `reported the most inpatient discharges on ${REPORTS}`, sub: 'Each inpatient stay that ended counts once, added up across its hospitals.' },
  { key: 'fte', of: 6, z: 'prv', f: 'Systems', q: `had the most full-time-equivalent employees, by ${REPORTS}`, sub: 'Two half-time employees count as one. Hospital payroll only.' },
  { key: 'res', of: 9, z: 'prv', f: 'Teaching', q: `trained the most resident physicians, by ${REPORTS}`, sub: 'Interns and residents, full-time equivalent, added up across its hospitals.' },
  { key: 'mcr', of: 7, z: 'pay', f: 'Payer mix', q: `had the highest share of inpatient days for Medicare patients, by ${REPORTS}`, sub: MCR_SUB, pct: true },
  { key: 'mcd', of: 8, z: 'pay', f: 'Payer mix', q: `had the highest share of inpatient days for Medicaid patients, by ${REPORTS}`, sub: MCD_SUB, pct: true }
];

function build() {
  const C = readJson(reads[0]);
  const H = readJson(reads[1]).hospitals;
  const M = C._meta || {};
  if (!M.pulled) return [];
  const ck = String(M.pulled);
  const base0 = { src: M.source, url: M.url, ck };
  const F = C.fields;
  const col = (name) => F.indexOf(name) + 1;                       // a hospital row is [period, ...fields]
  const out = [];
  const r = rngFrom('huddle|hc');
  const show = (v, pct) => (pct ? commas(v) + '%' : commas(v));

  // ── systems ──
  const sys = Object.entries(C.sys).filter(([, v]) => v[0] >= 5).map(([name, v]) => ({ name, shown: RENAMED[name] || name, v }));
  for (const T of SYS) {
    const rows = sys.filter((s) => typeof s.v[T.of] === 'number' && s.v[T.of] > 0);
    if (rows.length < 12) continue;
    // the big names: the forty largest by beds, so a player has heard of most of the four
    const pool = rows.slice().sort((a, b) => b.v[3] - a.v[3]).slice(0, 40);
    const med = median(rows.map((s) => s.v[T.of]));
    const hint = `The median across ${rows.length} systems: ${show(med, T.pct)}.`;
    for (let n = 0, tries = 0; n < 8 && tries < 300; tries++) {
      const four = r.shuffle(pool).slice(0, 4);
      const vals = four.map((s) => s.v[T.of]), best = Math.max(...vals), rest = vals.filter((v) => v !== best);
      if (rest.length !== 3 || best - Math.max(...rest) < Math.max(best * 0.05, T.pct ? 3 : 1)) continue;
      const ans = vals.indexOf(best), win = four[ans];
      out.push({ ...base0, z: T.z, f: T.f, yr: win.v[2], id: `hc-sys-${T.key}-four-${n}`, k: kOf('hc', 'sys', T.key), d: 2, t: 'choice',
        q: `Which of these health systems ${T.q}?`, sub: T.sub,
        o: four.map((s) => s.shown), a: ans, v: four.map((s) => show(s.v[T.of], T.pct)), h: hint,
        why: `${win.shown}: ${show(best, T.pct)}, across ${win.v[0]} hospitals with a full year on file.`,
        see: 'ops|sys=' + encodeURIComponent(win.name) + '|' + win.shown });
      n++;
    }
  }

  // ── each state's hospitals ──
  /* a row that cannot be right is left out of every hospital question: Hennepin County Medical Center files 5,152 resident
     FTEs on 347 beds and Greater Baltimore 2,710 on 241, where the real programs are a tenth of that (2026-10-18 spot check).
     More than five residents a bed is a keying error in one field or the other, so neither field is asked. */
  const iBeds = col('beds'), iRes = col('res');
  const suspect = (row) => typeof row[iRes] === 'number' && typeof row[iBeds] === 'number' && row[iBeds] > 0 && row[iRes] > 5 * row[iBeds];
  const rowOf = (h) => (C.h[h.id] && !suspect(C.h[h.id]) ? C.h[h.id] : null);
  const yearOf = (row) => Number((String(row[0]).match(/(\d{4})/) || [])[1]);
  for (const st of FIFTY) {
    const S = STATES[st];
    const mine = H.filter((h) => h.s === st && rowOf(h) && (h.t === 'acute' || h.t === 'child')).map((h) => ({ h, row: rowOf(h), name: shortName(h, '') }));
    // two hospitals with one name in a state go by name and city
    const seenName = {};
    for (const x of mine) seenName[x.name] = (seenName[x.name] || 0) + 1;
    for (const x of mine) if (seenName[x.name] > 1) x.name = `${x.name} (${x.h.c.charAt(0) + x.h.c.slice(1).toLowerCase()})`;
    const see = (x) => 'ops|fac=' + x.h.id + '|' + x.name;
    const forms = [
      { key: 'big', field: 'beds', z: 'prv', f: 'Hospitals', d: 2, gap: 1.1, min: 25,
        q: `Which of these ${S} hospitals reported the most beds on its latest Medicare cost report?`, sub: 'General and children\'s hospitals. Beds on the cost report, which often run below the licensed count.' },
      { key: 'teach', field: 'res', z: 'prv', f: 'Teaching', d: 3, gap: 1.15, min: 5,
        q: `Which of these ${S} hospitals trained the most resident physicians, by its latest Medicare cost report?`, sub: 'Interns and residents, full-time equivalent. Two half-time count as one.' }
    ];
    for (const T of forms) {
      const i = col(T.field);
      const have = mine.filter((x) => typeof x.row[i] === 'number' && x.row[i] >= T.min).sort((a, b) => b.row[i] - a.row[i] || (a.h.id < b.h.id ? -1 : 1));
      if (have.length < 4 || have[0].row[i] < have[1].row[i] * T.gap) continue;
      const top = have[0];
      const others = r.shuffle(have.slice(1, 8)).slice(0, 3);
      const order = r.shuffle([0, 1, 2, 3]), four = [top, ...others];
      const o = order.map((j) => four[j]);
      out.push({ ...base0, z: T.z, f: T.f, yr: yearOf(top.row), id: `hc-${T.key}-${st.toLowerCase()}-four-0`, k: kOf('hc', T.key, st), d: T.d, t: 'choice',
        q: T.q, sub: T.sub, o: o.map((x) => x.name), a: order.indexOf(0), v: o.map((x) => commas(x.row[i])),
        h: T.key === 'big' ? `${have.length} general and children's hospitals in ${S} filed one.` : `${have.length} hospitals in ${S} trained five or more residents.`,
        why: `${top.name}: ${commas(top.row[i])}, for ${top.row[0]}. Next was ${have[1].name} at ${commas(have[1].row[i])}.`, see: see(top) });
    }
    // the Medicaid share among the state's largest hospitals
    const iB = col('beds'), iM = col('mcd');
    const big = mine.filter((x) => typeof x.row[iB] === 'number' && typeof x.row[iM] === 'number' && x.row[iB] >= 50)
      .sort((a, b) => b.row[iB] - a.row[iB] || (a.h.id < b.h.id ? -1 : 1)).slice(0, 8);
    if (big.length >= 4) {
      for (let tries = 0; tries < 50; tries++) {
        const four = r.shuffle(big).slice(0, 4);
        const vals = four.map((x) => x.row[iM]), best = Math.max(...vals), rest = vals.filter((v) => v !== best);
        if (rest.length !== 3 || best - Math.max(...rest) < 8) continue;
        const ans = vals.indexOf(best), win = four[ans];
        out.push({ ...base0, z: 'pay', f: 'Payer mix', yr: yearOf(win.row), id: `hc-mcd-${st.toLowerCase()}-four-0`, k: kOf('hc', 'mcd', st), d: 3, t: 'choice',
          q: `Which of these ${S} hospitals had the highest share of inpatient days for Medicaid patients, by its latest Medicare cost report?`, sub: MCD_SUB,
          o: four.map((x) => x.name), a: ans, v: four.map((x) => x.row[iM] + '%'), h: `Among the ${big.length} largest, shares ran from ${Math.min(...big.map((x) => x.row[iM]))}% to ${Math.max(...big.map((x) => x.row[iM]))}%.`,
          why: `${win.name}: ${win.row[iM]} percent of its inpatient days, for ${win.row[0]}.`, see: see(win) });
        break;
      }
    }
  }
  return out;
}

module.exports = { name: 'cost-reports', prefix: 'hc-', reads, build };
