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
const STFIPS = { '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY' };

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
