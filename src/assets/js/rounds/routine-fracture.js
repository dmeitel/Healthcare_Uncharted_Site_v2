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
        story: ['A few of us from the neighborhood were playing flag football at the park when I fell onto my left elbow. The arm looked wrong, but no bone had come through the skin, so I assumed it was dislocated.',
          'A friend drove me ten minutes to the closest ED, which was also in my network. I checked out of habit. For an emergency, most health plans have to cover any ED at in-network cost sharing, without prior approval.'],
        L: { mon: ['Network status, checked out of habit', 'Emergency care covered at in-network rates'],
          ask: ['If this is an emergency, does it matter which ED I go to?', 'Who can come with me, and stay?'] } },

      { id: 's2', d: 'Thursday', t: 'about 7 PM', title: 'The X-ray', pa: [9, 2],
        count: [['Registration', '1', 5], ['EHR', '1', 3], ['Imaging study', '1', 4], ['Radiologist', '1', 3]],
        story: ['The community ED was quiet, with no one else in the waiting room. Registration took my basic information quickly, and I was in a room within minutes. The physician took a brief history and ordered an X-ray, since nothing else could proceed until someone saw the bone.',
          'It was also a fracture. The chart calls it a closed trans-olecranon fracture-dislocation: the top of the ulna broke through the joint, and the forearm came out of place with it.'],
        chart: '“Severe fracture dislocation of the elbow. Orthopedic consultation would be prudent.” The first radiologist’s read.',
        L: { med: ['Exam and history', 'X-ray', 'Read by a radiologist', 'Diagnosis'],
          ppr: { note: 'Registration started at the front desk.', items: ['Quick registration', 'Wristband', 'Into a room', 'Triage score?'] },
          rec: ['ED encounter 1 opens', 'X-ray order', 'Radiology report', 'Diagnosis code', 'Arrival time stamped'],
          mon: ['Coverage check', 'Patient account 1 opens', 'Imaging charges, facility and professional'],
          ask: ['What did the X-ray show, in plain words?', 'Has a specialist been called?'] } },

      { id: 's3', d: 'Thursday', t: 'about 7:30 PM', title: 'The rest of the forms', pa: [9, 3],
        story: ['An IV went in early, around the time of the X-ray, and I received IV pain medication through it. When a team expects to need access, the IV is placed before almost anything else. The registrar then returned with a tablet, and I finished registering in the bed with the IV already in my arm.',
          'My friend was still with me, and my care partner was on his way.'],
        L: { med: ['IV started', 'IV pain medication'],
          ppr: { note: 'Registration happens in pieces over the first hour, on purpose: an ED may not delay the screening exam to ask about insurance. The tablet form was most likely the general consent, one document that usually covers treatment, assignment of benefits, financial responsibility and release of records to the insurer.',
            items: ['Registration completed at my bed', 'General consent on a tablet?'] },
          rec: ['Signed consent stored', 'Insurance and contacts on file'],
          mon: ['Financial responsibility, in the general consent?'],
          ask: ['What am I signing, and can I get a copy?', 'Is my insurance on file correctly?'] } },

      { id: 's4', d: 'Thursday', t: 'about 8 to 9 PM', title: 'The first sedation', pa: [10, 4],
        count: [['Sedation', '1', 2], ['Reduction', '1', 2], ['Imaging study', '2', 4], ['Radiologist', '2', 3]],
        story: ['I was sedated with ketamine, with respiratory therapy and nursing at the bedside, while the team tried to set the arm, a procedure the chart calls a reduction.',
          'The arm was splinted and I was sent for a CT. It showed the radius still out of place. With the top of the ulna in pieces, the joint had little bone to hold a reduction, a known difficulty with this kind of fracture and the reason it needed a plate.'],
        chart: 'A second radiologist: the radius still dislocated, and the ulna “highly comminuted,” meaning broken into multiple pieces.',
        L: { med: ['Ketamine sedation', 'Reduction attempt', 'Splint', 'CT', 'Read by a second radiologist'],
          ppr: ['Consent for sedation', 'Respiratory and nursing at the bedside'],
          rec: ['Medication record', 'Sedation note', 'Procedure note', 'CT report'],
          mon: ['Procedure charges', 'CT charges', 'Separate ED physician and radiologist bills?'],
          ask: ['What are you giving me, and how will it feel?', 'If the joint does not stay in place, what happens next?'] } },

      { id: 's5', d: 'Thursday', t: 'about 10 PM', title: 'The transfer', pa: [10, 7],
        story: ['Around 10 PM, the physician told me I needed to be transferred to the trauma center. I asked about surgery and was told I would not get it that night. The plan was another reduction there, and a surgeon later.',
          'That is standard: the urgent step is getting the joint back in place, and the fracture itself is usually repaired on a scheduled day. I did not ask why I was being transferred, and the chart does not say. I assume it was orthopedic coverage, since the trauma center had an orthopedic surgeon on call that night.'],
        L: { med: ['Decision: transfer'],
          ppr: ['Physician-to-physician handoff?', 'Accepted by the trauma center before I left?', 'Private-vehicle transfer form?'],
          rec: ['Encounter 1 closes', 'Images already in the shared archive', 'Length of stay stamped'],
          mon: ['Account 1 waits for a claim'],
          ask: ['Will my images be there when I get there?', 'Can someone drive me, or does it need to be an ambulance?'] } }
    ] },

    { n: 2, short: 'Thursday night', title: 'The trauma center', scenes: [
      { id: 's6', d: 'Thursday', t: 'about 11 PM', title: 'Registered again', pa: [9, 8],
        count: [['Registration', '2', 5]],
        story: ['My care partner drove me there. We took his car instead of an ambulance; that was my choice, and it avoided an ambulance bill. At the trauma center I was registered and given a wristband again, and a second account was opened, at a hospital in the same health system as the first.',
          'Both hospitals chart in the same EHR, and my images were already there.'],
        L: { med: ['Arrival', 'Triage score?', 'Into a bed'],
          ppr: ['Registration', 'Second wristband'],
          rec: ['ED encounter 2 opens, same chart', 'The first ED’s images, same archive'],
          mon: ['Coverage check, again', 'Patient account 2 opens'],
          ask: ['Do you have what the first ED did?'] } },

      { id: 's7', d: 'Friday', t: 'just after midnight', title: 'The second sedation', pa: [3, 5], paNote: 'A 9 going in',
        count: [['Sedation', '2', 2], ['Reduction', '2', 2], ['Imaging study', '3 and 4', 4], ['Radiologist', '3', 3]],
        story: ['I was sedated again, this time with etomidate, and the on-call orthopedist set the arm under live X-ray. This time it stayed in place.',
          'My pain dropped from a 9 to about a 5 almost immediately, and it was around a 3 by the time a third radiologist signed the CT that confirmed the reduction.'],
        L: { med: ['Etomidate sedation', 'Reduction under live X-ray (fluoroscopy)', 'Orthopedic consult', 'CT', 'Read by a third radiologist'],
          ppr: ['Orthopedist called in', 'Consent for sedation, again'],
          rec: ['Sedation note', 'Medication record', 'Fluoroscopy and CT reports'],
          mon: ['Procedure charges', 'Imaging charges', 'The orthopedist’s own bill?'] } },

      { id: 's8', d: 'Friday', t: 'about 2 AM', title: 'Home, by way of the pharmacy', pa: [3, 5],
        story: ['I was discharged around 2 AM with a prescription and a plan: follow up with the orthopedist’s group on Tuesday or Wednesday, and they would schedule surgery after that.',
          'At a 24-hour pharmacy, we waited about thirty minutes for the prescription. I was about eight hours out from the injury.'],
        L: { med: ['Discharge', 'Pain medication prescribed'],
          ppr: ['Follow-up instructions', 'After-visit summary', 'ED notification to my PCP'],
          rec: ['Encounter 2 closes', 'e-Prescription to the pharmacy', 'State drug database check?'],
          mon: ['Pharmacy claim', 'Copay, on my credit card'],
          ask: ['Who sets up the follow-up, me or you?', 'What would bring me back before the follow-up?'] } }
    ] },

    { n: 3, short: 'Friday to Monday', title: 'Finding a surgeon', scenes: [
      { id: 's9', d: 'Friday', t: 'morning', title: 'Five phone calls', pa: [3, 7],
        story: ['By Friday morning my pain was under control, and my anxiety was back up to a 7. The discharge plan meant a clinic visit early the next week and a surgery date after that, with the ulna still in pieces.',
          'I called four or five orthopedic clinics myself, looking for whichever could see me first. Between calls, I arranged leave and FMLA with my manager.'],
        L: { ppr: ['Calls to four or five clinics', 'An appointment for Monday', 'Referral order from the ED?', 'Leave and FMLA with my manager'],
          ask: ['Do I need a referral, or can I call a clinic myself?', 'What does my employer need from me for leave?'] } },

      { id: 's10', d: 'Monday', t: 'morning', title: 'The surgeon', pa: [2, 3],
        count: [['Registration', '3', 5]],
        story: ['An orthopedic clinic in the same health system as both hospitals had a Monday opening. My care partner came with me. The surgeon had already reviewed all four imaging studies from both EDs before our visit and scheduled surgery for the next day.',
          'The plan was a plate and screws. The surgeon’s note says about a third of these plates are eventually removed.'],
        L: { med: ['Exam', 'All four studies reviewed', 'Surgery planned'],
          ppr: ['Registration', 'Surgical consent', 'Surgery booked for Tuesday'],
          rec: ['Encounter 3', 'History and physical (H&P)'],
          mon: ['Visit charge', 'Prior authorization?'],
          ask: ['Has my insurance approved the surgery?', 'What will I owe, and when?'] } }
    ] },

    { n: 4, short: 'Tuesday', title: 'Surgery day', scenes: [
      { id: 's11', d: 'Tuesday', t: 'about 12:30 PM', title: 'Check-in', pa: [2, 8],
        count: [['Registration', '4', 5], ['EHR', '2', 3]],
        story: ['At the surgery center I registered for the fourth time since Thursday and paid $1,840.52 up front. I believed I had already met my out-of-pocket maximum for the year, because some of my providers had stopped collecting copays. I had misread that signal.',
          'I then spent about an hour and a half in the waiting room.'],
        L: { ppr: ['Registration', 'About 90 minutes in the waiting room'],
          rec: ['Encounter 4, in a separate EHR', 'My H&P, carried over by an unknown route'],
          mon: ['Eligibility check against my insurer’s running totals?', '$1,840.52 at check-in', 'Was it owed?'],
          ask: ['How much of my out-of-pocket maximum is left? (A question for the insurer, before surgery day.)', 'If I pay up front and the claim comes in lower, how do I get the difference back?'] } },

      { id: 's12', d: 'Tuesday', t: 'about 2 PM', title: 'Pre-op', pa: [2, 9],
        story: ['I was taken back and changed into a gown, and the IV and the consents came next, with a nerve block after them. At an anxiety level of 9, I did not retain everything I signed.',
          'Having a second person in the room helped, and my care partner was beside me.'],
        L: { med: ['Pre-op nursing check', 'IV', 'Nerve block'],
          ppr: { note: 'The surgery center’s word for my care partner is the responsible adult.', items: ['Facility, surgical and anesthesia consents, usually separate documents', 'Pre-surgical assessment', 'Responsible adult on file?'] },
          rec: ['Pre-op nursing record', 'Anesthesia record'],
          ask: ['Can my support person stay with me while I sign?', 'When does the block wear off, and should I take pain medicine before it does?'] } },

      { id: 's13', d: 'Tuesday', t: 'afternoon into the evening', title: 'Surgery', pa: [6, 5], paNote: 'After. I was under for the surgery',
        story: ['The surgery took three to four and a half hours, start to finish, and used a plate and about fifteen screws. After about an hour and a half in recovery, my care partner drove me home.'],
        L: { med: ['Open reduction and internal fixation, the surgery', 'Live X-ray during surgery (fluoroscopy)', 'Recovery (PACU)', 'Discharge'],
          ppr: ['Discharge instructions?', 'Released to my care partner'],
          rec: ['Operative report', 'Implant record', 'Intraoperative images, kept at the surgery center?', 'Recovery notes'],
          mon: ['Facility charges', 'Surgeon and anesthesia bills, usually separate'],
          ask: ['Who do I call tonight if something feels wrong?'] } }
    ] },

    { n: 5, short: 'Wednesday to Friday', title: 'The week after', scenes: [
      { id: 's14', d: 'Wednesday to Thursday', t: '', title: 'Recovering at home', pa: [4, 3],
        story: ['I mostly slept. We returned to the pharmacy for more medication, and I paid the copays on my credit card as usual. My pain eased over the next few days, and so did the anxiety.',
          'I had signed up for the health system’s patient portal so I could see my images. It shows me every report and none of the images.'],
        L: { med: ['Pain medication at home'],
          ppr: ['More prescriptions filled'],
          rec: ['Patient portal: every report, no images', 'Fills on record'],
          mon: ['More pharmacy claims', 'More copays'],
          ask: ['How do I request copies of my images?'] } },

      { id: 's15', d: 'Friday', t: 'eight days out', title: 'My PCP', pa: [1, 1],
        count: [['Registration', '5', 5], ['EHR', '3', 3]],
        story: ['The trauma center had sent a notification to my PCP, who practices in a different group on a different system, and their office scheduled a visit. They confirmed I was under an orthopedist’s care and asked whether I needed anything else, including how my mood and sleep were holding up.',
          'The visit was the fifth registration of the week and another encounter, on a third EHR.'],
        L: { med: ['Mood and sleep check'],
          ppr: ['Registration', 'A visit booked off the ED notification'],
          rec: ['Encounter 5, in a different EHR', 'Outside records received?'],
          mon: ['Visit charge', 'Copay?'],
          ask: ['Does my PCP have my ED and surgery records, or should I bring them?'] } }
    ] },

    { n: 6, short: 'Ahead', title: 'What comes next', ahead: true, scenes: [
      { id: 's16', d: 'Thursday', t: 'two weeks out', title: 'The follow-up', pa: null, ahead: true,
        story: ['I see the surgeon again two weeks after the injury. The surgeon’s note says no X-rays are planned for that visit.'],
        L: { med: ['Surgeon follow-up', 'No X-rays planned'],
          ppr: ['Another registration'],
          rec: ['Encounter 6'],
          mon: ['Bundled into the surgery’s payment?'],
          ask: ['Is this visit part of the surgery’s payment, or billed on its own?'] } },

      { id: 's17', d: 'About two weeks', t: 'after surgery', title: 'Therapy', pa: null, ahead: true,
        story: ['If the surgical findings allow it, the splint comes off at about two weeks and I move to a sling and range-of-motion therapy.'],
        chart: '“Splint immobilization is anticipated for about 2 weeks, followed by sling use and initiation of range-of-motion therapy if appropriate.”',
        L: { med: ['Splint off', 'Sling', 'Range-of-motion therapy'],
          ppr: ['Therapy referral', 'Therapy appointments'],
          mon: ['Therapy authorization?', 'Therapy copays'],
          ask: ['Does my plan limit therapy visits, and do they need approval?'] } },

      { id: 's18', d: 'Six weeks', t: 'to three months', title: 'Getting the motion back', pa: null, ahead: true,
        story: ['Strengthening begins somewhere in that window. The note describes regaining motion as the harder phase, and I may not get back the last few degrees of straightening, what the note calls terminal extension.'],
        L: { med: ['Strengthening therapy'],
          ppr: ['Return-to-work paperwork'],
          rec: ['Therapy notes'],
          ask: ['When can I go back to full duty, and who fills out that form?'] } },

      { id: 's19', d: 'Six months', t: 'to a year', title: 'The plate', pa: null, ahead: true,
        story: ['About a third of these plates are removed because they cause irritation, usually around a year out. That would mean a second surgery, with its own prior authorization and its own registration.'],
        L: { med: ['Hardware removal'],
          ppr: ['Another registration'],
          mon: ['Another prior authorization', 'Another set of bills'] } },

      { id: 's20', d: 'Any day', t: 'now', title: 'The bills', pa: null, ahead: true,
        story: ['Nothing has arrived yet, from my insurer or from any of the places that registered me. I do not know yet what this week cost.'],
        L: { mon: ['Claims to my insurer', 'Explanations of benefits', 'Statements', 'A refund, if the max was already met'],
          ask: ['Does every bill match an explanation of benefits from my insurer?'] } }
    ] }
  ],

  /* Where the records stopped: every place that registered me (and the pharmacy), the system it
     charts in, and what I can tell reached it. mark: ok | unk | no | start */
  places: [
    { name: 'First ED', sub: 'The community hospital', sys: 'The health system’s EHR', group: true, mark: 'start', got: 'My chart for the week starts here.' },
    { name: 'Second ED', sub: 'The trauma center', sys: 'The health system’s EHR', group: true, mark: 'ok', got: 'Same chart and image archive. The first ED’s images were already there.' },
    { name: 'Pharmacy', sub: 'Open 24 hours', sys: 'The pharmacy’s own system', mark: 'ok', got: 'The prescription arrived electronically.' },
    { name: 'Orthopedic clinic', sub: 'Same health system', sys: 'The health system’s EHR', group: true, mark: 'ok', got: 'The surgeon had seen all four studies before our visit.' },
    { name: 'Surgery center', sub: 'Tuesday', sys: 'Its own EHR', mark: 'unk', got: 'My H&P reached it, since the surgery went ahead. Fax, upload or chart access: I can’t tell which.' },
    { name: 'My PCP', sub: 'A different group', sys: 'A different EHR', mark: 'unk', got: 'An ED notification arrived, likely the kind Medicare’s hospital rules call for. Its route, I don’t know.' },
    { name: 'Me', sub: 'In the patient portal', sys: 'The health system’s portal', mark: 'no', got: 'Every report. The images are mine on request; the portal does not show them.' }
  ],

  /* What happened more than once, counted from the record and the patient's account. */
  tally: [
    { what: 'Registrations', n: 5, L: 'ppr', why: 'At five places. The first ED split one registration into two passes by design: an ED may not delay the screening exam to ask about insurance.' },
    { what: 'Images of the same elbow, before surgery', n: 4, L: 'med', why: 'An X-ray and a CT at the first ED, a live X-ray and a CT at the second. Each answered a different question. Surgery added live X-rays of its own.' },
    { what: 'Radiologists who read them', n: 3, L: 'med', why: 'Across two hospitals, overnight.' },
    { what: 'Sedations', n: 2, L: 'med', why: 'Ketamine, then etomidate. Then anesthesia and a nerve block for the surgery.' },
    { what: 'Reductions', n: 2, L: 'med', why: 'The first did not get the radius back in place.' },
    { what: 'EHRs', n: 3, L: 'rec', why: 'The health system’s, the surgery center’s and my PCP’s.' }
  ]
};

