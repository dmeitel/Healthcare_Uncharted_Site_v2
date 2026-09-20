module.exports = {

  name:        'Healthcare Uncharted',
  tagline:     'A living resource for clinical informatics, healthcare data architecture, and the real story behind the systems that run modern medicine.',
  author:      'David Eitel',
  credentials: 'RRT, MHA, MSRT, RRT-ACCS',
  url:         'https://healthcareuncharted.com',

  // GoatCounter analytics. Register a code at goatcounter.com, paste it here
  // (just the subdomain, e.g. 'healthcareuncharted'), and the tracking script
  // ships on every page. Empty string = no analytics script at all.
  goatcounter: 'healthcareuncharted',

  // ── NAV LINKS ───────────────────────────────────────────────────────────────
  // Order matters — this is the render order in the nav.

  nav: [
    { label: 'Home',  url: '/',        id: 'home'  },
    { label: 'Tools', url: '/tools/',  id: 'tools' },
    { label: 'Learn', url: '/learn/',  id: 'learn' },
    { label: 'Atlas', url: '/atlas/',  id: 'atlas' },
    { label: 'About', url: '/about/',  id: 'about' }
  ],

  // ── NAV CTA ─────────────────────────────────────────────────────────────────
  navCta: {
    label: 'Healthcare Atlas \u2192',
    url:   '/atlas/'
  },

  // ── SUPPORT ─────────────────────────────────────────────────────────────────
  // A plain outbound link, deliberately NOT an embedded widget. The CSP in
  // netlify.toml allows no third-party script, no iframe, no remote image and
  // no cross-origin form post, so every donation embed is blocked by four
  // separate directives. Loosening all four for a tip jar is not a trade worth
  // making, and a link costs nothing: no script, no cookie, no tracker.
  //
  // Paste the Ko-fi URL below and the link appears in the footer, on About,
  // under Rounds posts, and in the tool attribution strip. Leave `url` EMPTY and
  // nothing renders anywhere, so this ships safely before the page exists.
  support: {
    url:   'https://ko-fi.com/healthcareuncharted',   // verified live 2026-09-19
    label: 'Support the work',
    short: 'Support',              // the tool strip and other tight spots
    blurb: 'The maps run on data that has to be re-pulled every time the source updates. That, plus hosting, is what keeping them current actually costs. If something here saved you an afternoon, you can help cover it.'
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
