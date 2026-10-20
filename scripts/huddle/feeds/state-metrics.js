'use strict';
/**
 * FEED: the U.S. Population Health Map's state measures (2026-10-18).
 *
 * Reads: src/_data/metricsConfig.json (each measure's name, source, link and retrievedDate), src/_data/stateData.json
 * (every state's value) and src/_data/dataYears.json (the year each value is from). Every measure in metricsConfig is
 * looked at; one is asked about when a pull script refreshed it (a retrievedDate in 2026 or later, the rule
 * build-vital-stats.js keeps, because spot checks found older hand-entered measures that no longer match their
 * source), or when it is a yes-or-no measure a checked count backs (CROSS, below).
 *
 * Asks, for a number measure:
 *   - which of four states is highest or lowest, which of two is higher, and a state's own number, unless the
 *     builder's TEMPLATES already ask those (section 2), with section 2's near-tie rules;
 *   - which state is highest (and lowest) of all fifty;
 *   - where a state falls when the fifty are ranked (1 to 10, 11 to 25, 26 to 40, 41 to 50), never a state near an edge;
 *   - in how many states the measure clears a round line, unless Vital Stats already asks a count for it.
 * For a yes-or-no measure: which of these states has it, and which has not.
 *
 * A new row: a measure added to metricsConfig with a 2026 retrievedDate becomes these questions on the next build,
 * worded from its name and `sub`. A line in WORDS words it better and puts it in a zone; without one it lands in its
 * lens's zone (LENS_HOME).
 */
const { readJson, rngFrom, STATES, FIFTY, commas, median, ordinal, joinNames, kOf, idOf, mapSlug, fourForm, twoForm, withDistractors, keyName, hintOK } = require('../lib');

const reads = ['src/_data/metricsConfig.json', 'src/_data/stateData.json', 'src/_data/dataYears.json'];

/** a yes-or-no measure is asked when a Vital Stats fact, read live on its own date, counts the same states */
const CROSS = { 'policy/medicaid-expansion': 'medicaid-expansion-2026' };

/** where a measure lands when WORDS has no line for it */
const LENS_HOME = { patient: ['ph', 'State health'], clinical: ['prv', 'Workforce'], operations: ['prv', 'Hospitals'], payer: ['pay', 'Coverage'],
  policy: ['pol', 'State law'], baseline: ['ph', 'People'], economics: ['pay', 'Economy'] };

/* How each measure reads. what(y): finishes "Which of these states had the highest ___?". num(S, y): a state's own
   number. count(T, y): the count question at a line T, already in words ("15 percent", "$100,000"); none where it
   would read badly.
   step: the line is a multiple of it. low: false where "lowest" reads oddly. z, f: zone and the tile's family. */
