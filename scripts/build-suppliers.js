#!/usr/bin/env node
'use strict';
/**
 * build-suppliers.js — ingest the CMS DMEPOS "Medical Equipment Suppliers"
 * directory, RECONCILE duplicate enrollments, and SPLIT BY KIND.
 *
 * Two data realities this handles:
 *  - One physical location can hold several Medicare enrollments (different CMS
 *    provider IDs at the same spot, e.g. a Walmart pharmacy). We collapse those
 *    by (first word of name + exact coordinate) so each storefront is one point.
 *    Genuinely different suppliers sharing a coordinate (a hospital campus) keep
 *    different first words, so they are NOT merged.
 *  - The feed mixes four operator types and is ~71% pharmacy, so it is split by
 *    KIND: pharmacy / dme (home-care equipment) / optical / orthotics-prosthetics.
 *
 * Outputs:
 *   src/assets/data/us-suppliers-<kind>.json          per-kind points (one map layer each)
 *   src/assets/data/derived/suppliers-by-state.json   state x kind counts (master graph)
 *
 * Coordinates come from the CSV (no geocoding). Network fetch + cache.
 *   node scripts/build-suppliers.js
 */
const fs = require('fs');
const path = require('path');

const URL = 'https://data.cms.gov/provider-data/sites/default/files/resources/3b76abb9b6f610373563b5ef08bb0d81_1780186547/Medical-Equipment-Suppliers.csv';
const ROOT = path.join(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);
const read = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));

const KIND_LABEL = {
  pharmacy: 'Pharmacies',
  dme: 'DME & equipment',
  optical: 'Optical & vision',
  'orthotics-prosthetics': 'Orthotics & prosthetics',
};
const MAP_KINDS = Object.keys(KIND_LABEL);

function kindOf(spec) {
  const s = spec.toLowerCase();
  if (/pharmac/.test(s)) return 'pharmacy';
  if (/orthotic|prosthetic|pedorthic/.test(s)) return 'orthotics-prosthetics';
  if (/optometr|optician|ocular|ophthalm/.test(s)) return 'optical';
  if (/medical supply|msc |oxygen|respiratory|equipment|\bsupply\b/.test(s)) return 'dme';
  return 'other';
}

// normalize a business name and take its first significant word — the dedup
// anchor that, paired with the exact coordinate, collapses chain re-enrollments
// (WALMART INC / WAL-MART STORES EAST) without merging different businesses.
const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\b(INC|LLC|LP|CORP|CO|THE|STORES|EAST|WEST)\b/g, ' ').replace(/\s+/g, ' ').trim();
const firstTok = (s) => norm(s).split(' ')[0] || '';

