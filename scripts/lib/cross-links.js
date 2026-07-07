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

  // ── First batch of hex -> metric bindings (test run, 2026-06-25) ──────────
  // Each hex is linked to the metric(s) that literally measure it, so the Atlas
  // HUD "Live data" section surfaces a live national value. QA: remove/retune any
  // that don't fit the framework. measured-by = concept is quantified by metric.

  // Provider — workforce & facilities
  { from: 'concept:physicians', rel: 'measured-by', to: 'metric:clinical:0' },   // PCPs per 100k
  { from: 'concept:physicians', rel: 'measured-by', to: 'metric:clinical:1' },   // specialists per 100k
  { from: 'concept:nursing',    rel: 'measured-by', to: 'metric:clinical:7' },   // RNs per 100k
  { from: 'concept:nursing',    rel: 'measured-by', to: 'metric:clinical:2' },   // NPs per 100k
  { from: 'concept:acute',      rel: 'measured-by', to: 'metric:operations:1' }, // hospital count
  { from: 'concept:acute',      rel: 'measured-by', to: 'metric:operations:0' }, // beds per 1k
  { from: 'concept:ed',         rel: 'measured-by', to: 'metric:operations:4' }, // median ED wait

  // Patient — coverage, access, chronic
  { from: 'concept:insurance',    rel: 'measured-by', to: 'metric:payer:0' },    // uninsured rate
  { from: 'concept:insurance',    rel: 'measured-by', to: 'metric:payer:4' },    // employer coverage
  { from: 'concept:telehealth',   rel: 'measured-by', to: 'metric:clinical:5' }, // telehealth adoption
  { from: 'concept:telehealth',   rel: 'measured-by', to: 'metric:policy:4' },   // telehealth parity laws
  { from: 'concept:chronic',      rel: 'measured-by', to: 'metric:patient:1' },  // diabetes
  { from: 'concept:chronic',      rel: 'measured-by', to: 'metric:patient:2' },  // coronary heart disease
  { from: 'concept:chronic',      rel: 'measured-by', to: 'metric:patient:3' },  // obesity
  { from: 'concept:primary-care', rel: 'measured-by', to: 'metric:clinical:0' }, // PCPs per 100k
  { from: 'concept:primary-care', rel: 'measured-by', to: 'metric:patient:7' },  // routine checkup
  { from: 'concept:access',       rel: 'measured-by', to: 'metric:clinical:3' }, // HPSAs
  { from: 'concept:access',       rel: 'measured-by', to: 'metric:clinical:4' }, // population in HPSAs

  // Public health
  { from: 'concept:pop-health',  rel: 'measured-by', to: 'metric:patient:0' },   // fair/poor health
  { from: 'concept:pop-health',  rel: 'measured-by', to: 'metric:patient:6' },   // life expectancy
  { from: 'concept:rural',       rel: 'measured-by', to: 'metric:operations:2' },// critical access hospitals
  { from: 'concept:rural',       rel: 'measured-by', to: 'metric:policy:5' },    // rural health initiatives
  { from: 'concept:food',        rel: 'measured-by', to: 'metric:baseline:3' },  // food insecurity
  { from: 'concept:housing',     rel: 'measured-by', to: 'metric:baseline:2' },  // housing cost burden
  { from: 'concept:sdoh',        rel: 'measured-by', to: 'metric:baseline:0' },  // median household income
  { from: 'concept:sdoh',        rel: 'measured-by', to: 'metric:baseline:3' },  // food insecurity
  { from: 'concept:prevention',  rel: 'measured-by', to: 'metric:patient:7' },   // routine checkup

  // Payer
  { from: 'concept:medicare',   rel: 'measured-by', to: 'metric:payer:2' },      // Medicare enrollment
  { from: 'concept:medicaid',   rel: 'measured-by', to: 'metric:payer:1' },      // Medicaid enrollment
  { from: 'concept:medicaid',   rel: 'measured-by', to: 'metric:policy:0' },     // Medicaid expansion
  { from: 'concept:commercial', rel: 'measured-by', to: 'metric:payer:4' },      // employer coverage
  { from: 'concept:selfpay',    rel: 'measured-by', to: 'metric:payer:0' },      // uninsured rate

  // Policy
  { from: 'concept:con',   rel: 'measured-by', to: 'metric:policy:1' },          // Certificate of Need scope
  { from: 'concept:aca',   rel: 'measured-by', to: 'metric:policy:0' },          // Medicaid expansion
  { from: 'concept:aca',   rel: 'measured-by', to: 'metric:payer:3' },           // marketplace enrollment
  { from: 'concept:scope', rel: 'measured-by', to: 'metric:policy:2' },          // NP scope of practice

  // Health Tech
  { from: 'concept:telehealth-plat', rel: 'measured-by', to: 'metric:clinical:5' }, // telehealth adoption
];
