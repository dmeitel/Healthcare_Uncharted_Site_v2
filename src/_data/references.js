// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL REFERENCE LEDGER
//
// One source of truth for every external source cited anywhere on the site.
// The Learn page's Reference Appendix renders from this file. Add new sources
// HERE, not in page HTML.
//
// Two inputs get merged:
//   1. PROGRAMMATIC — every unique sourceUrl in metricsConfig.json (the
//      Multi-Lens Map metric definitions), deduped by normalized URL, carrying
//      the lenses that use it and the latest retrievedDate.
//   2. CURATED — everything else: the old Learn appendix entries, Rounds post
//      citations, tool attribution sources, home page stats sources, and the
//      FHIR / vendor documentation named in the footer Source Policy.
//
// Dedupe rule: normalized URL (www. and trailing slash ignored, DOI links
// keyed by DOI). When a curated entry collides with a metricsConfig entry the
// usedBy lists merge and the richer description wins.
//
// Entry schema:
//   name      display name
//   tag       short left-column label (matches the old .ai-label style)
//   url       canonical link
//   org       government | standards | policy | clinical | research | industry
//   desc      one plain line
//   usedBy    [{ label, href?, site? }]  — chips; href optional, site = muted
//   retrieved 'YYYY-MM' (optional, from metricsConfig where present)
//   linkText  optional link display text (defaults to the URL host)
// ─────────────────────────────────────────────────────────────────────────────

const metricsConfig = require('./metricsConfig.json');

const GROUPS = [
  { key: 'government', label: 'Government & Regulatory' },
  { key: 'standards',  label: 'Standards & Interoperability' },
  { key: 'policy',     label: 'Health Policy & Research Organizations' },
  { key: 'clinical',   label: 'Medical Associations & AI Governance' },
  { key: 'research',   label: 'Peer-Reviewed Research' },
  { key: 'industry',   label: 'Investigative Journalism & Industry Trackers' },
];

// ── URL normalization ────────────────────────────────────────────────────────

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    let host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'dx.doi.org') host = 'doi.org';
    const path = u.pathname.replace(/\/+$/, '').toLowerCase();
    return host + path;
  } catch (e) {
    return String(url).toLowerCase();
  }
}

// Aliases collapse URL variants that point at the same dataset.
function canonicalKey(url) {
  const k = normalizeUrl(url);
  if (k.startsWith('data.census.gov/table')) return 'data.census.gov';           // all ACS tables = one source
  if (k === 'data.hrsa.gov/topics/health-workforce/ahrf') return 'data.hrsa.gov/data/download'; // both are the AHRF
  return k;
}

// ── Chip shorthands ──────────────────────────────────────────────────────────

const USE = {
  siteWide:  { label: 'Site-wide', site: true },
  home:      { label: 'Home', href: '/' },
  mlm:       { label: 'Multi-Lens Map', href: '/tools/multi-lens-map/' },
  fourPs:    { label: '4Ps Framework', href: '/learn/4ps-framework/' },
  oxygen:    { label: 'Oxygen Payment Cuts', href: '/learn/oxygen-payment-cuts/' },
  arma:      { label: 'ArMA 2026 Talk', href: '/learn/talks/arma-2026/' },
  msrc:      { label: 'MSRC 2026 Talk', href: '/learn/talks/msrc-2026/' },
  opsMap:    { label: 'Hospital Operations Map', href: '/tools/healthcare-operators-map/' },
  career:    { label: 'Career Tree', href: '/tools/healthcare-career-tree/' },
  vendors:   { label: 'Vendor Directory', href: '/tools/healthcare-vendor-directory/' },
  wound:     { label: 'Wound & Workload', href: '/rounds/wound-and-workload/' },
  aiBill:    { label: 'Promise & the Bill', href: '/rounds/ai-promise-vs-bill/' },
  ai07:      { label: 'AI in Healthcare (Article 07)', href: '/learn/ai-in-healthcare/' },
  gap08:     { label: 'Healthcare Gap (Article 08)', href: '/learn/healthcare-gap/' },
  ehr03:     { label: 'EHR Architecture (Article 03)', href: '/learn/ehr-architecture/' },
  steward:   { label: 'Steward Post-Mortem', href: '/rounds/steward-postmortem/' },
};

const LENS_LABELS = {
  patient:    'Patient lens',
  clinical:   'Clinical lens',
  operations: 'Operations lens',
  payer:      'Payer lens',
  policy:     'Policy lens',
  baseline:   'Baseline lens',
  economics:  'Economics lens',
};

// ── PROGRAMMATIC: metricsConfig sources ──────────────────────────────────────
// Display metadata for the dataset URLs that appear in metricsConfig. The
// usedBy lenses and retrieved dates are extracted, not hand-kept.

