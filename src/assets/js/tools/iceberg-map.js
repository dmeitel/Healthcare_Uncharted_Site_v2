/**
 * The Healthcare Iceberg Map.
 *
 * Lifted out of an inline <script> on 2026-08-22, fifth of the eight tools to
 * move (docs/HU-BUILD-HARDENING-2026-08-22.md). Loaded as type="module": deferred,
 * scoped, cacheable across pages, and visible to `npm run check`.
 *
 * The move also retired this page's six inline onclick attributes. Module scope
 * would have broken them anyway (the functions are no longer global), and inline
 * handlers are exactly what script-src 'unsafe-inline' exists to permit, so they
 * had to go before the CSP can drop it. Node cards, sub-nodes and path rows now
 * carry data-node / data-subnode and are read by one delegated listener each,
 * which also survives the innerHTML rebuilds that replace those elements.
 *
 * Depends on window.HUKit, which the page loads as a classic script beforehand.
 */
'use strict';

/* ── typed DOM helpers ─────────────────────────────────────────────────────────
   The same three the other migrated tools carry. checkJs types querySelectorAll as
   Element and e.target as EventTarget, so .dataset, .style and the offset* box
   metrics all read as unsafe. Narrow once here instead of at every use. Pure
   casts: no behaviour change. */

/** @param {ParentNode} root @param {string} sel @returns {HTMLElement[]} */
const qsa = (root, sel) => /** @type {HTMLElement[]} */ (Array.from(root.querySelectorAll(sel)));
/** @param {Element|EventTarget|null} el @returns {HTMLElement} */
const asEl = el => /** @type {HTMLElement} */ (el);
/** delegated lookup from an event @param {Event} e @param {string} sel */
const hit = (e, sel) => /** @type {HTMLElement | null} */ (asEl(e.target).closest(sel));

const LD=[
  {n:1,t:'Patient Experience',st:'What the patient feels',c:'#4ECDC4',
   nd:[['H','Healthy\nPatient'],['AR','At Risk'],['HR','High Risk'],['ACE','Acute\nEvent'],['REC','Recovery'],['CHR','Chronic\nManagement']]},
  {n:2,t:'Care Settings',st:'Where care happens',c:'#5B9CF6',
   nd:[['HOME','Home /\nSelf Care'],['PCA','Primary\nCare / Clinic'],['URC','Urgent\nCare'],['ED','Emergency\nDepartment'],['IPT','Inpatient'],['PAH','Post-Acute /\nHome Health']]},
  {n:3,t:'Clinical Workflow',st:'Evidence-based pathways',c:'#FF6B9D',
   nd:[['ARR','Arrival'],['TRI','Triage'],['ASS','Assessment'],['ORD','Orders'],['DGN','Diagnostics'],['TRM','Treatment'],['DSP','Disposition'],['ADM','Admit']]},
  {n:4,t:'Operational Workflow',st:'Behind-the-scenes work',c:'#A78BFA',
   nd:[['SCH','Scheduling'],['REG','Registration'],['ELG','Eligibility\nVerification'],['PAU','Prior\nAuthorization'],['BDP','Bed\nPlacement'],['CHD','Care\nHandoff'],['DCP','Discharge\nPlanning']]},
  {n:5,t:'Insurance / Financial',st:'Rules that shape the path',c:'#F6C358',
   nd:[['PLT','Plan Type\n(HMO/PPO)'],['NST','Network\nStatus'],['PAR','Prior Auth\nRequired'],['DDC','Deductible /\nCoinsurance'],['PCS','Patient\nCost Share'],['OPM','Out-of-Pocket\nMaximum']]},
  {n:6,t:'Technology / EHR',st:'Digital foundation',c:'#3FC98A',
   nd:[['EHR','Epic ADT'],['SCHS','Scheduling'],['ORDS','Orders'],['DOC','Documentation'],['RES','Results\nReview'],['BLL','Billing'],['PTP','Patient\nPortal']]},
  {n:7,t:'Data & Metrics',st:'What we measure',c:'#FF8C5A',
   nd:[['AWT','Access /\nWait Time'],['QUA','Quality /\nOutcomes'],['UTL','Utilization /\nLength of Stay'],['EXP','Experience /\nCAHPS'],['FIN','Financial /\nCost'],['OPE','Operational /\nEfficiency'],['WKF','Workforce /\nCapacity']]},
  {n:8,t:'External Ecosystem',st:'Broader environment',c:'#E879F9',
   nd:[['PAY','Payers /\nInsurance'],['PHM','Pharmacy'],['LAB','Labs /\nImaging'],['SPC','Specialists'],['CMR','Community\nResources'],['EMP','Employers'],['PBH','Public\nHealth']]},
];

