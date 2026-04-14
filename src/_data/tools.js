module.exports = [

  // ── LIVE TOOLS ──────────────────────────────────────────────────────────────

  {
    id:          'vendor-directory',
    status:      'live',
    featured:    true,
    title:       'Healthcare Vendor Directory',
    desc:        'A searchable, filterable directory of major healthcare technology vendors — what sector they operate in, which layers of the system they touch, and whether their technology is proven, emerging, or cautionary.',
    url:         '/tools/healthcare-vendor-directory/',
    badge:       'Interactive',
    badgeClass:  'badge-interactive',
    mark:        'VD',
    markClass:   'mark-teal',
    tags:        ['Vendors', 'AI', 'Healthcare Tech'],
    ps:          ['p2a', 'p2b', 'p3'],
    labNode:     'vendor-directory'
  },

  {
    id:          'sql-mystery',
    status:      'live',
    featured:    true,
    title:       'Clinical SQL Mystery',
    desc:        'Learn the Patient \u2192 Encounter \u2192 Clinical Event data model by solving a real clinical mystery using SQL queries against an Epic-style database. Four cases, escalating difficulty. No experience needed.',
    url:         '/tools/clinical-sql-mystery/',
    badge:       'Game',
    badgeClass:  'badge-interactive',
    mark:        'SQL',
    markClass:   'mark-teal',
    tags:        ['SQL', 'EHR', 'Beginner-friendly'],
    ps:          ['p2a', 'p2b'],
    labNode:     'sql-mystery'
  },

  {
    id:          'event-vs-request',
    status:      'live',
    featured:    true,
    title:       'Event vs. Request vs. Observation',
    desc:        'The three fundamental building blocks of clinical data in FHIR and every modern EHR \u2014 and why confusing them causes real problems in reporting, billing, and AI model training.',
    url:         '/tools/event-vs-request-vs-observation/',
    badge:       'Explainer',
    badgeClass:  'badge-learn',
    mark:        'Ev',
    markClass:   'mark-blue',
    tags:        ['FHIR', 'Data Model', 'Clinical'],
    ps:          ['p2a'],
    labNode:     'fhir-concepts'
  },

  // ── LAB / IN DEVELOPMENT ────────────────────────────────────────────────────

  {
    id:          'gap-map',
    status:      'lab',
    featured:    false,
    title:       'U.S. Healthcare Gap Map',
    desc:        'An interactive D3.js choropleth map of U.S. healthcare resource inequality \u2014 workforce shortages, rural-urban divides, ESRD prevalence, and state-level disparity data.',
    url:         '/lab/#disparity-map',
    badge:       'Lab Preview',
    badgeClass:  'badge-lab',
    mark:        'Gap',
    markClass:   'mark-amber',
    tags:        ['D3.js', 'Disparities', 'State Data'],
    ps:          ['p1', 'p4'],
    labNode:     'healthcare-gaps'
  },

  {
    id:          '4ps-map',
    status:      'lab',
    featured:    false,
    title:       '4Ps System Map',
    desc:        'The full layered diagram of the healthcare system \u2014 Patient, Provider, Payer, and Policy Maker lanes with clickable nodes linking to tools and articles. The navigational spine of this site.',
    url:         '/lab/#4ps-map',
    badge:       'Lab Preview',
    badgeClass:  'badge-lab',
    mark:        '4P',
    markClass:   'mark-purple',
    tags:        ['D3.js', '4Ps', 'Navigation'],
    ps:          ['p1', 'p2a', 'p2b', 'p3', 'p4'],
    labNode:     '4ps-system'
  },

  {
    id:          'hit-reference',
    status:      'lab',
    featured:    false,
    title:       'HIT Terminology Reference',
    desc:        'Patient IDs, encounter identifiers, clinical events, and how they connect across Epic, Cerner, and FHIR. A plain-English glossary sourced from public documentation.',
    url:         '/learn/#reference',
    badge:       'Reference',
    badgeClass:  'badge-reference',
    mark:        'Ref',
    markClass:   'mark-purple',
    tags:        ['HL7', 'FHIR', 'Glossary'],
    ps:          ['p2a', 'p2b'],
    labNode:     'hit-terminology'
  }

];
