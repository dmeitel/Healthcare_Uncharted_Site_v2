#!/usr/bin/env node
'use strict';
/**
 * build-entities.js — run every dataset adapter, merge into the canonical node
 * graph, validate the links, and write two derived artifacts:
 *
 *   src/assets/data/derived/entities.json      the typed graph (nodes + edges)
 *   src/assets/data/derived/search-index.json  flat: uid, type, layer, label, search, href
 *
 * Purely additive. Nothing reads these yet. The Atlas is untouched. This step
 * exists so you can OPEN the output and judge the shape before wiring any tool.
 *
 * Add a new dataset by writing one adapter and adding it to ADAPTERS below.
 *
 *   node scripts/build-entities.js
 */
const fs = require('fs');
const path = require('path');
const { mergeBackbone, validateNodes } = require('./lib/entity');

const ROOT = path.join(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);
const read = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const readText = (rel) => fs.readFileSync(P(rel), 'utf8');   // for adapters parsing non-JSON sources (e.g. the Atlas .njk)

// Each adapter is { name, run(read, readText) -> node[] }. This list is the seam.
// Backbone first (mint the shared spine), then datasets that link into it.
const ADAPTERS = [
  require('./lib/adapters/backbone'),
  require('./lib/adapters/career-tree'),
  require('./lib/adapters/facilities'),
  require('./lib/adapters/ascs'),
  require('./lib/adapters/dialysis'),
  require('./lib/adapters/metrics'),
  require('./lib/adapters/county-metrics'),
  require('./lib/adapters/suppliers'),
  require('./lib/adapters/vendors'),
  require('./lib/adapters/atlas-concepts'),
];

let all = [];
for (const a of ADAPTERS) {
  const nodes = a.run(read, readText);
  console.log('  ' + a.name + ': ' + nodes.length + ' nodes');
  all = all.concat(nodes);
}

// Collapse duplicate backbone nodes (one place:state:al, not thousands).
const m = mergeBackbone(all);
all = m.nodes;
if (m.merged) console.log('  merged ' + m.merged + ' duplicate backbone refs');

// Apply curated cross-layer edges (the editorial connective tissue). Skip any
// whose endpoints don't exist so a typo surfaces instead of dangling.
const crossLinks = require('./lib/cross-links');
const xlByUid = new Map(all.map((n) => [n.uid, n]));
let xlApplied = 0; const xlSkipped = [];
for (const cl of crossLinks) {
  const from = xlByUid.get(cl.from);
  if (from && xlByUid.has(cl.to)) { from.rels.push({ rel: cl.rel, to: cl.to, curated: true }); xlApplied++; }
  else xlSkipped.push(cl.from + ' -' + cl.rel + '-> ' + cl.to);
}
console.log('  cross-links: ' + xlApplied + ' applied' + (xlSkipped.length ? ', ' + xlSkipped.length + ' skipped (missing endpoint)' : ''));
xlSkipped.forEach((s) => console.log('    skip: ' + s));

const v = validateNodes(all);

const OUT = P('src/assets/data/derived');
fs.mkdirSync(OUT, { recursive: true });
const stamp = { generated_by: 'scripts/build-entities.js', adapters: ADAPTERS.map((a) => a.name), nodeCount: all.length };

const write = (name, obj) => {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj) + '\n');
  console.log('  wrote derived/' + name);
};

write('entities.json', { _meta: stamp, nodes: all });
write('search-index.json', {
  _meta: stamp,
  items: all.map((n) => ({ uid: n.uid, type: n.type, layer: n.facets.layer || null, label: n.label, search: n.search, href: n.href })),
});

// search-graph.json — purpose-built for the search tool: every node with its
// label, search string, a trimmed facet set, and compact relationships
// (rels as [rel, to] or [rel, to, value]). Smaller than entities.json (no
// lat/lon/long text), but it carries the rels the relationship-walk needs.
const FACET_KEYS = ['layer', 'state', 'facType', 'ownership', 'kind', 'lens', 'unit', 'dir', 'domain', 'family', 'tier', 'tierLabel', 'pathway', 'zone', 'zoneLabel', 'group', 'supplierKind', 'category', 'trauma', 'beds', 'stars', 'stats', 'sector', 'sectorLabel', 'status', 'owner', 'ps'];
const pick = (o, keys) => { const r = {}; for (const k of keys) if (o && o[k] != null) r[k] = o[k]; return r; };
write('search-graph.json', {
  _meta: stamp,
  nodes: all.map((n) => ({
    uid: n.uid, type: n.type, label: n.label, search: n.search, href: n.href,
    facets: pick(n.facets, FACET_KEYS),
    rels: (n.rels || []).map((e) => (e.value != null ? [e.rel, e.to, e.value] : [e.rel, e.to])),
  })),
});

// ── headless report: this is how you see the backend working ──────────────
const edges = all.reduce((s, n) => s + (n.rels ? n.rels.length : 0), 0);
console.log('\nby type:');
for (const [k, c] of Object.entries(v.byType)) console.log('  ' + k.padEnd(16) + c);
console.log('by layer:');
for (const [k, c] of Object.entries(v.byLayer)) console.log('  ' + String(k).padEnd(16) + c);
console.log('\nedges: ' + edges + '   dangling: ' + v.dangling.length);
if (v.dangling.length) {
  console.log('  sample dangling (edge target uid not found):');
  v.dangling.slice(0, 12).forEach((d) => console.log('    ' + d.from + ' --' + d.rel + '--> ' + d.to));
}
if (v.warnings.length) {
  console.log('\nwarnings: ' + v.warnings.length);
  v.warnings.slice(0, 8).forEach((w) => console.log('  ' + w));
}
if (v.errors.length) {
  console.log('\nERRORS: ' + v.errors.length);
  v.errors.slice(0, 12).forEach((e) => console.log('  ' + e));
  process.exitCode = 1;
}
console.log('\nbuild-entities: done.');
