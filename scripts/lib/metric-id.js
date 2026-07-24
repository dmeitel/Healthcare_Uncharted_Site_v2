'use strict';
/**
 * metric-id.js — the stable-identity layer over metricsConfig.
 *
 * Metric identity is the item's `id` ("lens/slug", the format DATA.md
 * reserves). Array position is DERIVED at run time by these helpers, never
 * hardcoded. Pull scripts and adapters address metrics by id, so inserting
 * or reordering items can no longer silently repoint a write — an id that
 * fails to resolve stops the run instead.
 *
 * Rules (same contract as every other code on the site): never reuse an id
 * for a new meaning, never rename in place. Labels change freely; ids don't.
 */

// "lens/slug" -> { lens, index } (index as the string the data files key on).
// Throws on unknown id: config and caller disagree, and that must stop the run.
function metricIndexById(cfg, id) {
  const lens = String(id).split('/')[0];
  const items = (cfg[lens] || {}).items || [];
  const i = items.findIndex((it) => it.id === id);
  if (i === -1) throw new Error(`[metric-id] "${id}" not found in metricsConfig — check the id or the config`);
  return { lens, index: String(i) };
}

// Build-time gate: every item has an id, ids are globally unique, and each
// id's lens prefix matches the lens it lives under.
function validateMetricIds(cfg) {
  const seen = new Map();
  const bad = [];
  for (const lens of Object.keys(cfg)) {
    if (lens.startsWith('_')) continue;
    const items = (cfg[lens] || {}).items;
    if (!Array.isArray(items)) continue;
    items.forEach((it, i) => {
      if (!it.id) { bad.push(`${lens}[${i}] "${it.name}" has no id`); return; }
      if (!it.id.startsWith(lens + '/')) bad.push(`${lens}[${i}] id "${it.id}" does not start with "${lens}/"`);
      if (seen.has(it.id)) bad.push(`duplicate id "${it.id}" (${seen.get(it.id)} and ${lens}[${i}])`);
      seen.set(it.id, `${lens}[${i}]`);
    });
  }
  if (bad.length) throw new Error('[metric-id] metricsConfig id problems:\n  ' + bad.join('\n  '));
}

module.exports = { metricIndexById, validateMetricIds };
