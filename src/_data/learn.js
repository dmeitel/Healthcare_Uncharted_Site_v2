module.exports = {

  // ── MODULES ─────────────────────────────────────────────────────────────────
  // Add new modules here. status: 'live' | 'coming'
  // featured: true = shown on homepage
  // atlasLinks: [{label, zone, to:'zoneId/nodeId'}] — same shape as rounds.js;
  // emitted into the atlas CONTENT_LINKS block at build time (src/atlas/index.njk).

  modules: [

    {
      id:       '4ps-framework',
      num:      '01',
      category: 'Framework',
      ps:       'P1 / P2a / P2b / P3 / P4',
      title:    'The Four Players of U.S. Healthcare',
      desc:     'The framework everything else on this site hangs off of. Patients, Providers, Payers, and Policymakers. Each one sees the system through a different lens, and the same relationship can mean four different things depending on which side you’re standing on.',
      url:      '/learn/4ps-framework/',
      tags:     ['Framework', 'Mental Model', 'Interactive'],
      status:   'live',
      featured: false,
      atlasLinks: [
        { label: 'Clinical Encounter',   zone: 'patient',  to: 'patient/encounter' },
        { label: 'Acute Care Hospital',  zone: 'provider', to: 'provider/acute' },
        { label: 'Commercial Insurance', zone: 'payer',    to: 'payer/commercial' },
        { label: 'CMS & Fed Agencies',   zone: 'policy',   to: 'policy/cms' }
      ]
    },

    {
      id:       'laws-and-paradoxes',
      num:      'FG01',
      category: 'Field Guide',
      ps:       'P2a / P2b / P3 / P4',
      title:    'Healthcare Laws & Paradoxes',
      desc:     'The recurring patterns that shape healthcare and health IT. Jevons, Goodhart, Roemer, the Productivity Paradox, Conway, Amara, the Bullwhip Effect, and Jensen. One tabbed field guide, one law per tab.',
      url:      '/learn/laws-and-paradoxes/',
      tags:     ['Jevons', 'Goodhart', 'Roemer', 'Conway'],
      status:   'live',
      featured: false,
      atlasLinks: [
        { label: 'Certificate of Need',  zone: 'policy',   to: 'policy/con' },
        { label: 'Quality Measurement',  zone: 'policy',   to: 'policy/quality-meas' },
        { label: 'CDSS & AI Tools',      zone: 'provider', to: 'provider/cdss' }
      ]
    },

    {
      id:       'patient-data-record',
      num:      '02',
      category: 'Patient',
      ps:       'P1',
      title:    'The Patient: How You Become a Data Record',
      desc:     'From registration to discharge: how patient identity is created, maintained, and shared across every system in a health network.',
      url:      '/learn/patient-data-record/',
      tags:     ['Identity', 'Registration', 'Data'],
      status:   'live',
      featured: false,
      atlasLinks: [
        { label: 'Clinical Encounter',   zone: 'patient',  to: 'patient/encounter' },
        { label: 'EHR Systems',          zone: 'provider', to: 'provider/ehr' },
        { label: 'Health Info Exchange', zone: 'techeco',  to: 'techeco/hie' }
      ]
    },

    {
      id:       'process-engineering',
      num:      'M01',
      category: 'Method',
      ps:       'P2a / P2b / P3 / P4',
      title:    'Process Engineering: Designing the Work Behind the Work',
      desc:     'Most healthcare workflows were never designed. They accreted. This is the discipline of building them on purpose. Mapping the work, finding the waiting, killing the variation. And why every map and tool on this site is that method, pointed at a system the size of a country.',
      url:      '/learn/process-engineering/',
      tags:     ['Lean', 'DMAIC', 'Workflow Mapping', 'PDSA'],
      status:   'live',
      featured: true,
      labNode:  'process-engineering',
      atlasLinks: [
        { label: 'Clinical Informatics', zone: 'provider', to: 'provider/informatics' },
        { label: 'Emergency Dept',       zone: 'provider', to: 'provider/ed' },
        { label: 'Care Transitions',     zone: 'patient',  to: 'patient/care-transitions' }
      ]
    },

    {
      id:       'healthcare-data-sources',
      num:      'M02',
      category: 'Infrastructure',
      ps:       'P1 / P2a / P2b / P3 / P4',
      title:    'Where Healthcare Data Lives',
      desc:     'Every map and tool on this site runs on real public data. CDC, Census, CMS, BLS, HRSA, KFF. This is exactly what we pull, where it comes from, and how we house it so one dataset can feed the whole site at once. The blueprint for the data warehouse underneath everything.',
      url:      '/learn/healthcare-data-sources/',
      tags:     ['Data', 'Sourcing', 'Architecture'],
      status:   'live',
      featured: false,
      labNode:  'data-warehouse',
      atlasLinks: [
        { label: 'Data Warehousing',     zone: 'techeco',   to: 'techeco/data-warehouse' },
        { label: 'CMS & Fed Agencies',   zone: 'policy',    to: 'policy/cms' },
        { label: 'Epidemiology & Surveillance', zone: 'pubhealth', to: 'pubhealth/epidemiology' }
      ]
    },

    {
      id:       'oxygen-payment-cuts',
      num:      'G01',
      category: 'Guest — Chrysalis Ashton',
      ps:       'P2b / P3 / P4',
      title:    'The Erosion of Home Oxygen Reimbursement',
      desc:     'How 36 years of successive legislation dismantled the financial foundation of home respiratory therapy, cutting Medicare oxygen reimbursement by over 75% in real terms and eliminating the economic model that funded RT clinical services in the home.',
      url:      '/learn/oxygen-payment-cuts/',
      tags:     ['Medicare', 'Home Oxygen', 'Reimbursement'],
      status:   'live',
      featured: false,
      atlasLinks: [
        { label: 'Medicare',             zone: 'payer',    to: 'payer/medicare' },
        { label: 'Respiratory Therapy',  zone: 'provider', to: 'provider/resp-therapy' },
        { label: 'Federal Legislation',  zone: 'policy',   to: 'policy/fed-law' }
      ]
    },

    {
      id:       'home-respiratory-timeline',
      num:      'G02',
      category: 'Guest — Chrysalis Ashton',
      ps:       'P2a / P2b / P4',
      title:    'History of Home Respiratory Therapy',
      desc:     'From oxygen orderlies in the 1940s to modern PAP therapy, home ventilation, and the fight for clinical recognition. A century of evolution in the home care setting.',
      url:      '/learn/home-respiratory-timeline/',
      tags:     ['Home Care', 'Respiratory', 'History'],
      status:   'live',
      featured: false,
      atlasLinks: [
        { label: 'Respiratory Therapy',  zone: 'provider', to: 'provider/resp-therapy' },
        { label: 'Post-Acute Care',      zone: 'provider', to: 'provider/post-acute' },
        { label: 'Scope of Practice',    zone: 'policy',   to: 'policy/scope' }
      ]
    },

    {
      id:       'ehr-data-model',
      num:      '01',
      category: 'EHR Fundamentals',
      ps:       'P2a / P2b',
      title:    'The Universal Healthcare Data Chain',
      desc:     'Patient \u2192 Encounter \u2192 Clinical Event \u2192 Data Point. This structure is not a design choice \u2014 it is forced by medicine, billing law, and 30 years of regulatory pressure. Understanding it unlocks everything else.',
      url:      '#',
      tags:     ['Epic', 'Cerner', 'FHIR'],
      tagAmber: 'Coming soon',
      status:   'coming',
      featured: false,
      labNode:  'ehr-data-model'
    },

    {
      id:       'hitech',
      num:      '02',
      category: 'Healthcare Policy',
      ps:       'P4',
      title:    'The $25.9 Billion Law That Built Modern Healthcare IT',
      desc:     'The HITECH Act didn\u2019t just pay hospitals to buy software. It restructured how clinical data is created, stored, and shared \u2014 and created the fragmented landscape we still navigate today.',
      url:      '#',
      tags:     ['HITECH', 'Meaningful Use', 'History'],
      tagAmber: 'Coming soon',
      status:   'coming',
      featured: false,
      labNode:  'hitech-act'
    },

    {
      id:       'event-vs-request',
      num:      '03',
      category: 'FHIR Data Model',
      ps:       'P2a',
      title:    'Event vs. Request vs. Observation',
      desc:     'The three building blocks of clinical data in every modern EHR. A medication order, a lab result, and a vital sign are fundamentally different \u2014 and treating them the same breaks everything downstream.',
      url:      '#',
      tags:     ['FHIR R4', 'Data Model', 'Clinical'],
      tagAmber: 'Coming soon',
      status:   'coming',
      featured: false,
      labNode:  'fhir-concepts'
    },

    {
      id:       'ai-in-healthcare',
      num:      '07',
      category: 'AI in Healthcare',
      ps:       'P2a / P2b / P3',
      title:    'AI in Healthcare: What Works, What Doesn\u2019t, and Why',
      desc:     'Ambient documentation is real. Autonomous diagnosis is not. The evidence behind the healthcare AI line: the sepsis model that missed sepsis, the algorithm that learned the wrong thing, the scribe that stuck, and the four questions that sort every pitch.',
      url:      '/learn/ai-in-healthcare/',
      tags:     ['AI', 'Evidence', 'Case Studies'],
      status:   'live',
      featured: true,
      labNode:  'ai-in-healthcare',
      atlasLinks: [
        { label: 'CDSS & AI Tools',      zone: 'provider', to: 'provider/cdss' },
        { label: 'Predictive Analytics', zone: 'medsci',   to: 'medsci/predictive' },
        { label: 'AI Vendor Landscape',  zone: 'techeco',  to: 'techeco/ai-vendors' }
      ]
    },

    {
      id:       'healthcare-gap',
      num:      '08',
      category: 'Workforce & Access',
      ps:       'P1 / P2a / P4',
      title:    'The U.S. Healthcare Gap: Rural, Workforce, and Access',
      desc:     'Where the system breaks down for real people. One in five Americans lives rural, one in ten physicians practices there, and more than a hundred rural hospitals have closed since 2010. The workforce gap wearing a geography costume, and why technology alone has not closed it.',
      url:      '/learn/healthcare-gap/',
      tags:     ['Workforce', 'Rural', 'Access'],
      status:   'live',
      featured: false,
      atlasLinks: [
        { label: 'Rural Health Access',  zone: 'pubhealth', to: 'pubhealth/rural' },
        { label: 'Physician Workforce',  zone: 'provider',  to: 'provider/physicians' },
        { label: 'Access & Navigation',  zone: 'patient',   to: 'patient/access' }
      ]
    },

    {
      id:       'interoperability',
      num:      '05',
      category: 'Interoperability',
      ps:       'P4',
      title:    'What Interoperability Actually Means (And Why It\u2019s Hard)',
      desc:     'HL7, FHIR, the 21st Century Cures Act, information blocking rules. The full picture of why healthcare data still doesn\u2019t flow freely despite decades of effort and billions in federal investment.',
      url:      '#',
      tags:     ['HL7', 'FHIR', 'ONC', 'Cures Act'],
      tagAmber: 'Coming soon',
      status:   'coming',
      featured: false,
      labNode:  'interoperability'
    },

    {
      id:       'revenue-cycle',
      num:      '06',
      category: 'Revenue Cycle',
      ps:       'P2b / P3',
      title:    'How a Clinical Encounter Becomes a Paid Claim',
      desc:     'From the moment a patient is registered to the moment a payer deposits money. Charge capture, coding, claims submission, adjudication, denial management, and why clinical documentation matters beyond care.',
      url:      '#',
      tags:     ['RCM', 'ICD-10', 'Claims', 'Billing'],
      tagAmber: 'Coming soon',
      status:   'coming',
      featured: false,
      labNode:  'revenue-cycle'
    }

  ],

  // ── TALKS & PRESENTATIONS ───────────────────────────────────────────────────
  // Add new talks here as you present at conferences.

  talks: [

    {
      id:         'arma-2026',
      conference: 'ArMA Annual Meeting 2026',
      date:       'May 2, 2026',
      location:   'Phoenix, AZ',
      title:      'AI in Healthcare: Value vs. Hype',
      desc:       'A practical framework for evaluating AI tools in clinical and operational settings — the 5-question evaluation model, case studies on the Epic Sepsis Model and Optum algorithm, and what actually delivers ROI. Includes CME credit.',
      url:        '/learn/talks/arma-2026/',
      cme:        '1.0 AMA PRA Category 1',
      downloads: {
        slides:    '/downloads/2026_ArMA_Annual_Meeting_AI_in_Healthcare_Slides.pdf',
        takeHome:  '/downloads/2026_ArMA_AI-Healthcare-Take-Home.pdf'
      },
      ps:       ['p2a', 'p2b', 'p3', 'p4'],
      labNode:  'arma-2026-talk',
      atlasLinks: [
        { label: 'CDSS & AI Tools',      zone: 'provider', to: 'provider/cdss' },
        { label: 'AI Vendor Landscape',  zone: 'techeco',  to: 'techeco/ai-vendors' },
        { label: 'Predictive Analytics', zone: 'medsci',   to: 'medsci/predictive' }
      ]
    },

    {
      id:         'msrc-2026',
      conference: 'MSRC Conference 2026',
      date:       'April 10, 2026',
      location:   'Kalispell, MT',
      title:      'AI in Healthcare: Operational Value, Limitations, and Oversight',
      desc:       'A framework for evaluating any AI tool in healthcare \u2014 the Operations vs. Clinical AI distinction, where AI is delivering real ROI today, warning signs in vendor pitches, and the RT-specific implications of insurance AI already screening prior authorizations.',
      url:        '/learn/talks/msrc-2026/',
      downloads: {
        referenceCard: '/downloads/2026-msrc-ai-reference-card.pdf',
        slides:        '/downloads/2026-msrc-ai-in-healthcare-slides.pdf'
      },
      ps:       ['p2a', 'p2b', 'p3', 'p4'],
      labNode:  'msrc-2026-talk',
      atlasLinks: [
        { label: 'CDSS & AI Tools',      zone: 'provider', to: 'provider/cdss' },
        { label: 'Prior Authorization',  zone: 'patient',  to: 'patient/prior-auth' },
        { label: 'Respiratory Therapy',  zone: 'provider', to: 'provider/resp-therapy' }
      ]
    }

  ],

  // ── REFERENCE INDEX ─────────────────────────────────────────────────────────
  // External authoritative sources cited across the site.

  references: [

    {
      id:       'hl7-fhir',
      group:    'Standards & Regulatory',
      title:    'HL7 FHIR R4 Specification',
      url:      'https://hl7.org/fhir/R4/resourcelist.html',
      note:     'The authoritative FHIR standard. Start here for resource definitions, data types, and API patterns.'
    },
    {
      id:       'onc',
      group:    'Standards & Regulatory',
      title:    'ONC \u2014 HealthIT.gov',
      url:      'https://www.healthit.gov/',
      note:     'Office of the National Coordinator for Health IT. Certification criteria, interoperability rules, and policy guidance.'
    },
    {
      id:       'cms',
      group:    'Standards & Regulatory',
      title:    'CMS.gov',
      url:      'https://www.cms.gov/',
      note:     'Centers for Medicare & Medicaid Services. Reimbursement rules, quality programs, and prior authorization policy.'
    },
    {
      id:       'hhs',
      group:    'Standards & Regulatory',
      title:    'HHS \u2014 HIPAA Information',
      url:      'https://www.hhs.gov/hipaa/',
      note:     'Official HIPAA guidance, privacy rule summaries, and enforcement actions.'
    },
    {
      id:       'epic-fhir',
      group:    'EHR Vendor Documentation',
      title:    'Epic FHIR API Documentation',
      url:      'https://fhir.epic.com/',
      note:     'Epic\u2019s public FHIR endpoint documentation. The only Epic source used on this site.'
    },
    {
      id:       'cerner-fhir',
      group:    'EHR Vendor Documentation',
      title:    'Oracle Health FHIR Docs',
      url:      'https://fhir.cerner.com/',
      note:     'Oracle Cerner\u2019s public FHIR documentation. Millennium terminology mapped to FHIR resource equivalents.'
    },
    {
      id:       'hl7-org',
      group:    'Standards & Regulatory',
      title:    'HL7 International',
      url:      'https://www.hl7.org/about/index.cfm',
      note:     'The standards body behind HL7 v2, v3, CDA, and FHIR. Primary source for messaging standards history.'
    },
    {
      id:       'onc-strategic',
      group:    'Standards & Regulatory',
      title:    'ONC Federal HIT Strategic Plan',
      url:      'https://www.healthit.gov/topic/federal-hit-strategic-plan',
      note:     'Federal roadmap for health IT adoption, interoperability, and patient access to data.'
    }

  ]

};
