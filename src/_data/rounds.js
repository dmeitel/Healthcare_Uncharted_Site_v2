module.exports = {

  // ── ROUNDS ──────────────────────────────────────────────────────────────────
  // Short structured commentaries on healthcare news.
  // Each entry maps to a standalone page under /rounds/<slug>/
  //
  // Schema:
  //   slug            - URL slug for /rounds/<slug>/
  //   title           - Display title
  //   posted          - ISO 8601 date (YYYY-MM-DD)
  //   summary         - TL;DR thesis sentence shown on index card
  //   tags            - Array of topic slugs
  //   fourPs          - Array: patient | provider-p2a | provider-p2b | payer | policy
  //   readMinutes     - Estimated read time in minutes
  //   featured        - boolean, show on homepage
  //   status          - 'published' | 'draft'
  //   map_node        - Future system map integration
  //   map_connections - Future system map connections

  entries: [

    {
      slug:            'steward-postmortem',
      title:           'Post-Mortem: Steward Health Care',
      posted:          '2026-05-06',
      summary:         'A review of what led to the May 2024 Chapter 11 filing, what the data shows since, and why the same structures are still operating across healthcare today.',
      tags:            ['hospital-finance', 'private-equity', 'patient-safety', 'regulatory-oversight'],
      fourPs:          ['provider-p2b', 'patient', 'policy'],
      readMinutes:     9,
      featured:        true,
      status:          'published',
      map_node:        'rounds-steward-postmortem',
      map_connections: ['provider-p2b', 'payer-incentives', 'policy-state-oversight']
    }

  ]

};