const ND={
  REG:{t:'Registration / Insurance',l:'Operational Workflow',ln:4,lc:'#A78BFA',
       w:['Patient demographics captured','Insurance eligibility verified','Benefits and cost share determined','Prior auth requirements identified','Financial responsibility estimated','Account created / updated in system'],
       m:[['8m 42s','Avg. Time'],['98.2%','Eligibility Accuracy'],['6.1%','Denial Rate'],['94.3%','Cost Accuracy']],
       actors:'Patient · Registrar · Payer',sys:'Epic ADT · Eligibility API · Payer Portal',
       pain:['Delays in verification impact wait time','Incorrect data leads to claim denials','High patient confusion around cost']},
  H:{t:'Healthy Patient',l:'Patient Experience',ln:1,lc:'#4ECDC4',
     w:['Annual wellness visits and screenings','Vaccinations and preventive care','Active health self-management','No acute active diagnosis','Social determinants shape baseline health'],
     m:[['1.2/yr','Avg. Visits'],['85%','Screen Rate'],['~$400','Annual Cost'],['Low','Risk Level']],
     actors:'Patient · PCP · Public Health Dept',sys:'Patient Portal · Scheduling System · EHR',
     pain:['Access gaps for preventive care','Social determinants not tracked','Care fragmentation over time']},
  ACE:{t:'Acute Event',l:'Patient Experience',ln:1,lc:'#E05555',
       w:['Sudden clinical deterioration or injury','Unplanned care access required immediately','Emergency response may be activated','Clinical acuity determines the pathway','Cost and data generation spike significantly'],
       m:[['$8,400+','Avg. ED Cost'],['72%','Acute Admit Rate'],['4.2h','ED LOS'],['28%','Preventable']],
       actors:'Patient · EMS · ED Physician · RN',sys:'Epic ADT · EMS Systems · ED Tracking Board',
       pain:['High cost and high anxiety for patient','Prior care records often unavailable in ED','Care pathway uncertain until acuity assessed']},
  ED:{t:'Emergency Department',l:'Care Settings',ln:2,lc:'#E05555',
      w:['24/7 open access regardless of payer (EMTALA)','Triage-based prioritization of all patients','Highest clinical data density per hour of any setting','Boarding and capacity are the central operational crisis','Real-time ADT feeds all downstream systems'],
      m:[['4.2h','Median LOS'],['27%','Admit Rate'],['1:4','Nurse Ratio'],['~$38K/day','Inpatient Cost']],
      actors:'Patient · ED Registered Nurse · Emergency Physician · Registrar · Case Manager',sys:'Epic ADT · PACS · EKG · ED Tracking Board',
      pain:['Boarding delays patient flow system-wide','Prior records often absent on arrival','Communication gaps during handoff to inpatient']},
  URC:{t:'Urgent Care',l:'Care Settings',ln:2,lc:'#5B9CF6',
       w:['Walk-in model for non-emergency acute care','Variable insurance acceptance by site','Limited EHR connectivity to primary care','Common escalation point to ED if acuity rises','Increasingly integrated into health system networks'],
       m:[['~30min','Avg. Wait'],['$200-400','Avg. Cost'],['12%','ED Escalation'],['60%+','Cash/Card Pay']],
       actors:'Patient · Nurse Practitioner / Physician Assistant · Medical Assistant',sys:'Practice Management System · EHR · Billing',
       pain:['Record fragmentation from PCP or specialist','Variable insurance acceptance by location','Limited specialist access for complex acute issues']},
  PLT:{t:'Plan Type (HMO / PPO / EPO / HDHP)',l:'Insurance / Financial',ln:5,lc:'#F6C358',
       w:['HMO: Gatekeeper model, narrow network','PPO: Open access, higher premium','EPO: In-network only, no referral required','HDHP: High deductible, HSA eligible','Plan type determines all prior auth and referral rules'],
       m:[['38%','HMO Share'],['44%','PPO Share'],['~$800','Avg. Deductible'],['15%+','Out-of-Pocket Risk']],
       actors:'Employer · Patient · Insurance Plan Admin',sys:'Payer Portal · Benefits Admin Platform',
       pain:['Patient confusion about coverage at point of care','Narrow networks limit access to preferred providers','Prior auth requirements vary widely by plan and service']},
  EHR:{t:'EHR / Epic ADT',l:'Technology / EHR',ln:6,lc:'#3FC98A',
       w:['Patient MRN and demographics central hub','ADT transactions: Admit, Discharge, Transfer events','Real-time bed tracking and hospital census management','Source of truth for clinical data and billing','Interfaces with every downstream clinical system via HL7'],
       m:[['99.9%','Uptime SLA'],['<1s','ADT Speed'],['#1','Market Share'],['100%','Data Coverage']],
       actors:'Registrar · IT · All Clinical Staff · Billers',sys:'HL7 ADT · FHIR R4 APIs · EDI Clearinghouse',
       pain:['Heavy training requirements for all staff','Interface failures create dangerous data gaps','Downtime protocols are operationally complex']},
  ELG:{t:'Eligibility Verification',l:'Operational Workflow',ln:4,lc:'#A78BFA',
       w:['Real-time eligibility check through clearinghouse','Confirms active coverage and network status','Identifies deductible accumulation and benefit limits','Flags potential prior auth requirements upfront','Connects payer rules to clinical workflow in real time'],
       m:[['<30s','Verify Speed'],['2.3%','Error Rate'],['$4,200','Cost per Denial'],['91%','First-Pass Rate']],
       actors:'Registrar · Patient Access Staff · Payer',sys:'Eligibility API · Availity · Payer Portals',
       pain:['Payer portal fragmentation slows verification','Real-time data accuracy varies by payer','Staff training burden is high and turnover is common']},
  AWT:{t:'Access & Wait Time',l:'Data & Metrics',ln:7,lc:'#FF8C5A',
       w:['Door-to-provider time in ED and urgent care','Third-next-available appointment (PCMH standard)','Referral completion rates and wait times','Phone abandonment rate (scheduling access)','Time from referral to specialist first appointment'],
       m:[['42 min','Avg. ED Wait'],['14 days','Specialist Appointment'],['85%','Access Score'],['6.2%','Call Abandonment']],
       actors:'Patient · Scheduling Staff · Admin Leadership',sys:'Scheduling System · Epic Reporting · Dashboards',
       pain:['Access gap is largest driver of care avoidance','Data fragmented across scheduling systems','Wait time metrics often not tied to outcome data']},
  PAY:{t:'Payers / Insurance',l:'External Ecosystem',ln:8,lc:'#E879F9',
       w:['Commercial insurance, Medicare, Medicaid, self-pay','Adjudicates all claims from every care setting','Sets network contracts and reimbursement rates','Manages prior auth, formulary, and coverage rules','Increasingly driving care management programs'],
       m:[['$4.1T','Annual Spend'],['8-12%','Denial Rate'],['180 days','Avg. AR Days'],['32%','Managed Medicare']],
       actors:'Payer Analyst · Contracting · Member Services',sys:'Payer Claims Platform · Clearinghouse · State MMIS',
       pain:['Inconsistent prior auth rules across payers','Claim denial management consumes provider resources','Opaque contracting limits provider revenue planning']},
  AR:{t:'At-Risk Patient',l:'Patient Experience',ln:1,lc:'#4ECDC4',
      w:['86 million Americans have prediabetes; 8 in 10 are unaware (CDC, 2023)','Risk stratification identifies elevated but pre-diagnosis conditions','Social determinants of health are the primary upstream risk drivers (WHO)','Preventive interventions at this stage reduce disease progression by 58% (NIDDK/CDC)','Care gaps in this tier drive avoidable downstream utilization and cost'],
      m:[['86M','At-Risk Americans (CDC)'],['58%','Progression Prevention Rate (NIDDK)'],['~$3,400','Avg Annual Cost (AHRQ)'],['1 in 3','Will Progress to Chronic Disease (CDC)']],
      actors:'Patient · Primary Care Physician · Care Manager',sys:'EHR · Risk Stratification Tool · Patient Portal',
      pain:['Risk factors rarely trigger proactive outreach from the care system','Social determinants of health are seldom documented in the EHR','26-day average wait for preventive care appointments slows timely intervention (Merritt Hawkins)']},
  HR:{t:'High-Risk Patient',l:'Patient Experience',ln:1,lc:'#4ECDC4',
      w:['Top 5% of patients account for 50% of all healthcare expenditure (AHRQ, 2022)','Multiple chronic conditions drive frequent unplanned care episodes','Case management and care coordination are the critical intervention points','ED visits and hospitalizations are the primary downstream cost drivers','Medication non-adherence is prevalent, linked to 125,000 deaths annually (NEHI)'],
      m:[['Top 5%','Accounts for 50% of Spend (AHRQ)'],['4.5x','Higher ED Utilization vs. Average (CDC)'],['68%','Have 2+ Chronic Conditions (CMS)'],['$35,000+','Avg Annual Cost (AHRQ)']],
      actors:'Patient · Primary Care Physician · Case Manager · Specialist',sys:'Risk Stratification · Care Management Platform · EHR',
      pain:['Fragmented care across multiple providers without shared records creates dangerous gaps','Medication reconciliation failures create preventable polypharmacy risks','Readmission rates are 3x higher without active care management (CMS)']},
  REC:{t:'Recovery',l:'Patient Experience',ln:1,lc:'#4ECDC4',
       w:['Post-acute transitions are the highest-risk period for readmission (CMS, 2023)','30-day hospital readmission rate is 15.7% nationally (CMS, 2023)','Discharge instructions are misunderstood by 50-60% of patients (AHRQ)','A 7-day follow-up appointment reduces readmission risk by 25% (CMS)','Social support, medication access, and transportation are critical recovery factors'],
       m:[['15.7%','30-Day Readmit Rate (CMS)'],['50-60%','Misunderstand Discharge Instructions (AHRQ)'],['7 days','Follow-Up Target Window (CMS)'],['$26,000','Avg Cost of Readmission (CMS)']],
       actors:'Patient · Discharge Nurse · Case Manager · Primary Care Physician',sys:'EHR · Patient Portal · Transition Care Platform',
       pain:['Discharge instructions are often too complex or inaccessible for patients','Primary care follow-up appointments are frequently unavailable within the critical 7-day window','CMS penalizes hospitals up to 3% of base payments for excess readmission rates']},
  CHR:{t:'Chronic Disease Management',l:'Patient Experience',ln:1,lc:'#4ECDC4',
       w:['6 in 10 Americans have at least one chronic disease (CDC, 2023)','Chronic conditions account for 90% of the $4.5 trillion US healthcare spend (CDC)','Diabetes, heart disease, obesity, and cancer are the four top cost drivers (CDC)','Self-management education reduces hospitalizations by up to 50% (AHRQ)','Coordinating care across multiple specialists is essential but rarely optimized'],
       m:[['6 in 10','Americans with Chronic Disease (CDC)'],['90%','Of $4.5T Spend (CDC)'],['4 avg','Medications per Chronic Patient (IQVIA)'],['50%','Hospitalization Reduction with Management (AHRQ)']],
       actors:'Patient · Primary Care Physician · Care Coordinator · Specialist · Pharmacist',sys:'EHR · Care Management Platform · Remote Monitoring',
       pain:['Siloed specialist care creates medication errors and redundant testing','Insurance prior authorization delays access to specialty medications','Burnout and low health literacy reduce patient self-management adherence']},
  HOME:{t:'Home / Self Care',l:'Care Settings',ln:2,lc:'#5B9CF6',
        w:['77% of adults prefer to age at home as long as possible (AARP, 2023)','The home-based care market exceeds $100 billion annually (CMS, 2023)','Remote patient monitoring reduces hospital readmissions by 26% (AHA, 2022)','Self-care gaps drive 80% of chronic disease worsening episodes (WHO)','Medication non-adherence alone costs $528 billion in avoidable spend annually (NEHI)'],
        m:[['77%','Prefer Home-Based Aging (AARP)'],['$100B+','Annual Home Care Market (CMS)'],['26%','Readmission Reduction via RPM (AHA)'],['50M+','Americans Receiving Home Care (NAHC)']],
        actors:'Patient · Family Caregiver · Home Health Aide · Primary Care Physician',sys:'Remote Patient Monitoring · Patient Portal · Telehealth Platform',
        pain:['Insurance coverage for home care services is limited and inconsistently applied','Caregiver burden leads to patient deterioration without formal system support','Technology barriers prevent older adults from using digital health tools effectively']},
  PCA:{t:'Primary Care / Clinic',l:'Care Settings',ln:2,lc:'#5B9CF6',
       w:['Primary care is the foundation of the healthcare system, yet chronically underfunded (AAFP)','Every $1 invested in primary care saves $13 in downstream costs (AHRQ)','Average time with a primary care physician per visit: 15-20 minutes (Medscape)','Primary care shortages affect 100+ million Americans in federally designated shortage areas (HRSA, 2023)','26-day average wait time for new patient primary care appointments (Merritt Hawkins, 2023)'],
       m:[['$1 → $13','ROI on Primary Care (AHRQ)'],['26 days','Avg New Patient Wait (Merritt Hawkins)'],['100M+','In Primary Care Shortage Areas (HRSA)'],['6 min','Avg Face-Time per Concern (Medscape)']],
       actors:'Patient · Primary Care Physician · Nurse Practitioner · Medical Assistant',sys:'EHR · Scheduling System · Lab Interface · Referral Management',
       pain:['Chronic understaffing reduces time per patient below clinical adequacy thresholds','Administrative burden (prior auths, documentation) consumes 50% of physician time (AMA)','Rural and low-income communities face severe access gaps with no viable alternatives']},
  IPT:{t:'Inpatient (Hospital)',l:'Care Settings',ln:2,lc:'#5B9CF6',
       w:['36.2 million inpatient hospital stays occur annually in the United States (AHA, 2023)','Average inpatient admission cost: $15,734 per stay (AHA, 2023)','Inpatient nursing ratios and physician coverage are the primary quality outcome drivers','Adverse events affect 1 in 10 hospital patients during their stay (WHO, 2023)','Real-time ADT feeds, bed management, and clinical workflows all intersect in inpatient care'],
       m:[['36.2M','Annual Inpatient Stays (AHA)'],['$15,734','Avg Admission Cost (AHA)'],['1 in 10','Patients Experience an Adverse Event (WHO)'],['4.5 days','Avg Length of Stay (CMS)']],
       actors:'Patient · Hospitalist · Hospital Physician · Registered Nurse · Case Manager',sys:'EHR · Clinical Decision Support · Bed Management System · PACS',
       pain:['Hospital-acquired infections affect 1.7 million patients per year (CDC)','Boarding patients in the ED delays inpatient placement and worsens clinical outcomes','Discharge delays waste an estimated $1.8 billion in bed capacity annually (AHRQ)']},
  PAH:{t:'Post-Acute / Home Health',l:'Care Settings',ln:2,lc:'#5B9CF6',
       w:['Post-acute care includes skilled nursing facilities, home health, and rehabilitation (CMS)','23% of skilled nursing facility patients are readmitted to the hospital within 30 days (MedPAC, 2023)','Medicare Part A covers up to 100 days of skilled nursing care after hospitalization','Home health use reduces hospitalization risk by 26% compared to SNF placement (JAMA)','Transitions from inpatient to post-acute care are among the highest-risk handoffs in healthcare'],
       m:[['23%','SNF 30-Day Readmit Rate (MedPAC)'],['3.5M','Annual Medicare Home Health Users (CMS)'],['$300/day','Avg SNF Medicare Cost (CMS)'],['26%','Hospitalization Risk Reduction via Home Health (JAMA)']],
       actors:'Patient · Skilled Nursing Facility Staff · Home Health Registered Nurse · Case Manager',sys:'EHR · Referral Management · Home Health Platform · ADT Feed',
       pain:['Inadequate information transfer at hospital discharge drives preventable readmissions','Skilled nursing facility staffing shortages lead to care quality gaps and infections','Medicare SNF coverage ends at 100 days, leaving patients with significant financial exposure']},
  ARR:{t:'Patient Arrival',l:'Clinical Workflow',ln:3,lc:'#FF6B9D',
       w:['140 million emergency department visits occur annually in the United States (CDC, 2023)','Arrival mode (walk-in, EMS, transfer) determines the initial triage pathway','Time from arrival to registration directly impacts triage, treatment, and satisfaction scores','Patient volume peaks between 10am–2pm and 6pm–10pm (ACEP)','Ambulance diversion affects 70% of hospitals during peak capacity periods (ACEP)'],
       m:[['140M','Annual ED Visits (CDC)'],['2x','Peak vs. Off-Peak Volume Ratio (ACEP)'],['18 min','Avg Door-to-Triage Time (CMS)'],['70%','Hospitals Experience Diversion (ACEP)']],
       actors:'Patient · Emergency Medical Services · ED Charge Nurse · Registrar · Security',sys:'ED Tracking Board · EMS Interface · Epic ADT',
       pain:['Overcrowding at arrival delays triage for high-acuity patients and degrades safety','No universal patient identifier leads to duplicate records on every arrival','EMS-to-ED communication gaps result in delayed treatment initiation for critical patients']},
  TRI:{t:'Triage',l:'Clinical Workflow',ln:3,lc:'#FF6B9D',
       w:['Emergency Severity Index (ESI) is used by 97% of US emergency departments (ACEP, 2023)','The 5-level ESI classifies patients from immediate (ESI-1) to non-urgent (ESI-5)','Triage nurses assess vitals, chief complaint, and resource need in under 5 minutes','Under-triage rate in EMS is 6-12%; over-triage rate reaches 32-54% (NAEMSP/Journal of Trauma)','Time-to-triage is a CMS quality metric directly tied to hospital reimbursement'],
       m:[['97%','Emergency Departments Using ESI (ACEP)'],['<5 min','Target Triage Completion Time (CMS)'],['6-12%','Under-Triage Rate (NAEMSP)'],['15%','ED Volume at ESI Level 1-2 (ACEP)']],
       actors:'Triage Registered Nurse · Charge Nurse · Emergency Physician · Patient',sys:'ED Tracking Board · EHR · Triage Documentation System',
       pain:['Triage nurse shortages extend time-to-triage beyond safe clinical thresholds','Patients leave without being seen (LWBS) when triage queues exceed 30 minutes','Inconsistent triage accuracy creates acuity mismatch and misallocation of resources']},
  ASS:{t:'Clinical Assessment',l:'Clinical Workflow',ln:3,lc:'#FF6B9D',
       w:['Full clinical assessment integrates subjective complaints with objective physical findings','SOAP note format (Subjective, Objective, Assessment, Plan) is the documentation standard','Risk stratification tools such as HEART Score or CURB-65 guide clinical decision-making','Time from triage to provider assessment (door-to-doctor) averages 37 minutes nationally (CMS, 2023)','Assessment quality is the primary predictor of diagnostic accuracy and care pathway appropriateness'],
       m:[['37 min','Avg Door-to-Doctor Time (CMS)'],['85%','Assessment-to-Order Accuracy (AHRQ)'],['8-12 min','Avg Assessment Duration (ACEP)'],['30%','Cases Reassessed after Initial Orders (AHA)']],
       actors:'Emergency Physician · Registered Nurse · Advanced Practice Provider · Patient',sys:'EHR · Clinical Decision Support · Order Entry System',
       pain:['Interruptions during assessment lead to documentation errors and missed clinical findings','Cognitive overload from high patient volumes degrades clinical decision quality','Incomplete prior history forces repeated workups and extends time to diagnosis']},
  ORD:{t:'Orders (Labs, Imaging, Medications)',l:'Clinical Workflow',ln:3,lc:'#FF6B9D',
       w:['Computerized provider order entry (CPOE) reduces medication errors by 55-80% (AHRQ)','Order sets standardize evidence-based care pathways across clinical teams','Every order triggers downstream workflows: lab, imaging, pharmacy, and nursing','Order duplication and unnecessary testing contribute to $750 billion in annual waste (National Academy of Medicine)','Clinical decision support alerts fire on nearly every order but are overridden 90%+ of the time (JAMIA)'],
       m:[['55-80%','Error Reduction with CPOE (AHRQ)'],['$750B','Annual Diagnostic Waste (NAS)'],['90%+','CDS Alert Override Rate (JAMIA)'],['12-15','Avg Orders per ED Encounter (ACEP)']],
       actors:'Physician · Pharmacist · Registered Nurse · Lab Technician · Radiology Technician',sys:'CPOE · Clinical Decision Support · Pharmacy System · LIS · PACS',
       pain:['Alert fatigue from excessive CDS notifications leads to missed critical safety warnings','Order sets lag behind clinical evidence updates by months to years','Duplicate orders from multiple providers waste resources and delay patient discharge']},
  DGN:{t:'Diagnostics (Labs / Imaging)',l:'Clinical Workflow',ln:3,lc:'#FF6B9D',
       w:['14 billion laboratory tests are performed annually in the United States (CMS, 2023)','Laboratory results inform 70% of all clinical decisions made by physicians (AACC, 2023)','Point-of-care testing reduces result turnaround time from hours to minutes','The medical imaging market exceeds $30 billion annually in revenue (IBIS World, 2023)','Abnormal result notification failures are a leading cause of diagnostic error (AHRQ)'],
       m:[['14B','Annual Lab Tests (CMS)'],['70%','Decisions Driven by Lab Data (AACC)'],['45 min','Avg Lab Turnaround (CAP)'],['$30B','Annual Imaging Market (IBIS World)']],
       actors:'Physician · Lab Technician · Radiologist · Pathologist · Registered Nurse',sys:'Laboratory Information System · PACS · CPOE · HL7 Interface · EHR',
       pain:['Critical result notification failures lead to delayed treatment of life-threatening conditions','Over-testing drives costs without commensurate clinical benefit or improved outcomes','Imaging report turnaround time varies by 10x between institutions (RSNA)']},
  TRM:{t:'Treatment / Intervention',l:'Clinical Workflow',ln:3,lc:'#FF6B9D',
       w:['Treatment plans integrate diagnostic findings, clinical guidelines, and patient preferences','Evidence-based order sets reduce care variation and improve measurable outcomes (CMS)','Medication administration is the highest-risk step in the clinical workflow (ISMP)','1.5 million preventable medication errors occur annually in US hospitals (Institute of Medicine)','Real-time clinical documentation captures every intervention for billing and quality review'],
       m:[['1.5M','Preventable Medication Errors per Year (IOM)'],['87%','Clinical Guideline Adherence Rate (CMS)'],['5-7 steps','Avg Medication Verification Steps (ISMP)'],['23%','Cases Deviate from Evidence Pathways (AHRQ)']],
       actors:'Physician · Pharmacist · Registered Nurse · Respiratory Therapist · Patient',sys:'EHR · Electronic Medication Administration Record · Pharmacy System · Clinical Decision Support',
       pain:['Medication reconciliation failures at care transitions cause preventable patient harm','Patient-reported allergies are inconsistently captured and shared across systems','Treatment delays from prior authorization requirements for inpatient therapies are common']},
  DSP:{t:'Disposition',l:'Clinical Workflow',ln:3,lc:'#FF6B9D',
       w:['Disposition determines whether a patient is admitted, discharged, or transferred','27% of emergency department visits result in hospital admission (CDC, 2023)','Disposition delays are the primary driver of ED boarding and system-wide throughput problems','Bed availability, insurance status, and clinical acuity all shape the disposition decision','Case management involvement at disposition reduces 30-day readmission by 20% (AHA)'],
       m:[['27%','ED Visits Leading to Admission (CDC)'],['4.2h','Avg ED Length of Stay (CMS)'],['20%','Readmission Reduction with Case Management (AHA)'],['18%','Patients Leave Against Medical Advice (AHRQ)']],
       actors:'Physician · Case Manager · Social Worker · Charge Nurse · Patient',sys:'EHR · Bed Management System · Discharge Planning Tool',
       pain:['Boarding admitted patients in the ED for hours blocks incoming critical cases','Lack of post-acute bed availability forces medically unnecessary inpatient admissions','Insurance denial at point of disposition delays discharge and wastes significant resources']},
  ADM:{t:'Admission',l:'Clinical Workflow',ln:3,lc:'#FF6B9D',
       w:['Inpatient admission triggers full registration, insurance verification, and care planning','Observation versus inpatient status has significant financial implications for Medicare patients','Physician admission orders set the clinical plan and all nursing care protocols','Bed assignment initiates bed management, environmental services, and transport workflows','Admission documentation is the foundation for all downstream clinical and billing processes'],
       m:[['36.2M','Annual Inpatient Admissions (AHA)'],['2-4h','Avg ED-to-Inpatient Bed Time (AHA)'],['23%','Admitted as Observation Status (CMS)'],['$1,500','Cost Differential: Observation vs. Inpatient (CMS)']],
       actors:'Attending Physician · Emergency Physician · Registered Nurse · Case Manager · Registrar',sys:'EHR · ADT System · Bed Management System · Utilization Review Platform',
       pain:['Observation versus inpatient status confusion leaves patients with unexpected large bills','Bed placement delays extend ED boarding well beyond safe clinical limits','Redundant documentation at admission consumes significant clinical time (physicians spend 49% of time on EHR, Annals)']},
  SCH:{t:'Scheduling',l:'Operational Workflow',ln:4,lc:'#A78BFA',
       w:['Average wait time for a new patient appointment: 26 days nationally (Merritt Hawkins, 2023)','Appointment no-show rates average 18-23% across healthcare settings (MGMA)','Scheduling is the first patient touchpoint and sets all downstream experience expectations','Intelligent scheduling algorithms can reduce no-show rates by 30% (NEJM Catalyst)','Referral-to-specialist wait times also average 26 days nationally (Merritt Hawkins)'],
       m:[['26 days','Avg New Patient Wait (Merritt Hawkins)'],['18-23%','Appointment No-Show Rate (MGMA)'],['30%','No-Show Reduction with Smart Scheduling (NEJM Catalyst)'],['$150','Avg Cost of a Missed Appointment (MGMA)']],
       actors:'Patient · Scheduling Staff · Physician · Office Manager',sys:'Scheduling System · EHR · Patient Portal · Referral Management',
       pain:['Siloed scheduling systems across departments prevent efficient care coordination','No-show rates waste clinical capacity and directly reduce provider revenue','After-hours scheduling access is unavailable at the majority of practices (ACEP)']},
  BDP:{t:'Bed Placement',l:'Operational Workflow',ln:4,lc:'#A78BFA',
       w:['Bed management is the central operational bottleneck in hospital throughput','Average time from admission order to bed assignment: 2.4 hours (AHA)','Real-time bed tracking through the ADT system drives housekeeping and transport workflows','Predictive bed management tools can reduce hold times by up to 40% (AHA, 2022)','Intensive care unit capacity determines the hospital\'s ability to handle patient surge'],
       m:[['2.4h','Avg Admission-to-Bed Time (AHA)'],['40%','Hold Time Reduction with Predictive Tools (AHA)'],['$1,800','Cost per ED Boarding Hour (ACEP)'],['70%','Hospitals at or Above 85% Occupancy (AHA)']],
       actors:'Bed Board Coordinator · Charge Nurse · Environmental Services · Patient Transport',sys:'Bed Management System · ADT · Housekeeping Workflow System · Epic ADT',
       pain:['Boarding patients in the ED blocks access for incoming emergencies','Delayed discharges create artificial bed unavailability even when rooms are physically available','ICU overflow forces critical patients into step-down units with reduced monitoring capability']},
  CHD:{t:'Care Handoff',l:'Operational Workflow',ln:4,lc:'#A78BFA',
       w:['80% of serious medical errors involve communication failures during handoffs (Joint Commission)','The average patient experiences up to 30 handoffs during a 4-day hospital stay (Journal of Healthcare Quality)','Standardized handoff tools such as SBAR and I-PASS reduce errors by 30% (NEJM)','Nurse-to-nurse bedside handoff improves patient engagement and measurable safety outcomes (Journal of Nursing Care Quality)','Transitions between care settings are the highest-risk moments across the entire care continuum'],
       m:[['80%','Errors Involve Communication Failures (Joint Commission)'],['30','Avg Handoffs per 4-Day Stay (JHQ)'],['30%','Error Reduction with Standardized Tools (NEJM)'],['1 in 5','Patients Harmed During Care Transitions (AHRQ)']],
       actors:'Outgoing Nurse · Incoming Nurse · Physician · Patient · Family Member',sys:'SBAR Template · EHR · Secure Messaging · ADT Notification System',
       pain:['Verbal-only handoffs without structured tools lead to critical information loss','Time pressure during handoffs reduces thoroughness and introduces avoidable error','Cross-setting handoffs (ED to ICU, hospital to skilled nursing facility) lack standardized protocols']},
  DCP:{t:'Discharge Planning',l:'Operational Workflow',ln:4,lc:'#A78BFA',
       w:['Discharge planning must begin at admission under CMS Conditions of Participation requirements','Effective discharge planning reduces 30-day readmissions by 20-30% (AHA)','Case managers coordinate post-acute placement, home health services, and follow-up appointments','Social determinants of health (transportation, housing) affect 40% of discharge plans (AHRQ)','Discharge against medical advice occurs in 1-2% of cases and carries a 3x readmission risk'],
       m:[['20-30%','Readmission Reduction with Planning (AHA)'],['4-6h','Avg Discharge Planning Time per Case (ACMA)'],['1-2%','Discharge Against Medical Advice Rate (AHA)'],['40%','Cases Affected by SDOH in Discharge Planning (AHRQ)']],
       actors:'Case Manager · Social Worker · Discharge Planner · Physician · Patient',sys:'EHR · Referral Management · SNF and Home Health Database · Discharge Documentation',
       pain:['Skilled nursing facility and home health shortages delay medically appropriate discharges','Social isolation and caregiver absence are not systematically identified or addressed','Payer authorization requirements for post-acute services slow placement by 1-3 days']},
  PAU:{t:'Prior Authorization',l:'Operational Workflow',ln:4,lc:'#A78BFA',
       w:['46 million prior authorization requests were submitted to payers in 2022 (AMA, 2023)','93% of physicians report care delays caused by prior authorization requirements (AMA, 2023)','1 in 4 physicians report a patient experienced a serious adverse event due to a prior auth delay (AMA)','CMS final rule mandates a 72-hour decision timeline for urgent prior authorization requests (CMS, 2024)','Electronic prior authorization can reduce processing time by 69% compared to manual methods (CAQH)'],
       m:[['46M','Annual Prior Auth Requests (AMA)'],['93%','Physicians Report Care Delays (AMA)'],['1 in 4','Physicians Report Adverse Event from Delay (AMA)'],['69%','Time Reduction with Electronic PA (CAQH)']],
       actors:'Physician · Prior Authorization Specialist · Payer Medical Director · Patient',sys:'Payer Portal · Electronic Prior Authorization System · EHR · Fax (Legacy)',
       pain:['Manual prior auth processes consume 14+ staff hours per physician per week (AMA)','Lack of real-time authorization status visibility delays patient scheduling','Retrospective denials after care is already delivered create significant uncompensated cost']},
  NST:{t:'Network Status',l:'Insurance / Financial',ln:5,lc:'#F6C358',
       w:['In-network versus out-of-network status determines patient cost share dramatically','1 in 5 patients received a surprise bill from an out-of-network provider in 2022 (JAMA)','The No Surprises Act (2022) protects patients from most emergency surprise billing (CMS)','Provider directory accuracy averages only 52% nationally, misleading patients about coverage (CMS, 2022)','Network tiering creates multiple cost-share levels within a single insurance plan'],
       m:[['1 in 5','Received a Surprise Bill (JAMA)'],['52%','Provider Directory Accuracy Rate (CMS)'],['300%+','Cost Differential: In vs. Out of Network (KFF)'],['2022','Year No Surprises Act Took Effect']],
       actors:'Patient · Insurance Plan · Provider Contracting Team · Registrar',sys:'Payer Portal · Provider Directory · Eligibility API · EHR',
       pain:['Provider directory inaccuracies lead patients to incorrectly believe out-of-network providers are covered','Surprise billing still occurs in many cases not covered by the No Surprises Act','Network adequacy requirements are inconsistently enforced across state regulators']},
  PAR:{t:'Prior Auth Required',l:'Insurance / Financial',ln:5,lc:'#F6C358',
       w:['Prior authorization is required for 1 in 3 outpatient services (CAQH, 2023)','Approval rates average 88-92% of all requests, raising questions about clinical utility (CMS)','Urgent requests must be decided within 72 hours under CMS rules effective 2024','Gold-carding programs exempt consistently high-performing physicians from authorization requirements','Medicare Advantage prior authorization denial rate: 10.7% of requests (OIG, 2023)'],
       m:[['1 in 3','Outpatient Services Require Prior Auth (CAQH)'],['88-92%','Overall Prior Auth Approval Rate (CMS)'],['10.7%','Medicare Advantage Denial Rate (OIG)'],['72h','Urgent Decision Deadline (CMS 2024)']],
       actors:'Physician · Prior Authorization Coordinator · Payer Utilization Reviewer · Patient',sys:'Payer Portal · Electronic Prior Authorization · FHIR APIs · EHR Integration',
       pain:['High approval rates suggest minimal clinical utility paired with maximum administrative burden','Inconsistent rules across hundreds of payers make compliance management extremely complex','Retrospective denials after service delivery leave providers uncompensated for care already given']},
  DDC:{t:'Deductible / Coinsurance',l:'Insurance / Financial',ln:5,lc:'#F6C358',
       w:['Average deductible for employer-sponsored insurance: $1,735 in 2023 (KFF)','28% of adults skipped needed care due to cost, even while insured (KFF, 2023)','Coinsurance (a percentage of cost after the deductible) adds significant unpredictability','High-deductible health plans enroll 55% of all covered workers (KFF, 2023)','Deductible accumulation tracking is a critical function of real-time eligibility verification'],
       m:[['$1,735','Avg Employer Plan Deductible (KFF)'],['28%','Adults Who Skipped Care Due to Cost (KFF)'],['55%','Workers Enrolled in High-Deductible Plans (KFF)'],['$5,000+','Avg Family Deductible (KFF)']],
       actors:'Patient · Employer · Insurance Plan · Registrar · Financial Counselor',sys:'Eligibility API · Benefits Administration Platform · Patient Financial Responsibility Tool',
       pain:['Patients unaware of their deductible status arrive at the point of care without financial preparation','High deductibles create access barriers functionally equivalent to being uninsured for routine care','Cost estimation tools are unavailable or inaccurate at 72% of US hospitals (AHA)']},
  PCS:{t:'Patient Cost Share',l:'Insurance / Financial',ln:5,lc:'#F6C358',
       w:['$88 billion in medical debt is held by US consumers (Consumer Financial Protection Bureau, 2023)','41% of US adults carry some form of healthcare debt (KFF / Washington Post, 2022)','Medical debt is the leading cause of personal bankruptcy filings in the United States','Financial counseling at the point of service reduces bad debt by 30-40% (HFMA)','Charity care and financial assistance programs cover $16 billion in annual patient costs (AHA)'],
       m:[['$88B','Consumer Medical Debt (CFPB)'],['41%','Adults with Healthcare Debt (KFF)'],['$16B','Annual Charity Care Provided (AHA)'],['30-40%','Bad Debt Reduction with Counseling (HFMA)']],
       actors:'Patient · Financial Counselor · Billing Staff · Payer · Hospital',sys:'Patient Financial Responsibility Tool · Billing System · Collections Platform',
       pain:['Lack of price transparency prevents patients from making informed financial decisions before care','Medical debt disproportionately harms Black, Latino, and low-income communities','Surprise bills from out-of-network providers frequently bypass standard cost-share protections']},
  OPM:{t:'Out-of-Pocket Maximum',l:'Insurance / Financial',ln:5,lc:'#F6C358',
       w:['2024 ACA individual out-of-pocket maximum: $9,450 per year (HHS, 2023)','Once the out-of-pocket maximum is reached, the insurer covers 100% of in-network covered services','Only 7% of insured adults reach their out-of-pocket maximum in any given year (KFF)','Cost-sharing reductions lower the out-of-pocket max for qualifying ACA plan enrollees','Traditional Medicare has no annual out-of-pocket maximum without supplemental coverage'],
       m:[['$9,450','2024 ACA Individual OOP Maximum (HHS)'],['7%','Insured Adults Who Reach OOP Max (KFF)'],['$18,900','2024 Family OOP Maximum (HHS)'],['No Cap','Traditional Medicare Without Supplement']],
       actors:'Patient · Insurer · Financial Counselor · Benefits Administrator',sys:'Benefits Administration Platform · Payer Portal · Eligibility API',
       pain:['Medicare beneficiaries face unlimited out-of-pocket exposure without supplemental (Medigap) coverage','Real-time out-of-pocket maximum accumulation tracking is unavailable at most provider settings','High out-of-pocket maximums deter necessary care even among patients who urgently need it']},
  SCHS:{t:'Scheduling System (EHR)',l:'Technology / EHR',ln:6,lc:'#3FC98A',
        w:['EHR-integrated scheduling manages appointment templates, provider availability, and patient access rules','Epic Cadence and Cerner Scheduling are the dominant platforms in US health systems (HIMSS, 2023)','Patient portal scheduling reduces scheduling phone call volume by 30-50% (ONC, 2022)','Predictive scheduling tools can fill cancellation slots proactively to offset no-show impact','Schedule density directly determines access metrics and practice financial performance'],
        m:[['30-50%','Phone Volume Reduction with Portal Scheduling (ONC)'],['85%','EHR-Integrated Scheduling Adoption (HIMSS)'],['18%','Avg No-Show Rate (MGMA)'],['10 min','Avg Scheduling Call Duration (MGMA)']],
        actors:'Scheduling Staff · Patient · Provider · Practice Manager',sys:'Epic Cadence · Cerner Scheduling · Patient Portal · Referral Management',
        pain:['Specialty scheduling templates are complex to build and require ongoing maintenance','No-show prediction models are not yet universally adopted across health systems','Cross-departmental scheduling coordination remains highly fragmented even within single organizations']},
  ORDS:{t:'Orders System (CPOE)',l:'Technology / EHR',ln:6,lc:'#3FC98A',
        w:['Computerized provider order entry (CPOE) adoption has reached 96% of US hospitals (ONC/CMS, 2022)','Clinical decision support fires alerts on virtually every order entry event','Order sets reduce clinical variation and improve protocol adherence across care teams (AHRQ)','Medication order reconciliation at care transitions is the highest-risk CPOE function (ISMP)','Order transmission to pharmacy, lab, and radiology occurs via HL7 interface in near-real-time'],
        m:[['96%','US Hospital CPOE Adoption (ONC)'],['55-80%','Medication Error Reduction (AHRQ)'],['90%+','CDS Alert Override Rate (JAMIA)'],['<5s','Target Order Transmission Time (HL7)']],
        actors:'Physician · Pharmacist · Registered Nurse · Lab Technician · Radiology Staff',sys:'Epic CPOE · CDS Hooks · HL7 Interface · Pharmacy System · Laboratory Information System',
        pain:['Alert fatigue reduces clinician responsiveness to critical safety-related warnings','Order set content maintenance lags behind clinical guideline updates by months to years','Interface failures between CPOE and downstream systems create dangerous data gaps']},
  DOC:{t:'Clinical Documentation',l:'Technology / EHR',ln:6,lc:'#3FC98A',
       w:['Physicians spend 49% of their work time on EHR documentation (Annals of Internal Medicine)','For every 1 hour of patient care, physicians spend 2 hours on documentation (AMA)','Ambient AI documentation tools reduce physician documentation time by up to 50% (Nuance)','Clinical documentation improvement (CDI) directly impacts billing accuracy and quality scores','Documentation quality is the primary determinant of coding accuracy and revenue integrity'],
       m:[['49%','Physician Time Spent on EHR (Annals of Internal Medicine)'],['2h','Documentation per 1h of Patient Care (AMA)'],['50%','Time Reduction with Ambient AI (Nuance)'],['72%','Physician Burnout Linked to Documentation (Medscape)']],
       actors:'Physician · Registered Nurse · Medical Scribe · Clinical Documentation Specialist · Coder',sys:'Epic Notes · Ambient AI Documentation · Dragon Medical · Clinical Documentation Improvement Platform',
       pain:['Documentation burden is the number one driver of physician burnout (Medscape, 2023)','Copy-paste behavior in EHR notes propagates clinical errors across encounters','Documentation requirements for billing and quality often do not align with clinical care workflows']},
  RES:{t:'Results Review',l:'Technology / EHR',ln:6,lc:'#3FC98A',
       w:['Lab and imaging results flow into the EHR via HL7 interfaces in near-real-time','Critical result notification failures are a leading cause of diagnostic error (AHRQ)','Physicians are notified of 60+ results per day on average in inpatient settings (JAMA)','Unaddressed pending results at discharge are a leading source of avoidable medical errors','AI-assisted result triage tools are emerging to prioritize critical findings for physician review (RSNA)'],
       m:[['60+','Daily Result Notifications per Inpatient Physician (JAMA)'],['23%','Critical Results Without Timely Follow-Up (AHRQ)'],['45 min','Avg Lab Result Turnaround (CAP)'],['3h','Avg Radiology Read Turnaround (RSNA)']],
       actors:'Physician · Registered Nurse · Lab Staff · Radiologist · Patient',sys:'EHR Result Inbox · Laboratory Information System Interface · PACS · Critical Value Alert System',
       pain:['Information overload from high result volumes leads to missed critical clinical findings','Pending results at discharge are not consistently tracked or communicated to patients and PCPs','Radiologist shortages create imaging interpretation backlogs at many facilities nationwide (RSNA)']},
  BLL:{t:'Billing / Revenue Cycle',l:'Technology / EHR',ln:6,lc:'#3FC98A',
       w:['US hospitals lose an estimated $262 billion annually to billing errors and claim denials (AHA)','Clean claim rate must exceed 96% to maintain a healthy revenue cycle (HFMA)','Medical billing involves over 70,000 ICD-10 codes and 10,000 CPT codes','The revenue cycle management industry is valued at $250 billion annually (Grand View Research)','First-pass denial rate averages 8-12%; each rework costs $25-118 per claim (HFMA)'],
       m:[['$262B','Annual Billing Losses (AHA)'],['8-12%','First-Pass Denial Rate (HFMA)'],['96%+','Target Clean Claim Rate (HFMA)'],['$250B','Revenue Cycle Management Industry Size (Grand View)']],
       actors:'Medical Coder · Biller · Revenue Cycle Manager · Payer · Compliance Officer',sys:'Billing System · Encoder · Clearinghouse · Payer Portal · EDI 837 Transaction',
       pain:['Coding errors from under-documented encounters cost health systems millions annually','Payer-specific billing rule changes require constant and costly staff retraining','Denial management turnaround averages 45 days, significantly delaying cash flow (HFMA)']},
  PTP:{t:'Patient Portal',l:'Technology / EHR',ln:6,lc:'#3FC98A',
       w:['90% of hospitals and practices offer a patient portal to their patients (ONC, 2022)','Only 37% of patients actually use the portal their provider offers (ONC, 2022)','Patient portal messaging reduced unnecessary office visits by 26% in primary care (JAMIA)','Post-visit summary access and medication management are the top portal use cases','TEFCA and FHIR mandates are driving patient data portability and cross-system interoperability (ONC)'],
       m:[['90%','Providers Offering a Patient Portal (ONC)'],['37%','Patients Who Actually Use the Portal (ONC)'],['26%','Visit Reduction via Portal Messaging (JAMIA)'],['5x','Portal Use Rate: Ages 35-54 vs. 65+ (ONC)']],
       actors:'Patient · Registered Nurse · Physician · Information Technology · Patient Access Team',sys:'MyChart · Patient Portal · FHIR APIs · Secure Messaging Platform',
       pain:['Low adoption in elderly, low-literacy, and non-English-speaking patient populations','Portal message volumes create uncompensated physician workload outside of clinical encounters','Data fragmentation across multiple health systems reduces the portal\'s clinical utility']},
  QUA:{t:'Quality / Outcomes',l:'Data & Metrics',ln:7,lc:'#FF8C5A',
       w:['CMS tracks over 300 quality measures across all care settings (CMS, 2023)','Value-based care programs tie more than 50% of Medicare payments to quality outcomes (CMS)','HEDIS measures are used by 90%+ of US health plans to assess clinical performance (NCQA)','Hospital-acquired conditions cost $400 billion annually in preventable patient harm (AHRQ)','The Leapfrog Group and CMS Hospital Compare publish quality performance data publicly'],
       m:[['300+','CMS Tracked Quality Measures (CMS)'],['50%+','Medicare Payments Tied to Quality (CMS)'],['$400B','Annual Preventable Harm Cost (AHRQ)'],['90%+','Health Plans Using HEDIS (NCQA)']],
       actors:'Quality Director · Clinical Staff · Compliance Officer · Payer · CMS',sys:'Quality Reporting Platform · EHR Analytics · CMS Portal · HEDIS Reporting Engine',
       pain:['Measure burden exceeds clinical utility; 72% of physicians report quality measure fatigue (AMA)','Quality improvement data is often unavailable in real time for use in clinical decisions','Structural inequities in quality measurement disadvantage safety-net and rural providers']},
  UTL:{t:'Utilization / Length of Stay',l:'Data & Metrics',ln:7,lc:'#FF8C5A',
       w:['Average US hospital length of stay: 4.5 days (CMS, 2023)','Length of stay is the primary driver of inpatient cost and hospital throughput capacity','Utilization management reviews determine medical necessity for admission and continued inpatient stay','Geometric mean length of stay (GMLOS) is the CMS benchmark for DRG-based reimbursement','Predictive analytics tools can identify outlier length-of-stay risk at the time of admission (AHA, 2022)'],
       m:[['4.5 days','Avg US Hospital Length of Stay (CMS)'],['18%','Cases Exceeding DRG Geometric Mean LOS (CMS)'],['$2,000/day','Avg Inpatient Daily Cost (AHA)'],['30%','LOS Reduction Achievable with Evidence Protocols (IHI)']],
       actors:'Utilization Review Nurse · Case Manager · Attending Physician · Payer',sys:'Utilization Management Platform · EHR Analytics · InterQual / Milliman Criteria',
       pain:['Payer concurrent review delays cause medically unnecessary prolonged inpatient stays','Accurate length-of-stay prediction requires data integration that most EHRs currently lack','Observation versus inpatient status confusion inflates apparent length-of-stay metrics']},
  EXP:{t:'Patient Experience / CAHPS',l:'Data & Metrics',ln:7,lc:'#FF8C5A',
       w:['Hospital Consumer Assessment of Healthcare Providers and Systems (HCAHPS) is the national standard survey','71% of patients would recommend their hospital to others based on HCAHPS data (CMS, 2023)','Patient experience scores affect 30% of Value-Based Purchasing incentive payments for hospitals (CMS)','Top experience drivers: nurse communication, physician communication, responsiveness, and pain management (HCAHPS)','Higher experience scores are associated with lower readmission rates and better clinical outcomes (NEJM)'],
       m:[['71%','Would Recommend Their Hospital (CMS)'],['30%','VBP Incentive Payment Tied to Experience (CMS)'],['4','Core Communication Domains in HCAHPS'],['3x','Higher Patient Loyalty in Top-Quartile Hospitals (Press Ganey)']],
       actors:'Patient · Patient Experience Officer · Nursing Leadership · Physicians · Environmental Services',sys:'HCAHPS Survey Platform · CMS Portal · Press Ganey · Experience Analytics Dashboard',
       pain:['Survey response rates average only 27%, limiting data statistical representativeness (CMS)','HCAHPS scores lag 6-9 months behind care delivery, preventing real-time feedback loops','Structural factors such as staffing ratios, noise, and wait times impact scores more than training alone']},
  FIN:{t:'Financial Performance',l:'Data & Metrics',ln:7,lc:'#FF8C5A',
       w:['US healthcare spending reached $4.5 trillion in 2022, representing 17.3% of GDP (CMS National Health Expenditures)','Hospital operating margins averaged -0.2% in 2022, the lowest recorded in 20 years (KFF)','Labor costs represent 55-60% of total hospital operating expenses (AHA)','Revenue cycle efficiency is the primary lever for financial improvement in healthcare organizations (HFMA)','Non-operating income from investments is increasingly required to sustain hospital operations'],
       m:[['$4.5T','US Healthcare Spend in 2022 (CMS NHE)'],['17.3%','Share of GDP (CMS NHE)'],[ '-0.2%','Avg Hospital Operating Margin 2022 (KFF)'],['55-60%','Labor Share of Hospital Operating Costs (AHA)']],
       actors:'Chief Financial Officer · Revenue Cycle Director · Finance Analysts · Hospital Board · CMS',sys:'Financial Analytics Platform · Enterprise Resource Planning · Revenue Cycle Management System · CMS Cost Reports',
       pain:['Labor cost inflation and supply chain costs outpace annual reimbursement rate increases','The 2022-2023 post-pandemic financial crisis forced 50+ hospital closures nationwide (KFF)','Rural and safety-net hospitals are disproportionately exposed to thin or negative operating margins']},
  OPE:{t:'Operational Efficiency',l:'Data & Metrics',ln:7,lc:'#FF8C5A',
       w:['Operational efficiency metrics measure throughput, cycle time, and resource utilization rates','ED throughput time is the flagship operational metric monitored by hospital leadership (CMS)','Lean and Six Sigma methodologies are widely applied to reduce healthcare waste and variation (IHI)','Up to 30% of all healthcare activities are estimated to be waste or low-value care (National Academy of Medicine)','AI-driven operations optimization is emerging as a major healthcare efficiency lever (AHA, 2023)'],
       m:[['30%','Healthcare Activities Estimated as Waste (NAS)'],['4.2h','Avg ED Throughput Time (CMS)'],['15-30%','Efficiency Gain Potential with Lean Methods (IHI)'],['$760B','Annual Healthcare Waste Estimate (NAS)']],
       actors:'Operations Manager · Quality Director · Frontline Clinical Staff · Information Technology',sys:'Operational Analytics Platform · Process Mining Tools · EHR Reporting · Executive Dashboard',
       pain:['Departmental silos prevent organization-wide efficiency optimization and cross-functional improvement','Frontline staff resistance to process change limits the sustainability of improvement initiatives','Operational data lags by days to weeks; real-time operational dashboards remain uncommon']},
  WKF:{t:'Workforce / Capacity',l:'Data & Metrics',ln:7,lc:'#FF8C5A',
       w:['AAMC projects a physician shortage of 37,000 to 124,000 by 2034 (AAMC, 2023)','Registered nurse annual turnover rate reached 22.5% in 2023 (NSI Nursing Solutions)','Healthcare is the largest employment sector in the United States with 19 million workers (Bureau of Labor Statistics)','Nurse-to-patient ratios directly impact patient mortality and measurable safety outcomes (NEJM)','Travel nurse utilization increased 250% post-pandemic, costing hospitals an additional $24 billion (KFF)'],
       m:[['124K','Physician Shortage Projection by 2034 (AAMC)'],['22.5%','RN Annual Turnover Rate (NSI)'],['$17,000','Avg Cost to Replace One Nurse (NSI)'],['19M','Healthcare Sector Workers (BLS)']],
       actors:'Chief Nursing Officer · Chief Medical Officer · Human Resources Director · Staffing Agency · Frontline Staff',sys:'Workforce Management Platform · Scheduling System · Credentialing System · HR Information System',
       pain:['Nursing burnout and high turnover drive up labor costs and directly degrade care quality','Geographic maldistribution of physicians leaves rural and underserved areas critically understaffed','Graduate medical education training slots are insufficient to address projected physician shortages (AAMC)']},
  PHM:{t:'Pharmacy',l:'External Ecosystem',ln:8,lc:'#E879F9',
       w:['4.7 billion prescriptions are dispensed annually in the United States (IQVIA, 2023)','Medication non-adherence costs $528 billion in avoidable healthcare expenditure annually (NEHI)','125,000 deaths are attributed annually to medication non-adherence (NEHI)','Pharmacy benefit managers (PBMs) control drug pricing and formulary decisions for 270 million Americans','The 340B drug pricing program allows safety-net hospitals to purchase drugs at significant discounts (HRSA)'],
       m:[['4.7B','Annual Prescriptions Dispensed (IQVIA)'],['$528B','Non-Adherence Annual Cost (NEHI)'],['125K','Annual Deaths from Non-Adherence (NEHI)'],['270M','Americans in PBM Managed Programs']],
       actors:'Patient · Pharmacist · Prescribing Physician · Pharmacy Benefit Manager · Payer',sys:'Pharmacy Dispensing System · Electronic Prescribing · PBM Portal · EHR Interface',
       pain:['Drug pricing opacity makes out-of-pocket costs unpredictable for patients at the pharmacy counter','PBM formulary restrictions limit access to clinically preferred medications','Medication reconciliation gaps at care transitions cause preventable adverse drug events']},
  LAB:{t:'Labs / Imaging',l:'External Ecosystem',ln:8,lc:'#E879F9',
       w:['14 billion laboratory tests are performed annually in the United States (CMS, 2023)','Laboratory results directly inform 70% of all clinical decisions made by physicians (AACC, 2023)','The medical imaging market generates over $30 billion annually in revenue (IBIS World, 2023)','The radiologist shortage is projected to reach 42,000 by 2032 (AAMC)','Reference laboratory turnaround time averages 24-48 hours for complex diagnostic tests (CAP)'],
       m:[['14B','Annual Laboratory Tests (CMS)'],['70%','Clinical Decisions Driven by Lab Results (AACC)'],['$30B','Annual Imaging Revenue (IBIS World)'],['42K','Projected Radiologist Shortage by 2032 (AAMC)']],
       actors:'Physician · Lab Technician · Radiologist · Pathologist · Patient',sys:'Laboratory Information System · PACS · HL7 Interface · EHR · CPOE',
       pain:['Siloed lab systems between hospitals and reference labs delay result communication to clinicians','Radiologist shortages create imaging interpretation backlogs at facilities across the country','Duplicate testing from lack of result sharing between providers wastes over $8 billion annually (AHRQ)']},
  SPC:{t:'Specialists',l:'External Ecosystem',ln:8,lc:'#E879F9',
       w:['Average wait time to see a new specialist: 26 days nationally (Merritt Hawkins, 2023)','Specialty care accounts for 55% of all physician office visits in the United States (NCHS, 2022)','Referral leakage to out-of-network specialists costs health systems $260 billion annually (Advisory Board)','Lack of specialist supply in rural areas leaves 20% of the US population medically underserved (HRSA)','Teleconsultation is reducing specialist wait times by 30-50% for appropriate use cases (ATA)'],
       m:[['26 days','Avg New Specialist Wait Time (Merritt Hawkins)'],['55%','Physician Visits Going to Specialists (NCHS)'],['$260B','Annual Referral Leakage Cost (Advisory Board)'],['20%','Rural Population Medically Underserved (HRSA)']],
       actors:'Patient · Referring Primary Care Physician · Specialist · Referral Coordinator',sys:'Referral Management System · Scheduling System · EHR · Fax (Legacy)',
       pain:['The referral process is predominantly fax-based, causing delays and information loss','Specialist access gaps drive patients to emergency departments for specialty medical needs','Lack of closed-loop referral tracking means primary care physicians often do not know if patients follow through']},
  CMR:{t:'Community Resources (SDOH)',l:'External Ecosystem',ln:8,lc:'#E879F9',
       w:['80% of health outcomes are determined by social determinants of health, not clinical care (WHO, 2023)','Housing, food access, transportation, and education are the four primary SDOH drivers','Community health workers reduce hospitalizations by 25% in high-risk populations (AHRQ)','The CMS Accountable Health Communities model formally links clinical care to community-based services','Social needs screening in clinical settings identifies unmet needs in 40-50% of patients (AHRQ)'],
       m:[['80%','Outcomes Determined by SDOH (WHO)'],['25%','Hospitalization Reduction via Community Health Workers (AHRQ)'],['40-50%','Patients Screening Positive for Social Needs (AHRQ)'],['$1 → $4','ROI of Community Health Interventions (CDC)']],
       actors:'Community Health Worker · Social Worker · Patient · Primary Care Physician · Non-Profit Organization',sys:'Community Resource Database · SDOH Screening Tools · Care Coordination Platform',
       pain:['Healthcare systems lack the infrastructure to address non-medical social needs systematically','Community resource databases are often outdated, incomplete, and unavailable in the EHR','Reimbursement for SDOH screening and referral interventions remains limited, reducing provider investment']},
  EMP:{t:'Employers',l:'External Ecosystem',ln:8,lc:'#E879F9',
       w:['164 million Americans receive health insurance coverage through their employer (KFF, 2023)','Employer healthcare costs average $16,000 per employee per year in total contribution (KFF, 2023)','Large employers are increasingly direct contracting with health systems to bypass traditional insurance middlemen','Well-designed workplace wellness programs reduce healthcare costs by 15-25% (Harvard Business Review)','ERISA law governs employer self-funded health plans and preempts most state insurance regulations'],
       m:[['164M','Employer-Insured Americans (KFF)'],['$16,000','Avg Employer Cost per Employee per Year (KFF)'],['65%','Large Employers That Are Self-Funded (KFF)'],['15-25%','Cost Reduction from Effective Wellness Programs (Harvard)']],
       actors:'Human Resources Director · Benefits Manager · Employee · Insurance Broker · Health Plan',sys:'Benefits Administration Platform · HRIS · Wellness Platform · Claims Analytics',
       pain:['Employer benefit design choices can significantly restrict employee network access and care options','High-deductible health plan structures shift cost burden to employees, reducing necessary care access','Lack of data transparency from payers limits the employer\'s ability to manage and improve workforce health costs']},
  PBH:{t:'Public Health',l:'External Ecosystem',ln:8,lc:'#E879F9',
       w:['US public health funding: only $92 per capita, far below comparable developed nations (Trust for America\'s Health, 2023)','COVID-19 exposed critical infrastructure gaps in public health data systems and disease surveillance (CDC)','Public health interventions generate $14 in return for every $1 invested (CDC, 2023)','CDC tracks over 100 notifiable disease conditions through national epidemiological surveillance systems','The life expectancy gap between the richest and poorest Americans is now 10 years (JAMA)'],
       m:[['$92','Per Capita Public Health Spending (TFAH)'],['$1 → $14','ROI of Public Health Interventions (CDC)'],['100+','Notifiable Conditions Tracked Nationally (CDC)'],['10 years','Life Expectancy Gap by Income Level (JAMA)']],
       actors:'Public Health Official · Epidemiologist · Community Health Worker · CMS · CDC',sys:'CDC NEDSS · State Health Information Exchange · Immunization Registry · PHIN',
       pain:['Chronic underfunding leaves public health infrastructure unable to adequately respond to health crises','Fragmented data systems prevent real-time disease surveillance and early warning detection','Healthcare-public health coordination remains poorly defined and inconsistently executed across all levels']},
};