/* ---- For the whole map: one line per step, and where each part was mostly charted. ---- */
window.HU_STORY.lines = {
  s1: 'I fell at flag football, and a friend drove me to the closest in-network ED.',
  s2: 'The X-ray showed a fracture along with the dislocation.',
  s3: 'An IV went in, and registration finished at my bed.',
  s4: 'Ketamine sedation and a reduction; the CT showed the radius still out of place.',
  s5: 'Transferred to the trauma center, with no surgery that night.',
  s6: 'My care partner drove me over, and I was registered again.',
  s7: 'Etomidate sedation and a second reduction, which held.',
  s8: 'Home around 2 AM, after thirty minutes at the pharmacy window.',
  s9: 'I called four or five clinics to find the fastest surgeon.',
  s10: 'The surgeon had already seen all four studies and booked me for Tuesday.',
  s11: 'I registered and paid $1,840.52 up front.',
  s12: 'A gown, an IV, a nerve block and a stack of consents.',
  s13: 'Three to four and a half hours of surgery, then home.',
  s14: 'Sleep and refills. The patient portal has the reports and none of the images.',
  s15: 'My PCP checked my mood and sleep and told me I was fine.',
  s16: 'The follow-up with the surgeon.',
  s17: 'The splint comes off, then a sling and range-of-motion therapy.',
  s18: 'Strengthening, with full extension uncertain.',
  s19: 'A possible second surgery to remove the plate.',
  s20: 'The bills.'
};
window.HU_STORY.partMeta = {
  1: { tick: 'First ED', ph: 'ED 1', sys: 'grp' }, 2: { tick: 'Trauma center', ph: 'ED 2', sys: 'grp' }, 3: { tick: 'The surgeon', ph: 'Clinic', sys: 'grp' },
  4: { tick: 'Surgery', ph: 'Surgery', sys: 'asc' }, 5: { tick: 'Week after', ph: 'Home', sys: 'pcp' }, 6: { tick: 'Ahead', ph: 'Next', sys: '' }
};
window.HU_STORY.sysNames = { grp: 'The health system’s EHR', asc: 'The surgery center’s own EHR', pcp: 'My PCP’s EHR' };

