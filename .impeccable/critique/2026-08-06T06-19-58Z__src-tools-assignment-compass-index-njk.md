---
target: Assignment Compass tool
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-06T06-19-58Z
slug: src-tools-assignment-compass-index-njk
---
Method: dual-agent (A: isolated design review · B: isolated detector evidence) · run 2, post-optimization

# Critique: Assignment Compass (run 2)

Heuristics 32/40 (status 3, real-world 4, control 3, consistency 3, error-prevention 2, recognition 4, flexibility 4, minimalist 3, recovery 2, help 4). Verdict: AUTHORED, decisively. Cognitive load 7/8. Peak-end: STRONG (the negotiation card ending works).

CONFIRMED FIXED from run 1: money-control touch floor, sheet a11y (inert/focus/aria-expanded/backGuard), reset undo, bar chart three-rail geometry (collision structurally impossible, verified to 8-digit deltas).

NEW FINDINGS:
- [P0] num() is bare parseFloat: "85,000" computes as $85/yr, "1,500" housing as $1/mo, silently. Worst failure class on a negotiation-number tool.
- [P1] Preset taps destroy typed scenarios with no snapshot (reset got the undo; presets did not).
- [P1] drawShareCard ignores dirty/activePreset: a sourced-looking HU JPEG of example numbers can circulate unmarked.
- [P2] New under-floor touch targets: .ac-dl (~38px), .ac-undo (~34px, the recovery path), .ac-assume summary (~20px); tool floor keys on width while kit floor keys on pointer, so wide tablets miss both.
- [P2] Stale preset chip: markDirty nulls activePreset but leaves .on/aria-pressed lying.
- [Bug] .ac-sticky[hidden] loses to author display:flex: empty blurred strip shows at boot.
- [A11y] Both county selects labeled identically "County (optional)"; dialog aria-modal=false with no focus trap.
- Minor: 52-week annualization undisclosed; county-fetch failure leaves selects disabled silently; 11.5/12.5px sizes live in a type-ramp gap (systemic); .ac-dl 20px radius off the ladder; teal is now a two-signal system (blue=current/teal=assignment) vs the One Signal Rule (doctrine question).

Detector run 2: 35 findings, majority screened FP against DESIGN.md prose ranges; real residue = radius 20px/2px, the 11.5/12.5 gap sizes, 30px breakeven literal. Zero tool-authored em dashes. 5/5 scripts parse. Browser step skipped (no automation).

Questions: copy-the-ask button (clipboard beats JPEG for the actual call); dollar-precision output vs guessed inputs (round to $25 with ≈?); "current" as a neutral baseline slot for true offer-vs-offer.