const PCT = (t) => t + ' percent';
const WORDS = {
  'patient/fair-poor-health': { step: 1, count: (T, y) => `In how many of the fifty states did at least ${T} of adults rate their own health fair or poor in ${y}?` },
  'patient/diabetes': { step: 1, count: (T, y) => `In how many of the fifty states had at least ${T} of adults been diagnosed with diabetes, as of ${y}?` },
  'patient/coronary-heart-disease': { step: 0.5, count: (T, y) => `In how many of the fifty states did at least ${T} of adults report coronary heart disease, angina or a past heart attack in ${y}?` },
  'patient/obesity': { step: 1 },
  'patient/median-age': { step: 1, count: (T, y) => `In how many of the fifty states was the median age ${T} or older, by the Census ${y - 4} to ${y} estimates?` },
  'patient/routine-checkup': { step: 1, count: (T, y) => `In how many of the fifty states did at least ${T} of adults have a routine checkup within the past year, as of ${y}?` },
  'patient/current-smoking': { step: 1 },
  'patient/copd': { step: 0.5, count: (T, y) => `In how many of the fifty states had at least ${T} of adults been diagnosed with COPD, as of ${y}?` },
  'patient/asthma': { step: 0.5, count: (T, y) => `In how many of the fifty states did at least ${T} of adults have current asthma in ${y}?` },
  'patient/high-blood-pressure': { step: 1, count: (T, y) => `In how many of the fifty states had at least ${T} of adults been diagnosed with high blood pressure, as of ${y}?` },
  'patient/depression': { step: 1, count: (T, y) => `In how many of the fifty states had at least ${T} of adults ever been diagnosed with depression, as of ${y}?` },
  'patient/premature-death': { step: 500, count: (T, y) => `In how many of the fifty states did early deaths cost at least ${T} years of life per 100,000 people, by the County Health Rankings ${y} release?` },
  'patient/low-birthweight': { step: 0.5, count: (T, y) => `In how many of the fifty states did at least ${T} of babies weigh under 2,500 grams at birth, by the County Health Rankings ${y} release?` },
  'clinical/medicare-telehealth-use': { z: 'pat', f: 'Telehealth', step: 1,
    what: (y) => `share of Original Medicare patients who had a telehealth visit in ${y}`,
    num: (S, y) => `What percent of Original Medicare patients in ${S} had a telehealth visit in ${y}?`,
    sub: 'Out of people in Original Medicare who used a service Medicare covers by telehealth. Medicare Advantage is not counted.',
    count: (T, y) => `In how many of the fifty states did at least ${T} of Original Medicare patients have a telehealth visit in ${y}?` },
  'payer/uninsured': { step: 1 },
  'baseline/median-household-income': { step: 5 },
  'baseline/unemployment': { z: 'pay', f: 'Jobs', step: 0.5,
    what: (y) => `unemployment rate, averaged over ${y}`,
    num: (S, y) => `What was the unemployment rate in ${S} in ${y}, averaged over the year?`,
    sub: 'The percent of people in the labor force who were out of work and looking for it.',
    count: (T, y) => `In how many of the fifty states was the unemployment rate, averaged over ${y}, at least ${T}?` },
  'baseline/pop-65-plus': { step: 1 },
  'baseline/pop-under-18': { z: 'ph', f: 'Age', step: 1,
    what: (y) => `share of people under 18, by the Census ${y - 4} to ${y} estimates`,
    num: (S, y) => `What percent of people in ${S} were under 18, by the Census ${y - 4} to ${y} estimates?`,
    sub: 'Children and teenagers as a share of everyone who lives in the state.',
    count: (T, y) => `In how many of the fifty states were at least ${T} of people under 18, by the Census ${y - 4} to ${y} estimates?` },
  'baseline/avg-household-size': { z: 'ph', f: 'Household size', step: 0.1, low: true,
    what: (y) => `average household size, by the Census ${y - 4} to ${y} estimates`,
    num: (S, y) => `How many people lived in the average household in ${S}, by the Census ${y - 4} to ${y} estimates?`,
    sub: 'People per occupied home. Answer to two decimals, like 2.45.',
    count: (T, y) => `In how many of the fifty states did the average household hold ${T} people or more, by the Census ${y - 4} to ${y} estimates?` },
  'policy/medicaid-expansion': { z: 'pol', f: 'Medicaid',
    yes: 'has adopted the ACA Medicaid expansion', no: 'has NOT adopted the ACA Medicaid expansion',
    sub: 'The expansion covers adults with incomes up to 138 percent of the federal poverty level.' }
};
// the ten pay measures: one job each, worded like the builder's TEMPLATES
const JOBS = { rn: 'registered nurses', rt: 'respiratory therapists', lpn: 'licensed practical and vocational nurses', np: 'nurse practitioners',
  pa: 'physician assistants', pharmacist: 'pharmacists', radtech: 'radiologic technologists and technicians', cna: 'nursing assistants',
  'med-assistant': 'medical assistants', 'health-manager': 'medical and health services managers' };
for (const [slug, job] of Object.entries(JOBS)) {
  WORDS['clinical/pay-' + slug] = { step: 5000, money: true,
    count: (T, y) => `In how many of the fifty states was the median annual pay for ${job} at least ${T} in May ${y}?` };
}

