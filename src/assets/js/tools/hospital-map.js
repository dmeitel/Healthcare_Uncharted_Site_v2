/* Uncharted Medical Center: the hospital floor map.

   Lifted out of src/tools/hospital-map/index.html 2026-08-22 (roadmap rung 7, see
   docs/HU-BUILD-HARDENING-2026-08-22.md section 3). The two inline onclick
   attributes became a delegated listener and one bound handler at the foot of this
   file; nothing here is global any more. */

/* DOM narrowing helpers. querySelector returns Element and event.target returns
   EventTarget, neither of which carries .dataset, so checkJs flags every use.
   Same three shims iceberg-map.js and atlas.js use. */
/** @param {ParentNode} root @param {string} sel @returns {HTMLElement[]} */
const qsa = (root, sel) => /** @type {HTMLElement[]} */ (Array.from(root.querySelectorAll(sel)));
/** @param {Element|EventTarget|null} el @returns {HTMLElement} */
const asEl = el => /** @type {HTMLElement} */ (el);
/** delegated lookup from an event @param {Event} e @param {string} sel */
const hit = (e, sel) => /** @type {HTMLElement | null} */ (asEl(e.target).closest(sel));

// ═══════════════════════════════════════════════════════════════
// INFRASTRUCTURE DATA
// ═══════════════════════════════════════════════════════════════
const INFRA = {
  o2:    { label:'O₂',       color:'#4ECDC4', title:'Medical Oxygen Distribution',
    desc:'Piped oxygen runs through every interstitial space in the building. Central supply tanks (liquid O₂) are in the basement. Pressure is continuously monitored. A failure in the O₂ manifold triggers immediate code response: every ventilated patient is at risk within minutes.' },
  air:   { label:'Med Air',  color:'#94A3B8', title:'Medical Compressed Air',
    desc:'Medical-grade compressed air (oil-free, filtered) powers ventilators, nebulizers, and pneumatic surgical tools. Separate from the O₂ system. Compressors typically sit in plant operations. Cross-contamination with the O₂ system is a Joint Commission finding that will shut down a unit.' },
  vac:   { label:'Vacuum',   color:'#E8A838', title:'Medical Vacuum / Suction',
    desc:'Central suction pulls through every patient care area: wound drainage, airway suctioning, surgical field clearing. The vacuum system is loud, constant, and invisible until it fails. When it does, every bedside suction canister goes quiet simultaneously.' },
  pntube:{ label:'Pn-Tube',  color:'#2D9B6F', title:'Pneumatic Tube System',
    desc:'Specimens, medications, and supplies travel at 25 mph through a pressurized tube network that connects the lab, pharmacy, blood bank, and every clinical floor. A single carrier can move a STAT troponin from the ED to the lab in under 90 seconds. System downtime means runners, and delays.' },
  data:  { label:'Data/IT',  color:'#1B5FA8', title:'Network & Data Infrastructure',
    desc:'Fiber runs, copper ethernet, and wireless access points are structured in the interstitial space between floors. Epic and every connected device depends on this. Clinical-grade networks are segmented from guest WiFi. Downtime procedures (paper charting, verbal orders) get activated the moment the EHR goes offline.' },
  power: { label:'Gen-Pwr',  color:'#DF5752', title:'Emergency Generator Power',
    desc:'Red outlets throughout the building are on emergency generator circuits. Life-safety systems, ventilators, monitors, OR lighting, and the server room stay on when grid power fails. The generators sit outside or below grade; they run on diesel and require weekly testing. Time from grid failure to generator pickup: 10–30 seconds.' },
  hvac:  { label:'HVAC',     color:'#8B5CF6', title:'Mechanical / HVAC / Pressure Control',
    desc:'Negative pressure rooms (for airborne isolation) and positive pressure rooms (for immunocompromised patients) require precise HVAC zoning. OR suites run positive pressure with HEPA filtration. The interstitial mechanical space carries ductwork, condensate lines, and exhaust systems that define infection control throughout the building.' },
  n2o:   { label:'N₂O',      color:'#F472B6', title:'Nitrous Oxide',
    desc:'Nitrous oxide piping runs primarily to OR suites, procedure rooms, and some dental/pain management areas. Less common in newer hospitals as IV and inhaled alternatives have reduced reliance on piped N₂O. Scavenging systems are required wherever it is used: chronic low-level exposure is a documented occupational hazard.' },
  steam: { label:'Steam',    color:'#78716C', title:'Steam / Hot Water / Plumbing',
    desc:'Steam sterilization (autoclaves in the OR and Central Sterile) requires high-pressure steam lines running from the boiler. Hot water for scrub sinks, patient bathing, and laundry travels through insulated risers. Healthcare plumbing is also a Legionella risk: water temperature management is an infection control compliance issue.' },
};

// Which systems are active per floor (floor id → array of infra keys)
const FLOOR_INFRA = {
  'b':   ['o2','air','vac','pntube','data','power','hvac','steam'],
  'f1':  ['o2','air','vac','pntube','data','power','hvac'],
  'f2':  ['o2','air','vac','pntube','data','power','hvac','n2o','steam'],
  'f3':  ['o2','air','vac','pntube','data','power','hvac'],
  'f4':  ['o2','air','vac','pntube','data','power','hvac'],
  'f5':  ['o2','air','vac','pntube','data','power','hvac'],
  'f6':  ['o2','air','vac','pntube','data','power','hvac'],
  'f7':  ['o2','air','vac','pntube','data','power','hvac'],
  'f8':  ['o2','air','vac','pntube','data','power','hvac'],
  'f9':  ['o2','air','vac','pntube','data','power','hvac'],
  'f10': ['o2','air','vac','data','power','hvac'],
  'f11': ['o2','air','vac','pntube','data','power','hvac'],
};

