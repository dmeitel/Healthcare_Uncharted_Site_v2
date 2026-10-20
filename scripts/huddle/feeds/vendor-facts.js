'use strict';
/**
 * FEED: more facts from the Vendor Directory's live checks (2026-10-20, bank version 3).
 *
 * Reads: src/assets/data/vendors.json (the directory), scripts/data/vendor-checks.json (each fact checked live on its
 * date against the company's own pages, SEC filings and acquisition news) and src/assets/data/us-hospitals.json (only
 * for the names of a state's cities, as wrong answers to a city question).
 * The vendor feed (vendors.js) asks who owns a company, which state it is based in, what kind of company it is and which
 * of four was founded first. This asks, under the same rule (a fact is asked only where its check agrees, "...Ok": true,
 * and its source and check date come from that check), and never about a product line, a division or anything defunct:
 *   - the year a company or organization was founded, from four years around it;
 *   - which city in its state it is headquartered in, the wrong answers drawn from the state's other vendor cities and
 *     its larger hospital towns;
 *   - the year its owner bought it, where the purchase year is checked;
 *   - which of four was founded most recently, in the sectors the vendor feed asks "founded first" (FIRSTS).
 * A new row: a vendor whose check marks foundedOk, cityOk or acquiredOk joins these on the next build.
 */
const { readJson, rngFrom, STATES, FIFTY, kOf, joinNames, withDistractors } = require('../lib');
const VD = require('./vendors');

const reads = ['src/assets/data/vendors.json', 'scripts/data/vendor-checks.json', 'src/assets/data/us-hospitals.json'];

/** four years in order with the answer at a seeded place, none after `max`. The place is drawn first, evenly, so the
    newest year is not the answer more often than the rest; then the gaps: five to nine years apart where they fit
    (`wide`, the easier tile), else two to four, else one or two (a year near `max` leaves little room above it). */
function yearsAround(rng, a, max, wideFirst) {
  let k = Math.floor(rng() * 4);
  const tries = (wideFirst ? [[5, 9]] : []).concat([[2, 4], [1, 2]]);
  let lo = 1, hi = 2;
  const fit = tries.find(([l]) => a + (3 - k) * l <= max);
  if (fit) [lo, hi] = fit;
  else k = Math.max(k, 3 - Math.max(0, max - a));
  const vals = [a];
  let x = a;
  for (let i = 0; i < k; i++) { x -= lo + Math.floor(rng() * (hi - lo + 1)); vals.unshift(x); }
  x = a;
  for (let i = 0; i < 3 - k; i++) {
    const room = Math.floor((max - x) / (3 - k - i));
    x += Math.min(lo + Math.floor(rng() * (hi - lo + 1)), Math.max(lo, room));
    vals.push(x);
  }
  return { o: vals.map(String), a: k, wide: lo >= 5 };
}
/* CMS files some big-city hospitals under the neighborhood or borough, which is inside the city a vendor names; one of
   these as a wrong answer beside "New York" or "Boston" would be right in a way, so none is ever drawn */
const INSIDE = new Set(['Brooklyn', 'Bronx', 'Staten Island', 'Flushing', 'Jamaica', 'Far Rockaway', 'Forest Hills', 'Elmhurst', 'Long Island City',
  'Bayside', 'Astoria', 'Glen Oaks', 'Brighton', 'Roxbury', 'Dorchester', 'Jamaica Plain', 'West Roxbury', 'Charlestown', 'Roslindale', 'Hyde Park',
  'Mattapan', 'Sherman Oaks', 'Van Nuys', 'Panorama City', 'Tarzana', 'North Hollywood', 'Encino', 'San Pedro', 'Harbor City', 'Woodland Hills',
  'West Hills', 'Mission Hills', 'Sylmar', 'Hollywood']);
/** a CMS city name as a person writes it, or null where the capitals cannot be read back safely (ST, MC, O'...) */
function cityName(c) {
  const s = String(c || '').trim();
  if (!/^[A-Z][A-Z -]*[A-Z]$/.test(s) || s.split(/[ -]/).some((w) => w.length < 3)) return null;
  const t = s.toLowerCase().replace(/(^|[ -])([a-z])/g, (m, p, l) => p + l.toUpperCase());
  if (INSIDE.has(t)) return null;
  return t;
}

