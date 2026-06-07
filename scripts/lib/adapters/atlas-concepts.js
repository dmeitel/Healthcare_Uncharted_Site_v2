'use strict';
/**
 * atlas-concepts adapter — lift the hand-authored ZONE_DEFS out of
 * src/atlas/index.njk into the entity layer as 'concept' nodes, WITHOUT
 * touching the Atlas. The .njk is read as TEXT and the ZONE_DEFS statement is
 * evaluated in isolation (as code, so comments / \n escapes / nested brackets
 * are handled by the JS engine, not a hand-rolled parser).
 *
 *   concept:zone:<zoneId>   the zone grouping
 *   concept:<nodeId>        each hex that has a nodeId   (part-of its zone)
 *
 * Tool links on a hex are kept as a facet (toolLinks), not edges, because the
 * tools are not entity nodes yet. No dangling edges.
 *
 * This makes the Atlas's own nodes exist AS entities, which is the thing the
 * eventual atlas-binding step needs to bind against.
 */
const { makeNode, edge, uid } = require('../entity');

function parseZoneDefs(src) {
  const start = src.indexOf('const ZONE_DEFS');
  if (start < 0) return [];
  const end = src.indexOf('\n];', start);     // first line-initial ]; closes the array
  if (end < 0) return [];
  const snippet = src.slice(start, end + 3);
  return new Function(snippet + '\nreturn ZONE_DEFS;')();
}

module.exports = {
  name: 'atlas-concepts',
  run(read, readText) {
    const zones = parseZoneDefs(readText('src/atlas/index.njk'));
    const byUid = new Map();

    for (const z of zones) {
      const zoneUid = uid('concept', 'zone', z.id);
      if (!byUid.has(zoneUid)) byUid.set(zoneUid, makeNode({
        uid: zoneUid,
        type: 'concept',
        label: z.label || z.displayLabel || z.id,
        facets: { layer: 'concept', kind: 'zone', zone: z.id, color: z.color || null, abbr: z.abbr || null },
        searchParts: [z.label, z.displayLabel, z.abbr, z.desc],
        source: { dataset: 'atlas/index.njk', kind: 'zone', sourceId: z.id },
        href: '/atlas/#' + encodeURIComponent(z.id),
      }));

      for (const c of (z.cells || [])) {
        if (!c.nodeId) continue;                 // terrain / decoration cells
        const cUid = uid('concept', c.nodeId);
        const existing = byUid.get(cUid);
        if (existing) {                           // concept reused across zones: just add the zone link
          const k = 'part-of|' + zoneUid;
          if (!existing.rels.some((e) => e.rel + '|' + e.to === k)) existing.rels.push(edge('part-of', zoneUid));
          continue;
        }
        byUid.set(cUid, makeNode({
          uid: cUid,
          type: 'concept',
          label: c.label || c.nodeId,
          facets: {
            layer: 'concept',
            kind: c.type || 'node',
            zone: z.id,
            zoneLabel: z.label || null,
            toolLinks: (c.links || []).map((l) => l.url),
          },
          searchParts: [c.label, c.desc, z.label, ...(c.links || []).map((l) => l.label)],
          rels: [edge('part-of', zoneUid)],
          source: { dataset: 'atlas/index.njk', kind: 'concept', zone: z.id, sourceId: c.nodeId },
          href: '/atlas/#' + encodeURIComponent(c.nodeId),
        }));
      }
    }
    return [...byUid.values()];
  },
};
