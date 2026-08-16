---
paths:
  - "src/**/*.njk"
  - "src/**/*.html"
  - "src/_includes/**/*"
---

# Templates

- Card blurbs are written to fit, then clamped with CSS line-clamp. Never let
  a string truncate with a raw ellipsis in the template (no `| truncate(n)`
  on visible card text).
- Paired dark/light assets: one carries real alt text, the other gets an
  empty alt and aria-hidden true. If the pair sits inside a labeled link,
  both alts are empty; the link's aria-label is the accessible name.
- The h1 carries meaning. "About" is a nav label, not a heading.
- Icon-only controls get an accessible name that stays accurate when state
  changes.
- The shared layout is src/_includes/base.njk; component partials live in
  src/_includes/components/. A defect fixed in a partial beats the same fix
  repeated on every page.
- Do NOT use Eleventy passthrough copy on directories that contain processed
  Nunjucks templates (frontmatter renders as text — documented failure).
