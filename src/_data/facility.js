/**
 * facility.js — exposes facility rollups to all Eleventy templates at build time
 * (no HTTP needed). Uses the same aggregate() engine as scripts/build-data.js, so
 * the macro numbers shown on pages always match the derived JSON the tools fetch.
 *
 * Access in templates as e.g. {{ facility.national.byType.cah }}.
 */
const fs = require('fs');
const path = require('path');
const { aggregate } = require('../../scripts/lib/aggregate');

const read = (rel) => JSON.parse(fs.readFileSync(path.join(__dirname, rel), 'utf8'));

module.exports = function () {
  let facilities, counties, geo, countyPop;
  try {
    facilities = read('../assets/data/us-hospitals.json').hospitals;
    counties = read('./registries/counties.json').counties;
    geo = read('./registries/geo.json');
    countyPop = read('../assets/data/us-counties.json');
  } catch (e) {
    // If raw data is missing, fail soft so the rest of the site still builds.
    return { available: false, error: String(e.message || e) };
  }

  const r = aggregate({ facilities, counties, geo, countyPop });
  return {
    available: true,
    national: r.national,
    byState: r.byState,
    bySystemTop: r.bySystem.slice(0, 25),
    join: r.join,
  };
};
