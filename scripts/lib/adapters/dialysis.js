'use strict';
/**
 * dialysis adapter — us-dialysis.json -> dialysis facility nodes.
 * Links by state only (no county name field). Chain org is kept as a facet for
 * now; promote it to a part-of system edge later once chains are registered.
 */
const { makeNode, edge, uid } = require('../entity');

module.exports = {
  name: 'dialysis',
  run(read) {
    const recs = read('src/assets/data/us-dialysis.json').facilities || [];
    return recs.map((r) => makeNode({
      uid: uid('facility', 'cms', r.id),
      type: 'facility',
      label: r.n,
      facets: {
        layer: 'facilities',
        facType: 'dialysis',
        state: r.s || null,
        city: r.c || null,
        ownership: r.o || null,
        network: r.net || null,       // ESRD network
        chain: r.chain || null,
        peritoneal: r.pd ? true : false,
        homeHemo: r.hhd ? true : false,
        stars: typeof r.r === 'number' ? r.r : null,
        lat: typeof r.la === 'number' ? r.la : null,
        lon: typeof r.lo === 'number' ? r.lo : null,
      },
      searchParts: [r.n, r.c, r.s, r.chain, 'dialysis'],
      rels: r.s ? [edge('in-state', uid('place', 'state', r.s))] : [],
      source: { dataset: 'us-dialysis.json', sourceId: r.id },
      href: '/tools/healthcare-operators-map/?facility=' + encodeURIComponent(r.id),
    }));
  },
};