/* ---- The paper trail. One order, start to finish: the first X-ray. q = probably, or not yet. ---- */
window.HU_STORY.orderFlow = [
  { L: 'med', t: 'Ordered', d: 'The ED physician ordered an X-ray in the EHR, minutes after I arrived.' },
  { L: 'rec', t: 'Taken', d: 'A technologist took the image, and it was stored in the hospital’s imaging archive.' },
  { L: 'mon', t: 'Charged', d: 'Two charges, probably: the hospital’s for taking it, on account 1, and the radiologist’s for reading it, billed separately.', q: true },
  { L: 'med', t: 'Read', d: 'A radiologist read it.' },
  { L: 'rec', t: 'Reported', d: 'The read was signed about twenty minutes later and filed in my chart: “Severe fracture dislocation of the elbow.”' },
  { L: 'med', t: 'Acted on', d: 'The ED physician reviewed it, and the plan changed to sedation, a reduction and a CT.' },
  { L: 'rec', t: 'Reviewed again', d: 'Four days later the surgeon reviewed it, along with the three studies that followed, before our visit.' },
  { L: 'rec', t: 'Shown to me', d: 'The patient portal shows me the report. The image is mine on request.' },
  { L: 'mon', t: 'Billed', d: 'Both charges go to my insurer as claims and come back as explanations of benefits and statements. None has arrived yet.', q: true }
];

