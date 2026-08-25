# Memory Index

- [Run ledger + breakpoint failure map](project_run_ledger.md) — Run 13 (2026-08-24): new /learn/request-routing/ page, ONE defect (.rr-topnav inherits global sticky `nav`, covers site nav on scroll-up; 1-line top:64px fix, precedent in 4ps/laws), all else PASS at 360/390/430
- [Test harness quirks](reference_test_harness_quirks.md) — block `**/.11ty/**`; downloads abort the running call (put them last); `html{scroll-behavior:smooth}` races every probe (use behavior:'instant'); bare `nav` element selector is sticky site-wide; getBBox lies on rotated SVG text; MapLibre points are canvas-relative (+64px on phone); no `setTimeout`/`globalThis` in the Node scope