// ═══════════════════════════════════════════════════════════════
// FLOOR + UNIT DATA
// ═══════════════════════════════════════════════════════════════
const FLOORS = [
  {
    id: 'f11', label: 'FL 11',
    units: [
      { id:'rt_dept',    name:'Respiratory Therapy',       short:'RT Dept', cat:'support',  size:2,
        icon:'RT', tagline:'Home base for the clinicians who manage every airway in the building.',
        overview:`<p>Respiratory Therapy might be the most misunderstood department in the building. The credential is Registered Respiratory Therapist (RRT), the training is specific and deep, and the clinical scope covers everything from pediatric aerosol treatments to adult mechanical ventilators to neonatal high-frequency oscillation. RTs are the only clinical staff in most hospitals specifically trained to manage both the patient's airway and the machine breathing for them.</p><p>This department is the dispatch point. The work happens everywhere else: ICU bedside, ED trauma bay, L&D for neonatal resuscitation, any floor where a patient's SpO₂ is dropping. When a rapid response team responds to a deteriorating patient, the RT on that team is often the one managing the airway while everyone else manages everything else.</p>`,
        staffing:'Registered Respiratory Therapists (RRT), Certified Respiratory Therapists (CRT), Respiratory Therapy Director, Clinical Educator',
        ratios:'ICU: dedicated coverage (1:4–6 ventilated patients); General floors: 1 RT covers a floor assignment; ED: on-call or dedicated depending on volume',
        flow_in:['Scheduled treatments (asthma, COPD patients on floors)','Rapid response activations','Code blues','Ventilator management consults','Neonatal delivery room calls'],
        flow_out:['Aerosol treatments administered','Ventilator management documentation in Epic','Arterial blood gas (ABG) results','Spontaneous breathing trial assessments','Extubation recommendations'],
        revenue:'Ancillary: billed per treatment by CPT code for outpatients. Bundled in DRG for inpatients. RT is frequently among the highest-impact but lowest-reimbursed clinical departments.',
        metrics:['Ventilator weaning trial completion rate','Spontaneous awakening trial (SAT) + spontaneous breathing trial (SBT) bundle compliance','Extubation success rate','Protocol adherence (asthma, COPD, pneumonia bundles)','Response time to rapid response and code blue'],
        infra:['O₂ distribution system (RT monitors and manages this building-wide)','Portable ventilators for transport','Aerosol treatment equipment','Bronchoscopy support equipment','Intubation equipment (portable airway bags on every floor)'],
        deps:['ICU (essential: cannot safely run a closed ICU without dedicated RT)','ED','NICU','L&D','All clinical floors','Pharmacy (inhaled medications)','Lab (ABG analysis)']
      },
      { id:'rehab',      name:'Inpatient Rehabilitation',  short:'Rehab',   cat:'rehab',    size:3,
        icon:'R', tagline:'Intensive therapy for patients recovering from stroke, surgery, and trauma.',
        overview:`<p>Inpatient Rehab runs on a minimum of three hours of therapy per day: PT, OT, and speech in combinations depending on the diagnosis. That's the CMS threshold for inpatient rehabilitation facility (IRF) billing, and it's the reason this unit requires patients who can tolerate that intensity. Patients who can't are steered toward a Skilled Nursing Facility instead.</p><p>The population is primarily post-stroke, post-joint replacement, traumatic brain injury, and spinal cord injury. Length of stay runs 10–14 days on average. The goal is functional independence: can this patient get themselves to the bathroom, manage their medications, and be safe at home?</p>`,
        staffing:'Physical Therapists, Occupational Therapists, Speech-Language Pathologists, Rehab Nurses, Physiatrist (MD), Rehab Techs',
        ratios:'1 RN:5–6 patients; therapy staff see 6–8 patients per day',
        flow_in:['Post-surgical (OR)','Post-stroke (ICU, Neuro)','Trauma (ICU/Med-Surg)','Transfers from other facilities'],
        flow_out:['Home with outpatient therapy','Home with home health','SNF','Long-term acute care (LTACH)'],
        revenue:'IRF-PPS (Inpatient Rehab Facility Prospective Payment System): case-mix groups (CMGs) based on diagnosis and function. High Medicare payer mix.',
        metrics:['FIM (Functional Independence Measure) gain','Discharge to community %','LOS vs. benchmark','Therapy utilization (hours/day)','Readmission rate'],
        infra:['O₂ outlets at beds','Emergency power','Therapy gym equipment','Lift equipment and Hoyer lifts'],
        deps:['PT/OT/Speech','Case Management','Social Work','Pharmacy','Imaging (follow-up imaging)']
      },
      { id:'ptotspeech', name:'PT / OT / Speech Therapy',  short:'PT/OT/ST',cat:'rehab',    size:2,
        icon:'Tx', tagline:'Home base for therapy staff who work across the entire building.',
        overview:`<p>PT, OT, and Speech are all over the building: in the ICU doing early mobility, in the ED doing functional assessments before discharge, in the NICU on speech feeding evaluations. This floor is their home base: documentation station, equipment storage, patient gym, and staff scheduling hub.</p><p>Therapy is one of the most undertriggered services in the hospital. A hospitalized patient who goes 48 hours without getting out of bed loses measurable muscle strength and functional capacity. Early mobilization, meaning PT consults within 24 hours of ICU admission, delivers as much benefit per dollar as almost anything in the building. It just requires someone to order it.</p>`,
        staffing:'Licensed PTs, PTAs, OTs, COTAs, SLPs, Rehab Techs',
        ratios:'Varies by setting · ICU therapy is 1:1; floor therapy is 4–6 patients per therapist per day',
        flow_in:['Consult orders from any floor','Scheduled inpatient rehab sessions','Outpatient referrals (if facility has outpatient clinic)'],
        flow_out:['Therapy notes in Epic','Home exercise programs','Equipment orders (DME)','Discharge recommendations'],
        revenue:'Therapy billed per unit of time (15-minute increments). Bundled in DRG for inpatients. Outpatient billed on fee schedule.',
        metrics:['Consult response time','Therapy utilization per admission','Early mobility rate in ICU','Discharge destination (home vs. SNF)'],
        infra:['Therapy gym equipment','Gait training tools','Portable equipment for floor therapy'],
        deps:['Inpatient Rehab','ICU','Med/Surg','Case Management','ED','NICU','Peds']
      },
      { id:'infusion11', name:'Infusion Center',           short:'Infusion',cat:'clinical', size:2,
        icon:'IN', tagline:'Ambulatory IV therapy: chemo, biologics, blood products, and IV antibiotics.',
        overview:`<p>The Infusion Center handles IV treatments that don't justify an inpatient bed. Chemotherapy, biologics, IV antibiotics for complex infections, blood transfusions, iron infusions: patients check in, get their infusion in a recliner chair, and go home. The clinical complexity is real. An oncology RN managing a severe infusion reaction to a biologic is running the same cognitive load as an ICU nurse for that 15-minute window.</p><p>Chair utilization drives the financial model. An empty chair is revenue walking out. Over-scheduling creates the other problem: a 6-hour chemo patient occupying a chair when a 2-hour infusion patient is waiting in the lobby. Scheduling efficiency here directly affects both revenue and patient experience.</p>`,
        staffing:'Oncology-Certified RNs (OCN), Infusion RNs, Pharmacy support (chemo verification), Scheduling Coordinators',
        ratios:'1:4–6 chairs per RN depending on infusion complexity',
        flow_in:['Oncology orders (chemo, immunotherapy)','Rheumatology (biologics)','Infectious Disease (IV antibiotics)','Hematology (blood/iron)','Post-discharge follow-up infusions'],
        flow_out:['Completed infusions with documentation in Epic','Adverse reaction reports','Pharmacy used-drug accountability'],
        revenue:'Per-visit facility fee plus drug administration CPT codes. Specialty drug revenue (biologics, chemo) is significant. 340B pricing drives margin for qualifying hospitals.',
        metrics:['Chair utilization rate','Adverse reaction rate','Pre-medication error rate','Wait time to first dose','Patient satisfaction'],
        infra:['Recliner chairs (not beds)','IV pump per chair','Emergency crash cart','Pharmacy direct line for verification','Emergency power'],
        deps:['Pharmacy (chemo compounding)','Oncology','Rheumatology','Infectious Disease','Lab (pre-infusion labs)']
      },
      { id:'dialysis11', name:'Dialysis Unit',             short:'Dialysis',cat:'clinical', size:1,
        icon:'DL', tagline:'Inpatient hemodialysis for AKI and ESRD patients admitted for other diagnoses.',
        overview:`<p>Inpatient dialysis handles two populations who have almost nothing in common except the machine. ESRD patients admitted for another reason who need their thrice-weekly dialysis continued while they're here. And acute kidney injury patients who developed renal failure during this hospitalization and need intermittent hemodialysis until their kidneys recover. Or don't.</p><p>CRRT (continuous renal replacement therapy) for critically ill patients runs at the ICU bedside, managed by critical care nursing. Inpatient dialysis handles the rest. The distinction matters operationally: it determines which nursing staff is doing what and which equipment lives where.</p>`,
        staffing:'Nephrology RNs, Dialysis Technicians, Nephrologist, Vascular Access Team',
        ratios:'1 RN per 2–3 dialysis patients',
        flow_in:['ESRD patients admitted for any reason needing dialysis continuation','AKI patients from ICU, Med-Surg, or ED who need intermittent HD'],
        flow_out:['Completed dialysis sessions with documentation','Nephrologist recommendations','Vascular access referrals'],
        revenue:'Per-session billing for inpatient dialysis. Bundled in DRG for inpatient stays. Outpatient dialysis (if offered) billed separately under ESRD payment bundle.',
        metrics:['Kt/V (dialysis adequacy measure)','Access complication rate','Treatment completion rate','AKI-to-CKD conversion rate','Vascular access patency'],
        infra:['Dialysis machines (water purification critical)','Reverse osmosis water system','Emergency power for machines','Vascular access equipment'],
        deps:['ICU (AKI patients)','Nephrology','Pharmacy (anticoagulation)','Lab (electrolytes)','Vascular Surgery (access)']
      },
    ]
  },
  {
    id: 'f10', label: 'FL 10',
    units: [
      { id:'stepdown10', name:'Step-Down / Intermediate Care',short:'Step-Down',cat:'critical',size:6,
        icon:'SD', tagline:'The unit between the ICU and the floor: closer monitoring, tighter ratios.',
        overview:`<p>The Step-Down unit exists because the gap between intensive care and general medical care is real and wide. Patients here are past the ICU but not safe at a 5:1 ratio. They need cardiac monitoring without a full critical care team. They're 12 hours out of the MICU and nobody wants to make a premature call on moving them further down.</p><p>The ratio here is 1:3. The nurses run drips, watch monitors, and make the call about whether that trend in the vitals means the patient is going back upstairs. It's the most consequential floor in the building for the patients who are getting better, and the most dangerous for the ones who aren't.</p>`,
        staffing:'Step-Down RNs (telemetry-trained), CNAs, Hospitalists with IMC experience, Respiratory Therapy on-call',
        ratios:'1:3 standard; 1:2 for vasopressor-dependent patients being weaned',
        flow_in:['ICU step-down (improving)','ED (too sick for Med/Surg, not critical enough for ICU)','PACU (post-surgical, higher acuity)','Telemetry deterioration'],
        flow_out:['Med/Surg (further improving)','ICU (deterioration)','Discharge (rare from Step-Down)'],
        revenue:'MS-DRG with MCC in most cases. Higher DRG weight than standard Med/Surg reflects resource intensity.',
        metrics:['Rapid response rate','ICU escalation rate from Step-Down','Alarm fatigue/false alarm rate','Vasopressor weaning time','Fall rate'],
        infra:['Hardwired cardiac monitoring at every bed','Central monitoring station','O₂ at beds','Arterial line capability','Emergency power','Crash cart'],
        deps:['ICU','ED','Pharmacy (drip management)','RT','Lab (frequent draws)','Case Management']
      },
      { id:'neuro',      name:'Neurology / Stroke Unit',    short:'Neuro/Stroke',cat:'clinical',size:4,
        icon:'NR', tagline:'Acute stroke, seizure management, and neurological monitoring.',
        overview:`<p>Stroke certification requires this hospital to demonstrate that every ischemic stroke patient who arrives within the treatment window gets tPA or mechanical thrombectomy considered in under an hour. The neurology unit is where those patients go after the acute intervention. Neurological assessment every 2–4 hours. Dysphagia screening before anything goes by mouth. Fall prevention protocols for patients who had a motor deficit yesterday and are trying to walk today.</p><p>The rest of the census is seizure monitoring, encephalopathy workups, Guillain-Barré, and status epilepticus cases. Nurses on this floor learn to read neuro exams: pupil reactivity, grip strength, Cincinnati Stroke Scale. That exam is the unit's real-time deterioration alert system.</p>`,
        staffing:'Neurology RNs, Neurologist, Stroke Coordinator (RN), NPs, Speech Therapy (dysphagia screening), PT/OT',
        ratios:'1:3–4; 1:2 for acute stroke in the first 24–48 hours',
        flow_in:['ED (stroke activations, seizures)','ICU step-down (post-stroke stabilization)','Direct admits from neurology clinic'],
        flow_out:['Inpatient Rehab (stroke recovery)','Med/Surg (lower-acuity neuro)','SNF','Discharge home (minor stroke, TIA)'],
        revenue:'DRG-based. Stroke DRGs with CC/MCC drive higher reimbursement. Stroke certification also affects hospital quality scores and referral volume.',
        metrics:['Door-to-needle time (tPA target: <60 min)','Door-to-groin time (mechanical thrombectomy)','NIHSS documentation compliance','Dysphagia screening completion rate','Modified Rankin Scale at discharge','90-day stroke readmission rate'],
        infra:['Continuous EEG monitoring capability','O₂ at beds','CT/MRI rapid access (often floor-specific protocol)','Swallowing evaluation equipment','Emergency power'],
        deps:['ED (stroke activation)','Radiology (CT/MRI)','Neurosurgery','PT/OT/Speech','Case Management','Pharmacy (tPA, anticoagulation)']
      },
    ]
  },
  {
    id: 'f9', label: 'FL 9',
    units: [
      { id:'nicu',       name:'Neonatal ICU',              short:'NICU',    cat:'critical', size:4,
        icon:'N', tagline:'Critical care for premature and medically complex newborns.',
        overview:`<p>Few units in the building demand as much, emotionally or technically, as the NICU. Premature infants at 24 weeks gestation weigh less than a pound and require every organ system supported externally while their bodies finish developing outside the womb. Every intervention is scaled down to a body the size of a hand: every IV placed, every ventilator setting changed.</p><p>Family-centered care is the operating model here. Parents are expected to be present, to participate in cares, to do skin-to-skin. The research is unambiguous: parental presence improves outcomes. The nursing relationship with NICU families is often the most intense and sustained in the building.</p>`,
        staffing:'Neonatal RNs, Neonatologist, Neonatal NPs, RT (dedicated or on-call), OT (feeding evaluation), Lactation Consultant, Social Work',
        ratios:'1:1 for unstable/micro-preemies; 1:2–3 for growing/feeder-growers',
        flow_in:['L&D (premature delivery, birth complications)','Transport from outside hospitals','OR (neonatal surgical cases)'],
        flow_out:['Discharge home (with outpatient follow-up)','Step-down nursery','Pediatric floor','Rarely: comfort care/hospice'],
        revenue:'MS-DRG neonatal diagnoses. Extremely high-cost patients with high Medicaid mix. NICU cases are among the most complex DRGs in the building.',
        metrics:['Gestational age at discharge','PICC complications','Retinopathy of prematurity screening compliance','Breastfeeding initiation rate','CLABSI rate','Hypothermia bundle compliance'],
        infra:['O₂ blenders at every isolette','Medical air (critical for O₂ blending)','Vacuum at every bed','Emergency power (life safety)','Temperature-controlled rooms'],
        deps:['L&D','OR','Pharmacy (NICU-specific compounding)','RT','OT','Social Work','Case Management']
      },
      { id:'peds',       name:'Pediatrics',                short:'Peds',    cat:'maternal', size:3,
        icon:'P', tagline:'Inpatient care for children from infancy through adolescence.',
        overview:`<p>Pediatric inpatient care runs on its own rules: drug dosing, normal vital sign ranges, pain assessment tools, and family dynamics are all different from adult medicine. A three-year-old can't tell you their pain is a 7/10. A teenager might not tell you anything at all with their parents in the room. Pediatric nurses learn to read the family as much as the patient.</p><p>The payer mix on the pediatric floor is heavily Medicaid, which is the primary payer for children in the U.S. That creates a reimbursement gap that pediatric hospitals perpetually manage around.</p>`,
        staffing:'Pediatric RNs, Pediatric Hospitalist, Child Life Specialists, Social Work, Family presence',
        ratios:'1:3–4 depending on acuity; Child Life 1:unit',
        flow_in:['ED (admitted children)','PICU (step-down)','Direct admits from pediatric providers','Transfers from rural hospitals'],
        flow_out:['Discharge home','PICU (deterioration)','Subspecialty transfer','Hospice/comfort care'],
        revenue:'MS-DRG pediatric diagnoses. High Medicaid mix. Some states have supplemental Medicaid payments for pediatric hospitals.',
        metrics:['Pediatric sepsis bundle compliance','Fall rate','Family satisfaction','LOS vs. benchmark','Readmission rate'],
        infra:['O₂ at beds','Emergency power','Child life activity spaces','Family sleep accommodations'],
        deps:['PICU','NICU','ED','Social Work','Child Life','Case Management','Pharmacy']
      },
      { id:'picu',       name:'Pediatric ICU',             short:'PICU',    cat:'critical', size:3,
        icon:'PI', tagline:'Intensive care for critically ill children: the highest-acuity pediatric unit.',
        overview:`<p>The PICU covers the full range of pediatric critical illness: respiratory failure, septic shock, post-cardiac surgery, traumatic brain injury, status epilepticus, and cases that don't fit a clean category. Pediatric intensivists manage care with the understanding that a child's physiologic reserve can mask deterioration until it's catastrophic, and then the drop is fast.</p><p>The emotional weight in the PICU is substantial. Families are often not prepared for what a critically ill child looks like. The nursing and physician staff carry a disproportionate share of the grief that comes with pediatric deaths and poor outcomes.</p>`,
        staffing:'Pediatric Critical Care RNs, Pediatric Intensivist, PICU NPs, RT (dedicated), Social Work, Child Life',
        ratios:'1:1–2 depending on instability',
        flow_in:['Pediatric floor (deterioration)','ED (critical pediatric presentations)','OR (post-pediatric surgery)','Neonatal step-down'],
        flow_out:['Pediatric floor (step-down)','Discharge home (rare, only stable)','Tertiary children\'s hospital transfer','Comfort care'],
        revenue:'High-complexity DRGs with CC/MCC. High resource intensity but also high Medicaid mix.',
        metrics:['Ventilator days','PICU LOS','Rapid response activations from pediatric floor','Mortality index'],
        infra:['Medical gas at every bed','Emergency power','Bedside monitoring networked to central station','Portable ventilators'],
        deps:['Peds floor','NICU','OR','ED','RT','Pharmacy','Social Work','Child Life']
      },
    ]
  },
  {
    id: 'f8', label: 'FL 8',
    units: [
      { id:'ld',         name:'Labor & Delivery',          short:'L&D',     cat:'maternal', size:6,
        icon:'L', tagline:'Where babies arrive, and where obstetric emergencies are managed.',
        overview:`<p>L&D is one of the few units in the building where two patients show up and three leave. It's also a place where a routine event can become a hemorrhagic emergency in under two minutes. The nursing skill mix is its own discipline: electronic fetal monitoring interpretation, oxytocin titration, shoulder dystocia maneuvers. You can't float a med-surg nurse into an active labor assignment.</p><p>Maternal mortality in the U.S. is an ongoing public health failure, and L&D units are on the front line of addressing it. Hemorrhage protocols, hypertension bundles, and sepsis recognition in the obstetric patient are Joint Commission National Patient Safety Goals for this unit specifically.</p>`,
        staffing:'Labor RNs, OB/GYN Physicians, Certified Nurse-Midwives (CNMs), Anesthesiology (epidurals, C-sections), OR team on standby, Neonatology on call (NICU backup)',
        ratios:'1:1 active labor; 1:2 early labor or antepartum monitoring',
        flow_in:['Patients presenting in labor','Scheduled inductions','Scheduled C-sections','High-risk antepartum transfers'],
        flow_out:['Mother-Baby (vaginal delivery)','OR (C-section)','ICU (maternal critical illness)','NICU (neonate)','Discharge if false labor'],
        revenue:'DRG-based obstetric payments. Medicaid is the largest payer for deliveries nationally. C-section DRGs pay more than vaginal delivery DRGs.',
        metrics:['Primary C-section rate','NTSV (nulliparous, term, singleton, vertex) C-section rate','Hemorrhage bundle compliance','Hypertension bundle compliance','Episiotomy rate','Early elective delivery rate'],
        infra:['O₂ at every room','Medical air for neonatal resuscitation','Emergency power','OR on same or adjacent floor for emergent C-section'],
        deps:['OR','NICU','ICU','Anesthesiology','Pharmacy (oxytocin, magnesium)','Blood Bank (hemorrhage)','RT (neonatal resuscitation)']
      },
      { id:'motherbaby', name:'Mother-Baby / Postpartum',  short:'MB Unit', cat:'maternal', size:4,
        icon:'MB', tagline:'Recovery and newborn care after delivery: the highest-volume unit in most hospitals.',
        overview:`<p>Mother-Baby is where the largest patient volume in most community hospitals lives. Vaginal delivery patients stay 48 hours, C-section patients stay 72–96 hours. During that window, the nurses are managing postpartum recovery for the mother and newborn care and feeding assessment for the baby simultaneously: two patients per room, one nurse covering multiple rooms.</p><p>Breastfeeding support, newborn jaundice monitoring, postpartum depression screening, and discharge teaching are the core work. What looks routine from the outside is a dense clinical and educational workflow that most patients experience as their most memorable hospital admission.</p>`,
        staffing:'Mother-Baby RNs, OB/GYN or Hospitalist for mother, Neonatologist or Pediatrician for newborn, Lactation Consultant, Social Work',
        ratios:'1:3–4 (mother-baby couplets)',
        flow_in:['From L&D after delivery','From OR after C-section (when stable)'],
        flow_out:['Discharge home (mother + newborn)','NICU (newborn deterioration)','ICU (maternal deterioration)','Pediatric floor (newborn illness)'],
        revenue:'Bundled with delivery DRG for the initial stay. Newborn has its own DRG if admitted for illness.',
        metrics:['Exclusive breastfeeding rate at discharge','Newborn hyperbilirubinemia readmission rate','Postpartum depression screening rate','Early discharge rate','Patient satisfaction'],
        infra:['O₂ at beds (maternal and newborn)','Phototherapy equipment (jaundice)','Emergency power'],
        deps:['L&D','NICU','Lactation Services','Social Work','Pharmacy','Pediatrics']
      },
    ]
  },
  {
    id: 'f7', label: 'FL 7',
    units: [
      { id:'medsurg7',   name:'Medical / Surgical Unit',   short:'Med/Surg',cat:'clinical', size:7,
        icon:'MS', tagline:'General inpatient care: the backbone of hospital census.',
        overview:`<p>Most of the hospital's patients live on Med/Surg. Post-surgical recovery, medical admissions that don't need the ICU, observation stays, and patients boarding from the ED while they wait for a bed upstream: it's all here. The nursing workload is dense: 4–5 patients per nurse, each with different diagnoses, different medications, different family situations.</p><p>Med/Surg is also where deterioration happens. A patient who looked stable at 0700 can be in septic shock by 1400. Rapid response teams exist largely because of this reality: someone on the floor identified the change and escalated before it became a code blue.</p>`,
        staffing:'RNs, CNAs/PCTs, Hospitalist MDs, Resident physicians (in teaching hospitals), Unit Secretary, Case Management embedded',
        ratios:'1:4–5 day shift; 1:5–6 nights',
        flow_in:['ED admits','Step-down transfers','Direct admits from provider offices','OR post-op (lower acuity)'],
        flow_out:['Discharge home','SNF/LTACH','Step-down (deterioration to telemetry)','ICU (rapid response/code)','Hospice'],
        revenue:'MS-DRG based on principal diagnosis and CC/MCC modifiers. Coding accuracy matters significantly here.',
        metrics:['Falls rate','Hospital-acquired pressure injury (HAPI) rate','HCAHPS scores','Rapid response rate','30-day readmission rate','Discharge before noon %'],
        infra:['O₂ outlets at each bed','Nurse call system','Emergency power for outlet strips','Pyxis per unit','Pneumatic tube for specimens/meds'],
        deps:['Pharmacy','Lab','Imaging (portable)','RT','PT/OT','Case Management','Social Work']
      },
      { id:'psych',      name:'Behavioral Health / Inpatient Psych', short:'Psych', cat:'behavioral', size:3,
        icon:'BH', tagline:'Inpatient psychiatric stabilization: a locked unit with a distinct care model.',
        overview:`<p>The inpatient psych unit is a locked unit. That single fact shapes everything about how it operates: staffing, physical design, visitor management, and the therapeutic milieu. Patients are here because they are a danger to themselves or others and cannot be safely managed in the community. The goal is stabilization and discharge to a lower level of care. Cure works on a much longer timescale than an inpatient stay.</p><p>Psychiatric inpatient beds are chronically scarce relative to need. The gap between the number of people in the ED on a psychiatric hold and the number of available inpatient psych beds is one of the most visible pressure points in behavioral health access. Boarding psychiatric patients in the ED while they wait for inpatient placement is now routine in most health systems.</p>`,
        staffing:'Psychiatric RNs, Mental Health Technicians (1:1 for high-risk), Psychiatrists, Psychologists, Social Workers, Activity Therapists',
        ratios:'1:4–6 stable; 1:1 for active suicidality or violence risk',
        flow_in:['ED (voluntary and involuntary psychiatric holds)','Direct admits from outpatient psychiatry','Crisis intervention programs','Court-ordered commitments'],
        flow_out:['Discharge to outpatient psychiatry','Partial hospitalization program (PHP)','Residential treatment','Long-term state psychiatric facility','Medical floor (medical comorbidity)'],
        revenue:'MS-DRG psychiatric diagnoses. Often lower reimbursement relative to medical complexity. Medicaid and Medicare are dominant payers. Parity law compliance is an ongoing issue.',
        metrics:['LOS vs. benchmark','Restraint/seclusion rate','Elopement rate','Readmission within 30 days','Medication adherence at discharge','Safety screening completion'],
        infra:['Ligature-resistant design throughout','No sharps at patient level','Emergency power','Secure entry/exit','Separate courtyard/outdoor space'],
        deps:['ED','Social Work','Case Management','Pharmacy','Medical floors (medical comorbidities)','Community mental health partners']
      },
    ]
  },
  {
    id: 'f6', label: 'FL 6',
    units: [
      { id:'medsurg6',   name:'Medical / Surgical Unit',   short:'Med/Surg',cat:'clinical', size:7,
        icon:'MS', tagline:'General inpatient care: medical, surgical, and post-procedure admissions.',
        overview:`<p>This Med/Surg unit runs the same model as FL 7: the backbone of inpatient census, generalist nursing with hospitalist coverage, and a patient population that spans everything from elective surgery recovery to new diabetes diagnoses to CHF exacerbations.</p><p>The two Med/Surg floors in this building carry most of the hospital's inpatient volume. Efficiency here: discharge timing, readmission prevention, and fall prevention: drives a significant portion of the hospital's overall quality metrics and financial performance.</p>`,
        staffing:'RNs, CNAs/PCTs, Hospitalists, Unit Secretary, embedded Case Management',
        ratios:'1:4–5 day shift; 1:5–6 nights',
        flow_in:['ED admits','Step-down transfers','OR post-op','Direct admits'],
        flow_out:['Discharge home','SNF','Telemetry/Step-down (deterioration)','ICU','Hospice'],
        revenue:'MS-DRG. Coding and documentation integrity drive reimbursement accuracy.',
        metrics:['Falls rate','HAPI rate','HCAHPS','Rapid response activations','30-day readmissions','Discharge before noon %'],
        infra:['O₂ at beds','Nurse call','Emergency power','Pyxis','Pneumatic tube'],
        deps:['Pharmacy','Lab','Imaging','RT','PT/OT','Case Management','Social Work']
      },
      { id:'lab',        name:'Clinical Lab / Pathology',  short:'Lab',     cat:'support',  size:3,
        icon:'Lb', tagline:'Where clinical decisions wait. STAT results change care in minutes.',
        overview:`<p>The lab runs 24/7. There is no version of this building that functions without it. Every sepsis workup, every troponin, every CBC, every culture: it all runs through here. STAT turnaround time is a direct patient safety metric. When the pneumatic tube brings a lactate sample from the ICU at 2 AM and the result comes back in 45 minutes instead of 30, someone is making a worse clinical decision in the meantime.</p><p>Blood bank sits inside the lab. That means trauma activations, major surgical cases, and obstetric hemorrhages all route through the same department. The blood bank tech on the overnight shift is one of the most consequential people in the building.</p>`,
        staffing:'Medical Laboratory Scientists (MLS/MT), Medical Laboratory Technicians (MLT), Phlebotomists, Blood Bank Technologists, Pathologist, Lab Director',
        ratios:'Variable by shift; overnight coverage is a common staffing pressure point',
        flow_in:['Specimens via pneumatic tube (blood, urine, CSF, cultures)','Biopsy tissue from OR/procedures','Phlebotomy draws from floors'],
        flow_out:['Results to Epic (STAT and routine)','Critical value calls to clinical team','Blood products from blood bank','Pathology reports'],
        revenue:'Per-test CPT billing for outpatient. Bundled in DRG for inpatients. Reference lab send-outs add cost.',
        metrics:['STAT turnaround time (troponin, lactate, CBC: target <60 min)','Critical value notification time','Specimen rejection rate','Blood culture contamination rate','PT/INR turnaround for anticoagulation management'],
        infra:['Pneumatic tube system (primary specimen transport)','Automated analyzers (CBC, chemistry, coagulation)','Blood bank refrigerators/freezers','Biosafety cabinets','Emergency power for analyzers and blood storage'],
        deps:['ED (STAT pipeline)','ICU (frequent draws)','OR (blood bank)','Pharmacy (drug levels)','All clinical floors','Pathology suite']
      },
    ]
  },
  {
    id: 'f5', label: 'FL 5',
    units: [
      { id:'cardiotele',  name:'Cardiac / Telemetry',      short:'Cardio/Tele',cat:'clinical',size:7,
        icon:'CT', tagline:'Continuous cardiac monitoring for patients at risk for arrhythmia or cardiac events.',
        overview:`<p>Telemetry is Med/Surg with continuous cardiac monitoring. Every patient is on a monitor. A central monitoring technician watches the telemetry feeds for the whole unit and calls the floor nurse when they see a rhythm worth acting on. That 3 AM call about a new A-fib with RVR is the job.</p><p>The patient population is largely post-cardiac catheterization, chest pain rule-out, new atrial fibrillation, syncope workup, and heart failure management. The step between telemetry and the ICU is crossed when the patient requires more frequent assessment than a 5:1 ratio allows, or when vasopressors or mechanical support enter the picture.</p>`,
        staffing:'Cardiac-trained RNs, Telemetry Technicians (central monitoring), Cardiologists, Hospitalists, CNAs',
        ratios:'1:4–5 with central monitoring tech watching the full unit rhythm strip',
        flow_in:['ED (cardiac presentations, chest pain, arrhythmia)','Cath Lab post-procedure','ICU step-down (improving cardiac patients)','Direct cardiac admits'],
        flow_out:['Discharge home','Med/Surg (improving, monitoring no longer needed)','ICU (deterioration)','Cath Lab (intervention needed)','Cardiac Rehab'],
        revenue:'DRG-based with cardiac-specific codes. Acute MI, heart failure, and arrhythmia DRGs drive this floor.',
        metrics:['Telemetry alarm fatigue/false alarm rate','Response time to critical arrhythmia','Heart failure core measure compliance','LVEF documentation rate','Readmission rate'],
        infra:['Hardwired telemetry at every bed','Central monitoring station','O₂ at beds','Crash cart with defibrillator','Emergency power','Pyxis'],
        deps:['Cath Lab','ICU','Pharmacy','Lab (cardiac enzymes)','Case Management','Cardiology']
      },
      { id:'pharmacy',   name:'Central Pharmacy',          short:'Pharmacy',cat:'support',  size:3,
        icon:'Rx', tagline:'The drug supply chain for the entire building: verification, compounding, and dispensing.',
        overview:`<p>Every medication order in this building routes through Central Pharmacy before it reaches a patient. A clinical pharmacist verifies it. A tech prepares it. And in the ICU, a clinical pharmacist rounds with the team, managing drip titrations and flagging interactions that the physician didn't catch at 2 AM. That's the full scope of the department.</p><p>The 340B program, oncology compounding, and specialty drug dispensing make pharmacy one of the few clinical departments that is simultaneously a major revenue driver and a cost center. Getting the billing right requires accurate tracking on every vial.</p>`,
        staffing:'Clinical Pharmacists (order verification, ICU rounding), Pharmacy Technicians (compounding, Pyxis restocking, delivery), Pharmacy Director, Oncology Pharmacist',
        ratios:'Variable; overnight coverage is typically leaner with remote pharmacist verification in some systems',
        flow_in:['Electronic medication orders from all floors (Epic)','Pyxis discrepancy reports','Controlled substance requests','Chemotherapy orders'],
        flow_out:['Verified medication orders','IV medications via pneumatic tube or tech delivery','Pyxis restocks','Chemotherapy to infusion center','Clinical pharmacy consultations'],
        revenue:'Major revenue driver AND cost center simultaneously. Specialty drug dispensing (oncology, biologics) can account for 30–40% of hospital net revenue. 340B program participation creates separate tracking requirements.',
        metrics:['Order verification turnaround time','Medication error rate','Adverse drug event (ADE) rate','Pyxis discrepancy rate','Antimicrobial stewardship compliance','Controlled substance reconciliation accuracy'],
        infra:['Pneumatic tube (direct connection: highest traffic)','IV laminar flow hoods (sterile compounding)','Controlled substance vault','Temperature-controlled storage (refrigerator, freezer)','Emergency power for refrigeration'],
        deps:['All clinical floors (every patient)','ICU (drip management)','Oncology/Infusion','Lab (drug levels)','Nursing (Pyxis interface)','IT (Epic integration)']
      },
    ]
  },
  {
    id: 'f4', label: 'FL 4',
    units: [
      { id:'micu',       name:'Medical ICU',               short:'MICU',    cat:'critical', size:4,
        icon:'MI', tagline:'Critical care for the sickest medical patients: sepsis, respiratory failure, multi-organ dysfunction.',
        overview:`<p>The MICU handles what the floor can't contain. Septic shock requiring vasopressors. Respiratory failure requiring mechanical ventilation. Acute liver failure. Diabetic ketoacidosis that won't close. The patients here are being kept alive by a combination of nursing vigilance, technology, and pharmacology running simultaneously, around the clock.</p><p>Nursing in the MICU is 1:2 at best. Every assessment takes longer. Every intervention requires more documentation. The acuity demands that nurses integrate continuous vital sign data, ventilator parameters, medication drips, and clinical trajectory into a coherent picture, and communicate that picture clearly at every handoff.</p>`,
        staffing:'Critical Care RNs, Intensivist (MD), Critical Care NPs/PAs, RT (dedicated ICU coverage), Clinical Pharmacist (rounding), CNAs, Unit Secretary',
        ratios:'1:2 standard; 1:1 for unstable/post-procedure/ECMO',
        flow_in:['ED (direct ICU admits: sepsis, respiratory failure)','Step-down deterioration','OR (complex post-surgical)','Rapid response calls from floor'],
        flow_out:['Step-down/IMC (improving)','Medical floor (further improving)','Long-term acute care (LTACH: prolonged ventilation)','Comfort care/hospice','Death (highest mortality unit in building)'],
        revenue:'High-complexity DRGs with MCC. Ventilator days, procedures (central lines, arterial lines, bronchoscopy), and diagnoses compound the DRG weight.',
        metrics:['Ventilator days','VAP bundle compliance','CLABSI rate','CAUTI rate','ICU LOS','Rapid response to ICU conversion rate','Delirium screening compliance (CAM-ICU)','Early mobility compliance'],
        infra:['Medical gas at every bed (O₂, Air, Vacuum, N₂O)','Bedside monitoring networked to central station','Emergency power (life safety)','Laminar airflow/negative pressure isolation rooms','Pyxis ICU cabinet','Pneumatic tube'],
        deps:['RT (essential)','Pharmacy (drip management)','Lab (frequent STAT draws)','Imaging (portable CXR daily)','Step-down','ED','Blood Bank']
      },
      { id:'sicu',       name:'Surgical ICU',              short:'SICU',    cat:'critical', size:3,
        icon:'SI', tagline:'Post-operative critical care for high-acuity surgical patients.',
        overview:`<p>The SICU is the ICU destination for patients coming out of complex surgery: abdominal emergencies, vascular procedures, major trauma, and surgical complications. The intensivist here works closely with the surgical team; care is often co-managed with the operating surgeon who owns the problem that landed the patient in the OR in the first place.</p><p>Surgical ICU nursing requires comfort with wound management, drain outputs, surgical complications (anastomotic leak, wound dehiscence, post-op hemorrhage), and the immediate post-operative physiology of a patient who just had their chest or abdomen opened.</p>`,
        staffing:'Critical Care RNs, Surgical Intensivist, Surgery Attendings, Surgical Residents (teaching hospitals), RT, Clinical Pharmacist',
        ratios:'1:2 standard; 1:1 for fresh post-op or unstable',
        flow_in:['OR (direct post-operative transfer)','ED (surgical emergencies)','Floor surgical complications','Trauma activation'],
        flow_out:['Step-down','Surgical floor','LTACH (prolonged recovery)','Comfort care'],
        revenue:'High-weight surgical DRGs with CC/MCC. OR time, ICU days, and procedure complexity drive reimbursement.',
        metrics:['SSI rate','Post-op complication rate','Ventilator days','Return to OR rate','ICU LOS','Blood product utilization'],
        infra:['Full medical gas panel','Emergency power','Wound vacuum equipment','Monitoring to central station','Blood warmer'],
        deps:['OR','Blood Bank','Pharmacy','Lab','RT','Imaging (portable)','Central Sterile']
      },
      { id:'cvicu',      name:'Cardiovascular ICU',        short:'CVICU',   cat:'critical', size:3,
        icon:'CV', tagline:'Critical cardiac care: post-CABG, TAVR, ECMO, and cardiogenic shock.',
        overview:`<p>The most complex cardiac patients in the building come to the CVICU to recover. Some of them won't. Post-coronary bypass surgery, transcatheter valve replacements, patients in cardiogenic shock on intra-aortic balloon pumps or ECMO: this is the highest-stakes unit in the cardiac service line. A patient on ECMO has their heart and lungs replaced by a machine the size of a suitcase running next to their bed.</p><p>CVICU nursing requires specialty training beyond standard ICU. Managing a patient on VA-ECMO, titrating multiple vasoactive drips simultaneously, interpreting continuous hemodynamic monitoring: this is a clinical skill set that takes years to develop and is difficult to staff for.</p>`,
        staffing:'Cardiovascular Critical Care RNs, Cardiac Intensivist/Cardiac Surgery team, Perfusionists (ECMO), RT, Clinical Pharmacist (cardiac)',
        ratios:'1:1–2; ECMO patients are always 1:1',
        flow_in:['Cath Lab (post-intervention, cardiogenic shock)','OR (post-cardiac surgery)','ED (STEMI, acute decompensated heart failure)','Transfer from outside hospitals'],
        flow_out:['Cardiac Telemetry (step-down)','Cardiac Rehab','LTACH','Comfort care'],
        revenue:'Highest-weight cardiac DRGs. CABG, valve procedures, and ECMO carry among the highest DRG weights in the system.',
        metrics:['Sternal wound infection rate','IABP complication rate','ECMO circuit complications','Cardiac surgery mortality index','ICU LOS','Readmission to CVICU'],
        infra:['Full medical gas panel','Emergency power (ECMO cannot tolerate even brief interruption)','Hemodynamic monitoring systems','IABP machines','ECMO circuit equipment'],
        deps:['Cath Lab','OR (cardiac surgery)','Pharmacy','Blood Bank','Perfusionists','RT','Cardiac Telemetry']
      },
    ]
  },
  {
    id: 'f3', label: 'FL 3',
    units: [
      { id:'stepdown',   name:'Step-Down / IMC',           short:'Step-Down',cat:'critical',size:3,
        icon:'SD', tagline:'The bridge between the ICU and the general floor: intermediate acuity.',
        overview:`<p>Step-Down (also called Intermediate Care, IMC, or PCU) is the safety net between the ICU and Med/Surg. Patients here need more monitoring than a 5:1 ratio allows but don't require the full resource intensity of the ICU. Think: a patient on a heparin drip, or post-procedure with an arterial line, or a heart failure patient titrating diuresis.</p><p>The step-down bed is one of the most contested resources in the building. ICU patients waiting for a step-down bed to open are blocking ICU beds from new admits. Step-down patients waiting for a Med/Surg bed are blocking step-down capacity. The whole throughput chain runs through this unit.</p>`,
        staffing:'Step-Down RNs, Hospitalists/Intensivists, CNAs',
        ratios:'1:3 typically; continuous monitoring for some patients',
        flow_in:['ICU (improving patients)','ED (intermediate acuity)','Post-procedure (cath, endo)','OR (lower-complexity post-op)'],
        flow_out:['Med/Surg (continuing improvement)','ICU (deterioration)','Discharge home (occasionally)'],
        revenue:'DRG with step-down level of care. Clinical documentation must justify intermediate care vs. floor care.',
        metrics:['Upgrade to ICU rate','LOS vs. benchmark','Alarm fatigue index','Capacity availability hours'],
        infra:['O₂ at beds','Telemetry monitoring','Emergency power','Pyxis'],
        deps:['ICU','Med/Surg','Pharmacy','Lab','Case Management']
      },
      { id:'wound',      name:'Wound Care Center',         short:'Wound',   cat:'clinical', size:2,
        icon:'W', tagline:'Specialized management of chronic wounds, pressure injuries, and surgical site complications.',
        overview:`<p>Wound care is a subspecialty that most people don't think about until they have a wound that won't close. Diabetic foot ulcers, pressure injuries, venous stasis ulcers, dehisced surgical sites: these are the problems that can lead to amputation, sepsis, or prolonged hospitalization if managed poorly. Wound care specialists are the ones who prevent that.</p><p>Inpatient wound care teams round on patients throughout the building. This floor-based department provides the base for complex wound procedures, hyperbaric oxygen therapy (at some facilities), and outpatient wound clinic visits.</p>`,
        staffing:'Wound, Ostomy and Continence Nurses (WOCNs), Wound Care Physicians, Vascular Surgery consults, Hyperbaric Technicians',
        ratios:'Consult-based across building; dedicated clinic schedule for outpatients',
        flow_in:['Inpatient consults (any floor)','Outpatient wound clinic referrals','Post-surgical complications'],
        flow_out:['Wound care plan embedded in nursing care','Home health wound care orders','Outpatient follow-up'],
        revenue:'Outpatient wound clinic billed on E&M + procedure codes. Inpatient wound care bundled in DRG.',
        metrics:['Wound healing rate','Amputation prevention rate','Pressure injury incidence (hospital-acquired)','Time to wound closure'],
        infra:['Wound VAC equipment','Hyperbaric chamber (if offered)','Negative pressure wound therapy supplies'],
        deps:['Vascular Surgery','Orthopedics','Endocrinology','Home Health','Case Management','Med/Surg','Diabetic Foot Program']
      },
      { id:'infusion',   name:'Infusion / Oncology Infusion', short:'Infusion', cat:'clinical', size:3,
        icon:'IV', tagline:'Outpatient and inpatient IV therapy: chemotherapy, biologics, and hydration.',
        overview:`<p>Chemotherapy and biologic drugs are both extremely expensive and billed at a significant markup, which puts infusion among the highest-margin outpatient service lines in healthcare. A single infusion of a monoclonal antibody can carry a facility charge in the tens of thousands of dollars.</p><p>The nursing in an infusion center requires chemotherapy certification. These are toxic drugs: extravasation (leakage outside the vein) causes tissue necrosis. Anaphylaxis protocols run in the background of every new biologic infusion. The patients are often regulars who come weekly or monthly for years.</p>`,
        staffing:'Infusion RNs (chemo-certified), Oncology Pharmacists, Oncologists, Palliative Care access',
        ratios:'1:4–6 stable infusion; 1:1–2 for new chemotherapy regimens or high-risk agents',
        flow_in:['Oncology outpatient orders','Inpatient orders for IV medications not available elsewhere','Post-discharge IV antibiotic completion'],
        flow_out:['Discharge home','Admitted to oncology floor (if inpatient admission needed)','Hospice/palliative care referral'],
        revenue:'High-revenue outpatient service. Infusion drug revenue (buy-and-bill or 340B pharmacy), plus infusion facility fee and nursing visit fee.',
        metrics:['Chair utilization rate','Infusion wait time','Adverse reaction rate','Chemotherapy error rate (near-zero tolerance)','340B compliance'],
        infra:['IV pumps','Chemo-safe waste disposal','Emergency power','Resuscitation equipment (anaphylaxis)','Negative pressure pharmacy hood for chemo preparation'],
        deps:['Oncology Pharmacy','Lab (CBC before each chemo cycle)','Radiology (port placement)','Palliative Care','Case Management']
      },
      { id:'dialysis',   name:'Inpatient Dialysis',        short:'Dialysis',cat:'clinical', size:2,
        icon:'D', tagline:'Renal replacement therapy for hospitalized patients with acute or chronic kidney failure.',
        overview:`<p>Inpatient dialysis serves two populations: patients with end-stage renal disease (ESRD) who were already on outpatient dialysis when they got admitted for something else, and patients with acute kidney injury (AKI) who develop renal failure during their hospitalization. The second group is often sicker · AKI in the context of sepsis or major surgery carries significant mortality.</p><p>Continuous renal replacement therapy (CRRT) is the ICU version: slower, gentler, tolerated by hemodynamically unstable patients who can't handle the fluid shifts of intermittent hemodialysis. The dialysis team often runs CRRT machines at the ICU bedside rather than transporting the patient down here.</p>`,
        staffing:'Nephrology RNs (dialysis-trained), Nephrologists, Dialysis Technicians',
        ratios:'1:1 during active dialysis treatment',
        flow_in:['ESRD patients admitted for other diagnoses','AKI patients (consult from ICU, Med/Surg, ED)','Post-renal transplant complications'],
        flow_out:['Return to floor or ICU after treatment','Outpatient dialysis center (at discharge)','Hospice (if dialysis withdrawal)'],
        revenue:'Bundled dialysis payment for ESRD patients. AKI dialysis billed separately. Complex billing with Medicare ESRD program.',
        metrics:['Kt/V (dialysis adequacy)','Access complication rate (AV fistula, catheter)','CRRT circuit clotting rate','AKI recovery rate'],
        infra:['Specialized water treatment system (dialysate purity)','Reverse osmosis water supply','Emergency power (active treatment cannot interrupt)','Dialysis machines'],
        deps:['ICU (CRRT)','Nephrology','Pharmacy (heparin for circuits)','Lab (electrolyte monitoring)','Vascular Surgery (access placement)']
      },
    ]
  },
  {
    id: 'f2', label: 'FL 2',
    units: [
      { id:'or',         name:'Operating Rooms',           short:'OR',      cat:'procedural',size:4,
        icon:'OR', tagline:'Scheduled and emergent surgery: the highest-revenue service line in the building.',
        overview:`<p>The OR runs on block time. Surgeons book their cases weeks in advance in blocks: 4-hour blocks, 8-hour blocks, and the efficiency with which those blocks are utilized determines whether the surgical service line runs in the black. Every minute a room sits empty between cases is a minute of overhead with no revenue attached to it. Turnover time (wheels-out to wheels-in for the next case) is the metric OR directors watch closest.</p><p>Every case depends on the right team, the right equipment, and a sterile field, all converging at the same moment. And the implant. Always the implant, in the right size. A case that starts late because a scope isn't sterile, or stalls because that implant isn't in the room, cascades through the day's schedule and into the next day if complications arise.</p>`,
        staffing:'Scrub Technologist or Scrub RN, Circulating RN, Anesthesiologist or CRNA, Surgical Technologist, OR Charge RN, Sterile Processing pipeline',
        ratios:'2–4 clinical staff per room depending on case complexity',
        flow_in:['Scheduled elective surgery (majority of volume)','Add-on urgent cases','Emergency/trauma cases (24/7)'],
        flow_out:['PACU (all patients)','SICU/CVICU (complex cardiac, vascular, thoracic)','MICU (septic source control)','Same-day discharge (ambulatory surgery)'],
        revenue:'Facility fee billed by time (per 15-minute increments) plus supply/implant charges. Surgeon and anesthesia bill professional fees separately. Robotic surgery, joint replacement, and cardiac surgery carry highest margins.',
        metrics:['Block utilization %','First-case on-time start rate','Turnover time','Case cancellation rate (day-of)','SSI rate','Wrong-site surgery rate (zero tolerance)','Retained foreign object rate (zero tolerance)'],
        infra:['Medical gas panel in each room (O₂, Air, N₂O, Vacuum)','Laminar airflow (positive pressure, HEPA)','Emergency power (surgical lighting cannot fail mid-case)','Central sterilization pipeline from CSP','Anesthesia gas scavenging'],
        deps:['Central Sterile Processing','Anesthesia','Pharmacy','Blood Bank','SICU/MICU (ICU backup)','PACU','Imaging (C-arm intraoperative)']
      },
      { id:'cath',       name:'Cardiac Cath Lab',          short:'Cath Lab',cat:'procedural',size:2,
        icon:'CL', tagline:'Coronary angiography, PCI, and structural heart procedures.',
        overview:`<p>The cath lab is where heart attacks get fixed. A STEMI patient activates the cath lab team: cardiologist, cath lab nurses, and techs: who have to be ready to put a wire through an occluded coronary artery within 90 minutes of the patient's first medical contact. That door-to-balloon time is one of the most heavily tracked metrics in the building, and poor performance is publicly reported.</p><p>Beyond STEMI, the cath lab does diagnostic coronary angiography, electrophysiology (ablations, device implants: pacemakers, ICDs), and structural procedures like TAVR. Each of these requires different skills, different equipment, and different downstream pathways.</p>`,
        staffing:'Cardiac Cath Lab RNs, Cath Lab Technologists, Interventional Cardiologist, EP Cardiologist, Anesthesia (TAVR, complex EP)',
        ratios:'3–4 staff per case',
        flow_in:['STEMI activations from ED or EMS','Scheduled diagnostic cath and PCI','EP referrals for ablation or device implant','CVICU backup (rescue PCI)'],
        flow_out:['CVICU (post-TAVR, complex PCI, cardiogenic shock)','Cardiac Telemetry (routine PCI, diagnostic cath)','Discharge home (same-day diagnostic cath)'],
        revenue:'High-revenue procedural service. PCI, TAVR, EP device implants carry significant facility and professional fees. High-margin service line.',
        metrics:['STEMI door-to-balloon time (target ≤90 min)','PCI success rate','Vascular access complication rate','Radiation dose tracking','Contrast nephropathy rate'],
        infra:['Biplane fluoroscopy/angiography suite (fixed X-ray equipment)','Radiation shielding throughout','Medical gas (O₂, Air, Vacuum at table)','Emergency power','Contrast injectors','Hemodynamic monitoring'],
        deps:['CVICU','ED (STEMI pipeline)','Pharmacy','Lab (ACT, creatinine)','Blood Bank','Radiology (imaging review)','Cardiac Surgery (backup for PCI complications)']
      },
      { id:'endo',       name:'Endoscopy / GI Lab',        short:'Endo',    cat:'procedural',size:2,
        icon:'GI', tagline:'Upper and lower GI endoscopy: diagnostic and therapeutic.',
        overview:`<p>Endoscopy runs a high-volume, mostly scheduled procedure list: colonoscopies, upper endoscopies, ERCP, and bronchoscopy. The cases are shorter than OR cases (30–60 minutes for a colonoscopy), but turnover and scheduling efficiency matter just as much. A GI bleeder coming from the ED at 2 AM blows up whatever tomorrow's schedule looked like.</p>`,
        staffing:'GI/Endoscopy RNs, GI Technicians, Gastroenterologists, Anesthesia (monitored anesthesia care or CRNA)',
        ratios:'2–3 staff per room',
        flow_in:['Scheduled outpatient colonoscopy/upper endoscopy','ED (acute GI bleed, foreign body)','Inpatient consults (ERCP, therapeutic endoscopy)'],
        flow_out:['Same-day discharge (majority)','Inpatient admission (polyp with significant bleeding, perforation)','ICU (GI bleed complications)'],
        revenue:'High-volume outpatient procedure revenue. Colonoscopy is one of the most commonly billed outpatient procedures in the U.S.',
        metrics:['Adenoma detection rate (colonoscopy quality metric)','Cecal intubation rate','Perforation rate','Endoscope reprocessing compliance'],
        infra:['Scope reprocessing (AERs: automated endoscope reprocessors)','Medical gas at procedure table','Emergency power','Endoscopy documentation system'],
        deps:['GI/Gastroenterology','Anesthesia','Pharmacy (sedation, GI medications)','Central Sterile (scope reprocessing)','Pathology (biopsy specimens)']
      },
      { id:'preop',      name:'Pre-Op / Same Day Surgery', short:'Pre-Op',  cat:'clinical', size:2,
        icon:'PO', tagline:'Patient preparation and holding area before surgical and procedural cases.',
        overview:`<p>Patients show up in Pre-Op fasting, anxious, and about to hand over a significant degree of control. The pre-op RN does the surgical timeout prep work: verifying consent, marking the surgical site, confirming allergies, starting IV access, and getting anesthesia assessment done before the patient rolls into the OR.</p>`,
        staffing:'Pre-Op RNs, Anesthesiologists/CRNAs (pre-assessment), Surgical Residents/Attendings (site marking)',
        ratios:'1:3–4 pre-op bays',
        flow_in:['Scheduled surgical patients (day of surgery)','Elective procedure patients'],
        flow_out:['OR (cases)','Discharge home (if case cancelled)'],
        revenue:'Bundled in OR facility fee.',
        metrics:['Case cancellation rate (day-of, per pre-op cause)','Consent completion rate','Pre-op checklist completion rate','On-time first case start contribution'],
        infra:['O₂ at bay','IV access equipment','Emergency power','EHR at bedside'],
        deps:['OR','Anesthesia','Pharmacy','Lab (pre-op labs)','Admitting/Registration']
      },
      { id:'pacu',       name:'PACU / Recovery',           short:'PACU',    cat:'clinical', size:2,
        icon:'PA', tagline:'Post-anesthesia recovery: the critical first hour after surgery.',
        overview:`<p>Patients wake up from anesthesia in the PACU under direct one-to-one or one-to-two nursing surveillance. The first 30–90 minutes after general anesthesia carry real risk: airway obstruction, laryngospasm, hemodynamic instability, and pain crisis are all managed here before the patient is cleared for the floor or ICU. The nurse works that entire window.</p>`,
        staffing:'PACU RNs (PACU-certified), Anesthesiology (immediately available), Surgeons available by phone',
        ratios:'1:1–2; 1:1 for unstable or complex airway',
        flow_in:['All OR cases (general, regional, monitored anesthesia)','Cath Lab (if monitored sedation)','Endoscopy (complex cases)'],
        flow_out:['Med/Surg floor (routine)','SICU/MICU (complex)','Same-day discharge (ambulatory surgery patients)'],
        revenue:'Bundled in OR facility fee (time-based).',
        metrics:['PACU LOS','Unplanned admission from ambulatory surgery','Pain score at discharge','PONV (post-op nausea/vomiting) rate','Unplanned reintubation in PACU'],
        infra:['O₂ at every bay','Emergency power (life safety)','Full monitoring at each bay','Reversal agents stocked','Crash cart'],
        deps:['OR','Anesthesia','Pharmacy','ICU (backup)','Med/Surg (receiving floors)']
      },
    ]
  },
  {
    id: 'f1', label: 'FL 1',
    units: [
      { id:'ed',         name:'Emergency Department',      short:'ED',      cat:'critical', size:4,
        icon:'ED', tagline:'The front door for emergencies and the safety net for everyone else.',
        overview:`<p>The ED is where the building's capacity problem becomes visible. Every patient who can't get a primary care appointment, every nursing home resident who deteriorates at 2 AM, every uninsured person with nowhere else to go: they all come here. EMTALA requires that they be evaluated and stabilized regardless of ability to pay. That's both the moral foundation of emergency medicine and the financial reality that shapes how EDs operate.</p><p>The ED runs on throughput. Door-to-provider time, length of stay, left-without-being-seen rate: these are the metrics that determine whether the department is functioning. When inpatient beds are full and admitted patients are boarding in ED hallways, those metrics collapse regardless of how well the ED itself is run. The ED is often where the hospital's capacity and throughput failures become most visible.</p>`,
        staffing:'Emergency Medicine Physicians, EM PAs/NPs, Emergency RNs, ED Technicians, Patient Registration, Social Work (embedded or on-call), Security, Triage RN',
        ratios:'1:3–4 triage/fast track; 1:1–2 critical/trauma bays',
        flow_in:['Ambulance (EMS)','Walk-in','Helipad transfers','Interfacility transfers','Self-present'],
        flow_out:['Discharge home (majority)','Admit to Med/Surg','Admit to ICU','Direct to OR (trauma)','AMA','Transfer to another facility'],
        revenue:'EMTALA-driven. Highest per-visit revenue potential but also highest uncompensated care burden. Facility fee + professional fee billed separately. High DSH (Disproportionate Share Hospital) payer mix.',
        metrics:['Door-to-provider time','Left without being seen (LWBS) rate','ED LOS (discharged vs. admitted)','Boarding hours (admitted patients waiting for inpatient bed)','Diversion hours','Sepsis bundle compliance','STEMI door-to-balloon time'],
        infra:['O₂ at every bay (piped and portable tanks)','Pneumatic tube to Lab/Pharmacy','Crash cart network','Pyxis automated dispensing','Point-of-care testing (iStat, portable glucometers)','Emergency power (life safety)','Decontamination room'],
        deps:['Lab (STAT)','Imaging (immediate)','Pharmacy','RT','ICU','OR','Social Work','Case Management','Blood Bank','Transport']
      },
      { id:'registration',name:'Registration / Patient Access',short:'Reg',  cat:'admin',   size:2,
        icon:'Rg', tagline:'Where the patient encounter begins: insurance verification, consent, and identity.',
        overview:`<p>Registration is revenue cycle step one, and in the ED it runs under EMTALA's ordering: medical screening first, insurance questions once the patient is stable. So the workflow runs backwards. A quick name and date of birth opens the chart, and the full registration happens at the bedside, sometimes hours later. Get the patient match wrong there and a returning patient picks up a duplicate medical record; get the payer wrong and the claim comes back denied. Bed assignment routes through this desk too. Registration errors here don't stay clerical for long.</p>`,
        staffing:'Patient Access Representatives, Registration Supervisors, Financial Counselors',
        ratios:'Variable by volume; ED registration is 24/7',
        flow_in:['Walk-in patients','Scheduled admissions','ED arrivals'],
        flow_out:['Patients to clinical areas','Insurance authorizations to clinical teams','Financial assistance referrals'],
        revenue:'Cost center but directly enables revenue through correct payer identification and authorization.',
        metrics:['Registration accuracy rate','Insurance verification rate','Point-of-service collection rate','Duplicate MRN rate','Denial rate attributed to registration errors'],
        infra:['EHR registration module','Insurance eligibility systems','Secure document handling'],
        deps:['ED','All inpatient units (admitting)','Finance/Revenue Cycle','Case Management']
      },
      { id:'imaging',    name:'Diagnostic Imaging',        short:'Imaging', cat:'support',  size:3,
        icon:'Im', tagline:'X-ray, CT, MRI, and ultrasound: the visual layer of clinical decision-making.',
        overview:`<p>Imaging is the second opinion that never argues back. A CT scan of the chest in a patient with shortness of breath tells you in minutes whether you're dealing with pneumonia, a PE, a pneumothorax, or a mass. That clarity drives almost every significant clinical decision made in this building. The radiologist reading that scan: usually remotely, through teleradiology: is one of the highest-volume physicians in the health system.</p><p>The equipment in this department is expensive, requires shielding infrastructure baked into the building during construction, and has a useful life of 7–10 years before major capital replacement. The physics of MRI (superconducting magnets cooled with liquid helium) means any unplanned quench is a department-closing event.</p>`,
        staffing:'Radiologic Technologists (X-ray, CT, MRI), Ultrasound Sonographers, Nuclear Medicine Technologists, Radiologists (often teleradiology overnight), Radiology RNs (IV contrast, sedation)',
        ratios:'1 tech per modality; 1 RN per IV contrast suite',
        flow_in:['ED orders (STAT)','Inpatient orders (all floors)','Outpatient scheduled imaging','OR (intraoperative C-arm: portable)'],
        flow_out:['Reports to Epic (radiologist read)','Critical findings called directly to ordering physician','Images available in PACS immediately'],
        revenue:'Per-exam billing (CPT codes). Outpatient imaging has strong margins. Inpatient imaging bundled in DRG. MRI and CT are among the highest-revenue outpatient services.',
        metrics:['Radiology turnaround time (order-to-report)','Critical results notification time','CT scan utilization rate','MRI throughput','Incidental finding follow-up rate'],
        infra:['Radiation shielding in all X-ray/CT/fluoro rooms','MRI magnetic field exclusion zones','PACS (picture archiving) networked throughout building','Emergency power for MRI (quench risk management)'],
        deps:['ED','All clinical floors','Pharmacy (contrast, sedation)','Nursing (IV contrast patients)','IT (PACS infrastructure)','IR','Nuclear Medicine']
      },
      { id:'ir',         name:'Interventional Radiology',  short:'IR',      cat:'procedural',size:2,
        icon:'IR', tagline:'Image-guided procedures: drains, biopsies, embolizations, and vascular access.',
        overview:`<p>IR does what used to require open surgery through a needle or catheter the size of a pencil lead. Liver tumor ablation, uterine fibroid embolization, biliary drain placement, TIPS procedure for liver failure, pulmonary embolism treatment: these are procedures that require a surgeon's decisions and a radiologist's image navigation skill in one person.</p>`,
        staffing:'Interventional Radiologists, IR RNs, Radiology Technologists (fluoroscopy-trained), Anesthesia (complex/sedation cases)',
        ratios:'3–4 staff per case',
        flow_in:['Inpatient consults (drain placements, hemorrhage control)','Oncology referrals (ablation, embolization)','Vascular access needs (PICC, port)'],
        flow_out:['Return to floor (most cases)','ICU (complex hemorrhage control)','Recovery/PACU (if sedation used)'],
        revenue:'Procedure-based billing. High-value interventions comparable to surgical procedures without OR overhead.',
        metrics:['Technical success rate','Complication rate','PICC/port complication rate','Procedure volume by type'],
        infra:['Biplane fluoroscopy suite','Radiation shielding','Medical gas at table','PACS integration'],
        deps:['All clinical floors (consults)','Oncology','Pharmacy','Lab','Blood Bank','Anesthesia']
      },
      { id:'nuclear',    name:'Nuclear Medicine',          short:'Nuclear', cat:'support',  size:1,
        icon:'NM', tagline:'Radiotracer imaging for cardiac, oncologic, and metabolic diagnoses.',
        overview:`<p>Nuclear Medicine uses radioactive tracers injected into the patient to image physiology. A myocardial perfusion scan shows which parts of the heart muscle are getting blood flow. A PET scan finds metabolically active cancer. Bone scans, metastatic disease. These are functional studies that anatomical CT cannot replicate.</p>`,
        staffing:'Nuclear Medicine Technologists, Nuclear Medicine Physicians, Radiation Safety Officer (shared)',
        ratios:'1–2 techs per camera; low patient volume, high per-patient time',
        flow_in:['Cardiology orders (stress tests, perfusion imaging)','Oncology (PET scan)','Bone scan orders'],
        flow_out:['Reports to PACS/Epic'],
        revenue:'Per-exam CPT billing. PET scans are among the higher-revenue imaging studies.',
        metrics:['Scan quality rate','Radiotracer waste compliance','Radiation exposure tracking','Report turnaround time'],
        infra:['Radiation shielding (hot lab)','Dedicated ventilation for radioactive material','NRC licensing compliance'],
        deps:['Cardiology','Oncology','Radiology (shared PACS)','Radiation Safety']
      },
      { id:'chaplaincy', name:'Chaplaincy / Spiritual Care',short:'Chapel', cat:'admin',   size:1,
        icon:'Ch', tagline:'Spiritual and existential support for patients, families, and staff.',
        overview:`<p>Chaplains are the people in the building trained to sit with uncertainty without trying to fix it. They show up in the ICU when a family is deciding whether to continue life support, and in the ED after a trauma death. The oncology floor, when a patient's treatment options have run out. Whatever the patient believes or doesn't, the job is the same: suffering is real, and presence matters.</p>`,
        staffing:'Board Certified Chaplains (BCC), Clinical Pastoral Education (CPE) residents, Volunteer chaplains',
        ratios:'1–2 chaplains per 200+ beds (chronically understaffed)',
        flow_in:['Patient/family requests','Nursing referrals','End-of-life situations','Code blue events','Staff debriefs after difficult cases'],
        flow_out:['Pastoral care notes in Epic','Bereavement resources','Ethics committee referrals'],
        revenue:'Cost center. Support staff.',
        metrics:['Patient/family satisfaction','Response time to urgent referrals','Staff support sessions provided','Ethics consult involvement'],
        infra:['Chapel space','Quiet rooms on clinical floors'],
        deps:['ICU','ED','Oncology','Social Work','Ethics Committee','All units (staff support)']
      },
    ]
  },
  {
    id: 'b', label: 'BASE',
    units: [
      { id:'csp',        name:'Central Sterile Processing', short:'CSP',     cat:'support',  size:2,
        icon:'CS', tagline:'Where surgical instruments are cleaned, sterilized, and returned to use.',
        overview:`<p>Central Sterile is the department that makes surgery possible. Every surgical instrument, every endoscope, every implant tray goes through a defined decontamination and sterilization cycle before it can touch another patient. The chain of custody from used instrument to sterile instrument is a Joint Commission regulatory focus, and any break in that chain is a sentinel event risk.</p><p>CSP technicians work with instruments worth thousands to hundreds of thousands of dollars per tray, under time pressure driven by the OR schedule. A tray that takes longer than expected to process because of improper instrument cleaning by the surgical team is a delay that cascades into the OR schedule for the rest of the day.</p>`,
        staffing:'Sterile Processing Technicians, Sterile Processing Manager, Infection Control oversight',
        ratios:'Variable by case volume and shift',
        flow_in:['Used instruments from OR, Endoscopy, Cath Lab, Procedure rooms','Loaner instrument trays from vendors','Implant sets'],
        flow_out:['Sterile instrument trays to OR','Sterile scopes to Endoscopy','Implant sets to OR/supply'],
        revenue:'Cost center. Directly enables OR revenue by maintaining instrument availability.',
        metrics:['Instrument set availability rate','Sterilization cycle failure rate','Biological indicator compliance','Loaner instrument processing time','Instrument damage/loss rate'],
        infra:['Washer-decontaminators (mechanical cleaning)','Steam sterilizers (autoclaves)','Low-temperature sterilizers (hydrogen peroxide plasma for heat-sensitive instruments)','Sterile storage','Dedicated ventilation (dirty-to-clean flow)'],
        deps:['OR (primary customer)','Endoscopy','Cath Lab','Infection Control','Supply Chain']
      },
      { id:'plant',      name:'Plant Operations',          short:'Plant Ops',cat:'support',  size:2,
        icon:'PL', tagline:'Keeping the building alive: power, water, air, and every system behind the walls.',
        overview:`<p>Plant Operations runs the infrastructure that every clinical department takes for granted until it fails. The boilers, chillers, emergency generators, medical gas manifolds, fire suppression, and building automation systems are all managed from here. When the lights flicker at 2 AM, Plant Ops is already on it. When a zone valve for the oxygen system needs to close for maintenance, they coordinate the timing with nursing so no patient is left without O₂.</p>`,
        staffing:'Stationary Engineers, HVAC Technicians, Electricians, Plumbers, Facilities Managers, Director of Plant Operations',
        ratios:'24/7 on-call coverage; skeleton overnight crew',
        flow_in:['Work orders from all departments','Preventive maintenance schedules','Regulatory inspection preparation','Emergency response calls'],
        flow_out:['Completed repairs','Preventive maintenance documentation','Utility management reports','Emergency response'],
        revenue:'Cost center. Essential to building licensure and regulatory compliance (Joint Commission, CMS, fire marshal).',
        metrics:['Generator test compliance','Preventive maintenance completion rate','Medical gas alarm response time','Work order completion time','Utility cost per adjusted patient day'],
        infra:['Emergency generators','Medical gas manifolds','Boiler plant','Chiller plant','Building automation system (BAS)','Life safety systems'],
        deps:['All departments','IT (server room cooling)','Infection Control (HVAC)','Compliance/Regulatory']
      },
      { id:'food',       name:'Food Services / Nutrition', short:'Food Svc',cat:'support',  size:2,
        icon:'Fs', tagline:'Patient nutrition, clinical dietitian services, and staff feeding.',
        overview:`<p>Food Services is about more than meals. A hospitalized patient with malnutrition heals slower, has worse surgical outcomes, and has a longer length of stay than a patient with adequate nutritional support. Clinical Dietitians identify at-risk patients, calculate protein and caloric needs, order supplemental nutrition, and manage tube feeding and TPN orders. The cafeteria component is the visible tip of a clinical nutrition iceberg.</p>`,
        staffing:'Clinical Dietitians (RDs), Dietary Technicians, Food Service Workers, Executive Chef, Food Service Director',
        ratios:'1 RD per 40–60 inpatients',
        flow_in:['Patient meal orders','Dietitian consult orders from floors','TPN orders (in collaboration with pharmacy)'],
        flow_out:['Patient trays delivered to floors','Clinical nutrition assessments in Epic','TPN formulations (to pharmacy for compounding)','Tube feeding orders'],
        revenue:'Cost center for patient meals. Clinical dietitian services bundled in DRG. Cafeteria is separate revenue with variable margins.',
        metrics:['Patient satisfaction with food','Malnutrition screening completion rate','Dietitian consult response time','TPN-related complication rate','Food safety compliance'],
        infra:['Commercial kitchen equipment','Cold storage','Steam cart delivery system','TPN compounding interface with pharmacy'],
        deps:['Pharmacy (TPN)','ICU (critical nutrition)','All clinical floors','Infection Control (food safety)','Case Management (discharge nutrition planning)']
      },
      { id:'evs',        name:'Environmental Services',    short:'EVS',     cat:'support',  size:2,
        icon:'EV', tagline:'Terminal cleaning, infection control, and the physical environment of care.',
        overview:`<p>Environmental Services is the infection control front line. Every C. diff room, every contact precaution isolation room, every OR suite between cases · EVS technicians do the terminal cleaning that prevents the next patient from acquiring what the last patient had. Their work is invisible when it's done right and devastating when it's not. Hospital-acquired C. diff is directly traceable to cleaning protocol failures.</p>`,
        staffing:'Environmental Service Technicians, EVS Supervisors, Infection Control liaison',
        ratios:'Variable by census and case type; OR turnover cleaning is timed to case schedule',
        flow_in:['Discharge cleaning requests (from floors via nurse call/Epic)','Terminal room cleaning orders','OR turnover requests','Isolation room enhanced cleaning'],
        flow_out:['Clean rooms available for new patients','OR suites ready for next case','Soiled linen and biohazardous waste removed'],
        revenue:'Cost center. Directly prevents HAI costs and regulatory penalties.',
        metrics:['Room turnover time','Discharge cleaning time','ATP (adenosine triphosphate) surface testing scores','HAI rates (indirectly traced)','Chemical product compliance'],
        infra:['Chemical dispensing systems','Biohazardous waste containment','UV-C disinfection robots (some facilities)','Soiled utility rooms on every floor'],
        deps:['Infection Control','All clinical floors','OR','Isolation room management','Supply Chain (cleaning products)']
      },
      { id:'transport',  name:'Transport',                 short:'Transport',cat:'node',    size:1,
        icon:'Tr', tagline:'Patient movement throughout the building.',
        isNode: true,
        overview:`<p>Transport dispatches patient transporters to move non-ambulatory patients between units: to and from imaging, OR, procedures, and admitting. They are the connective tissue of patient flow, and transport delays are a measurable contributor to throughput problems and ED boarding. When transport is understaffed, clinical staff end up moving their own patients.</p>`,
        staffing:'Patient Transporters, Transport Supervisors',
        ratios:'Variable by volume; typically 1 transporter per 40–50 beds',
        flow_in:['Transport requests from all departments (via Epic or radio)'],
        flow_out:['Patients moved between departments','Transport time documentation'],
        revenue:'Cost center.',
        metrics:['Transport response time','Transport delay rate','On-time procedure transport %'],
        infra:['Stretchers and wheelchairs','O₂ transport tanks','Elevator access (priority during codes)'],
        deps:['All departments','OR','Imaging','ED','Procedures']
      },
    ]
  },
];

