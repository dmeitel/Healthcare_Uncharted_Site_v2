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

// Same trick for a named expansion config object (const NAME = { ... };).
function parseExpand(src, name) {
  const start = src.indexOf('const ' + name + ' ');
  if (start < 0) return null;
  const end = src.indexOf('\n};', start);     // first line-initial }; closes the object
  if (end < 0) return null;
  return new Function(src.slice(start, end + 3) + '\nreturn ' + name + ';')();
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

    // ── vendor binding ──────────────────────────────────────────────────────
    // Map each techeco hex concept to the real vendors it stands for, so the
    // Atlas HUD ("Live data") surfaces them via the `represents` edge that
    // resolveBindings already reads. Data-driven from vendors.json: when the
    // directory grows, the hexes light up with the new vendors on next build.
    // sectors[] matches vendor.sector; match is a name regex for single-vendor hexes.
    const VENDOR_HEX = {
      // techeco — reuse the existing vendor hexes
      'ai-vendors':      { sectors: ['scribing', 'clinical'] },
      'rcm-vendors':     { sectors: ['rcm'] },
      'pacs':            { sectors: ['imaging', 'radiology'] },
      'interop-mid':     { sectors: ['interop'] },
      'cyber':           { sectors: ['cyber'] },
      'telehealth-plat': { sectors: ['telehealth'] },
      'pbm-tech':        { sectors: ['rx'] },
      'digital-health':  { sectors: ['engage'] },
      'data-warehouse':  { sectors: ['analytics'] },
      'ehr-tools':       { sectors: ['ehr'] },          // techeco landmark — Medical Record Tools (expands to all EHRs)
      // other zones — reuse hexes that are the natural home for a sector
      'med-devices':     { sectors: ['device', 'cardio'] }, // medsci (cardiovascular tech is largely devices)
      'rpm':             { sectors: ['rpm'] },          // medsci (Wearables & RPM)
      'diagnostics':     { sectors: ['labs'] },         // medsci (Diagnostics & Lab)
      'trials':          { sectors: ['research'] },     // medsci (Clinical Trials)
      'radiology':       { sectors: ['radiology'] },    // provider (Radiology & Imaging)
      'behavioral':      { sectors: ['behavioral'] },   // pubhealth (Behavioral Health)
      'accreditation':   { sectors: ['orgs'] },         // policy (Accreditation Bodies)
      'vendor-dir':      { sectors: ['cautionary'] },   // techeco landmark — the directory's cautionary tales
    };
    let vdata = null;
    try { vdata = read('src/assets/data/vendors.json'); } catch (e) { vdata = null; }
    if (vdata && Array.isArray(vdata.vendors)) {
      for (const [hexId, rule] of Object.entries(VENDOR_HEX)) {
        const concept = byUid.get(uid('concept', hexId));
        if (!concept) continue;
        const matches = vdata.vendors.filter((v) =>
          (rule.sectors && rule.sectors.includes(v.sector)) ||
          (rule.match && rule.match.test(v.name)));
        for (const v of matches) concept.rels.push(edge('represents', uid('vendor', v.name)));
      }
    }

    // EHR expansion sub-tiles -> concepts, each representing its EHR vendor, so a
    // sub-tile's "Live data" surfaces that vendor. Parsed from EXPAND_EHR in the .njk.
    const ehrExp = parseExpand(readText('src/atlas/index.njk'), 'EXPAND_EHR');
    if (ehrExp && Array.isArray(ehrExp.subs)) {
      const zoneUid = uid('concept', 'zone', ehrExp.zoneId);
      for (const sub of ehrExp.subs) {
        const cUid = uid('concept', sub.nodeId);
        if (byUid.has(cUid) || !sub.vendor) continue;
        byUid.set(cUid, makeNode({
          uid: cUid,
          type: 'concept',
          label: String(sub.label || sub.nodeId).replace(/\n/g, ' '),
          facets: { layer: 'concept', kind: 'sub', zone: ehrExp.zoneId },
          searchParts: [sub.label, sub.desc, sub.vendor],
          rels: [edge('part-of', zoneUid), edge('represents', uid('vendor', sub.vendor))],
          source: { dataset: 'atlas/index.njk', kind: 'expansion-sub', zone: ehrExp.zoneId, sourceId: sub.nodeId },
          href: '/atlas/#' + encodeURIComponent(sub.nodeId),
        }));
      }
    }

    return [...byUid.values()];
  },
};
