/**
 * The games' test hooks, as the Playwright scripts read them inside page.evaluate callbacks
 * (scripts/backend-check.js, scripts/backend-check-da.js, scripts/phone-qa.js). A game exposes
 * its hook only when the test flag is set before its script runs (.claude/rules/games.md,
 * "Tests"). Typed loosely on purpose: each engine owns the shape of what it exposes, and the
 * scripts only drive it. Added 2026-09-23 when `npm run check:scripts` joined `npm run verify`;
 * these five names were 96 of its 132 errors.
 */
interface Window {
  /** the hospital game (Uncharted General) */
  __ug: any;
  /** Device Assembly */
  __da: any;
  /** Alarm Fatigue */
  __af: any;
  /** set before the hospital game's script runs to ask for __ug */
  __UG_TEST: any;
  /** set before Device Assembly's script runs to ask for __da */
  __DA_HOOK: any;
  /** Vital Stats, the healthcare numbers game */
  __vs: any;
  /** set before Vital Stats' script runs to ask for __vs without skipping its start-up */
  __VS_HOOK: any;
}
