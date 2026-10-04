/* Tracing a broken arm: the data behind the draft at /secret-menu/a-routine-fracture/.
   One patient's week as 20 scenes in six parts. Each scene carries the patient's story (always shown) and
   layers a reader can turn on: med (medical care), ppr (paperwork), rec (records), mon (money) and ask
   (questions a patient could ask). The paper trail reads orderFlow and records; the whole map reads every
   scene with its layers side by side.

   scene: { id, d (day), t (about when), title, pa [pain, anxiety] 0 to 10 (patient-reported, from recall;
            null where there is none), paNote, count [[label, which, of]] (running repeats), story
            [paragraphs], chart (a line from the patient's own record), ahead (has not happened yet),
            L { med|ppr|rec|mon: [items] or { note, items }, ask: [questions] } }
   An item ending in "?" probably happened but the record cannot confirm it; it draws dashed. Everything
   in an ahead scene draws dashed. */
window.HU_STORY = {
  layers: [
    { key: 'med', name: 'Medical care', color: '#FF6B9D', sys: 'Clinical workflow' },
    { key: 'ppr', name: 'Paperwork', color: '#A78BFA', sys: 'Operational workflow' },
    { key: 'rec', name: 'Records', color: '#3FC98A', sys: 'Technology, EHR and data' },
    { key: 'mon', name: 'Money', color: '#F6C358', sys: 'Insurance, external' },
    { key: 'ask', name: 'Questions to ask', color: '#4ECDC4' }
  ],

  parts: [
    { n: 1, short: 'Thursday night', title: 'The community hospital', scenes: [
      { id: 's1', d: 'Thursday', t: 'about 6:30 PM', title: 'The injury', pa: [8, 1],
        story: ['A few people from the neighborhood were playing flag football at the park when Dave fell onto the left elbow. The arm looked wrong, but no bone had come through the skin, so Dave assumed it was dislocated.',
          'A friend drove Dave ten minutes to the closest ED, which was also in network; Dave checked, out of habit. For an emergency, most health plans have to cover any ED at in-network cost sharing, without prior approval.'],
        L: { mon: ['Network status checked', 'Emergency care at in-network cost sharing'],
          ask: ['If this is an emergency, does it matter which ED I go to?', 'Who can come with me, and stay?'] } },

      { id: 's2', d: 'Thursday', t: 'about 7 PM', title: 'The X-ray', pa: [9, 2],
        count: [['Registration', '1', 5], ['EHR', '1', 3], ['Imaging study', '1', 4], ['Radiologist', '1', 3]],
        story: ['The community ED was quiet, with no one else in the waiting room. Registration took the basics quickly, and Dave was in a room within minutes. The physician took a brief history and ordered an X-ray, since nothing else could proceed until someone saw the bone.',
          'It was also a fracture. The chart calls it a closed trans-olecranon fracture-dislocation: the top of the ulna broke across the joint, and the forearm came out of place with it.'],
        chart: '“Severe fracture dislocation of the elbow. Orthopedic consultation would be prudent.” The first radiologist’s read.',
        L: { med: ['Exam and history', 'X-ray', 'Read by a radiologist', 'Diagnosis'],
          ppr: { note: 'Registration started at the front desk.', items: ['Quick registration', 'Wristband', 'Into a room', 'Triage score?'] },
          rec: ['ED encounter 1 opens', 'X-ray order', 'Radiology report', 'Diagnosis code', 'Arrival time stamped', 'ED notification to the PCP?'],
          mon: ['Coverage check?', 'Patient account 1 opens', 'Imaging charges?', 'Radiologist’s separate bill?'],
          ask: ['What did the X-ray show, in plain words?', 'Has a specialist been called?'] } },

      { id: 's3', d: 'Thursday', t: 'about 7:30 PM', title: 'The rest of the forms', pa: [9, 3],
        story: ['An IV went in early, around the time of the X-ray, and Dave received IV pain medication through it. When a team expects to sedate, an early IV is routine. The registrar then returned with a tablet, and Dave finished registering in the bed with the IV already in place.',
          'The friend was still there, and Dave’s care partner was on his way.'],
        L: { med: ['IV started', 'IV pain medication'],
          ppr: { note: 'Registration happens in pieces over the first hour, on purpose: an ED may not delay the screening exam to ask about insurance. The tablet form was most likely the general consent, one document that usually covers treatment, assignment of benefits, financial responsibility and release of records to the insurer.',
            items: ['Registration completed at the bedside', 'General consent on a tablet?'] },
          rec: ['Signed consent stored', 'Insurance and contacts on file'],
          mon: ['Financial responsibility, in the general consent?', 'No copay collected'],
          ask: ['What am I signing, and can I get a copy?', 'Is my insurance on file correctly?'] } },

      { id: 's4', d: 'Thursday', t: 'about 8 to 9 PM', title: 'The first sedation', pa: [10, 4], paNote: 'Before the sedation',
        count: [['Sedation', '1', 2], ['Reduction', '1', 2], ['Imaging study', '2', 4], ['Radiologist', '2', 3]],
        story: ['The ED physician sedated Dave with ketamine and tried to set the arm, a procedure the chart calls a reduction, while respiratory therapy and nursing watched the airway and the monitors.',
          'The arm was splinted and Dave was sent for a CT. It showed the radius still out of place. With the top of the ulna in pieces, the joint had little bone to hold a reduction, a known difficulty with this kind of fracture and the reason it needed a plate.'],
        chart: 'A second radiologist: the radius still dislocated, and the ulna “highly comminuted,” meaning broken into multiple pieces.',
        L: { med: ['Ketamine sedation', 'Respiratory and nursing at the bedside', 'Reduction attempt', 'Splint', 'Pulse and nerve check of the hand?', 'CT', 'Read by a second radiologist'],
          ppr: ['Consent for sedation'],
          rec: ['Medication record', 'Sedation note', 'Procedure note', 'CT report'],
          mon: ['Procedure charges?', 'CT charges?', 'Separate ED physician and radiologist bills?'],
          ask: ['What are you giving me, and how will it feel?', 'If the joint does not stay in place, what happens next?'] } },

      { id: 's5', d: 'Thursday', t: 'about 10 PM', title: 'The transfer', pa: [10, 7],
        story: ['Around 10 PM, the physician told Dave a transfer to the trauma center was needed. Dave asked about surgery and was told it would not happen that night. The plan was another reduction there, and a surgeon later.',
          'That is standard: the urgent step is getting the joint back in place, and the fracture itself is usually repaired on a scheduled day. Dave did not ask why the transfer was needed, and the chart does not say. Orthopedic coverage is the usual reason, and the trauma center had an orthopedic surgeon on call that night.',
          'The arm was already splinted, and Dave got another dose of pain medication before leaving. An ambulance was offered; Dave chose the car instead and signed a form saying so.'],
        L: { med: ['Decision: transfer', 'Another dose of pain medication'],
          ppr: { note: 'A transfer between hospitals usually comes with a physician-to-physician call and acceptance by the receiving hospital. Neither appears in the patient portal, so both are drawn dashed. Dave signed the form for going by car.',
            items: ['Physician-to-physician handoff?', 'Acceptance by the trauma center?', 'Ambulance offered, car chosen', 'Form for going by private car'] },
          rec: ['Encounter 1 closes', 'Images already in the shared archive?', 'Length of stay stamped', 'ED notification to the PCP?'],
          mon: ['Account 1 waits for a claim'],
          ask: ['Will my images be there when I get there?', 'Can someone drive me, or does it need to be an ambulance?'] } }
    ] },

    { n: 2, short: 'Thursday night', title: 'The trauma center', scenes: [
      { id: 's6', d: 'Thursday', t: 'about 11 PM', title: 'Registered again', pa: [9, 8],
        count: [['Registration', '2', 5]],
        story: ['Dave’s care partner drove, in his own car. At the trauma center Dave was registered and given a wristband again, and a second account was opened, at a hospital in the same health system as the first.',
          'Both hospitals chart in the same EHR, and the images were already there.'],
        L: { med: ['Arrival', 'Triage score?', 'Into a bed'],
          ppr: ['Registration', 'Second wristband'],
          rec: ['ED encounter 2 opens, same chart', 'The first ED’s images, already there', 'Same image archive?', 'ED notification to the PCP?'],
          mon: ['Coverage check, again?', 'Patient account 2 opens', 'No copay collected'],
          ask: ['Do you have what the first ED did?'] } },

      { id: 's7', d: 'Friday', t: 'just after midnight', title: 'The second sedation', pa: [3, 5], paNote: 'A 9 before the sedation',
        count: [['Sedation', '2', 2], ['Reduction', '2', 2], ['Imaging study', '3 and 4', 4], ['Radiologist', '3', 3]],
        story: ['Dave was sedated again, with etomidate instead of ketamine, and the on-call orthopedist set the arm under live X-ray. It stayed in place.',
          'The pain dropped from a 9 to about a 5 almost immediately, and it was around a 3 by the time a third radiologist signed the CT that confirmed the reduction.'],
        L: { med: ['Etomidate sedation', 'Reduction under live X-ray (fluoroscopy)', 'New splint?', 'Pulse and nerve check of the hand?', 'Orthopedic consult', 'CT', 'Read by a third radiologist'],
          ppr: ['Orthopedist called in', 'Consent for sedation, again'],
          rec: ['Sedation note', 'Medication record', 'Fluoroscopy record?', 'CT report'],
          mon: ['Procedure charges?', 'Imaging charges?', 'The orthopedist’s own bill?'] } },

      { id: 's8', d: 'Friday', t: 'about 2 AM', title: 'Home, by way of the pharmacy', pa: [3, 5],
        story: ['Dave was discharged around 2 AM with a prescription and a plan: follow up with the orthopedist’s group on Tuesday or Wednesday, and they would schedule surgery after that.',
          'At a 24-hour pharmacy, the wait for the prescription was about thirty minutes. Dave was about eight hours out from the injury.'],
        L: { med: ['Discharge', 'Pain medication prescribed'],
          ppr: ['Follow-up instructions', 'After-visit summary'],
          rec: ['Encounter 2 closes', 'ED notification to the PCP?', 'State drug database check?', 'e-Prescription to the pharmacy'],
          mon: ['Pharmacy claim', 'Copay, on a credit card'],
          ask: ['Who sets up the follow-up, me or you?', 'What would bring me back before the follow-up?', 'What changes in my hand or fingers mean I should come back right away?'] } }
    ] },

    { n: 3, short: 'Friday to Monday', title: 'Finding a surgeon', scenes: [
      { id: 's9', d: 'Friday', t: 'morning', title: 'Calling around', pa: [3, 7],
        story: ['By Friday morning the pain was under control, and Dave’s anxiety was back up to a 7. The discharge plan meant a clinic visit early the next week and a surgery date after that, with the ulna still in pieces.',
          'Dave called four or five orthopedic clinics on their public scheduling lines, looking for whichever had the earliest opening. Between calls, Dave told a manager at work and started a leave and FMLA request.'],
        L: { ppr: ['Calls to four or five clinics', 'An appointment for Monday', 'Referral order from the ED?', 'Leave and FMLA request'],
          ask: ['Do I need a referral, or can I call a clinic myself?', 'What does my employer need from me for leave?'] } },

      { id: 's10', d: 'Monday', t: 'morning', title: 'The surgeon', pa: [2, 3],
        count: [['Registration', '3', 5]],
        story: ['An orthopedic clinic in the same health system as both hospitals had a Monday opening. Dave’s care partner came along. The surgeon had already reviewed all four imaging studies from both EDs before the visit and scheduled surgery for the next day.',
          'The plan was a plate and screws. The operative report, written the next day, notes that about a third of these plates are eventually removed.'],
        L: { med: ['Exam', 'All four studies reviewed', 'Surgery planned'],
          ppr: ['Registration', 'Surgical consent', 'Surgery booked for Tuesday', 'FMLA certification form?'],
          rec: ['Encounter 3', 'History and physical (H&P)'],
          mon: ['Visit charge', 'Clinic facility charge?', 'No copay collected', 'Prior authorization?'],
          ask: ['Has my insurance approved the surgery?', 'What will I owe, and when?'] } }
    ] },

    { n: 4, short: 'Tuesday', title: 'Surgery day', scenes: [
      { id: 's11', d: 'Tuesday', t: 'about 12:30 PM', title: 'Check-in', pa: [2, 8],
        count: [['Registration', '4', 5], ['EHR', '2', 3]],
        story: ['At the surgery center Dave registered for the fourth time since Thursday and paid $1,840.52 up front. Dave had spent close to the out-of-pocket maximum earlier in the plan year, so when neither ED nor the Monday clinic collected a copay, the maximum seemed to be met. Dave had misread that signal.',
          'Then came about an hour and a half in the waiting room.'],
        L: { ppr: ['Registration', 'About 90 minutes in the waiting room'],
          rec: ['Encounter 4, in a separate EHR', 'The H&P, carried over or written there that day?'],
          mon: ['Eligibility check against the insurer’s running totals?', '$1,840.52 at check-in', 'Was it owed?'],
          ask: ['Have this week’s ED claims processed yet, and can the payment wait, or be smaller, until they do?', 'If I pay up front and the claim comes in lower, how do I get the difference back?'] } },

      { id: 's12', d: 'Tuesday', t: 'about 2 PM', title: 'Pre-op', pa: [2, 9],
        story: ['Dave was taken back and changed into a gown, and the IV and the consents came next, with a nerve block after them. At a 9 on anxiety, Dave did not take in all of what those forms said.',
          'Dave’s care partner was at the bedside for the signing.'],
        L: { med: ['Pre-op nursing check', 'IV', 'Nerve block'],
          ppr: { note: 'The surgery center’s word for Dave’s care partner is the responsible adult.', items: ['Facility, surgical and anesthesia consents, usually separate documents', 'Pre-surgical assessment', 'Responsible adult on file?'] },
          rec: ['Pre-op nursing record?', 'Anesthesia record?'],
          ask: ['Can my support person stay with me while I sign?', 'When does the block wear off, and should I take pain medicine before it does?'] } },

      { id: 's13', d: 'Tuesday', t: 'afternoon into the evening', title: 'Surgery', pa: [6, 5], paNote: 'That night, as the nerve block wore off',
        story: ['The surgery took three to four and a half hours from the time Dave went back, and used a plate and about fifteen screws. After about an hour and a half in recovery, the care partner drove Dave home.'],
        L: { med: ['Open reduction and internal fixation, the surgery', 'Live X-ray during surgery (fluoroscopy)', 'Recovery (PACU)', 'Discharge'],
          ppr: ['Discharge instructions?', 'Released to the care partner'],
          rec: ['Operative report', 'Implant record?', 'Intraoperative images, kept at the surgery center?', 'Recovery notes?'],
          mon: { note: 'The surgery center, the surgeon and the anesthesia group were all in Dave’s network. Had the anesthesia group been out of network, the No Surprises Act would still have held Dave to in-network cost sharing at an in-network surgery center, with no bill for the difference.',
            items: ['Facility charges', 'Separate surgeon and anesthesia bills?', 'All of them in network'] },
          ask: ['Who do I call tonight if something feels wrong?', 'Is everyone who will bill me for this surgery in my network?'] } }
    ] },

    { n: 5, short: 'Wednesday to Friday', title: 'The week after', scenes: [
      { id: 's14', d: 'Wednesday to Thursday', t: '', title: 'Recovering at home', pa: [4, 3],
        story: ['Dave mostly slept. The surgeon had written new prescriptions, which meant another pharmacy run, and the copays went on the credit card as usual. The pain eased over the next few days, and so did the anxiety.',
          'Dave had signed up for the health system’s patient portal to see the images. It shows the reports from the week and none of the images.'],
        L: { med: ['Pain medication at home'],
          ppr: ['New prescriptions from the surgeon, filled'],
          rec: ['Patient portal: the reports, no images', 'The operative report, now in the health system’s chart', 'A second prescriber, sending from one EHR or the other?', 'Fills on record'],
          mon: ['More pharmacy claims', 'More copays'],
          ask: ['How do I request copies of my images?'] } },

      { id: 's15', d: 'Friday', t: 'eight days out', title: 'The PCP', pa: [1, 1],
        count: [['Registration', '5', 5], ['EHR', '3', 3]],
        story: ['An ED notification had reached Dave’s PCP, who practices in a different group on a different system, and that office scheduled a visit. The rest of the week, from the CT to the plate, reached the PCP the way Dave told it. The PCP confirmed Dave was under an orthopedist’s care and asked whether anything else was needed, including how mood and sleep were holding up.',
          'The visit was the fifth registration of the week and another encounter, on a third EHR.'],
        L: { med: ['Mood and sleep check'],
          ppr: ['Registration', 'A visit booked off the ED notification'],
          rec: ['Encounter 5, in a different EHR', 'The week’s history, as Dave told it'],
          mon: ['Visit charge', 'No copay collected'],
          ask: ['Does my PCP have my ED and surgery records, or should I bring them?'] } }
    ] },

    { n: 6, short: 'Ahead', title: 'What comes next', ahead: true, scenes: [
      { id: 's16', d: 'Thursday', t: 'two weeks out', title: 'The follow-up', pa: null, ahead: true,
        story: ['Dave sees the surgeon again two weeks after the injury. The operative report says no X-rays are planned for that visit.'],
        L: { med: ['Surgeon follow-up', 'Wound check', 'No X-rays planned'],
          ppr: ['Another registration'],
          rec: ['Encounter 6'],
          mon: ['The surgeon’s fee usually covers it'],
          ask: ['Is this visit part of the surgery’s payment, or billed on its own?', 'Do the stitches and the splint come off today, or at another visit?'] } },

      { id: 's17', d: 'About two weeks', t: 'after surgery', title: 'Therapy', pa: null, ahead: true,
        story: ['If the surgical findings allow it, the splint comes off about two weeks after surgery and Dave moves to a sling and range-of-motion therapy.'],
        chart: '“Splint immobilization is anticipated for about 2 weeks, followed by sling use and initiation of range-of-motion therapy if appropriate.”',
        L: { med: ['Splint off', 'Sling', 'Range-of-motion therapy'],
          ppr: ['Therapy referral', 'Therapy appointments'],
          mon: ['Therapy authorization?', 'Therapy copays'],
          ask: ['Does my plan limit therapy visits, and do they need approval?'] } },

      { id: 's18', d: 'Six weeks', t: 'to three months', title: 'Getting the motion back', pa: null, ahead: true,
        story: ['Strengthening starts once the surgeon clears it, somewhere between six weeks and three months out. The operative report describes regaining motion as the harder phase, and Dave may not get back the last few degrees of straightening, what the report calls terminal extension.'],
        L: { med: ['Strengthening therapy'],
          ppr: ['Return-to-work paperwork'],
          rec: ['Therapy notes'],
          ask: ['When can I go back to full duty, and who fills out that form?'] } },

      { id: 's19', d: 'Six months', t: 'to a year', title: 'The plate', pa: null, ahead: true,
        story: ['About a third of these plates are removed because they cause irritation, usually around a year out. That would mean a second surgery, with its own registration and possibly its own prior authorization.'],
        L: { med: ['Hardware removal'],
          ppr: ['Another registration'],
          mon: ['Prior authorization?', 'Another set of bills, likely in a new plan year with the deductible reset'] } },

      { id: 's20', d: 'Any day', t: 'now', title: 'The bills', pa: null, ahead: true,
        story: ['Nothing has arrived yet, from the insurer or from any of the places that registered Dave. What the week cost is still an open question.'],
        L: { mon: ['Claims to the insurer', 'Explanations of benefits', 'Statements', 'A refund, if the max was met or the estimate ran high'],
          ask: ['Does every bill match an explanation of benefits from my insurer?'] } }
    ] }
  ],

  /* Where the records stopped: every place that registered me (and the pharmacy), the system it
     charts in, and what I can tell reached it. mark: ok | unk | no | start */
  places: [
    { name: 'First ED', sub: 'The community hospital', sys: 'The health system’s EHR', group: true, mark: 'start', got: 'Dave’s chart for the week starts here.' },
    { name: 'Second ED', sub: 'The trauma center', sys: 'The health system’s EHR', group: true, mark: 'ok', got: 'The first ED’s images were already there, on the same chart, most likely from one shared image archive.' },
    { name: 'Pharmacy', sub: 'Open 24 hours', sys: 'The pharmacy’s own system', mark: 'ok', got: 'The prescription arrived electronically.' },
    { name: 'Orthopedic clinic', sub: 'Same health system', sys: 'The health system’s EHR', group: true, mark: 'ok', got: 'The surgeon had seen all four studies before the visit.' },
    { name: 'Surgery center', sub: 'Tuesday', sys: 'Its own EHR', mark: 'unk', got: 'The H&P was almost certainly there, since the surgery went ahead. Fax, upload, chart access or written there by the surgeon: the record does not say which.' },
    { name: 'Dave’s PCP', sub: 'A different group', sys: 'A different EHR', mark: 'unk', got: 'An ED notification arrived, likely the kind Medicare’s hospital rules call for. Dave doesn’t know its route. The rest of the week came from Dave.' },
    { name: 'Dave', sub: 'In the patient portal', sys: 'The health system’s portal', mark: 'no', got: 'The week’s reports show. The images do not; they are Dave’s on request.' }
  ],

  /* What happened more than once, counted from the record and the patient's account. */
  tally: [
    { what: 'Registrations', n: 5, L: 'ppr', why: 'At five places. The first ED split one registration into two passes by design.' },
    { what: 'Images of the same elbow, before surgery', n: 4, L: 'med', why: 'An X-ray and a CT at the first ED, a live X-ray and a CT at the second. Each answered a different question. Surgery added live X-rays of its own.' },
    { what: 'Radiologists who read them', n: 3, L: 'med', why: 'Across two hospitals, overnight.' },
    { what: 'Sedations', n: 2, L: 'med', why: 'Ketamine, then etomidate. Then anesthesia and a nerve block for the surgery.' },
    { what: 'Reductions', n: 2, L: 'med', why: 'The first did not fully set the joint.' },
    { what: 'Surgical consents', n: 2, L: 'ppr', why: 'One at the Monday clinic, and the surgery center had Dave sign its own.' },
    { what: 'EHRs', n: 3, L: 'rec', why: 'The health system’s, the surgery center’s and the PCP’s.' }
  ]
};

