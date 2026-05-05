module.exports = {

  // ── ROUNDS ──────────────────────────────────────────────────────────────────
  // Current events, takes, and guest commentary.
  // Each entry is a standalone page under /rounds/<id>/
  //
  // Schema:
  //   id            – URL slug (used for permalink /rounds/<id>/)
  //   title         – Display title
  //   author        – Author name
  //   author_bio    – One-line bio shown on card and post
  //   date          – ISO 8601 (YYYY-MM-DD)
  //   read_time     – e.g. "5 min read"
  //   summary       – One-paragraph card description
  //   tags          – Array of strings
  //   featured      – boolean, show on homepage
  //   status        – 'published' | 'draft'
  //   responding_to – { title, url, source } — optional source being responded to

  entries: []

};
