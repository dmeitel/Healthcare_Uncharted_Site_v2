'use strict';
/**
 * vendors adapter — src/assets/data/vendors.json -> vendor nodes.
 *
 * The healthcare-vendor-directory tool and this adapter read the SAME file, so
 * the directory and the entity graph never drift. Each vendor becomes a
 * vendor:<slug> node living in the Health Tech zone (concept:zone:techeco),
 * carrying its sector, status, owner, and 4Ps layers as facets.
 *
 * Atlas binding (the `represents` edges that make a techeco hex surface its real
 * vendors in the HUD) is added in the atlas-concepts adapter, which maps each
 * vendor sector to its hex concept. So this adapter stays domain-pure: it just
 * mints the vendor nodes and zones them.
 */
const { makeNode, edge, uid, slug } = require('../entity');

module.exports = {
  name: 'vendors',
  run(read) {
    const data = read('src/assets/data/vendors.json');
    const vendors = data.vendors || [];
    const labels = data.sectorLabels || {};

    return vendors.map((v) => {
      const sid = slug(v.name);
      const sectorLabel = labels[v.sector] || v.sector;
      return makeNode({
        uid: uid('vendor', v.name),
        type: 'vendor',
        label: v.name,
        facets: {
          layer: 'vendors',
          sector: v.sector,
          sectorLabel,
          status: v.status || null,
          owner: v.owner || null,
          ps: Array.isArray(v.ps) ? v.ps : [],
        },
        searchParts: [v.name, v.owner, sectorLabel, v.sector, v.desc, ...(v.ps || [])],
        rels: [edge('in-zone', uid('concept', 'zone', 'techeco'))],
        source: { dataset: 'vendors.json', sourceId: sid },
        href: '/tools/healthcare-vendor-directory/?v=' + encodeURIComponent(sid),
      });
    });
  },
};
