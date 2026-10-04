/**
 * writing-rules.js · the writing checker's rules, in ONE file so a rule means the same thing
 * everywhere it runs: the review screen (scripts/writing.html, served by scripts/writing.js), the
 * command line (scripts/writing-check.js) and the gates (tests/writing-*.test.js).
 *
 * Built 2026-10-03 on David's ask: "a QA tool that would look at writing, PHI standards, and make
 * sure that we are always staying within a good format or good professional standing with our
 * writing but also staying within our vernacular tone."
 *
 * THREE LAYERS
 *   phi    Patient information. The HIPAA Safe Harbor identifiers a text can carry, plus the two
 *          things David pulled out of the broken arm piece by hand: who the people are, and
 *          personal health detail the piece did not need.
 *   pro    Professional standing. David's rulings from the broken arm edits: it should read like
 *          something you could present, analytical rather than emotional, in plain words.
 *   voice  The HU voice. The kernel in CLAUDE.md, the hu-voice skill and docs/voice-profile.md.
 *
 * THREE LEVELS
 *   block  Must fix. A patient identifier, or an em dash. The gate fails on a phi block.
 *   warn   Fix. It breaks a written rule. Fix it, or know exactly why it stays.
 *   check  Read again. A pattern that is often a problem and sometimes the right call. A rule
 *          that cannot tell the difference stays at this level on purpose: a checker that cries
 *          wolf gets ignored, which is how a gate dies.
 *
 * REGISTERS follow the kernel's register table. Rounds is the full voice; Learn is a textbook and
 * gets no personality rules; Tools and games are instructional, so short imperative lines are the
 * point there; Professional and Advocacy are David's writing off the site, pasted in. A guest piece
 * (the Chrysalis Ashton byline) is left alone by David's ruling of 2026-08-28: patient information
 * and em dashes only.
 *
 * Runs in a browser (window.HUWriting) and in Node (module.exports). No dependencies.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else /** @type {any} */ (root).HUWriting = factory();
}(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* ── Words the screen shows ─────────────────────────────────────────────────────────────── */

  const REGISTERS = [
    { id: 'rounds', name: 'Rounds', blurb: 'First person, argumentative, entered through a scene. The full voice.' },
    { id: 'learn', name: 'Learn', blurb: 'Textbook. The writing disappears; headings label. No personality rules.' },
    { id: 'tools', name: 'Tools and games', blurb: 'Instructional, second person. Short commands are the point.' },
    { id: 'site', name: 'Other site pages', blurb: 'Home, About, hubs. The hard rules, without the Rounds checklist.' },
    { id: 'professional', name: 'Work writing', blurb: 'Intermountain, UVU, LinkedIn, email. Same voice, institutional register.' },
    { id: 'advocacy', name: 'Advocacy', blurb: 'USRC and legislators. Precise, urgent but credible; not alarm, not begging.' },
  ];
  const LEVELS = {
    block: { name: 'Must fix', blurb: 'A patient identifier or an em dash. Nothing ships with one.' },
    warn: { name: 'Fix', blurb: 'Breaks a written rule. Fix it, or know why it stays.' },
    check: { name: 'Read again', blurb: 'Often a problem, sometimes right. Read it aloud and decide.' },
  };
  const LAYERS = {
    phi: { name: 'Patient information' },
    pro: { name: 'Professional tone' },
    voice: { name: 'HU voice' },
  };

  /* Where each rule comes from. David's words are quoted as he said them, trimmed. Nothing here
     may carry his own health details: this file is in a public repo. */
  const SOURCES = {
    hipaa: { label: 'HIPAA Safe Harbor', ref: '45 CFR 164.514(b)(2), the 18 identifiers' },
    r1: { label: 'DECISIONS R1, 2026-10-02', words: 'No clinician names. Places described by what they are.' },
    kernel: { label: 'Voice kernel, CLAUDE.md', ref: 'v1.2, 2026-08-26' },
    nolist: { label: 'Voice kernel, the NO LIST', ref: 'CLAUDE.md' },
    skill: { label: 'hu-voice skill', ref: '.claude/skills/hu-voice/SKILL.md' },
    profile: { label: 'Voice profile', ref: 'docs/voice-profile.md' },
    guest: { label: 'Guest pieces, David 2026-08-28', words: 'Leave alone entirely: titles AND prose.' },
    rcic: { label: 'Voice kernel, advocacy block', words: 'Urgent but credible. Not alarm, not begging.' },
    dAI: { label: 'David, 2026-10-03', words: 'it feels a little too AI written. "The network picks the door," "a friend drives me"... it needs clearer sentence structure.' },
    dTerm: { label: 'David, 2026-10-03', words: "I don't like that terminology at all." },
    dArm: { label: 'David, 2026-10-03', words: 'use arm instead of elbow in the title' },
    dAngry: { label: 'David, 2026-10-03', words: "I don't want to use terms like angry. I want terms like frustrated or disappointed." },
    dCalm: { label: 'David, 2026-10-03', words: 'It should not be some sort of emotional piece that tries to pull on you. It should be more analytical.' },
    dPro: { label: 'David, 2026-10-03', words: 'written in more of a professional tone, something that can be a presentation' },
    dVendor: { label: 'David, 2026-10-03', words: "it's OK if we want to use some sort of agnostic terminology" },
    dPeople: { label: 'David, 2026-10-03', words: "We don't need to refer to him as my brother." },
    dDetail: { label: 'David, 2026-10-03', words: 'remove anything about [that detail] or that personal experience' },
    dWhy: { label: 'David, 2026-10-03', words: 'this article needs some explanation as to why I wrote it' },
    dStat: { label: 'David, 2026-10-03', words: 'my story is not unique... include a reference or a link to the number' },
    dLay: { label: 'David, 2026-10-03', words: 'explain the process of healthcare to a layman' },
  };

  /* ── The rule table ─────────────────────────────────────────────────────────────────────── */

  const R = ['rounds', 'learn', 'tools', 'site', 'professional', 'advocacy'];
  /** @typedef {{id:string, layer:string, name:string, why:string, src:string, lv:Object<string,string|0>}} Rule */
  /** @type {Object<string, Rule>} */
  const RULES = {};
  /**
   * lv: { _: default level, <register>: level or 0 for off }.
   * @param {string} id @param {string} layer @param {string} name @param {string} why
   * @param {string} src @param {Object<string,string|0>} lv
   */
  function def(id, layer, name, why, src, lv) { RULES[id] = { id, layer, name, why, src, lv }; }
  /** @param {string} id @param {string} reg @returns {string|null} */
  function levelOf(id, reg) {
    const lv = RULES[id].lv;
    const v = Object.prototype.hasOwnProperty.call(lv, reg) ? lv[reg] : lv._;
    return v ? String(v) : null;
  }

  // Patient information
  def('phi.ssn', 'phi', 'Social Security number', 'A Social Security number is an identifier on its own.', 'hipaa', { _: 'block' });
  def('phi.phone', 'phi', 'Phone or fax number', "A patient's or a private person's phone number is an identifier. Yours, or an organization's on purpose, is fine.", 'hipaa', { _: 'block', professional: 'check', advocacy: 'check' });
  def('phi.email', 'phi', 'Email address', "A patient's or a private person's email is an identifier. Yours, or an organization's on purpose, is fine.", 'hipaa', { _: 'block', professional: 'check', advocacy: 'check' });
  def('phi.record', 'phi', 'Record, account or ID number', 'Medical record, account, member, claim, license, device and serial numbers are identifiers.', 'hipaa', { _: 'block' });
  def('phi.dated', 'phi', 'Date of birth, admission or discharge', 'Any date tied to a person (born, admitted, discharged, seen, died) is an identifier. The year alone is safe.', 'hipaa', { _: 'block' });
  def('phi.date', 'phi', 'A full date in a patient story', 'A month and day tied to someone\'s care narrows who they are. The year, or "a Thursday", is safe.', 'hipaa', { _: 0, rounds: 'check', professional: 'check' });
  def('phi.age', 'phi', 'Age over 89', 'Ages over 89 are an identifier for a real person. Say "over 89".', 'hipaa', { _: 'warn', tools: 0 });
  def('phi.address', 'phi', 'Street address', 'A street address is an identifier. Say what the place is and how far it is, not where.', 'hipaa', { _: 'check', rounds: 'warn', professional: 'warn', tools: 0 });
  def('phi.zip', 'phi', 'ZIP code', 'A five-digit ZIP tied to a person narrows who they are.', 'hipaa', { _: 0, rounds: 'check', professional: 'check' });
  def('phi.link', 'phi', 'Personal or portal link', 'A portal, login or token link can open someone\'s record. Never paste one.', 'hipaa', { _: 'block' });
  def('phi.ip', 'phi', 'IP address', 'An IP address is an identifier.', 'hipaa', { _: 'block' });
  def('phi.namefield', 'phi', 'A name in a chart field', 'Reads like a name copied from a record ("Patient: Jane Doe").', 'hipaa', { _: 'block' });
  def('phi.chart', 'phi', 'Text copied from a chart', 'Chart headers (signed by, H&P by, ordering provider, chief complaint) mean text came straight out of a record. Retell it instead.', 'hipaa', { _: 0, rounds: 'warn', professional: 'warn', advocacy: 'warn' });
  def('phi.clinician', 'phi', 'A named clinician', 'No clinician names in a patient story. Say the role: "the surgeon", "the night nurse".', 'r1', { _: 'check', rounds: 'warn', tools: 0 });
  def('phi.patient', 'phi', 'A named patient', 'Mr., Mrs. or Ms. with a name reads like a real patient.', 'hipaa', { _: 'check', rounds: 'warn', professional: 'warn', tools: 0 });
  def('phi.person', 'phi', 'Someone named by relationship', 'Say the role, not the relationship or the name: "my care partner", "the person who drove me".', 'dPeople', { _: 0, rounds: 'check', professional: 'check' });
  def('phi.facility', 'phi', 'A named facility in a patient story', 'A named hospital or clinic narrows who the patient is. Describe it: "a small community ED ten minutes away".', 'r1', { _: 0, rounds: 'check', professional: 'check' });
  def('phi.detail', 'phi', 'Personal health detail', 'Keep a personal health detail only if the piece needs it to make its point.', 'dDetail', { _: 'check', tools: 0 });

  // Professional tone
  def('pro.emotion', 'pro', 'A loaded emotion word', 'Name the feeling the way you would in a meeting: frustrated, disappointed, worried.', 'dAngry', { _: 'warn', tools: 0 });
  def('pro.profanity', 'pro', 'Profanity', 'Not in anything that could be presented.', 'dPro', { _: 'warn' });
  def('pro.casual', 'pro', 'Too casual for the register', 'Fine out loud, not in a piece that could be presented.', 'dPro', { _: 'check', professional: 'warn', advocacy: 'warn', tools: 0 });
  def('pro.appeal', 'pro', 'Emotional appeal', 'Say what happened and what it cost. Let the reader feel it; do not push them to.', 'dCalm', { _: 'warn', tools: 0 });
  def('pro.hype', 'pro', 'Overstatement', 'Overstated words read as casual or as selling. Say the size of the thing.', 'dPro', { _: 'check', tools: 0 });
  def('pro.coined', 'pro', 'A coined label', 'A made-up name for an idea reads as AI. Say what the thing is in plain words.', 'dTerm', { _: 'warn', tools: 0 });
  def('pro.coinedmaybe', 'pro', 'Possible coined label', 'Is this a real term people use, or a label made up for the piece?', 'dTerm', { _: 'check', tools: 0 });
  def('pro.emotionlearn', 'pro', 'A loaded emotion word', 'Reporting how people feel is fine in a textbook. Make sure it is reporting, not the writer\'s mood.', 'dAngry', { _: 0, learn: 'check' });
  def('pro.vendor', 'pro', 'A product name', 'Use the plain, vendor-neutral name a reader anywhere will know.', 'dVendor', { _: 0, rounds: 'warn', site: 'check' });
  def('pro.vendorehr', 'pro', 'An EHR vendor named', 'Fine in an informatics piece. In a patient\'s story, say "the EHR".', 'dVendor', { _: 0, rounds: 'check' });
  def('pro.jargon', 'pro', 'Clinical jargon in a title or heading', 'Titles and headings use the word a layperson would: "arm", not "olecranon".', 'dArm', { _: 0, rounds: 'warn', site: 'check', professional: 'check' });
  def('pro.jargonbody', 'pro', 'Clinical term with no explanation', 'Explain it on first use ("a procedure the chart calls a reduction") or use the lay word.', 'dLay', { _: 0, rounds: 'check' });
  def('pro.filler', 'pro', 'Filler or a dictation slip', 'Um, uh, "you know", a doubled word. Common in dictation, gone before anyone reads it.', 'dPro', { _: 'check' });
  def('pro.long', 'pro', 'A run-on sentence', 'Long chained sentences are the voice; one past fifty words usually lost a period. A reader new to healthcare needs somewhere to breathe.', 'dLay', { _: 'check', tools: 0 });
  def('pro.alarm', 'pro', 'Alarm or pleading', 'Advocacy is urgent but credible. Alarm words and pleading cost credibility.', 'rcic', { _: 0, advocacy: 'check' });

  // HU voice
  def('voice.emdash', 'voice', 'Em dash', 'No em dashes anywhere, titles and descriptions included. A comma, a period, or restructure.', 'nolist', { _: 'block' });
  def('voice.dash', 'voice', 'A dash standing in for an em dash', 'A spaced hyphen or en dash doing an em dash\'s job. Same fix: a period, a comma, or restructure.', 'kernel', { _: 'warn' });
  def('voice.banned', 'voice', 'Banned word', 'On the kernel\'s NO LIST or the hu-voice banned vocabulary.', 'nolist', { _: 'warn' });
  def('voice.notdave', 'voice', "Not David's phrase", 'David does not say this. He says: ergo, man, for the most part, the whole point is, sadly, of course.', 'kernel', { _: 'warn' });
  def('voice.pivot', 'voice', 'Formal pivot', 'Casual transitions ("So," "Well," "Now,"), never formal pivots.', 'kernel', { _: 'warn' });
  def('voice.aiphrase', 'voice', 'Sounds generated', 'A stock phrase. Pick the word with more texture, or name the actual thing.', 'kernel', { _: 'check' });
  def('voice.hedge', 'voice', 'An announced hedge', 'Announcing a hedge cancels it. Admit the edge of what you know mid-sentence and keep moving.', 'profile', { _: 'warn', learn: 0, tools: 0 });
  def('voice.negation', 'voice', 'Negation-contrast', 'One "not X, it\'s Y" per piece, maximum. It is the most-cited AI tell.', 'skill', { _: 'warn', tools: 'check' });
  // A check, not a fix: a paragraph that ends on a real list of three things has the same shape
  // as a sing-song wrap-up, and only a reader can tell them apart (19 of 19 on the site were lists).
  def('voice.triad', 'voice', 'Three-part ending', 'A paragraph that ends on "X, Y, and Z." Fine for a real list; a wrap-up in three beats is the NO LIST\'s sing-song ending.', 'nolist', { _: 'check' });
  def('voice.anaphora', 'voice', 'Three sentences, same opening', 'Three sentences in a row that start the same way are scaffolding. Vary or consolidate.', 'skill', { _: 'warn', tools: 0 });
  def('voice.aphorism', 'voice', 'Aphorism', 'An antithesis flip ("So is certainty.") or an imperative closer ("Fear both."). All banned.', 'kernel', { _: 'warn', tools: 0 });
  def('voice.verdict', 'voice', 'Possible noun-phrase verdict', 'Reads like a slogan ("The problem statement was the crime scene."). Read it aloud.', 'kernel', { _: 'check', tools: 0 });
  def('voice.closer', 'voice', 'Short section closer', 'One flat closing line per piece, maximum. When every section lands a punch, none land.', 'kernel', { _: 'check', learn: 0, tools: 0 });
  def('voice.closers', 'voice', 'Too many punchy closers', 'More than one section ends on a short flat line. Keep the best one.', 'kernel', { _: 'warn', learn: 0, tools: 0 });
  def('voice.pair', 'voice', 'X-and-the-Y heading', 'No X-and-the-Y constructions in any heading, comma variants included.', 'nolist', { _: 'warn' });
  def('voice.sells', 'voice', 'A heading that sells', 'Headings label, they don\'t sell. "Provider Payment ≠ Patient Cost", not "Three eras, one move".', 'kernel', { _: 'warn' });
  def('voice.parallel', 'voice', 'Parallel-block template', 'Blocks in a row shaped "Label: sentence" are a generation artifact. Vary or consolidate.', 'kernel', { _: 'warn', learn: 'check', tools: 'check' });
  def('voice.commas', 'voice', 'Comma pileup', 'Four commas stacked to dodge an em dash. Periods or semicolons.', 'kernel', { _: 'check', tools: 0 });
  def('voice.clipped', 'voice', 'Clipped, note-like sentences', 'Three or more very short sentences in a row read like notes, and like AI. Write them out as full sentences.', 'dAI', { _: 'warn', learn: 'check', site: 'check', tools: 0 });
  def('voice.flat', 'voice', 'Flat rhythm', 'Four sentences in a row of nearly the same length. Accumulate, then drop.', 'skill', { _: 0, rounds: 'check', professional: 'check', advocacy: 'check' });
  def('voice.emphasis', 'voice', 'Bold or italic for emphasis', 'ALL CAPS when something really matters. Not bold, not italic. Or restructure.', 'nolist', { _: 0, rounds: 'warn', professional: 'warn', advocacy: 'warn' });
  def('voice.colon', 'voice', 'Colon-drop setup', '"The result:" or "Here\'s why:" is a reveal set up for effect. Just say it.', 'kernel', { _: 'warn', tools: 0 });
  def('voice.rhetorical', 'voice', 'Rhetorical question', 'A question the next sentence answers is a setup. Keep only real questions the piece does not answer.', 'kernel', { _: 'warn', learn: 'check', tools: 0 });
  def('voice.repeat', 'voice', 'A phrase used too often', 'Once is a voice. Over and over is a tic.', 'kernel', { _: 'check', tools: 0 });

  /* ── Small helpers ──────────────────────────────────────────────────────────────────────── */

  const MON = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?';
  const DATE_FULL = '(?:' + MON + '\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\d{4}-\\d{2}-\\d{2})';
  const DATE_ANY = '(?:' + DATE_FULL + '|' + MON + '\\s+\\d{1,2}(?:st|nd|rd|th)?\\b)';

  /** @param {string} s */
  function words(s) { return s.trim().split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w)); }
  /** @param {string} s */
  function nWords(s) { return words(s).length; }
  /** @param {string} s */
  function norm(s) { return s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"'); }
  /** A date string we can trust is a date: month 1-12, day 1-31. @param {string} s */
  function realDate(s) {
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\//);
    if (m) return +m[1] >= 1 && +m[1] <= 12 && +m[2] >= 1 && +m[2] <= 31;
    const iso = s.match(/^\d{4}-(\d{2})-(\d{2})$/);
    if (iso) return +iso[1] >= 1 && +iso[1] <= 12 && +iso[2] >= 1 && +iso[2] <= 31;
    return true;
  }
  /** Numbers made up on purpose: all one digit, a run like 123456, a 555 phone exchange.
   *  Alarm Fatigue's demo chart reads MRN 00012345, and fiction is not a leak. @param {string} s */
  function looksFake(s) {
    const d = s.replace(/\D/g, '');
    if (!d) return true;
    if (/^(\d)\1+$/.test(d)) return true;
    if (/0123456|1234567|123456789|987654321|12345$/.test(d)) return true;
    if (d.length >= 10 && d.slice(-7, -4) === '555') return true;
    return false;
  }

  // Abbreviations a period does not end a sentence after.
  const ABBR = /(?:\b(?:Dr|Mr|Mrs|Ms|Mx|St|vs|etc|No|Nos|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|approx|Inc|Co|Corp|Jr|Sr|Fig|Rep|Sen|Gov|Gen|Lt|Col|Prof|Mt|Ft|ca|al|Vol|Ch|Sec|Dept|Univ)|\b[A-Z]|e\.g|i\.e|U\.S|a\.m|p\.m|Ph\.D|M\.D|D\.O)\.$/;

  /**
   * Sentences with their offsets inside the text. A period ends a sentence when whitespace follows,
   * the word before it is not an abbreviation, and the next word does not start lowercase.
   * @param {string} text @returns {{text:string,s:number,e:number}[]}
   */
  function splitSentences(text) {
    const out = [];
    let start = 0;
    const re = /[.!?]+["”’')\]]*(?=\s|$)/g;
    let m;
    const push = (/** @type {number} */ a, /** @type {number} */ b) => {
      while (a < b && /\s/.test(text[a])) a++;
      let z = b;
      while (z > a && /\s/.test(text[z - 1])) z--;
      if (z > a) out.push({ text: text.slice(a, z), s: a, e: z });
    };
    while ((m = re.exec(text))) {
      const end = m.index + m[0].length;
      if (m[0] === '.' && ABBR.test(text.slice(Math.max(start, m.index - 7), m.index + 1))) continue;
      const next = text.slice(end).match(/^\s+(\S)/);
      if (next && /[a-z]/.test(next[1])) continue;
      push(start, end);
      start = end;
    }
    if (start < text.length) push(start, text.length);
    return out;
  }

  /** @param {string} w */
  function syllables(w) {
    w = w.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
  }

  /* ── Getting text in: a pasted draft, a built page's HTML, a live page's DOM ───────────── */

  /** @typedef {{kind:string, level?:number, text:string, base?:number, marks?:{s:number,e:number}[], label?:boolean, cls?:string, leaf?:boolean}} Block */

  /**
   * A pasted draft, read loosely as Markdown: "#" lines are headings, "-", "*", "•" and "1." lines
   * are list items, ">" lines are quotes, blank lines end a paragraph. A first line with no end
   * punctuation is the title. EVERY BLOCK KEEPS ITS OFFSET into the pasted text (base), so a flag
   * can be painted back onto the exact characters in the editor. Line breaks inside a paragraph
   * become spaces, which keeps the length the same.
   * @param {string} src @returns {Block[]}
   */
  function parseText(src) {
    const blocks = [];
    const lines = [];
    let pos = 0;
    for (const raw of src.split('\n')) { lines.push({ raw, at: pos }); pos += raw.length + 1; }
    let para = null;
    const flush = () => { if (para) { blocks.push(para); para = null; } };
    let first = true;
    for (let i = 0; i < lines.length; i++) {
      const { raw, at } = lines[i];
      const line = raw.replace(/\r$/, ' ');          // a space, not nothing: offsets must not move
      if (!line.trim()) { flush(); continue; }
      const lead = line.length - line.trimStart().length;
      const t = line.trimStart();
      const tt = t.trimEnd();
      let m;
      if ((m = t.match(/^(#{1,6})\s+/))) {
        flush();
        const h = m[1].length;
        blocks.push({ kind: h === 1 ? 'title' : 'h', level: h, text: t.slice(m[0].length).replace(/\s+#*\s*$/, ''), base: at + lead + m[0].length });
      } else if ((m = t.match(/^(?:[-*•]|\d{1,2}[.)])\s+/))) {
        flush();
        blocks.push({ kind: 'li', text: t.slice(m[0].length), base: at + lead + m[0].length });
      } else if ((m = t.match(/^>\s?/))) {
        // the marker on a continuation line becomes spaces, so offsets still line up
        if (para && para.kind === 'quote') para.text += ' ' + ' '.repeat(lead + m[0].length) + t.slice(m[0].length);
        else { flush(); para = { kind: 'quote', text: t.slice(m[0].length), base: at + lead + m[0].length }; }
      } else if (para && para.kind === 'p') {
        // keep offsets exact: the gap between the paragraph's end and this line is one newline
        para.text += ' ' + ' '.repeat(lead) + t;
      } else {
        flush();
        const solo = (!lines[i + 1] || !lines[i + 1].raw.trim());
        if (first && solo && nWords(tt) <= 16 && !/[.!?:,;]$/.test(tt)) blocks.push({ kind: 'title', level: 1, text: t, base: at + lead });
        else if (!first && solo && nWords(tt) <= 10 && !/[.!?:,;"”)]$/.test(tt) && /^[A-Z0-9"“]/.test(tt)) blocks.push({ kind: 'h', level: 2, text: t, base: at + lead });
        else para = { kind: 'p', text: t, base: at + lead };
      }
      first = false;
    }
    flush();
    return blocks;
  }

  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', hellip: '…', middot: '·', ne: '≠', rarr: '→', larr: '←', times: '×', copy: '©', reg: '®', deg: '°' };
  /** @param {string} s */
  function decode(s) {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e) => {
      if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return Object.prototype.hasOwnProperty.call(ENT, e.toLowerCase()) ? ENT[e.toLowerCase()] : all;
    });
  }

  /* ── Leaf text: the prose no tag above takes ─────────────────────────────────────────────
     Added 2026-10-04. Both readers began as a list of tags (headings, p, li and their kin), so
     prose in a bare div or a button was never read: a disclosure box, a reference list, the cells
     of a grid, a card body, a record entry drawn as a button. The reviewer panel was then told
     the broken arm piece never says "Dave Doe" is a stand-in, when its "About this case" box does.
     The leaf walk reads the rest: each element's own text, the part no tag already took. One walk
     serves both readers through a small view of the tree, so the gate and the screen agree on
     what counts as text. */

  const TAG_SKIP = /^(?:SCRIPT|STYLE|SVG|NOSCRIPT|TEMPLATE|NAV|HEADER|FOOTER|SELECT|OPTION|TEXTAREA|INPUT)$/;
  // the explain-on-demand card, and the "Draft for review" banner on a draft page
  const CLS_SKIP = /(?:^|\s)(?:hu-peek|pv-bar)(?:\s|$)/;
  // Inline tags belong to the text around them; any other element starts a block of its own.
  const TAG_INLINE = /^(?:A|ABBR|B|BDI|BDO|BR|CITE|CODE|DATA|DEL|DFN|EM|I|IMG|INS|KBD|LABEL|MARK|Q|S|SAMP|SMALL|SPAN|STRONG|SUB|SUP|TIME|U|VAR|WBR)$/;
  // Sources, disclosures and abbreviation keys. The kernel's register table says leave them alone,
  // so like a table they are read for patient information and em dashes only.
  const CLS_QUIET = /(?:^|\s)(?:disclosure|abbrev-box|refs|refs-content|ref-item|rr-ref|cite|footnotes?|source-note|source-link|jp-sources?|stat-source|stat-src|stats-source|rate-context-source|afe-src|vs-src|da-src|win-source|rr-source|tool-attribution|src-list|src-row)(?:\s|$)/;
  // A button's label is not prose ("Show", "All", "01 The story"). Six words or more and it is
  // carrying writing: the broken arm piece's paper trail entries are buttons.
  const BUTTON_WORDS = 6;
  const EMPH = { STRONG: 1, B: 1, EM: 1, I: 1 };

  /**
   * What the leaf walk asks of a tree, so one walk reads a live DOM and the gate's parsed HTML.
   * gap: entering or leaving this element breaks a word. line: the page's real layout sets it on
   * lines of its own (a live page knows; parsed HTML cannot tell, and says no). taken: the tag
   * reader already read it.
   * @typedef {{el:(n:any)=>boolean, tag:(n:any)=>string, cls:(n:any)=>string, attr:(n:any,k:string)=>(string|null), kids:(n:any)=>any[], up:(n:any)=>any, text:(n:any)=>string, gap:(n:any)=>boolean, line:(n:any)=>boolean, taken:(n:any)=>boolean}} TreeView
   */

  /** @param {any} n @param {TreeView} V */
  function skipped(n, V) { return TAG_SKIP.test(V.tag(n)) || V.attr(n, 'aria-hidden') === 'true' || CLS_SKIP.test(V.cls(n)); }
  /** Inline, unless it is a link card: an <a> whose parent holds no text of its own.
   *  @param {any} n @param {TreeView} V */
  function inline(n, V) {
    const t = V.tag(n);
    if (!TAG_INLINE.test(t)) return false;
    if (t !== 'A') return true;
    const p = V.up(n);
    return !!p && V.kids(p).some(c => !V.el(c) && /\S/.test(V.text(c)));
  }
  /** @param {any} n @param {TreeView} V */
  function longButton(n, V) { return nWords(gather(n, V, false).text) >= BUTTON_WORDS; }

  /**
   * An element's text, with its bold and italic runs as marks. Whole (own false): everything
   * inside, the way a paragraph has always been read. Own: only the text the element holds
   * itself, stopping at child blocks and at anything the tag reader already took.
   * @param {any} root @param {TreeView} V @param {boolean} own
   * @returns {{text:string, marks:{s:number,e:number}[], first:any}}
   */
  function gather(root, V, own) {
    let out = '';
    let first = null;
    // On a live page a title and the line under it ("Thursday · Back again", then "The CT is
    // read") sit on two lines; run together, "again The" looks like a lost period. Where the
    // layout breaks the line and no punctuation does, a middot stands in.
    let newLine = false;
    /** @type {{s:number,e:number}[]} */
    const marks = [];
    const gap = () => { if (out && !out.endsWith(' ')) out += ' '; };
    /** @param {any} n @param {boolean} top */
    const walk = (n, top) => {
      if (!V.el(n)) {
        if (own && V.taken(n)) return;
        let s = V.text(n).replace(/\s+/g, ' ');
        if (newLine && /\S/.test(s)) {
          if (out.trim() && !/[.!?:;,\u00b7\u2013\u2014-]\s*$/.test(out) && /^\s*["“]?[A-Z0-9]/.test(s)) {
            const L = out.trimEnd().length;
            marks.forEach(k => { if (k.e > L) k.e = L; });
            out = out.slice(0, L) + ' \u00b7 ';
            s = s.trimStart();
          }
          newLine = false;
        }
        if (first === null && /\S/.test(s)) first = n;
        if (out.endsWith(' ') && s.startsWith(' ')) s = s.slice(1);
        out += s;
        return;
      }
      const t = V.tag(n);
      if (!top) {
        if (skipped(n, V)) return;
        if (t === 'BR') { gap(); return; }
        if (t === 'BUTTON' && (own || !longButton(n, V))) { gap(); return; }
        if (own && (!inline(n, V) || V.taken(n))) { gap(); return; }
      }
      const brk = !top && V.gap(n);
      const ownLine = brk && V.line(n);
      if (brk) { gap(); if (ownLine) newLine = true; }
      const s0 = out.length;
      // Repeated items side by side (a grid cell's chips, a row of tags) are separate things,
      // however the page spaces them: "X-ray · Read by a radiologist", not "X-rayRead by".
      let prev = null;
      for (const c of V.kids(n)) {
        if (prev && V.el(c) && V.el(prev) && V.tag(c) === V.tag(prev) && firstClass(c, V) && firstClass(c, V) === firstClass(prev, V)) { gap(); newLine = true; }
        walk(c, false);
        if (V.el(c) || /\S/.test(V.text(c))) prev = c;
      }
      // bold set on a line of its own is a title, not emphasis in a sentence
      if (EMPH[t] && out.length > s0 && !ownLine) marks.push({ s: s0, e: out.length });
      if (brk) { gap(); if (ownLine) newLine = true; }
    };
    walk(root, true);
    const lead = out.length - out.trimStart().length;
    const text = out.trim();
    return { text, first, marks: marks.map(k => ({ s: Math.max(0, k.s - lead), e: Math.min(text.length, k.e - lead) })).filter(k => k.e > k.s) };
  }

  /** @param {any} n @param {TreeView} V */
  function firstClass(n, V) { return V.cls(n).trim().split(/\s+/)[0] || ''; }
  /** @param {any} n @param {TreeView} V @param {RegExp} re @returns {boolean} */
  function holds(n, V, re) { return V.kids(n).some(c => V.el(c) && (re.test(V.tag(c)) || holds(c, V, re))); }
  /** Repeated siblings with a class (references, cards, grid cells) are list items, not paragraphs.
   *  @param {any} n @param {TreeView} V */
  function listy(n, V) {
    for (let x = n, i = 0; i < 3; x = V.up(x), i++) {
      const p = V.up(x);
      if (!p) return false;
      const c = firstClass(x, V);
      if (c && V.kids(p).filter(k => V.el(k) && V.tag(k) === V.tag(x) && firstClass(k, V) === c).length >= 2 && (i === 0 || !holds(x, V, /^(?:H[1-6]|P)$/))) return true;
    }
    return false;
  }

  /**
   * A leaf's kind. Inside a source list, a quote, a table or a caption, it reads as that, and
   * preformatted text (a pocket card) is a note. A list item the tag reader passed over (it holds
   * a nested list) is still a list item. Otherwise text with no sentence in it (an eyebrow, a
   * label, a grid cell, a byline) is a note, and prose is a paragraph, or a list item when it
   * repeats.
   * @param {any} n @param {TreeView} V @param {{text:string, marks:{s:number,e:number}[]}} g @returns {Block}
   */
  function leafBlock(n, V, g) {
    const tag = V.tag(n), cls = V.cls(n);
    /** @type {Block} */
    const b = { kind: '', text: g.text, cls, marks: g.marks, leaf: true };
    // A run-in label styled onto its own line ("Lesson", "The point", "In healthcare") would read
    // straight into the sentence after it, and "point The" looks like a lost period. A middot
    // keeps the two apart, the way the reader sees them.
    const lead = V.kids(n).find(c => (V.el(c) ? !skipped(c, V) : /\S/.test(V.text(c))));
    if (lead && V.el(lead) && inline(lead, V) && V.tag(lead) !== 'BR') {
      const label = gather(lead, V, false).text;
      const n1 = nWords(label);
      if (n1 >= 1 && n1 <= 4 && !/[.!?:;,\u00b7\u2013\u2014-]$/.test(label) && b.text.startsWith(label + ' ') && /^["“]?[A-Z0-9]/.test(b.text.slice(label.length + 1))) {
        const at = label.length;
        b.text = label + ' \u00b7 ' + b.text.slice(at + 1);
        b.marks = (b.marks || []).map(k => ({ s: k.s > at ? k.s + 2 : k.s, e: k.e > at ? k.e + 2 : k.e }));
      }
    }
    for (let p = n; p && !b.kind; p = V.up(p)) {
      const t = V.tag(p);
      if (CLS_QUIET.test(V.cls(p))) b.kind = 'src';
      else if (t === 'BLOCKQUOTE') b.kind = 'quote';
      else if (t === 'TD' || t === 'TH') b.kind = 'cell';
      else if (t === 'FIGCAPTION') b.kind = 'cap';
      else if (t === 'PRE') b.kind = 'note';
    }
    if (b.kind) { /* decided by where it sits */ }
    else if (/\brounds-sub\b|\bhero-sub\b/.test(cls)) b.kind = 'sub';
    else if (/^H[1-6]$/.test(tag)) { b.kind = 'h'; b.level = +tag[1]; }
    else if (tag === 'SUMMARY') { b.kind = 'h'; b.level = 4; }
    else if (tag === 'LI' || tag === 'DT' || tag === 'DD') b.kind = 'li';
    else {
      const sentence = nWords(b.text) >= 6 && /[.!?]["”’')\]]*(?:\s|$)/.test(b.text);
      b.kind = !sentence ? 'note' : listy(n, V) ? 'li' : 'p';
    }
    if (b.marks.length && b.marks[0].s === 0 && /^[^:]{1,60}:/.test(b.text) && b.marks[0].e <= b.text.indexOf(':') + 1) b.label = true;
    return b;
  }

  /**
   * Every block the tag reader did not take, in document order: each element's own text.
   * @param {any} root @param {TreeView} V @returns {{first:any, block:Block}[]}
   */
  function leaves(root, V) {
    /** @type {{first:any, block:Block}[]} */
    const out = [];
    /** @param {any} n @param {boolean} top */
    const visit = (n, top) => {
      if (!top) {
        if (skipped(n, V) || V.taken(n)) return;
        if (V.tag(n) === 'BUTTON' && !longButton(n, V)) return;
      }
      if (top || !inline(n, V)) {
        const g = gather(n, V, true);
        if (g.text.length >= 2 && /[A-Za-z0-9]/.test(g.text)) out.push({ first: g.first, block: leafBlock(n, V, g) });
      }
      for (const c of V.kids(n)) if (V.el(c)) visit(c, false);
    };
    visit(root, true);
    return out;
  }

  /**
   * HTML as a light tree for the leaf walk: elements {t, a, k, p, at}, text {x, p, at}. Lenient
   * the way a browser is about what this site writes (void tags, raw text, the implied ends of p,
   * li, dt, dd, td, th, tr and option). Offsets index the string, so the gate can merge this
   * walk's blocks with the tag reader's by position.
   * @param {string} html @returns {any}
   */
  function parseHtml(html) {
    const root = { t: '#ROOT', a: {}, k: [], p: null, at: 0 };
    /** @type {any[]} */
    const stack = [root];
    const top = () => stack[stack.length - 1];
    const VOID = /^(?:AREA|BASE|BR|COL|EMBED|HR|IMG|INPUT|LINK|META|PARAM|SOURCE|TRACK|WBR)$/;
    const RAW = /^(?:SCRIPT|STYLE|TEXTAREA|TITLE|NOSCRIPT|IFRAME|XMP)$/;
    const SCOPE = /^(?:#ROOT|BUTTON|TD|TH|TABLE|CAPTION|TEMPLATE|SVG)$/;
    const ENDS_P = /^(?:ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DETAILS|DIV|DL|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|MAIN|MENU|NAV|OL|P|PRE|SECTION|TABLE|UL)$/;
    /** Pop through the nearest open element that matches, unless a scope edge comes first. @param {RegExp} re @param {RegExp} edge */
    const close = (re, edge) => {
      for (let i = stack.length - 1; i > 0; i--) {
        if (re.test(stack[i].t)) { stack.length = i; return; }
        if (edge.test(stack[i].t)) return;
      }
    };
    /** @param {string} s @param {number} at */
    const text = (s, at) => { if (s) top().k.push({ x: decode(s), p: top(), at }); };
    /** @param {string} s */
    const attrs = (s) => {
      /** @type {Object<string,string>} */
      const a = {};
      for (const m of s.matchAll(/([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g)) a[m[1].toLowerCase()] = m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : '';
      return a;
    };
    const tagRe = /<(\/?)([A-Za-z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/y;
    let i = 0;
    while (i < html.length) {
      const lt = html.indexOf('<', i);
      if (lt < 0) { text(html.slice(i), i); break; }
      if (lt > i) text(html.slice(i, lt), i);
      if (html.startsWith('<!--', lt)) { const e = html.indexOf('-->', lt + 4); i = e < 0 ? html.length : e + 3; continue; }
      if (html[lt + 1] === '!' || html[lt + 1] === '?') { const e = html.indexOf('>', lt); i = e < 0 ? html.length : e + 1; continue; }
      tagRe.lastIndex = lt;
      const m = tagRe.exec(html);
      if (!m) { text('<', lt); i = lt + 1; continue; }
      i = tagRe.lastIndex;
      const t = m[2].toUpperCase();
      if (m[1]) { close(new RegExp('^' + t + '$'), /^#ROOT$/); continue; }
      if (ENDS_P.test(t)) close(/^P$/, SCOPE);
      if (t === 'LI') close(/^LI$/, /^(?:UL|OL|MENU|#ROOT|BUTTON|TD|TH|TABLE)$/);
      else if (t === 'DT' || t === 'DD') close(/^(?:DT|DD)$/, /^(?:DL|#ROOT|BUTTON|TD|TH|TABLE)$/);
      else if (t === 'TD' || t === 'TH') close(/^(?:TD|TH)$/, /^(?:TR|TABLE|#ROOT)$/);
      else if (t === 'TR') close(/^TR$/, /^(?:TABLE|TBODY|THEAD|TFOOT|#ROOT)$/);
      else if (t === 'OPTION') close(/^OPTION$/, /^(?:SELECT|DATALIST|#ROOT)$/);
      const el = { t, a: attrs(m[3]), k: [], p: top(), at: lt };
      top().k.push(el);
      if (VOID.test(t) || /\/\s*$/.test(m[3])) continue;
      if (RAW.test(t)) {
        const end = new RegExp('<\\/' + t + '\\s*>', 'gi');
        end.lastIndex = i;
        const e = end.exec(html);
        i = e ? e.index + e[0].length : html.length;
        continue;
      }
      stack.push(el);
    }
    return root;
  }

  /**
   * A built page's HTML as blocks, with no DOM. Used by the gates in Node, where speed matters
   * and the static text is what ships. Text a page's script draws after load is NOT here; the
   * screen reads the live DOM for that, and the gate reads src/assets/js/rounds/ separately.
   * @param {string} html @returns {{blocks:Block[], guest:boolean, links:string[]}}
   */
  function htmlToBlocks(html) {
    const blocks = [];
    const title = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (title) blocks.push({ kind: 'meta', text: decode(title[1]).replace(/\s+/g, ' ').trim(), label: true });
    const desc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    if (desc) blocks.push({ kind: 'meta', text: decode(desc[1]).trim() });
    const main = html.match(/<main\b[\s\S]*<\/main>/i);
    const src = main ? main[0] : html;
    // Blanked, not removed, so every offset still points into src and the leaf walk can merge in.
    const fill = (/** @type {string} */ s) => ' '.repeat(s.length);
    let body = src.replace(/<(script|style|svg|noscript|template|nav|header|footer|select|textarea)\b[\s\S]*?<\/\1>/gi, fill);
    body = body.replace(/(<button\b[^>]*>)([\s\S]*?)<\/button>/gi, (all, open, inner) => nWords(decode(inner.replace(/<[^>]+>/g, ' '))) >= BUTTON_WORDS ? fill(open) + inner + fill('</button>') : fill(all));
    const links = [];
    for (const a of body.matchAll(/<a\b[^>]*href=["'](https?:[^"']+)["']/gi)) links.push(a[1]);
    /** @type {{at:number, block:Block}[]} */
    const found = [];
    /** @type {[number, number][]} */
    const taken = [];
    const re = /<(h[1-6]|p|li|blockquote|figcaption|td|th|dt|dd|summary)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let m, sawH1 = false;
    while ((m = re.exec(body))) {
      const tag = m[1].toLowerCase();
      const inner = m[3];
      if (/<(p|li|h[1-6]|blockquote)\b/i.test(inner) && tag !== 'p') { re.lastIndex = m.index + m[0].indexOf('>') + 1; continue; }
      taken.push([m.index, m.index + m[0].length]);
      const text = decode(inner.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
      if (text.length < 2) continue;
      const cls = (m[2].match(/class=["']([^"']*)["']/) || [])[1] || '';
      /** @type {Block} */
      const b = { kind: 'p', text, cls };
      if (/^h[1-6]$/.test(tag)) { b.kind = tag === 'h1' && !sawH1 ? 'title' : 'h'; b.level = +tag[1]; if (tag === 'h1') sawH1 = true; }
      else if (tag === 'li' || tag === 'dt' || tag === 'dd') b.kind = 'li';
      else if (tag === 'blockquote') b.kind = 'quote';
      else if (tag === 'figcaption') b.kind = 'cap';
      else if (tag === 'td' || tag === 'th') b.kind = 'cell';
      else if (tag === 'summary') { b.kind = 'h'; b.level = 4; }
      if (/\brounds-sub\b|\bhero-sub\b/.test(cls)) b.kind = 'sub';
      if (/^<(strong|b)\b[^>]*>[^<]{1,60}<\/(strong|b)>\s*:?/i.test(inner.trim()) && /^[^:]{1,60}:/.test(text)) b.label = true;
      found.push({ at: m.index, block: b });
    }
    /** @param {number} at */
    const inTaken = (at) => {
      let lo = 0, hi = taken.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (taken[mid][1] <= at) lo = mid + 1;
        else if (taken[mid][0] > at) hi = mid - 1;
        else return true;
      }
      return false;
    };
    /** @type {TreeView} */
    const V = {
      el: n => !!n.t, tag: n => n.t, cls: n => (n.a && n.a.class) || '',
      attr: (n, k) => (n.a && Object.prototype.hasOwnProperty.call(n.a, k) ? n.a[k] : null),
      kids: n => n.k || [], up: n => n.p, text: n => n.x || '', gap: () => true, line: () => false, taken: n => inTaken(n.at),
    };
    for (const x of leaves(parseHtml(src), V)) {
      // Static paragraphs carry no bold or italic marks, so a leaf carries none either: the
      // emphasis rule must not see in a div what it cannot see in a paragraph.
      delete x.block.marks;
      found.push({ at: x.first ? x.first.at : 0, block: x.block });
    }
    found.sort((a, z) => a.at - z.at);
    for (const f of found) blocks.push(f.block);
    return { blocks, guest: /Chrysalis Ashton/.test(html), links };
  }

  /**
   * A live page as blocks, read from its DOM after its scripts have drawn. Used by the screen
   * (in a same-origin frame) and by the command line (through Playwright). Bold and italic runs
   * are kept as marks so the emphasis rule can point at them.
   * @param {Document} doc @returns {{blocks:Block[], guest:boolean, links:string[], images:string[]}}
   */
  function extractBlocks(doc) {
    const blocks = [];
    const t = doc.querySelector('title');
    if (t && t.textContent.trim()) blocks.push({ kind: 'meta', text: t.textContent.replace(/\s+/g, ' ').trim(), label: true });
    const d = doc.querySelector('meta[name="description"]');
    if (d && d.getAttribute('content')) blocks.push({ kind: 'meta', text: d.getAttribute('content').trim() });
    const root = doc.querySelector('main') || doc.body;
    const SKIP = 'script,style,svg,noscript,template,nav,header,footer,select,option,textarea,input,[aria-hidden="true"],.hu-peek,.pv-bar';
    const SEL = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dt,dd,td,th,summary';
    const view = doc.defaultView;
    const display = (/** @type {Element} */ n) => (view && view.getComputedStyle ? view.getComputedStyle(n).display : '');
    /** @type {Map<Element, boolean>} */
    const whole = new Map();
    // The tag reader reads an element whole unless it holds a nested block (a list inside a list
    // item); then it reads the nested ones, and the leaf walk reads what is left.
    const readWhole = (/** @type {Element} */ el) => {
      let v = whole.get(el);
      if (v === undefined) { v = el.tagName === 'P' || !el.querySelector('p,li,h1,h2,h3,h4,h5,h6,blockquote'); whole.set(el, v); }
      return v;
    };
    /** @type {TreeView} */
    const V = {
      el: n => n.nodeType === 1,
      tag: n => String(n.tagName).toUpperCase(),
      cls: n => n.getAttribute('class') || '',
      attr: (n, k) => n.getAttribute(k),
      kids: n => Array.from(n.childNodes).filter((/** @type {Node} */ c) => c.nodeType === 1 || c.nodeType === 3),
      up: n => n.parentElement,
      text: n => n.nodeValue || '',
      gap: n => { const s = display(n); return !!s && s !== 'inline' && s !== 'contents'; },
      line: n => /^(?:block|flex|grid|list-item|table|flow-root)/.test(display(n)),
      taken: n => { const e = n.nodeType === 1 ? n : n.parentElement; const s = e && e.closest(SEL); return !!s && readWhole(s); },
    };
    /** @type {{at:Node, block:Block}[]} */
    const found = [];
    let sawH1 = false;
    for (const el of Array.from(root.querySelectorAll(SEL))) {
      if (el.closest(SKIP)) continue;
      const btn = el.closest('button');
      if (btn && !longButton(btn, V)) continue;
      if (!readWhole(el)) continue;
      const g = gather(el, V, false);
      const text = g.text;
      if (text.length < 2) continue;
      const cls = el.className && typeof el.className === 'string' ? el.className : '';
      /** @type {Block} */
      const b = { kind: 'p', text, cls, marks: g.marks };
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) { b.kind = tag === 'h1' && !sawH1 ? 'title' : 'h'; b.level = +tag[1]; if (tag === 'h1') sawH1 = true; }
      else if (tag === 'li' || tag === 'dt' || tag === 'dd') b.kind = 'li';
      else if (tag === 'blockquote' || el.closest('blockquote')) b.kind = 'quote';
      else if (tag === 'figcaption') b.kind = 'cap';
      else if (tag === 'td' || tag === 'th' || el.closest('td,th')) b.kind = 'cell';
      else if (tag === 'summary') { b.kind = 'h'; b.level = 4; }
      if (/\brounds-sub\b|\bhero-sub\b/.test(cls)) b.kind = 'sub';
      if (b.marks.length && b.marks[0].s === 0 && /^[^:]{1,60}:/.test(text) && b.marks[0].e <= text.indexOf(':') + 1) b.label = true;
      found.push({ at: el, block: b });
    }
    for (const x of leaves(root, V)) found.push({ at: x.first, block: x.block });
    found.sort((a, z) => (a.at === z.at ? 0 : a.at.compareDocumentPosition(z.at) & 4 ? -1 : 1));
    for (const f of found) blocks.push(f.block);
    const links = Array.from(root.querySelectorAll('a[href^="http"]')).filter(a => !a.closest('nav,header,footer')).map(a => a.getAttribute('href'));
    const images = Array.from(root.querySelectorAll('img[src]')).map(i => i.getAttribute('src'));
    return { blocks, guest: /Chrysalis Ashton/.test(doc.body ? doc.body.textContent : ''), links, images };
  }

  /** Which register a site page is in, from its address and its markup. @param {string} p @param {string} [html] */
  function registerForPath(p, html) {
    if (/^\/rounds\//.test(p) || (html && /class="rounds-post"/.test(html))) return 'rounds';
    if (/^\/learn\//.test(p)) return 'learn';
    if (/^\/(tools|fun|atlas)\//.test(p)) return 'tools';
    // the secret menu holds games and tools (instructional) and a few reading pages (site)
    if (/^\/secret-menu\/./.test(p) && (!html || /__UG_TEST|gameMenu|hu-table|tool-attribution|class="tb-brand/.test(html))) return 'tools';
    return 'site';
  }

  /* ── Word lists ─────────────────────────────────────────────────────────────────────────── */

  // [pattern, what to say] pairs. Patterns are case-insensitive whole words unless noted.
  const BANNED = [
    ['delve[sd]?|delving', 'Cut it. Say what you looked at.'],
    ['straightforward', '"simple", "plain", or say the steps'],
    ['genuinely', 'cut it; it never adds anything'],
    ["in today's (?:landscape|world|environment)", 'cut the opener'],
    ['navigating the complexities(?: of)?', 'delete on sight'],
    ['at the intersection of', 'delete on sight'],
    ['robust', 'say what makes it strong'],
    ['seamless(?:ly)?', 'say what actually connects'],
    ['testament to', 'say what it shows'],
    ['tapestry', 'cut it'],
    ['crucial(?:ly)?', '"matters", or say why'],
    ['pivotal', '"turning point", or say why'],
    ["it'?s worth noting(?: that)?", 'cut it and just say the thing'],
    ['in conclusion', 'never; just end'],
    ['transformative', 'say what changed'],
    ['dive into|deep dive', '"look at", "go through"'],
    ['unlock(?:s|ed|ing)?', 'say what becomes possible'],
    ['empower(?:s|ed|ing|ment)?', 'say who can do what now'],
    ['at the end of the day', 'cut it'],
    ["let's explore", 'start mid-thought'],
    ['leverag(?:e|es|ed|ing)', 'check: fine for financial leverage; filler as "use"'],
    ['underscor(?:es|ed|ing)', '"shows"'],
    ['comprehensive', 'check: fine in its plain sense, filler as praise'],
    ['vital(?!\\s+(?:signs?|stats?|statistics|records))', 'check: fine for vital signs; filler as "important"'],
    ['landscape', 'check: fine for a real landscape; filler as "field"'],
    ['navigat(?:e|es|ed|ing)\\s+(?:the\\s+)?(?:healthcare|health care|system|complexit\\w*|challenges?|journey|world|maze|bureaucracy|process)', '"get through", "work through", or say how'],
  ];
  const NOT_DAVE = [
    ["here'?s the thing", 'not David\'s phrase'],
    ['here is the thing', 'not David\'s phrase'],
    ["let'?s be clear", 'not David\'s phrase'],
    ['make no mistake', 'not David\'s phrase'],
    ['receipts', 'not David\'s word; say "records", "proof", "the numbers"'],
  ];
  const AI_PHRASES = [
    'plays? an? (?:key|critical|crucial|vital|pivotal|important) role', 'in the realm of', 'ever-evolving', 'fast-paced world',
    'game[- ]changer', 'cutting[- ]edge', "it(?:'s| is) important to (?:note|remember|recognize)", 'a myriad of', 'myriad',
    'holistic(?:ally)?', 'synerg(?:y|ies|istic)', 'paradigm shift', 'stands as a', 'serves as a (?:reminder|testament)',
    'a (?:stark|powerful) reminder', 'in an era of', 'the power of', 'when it comes to', 'a wide (?:range|array|variety) of',
    'not only [^.]{1,60} but also', 'harness(?:es|ed|ing)? the',
  ];
  const EMOTION = [
    ['angr(?:y|ier|iest|ily)|anger(?:ed)?', 'frustrated'], ['furious(?:ly)?|fury', 'frustrated'], ['livid|enraged|rage|raging|seething', 'frustrated'],
    ['pissed(?: off)?', 'frustrated'], ['(?:was|got|so|really|am|felt|feel|i\'m)\\s+mad\\b', 'frustrated'],
    ['hat(?:e|ed|es|ing)', 'disliked, disappointed by'], ['disgust(?:ed|ing)?', 'disappointed'], ['outrag(?:e|ed|eous)', 'disappointing'],
    ['infuriat(?:e|ed|es|ing)', 'frustrating'], ['resent(?:ed|ful|ment)?', 'frustrated'],
  ];
  const PROFANITY = 'shit\\w*|bullshit|damn\\w*|goddamn\\w*|hell(?!o)|crap(?:py)?|fuck\\w*|ass(?:hole)?s?|bitch\\w*|piss(?:ed|ing)?';
  const CASUAL = "gonna|wanna|gotta|kinda|sorta|y'all|lol|lmao|omg|btw|tbh|imo|idk|ngl|sucks?|sucked|sucky|screwed(?: up)?|freaking|frickin\\w*|dude|and stuff|stuff like that|or whatever";
  const APPEAL = "heartbreak\\w*|heart-?wrenching|gut-?wrenching|devastat\\w+|tragic(?:ally)?|tragedy|in tears|tears (?:in|streaming|rolling)|cried|crying|sobb\\w*|wept|weeping|broke my heart|nightmare|horrif\\w+|terrify\\w*|terrified|harrowing|agoni[sz]ing|excruciating|unbearabl\\w+|traumati[sz]\\w+|I'll never forget|I will never forget|can you imagine|imagine (?:how|what|being|the feeling)";
  const HYPE = 'literally|absolutely|totally|insane(?:ly)?|crazy|ridiculous(?:ly)?|absurd(?:ly)?|unbelievabl[ey]|mind-?blowing|incredibl[ey]|amazing(?:ly)?|awesome|staggering(?:ly)?|shocking(?:ly)?';
  /** @type {[string, string, number?][]} */
  const VENDOR = [
    ['MyChart|My Chart|FollowMyHealth|Healow', 'the patient portal'],
    ['Haiku|Canto|Rover', "the clinician's phone app"],
    ['Vocera', 'the hands-free badge phone'],
    ['Pyxis|Omnicell', 'the medication cabinet'],
    ['Epic|Cerner|Oracle Health|Meditech|MEDITECH|athenahealth|eClinicalWorks|NextGen', 'the EHR (the electronic health record)', 1],
  ];
  // Words that follow "Patient:" in a heading or label and are not a name ("Patient: How You...").
  const NOT_NAMES = /^(?:How|You|Your|The|A|An|What|Why|When|Where|Who|Which|This|That|These|Those|Our|My|It|Its|In|On|At|To|For|And|Or|Is|Was|Are|Be|New|One|First|Name|Names|Record|Records|Data|Information|Info|Chart|Care|Visit|Portal|Safety|Experience|Journey|Story|Stories|Facing|Centered|Access|Flow|Side|View|Voice|Portal|Summary|Education|Engagement|Identity|Identifier|Demographics|Registration|Intake|Check|Level|Type|Status)$/;
  // Clinical words a layperson would not use in a title, with the word they would.
  const JARGON = [
    ['olecranon|trans-?olecranon', 'elbow'], ['radius|ulna|radial|ulnar', 'forearm, arm'], ['humer(?:us|al)', 'upper arm'],
    ['femur|femoral', 'thigh, leg'], ['tibia|tibial|fibula', 'shin, leg'], ['distal|proximal', 'say which end'],
    ['ORIF', 'surgery with plates and screws'], ['(?:closed )?reduction', 'setting the bone'], ['PACU', 'recovery room'],
    ['NPO', 'nothing to eat or drink'], ['emesis', 'vomiting'], ['syncope', 'fainting'], ['dyspnea', 'shortness of breath'],
    ['hypoxi[ac]|hypoxemi[ac]', 'low oxygen'], ['desat(?:uration|urating|urated)?', 'oxygen dropping'],
    ['tachycardi[ac]', 'fast heart rate'], ['bradycardi[ac]', 'slow heart rate'], ['(?:ex|in)tubat\\w+', 'breathing tube'],
    ['laceration', 'cut'], ['contusion', 'bruise'], ['edema', 'swelling'], ['erythema', 'redness'], ['febrile', 'feverish'],
    ['analgesi[ac]s?', 'pain medicine'], ['anticoagula\\w+', 'blood thinner'], ['ambulat\\w+', 'walking'],
    ['etiology', 'cause'], ['prophyla\\w+', 'prevention'], ['nosocomial', 'caught in the hospital'],
  ];
  const DAVE_EXPLAINS = /\(|\bcalls?\b|\bcalled\b|\bmeaning\b|\bwhich is\b|\bknown as\b|\bthat is\b|\bi\.e\./i;

  /* ── The checker ────────────────────────────────────────────────────────────────────────── */

  /**
   * @typedef {{rule:string, layer:string, level:string, b:number, s:number, e:number, text:string, msg?:string, fix?:string}} Flag
   * @typedef {{id:string, label:string, state:string, note:string, src:string, b?:number, s?:number, e?:number}} PieceItem
   */

  /**
   * Check a piece. blocks from parseText, htmlToBlocks or extractBlocks.
   * opts.register: one of REGISTERS (default 'rounds'); opts.guest: a guest byline; opts.links:
   * outbound links on the page (a sourced number counts them).
   * @param {Block[]} blocks @param {{register?:string, guest?:boolean, links?:string[]}} [opts]
   */
  function check(blocks, opts) {
    opts = opts || {};
    const reg = opts.register && R.indexOf(opts.register) >= 0 ? opts.register : 'rounds';
    const guest = !!opts.guest;
    /** @type {Flag[]} */
    const flags = [];
    /** @param {string} rule @param {number} b @param {number} s @param {number} e @param {string} text @param {string} [msg] @param {string} [fix] */
    const add = (rule, b, s, e, text, msg, fix) => {
      const level = levelOf(rule, reg);
      if (!level) return null;
      const layer = RULES[rule].layer;
      if (guest && layer !== 'phi' && rule !== 'voice.emdash') return null;
      // two patterns for the same rule landing on the same words are one finding
      if (flags.some(f => f.rule === rule && f.b === b && s < f.e && e > f.s)) return null;
      /** @type {Flag} */
      const f = { rule, layer, level, b, s, e, text };
      if (msg) f.msg = msg;
      if (fix) f.fix = fix;
      flags.push(f);
      return f;
    };
    /**
     * Run a global regex over one block. It matches against the text with curly quotes made
     * straight (same length, so offsets hold), and reports the original characters.
     * @param {number} bi @param {RegExp} re @param {string} rule
     * @param {(m:RegExpExecArray)=>(void|false|{rule?:string,s?:number,e?:number,msg?:string,fix?:string})} [fn]
     */
    const scan = (bi, re, rule, fn) => {
      const text = blocks[bi].text;
      const plain = norm(text);
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(plain))) {
        if (m[0] === '') { re.lastIndex++; continue; }
        const r = fn ? fn(m) : {};
        if (r === false) continue;
        const o = r || {};
        const s = o.s != null ? o.s : m.index;
        const e = o.e != null ? o.e : m.index + m[0].length;
        add(o.rule || rule, bi, s, e, text.slice(s, e), o.msg, o.fix);
      }
    };
    /** Whole words, case-insensitive. @param {string} src @param {string} [flags] */
    const W = (src, flags) => new RegExp('\\b(?:' + src + ')\\b', flags || 'gi');

    const PROSE = { p: 1, li: 1, cap: 1, sub: 1, meta: 1 };   // kinds the word rules read
    const HEAD = { title: 1, h: 1, sub: 1 };
    // A note (an eyebrow, a label, a grid cell) gets the word rules and nothing that reads a
    // sentence or a structure; a source or disclosure gets patient information and em dashes.
    // Neither counts as a section's last paragraph or breaks a run of blocks: before 2026-10-04
    // neither was read at all, and the structure rules were tuned without them.
    const ASIDE = { note: 1, src: 1 };
    const isHead = (/** @type {Block} */ b) => !!HEAD[b.kind] || (b.kind === 'meta' && b.label);

    /* 1 · Word-level rules, block by block */
    blocks.forEach((b, bi) => {
      const T = norm(b.text);
      const prose = !!PROSE[b.kind] || !!HEAD[b.kind];

      // Patient information reads EVERYTHING, tables and quotes included.
      scan(bi, /\b\d{3}-\d{2}-\d{4}\b/g, 'phi.ssn', m => looksFake(m[0]) ? false : undefined);
      scan(bi, /(?<![\d-])(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, 'phi.phone', m => looksFake(m[0]) ? false : undefined);
      scan(bi, /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g, 'phi.email', m => /@(?:example|test)\.(?:com|org)$/i.test(m[0]) ? false : undefined);
      // The keyword stands alone: FIN is a record number's label, the FIN in a file name's FINAL is not.
      scan(bi, /\b(?:MRN|medical record (?:number|no\.?|#)|member (?:ID|number|no\.?|#)|subscriber (?:ID|number|#)|policy (?:number|no\.?|#)|account (?:number|no\.?|#)|acct\.?(?: ?(?:number|no\.?|#))?|claim (?:number|no\.?|#)|encounter (?:number|ID|#)|CSN|FIN|HAR|visit (?:number|#)|patient (?:ID|number|#)|chart (?:number|#)|NPI|DEA(?: number| #)?|license (?:number|no\.?|#)|serial (?:number|no\.?|#)|S\/N|certificate (?:number|#)|plate (?:number|#)|VIN)(?![a-z])\s*[:#]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{3,}\b/gi, 'phi.record', m => looksFake(m[0]) ? false : undefined);
      scan(bi, new RegExp('\\b(?:DOB|D\\.O\\.B\\.?|date of birth|birth ?date|born(?: on)?|admitted(?: on)?|admission date|discharged(?: on)?|discharge date|date of service|DOS|date of death|died(?: on)?|expired(?: on)?|surgery (?:on|date)|procedure date|seen on)\\b[:\\s,]*(?:on\\s+)?' + DATE_ANY, 'gi'), 'phi.dated', m => realDate(m[0].replace(/^[^0-9]*?(?=\d{1,2}\/)/, '')) ? undefined : false);
      scan(bi, new RegExp(DATE_FULL, 'g'), 'phi.date', m => {
        if (!realDate(m[0])) return false;
        if (ASIDE[b.kind]) return false;            // a dateline or a citation's read date, not the story
        const before = T.slice(Math.max(0, m.index - 40), m.index);
        if (/\b(?:checked|retrieved|accessed|published|updated|released|posted|as of|pulled|read|fetched|dated|effective|signed|passed|introduced|filed|announced|reported|through|since|until|from|on or after|last)\b[^.]{0,25}$/i.test(before)) return false;
        return undefined;
      });
      scan(bi, /\b(?:(?:9\d|1[01]\d)[- ](?:year|yr)s?[- ]old|aged? (?:9\d|1[01]\d))\b/gi, 'phi.age');
      scan(bi, /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?(?:[A-Z][a-z]+\.?\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl|Parkway|Pkwy|Highway|Hwy|Terrace|Ter)\b\.?|\b\d{1,5}\s+[NSEW]\.?\s+\d{1,5}\s+[NSEW]\b\.?/g, 'phi.address');
      scan(bi, /\b(?:A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY]|ZIP(?: code)?:?)\s+\d{5}(?:-\d{4})?\b/g, 'phi.zip');
      scan(bi, /\bhttps?:\/\/[^\s<>"')]+/gi, 'phi.link', m => {
        const u = m[0];
        if (/(?:mychart|patientportal|patient-portal|\/portal\b|portal\.|login|signin|sign-in|\bsso\b|oauth|token=|session|sid=|access_token|auth=|\/patients?\/|appointment)/i.test(u)) return undefined;
        if (/[?&][\w-]+=[A-Za-z0-9_-]{24,}/.test(u)) return undefined;
        return false;
      });
      scan(bi, /(?<![\w.])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?!\w|\.\d)/g, 'phi.ip', m => {
        if ([m[1], m[2], m[3], m[4]].some(o => +o > 255)) return false;
        if (/\bv(?:ersion)?\s*$/i.test(T.slice(Math.max(0, m.index - 9), m.index))) return false;
        return undefined;
      });
      scan(bi, /\b(?:[Pp]atient(?: [Nn]ame)?|PATIENT(?: NAME)?|[Pp]t(?: [Nn]ame)?|PT|[Gg]uarantor|[Ii]nsured|[Ss]ubscriber)\s*:\s*([A-Z][a-z]+)(?:,\s*|\s+)([A-Z][a-z]+)/g, 'phi.namefield', m => (NOT_NAMES.test(m[1]) || NOT_NAMES.test(m[2])) ? false : undefined);
      // Distinctive record headers count anywhere; a field name that is also a plain phrase
      // ("the attending physician", "a discharge summary") counts only as a label with a colon.
      scan(bi, /\b(?:electronically signed by|H&P by|(?:attending physician|ordering provider|referring provider|encounter date|visit date|admit date|chief complaint|assessment (?:&|and) plan|history of present illness|review of systems|discharge summary|signed by)\s*:)/gi, 'phi.chart');
      if (prose || b.kind === 'quote' || ASIDE[b.kind]) {
        scan(bi, /\b(?:Dr\.?|Doctor)\s+([A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’-]+)?)/g, 'phi.clinician', m => PUBLIC_NAMES.test(m[0]) ? false : undefined);
        scan(bi, /\b([A-Z][a-z'’-]+\s+(?:[A-Z]\.\s+)?[A-Z][a-z'’-]+),\s*(?:MD|M\.D\.|DO|D\.O\.|RN|BSN|NP|FNP|APRN|PA-C|RRT|CRT|CRNA|DPT|PharmD|DDS|DMD|MSN|DNP)\b/g, 'phi.clinician', m => PUBLIC_NAMES.test(m[1]) ? false : undefined);
        scan(bi, /\b(?:Mr|Mrs|Ms|Miss|Mx)\.?\s+[A-Z][a-z]+/g, 'phi.patient');
        // case-sensitive on purpose, so "my brother drove" does not read "drove" as a name
        scan(bi, /\b[Mm]y\s+(?:brother|sister|wife|husband|son|daughter|mother|father|mom|dad|mum|grandmother|grandfather|grandma|grandpa|uncle|aunt|cousin|nephew|niece|boyfriend|girlfriend|fianc[ée]e?|roommate)\b(?:,?\s+[A-Z][a-z]+)?/g, 'phi.person');
        scan(bi, /\b((?:[A-Z][\w'’.&-]*\s+){1,5})(?:Hospital|Medical Center|Health Center|Surgery Center|Surgical Center|Clinic|InstaCare|Urgent Care|Regional Medical Center|Children's Hospital|Orthopedic Center|Specialty Center)\b(?!\s+[A-Z])/g, 'phi.facility', m => {
          const lead = m[1].trim().split(/\s+/).filter(w => !/^(?:The|A|An|Our|My|This|That|Its|Their|Each|Every|One)$/.test(w));
          return lead.length ? undefined : false;
        });
        scan(bi, /\b(?:my|I was|I am|I'm|I’m|I've been|I’ve been|I have|I had)\b[^.!?]{0,40}?\b(?:tolerance|addiction|overdose|withdrawal|rehab|relapse|psychiatric|depression|bipolar|PTSD|HIV|hepatitis|STDs?|STIs?|pregnan\w+|miscarriage|abortion|genetic|BRCA|suicid\w+|eating disorder|prescriptions?|prescribed|diagnos\w+|medications?)\b/gi, 'phi.detail');
      }
      if (b.kind === 'cell') return;                // tables: left alone (kernel register table)

      // Em dashes everywhere but someone else's quoted words; the gate reads quotes too.
      scan(bi, /—/g, 'voice.emdash');
      if (b.kind === 'quote' || b.kind === 'src') return;   // someone else's words, or a source or disclosure (kernel register table)
      scan(bi, /(?<=\S)\s(?:–|-{1,2})\s(?=\S)|(?<=[A-Za-z])--(?=[A-Za-z])/g, 'voice.dash', m => {
        const around = b.text.slice(Math.max(0, m.index - 3), m.index + m[0].length + 3);
        return /\d\s*[–-]{1,2}\s*\d/.test(around) ? false : undefined;
      });

      for (const [src, fix] of BANNED) {
        const plain = /^check:/.test(fix);
        scan(bi, W(src), 'voice.banned', () => plain ? { rule: 'voice.aiphrase', msg: 'Fine in its plain sense; filler as praise or emphasis.', fix: fix.replace(/^check:\s*/, '') } : { fix });
      }
      for (const [src, fix] of NOT_DAVE) scan(bi, W(src), 'voice.notdave', () => ({ fix }));
      // "Here is the" as an opener; "every map here is the method" is a different phrase.
      scan(bi, /(?:^|[.!?:;]\s+|\b(?:and|so|but),?\s+)(?:Here|here)(?:'s|’s| is) the\b(?! thing)/g, 'voice.notdave', () => ({ msg: '"Here is the" is on the profile\'s list of vocabulary that is not his.', fix: 'say the thing directly' }));
      scan(bi, W(AI_PHRASES.join('|')), 'voice.aiphrase');
      scan(bi, W("one honest (?:complication|caveat|admission)|to be (?:honest|fair|clear)|honestly(?=,)|full disclosure|I'll (?:be honest|admit)|I will admit|frankly|truth be told|candidly|in all honesty"), 'voice.hedge');
      scan(bi, W("the (?:result|kicker|catch|problem|answer|twist|lesson|takeaway|upshot|bottom line|short version|truth|point|irony)|here(?:'s|’s| is) (?:what|why|how|where|when|the deal)"), 'voice.colon', m => {
        // only as an opener ("The result: ..."); "inflating the PROBLEM: pseudoaddiction, ..." introduces a list
        const opener = m.index === 0 || /[.!?]["”’)]*\s+$/.test(b.text.slice(0, m.index));
        return opener && /^\s*:/.test(b.text.slice(m.index + m[0].length)) ? { e: m.index + m[0].length + 1 } : false;
      });

      if (reg !== 'tools') {
        // David's ruling was about how the writer names his own feelings; a textbook describing
        // how people feel about something ("still resented") is reporting, so Learn reads it again.
        for (const [src, fix] of EMOTION) scan(bi, W(src), 'pro.emotion', () => (reg === 'learn' ? { fix, rule: 'pro.emotionlearn' } : { fix }));
      }
      scan(bi, W(PROFANITY), 'pro.profanity');
      scan(bi, W(CASUAL), 'pro.casual');
      scan(bi, /\p{Extended_Pictographic}/gu, 'pro.casual', () => ({ msg: 'An emoji.' }));
      scan(bi, W(APPEAL), 'pro.appeal');
      scan(bi, W(HYPE), 'pro.hype');
      // Only the writer coining a name. "Economists call this the X" or "the so-called X" cites a
      // term that already exists, which is fine.
      // Past tense ("We called it burnout") names a term that already exists, so it is not here.
      scan(bi, W("what (?:I|we)(?:'d| would)? call|(?:I|we) (?:call|dub) (?:it|this|them|these)|(?:I|we)(?:'ve| have) (?:named|dubbed) (?:it|this|them|these)|(?:I|we)(?:'d| would|'ll| will) call (?:it|this|them)|let's call (?:it|this|them)|I'm calling (?:it|this)"), 'pro.coined');
      scan(bi, /\bthe [a-z]+(?:[- ][a-z]+)? (?:tax|trap|paradox|cliff|spiral|treadmill|gauntlet|shuffle|dance|lottery|cascade|vortex)\b/gi, 'pro.coinedmaybe');
      scan(bi, /["“]((?:[A-Z][a-z]+)(?:\s+(?:of|the|and|[A-Z][a-z]+)){1,4})["”]/g, 'pro.coinedmaybe', m => /^(?:The|A|An)\s+\w+$/.test(m[1]) ? false : undefined);
      // Patient-facing products get the plain name in a patient's story. The EHR vendors are the
      // subject of half the informatics pieces on the site, so naming one there is fine.
      for (const [src, fix, ehr] of VENDOR) scan(bi, new RegExp('\\b(?:' + src + ')\\b', 'g'), 'pro.vendor', () => (ehr ? { fix, rule: 'pro.vendorehr' } : { fix }));
      scan(bi, /\b(?:um+|uh+|uhm+|erm+)\b/gi, 'pro.filler');
      scan(bi, /\byou know,/gi, 'pro.filler');
      scan(bi, /\b([A-Za-z]+)\s+\1\b/gi, 'pro.filler', m => /^(?:that|had|is|do|so|very|no|bye|ha|now|well|knock|tsk|go|I)$/i.test(m[1]) ? false : { msg: 'A doubled word.' });
      // Dictation drops periods: "why I wrote it With a big part of my goal". A lowercase word
      // followed by a capitalised sentence-opener is usually a missing period.
      if (b.kind === 'p' || b.kind === 'li') scan(bi, /\b[a-z]{2,}\s+(?:With|The|But|So|And|It|This|That|We|My|He|She|They|There|What|When|If|Although|Then|Now|After|Before|Because|Our|His|Her|Their|At|In|On)(?=\s)/g, 'pro.filler', () => ({ msg: 'A sentence may be missing its period here.' }));
      scan(bi, W('catastroph\\w*|disaster\\w*|dire|collaps\\w+|apocalyp\\w*|doomed|we beg|desperately (?:need|ask)|please help|pleading|we plead'), 'pro.alarm');

      if (isHead(b)) {
        for (const [src, fix] of JARGON) scan(bi, W(src), 'pro.jargon', () => ({ fix }));
      } else if (PROSE[b.kind]) {
        const seen = {};
        for (const [src, fix] of JARGON) {
          scan(bi, W(src), 'pro.jargonbody', m => {
            const key = m[0].toLowerCase();
            if (seen[key] || JARGON_SEEN[key]) return false;
            // capitalised mid-sentence is part of a name ("National Hospital Ambulatory Medical Care Survey")
            if (/^[A-Z]/.test(m[0]) && m.index > 0 && !/[.!?:]\s*$/.test(b.text.slice(0, m.index))) return false;
            seen[key] = 1; JARGON_SEEN[key] = 1;
            const sent = sentenceAround(b.text, m.index);
            return DAVE_EXPLAINS.test(sent) ? false : { fix };
          });
        }
      }

      // Bold or italic used for emphasis, not as a list label.
      if (PROSE[b.kind] && b.kind !== 'meta') {
        // A short bold run at the very start of a block is a run-in label ("Ordered", "Not yet"
        // on the broken arm cards), which is structure, not emphasis.
        if (b.marks) b.marks.forEach((k, i) => { if (!(i === 0 && (b.label || (k.s === 0 && nWords(b.text.slice(k.s, k.e)) <= 4)))) add('voice.emphasis', bi, k.s, k.e, b.text.slice(k.s, k.e)); });
        else scan(bi, /\*\*[^*\n]+\*\*|__[^_\n]+__|(?<![*\w])\*(?!\s)[^*\n]+?\*(?![*\w])|(?<![_\w])_(?!\s)[^_\n]+?_(?![_\w])/g, 'voice.emphasis', m => (m.index === 0 && (/:\W*$/.test(m[0]) || /^\s*:/.test(b.text.slice(m[0].length)))) ? false : undefined);
      }
    });

    /* 2 · Negation-contrast, budgeted across the piece: the first is a check, the rest warn. */
    const NEG = /\bnot (?:just|only|merely|simply)\b|\b(?:is|was|are|were)n['’]?t (?:just|only|merely|about)\b|\b(?:isn['’]?t|wasn['’]?t|is not|was not|aren['’]?t|are not)\s+[^.;:!?]{1,50}?[,;]\s*(?:it['’]?s|it is|it was|they['’]?re|but)\b|\brather than\b|\bless (?:about|a matter of) [^.;]{1,40}?more (?:about|a matter of)\b|\bnot because\b|,\s+not (?:a |an |the )?[a-z]+(?: [a-z]+)?(?=[.,;])/gi;
    let negs = 0;
    blocks.forEach((b, bi) => {
      if (!PROSE[b.kind] || b.kind === 'meta') return;
      NEG.lastIndex = 0;
      let m;
      while ((m = NEG.exec(b.text))) {
        negs++;
        const f = add('voice.negation', bi, m.index, m.index + m[0].length, m[0], negs === 1 ? 'Your one negation-contrast for this piece. Make sure it earns it.' : 'Number ' + negs + ' in this piece. The budget is one.');
        if (f && negs === 1) f.level = 'check';
      }
    });

    /* 3 · Sentence rules, paragraph by paragraph */
    const PIVOT = /^(?:Furthermore|Moreover|Additionally|In addition|Consequently|Thus|Hence|In conclusion|To sum up|In summary|Ultimately|Notably|Importantly|Overall),?\s/;
    const IMPERATIVE = /^(?:Price|Fear|Ask|Remember|Watch|Plan|Build|Stop|Start|Choose|Trust|Read|Know|Count|Follow|Pay|Look|Mind|Keep|Expect|Measure|Fix|Respect|Listen|Don't|Do|Be|Make|Take|Show|Let|Think|Act|Ignore|Forget|Beware|Demand|Question|Doubt|Bet|Learn|Choose|Guard|Protect|Budget|Hire|Staff|Fund)\b/;
    const RHET_ANSWER = /^(?:The answer|Simple|Easy|Because|It['’]s because|Turns out|It turns out|Here['’]s why|The short answer|Short answer|Spoiler|Nope|Yes|No)\b/;
    const sentencesOf = /** @type {Object<number, {text:string,s:number,e:number}[]>} */ ({});
    blocks.forEach((b, bi) => {
      if (b.kind !== 'p') return;
      const S = splitSentences(b.text);
      sentencesOf[bi] = S;
      S.forEach((s, i) => {
        const pv = s.text.match(PIVOT);
        if (pv) add('voice.pivot', bi, s.s, s.s + pv[0].trimEnd().length, pv[0].trim());
        // A list ("CDC, Census, and CMS") is not a pileup. Four commas with no and/or closing a
        // list, or six or more of any kind, is.
        const commas = (s.text.replace(/\d,\d/g, '').match(/,/g) || []).length;
        const list = /,\s*(?:and|or|nor)\s/i.test(s.text);
        if (commas >= 6 || (commas >= 4 && !list)) add('voice.commas', bi, s.s, s.e, s.text, commas + ' commas in one sentence.');
        const n = nWords(s.text);
        if (n > 50) add('pro.long', bi, s.s, s.e, s.text, n + ' words in one sentence.');
        if (/\?["”’)]*$/.test(s.text) && S[i + 1] && RHET_ANSWER.test(S[i + 1].text)) add('voice.rhetorical', bi, s.s, S[i + 1].e, s.text + ' ' + S[i + 1].text);
      });
      // Clipped runs: three or more sentences of six words or fewer, back to back.
      for (let i = 0; i < S.length;) {
        let j = i;
        while (j < S.length && nWords(S[j].text) <= 6 && !/\?$/.test(S[j].text)) j++;
        if (j - i >= 3) { add('voice.clipped', bi, S[i].s, S[j - 1].e, b.text.slice(S[i].s, S[j - 1].e), (j - i) + ' short sentences in a row.'); i = j; } else i = Math.max(j, i + 1);
      }
      // Flat rhythm: four sentences of 8+ words within five words of each other. The skill says
      // three, but David's own calibration passage (20, 17, 17 words, then a long one) trips three,
      // and a rule his real writing fails is measuring the wrong thing.
      for (let i = 0; i + 3 < S.length; i++) {
        const n = [0, 1, 2, 3].map(k => nWords(S[i + k].text));
        if (Math.min(...n) >= 8 && Math.max(...n) - Math.min(...n) <= 5) { add('voice.flat', bi, S[i].s, S[i + 3].e, b.text.slice(S[i].s, S[i + 3].e), 'Lengths ' + n.join(', ') + '.'); i += 3; }
      }
      // Anaphora: three sentences opening on the same word.
      for (let i = 0; i + 2 < S.length; i++) {
        const w = S.slice(i, i + 3).map(s => (s.text.match(/^["“]?([A-Za-z']+)/) || [])[1] || '');
        if (w[0] && w[0] === w[1] && w[1] === w[2] && !/^(?:I|The|A|An|It|This|That|We|And|But|So|He|She|They|My|In|On|At)$/i.test(w[0])) { add('voice.anaphora', bi, S[i].s, S[i + 2].e, b.text.slice(S[i].s, S[i + 2].e)); i += 2; }
      }
      // Paragraph closer shapes.
      const last = S[S.length - 1];
      if (last && S.length >= 2) {
        const n = nWords(last.text);
        const t = norm(last.text);
        if (n <= 6 && (/^(?:So|Neither|Nor) (?:is|are|was|were|does|did|do|has|have)\b/.test(t) || /^[^,]{2,40}, not [^,.]{2,40}\.$/.test(t))) add('voice.aphorism', bi, last.s, last.e, last.text, 'An antithesis flip.');
        else if (n <= 5 && /\.$/.test(t) && IMPERATIVE.test(t)) add('voice.aphorism', bi, last.s, last.e, last.text, 'An imperative closer.');
        else if (n <= 9 && /\.$/.test(t) && !/\d/.test(t) && /^(?:The|That|This|That's|This is|It's|It was|That was)\b.*\b(?:is|was|'s|were|are)\s+(?:the|a|an|our|its|their)\s+[a-z]+(?:\s+[a-z]+)?\.$/.test(t)) add('voice.verdict', bi, last.s, last.e, last.text);
        // Three-part ending on the paragraph's last sentence.
        // Without the serial comma, "Between calls, I arranged leave and FMLA" has the same shape
        // as "red, white and blue", so items there must be one or two words.
        const tri = t.match(/(?:^|[,:;]\s|\s)([\w'-]+(?:\s[\w'-]+){0,3}),\s+([\w'-]+(?:\s[\w'-]+){0,3})(,?)\s+(?:and|or)\s+([\w'-]+(?:\s[\w'-]+){0,3})[.!]$/);
        if (tri && b.text.length > 80 && (tri[3] || [tri[1], tri[2], tri[4]].every(x => nWords(x) <= 2))) add('voice.triad', bi, last.s, last.e, last.text);
      }
    });

    /* 4 · Section closers: the last sentence before each heading, and at the end. */
    const closers = [];
    let lastP = -1;
    const closeSection = () => {
      if (lastP < 0) return;
      const S = sentencesOf[lastP] || [];
      const total = S.length;
      if (total >= 2) {
        const c = S[total - 1];
        // A punchline is short and carries no figure; "Consolidation accelerated since 2020." is a fact.
        if (nWords(c.text) <= 7 && !/\d/.test(c.text) && /[.!]["”’)]*$/.test(c.text)) closers.push({ bi: lastP, c });
      }
      lastP = -1;
    };
    blocks.forEach((b, bi) => {
      if (HEAD[b.kind]) closeSection();
      else if (b.kind === 'p') lastP = bi;
      else if (b.kind !== 'meta' && !ASIDE[b.kind]) lastP = -1;     // a section that ends on a list or a figure has no closing line
    });
    closeSection();
    closers.forEach((k, i) => {
      if (i === 0) add('voice.closer', k.bi, k.c.s, k.c.e, k.c.text, closers.length > 1 ? 'One of ' + closers.length + ' short section closers.' : 'The piece\'s one flat closer. Make sure it is a statement, not a slogan.');
      else add('voice.closers', k.bi, k.c.s, k.c.e, k.c.text, 'Short closer number ' + (i + 1) + '. The kernel allows one per piece.');
    });

    /* 5 · Headings */
    blocks.forEach((b, bi) => {
      if (!isHead(b)) return;
      const t = norm(b.text).replace(/\s*[|·]\s*Healthcare Uncharted\s*$/, '').trim();
      if (b.kind === 'sub' && GRANDFATHERED.indexOf(t.toLowerCase()) >= 0) return;
      // X-and-the-Y: "The Problem and the Product", a bare title pair ("Wound and Workload"), or the
      // comma variant ("The pitch, and the claims data"). A plain label that happens to hold an
      // "and" ("Hospice and home health", "Institutional and Government Sources") is fine.
      const twoThe = /^the\s+[\w'-]+(?:\s[\w'-]+)?\s+and\s+the\s+[\w'-]+(?:\s[\w'-]+)?\.?$/i.test(t);
      const bare = (b.kind === 'title' || b.kind === 'sub' || b.kind === 'meta') && /^[A-Z][\w'-]+\s+and\s+[A-Z][\w'-]+$/.test(t);
      const comma = /^[^,]{2,40},\s+and\s+(?:the|what|how|why|who)\s+/i.test(t);
      if ((twoThe || bare || comma) && !LABEL_PAIRS.test(t)) add('voice.pair', bi, 0, b.text.length, b.text);
      // A heading that sells: a numbered antithesis ("Three eras, one move", "One dataset, many
      // windows"), two beats ("One shelf. No islands."), or a verdict ("Honest beats clean.").
      // A label that ends in a period is a house style on the Learn pages, not a sale.
      if (/^(?:one|two|three|four|five|six|seven|eight|nine|ten|many|\d+)\s+[a-z]+,\s+(?:one|two|three|many|no|zero|\d+)\s+[a-z]+\.?$/i.test(t)) add('voice.sells', bi, 0, b.text.length, b.text, 'A numbered antithesis.');
      else if (b.kind !== 'meta' && /^[^.?!]{2,40}[.?!]\s+[A-Z][^.?!]{1,40}[.!]?$/.test(t) && nWords(t) <= 12 && !/\b(?:vs|Dr|St|Mr|Ms|No)\.\s/.test(t)) add('voice.sells', bi, 0, b.text.length, b.text, 'A heading in two beats is a slogan. Say what is underneath.');
      else if (/^[\w'-]+(?:\s[\w'-]+)?\s+(?:beats|trumps|over)\s+[\w'-]+(?:\s[\w'-]+)?\.?$/i.test(t) || /^[^,]{3,40},\s+not (?:just )?[^,]{3,40}\.?$/i.test(t)) add('voice.sells', bi, 0, b.text.length, b.text, 'A verdict, not a label.');
    });

    /* 6 · Parallel-block runs: "Label: sentence" three or more times in a row. */
    // A leaf (a div or a card) counts only with a real bold label: its colons are mostly titles
    // ("Vital Stats: The Healthcare Numbers Game"), not a "Label: sentence" template.
    const seq = blocks.map((b, bi) => bi).filter(bi => !ASIDE[blocks[bi].kind]);
    for (let i = 0; i < seq.length;) {
      let j = i;
      while (j < seq.length && (blocks[seq[j]].kind === 'li' || blocks[seq[j]].kind === 'p') && (blocks[seq[j]].label || (!blocks[seq[j]].leaf && /^\s*(?:\*\*|__)?[A-Z][^:.!?\n]{1,48}?(?:\*\*|__)?:\s+\S/.test(blocks[seq[j]].text)))) j++;
      const b0 = blocks[seq[i]];
      if (j - i >= 3) { add('voice.parallel', seq[i], 0, Math.min(b0.text.length, (b0.text.indexOf(':') + 1) || b0.text.length), b0.text.slice(0, 60), (j - i) + ' blocks in a row start "Label: sentence".'); i = j; } else i = Math.max(j, i + 1);
    }

    /* 7 · Phrases used too often (the kernel's frequency audit). */
    const all = blocks.filter(b => PROSE[b.kind]).map(b => norm(b.text)).join('\n');
    /** @type {[string, number][]} */
    const OFTEN = [['the whole point', 1], ["that(?:'s| is) why", 2], ['for the most part', 2], ['kind of|sort of', 3]];
    for (const [src, max] of OFTEN) {
      const n = (all.match(W(src)) || []).length;
      if (n > max) {
        const re = W(src);
        let k = 0;
        blocks.forEach((b, bi) => {
          if (!PROSE[b.kind]) return;
          re.lastIndex = 0;
          let m;
          while ((m = re.exec(norm(b.text)))) { k++; if (k > max) add('voice.repeat', bi, m.index, m.index + m[0].length, b.text.slice(m.index, m.index + m[0].length), '"' + m[0] + '" ' + n + ' times in this piece.'); }
        });
      }
    }

    flags.sort((a, z) => a.b - z.b || a.s - z.s || rank(a.level) - rank(z.level));

    /* 8 · The piece: the Rounds checklist, and stats for every register. */
    const prose = blocks.filter(b => b.kind === 'p' || b.kind === 'li' || b.kind === 'quote' || b.kind === 'cap');
    const text = prose.map(b => b.text).join('\n');
    const sents = prose.flatMap(b => splitSentences(b.text));
    const ws = words(text);
    const syl = ws.reduce((n, w) => n + syllables(w), 0);
    const stats = {
      words: ws.length,
      sentences: sents.length,
      avg: sents.length ? Math.round(ws.length / sents.length * 10) / 10 : 0,
      longest: sents.reduce((n, s) => Math.max(n, nWords(s.text)), 0),
      grade: sents.length && ws.length ? Math.max(0, Math.round((0.39 * ws.length / sents.length + 11.8 * syl / ws.length - 15.59) * 10) / 10) : 0,
    };
    const piece = reg === 'rounds' && !guest ? roundsChecklist(blocks, flags, opts.links || []) : [];
    const counts = { block: 0, warn: 0, check: 0 };
    flags.forEach(f => { counts[f.level]++; });
    return { register: reg, guest, flags, piece, stats, counts };
  }

  /** @param {string} l */
  function rank(l) { return l === 'block' ? 0 : l === 'warn' ? 1 : 2; }
  /** @param {string} text @param {number} at */
  function sentenceAround(text, at) {
    const S = splitSentences(text);
    for (const s of S) if (at >= s.s && at < s.e) return s.text;
    return text;
  }
  // Jargon explained once counts for the whole piece; reset per check() call (see checkText).
  /** @type {Object<string,number>} */
  let JARGON_SEEN = {};

  // Public people the site names on purpose: the author, guest and advocacy names from CLAUDE.md,
  // and Dr. Lorna Breen (the Lorna Breen Act and foundation, cited in Sources).
  const PUBLIC_NAMES = /\b(?:David Eitel|Eitel|Lorna Breen|Breen|Chrysalis Ashton|Katy Hall|Abigail Mortell|Arllene Anderson|Kelli May Douglas)\b/;
  // Headings that pair two words as a plain label, not as an evocative pair.
  const LABEL_PAIRS = /^(?:sources and (?:methods|notes)|(?:methods|data|notes) and sources|terms and conditions|questions and answers|pros and cons|rules and scoring|privacy and terms|credits and sources|data and methods|wins and losses|inputs and outputs|roles and responsibilities|signs and symptoms|risks and benefits|cost and coverage|pay and benefits)$/i;
  // The three X-and-the-Y lines the kernel grandfathers as .rounds-sub, because their slugs carry them.
  const GRANDFATHERED = ['the problem and the product', 'the wound and the workload', 'the promise and the bill'];

  /**
   * The Rounds pre-publish checklist (kernel "Before committing prose", profile section 8, and
   * David's 2026-10-03 additions). Each item: pass, miss, or judge (the screen shows the evidence
   * and the reader decides; a script cannot tell whether a question is really unanswered).
   * @param {Block[]} blocks @param {Flag[]} flags @param {string[]} links @returns {PieceItem[]}
   */
  function roundsChecklist(blocks, flags, links) {
    const items = [];
    const P = blocks.map((b, bi) => ({ b, bi })).filter(x => x.b.kind === 'p' || x.b.kind === 'li' || x.b.kind === 'cap');
    const title = blocks.find(b => b.kind === 'title') || blocks.find(b => b.kind === 'meta');
    items.push({ id: 'title', label: 'The title says what the piece is about', state: 'judge', note: title ? '"' + title.text + '"' : 'No title found.', src: 'kernel' });
    const firstP = P.find(x => x.b.kind === 'p' && nWords(x.b.text) >= 8);
    if (firstP) {
      const s = splitSentences(firstP.b.text)[0];
      items.push({ id: 'open', label: 'Opens on something that happened, not a thesis', state: 'judge', note: s ? s.text : '', src: 'kernel', b: firstP.bi, s: s ? s.s : 0, e: s ? s.e : 0 });
    }
    const aph = flags.filter(f => f.rule === 'voice.aphorism' || f.rule === 'voice.verdict' || f.rule === 'voice.closers').length;
    items.push({ id: 'aph', label: 'One aphorism or punchy closer at most', state: aph <= 1 ? 'pass' : 'miss', note: aph + ' found.', src: 'kernel' });
    let quote = null;
    for (const x of blocks.map((b, bi) => ({ b, bi }))) {
      if (x.b.kind === 'quote' && nWords(x.b.text) >= 4) { quote = { bi: x.bi, s: 0, e: x.b.text.length, t: x.b.text }; break; }
      const m = x.b.text.match(/["“]([^"”]{12,})["”]/);
      if (m && nWords(m[1]) >= 4 && x.b.kind !== 'meta' && x.b.kind !== 'src') { quote = { bi: x.bi, s: m.index, e: m.index + m[0].length, t: m[0] }; break; }
    }
    items.push(Object.assign({ id: 'quote', label: 'A person is quoted', state: quote ? 'pass' : 'miss', note: quote ? quote.t.slice(0, 140) : 'No quoted speech found. Stage the conversation; quote people.', src: 'kernel' }, quote ? { b: quote.bi, s: quote.s, e: quote.e } : {}));
    const qs = [];
    P.forEach(x => splitSentences(x.b.text).forEach(s => { if (/\?["”’)]*$/.test(s.text)) qs.push({ bi: x.bi, s }); }));
    const rhet = flags.filter(f => f.rule === 'voice.rhetorical').length;
    items.push(Object.assign({ id: 'question', label: 'A real question the piece does not answer', state: qs.length > rhet ? 'judge' : 'miss', note: qs.length ? qs.length + ' question' + (qs.length > 1 ? 's' : '') + '. First: ' + qs[0].s.text : 'No questions.', src: 'kernel' }, qs.length ? { b: qs[0].bi, s: qs[0].s.s, e: qs[0].s.e } : {}));
    const KNOW = /\b(?:I (?:don['’]t|do not|didn['’]t|did not|still don['’]t) know|I (?:can['’]t|cannot|couldn['’]t|could not) (?:tell|say|remember|follow|see)|not sure|no idea|I['’]m not certain|I wonder|unclear to me|I never (?:learned|found out)|I may be wrong|I could be wrong)\b/i;
    let know = null;
    for (const x of P) { const m = x.b.text.match(KNOW); if (m) { know = { bi: x.bi, s: m.index, e: m.index + m[0].length, t: sentenceAround(x.b.text, m.index) }; break; } }
    const hedges = flags.filter(f => f.rule === 'voice.hedge').length;
    items.push(Object.assign({ id: 'unknown', label: 'A moment of not knowing, unannounced', state: know && !hedges ? 'pass' : know ? 'judge' : 'miss', note: know ? know.t : 'None found.' + (hedges ? ' ' + hedges + ' announced hedge' + (hedges > 1 ? 's' : '') + ' flagged instead.' : ''), src: 'kernel' }, know ? { b: know.bi, s: know.s, e: know.e } : {}));
    const nums = [];
    P.forEach(x => { for (const m of x.b.text.matchAll(/\$?\d[\d,]*(?:\.\d+)?%?/g)) { const d = m[0].replace(/[$,%]/g, ''); if (/\.\d|[1-9]$/.test(d) && d.replace(/\D/g, '').length >= 2 && !/^(?:19|20)\d\d$/.test(d)) nums.push(m[0]); } });
    items.push({ id: 'figures', label: 'Anchored in specific figures, not round ones', state: nums.length ? 'pass' : 'miss', note: nums.length ? nums.slice(0, 5).join(', ') + (nums.length > 5 ? ' and ' + (nums.length - 5) + ' more' : '') : 'No specific numbers.', src: 'profile' });
    const allText = blocks.map(b => b.text).join('\n');
    const sourced = links.length || /\bhttps?:\/\/|\bSource[s]?:|\baccording to\b|\(\s*[A-Z][\w&. ]{1,40},?\s+(?:19|20)\d\d\s*\)/.test(allText);
    items.push({ id: 'source', label: 'Puts the case in context with a sourced number', state: sourced ? 'pass' : 'miss', note: sourced ? (links.length ? links.length + ' outside link' + (links.length > 1 ? 's' : '') + '.' : 'A source is named.') : 'No link or named source. "My story is not unique": show how often it happens.', src: 'dStat' });
    const WHY = /\b(?:why I (?:wrote|am writing|['’]m writing|wanted)|I wrote (?:this|it)|the reason I|I['’]m writing this|I am writing this|I wanted to (?:write|share|walk|trace|document|map|follow|see|understand))\b/i;
    let why = null;
    for (const x of P) { const m = x.b.text.match(WHY); if (m) { why = { bi: x.bi, s: m.index, e: m.index + m[0].length, t: sentenceAround(x.b.text, m.index) }; break; } }
    items.push(Object.assign({ id: 'why', label: 'Says why it was written (a personal case)', state: why ? 'pass' : 'judge', note: why ? why.t : 'No "why I wrote this" found. Needed when the piece is your own case.', src: 'dWhy' }, why ? { b: why.bi, s: why.s, e: why.e } : {}));
    return items;
  }

  /**
   * A pasted draft, start to finish.
   * @param {string} src @param {{register?:string, guest?:boolean, links?:string[]}} [opts]
   */
  function checkText(src, opts) {
    JARGON_SEEN = {};
    const blocks = parseText(src);
    const r = check(blocks, opts);
    return Object.assign(r, { blocks });
  }
  /** @param {Block[]} blocks @param {{register?:string, guest?:boolean, links?:string[]}} [opts] */
  function checkBlocks(blocks, opts) { JARGON_SEEN = {}; return check(blocks, opts); }

  /** Blocks back to readable Markdown: what the reviewer panel reads. @param {Block[]} blocks */
  function blocksToText(blocks) {
    const out = [];
    let meta = 0;
    for (const b of blocks) {
      if (b.kind === 'meta') out.push((meta++ ? 'Description: ' : 'Page title: ') + b.text);
      else if (b.kind === 'title') out.push('# ' + b.text);
      else if (b.kind === 'h') out.push('#'.repeat(Math.min(6, Math.max(2, b.level || 2))) + ' ' + b.text);
      else if (b.kind === 'li') out.push('- ' + b.text);
      else if (b.kind === 'quote') out.push('> ' + b.text);
      else if (b.kind === 'cap') out.push('Caption: ' + b.text);
      else if (b.kind === 'cell') out.push('| ' + b.text);
      else out.push(b.text);
    }
    return out.join('\n\n');
  }
  /** A short fingerprint of a text (FNV-1a), so the screen can tell a panel read an older version. @param {string} s */
  function hashText(s) {
    let h = 0x811c9dc5;
    const t = String(s).replace(/\s+/g, ' ').trim();
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }

  return { REGISTERS, LEVELS, LAYERS, SOURCES, RULES, parseText, htmlToBlocks, extractBlocks, registerForPath, splitSentences, check: checkBlocks, checkText, looksFake, blocksToText, hashText, decode };
}));
