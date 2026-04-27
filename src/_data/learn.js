module.exports = {

  // ── MODULES ─────────────────────────────────────────────────────────────────
  // Add new modules here. status: 'live' | 'coming'
  // featured: true = shown on homepage

  modules: [

    {
      id:       'ehr-data-model',
      num:      '01',
      category: 'EHR Fundamentals',
      ps:       'P2a / P2b',
      title:    'The Universal Healthcare Data Chain',
      desc:     'Patient \u2192 Encounter \u2192 Clinical Event \u2192 Data Point. This structure is not a design choice \u2014 it is forced by medicine, billing law, and 30 years of regulatory pressure. Understanding it unlocks everything else.',
      url:      '/learn/ehr-data-model/',
      tags:     ['Epic', 'Cerner', 'FHIR'],
      tagTeal:  'Essential',
      status:   'live',
      featured: true,
      labNode:  'ehr-data-model'
    },

    {
      id:       'hitech',
      num:      '02',
      category: 'Healthcare Policy',
      ps:       'P4',
      title:    'The $25.9 Billion Law That Built Modern Healthcare IT',
      desc:     'The HITECH Act didn\u2019t just pay hospitals to buy software. It restructured how clinical data is created, stored, and shared \u2014 and created the fragmented landscape we still navigate today.',
      url:      '/learn/hitech/',
      tags:     ['HITECH', 'Meaningful Use', 'History'],
      tagTeal:  'Essential',
      status:   'live',
      featured: true,
      labNode:  'hitech-act'
    },

    {
      id:       'event-vs-request',
      num:      '03',
      category: 'FHIR Data Model',
      ps:       'P2a',
      title:    'Event vs. Request vs. Observation',
      desc:     'The three building blocks of clinical data in every modern EHR. A medication order, a lab result, and a vital sign are fundamentally different \u2014 and treating them the same breaks everything downstream.',
      url:      '/tools/event-vs-request-vs-observation/',
      tags:     ['FHIR R4', 'Data Model', 'Clinical'],
      tagTeal:  'Interactive tool',
      status:   'live',
      featured: false,
      labNode:  'fhir-concepts'
    },

    {
      id:       'ai-in-healthcare',
      num:      '04',
      category: 'AI in Healthcare',
      ps:       'P2a / P2b / P3',
      title:    'What\u2019s Actually Working vs. What\u2019s Still Promise',
      desc:     'Ambient documentation is real. Autonomous diagnosis is not. A candid, evidence-based assessment of where the healthcare AI line actually is \u2014 so you can make better decisions about what to adopt.',
      url:      '/learn/ai-in-healthcare/',
      tags:     ['AI', 'Strategy', 'Evidence'],
      tagTeal:  'Deep dive',
      status:   'live',
      featured: false,
      labNode:  'ai-in-healthcare'
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
      labNode:  'arma-2026-talk'
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
      labNode:  'msrc-2026-talk'
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
