'use strict';
/**
 * cross-links.js — curated cross-layer edges. The editorial connective tissue
 * that joins the dataset islands (career tree, atlas concepts, patient journey)
 * to the rest of the graph. Hand-authored, grown bottom-up from real examples.
 *
 * Each entry is { from, rel, to } where from/to are entity uids. build-entities
 * applies these after assembly and skips any whose endpoints don't exist (so a
 * typo is caught, not silently dangling). Add rels to entity.js RELS.
 *
 * Pattern to follow when extending: anchor on a role, then reach outward to the
 * skills it uses, the metric that measures it, the patients it cares for, and
 * its home zone on the atlas. The metric link is the important one — metrics
 * already describe every state, so linking a role to its metric drops the whole
 * career tree onto the geographic spine.
 */
module.exports = [
  // ── Respiratory therapy (RRT/CRT) — the first worked example ──────────────
  { from: 'role:rrt', rel: 'uses', to: 'expertise:airway' },
  { from: 'role:rrt', rel: 'uses', to: 'expertise:vent' },
  { from: 'role:rrt', rel: 'uses', to: 'expertise:vitals' },
  { from: 'role:crt', rel: 'uses', to: 'expertise:airway' },
  { from: 'role:crt', rel: 'uses', to: 'expertise:vent' },

  // role -> workforce metric (RTs per 100k) -> which already describes states.
  // This is the bridge from the career tree into the place-cluster.
  { from: 'role:rrt', rel: 'measured-by', to: 'metric:clinical:8' },
  { from: 'role:crt', rel: 'measured-by', to: 'metric:clinical:8' },

  // neonatal RT <-> the patient state it covers (workforce <-> patient journey)
  { from: 'role:rrt-nps', rel: 'cares-for', to: 'patient:nicu' },

  // place these roles on the atlas
  { from: 'role:rrt', rel: 'in-zone', to: 'concept:zone:provider' },
  { from: 'role:crt', rel: 'in-zone', to: 'concept:zone:provider' },

  // atlas concepts -> the entities they stand for (concept island -> career tree)
  { from: 'concept:resp-therapy', rel: 'represents', to: 'role:rrt' },
  { from: 'concept:resp-therapy', rel: 'represents', to: 'role:crt' },
  { from: 'concept:resp-therapy', rel: 'measured-by', to: 'metric:clinical:8' },
  { from: 'concept:rcic', rel: 'represents', to: 'role:rrt' },   // RCIC / RRT licensure advocacy
];
