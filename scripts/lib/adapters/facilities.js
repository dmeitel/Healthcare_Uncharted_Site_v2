'use strict';
/**
 * facilities adapter — src/assets/data/us-hospitals.json -> facility nodes that
 * LINK into the backbone. This is the first adapter that joins datasets.
 *
 * Each hospital draws edges, it does not mint places or systems:
 *   in-state  -> place:state:<abbr>
 *   in-county -> place:county:<fips>   (resolved via the same matcher the
 *                                       rollups use, so the join rate matches)
 *   part-of   -> system:<systemId>     (when affiliated)
 *
 * County FIPS and system slugs come from scripts/lib/aggregate.js so this
 * adapter and the existing derived rollups never disagree about a join.
 */
const { makeNode, edge, uid } = require('../entity');
const { buildCountyIndex, resolveCountyFips, slugifySystem } = require('../aggregate');

module.exports = {
  name: 'facilities',
  run(read) {
    const hospitals = read('src/assets/data/us-hospitals.json').hospitals || [];
    const counties = read('src/_data/registries/counties.json').counties;
    const countyIdx = buildCountyIndex(counties);

    return hospitals.map((h) => {
      const rels = [];
      if (h.s) rels.push(edge('in-state', uid('place', 'state', h.s)));
      const cf = resolveCountyFips(h, countyIdx);
      if (cf) rels.push(edge('in-county', uid('place', 'county', cf)));
      if (h.sys) rels.push(edge('part-of', uid('system', slugifySystem(h.sys))));

      return makeNode({
        uid: uid('facility', 'cms', h.id),
        type: 'facility',
        label: h.n,
        facets: {
          layer: 'facilities',
          facType: h.t || null,        // acute, cah, psych, child
          ownership: h.o || null,      // gov, np, fp
          ownershipDetail: h.od || null,
          beds: typeof h.beds === 'number' ? h.beds : null,
          trauma: h.trauma || null,
          stars: typeof h.r === 'number' ? h.r : null,
          er: h.e ? true : false,
          state: h.s || null,
          county: h.co || null,
          city: h.c || null,
          system: h.sys || null,
          lat: typeof h.la === 'number' ? h.la : null,
          lon: typeof h.lo === 'number' ? h.lo : null,
        },
        searchParts: [h.n, h.c, h.co, h.s, h.t, h.od, h.sys, h.trauma],
        rels,
        source: { dataset: 'us-hospitals.json', sourceId: h.id },
        href: '/tools/healthcare-operators-map/?facility=' + encodeURIComponent(h.id),
      });
    });
  },
};
