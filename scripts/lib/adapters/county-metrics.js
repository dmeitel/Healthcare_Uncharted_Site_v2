'use strict';
/**
 * county-metrics adapter — attaches county-grain metric values to the county
 * nodes that the backbone already mints, so the county data joins the graph.
 *
 * Design choice: the values ride on the COUNTY node as a facet bundle
 * (facets.stats), NOT as 3,000 describes-edges hung off each metric node. That
 * keeps metric nodes clean and keeps Atlas search from drowning in county hits.
 * A county is found by its place (name + state); its detail then carries its
 * health/economic profile.
 *
 * The county nodes are BACKBONE (type 'place'), so these thin emissions merge
 * into the real county nodes via mergeBackbone (it fills the missing facet and
 * keeps the backbone's richer label + search). We also assert in-state, which
 * dedupes against the backbone edge and connects any newer-vintage county that
 * the backbone registry does not have yet (CT planning regions, split AK boroughs).
 */
const { makeNode, edge, uid } = require('../entity');

// 2-digit state FIPS -> abbr (50 states + DC; territories are not in our data)
const STFIPS = require('../fips').FIPS_ABBR;   // one shared table — scripts/lib/fips.js

module.exports = {
  name: 'county-metrics',
  run(read) {
    let cd;
    try { cd = read('src/assets/data/countyData.json'); } catch { return []; }   // not built yet → no-op
    const meta = cd.meta || {};

    // gather every metric value per county FIPS
    const byFips = {};   // fips -> [{label, value, unit}]
    for (const lens of Object.keys(cd)) {
      if (lens === '_readme' || lens === 'meta') continue;
      for (const idx of Object.keys(cd[lens])) {
        const m = (meta[lens] && meta[lens][idx]) || {};
        const label = m.name || (lens + ':' + idx);
        const unit = m.unit || null;
        for (const [fips, v] of Object.entries(cd[lens][idx])) {
          if (v == null) continue;
          (byFips[fips] = byFips[fips] || []).push({ label, value: v, unit });
        }
      }
    }

    const out = [];
    for (const [fips, stats] of Object.entries(byFips)) {
      const abbr = STFIPS[fips.slice(0, 2)];
      out.push(makeNode({
        uid: uid('place', 'county', fips),
        type: 'place',
        label: fips,                 // placeholder; backbone's real county name wins on merge
        facets: { stats },           // the county's metric profile
        search: fips,                // minimal; backbone's richer name+state search wins on merge
        rels: abbr ? [edge('in-state', uid('place', 'state', abbr))] : [],
        source: { dataset: 'countyData.json' },
      }));
    }
    return out;
  },
};