const PS={
  H:new Set(['H']),AR:new Set(['H','AR','PCA']),HR:new Set(['H','AR','HR','URC']),
  ACE:new Set(['H','ACE','ED','URC','ARR','TRI']),REC:new Set(['H','ACE','REC','IPT','PAH']),
  CHR:new Set(['H','CHR','PAH','PCA']),HOME:new Set(['H','HOME','PCA']),PCA:new Set(['H','AR','PCA','ARR']),
  URC:new Set(['H','AR','URC','ARR']),ED:new Set(['H','ACE','URC','ED','ARR','TRI','DSP','ADM','REG','EHR','AWT','PAY']),
  IPT:new Set(['H','ACE','ED','IPT','TRM','ADM','BDP','EHR']),PAH:new Set(['H','REC','PAH','DCP','PCS','PAY']),
  ARR:new Set(['H','ACE','ED','ARR','TRI','SCH','REG']),TRI:new Set(['H','ACE','ED','ARR','TRI','EHR','NST']),
  ADM:new Set(['H','ACE','URC','ED','ARR','TRI','DSP','ADM','REG','BDP','PLT','EHR']),
  DSP:new Set(['H','ACE','ED','ARR','DSP','ADM','REG','EHR']),
  REG:new Set(['H','ACE','URC','ED','ARR','TRI','DSP','ADM','REG','ELG','PLT','NST','PAR','EHR','AWT','PAY']),
  ELG:new Set(['H','ACE','ED','ADM','REG','ELG','PLT','NST','EHR','AWT']),
  PLT:new Set(['H','ACE','ED','ADM','REG','PLT','NST','PAR','DDC','EHR']),
  EHR:new Set(['H','ACE','ED','ADM','REG','ELG','EHR','ORDS','DOC','AWT','PAY']),
  AWT:new Set(['H','ACE','ED','ADM','REG','EHR','AWT','QUA','PAY']),
  PAY:new Set(['H','ACE','ED','ADM','PLT','NST','PAR','OPM','EHR','AWT','PAY']),
};

