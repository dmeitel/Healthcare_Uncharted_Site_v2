/**
 * The contents and the section folds (2026-10-21; src/assets/js/reading-contents.js, THE CONTENTS block in hu-global.css).
 * David: "if the page is loaded on a computer or larger screen i want it to have a scrolling contents bar similar to how
 * WIKIs work ... I also want some sort of colasapble section or at least make it smaller for phone readers. this is a
 * standard i want to apply to learn modules and rounds articles going forward."
 * A page turns it on with `contents: true`; the script builds the list and the folds from the page's own sections, so a
 * page is held to having sections it can read: each one a section with an id, straight inside .hu-read-body, with an h2.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const front = (t) => (t.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [, ''])[1];
const ON = walk(SRC).filter((f) => /\.(?:html|njk|md)$/.test(f) && /^contents:\s*true\s*$/m.test(front(fs.readFileSync(f, 'utf8'))));

test('base.njk loads the contents script on a page that asks for it', () => {
  const base = fs.readFileSync(path.join(SRC, '_includes', 'base.njk'), 'utf8');
  // any page with `contents: true` (the guard on section went 2026-10-22, when the fracture post took the contents while
  // it was still a draft in the secret menu; it moved to Rounds the same day)
  assert.match(base, /\{% if contents %\}<script src="\/assets\/js\/reading-contents\.js\?v=\d+" defer><\/script>\{% endif %\}/);
  // after reading.js, so "Continue reading" finds window.HUContents when it lands
  assert.ok(base.indexOf('reading-contents.js') > base.indexOf('/assets/js/reading.js'));
});

test('every page with contents is a Learn module or a Rounds article with sections the list can read', () => {
  assert.ok(ON.length >= 2, 'the AI and standard work module and A Routine Fracture turn it on');
  for (const f of ON) {
    const t = fs.readFileSync(f, 'utf8');
    const rel = path.relative(SRC, f).split(path.sep).join('/');
    if (t.includes('class="rounds-post"')) {
      // a Rounds article is flat: the script makes a section of each kicker and h2, so every h2 carries a stable address
      const art = t.slice(t.indexOf('<article class="rounds-post"'), t.indexOf('</article>'));
      const h2s = [...art.matchAll(/<h2\b([^>]*)>/g)];
      assert.ok(h2s.length >= 3, rel + ': three headings or more');
      const ids = h2s.map((m) => (m[1].match(/\bid="([^"]+)"/) || [])[1]);
      assert.ok(ids.every(Boolean), rel + ': every h2 has an id, so a link to it lasts');
      assert.strictEqual(new Set(ids).size, ids.length, rel + ': no two headings share an id');
      for (const [, block] of art.matchAll(/<div\b([^>]*\bdata-toc="[^"]+"[^>]*)>/g)) assert.match(block, /\bid="[^"]+"/, rel + ': a block with its own entry has an id');
      continue;
    }
    assert.match(front(t), /^section:\s*learn\s*$/m, rel + ': a Learn module');
    const body = t.slice(t.indexOf('class="hu-read-body"'));
    assert.ok(t.includes('class="hu-read-body"'), rel + ': the shared reading body holds the sections');
    const secs = [...body.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)];
    assert.ok(secs.length >= 3, rel + ': three sections or more, each with an id');
    for (const [, id, inner] of secs) assert.match(inner, /<h2\b/, rel + ' #' + id + ': an h2 to name it');
    assert.strictEqual(new Set(secs.map((m) => m[1])).size, secs.length, rel + ': no two sections share an id');
  }
});

test('a Rounds article keeps its column: the rail hangs in the margin from 1300 and a wide block starts beside it', () => {
  const css = fs.readFileSync(path.join(SRC, 'assets', 'css', 'hu-global.css'), 'utf8');
  assert.match(css, /@media \(min-width:1300px\) and \(min-height:501px\) \{[\s\S]*?\.rounds-post > \.hu-toc \{ position:absolute;[^}]*right:calc\(100% \+ 8px\)/);
  // the rail stays on every view (David, 2026-10-22: "the contents bar diseapears when i go through the different tabs")
  assert.match(css, /\.rounds-post\.has-toc \[data-wide\] \{ width:min\(1120px, calc\(50vw \+ 324px\)\); margin-left:-8px; \}/);
  assert.doesNotMatch(css, /hu-toc--yield/);
  // past rounds.css's numbered list and teal links, in both themes
  assert.match(css, /\.rounds-post \.hu-toc-list li::before \{ content:none; \}/);
  assert.match(css, /\[data-theme="light"\] \.rounds-post \.hu-toc \.hu-toc-a \{ color:var\(--t2\); \}/);
  const js = fs.readFileSync(path.join(SRC, 'assets', 'js', 'reading-contents.js'), 'utf8');
  assert.match(js, /matchMedia\(flat \? '\(min-width:1300px\) and \(min-height:501px\)' : '\(min-width:1100px\) and \(min-height:501px\)'\)/);
  assert.doesNotMatch(js, /hu-toc--yield/, 'nothing hides the rail');
});

test('the list marks the section you are in with brass, and a phone folds the sections in the site\'s fold', () => {
  const css = fs.readFileSync(path.join(SRC, 'assets', 'css', 'hu-global.css'), 'utf8');
  assert.match(css, /\.hu-toc-a\[aria-current\] \{[^}]*border-left-color:var\(--brass\)/);
  assert.match(css, /@media \(min-width:1100px\) and \(min-height:501px\) \{\s*\.hu-read-body\.has-toc/);
  const js = fs.readFileSync(path.join(SRC, 'assets', 'js', 'reading-contents.js'), 'utf8');
  assert.match(js, /matchMedia\('\(max-width:699px\), \(max-height:500px\)'\)/, 'a phone is the shorter side of the screen');
  assert.match(js, /document\.createElement\('details'\)/, 'a fold is a <details>, the site\'s one fold');
  assert.match(js, /setAttribute\('aria-current', 'location'\)/);
  assert.doesNotMatch(js, /localStorage|fetch\(/, 'the contents store and send nothing');
});

test('on a phone the views dock carries the contents: it names the part you are in and opens the outline', () => {
  // David, 2026-10-22, of the fracture draft on his phone: "the phone navigation is also really bad"; its story ran 17
  // screens under a bar that said "Story 1 of 4" the whole way, and the phone had no contents at all
  const rc = fs.readFileSync(path.join(SRC, 'assets', 'js', 'reading-contents.js'), 'utf8');
  assert.match(rc, /dispatchEvent\(new CustomEvent\('hu-contents'/, 'the contents say when the part you are in changes');
  for (const fn of ['outline', 'here', 'go']) assert.ok(rc.includes('    ' + fn + ': function'), 'HUContents.' + fn);
  const hv = fs.readFileSync(path.join(SRC, 'assets', 'js', 'hu-views.js'), 'utf8');
  assert.match(hv, /toggle\(C\(\) \? 'contents' : 'list'\)/, 'the dock\'s name opens the contents when the page has them');
  assert.match(hv, /document\.addEventListener\('hu-contents', label\)/, 'and follows the part you are in');
  assert.match(hv, /classList\.toggle\('solo', solo\)/, 'and stays outside the views as the name alone');
  const css = fs.readFileSync(path.join(SRC, 'assets', 'css', 'hu-global.css'), 'utf8');
  assert.match(css, /\.hu-vdock\.solo \.step, \.hu-vdock\.solo \.lay \{ display:none; \}/);
  for (const f of ON) {
    const t = fs.readFileSync(f, 'utf8');
    if (!/HUViews\.dock\(/.test(t)) continue;
    assert.match(t, /contents: true[^)]*\}\)/, path.relative(SRC, f) + ': a page with contents and a dock hands the dock its contents');
  }
});

test('a page can make the dock its phone switch: every view a tab, the page\'s own switch stepping aside', () => {
  // David, 2026-10-22: "selection the arrows from the bottem bar shoots you back to the top and not just moves you to the
  // differnt tab, maybe the bottom should just keep the tabs there instead of in the body like the web versions"
  const hv = fs.readFileSync(path.join(SRC, 'assets', 'js', 'hu-views.js'), 'utf8');
  assert.match(hv, /o\.row\.classList\.add\('hu-vrow-bar'\)/, 'the page\'s switch is marked to step aside');
  assert.match(hv, /var y = i === c \? 0 : \(mem\[i\] \|\| 0\);/, 'a tab lands where you left its view, the current tab at its top');
  const css = fs.readFileSync(path.join(SRC, 'assets', 'css', 'hu-global.css'), 'utf8');
  // stepped aside, never display:none: the phone gate walks hidden views through a switch it can see, and a keyboard
  // landing in it brings it back
  assert.match(css, /\.hu-vrow-bar:not\(:focus-within\) \{ height:1px;[^}]*clip-path:inset\(50%\)/);
  assert.doesNotMatch(css, /\.hu-vrow-bar[^{]*\{[^}]*display:none/);
  assert.match(css, /\.hu-vdock\.bar \.seg button \{[^}]*min-width:min-content/, 'a tab is never narrower than its longest word');
  const page = fs.readFileSync(path.join(SRC, 'rounds', 'a-routine-fracture', 'index.html'), 'utf8');
  assert.match(page, /contents: true, bar: true \}\)/, 'the fracture post asks for the bar');
});
