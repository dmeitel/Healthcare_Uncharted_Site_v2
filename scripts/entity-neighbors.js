#!/usr/bin/env node
'use strict';
/**
 * entity-neighbors.js — inspect the unified graph from the terminal.
 *
 *   node scripts/entity-neighbors.js <uid|query> [--limit N]
 *
 * If the argument is a uid (e.g. place:state:ut), prints the node, its outgoing
 * edges, and everything that points AT it (grouped by relation + source type).
 * Otherwise treats the argument as a search query over labels / uids / the
 * precomputed search strings.
 *
 * This is how you walk the graph and verify joins without any UI.
 */
const fs = require('fs');
const path = require('path');
const P = (...p) => path.join(__dirname, '..', ...p);

const data = JSON.parse(fs.readFileSync(P('data-build/entities.json'), 'utf8'));
const nodes = data.nodes;
const byUid = new Map(nodes.map((n) => [n.uid, n]));

const argv = process.argv.slice(2);
const li = argv.indexOf('--limit');
const LIMIT = li >= 0 ? +argv[li + 1] : 12;
const arg = argv.filter((a, i) => a !== '--limit' && argv[i - 1] !== '--limit')[0];

if (!arg) { console.log('usage: node scripts/entity-neighbors.js <uid|query> [--limit N]'); process.exit(0); }

const L = (u) => { const n = byUid.get(u); return n ? n.label : u + ' (?)'; };
const T = (u) => { const n = byUid.get(u); return n ? n.type : '?'; };

function search(q) {
  q = q.toLowerCase();
  const hits = nodes.filter((n) => n.uid.toLowerCase().includes(q) || n.label.toLowerCase().includes(q) || (n.search || '').includes(q));
  console.log(hits.length + ' match "' + q + '"' + (byUid.has(arg) ? '' : '  (no exact uid; showing search)'));
  const byType = {};
  hits.forEach((n) => { (byType[n.type] = byType[n.type] || []).push(n); });
  for (const [t, arr] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
    console.log('\n  ' + t + ' (' + arr.length + '):');
    arr.slice(0, LIMIT).forEach((n) => console.log('    ' + n.uid + '   ' + n.label));
    if (arr.length > LIMIT) console.log('    ... +' + (arr.length - LIMIT) + ' more');
  }
}

function inspect(n) {
  console.log('● ' + n.uid);
  console.log('  type:  ' + n.type + '    layer: ' + ((n.facets && n.facets.layer) || '-'));
  console.log('  label: ' + n.label);
  const f = Object.entries(n.facets || {}).filter(([k]) => k !== 'layer').slice(0, 10).map(([k, v]) => k + '=' + v);
  if (f.length) console.log('  facets: ' + f.join('  '));
  if (n.href) console.log('  href:  ' + n.href);

  if (n.rels && n.rels.length) {
    console.log('\n  → outgoing (' + n.rels.length + '):');
    const byRel = {};
    n.rels.forEach((e) => { (byRel[e.rel] = byRel[e.rel] || []).push(e); });
    for (const [rel, arr] of Object.entries(byRel)) {
      console.log('    ' + rel + ' (' + arr.length + '):');
      arr.slice(0, LIMIT).forEach((e) => console.log('       ' + L(e.to) + (e.value != null ? '  [' + e.value + ']' : '') + '   <' + T(e.to) + '>'));
      if (arr.length > LIMIT) console.log('       ... +' + (arr.length - LIMIT) + ' more');
    }
  }

  const incoming = [];
  for (const m of nodes) for (const e of (m.rels || [])) if (e.to === n.uid) incoming.push({ from: m, rel: e.rel, value: e.value });
  if (incoming.length) {
    console.log('\n  ← incoming (' + incoming.length + '):');
    const grp = {};
    incoming.forEach((x) => { const k = x.rel + ' ← ' + x.from.type; (grp[k] = grp[k] || []).push(x); });
    for (const [k, arr] of Object.entries(grp).sort((a, b) => b[1].length - a[1].length)) {
      console.log('    ' + k + ' (' + arr.length + '):');
      arr.slice(0, 6).forEach((x) => console.log('       ' + x.from.label + (x.value != null ? '  [' + x.value + ']' : '') + '   ' + x.from.uid));
      if (arr.length > 6) console.log('       ... +' + (arr.length - 6) + ' more');
    }
  }
  if (!(n.rels && n.rels.length) && !incoming.length) console.log('\n  (no edges — this node is an island)');
}

const node = byUid.get(arg);
if (node) inspect(node); else search(arg);
