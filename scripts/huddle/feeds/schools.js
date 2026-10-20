'use strict';
/**
 * FEED: the healthcare schools on the U.S. Hospital Operations Map (2026-10-18).
 *
 * Reads: src/assets/data/us-health-schools.json (IPEDS completions, written by scripts/pull/ipeds.js; its _meta names
 * the release, the school year, the link and the pull date) and src/assets/data/us-health-schools-accred.json (the
 * accreditors' own lists, joined by scripts/check-schools.js; _meta.checked is its date). For every program in the
 * school file's _meta.programs it asks:
 *   - which of four states had the most schools awarding it, and which of two had more, unless the builder's
 *     TEMPLATES ask that already (RN and RT); the same for degrees awarded (RT is asked already);
 *   - which of four schools awarded the most of its degrees, in the country and in each state with four or more;
 *   - which body accredits it, where an accreditor's list in the accreditation file covers it;
 * and which of four nursing schools teaches mostly online.
 * A new row: a program added to the pull (a new key in _meta.programs) becomes all of these; a new school year re-deals
 * them. A line in DEG words a new program's degree; without one it reads from the program's label.
 */
const { readJson, rngFrom, STATES, FIFTY, keyName, commas, median, kOf, idOf, fourForm, twoForm, withDistractors, whyFor } = require('../lib');

const reads = ['src/assets/data/us-health-schools.json', 'src/assets/data/us-health-schools-accred.json'];

/** a program's degree in a question: one, many, and the short name the map's filter uses (build-vital-stats.js) */
const DEG = {
  rn: ['registered nursing degree or diploma', 'registered nursing degrees and diplomas', 'RN'],
  rt: ['respiratory therapy degree', 'respiratory therapy degrees', 'RT'],
  pa: ['physician assistant degree', 'physician assistant degrees', 'PA'],
  md: ['MD degree', 'MD degrees', 'MD'],
  do: ['DO degree', 'DO degrees', 'DO'],
  np: ['nurse practitioner degree or certificate', 'nurse practitioner degrees and certificates', 'NP'],
  dnp: ['doctor of nursing practice (DNP) degree', 'DNP degrees', 'DNP']
};
/** the programs whose top school in each state is asked (the rest are asked nationally only) */
const BY_STATE = ['rn', 'rt', 'md', 'pa', 'np'];