const METRIC_SOURCE_META = {
  'data.cdc.gov/d/swc5-untb':                                { name: 'CDC PLACES (County 2025 Release)', tag: 'CDC', org: 'government', desc: 'County-level chronic disease and health measure estimates, rolled up to states.' },
  'wonder.cdc.gov/cancer.html':                              { name: 'CDC WONDER · Cancer Mortality', tag: 'CDC', org: 'government', desc: 'Age-adjusted cancer mortality from NCHS death certificate data.' },
  'cdc.gov/nchs/products/databriefs/db492.htm':              { name: 'CDC NCHS · Life Expectancy Data Brief', tag: 'CDC', org: 'government', desc: 'State life expectancy estimates from period life tables.' },
  'data.census.gov':                                         { name: 'U.S. Census Bureau · ACS Data Tables', tag: 'Census', org: 'government', desc: 'American Community Survey tables: demographics, income, housing, and coverage.', url: 'https://data.census.gov/' },
  'census.gov/programs-surveys/sahie.html':                  { name: 'Census SAHIE · Small Area Health Insurance Estimates', tag: 'Census', org: 'government', desc: 'Modeled under-65 uninsured rates for every county and state.' },
  'census.gov/programs-surveys/saipe.html':                  { name: 'Census SAIPE · Income & Poverty Estimates', tag: 'Census', org: 'government', desc: 'Model-based median household income for counties and states.' },
  'census.gov/programs-surveys/decennial-census/about/rdo/summary-files.html': { name: 'Census 2020 · Urban/Rural Summary Files', tag: 'Census', org: 'government', desc: 'Decennial urban and rural population classification.' },
  'data.hrsa.gov/data/download':                             { name: 'HRSA Area Health Resources File (AHRF)', tag: 'HRSA', org: 'government', desc: 'County and state physician and workforce counts derived from the AMA Masterfile.' },
  'data.hrsa.gov/topics/health-workforce/shortage-areas':    { name: 'HRSA Health Professional Shortage Areas', tag: 'HRSA', org: 'government', desc: 'Federal shortage designations for primary care, dental, and mental health.' },
  'bls.gov/oes/current/oes291141.htm':                       { name: 'BLS OEWS · Registered Nurses (29-1141)', tag: 'BLS', org: 'government', desc: 'RN employment and wages by state.' },
  'bls.gov/oes/current/oes291126.htm':                       { name: 'BLS OEWS · Respiratory Therapists (29-1126)', tag: 'BLS', org: 'government', desc: 'RT employment and wages by state, CRT and RRT combined.' },
  'bls.gov/lau':                                             { name: 'BLS Local Area Unemployment Statistics (LAUS)', tag: 'BLS', org: 'government', desc: 'County and state unemployment rates, annual averages.' },
  'cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/cahs': { name: 'CMS Critical Access Hospital Designations', tag: 'CMS', org: 'government', desc: 'Registry of Critical Access Hospital status.' },
  'medicare.gov/care-compare':                               { name: 'CMS Care Compare', tag: 'CMS', org: 'government', desc: 'Hospital star ratings, ED timing, and readmission measures.' },
  'medicaid.gov/medicaid/program-information/medicaid-and-chip-enrollment-data/report-highlights/index.html': { name: 'CMS Medicaid & CHIP Enrollment Data', tag: 'CMS', org: 'government', desc: 'Monthly Medicaid and CHIP enrollment reports.' },
  'cms.gov/research-statistics-data-and-systems/statistics-trends-and-reports/mcradvpartdenroldata': { name: 'CMS Medicare Enrollment Dashboard', tag: 'CMS', org: 'government', desc: 'Medicare enrollment by state and plan type.' },
  'cms.gov/cciio/resources/data-resources/marketplace-puf':  { name: 'CMS Marketplace Public Use Files', tag: 'CMS', org: 'government', desc: 'ACA Marketplace enrollment and premium files.' },
  'meric.mo.gov/data/cost-living-data-series':               { name: 'MERIC Cost of Living Data Series', tag: 'MERIC', org: 'government', desc: 'State cost of living index relative to the U.S. average.' },
  'aha.org/statistics/fast-facts-us-hospitals':              { name: 'AHA Fast Facts on U.S. Hospitals', tag: 'AHA', org: 'clinical', desc: 'Bed counts, hospital counts, and ownership mix from the AHA Annual Survey.' },
  'aha.org/system/files/media/file/2023/04/telehealth-fact-sheet.pdf': { name: 'AHA Telehealth Fact Sheet (2023)', tag: 'AHA', org: 'clinical', desc: 'Hospital telehealth adoption figures.' },
  'acgme.org/data-collections':                              { name: 'ACGME Data Collections', tag: 'ACGME', org: 'clinical', desc: 'Residency program and filled-position counts.' },
  'aanp.org/advocacy/state/state-practice-environment':      { name: 'AANP State Practice Environment', tag: 'AANP', org: 'clinical', desc: 'Full, reduced, or restricted NP practice authority by state.' },
  'kff.org/medicaid/issue-brief/status-of-state-medicaid-expansion-decisions-interactive-map': { name: 'KFF Medicaid Expansion Tracker', tag: 'KFF', org: 'policy', desc: 'Which states adopted ACA Medicaid expansion, updated continuously.' },
  'ncsl.org/health/certificate-of-need-state-laws':          { name: 'NCSL Certificate of Need State Laws', tag: 'NCSL', org: 'policy', desc: 'Certificate of Need law scope by state.' },
  'ncsl.org/health/prescription-drug-state-legislation':     { name: 'NCSL Prescription Drug State Legislation', tag: 'NCSL', org: 'policy', desc: 'State drug pricing, transparency, and PBM laws.' },
  'telehealthpolicy.us/resources/state-telehealth-laws-and-reimbursement-policies': { name: 'Center for Connected Health Policy: State Telehealth Laws', tag: 'CCHP', org: 'policy', desc: 'State telehealth law and reimbursement policy tracker.' },
  'ruralhealthweb.org/advocate/state-rural-health-associations': { name: 'NRHA State Rural Health Programs', tag: 'NRHA', org: 'policy', desc: 'State rural health association and program compilation.' },
  'map.feedingamerica.org':                                  { name: 'USDA Map the Meal Gap (Feeding America)', tag: 'USDA', org: 'policy', desc: 'County-level food insecurity estimates.' },
};

