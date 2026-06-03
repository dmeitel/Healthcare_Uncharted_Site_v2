/**
 * aggregate.js — the single source of truth for turning the granular facility
 * roster into macro rollups. Pure functions, no I/O, so both the build script
 * and the Eleventy data module can call them and always agree.
 */

const DIRECTIONALS = { 'E': 'EAST', 'W': 'WEST', 'N': 'NORTH', 'S': 'SOUTH' };

/** Normalize a county name for joining (handles case, accents, abbreviations, suffixes). */
function normCounty(s) {
  let x = String(s || '').toUpperCase();
  // strip accents (Doña Ana -> DONA ANA)
  x = x.normalize('NFD').replace(/[̀-ͯ]/g, '');
  // drop apostrophes/periods first so "George's" and "St." collapse cleanly
  // (must precede directional expansion, or the S in "George'S" becomes SOUTH)
  x = x.replace(/['’`.]/g, '');
  x = x.replace(/[^A-Z]+/g, ' ').trim();
  // expand standalone directional abbreviations: "E BATON ROUGE" -> "EAST BATON ROUGE"
  x = x.replace(/\b([ENWS])\b/g, (m, d) => DIRECTIONALS[d] || m);
  x = x.replace(/\bSAINT\b/g, 'ST');
  x = x.replace(/\b(COUNTY|PARISH|BOROUGH|CENSUS AREA|MUNICIPALITY|CITY AND BOROUGH|CITY)\b/g, '');
  return x.replace(/\s+/g, '');
}

/** Build a lookup index: "ST|NORMNAME" -> countyFips, from the counties registry. */
function buildCountyIndex(counties) {
  const idx = {};
  for (const [fips, c] of Object.entries(counties)) {
    if (c.name) idx[c.stateAbbr + '|' + normCounty(c.name)] = fips;
  }
  return idx;
}

/** Resolve a facility to a county FIPS, with special cases. Returns fips or null. */
function resolveCountyFips(facility, countyIdx) {
  if (facility.s === 'DC') return '11001'; // CMS sometimes labels DC county "THE DISTRICT"
  const key = facility.s + '|' + normCounty(facility.co);
  return countyIdx[key] || null;
}

/** State population from county populations (countyFIPS[:2] === stateFIPS). */
function statePopulations(countyPop, geoStates) {
  const fipsToAbbr = {};
  for (const s of Object.values(geoStates)) fipsToAbbr[s.fips] = s.abbr;
  const pop = {};
  for (const [fips, rec] of Object.entries(countyPop)) {
    const p = rec && typeof rec.p === 'number' ? rec.p : 0;
    const abbr = fipsToAbbr[String(fips).padStart(5, '0').slice(0, 2)];
    if (!abbr) continue;
    pop[abbr] = (pop[abbr] || 0) + p;
  }
  return pop;
}

function slugifySystem(name) {
  return String(name)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function emptyTally() { return {}; }
function bump(obj, key) { obj[key] = (obj[key] || 0) + 1; }
function per100k(count, pop) { return pop > 0 ? +(count / pop * 100000).toFixed(2) : null; }

/**
 * Main entry. Inputs are already-parsed JSON.
 * @returns { national, byState, byCounty, bySystem, systemsSeed, join }
 */
function aggregate({ facilities, counties, geo, countyPop }) {
  const geoStates = geo.states;
  const countyIdx = buildCountyIndex(counties);
  const statePop = statePopulations(countyPop, geoStates);

  const national = { total: 0, byType: emptyTally(), byOwnership: emptyTally(), withBeds: 0, totalBeds: 0, withSystem: 0, withTrauma: 0 };
  const byState = {};
  const byCounty = {};
  const systems = {}; // name -> { systemId, name, count, byType, states:Set }
  const unmatchedCounty = [];

  for (const h of facilities) {
    national.total++;
    if (h.t) bump(national.byType, h.t);
    if (h.o) bump(national.byOwnership, h.o);
    if (typeof h.beds === 'number') { national.withBeds++; national.totalBeds += h.beds; }
    if (h.trauma) national.withTrauma++;
    if (h.sys) national.withSystem++;

    // --- state rollup ---
    const st = h.s;
    if (st) {
      const s = byState[st] || (byState[st] = { abbr: st, total: 0, byType: emptyTally(), byOwnership: emptyTally(), beds: 0, population: statePop[st] || null });
      s.total++;
      if (h.t) bump(s.byType, h.t);
      if (h.o) bump(s.byOwnership, h.o);
      if (typeof h.beds === 'number') s.beds += h.beds;
    }

    // --- county rollup ---
    const cf = resolveCountyFips(h, countyIdx);
    if (cf) {
      const meta = counties[cf] || {};
      const c = byCounty[cf] || (byCounty[cf] = { fips: cf, name: meta.name || null, stateAbbr: meta.stateAbbr || st, total: 0, byType: emptyTally(), population: (countyPop[cf] && countyPop[cf].p) || null });
      c.total++;
      if (h.t) bump(c.byType, h.t);
    } else {
      unmatchedCounty.push({ name: h.co, state: h.s, id: h.id });
    }

    // --- system rollup ---
    if (h.sys) {
      const sys = systems[h.sys] || (systems[h.sys] = { systemId: slugifySystem(h.sys), name: h.sys, count: 0, byType: emptyTally(), states: new Set() });
      sys.count++;
      if (h.t) bump(sys.byType, h.t);
      if (st) sys.states.add(st);
    }
  }

  // finalize per-100k
  for (const s of Object.values(byState)) s.per100k = per100k(s.total, s.population);
  for (const c of Object.values(byCounty)) c.per100k = per100k(c.total, c.population);

  // systems -> array + seed registry
  const bySystem = Object.values(systems)
    .map((s) => ({ systemId: s.systemId, name: s.name, count: s.count, stateCount: s.states.size, byType: s.byType }))
    .sort((a, b) => b.count - a.count);
  const systemsSeed = {};
  for (const s of bySystem) systemsSeed[s.systemId] = { systemId: s.systemId, name: s.name, facilityCount: s.count, stateCount: s.stateCount };

  return {
    national,
    byState,
    byCounty,
    bySystem,
    systemsSeed,
    join: {
      countyMatched: facilities.length - unmatchedCounty.length,
      countyUnmatched: unmatchedCounty.length,
      countyMatchRate: +((1 - unmatchedCounty.length / facilities.length) * 100).toFixed(2),
      unmatchedSample: unmatchedCounty.slice(0, 25),
    },
  };
}

module.exports = { aggregate, normCounty, buildCountyIndex, resolveCountyFips, statePopulations, slugifySystem };