const BCM={
  H:['Healthy Patient'],AR:['Healthy Patient','At Risk'],HR:['Healthy Patient','At Risk','High Risk'],
  ACE:['Healthy Patient','Acute Event'],REC:['Healthy Patient','Recovery'],CHR:['Healthy Patient','Chronic Management'],
  HOME:['Healthy Patient','Home / Self Care'],PCA:['Healthy Patient','At Risk','Primary Care / Clinic'],
  URC:['Healthy Patient','Minor Illness','Urgent Care'],ED:['Healthy Patient','Minor Illness','Urgent Care','Escalates to Emergency Dept'],
  IPT:['Healthy Patient','Acute Event','Inpatient'],PAH:['Healthy Patient','Recovery','Post-Acute / Home Health'],
  ARR:['Healthy Patient','Urgent Care','Arrival'],TRI:['Healthy Patient','Urgent Care','Emergency Department','Triage'],
  ADM:['Healthy Patient','Minor Illness','Urgent Care','Escalates to Emergency Dept','Admission'],DSP:['Healthy Patient','Escalates to Emergency Dept','Disposition'],
  REG:['Healthy Patient','Minor Illness','Urgent Care','Escalates to Emergency Dept','Admission','Registration / Insurance'],
  ELG:['Healthy Patient','Minor Illness','Escalates to Emergency Dept','Admission','Eligibility Verification'],
  PLT:['Healthy Patient','Admission','Insurance Plan Type'],EHR:['Healthy Patient','Admission','Registration','EHR System'],
  AWT:['Healthy Patient','Emergency Dept','Registration','Access & Wait Time'],PAY:['Healthy Patient','Admission','Insurance','Payer / Insurance'],
};