/* ---- For the whole map: one line per step, and where each part was mostly charted. ---- */
window.HU_STORY.lines = {
  s1: 'Dave fell at flag football and got a ride to the closest in-network ED.',
  s2: 'A fracture along with the dislocation.',
  s3: 'An IV went in, and registration finished at the bedside.',
  s4: 'Ketamine sedation and a reduction; the CT showed the radius still out of place.',
  s5: 'Transferred to the trauma center, with no surgery that night.',
  s6: 'Dave’s care partner drove, and Dave was registered again.',
  s7: 'Etomidate sedation and a second reduction, which held.',
  s8: 'Home around 2 AM, after thirty minutes at the pharmacy window.',
  s9: 'Dave called four or five clinics for the earliest opening.',
  s10: 'All four studies reviewed before the visit, and surgery booked for Tuesday.',
  s11: 'Dave registered and paid $1,840.52 up front.',
  s12: 'A gown, an IV, a nerve block and a stack of consents.',
  s13: 'Three to four and a half hours from the time Dave went back, then home.',
  s14: 'Sleep, and new prescriptions from the surgeon. The patient portal has the reports and none of the images.',
  s15: 'A check on mood and sleep, and Dave doing fine.',
  s16: 'A wound check with the surgeon, with no X-rays planned.',
  s17: 'The splint comes off, then a sling and range-of-motion therapy.',
  s18: 'Strengthening, with full extension uncertain.',
  s19: 'A possible second surgery to remove the plate.',
  s20: 'Nothing from the insurer yet.'
};
window.HU_STORY.partMeta = {
  1: { tick: 'First ED', ph: 'ED 1', sys: 'grp' }, 2: { tick: 'Trauma center', ph: 'ED 2', sys: 'grp' }, 3: { tick: 'The surgeon', ph: 'Clinic', sys: 'grp' },
  4: { tick: 'Surgery', ph: 'Surgery', sys: 'asc' }, 5: { tick: 'Week after', ph: 'Home', sys: 'pcp' }, 6: { tick: 'Ahead', ph: 'Next', sys: '' }
};
window.HU_STORY.sysNames = { grp: 'The health system’s EHR', asc: 'The surgery center’s own EHR', pcp: 'The PCP’s EHR' };