/** how a value shows, by the measure's unit */
function showFor(unit) {
  if (unit === '%') return { dp: 1, fmt: (v) => commas(v, 1) + '%', line: (T) => PCT(T), pre: '', suf: '%', unit: 'percent' };
  if (unit === '$') return { dp: 0, fmt: (v) => '$' + commas(v), line: (T) => '$' + commas(T), pre: '$', suf: '', unit: 'dollars' };
  if (unit === '$k') return { dp: 0, fmt: (v) => '$' + commas(v) + 'k', line: (T) => '$' + commas(T * 1000), pre: '$', suf: 'k', unit: 'thousand dollars' };
  if (unit === 'yrs') return { dp: 1, fmt: (v) => commas(v, 1) + ' years', line: (T) => String(T), pre: '', suf: ' yrs', unit: 'years' };
  if (unit === '/100k') return { dp: 0, fmt: (v) => commas(v), line: (T) => commas(T), pre: '', suf: '', unit: 'per 100k' };
  if (unit === 'ppl') return { dp: 2, fmt: (v) => commas(v, 2) + ' people', line: (T) => commas(T, 1), pre: '', suf: '', unit: 'people' };
  return { dp: 1, fmt: (v) => commas(v, 1), line: (T) => String(T), pre: '', suf: '', unit: unit || '' };
}
/** a measure's name inside a sentence: lower case, except the words that keep a capital */
const KEEP = /^(Medicare|Medicaid|ACA|CMS|CDC|U\.S\.|NP|RN|RT|ED|ICU|COPD|HPSA|HPSAs)$/;
const inSentence = (name) => name.split(' ').map((w, i) => (KEEP.test(w) || (i > 0 && /^[A-Z]{2,}/.test(w)) ? w : w.toLowerCase())).join(' ');

/**
 * Every measure in metricsConfig, read once, with how it reads and where it lands. The county feed asks about the same
 * measures, so it reads them from here and words them the same way.
 */
function measures(ctx) {
  const cfg = readJson(reads[0]), data = readJson(reads[1]), years = readJson(reads[2]);
  /* what the builder already asks: the TEMPLATES keys, found on the map by the Vital Stats questions they come from,
     and the Vital Stats counts (id count-*), found the same way */
  const covered = {}, counted = new Set();
  const metricOf = (see) => (String(see || '').match(/^plm\|[^|]*metric=([a-z0-9-]+)/) || [])[1];
  for (const q of ctx.vs) {
    const m = metricOf(q.see);
    if (!m) continue;
    if (q.k && !q.f && ctx.TEMPLATES[q.k]) covered[m] = ctx.TEMPLATES[q.k];
    if (/^count-/.test(q.id)) counted.add(m);
  }
  const list = [];
  const seenName = {};
  for (const lens of Object.keys(cfg)) {
    const items = (cfg[lens] || {}).items;
    if (!Array.isArray(items)) continue;
    items.forEach((it, index) => {
      const vals = data[lens] && data[lens][index];
      const y = Number(years[lens] && years[lens][index]);
      if (!vals || !y) return;
      const slug = mapSlug(it.name);
      const sig = slug + '|' + JSON.stringify(vals);
      if (seenName[sig]) return;                                   // the same measure under a second lens (income, unemployment)
      seenName[sig] = true;
      const fresh = /^20(2[6-9]|[3-9]\d)/.test(String(it.retrievedDate));
      const W = WORDS[it.id] || {};
      const T = covered[slug];
      const home = LENS_HOME[lens] || ['ph', 'State health'];
      const z = W.z || (T && T.z) || home[0], f = W.f || (T && T.f) || home[1];
      const m = { it, lens, index: String(index), vals, y, slug, fresh, W, T, z, f, counted: counted.has(slug),
        base: { z, f, src: it.source, url: it.sourceUrl, yr: y, ck: String(it.retrievedDate) } };
      if (typeof it.unit === 'string' && it.unit !== 'Y/N') {
        m.S = showFor(it.unit);
        m.what = W.what ? W.what(y) : T ? T.what : `${inSentence(it.name)} (${String(it.sub || '').toLowerCase()}) in ${y}`;
        m.low = W.low != null ? W.low : T ? T.low !== false : it.unit !== '#';
      }
      list.push(m);
    });
  }
  return list;
}