const SM={
  REG:{lbl:'Registration Sub-Process',c:'#A78BFA',nd:[['D_PA','Patient\nArrivals'],['D_ID','ID &\nInsurance'],['D_ELG','Eligibility\nCheck'],['D_EST','Cost\nEstimate'],['D_CON','Consent\nCapture'],['D_MRN','MRN\nCreation']]},
  ED:{lbl:'Emergency Department Intake',c:'#E05555',nd:[['D_ESI','ESI\nTriage Score'],['D_TRK','Tracking\nBoard'],['D_BED','Bed\nAssignment'],['D_CON2','Physician\nConsult'],['D_DISP2','Disposition\nDecision']]},
  EHR:{lbl:'EHR System Components',c:'#3FC98A',nd:[['D_ADT','ADT\nEngine'],['D_HL7','HL7\nInterface'],['D_FHIR','FHIR\nAPI'],['D_CDW','Data\nWarehouse'],['D_BI','Analytics']]},
  PLT:{lbl:'Plan Type Breakdown',c:'#F6C358',nd:[['D_HMO','HMO\nGatekeeper'],['D_PPO','PPO\nOpen Access'],['D_EPO','EPO\nIn-Network'],['D_HDHP','HDHP\n+ HSA']]},
  ACE:{lbl:'Acute Event Pathway',c:'#E05555',nd:[['D_911','911\nActivation'],['D_EMS','EMS\nResponse'],['D_OB','Emergency Dept\nPresentation'],['D_ADMIT','Admission\nDecision']]},
  AWT:{lbl:'Wait Time Breakdown',c:'#FF8C5A',nd:[['D_DOOR','Door-to-\nProvider'],['D_APT','Appointment\nAvailability'],['D_REF','Referral\nWait Time'],['D_CALL','Phone\nAbandonment']]},
};

const LINKS=[
  ['H','HOME'],['H','PCA'],['H','URC'],['AR','PCA'],['HR','URC'],
  ['ACE','ED'],['ACE','URC'],['REC','IPT'],['REC','PAH'],['CHR','PCA'],['CHR','PAH'],
  ['HOME','ARR'],['PCA','ARR'],['URC','ARR'],['ED','TRI'],['ED','ARR'],
  ['IPT','TRM'],['IPT','ADM'],['PAH','DCP'],
  ['ARR','REG'],['ARR','SCH'],['TRI','REG'],['ADM','REG'],['ADM','BDP'],['TRM','DCP'],['DSP','DCP'],['DSP','REG'],
  ['REG','PLT'],['REG','NST'],['REG','PAR'],['ELG','PLT'],['ELG','NST'],['PAU','PAR'],['PAU','PLT'],
  ['REG','EHR'],['BDP','EHR'],['SCH','SCHS'],['CHD','DOC'],
  ['PLT','EHR'],['NST','ORDS'],['PAR','EHR'],
  ['EHR','AWT'],['EHR','QUA'],['BLL','FIN'],['DOC','QUA'],['PTP','EXP'],
  ['AWT','PAY'],['QUA','PAY'],['FIN','PAY'],['EXP','PAY'],['UTL','PAY'],
];

const SMD={
  // REG — Registration Sub-Process
  D_PA:{t:'Patient Arrivals',parent:'REG',
    w:['Walk-in patients present at the front desk without prior scheduling','Scheduled patients check in against appointment records in Epic','Transferred patients arrive with clinical documentation from the sending facility','EMS-delivered patients bypass registration and go directly to triage'],
    m:[['~35%','Walk-in Rate'],['~45%','Scheduled Arrivals'],['~20%','Transfers / EMS']],
    actors:'Patient · Registrar · Patient Access Rep · EMS Crew',
    sys:'Epic ADT · Scheduling System · EMS ePCR',
    pain:['Walk-in surges create unpredictable staffing demand','Transfer documentation is frequently incomplete on arrival','EMS-delivered patients often arrive without identity documents']},
  D_ID:{t:'ID & Insurance Capture',parent:'REG',
    w:['Government-issued photo ID is scanned to capture and validate demographics','Insurance cards are scanned or manually entered into Epic','Information is cross-referenced against existing patient records for duplicates','Discrepancies trigger a patient merge or demographic correction workflow'],
    m:[['99.1%','ID Capture Rate'],['~8 min','Avg. Capture Time'],['3.2%','Discrepancy Rate']],
    actors:'Registrar · Patient · Health Information Management',
    sys:'Epic ADT · Document Scanner · Eligibility API',
    pain:['Patients frequently arrive without insurance cards','Demographic mismatches create duplicate records that fragment the clinical history','Manual entry errors drive downstream claim denials']},
  D_ELG:{t:'Eligibility Check',parent:'REG',
    w:['Real-time 270/271 EDI transaction is sent to the payer clearinghouse','Active coverage status, deductible accumulation, and co-pay amounts are confirmed','Secondary and tertiary coverage is identified and recorded','Results populate the Epic guarantor record for billing'],
    m:[['<30 sec','Response Time'],['98.2%','Accuracy Rate'],['~6%','Uninsured Rate']],
    actors:'Registrar · Clearinghouse · Payer · Patient',
    sys:'Epic ADT · Eligibility API · Payer Clearinghouse',
    pain:['Payer systems go offline causing manual workarounds','Coverage changes are not always reflected in real time','Self-pay identification is often delayed until billing']},
  D_EST:{t:'Cost Estimate',parent:'REG',
    w:['Deductible accumulation is pulled from the eligibility response','Co-insurance and co-pay amounts are calculated based on anticipated service type','A patient-facing Good Faith Estimate is generated prior to service','Financial assistance screening is triggered for high-balance estimates'],
    m:[['94.3%','Estimate Accuracy'],['$280','Avg. Patient Estimate'],['18%','Qualify for Assistance']],
    actors:'Registrar · Financial Counselor · Patient',
    sys:'Epic · Price Transparency Tool · Payer Portal',
    pain:['Final cost often varies significantly from the initial estimate','Patients sometimes decline necessary care based on high estimates','Price transparency tools are not integrated with all payers']},
  D_CON:{t:'Consent Capture',parent:'REG',
    w:['Consent for treatment is obtained verbally or via electronic signature','Financial responsibility acknowledgment is signed by patient or legal guardian','HIPAA Notice of Privacy Practices is provided and acknowledged','Consent documents are stored and indexed in the legal health record'],
    m:[['99.7%','Consent Rate'],['~3 min','Avg. Time'],['0.3%','Refused / Deferred']],
    actors:'Registrar · Patient · Legal Guardian · Compliance Officer',
    sys:'Epic · DocuSign · Consent Management System',
    pain:['Language barriers delay the consent process','Capacity to consent is unclear for altered or unconscious patients','Electronic consent tablets have poor ergonomics at the bedside']},
  D_MRN:{t:'MRN Assignment',parent:'REG',
    w:['A new Medical Record Number is created if no existing match is found','Existing MRNs are located using probabilistic matching on name, DOB, and address','Duplicate MRN merge workflows are initiated when overlap is detected','The MRN propagates to all downstream clinical systems via Epic ADT'],
    m:[['~2%','Duplicate MRN Rate'],['<5 sec','Assignment Time'],['99.9%','Match Accuracy']],
    actors:'Registrar · Health Information Management · IT',
    sys:'Epic ADT · MPI (Master Patient Index) · HIE',
    pain:['Duplicate records result in a fragmented clinical history','Merge logic fails with name changes, nicknames, or data entry typos','HIE connections do not always resolve patient identity correctly']},
  // ED — Emergency Department Intake
  D_ESI:{t:'ESI Triage Score',parent:'ED',
    w:['ESI (1–5) is assigned by a triage RN within minutes of patient arrival','ESI 1 triggers immediate provider notification for life-threatening presentations','ESI 3–5 patients are queued by acuity and expected resource consumption','Score drives placement, staffing assignment, and door-to-provider targets'],
    m:[['~37 min','Door-to-Doctor (Avg.)'],['5.2%','ESI 1 Rate'],['42%','ESI 3 Rate']],
    actors:'Triage RN · Patient · Charge RN · Emergency Physician',
    sys:'Epic ED Module · ED Tracking Board · Vitals Monitor',
    pain:['Undertriage puts patient safety at risk','Overtriage inflates resource consumption and wait times','Triage RN staffing gaps delay ESI assignment during surges']},
  D_TRK:{t:'ED Tracking Board',parent:'ED',
    w:['All active ED patients are displayed in real time by bed, acuity, and time in department','Pending orders, results, and provider assignments are visible to the full care team','Length-of-stay alerts fire at configurable thresholds to prompt action','Boarding patients occupy visible beds without an active treatment workflow'],
    m:[['~4.2 hr','Avg. ED LOS'],['18%','Boarding Rate'],['1 : 4','Nurse-to-Patient Ratio']],
    actors:'Charge RN · ED Physician · Bed Coordinator · Case Manager',
    sys:'Epic ED Tracking · Capacity IQ · Nurse Call System',
    pain:['Boarding patients mask true available capacity','Tracking board accuracy degrades during patient surges','Cross-department visibility is limited outside the ED']},
  D_BED:{t:'Bed Assignment',parent:'ED',
    w:['Triage score and chief complaint determine initial bed placement','Ambulatory care areas divert lower-acuity ESI 4–5 patients from main ED beds','Boarding occurs when no inpatient bed is available after an admission decision','Bed turnaround time is a key throughput metric tracked by nursing leadership'],
    m:[['~22 min','Triage-to-Bed Time'],['28%','Boarding Rate'],['~42 min','Bed Turnover Time']],
    actors:'Charge RN · Bed Coordinator · Environmental Services · Patient',
    sys:'Epic Capacity IQ · Bed Management System · Housekeeping App',
    pain:['Inpatient boarding is the primary driver of ED gridlock','Environmental services response times delay bed readiness','Real-time inpatient bed status is rarely visible inside the ED']},
  D_CON2:{t:'Physician Consult',parent:'ED',
    w:['Emergency physician conducts history, physical exam, and medical decision-making','Orders for labs, imaging, and medications are entered via Epic CPOE','Specialist consultation is requested based on clinical findings or test results','Time-sensitive pathways (STEMI, stroke, sepsis) activate parallel response workflows'],
    m:[['~37 min','Door-to-Physician'],['62%','Lab / Imaging Order Rate'],['18%','Specialist Consult Rate']],
    actors:'Emergency Physician · Specialist · RN · Patient',
    sys:'Epic Orders · CPOE · Paging System · Telemedicine',
    pain:['Specialist response times delay disposition decisions','Off-hours coverage gaps create consult delays overnight and on weekends','Documentation burden reduces time available for direct patient care']},
  D_DISP2:{t:'Disposition Decision',parent:'ED',
    w:['Clinical team determines admit, discharge, or transfer based on workup results','Inpatient admission order is placed in Epic triggering an ADT bed request','Discharge instructions and prescriptions are reviewed with the patient before departure','Transfer center is activated when the appropriate receiving facility is outside the system'],
    m:[['27%','Admit Rate'],['68%','Discharge Rate'],['5%','Transfer Rate'],['~55 min','Decision-to-Bed Time']],
    actors:'Emergency Physician · Case Manager · Social Worker · Patient',
    sys:'Epic ADT · Transfer Center · Discharge Planning Tool',
    pain:['Bed unavailability delays admission even after the clinical decision is made','Discharge instructions are complex and frequently misunderstood','Transfer coordination is manual, time-intensive, and fragmented across systems']},
  // EHR — EHR System Components
  D_ADT:{t:'ADT Engine',parent:'EHR',
    w:['Admit, Discharge, Transfer events generate HL7 ADT messages in real time','All downstream clinical systems subscribe to ADT feeds for patient status updates','Bed status, dietary orders, and pharmacy profiles update automatically on transfer','ADT accuracy is foundational to billing integrity and care coordination'],
    m:[['~500/day','ADT Messages (Avg. Facility)'],['<2 sec','Message Latency'],['99.97%','Uptime SLA']],
    actors:'Registrar · Bed Coordinator · IT · Clinical Systems',
    sys:'Epic ADT · HL7 Interface Engine · Downstream Clinical Systems',
    pain:['ADT delays propagate errors to all connected downstream systems','Interface engine failures cause cascade outages across ancillary departments','Downtime procedures are rarely practiced and poorly understood by staff']},
  D_HL7:{t:'HL7 Interface',parent:'EHR',
    w:['HL7 v2.x messages connect Epic to lab, imaging, pharmacy, and ancillary systems','ORM/ORU messages route orders and results bidirectionally between systems','The interface engine validates and transforms messages before delivery','Failed messages are queued, retried, and alerted to the integration team'],
    m:[['HL7 v2.8','Current Standard'],['~1,200/hr','Messages Processed'],['0.3%','Error Rate']],
    actors:'IT Integration Team · Vendors · Clinical Informatics',
    sys:'Epic · Mirth Connect · Rhapsody · Lab / Imaging Systems',
    pain:['Non-standard HL7 implementations by vendors cause mapping errors','Legacy systems do not support modern HL7 message types','Interface failures are invisible to clinical staff until patient impact occurs']},
  D_FHIR:{t:'FHIR API',parent:'EHR',
    w:['FHIR R4 APIs expose structured clinical data to authorized external applications','Patient-facing portals access records via FHIR for 21st Century Cures compliance','Da Vinci Implementation Guides enable payer-provider data exchange over FHIR','SMART-on-FHIR apps launch within Epic for embedded clinical decision support'],
    m:[['FHIR R4','Current Version'],['2023','ONC Compliance Deadline (met)'],['~40%','Payer FHIR Adoption']],
    actors:'Patient · Payer · App Developer · Compliance Officer',
    sys:'Epic FHIR Server · MyChart · Apple Health · Payer API',
    pain:['FHIR implementation quality varies widely by vendor','Information blocking rules are complex to interpret and operationalize','Patient consent management across third-party apps is fragmented']},
  D_CDW:{t:'Clinical Data Warehouse',parent:'EHR',
    w:['All clinical events are extracted nightly or near-real-time to a structured warehouse','Data is normalized into reporting tables for analytics and population health queries','Population health queries run against the warehouse without impacting the live EHR','De-identified datasets support research and AI/ML model development'],
    m:[['~10 TB','Avg. Health System CDW Size'],['<24 hr','Refresh Lag'],['99.5%','Data Completeness']],
    actors:'Data Analyst · Informatics Team · Researcher · IT',
    sys:'Epic Clarity · Caboodle · Snowflake · SQL Server',
    pain:['Data latency limits real-time operational decision-making','Governance gaps lead to inconsistent metric definitions across departments','Analyst capacity rarely keeps pace with the volume of reporting requests']},
  D_BI:{t:'Analytics & Reporting',parent:'EHR',
    w:['Operational dashboards track length of stay, throughput, and staffing in real time','Quality reports measure HEDIS, CMS Core Measures, and value-based contract performance','Financial analytics reconcile charges, payments, and denial trends','Workforce dashboards track capacity and overtime against budget targets'],
    m:[['~200','Reports in Avg. Health System'],['22%','Report Utilization Rate'],['14 days','Avg. New Report Build Time']],
    actors:'Analyst · Operations Leadership · Quality Team · Finance',
    sys:'Epic Reporting Workbench · Tableau · Power BI · Cognos',
    pain:['Report proliferation creates inconsistent metric definitions organization-wide','Analysts spend ~70% of time on maintenance rather than new analysis','Executives request real-time data the warehouse refresh cycle cannot support']},
  // PLT — Plan Type Breakdown
  D_HMO:{t:'HMO – Gatekeeper Model',parent:'PLT',
    w:['Primary care physician controls all referrals to specialists','Patients must obtain prior authorization before specialist visits','Network is narrow: out-of-network care is not covered except for emergencies','Administrative burden is highest among plan types due to referral requirements'],
    m:[['38%','Commercial HMO Share'],['~$420/mo','Avg. Premium (individual)'],['62%','Prior Auth Referral Rate']],
    actors:'Patient · PCP · Plan Admin · Specialist',
    sys:'Payer Portal · Prior Auth System · Referral Management',
    pain:['Referral delays slow specialist access for complex patients','Patients are often unaware of strict network restrictions until billed','PCP gatekeeping creates care bottlenecks and workflow burden on primary care']},
  D_PPO:{t:'PPO – Open Access',parent:'PLT',
    w:['Patients may access any provider without a referral from a PCP','In-network providers are reimbursed at preferential rates','Out-of-network access is allowed at higher patient cost share','Most common commercial plan type due to provider flexibility'],
    m:[['44%','Commercial PPO Share'],['~$580/mo','Avg. Premium (individual)'],['$1,500','Avg. Deductible']],
    actors:'Patient · Any Provider · Plan Admin · Employer',
    sys:'Payer Portal · Benefits Admin Platform · Claims System',
    pain:['Higher premiums burden lower-wage workers and small employers','Surprise billing risk for out-of-network services is common','Patients frequently do not understand cost-share differences between tiers']},
  D_EPO:{t:'EPO – Exclusive Provider Org.',parent:'PLT',
    w:['No referral required: patients self-refer to in-network specialists','Coverage is strictly limited to in-network providers except for emergencies','Premiums are lower than PPO but network restrictions apply','Growing as a middle-ground option between HMO and PPO models'],
    m:[['~12%','Commercial EPO Share'],['~$480/mo','Avg. Premium (individual)'],['0%','Out-of-Network Coverage']],
    actors:'Patient · In-Network Provider · Plan Admin',
    sys:'Payer Portal · Network Directory · Claims System',
    pain:['Network adequacy varies significantly by geography','Patients face full out-of-pocket cost for any out-of-network care','Provider directories are frequently inaccurate or out of date']},
  D_HDHP:{t:'HDHP + Health Savings Account',parent:'PLT',
    w:['High deductible must be met before most coverage applies','HSA contributions are pre-tax and roll over year to year without expiration','Preventive services are covered at 100% before the deductible under ACA rules','Increasingly used by employers to shift financial risk to employees'],
    m:[['~29%','Employer HDHP Adoption'],['$1,600','IRS Min. Deductible (2024, individual)'],['$4,150','HSA Max Contribution (2024, individual)']],
    actors:'Employee · Employer · Plan Admin · HSA Custodian',
    sys:'HSA Platform · Benefits Admin · Payer Portal',
    pain:['High deductibles drive care avoidance among lower-income workers','Most HSA-eligible employees do not maximize annual contributions','Low-income workers cannot afford to fund an HSA, limiting the benefit']},
  // ACE — Acute Event Pathway
  D_911:{t:'911 Activation',parent:'ACE',
    w:['Patient or bystander calls 911 reporting a medical emergency','Dispatch assigns ambulance, fire, or combined response based on call triage protocol','EMS crew is notified of patient location, chief complaint, and access considerations','Scene safety is assessed before patient contact is initiated'],
    m:[['~240M','911 Calls/Year (US)'],['~8 min','Avg. EMS Response Time'],['14%','Non-Emergency 911 Rate']],
    actors:'Patient · Bystander · 911 Dispatcher · EMS Crew',
    sys:'CAD (Computer-Aided Dispatch) · EMS ePCR · Radio System',
    pain:['Non-emergency 911 use strains capacity and delays true emergencies','Rural response times far exceed urban averages due to geography','Dispatch protocols vary widely by jurisdiction with no national standard']},
  D_EMS:{t:'EMS Response',parent:'ACE',
    w:['Paramedics assess, stabilize, and initiate treatment on scene','Vitals, 12-lead EKG, and clinical findings are documented in ePCR in real time','Pre-notification is transmitted to the receiving ED for high-acuity patients','Transport destination follows EMS protocols for closest appropriate vs. highest capability'],
    m:[['~36M','EMS Transports/Year (US)'],['~18 min','Avg. Scene Time'],['92%','Pre-notification Rate (STEMI)']],
    actors:'Paramedic · EMT · ED Charge RN · Medical Director',
    sys:'EMS ePCR · 12-Lead Transmission · CAD · Hospital Radio',
    pain:['ePCR systems rarely integrate with hospital EHR, creating data silos','Handoff documentation is often verbal and inconsistently recorded','EMS diversion policies create destination conflicts during high-census periods']},
  D_OB:{t:'ED Presentation',parent:'ACE',
    w:['Patient arrives at the ED by EMS, walk-in, or private vehicle','Triage RN assesses chief complaint and assigns ESI score immediately','Registration is initiated in parallel with triage for EMS-transported patients','Time of arrival is logged as the start of all door-to-event quality metrics'],
    m:[['145M','ED Visits/Year (US, CDC)'],['~37 min','Door-to-Physician (Avg.)'],['15%','Left Without Being Seen']],
    actors:'Patient · Triage RN · Registrar · EMS Crew',
    sys:'Epic ED Module · ED Tracking Board · Triage Kiosk',
    pain:['Overcrowding causes patients to leave before being seen','Walk-in triage is delayed during peak hours due to staffing constraints','EMS-to-triage handoff documentation is inconsistent across agencies']},
  D_ADMIT:{t:'Admission Decision',parent:'ACE',
    w:['Emergency physician documents medical necessity for inpatient admission','Observation vs. inpatient status is determined using InterQual or MCG criteria','A bed request is placed in Epic ADT triggering capacity management workflow','Case manager validates status and initiates timely payer notification'],
    m:[['27%','ED Admit Rate'],['~55 min','Decision-to-Bed Time'],['12%','Obs-to-Inpatient Conversion']],
    actors:'Emergency Physician · Case Manager · Bed Coordinator · Payer',
    sys:'Epic ADT · InterQual / MCG · Bed Management · Payer Portal',
    pain:['Inpatient vs. observation status causes unexpected patient billing surprises','Bed unavailability creates post-decision waits that extend overall ED LOS','Payer notification windows are tight and frequently missed']},
  // AWT — Wait Time Breakdown
  D_DOOR:{t:'Door-to-Provider',parent:'AWT',
    w:['Measured from ED arrival timestamp to first physician or APP contact','Core ACEP and CMS quality metric with a published national target under 30 minutes','Influenced by triage volume, provider staffing ratios, and bed availability','Publicly reported on CMS Hospital Compare and used in value-based contracts'],
    m:[['37 min','National Avg. (CMS, 2023)'],['30 min','Published Target Standard'],['<15 min','Top Decile Performance']],
    actors:'Triage RN · ED Physician · Charge RN · Administration',
    sys:'Epic ED Module · Quality Reporting Tool · CMS Hospital Compare',
    pain:['Public reporting creates pressure to optimize the metric rather than the outcome','Triage-to-bed delays inflate door-to-doctor times independent of physician availability','Off-peak staffing gaps cause significant spikes in this metric']},
  D_APT:{t:'Appointment Availability',parent:'AWT',
    w:['Third-next-available appointment is the PCMH standard access measure','Measured separately for new and established patients by specialty','Primary care and specialty access vary widely by geography, specialty, and payer mix','Same-day and next-day access is an emerging competitive differentiator for health systems'],
    m:[['26 days','Avg. New Patient PCP Wait'],['20+ days','Avg. Specialist Wait'],['62%','Systems with Same-Day Access']],
    actors:'Patient · Scheduler · PCP · Practice Manager',
    sys:'Epic Scheduling · MyChart · Referral Management',
    pain:['Long waits push patients toward urgent care and ED for primary care needs','Scheduling complexity contributes to rising no-show rates','Specialty access deserts exist in rural and underserved communities']},
  D_REF:{t:'Referral Wait Time',parent:'AWT',
    w:['Days from referral order to specialist first appointment is a key access metric','Referral management systems route, authorize, and track scheduling status','Insurance prior authorization adds days to the referral-to-appointment timeline','Closed-loop tracking confirms whether the patient actually completed the specialist visit'],
    m:[['20+ days','Avg. Specialist Wait (US)'],['~35%','Referrals Never Completed'],['8 days','Added by Prior Auth (Avg.)']],
    actors:'PCP · Specialist · Referral Coordinator · Patient · Payer',
    sys:'Epic Referral Module · Prior Auth Portal · Payer System',
    pain:['Up to 35% of referrals are never completed by the patient','Prior authorization is the top reported specialist access barrier','Closed-loop referral confirmation is rarely tracked or acted upon']},
  D_CALL:{t:'Phone Abandonment',parent:'AWT',
    w:['Percentage of inbound scheduling calls abandoned before reaching a live agent','High abandonment correlates with care avoidance and increased no-show rates','Call center staffing levels, IVR design, and callback options are the primary drivers','MyChart secure messaging is increasingly used to reduce inbound phone volume'],
    m:[['~28%','Avg. Abandonment Rate'],['~8 min','Avg. Hold Time'],['22%','Volume Offset by MyChart']],
    actors:'Patient · Call Center Agent · Scheduler · IT',
    sys:'Cisco Contact Center · Epic MyChart · IVR System',
    pain:['High abandonment directly correlates with care avoidance and delayed diagnosis','Callback systems are available but significantly underutilized','MyChart adoption is uneven across patient populations, limiting digital deflection']},
};

