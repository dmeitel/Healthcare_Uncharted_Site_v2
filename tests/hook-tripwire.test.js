/**
 * A HOOK TRIPWIRE (2026-10-11, the Ideas card "Free GitHub protections, and a hook tripwire", David's Yes).
 *
 * A hook in .claude/settings.json runs a command on David's computer every time Claude starts or edits a file. The repo
 * is public, so a change to that file is the cheapest way for someone else's code to run there. This test lists every
 * hook the project means to have, by its exact command, and fails on anything else, in either settings file (the
 * local one is not in git, so in CI only the shared one is read). Adding a hook is fine; it just has to be added here
 * too, on purpose, in a commit David can see.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = ['.claude/settings.json', '.claude/settings.local.json'];
const IMPECCABLE = '[ ! -f "${CLAUDE_PROJECT_DIR}/.claude/skills/impeccable/scripts/hook.mjs" ] || node "${CLAUDE_PROJECT_DIR}/.claude/skills/impeccable/scripts/hook.mjs"';
/** the hooks this project means to have: event, then the exact command */
const KNOWN = [
  ['SessionStart', 'node "${CLAUDE_PROJECT_DIR}/scripts/session-open.js" --brief'],   // the window's open card
  ['PostToolUse', IMPECCABLE],                                                          // the design check on each edit
  ['Stop', IMPECCABLE],                                                                 // the design check at the end of a turn
];

function hooksIn(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return [];
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));
  const out = [];
  for (const [event, groups] of Object.entries(json.hooks || {})) {
    for (const g of groups || []) for (const h of g.hooks || []) out.push([event, h.type === 'command' ? h.command : h.type + ':' + JSON.stringify(h)]);
  }
  return out;
}

test('every hook in the project settings is one the project means to have', () => {
  const known = new Set(KNOWN.map(([e, c]) => e + '\u0000' + c));
  for (const file of FILES) {
    for (const [event, command] of hooksIn(file)) {
      assert.ok(known.has(event + '\u0000' + command), `${file} has a ${event} hook nobody listed in tests/hook-tripwire.test.js:\n  ${command}\nIf it is meant to be there, add it to KNOWN; if not, remove it and find out how it got in.`);
    }
  }
});

test('the shared settings still carry the open card', () => {
  assert.ok(hooksIn('.claude/settings.json').some(([e, c]) => e === 'SessionStart' && c === KNOWN[0][1]), 'the SessionStart hook that prints the open card');
});
