'use strict';
/**
 * career-tree adapter — src/assets/data/career-tree.json -> canonical nodes.
 *
 * Emits three node types, all from one file:
 *   role          (classes.roles.nodes)    layer: workforce
 *   patient-state (classes.patients.nodes)  layer: patient-journey
 *   expertise     (growth.nodes)            layer: expertise
 *
 * Edges:
 *   role leadsTo[]     -> 'leads-to'  (within the roles id-space)
 *   patient leadsTo[]  -> 'leads-to'  (within the patients id-space)
 *   expertise pairs[]  -> 'pairs-with'
 *
 * Namespacing by type keeps the two leadsTo id-spaces from colliding:
 * role:icu-rn vs patient:critical never clash.
 */
const { makeNode, edge, uid } = require('../entity');

const metaValues = (n) => (n.meta || []).map((x) => x.v);

function roleNodes(raw) {
  const cls = raw.classes && raw.classes.roles;
  if (!cls || !cls.nodes) return [];
  const tierLabels = (raw.meta && raw.meta.tierLabelsRoles) || [];
  return cls.nodes.map((n) => makeNode({
    uid: uid('role', n.id),
    type: 'role',
    label: n.label,
    facets: {
      layer: 'workforce',
      domain: n.domain || null,
      family: n.family || null,
      roleType: n.type || null,
      tier: n.tier,
      tierLabel: tierLabels[n.tier] || null,
      pathway: n.pathway || null,
      degree: n.degree || null,   // forward hook into the future education layer
    },
    searchParts: [n.label, n.abbr, n.domain, n.family, n.pathway, n.summary, metaValues(n)],
    rels: (n.leadsTo || []).map((t) => edge('leads-to', uid('role', t))),
    source: { dataset: 'career-tree.json', class: 'roles', sourceId: n.id },
    href: '/tools/healthcare-career-tree/?class=roles&node=' + encodeURIComponent(n.id),
  }));
}

function patientNodes(raw) {
  const cls = raw.classes && raw.classes.patients;
  if (!cls || !cls.nodes) return [];
  const tierLabels = (raw.meta && raw.meta.tierLabelsPatients) || [];
  return cls.nodes.map((n) => makeNode({
    uid: uid('patient', n.id),
    type: 'patient-state',
    label: n.label,
    facets: {
      layer: 'patient-journey',
      domain: n.domain || null,
      family: n.family || null,
      stateType: n.type || null,
      tier: n.tier,
      tierLabel: tierLabels[n.tier] || null,
      pathway: n.pathway || null,
    },
    searchParts: [n.label, n.abbr, n.family, n.summary, metaValues(n)],
    rels: (n.leadsTo || []).map((t) => edge('leads-to', uid('patient', t))),
    source: { dataset: 'career-tree.json', class: 'patients', sourceId: n.id },
    href: '/tools/healthcare-career-tree/?class=patients&node=' + encodeURIComponent(n.id),
  }));
}

function expertiseNodes(raw) {
  const g = raw.growth;
  if (!g || !g.nodes) return [];
  return g.nodes.map((n) => {
    const z = (g.zones && g.zones[n.zone]) || {};
    return makeNode({
      uid: uid('expertise', n.id),
      type: 'expertise',
      label: n.label,
      facets: {
        layer: 'expertise',
        zone: n.zone || null,
        zoneLabel: z.label || null,
        group: n.group || null,
      },
      searchParts: [n.label, n.abbr, n.group, z.label, n.summary, n.seen],
      rels: (n.pairs || []).map((p) => edge('pairs-with', uid('expertise', p))),
      source: { dataset: 'career-tree.json', class: 'growth', sourceId: n.id },
      href: '/tools/healthcare-career-tree/?tab=atlas&expertise=' + encodeURIComponent(n.id),
    });
  });
}

module.exports = {
  name: 'career-tree',
  run(read) {
    const raw = read('src/assets/data/career-tree.json');
    return [...roleNodes(raw), ...patientNodes(raw), ...expertiseNodes(raw)];
  },
};