function parseCSV(text) {
  const rows = []; let row = [], field = '', inQ = false; const n = text.length;
  for (let i = 0; i < n; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
    else if (ch !== '\r') field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function getCSV() {
  const cache = P('scripts/.cache/dme-suppliers.csv');
  if (fs.existsSync(cache)) { console.log('  using cached CSV'); return fs.readFileSync(cache, 'utf8'); }
  console.log('  fetching CSV (~29 MB)...');
  const res = await fetch(URL);
  if (!res.ok) throw new Error('fetch failed: ' + res.status);
  const text = await res.text();
  fs.mkdirSync(P('scripts/.cache'), { recursive: true });
  fs.writeFileSync(cache, text);
  return text;
}

(async () => {
  const validStates = new Set(Object.keys(read('src/_data/registries/geo.json').states));
  const rows = parseCSV(await getCSV());
  const head = rows[0].map((h) => h.trim());
  const col = (name) => head.indexOf(name);
  const c = {
    id: col('provider_id'), bn: col('businessname'), pn: col('practicename'),
    city: col('practicecity'), st: col('practicestate'), zip: col('practicezip9code'),
    spec: col('specialitieslist'), ptype: col('providertypelist'),
    la: col('latitude'), lo: col('longitude'),
    assign: col('acceptsassignement'), cba: col('is_contracted_for_cba'),
  };

  // pass 1 — group enrollments into locations (first word + exact coordinate)
  const groups = new Map();
  let skipped = 0, enrollments = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; if (!r || r.length < head.length) { skipped++; continue; }
    const st = (r[c.st] || '').trim().toUpperCase();
    const name = (r[c.bn] || r[c.pn] || '').trim();
    if (!name || !st) { skipped++; continue; }
    enrollments++;
    const la = parseFloat(r[c.la]), lo = parseFloat(r[c.lo]);
    const hasXY = Number.isFinite(la) && Number.isFinite(lo);
    const key = hasXY ? firstTok(name) + '|' + la.toFixed(5) + ',' + lo.toFixed(5) : 'noxy|row' + i;
    let g = groups.get(key);
    if (!g) {
      g = { id: r[c.id], n: name, c: (r[c.city] || '').trim(), s: st, z: (r[c.zip] || '').slice(0, 5),
        la: hasXY ? +la.toFixed(5) : null, lo: hasXY ? +lo.toFixed(5) : null, spec: new Set(), a: 0, cb: 0, dup: 0 };
      groups.set(key, g);
    }
    g.dup++;
    for (const x of (r[c.spec] || '').split('|')) { const t = x.trim(); if (t) g.spec.add(t); }
    for (const x of (r[c.ptype] || '').split('|')) { const t = x.trim(); if (t) g.spec.add(t); }
    if (/true/i.test(r[c.assign] || '')) g.a = 1;
    if (/true/i.test(r[c.cba] || '')) g.cb = 1;
  }

  // pass 2 — classify each location and emit
  const pointsByKind = {}; MAP_KINDS.forEach((k) => (pointsByKind[k] = []));
  const byState = {};
  let merged = 0;
  for (const g of groups.values()) {
    if (g.dup > 1) merged += g.dup - 1;
    const specStr = [...g.spec].join('|');
    const kind = kindOf(specStr);

    if (pointsByKind[kind] && g.la != null) {
      pointsByKind[kind].push({
        id: g.id, n: g.n, c: g.c, s: g.s, t: kind, z: g.z, la: g.la, lo: g.lo,
        pt: specStr || null, a: g.a, cb: g.cb, ...(g.dup > 1 ? { dup: g.dup } : {}),
      });
    }
    if (!validStates.has(g.s)) continue;
    const s = byState[g.s] || (byState[g.s] = { total: 0, kind: {} });
    s.total++;
    s.kind[kind] = (s.kind[kind] || 0) + 1;
  }

  const national = { total: 0, kind: {} };
  for (const s of Object.values(byState)) {
    national.total += s.total;
    for (const [k, n] of Object.entries(s.kind)) national.kind[k] = (national.kind[k] || 0) + n;
  }

  for (const k of MAP_KINDS) {
    fs.writeFileSync(P('src/assets/data/us-suppliers-' + k + '.json'), JSON.stringify({
      _meta: { source: 'CMS DMEPOS Medical Equipment Suppliers (provider-data)', kind: k, kindLabel: KIND_LABEL[k], count: pointsByKind[k].length, note: 'co-located enrollments merged by name+coordinate; dup = enrollments at that location', fields: 'id,n,c,s,t=kind,z,pt=specialty,la,lo,a=acceptsAssignment,cb=competitiveBid,dup=enrollmentCount' },
      facilities: pointsByKind[k],
    }) + '\n');
  }

  fs.mkdirSync(P('src/assets/data/derived'), { recursive: true });
  fs.writeFileSync(P('src/assets/data/derived/suppliers-by-state.json'), JSON.stringify({
    _meta: { generated_by: 'scripts/build-suppliers.js', source: 'CMS DMEPOS suppliers', note: 'locations after merging duplicate enrollments', stateCount: Object.keys(byState).length },
    kinds: KIND_LABEL, national, byState,
  }) + '\n');

  console.log('  enrollments: ' + enrollments + '  ->  locations: ' + groups.size + '  (merged ' + merged + ' duplicate enrollments)');
  console.log('  by kind:');
  for (const [k, n] of Object.entries(national.kind).sort((a, b) => b[1] - a[1])) console.log('    ' + String(n).padStart(7) + '  ' + k);
  console.log('  map files: ' + MAP_KINDS.map((k) => k + '=' + pointsByKind[k].length).join(', ') + '   skipped: ' + skipped);
})().catch((e) => { console.error(e); process.exitCode = 1; });
