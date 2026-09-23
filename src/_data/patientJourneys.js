/**
 * patientJourneys.js — the twenty patient-state nodes, read from the career tree's own data.
 *
 * These were built for the career tree's Populations class, which sits behind a toggle
 * (`#hct-class`) that is display:none at every width. So the nodes have shipped on every page
 * load since they were written and no visitor has ever been able to reach one. DECISIONS
 * question 4 asked whether to delete them; David's answer on 2026-09-21 was to wire them to
 * something instead: "maybe convert it to a learn article and link it to the atlas. I feel like
 * there could be an good educational starting point for some people."
 *
 * This file is deliberately a READER, not a copy. src/assets/data/career-tree.json stays the one
 * source of truth for the node text, so the article and the tool can never quietly disagree. If
 * the nodes are ever removed from the career tree, the build fails here instead of silently
 * serving an article about data that no longer exists.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'assets', 'data', 'career-tree.json');

/** Walk the nested career-tree structure and collect every node in the population zone. */
function collect(node, out) {
  if (Array.isArray(node)) {
    node.forEach((n) => collect(n, out));
  } else if (node && typeof node === 'object') {
    if (node.zone === 'population' && typeof node.id === 'string') out.push(node);
    Object.values(node).forEach((v) => collect(v, out));
  }
  return out;
}

/* The order the journeys read in: well to critical, then the two that run alongside it. */
const GROUP_ORDER = ['Acuity & journey', 'Maternal journey', 'Newborn journey'];

/* What each tier means. The career tree uses tier for board placement; here it is the only
   ordering signal the nodes carry, and it happens to run in the direction acuity runs. */
const TIER_LABEL = {
  0: 'Before the system is really involved',
  1: 'The system is involved',
  2: 'The system is holding on',
};

module.exports = function () {
  const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const all = collect(raw, []);
  const journey = all.filter((n) => n.id.startsWith('pj-'));

  if (journey.length !== 20) {
    throw new Error(
      'patientJourneys.js expected 20 pj- nodes in career-tree.json and found ' + journey.length +
      '. The article at /secret-menu/patient-journeys/ renders from them, so it cannot be built ' +
      'from a set that has changed shape. Update this file deliberately, do not loosen the check.'
    );
  }

  /* Tiers are nested HERE rather than tracked in the template. Nunjucks `set` inside a
     for-loop writes to that iteration's frame, so a running "last tier seen" variable silently
     resets every pass and the headings come out wrong. Shape the data, keep the loop dumb. */
  const groups = GROUP_ORDER.map((name) => {
    const nodes = journey
      .filter((n) => n.group === name)
      .sort((a, b) => (a.tier || 0) - (b.tier || 0) || a.label.localeCompare(b.label));
    const tiers = [...new Set(nodes.map((n) => n.tier || 0))]
      .sort((a, b) => a - b)
      .map((tier) => ({
        tier,
        label: TIER_LABEL[tier] || '',
        nodes: nodes.filter((n) => (n.tier || 0) === tier),
      }));
    return { name, nodes, tiers, count: nodes.length };
  }).filter((g) => g.count > 0);

  const placed = groups.reduce((s, g) => s + g.count, 0);
  if (placed !== journey.length) {
    throw new Error(
      'patientJourneys.js placed ' + placed + ' of ' + journey.length + ' nodes into groups. ' +
      'A node carries a `group` this file does not list: ' +
      [...new Set(journey.map((n) => n.group))].filter((g) => !GROUP_ORDER.includes(g)).join(', ')
    );
  }

  return { groups, total: journey.length, tierLabel: TIER_LABEL };
};
