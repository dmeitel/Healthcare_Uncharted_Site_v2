'use strict';
/**
 * metrics adapter — metricsConfig.json (definitions) + stateData.json (values)
 * -> one metric node per (lens, metric), each DESCRIBING the state places.
 *
 * The measured value rides on the EDGE: metric --describes {value:23}--> place.
 * That is the edge-as-object design paying off: the value is an attribute of
 * the relationship, and the same slot will later hold weight / source.
 *
 * This is the bridge. A metric and a hospital both point at place:state:<abbr>,
 * so the metrics dataset is now joined to the facilities cluster through the
 * shared state, even though neither dataset mentions the other.
 */
const { makeNode, edge, uid } = require('../entity');

module.exports = {
  name: 'metrics',
  run(read) {
    const cfg = read('src/_data/metricsConfig.json');
    const data = read('src/_data/stateData.json');
    const out = [];
    for (const lens of Object.keys(cfg)) {
      if (lens.startsWith('_')) continue;            // _readme etc.
      const def = cfg[lens];
      if (!def || !Array.isArray(def.items)) continue;
      def.items.forEach((m, i) => {
        const values = (data[lens] && data[lens][String(i)]) || {};
        const rels = Object.entries(values)
          .filter(([, v]) => v != null)
          .map(([st, v]) => edge('describes', uid('place', 'state', st), { value: v }));
        out.push(makeNode({
          uid: uid('metric', lens, String(i)),
          type: 'metric',
          label: m.name,
          facets: {
            layer: 'metrics',
            lens,
            unit: m.unit || null,
            dir: m.dir == null ? null : m.dir,   // 1 higher=better, -1 lower=better, 0 neutral
            sub: m.sub || null,
            source: m.source || def.source || null,
            sourceUrl: m.sourceUrl || null,
            retrievedDate: m.retrievedDate || null,
            stateCount: rels.length,
          },
          searchParts: [m.name, m.sub, m.defn, lens, m.source, m.unit],
          rels,
          source: { dataset: 'stateData.json+metricsConfig.json', lens, index: i },
          href: '/tools/American-4Ps-Map/?lens=' + encodeURIComponent(lens) + '&metric=' + i,
        }));
      });
    }
    return out;
  },
};