function build(ctx) {
  const D = readJson(reads[0]);
  const A = readJson(reads[1]);
  const M = D._meta || {};
  if (!M.pulled || !M.year) return [];
  const yrWords = 'the ' + M.year + ' school year';
  const yr = Number('20' + String(M.year).slice(-2));
  const base0 = { z: 'prv', f: 'Schools', src: `IPEDS Completions ${M.year}, ${String((M.release || {}).completions || '').toLowerCase()} (National Center for Education Statistics), counted from the site's school file`,
    url: M.url, yr, ck: String(M.pulled) };
  const S = new Map(D.schools.map((s) => [s[0], s]));
  const grads = (lv) => String(lv).split('|').reduce((a, x) => a + Number(x.split(':')[1] || 0), 0);
  const P = D.programs.map((p) => ({ u: p[0], k: p[1], g: grads(p[2]), s: S.get(p[0]) })).filter((p) => p.s);
  const out = [];
  const online = (s) => s[9] >= (M.onlineAt || 50);

  for (const prog of Object.keys(M.programs || {})) {
    const label = M.programs[prog].label || prog;
    const [deg, degs, short] = DEG[prog] || [label.toLowerCase() + ' degree', label.toLowerCase() + ' degrees', label];
    const of = P.filter((p) => p.k === prog);
    if (of.length < 8) continue;
    const r = rngFrom('huddle|sc|' + prog);
    const stateSee = (st) => `ops|layers=school&programs=${prog}&state=${st}|${short} programs in ${STATES[st]}`;
    const schoolSee = (p) => `ops|layers=school&fac=u${p.u}&prog=${prog}|${p.s[1]}`;

    // states: how many schools, and how many degrees
    const nBy = {}, gBy = {};
    for (const p of of) { nBy[p.s[3]] = (nBy[p.s[3]] || 0) + 1; gBy[p.s[3]] = (gBy[p.s[3]] || 0) + p.g; }
    for (const [form, by, what, covered] of [
      ['count', nBy, `number of schools that awarded at least one ${deg} in ${yrWords}`, ctx.TEMPLATES['sch-' + prog]],
      ['grads', gBy, `number of ${degs} awarded in ${yrWords}`, ctx.TEMPLATES['sch-grads-' + prog]]]) {
      if (covered) continue;
      const rows = FIFTY.filter((st) => by[st] > 0).map((st) => ({ st, v: by[st] }));
      if (rows.length < 12) continue;
      const fmt = (v) => commas(v);
      // THE EXPLANATION (2026-10-20, DH12): the right state's place, with the count named (schools, or degrees awarded)
      const fmtW = (v) => commas(v) + (form === 'count' ? (v === 1 ? ' school' : ' schools') : (v === 1 ? ' degree' : ' degrees'));
      const hint = `Median of the ${rows.length} states with any: ${commas(median(rows.map((x) => x.v)))}.`;
      const base = { ...base0, sub: undefined };
      out.push(...fourForm({ rows, fmt, dp: 0, rng: r, idp: `sc-${idOf(prog)}-${form}`, k: kOf('sc', prog, form, 'four'), what, low: false, base, hint, seeOf: stateSee, why: whyFor(rows, fmtW, `the ${rows.length} states with any`) }));
      out.push(...twoForm({ rows, fmt, dp: 0, rng: r, idp: `sc-${idOf(prog)}-${form}`, k: kOf('sc', prog, form, 'two'), what, base, hint, seeOf: stateSee, why: whyFor(rows, fmtW, `the ${rows.length} states with any`) }));
    }

    // the school that awarded the most, in the country and in each state with four or more
    const topOf = (list, where, id, k, d) => {
      const s = list.slice().sort((a, b) => b.g - a.g || (a.u < b.u ? -1 : 1));
      if (s.length < 4 || s[0].g < s[1].g * 1.1 || s[0].g < 5) return;
      const names = new Set();
      const others = r.shuffle(s.slice(1, 12)).filter((p) => { if (names.has(p.s[1]) || p.s[1] === s[0].s[1]) return false; names.add(p.s[1]); return true; }).slice(0, 3);
      if (others.length < 3) return;
      const order = r.shuffle([0, 1, 2, 3]), four = [s[0], ...others], o = order.map((j) => four[j]);
      const placed = (p) => (where ? p.s[1] : (p.s[1].includes(STATES[p.s[3]] || '~') ? p.s[1] : `${p.s[1]} (${keyName(p.s[3])})`));
      out.push({ ...base0, id, k, d, t: 'choice', q: `Which of these schools ${where ? 'in ' + STATES[where] + ' ' : ''}awarded the most ${degs} in ${yrWords}?`,
        o: o.map(placed), a: order.indexOf(0), v: o.map((p) => commas(p.g)),
        h: where ? `${s.length} schools in ${STATES[where]} awarded at least one.` : `${s.length} U.S. schools awarded at least one.`,
        why: `${s[0].s[1]} awarded ${commas(s[0].g)}.${online(s[0].s) ? ` Most of its students study only online (${M.onlineTerm}), so they all count at its home campus.` : ''}`,
        see: schoolSee(s[0]) });
    };
    topOf(of, '', `sc-top-${idOf(prog)}-four-0`, kOf('sc', 'top', prog), 2);
    if (BY_STATE.includes(prog)) for (const st of FIFTY) topOf(of.filter((p) => p.s[3] === st), st, `sc-top-${idOf(prog)}-${st.toLowerCase()}-four-0`, kOf('sc', 'top', prog, st), prog === 'rn' ? 2 : 3);
  }

  // which body accredits the program: an accreditor's list that covers one program
  const AM = A._meta || {};
  if (AM.checked && AM.sources) {
    const progOf = {};
    for (const row of A.rows || []) (progOf[row[2]] = progOf[row[2]] || new Set()).add(row[1]);
    const shorts = Object.values(AM.sources).map((s) => s.short);
    const r = rngFrom('huddle|sc|accred');
    for (const [key, src] of Object.entries(AM.sources)) {
      const progs = [...(progOf[key] || [])];
      if (progs.length !== 1 || !/accredited/i.test(src.label) || !DEG[progs[0]]) continue;
      const prog = progs[0];
      const p = withDistractors(r, src.short, shorts, 4);
      if (!p) continue;
      out.push({ z: 'pol', f: 'Who accredits', src: src.label, url: src.url, yr: Number(String(AM.checked).slice(0, 4)), ck: String(AM.checked),
        id: 'sc-accred-' + idOf(prog), k: kOf('sc', 'accred', prog), d: prog === 'rt' ? 1 : 2, t: 'choice',
        q: `Which body accredits ${DEG[prog][2]} education programs in the U.S.?`, o: p.o, a: p.a,
        why: `The map checks its ${DEG[prog][2]} programs against ${src.short}'s own list of accredited programs.`,
        see: `ops|layers=school&programs=${prog}|every ${DEG[prog][2]} program` });
    }
  }

  // a nursing school where most students study only online
  const rn = P.filter((p) => p.k === 'rn');
  const web = rn.filter((p) => online(p.s) && p.g >= 100);
  const campus = rn.filter((p) => p.s[9] >= 0 && p.s[9] < 15 && p.g >= 300);
  const r = rngFrom('huddle|sc|online');
  for (const p of r.shuffle(web).slice(0, 6)) {
    const q = withDistractors(r, p, campus, 4, (x) => x.s[1] !== p.s[1]);
    if (!q) continue;
    out.push({ ...base0, id: 'sc-online-' + p.u, k: kOf('sc', 'online'), d: 2, t: 'choice',
      q: `Which of these nursing schools had most of its students studying only online in ${M.onlineTerm}?`,
      o: q.o.map((x) => x.s[1]), a: q.a, why: `At ${p.s[1]}, ${commas(p.s[9])} percent of students studied only online; at the others it was under 15 percent.`,
      see: `ops|layers=school&fac=u${p.u}&prog=rn|${p.s[1]}` });
  }
  return out;
}

module.exports = { name: 'schools', prefix: 'sc-', reads, build };