const NI={
  // L1 — Patient Experience: health status
  H:'<i data-lucide="heart" width="16" height="16" aria-hidden="true"></i>',
  AR:'<i data-lucide="circle-alert" width="16" height="16" aria-hidden="true"></i>',
  HR:'<i data-lucide="activity" width="16" height="16" aria-hidden="true"></i>',
  ACE:'<i data-lucide="zap" width="16" height="16" aria-hidden="true"></i>',
  REC:'<i data-lucide="rotate-ccw" width="16" height="16" aria-hidden="true"></i>',
  CHR:'<i data-lucide="clock" width="16" height="16" aria-hidden="true"></i>',
  // L2 — Care Settings: where care is delivered
  HOME:'<i data-lucide="home" width="16" height="16" aria-hidden="true"></i>',
  PCA:'<i data-lucide="stethoscope" width="16" height="16" aria-hidden="true"></i>',
  URC:'<i data-lucide="clock-3" width="16" height="16" aria-hidden="true"></i>',
  ED:'<i data-lucide="activity" width="16" height="16" aria-hidden="true"></i>',
  IPT:'<i data-lucide="bed" width="16" height="16" aria-hidden="true"></i>',
  PAH:'<i data-lucide="house-plus" width="16" height="16" aria-hidden="true"></i>',
  // L3 — Clinical Workflow: ED/acute pathway steps
  ARR:'<i data-lucide="arrow-right" width="16" height="16" aria-hidden="true"></i>',
  TRI:'<i data-lucide="triangle-alert" width="16" height="16" aria-hidden="true"></i>',
  ASS:'<i data-lucide="clipboard" width="16" height="16" aria-hidden="true"></i>',
  ORD:'<i data-lucide="file-pen" width="16" height="16" aria-hidden="true"></i>',
  DGN:'<i data-lucide="microscope" width="16" height="16" aria-hidden="true"></i>',
  TRM:'<i data-lucide="pill" width="16" height="16" aria-hidden="true"></i>',
  ADM:'<i data-lucide="bed" width="16" height="16" aria-hidden="true"></i>',
  DSP:'<i data-lucide="log-out" width="16" height="16" aria-hidden="true"></i>',
  // L4 — Operational Workflow
  SCH:'<i data-lucide="calendar" width="16" height="16" aria-hidden="true"></i>',
  REG:'<i data-lucide="user-plus" width="16" height="16" aria-hidden="true"></i>',
  ELG:'<i data-lucide="shield-check" width="16" height="16" aria-hidden="true"></i>',
  PAU:'<i data-lucide="shield" width="16" height="16" aria-hidden="true"></i>',
  BDP:'<i data-lucide="bed-double" width="16" height="16" aria-hidden="true"></i>',
  CHD:'<i data-lucide="arrow-left-right" width="16" height="16" aria-hidden="true"></i>',
  DCP:'<i data-lucide="door-open" width="16" height="16" aria-hidden="true"></i>',
  // L5 — Insurance / Financial
  PLT:'<i data-lucide="clipboard-list" width="16" height="16" aria-hidden="true"></i>',
  NST:'<i data-lucide="network" width="16" height="16" aria-hidden="true"></i>',
  PAR:'<i data-lucide="shield-x" width="16" height="16" aria-hidden="true"></i>',
  DDC:'<i data-lucide="dollar-sign" width="16" height="16" aria-hidden="true"></i>',
  PCS:'<i data-lucide="receipt" width="16" height="16" aria-hidden="true"></i>',
  OPM:'<i data-lucide="wallet" width="16" height="16" aria-hidden="true"></i>',
  // L6 — Technology / EHR
  EHR:'<i data-lucide="database" width="16" height="16" aria-hidden="true"></i>',
  SCHS:'<i data-lucide="calendar-check" width="16" height="16" aria-hidden="true"></i>',
  ORDS:'<i data-lucide="clipboard-list" width="16" height="16" aria-hidden="true"></i>',
  DOC:'<i data-lucide="file-text" width="16" height="16" aria-hidden="true"></i>',
  RES:'<i data-lucide="bar-chart-2" width="16" height="16" aria-hidden="true"></i>',
  BLL:'<i data-lucide="receipt" width="16" height="16" aria-hidden="true"></i>',
  PTP:'<i data-lucide="user-round" width="16" height="16" aria-hidden="true"></i>',
  // L7 — Data & Metrics
  AWT:'<i data-lucide="timer" width="16" height="16" aria-hidden="true"></i>',
  QUA:'<i data-lucide="star" width="16" height="16" aria-hidden="true"></i>',
  UTL:'<i data-lucide="bar-chart-2" width="16" height="16" aria-hidden="true"></i>',
  EXP:'<i data-lucide="smile" width="16" height="16" aria-hidden="true"></i>',
  FIN:'<i data-lucide="trending-up" width="16" height="16" aria-hidden="true"></i>',
  OPE:'<i data-lucide="settings-2" width="16" height="16" aria-hidden="true"></i>',
  WKF:'<i data-lucide="users" width="16" height="16" aria-hidden="true"></i>',
  // L8 — External Ecosystem
  PAY:'<i data-lucide="building" width="16" height="16" aria-hidden="true"></i>',
  PHM:'<i data-lucide="pill" width="16" height="16" aria-hidden="true"></i>',
  LAB:'<i data-lucide="flask-conical" width="16" height="16" aria-hidden="true"></i>',
  SPC:'<i data-lucide="stethoscope" width="16" height="16" aria-hidden="true"></i>',
  CMR:'<i data-lucide="landmark" width="16" height="16" aria-hidden="true"></i>',
  EMP:'<i data-lucide="briefcase" width="16" height="16" aria-hidden="true"></i>',
  PBH:'<i data-lucide="globe" width="16" height="16" aria-hidden="true"></i>',
};

// Layer-level icons indexed by layer number (1-based)
const LIC={
  1:'<i data-lucide="heart" width="16" height="16" aria-hidden="true"></i>',
  2:'<i data-lucide="building-2" width="16" height="16" aria-hidden="true"></i>',
  3:'<i data-lucide="stethoscope" width="16" height="16" aria-hidden="true"></i>',
  4:'<i data-lucide="settings-2" width="16" height="16" aria-hidden="true"></i>',
  5:'<i data-lucide="shield" width="16" height="16" aria-hidden="true"></i>',
  6:'<i data-lucide="database" width="16" height="16" aria-hidden="true"></i>',
  7:'<i data-lucide="trending-up" width="16" height="16" aria-hidden="true"></i>',
  8:'<i data-lucide="globe" width="16" height="16" aria-hidden="true"></i>',
};

const FILTERS={
  Experience:new Set([1,2,7]),
  Operational:new Set([3,4,6]),
  Financial:new Set([5,8]),
};
let sel='H';
let subSel=null;
let showLines=true;
let activeFilter='all';
let hiddenLayers=new Set();
function gL(id){for(const l of LD){const n=l.nd.find(n=>n[0]===id);if(n)return l;}return null;}
function gN(id){for(const l of LD){const n=l.nd.find(n=>n[0]===id);if(n)return n[1].replace(/\n/g,' ');}return id;}
function gPS(){return PS[sel]||new Set([sel,'H']);}

function renderBC(){
  const path=BCM[sel]||[gN(sel)];let h='';
  path.forEach((item,i)=>{if(i>0)h+='<span class="bs">&#x2192;</span>';h+=`<span class="bi${i===path.length-1?' cur':''}">${item}</span>`;});
  document.getElementById('bc').innerHTML=h;
}