function build(ctx) {
  const curated = readJson('scripts/data/vital-stats-curated.json').questions;
  const out = [];
  for (const m of measures(ctx)) {
    const { it, lens, vals, y, slug, fresh, W, T, base } = m;
    {
      const see = (st) => 'plm|lens=' + lens + '&metric=' + slug + (st ? '&state=' + st : '') + '|' + (st ? STATES[st] : 'every state');
      const id0 = 'sm-' + idOf(it.id.split('/')[1]);
      const rng = rngFrom('huddle|sm|' + it.id);

      // a yes-or-no measure, backed by a checked count
      if (it.unit === 'Y/N') {
        const fact = CROSS[it.id] && curated.find((c) => c.id === CROSS[it.id]);
        const yes = Object.keys(vals).filter((s) => vals[s] === 1), no = FIFTY.filter((s) => vals[s] === 0);
        if (!fact || !W.yes || yes.length !== fact.a) continue;   // no checked count, or the map disagrees with it
        const yes50 = yes.filter((s) => s !== 'DC');
        const sub = W.sub;
        for (const [form, right, wrong, words] of [['in', yes50, no, W.yes], ['out', no, yes50, W.no]]) {
          const picks = rng.shuffle(right).slice(0, 8);
          picks.forEach((st) => {
            const p = withDistractors(rng, st, wrong, 4);
            out.push({ ...base, id: `${id0}-${form}-${st.toLowerCase()}`, k: kOf('sm', it.id, form), d: 2, t: 'choice',
              q: `Which of these states ${words}, as of ${y}?`, sub, o: p.o.map(keyName), a: p.a,
              why: `${yes50.length} states and D.C. have adopted it; ${no.length} have not: ${joinNames(no.map((s) => STATES[s]))}.`,
              h: `${no.length} states had not adopted it.`, see: see(st) });
          });
        }
        continue;
      }
      if (!fresh || !m.S) continue;
      const rows = FIFTY.filter((s) => typeof vals[s] === 'number' && Number.isFinite(vals[s])).map((s) => ({ st: s, v: vals[s] }));
      if (rows.length < 40) continue;
      const { S, what, low } = m;
      const med = median(rows.map((r) => r.v));
      const hint = `Fifty-state median: ${S.fmt(med)}.`;
      const why = rangeWhy(rows, S.fmt);

      // the four, the two and the state's own number, where TEMPLATES does not ask them already
      if (!T) {
        out.push(...fourForm({ rows, fmt: S.fmt, dp: S.dp, rng, idp: id0, k: kOf('sm', it.id, 'four'), what, low, base, hint, seeOf: see }));
        out.push(...twoForm({ rows, fmt: S.fmt, dp: S.dp, rng, idp: id0, k: kOf('sm', it.id, 'two'), what, base, hint, seeOf: see }));
        const numQ = W.num || ((Sn, yy) => `What was the ${inSentence(it.name)} in ${Sn} in ${yy}?`);
        for (const r of rng.shuffle(rows).slice(0, 6)) {
          const q = { ...base, id: `${id0}-num-${r.st.toLowerCase()}`, k: kOf('sm', it.id, 'num'), d: 3, t: 'number', q: numQ(STATES[r.st], y),
            sub: W.sub || (it.sub ? it.sub + '.' : undefined), a: r.v, tol: 0.10, pre: S.pre, suf: S.suf, dp: S.dp, unit: S.unit,
            why: rangeWhy(rows, S.fmt, r.st), see: see(r.st) };
          if (hintOK(q, hint)) q.h = hint;
          out.push(q);
        }
      }

      // the top (and bottom) of all fifty
      const sorted = rows.slice().sort((a, b) => b.v - a.v || a.st.localeCompare(b.st));
      for (const dir of low ? ['hi', 'lo'] : ['hi']) {
        const order = dir === 'hi' ? sorted : sorted.slice().reverse();
        const top = order[0];
        if (order[1].v === top.v) continue;                        // a tie at the top is no question
        const apart = order.filter((r) => Math.abs(r.v - top.v) >= Math.max(Math.abs(top.v) * 0.03, S.dp >= 2 ? 0.03 : S.dp === 1 ? 0.3 : 1));
        const p = withDistractors(rng, top, apart, 4);
        if (!p) continue;
        out.push({ ...base, id: `${id0}-top-${dir}`, k: kOf('sm', it.id, 'top'), d: 2, t: 'choice',
          q: `Of all fifty states, which had the ${dir === 'hi' ? 'highest' : 'lowest'} ${what}?`,
          o: p.o.map((r) => keyName(r.st)), a: p.a, v: p.o.map((r) => S.fmt(r.v)), h: hint,
          why: `${STATES[top.st]} was ${dir === 'hi' ? 'highest' : 'lowest'} at ${S.fmt(top.v)}; ${STATES[order[1].st]} was next at ${S.fmt(order[1].v)}.`,
          see: see(top.st) });
      }

      // where a state falls in the ranking: the map's place 1 is the best end (lowest where lower is better)
      const first = it.dir === -1 ? 'lowest' : 'highest';
      const ranked = first === 'highest' ? sorted : sorted.slice().reverse();
      const place = (r) => 1 + ranked.filter((x) => (first === 'highest' ? x.v > r.v : x.v < r.v)).length;
      const BUCKETS = [[1, 10], [11, 25], [26, 40], [41, 50]];
      const bucketOf = (p) => BUCKETS.findIndex(([a, b]) => p >= a && p <= b);
      const EDGE = [10, 11, 25, 26, 40, 41];                       // a place this close to a line could flip with D.C. or a revision
      const safe = ranked.filter((r) => {
        const p = place(r), last = p + ranked.filter((x) => x.v === r.v).length - 1;   // a tie spans places p to last
        return bucketOf(p) === bucketOf(last) && !EDGE.includes(p) && !EDGE.includes(last);
      });
      const asked = [...safe.filter((r) => r.st === 'UT'), ...rng.shuffle(safe.filter((r) => r.st !== 'UT'))].slice(0, 4);
      for (const r of asked) {
        const p = place(r);
        out.push({ ...base, id: `${id0}-rank-${r.st.toLowerCase()}`, k: kOf('sm', it.id, 'rank'), d: 3, t: 'choice',
          q: `Rank the fifty states by ${what}, ${first} first. Where does ${STATES[r.st]} fall?`,
          sub: `Place 1 has the ${first} figure.`, o: BUCKETS.map(([a, b]) => `${a} to ${b}`), a: bucketOf(p),
          why: p === 1 ? `${STATES[r.st]} was first, at ${S.fmt(r.v)}.` : `${STATES[r.st]} placed ${ordinal(p)} at ${S.fmt(r.v)}; ${STATES[ranked[0].st]} was first at ${S.fmt(ranked[0].v)}.`,
          h: hint, see: see(r.st) });
      }

      // in how many states it clears a round line, unless Vital Stats asks a count for it already
      if (W.count && !m.counted && W.step) {
        const line = pickLine(rows.map((r) => r.v), W.step);
        if (line != null) {
          const over = rows.filter((r) => r.v >= line.T);
          const q = { ...base, id: `${id0}-count`, k: kOf('sm', it.id, 'count'), d: 3, t: 'number',
            q: W.count(S.line(line.T), y),
            sub: 'Count the states that meet the line, from 0 to 50. DC is not counted.', a: over.length, abs: 1, pre: '', suf: '', dp: 0, unit: 'states',
            why: over.length <= 4 ? `They were ${joinNames(over.map((r) => STATES[r.st]).sort())}.` : `${STATES[sorted[0].st]} was highest at ${S.fmt(sorted[0].v)}.`,
            see: see() };
          if (hintOK(q, hint)) q.h = hint;
          out.push(q);
        }
      }
    }
  }
  return out;
}

