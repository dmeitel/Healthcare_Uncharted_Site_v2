module.exports = {

  name:        'Healthcare Uncharted',
  tagline:     'A living resource for clinical informatics, healthcare data architecture, and the real story behind the systems that run modern medicine.',
  author:      'David Eitel',
  credentials: 'RRT, MHA, MSRT, RRT-ACCS',
  url:         'https://healthcareuncharted.com',

  // ── NAV LINKS ───────────────────────────────────────────────────────────────
  // Order matters — this is the render order in the nav.

  nav: [
    { label: 'Home',  url: '/',        id: 'home'  },
    { label: 'Tools', url: '/tools/',  id: 'tools' },
    { label: 'Learn', url: '/learn/',  id: 'learn' },
    { label: 'Lab',   url: '/lab/',    id: 'lab'   },
    { label: 'About', url: '/about/',  id: 'about' }
  ],

  // ── NAV CTA ─────────────────────────────────────────────────────────────────
  navCta: {
    label: 'AI Healthcare Map \u2192',
    url:   '/tools/ai-healthcare-map/'
  },

  // ── SOURCE POLICY ───────────────────────────────────────────────────────────
  // Referenced in base.njk footer

  sources: [
    { label: 'fhir.epic.com',   url: 'https://fhir.epic.com/' },
    { label: 'fhir.cerner.com', url: 'https://fhir.cerner.com/' },
    { label: 'HL7 FHIR R4',     url: 'https://hl7.org/fhir/R4/' },
    { label: 'ONC HealthIT.gov', url: 'https://www.healthit.gov/' },
    { label: 'HHS.gov',         url: 'https://www.hhs.gov/' }
  ]

};