/* ---- The paper trail. One order, start to finish: the first X-ray. q = probably, or not yet. ---- */
window.HU_STORY.orderFlow = [
  { L: 'med', t: 'Ordered', d: 'The ED physician ordered an X-ray in the EHR, minutes after Dave arrived.' },
  { L: 'rec', t: 'Taken', d: 'A technologist took the image, and it was stored in the hospital’s imaging archive.' },
  { L: 'mon', t: 'Charged', d: 'The hospital’s charge for taking it, which usually posts to account 1 once the exam is complete.', q: true },
  { L: 'med', t: 'Read', d: 'A radiologist read it.' },
  { L: 'rec', t: 'Reported', d: 'The read was signed about twenty minutes later and filed in Dave’s chart: “Severe fracture dislocation of the elbow.”' },
  { L: 'mon', t: 'Charged again', d: 'The radiologist’s charge for reading it, usually once the report is final, billed separately from the hospital’s.', q: true },
  { L: 'med', t: 'Acted on', d: 'The ED physician reviewed it, and the plan changed to sedation, a reduction and a CT.' },
  { L: 'rec', t: 'Reviewed again', d: 'Four days later the surgeon reviewed it, along with the three studies that followed, before the clinic visit.' },
  { L: 'rec', t: 'Shown to Dave', d: 'The patient portal shows Dave the report. The image is Dave’s on request.' },
  { L: 'mon', t: 'Billed', d: 'The hospital’s charge becomes one line on account 1’s claim for the whole ED visit; the radiologist’s goes on a separate professional claim. The insurer processes each claim and sends Dave an explanation of benefits, and each biller’s statement comes after that. None has arrived yet.', q: 'not yet' }
];