function extractMetricSources() {
  const found = new Map(); // canonical key → accumulator
  for (const [lens, cfg] of Object.entries(metricsConfig)) {
    if (!cfg || !Array.isArray(cfg.items)) continue;
    for (const m of cfg.items) {
      if (!m.sourceUrl) continue;
      const key = canonicalKey(m.sourceUrl);
      let acc = found.get(key);
      if (!acc) {
        acc = { url: m.sourceUrl, sourceName: m.source, lenses: new Set(), retrieved: '' };
        found.set(key, acc);
      }
      acc.lenses.add(lens);
      if (m.retrievedDate && m.retrievedDate > acc.retrieved) acc.retrieved = m.retrievedDate;
    }
  }

  const lensOrder = Object.keys(LENS_LABELS);
  const entries = [];
  for (const [key, acc] of found) {
    const meta = METRIC_SOURCE_META[key] || {};
    const usedBy = [ { ...USE.mlm } ];
    for (const lens of lensOrder) {
      if (acc.lenses.has(lens)) usedBy.push({ label: LENS_LABELS[lens] });
    }
    entries.push({
      name: meta.name || acc.sourceName,
      tag:  meta.tag || 'Data',
      url:  meta.url || acc.url,
      org:  meta.org || 'government',
      desc: meta.desc || '',
      usedBy,
      retrieved: acc.retrieved || undefined,
    });
  }
  return entries;
}

// ── CURATED: everything harvested from page HTML ─────────────────────────────

