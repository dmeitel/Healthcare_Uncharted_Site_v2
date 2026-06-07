'use strict';
/**
 * backbone adapter — the shared spine, minted ONCE from the registries.
 *
 *   place:state:<abbr>    from registries/geo.json
 *   place:county:<fips>   from registries/counties.json   (in-state -> its state)
 *   system:<systemId>     from registries/systems.json
 *
 * Every other adapter (facilities, metrics, policy, ...) only REFERENCES these
 * uids via edges. It never mints its own. That is the rule that keeps the
 * datasets joinable: one canonical place:state:ut that everything points at.
 */
const { makeNode, edge, uid } = require('../entity');

function stateNodes(geo) {
  return Object.values(geo.states || {}).map((s) => makeNode({
    uid: uid('place', 'state', s.abbr),
    type: 'place',
    label: s.name,
    facets: { layer: 'geography', kind: 'state', fips: s.fips, abbr: s.abbr },
    searchParts: [s.name, s.abbr],
    source: { dataset: 'registries/geo.json', sourceId: s.abbr },
    href: '/tools/healthcare-operators-map/?state=' + encodeURIComponent(s.abbr),
  }));
}

function countyNodes(counties) {
  return Object.entries(counties).map(([fips, c]) => makeNode({
    uid: uid('place', 'county', fips),
    type: 'place',
    label: c.name,
    facets: { layer: 'geography', kind: 'county', fips, stateAbbr: c.stateAbbr || null },
    searchParts: [c.name, c.stateAbbr, 'county'],
    rels: c.stateAbbr ? [edge('in-state', uid('place', 'state', c.stateAbbr))] : [],
    source: { dataset: 'registries/counties.json', sourceId: fips },
    href: '/tools/healthcare-operators-map/?county=' + encodeURIComponent(fips),
  }));
}

function systemNodes(systems) {
  return Object.values(systems || {}).map((s) => makeNode({
    uid: uid('system', s.systemId),
    type: 'system',
    label: s.name,
    facets: { layer: 'facilities', kind: 'system', facilityCount: s.facilityCount || null, stateCount: s.stateCount || null },
    searchParts: [s.name],
    source: { dataset: 'registries/systems.json', sourceId: s.systemId },
    href: '/tools/healthcare-operators-map/?system=' + encodeURIComponent(s.systemId),
  }));
}

module.exports = {
  name: 'backbone',
  run(read) {
    const geo = read('src/_data/registries/geo.json');
    const counties = read('src/_data/registries/counties.json').counties;
    const systems = read('src/_data/registries/systems.json').systems;
    return [...stateNodes(geo), ...countyNodes(counties), ...systemNodes(systems)];
  },
};
