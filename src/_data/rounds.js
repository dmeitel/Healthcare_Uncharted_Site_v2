const rounds = {

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
      slug:            'problem-and-product',
      title:           'How Healthcare Gets Sold Its Problems',
      posted:          '2026-08-10',
      summary:         'Before healthcare buys a cure, somebody sells it the disease. The AI era runs the same trick one step downstream.',
      tags:            ['problem-framing', 'disease-mongering', 'health-ai', 'pharma-marketing'],
      fourPs:          ['provider-p2a', 'payer', 'policy'],
      readMinutes:     10,
      featured:        true,
      status:          'published',
      map_node:        'rounds-problem-and-product',
      map_connections: ['provider-p2a', 'payer-incentives', 'policy-ai-oversight'],
      atlasLinks: [
        { label: 'CDSS & AI Tools',    zone: 'provider', to: 'provider/cdss' },
        { label: 'CMS & Fed Agencies', zone: 'policy',   to: 'policy/cms' },
        { label: 'Patient Safety',     zone: 'patient',  to: 'patient/pt-safety' }
      ]
    },

    {
      slug:            'wound-and-workload',
      title:           'Clinician Burnout Is a Workplace Problem',
      posted:          '2026-06-18',
      summary:         'We called it burnout and aimed the fix at the worker. Five years of data point at the workplace.',
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
      title:           'What Medicare Is Actually Paying for AI',
      posted:          '2026-06-03',
      summary:         'AI was sold as the cure for health care’s cost problem. Medicare’s own billing data shows it arriving as a new line item.',
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

// ── NEXT ROUND ────────────────────────────────────────────────────────────────
// Drives the KEEP READING handoff (read-next.njk): published rounds walk in
// posted order, oldest first, so a reader who starts at the beginning reads
// the series the way it was written. The newest round hands off to /rounds/.
{
  const published = rounds.entries
    .filter(e => e.status === 'published')
    .slice()
    .sort((a, b) => (a.posted < b.posted ? -1 : 1));
  rounds.nextByUrl = {};
  published.forEach((e, i) => {
    const n = published[i + 1]; if (!n) return;
    rounds.nextByUrl['/rounds/' + e.slug + '/'] =
      { url: '/rounds/' + n.slug + '/', kick: 'Next round', title: n.title, desc: n.summary };
  });
}

module.exports = rounds;