const CURATED = [

  // — Government & Regulatory —
  { name: 'Office of the National Coordinator for Health IT', tag: 'ONC', org: 'government',
    url: 'https://www.healthit.gov',
    desc: 'Federal lead on health IT policy, EHR certification, and interoperability strategy.',
    usedBy: [USE.siteWide, USE.home, USE.ehr03] },
  { name: 'Centers for Medicare & Medicaid Services', tag: 'CMS', org: 'government',
    url: 'https://www.cms.gov',
    desc: 'Federal agency running Medicare, Medicaid, and most of the payment rules that shape U.S. healthcare.',
    usedBy: [USE.mlm, USE.fourPs, USE.oxygen] },
  { name: 'HHS · HITECH Act Enforcement & EHR Incentive Payments', tag: 'HHS', org: 'government',
    url: 'https://www.hhs.gov/hipaa/for-professionals/special-topics/hitech-act-enforcement-interim-final-rule/index.html',
    desc: 'The rule and $25.9B payment program that pushed hospitals onto EHRs after 2009.',
    usedBy: [USE.siteWide, USE.home, USE.ehr03] },
  { name: 'Centers for Disease Control and Prevention', tag: 'CDC', org: 'government',
    url: 'https://www.cdc.gov',
    desc: 'National public health surveillance, prevention data, and health statistics.',
    usedBy: [USE.mlm] },
  { name: 'FDA AI/ML-Enabled Medical Device List (1,451 devices cleared)', tag: 'FDA', org: 'government',
    url: 'https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices',
    desc: 'Running list of AI and machine learning medical devices cleared for U.S. market use.',
    usedBy: [USE.arma, USE.ai07] },
  { name: 'FDA Clinical Decision Support Software Guidance (Jan 2026)', tag: 'FDA', org: 'government',
    url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software',
    desc: 'Where the line sits between regulated device software and exempt decision support.',
    usedBy: [USE.arma, USE.ai07] },
  { name: 'Health Resources & Services Administration', tag: 'HRSA', org: 'government',
    url: 'https://www.hrsa.gov',
    desc: 'Federal agency for health workforce data and underserved-area programs.',
    usedBy: [USE.mlm, USE.gap08] },
  { name: 'U.S. Census Bureau', tag: 'Census', org: 'government',
    url: 'https://www.census.gov',
    desc: 'Population, demographic, and insurance survey data underneath most state comparisons.',
    usedBy: [USE.mlm, USE.gap08] },
  { name: 'U.S. Bureau of Labor Statistics', tag: 'BLS', org: 'government',
    url: 'https://www.bls.gov',
    desc: 'Employment and wage data for every healthcare occupation. Occupational Outlook (May 2024) drives the Career Tree salary heatmap.',
    usedBy: [USE.mlm, USE.career, USE.gap08] },
  { name: 'CMS Provider Data Catalog', tag: 'CMS', org: 'government',
    url: 'https://data.cms.gov/provider-data/',
    desc: 'Live public datasets on hospitals, surgery centers, and dialysis facilities.',
    usedBy: [USE.opsMap] },
  { name: 'HRSA Health Workforce Projections, 2021-2036', tag: 'HRSA', org: 'government',
    url: 'https://bhw.hrsa.gov/data-research/projecting-health-workforce-supply-demand',
    desc: 'Federal supply and demand projections for nurses and other health occupations.',
    usedBy: [USE.wound] },
  { name: 'CDC MMWR Vital Signs · Health Worker Mental Health (2023)', tag: 'CDC', org: 'government',
    url: 'https://www.cdc.gov/mmwr/volumes/72/wr/mm7244e1.htm',
    desc: 'CDC surveillance on working conditions and mental health symptoms among health workers, 2018-2022.',
    usedBy: [USE.wound] },
  { name: 'U.S. Surgeon General Advisory on Health Worker Burnout (2022)', tag: 'HHS', org: 'government',
    url: 'https://www.hhs.gov/sites/default/files/health-worker-wellbeing-advisory.pdf',
    desc: 'Federal advisory naming burnout a workforce crisis, with system-level recommendations.',
    usedBy: [USE.wound] },
  { name: 'CMS National Health Expenditure Projections, 2024-33', tag: 'CMS', org: 'government',
    url: 'https://www.cms.gov/files/document/nhe-projections-forecast-summary.pdf',
    desc: 'Office of the Actuary forecast of U.S. health spending through 2033.',
    usedBy: [USE.aiBill] },
  { name: 'CMS National Health Expenditures · 2024 Highlights', tag: 'CMS', org: 'government',
    url: 'https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/historical',
    desc: 'Actuals for U.S. health spending, the denominator behind every cost-trend claim.',
    usedBy: [USE.aiBill] },
  { name: 'CMS 2026 Medicare Physician Fee Schedule Final Rule (CMS-1832-F)', tag: 'CMS', org: 'government',
    url: 'https://www.cms.gov/newsroom/fact-sheets/calendar-year-cy-2026-medicare-physician-fee-schedule-final-rule-cms-1832-f',
    desc: 'The payment rule setting what Medicare pays physicians in 2026.',
    usedBy: [USE.aiBill] },
  { name: 'Massachusetts DPH · Steward Transition to New Operators', tag: 'Mass', org: 'government',
    url: 'https://www.mass.gov/info-details/steward-health-care-transition-to-the-new-operators',
    desc: 'State record of which operators took over each Steward hospital.',
    usedBy: [USE.steward] },

  // — Standards & Interoperability —
  { name: 'HL7 International · FHIR R4 Specification', tag: 'HL7', org: 'standards',
    url: 'https://hl7.org/fhir/R4/', linkText: 'hl7.org/fhir/R4',
    desc: 'The interoperability standard: 157 resource types for exchanging healthcare data.',
    usedBy: [USE.siteWide, USE.home, USE.ehr03] },
  { name: 'HL7 International · About HL7 (Founded 1987)', tag: 'HL7', org: 'standards',
    url: 'https://www.hl7.org/about/index.cfm',
    desc: 'The standards body behind HL7 v2, CDA, and FHIR.',
    usedBy: [USE.siteWide, USE.home] },
  { name: 'Epic FHIR API Documentation (public)', tag: 'Epic', org: 'standards',
    url: 'https://fhir.epic.com',
    desc: 'Epic public FHIR endpoints and app developer documentation.',
    usedBy: [USE.siteWide, USE.home, USE.ehr03] },
  { name: 'Oracle Health (Cerner) FHIR Documentation (public)', tag: 'Oracle', org: 'standards',
    url: 'https://fhir.cerner.com',
    desc: 'Oracle Health public FHIR API documentation.',
    usedBy: [USE.siteWide, USE.home, USE.ehr03] },

  // — Health Policy & Research Organizations —
  { name: 'KFF (Kaiser Family Foundation) Health Policy Research', tag: 'KFF', org: 'policy',
    url: 'https://www.kff.org',
    desc: 'Independent health policy research, polling, and state trackers.',
    usedBy: [USE.mlm, USE.oxygen, USE.gap08] },
  { name: 'Peterson-KFF · Eight Trends Shaping 2026 Health Care Costs', tag: 'KFF', org: 'policy',
    url: 'https://www.kff.org/health-costs/eight-trends-shaping-2026-health-care-costs/',
    desc: 'Health System Tracker analysis of what is driving 2026 cost growth.',
    usedBy: [USE.aiBill] },
  { name: 'National Conference of State Legislatures', tag: 'NCSL', org: 'policy',
    url: 'https://www.ncsl.org',
    desc: 'State-by-state legislative tracking across health policy topics.',
    usedBy: [USE.mlm] },
  { name: 'Center for Connected Health Policy: State Telehealth Laws', tag: 'CCHP', org: 'policy',
    url: 'https://telehealthpolicy.us/resources/state-telehealth-laws-and-reimbursement-policies/',
    desc: 'The standing tracker of state telehealth law and reimbursement policy.',
    usedBy: [USE.mlm, USE.gap08] },
  { name: 'National Rural Health Association', tag: 'NRHA', org: 'policy',
    url: 'https://www.ruralhealthweb.org',
    desc: 'Advocacy and data on rural health systems and workforce.',
    usedBy: [USE.mlm, USE.gap08] },
  { name: 'UNC Sheps Center · Rural Hospital Closures Tracker', tag: 'Sheps', org: 'policy',
    url: 'https://www.shepscenter.unc.edu/programs-projects/rural-health/rural-hospital-closures/',
    desc: 'The standing ledger of rural hospital closures and conversions since 2005.',
    usedBy: [USE.gap08] },
  { name: 'Brookings · Lessons from the Collapse of Steward Health Care', tag: '2025', org: 'policy',
    url: 'https://www.brookings.edu/articles/lessons-from-the-collapse-of-steward-health-care/',
    desc: 'Policy postmortem on the largest hospital bankruptcy in U.S. history.',
    usedBy: [USE.steward] },
  { name: 'Brookings · The Long, Twisting Tale of Steward: A Timeline', tag: '2025', org: 'policy',
    url: 'https://www.brookings.edu/wp-content/uploads/2026/09/Steward-Timeline-FINAL-10-02-05.pdf',
    desc: 'Dated timeline of the deals that built and broke Steward.',
    usedBy: [USE.steward] },
  { name: 'NYU Stern · Private Equity and Healthcare (2026)', tag: '2026', org: 'policy',
    url: 'https://bhr.stern.nyu.edu/publication/private-equity-and-healthcare-balancing-profit-with-wellness/',
    desc: 'Business and human rights review of private equity hospital ownership.',
    usedBy: [USE.steward] },
  { name: 'Private Equity Stakeholder Project · Steward, One Year Later', tag: 'PESP', org: 'policy',
    url: 'https://pestakeholder.org/news/steward-health-cares-bankruptcy-one-year-later/',
    desc: 'Watchdog accounting of the Steward bankruptcy fallout.',
    usedBy: [USE.steward] },
  { name: 'Georgetown CHIR · Massachusetts Private Equity Oversight Law', tag: 'CHIR', org: 'policy',
    url: 'https://chir.georgetown.edu/state-spotlight-new-massachusetts-law-enhances-oversight-of-private-equity-in-health-care/',
    desc: 'How Massachusetts tightened health market review after Steward.',
    usedBy: [USE.steward] },
  { name: 'Community Catalyst · Steward Bankruptcy: A Cautionary Tale', tag: '2024', org: 'policy',
    url: 'https://communitycatalyst.org/posts/steward-health-care-bankruptcy-a-cautionary-tale-of-corporate-greed-in-our-health-care-system/',
    desc: 'Consumer advocacy read on corporate ownership in hospital care.',
    usedBy: [USE.steward] },
  { name: 'National Academy of Medicine · The 1.2-FTE Problem (2026)', tag: 'NAM', org: 'policy',
    url: 'https://nam.edu/perspectives/the-real-driver-of-burnout-the-1-2-fte-problem/',
    desc: 'NAM Perspectives piece arguing workload, not resilience, drives burnout.',
    usedBy: [USE.wound] },
  { name: 'HMPI · Steward Health Care: A Cautionary Tale (2024)', tag: 'HMPI', org: 'policy',
    url: 'https://hmpi.org/2024/06/19/steward-health-a-cautionary-tale/',
    desc: 'Health management and policy case study of Steward before the collapse.',
    usedBy: [USE.steward] },
  { name: "Dr. Lorna Breen Heroes' Foundation", tag: '2020', org: 'policy',
    url: 'https://drlornabreen.org/about-lorna/',
    desc: 'The foundation behind clinician mental health license reform, named for Dr. Breen.',
    usedBy: [USE.wound] },

  // — Medical Associations & AI Governance —
  { name: 'AMA AI Tool Evaluation Guide (Feb 2026)', tag: 'AMA', org: 'clinical',
    url: 'https://www.ama-assn.org/practice-management/digital/ama-releases-new-tool-help-physicians-evaluate-ai',
    desc: 'Checklist physicians can run before adopting an AI tool.',
    usedBy: [USE.arma] },
  { name: 'AMA STEPS Forward: AI Governance Toolkit (Aug 2025)', tag: 'AMA', org: 'clinical',
    url: 'https://edhub.ama-assn.org/steps-forward',
    desc: 'Practice-level playbook for standing up AI governance.',
    usedBy: [USE.arma] },
  { name: 'AMA Center for Digital Health', tag: 'AMA', org: 'clinical',
    url: 'https://www.ama-assn.org/amc/ama-center-digital-medicine',
    desc: 'AMA hub for digital medicine policy and research.',
    usedBy: [USE.arma] },
  { name: 'AMA · Physician Burnout Falls to Nearly 42% (2026)', tag: 'AMA', org: 'clinical',
    url: 'https://www.ama-assn.org/practice-management/physician-health/physician-burnout-rate-continues-decline-falling-nearly-42',
    desc: 'AMA survey reporting the post-pandemic burnout decline.',
    usedBy: [USE.wound] },
  { name: 'Arizona Medical Association · HB 2175 (AI Prior Auth)', tag: 'ArMA', org: 'clinical',
    url: 'https://www.azmed.org',
    desc: 'State medical society push on AI prior authorization law.',
    usedBy: [USE.arma] },
  { name: 'American Hospital Association', tag: 'AHA', org: 'clinical',
    url: 'https://www.aha.org',
    desc: 'Hospital trade association; its Annual Survey underpins bed and ownership data.',
    usedBy: [USE.mlm] },
  { name: 'Accreditation Council for Graduate Medical Education', tag: 'ACGME', org: 'clinical',
    url: 'https://www.acgme.org',
    desc: 'Accreditor for residency programs; source for GME position counts.',
    usedBy: [USE.mlm] },
  { name: 'American Association of Nurse Practitioners', tag: 'AANP', org: 'clinical',
    url: 'https://www.aanp.org',
    desc: 'NP professional association; tracks state scope of practice.',
    usedBy: [USE.mlm] },
  { name: 'Coalition for Health AI · Quality Framework', tag: 'CHAI', org: 'clinical',
    url: 'https://www.coalitionforhealthai.org',
    desc: 'Industry and clinical coalition writing assurance standards for health AI.',
    usedBy: [USE.arma] },
  { name: 'ECRI Top 10 Patient Safety Concerns 2026', tag: 'ECRI', org: 'clinical',
    url: 'https://www.ecri.org/landing-page/top-10-patient-safety-concerns',
    desc: 'Annual ranked list of patient safety hazards, AI included.',
    usedBy: [USE.arma] },
  { name: 'AAMC Physician Shortage Projections (2024)', tag: 'AAMC', org: 'clinical',
    url: 'https://www.aamc.org/news/press-releases/new-aamc-report-shows-continuing-projected-physician-shortage',
    desc: 'Projected physician shortfall through 2036.',
    usedBy: [USE.wound, USE.gap08] },
  { name: 'NCSBN Nursing Workforce Research (2025)', tag: 'NCSBN', org: 'clinical',
    url: 'https://www.ncsbn.org/news/ncsbn-research-highlights-small-steps-toward-nursing-workforce-recovery-burnout-and-staffing-challenges-persist',
    desc: 'National nursing workforce survey: recovery, burnout, staffing.',
    usedBy: [USE.wound, USE.gap08] },

  // — Peer-Reviewed Research —
  { name: 'Olson et al. · Ambient AI Scribing, Burnout Reduction', tag: '2025', org: 'research',
    url: 'https://doi.org/10.1001/jamanetworkopen.2025.34976', linkText: 'JAMA Network Open · DOI',
    desc: 'Ambient scribe deployment tied to measurable burnout reduction.',
    usedBy: [USE.arma, USE.ai07] },
  { name: 'Goh et al. · GPT-4 Diagnostic Aid RCT (p=0.60)', tag: '2024', org: 'research',
    url: 'https://doi.org/10.1001/jamanetworkopen.2024.40969', linkText: 'JAMA Network Open · DOI',
    desc: 'RCT: GPT-4 access did not improve physician diagnostic reasoning.',
    usedBy: [USE.arma, USE.ai07] },
  { name: 'Ostermayer et al. · Epic Sepsis Model v2 Multicenter Validation', tag: '2024', org: 'research',
    url: 'https://doi.org/10.1093/jamiaopen/ooae133', linkText: 'JAMIA Open · DOI',
    desc: 'Multicenter validation of the revised Epic sepsis model.',
    usedBy: [USE.arma, USE.ai07] },
  { name: 'Wong et al. · Epic Sepsis Model External Validation', tag: '2021', org: 'research',
    url: 'https://doi.org/10.1001/jamainternmed.2021.2626', linkText: 'JAMA Internal Medicine · DOI',
    desc: 'External validation that found the original model missed most sepsis.',
    usedBy: [USE.arma, USE.ai07] },
  { name: 'Obermeyer et al. · Optum Algorithm Racial Bias', tag: '2019', org: 'research',
    url: 'https://doi.org/10.1126/science.aax2342', linkText: 'Science · DOI',
    desc: 'Cost-as-proxy outcome labeling produced racial bias at scale.',
    usedBy: [USE.arma, USE.ai07] },
  { name: 'Aiken et al. · Nurse Staffing, Mortality, and Burnout', tag: '2002', org: 'research',
    url: 'https://jamanetwork.com/journals/jama/fullarticle/195438', linkText: 'JAMA',
    desc: 'Each added patient per nurse raised mortality and burnout odds.',
    usedBy: [USE.wound, USE.gap08] },
  { name: 'Arndt et al. · Tethered to the EHR', tag: '2017', org: 'research',
    url: 'https://www.annfammed.org/content/15/5/419', linkText: 'Annals of Family Medicine',
    desc: 'Primary care physicians spend over half the workday in the EHR.',
    usedBy: [USE.wound, USE.ehr03] },
  { name: 'Davis et al. · Nurse and Physician Suicide Risk', tag: '2021', org: 'research',
    url: 'https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2778209', linkText: 'JAMA Psychiatry',
    desc: 'Occupation-level suicide risk analysis for nurses and physicians.',
    usedBy: [USE.wound] },
  { name: 'Dean, Talbot & Dean · Moral Injury, Not Burnout', tag: '2019', org: 'research',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6752815/', linkText: 'Federal Practitioner',
    desc: 'The reframing paper: clinician distress as moral injury.',
    usedBy: [USE.wound] },
  { name: 'Li et al. · Health Worker Mental Health During COVID-19', tag: '2021', org: 'research',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7946321/', linkText: 'PLOS ONE',
    desc: 'Meta-analysis of depression, anxiety, and PTSD in health workers.',
    usedBy: [USE.wound] },
  { name: 'Makhija et al. · Physician Suicide Rates, 2017-2021', tag: '2025', org: 'research',
    url: 'https://jamanetwork.com/journals/jamapsychiatry/article-abstract/2830401', linkText: 'JAMA Psychiatry',
    desc: 'Updated physician suicide rate estimates.',
    usedBy: [USE.wound] },
  { name: 'Melnick et al. · EHR Usability and Burnout', tag: '2020', org: 'research',
    url: 'https://www.mayoclinicproceedings.org/article/S0025-6196(19)30836-5/fulltext', linkText: 'Mayo Clinic Proceedings',
    desc: 'EHR usability scores track directly with burnout odds.',
    usedBy: [USE.wound] },
  { name: 'Panagioti et al. · Burnout Intervention Meta-Analysis', tag: '2017', org: 'research',
    url: 'https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2588814', linkText: 'JAMA Internal Medicine',
    desc: 'Organization-level fixes beat individual-level ones.',
    usedBy: [USE.wound] },
  { name: 'Sinsky et al. · Physician Time Allocation', tag: '2016', org: 'research',
    url: 'https://www.acpjournals.org/doi/10.7326/M16-0961', linkText: 'Annals of Internal Medicine',
    desc: 'Two hours of desk work for every hour with patients.',
    usedBy: [USE.wound] },
  { name: 'Tawfik et al. · Burnout and Medical Errors', tag: '2018', org: 'research',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30001832/', linkText: 'Mayo Clinic Proceedings',
    desc: 'Burnout tied to self-reported major medical errors.',
    usedBy: [USE.wound] },
  { name: 'West et al. · Physician Resilience vs the General Population', tag: '2020', org: 'research',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7333021/', linkText: 'JAMA Network Open',
    desc: 'Physicians score higher on resilience and still burn out more.',
    usedBy: [USE.wound] },
  { name: 'Zaçe et al. · Health Worker Mental Health Interventions', tag: '2023', org: 'research',
    url: 'https://www.amjmed.com/article/S0002-9343(23)00656-3/fulltext', linkText: 'American Journal of Medicine',
    desc: 'Umbrella review of what actually helps health worker mental health.',
    usedBy: [USE.wound] },
  { name: 'Lukac et al. · Ambient AI Documentation RCT (preprint)', tag: '2025', org: 'research',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12265753/', linkText: 'medRxiv',
    desc: 'Randomized evaluation of ambient AI scribes on documentation and burnout.',
    usedBy: [USE.wound] },
  { name: 'Topaz et al. · Ambient AI Scribe Risks and Safeguards', tag: '2025', org: 'research',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12460601/', linkText: 'npj Digital Medicine',
    desc: 'Failure modes and safeguards for ambient documentation AI.',
    usedBy: [USE.wound, USE.ai07] },
  { name: 'El Arab & Al Moosa · AI Cost-Effectiveness Systematic Review', tag: '2025', org: 'research',
    url: 'https://www.nature.com/articles/s41746-025-01722-y', linkText: 'npj Digital Medicine',
    desc: 'The evidence base for AI saving money is thin and short-horizon.',
    usedBy: [USE.aiBill] },
  { name: 'Holmgren et al. · Ambient AI Scribes and Financial Productivity', tag: '2026', org: 'research',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12789954/', linkText: 'JAMA Network Open',
    desc: 'Scribes helped documentation but did not raise billing productivity.',
    usedBy: [USE.aiBill, USE.ai07] },
  { name: 'Bhatla et al. · Adverse Events After Private Equity Acquisition', tag: '2023', org: 'research',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10751598/', linkText: 'JAMA',
    desc: 'Hospital adverse events rose after private equity takeover.',
    usedBy: [USE.steward] },
  { name: 'Cerullo et al. · Staffing and Outcomes After PE Acquisition', tag: '2024', org: 'research',
    url: 'https://www.acpjournals.org/doi/10.7326/ANNALS-24-03471', linkText: 'Annals of Internal Medicine',
    desc: 'Staffing cuts and outcome changes after acquisition.',
    usedBy: [USE.steward] },

  // — Investigative Journalism & Industry Trackers —
  { name: 'ProPublica · Cigna PXDX Algorithm: 300K Claims Denied (2023)', tag: 'ProPub', org: 'industry',
    url: 'https://www.propublica.org/article/cigna-pxdx-medical-health-insurance-rejection-claims',
    desc: 'Investigation into batch claim denials without chart review.',
    usedBy: [USE.msrc] },
  { name: 'Manatt Health AI Policy Tracker (updated weekly)', tag: 'Manatt', org: 'industry',
    url: 'https://www.manatt.com',
    desc: 'Running tracker of state and federal health AI policy moves.',
    usedBy: [USE.arma] },
  { name: 'Manatt · AI-Enabled Care for Medicare Beneficiaries (2025)', tag: 'Manatt', org: 'industry',
    url: 'https://www.manatt.com/insights/newsletters/health-highlights/ai-enabled-care-is-on-the-rise-for-medicare-beneficiaries-what-payors-and-providers-need-to-know',
    desc: 'What rising AI-enabled care claims mean for payers and providers.',
    usedBy: [USE.aiBill] },
  { name: 'KLAS Research · EHR Market Data', tag: 'KLAS', org: 'industry',
    url: 'https://klasresearch.com',
    desc: 'Vendor performance and market share research built from provider interviews.',
    usedBy: [USE.home] },
  { name: 'KLAS · US Acute Care EHR Market Share 2024', tag: 'KLAS', org: 'industry',
    url: 'https://engage.klasresearch.com/blog/us-acute-care-ehr-market-share-in-2024/805/',
    desc: 'Hospital EHR market share by facility count and by beds.',
    usedBy: [USE.vendors] },
  { name: 'Definitive Healthcare · Top Ambulatory EHR Systems (2025)', tag: 'DefHC', org: 'industry',
    url: 'https://www.definitivehc.com/blog/top-ambulatory-ehr-systems',
    desc: 'Ambulatory EHR market share by installations.',
    usedBy: [USE.vendors] },
  { name: "Becker's · Ambient AI Scribe Market Share (Menlo Ventures, 2025)", tag: '2025', org: 'industry',
    url: 'https://www.beckershospitalreview.com/healthcare-information-technology/ai/ambient-ai-scribes-by-market-share/',
    desc: 'Menlo Ventures sizing of the ambient scribe market, roughly $600M.',
    usedBy: [USE.vendors, USE.ai07] },
  { name: 'Healthcare Dive · PwC: AI Pushing Costs Higher (2026)', tag: 'Dive', org: 'industry',
    url: 'https://www.healthcaredive.com/news/ai-push-healthcare-costs-higher-health-plans-say-pwc/822645/',
    desc: 'Health plan actuaries expect AI to raise the medical cost trend.',
    usedBy: [USE.aiBill] },
  { name: 'Healthcare Dive · Steward Bankruptcy, One Year Later (2025)', tag: 'Dive', org: 'industry',
    url: 'https://www.healthcaredive.com/news/steward-health-care-bankruptcy-one-year-anniversary/747348/',
    desc: 'Where the hospitals and communities landed a year after filing.',
    usedBy: [USE.steward] },
  { name: 'Healthcare Dive · Steward Auction: What Sold, What Closed (2025)', tag: 'Dive', org: 'industry',
    url: 'https://www.healthcaredive.com/news/steward-health-care-auction-what-assets-sold-closed-and-are-still-up-for/725230/',
    desc: 'Asset-by-asset outcome of the Steward hospital auction.',
    usedBy: [USE.steward] },
  { name: 'Healthcare Brew · How Steward Shaped PE in Hospitals (2025)', tag: 'Brew', org: 'industry',
    url: 'https://www.healthcare-brew.com/stories/2025/11/20/steward-health-care-shaped-private-equity-hospitals',
    desc: 'How the collapse changed private equity appetite for hospitals.',
    usedBy: [USE.steward] },
  { name: 'CommonWealth Beacon · When Communities Lose Trust (2025)', tag: 'CWB', org: 'industry',
    url: 'https://commonwealthbeacon.org/health-care/when-communities-lose-trust-one-year-after-steward-healths-bankruptcy-and-the-death-of-two-hospitals/',
    desc: 'Local reporting on the two Steward hospitals that never reopened.',
    usedBy: [USE.steward] },
  { name: "STAT · Physicians Aren't Burning Out, They're Suffering Moral Injury (2018)", tag: 'STAT', org: 'industry',
    url: 'https://www.statnews.com/2018/07/26/physicians-not-burning-out-they-are-suffering-moral-injury/',
    desc: 'The op-ed that moved moral injury into the mainstream.',
    usedBy: [USE.wound] },
  { name: 'NSI · 2026 National Health Care Retention & RN Staffing Report', tag: 'NSI', org: 'industry',
    url: 'https://www.nsinursingsolutions.com/documents/library/nsi_national_health_care_retention_report.pdf',
    desc: 'Turnover and retention benchmarks for hospitals.',
    usedBy: [USE.wound] },
];

