'use strict';
/**
 * FEED: hospital star ratings, hospital by hospital (2026-10-20, bank version 3).
 *
 * Reads: src/assets/data/us-hospitals.json, the U.S. Hospital Operations Map's hospital list (CMS Care Compare, Hospital
 * General Information, with each hospital's overall star rating; pulled June 2026, the date build-vital-stats.js gives
 * the facility files, which carry none of their own). Vital Stats already asks how many five-star hospitals each state
 * has. This asks about the hospitals a patient would choose between, in their own state:
 *   - which of these four general hospitals had a five-star overall rating (the others three stars or fewer);
 *   - which of two general hospitals had the higher rating (four or five stars against one or two).
 * Only general (acute) hospitals of 50 beds or more are named as the right answer, and 100 beds or more as a wrong one,
 * so the names are ones people in the state know. One question a state: the four where it can be asked, else the two. A star rating is CMS's, never the site's judgment.
 * A new row: a new pull of the hospital list re-deals these.
 */
const { readJson, rngFrom, STATES, FIFTY, kOf } = require('../lib');
const { shortName } = require('../../build-vital-stats-systems.js');

const reads = ['src/assets/data/us-hospitals.json'];
/* the same pull Vital Stats counts (build-vital-stats.js, FACILITY_PULL) */
const PULL = { label: 'June 2026', yr: 2026, ck: '2026-06' };
const SRC = { src: `CMS Care Compare, Hospital General Information (the site's ${PULL.label} pull)`, url: 'https://data.cms.gov/provider-data/dataset/xubh-q36u', yr: PULL.yr, ck: PULL.ck };
const SUB = 'CMS\'s overall hospital star rating, from one to five stars.';
const stars = (n) => n + (n === 1 ? ' star' : ' stars');

function build() {
  const H = readJson(reads[0]).hospitals || [];
  const out = [];
  const r = rngFrom('huddle|cs|stars');
  for (const st of FIFTY) {
    const S = STATES[st];
    const mine = H.filter((h) => h.s === st && h.t === 'acute' && Number.isInteger(h.r) && Number.isInteger(h.beds)).map((h) => ({ h, name: shortName(h, '') }));
    // two hospitals with one name in a state go by name and city (cost-reports.js does the same)
    const count = {};
    for (const x of mine) count[x.name] = (count[x.name] || 0) + 1;
    for (const x of mine) if (count[x.name] > 1) x.name = `${x.name} (${x.h.c.charAt(0) + x.h.c.slice(1).toLowerCase()})`;
    // the counts are every rated general hospital in the state; the names asked are the ones with a bed count on file
    const ratedAll = H.filter((h) => h.s === st && h.t === 'acute' && Number.isInteger(h.r));
    const rated = ratedAll.length, nFive = ratedAll.filter((h) => h.r === 5).length, fives = mine.filter((x) => x.h.r === 5);
    const base = { ...SRC, z: 'pat', f: 'Hospital stars', sub: SUB };
    const see = (x) => 'ops|fac=' + x.h.id + '|' + x.name;
    const tally = `${S} had ${nFive ? nFive : 'no'} five-star general ${nFive === 1 ? 'hospital' : 'hospitals'} of ${rated} with a rating.`;

    // which of four had five stars
    const right = r.shuffle(fives.filter((x) => x.h.beds >= 50)), wrong = mine.filter((x) => x.h.r <= 3 && x.h.beds >= 100);
    const asks = Math.min(right.length, 1);                    // one a state, so stars stay one family among many
    let made = 0;
    if (wrong.length >= 3) {
      for (let n = 0; n < asks; n++) {
        const win = right[n];
        const others = r.shuffle(wrong.filter((x) => x.name !== win.name)).slice(0, 3);
        if (others.length < 3) break;
        const order = r.shuffle([0, 1, 2, 3]), four = [win, ...others], o = order.map((j) => four[j]);
        out.push({ ...base, id: `cs-five-${st.toLowerCase()}-${n}`, k: kOf('cs', 'five'), d: 2, t: 'choice',
          q: `Which of these ${S} hospitals had a five-star overall rating on CMS's Care Compare list in ${PULL.label}?`,
          o: o.map((x) => x.name), a: order.indexOf(0), v: o.map((x) => stars(x.h.r)), h: `${nFive} of ${rated} rated hospitals in ${S} had five stars.`,
          why: `${win.name} was one of them. ${tally}`, see: see(win) });
        made++;
      }
    }
    // which of two rated higher, in the states the four could not be asked
    const hiPool = mine.filter((x) => x.h.r >= 4 && x.h.beds >= 100), loPool = mine.filter((x) => x.h.r <= 2 && x.h.beds >= 100);
    if (!made && hiPool.length && loPool.length) {
      const a = r.pick(hiPool), b = r.pick(loPool.filter((x) => x.name !== a.name).length ? loPool.filter((x) => x.name !== a.name) : loPool);
      if (a.name !== b.name) {
        const order = r.shuffle([a, b]);
        out.push({ ...base, id: `cs-pair-${st.toLowerCase()}`, k: kOf('cs', 'pair'), d: 1, t: 'choice',
          q: `Which of these two ${S} hospitals had the higher overall star rating from CMS in ${PULL.label}?`,
          o: order.map((x) => x.name), a: order.indexOf(a), v: order.map((x) => stars(x.h.r)),
          why: `${a.name} had ${stars(a.h.r)} and ${b.name} ${stars(b.h.r)}. ${tally}`, see: see(a) });
      }
    }
  }
  return out;
}

module.exports = { name: 'care-sites', prefix: 'cs-', reads, build };
