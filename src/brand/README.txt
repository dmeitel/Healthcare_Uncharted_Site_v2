HEALTHCARE UNCHARTED — BRAND KIT

Colors:
  HU Blue (print)      #1B5FA8
  Blue (dark UI)       #3585cc
  HU Teal (mark)       #4ECDC4
  Teal (text)          #2FA79E
  Dark                 #0d1117
  Clinical White       #F6F9FC
Font: Poppins Bold (wordmark is outlined in the SVGs — no font needed).

LOGOS
  hu-logo(.svg/.png)             stacked lockup, light bg
  hu-logo-dark                   stacked lockup, dark bg
  hu-logo-inline / -dark         single-line lockup
  hu-wordmark / -dark            text only
MARK
  hu-mark                        hex tile, white interior (app icon)
  hu-mark-dark                   dark background version
  hu-mark-outline                transparent interior
  hu-monogram / -white           HU only
FAVICONS / APP ICONS
  favicon.svg, favicon.ico, favicon-16/32/48.png
  apple-touch-icon.png (180), icon-192.png, icon-512.png
SOCIAL
  og-image.png (1200x630)        link previews / OpenGraph
  social-square.png (1200x1200)  profiles / Instagram
ATLAS
  hu-atlas-core                  compass core node (/atlas/)
  hu-compass-hero                compass without label (landing hero)

SVGs are resolution-independent — use them wherever possible.

WEB/ (implementation helpers)
  head-tags.html      paste into your <head> (adjust /brand/ path)
  site.webmanifest    PWA manifest
  brand.css           color tokens + compass-button + marker helper classes
  hu-compass-button.svg/.png   the landing-page compass button graphic

MARKERS/ (directional compass nodes — built to core spec)
  hu-node-n / -e / -s / -w   one compass point filled (flat-base split, like the core),
                             the other three hollow; hub hex caps the point bases
  hu-node-rest               all four hollow (resting)   hu-node-all  all four filled
  each has a -dark twin.  markers/png/ holds 256px rasters; SVGs are the master.