function addRowArrows(){
  const ns='http://www.w3.org/2000/svg';
  document.querySelectorAll('.lnd').forEach(lnd=>{
    // Clean up prior render
    lnd.querySelectorAll('.na,.row-svg,.nnum').forEach(el=>el.remove());
    const nodes=qsa(lnd, ':scope>.nc');
    if(nodes.length<2)return;

    const lc=asEl(lnd).dataset.lc||'#4ECDC4';

    // Step-number badges
    nodes.forEach((nc,i)=>{
      const b=document.createElement('span');
      b.className='nnum';b.style.color=lc;b.textContent=String(i+1);
      nc.appendChild(b);
    });

    // Single SVG overlay — all connectors drawn here, measured from live DOM
    const svg=document.createElementNS(ns,'svg');
    svg.classList.add('row-svg');
    svg.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:3';

    // Unique marker id per layer color so multiple layers don't share markers
    const markerId='nc-arr-'+lc.replace(/[^a-f0-9]/gi,'');
    const defs=document.createElementNS(ns,'defs');
    const marker=document.createElementNS(ns,'marker');
    marker.setAttribute('id',markerId);
    marker.setAttribute('markerWidth','6');
    marker.setAttribute('markerHeight','6');
    marker.setAttribute('refX','3');
    marker.setAttribute('refY','3');
    marker.setAttribute('orient','auto');
    const tip=document.createElementNS(ns,'circle');
    tip.setAttribute('cx','3');
    tip.setAttribute('cy','3');
    tip.setAttribute('r','3');
    tip.setAttribute('fill',lc);
    tip.setAttribute('fill-opacity','0.8');
    marker.appendChild(tip);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // midpoint comparison — robust when align-items:center varies offsetTop per node height
    const midY=n=>n.offsetTop+n.offsetHeight/2;
    const ROW_THRESHOLD=32; // px: midY difference above this = different row
    const CORNER_R=8;       // rounded-corner radius on elbow connectors

    for(let i=1;i<nodes.length;i++){
      const prev=nodes[i-1];
      const curr=nodes[i];
      const sameRow=Math.abs(midY(curr)-midY(prev))<ROW_THRESHOLD;

      let d;
      if(sameRow){
        // Straight horizontal: right-edge of prev → left-edge of curr
        const x1=asEl(prev).offsetLeft+asEl(prev).offsetWidth;
        const y1=midY(prev);
        const x2=asEl(curr).offsetLeft;
        const y2=midY(curr);
        d=`M${x1},${y1} L${x2},${y2}`;
      } else {
        // Elbow connector: bottom-center of prev → horizontal mid-gap → top-center of curr
        // Matches Visio elbow routing; arrowhead enters from the top of the next node
        const x1e=asEl(prev).offsetLeft+asEl(prev).offsetWidth/2;
        const y1e=asEl(prev).offsetTop+asEl(prev).offsetHeight;   // bottom of prev node
        const x2e=asEl(curr).offsetLeft+asEl(curr).offsetWidth/2;
        const y2e=asEl(curr).offsetTop;                     // top of curr node
        const yMid=(y1e+y2e)/2;
        const dx=x2e>=x1e?1:-1; // direction of horizontal segment
        const R=Math.min(CORNER_R, yMid-y1e-1, Math.abs(x2e-x1e)/2-1);
        if(R<1||Math.abs(x2e-x1e)<4){
          // Degenerate — nodes almost vertically aligned
          d=`M${x1e},${y1e} L${x2e},${y2e}`;
        } else {
          d=[
            `M${x1e},${y1e}`,
            `L${x1e},${yMid-R}`,
            `Q${x1e},${yMid} ${x1e+dx*R},${yMid}`,  // corner: down → horizontal
            `L${x2e-dx*R},${yMid}`,
            `Q${x2e},${yMid} ${x2e},${yMid+R}`,      // corner: horizontal → down
            `L${x2e},${y2e}`,
          ].join(' ');
        }
      }

      const path=document.createElementNS(ns,'path');
      path.setAttribute('d',d);
      path.setAttribute('stroke',lc);
      path.setAttribute('stroke-opacity',sameRow?'0.92':'0.97');
      path.setAttribute('stroke-width',sameRow?'2.5':'3.5');
      path.setAttribute('fill','none');
      path.setAttribute('stroke-linecap','round');
      path.setAttribute('stroke-linejoin','round');
      path.setAttribute('marker-end',`url(#${markerId})`);
      svg.appendChild(path);
    }

    lnd.appendChild(svg);
  });
}

function renderLayers(){
  const ps=gPS();let h='';
  LD.forEach((layer,li)=>{
    const hasA=layer.nd.some(n=>n[0]===sel);
    const isHidden=hiddenLayers.has(layer.n);
    const isDimmed=activeFilter!=='all'&&!FILTERS[activeFilter].has(layer.n);
    if(!isHidden){
    h+=`<div class="lr${hasA?' ax':''}${isDimmed?' fdim':''}"><div class="ll" style="--lc:${layer.c}">`;
    h+=`<div class="ll-top">`;
    h+=`<div class="ll-icon" style="background:${layer.c}1c;border-color:${layer.c}45;color:${layer.c}">${LIC[layer.n]||'◎'}</div>`;
    h+=`<span class="ln" style="background:${layer.c}16;color:${layer.c}cc;border-color:${layer.c}30">L${layer.n}</span>`;
    h+=`</div>`;
    h+=`<div class="lt" style="color:${layer.c}ee">${layer.t.toUpperCase()}</div>`;
    h+=`<div class="lsu">${layer.st}</div></div><div class="lnd" data-lc="${layer.c}">`;
    layer.nd.forEach((nd,ni)=>{
      const id=nd[0],lbl=nd[1],isSel=id===sel,isPath=ps.has(id);
      const cls=`nc${isPath?' ip':''}${isSel?' sl':''}`;
      const bs=isSel?'':(isPath?`border-color:${layer.c}80;`:'');
      const cs='';
      const iconClr=isSel?'#E2EEF4':(isPath?layer.c+'ee':'rgba(130,168,208,0.28)');
      const iconBg=isSel?layer.c+'28':(isPath?layer.c+'14':'rgba(255,255,255,0.03)');
      const iconBd=isSel?layer.c+'70':(isPath?layer.c+'30':'rgba(255,255,255,0.06)');
      const icon=NI[id]?`<span class="ni-box" style="background:${iconBg};border-color:${iconBd}"><span class="ni" style="color:${iconClr}">${NI[id]}</span></span>`:'';
      const smTag=SM[id]?`<span class="sm-tag">MAP &#x2197;</span>`:'';
      h+=`<button type="button" class="${cls}" id="nc-${id}" style="${bs}${cs}"${isSel?' aria-current="true"':''} data-node="${id}">${icon}<span>${lbl.replace(/\n/g,'<br>')}</span>${smTag}</button>`;
    });
    h+=`</div></div>`;
    if(hasA&&SM[sel]&&!isDimmed){const sm=SM[sel];const sc=sm.c;h+=`<div class="sml" style="background:linear-gradient(135deg,${sc}12 0%,${sc}08 100%);border-top:2px solid ${sc}88;border-bottom:2px solid ${sc}44;box-shadow:0 0 0 1px ${sc}18 inset,0 4px 32px ${sc}1a,0 -2px 20px ${sc}10"><div class="sml-inner"><div class="sml-lbl" style="color:${sc};border-right-color:${sc}60">&#x21B3; ${sm.lbl}</div><span style="width:16px;flex-shrink:0;display:inline-block"></span>`;sm.nd.forEach((nd,ni)=>{if(ni>0)h+=`<svg width="40" height="20" style="flex-shrink:0;align-self:center" viewBox="0 0 40 20"><line x1="2" y1="10" x2="33" y2="10" stroke="${sc}" stroke-width="1.5" stroke-opacity="0.5"/><circle cx="36" cy="10" r="3" fill="${sc}" fill-opacity="0.8"/></svg>`;const isSub=subSel===nd[0];h+=`<button type="button" class="nc ip${isSub?' sl':''}" id="nc-${nd[0]}" style="border-color:${sc}${isSub?'':'35'}"${isSub?' aria-current="true"':''} data-subnode="${nd[0]}">${nd[1].replace(/\n/g,'<br>')}</button>`;});h+=`</div></div>`;}
    } // end isHidden check
  });
  /* Both panels rebuild wholesale, which drops keyboard focus to <body>. Re-seat
     it on the same card id: selecting a node never removes that node. */
  const focusedCard=document.activeElement&&/^nc-/.test(document.activeElement.id||'')?document.activeElement.id:null;
  document.getElementById('layers').innerHTML=h;
  if(focusedCard){const f=document.getElementById(focusedCard);if(f)f.focus({preventScroll:true});}
  if(window.lucide)lucide.createIcons();
  requestAnimationFrame(addRowArrows);
}

function renderPanel(){
  const ractEl=document.getElementById('ract');
  const ryahEl=document.getElementById('ryah');

  if(subSel&&SMD[subSel]){
    const smd=SMD[subSel];
    const par=ND[smd.parent]||{};
    const lc=par.lc||'#4ECDC4';
    document.getElementById('rpac').style.background=lc;
    const dot=document.getElementById('rpac-dot');if(dot)dot.style.background=lc;
    let yah=`<div class="rp-top">`;
    yah+=`<div class="rp-icon" style="background:${lc}18;border-color:${lc}45;color:${lc}">${NI[smd.parent]||'<i data-lucide="layers" width="20" height="20" aria-hidden="true"></i>'}</div>`;
    yah+=`<div class="rp-meta"><div class="rnt">${smd.t}</div>`;
    yah+=`<div class="rly" style="color:${lc}88">Sub-process · ${par.t||smd.parent}</div></div></div>`;
    if(smd.w){
      yah+=`<div class="rs"><div class="rh">What Happens Here</div>`;
      smd.w.forEach(b=>yah+=`<div class="rbl" style="padding-left:10px;border-left:2px solid ${lc}28;margin-bottom:6px">${b}</div>`);
      yah+=`</div>`;
    } else if(smd.desc){
      yah+=`<div class="rs"><div class="rh">What Happens Here</div><div class="rb">${smd.desc}</div></div>`;
    }
    if(smd.m){
      yah+=`<div class="rs"><div class="rh">By The Numbers</div><div class="mg">`;
      smd.m.forEach(([v,l])=>{
        const src=l.match(/(\(.*?\))$/);
        const lbl=src?l.slice(0,l.lastIndexOf(src[0])).trim():l;
        const srcTxt=src?`<span style="display:block;font-size:9px;opacity:0.5;margin-top:2px">${src[0]}</span>`:'';
        yah+=`<div class="mi" style="--sc:${lc}75"><div class="mv" style="color:${lc}">${v}</div><div class="ml">${lbl}${srcTxt}</div></div>`;
      });
      yah+=`</div></div>`;
    }
    ryahEl.innerHTML=yah;
    let ac='';
    if(smd.actors){
      ac+=`<div class="rs"><div class="rh">Actors Impacted</div><div class="chip-row">`;
      smd.actors.split(' · ').forEach(a=>ac+=`<span class="chip chip-act">${a}</span>`);
      ac+=`</div></div>`;
    }
    if(smd.sys){
      ac+=`<div class="rs"><div class="rh">Systems Used</div><div class="chip-row">`;
      smd.sys.split(' · ').forEach(s=>ac+=`<span class="chip chip-sys">${s}</span>`);
      ac+=`</div></div>`;
    }
    if(smd.pain){
      ac+=`<div class="rs"><div class="rh">Common Pain Points</div>`;
      smd.pain.forEach(p=>ac+=`<div class="pain-item"><span class="pain-ico"><i data-lucide="triangle-alert" width="13" height="13" aria-hidden="true"></i></span><span class="pain-txt">${p}</span></div>`);
      ac+=`</div>`;
    }
    ractEl.innerHTML=ac;
    if(window.lucide)lucide.createIcons();
    ractEl.style.display=ac?'':'none';
    return;
  }

  const det=ND[sel],layer=gL(sel);
  const lc=det?.lc||layer?.c||'#4ECDC4';
  const title=det?.t||gN(sel);
  const icon=NI[sel]||'◎';
  const layerLabel=det?`Layer ${det.ln} of 8 · ${det.l}`:(layer?`Layer ${layer.n} of 8 · ${layer.t}`:'');
  document.getElementById('rpac').style.background=lc;
  const dot=document.getElementById('rpac-dot');if(dot)dot.style.background=lc;

  // Header: icon, title, layer badge
  let yah=`<div class="rp-top">`;
  yah+=`<div class="rp-icon" style="background:${lc}1e;border-color:${lc}50;color:${lc}">${icon}</div>`;
  yah+=`<div class="rp-meta"><div class="rnt">${title}</div>`;
  if(layerLabel)yah+=`<div class="rly" style="color:${lc}90">${layerLabel}</div>`;
  yah+=`</div></div>`;

  // What happens here bullets
  if(det?.w){
    yah+=`<div class="rs"><div class="rh">What Happens Here</div>`;
    det.w.forEach(b=>yah+=`<div class="rbl" style="padding-left:10px;border-left:2px solid ${lc}28;margin-bottom:6px">${b}</div>`);
    yah+=`</div>`;
  } else {
    yah+=`<div class="rs"><div class="rb" style="color:rgba(130,168,205,0.35)">Select a highlighted node to explore this layer in detail.</div></div>`;
  }

  // Stats grid
  if(det?.m){
    yah+=`<div class="rs"><div class="rh">By The Numbers</div><div class="mg">`;
    det.m.forEach(([v,l])=>{
      const src=l.match(/(\(.*?\))$/);
      const lbl=src?l.slice(0,l.lastIndexOf(src[0])).trim():l;
      const srcTxt=src?`<span style="display:block;font-size:9px;opacity:0.5;margin-top:2px">${src[0]}</span>`:'';
      yah+=`<div class="mi" style="--sc:${lc}75"><div class="mv" style="color:${lc}">${v}</div><div class="ml">${lbl}${srcTxt}</div></div>`;
    });
    yah+=`</div></div>`;
  }

  ryahEl.innerHTML=yah;

  // Actors, Systems, Pain Points
  let ac='';
  if(det){
    if(det.actors){
      ac+=`<div class="rs"><div class="rh">Actors Impacted</div><div class="chip-row">`;
      det.actors.split(' · ').forEach(a=>ac+=`<span class="chip chip-act">${a}</span>`);
      ac+=`</div></div>`;
    }
    if(det.sys){
      ac+=`<div class="rs"><div class="rh">Systems Used</div><div class="chip-row">`;
      det.sys.split(' · ').forEach(s=>ac+=`<span class="chip chip-sys">${s}</span>`);
      ac+=`</div></div>`;
    }
    if(det.pain){
      ac+=`<div class="rs"><div class="rh">Common Pain Points</div>`;
      det.pain.forEach(p=>ac+=`<div class="pain-item"><span class="pain-ico"><i data-lucide="triangle-alert" width="13" height="13" aria-hidden="true"></i></span><span class="pain-txt">${p}</span></div>`);
      ac+=`</div>`;
    }
  }
  ractEl.innerHTML=ac;
  if(window.lucide)lucide.createIcons();
  ractEl.style.display=ac?'':'none';
}

const LTT={
  1:'Click to hide/show. Covers the patient journey and health status progression',
  2:'Click to hide/show. Where care is delivered: home, clinic, urgent care, hospital',
  3:'Click to hide/show. Evidence-based clinical care pathways and decision points',
  4:'Click to hide/show. Behind-the-scenes operational processes and coordination',
  5:'Click to hide/show. Insurance coverage rules, authorizations, and cost structures',
  6:'Click to hide/show. EHR systems, interfaces, and digital infrastructure',
  7:'Click to hide/show. Quality metrics, utilization data, and performance tracking',
  8:'Click to hide/show. Payers, labs, specialists, and community resources',
};
// ── A11Y — one polite live region; announce COMMITTED state changes only ──
function announce(msg){
  const el=document.getElementById('a11yLive');if(!el)return;
  el.textContent='';                                  // clear first so repeats re-announce
  requestAnimationFrame(()=>{el.textContent=msg;});
}

// ── v2 SELECTOR — the popover contract (HU-CONTROL-ARCHITECTURE-V2) ──────
// One popover open at a time; Esc closes and returns focus to the trigger;
// outside click closes; arrows walk the options; the phone renders the
// popover as a bottom sheet (CSS). The face always shows the current focus.
// the contract itself is HUKit.pop's now (kit extraction 2026-08-17)
const popCtl = HUKit.pop({});
function closePop(refocus){ popCtl.close(refocus); }
function openPopover(btn,pop,build){ popCtl.open(btn,pop,build); }
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(popCtl.escape()) return;   // one step per press: the kit owns the popover rung
  const rp=document.getElementById('rp');
  if(rp&&rp.classList.contains('open'))rp.classList.remove('open');   // then the layer sheet, same walk as its X
});
// (arrows / Home / End are the kit's, delegated across every .selector-pop)
document.querySelectorAll('.selector-pop').forEach(pop=>{
  pop.querySelector('[data-close]').addEventListener('click',()=>closePop(true));
});

