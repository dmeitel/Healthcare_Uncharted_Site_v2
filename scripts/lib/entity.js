'use strict';
/**
 * entity.js — the canonical node contract for the unified data layer.
 *
 * Every dataset adapter emits an array of these nodes. The core of this layer
 * (this file, the assembler, the search index) is DOMAIN-BLIND on purpose: it
 * never branches on a specific type. All domain knowledge lives in the
 * adapters. Hold that boundary and adding pop-health, education, policy, etc.
 * is always just "write one more adapter" — the contract never moves.
 *
 * Node shape:
 *   {
 *     uid:    'role:rn',                 // namespaced, globally unique
 *     type:   'role',                    // controlled vocab (TYPES), extensible
 *     label:  'Registered Nurse',        // human label, newlines flattened
 *     facets: { layer:'workforce', tier:2, ... },   // structured + filterable
 *     search: 'registered nurse rn ...', // precomputed, lowercased
 *     rels:   [ { rel:'leads-to', to:'role:bsn' } ],
 *     source: { dataset:'career-tree.json', sourceId:'rn' },
 *     href:   '/tools/healthcare-career-tree/?node=rn'
 *   }
 *
 * Two decisions are baked in here because they are the only parts that hurt to
 * retrofit:
 *   1. Shared dimensions (place, system, credential, condition, payer) get a
 *      namespaced uid that the registries own. Adapters look ids UP via uid();
 *      they never invent their own. A hospital "in Utah", a policy for "UT",
 *      and a metric for "Utah" must all resolve to the same place:state:ut.
 *   2. An edge is an OBJECT, not a bare pair: { rel, to, ...attrs }. Today
 *      attrs is usually empty. Tomorrow an edge carries { weight, dir, source }
 *      so "policy X moved metric Y" is a field add, not a migration.
 */

// Controlled vocab. These are the KNOWN values; unknown ones only warn, so a
// new layer is a one-line push here, not a refactor.
const TYPES = [
  'role',           // a job / career step
  'patient-state',  // a state on the patient journey
  'expertise',      // a skill, specialization, or setting
  'facility',       // a physical site (hospital, ASC, dialysis, ...)
  'system',         // a health system
  'place',          // a geography (state, county) — shared backbone
  'metric',         // a measured value about a place
  'concept',        // an Atlas concept / idea node
  'credential',     // a degree, license, or cert (education layer)
  'policy',         // a law, rule, or bill (policy layer)
];

const RELS = [
  'leads-to',   // career progression (directional: a -> b)
  'pairs-with', // related expertise (symmetric in spirit)
  'in-state',   // thing -> place(state)
  'in-county',  // thing -> place(county)
  'part-of',    // facility -> system, child -> parent
  'describes',  // metric -> place
  'affects',    // policy -> metric/role/... (directional, weightable)
  'trained-by', // role -> credential / program
  'requires',   // role -> credential
];

// Which Atlas layer a node belongs to. Maps onto Atlas zones later; doubles as
// a top-level search facet and the grouping key.
const LAYERS = [
  'workforce',        // roles / careers
  'patient-journey',  // patient states
  'expertise',        // skills, specializations, settings
  'facilities',       // sites & systems
  'geography',        // places
  'metrics',          // measured population / clinical / payer values
  'policy',           // laws & rules
  'education',         // credentials & programs
];

// kebab a value without mangling already-clean ids or numeric codes ('010001').
const slug = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// uid('place','state','UT') -> 'place:state:ut'. The seam every dataset joins on.
const uid = (...parts) => parts.map(slug).join(':');

// flatten label/search whitespace ("Registered\nNurse" -> "Registered Nurse").
const flatten = (s) => String(s).replace(/\s+/g, ' ').trim();

// build a precomputed search string from a list of parts (strings or arrays).
const buildSearch = (parts) =>
  parts.flat(Infinity).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().toLowerCase();

// an edge is an object so it can grow attrs (weight, dir, source) with no migration.
const edge = (rel, to, attrs) => ({ rel, to, ...(attrs || {}) });

function makeNode(spec) {
  if (!spec.uid) throw new Error('node missing uid: ' + JSON.stringify(spec).slice(0, 120));
  if (!spec.type) throw new Error('node missing type: ' + spec.uid);
  if (!spec.label) throw new Error('node missing label: ' + spec.uid);
  const label = flatten(spec.label);
  const search = spec.search != null
    ? String(spec.search).toLowerCase()
    : buildSearch(spec.searchParts || [label]);
  return {
    uid: spec.uid,
    type: spec.type,
    label,
    facets: spec.facets || {},
    search,
    rels: spec.rels || [],
    source: spec.source || {},
    href: spec.href || null,
  };
}

const tally = (nodes, key) => {
  const f = typeof key === 'function' ? key : (n) => n[key];
  const out = {};
  for (const n of nodes) { const k = f(n) == null ? '(none)' : f(n); out[k] = (out[k] || 0) + 1; }
  return out;
};

// Pure validation. The assembler prints this; it is how you SEE the backend
// working before any tool reads it. Dangling = an edge pointing at a uid that
// does not exist, i.e. a link that is not real yet.
function validateNodes(nodes) {
  const errors = [], warnings = [], dangling = [];
  const byUid = new Map();
  for (const n of nodes) {
    if (byUid.has(n.uid)) errors.push('duplicate uid: ' + n.uid);
    else byUid.set(n.uid, n);
    if (!TYPES.includes(n.type)) warnings.push('unknown type "' + n.type + '" on ' + n.uid);
  }
  for (const n of nodes) {
    for (const e of (n.rels || [])) {
      if (!RELS.includes(e.rel)) warnings.push('unknown rel "' + e.rel + '" on ' + n.uid);
      if (!byUid.has(e.to)) dangling.push({ from: n.uid, rel: e.rel, to: e.to });
    }
  }
  return {
    errors, warnings, dangling,
    count: nodes.length,
    byType: tally(nodes, 'type'),
    byLayer: tally(nodes, (n) => n.facets && n.facets.layer),
  };
}

module.exports = { TYPES, RELS, LAYERS, slug, uid, flatten, buildSearch, edge, makeNode, validateNodes };