function build() {
  const V = readJson(reads[0]), C = readJson(reads[1]), H = readJson(reads[2]).hospitals || [];
  const ck = String((C._meta || {}).checked || '');
  if (!ck) return [];
  const chk = (v) => (C.vendors || {})[VD.vdSlug(v.name)] || {};
  // the source a question shows: the page the check found for that fact, else the vendor's best page (vendors.js, from)
  const from = (v, field) => {
    const c = chk(v), own = c[field + 'Url'];
    const y = own ? c[field + 'Yr'] : c.yr;
    return { src: own ? c[field + 'Src'] : c.src, url: own || c.url, yr: Number.isInteger(y) ? y : 2026, ck };
  };
  const all = (V.vendors || []).filter((v) => v && v.name);
  const S = (v) => VD.SECTORS[v.sector];
  const see = (v) => 'vd|vendor=' + VD.vdSlug(v.name) + '|' + v.name;
  const shown = VD.shown;
  // a company that sells today, by its check (Cynerio's site now redirects to its buyer, so its city is the buyer's)
  const company = (v) => !!S(v) && !VD.gone(v) && !VD.PRODUCT.test(v.name) && v.hcShare !== 'division' && chk(v).kindOk === true;
  const argued = (v) => /spun off|spinoff|spin-off|merger|merged/i.test(String(v.owner));
  const cityOf = (v) => (chk(v).cityOk === true && chk(v).hqOk === true && v.hq && FIFTY.includes(v.hq.state) ? v.hq.city : null);
  const out = [];

  // ── the year it was founded ──
  {
    const r = rngFrom('huddle|vf|year');
    for (const v of all) {
      if (!company(v) || argued(v) || chk(v).foundedOk !== true || !Number.isInteger(v.founded)) continue;
      const p = yearsAround(r, v.founded, 2025, r() < 0.5);   // years far apart are easier: two dots; close, three
      const city = cityOf(v);
      out.push({ ...from(v, 'founded'), z: S(v).z, f: 'Founded', id: 'vf-year-' + VD.vdSlug(v.name), k: kOf('vf', 'year', v.sector), d: p.wide ? 2 : 3, t: 'choice',
        q: `In what year was ${shown(v)} founded?`, o: p.o, a: p.a,
        why: `${shown(v)} was founded in ${v.founded}${city ? ` and is based in ${city}, ${STATES[v.hq.state]}` : ''}.`, see: see(v) });
    }
  }

  // ── the city it is headquartered in ──
  {
    const r = rngFrom('huddle|vf|city');
    const towns = {};                                           // a state's hospital towns, most hospitals first
    for (const h of H) { const n = cityName(h.c); if (n && h.s) { const t = (towns[h.s] = towns[h.s] || {}); t[n] = (t[n] || 0) + 1; } }
    const bigTowns = (st) => Object.entries(towns[st] || {}).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 12).map(([n]) => n);
    const vendorTowns = (st) => [...new Set(all.filter((x) => cityOf(x) && x.hq.state === st).map(cityOf))];
    // the state's busiest vendor town (San Francisco, Boston, Chicago): a wrong answer wherever it is not the right one,
    // and the right one at most CAP times, so "pick the famous city" stops working
    const CAP = 5, used = {};
    const topTown = (st) => { const n = {}; for (const x of all) if (cityOf(x) && x.hq.state === st) n[cityOf(x)] = (n[cityOf(x)] || 0) + 1;
      return Object.entries(n).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([t]) => t)[0]; };
    for (const v of all) {
      const city = cityOf(v);
      if (!city || !company(v) || (v.hcShare === 'minor' && / Health$/.test(v.name))) continue;
      if (v.ownership === 'subsidiary' && v.parent && v.name.toLowerCase().includes(VD.first(v.parent))) continue;
      if (v.name.toLowerCase().includes(city.toLowerCase())) continue;             // the answer is in the name
      if ((used[city] || 0) >= CAP) continue;
      const st = v.hq.state, lc = city.toLowerCase();
      const near = (x) => { const l = x.toLowerCase(); return l === lc || l.includes(lc) || lc.includes(l); };
      const big = topTown(st), lead = big && !near(big) ? [big] : [];
      const pool = [...new Set(vendorTowns(st).concat(bigTowns(st)))].filter((x) => !near(x) && !lead.includes(x));
      if (pool.length + lead.length < 3) continue;
      const wrong = lead.concat(r.shuffle(pool)).slice(0, 3);
      used[city] = (used[city] || 0) + 1;
      const order = r.shuffle([0, 1, 2, 3]), opts = [city, ...wrong];
      out.push({ ...from(v, 'hq'), z: S(v).z, f: 'Home city', id: 'vf-city-' + VD.vdSlug(v.name), k: kOf('vf', 'city', v.sector),
        d: v.ownership === 'public' || v.ownership === 'nonprofit' ? 2 : 3, t: 'choice',
        q: `${shown(v)} is headquartered in which ${STATES[st]} city?`, o: order.map((i) => opts[i]), a: order.indexOf(0),
        why: `${shown(v)} is based in ${city}, ${STATES[st]}.${chk(v).foundedOk === true && Number.isInteger(v.founded) && !argued(v) ? ` It was founded in ${v.founded}.` : ''}`, see: see(v) });
    }
  }

  // ── the year its owner bought it ──
  {
    const r = rngFrom('huddle|vf|deal');
    const dealSrc = (v) => { const c = chk(v); return c.acquiredUrl ? from(v, 'acquired') : c.ownerUrl ? from(v, 'owner') : from(v, ''); };
    // a product line is asked through the company behind it ("Microsoft bought Nuance", not the product)
    const what = (v) => (VD.PRODUCT.test(v.name) ? `the company behind ${shown(v)}` : shown(v));
    const deals = all.filter((v) => S(v) && !VD.gone(v) && chk(v).acquiredOk === true && Number.isInteger(chk(v).acquired) && v.parent);
    const thisYear = Math.max(...deals.map((v) => chk(v).acquired));
    for (const v of deals) {
      const y = chk(v).acquired;
      // a purchase in the newest year would always be the last of four years, so it is asked the other way round below
      if (y >= thisYear - 1) continue;
      const p = yearsAround(r, y, thisYear, false);
      out.push({ ...dealSrc(v), z: S(v).z, f: 'Deals', id: 'vf-deal-' + VD.vdSlug(v.name), k: kOf('vf', 'deal'), d: 3, t: 'choice',
        q: `In what year did ${v.parent} buy ${what(v)}?`, o: p.o, a: p.a,
        why: `${v.parent} bought ${what(v)} in ${y}.`, see: see(v) });
    }
    // which of these changed hands in the newest year, against purchases from earlier years
    const fresh = deals.filter((v) => chk(v).acquired === thisYear), older = deals.filter((v) => chk(v).acquired < thisYear);
    for (const v of fresh) {
      const p = withDistractors(r, v, older, 4);
      if (!p) continue;
      out.push({ ...dealSrc(v), z: S(v).z, f: 'Deals', id: 'vf-deal-new-' + VD.vdSlug(v.name), k: kOf('vf', 'deal', 'new'), d: 2, t: 'choice',
        q: `Which of these became part of a new owner in ${thisYear}?`, o: p.o.map(shown), a: p.a, v: p.o.map((x) => String(chk(x).acquired)),
        why: `${v.parent} bought ${what(v)} in ${thisYear}. Earlier: ${joinNames(p.o.filter((x) => x !== v).map((x) => `${x.parent} bought ${what(x)} in ${chk(x).acquired}`))}.`, see: see(v) });
    }
  }

  // ── which was founded most recently ──
  {
    const r = rngFrom('huddle|vf|newest');
    for (const [sector, Sx] of Object.entries(VD.SECTORS)) {
      if (!VD.FIRSTS.includes(sector)) continue;
      const ok = all.filter((v) => v.sector === sector && !VD.gone(v) && Number.isInteger(v.founded) && !v.parent && v.ownership !== 'subsidiary'
        && v.hcShare !== 'division' && v.hcShare !== 'minor' && !argued(v) && chk(v).foundedOk === true);
      if (ok.length < 4) continue;
      let made = 0;
      for (let tries = 0; made < 2 && tries < 300; tries++) {
        const four = r.shuffle(ok).slice(0, 4);
        const ys = four.map((v) => v.founded), newest = Math.max(...ys), rest = ys.filter((y) => y !== newest);
        if (rest.length !== 3 || newest - Math.max(...rest) < 4) continue;
        const ans = ys.indexOf(newest);
        if (out.some((q) => q.k === kOf('vf', 'newest', sector) && q.o[q.a] === shown(four[ans]))) continue;   // a new answer each time
        const next = four[ys.indexOf(Math.max(...rest))];
        out.push({ ...from(four[ans], 'founded'), z: Sx.z, f: 'Founded', id: `vf-newest-${sector}-${made}`, k: kOf('vf', 'newest', sector), d: 2, t: 'choice',
          q: `Which of these ${sector === 'orgs' ? 'organizations' : 'companies'} was founded most recently?`, o: four.map(shown), a: ans,
          v: four.map((v) => String(v.founded)), why: `${shown(four[ans])} dates from ${newest}; the next newest, ${shown(next)}, from ${next.founded}.`, see: see(four[ans]) });
        made++;
      }
      // which of two came first, fifteen years or more apart: the easy tile
      for (let n = 0, tries = 0; n < 2 && tries < 300; tries++) {
        const [a, b] = r.shuffle(ok).slice(0, 2);
        if (Math.abs(a.founded - b.founded) < 15) continue;
        const old = a.founded < b.founded ? a : b, young = old === a ? b : a;
        if (out.some((q) => q.k === kOf('vf', 'older', sector) && q.o.includes(shown(old)))) continue;
        out.push({ ...from(old, 'founded'), z: Sx.z, f: 'Founded', id: `vf-older-${sector}-${n}`, k: kOf('vf', 'older', sector), d: 1, t: 'choice',
          q: `Which of these two ${sector === 'orgs' ? 'organizations' : 'companies'} was founded first?`, o: [shown(a), shown(b)], a: a === old ? 0 : 1,
          v: [String(a.founded), String(b.founded)], why: `${shown(old)} dates from ${old.founded} and ${shown(young)} from ${young.founded}.`, see: see(old) });
        n++;
      }
    }
  }
  return out;
}

module.exports = { name: 'vendor-facts', prefix: 'vf-', reads, build };