// ═══════════════════════════════════════════════════════════════
// AMBULATORY BUILDING DATA
// ═══════════════════════════════════════════════════════════════
const AMB_FLOOR_INFRA = {
  'a1': ['pntube','data','power','hvac'],
  'a2': ['o2','data','power','hvac'],
  'a3': ['o2','data','power','hvac'],
  'a4': ['data','power','hvac'],
  'a5': ['data','power','hvac'],
};

const AMB_FLOORS = [
  { id:'a5', label:'AMB 5', units: [
    { id:'telehealth', name:'Telehealth Center', short:'Telehealth', cat:'clinical', size:3, icon:'TH',
      tagline:'Virtual care delivery: primary care, urgent consults, and post-discharge follow-up.',
      overview:`<p>Telehealth is the fastest-scaling service line in most health systems right now. The center here handles scheduled video visits for primary care follow-ups, post-discharge check-ins that used to require a return trip, and behavioral health encounters where location is a genuine barrier to access.</p><p>The infrastructure requirements are simpler than anyone expected: good bandwidth, a quiet space, and clinical staff who know how to do a virtual exam. The billing complexity took years to sort out after COVID, and reimbursement parity with in-person visits still varies by state and payer.</p>`,
      staffing:'Telehealth RNs, Scheduling Coordinators, IT support, Remote physicians and APPs',
      ratios:'1 coordinator per 8–12 active virtual visits',
      flow_in:['Post-discharge patients','Primary care overflow','Behavioral health referrals','Chronic disease management'],
      flow_out:['Visit documentation in Epic','Prescription orders','Referrals to in-person care'],
      revenue:'Per-visit billing. Parity with in-person improving but uneven by payer.',
      metrics:['Visit completion rate','No-show rate','Patient satisfaction','Technical failure rate'],
      infra:['High-bandwidth fiber','Encrypted HIPAA-compliant video platform','EHR integration'],
      deps:['Primary Care','Behavioral Health','Case Management','IT']
    },
    { id:'emp_health', name:'Employee Health', short:'Emp. Health', cat:'admin', size:2, icon:'EH',
      tagline:'Occupational health for hospital staff: injuries, exposures, and fitness for duty.',
      overview:`<p>Employee Health serves an awkward population: the clinical staff who are also the hospital's most critical operational resource. A nurse on light duty after a needlestick. A worker who needs N95 fit testing before flu season. A respiratory therapist with a post-exposure follow-up after a TB exposure.</p><p>This department manages all of it: workplace injuries, OSHA reporting, immunization records, and the return-to-work clearances that keep clinical operations staffed.</p>`,
      staffing:'Occupational Health RNs, Occupational Medicine Physician (part-time), HR liaison',
      ratios:'1–2 FTE per 500 employees',
      flow_in:['Workplace injury reports','Exposure incidents (needlestick, blood/body fluid)','New hire immunization requirements'],
      flow_out:['Return-to-work clearances','OSHA reporting','Fitness-for-duty evaluations'],
      revenue:'Cost center. Reduces workers comp costs and liability.',
      metrics:['Needlestick injury rate','Return-to-work time','Staff influenza vaccination rate','TB screening compliance'],
      infra:['Immunization storage refrigerator','OSHA reporting systems','Occupational health EHR module'],
      deps:['HR','All departments','Infection Control','Legal/Risk Management']
    },
    { id:'amb_admin', name:'Ambulatory Admin / Ops', short:'Amb. Ops', cat:'admin', size:5, icon:'Ops',
      tagline:'Scheduling, prior authorizations, clinic operations, and ambulatory revenue cycle.',
      overview:`<p>Ambulatory operations is where the friction is. Prior authorizations that delay treatments by weeks. Phone queues that drive patients to competitors. Credentialing backlogs that keep a new specialist from seeing patients for three months after hire. The problems are operational, and they carry direct clinical consequences.</p><p>This floor manages all of it: clinic scheduling, prior auth workflows, provider credentialing, ambulatory revenue cycle, and the metrics that determine whether the outpatient side of the system actually works.</p>`,
      staffing:'Scheduling Supervisors, Prior Auth Coordinators, Clinic Operations Managers, Revenue Cycle Analysts',
      ratios:'N/A',
      flow_in:['Scheduling requests from all clinics','Auth denials from payers','Provider onboarding requests'],
      flow_out:['Scheduled appointments','Approved authorizations','Revenue cycle reports'],
      revenue:'Cost center. Directly enables ambulatory revenue through scheduling throughput and auth approvals.',
      metrics:['Third-next-available appointment','Prior auth approval rate and time','Scheduling error rate','Provider schedule utilization'],
      infra:['EHR scheduling module','Payer portal access','Phone systems'],
      deps:['All ambulatory clinics','Finance','HR','Credentialing']
    },
  ]},
  { id:'a4', label:'AMB 4', units: [
    { id:'outpt_psych', name:'Outpatient Psychiatry', short:'Outpt. Psych', cat:'behavioral', size:4, icon:'Psy',
      tagline:'Medication management, therapy, and psychiatric follow-up for community patients.',
      overview:`<p>When the inpatient psych unit discharges a patient, this clinic is the plan. The problem is the wait: weeks can pass between a psychiatric hospitalization and the first outpatient appointment, and that interval is among the most dangerous in behavioral health care. Readmissions cluster in the 30 days after discharge, often because follow-up didn't happen in time.</p><p>The service here covers medication management, psychotherapy, and care coordination. The volume exceeds capacity in almost every community. Waitlists are the norm.</p>`,
      staffing:'Psychiatrists, Psychiatric NPs, LCSWs (therapy), Psychologists, Medical Assistants',
      ratios:'1 psychiatrist: 20–30 active patients; 1 therapist: 30–40 active patients',
      flow_in:['Inpatient psych discharges','PCP mental health referrals','Crisis program step-downs','Self-referrals'],
      flow_out:['Stable community management','Inpatient psych (if deterioration)','PHP (partial hospitalization)'],
      revenue:'Fee-for-service E&M + psychotherapy codes. Medicaid dominant payer.',
      metrics:['30-day post-discharge follow-up rate','No-show rate','Medication adherence rate','Readmission to inpatient psych'],
      infra:['Private therapy rooms','Separate waiting area','EHR behavioral health module'],
      deps:['Inpatient Psych','Primary Care','Case Management','Social Work']
    },
    { id:'sub_use', name:'Substance Use Treatment', short:'Sub. Use Tx', cat:'behavioral', size:3, icon:'SUD',
      tagline:'Outpatient and intensive outpatient addiction treatment: MAT, counseling, recovery support.',
      overview:`<p>Substance use treatment has been reshaped by the opioid epidemic and the evidence base for medication-assisted treatment (MAT). Buprenorphine and naltrexone work. They reduce overdose deaths, reduce criminal activity, and keep people in treatment. They're also chronically underprescribed because of stigma and the perception that medication is somehow not real recovery.</p><p>Intensive outpatient programs (IOP): 9+ hours of structured treatment per week: fill the gap between inpatient detox and weekly outpatient counseling.</p>`,
      staffing:'Addiction Medicine Physicians, Licensed SUD Counselors, Recovery Coaches, Nursing (MAT)',
      ratios:'1 counselor: 12–15 active clients',
      flow_in:['ED referrals (post-overdose)','Inpatient detox discharges','Self-referrals','Justice-involved patients'],
      flow_out:['Community recovery','Residential treatment','Inpatient detox (relapse)'],
      revenue:'Per-session billing. Medicaid, some commercial. Chronically underfunded.',
      metrics:['Treatment retention rate (90-day)','MAT initiation rate from ED referrals','Urine drug screen compliance'],
      infra:['Group counseling rooms','Private offices','Medication dispensing (Suboxone, naltrexone)'],
      deps:['ED','Inpatient Psych','Primary Care','Case Management']
    },
    { id:'bhc', name:'Behavioral Health Consultation', short:'BH Consult', cat:'behavioral', size:3, icon:'BHC',
      tagline:'Integrated behavioral health embedded in primary care: same-day warm handoffs.',
      overview:`<p>Behavioral Health Consultants embedded in primary care are one of the more effective models in behavioral health delivery: brief interventions, same-day access, no separate appointment required. The evidence for the collaborative care model is strong: better depression outcomes, lower overall healthcare utilization, higher patient satisfaction. It's also chronically underfunded because behavioral health reimbursement doesn't match its impact on total cost of care.</p>`,
      staffing:'Licensed Clinical Social Workers, Psychologists, Psychiatric Consultants (part-time)',
      ratios:'1 BHC per 2–4 primary care providers',
      flow_in:['Same-day warm handoffs from PCP','PHQ-9 or GAD-7 flags in Epic','Substance use screening referrals'],
      flow_out:['Brief interventions in Epic','Warm handoffs to outpatient psychiatry','Crisis referrals'],
      revenue:'Primary care integrated billing. Behavioral health add-on codes.',
      metrics:['Same-day warm handoff rate','PHQ-9 improvement at follow-up','Referral completion rate to specialty psych'],
      infra:['Colocation with primary care','Shared EHR access','Private brief consultation space'],
      deps:['Primary Care','Outpatient Psychiatry','Substance Use Treatment','Case Management']
    },
  ]},
  { id:'a3', label:'AMB 3', units: [
    { id:'cardio_opc', name:'Cardiology Clinic', short:'Cardiology', cat:'clinical', size:3, icon:'Crd',
      tagline:'Heart failure management, post-cath follow-up, arrhythmia clinic, and device interrogation.',
      overview:`<p>The cardiology clinic is where the interventional work from the cath lab and the medical work from telemetry have their continuity. Heart failure patients come in monthly for volume management. Post-TAVR patients come in for valve surveillance. The device clinic manages pacemaker and ICD interrogations. These are ongoing relationships between complex patients and a subspecialty that keeps them out of the hospital.</p>`,
      staffing:'Cardiologists, Cardiology NPs and PAs, Cardiac RNs, Medical Assistants, Device clinic technicians',
      ratios:'1 provider: 18–22 scheduled patients per day',
      flow_in:['Hospital discharges (cardiology)','PCP referrals','Cath Lab follow-up','ED chest pain rule-outs'],
      flow_out:['Medication management','Stress test orders','Cath Lab referrals','Heart failure hospitalization avoidance'],
      revenue:'E&M visit codes + procedure codes (EKG, device interrogation). High-revenue ambulatory specialty.',
      metrics:['Heart failure readmission rate','Post-discharge follow-up within 7 days','Device clinic compliance'],
      infra:['EKG machines','Device programmer (pacemaker/ICD)','EHR cardiology module'],
      deps:['Cath Lab','Cardiac Telemetry','CVICU','Primary Care','Case Management']
    },
    { id:'pulm_opc', name:'Pulmonology Clinic', short:'Pulmonology', cat:'clinical', size:2, icon:'Plm',
      tagline:'COPD management, asthma, sleep apnea, and pulmonary function testing.',
      overview:`<p>Pulmonology outpatient is where chronic respiratory disease gets managed before it becomes an inpatient admission. COPD exacerbation prevention, inhaler technique assessment, smoking cessation counseling, and pulmonary rehab referrals: this is the work that keeps a COPD patient out of the ED. When it doesn't get done, the readmission shows up three weeks later.</p>`,
      staffing:'Pulmonologists, Pulmonology NPs, Respiratory Therapists (PFT lab), Medical Assistants',
      ratios:'1 provider: 16–20 patients per day',
      flow_in:['Post-hospitalization COPD/asthma','PCP dyspnea referrals','Sleep apnea evaluation'],
      flow_out:['Pulmonary function testing','Home oxygen orders','Pulmonary rehab referrals'],
      revenue:'E&M + PFT billing.',
      metrics:['COPD readmission rate','Inhaler technique adherence','PFT completion rate'],
      infra:['Spirometry/PFT equipment','Pulse oximetry','Nebulizer treatment room'],
      deps:['RT Dept','Med/Surg (respiratory patients)','Primary Care','Sleep Lab']
    },
    { id:'onc_opc', name:'Oncology Clinic', short:'Oncology', cat:'clinical', size:3, icon:'Onc',
      tagline:'Cancer treatment coordination: chemotherapy planning, surveillance, palliative transition.',
      overview:`<p>The outpatient oncology clinic coordinates the most treatment-intensive care in ambulatory medicine. Patients here are in active chemotherapy, on oral targeted therapies with weekly labs, or in surveillance after treatment completion. The nurse navigator model: a dedicated RN who knows the patient's full treatment trajectory: is the difference between a coherent cancer treatment experience and a fragmented one.</p>`,
      staffing:'Medical Oncologists, Oncology NPs, Nurse Navigators, Oncology Social Worker, Palliative Care access',
      ratios:'1 provider: 12–18 patients per day',
      flow_in:['New cancer diagnoses from surgery/pathology','Chemotherapy cycle management','Survivorship clinic'],
      flow_out:['Chemotherapy orders to Infusion Center','Genetic counseling referrals','Hospice transitions'],
      revenue:'High-revenue ambulatory. E&M + chemotherapy administration + drug revenue.',
      metrics:['Time to first oncology appointment','Clinical trial enrollment rate','Palliative care integration rate'],
      infra:['Chemo-safe waste disposal','Crash cart (anaphylaxis)','Direct line to Infusion Center'],
      deps:['Infusion Center','Pharmacy (oncology)','Pathology','Radiology','Palliative Care']
    },
    { id:'ortho_opc', name:'Orthopedics Clinic', short:'Orthopedics', cat:'clinical', size:2, icon:'Ort',
      tagline:'Joint replacement, fracture care, and sports medicine: outpatient orthopedics.',
      overview:`<p>When the OR pipeline is working, orthopedics out-earns almost every other ambulatory service line. Pre-op joint replacement visits, post-surgical follow-ups, sports medicine, and fracture management fill the clinic. The challenge is that orthopedic surgeons split their time between the OR and clinic, and those two calendars are always in conflict with each other.</p>`,
      staffing:'Orthopedic Surgeons, Orthopedic PAs, Sports Medicine Physicians, Medical Assistants, X-ray Technologists',
      ratios:'1 provider: 20–25 patients per day',
      flow_in:['PCP referrals for joint pain/fractures','ED follow-up','Post-surgical follow-up','Workers comp'],
      flow_out:['OR scheduling','PT/OT referrals','Imaging orders','DME orders (braces, crutches)'],
      revenue:'High-revenue. E&M + procedure codes (joint injection, casting). Feeds OR volume.',
      metrics:['Surgical case conversion rate','Post-op complication rate','Time to OR scheduling'],
      infra:['In-office X-ray','Casting/splinting supplies','PACS access'],
      deps:['OR','PT/OT','Imaging','ED','Workers Comp programs']
    },
  ]},
  { id:'a2', label:'AMB 2', units: [
    { id:'primary_care', name:'Primary Care', short:'Primary Care', cat:'clinical', size:4, icon:'PCP',
      tagline:'The foundation of the healthcare system, and the most underfunded part of it.',
      overview:`<p>Primary care is supposed to be the front door to the healthcare system. In practice, it's the door with the longest wait, the shortest visit time, and the most compressed reimbursement of any specialty. A primary care physician manages 2,000+ active patients in 15-minute slots: preventive care, chronic disease management, acute illness, and behavioral health billed at $120–$150 per visit is the structural problem nobody has figured out how to fix.</p><p>The patients who have a primary care relationship have better outcomes, lower costs, and fewer hospitalizations than those who don't. That evidence hasn't translated into payment reform that compensates primary care proportionally to its value.</p>`,
      staffing:'Family Medicine and Internal Medicine Physicians, NPs and PAs, Medical Assistants, RNs, Care Coordinators',
      ratios:'1 physician: 1,800–2,500 active patients; 15–30 visits per day',
      flow_in:['Established patient follow-ups','New patient visits','Urgent same-day appointments','Telehealth visits'],
      flow_out:['Specialty referrals','Hospitalization orders','Preventive care coordination'],
      revenue:'E&M visit codes. Chronic care management (CCM) codes. Low reimbursement per visit drives volume dependence.',
      metrics:['Panel size','Third-next-available appointment','Preventive screening completion rate','Chronic disease control (A1c, BP)'],
      infra:['EHR (Epic)','Population health tools','In-office diagnostic equipment'],
      deps:['All specialty clinics','Behavioral Health Consultation','Telehealth','Lab Draw','Pharmacy']
    },
    { id:'urgent_care', name:'Urgent Care', short:'Urgent Care', cat:'critical', size:3, icon:'UC',
      tagline:'Same-day episodic care: the overflow valve for primary care and ED alternative.',
      overview:`<p>Urgent care sits in an awkward business position: competing with the ED for episodic visits while also trying not to divert volume from the health system's primary care panel. When it works, it handles UTIs, sprains, and respiratory infections quickly and cheaply. When it doesn't, it becomes a fragmentation point: a visit with no care continuity and a referral pattern that sends patients back to the ED anyway.</p>`,
      staffing:'Urgent Care Physicians and NPs, Medical Assistants, X-ray Technologists, Registration',
      ratios:'1 provider: 25–35 patients per day',
      flow_in:['Walk-in episodic illness','Overflow from full primary care schedules','Occupational health visits'],
      flow_out:['Discharge home (majority)','ED referral (if higher acuity)','Primary care follow-up'],
      revenue:'Per-visit E&M. High-volume, lower-complexity. Competitive market.',
      metrics:['Walk-in wait time','Door-to-provider time','Left without being seen rate','ED transfer rate'],
      infra:['In-office X-ray','POC testing (rapid flu, strep, COVID)','IV hydration capability'],
      deps:['ED','Primary Care','Imaging','Lab Draw']
    },
    { id:'care_coord', name:'Care Coordination Hub', short:'Care Coord', cat:'admin', size:3, icon:'CC',
      tagline:'Population health management: preventing hospitalizations before they happen.',
      overview:`<p>The care coordination hub works the list of patients who are most likely to be admitted in the next 90 days. Predictive risk models in the EHR flag them. Care coordinators call them, close the gaps, and connect them to the right resources. It's preventive work that shows up as avoided admissions on the finance dashboard, which makes it easy to cut when budgets are tight and the savings are invisible.</p>`,
      staffing:'Care Coordinators (RNs), Community Health Workers, Social Work liaison, Population Health Analysts',
      ratios:'1 coordinator: 200–400 attributed patients in active management',
      flow_in:['High-risk patient flags from EHR risk models','Post-discharge patients (30-day window)','Complex chronic disease patients from PCP'],
      flow_out:['Gap closure in preventive care','Appointment scheduling','Social determinant resource connections'],
      revenue:'Value-based care performance. ACO shared savings. Risk contract performance bonuses.',
      metrics:['Preventable admission rate','Post-discharge follow-up rate','Preventive care gap closure rate'],
      infra:['Population health platform (Epic Healthy Planet or equivalent)','Community health worker tools'],
      deps:['Primary Care','Case Management','Social Work','Telehealth','All specialty clinics']
    },
  ]},
  { id:'a1', label:'AMB 1', units: [
    { id:'pat_access', name:'Patient Access Hub', short:'Patient Access', cat:'admin', size:2, icon:'Acc',
      tagline:'Check-in, registration, and the first physical contact point for ambulatory patients.',
      overview:`<p>The patient access desk is the first experience, and it sets the tone. A smooth registration and a short wait create a very different patient experience than a crowded waiting room that asks the same questions three times. The operational choices made here compound across thousands of patient visits per week.</p><p>Throughput is the whole game on this desk. Check-in time feeds clinic wait time, clinic wait time feeds provider schedule slippage, and by mid-afternoon a small registration delay has become a waiting room full of people who arrived on time. The revenue side still matters; a wrong payer entry still becomes a denied claim. It just fails quietly, weeks later, on someone else's report.</p>`,
      staffing:'Patient Access Representatives, Financial Counselors, Interpreters (in-person and remote)',
      ratios:'Variable by clinic volume',
      flow_in:['All ambulatory patients (every visit)','Walk-in urgent care','Post-hospitalization follow-up visits'],
      flow_out:['Patients to clinic areas','Insurance verification to billing','Copay collection to finance'],
      revenue:'Cost center. Enables all ambulatory revenue.',
      metrics:['Check-in time','Registration accuracy rate','Copay collection rate'],
      infra:['EHR registration kiosks','Insurance eligibility systems','Interpreter access'],
      deps:['All ambulatory clinics','Finance/Revenue Cycle','Interpreter Services']
    },
    { id:'spec_pharm', name:'Specialty Pharmacy', short:'Spec. Pharm', cat:'support', size:2, icon:'Phm',
      tagline:'High-cost specialty drugs: biologics, oncology, and rare disease therapies.',
      overview:`<p>The 340B program either makes or breaks ambulatory financial performance, and specialty pharmacy is the lever. High-cost biologics dispensed through a 340B-eligible specialty pharmacy generate margin that can cross-subsidize underfunded primary care. The compliance infrastructure to run a clean 340B program is nontrivial, and audits are consequential.</p>`,
      staffing:'Specialty Pharmacists, Pharmacy Technicians, 340B Compliance Coordinators',
      ratios:'1 pharmacist per 8–15 active specialty patients',
      flow_in:['Oncology prescriptions','Specialty drug prior auth approvals','Biologic therapy initiations'],
      flow_out:['Specialty medications dispensed or shipped','340B compliance documentation','Adherence support'],
      revenue:'Specialty drug revenue. 340B program savings. High-margin but high-compliance-cost.',
      metrics:['340B compliance rate','Specialty drug adherence rate','Prior auth approval time'],
      infra:['Specialty refrigeration','340B software platform','Secure dispensing workflow'],
      deps:['Oncology Clinic','Infusion Center','Central Pharmacy','Finance (340B)']
    },
    { id:'amb_lab', name:'Lab Draw / Point-of-Care', short:'Lab Draw', cat:'support', size:2, icon:'Lab',
      tagline:'Outpatient phlebotomy and rapid results: the ambulatory extension of the main lab.',
      overview:`<p>Lab draw stations in ambulatory buildings exist because making a patient drive to the main hospital for a routine blood draw is an unnecessary barrier. A fasting lipid panel before a cardiology appointment, a pre-chemotherapy CBC, a weekly INR for anticoagulation management: these are the draws that happen here and feed results directly into the same Epic instance the inpatient teams use.</p>`,
      staffing:'Phlebotomists, Lab Technicians (POC testing)',
      ratios:'1 phlebotomist: 20–40 draws per shift',
      flow_in:['Walk-in orders from portal or PCP','Pre-visit lab orders from clinics upstairs','Anticoagulation draws'],
      flow_out:['Results to Epic (main lab processes specimens)','Critical values called to ordering provider'],
      revenue:'Per-test CPT billing (outpatient).',
      metrics:['Specimen processing time','Critical value notification compliance','Patient wait time'],
      infra:['Pneumatic tube to main lab (or courier)','Centrifuge','POC analyzers (iStat, glucose)'],
      deps:['Clinical Lab (main hospital)','All ambulatory clinics','Anticoagulation Clinic']
    },
    { id:'amb_imaging', name:'Ambulatory Imaging', short:'Amb. Imaging', cat:'support', size:2, icon:'Img',
      tagline:'Outpatient X-ray, ultrasound, and low-acuity CT: same PACS, no ED queue.',
      overview:`<p>Ambulatory imaging covers the scheduled, non-emergency studies that don't need the main hospital's radiology department: routine mammograms, plain X-rays for orthopedics, ultrasounds, and follow-up CTs for oncology patients. Same PACS, same radiologist reads, but without competing with the ED's STAT queue.</p>`,
      staffing:'Radiologic Technologists, Ultrasound Sonographers, Radiology Coordinator',
      ratios:'1 tech per modality',
      flow_in:['Ambulatory clinic orders','Physician office orders','Direct patient scheduling'],
      flow_out:['Images to PACS','Reports to Epic','Critical results to ordering provider'],
      revenue:'Per-exam billing. Outpatient imaging is high-margin.',
      metrics:['Appointment wait time','Report turnaround time','Equipment utilization rate'],
      infra:['Radiation shielding (X-ray, CT)','PACS integration','Limited contrast capability'],
      deps:['All ambulatory clinics','Main Radiology (for reads)','Lab (contrast clearance)']
    },
    { id:'cafe', name:'Cafe / Patient Amenities', short:'Cafe & Lobby', cat:'admin', size:2, icon:'Caf',
      tagline:'Waiting room support, wayfinding, and guest services: the patient experience layer.',
      overview:`<p>The lobby and patient amenities floor is often the last thing designers think about and the first thing patients notice. Somebody's mother will sit in that seating for four hours, so it has to work for the elderly and the anxious. The cafe has to beat a vending machine. Wayfinding gets the same test: can a first-time patient find their clinic without asking three people for help? All of it shows up in patient experience scores, and in whether people come back.</p>`,
      staffing:'Cafe Staff, Guest Services, Volunteer Services, Patient Ambassadors',
      ratios:'Variable',
      flow_in:['Ambulatory patients and families','Staff','Visitors'],
      flow_out:['Navigation assistance','Wait time updates','Escalation of patient concerns'],
      revenue:'Cafeteria revenue. Minor. Net cost center.',
      metrics:['Patient experience with facility environment','Wayfinding complaint rate'],
      infra:['Commercial kitchen (small)','Digital wayfinding kiosks','Comfortable seating'],
      deps:['Patient Access','Food Services (main hospital)','Administration']
    },
  ]},
];

