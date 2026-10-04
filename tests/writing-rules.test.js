'use strict';
/* The writing checker's rules (scripts/lib/writing-rules.js), built 2026-10-03 on David's ask for "a QA tool that would look
   at writing, PHI standards... professional standing... and our vernacular tone". Each of his rulings from the broken arm
   edits has a case here, and so does his own pre-AI writing: the voice profile's calibration passages must come back with
   nothing to fix, or the rules are measuring the wrong thing. */
const test = require('node:test');
const assert = require('node:assert');
const W = require('../scripts/lib/writing-rules');
const { readImageMeta } = require('../scripts/lib/image-meta');

/** @param {string} text @param {string} [register] */
const run = (text, register) => W.checkText(text, { register: register || 'rounds' });
/** @param {any} r @param {string} rule */
const has = (r, rule) => r.flags.filter((/** @type {any} */ f) => f.rule === rule);

test("David's 2026-10-03 rulings each have a rule that fires", () => {
  const clipped = run('Thursday\n\nThe network picks the door. A friend drives me. The ED is ten minutes away.');
  assert.equal(has(clipped, 'voice.clipped').length, 1, 'clipped, note-like sentences');
  const mood = run('By day eight I was angry about the bill and the whole thing kind of sucked.');
  assert.equal(has(mood, 'pro.emotion')[0].fix, 'frustrated');
  assert.equal(has(mood, 'pro.casual').length, 1);
  assert.equal(has(run('The billing turned into a nightmare for the family.'), 'pro.appeal').length, 1, 'analytical, not an appeal');
  assert.equal(has(run('I checked the result in MyChart that night.'), 'pro.vendor')[0].fix, 'the patient portal');
  assert.equal(has(run('# Tracing My Olecranon Fracture\n\nI broke it on a Thursday.'), 'pro.jargon')[0].fix, 'elbow');
  assert.equal(has(run('My brother drove me home after the block wore off.'), 'phi.person').length, 1);
  assert.equal(has(run('What I call the waiting tax shows up everywhere.'), 'pro.coined').length, 1);
  assert.equal(has(run("Why I wrote this\n\nI wrote this because I wanted to see the system from the bed."), 'phi.person').length, 0);
});

test('the voice profile calibration passages (pre-AI, his) have nothing to fix', () => {
  const passages = [
    "I was called to the PICU one night by an RT who had never set up or used Heli-ox Therapy. The patient had been on the therapy for almost 5 minutes before they realized it wasn't working. I rushed into the room and fixed the problem quickly because I had seen this happen before. Sadly, the other RT was written up for incompetence but in looking deeper at the situation the RT never got the training and it was in fact a latent error waiting to happen.",
    "The finance game is a short-term win. Even when you win you don't because you sacrifice quality and integrity. On the other hand, if you train and coach the core principles of care and quality and satisfaction then you may find that your people do more than what they could otherwise. What I have found more often than not is that the ship works just fine and the crew is strong and efficient, but the game becomes about money and things go downhill from there.",
    "Healthcare workers are heroic people that want to act heroically and selflessly the majority of the time, but they are locked in a system that doesn't want heroes. It used to. Now it wants labor and revenue.",
    'This is a great question. I would start with getting a handle on the KPIs. Until that data is clean and flowing consistency there is not much else worth doing.',
  ];
  for (const p of passages) {
    const r = run(p);
    assert.deepEqual(r.flags.filter((/** @type {any} */ f) => f.level !== 'check').map((/** @type {any} */ f) => f.rule + ': ' + f.text), [], p.slice(0, 40));
  }
});

test('patient identifiers are must-fix, and made-up numbers are not', () => {
  const r = run('Patient: Jane Doe, DOB 03/14/1961, MRN 4471923. Call 801-099-2718 or jane.doe@mail.invalid. Admitted on Sept. 28, 2026. Portal: https://mychart.example-health.org/visit?token=abcdefghijklmnopqrstuvwxyz123456 from 10.1.22.40. SSN 524-88-1934.');
  const blocks = r.flags.filter((/** @type {any} */ f) => f.level === 'block').map((/** @type {any} */ f) => f.rule).sort();
  assert.deepEqual(blocks, ['phi.dated', 'phi.dated', 'phi.email', 'phi.ip', 'phi.link', 'phi.namefield', 'phi.phone', 'phi.record', 'phi.ssn']);
  const fake = run("The demo chart reads MRN 00012345 and the help line is 801-555-0134; Patient: How You Move is the module's title.");
  assert.equal(fake.counts.block, 0, 'fiction and labels are not leaks');
  const ages = run('She was 93 years old when she was admitted.');
  assert.equal(has(ages, 'phi.age').length, 1);
  assert.equal(has(run('Dr. Brad Smith saw me at 9.'), 'phi.clinician')[0].level, 'warn', 'no clinician names in a Rounds story');
  assert.equal(has(run('David Eitel, RRT, wrote this.'), 'phi.clinician').length, 0, 'the author is public on purpose');
});