/* Every record I can trace across the week. events: [scene, layer ('' = my own column), what
   happened, probable]. after: [what, 'now' | 'not yet']. L colors the bar. */
window.HU_STORY.records = [
  { id: 'images', L: 'med', title: 'The X-ray and the CTs',
    events: [['s2', 'med', 'Ordered, taken and read by the first radiologist'], ['s2', 'rec', 'Report filed in my chart'],
      ['s4', 'med', 'A CT, read by a second radiologist'], ['s5', 'rec', 'Already in the shared archive for the trauma center'], ['s6', 'rec', 'Same chart and archive when I arrived'],
      ['s7', 'med', 'A live X-ray during the reduction, then a CT a third radiologist read against “the previous study”'],
      ['s10', 'med', 'The surgeon reviews all four before our visit'],
      ['s13', 'med', 'Live X-rays during surgery, kept at the surgery center'],
      ['s14', 'rec', 'The patient portal shows the reports and none of the images']],
    after: [['The patient portal shows the reports; the images are mine on request', 'now']] },
  { id: 'acct1', L: 'mon', title: 'Account 1, the community ED',
    events: [['s2', 'mon', 'Opened at registration; imaging charges post'], ['s3', 'mon', 'Financial responsibility, in the general consent?', 1],
      ['s4', 'mon', 'Procedure and CT charges post'], ['s5', 'rec', 'The encounter closes']],
    after: [['A claim to my insurer, plus separate physician and radiologist claims', 'not yet'], ['An explanation of benefits, then a statement', 'not yet']] },
  { id: 'acct2', L: 'mon', title: 'Account 2, the trauma center',
    events: [['s6', 'mon', 'Opened at registration'], ['s7', 'mon', 'Procedure and imaging charges post'], ['s7', 'mon', 'The orthopedist’s own bill?', 1],
      ['s8', 'rec', 'The encounter closes']],
    after: [['A claim to my insurer, plus separate physician and radiologist claims', 'not yet'], ['An explanation of benefits, then a statement', 'not yet']] },
  { id: 'rx', L: 'rec', title: 'The prescription',
    events: [['s8', 'rec', 'Sent electronically at discharge'], ['s8', 'rec', 'State drug database check?', 1], ['s8', 'mon', 'Filled after thirty minutes; a claim and a copay'],
      ['s10', 'rec', 'The surgeon’s note says I ran out'], ['s14', 'ppr', 'More prescriptions filled']],
    after: [] },
  { id: 'pcp', L: 'ppr', title: 'The ED notification to my PCP',
    events: [['s8', 'ppr', 'Sent from the trauma center'], ['s15', 'ppr', 'My PCP books a visit off it'], ['s15', 'rec', 'A different EHR: did my records come over?', 1]],
    after: [['Likely the notification Medicare’s hospital rules call for; its route (an exchange, a secure message or a fax), I don’t know', 'now']] },
  { id: 'surg', L: 'ppr', title: 'The surgery’s paperwork',
    events: [['s9', 'ppr', 'An appointment from my own calls'], ['s10', 'rec', 'History and physical'], ['s10', 'ppr', 'Surgical consent; surgery booked'],
      ['s11', 'rec', 'Reached a separate EHR by an unknown route'], ['s12', 'ppr', 'The surgery center’s own consents and assessment'], ['s13', 'rec', 'Operative report and implant record'],
      ['s16', 'med', 'The follow-up visit']],
    after: [['Therapy, and maybe a second surgery to take the plate out', 'not yet']] },
  { id: 'money', L: 'mon', title: 'What I paid',
    events: [['s1', 'mon', 'Network checked out of habit'], ['s2', 'mon', 'Coverage check'], ['s6', 'mon', 'Coverage check, again'], ['s8', 'mon', 'Pharmacy copay, on my card'],
      ['s11', 'mon', '$1,840.52 up front'], ['s11', 'mon', 'Was it owed?', 1], ['s14', 'mon', 'More copays'], ['s20', 'mon', 'Claims and explanations of benefits']],
    after: [['A refund, if the max was already met', 'not yet']] },
  { id: 'partner', L: 'me', title: 'My care partner',
    events: [['s3', '', 'On his way over'], ['s6', '', 'Drives me to the trauma center'], ['s10', 'rec', 'The clinic note says he came with me'],
      ['s12', 'ppr', 'Beside me for the signing'], ['s13', 'ppr', 'I leave in his company, the responsible adult the rules require']],
    after: [] }
];