// ═══════════════════════════════════════════════════════════════
// MANAGEMENT WING DATA
// ═══════════════════════════════════════════════════════════════
const WING_FLOOR_INFRA = {
  'w3': ['data','power','hvac'],
  'w2': ['data','power','hvac'],
  'w1': ['data','power','hvac'],
};

const WING_FLOORS = [
  {
    id: 'w3', label: 'WG 3',
    units: [
      { id:'admin',      name:'Administration',           short:'Admin',    cat:'admin',    size:3,
        icon:'A', tagline:'Executive leadership, finance, and strategy for the organization.',
        overview:`<p>Budgets, capital requests, service line strategy, executive compensation, regulatory compliance: the hospital's financial and operational decisions get made on this floor. Most clinical staff only ever meet it through policy memos and performance reviews.</p><p>The C-suite (CEO, CNO, CFO, CMO, COO) sits in this building. Their decisions set nurse-to-patient ratios, capital equipment schedules, and which service lines get expanded or cut. Being physically separated from the clinical building is intentional, and sometimes the problem.</p>`,
        staffing:'C-suite executives, VPs, Directors, Executive Assistants, HR leadership',
        ratios:'N/A',
        flow_in:['Reports from every department','Regulatory submissions','Board communications'],
        flow_out:['Policy directives','Budget approvals','Staffing plans','Capital decisions'],
        revenue:'Cost center. Administration overhead is allocated across service lines for cost accounting.',
        metrics:['Operating margin','FTE per adjusted patient day','Days cash on hand','Employee turnover rate','CMS star rating'],
        infra:['IT network (executive systems)','Secure videoconferencing','Emergency power for servers'],
        deps:['All departments (oversight)','Finance','HR','Legal/Compliance']
      },
      { id:'hit',        name:'Health IT / Informatics',   short:'Health IT',cat:'admin',    size:2,
        icon:'IT', tagline:'EHR management, clinical systems, and the data infrastructure everything runs on.',
        overview:`<p>Health IT keeps the building's nervous system running. Epic, the ventilator alarms that feed into the nurse call system, the Pyxis that won't open until the pharmacist verifies the order, the telemetry monitors transmitting to the central station: all of it depends on infrastructure that Clinical Informatics Analysts and IT engineers maintain and configure.</p><p>When the EHR goes down, the whole building notices. Every department falls back on downtime procedures: paper orders, verbal communication, manual medication reconciliation. HIT's job is to make that happen as rarely as possible, and to make the system work better when it is running.</p>`,
        staffing:'Clinical Informatics Analysts, Systems Administrators, EHR Build Analysts, Help Desk, CIO, CMIO',
        ratios:'Varies; larger hospitals have dedicated analysts per clinical domain',
        flow_in:['Ticket queue from all departments','Regulatory/compliance requirements','Vendor updates'],
        flow_out:['EHR builds and updates','Downtime communications','Reports and data extracts','Training materials'],
        revenue:'Cost center. Increasingly tied to revenue cycle through coding accuracy and charge capture.',
        metrics:['EHR uptime %','Help desk ticket resolution time','Meaningful use/quality measure compliance','Charge capture accuracy'],
        infra:['Server room (dedicated data center with redundant power)','Network infrastructure spanning all buildings','Emergency power for servers'],
        deps:['All departments (EHR users)','Administration','Finance (revenue cycle)','Quality']
      },
      { id:'quality',    name:'Quality / Risk Management', short:'Quality', cat:'admin',    size:2,
        icon:'Q', tagline:'Patient safety, regulatory compliance, and adverse event management.',
        overview:`<p>Quality and Risk Management is where the gap between what the hospital says it does and what it actually does gets measured. They run the peer review process, respond to adverse events, track HAI rates, manage the Joint Commission survey preparation, and file the reports no one wants to file.</p><p>Risk Management handles the legal and liability side: incident reports, malpractice claims, and the documentation that either protects or exposes the organization when things go wrong. When they're in the same department, the question of who owns which piece of an adverse event is cleaner. When they're not, that boundary is a regular source of friction.</p>`,
        staffing:'RN Quality Coordinators, Patient Safety Officers, Risk Managers, Compliance Officers',
        ratios:'N/A',
        flow_in:['Incident reports from all departments','Adverse event notifications','Regulatory surveys','Patient complaints'],
        flow_out:['Performance improvement plans','Policy updates','Regulatory reports','Root cause analyses'],
        revenue:'Cost center. Directly affects revenue through value-based purchasing, HAC penalties, and readmission penalties.',
        metrics:['HAI rates (CLABSI, CAUTI, SSI)','Patient safety event rate','Never event count','Survey readiness score','Mortality index'],
        infra:['Quality data systems','Epic (reporting module)'],
        deps:['Administration','All clinical departments','Medical Staff Office','Legal']
      },
      { id:'hr',         name:'Human Resources',           short:'HR',      cat:'admin',    size:3,
        icon:'HR', tagline:'Workforce pipeline, benefits, and the staffing infrastructure that keeps the building running.',
        overview:`<p>Healthcare HR is primarily workforce pipeline management with benefits administration layered on top. Nursing recruitment never closes. Neither does respiratory therapy, and the lab tech req has been open so long it has seniority. All of it runs against a national shortage that doesn't care about your facility's location or pay scale.</p><p>The turnover math is brutal. Replacing a single experienced ICU nurse costs an estimated $88,000 to $100,000 when you account for recruitment, orientation, and the productivity gap during onboarding. HR's job is to reduce that number while running benefits, handling performance management, and navigating labor relations in an environment where healthcare unions are expanding.</p>`,
        staffing:'HR Business Partners, Talent Acquisition Specialists, Benefits Coordinators, Labor Relations (if unionized), Compensation Analysts',
        ratios:'N/A',
        flow_in:['Requisitions from all departments','Employee relations issues','Benefits enrollment requests','Workers comp claims'],
        flow_out:['Offer letters','Onboarding documentation','Benefits elections','Policy guidance'],
        revenue:'Cost center.',
        metrics:['Voluntary turnover rate','Time to fill (days per open position)','Offer acceptance rate','New hire 90-day retention','Vacancy rate by unit'],
        infra:['HRIS (HR information system)','Applicant tracking system','Learning management system'],
        deps:['All departments (staffing)','Finance (compensation)','Compliance','Legal']
      },
    ]
  },
  {
    id: 'w2', label: 'WG 2',
    units: [
      { id:'casemgmt',   name:'Case Management / UR',     short:'Case Mgmt',cat:'admin',    size:3,
        icon:'CM', tagline:'Managing patient transitions, payer authorization, and length of stay.',
        overview:`<p>Case Management is the pressure valve between clinical care and payer requirements. CMs review every admitted patient daily, ensuring the clinical picture justifies the level of care the hospital is billing, and that the patient is moving toward the right next setting. Utilization Review (UR) is the subset of that work that directly interfaces with insurance companies.</p><p>When a payer denies a claim or questions medical necessity, UR is on the phone. When a patient isn't safe to go home but can't stay inpatient, the CM finds the SNF, the home health agency, or the family conversation that makes discharge possible. This is unglamorous work that has an outsized effect on both hospital revenue and patient outcomes.</p>`,
        staffing:'Registered Nurses (case manager credential), Social Workers, UR Coordinators',
        ratios:'1 CM per 15–25 inpatients depending on acuity and complexity',
        flow_in:['Every admitted patient','Readmissions','Complex discharges flagged by floor nurses'],
        flow_out:['Discharge plans','SNF/LTACH placements','Home health orders','Payer communications','Denial appeals'],
        revenue:'Cost center, but directly protects revenue by preventing denials and reducing excess LOS.',
        metrics:['LOS vs. geometric mean LOS','Denial rate','Discharge by noon %','Readmission rate','SNF/home health placement time'],
        infra:['Epic (care management workflows)','Payer portal access','Secure fax'],
        deps:['Social Work','All clinical floors','Pharmacy','PT/OT','ED','Administration']
      },
      { id:'revenue_cycle',name:'Revenue Cycle / Finance', short:'Rev Cycle',cat:'admin',    size:3,
        icon:'RC', tagline:'The gap between what clinical staff did and what the hospital actually gets paid.',
        overview:`<p>Revenue Cycle is the gap between what the clinical team documented and what the hospital actually gets paid for it. Coding accuracy, charge capture, claim scrubbing, denial management, collections: every step in the chain between a completed clinical encounter and a paid claim runs through this department.</p><p>Coding underdocumentation is the most common revenue leak. A patient with heart failure, CKD, and a comorbid respiratory infection has a very different DRG weight depending on what the coder documents as the principal diagnosis and what qualifies as CC/MCC. That difference is real dollars on every case: multiplied across thousands of admissions a year.</p>`,
        staffing:'Certified Professional Coders (CPC), Medical Billers, Denial Management Specialists, Finance Analysts, CFO, Revenue Cycle Director',
        ratios:'N/A',
        flow_in:['Encounter data from all departments','Claim denials from payers','Underpayment alerts','Audit requests'],
        flow_out:['Submitted claims','Denial appeals','Financial reports','Coding queries to clinical staff'],
        revenue:'The function that enables all other revenue. Coding accuracy improvements measured in millions at scale.',
        metrics:['Clean claim rate','Denial rate by payer','Days in accounts receivable (AR)','Net collection rate','Coding accuracy rate','Late charge rate'],
        infra:['Billing software','Payer portal access','Coding reference tools (Optum, 3M)','Epic revenue cycle module'],
        deps:['All clinical departments (documentation)','Case Management','Compliance','Administration']
      },
      { id:'socialwork', name:'Social Work',               short:'Social Wk',cat:'admin',    size:2,
        icon:'SW', tagline:'Safe discharge planning, psychosocial support, and community resource navigation.',
        overview:`<p>Social Work is where discharge planning gets honest. A patient who says they have someone at home, and a social worker who finds out that person is an 80-year-old spouse who can barely care for themselves. A patient who presents with a fracture and the mechanism doesn't fit. A substance use disorder that the clinical team documented as incidental and the social worker flagged as the driver of the admission.</p><p>Social workers are in the patient safety chain on every floor. They're the ones who push back on the discharge plan that looks clean on paper and will fail by day two. Their work is invisible in the DRG but directly tied to readmission rates, patient safety events, and healthcare utilization downstream.</p>`,
        staffing:'MSW (Master of Social Work), LCSW (Licensed Clinical Social Worker)',
        ratios:'1 SW per 20–30 patients; smaller ratios in ICU, psych, and ED',
        flow_in:['Referrals from nursing','ED high-utilizer flags','Psych consults','Discharge barriers','Domestic violence concerns'],
        flow_out:['Discharge plans with community resources','Safety reports','Guardianship referrals','Substance use treatment placement'],
        revenue:'Cost center. Increasingly recognized as reducing readmissions and ED utilization.',
        metrics:['Referral response time','Discharge barrier resolution rate','SDOH screening completion','Readmission contribution'],
        infra:['Epic social work module','Secure communication tools','Community resource database'],
        deps:['Case Management','ED','Psych','All clinical floors','Community partners']
      },
      { id:'med_staff',  name:'Medical Staff Office',      short:'Med Staff',cat:'admin',    size:2,
        icon:'MS', tagline:'Provider credentialing, privileging, and medical staff governance.',
        overview:`<p>Medical Staff Office runs credentialing and privileging for every provider who practices in this building. A new physician cannot write a single order until the MSO verifies their license, training, board status, DEA number, malpractice history, and the clinical competencies required for their specific privileges. That process takes months and cannot be shortcut.</p><p>Primary source verification: contacting the licensing board, the training program, and malpractice carriers directly: is a Joint Commission requirement. The MSO is why a physician can't just move from one hospital to the next without going through the full process again at each facility. It's slow, frustrating, and essential.</p>`,
        staffing:'Medical Staff Coordinator, Credentialing Specialists, Medical Staff Director, Medical Executive Committee support',
        ratios:'N/A',
        flow_in:['New provider applications','Reappointment packages (every 2 years)','Privilege requests','Peer review referrals'],
        flow_out:['Credentialed and privileged providers','Peer review findings','Medical Executive Committee meeting minutes','Disciplinary actions'],
        revenue:'Cost center. Directly enables physician-generated revenue.',
        metrics:['Credentialing turnaround time','Reappointment completion rate','Peer review completion rate','Privileging accuracy'],
        infra:['Credentialing software (e.g., Verisys, Silversheet)','Primary source verification services','Secure document storage'],
        deps:['All clinical departments (physicians)','Quality (peer review)','HR','Legal/Compliance']
      },
    ]
  },
  {
    id: 'w1', label: 'WG 1',
    units: [
      { id:'compliance', name:'Compliance / Legal',         short:'Compliance',cat:'admin',   size:3,
        icon:'CL', tagline:'HIPAA, billing integrity, regulatory risk, and the liability side of patient harm.',
        overview:`<p>Compliance covers HIPAA, the False Claims Act, OIG exclusion screening, billing audit readiness, and the other things that can make a federal investigator interested in your organization. Half the function is proactive: internal audits, policy updates, training. The other half is reactive, when something goes wrong and compliance is at the table with legal figuring out what happened and what gets reported.</p><p>Risk Management handles the liability side: patient harm events, near-misses, liability claims, and the event reporting pipeline that feeds the quality data. The two functions overlap enough that many hospitals have merged them. The line between "this is a quality issue" and "this is a legal issue" gets tested every time there's a serious adverse event.</p>`,
        staffing:'Compliance Officer, Privacy Officer, Risk Managers, Legal Counsel (in-house or contracted)',
        ratios:'N/A',
        flow_in:['Incident reports','HIPAA breach notifications','Billing audit flags','OIG work plan items','Patient complaints'],
        flow_out:['Compliance reports','Policy updates','Training requirements','Regulatory filings','Legal holds'],
        revenue:'Cost center. Prevents penalties that can far exceed operational costs: HIPAA fines, False Claims Act settlements, CMS exclusion.',
        metrics:['HIPAA breach rate','Compliance training completion rate','Internal audit findings','Regulatory deficiency rate','Incident report volume'],
        infra:['Compliance management software','Secure document retention system'],
        deps:['Administration','Finance','Quality','HR','All departments (training)','Legal counsel']
      },
      { id:'supply_chain',name:'Supply Chain / Materials',  short:'Supply Ch',cat:'support',  size:4,
        icon:'SC', tagline:'Par levels, vendor contracts, and the receiving dock every department depends on.',
        overview:`<p>Supply Chain manages par levels, vendor contracts, GPO membership, and the receiving dock that every department in the building depends on without thinking about it. When there's a glove shortage, supply chain is calling 14 vendors. When the OR runs out of a specific suture type mid-case, supply chain figures out the substitute and gets it to the scrub tech within the hour.</p><p>The pandemic exposed how fragile hospital supply chains are when built on single-source, just-in-time procurement. Most health systems have since increased safety stock on critical items. Supply Chain maintains those stockpiles, tracks expiration dates, and manages the reorder logic that keeps the building running without nursing directors calling them every morning.</p>`,
        staffing:'Supply Chain Manager, Materials Management Technicians, Receiving Dock Staff, Contracting Analysts, Value Analysis Committee support',
        ratios:'N/A',
        flow_in:['Purchase orders from all departments','Vendor deliveries','Recalls and product alerts','New product requests'],
        flow_out:['Stocked par carts on every unit','Specialty item delivery on demand','Vendor contract renewals','Product standardization recommendations'],
        revenue:'Cost center, but supply chain savings directly improve operating margin. GPO contract compliance and utilization management are measurable.',
        metrics:['Supply expense per adjusted patient day','Stockout rate','Contract compliance %','Recall response time','Inventory turns'],
        infra:['Automated inventory tracking (RFID or barcode)','Receiving dock with controlled access','Temperature-controlled storage (vaccines, blood products)','Materials management software'],
        deps:['OR (critical supply reliability)','Pharmacy','All clinical units','Finance','Infection Control (product compliance)']
      },
      { id:'education',  name:'Education / Training Center',short:'Education',cat:'admin',    size:3,
        icon:'Ed', tagline:'Orientation, annual competencies, simulation training, and clinical skills labs.',
        overview:`<p>Education runs new hire orientation, annual competency validation, and the clinical skills labs that keep staff current on procedures they may see infrequently. The RN who hasn't set up a chest tube drainage system in two years still needs to be able to do it correctly at 3 AM. That competency lives here.</p><p>Simulation-based training has changed what's possible. A new resident practices central line insertion on a manikin until the attending can sign off on the skill; the first live patient comes after the sign-off. The simulation lab is expensive to build and essential to patient safety. Hospitals that cut the education budget first in a downturn pay for it later in orientation extensions, errors, and staff who leave because they don't feel supported.</p>`,
        staffing:'Nurse Educators, Clinical Education Specialists, Simulation Technologists, Education Director',
        ratios:'N/A',
        flow_in:['New hire onboarding cohorts','Annual competency requirements','Skill remediation referrals','New technology rollouts'],
        flow_out:['Competency sign-offs','Orientation completion','Training documentation in LMS','Simulation lab scheduling'],
        revenue:'Cost center. Directly reduces orientation costs, time-to-competency, and turnover-driven recruitment expenses.',
        metrics:['Orientation days to floor-ready','Annual competency completion rate','Simulation lab utilization','New hire 90-day retention','Training-related incident rate'],
        infra:['Simulation lab (manikins, task trainers)','Classroom space','Learning management system (LMS)','AV recording for skills debriefs'],
        deps:['All clinical departments','HR (onboarding)','Compliance (mandatory training)','Quality (competency standards)']
      },
    ]
  },
];