/* Every record I can trace across the week. events: [scene, layer ('' = my own column), what
   happened, probable]. after: [what, 'now' | 'not yet']. L colors the bar. */
window.HU_STORY.records = [
  { id: 'images', L: 'med', title: 'The X-ray and the CTs',
    events: [['s2', 'med', 'Ordered, taken and read by the first radiologist'], ['s2', 'rec', 'Report filed in Dave’s chart'],
      ['s4', 'med', 'A CT, read by a second radiologist'], ['s5', 'rec', 'Already in the shared archive for the trauma center', 1], ['s6', 'rec', 'Same chart, and the images already there, when Dave arrived'],
      ['s7', 'med', 'A live X-ray during the reduction, then a CT a third radiologist read against “the previous study”'],
      ['s10', 'med', 'The surgeon reviews all four before the visit'],
      ['s13', 'med', 'Live X-rays during surgery, kept at the surgery center', 1],
      ['s14', 'rec', 'The patient portal shows the reports and none of the images']],
    after: [['The patient portal shows the reports; the images are Dave’s on request', 'now']] },
  { id: 'acct1', L: 'mon', title: 'Account 1, the community ED',
    events: [['s2', 'mon', 'Opened at registration'], ['s2', 'mon', 'Imaging charges post', 1], ['s3', 'mon', 'Financial responsibility, in the general consent?', 1],
      ['s4', 'mon', 'Procedure and CT charges post', 1], ['s5', 'rec', 'The encounter closes']],
    after: [['A claim to the insurer, plus separate physician and radiologist claims', 'not yet'], ['An explanation of benefits, then a statement', 'not yet']] },
  { id: 'acct2', L: 'mon', title: 'Account 2, the trauma center',
    events: [['s6', 'mon', 'Opened at registration'], ['s7', 'mon', 'Procedure and imaging charges post', 1], ['s7', 'mon', 'The orthopedist’s own bill?', 1],
      ['s8', 'rec', 'The encounter closes']],
    after: [['A claim to the insurer, plus separate physician and radiologist claims', 'not yet'], ['An explanation of benefits, then a statement', 'not yet']] },
  { id: 'rx', L: 'rec', title: 'The prescription',
    events: [['s8', 'rec', 'Prescriber’s state drug database check?', 1], ['s8', 'rec', 'Sent electronically at discharge'], ['s8', 'mon', 'Filled after thirty minutes; a claim and a copay'],
      ['s14', 'rec', 'A second prescriber, the surgeon, sending from one EHR or the other', 1], ['s14', 'ppr', 'New prescriptions from the surgeon, filled']],
    after: [] },
  { id: 'pcp', L: 'rec', title: 'The ED notifications to Dave’s PCP',
    events: [['s2', 'rec', 'A notice at the first ED’s registration', 1], ['s5', 'rec', 'Another at the transfer', 1], ['s6', 'rec', 'Another at the trauma center’s registration', 1], ['s8', 'rec', 'Another at its discharge', 1], ['s15', 'ppr', 'The PCP books a visit off one of them'], ['s15', '', 'A different EHR, so the week’s history comes from Dave']],
    after: [['Likely the notification Medicare’s hospital rules call for; its route (an exchange, a secure message or a fax) is not in the record', 'now']] },
  { id: 'surg', L: 'ppr', title: 'The surgery’s paperwork',
    events: [['s9', 'ppr', 'An appointment from Dave’s own calls'], ['s10', 'rec', 'History and physical'], ['s10', 'ppr', 'Surgical consent; surgery booked'],
      ['s11', 'rec', 'In the surgery center’s EHR, carried over or written there', 1], ['s12', 'ppr', 'The surgery center’s own consents, a second surgical one among them, and its assessment'], ['s13', 'rec', 'Operative report and implant record'],
      ['s14', 'rec', 'The operative report shows in the portal: sent over from the surgery center, or written by the surgeon straight into the health system’s chart. The portal does not say which.'],
      ['s16', 'med', 'The follow-up visit']],
    after: [['Therapy, and maybe a second surgery to take the plate out', 'not yet']] },
  { id: 'money', L: 'mon', title: 'What Dave paid',
    events: [['s1', 'mon', 'Network status checked'], ['s2', 'mon', 'Coverage check', 1], ['s3', 'mon', 'No copay at the first ED'], ['s6', 'mon', 'Coverage check, again', 1], ['s6', 'mon', 'None at the trauma center'],
      ['s8', 'mon', 'Pharmacy copay, on a credit card'], ['s10', 'mon', 'None at the clinic'], ['s15', 'mon', 'None at the PCP'],
      ['s11', 'mon', '$1,840.52 up front'], ['s11', 'mon', 'Was it owed?', 1], ['s14', 'mon', 'More copays'], ['s20', 'mon', 'Claims and explanations of benefits']],
    after: [['A refund, if the max was met or the estimate ran high', 'not yet']] },
  { id: 'partner', L: 'me', title: 'Dave’s care partner',
    events: [['s3', 'rec', 'The emergency contact on file, from registration'], ['s3', '', 'On his way over'], ['s6', '', 'Drives Dave to the trauma center'], ['s10', 'rec', 'The clinic note says he came along'],
      ['s12', 'ppr', 'Beside Dave for the signing'], ['s13', 'ppr', 'Dave leaves in his company, the responsible adult the rules require']],
    after: [] }
];