/** a round line most states sit clear of, with between 8 and 22 states at or over it */
function pickLine(vals, step) {
  const lo = Math.ceil(Math.min(...vals) / step), hi = Math.floor(Math.max(...vals) / step);
  let best = null;
  for (let i = lo; i <= hi; i++) {
    const T = Math.round(i * step * 1000) / 1000;
    const n = vals.filter((v) => v >= T).length;
    if (n < 8 || n > 22) continue;
    if (vals.some((v) => Math.abs(v - T) < step * 0.05 && v !== T)) continue;   // a state a hair either side of the line
    const score = Math.abs(n - 14);
    if (!best || score < best.score) best = { T, score };
  }
  return best;
}

/** one plain sentence placing a state among the fifty (build-vital-stats.js says it the same way) */
function rangeWhy(rows, fmt, st) {
  const hi = Math.max(...rows.map((r) => r.v)), lo = Math.min(...rows.map((r) => r.v));
  const at = (v) => rows.filter((r) => r.v === v).map((r) => STATES[r.st]).sort();
  const v = st ? (rows.find((r) => r.st === st) || {}).v : null;
  if (v === hi) return `No state was higher; ${joinNames(at(lo))} ${at(lo).length > 1 ? 'were' : 'was'} lowest at ${fmt(lo)}.`;
  if (v === lo) return `No state was lower; ${joinNames(at(hi))} ${at(hi).length > 1 ? 'were' : 'was'} highest at ${fmt(hi)}.`;
  return `Across the states the range ran from ${fmt(lo)} in ${joinNames(at(lo))} to ${fmt(hi)} in ${joinNames(at(hi))}.`;
}

module.exports = { name: 'state-metrics', prefix: 'sm-', reads, build, measures };
