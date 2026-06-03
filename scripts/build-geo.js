#!/usr/bin/env node
/**
 * build-geo.js  —  one-time / refreshable generator for the geographic spine.
 *
 * Pulls county + state names from the same us-atlas source the operators map
 * already uses, joins them to a hardcoded state FIPS <-> abbreviation table,
 * and writes two committed reference files:
 *
 *   src/_data/registries/geo.json       state abbr <-> FIPS <-> name
 *   src/_data/registries/counties.json  countyFIPS -> { name, stateFips, stateAbbr }
 *
 * Re-run with:  node scripts/build-geo.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const SRC = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';
const OUT_DIR = path.join(__dirname, '..', 'src', '_data', 'registries');

// Canonical state spine: FIPS -> { abbr, name }. The 50 states + DC + territories.
const STATES = {
  '01': ['AL', 'Alabama'], '02': ['AK', 'Alaska'], '04': ['AZ', 'Arizona'],
  '05': ['AR', 'Arkansas'], '06': ['CA', 'California'], '08': ['CO', 'Colorado'],
  '09': ['CT', 'Connecticut'], '10': ['DE', 'Delaware'], '11': ['DC', 'District of Columbia'],
  '12': ['FL', 'Florida'], '13': ['GA', 'Georgia'], '15': ['HI', 'Hawaii'],
  '16': ['ID', 'Idaho'], '17': ['IL', 'Illinois'], '18': ['IN', 'Indiana'],
  '19': ['IA', 'Iowa'], '20': ['KS', 'Kansas'], '21': ['KY', 'Kentucky'],
  '22': ['LA', 'Louisiana'], '23': ['ME', 'Maine'], '24': ['MD', 'Maryland'],
  '25': ['MA', 'Massachusetts'], '26': ['MI', 'Michigan'], '27': ['MN', 'Minnesota'],
  '28': ['MS', 'Mississippi'], '29': ['MO', 'Missouri'], '30': ['MT', 'Montana'],
  '31': ['NE', 'Nebraska'], '32': ['NV', 'Nevada'], '33': ['NH', 'New Hampshire'],
  '34': ['NJ', 'New Jersey'], '35': ['NM', 'New Mexico'], '36': ['NY', 'New York'],
  '37': ['NC', 'North Carolina'], '38': ['ND', 'North Dakota'], '39': ['OH', 'Ohio'],
  '40': ['OK', 'Oklahoma'], '41': ['OR', 'Oregon'], '42': ['PA', 'Pennsylvania'],
  '44': ['RI', 'Rhode Island'], '45': ['SC', 'South Carolina'], '46': ['SD', 'South Dakota'],
  '47': ['TN', 'Tennessee'], '48': ['TX', 'Texas'], '49': ['UT', 'Utah'],
  '50': ['VT', 'Vermont'], '51': ['VA', 'Virginia'], '53': ['WA', 'Washington'],
  '54': ['WV', 'West Virginia'], '55': ['WI', 'Wisconsin'], '56': ['WY', 'Wyoming'],
  '60': ['AS', 'American Samoa'], '66': ['GU', 'Guam'], '69': ['MP', 'Northern Mariana Islands'],
  '72': ['PR', 'Puerto Rico'], '78': ['VI', 'U.S. Virgin Islands'],
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

(async () => {
  console.log('Fetching', SRC);
  const topo = await fetchJson(SRC);

  // --- geo.json (states) ---
  const states = {};
  for (const [fips, [abbr, name]] of Object.entries(STATES)) {
    states[abbr] = { fips, abbr, name };
  }
  const geo = {
    _meta: {
      note: 'Canonical state spine. countyFIPS[:2] === state fips. State abbr is the join key used by facility + metric data.',
      source: 'Census FIPS (hardcoded) + us-atlas names',
      count: Object.keys(states).length,
    },
    states,
  };

  // --- counties.json ---
  const geoms = (topo.objects.counties && topo.objects.counties.geometries) || [];
  const counties = {};
  let skipped = 0;
  for (const g of geoms) {
    const fips = String(g.id).padStart(5, '0');
    const stateFips = fips.slice(0, 2);
    const st = STATES[stateFips];
    if (!st) { skipped++; continue; }
    counties[fips] = {
      name: g.properties && g.properties.name ? g.properties.name : null,
      stateFips,
      stateAbbr: st[0],
    };
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'geo.json'), JSON.stringify(geo, null, 2) + '\n');
  fs.writeFileSync(
    path.join(OUT_DIR, 'counties.json'),
    JSON.stringify({ _meta: { note: 'countyFIPS -> name/state. Join facility county NAME via (stateAbbr, normalized name).', source: SRC, count: Object.keys(counties).length }, counties }, null, 2) + '\n'
  );

  console.log('Wrote geo.json:', Object.keys(states).length, 'states');
  console.log('Wrote counties.json:', Object.keys(counties).length, 'counties (skipped', skipped, 'non-state geoms)');
})().catch((e) => { console.error(e); process.exit(1); });
