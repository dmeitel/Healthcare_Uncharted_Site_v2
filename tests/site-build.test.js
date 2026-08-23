/**
 * Whole-site build integrity. Runs against _site/, so it checks what actually ships:
 * every page parses, every link resolves, the house voice and accessibility floors
 * hold, and no tool has drifted back off the shared kit.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const built = fs.existsSync(SITE);

const walk = d => fs.readdirSync(d, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const rel = f => path.relative(SITE, f).replace(/\\/g, '/');
const read = f => fs.readFileSync(f, 'utf8');

const EM_DASH = '—';

/** real pages only: fragments have no <html>, redirect stubs bounce on load */
function realPages(all) {
  return all.filter(f => f.endsWith('.html')).filter(f => {
    const h = read(f);
    return /<html/i.test(h) && !/http-equiv="refresh"|location\.replace\(/i.test(h);
  });
}

const inlineScripts = h => [...h.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(m => !/src=/.test(m[1]) && !/application\/(ld\+)?json/.test(m[1]))
  .map(m => m[2]).filter(s => s.trim());

test('site build', { skip: built ? false : 'run the build first' }, async t => {
  const all = walk(SITE);
  const pages = realPages(all);

  await t.test('every inline script parses', () => {
    const bad = [];
    for (const p of pages) {
      for (const s of inlineScripts(read(p))) {
        try { new vm.Script(s); } catch (e) { bad.push(rel(p) + ': ' + e.message.slice(0, 60)); break; }
      }
    }
    assert.deepEqual(bad, []);
  });

  await t.test('every inline stylesheet balances its braces', () => {
    const bad = [];
    for (const p of pages) {
      const css = [...read(p).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('');
      let d = 0;
      for (const c of css) { if (c === '{') d++; if (c === '}') d--; }
      if (d !== 0) bad.push(rel(p) + ' depth ' + d);
    }
    assert.deepEqual(bad, []);
  });

  await t.test('every JSON-LD block is valid JSON', () => {
    const bad = [];
    for (const p of pages) {
      for (const m of read(p).matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
        try { JSON.parse(m[1]); } catch { bad.push(rel(p)); }
      }
    }
    assert.deepEqual(bad, []);
  });

  await t.test('every internal link and asset resolves', () => {
    const exists = u => {
      const clean = u.split('#')[0].split('?')[0];
      if (!clean || clean === '/') return fs.existsSync(path.join(SITE, 'index.html'));
      const base = path.join(SITE, clean);
      return fs.existsSync(base) || fs.existsSync(base + '.html') || fs.existsSync(path.join(base, 'index.html'));
    };
    const broken = new Set();
    for (const p of pages) {
      const h = read(p);
      const urls = [...[...h.matchAll(/href="(\/[^"]*)"/g)], ...[...h.matchAll(/src="(\/[^"]*)"/g)]].map(m => m[1]);
      for (const u of new Set(urls)) if (!u.startsWith('//') && !exists(u)) broken.add(u);
    }
    assert.deepEqual([...broken], []);
  });

  await t.test('no em dashes reach the reader', () => {
    // house rule (CLAUDE.md, ALWAYS TRUE). Code comments are not prose.
    const inProse = pages.filter(p => read(p)
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>/g, ' ')
      .includes(EM_DASH)).map(rel);
    assert.deepEqual(inProse, []);

    const inHead = pages.filter(p => {
      const h = read(p);
      const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
      const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
      return (title + desc).includes(EM_DASH);
    }).map(rel);
    assert.deepEqual(inHead, []);
  });

  await t.test('no banned vocabulary in rendered copy', () => {
    const banned = ['delve', 'straightforward', 'navigating the complexities', 'at the intersection of'];
    const hits = [];
    for (const p of pages) {
      const text = read(p).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').toLowerCase();
      for (const b of banned) if (text.includes(b)) hits.push(rel(p) + ':' + b);
    }
    assert.deepEqual(hits, []);
  });

  await t.test('every page carries a title, a description, and one brand suffix', () => {
    const noTitle = [], noDesc = [], doubled = [];
    for (const p of pages) {
      const h = read(p);
      const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
      if (!title || !title.trim()) noTitle.push(rel(p));
      else if ((title.match(/Healthcare Uncharted/g) || []).length > 1) doubled.push(rel(p));
      if (!/<meta name="description"/.test(h)) noDesc.push(rel(p));
    }
    assert.deepEqual(noTitle, [], 'title');
    assert.deepEqual(noDesc, [], 'description');
    assert.deepEqual(doubled, [], 'the layout already appends the brand');
  });

  await t.test('accessibility floors: an h1, alt text, named links', () => {
    const noH1 = [], noAlt = [], unnamed = [];
    for (const p of pages) {
      const h = read(p);
      if (!(h.match(/<h1[\s>]/g) || []).length) noH1.push(rel(p));
      for (const m of h.matchAll(/<img([^>]*)>/g)) if (!/alt=/.test(m[1])) noAlt.push(rel(p));
      for (const m of h.matchAll(/<a([^>]*)>([\s\S]{0,40}?)<\/a>/g)) {
        const inner = m[2].replace(/<[^>]+>/g, '').trim();
        if (!inner && !/aria-label|aria-labelledby|title=/.test(m[1]) && !/<(img|svg|i )/.test(m[2])) unnamed.push(rel(p));
      }
    }
    assert.deepEqual(noH1, [], 'every page needs a heading');
    assert.deepEqual([...new Set(noAlt)], []);
    assert.deepEqual([...new Set(unnamed)], []);
  });

  await t.test('no tool has drifted back off the shared kit', () => {
    // A tool's JS lives in its page template until it is migrated to a module
    // (docs/HU-BUILD-HARDENING-2026-08-22.md), so read the template PLUS whatever
    // module it loads. Otherwise migrating a tool would silently skip these checks.
    const TOOL_DIRS = {
      atlas: 'src/atlas/index.njk',
      'iceberg-map': 'src/tools/iceberg-map/index.njk',
      'vendor-directory': 'src/tools/vendor-directory/index.html',
      'career-tree': 'src/tools/career-tree/index.njk',
      'hospital-map': 'src/tools/hospital-map/index.html',
      'multi-lens-map': 'src/tools/multi-lens-map/index.njk',
      'operators-map': 'src/tools/operators-map/index.html'
    };
    const sourceOf = name => {
      let text = read(path.join(ROOT, TOOL_DIRS[name]));
      const mod = path.join(ROOT, 'src', 'assets', 'js', 'tools', name + '.js');
      if (fs.existsSync(mod)) text += '\n' + read(mod);
      return text;
    };
    const tools = Object.keys(TOOL_DIRS);

    const handRolled = tools.filter(t => /clientWidth\s*-\s*pop\.offsetWidth/.test(sourceOf(t)));
    assert.deepEqual(handRolled, [], 'popovers belong to HUKit.pop');

    const offKit = tools.filter(t => !/HUKit\.urlState\(/.test(sourceOf(t)));
    assert.deepEqual(offKit, [], 'URL state belongs to HUKit.urlState');

    // a kit call that resolves to nothing is a runtime ReferenceError in production
    const kitSrc = read(path.join(ROOT, 'src', 'assets', 'js', 'hu-kit.js'));
    const exported = ((kitSrc.match(/window\.HUKit = \{([^}]*)\}/) || [])[1] || '')
      .split(',').map(x => x.split(':')[0].trim()).filter(Boolean);

    for (const p of pages) {
      const js = inlineScripts(read(p)).join('\n');
      const used = new Set([...js.matchAll(/HUKit\.(\w+)\s*\(/g)].map(m => m[1]));
      const unknown = [...used].filter(u => !exported.includes(u));
      assert.deepEqual(unknown, [], rel(p) + ' calls something the kit does not export');
      if (used.size) {
        const h = read(p);
        const kitAt = h.indexOf('hu-kit.js');
        const firstUse = h.search(/HUKit\.\w+\s*\(/);
        assert.ok(kitAt > -1 && kitAt < firstUse, rel(p) + ' must load the kit before using it');
      }
    }
  });

  await t.test('every control is a control', () => {
    // A click handler on a <div> or <span> is a mouse-only control: no Tab stop, no
    // Enter, no Space, nothing announced. The whole site cleared this in the
    // 2026-08-22 pass, so this keeps it cleared. The pattern also reaches inside
    // inline template strings, which is where the tools build their markup.
    const INTERACTIVE = new Set(['button', 'a', 'input', 'select', 'summary', 'option', 'label', 'textarea']);
    const mouseOnly = [], unfocusable = [];
    for (const p of pages) {
      const h = read(p);
      for (const m of h.matchAll(/<([a-zA-Z][w-]*)([^>]*onclick=)/g)) {
        if (!INTERACTIVE.has(m[1].toLowerCase())) mouseOnly.push(rel(p) + ': <' + m[1] + '>');
      }
      // ARIA can stand in for a real button, but only with a Tab stop to go with it
      for (const m of h.matchAll(/<([a-zA-Z][w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?role=["']button["'][^>]*)>/g)) {
        if (m[1].toLowerCase() !== 'button' && !/tabindex=/.test(m[2])) {
          unfocusable.push(rel(p) + ': <' + m[1] + '>');
        }
      }
    }
    assert.deepEqual([...new Set(mouseOnly)], [], 'click handlers belong on real controls');
    assert.deepEqual([...new Set(unfocusable)], [], 'role="button" needs tabindex');
  });

  await t.test('shipped data files are valid JSON', () => {
    const dataDir = path.join(SITE, 'assets', 'data');
    if (!fs.existsSync(dataDir)) return;
    const bad = [];
    for (const f of walk(dataDir).filter(x => x.endsWith('.json'))) {
      try { JSON.parse(read(f)); } catch (e) { bad.push(rel(f) + ': ' + e.message.slice(0, 40)); }
    }
    assert.deepEqual(bad, []);
  });
});