test('work writing softens contact details to a check, and a guest piece keeps only patient information', () => {
  const sig = run('Thanks,\n\nDavid\n801-019-4410 | someone@hospital.invalid', 'professional');
  assert.ok(sig.flags.every((/** @type {any} */ f) => f.level === 'check'), 'a signature line is not a leak');
  const guest = W.check(W.parseText('Furthermore, the robust plan was crucial. Call 801-099-2718.'), { register: 'rounds', guest: true });
  assert.deepEqual(guest.flags.map((/** @type {any} */ f) => f.rule), ['phi.phone']);
});

test('the voice kernel: em dashes, banned words, aphorisms, headings', () => {
  assert.equal(has(run('The ED was full — again.'), 'voice.emdash')[0].level, 'block');
  const tells = run("Furthermore, this robust framework is crucial. Here's the thing: it was seamless.");
  for (const rule of ['voice.pivot', 'voice.banned', 'voice.notdave']) assert.ok(has(tells, rule).length, rule);
  const ap = run('We spent two years and four analysts on the build, and the budget never covered it. Doubt is our product. So is certainty.\n\n## Three eras, one move\n\nThe vendor pitched it twice and the board bought it twice. Price it accordingly.');
  assert.equal(has(ap, 'voice.aphorism').length, 2, 'an antithesis flip and an imperative closer');
  assert.equal(has(ap, 'voice.sells').length, 1);
  assert.equal(has(run('# The Wound and the Workload\n\nIt started on a night shift.'), 'voice.pair').length, 1);
  assert.equal(has(run('## Hospice and home health\n\nBoth were rolled up.'), 'voice.pair').length, 0, 'a plain label with an "and" is fine');
  const neg = run('It is not just a tool, it is a habit. The fix is a process, not a product.');
  assert.deepEqual(has(neg, 'voice.negation').map((/** @type {any} */ f) => f.level), ['check', 'warn'], 'one per piece; the second is over budget');
});

test('tools copy may give short commands without tripping the aphorism rules', () => {
  const r = run('Pick a state on the map to see its numbers. Then compare it with another one. Keep going.', 'tools');
  assert.equal(r.counts.warn, 0);
});

test('every flag in a pasted draft points at its exact characters, CRLF and quotes included', () => {
  const text = '# A Title Here\r\n\r\nFirst line of a paragraph that runs on\r\n  and continues — here with MRN 4471923.\r\n\r\n> A quote that is long\r\n> and has a dash — inside.\r\n\r\n- A list item, furthermore robust.\r\n';
  const r = W.checkText(text, { register: 'rounds' });
  assert.ok(r.flags.length >= 4);
  for (const f of r.flags) {
    const b = r.blocks[f.b];
    assert.equal(text.slice(b.base + f.s, b.base + f.e).replace(/\r?\n/g, ' '), f.text.replace(/\r?\n/g, ' '), f.rule);
  }
});