/* ---- The images: cropped and cleaned of identifiers and metadata. ar: the box each picture sits in
   when two share a row. ---- */
window.HU_STORY.figs = {
  s1: { cap: 'My elbow on the way to the first ED, about ten minutes after the injury.',
    imgs: [['/assets/images/rounds/routine-fracture/01-injury-arm.jpg', 1400, 750, 'A left forearm and elbow resting across a green T-shirt, the back of the elbow swollen and red.']] },
  s2: { ar: '5 / 7', cap: 'The first X-rays, side and front views, photographed from the screen in the ED.',
    imgs: [['/assets/images/rounds/routine-fracture/02-xray-lateral.jpg', 1000, 1400, 'Side-view X-ray of the left elbow, the forearm bones out of line with the upper arm.'],
      ['/assets/images/rounds/routine-fracture/02-xray-ap.jpg', 894, 1400, 'Front-view X-ray of the left elbow, the top of the ulna broken.']] },
  s4: { ar: '1 / 1', cap: 'The CT after the first reduction, reconstructed in 3D: the radius still out of the joint and the ulna in pieces. These were on a screen at the trauma center by about 1 AM.',
    imgs: [['/assets/images/rounds/routine-fracture/03-ct-back.jpg', 1140, 1316, '3D CT of the elbow from behind, the top of the ulna broken into pieces.'],
      ['/assets/images/rounds/routine-fracture/03-ct-side.jpg', 1400, 1089, '3D CT of the elbow from the side, the joint still out of place.']] },
  s7: { cap: 'The CT after the second reduction. The joint is back in alignment; the ulna is still broken, which is what the surgery addressed.',
    imgs: [['/assets/images/rounds/routine-fracture/04-ct-after-reduction.jpg', 1400, 1300, '3D CT after the second reduction, the joint back in line and a fracture still through the ulna.']] },
  s13: { ar: '5 / 4', cap: 'Intraoperative X-rays from the surgery, before and after the plate.',
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
