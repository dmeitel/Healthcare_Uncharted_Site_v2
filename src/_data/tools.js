module.exports = [

  // ── LIVE TOOLS ──────────────────────────────────────────────────────────────

  {
    id:          'american-4ps-map',
    status:      'live',
    featured:    true,
    title:       'U.S. Healthcare Multi-Lens Map',
    desc:        'U.S. state-level healthcare data across six lenses: patient, clinical, operations, payer, policy, and baseline context. One map, every angle.',
    url:         '/tools/American-4Ps-Map/',
    type:        'interactive',
    badge:       'Interactive',
    badgeClass:  'badge-interactive',
    bandClass:   'tc-band-blue',
    mark:        'MAP',
    markClass:   'mark-blue',
    tags:        ['State Map', '5 Lenses', 'Interactive'],
    motif:       'compass-rose',
    ps:          ['p1', 'p2a', 'p2b', 'p3', 'p4'],
    labNode:     'american-4ps-map'
  },

  {
    id:          'healthcare-iceberg-map',
    status:      'live',
    featured:    true,
    title:       'The Healthcare Iceberg Map',
    desc:        'An interactive map of the full U.S. healthcare system. All 8 layers visible at once, from patient experience to the policy and financial forces underneath.',
    url:         '/lab/',
    type:        'interactive',
    badge:       'Interactive',
    badgeClass:  'badge-interactive',
    bandClass:   'tc-band-teal',
    mark:        'HI',
    markClass:   'mark-teal',
    tags:        ['System Map', '8 Layers', 'Interactive'],
    motif:       'compass-rose',
    ps:          ['p1', 'p2a', 'p2b', 'p3', 'p4'],
    labNode:     'healthcare_iceberg_map'
  },

  {
    id:          'vendor-directory',
    status:      'live',
    featured:    true,
    title:       'Healthcare Vendor Directory',
    desc:        'A searchable, filterable directory of major healthcare technology vendors. What sector they operate in, which layers of the system they touch, and whether their technology is proven, emerging, or cautionary.',
    url:         '/tools/healthcare-vendor-directory/',
    type:        'reference',
    badge:       'Reference',
    badgeClass:  'badge-reference',
    bandClass:   'tc-band-purple',
    mark:        'VD',
    markClass:   'mark-purple',
    tags:        ['Vendors', 'AI', 'Healthcare Tech'],
    motif:       'network',
    ps:          ['p2a', 'p2b', 'p3'],
    labNode:     'vendor-directory'
  },

  {
    id:          'hospital-map',
    status:      'live',
    featured:    true,
    title:       'Hospital Operations Map',
    desc:        'Interactive cross-section of a modern hospital. Every unit, every floor, every service line. Click any department to see who staffs it, how patients move through it, how it bills, and what happens when it breaks.',
    url:         '/tools/hospital-map/',
    type:        'interactive',
    badge:       'Interactive',
    badgeClass:  'badge-interactive',
    bandClass:   'tc-band-teal',
    mark:        'HM',
    markClass:   'mark-teal',
    tags:        ['Hospital Ops', 'Departments', 'Interactive'],
    motif:       'compass-rose',
    ps:          ['p1', 'p2a', 'p3'],
    labNode:     'hospital-map'
  },

  {
    id:          'sql-mystery',
    status:      'live',
    featured:    true,
    title:       'Clinical SQL Mystery',
    desc:        'Learn the Patient → Encounter → Clinical Event data model by solving a real clinical mystery using SQL queries against an Epic-style database. Four cases, escalating difficulty. No experience needed.',
    url:         '/tools/clinical-sql-mystery/',
    type:        'lab',
    badge:       'Game',
    badgeClass:  'badge-lab',
    bandClass:   'tc-band-amber',
    mark:        'SQL',
    markClass:   'mark-amber',
    tags:        ['SQL', 'EHR', 'Beginner-friendly'],
    ps:          ['p2a', 'p2b'],
    labNode:     'sql-mystery'
  }

];