// ═══════════════════════════════════════════════════════════════
// PUBLIC WING UNITS
// ═══════════════════════════════════════════════════════════════
const PUB_UNITS = [
  { id:'gift_shop', name:'Gift Shop & Patient Store', short:'Gift Shop', cat:'support', icon:'GS',
    tagline:'Books, flowers, cards, and snacks near the main lobby entrance.',
    overview:`<p>The hospital gift shop is the most overlooked real estate in the building. It's the place a family member goes when they don't know what else to do: buy a card, a stuffed animal, something to hold onto while waiting for news. In most hospitals it's volunteer-operated and the revenue goes back to the organization through the auxiliary fund.</p><p>Staff come here too, for snacks, forgotten phone chargers, and the occasional birthday present someone forgot until the morning of. It's small, often understaffed, but it has a disproportionate emotional footprint in the building.</p>`,
    staffing:'Volunteer Services (primary), part-time paid staff for evening/weekend coverage',
    ratios:'1–2 volunteers per shift',
    flow_in:['Visitors and families throughout the day','Staff looking for incidentals','Inpatients with walking privileges'],
    flow_out:['Flowers and gifts delivered to patient rooms','Revenue to hospital auxiliary fund'],
    revenue:'Retail sales. Typically nets $80K–$200K/year for a mid-size hospital. Proceeds fund patient care programs through the auxiliary.',
    metrics:['Daily sales revenue','Volunteer hours contributed','Auxiliary fund annual total'],
    infra:['POS system','Refrigerated floral storage','Secure cash handling'],
    deps:['Volunteer Services','Patient Experience','Administration (auxiliary)']
  },
  { id:'cafeteria', name:'Hospital Cafeteria', short:'Cafeteria', cat:'support', icon:'Caf',
    tagline:'Staff fuel station and family gathering space: open more hours than anyone expects.',
    overview:`<p>The hospital cafeteria runs on a different schedule than any other food service operation. It's open early for night shift staff ending their 12s, and late for the day shift who didn't have time for lunch until 3pm. It feeds exhausted residents, families who haven't left the building in two days, and housekeeping staff who have 15 minutes between floors.</p><p>Most hospital cafeterias run as cost centers, funded for access and function. Food quality has improved substantially over the past decade in hospitals that took patient experience scores seriously: turns out staff satisfaction is directly tied to whether the cafeteria has real options.</p>`,
    staffing:'Dietary Technicians, Food Service Workers, Registered Dietitians (oversight)',
    ratios:'Typically 8–15 FTE for cafeteria operations',
    flow_in:['Staff all shifts','Room service orders from patient floors','Visitors and families'],
    flow_out:['Meals to patients (tray delivery)','On-site meals for staff and visitors'],
    revenue:'Net cost center. Cafeteria revenue offsets food cost but rarely turns a profit. Subsidized as a staff and patient benefit.',
    metrics:['Staff satisfaction with food services','Patient meal satisfaction score','Daily meal count','Food waste %'],
    infra:['Commercial kitchen (health-department inspected)','Walk-in refrigeration','Cafeteria POS','Tray delivery carts'],
    deps:['Food & Nutrition Services (inpatient tray delivery)','Infection Control (food safety)','Facilities (kitchen maintenance)']
  },
];