/* ---- The images: cropped and cleaned of identifiers and metadata. ar: the box each picture sits in
   when two share a row. ---- */
window.HU_STORY.figs = {
  s1: { cap: 'Dave’s elbow on the way to the first ED, about ten minutes after the injury.',
    imgs: [['/assets/images/rounds/routine-fracture/01-injury-arm.jpg', 1400, 750, 'A left forearm and elbow resting across a green T-shirt, the back of the elbow swollen and red.']] },
  s2: { ar: '5 / 7', cap: 'The first X-rays, side and front views, photographed from the screen in Dave’s room in the ED.',
    imgs: [['/assets/images/rounds/routine-fracture/02-xray-lateral.jpg', 1000, 1400, 'Side-view X-ray of the left elbow, the forearm bones out of line with the upper arm.'],
      ['/assets/images/rounds/routine-fracture/02-xray-ap.jpg', 894, 1400, 'Front-view X-ray of the left elbow, the top of the ulna broken.']] },
  s4: { ar: '1 / 1', cap: 'The CT after the first reduction, reconstructed in 3D: the radius still out of the joint and the ulna in pieces. A clinician at the trauma center showed them to Dave on a screen by about 1 AM.',
    imgs: [['/assets/images/rounds/routine-fracture/03-ct-back.jpg', 1140, 1316, '3D CT of the elbow from behind, the top of the ulna broken into pieces.'],
      ['/assets/images/rounds/routine-fracture/03-ct-side.jpg', 1400, 1089, '3D CT of the elbow from the side, the joint still out of place.']] },
  s7: { cap: 'The CT after the second reduction. The joint is back in alignment; the ulna is still broken, which is what the surgery addressed.',
    imgs: [['/assets/images/rounds/routine-fracture/04-ct-after-reduction.jpg', 1400, 1300, '3D CT after the second reduction, the joint back in line and a fracture still through the ulna.']] },
  s13: { ar: '5 / 4', cap: 'Intraoperative X-rays from the surgery, before and after the plate, photographed from the surgeon’s screen at the surgery center after surgery.',
    imgs: [['/assets/images/rounds/routine-fracture/05-surgery-before.jpg', 948, 770, 'X-ray from surgery before the repair, the top of the ulna broken.'],
      ['/assets/images/rounds/routine-fracture/05-surgery-side.jpg', 1400, 1090, 'X-ray from surgery after the repair, a plate and screws along the ulna.']] }
};

/* Lookups and the guard: every layer key is known, every scene has a story. */
(function (S) {
  var keys = {}; S.layers.forEach(function (l) { keys[l.key] = l; });
  S.layerByKey = keys;
  S.sceneList = [];
  S.parts.forEach(function (p) {
    p.scenes.forEach(function (s) {
      s.part = p.n;
      if (!s.story || !s.story.length) throw new Error(s.id + ': no story');
      Object.keys(s.L || {}).forEach(function (k) { if (!keys[k]) throw new Error(s.id + ': unknown layer ' + k); });
      s.line = S.lines[s.id];
      s.fig = S.figs[s.id] || null;
      if (!s.line) throw new Error(s.id + ': no line for the whole map');
      S.sceneList.push(s);
    });
  });
  S.sceneById = {}; S.sceneList.forEach(function (s) { S.sceneById[s.id] = s; });
  S.records.forEach(function (r) {
    r.events.forEach(function (e) {
      var sc = S.sceneById[e[0]];
      if (!sc) throw new Error(r.id + ': no scene ' + e[0]);
      if (e[1] && !(sc.L && sc.L[e[1]])) throw new Error(r.id + ': ' + e[0] + ' has no ' + e[1] + ' layer');
    });
  });
})(window.HU_STORY);
