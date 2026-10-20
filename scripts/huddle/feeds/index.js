'use strict';
/**
 * scripts/huddle/feeds/index.js · the list of feeds, in the order their questions join the bank (2026-10-18).
 *
 * A feed is a module that exports { name, prefix, reads, build(ctx) }: `reads` names the site data files it asks about,
 * every id it makes starts with its `prefix` (so the report can count a feed from the bank alone), and build returns
 * question objects in the bank's shape (see scripts/build-huddle.js). The order here is the order in the
 * bank file, and a feed's own order is fixed by the data and its seed, so the same files always write the same bank.
 * Put a new feed at the END, so the questions already dealt keep their places.
 *
 * runFeeds checks every question against the bank's rules (lib.js, check), drops one whose words the bank already asks
 * (an older question, or the same question and options twice), and keeps a count per feed for npm run huddle:report.
 */
const { check } = require('../lib');

const FEEDS = [
  require('./state-metrics'),
  require('./licensure'),
  require('./compass'),
  require('./vendors'),
  require('./credentials'),
  require('./cost-reports'),
  require('./schools'),
  require('./state-pay'),
  require('./bedside-math'),
  require('./counties')
];

/**
 * @param {{TEMPLATES:object, vs:any[], old:any[]}} ctx the builder's state templates, Vital Stats' bank and the
 *   questions already in the bank (version 1)
 */
function runFeeds(ctx) {
  const oldText = new Set(ctx.old.map((q) => q.q));
  const ids = new Set(ctx.old.map((q) => q.id));
  const seenForm = new Set();
  const questions = [];
  const report = [];
  for (const F of FEEDS) {
    const made = F.build(ctx);
    const kept = [];
    const dropped = [];
    for (const raw of made) {
      const q = check(raw, F.name);
      if (!q.id.startsWith(F.prefix)) throw new Error(`[huddle:${F.name}] ${q.id} does not start with the feed's prefix ${F.prefix}`);
      if (oldText.has(q.q)) { dropped.push(q.id + ': the bank already asks this'); continue; }
      const form = q.q + '|' + (q.o ? q.o.slice().sort().join('|') : String(q.a));
      if (seenForm.has(form)) { dropped.push(q.id + ': the same question and options twice'); continue; }
      if (ids.has(q.id)) throw new Error(`[huddle:${F.name}] two questions share the id ${q.id}`);
      ids.add(q.id);
      seenForm.add(form);
      kept.push(q);
    }
    questions.push(...kept);
    report.push({ name: F.name, prefix: F.prefix, reads: F.reads, n: kept.length, templates: new Set(kept.map((q) => q.k)).size,
      dropped, notes: (F.notes && F.notes()) || [] });
  }
  return { questions, report };
}

module.exports = { FEEDS, runFeeds };