// Layer selector: Focus (single-select spotlight) and Visibility (multi-select
// show/hide) share one popover — plain-text options, CSS check marks.
const FOCUS_LABEL={all:'All layers',Experience:'Patient',Operational:'Ops',Financial:'Financial'};
const FOCUS_TITLE={
  all:'Show all 8 layers of the map',
  Experience:'Patient Experience, Care Settings &amp; Metrics layers',
  Operational:'Clinical Workflow, Operational &amp; Technology layers',
  Financial:'Insurance / Financial &amp; External Ecosystem layers',
};
function buildLayerPop(){
  let h='<div class="pop-sec">Focus</div>';
  Object.keys(FOCUS_LABEL).forEach(k=>{
    h+=`<button class="pop-opt" role="option" aria-selected="${activeFilter===k}" data-focus="${k}" title="${FOCUS_TITLE[k]}">${FOCUS_LABEL[k]}</button>`;
  });
  h+='<div class="pop-sec">Visibility</div>';
  LD.forEach(l=>{
    h+=`<button class="pop-opt" role="option" aria-selected="${!hiddenLayers.has(l.n)}" data-layer="${l.n}" title="${LTT[l.n]}">L${l.n} &middot; ${l.t}</button>`;
  });
  document.getElementById('popLayerList').innerHTML=h;
}
function updateSelectorFace(){
  document.getElementById('selLayerVal').textContent=FOCUS_LABEL[activeFilter]||FOCUS_LABEL.all;
}
document.getElementById('selLayer').addEventListener('click',()=>openPopover(document.getElementById('selLayer'),document.getElementById('popLayer'),buildLayerPop));
document.getElementById('popLayerList').addEventListener('click',e=>{
  const f=hit(e,'[data-focus]');
  if(f){closePop(true);setFilter(f.dataset.focus);return;}
  const t=hit(e,'[data-layer]');
  if(t){const n=+t.dataset.layer;toggleLayer(n);t.setAttribute('aria-selected',String(!hiddenLayers.has(n)));} // immediate-apply; the panel stays open
});

// ── preset views (crit #4): authored starting points, each just a URL ──
const PRESETS=[
  {name:'What the patient feels',q:'?focus=patient'},
  {name:'The money underneath',q:'?focus=financial'},
  {name:'Where the ED sits',q:'?n=ED&focus=ops'},
];
function buildViewsPop(){
  document.getElementById('popViewsList').innerHTML=PRESETS.map(p=>
    `<button class="pop-opt" role="option" data-view-q="${p.q}">${p.name}</button>`).join('');
}
document.getElementById('selViews').addEventListener('click',()=>openPopover(document.getElementById('selViews'),document.getElementById('popViews'),buildViewsPop));
document.getElementById('popViewsList').addEventListener('click',e=>{
  const t=hit(e,'[data-view-q]');if(!t)return;
  closePop(true);
  try{history.pushState(null,'',t.dataset.viewQ);}catch(err){}
  urlCtl.begin();
  sel='H';subSel=null;activeFilter='all';hiddenLayers=new Set();
  applyURLState();
  urlCtl.end();
  const rpEl=document.getElementById('rp');
  if(rpEl&&sel==='H')rpEl.classList.remove('open');   // back to no-selection closes the phone sheet (it kept showing the DEFAULT node)
  updateSelectorFace();renderAppliedStrip();go();
  announce('View: '+t.textContent);
});

function setFilter(f){
  activeFilter=FOCUS_LABEL[f]?f:'all';
  updateSelectorFace();
  renderLayers();requestAnimationFrame(renderLines);
  syncURL();
  announce(activeFilter==='all'?'Showing all 8 layers':'Focus: '+FOCUS_LABEL[activeFilter]+' layers');
}

function toggleLayer(n){
  if(hiddenLayers.has(n))hiddenLayers.delete(n);else hiddenLayers.add(n);
  renderLayers();requestAnimationFrame(renderLines);
  renderAppliedStrip();
  syncURL();
  const l=LD.find(x=>x.n===n);
  if(l)announce(l.t+(hiddenLayers.has(n)?' layer hidden':' layer shown'));
}

// Applied strip: non-default state the selector face doesn't show (hidden
// layers). Focus lives on the face; at defaults the strip is gone.
function renderAppliedStrip(){
  const s=document.getElementById('as');if(!s)return;
  const chips=[...hiddenLayers].sort((a,b)=>a-b).map(n=>{
    const l=LD.find(x=>x.n===n);if(!l)return '';
    return `<span class="applied-chip">Hidden: <b>${l.t}</b><button class="ac-x" data-show="${n}" aria-label="Show the ${l.t} layer">&#10005;</button></span>`;
  }).join('');
  s.innerHTML=chips;
  s.hidden=!chips;
  // desktop: the strip sits absolute under the toolbar — push the content
  // region down so it never covers the map (phone: static, in flow)
  const ct=document.getElementById('ct');
  if(ct)ct.style.top=(!s.hidden&&window.innerWidth>768)?(52+s.offsetHeight)+'px':'';
}
document.getElementById('as').addEventListener('click',e=>{
  const b=hit(e,'[data-show]');
  if(b)toggleLayer(+b.dataset.show);
});

function resetAll(){
  sel='H';subSel=null;activeFilter='all';hiddenLayers.clear();
  updateSelectorFace();renderAppliedStrip();go();syncURL();
  announce('Reset to the start of the map');
}

// ── URL-ADDRESSABLE VIEWS (serializer convention, HU-CONTROL-ARCHITECTURE-V2) ──
// ?n=ED&sub=D_ESI&focus=ops&hide=5,8 — short params, stable keys (node ids +
// layer numbers), defaults omitted. Node selection PUSHES history (it is the
// scope: the breadcrumb changes); focus/visibility/sub-node tweaks REPLACE.
const FOCUS_KEY={Experience:'patient',Operational:'ops',Financial:'financial'};
const KEY_FOCUS={patient:'Experience',ops:'Operational',financial:'Financial'};
const urlCtl=HUKit.urlState({url:()=>{const q=stateToParams().toString();return q?('?'+q):location.pathname;},scope:()=>sel});
urlCtl.mark('H');   // the default node is the baseline
function stateToParams(){
  const p=new URLSearchParams();
  if(sel!=='H')p.set('n',sel);
  if(subSel)p.set('sub',subSel);
  if(activeFilter!=='all')p.set('focus',FOCUS_KEY[activeFilter]);
  if(hiddenLayers.size)p.set('hide',[...hiddenLayers].sort((a,b)=>a-b).join(','));
  return p;
}
function syncURL(){ urlCtl.sync(); }
// Idempotent: callers zero the state first (popstate) or start from defaults
// (init); invalid params degrade silently and the first sync re-serializes.
function applyURLState(){
  const p=new URLSearchParams(location.search);
  const n=p.get('n');if(n&&gL(n))sel=n;
  const sub=p.get('sub');if(sub&&SMD[sub]&&SMD[sub].parent===sel)subSel=sub;
  const f=p.get('focus');if(f&&KEY_FOCUS[f])activeFilter=KEY_FOCUS[f];
  const hide=p.get('hide');
  if(hide)hide.split(',').forEach(t=>{const v=+t;if(Number.isInteger(v)&&v>=1&&v<=8)hiddenLayers.add(v);});
  urlCtl.mark(sel);
}
window.addEventListener('popstate',()=>{
  urlCtl.begin();
  sel='H';subSel=null;activeFilter='all';hiddenLayers=new Set();
  applyURLState();
  const rpP=document.getElementById('rp');
  if(rpP&&sel==='H')rpP.classList.remove('open');   // back to no-selection closes the phone sheet (run-2 QA: the first fix landed in the preset handler, not here)
  urlCtl.end();
  updateSelectorFace();renderAppliedStrip();go();
  announce('Now at '+gN(sel));
});

function renderLeftPanel(){
  const det=ND[sel],layer=gL(sel);
  const lc=det?.lc||layer?.c||'#4ECDC4';
  const path=BCM[sel]||[gN(sel)];
  let pf='';
  path.forEach((item,i)=>{
    const isCur=i===path.length-1;
    const hasNext=i<path.length-1;
    const prefix=path.slice(0,i+1);
    const nodeId=!isCur?Object.keys(BCM).find(k=>BCM[k].length===prefix.length&&BCM[k].every((v,j)=>v===prefix[j])):null;
    /* Only the rows that go somewhere become buttons. The last row is the
       current node, and a button that does nothing is worse than no button. */
    const tag=nodeId?'button':'div';
    pf+=`<${tag} class="pti${isCur?' ptic':''}${nodeId?' ptil':''}${hasNext?' ptib':''}"${nodeId?` type="button" data-node="${nodeId}"`:''}>`;
    pf+=`<span class="ptid" style="${isCur?`background:${lc};border-color:${lc}`:''}"></span>`;
    pf+=`<span class="ptilab" style="${isCur?`color:${lc};font-weight:600`:''}">${item}</span>`;
    pf+=`</${tag}>`;
  });
  pf+=`<div class="ptl-more">&#x2026; continue to deeper layers</div>`;
  const inPath=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#lpf');
  document.getElementById('lpf').innerHTML=pf;
  if(inPath){const b=asEl(document.querySelector('#lpf .ptil'));if(b)b.focus({preventScroll:true});}
}

// ── Mobile: bottom sheet on node select ──────────────────
// This used to bolt itself on by reassigning the two select functions, which is
// legal but invisible from the call sites. Same behaviour, stated where it happens.
// The width is still read once at load, so a rotate mid-session does not switch
// you between the two behaviours, exactly as before.
/* The detail panel is the shared kit sheet on phones now, not a hand-rolled height
   animation: peek/half/full detents, drag with flick, and the hardware back button
   walks it one step instead of leaving the page.

   The old gate was `window.innerWidth <= 768`, wrong twice over: 768 is not the house
   phone line (699 is), and a `const` read once at load never notices a rotation.
   HUKit.phone() reads the media query live. */
const rpEl = document.getElementById('rp');
const rpSheet = (window.HUKit && HUKit.sheet && rpEl)
  ? HUKit.sheet(rpEl, { startDetent: 'dt-half', onDismiss: () => rpEl.classList.remove('open') })
  : null;
if (window.HUKit && HUKit.backGuard && rpEl) {
  HUKit.backGuard({
    watch: rpEl,
    active: () => HUKit.phone() && rpEl.classList.contains('open'),
    step: () => closeSheet()
  });
}
function closeSheet(){ if (rpEl) rpEl.classList.remove('open'); }
function raiseSheet(){
  if (!(window.HUKit && HUKit.phone()) || !rpEl) return;
  rpEl.classList.add('open');
  /* a selection answers at a glance: land at peek (name + short description)
     and the reader scrolls or pulls for the depth. Same ruling as the atlas
     (David, 2026-08-23): the sheet never leaps to half-screen on its own. */
  if (rpSheet) rpSheet.setDetent('dt-peek');
}

function selectNode(id){sel=id;subSel=null;go();syncURL();raiseSheet();announce('Selected: '+gN(id));}
function selectSubNode(id){subSel=id;renderLayers();renderPanel();syncURL();raiseSheet();announce('Selected: '+(SMD[id]?.t||id));}
function go(){renderBC();renderLayers();renderPanel();renderLeftPanel();requestAnimationFrame(renderLines);}

function renderLines(){
  const svg=document.getElementById('svg-lines');
  if(!svg)return;
  if(!showLines){svg.innerHTML='';return;}
  const ma=document.getElementById('ma');
  const maR=ma.getBoundingClientRect();
  const W=ma.scrollWidth;
  const H=ma.scrollHeight;
  svg.setAttribute('width',String(W));
  svg.setAttribute('height',String(H));
  const z=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
  const ps=gPS();
  let out='<defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><circle cx="3" cy="3" r="3" fill-opacity="0.85"/></marker><marker id="arrowhead-dim" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><circle cx="3" cy="3" r="3" fill-opacity="0.65"/></marker></defs>';
  LINKS.forEach(([a,b])=>{
    if(!ps.has(a)||!ps.has(b))return;
    const elA=document.getElementById('nc-'+a);
    const elB=document.getElementById('nc-'+b);
    if(!elA||!elB)return;
    const rA=elA.getBoundingClientRect();
    const rB=elB.getBoundingClientRect();
    if(!rA.width||!rB.width)return;
    const x1=(rA.left-maR.left)/z+ma.scrollLeft+(rA.width/z)/2;
    const y1=(rA.top-maR.top)/z+ma.scrollTop+(rA.height/z)-2;
    const x2=(rB.left-maR.left)/z+ma.scrollLeft+(rB.width/z)/2;
    const y2=(rB.top-maR.top)/z+ma.scrollTop+2;
    const lc=gL(a)?.c||'#4ECDC4';
    const cy=(y1+y2)/2;
    const isSel=(a===sel||b===sel);
    const op=isSel?0.97:0.82;
    const sw=isSel?4:3;
    const arrow=isSel?'arrowhead':'arrowhead-dim';
    out+=`<path d="M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}" stroke="${lc}" stroke-width="${sw}" fill="none" stroke-opacity="${op}" stroke-dasharray="${isSel?'none':'8,5'}" marker-end="url(#${arrow})"/>`;
    out+=`<circle cx="${x1}" cy="${y1}" r="${isSel?5:3.5}" fill="${lc}" fill-opacity="${op}"/>`;
  });
  svg.innerHTML=out;
}

function toggleLines(){
  showLines=!showLines;
  const btn=document.getElementById('lines-toggle');
  if(btn){btn.classList.toggle('lton',showLines);btn.setAttribute('aria-pressed',showLines?'true':'false');}
  renderLines();
}

// Restore any shared view from the URL BEFORE the first paint; the first
// sync then re-serializes, so a mangled shared link self-normalizes.
applyURLState();
updateSelectorFace();renderAppliedStrip();
renderBC();renderLayers();renderPanel();renderLeftPanel();
requestAnimationFrame(renderLines);
syncURL();
document.getElementById('ma').addEventListener('scroll',renderLines);

function scaleWrap(){
  const vw=window.innerWidth;
  const wrap=document.getElementById('wrap');
  const scaler=document.querySelector('.lab-scaler');
  // On mobile, pinch-zoom handles navigation — skip the downscale
  if(vw<=768){
    wrap.style.width='';
    wrap.style.height='';
    wrap.style.transform='';
    wrap.style.transformOrigin='';
    if(scaler)asEl(scaler).style.height='';
    return;
  }
  // desktop (vw>768 past the early return above): clear any leftover scaling.
  // The old vw<720 downscale branch could never run after the 768 guard and is gone.
  wrap.style.width='';
  wrap.style.height='';
  wrap.style.transform='';
  wrap.style.transformOrigin='';
  if(scaler)asEl(scaler).style.height='';
}
window.addEventListener('resize',scaleWrap);
scaleWrap();

// Recalculate row arrows + SVG lines on resize or zoom (debounced, double-RAF for settled DOM)
let _rzTimer;
window.addEventListener('resize',()=>{
  clearTimeout(_rzTimer);
  _rzTimer=setTimeout(()=>requestAnimationFrame(()=>{renderAppliedStrip();addRowArrows();requestAnimationFrame(renderLines);}),80);
});

(function initResize(){
  const lp=document.getElementById('lp');
  const rp=document.getElementById('rp');
  const dhL=document.getElementById('dh-l');
  const dhR=document.getElementById('dh-r');
  const MIN_W=140, MAX_W=440;
  let drag=null,sx=0,sw=0;

  function startDrag(e,panel,handle){
    drag={panel,handle};
    sx=e.clientX; sw=panel.offsetWidth;
    handle.classList.add('dhx');
    document.body.style.cursor='col-resize';
    document.body.style.userSelect='none';
    e.preventDefault();
  }

  dhL.addEventListener('mousedown',e=>startDrag(e,lp,dhL));
  dhR.addEventListener('mousedown',e=>startDrag(e,rp,dhR));

  let _rafPending=false;
  document.addEventListener('mousemove',e=>{
    if(!drag) return;
    const dx=e.clientX-sx;
    const dir=drag.panel===lp?1:-1;
    const nw=Math.min(MAX_W,Math.max(MIN_W,sw+dx*dir));
    drag.panel.style.width=nw+'px';
    // Throttle arrow + line recalc to one RAF per frame during drag
    if(!_rafPending){
      _rafPending=true;
      requestAnimationFrame(()=>{addRowArrows();requestAnimationFrame(()=>{renderLines();_rafPending=false;});});
    }
  });

  document.addEventListener('mouseup',()=>{
    if(!drag) return;
    drag.handle.classList.remove('dhx');
    drag=null;
    document.body.style.cursor='';
    document.body.style.userSelect='';
    // Final recalc after drag settles (double-RAF for settled DOM)
    requestAnimationFrame(()=>{addRowArrows();requestAnimationFrame(renderLines);});
  });
}());

/* ── delegated wiring (replaces the retired inline handlers) ─────────────── */
document.getElementById('layers').addEventListener('click', e => {
  const card = hit(e, '[data-node],[data-subnode]');
  if (!card) return;
  if (card.dataset.node) selectNode(card.dataset.node);
  else if (card.dataset.subnode) selectSubNode(card.dataset.subnode);
});
document.getElementById('lpf').addEventListener('click', e => {
  const row = hit(e, '[data-node]');
  if (row) selectNode(row.dataset.node);
});
asEl(document.querySelector('.hics .hi')).addEventListener('click', () => resetAll());
document.getElementById('lines-toggle').addEventListener('click', () => toggleLines());
document.getElementById('rpMobClose').addEventListener('click', () => {
  document.getElementById('rp').classList.remove('open');
});