test('a page is read past its paragraphs: divs, long buttons, nested list items (2026-10-04)', () => {
  // The broken arm piece's "About this case" box was a div, so the reviewer panel was told the
  // page never says Dave Doe is a stand-in. Every case here was missed by the old reader.
  const page = '<html><head><title>A Test Page</title></head><body><main><article class="rounds-post">' +
    '<div class="pv-bar">Draft for review, not yet published</div>' +
    '<div class="eyebrow">Rounds draft · Patient Experience</div>' +
    '<h1>A Broken Arm</h1>' +
    '<p>Dave fell on a Thursday night and went to the closest ED. The X-ray showed a fracture along with the dislocation.</p>' +
    '<div class="disclosure"><b>About this case:</b> Dave Doe is a stand-in name for the author. The plan was robust and seamless.</div>' +
    '<div class="callout">The surgeon saw all four studies before the visit, which took a fax and two phone calls.</div>' +
    '<div class="verdict"><span class="k">The point</span>The EHR answers one patient at a time. Analysts ask about all of them.</div>' +
    '<ol><li><button type="button" class="pt-go"><span class="wh">Thursday night, the X-ray</span><span class="ev">Ordered, taken and read by the first radiologist</span></button></li></ol>' +
    '<button type="button">Show</button><div aria-hidden="true">Above the waterline</div>' +
    '<ul><li>Registrations at five places<ul><li>Two at the first ED</li></ul></li></ul>' +
    '<div class="ref-item">Brookings Institution. A timeline. https://www.brookings.edu/Steward-Timeline-FINAL-10-02-05.pdf</div>' +
    '</article></main></body></html>';
  const x = W.htmlToBlocks(page);
  const kind = (/** @type {RegExp} */ re) => (x.blocks.find((/** @type {any} */ b) => re.test(b.text)) || { kind: 'missing' }).kind;
  assert.equal(kind(/stand-in name/), 'src', 'a disclosure is read, and left alone like a source');
  assert.equal(kind(/^Rounds draft/), 'note', 'an eyebrow is a note');
  assert.equal(kind(/^The surgeon saw/), 'p', 'a lone div of prose is a paragraph');
  assert.equal(kind(/read by the first radiologist/), 'li', 'a long button inside a list item is read with it');
  assert.equal(kind(/^Registrations at five places$/), 'li', 'a list item holding a nested list keeps its own text');
  assert.equal(kind(/^Brookings/), 'src');
  for (const gone of [/Draft for review/, /^Show$/, /Above the waterline/]) assert.equal(kind(gone), 'missing', String(gone));
  assert.ok(x.blocks.find((/** @type {any} */ b) => /^The point · The EHR/.test(b.text)), 'a run-in label stays apart from its sentence');
  const order = x.blocks.map((/** @type {any} */ b) => b.text.slice(0, 12));
  assert.ok(order.indexOf('Dave fell on') < order.indexOf('About this c') && order.indexOf('About this c') < order.indexOf('The surgeon '), 'blocks keep page order');
  const r = W.check(x.blocks, { register: 'rounds' });
  const rules = r.flags.map((/** @type {any} */ f) => f.rule);
  assert.ok(!rules.includes('voice.banned'), 'no voice rules inside a disclosure');
  assert.ok(!rules.includes('phi.record'), 'FINAL in a file name is not a FIN record number');
  assert.equal(has(run('Her MRN4471923 was on the wristband.'), 'phi.record').length, 1, 'a keyword glued to its number still is');
  const dash = W.check(W.htmlToBlocks('<main><div class="ref-item">A report — 2024.</div><div class="tag">A label — here</div></main>').blocks, { register: 'rounds' });
  assert.equal(dash.flags.filter((/** @type {any} */ f) => f.rule === 'voice.emdash').length, 2, 'em dashes are caught in sources and notes too');
});

test('the image reader finds a GPS position and a capture date, and passes a clean file', () => {
  // A minimal JPEG: SOI, an EXIF segment (IFD0 with Make and a GPS pointer, a GPS directory
  // holding a latitude), EOI.
  const t = Buffer.alloc(80);
  t.write('II', 0, 'latin1'); t.writeUInt16LE(42, 2); t.writeUInt32LE(8, 4);
  t.writeUInt16LE(2, 8);
  t.writeUInt16LE(0x010f, 10); t.writeUInt16LE(2, 12); t.writeUInt32LE(8, 14); t.writeUInt32LE(38, 18);   // Make -> 38
  t.writeUInt16LE(0x8825, 22); t.writeUInt16LE(4, 24); t.writeUInt32LE(1, 26); t.writeUInt32LE(50, 30);   // GPS -> 50
  t.writeUInt32LE(0, 34);
  t.write('TestCam\0', 38, 'latin1');
  t.writeUInt16LE(1, 50); t.writeUInt16LE(2, 52); t.writeUInt16LE(5, 54); t.writeUInt32LE(3, 56); t.writeUInt32LE(0, 60);
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), t]);
  const len = Buffer.alloc(2); len.writeUInt16BE(payload.length + 2);
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1]), len, payload, Buffer.from([0xff, 0xd9])]);
  const m = readImageMeta(jpeg);
  assert.equal(m.type, 'jpeg');
  assert.ok(m.exif && m.gps);
  assert.equal(m.fields.Make, 'TestCam');
  const clean = readImageMeta(Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  assert.ok(!clean.exif && !clean.gps);
});