// ═══════════════════════════════════════════════════════════════
// GROUND ZONE DATA
// ═══════════════════════════════════════════════════════════════
const GROUND_ZONES = {
  amb_bay: {
    id:'amb_bay', name:'Ambulance Bay & Emergency Entrance', cat:'critical',
    tagline:'The front door for the sickest patients, and the most operationally complex 30 feet in the building.',
    overview:`<p>The ambulance bay sits directly in front of the Emergency Department and serves as the primary entry point for EMS-transported patients. It's designed for rapid patient offload: paramedics transfer the patient to the ED team with a verbal handoff before the rig turns around for the next run.</p><p>Diversion status: when the hospital tells EMS to take patients elsewhere because the ED is at capacity: is one of the most consequential operational decisions the hospital makes. It affects regional EMS routing and patient outcomes. The bay is the physical manifestation of that pressure.</p>`,
    staffing:'ED Charge Nurse (oversees bay operations), EMS Liaison, Security',
    flow_in:['EMS/paramedic transport','Police transport (trauma, psychiatric)','Walk-in critical patients transferred to gurney'],
    flow_out:['Patients to ED triage and treatment rooms','EMS crews back to service'],
    revenue:'No direct revenue. Bay operations feed ED volume.',
    metrics:['Ambulance diversion hours/month','EMS offload time (target: under 30 min)','EMS patient volume by shift'],
    infra:['Weather-covered bay with sliding doors','O₂ supply at bay stations','Decontamination capability','Radio communication with regional EMS'],
    deps:['Emergency Department','Security','Facilities (bay maintenance)','Regional EMS agencies']
  },
  main_entrance: {
    id:'main_entrance', name:'Main Entrance & Lobby', cat:'admin',
    tagline:'The first impression most patients and families have of the entire organization.',
    overview:`<p>The main entrance sets the tone for the visit. A volunteer at the information desk who actually knows the building. A layout that doesn't make a 70-year-old with a new hip feel lost before they've even reached the elevator. Administrators underrate these details; HCAHPS does not, and neither do the patients deciding whether to come back.</p>`,
    staffing:'Volunteer Services (Information Desk), Security, Patient Ambassadors',
    flow_in:['All scheduled outpatient visits','Visitors','New patients who didn\'t park in the ED lot'],
    flow_out:['Patients directed to registration, clinics, or floors','Visitor passes issued'],
    revenue:'Cost center. Lobby experience directly impacts patient experience scores.',
    metrics:['Wayfinding complaint rate','Lobby satisfaction (HCAHPS environment)','Visitor volume per day'],
    infra:['Digital wayfinding kiosks','Accessible entry (ADA)','Security screening (where applicable)'],
    deps:['Security','Volunteer Services','Patient Access','Administration']
  },
  loading_dock: {
    id:'loading_dock', name:'Shipping & Loading Dock', cat:'support',
    tagline:'The supply chain entry point, and the exit for regulated medical waste.',
    overview:`<p>The physical supply chain makes contact with the building at the loading dock. Medical supplies, pharmaceuticals, food deliveries, linen service, and equipment all come through here. It also serves as the exit point for regulated medical waste, biohazardous materials, and pharmaceutical returns, which carry DEA tracking requirements.</p><p>Loading dock operations overlap directly with infection control. Separate receiving areas for sterile supplies vs. general goods matter. Vendors don't have unescorted access to clinical areas: everything they deliver changes hands at the dock.</p>`,
    staffing:'Central Supply Technicians, Materials Management, Security (access control)',
    ratios:'2–4 FTE per shift for materials management operations',
    flow_in:['Vendor deliveries (scheduled)','Pharmaceutical deliveries (controlled substance manifests)','Food service','Linen returns'],
    flow_out:['Regulated medical waste (biohazard contractor)','Pharmaceutical waste (DEA)','General refuse'],
    revenue:'Cost center. Supply chain efficiency directly affects variable cost per patient day.',
    metrics:['On-time delivery rate','Stockout incidents','Regulated waste compliance','DEA audit compliance'],
    infra:['Freight elevator access','Receiving dock with scales','Cold storage (pharmaceutical cold chain)','Biohazardous waste storage (sealed, regulated)'],
    deps:['Central Supply','Pharmacy','Food & Nutrition','Environmental Services','Security']
  },
  parking: {
    id:'parking', name:'Parking Structure & Campus Circulation', cat:'admin',
    tagline:'The last thing patients deal with before they walk in, and the first thing they complain about.',
    overview:`<p>Hospital parking is an afterthought that drives people insane. The structure here is attached to the MOB and has covered access to both buildings via the lobby connector. 900 spaces sound like a lot until flu season hits and the oncology clinic, the surgery center, and three full floors of primary care are all running simultaneously at 9am on a Tuesday.</p><p>Valet services at the main entrance take some of the pressure off. Validated parking for patients comes out of department budgets. Employee parking assignments are a source of perennial staff complaint at every hospital in the country.</p>`,
    staffing:'Parking Attendants, Valet (if offered), Security for circulation',
    ratios:'1–2 attendants per shift',
    flow_in:['Outpatient visitors','Staff (designated levels)','Ambulatory clinic patients'],
    flow_out:['Patient arrivals at main entrance and MOB lobby','Staff access to building'],
    revenue:'Parking fee revenue. Net cost center at most hospitals once you account for structure maintenance.',
    metrics:['Occupancy rate at peak hours','Patient complaints about parking','Valet turnaround time'],
    infra:['Automated pay stations','EV charging stations','Security cameras','Covered walkway to lobby'],
    deps:['Security','Facilities','Patient Experience','Administration']
  },
};

