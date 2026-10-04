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
 *   data-build/suppliers-by-state.json   state x kind counts (master graph)
 *
 * Coordinates come from the CSV (no geocoding). Network fetch + cache.
 *   node scripts/build-suppliers.js             rebuild from the cached CSV
 *   node scripts/build-suppliers.js --refresh   download CMS's current release first (npm run build:suppliers -- --refresh)
 * Then: node scripts/build-geo-serving.js --pharmacy (the per-state pharmacy shards the map loads) and
 * node scripts/build-hospital-enrichment.js (hospital cards' same-ZIP pharmacy counts).
 */
const fs = require('fs');
const path = require('path');

// The CSV lives behind a rotating content hash, so the pinned URL 404s whenever CMS
// republishes. Resolve the CURRENT distribution URL from the dataset metastore first;
// the pinned copy is only the offline fallback. Dataset id: ct36-nrcq.
const META_URL = 'https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/ct36-nrcq';
const FALLBACK_URL = 'https://data.cms.gov/provider-data/sites/default/files/resources/3b76abb9b6f610373563b5ef08bb0d81_1780186547/Medical-Equipment-Suppliers.csv';
/** the current CSV and the date CMS released it (the metastore's "released", falling back to "modified") */
async function resolveCsvUrl() {
  try {
    const res = await fetch(META_URL);
    if (!res.ok) throw new Error('metastore ' + res.status);
    const meta = await res.json();
    const dist = (meta.distribution || []).find((d) => /\.csv($|\?)/i.test(d.downloadURL || ''));
    if (dist && dist.downloadURL) { console.log('  resolved current CSV via metastore, released ' + (meta.released || meta.modified)); return { url: dist.downloadURL, released: meta.released || meta.modified || '' }; }
    throw new Error('no csv distribution in metastore response');
  } catch (e) {
    console.warn('  metastore resolve failed (' + e.message + '), falling back to pinned URL');
    return { url: FALLBACK_URL, released: '' };
  }
}
// --refresh downloads the current file; without it the cached copy is reused. The cache keeps a note of which release
// it holds and when it was fetched, so the outputs can say so (2026-10-03: the shipped files were quietly built from a
// June copy for four months, because the cache never expired and nothing printed its age).
const REFRESH = process.argv.includes('--refresh');
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

/* WHAT A SUPPLIER CARRIES (2026-10-03, step 4 of the Vital Stats data plan, David: "include DME types"). The CSV's
   supplieslist names what CMS lists each location as carrying, from a fixed list of 86 categories (CMS describes the
   dataset as "the supplies carried at that location"). The map filters equipment suppliers by these groups, plain
   words for the CMS names, and a supplier's card lists every CMS category it carries. Pharmacies keep their file as
   it was: their lists are mostly drugs and glucose meters, and the filter is for equipment. A category CMS adds later
   lands in no group until it is placed here; the build names it so it is not missed. */
const EQUIPMENT_KINDS = ['dme', 'optical', 'orthotics-prosthetics'];
/** [key, label, the CMS categories in it] @type {Array<[string, string, string[]]>} */
const SUPPLY_GROUPS = [
  ['oxygen', 'Oxygen', ['Oxygen Equipment and/or Supplies']],
  ['cpap', 'CPAP and BiPAP', ['Continuous Positive Airway Pressure (CPAP) Devices', 'Respiratory Assist Devices']],
  ['vent', 'Ventilators and airway care', ['Ventilators Accessories and/or Supplies', 'Invasive Mechanical Ventilation',
    'Multi-Function Respiratory Devices (excluding ventilators)', 'High Freq Chest Wall Oscillation Devices/Supplies',
    'Mechanical In-Exsufflation Devices', 'Intrapulmonary Percussive Ventilation Devices', 'Intermittent Positive Pressure Breathing IPPB DEV',
    'Respiratory Suction Pumps', 'Tracheotomy Supplies']],
  ['neb', 'Nebulizers', ['Nebulizer Equipment and/or Supplies']],
  ['mobility', 'Wheelchairs, scooters and walkers', ['Wheelchairs (Standard Manual)', 'Wheelchairs (Standard Manual Related Accessories)',
    'Wheelchairs (Standard Power)', 'Wheelchairs (Standard Power Related Accessories)', 'Wheelchairs (Complex Rehabilitative Manual)',
    'Wheelchairs (Complex Rehab Manual Rel Accessories)', 'Wheelchairs (Complex Rehabilitative Power)', 'Wheelchairs (Complex Rehab Power Rel Accessories)',
    'Wheelchair Seating/Cushions', 'Power Operated Vehicles (Scooters)', 'Canes and/or Crutches', 'Walkers']],
  ['beds', 'Hospital beds, lifts and commodes', ['Hospital Beds (Electric)', 'Hospital Beds (Manual)', 'Support Surfaces: Pressure Reducing Beds/Mats/Pads',
    'Patient Lifts', 'Seat Lift Mechanisms', 'Commodes, Urinals, Bedpans']],
  ['diabetes', 'Diabetes supplies', ['Blood Glucose Monitors/Supplies (Non-Mail Order)', 'Blood Glucose Monitors/Supplies (Mail Order)',
    'Insulin Infusion Pumps and/or Supplies', 'Diabetic Shoes and Inserts', 'Diabetic Shoes/Inserts - Custom']],
  ['feeding', 'Feeding and infusion', ['Enteral Nutrients', 'Enteral Equipment and/or Supplies', 'Parenteral Nutrients', 'Parenteral Equipment and/or Supplies',
    'External Infusion Pumps and/or Supplies', 'Implanted Infusion Pumps and/or Supplies', 'Gastric Suction Pumps']],
  ['wound', 'Wound, ostomy and urology', ['Surgical Dressings', 'Ostomy Supplies', 'Urological Supplies', 'Urinary Suction Pumps',
    'Negative Pressure Wound Therapy Pumps/Supplies', 'Lymphedema Compression Treatment Items', 'Pneumatic Compression Devices and/or Supplies']],
  ['braces', 'Braces and prostheses', ['Orthoses: Custom Fabricated', 'Orthoses: Prefabricated (Non-Custom Fabricated)', 'Orthoses: Off-The-Shelf',
    'Limb Prostheses', 'Breast Prostheses and/or Accessories', 'Somatic Prostheses', 'Facial Prostheses', 'Ocular Prostheses', 'Voice Prosthetics', 'Cochlear Implants']],
  ['vision', 'Glasses and contacts', ['Prosthetic Lenses: Conventional Eyeglasses', 'Prosthetic Lenses: Conventional Contact Lenses', 'Prosthetic Lenses: Prosthetics Cataract Lenses']],
  ['devices', 'Stimulators and other devices', ['(TENS) Transcutaneous Electrical Nerve Stimulators and/or Supplies', 'Neuromuscular Elect Stimulators (NMES)/Supplies',
    'Osteogenesis Stimulators', 'Neurostimulators and/or Supplies', 'External Electrical Stimulation Devices (Not Otherwise Classified)',
    'Continuous Passive Motion (CPM) Devices', 'Contracture Treatment Devices: Dynamic Splint', 'Traction Equipment', 'Heat & Cold Applications',
    'Infrared Heating Pads Systems and/or Supplies', 'Ultraviolet Light Devices and/or Supplies', 'Rehabilitative Therapy Devices',
    'Cognitive Behavioral Therapy Devices', 'Speech Generating Devices', 'Automatic Ext Defibrillator (AEDS) and/or Supplies', 'Penile Pumps']],
  ['drugs', 'Part B drugs', ['Nebulizer Drugs', 'Immunosuppressive Drugs', 'Oral Anticancer Drugs', 'Oral Antiemetic Drugs', 'Infusion Drugs', 'Epoetin']]
];
const NO_GROUP = new Set(['Unknown']);   // CMS's own placeholder, carried on the card but in no group
if (SUPPLY_GROUPS.length > 30) throw new Error('supply groups ride a 31-bit mask');

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

/** @returns {Promise<{ text: string, released: string, pulled: string }>} */
async function getCSV() {
  const cache = P('scripts/.cache/dme-suppliers.csv'), note = cache.replace(/\.csv$/, '.meta.json');
  if (!REFRESH && fs.existsSync(cache)) {
    const m = fs.existsSync(note) ? JSON.parse(fs.readFileSync(note, 'utf8')) : { released: '', pulled: fs.statSync(cache).mtime.toISOString().slice(0, 10) };
    console.log('  using cached CSV (released ' + (m.released || 'unknown') + ', fetched ' + m.pulled + '); --refresh downloads the current one');
    return { text: fs.readFileSync(cache, 'utf8'), released: m.released, pulled: m.pulled };
  }
  console.log('  fetching CSV (~29 MB)...');
  const { url, released } = await resolveCsvUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch failed: ' + res.status);
  const text = await res.text();
  const pulled = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(P('scripts/.cache'), { recursive: true });
  fs.writeFileSync(cache, text);
  fs.writeFileSync(note, JSON.stringify({ released, pulled, url }) + '\n');
  return { text, released, pulled };
}

(async () => {
  const validStates = new Set(Object.keys(read('src/_data/registries/geo.json').states));
  const csv = await getCSV();
  const rows = parseCSV(csv.text);
  // what the files say today, for the diff printed at the end
  /** @type {Record<string, Set<string>>} */
  const before = {};
  for (const k of MAP_KINDS) {
    const f = P('src/assets/data/us-suppliers-' + k + '.json');
    before[k] = new Set(fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).facilities.map((/** @type {any} */ x) => x.id) : []);
  }
  const head = rows[0].map((h) => h.trim());
  const col = (name) => head.indexOf(name);
  const c = {
    id: col('provider_id'), bn: col('businessname'), pn: col('practicename'),
    city: col('practicecity'), st: col('practicestate'), zip: col('practicezip9code'),
    spec: col('specialitieslist'), ptype: col('providertypelist'), sup: col('supplieslist'),
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
        la: hasXY ? +la.toFixed(5) : null, lo: hasXY ? +lo.toFixed(5) : null, spec: new Set(), sup: new Set(), a: 0, cb: 0, dup: 0 };
      groups.set(key, g);
    }
    g.dup++;
    for (const x of (r[c.sup] || '').split('|')) { const t = x.trim(); if (t) g.sup.add(t); }   // merged enrollments carry everything any of them lists
    for (const x of (r[c.spec] || '').split('|')) { const t = x.trim(); if (t) g.spec.add(t); }
    for (const x of (r[c.ptype] || '').split('|')) { const t = x.trim(); if (t) g.spec.add(t); }
    if (/true/i.test(r[c.assign] || '')) g.a = 1;
    if (/true/i.test(r[c.cba] || '')) g.cb = 1;
  }

  // the supply dictionary: every category any equipment location carries, alphabetical, so an index is stable across
  // a refresh that adds nothing; each location ships its categories as two base-36 digits apiece, and its groups as a mask
  const groupOf = new Map(SUPPLY_GROUPS.flatMap(([, , names], i) => names.map((nm) => [nm, i])));
  const supplyNames = [...new Set([...groups.values()].filter((g) => EQUIPMENT_KINDS.includes(kindOf([...g.spec].join('|')))).flatMap((g) => [...g.sup]))].sort();
  if (supplyNames.length > 1295) throw new Error('two base-36 digits hold 1,296 categories');
  const unplaced = supplyNames.filter((nm) => !groupOf.has(nm) && !NO_GROUP.has(nm));
  if (unplaced.length) console.warn('  SUPPLY CATEGORIES IN NO GROUP (place them in SUPPLY_GROUPS): ' + unplaced.join(' | '));
  const supIndex = new Map(supplyNames.map((nm, i) => [nm, i]));
  const supplyMeta = {
    supplies: supplyNames,
    groups: SUPPLY_GROUPS.map(([key, label, names]) => ({ key, label, items: names.filter((nm) => supIndex.has(nm)).map((nm) => supIndex.get(nm)) })),
  };

  // pass 2 — classify each location and emit
  const pointsByKind = {}; MAP_KINDS.forEach((k) => (pointsByKind[k] = []));
  const byState = {};
  let merged = 0;
  for (const g of groups.values()) {
    if (g.dup > 1) merged += g.dup - 1;
    const specStr = [...g.spec].join('|');
    const kind = kindOf(specStr);

    if (pointsByKind[kind] && g.la != null) {
      /** @type {any} */
      const rec = {
        id: g.id, n: g.n, c: g.c, s: g.s, t: kind, z: g.z, la: g.la, lo: g.lo,
        pt: specStr || null, a: g.a, cb: g.cb, ...(g.dup > 1 ? { dup: g.dup } : {}),
      };
      if (EQUIPMENT_KINDS.includes(kind) && g.sup.size) {
        const names = [...g.sup].sort();
        let mask = 0;
        for (const nm of names) if (groupOf.has(nm)) mask |= 1 << groupOf.get(nm);
        if (mask) rec.sg = mask;
        rec.sl = names.map((nm) => supIndex.get(nm).toString(36).padStart(2, '0')).join('');
      }
      pointsByKind[kind].push(rec);
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
    const equip = EQUIPMENT_KINDS.includes(k);
    fs.writeFileSync(P('src/assets/data/us-suppliers-' + k + '.json'), JSON.stringify({
      _meta: Object.assign({ source: 'CMS DMEPOS Medical Equipment Suppliers (provider-data)', released: csv.released, pulled: csv.pulled, kind: k, kindLabel: KIND_LABEL[k], count: pointsByKind[k].length, note: 'co-located enrollments merged by name+coordinate; dup = enrollments at that location',
        fields: 'id,n,c,s,t=kind,z,pt=specialty,la,lo,a=acceptsAssignment,cb=competitiveBid,dup=enrollmentCount' + (equip ? ',sg=supply groups (bit i = groups[i]),sl=supplies carried (two base-36 digits each, indexes into supplies)' : '') },
      equip ? supplyMeta : {}),
      facilities: pointsByKind[k],
    }) + '\n');
  }

  fs.mkdirSync(P('data-build'), { recursive: true });
  fs.writeFileSync(P('data-build/suppliers-by-state.json'), JSON.stringify({
    _meta: { generated_by: 'scripts/build-suppliers.js', source: 'CMS DMEPOS suppliers', released: csv.released, pulled: csv.pulled, note: 'locations after merging duplicate enrollments', stateCount: Object.keys(byState).length },
    kinds: KIND_LABEL, national, byState,
  }) + '\n');

  console.log('  enrollments: ' + enrollments + '  ->  locations: ' + groups.size + '  (merged ' + merged + ' duplicate enrollments)');
  console.log('  by kind:');
  for (const [k, n] of Object.entries(national.kind).sort((a, b) => b[1] - a[1])) console.log('    ' + String(n).padStart(7) + '  ' + k);
  console.log('  map files: ' + MAP_KINDS.map((k) => k + '=' + pointsByKind[k].length).join(', ') + '   skipped: ' + skipped);
  console.log('  CMS release ' + (csv.released || 'unknown') + ', fetched ' + csv.pulled + '. Against the files before this run:');
  for (const k of MAP_KINDS) {
    const now = new Set(pointsByKind[k].map((x) => x.id));
    const added = [...now].filter((id) => !before[k].has(id)).length, gone = [...before[k]].filter((id) => !now.has(id)).length;
    console.log('    ' + k.padEnd(22) + String(before[k].size).padStart(6) + ' -> ' + String(now.size).padStart(6) + '   +' + added + ' new, -' + gone + ' gone');
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