// ── Merge, dedupe, sort ──────────────────────────────────────────────────────

function mergeUsedBy(primary, extra) {
  const seen = new Set(primary.map(u => u.label));
  for (const u of extra) {
    if (!seen.has(u.label)) { primary.push({ ...u }); seen.add(u.label); }
  }
  return primary;
}

function displayHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch (e) { return url; }
}

const byKey = new Map();
for (const entry of extractMetricSources()) {
  byKey.set(canonicalKey(entry.url), entry);
}
for (const curated of CURATED) {
  const key = canonicalKey(curated.url);
  const prior = byKey.get(key);
  if (prior) {
    // Curated collides with a metricsConfig source: merge.
    prior.name = curated.name || prior.name;
    prior.tag = curated.tag || prior.tag;
    prior.org = curated.org || prior.org;
    if ((curated.desc || '').length > (prior.desc || '').length) prior.desc = curated.desc;
    if (curated.linkText) prior.linkText = curated.linkText;
    prior.usedBy = mergeUsedBy(curated.usedBy.map(u => ({ ...u })), prior.usedBy);
  } else {
    byKey.set(key, { ...curated, usedBy: curated.usedBy.map(u => ({ ...u })) });
  }
}

const orgOrder = GROUPS.map(g => g.key);
const items = [...byKey.values()]
  .map(item => ({ ...item, linkText: item.linkText || displayHost(item.url) }))
  .sort((a, b) =>
    (orgOrder.indexOf(a.org) - orgOrder.indexOf(b.org)) ||
    a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' })
  );

const groups = GROUPS.map(g => ({
  key: g.key,
  label: g.label,
  items: items.filter(i => i.org === g.key),
}));

module.exports = { groups, items };