// ═══════════════════════════════════════════════════════════════
// BUILD BUILDINGS
// ═══════════════════════════════════════════════════════════════
function buildBuilding(floors, floorInfra, stackEl, labelsEl, facadeEl) {
  // Elevator mechanical room at top of shaft
  facadeEl.insertAdjacentHTML('beforeend', '<div class="hm-elev-mech"><span class="hm-elev-mech-label">MECH</span></div>');

  floors.forEach((floor, fi) => {
    // Floor label
    const lblCell = document.createElement('div');
    lblCell.className = 'hm-floor-label-cell';
    lblCell.textContent = floor.label;
    labelsEl.appendChild(lblCell);

    // Elevator floor indicator
    const elevFloor = document.createElement('div');
    elevFloor.className = 'hm-elev-floor';
    const fNum = floor.label.replace('FL ','').replace('AMB ','A').replace('WG ','W').replace('Ground','G');
    elevFloor.innerHTML = `<div class="hm-elev-door"></div><div class="hm-elev-floor-num">${fNum}</div>`;
    facadeEl.appendChild(elevFloor);

    // Floor row
    const row = document.createElement('div');
    row.className = 'hm-floor-row';
    row.dataset.floor = floor.id;

    floor.units.forEach(unit => {
      const catColor = `var(--cat-${unit.cat})`;
      const block = document.createElement('button');
      block.type = 'button';
      if (unit.isNode) block.disabled = true;
      block.className = 'hm-unit' + (unit.isNode ? ' is-node' : '');
      block.dataset.unitId = unit.id;
      if (unit.cat) block.dataset.cat = unit.cat;   // legend spotlight keys on this
      block.style.setProperty('--unit-color', catColor);
      block.style.flex = unit.size;
      block.innerHTML = `<div class="hm-unit-icon">${unit.icon}</div><div class="hm-unit-name">${unit.short}</div>`;
      if (!unit.isNode) {
        block.addEventListener('click', () => openUnit(unit.id));
        block.addEventListener('mouseenter', e => showTooltip(e, unit.name, unit.tagline));
        block.addEventListener('mouseleave', hideTooltip);
      }
      row.appendChild(block);
    });
    stackEl.appendChild(row);

    // Infra strip below each floor (except last) — single badge
    if (fi < floors.length - 1) {
      const infraKeys = floorInfra[floor.id] || [];
      if (infraKeys.length) {
        labelsEl.appendChild(Object.assign(document.createElement('div'), { className: 'hm-infra-label-cell' }));
        facadeEl.appendChild(Object.assign(document.createElement('div'), { className: 'hm-elev-infra' }));
        const strip = document.createElement('div');
        strip.className = 'hm-infra-strip';

        const badge = document.createElement('button');
        badge.type = 'button';
        badge.className = 'hm-infra-badge';
        badge.setAttribute('aria-label', 'Floor infrastructure systems');

        const dotsEl = document.createElement('div');
        dotsEl.className = 'hm-infra-dots';
        infraKeys.forEach(key => {
          const cfg = INFRA[key];
          if (!cfg) return;
          const dot = document.createElement('div');
          dot.className = 'hm-infra-dot';
          dot.style.background = cfg.color;
          dotsEl.appendChild(dot);
        });
        badge.appendChild(dotsEl);
        badge.insertAdjacentHTML('beforeend', `<span>SYS ${infraKeys.length}</span>`);

        const tooltipLines = infraKeys.map(k => {
          const c = INFRA[k];
          return c ? `<span style="color:${c.color}">&#x25CF;</span> ${c.label}` : '';
        }).filter(Boolean).join('&nbsp;&nbsp;');
        badge.addEventListener('mouseenter', e => showTooltip(e, `${floor.label} Infrastructure`, tooltipLines));
        badge.addEventListener('mouseleave', hideTooltip);
        badge.addEventListener('click', () => openFloorSystems(floor.label, infraKeys));

        strip.appendChild(badge);
        stackEl.appendChild(strip);
      }
    }
  });
}

buildBuilding(WING_FLOORS, WING_FLOOR_INFRA, document.getElementById('wingStack'),     document.getElementById('wingLabels'),     document.getElementById('wingFacade'));
buildBuilding(FLOORS,     FLOOR_INFRA,     document.getElementById('hospitalStack'), document.getElementById('hospitalLabels'), document.getElementById('hospitalFacade'));
buildBuilding(AMB_FLOORS, AMB_FLOOR_INFRA, document.getElementById('ambStack'),      document.getElementById('ambLabels'),      document.getElementById('ambFacade'));

// ═══════════════════════════════════════════════════════════════
// UNIT LOOKUP MAP (hospital + ambulatory)
// ═══════════════════════════════════════════════════════════════
const UNIT_MAP = {};
const FLOOR_FOR_UNIT = {};
FLOORS.forEach(floor => {
  floor.units.forEach(u => {
    UNIT_MAP[u.id] = u;
    FLOOR_FOR_UNIT[u.id] = { floor: floor.label, building: 'HOSPITAL' };
  });
});
WING_FLOORS.forEach(floor => {
  floor.units.forEach(u => {
    UNIT_MAP[u.id] = u;
    FLOOR_FOR_UNIT[u.id] = { floor: floor.label, building: 'MGMT WING' };
  });
});
AMB_FLOORS.forEach(floor => {
  floor.units.forEach(u => {
    UNIT_MAP[u.id] = u;
    FLOOR_FOR_UNIT[u.id] = { floor: floor.label, building: 'AMBULATORY' };
  });
});
PUB_UNITS.forEach(u => {
  UNIT_MAP[u.id] = u;
  FLOOR_FOR_UNIT[u.id] = { floor: 'Ground', building: 'PUBLIC WING' };
  const el = document.querySelector(`[data-unit-id="${u.id}"]`);
  if (el) {
    el.addEventListener('click', () => openUnit(u.id));
    el.addEventListener('mouseenter', e => showTooltip(e, u.name, u.tagline));
    el.addEventListener('mouseleave', hideTooltip);
  }
});

// ═══════════════════════════════════════════════════════════════
// DETAIL PANEL
// ═══════════════════════════════════════════════════════════════
const app          = document.getElementById('hmApp');
const detailPanel  = document.getElementById('detailPanel');
const dpHeader     = document.getElementById('dpHeader');
const dpBody       = document.getElementById('dpBody');
let activeUnitId   = null;

// the phone presentation is HUKit.sheet; desktop keeps the always-visible 420px rail.
// The .shell-sheet class rides the phone line so desktop CSS never sees fixed positioning.
const kitSheet = (window.HUKit && HUKit.sheet) ? HUKit.sheet(detailPanel, {
  startDetent: 'dt-half',
  onDismiss: () => { if (activeUnitId || detailPanel.classList.contains('open')) closePanel(); }
}) : null;
function syncSheetMode() {
  const phone = window.HUKit ? HUKit.phone() : window.matchMedia('(max-width: 699px)').matches;
  detailPanel.classList.toggle('shell-sheet', phone);
  if (!phone) { detailPanel.classList.remove('dt-peek','dt-full','open'); }
}
syncSheetMode();
window.matchMedia('(max-width: 699px)').addEventListener('change', syncSheetMode);
function mobileSheet(open) {
  if (!(window.HUKit ? HUKit.phone() : false)) return;   // desktop rail is always visible
  if (!kitSheet) { detailPanel.classList.toggle('panel-open', open); return; }
  if (open) kitSheet.open('dt-half'); else kitSheet.close();
}
let lastOpener = null;   // focus returns to the unit that opened the panel (one-step-back contract)
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!activeUnitId && !detailPanel.classList.contains('open')) return;
  closePanel();
  if (lastOpener && document.contains(lastOpener) && lastOpener.focus) lastOpener.focus();
});

function showWelcomePanel() {
  dpHeader.innerHTML = `
    <div class="hm-dp-floor-tag">HOSPITAL BLUEPRINT</div>
    <div class="hm-dp-title">Click any unit to explore it.</div>
    <div class="hm-dp-tagline">Every department, floor, and campus zone is mapped. Click to see staffing, patient flow, revenue model, and infrastructure dependencies.</div>
  `;
  dpBody.innerHTML = `
    <div class="hm-dp-welcome">
      <div class="hm-dp-welcome-icon">🏥</div>
      <div class="hm-dp-welcome-title">Full cross-section of a modern hospital campus.</div>
      <div class="hm-dp-welcome-body">Acute care hospital on the left. Medical office building on the right. Patient services wing, campus grounds, and infrastructure strips connecting them.</div>
      <div class="hm-dp-welcome-hints">
        <div class="hm-dp-welcome-hint">
          <div class="hm-dp-welcome-hint-icon">🔬</div>
          <div class="hm-dp-welcome-hint-text"><strong class="hm-hint-strong">Floor units</strong>: click any department block for staffing ratios, patient flow, and billing model</div>
        </div>
        <div class="hm-dp-welcome-hint">
          <div class="hm-dp-welcome-hint-icon">⚙️</div>
          <div class="hm-dp-welcome-hint-text"><strong class="hm-hint-strong">Systems badge</strong>: click the SYS strip between floors to see what infrastructure runs there and what breaks when it fails</div>
        </div>
        <div class="hm-dp-welcome-hint">
          <div class="hm-dp-welcome-hint-icon">🚑</div>
          <div class="hm-dp-welcome-hint-text"><strong class="hm-hint-strong">Campus grounds</strong>: ambulance bay, loading dock, and parking are all clickable</div>
        </div>
        <div class="hm-dp-welcome-hint">
          <div class="hm-dp-welcome-hint-icon">🔗</div>
          <div class="hm-dp-welcome-hint-text"><strong class="hm-hint-strong">Connected departments</strong>: chip links inside each panel navigate across the building</div>
        </div>
      </div>
    </div>
  `;
  dpBody.scrollTop = 0;
}

