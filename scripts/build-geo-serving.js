#!/usr/bin/env node
'use strict';
/**
 * build-geo-serving.js — generator for the geo-v2 serving artifacts
 * (HU-UI-GRAMMAR Phase 3; first consumer is /secret-menu/geo-v2/,
 * the real operators-map conversion inherits these files).
 *
 * Outputs (all committed, all minified):
 *   src/assets/data/geo/us-states.json          52 states, lon/lat, with a
 *                                               precomputed CAMERA-SAFE bbox per
 *                                               state (west clamped -179.9 — the
 *                                               Aleutians cross the antimeridian
 *                                               and unclamped fits center on
 *                                               open ocean)
 *   src/assets/data/geo/counties/<fips>.json    per-state county boundaries,
 *                                               loaded only when that state is
 *                                               selected (rule 7: on intent)
 *   src/assets/data/geo/pharmacy/<abbr>.json    per-state pharmacy GeoJSON shards
 *                                               cut from us-suppliers-pharmacy.json
 *                                               (6.15MB whole — NEVER shipped whole
 *                                               to a phone; ~120KB average shard)
 *
 * Boundary sources (Census-derived, lon/lat, fetched once into scripts/.cache):
 *   https://cdn.jsdelivr.net/gh/plotly/datasets@master/geojson-counties-fips.json
 *   https://cdn.jsdelivr.net/gh/PublicaMundi/MappingAPI@master/data/geojson/us-states.json
 *
 * Re-run with:  node scripts/build-geo-serving.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CACHE = path.join(__dirname, '.cache');
const OUT = path.join(ROOT, 'src/assets/data/geo');
fs.mkdirSync(path.join(OUT, 'counties'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'pharmacy'), { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });

const SOURCES = {
  'geojson-counties-fips.json': 'https://cdn.jsdelivr.net/gh/plotly/datasets@master/geojson-counties-fips.json',
  'us-states-publicamundi.json': 'https://cdn.jsdelivr.net/gh/PublicaMundi/MappingAPI@master/data/geojson/us-states.json'
};

const FIPS_ABBR = require('./lib/fips').FIPS_ABBR;   // one shared table — scripts/lib/fips.js

async function cached(name) {
  const p = path.join(CACHE, name);
  if (!fs.existsSync(p)) {
    console.log('fetching', SOURCES[name]);
    const r = await fetch(SOURCES[name]);
    if (!r.ok) throw new Error(name + ' fetch failed: ' + r.status);
    fs.writeFileSync(p, await r.text());
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// ~11m precision is plenty for 20m-resolution tap targets
const round = c => Array.isArray(c[0]) ? c.map(round) : [Math.round(c[0] * 1e4) / 1e4, Math.round(c[1] * 1e4) / 1e4];

function bboxSafe(geom) {
  let w = 180, s = 90, e = -180, n = -90;
  const walk = c => { if (typeof c[0] === 'number') { if (c[0] < w) w = c[0]; if (c[0] > e) e = c[0]; if (c[1] < s) s = c[1]; if (c[1] > n) n = c[1]; } else c.forEach(walk); };
  walk(geom.coordinates);
  if (w < -179.9) w = -179.9;
  const r = x => Math.round(x * 1e3) / 1e3;
  return [r(w), r(s), r(e), r(n)];
}

// CMS ships names ALL CAPS — bake title case into the shards
const ACRO = new Set(['VA','LLC','USA','LDS','IHC','UPMC','CVS','II','III','IV']);
const tcase = s => String(s || '').toLowerCase().replace(/[\w']+/g, w => {
  const u = w.toUpperCase(); return ACRO.has(u) ? u : w.charAt(0).toUpperCase() + w.slice(1); });

(async () => {
  // ── states ──
  const statesRaw = await cached('us-states-publicamundi.json');
  const sOut = {
    type: 'FeatureCollection',
    features: statesRaw.features.filter(f => FIPS_ABBR[f.id]).map(f => {
      const geometry = { type: f.geometry.type, coordinates: round(f.geometry.coordinates) };
      return { type: 'Feature', id: f.id,
        properties: { fips: f.id, abbr: FIPS_ABBR[f.id], name: f.properties.name, bb: bboxSafe(geometry) },
        geometry };
    })
  };
  fs.writeFileSync(path.join(OUT, 'us-states.json'), JSON.stringify(sOut));
  console.log('states:', sOut.features.length, Math.round(fs.statSync(path.join(OUT, 'us-states.json')).size / 1024) + 'KB');

  // ── counties, split per state ──
  const countiesRaw = await cached('geojson-counties-fips.json');
  const byState = {};
  countiesRaw.features.forEach(f => {
    const st = f.properties.STATE;
    if (!FIPS_ABBR[st]) return;
    (byState[st] = byState[st] || []).push({
      type: 'Feature', id: f.id,
      properties: { fips: f.id, name: f.properties.NAME },
      geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) }
    });
  });
  let ckb = 0;
  Object.entries(byState).forEach(([st, feats]) => {
    const p = path.join(OUT, 'counties', st + '.json');
    fs.writeFileSync(p, JSON.stringify({ type: 'FeatureCollection', features: feats }));
    ckb += fs.statSync(p).size / 1024;
  });
  console.log('county files:', Object.keys(byState).length, '· total', Math.round(ckb) + 'KB');

  // ── pharmacy shards (ready-to-serve GeoJSON, title-cased) ──
  const sup = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/assets/data/us-suppliers-pharmacy.json'), 'utf8'));
  const byAbbr = {};
  (sup.facilities || []).forEach(h => {
    if (h.lo == null || h.la == null || !h.s) return;
    (byAbbr[h.s] = byAbbr[h.s] || []).push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [h.lo, h.la] },
      properties: { id: h.id, n: tcase(h.n), c: tcase(h.c), s: h.s, t: 'pharmacy' }
    });
  });
  let pkb = 0, pmax = ['', 0], pn = 0;
  Object.entries(byAbbr).forEach(([ab, feats]) => {
    const p = path.join(OUT, 'pharmacy', ab + '.json');
    fs.writeFileSync(p, JSON.stringify({ type: 'FeatureCollection', features: feats }));
    const kb = fs.statSync(p).size / 1024; pkb += kb; pn += feats.length;
    if (kb > pmax[1]) pmax = [ab, kb];
  });
  console.log('pharmacy shards:', Object.keys(byAbbr).length, '·', pn, 'points · total', Math.round(pkb) + 'KB · biggest', pmax[0], Math.round(pmax[1]) + 'KB');
})().catch(e => { console.error(e); process.exit(1); });
