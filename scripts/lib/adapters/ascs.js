'use strict';
/**
 * ascs adapter — us-ascs.json -> ambulatory surgery center facility nodes.
 * Links by state only: the dataset carries no county name or system field.
 */
const { makeNode, edge, uid } = require('../entity');

module.exports = {
  name: 'ascs',
  run(read) {
    const recs = read('src/assets/data/us-ascs.json').facilities || [];
    return recs.map((r) => makeNode({
      uid: uid('facility', 'cms', r.id),
      type: 'facility',
      label: r.n,
      facets: {
        layer: 'facilities',
        facType: 'asc',
        state: r.s || null,
        city: r.c || null,
        npi: r.npi || null,
        lat: typeof r.la === 'number' ? r.la : null,
        lon: typeof r.lo === 'number' ? r.lo : null,
      },
      searchParts: [r.n, r.c, r.s, 'ambulatory surgery center asc'],
      rels: r.s ? [edge('in-state', uid('place', 'state', r.s))] : [],
      source: { dataset: 'us-ascs.json', sourceId: r.id },
      href: '/tools/healthcare-operators-map/?facility=' + encodeURIComponent(r.id),
    }));
  },
};
