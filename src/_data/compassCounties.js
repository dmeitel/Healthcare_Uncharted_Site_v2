/* Per-state county name lists for the Assignment Compass pickers,
   reshaped from the canonical county registry (DATA.md: one county
   spine, everything joins it). Emitted to
   /assets/data/derived/compass-counties.json by the tool's
   counties-data.njk template; the page fetches it lazily. */
const reg = require('./registries/counties.json');

const byState = {};
for (const fips of Object.keys(reg.counties)) {
  const c = reg.counties[fips];
  if (!byState[c.stateAbbr]) byState[c.stateAbbr] = [];
  byState[c.stateAbbr].push([fips, c.name]);
}
for (const abbr of Object.keys(byState)) {
  byState[abbr].sort((a, b) => a[1].localeCompare(b[1]));
}

module.exports = byState;