function openUnit(id) {
  const u = UNIT_MAP[id];
  if (!u) return;

  // Deactivate previous
  document.querySelectorAll('.hm-unit.active').forEach(el => el.classList.remove('active'));
  const el = document.querySelector(`[data-unit-id="${id}"]`);
  if (el) el.classList.add('active');

  activeUnitId = id;
  lastOpener = document.activeElement;
  mobileSheet(true);
  syncURL();
  if (typeof announce === 'function') announce(u.name + ' panel opened');
  const catColor = `var(--cat-${u.cat})`;
  const { floor: floorLabel = '', building = '' } = FLOOR_FOR_UNIT[id] || {};

  dpHeader.innerHTML = `
    <button class="hm-dp-close" id="dpClose" aria-label="Close panel">✕</button>
    <div class="hm-dp-floor-tag">${building} · ${floorLabel} · ${u.cat.toUpperCase()}</div>
    <div class="hm-dp-title">${u.name}</div>
    <div class="hm-dp-tagline">${u.tagline}</div>
    <span class="hm-dp-cat-badge" style="color:${catColor};border-color:${catColor};background:color-mix(in srgb,${catColor} 10%,transparent)">${u.cat}</span>
  `;

  let html = '';

  // Overview
  html += `<div class="hm-dp-section">
    <div class="hm-dp-section-label">Overview</div>
    <div class="hm-dp-overview">${u.overview}</div>
  </div>`;

  // Staffing
  html += `<div class="hm-dp-section">
    <div class="hm-dp-section-label">Staffing</div>
    <div class="hm-dp-row"><span class="hm-dp-row-label">Who's there</span><span class="hm-dp-row-val" style="font-size:11px;text-align:right;max-width:260px">${u.staffing}</span></div>
    ${u.ratios && u.ratios !== 'N/A' ? `<div class="hm-dp-row"><span class="hm-dp-row-label">Ratios</span><span class="hm-dp-row-val" style="font-size:11px;text-align:right;max-width:260px">${u.ratios}</span></div>` : ''}
  </div>`;

  // Patient flow
  if (u.flow_in && u.flow_out) {
    html += `<div class="hm-dp-section">
      <div class="hm-dp-section-label">Patient Flow</div>
      <div class="hm-flow-grid">
        <div class="hm-flow-col">
          <div class="hm-flow-label">In</div>
          ${u.flow_in.map(f => `<div class="hm-flow-item">${f}</div>`).join('')}
        </div>
        <div class="hm-flow-arrow">→</div>
        <div class="hm-flow-col">
          <div class="hm-flow-label">Out</div>
          ${u.flow_out.map(f => `<div class="hm-flow-item">${f}</div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  // Revenue
  if (u.revenue) {
    html += `<div class="hm-dp-section">
      <div class="hm-dp-section-label">Revenue Model</div>
      <div class="hm-dp-overview"><p>${u.revenue}</p></div>
    </div>`;
  }

  // Metrics
  if (u.metrics && u.metrics.length) {
    html += `<div class="hm-dp-section">
      <div class="hm-dp-section-label">Key Metrics</div>
      ${u.metrics.map(m => `<div class="hm-dp-metric"><div class="hm-dp-metric-dot" style="background:${catColor}"></div>${m}</div>`).join('')}
    </div>`;
  }

  // Infrastructure
  if (u.infra && u.infra.length) {
    html += `<div class="hm-dp-section">
      <div class="hm-dp-section-label">Infrastructure Dependencies</div>
      <div class="hm-dp-chips">${u.infra.map(i => `<span class="hm-dp-chip">${i}</span>`).join('')}</div>
    </div>`;
  }

  // Dependencies
  if (u.deps && u.deps.length) {
    html += `<div class="hm-dp-section">
      <div class="hm-dp-section-label">Connected Departments</div>
      <div class="hm-dp-chips">${u.deps.map(d => `<button type="button" class="hm-dp-chip" data-dep="${d}">${d}</button>`).join('')}</div>
    </div>`;
  }

  dpBody.innerHTML = html;
  dpBody.scrollTop = 0;
  document.getElementById('dpClose').addEventListener('click', closePanel);
}

function openFloorSystems(floorLabel, infraKeys) {
  activeUnitId = null; syncURL();   // a systems view is not a unit scope
  document.querySelectorAll('.hm-unit.active').forEach(el => el.classList.remove('active'));
  activeUnitId = null;
  mobileSheet(true);

  dpHeader.innerHTML = `
    <button class="hm-dp-close" id="dpClose" aria-label="Close panel">✕</button>
    <div class="hm-dp-floor-tag">${floorLabel} · INFRASTRUCTURE</div>
    <div class="hm-dp-title">Floor Systems</div>
    <div class="hm-dp-tagline">Active systems running through the interstitial space between this floor and the one below. Click any system for full details.</div>
  `;

  let html = '<div class="hm-dp-section">';
  infraKeys.forEach(key => {
    const cfg = INFRA[key];
    if (!cfg) return;
    html += `<button type="button" class="hm-dp-row" style="cursor:pointer" data-infra="${key}">
      <span class="hm-dp-row-label" style="display:flex;align-items:center;gap:7px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cfg.color};flex-shrink:0"></span>
        ${cfg.title}
      </span>
      <span class="hm-dp-row-val" style="font-family:var(--mono);font-size:10px;color:${cfg.color}">${cfg.label} →</span>
    </button>`;
  });
  html += '</div>';

  dpBody.innerHTML = html;
  dpBody.scrollTop = 0;
  document.getElementById('dpClose').addEventListener('click', closePanel);
}

function openInfra(key) {
  activeUnitId = null; syncURL();
  const cfg = INFRA[key];
  if (!cfg) return;

  document.querySelectorAll('.hm-unit.active').forEach(el => el.classList.remove('active'));
  mobileSheet(true);
  activeUnitId = null;

  dpHeader.innerHTML = `
    <button class="hm-dp-close" id="dpClose" aria-label="Close panel">✕</button>
    <div class="hm-dp-floor-tag">BUILDING INFRASTRUCTURE</div>
    <div class="hm-dp-title">${cfg.title}</div>
    <span class="hm-dp-cat-badge" style="color:${cfg.color};border-color:${cfg.color};background:color-mix(in srgb,${cfg.color} 10%,transparent)">${cfg.label}</span>
  `;

  dpBody.innerHTML = `
    <div class="hm-dp-section">
      <div class="hm-dp-section-label">How It Works</div>
      <div class="hm-dp-overview"><p>${cfg.desc}</p></div>
    </div>
  `;
  dpBody.scrollTop = 0;
  document.getElementById('dpClose').addEventListener('click', closePanel);
}

function closePanel() {
  document.querySelectorAll('.hm-unit.active').forEach(el => el.classList.remove('active'));
  activeUnitId = null;
  mobileSheet(false);
  syncURL();
  showWelcomePanel();
}

function openHospitalInfo() {
  activeUnitId = null; syncURL();
  document.querySelectorAll('.hm-unit.active').forEach(el => el.classList.remove('active'));
  activeUnitId = null;
  mobileSheet(true);

  const blue = 'var(--cat-clinical)';
  dpHeader.innerHTML = `
    <button class="hm-dp-close" id="dpClose" aria-label="Close panel">✕</button>
    <div class="hm-dp-floor-tag">HOSPITAL IDENTITY · DESIGNATIONS</div>
    <div class="hm-dp-title">Uncharted Medical Center</div>
    <div class="hm-dp-tagline">A Level I Trauma Center and Academic Medical Center. The most operationally and clinically complex designation in the U.S. hospital system.</div>
    <span class="hm-dp-cat-badge" style="color:${blue};border-color:${blue};background:color-mix(in srgb,${blue} 10%,transparent)">AMC · Level I · Teaching</span>
  `;

  dpBody.innerHTML = `
    <div class="hm-dp-section">
      <div class="hm-dp-section-label">What This Hospital Is</div>
      <div class="hm-dp-overview">
        <p>UMC is a 500+ bed academic medical center affiliated with a medical school. It runs residency and fellowship programs across 22 specialties, conducts federally-funded research, and accepts the region's most complex transfers.</p>
        <p>Level I Trauma means a trauma surgeon is in-house 24/7, not on call, not nearby. In-house. That combination of teaching, research, and clinical complexity is what separates an AMC from a community hospital. It also explains the cost structure, the length-of-stay data, and why the Case Mix Index looks nothing like the regional average.</p>
      </div>
    </div>

    <div class="hm-dp-section">
      <div class="hm-dp-section-label">Hospital Types</div>

      <div style="padding:10px 0;border-bottom:1px solid var(--border2)">
        <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-clinical);letter-spacing:.05em;margin-bottom:4px">ACADEMIC MEDICAL CENTER (AMC)</div>
        <div style="font-size:11px;color:var(--t2);line-height:1.6">Affiliated with a medical school. Runs residency and fellowship programs. Conducts clinical research. Handles the most complex cases in a region. Higher cost per case, higher CMI, longer average LOS. This is UMC.</div>
      </div>

      <div style="padding:10px 0;border-bottom:1px solid var(--border2)">
        <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-support);letter-spacing:.05em;margin-bottom:4px">COMMUNITY HOSPITAL</div>
        <div style="font-size:11px;color:var(--t2);line-height:1.6">The most common hospital type in the U.S. Serves a defined local population. Offers general med/surg, OB, and ED services. May or may not have specialty surgical programs. Reimbursed primarily on DRGs. Where most Americans receive inpatient care.</div>
      </div>

      <div style="padding:10px 0;border-bottom:1px solid var(--border2)">
        <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-rehab);letter-spacing:.05em;margin-bottom:4px">CRITICAL ACCESS HOSPITAL (CAH)</div>
        <div style="font-size:11px;color:var(--t2);line-height:1.6">Rural hospitals with ≤25 inpatient beds, located 35+ miles from the nearest hospital (15+ in mountainous terrain). Receive cost-based Medicare reimbursement instead of DRGs: a financial lifeline for rural access. Required to provide 24/7 emergency services. About 1,300 exist in the U.S.</div>
      </div>

      <div style="padding:10px 0;border-bottom:1px solid var(--border2)">
        <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-procedural);letter-spacing:.05em;margin-bottom:4px">SPECIALTY HOSPITAL</div>
        <div style="font-size:11px;color:var(--t2);line-height:1.6">Single-service-line focus: cardiac, orthopedic, cancer, children's, psychiatric, rehabilitation. Can optimize workflows and costs for a specific case mix. Physician-owned specialty hospitals drew scrutiny for cherry-picking high-margin cases away from full-service competitors.</div>
      </div>

      <div style="padding:10px 0">
        <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-maternal);letter-spacing:.05em;margin-bottom:4px">FEDERALLY QUALIFIED HEALTH CENTER (FQHC)</div>
        <div style="font-size:11px;color:var(--t2);line-height:1.6">Community health centers in medically underserved areas. Sliding-scale fees based on income. Required to provide comprehensive primary care regardless of ability to pay. Federally funded under Section 330 of the Public Health Service Act. Not technically a hospital, but often the primary care backstop for uninsured and Medicaid patients who would otherwise use the ED.</div>
      </div>
    </div>

    <div class="hm-dp-section">
      <div class="hm-dp-section-label">Trauma Center Levels</div>
      <div class="hm-dp-overview" style="margin-bottom:10px"><p>Trauma designation is verified by the American College of Surgeons. It's based on resources, volume, training, and outcomes. Equipment is the easy part.</p></div>

      <div class="hm-dp-metric" style="align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border2)">
        <div class="hm-dp-metric-dot" style="background:var(--cat-critical);margin-top:3px;flex-shrink:0"></div>
        <div>
          <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-critical);letter-spacing:.05em;margin-bottom:3px">LEVEL I · Comprehensive</div>
          <div style="font-size:11px;color:var(--t2);line-height:1.6">24/7 in-house trauma surgeon, physically in the building at all hours. Full surgical subspecialties available. Research program required. Minimum 1,200 major trauma admissions/year OR 240 major trauma patients requiring surgery. Residency program. This is UMC.</div>
        </div>
      </div>

      <div class="hm-dp-metric" style="align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border2)">
        <div class="hm-dp-metric-dot" style="background:var(--cat-procedural);margin-top:3px;flex-shrink:0"></div>
        <div>
          <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-procedural);letter-spacing:.05em;margin-bottom:3px">LEVEL II · Comprehensive (no research requirement)</div>
          <div style="font-size:11px;color:var(--t2);line-height:1.6">Full definitive trauma care. 24/7 trauma surgeon coverage but may be on-call rather than in-house. No mandatory research program or volume threshold. Often the main trauma center for mid-size metros without an academic center.</div>
        </div>
      </div>

      <div class="hm-dp-metric" style="align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border2)">
        <div class="hm-dp-metric-dot" style="background:var(--cat-clinical);margin-top:3px;flex-shrink:0"></div>
        <div>
          <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-clinical);letter-spacing:.05em;margin-bottom:3px">LEVEL III · Stabilize and Transfer</div>
          <div style="font-size:11px;color:var(--t2);line-height:1.6">Initial assessment, resuscitation, emergency surgery, and ICU capability, but most complex cases transfer to Level I or II. Common in rural and suburban areas. 24-hour ED physician coverage required. Must have written transfer agreements with higher-level centers.</div>
        </div>
      </div>

      <div class="hm-dp-metric" style="align-items:flex-start;gap:10px;padding:8px 0">
        <div class="hm-dp-metric-dot" style="background:var(--cat-support);margin-top:3px;flex-shrink:0"></div>
        <div>
          <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-support);letter-spacing:.05em;margin-bottom:3px">LEVEL IV · Basic Stabilization</div>
          <div style="font-size:11px;color:var(--t2);line-height:1.6">Found in rural and remote areas where higher-level care isn't accessible. ATLS capabilities. Stabilizes and transfers. No required volume threshold. May not have 24-hour physician coverage: mid-levels acceptable.</div>
        </div>
      </div>
    </div>

    <div class="hm-dp-section">
      <div class="hm-dp-section-label">Stroke &amp; Cardiac Designations</div>

      <div style="padding:8px 0;border-bottom:1px solid var(--border2)">
        <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-critical);letter-spacing:.05em;margin-bottom:4px">COMPREHENSIVE STROKE CENTER (CSC)</div>
        <div style="font-size:11px;color:var(--t2);line-height:1.6">Full endovascular capability including mechanical thrombectomy for large vessel occlusion. Neurosurgery in-house. 24/7 interventional team. Handles the most complex stroke cases and regional transfers. Certified by Joint Commission or DNV.</div>
      </div>

      <div style="padding:8px 0;border-bottom:1px solid var(--border2)">
        <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-procedural);letter-spacing:.05em;margin-bottom:4px">PRIMARY STROKE CENTER (PSC)</div>
        <div style="font-size:11px;color:var(--t2);line-height:1.6">Can administer IV tPA for ischemic stroke. Stroke team available 24/7 via telemedicine or in person. CT with CTA capability. Most community hospitals with a serious stroke program hold this designation.</div>
      </div>

      <div style="padding:8px 0">
        <div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--cat-clinical);letter-spacing:.05em;margin-bottom:4px">STEMI RECEIVING CENTER</div>
        <div style="font-size:11px;color:var(--t2);line-height:1.6">Primary PCI available 24/7. Cath lab activation to balloon time target: ≤90 minutes from first medical contact. EMS protocols route STEMI patients directly here, bypassing closer non-PCI hospitals. Door-to-balloon time is publicly reported.</div>
      </div>
    </div>

    <div class="hm-dp-section">
      <div class="hm-dp-section-label">Quality &amp; Accreditation</div>
      <div class="hm-dp-chips">
        <span class="hm-dp-chip">Joint Commission (TJC)</span>
        <span class="hm-dp-chip">DNV Alternative</span>
        <span class="hm-dp-chip">CMS 1–5 Star Rating</span>
        <span class="hm-dp-chip">Magnet Nursing (ANCC)</span>
        <span class="hm-dp-chip">Leapfrog Grade A–F</span>
        <span class="hm-dp-chip">U.S. News Rankings</span>
      </div>
      <div class="hm-dp-overview" style="margin-top:10px"><p>Accreditation confirms minimum standards are met: it doesn't guarantee quality. CMS star ratings and Leapfrog grades are output-based and publicly reported. Magnet status signals low nursing turnover, better nurse-to-patient ratios, and shared governance. Academic centers often score lower on patient satisfaction surveys despite better clinical outcomes. Volume and outcome aren't the same thing.</p></div>
    </div>
  `;

  dpBody.scrollTop = 0;
  document.getElementById('dpClose').addEventListener('click', closePanel);
}

function findAndOpenDep(name) {
  // chips carry prose ('Pharmacy (chemo compounding)', 'ICU (essential: ...)') — strip the
  // asides, then prefer exact and prefix matches so 'ICU' stops landing on Neonatal ICU
  const q = name.replace(/(.*?)/g, '').split(':')[0].trim().toLowerCase();
  if (!q) return;
  const units = Object.values(UNIT_MAP);
  const match =
    units.find(u => u.name.toLowerCase() === q || u.short.toLowerCase() === q) ||
    units.find(u => u.name.toLowerCase().startsWith(q) || u.short.toLowerCase().startsWith(q)) ||
    units.find(u => u.name.toLowerCase().includes(q) || u.short.toLowerCase().includes(q));
  if (match) openUnit(match.id);
}

function openGround(id) {
  activeUnitId = null; syncURL();
  const cfg = GROUND_ZONES[id];
  if (!cfg) return;
  document.querySelectorAll('.hm-unit.active').forEach(el => el.classList.remove('active'));
  activeUnitId = null;
  mobileSheet(true);
  const catColor = `var(--cat-${cfg.cat})`;
  dpHeader.innerHTML = `
    <button class="hm-dp-close" id="dpClose" aria-label="Close panel">✕</button>
    <div class="hm-dp-floor-tag">CAMPUS GROUND LEVEL · ${cfg.cat.toUpperCase()}</div>
    <div class="hm-dp-title">${cfg.name}</div>
    <div class="hm-dp-tagline">${cfg.tagline}</div>
    <span class="hm-dp-cat-badge" style="color:${catColor};border-color:${catColor};background:color-mix(in srgb,${catColor} 10%,transparent)">${cfg.cat}</span>
  `;
  let html = `<div class="hm-dp-section"><div class="hm-dp-section-label">Overview</div><div class="hm-dp-overview">${cfg.overview}</div></div>`;
  if (cfg.staffing) html += `<div class="hm-dp-section"><div class="hm-dp-section-label">Staffing</div><div class="hm-dp-row"><span class="hm-dp-row-label">Who's there</span><span class="hm-dp-row-val" style="font-size:11px;text-align:right;max-width:260px">${cfg.staffing}</span></div></div>`;
  if (cfg.flow_in) html += `<div class="hm-dp-section"><div class="hm-dp-section-label">Flow</div><div class="hm-flow-grid"><div class="hm-flow-col"><div class="hm-flow-label">In</div>${cfg.flow_in.map(f=>`<div class="hm-flow-item">${f}</div>`).join('')}</div><div class="hm-flow-arrow">→</div><div class="hm-flow-col"><div class="hm-flow-label">Out</div>${cfg.flow_out.map(f=>`<div class="hm-flow-item">${f}</div>`).join('')}</div></div></div>`;
  if (cfg.revenue) html += `<div class="hm-dp-section"><div class="hm-dp-section-label">Revenue Model</div><div class="hm-dp-overview"><p>${cfg.revenue}</p></div></div>`;
  if (cfg.metrics) html += `<div class="hm-dp-section"><div class="hm-dp-section-label">Key Metrics</div>${cfg.metrics.map(m=>`<div class="hm-dp-metric"><div class="hm-dp-metric-dot" style="background:${catColor}"></div>${m}</div>`).join('')}</div>`;
  if (cfg.infra) html += `<div class="hm-dp-section"><div class="hm-dp-section-label">Infrastructure</div><div class="hm-dp-chips">${cfg.infra.map(i=>`<span class="hm-dp-chip">${i}</span>`).join('')}</div></div>`;
  if (cfg.deps) html += `<div class="hm-dp-section"><div class="hm-dp-section-label">Connected Departments</div><div class="hm-dp-chips">${cfg.deps.map(d=>`<button type="button" class="hm-dp-chip" data-dep="${d}">${d}</button>`).join('')}</div></div>`;
  dpBody.innerHTML = html;
  dpBody.scrollTop = 0;
  document.getElementById('dpClose').addEventListener('click', closePanel);
}

// Wire ground zones
qsa(document,'[data-ground-id]').forEach(el => {
  const id = el.dataset.groundId;
  const cfg = GROUND_ZONES[id];
  if (cfg) {
    el.addEventListener('click', () => openGround(id));
    el.addEventListener('mouseenter', e => showTooltip(e, cfg.name, cfg.tagline));
    el.addEventListener('mouseleave', hideTooltip);
  }
});

// Click outside active unit → welcome state
document.addEventListener('click', e => {
  if (!hit(e,'.hm-unit') && !hit(e,'.hm-detail-panel') &&
      !hit(e,'.hm-infra-badge') && !hit(e,'.hm-ground-zone')) {
    if (activeUnitId) closePanel();
  }
});

// ── ?unit= (HU-CONTROL-ARCHITECTURE-V2: the open department is the scope) ──
const urlCtl = HUKit.urlState({
  url: () => { const p = new URLSearchParams(); if (activeUnitId) p.set('unit', activeUnitId); const q = p.toString(); return q ? ('?' + q) : location.pathname; },
  scope: () => activeUnitId || '',
  seeded: !!new URLSearchParams(location.search).get('unit')   // a deep-link arrival replaces once instead of pushing a duplicate
});
function syncURL() { urlCtl.sync(); }
// hardware back closes the open sheet BEFORE walking the URL (guard created FIRST — its
// popstate listener must run before ours so consumed() is fresh for the same press)
const backGd = (window.HUKit && HUKit.backGuard) ? HUKit.backGuard({
  watch: detailPanel,
  active: () => !activeUnitId && detailPanel.classList.contains('open'),
  step: () => { const x = document.getElementById('dpClose'); if (x) x.click(); else closePanel(); }
}) : null;
window.addEventListener('popstate', () => {
  if (backGd && backGd.consumed()) return;
  urlCtl.suspend(() => {
    const id = new URLSearchParams(location.search).get('unit');
    if (id && UNIT_MAP[id]) openUnit(id); else closePanel();
  });
  urlCtl.mark(activeUnitId || '');   // the next real change is measured from where we landed
});

// dep chips: one delegated listener (the per-chip inline onclick string interpolation retires)
dpBody.addEventListener('click', e => {
  const chip = hit(e,'button.hm-dp-chip[data-dep]');
  if (chip) findAndOpenDep(chip.dataset.dep);
});

// restore BEFORE first paint (script is synchronous; all data + DOM exist here)
(function applyURLState() {
  const id = new URLSearchParams(location.search).get('unit');
  if (id && UNIT_MAP[id]) {
    urlCtl.suspend(() => openUnit(id));
    urlCtl.mark(activeUnitId || '');
    syncURL();
    return;
  }
  showWelcomePanel();
})();

// ═══════════════════════════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════════════════════════
const tooltip = document.getElementById('hmTooltip');

function showTooltip(e, title, body) {
  tooltip.innerHTML = `<strong>${title}</strong>${body}`;
  tooltip.classList.add('visible');
  positionTooltip(e);
}
function hideTooltip() { tooltip.classList.remove('visible'); }
function positionTooltip(e) {
  let x = e.clientX + 12, y = e.clientY + 12;
  if (x + 230 > window.innerWidth) x = e.clientX - 240;
  if (y + 80 > window.innerHeight) y = e.clientY - 90;
  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
}
document.addEventListener('mousemove', e => {
  if (tooltip.classList.contains('visible')) positionTooltip(e);
});

// ── Pinch / pan on mobile ──────────────────────────────────
function makePinchZoom(outer, inner, minS, maxS, autoCenter) {
  let ox = 0, oy = 0, s = 1;
  let initOx = 0, initOy = 0, initS = 1;
  let t0 = null;
  let p0mx = 0, p0my = 0, p0ox = 0, p0oy = 0, p0s = 1;
  const THRESH = 6;
  const resetBtn = outer.querySelector('.pz-reset-btn');
  const hint     = outer.querySelector('.pz-hint');

  inner.style.transformOrigin = '0 0';

  function apply() {
    inner.style.transform = `translate(${ox}px,${oy}px) scale(${s})`;
    const atInit = Math.abs(s - initS) < 0.02 && Math.abs(ox - initOx) < 2 && Math.abs(oy - initOy) < 2;
    if (resetBtn) resetBtn.style.display = atInit ? 'none' : 'flex';
  }

  if (autoCenter) {
    // Double-RAF: first frame commits layout, second reads settled dimensions
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const ow = outer.clientWidth;
      /* Fit the MAIN BUILDING, not the whole campus. The campus is a 1,988px row of
         seventeen buildings; fitting all of it into a 390px phone asks for scale 0.196,
         gets clamped up to the 0.3 floor, and every label inside then renders around
         3.6px. That illegible smear is the first thing every phone visitor sees.
         The acute-care tower is 820px and fits around 0.48: still small, but a coherent
         subject instead of a blur. Pinch out and the reset button both still reach the
         full campus, so nothing is lost, only reordered. */
      const primary = inner.querySelector('.hm-campus-bldg--hospital');
      const target = primary || inner;
      const cw = target.offsetWidth || inner.offsetWidth;
      if (!cw || !ow) return;
      initS = Math.max(minS, Math.min(1, ow / cw));
      // centre the CHOSEN building, which means offsetting past whatever sits left of it
      initOx = (ow - cw * initS) / 2 - (primary ? primary.offsetLeft * initS : 0);
      initOy = 0;
      s = initS; ox = initOx; oy = initOy;
      apply();
    }));
  }

  function mid(e) {
    const r = outer.getBoundingClientRect();
    if (e.touches.length < 2) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top, d: 0 };
    const x1 = e.touches[0].clientX - r.left, y1 = e.touches[0].clientY - r.top;
    const x2 = e.touches[1].clientX - r.left, y2 = e.touches[1].clientY - r.top;
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2, d: Math.hypot(x2 - x1, y2 - y1) };
  }

  outer.addEventListener('touchstart', e => {
    if (e.touches.length >= 2) {
      e.preventDefault();
      const m = mid(e);
      t0 = { type: 'pinch', d: m.d };
      p0mx = m.x; p0my = m.y; p0ox = ox; p0oy = oy; p0s = s;
    } else {
      // Always allow pan — threshold distinguishes tap from drag
      t0 = { type: 'maybe', x: e.touches[0].clientX, y: e.touches[0].clientY, ox, oy };
    }
  }, { passive: false });

  outer.addEventListener('touchmove', e => {
    if (!t0) return;
    if (e.touches.length >= 2 && t0.type !== 'pinch') {
      // Fingers added mid-gesture — start pinch
      e.preventDefault();
      const m = mid(e);
      t0 = { type: 'pinch', d: m.d };
      p0mx = m.x; p0my = m.y; p0ox = ox; p0oy = oy; p0s = s;
      return;
    }
    if (t0.type === 'pinch') {
      e.preventDefault();
      const m = mid(e);
      const ns = Math.min(maxS, Math.max(minS, p0s * m.d / t0.d));
      ox = m.x - (p0mx - p0ox) * ns / p0s;
      oy = m.y - (p0my - p0oy) * ns / p0s;
      s = ns;
      apply();
      return;
    }
    const dx = e.touches[0].clientX - t0.x;
    const dy = e.touches[0].clientY - t0.y;
    if (t0.type === 'maybe' && Math.abs(dx) < THRESH && Math.abs(dy) < THRESH) return;
    t0.type = 'pan';
    e.preventDefault();
    ox = t0.ox + dx;
    oy = t0.oy + dy;
    apply();
  }, { passive: false });

  outer.addEventListener('touchend',    () => { t0 = null; });
  outer.addEventListener('touchcancel', () => { t0 = null; });

  if (resetBtn) resetBtn.addEventListener('click', () => { ox = initOx; oy = initOy; s = initS; apply(); });

  if (hint && window.innerWidth <= 1099) {
    hint.style.display = 'flex';
    setTimeout(() => {
      hint.style.opacity = '0';
      setTimeout(() => { hint.style.display = 'none'; hint.style.opacity = '1'; }, 800);
    }, 2500);
  }
}

if (window.HUKit ? HUKit.phone() : window.innerWidth < 700) {
  makePinchZoom(
    document.querySelector('.hm-building-scroll'),
    document.querySelector('.hm-campus-col'),
    0.3, 2.5,
    true  // auto-center the building on init
  );
}

// ── direct manipulation (the Operators type-legend pattern): tap a legend
// category to spotlight its units on every floor; tap again to release.
// (the ?unit= serializer owns unit scope; the legend spotlight stays session-only by design)
let catIso = null;
function announce(msg) {
  const el = document.getElementById('a11yLive'); if (!el) return;
  el.textContent = '';                                  // clear first so repeats re-announce
  requestAnimationFrame(() => { el.textContent = msg; });
}
function applyCatIso() {
  qsa(document,'.hm-unit').forEach(u => u.classList.toggle('dim', catIso != null && u.dataset.cat !== catIso));
  qsa(document,'.hm-leg-item[data-cat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === catIso)));
}
document.querySelector('.hm-subbar-legend').addEventListener('click', e => {
  const b = hit(e,'[data-cat]'); if (!b) return;
  catIso = (catIso === b.dataset.cat) ? null : b.dataset.cat;
  applyCatIso();
  announce(catIso ? 'Spotlighting ' + b.textContent.trim() + ' units' : 'Showing all units');
});

/* The two inline onclick attributes this tool carried cannot survive module scope:
   the functions stop being global. #dpBody rebuilds by innerHTML every time a panel
   opens, so a directly bound handler would be dropped anyway; the rows go through
   one delegated listener instead. Same conversion iceberg-map made, and the same
   shape as the .hm-subbar-legend listener directly above. */
dpBody.addEventListener('click', e => {
  const row = hit(e,'[data-infra]');
  if (row) openInfra(row.getAttribute('data-infra'));
});
asEl(document.querySelector('.hm-hosp-marquee')).addEventListener('click', () => openHospitalInfo());
