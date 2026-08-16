---
name: audit-scope-rules
description: Accepted/known-open items not to re-report, and audit conventions David expects
metadata:
  type: feedback
---

Do not re-report these on the Atlas (accepted or queued as of 2026-08-16):
- The 768px media block awaiting 699/1099 migration (queued).
- HUKit adoption + HUD backGuard (queued).
- Layers/routes/expansions not serialized into the URL (accepted for v1).
- The em dash in base.njk is David's call (per his memory index), so base-layout em dashes are out of scope; page-local copy is fair game.

**Why:** David tracks these himself; re-flagging burns his QA time.
**How to apply:** check the task brief's known-open list first; findings tables rank severity by READER impact, not fix ease; every finding needs an exact line or quote; never edit, never offer to fix. See [[defects-recurring]] for what to grep first.
