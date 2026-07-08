'use strict';
/**
 * suppliers adapter — derived/suppliers-by-state.json -> supply-density nodes
 * BY KIND. The DMEPOS feed mixes pharmacies, DME equipment, optical, and
 * orthotics/prosthetics; lumping them is wrong (it is ~71% pharmacy). So the
 * master graph gets one node per kind + a total, each DESCRIBING the states
 * with the count on the edge (metric pattern):
 *
 *   supply:kind:dme       --describes {value:240}--> place:state:ut
 *   supply:kind:pharmacy  --describes {value:610}--> place:state:ut
 *
 * Pharmacy density and DME density are now separate things that each describe a
 * state, so DME-vs-burden and pharmacy-vs-burden are distinct queries.
 */
const { makeNode, edge, uid } = require('../entity');

module.exports = {
  name: 'suppliers',
  run(read) {
    const agg = read('data-build/suppliers-by-state.json');
    const labels = agg.kinds || {};
    const out = [];

    out.push(makeNode({
      uid: uid('supply', 'all'),
      type: 'supply',
      label: 'Suppliers (all kinds)',
      facets: { layer: 'supply', kind: 'total', unit: 'count', national: agg.national.total, stateCount: Object.keys(agg.byState).length },
      searchParts: ['suppliers dmepos all total'],
      rels: Object.entries(agg.byState).map(([st, s]) => edge('describes', uid('place', 'state', st), { value: s.total })),
      source: { dataset: 'suppliers-by-state.json', kind: 'total' },
      href: '/tools/healthcare-operators-map/',
    }));

    const kinds = new Set();
    for (const s of Object.values(agg.byState)) for (const k of Object.keys(s.kind || {})) kinds.add(k);

    for (const k of kinds) {
      const rels = [];
      for (const [st, s] of Object.entries(agg.byState)) {
        const v = (s.kind || {})[k];
        if (v) rels.push(edge('describes', uid('place', 'state', st), { value: v }));
      }
      const label = labels[k] || (k.charAt(0).toUpperCase() + k.slice(1));
      out.push(makeNode({
        uid: uid('supply', 'kind', k),
        type: 'supply',
        label: label + ' (supplier density)',
        facets: { layer: 'supply', kind: k, supplierKind: k, unit: 'count', national: (agg.national.kind || {})[k] || 0, stateCount: rels.length },
        searchParts: [label, 'supplier dmepos density', k.replace(/-/g, ' ')],
        rels,
        source: { dataset: 'suppliers-by-state.json', kind: k },
        href: '/tools/healthcare-operators-map/?layer=' + encodeURIComponent(k),
      }));
    }
    return out;
  },
};
