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
      slug:            'wound-and-workload',
      title:           'The Wound and the Workload',
      posted:          '2026-06-18',
      summary:         'We called it burnout and told people to be more resilient. The data says it was the workplace all along.',
      tags:            ['clinician-burnout', 'workforce', 'mental-health', 'nurse-staffing'],
      fourPs:          ['provider-p2a', 'patient', 'policy'],
      readMinutes:     11,
      featured:        true,
      status:          'published',
      map_node:        'rounds-wound-and-workload',
      map_connections: ['provider-p2a', 'provider-p2b', 'policy-state-oversight'],
      atlasLinks: [
        { label: 'Physician Workforce', zone: 'provider',  to: 'provider/physicians' },
        { label: 'Nursing Workforce',   zone: 'provider',  to: 'provider/nursing' },
        { label: 'Behavioral Health',   zone: 'pubhealth', to: 'pubhealth/behavioral' }
      ]
    },

    {
      slug:            'ai-promise-vs-bill',
      title:           'The Promise and the Bill',
      posted:          '2026-06-03',
      summary:         'AI was sold as the cure for health care’s cost problem. Medicare’s own billing data tells a different story.',
      tags:            ['health-ai', 'health-costs', 'medicare', 'reimbursement'],
      fourPs:          ['payer', 'provider-p2a', 'policy'],
      readMinutes:     8,
      featured:        true,
      status:          'published',
      map_node:        'rounds-ai-promise-vs-bill',
      map_connections: ['payer-incentives', 'provider-p2a', 'policy-ai-oversight'],
      atlasLinks: [
        { label: 'CDSS & AI Tools',    zone: 'provider', to: 'provider/cdss' },
        { label: 'Coding & CDI',       zone: 'payer',    to: 'payer/coding' },
        { label: 'CMS & Fed Agencies', zone: 'policy',   to: 'policy/cms' }
      ]
    },

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
      map_connections: ['provider-p2b', 'payer-incentives', 'policy-state-oversight'],
      atlasLinks: [
        { label: 'Acute Care Hospital', zone: 'provider', to: 'provider/acute' },
        { label: 'Patient Safety',      zone: 'patient',  to: 'patient/pt-safety' },
        { label: 'State Regulations',   zone: 'policy',   to: 'policy/state-law' }
      ]
    }

  ]

};
