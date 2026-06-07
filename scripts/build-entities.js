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
const { validateNodes } = require('./lib/entity');

const ROOT = path.join(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);
const read = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));

// Each adapter is { name, run(read) -> node[] }. This list is the whole seam.
const ADAPTERS = [
  require('./lib/adapters/career-tree'),
];

let all = [];
for (const a of ADAPTERS) {
  const nodes = a.run(read);
  console.log('  ' + a.name + ': ' + nodes.length + ' nodes');
  all = all.concat(nodes);
}

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
