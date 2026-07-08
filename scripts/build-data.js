#!/usr/bin/env node
/**
 * build-data.js — derive the macro rollups from the granular facility roster
 * and write them to data-build/ (build intermediates, NOT deployed), plus a
 * systems seed registry. Run before the Eleventy build. Templates get the
 * same rollups via src/_data/facility.js, which recomputes with aggregate().
 *
 *   node scripts/build-data.js
 */
const fs = require('fs');
const path = require('path');
const { aggregate } = require('./lib/aggregate');

const ROOT = path.join(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);
const read = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));

const facilities = read('src/assets/data/us-hospitals.json').hospitals;
const counties = read('src/_data/registries/counties.json').counties;
const geo = read('src/_data/registries/geo.json');
const countyPop = read('src/assets/data/us-counties.json');

const result = aggregate({ facilities, counties, geo, countyPop });

const OUT = P('data-build');   // build intermediates — NOT deployed (src/assets is passthrough-copied)
fs.mkdirSync(OUT, { recursive: true });

const stamp = { generated_by: 'scripts/build-data.js', source: 'us-hospitals.json', facilityCount: facilities.length };

const write = (name, obj) => {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj) + '\n');
  console.log('  wrote data-build/' + name);
};

write('national-summary.json', { _meta: stamp, ...result.national, join: result.join });
write('facilities-by-state.json', { _meta: stamp, states: result.byState });
write('facilities-by-county.json', { _meta: stamp, counties: result.byCounty });
write('facilities-by-system.json', { _meta: stamp, systems: result.bySystem });

// Seed the system registry only if it does not exist yet (don't clobber hand edits).
const sysPath = P('src/_data/registries/systems.json');
if (!fs.existsSync(sysPath)) {
  fs.writeFileSync(sysPath, JSON.stringify({
    _meta: { note: 'Seeded from facility data by scripts/build-data.js. Safe to hand-enrich (ownershipClass, peOwned, faithBased, etc.) — re-running build-data will not overwrite this file once it exists.', source: 'us-hospitals.json sys field' },
    systems: result.systemsSeed,
  }, null, 2) + '\n');
  console.log('  seeded registries/systems.json (' + Object.keys(result.systemsSeed).length + ' systems)');
} else {
  console.log('  registries/systems.json exists — left untouched');
}

console.log('\nbuild-data: county join ' + result.join.countyMatchRate + '% (' +
  result.join.countyUnmatched + ' unmatched of ' + facilities.length + ')');
if (result.join.countyUnmatched > 0) {
  console.log('  unmatched sample:', result.join.unmatchedSample.map((u) => u.state + ':' + u.name).join(', '));
}
