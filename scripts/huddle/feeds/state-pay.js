'use strict';
/**
 * FEED: two jobs' pay inside one state (2026-10-18).
 *
 * Reads: src/assets/data/state-pay.json (BLS OEWS state medians, written by scripts/pull/oews-states.js; it carries its
 * own source, link, period, year and check date) and src/_data/metricsConfig.json to find each job's view on the
 * Population Health Map. The map and the builder's TEMPLATES already ask which state pays a job the most. This asks
 * the other way round: in one state, which of two jobs paid more. A pair is asked when the answer changes from state to
 * state somewhere in the data (so it is never the same answer fifty times), plus the pairs in ALWAYS, which a respiratory
 * therapist or a nurse would want to know anyway. A state is asked only where the two medians sit 6 percent apart.
 * A new row: a job added to state-pay.json joins the pairs on the next build. JOB names it in a sentence.
 */
const { readJson, rngFrom, STATES, FIFTY, commas, kOf, idOf, mapSlug } = require('../lib');

const reads = ['src/assets/data/state-pay.json', 'src/_data/metricsConfig.json'];

/** SOC code -> [the map's pay measure slug, the job in a sentence] */
const JOB = {
  '29-1141': ['rn', 'Registered nurses'], '29-1126': ['rt', 'Respiratory therapists'], '29-2061': ['lpn', 'Licensed practical nurses'],
  '29-1171': ['np', 'Nurse practitioners'], '29-1071': ['pa', 'Physician assistants'], '29-1051': ['pharmacist', 'Pharmacists'],
  '29-2034': ['radtech', 'Radiologic technologists'], '31-1131': ['cna', 'Nursing assistants'], '31-9092': ['med-assistant', 'Medical assistants'],
  '11-9111': ['health-manager', 'Health services managers']
};
/** pairs asked even when one job always wins */
const ALWAYS = [['29-1126', '29-1141'], ['29-1126', '29-2061']];

function build() {
  const P = readJson(reads[0]);
  const cfg = readJson(reads[1]);
  if (!P.checked || !P.period) return [];
  const socs = Object.keys(P.occupations);
  const name = (soc) => (JOB[soc] ? JOB[soc][1] : P.occupations[soc].occ);
  const see = (soc, st) => {
    const it = JOB[soc] && ((cfg.clinical || {}).items || []).find((x) => x.id === 'clinical/pay-' + JOB[soc][0]);
    return it ? `plm|lens=clinical&metric=${mapSlug(it.name)}&state=${st}|${STATES[st]}` : undefined;
  };
  const apart = (x, y) => Math.abs(x - y) >= Math.max(x, y) * 0.06;
  const out = [];
  const r = rngFrom('huddle|sp');
  for (let i = 0; i < socs.length; i++) {
    for (let j = i + 1; j < socs.length; j++) {
      const a = socs[i], b = socs[j];
      const A = P.occupations[a].pay, B = P.occupations[b].pay;
      const clear = FIFTY.filter((s) => typeof A[s] === 'number' && typeof B[s] === 'number' && apart(A[s], B[s]));
      const aWins = clear.filter((s) => A[s] > B[s]), bWins = clear.filter((s) => B[s] > A[s]);
      const always = ALWAYS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
      if (!(aWins.length && bWins.length) && !always) continue;
      // the surprising side first: the states where the usual winner loses
      const few = aWins.length <= bWins.length ? aWins : bWins, many = few === aWins ? bWins : aWins;
      const states = r.shuffle(few).slice(0, 2).concat(r.shuffle(many).slice(0, 4 - Math.min(2, few.length)));
      const slugA = JOB[a] ? JOB[a][0] : a, slugB = JOB[b] ? JOB[b][0] : b;
      for (const st of states) {
        const order = r.shuffle([a, b]);
        const vals = order.map((s) => P.occupations[s].pay[st]);
        const ans = vals[0] > vals[1] ? 0 : 1;
        out.push({ z: 'prv', f: 'Pay', src: P.source, url: P.url, yr: Number(P.year), ck: String(P.checked),
          id: `sp-${idOf(slugA)}-${idOf(slugB)}-${st.toLowerCase()}-two-0`, k: kOf('sp', slugA, slugB), d: 2, t: 'choice',
          q: `In ${STATES[st]}, which job had the higher median annual pay in ${P.period}?`, o: order.map(name), a: ans,
          v: vals.map((v) => '$' + commas(v)), h: `The two medians were $${commas(Math.abs(vals[0] - vals[1]))} apart.`,
          why: few.length
            ? `Across the fifty states, ${name(a).toLowerCase()} came out ahead in ${aWins.length} and ${name(b).toLowerCase()} in ${bWins.length}${clear.length < 50 ? '; the rest were within 6 percent' : ''}.`
            : `${name(many === aWins ? a : b)} out-earned ${name(many === aWins ? b : a).toLowerCase()} in every state where the two were 6 percent apart.`,
          see: see(order[ans], st) });
      }
    }
  }
  return out;
}

module.exports = { name: 'state-pay', prefix: 'sp-', reads, build };
