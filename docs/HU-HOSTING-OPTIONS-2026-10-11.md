# Hosting for Healthcare Uncharted: where to live long term

Asked by David on the Ideas tab, 2026-10-11 ("if we want the site to be large and responsive do we stay with netlify or is there better options... investigate options and give a more detailed list of options"). Researched the same day; Cloudflare's "free and unlimited" static requests confirmed again by Claude on its own docs page.

Decision report. Every price, limit and term below was read on the vendor's own page on 2026-10-11 unless it is marked UNVERIFIED. Sources are listed per vendor and again at the end.

## The short answer

1. LAUNCH MONTH (now to the end of October 2026): stay on Netlify. Turn on auto recharge today, delete the duplicate project, and make sure the usage emails reach an inbox you read. Do not move hosts three weeks before a launch. That one setting is what stands between a big day and a "Site not available" page.
2. NEXT YEAR: move the site to Cloudflare Workers (static assets). Static requests are free and unlimited there, at every traffic level in this report. The repo work is about a day, most of it mechanical. Keep Netlify as a stopped standby for a quarter.
3. IF IT REALLY GROWS (a million visitors a month): Cloudflare still costs $0 to $5 a month for the static site. The runner-up is Amazon CloudFront on a flat-rate plan, where an attack or a viral day never adds to the bill.

## How the costs were worked out

All the money columns use one traffic model, measured from the repo's own build.

- Built site today: 62 MB on disk, 625 files, 68 HTML pages, largest file 11.3 MB (`assets/data/derived/search-graph.json`), 48 MB of it under `/assets/data/`. (The brief said about 40 MB. It has grown.)
- I loaded 13 key pages from `_site` in a headless browser, recorded every same-origin file each one asked for, and gzipped each file to get the bytes Netlify actually sends. Cold first loads ranged from 82 KB (a Rounds post) to 572 KB (the Hospital Operations Map), average 201 KB, with 10 to 22 requests per page. The Atlas also pulls a 1.1 MB (gzipped) search graph when the page goes idle, and the maps load more data as you turn layers on.
- Planning figures, chosen on the heavy side: 0.5 MB and 13 requests per page view, 2 page views per visitor (an assumption; GoatCounter can give the real ratio), 10 production deploys a month (git history shows about 42 commits in 90 days, pushed in batches; GitHub Actions shows 3 push runs in the last 10 days). 1 GB = 1,000 MB.
- GoatCounter counts people, not bots. Netlify bills bots too, so real bandwidth is probably higher than this model. The Netlify Usage page will tell you the real number; check it before the launch.

| Scenario | Page views | Data sent | Requests |
|---|---|---|---|
| Today (2,182 views in 90 days) | about 727 a month | 0.36 GB a month | about 9,450 a month |
| One 10,000-visitor launch day | 20,000 that day | 10 GB that day | 260,000 that day |
| 100,000 visitors a month | 200,000 a month | 100 GB a month | 2.6 million a month |
| 1,000,000 visitors a month | 2,000,000 a month | 1,000 GB a month | 26 million a month |
| A bot flood day (a real Netlify Personal user, forum post of 2026-07-20) | n/a | 33.5 GB that day | 467,966 that day |

## Comparison table 1: monthly cost and what a spike does

| Option | Today | One 10k-visitor day | 100k visitors/month | 1M visitors/month | What happens on a spike |
|---|---|---|---|---|---|
| Netlify Personal, auto recharge OFF (today's setup) | $9 | $9 (uses 252 of 1,000 credits) | PAUSED (needs 2,670 credits) | PAUSED | At zero credits every project on the team pauses and forms are refused |
| Netlify Personal, auto recharge ON | $9 | $9, or $14 if it tips you over | $29 | about $254 | Buys 500 credits for $5 each time it runs out. No stated cap, no hard spend limit |
| Netlify Pro | $20 | $20 | $20 | about $170 | 3,000 credits included; auto recharge buys 1,500 for $10 |
| Cloudflare Workers static assets (Free) | $0 | $0 | $0 | $0 | Static requests are free and unlimited. Only Worker code (form, per diem) counts against 100,000 a day |
| Cloudflare Pages (Free) | $0 | $0 | $0 | $0 | Same rule for static requests. Cloudflare now says to start new projects on Workers |
| Vercel Hobby | $0 | $0 (a quarter of the month's request cap in one day) | PAUSED for 30 days | not possible | Over a Hobby limit, you wait until 30 days have passed |
| Vercel Pro with Flat Rate CDN | $20 | $20 | $40 | $120 | A spike inside a month is not billed; a sustained higher month moves you up a tier next cycle |
| GitHub Pages | $0 public repo; private needs GitHub Pro (price UNVERIFIED) | $0 | $0, right at the 100 GB soft limit | not allowed | GitHub may stop serving, rate limit (429) or email you |
| AWS Amplify Hosting | $0 | $0 to $1.50 | $12.75 to $15 | $148 to $150 | Billed per GB, no cap |
| S3 + CloudFront, flat-rate plan | $0 (Free plan) | $0 | $0 the first time (a first spike up to 3x is absorbed), then $15 (Pro) | $200 (Business) | No overage charges ever; if you stay far over for months, delivery "might be adjusted" |
| S3 + CloudFront, pay as you go | $0 | $0 | $0 | about $16 | Billed, no cap, but 1 TB and 10 million requests a month are free |
| Azure Static Web Apps Free | $0 | $0 | at the 100 GB cap | not possible | Over 100 GB "we will not be able to serve your site" |
| Azure Static Web Apps Standard | $9 | $9 | $9 | $189 | $0.20 per GB over 100 GB |
| Firebase Hosting, Spark (free) | $0 | site DISABLED until next month after a short grace period | not possible | not possible | Hard stop |
| Firebase Hosting, Blaze | $0 | $0 | $13.50 | $148.50 | Billed per GB, no cap found |
| Render static site, Hobby, card on file | $0 | $0.75 | $14.25 | $149.25 | Billed per GB; with no card, services spin down until next month |
| Bunny CDN + Bunny Storage | $1 (minimum) | $1 | $1 | $10 | Prepaid. A negative balance disables the account unless auto recharge is on |

## Comparison table 2: what each one can do for this repo

| Option | Security headers (CSP, HSTS, etc.) | 301 redirects | Email signup form | The per diem function | Builds and private repo | Commercial use | Effort to move |
|---|---|---|---|---|---|---|---|
| Netlify | `netlify.toml`, in use | `netlify.toml`, in use | Netlify Forms, free and unlimited on credit plans | Netlify Functions, metered as compute | 15 credits per production deploy, previews free; personal private repos work (older forum post), org-owned private repos need Pro | No restriction found in the Terms of Use (subscription agreement not read, UNVERIFIED) | None |
| Cloudflare Workers / Pages | `_headers` file: 100 rules, 2,000 characters per line (the CSP is 721) | `_redirects` file: 2,000 static + 100 dynamic, 301 and `:splat` supported | None built in. A small Worker route storing to D1 or KV | A Worker route, same path | Workers Builds 3,000 minutes a month free; Pages 500 builds a month free; private repos not stated outright (UNVERIFIED), and deploying from GitHub Actions avoids the question | No free-plan commercial restriction found. CDN terms limit serving video and "a disproportionate percentage" of large files outside paid services such as the Developer Platform | Medium, about a day. DNS has to move to Cloudflare |
| Vercel | `vercel.json` | `vercel.json` | None built in | Vercel Function | Hobby builds included, Pro builds per minute from the $20 credit; personal repos supported (private not spelled out on the page I read, UNVERIFIED) | Hobby is non-commercial, but "Asking for Donations does not fall under commercial usage" | Medium |
| GitHub Pages | NONE. CSP only as a meta tag, where `frame-ancestors` is ignored; X-Frame-Options, HSTS, nosniff, Permissions-Policy are lost | None. Meta-refresh stub pages only | None | None | GitHub Actions; a private repo needs a paid plan | "not intended for or allowed to be used as a free web-hosting service to run your online business" | High, and it weakens security |
| AWS Amplify | `customHttp.yml` in the repo | Console rules (forward query strings on 301) | None | Lambda | 1,000 build minutes free, then $0.01 a minute | Allowed | Medium to high |
| S3 + CloudFront | Response headers policy | CloudFront Function (code) | None | Lambda | You write the GitHub Actions deploy | Allowed | High |
| Azure Static Web Apps | `staticwebapp.config.json` | Same file | None | Managed Azure Functions | GitHub Actions | Free plan labeled "for personal projects", no explicit ban | Medium |
| Firebase Hosting | `firebase.json` | `firebase.json`, 301 supported | None | Cloud Functions (Blaze only) | GitHub Actions | Allowed | Medium |
| Render static site | `render.yaml` `headers` | `render.yaml` `routes` | None | None on a static site | 500 pipeline minutes on Hobby | Hobby pitched at personal projects (UNVERIFIED) | Medium |
| Bunny | Edge Rules (dashboard) | Edge Rules | None | Edge Scripting (pricing UNVERIFIED) | You write the GitHub Actions upload | Allowed | High |

## What the site actually depends on (read from the repo)

These are the pieces any move has to carry. File paths are in the repo at `C:\Users\david\Documents\Healthcare_Uncharted_Site`.

- `netlify.toml` build command is `npm install && node node_modules/@11ty/eleventy/cmd.cjs`. It does NOT run `npm run build`; the data scripts run on David's computer and their output is committed.
- Five header blocks: the enforced CSP (721 characters), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Robots-Tag, plus Cache-Control rules for `/assets/data/*`, `/assets/images/*`, `/brand/*` and `/assets/css/*`.
- Fifteen 301 redirects with splats. The comments rely on Netlify forwarding query strings, so room invites (`?room=ABCD`) and wall links (`?wall=day:...`) survive the Vital Stats and Device Assembly moves.
- Netlify Forms: the Field Notes signup in `src/_includes/base.njk` (`data-netlify="true"`, a honeypot, action `/thanks/`). The CSP's `form-action 'self'` means the form can only post to this domain.
- A Netlify Function the brief did not mention: `netlify/functions/perdiem.js`, called by `src/assets/js/tools/assignment-compass.js` at `/.netlify/functions/perdiem`, using a `GSA_API_KEY` env var. The Cost of Living tool already falls back to the standard rate if it fails.
- `COMMIT_REF` feeds `src/_data/build.js`, which writes `/version.txt`; `scripts/ship.js --live` reads it to know when the push is live.
- The repo's own checks treat `netlify.toml` as the single source of truth: `scripts/lib/old-pages.js` reads its redirect list, `tests/backend-host.test.js` reads the CSP's connect-src, `tests/hub.test.js` reads it too. Any move should KEEP `netlify.toml` and generate the other host's files from it at build time. Then none of those checks change.
- DNS is at Namecheap (`pdns1/pdns2.registrar-servers.com`). The apex points at Netlify's 75.2.60.5, `www` is a CNAME to Netlify. The domain also uses Namecheap's free email forwarding (MX `eforward1` to `eforward5`, plus an SPF record). Namecheap says that forwarding "is available for all the domains pointed to our BasicDNS, PremiumDNS, or FreeDNS systems", so moving nameservers elsewhere turns it off unless it is replaced.
- GitHub Actions (`.github/workflows/verify.yml`) runs the verify gate on push and the Supabase keep-awake daily, about a minute each. If the repo goes private, those minutes count against the free 2,000 a month on GitHub Free. Estimated use is 40 to 60 minutes a month, so going private costs nothing there.

Supabase (game relay) and GoatCounter stay where they are under every option. A host move does not change their limits.

## Netlify (stay)

What it costs. Free 300 credits, Personal $9 for 1,000, Pro $20 for 3,000 with unlimited members. Credits: production deploy 15, bandwidth 20 per GB, web requests 2 per 10,000, compute 10 per GB-hour. Deploy Previews and branch deploys use no deploy credits, failed deploys and rollbacks are free, and forms are "free and unlimited for all credit-based plans". Build minutes are not metered.

What happens at zero. "Once your credit balance is completely used up, all of your web projects (sites/apps) are paused and visitors to your web projects will find a `Site not available` page." Deploys stop, and the projects "cannot receive new web requests or form submissions."

How to never pause:
- Auto recharge, off by default, Team Owner only, applies to the whole team. Personal: 500 credits for $5 as needed. Pro: 1,500 credits for $10. Credits bought this way roll over. No cap is mentioned anywhere I could find.
- Usage emails and in-app notices at 50%, 75%, 90% and 100% of the monthly credits are on by default. Pro can also send them to Slack.
- There is no hard spend limit. Netlify's own FAQ answer to that question suggests staying on Free, leaving auto recharge off, or disabling a project. So the choice on Netlify is pause OR uncapped bill. You cannot have a ceiling that keeps the site up.
- Limiting abuse: basic Firewall Traffic Rules (block by IP or country) are on all plans. Code rate-limit rules are allowed on all plans (2 per project on Personal, 5 on Pro), set on `[[redirects]]` entries in `netlify.toml`. Whether a rate limit on a rewrite of `/assets/data/*` would protect the big data files is UNVERIFIED; test it before trusting it. Netlify's docs do not say whether bot or blocked traffic is billed.

The arithmetic.
- Today: 0.36 GB x 20 = 7 credits, 9,450 requests = 2 credits, 10 deploys x 15 = 150 credits. About 160 credits, $9. Every extra Netlify project that builds on each push costs another 15 credits per push on whichever team owns it, which is why the duplicate should go.
- One 10,000-visitor day: 10 GB x 20 = 200, plus 260,000 requests = 52. That is 252 credits for the day. Personal holds about three of those days on top of a normal month.
- Monthly, the model is 150 + 0.0126 credits per page view. Personal's 1,000 credits run out at about 67,000 page views, roughly 34,000 visitors a month. Pro's 3,000 run out at about 226,000 page views, roughly 113,000 visitors.
- 100,000 visitors a month: 2,000 + 520 + 150 = 2,670 credits. Personal plus four $5 packs = $29. Pro = $20.
- 1,000,000 visitors a month: 20,000 + 5,200 + 150 = 25,350 credits. Personal needs 49 packs, $254. Pro needs 15 packs of 1,500, $170.
- The bot flood day from the forum: 33.5 x 20 = 670, plus 467,966 requests = 94. About 764 credits in one day. On Personal with auto recharge off, that day plus a normal month pauses the site. With it on, it costs about $5.
- Pro becomes the cheaper plan once a month passes roughly 2,000 credits, about seven launch-size days in one month.

The tail risk is real but rare. In 2024 a Netlify free-plan site was billed about $104,500 after a DDoS, later waived after it went public. That was under the old pricing and the waiver was discretionary. I found no current Netlify policy that excludes attack traffic.

Migration effort: none.

Sources, checked 2026-10-11: https://www.netlify.com/pricing/ ; https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/ ; https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/configure-auto-recharge ; https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/billing-faq-for-credit-based-plans/ ; https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/ ; https://www.netlify.com/legal/terms-of-use/ ; bot flood report (community, not Netlify): https://answers.netlify.com/t/site-outage-caused-by-465k-automated-requests-33-gb-from-a-single-country-need-prevention-guidance/165510 ; 2024 incident (press, anecdotal): https://gigazine.net/gsc_news/en/20240228-ddos-netlify

## Cloudflare (Workers static assets, or Pages)

What it costs. "Requests to static assets are free and unlimited", on both the Workers and the Pages docs. The free Workers plan allows 100,000 Worker invocations a day and 10 ms of CPU each; only requests that run code count, which here means the signup form and the per diem lookup. Workers Paid is $5 a month with 10 million requests included, then $0.30 per million. Free KV: 100,000 reads and 1,000 writes a day, 1 GB. Free D1: 5 million rows read and 100,000 written a day, 5 GB.

Limits that matter here. Free plan: 20,000 files per version (this site has 625), 25 MiB per file (largest here is 11.3 MB). Workers Builds: 3,000 build minutes a month free, 20 minute timeout. Pages: 500 builds a month free, 1 concurrent build. `_headers`: 100 rules, 2,000 characters per line. `_redirects`: 2,000 static and 100 dynamic, 301 supported, `:splat` supported.

Which product. Cloudflare's Pages docs now open with "Start new projects with Workers", and call Workers its primary platform. Workers reads the same `_headers` and `_redirects` files. One difference: a Workers custom domain needs the domain's nameservers on Cloudflare. Pages also needs that for an apex domain like healthcareuncharted.com. Either way, DNS moves.

On a spike: nothing happens to static pages. If the free Worker limit (100,000 a day) is hit, Cloudflare returns error 1027 for the Worker routes only, or bypasses the Worker if the route is set to fail open. That would break the form and the per diem lookup for the rest of that UTC day, nothing else.

Commercial use: no free-plan restriction in the service terms. The CDN section lets Cloudflare limit sites that serve video or "a disproportionate percentage" of large files without paid services, and it names the Developer Platform (where Workers and Pages live) as one of those services. A site of HTML and JSON is not the target of that clause.

What has to change in this repo:
1. Keep `netlify.toml`. Add a small script that runs after Eleventy and writes `_site/_headers` and `_site/_redirects` from it. It must run after the prune step in `.eleventy.js`, or the prune could remove the files. The old-pages and CSP checks stay as they are.
2. Add `wrangler.jsonc` pointing assets at `_site`, with `not_found_handling` set to the 404 page (Netlify serves `404.html` on its own; Workers must be told).
3. Signup form: a Worker route that takes the POST, checks the honeypot, stores the address in D1 or KV, and answers with a 303 to `/thanks/`. Point the form's `action` at that route. `form-action 'self'` stays true because the route is on the same domain. Remove `data-netlify` later.
4. Per diem: port `perdiem.js` to the Worker at the SAME path, `/.netlify/functions/perdiem`, so `assignment-compass.js` and `scripts/phone-check.js` need no change. Store `GSA_API_KEY` as a Worker secret.
5. `/version.txt`: in `src/_data/build.js`, read `process.env.COMMIT_REF || process.env.WORKERS_CI_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA`. One line. `tests/hub.test.js` still finds `COMMIT_REF`.
6. DNS: add the zone to Cloudflare (free), copy every record, change the nameservers at Namecheap. Turn on Cloudflare Email Routing (listed as "Available on Free and Paid plans") to replace Namecheap's forwarding BEFORE the switch, or mail to the domain stops.
7. Test on a preview before switching: headers with `curl -I`, each redirect WITH a query string (`/secret-menu/vital-stats/?room=ABCD`), the 404 page, `/version.txt`, then `npm run phone`. Cloudflare's docs do not say whether `_redirects` forwards an incoming query string. When I tested Cloudflare's own docs site, its 301s kept `?probe=abc`, but I cannot confirm that site uses a `_redirects` file. Treat it as UNVERIFIED until the preview shows it.

Effort: about a day of agent work for steps 1 to 5 and 7. David's hands: the Cloudflare account, the GitHub app, the secret, the nameserver change at Namecheap. Nameserver changes usually settle in hours but can take up to 48.

Sources, checked 2026-10-11: https://developers.cloudflare.com/workers/platform/pricing/ ; https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ ; https://developers.cloudflare.com/workers/platform/limits/ ; https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/ ; https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ ; https://developers.cloudflare.com/workers/static-assets/headers/ ; https://developers.cloudflare.com/workers/static-assets/redirects/ ; https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/ ; https://developers.cloudflare.com/pages/ ; https://developers.cloudflare.com/pages/platform/limits/ ; https://developers.cloudflare.com/pages/functions/pricing/ ; https://developers.cloudflare.com/pages/configuration/headers/ ; https://developers.cloudflare.com/pages/configuration/redirects/ ; https://developers.cloudflare.com/pages/configuration/custom-domains/ ; https://developers.cloudflare.com/pages/configuration/build-configuration/ ; https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/ ; https://www.cloudflare.com/service-specific-terms-application-services/ ; https://developers.cloudflare.com/email-routing/ ; https://developers.cloudflare.com/r2/pricing/ ; https://www.namecheap.com/support/knowledgebase/article.aspx/308/2214/how-to-set-up-free-email-forwarding/

## Vercel

Hobby is free: 100 GB of data transfer, 1 million CDN requests and 1 million function invocations a month, 100 deployments a day. Over a limit, "you will have to wait until 30 days have passed before you can use the feature again." Hobby is for "non-commercial personal use only."

Does the Ko-fi link count as commercial? No. Vercel's fair use page says it plainly: "Asking for Donations does not fall under commercial usage." Ads, selling a product or service, or being paid to build the site would count. If the site ever advertises paid talks or consulting, that line gets gray.

The catch for this site is requests, not bandwidth. At 13 requests a page view and 2 views a visitor, Hobby's 1 million requests run out at about 38,000 visitors a month, and then the site waits 30 days. A launch day uses a quarter of the month's allowance. Hobby is not a fit for a launch.

Pro is $20 a month for one deploying seat, with $20 of usage credit and Flat Rate CDN (released to all Pro teams 2026-09-08). The included tier is 1 million CDN requests and 1 TB; the paid tiers are $20 for 10 million and 50 TB, $100 for 50 million, $300 for 150 million. "A one-day spike doesn't trigger an upgrade"; a month over capacity moves you up a tier at the next cycle. So: today $20, launch day $20, 100,000 visitors (2.6 million requests) $40, 1 million visitors (26 million requests) $120. Note: the pricing page lists Pro as including 10 million requests and 1 TB on the older on-demand model, while the docs say Flat Rate's included tier is 1 million. I used the docs. Spend alerts default to $200 a cycle, and Pro can auto-pause projects at 100% of a budget if you want a ceiling.

Repo changes: `vercel.json` generated from `netlify.toml` (headers and redirects), the per diem as a Vercel Function, the form as a function plus somewhere to store addresses, `VERCEL_GIT_COMMIT_SHA` in `build.js`. DNS can stay at Namecheap. Effort: medium.

Sources, checked 2026-10-11: https://vercel.com/pricing ; https://vercel.com/docs/plans/hobby ; https://vercel.com/docs/plans/pro-plan ; https://vercel.com/docs/limits/fair-use-guidelines ; https://vercel.com/docs/pricing/flat-rate-cdn ; https://vercel.com/docs/manage-cdn-usage ; https://vercel.com/changelog/flat-rate-cdn-is-now-ga-for-pro-teams ; https://vercel.com/docs/git/vercel-for-github

## GitHub Pages

Free for public repos. Limits: published site 1 GB, soft bandwidth limit 100 GB a month, soft limit of 10 builds an hour (not applied to custom Actions workflows), 10 minute deploy timeout. Over the limits, GitHub may stop serving the site, return 429s, or email you to move. On GitHub Free "the repository must be public", so making the repo private means a paid plan. GitHub Pro's price is not shown on github.com/pricing; third-party sources say $4 a month (UNVERIFIED). Commercial: Pages is "not intended for or allowed to be used as a free web-hosting service to run your online business." The docs say nothing either way about donation links.

What breaks, specifically: GitHub's docs describe no way to set response headers, so every header in `netlify.toml` is gone. The CSP can move into a `<meta>` tag, but MDN says `frame-ancestors` "is not supported in the meta element", and X-Frame-Options, HSTS, X-Content-Type-Options, Permissions-Policy and the cache rules have no meta form. No server redirects either; the 15 forwards become meta-refresh stub pages, plus script to carry `?room=` along. No forms, no functions. Today it costs $0; at 100,000 visitors it sits on the soft limit; at 1 million it is ten times over. It would weaken the site's security to save $9. Not recommended.

Sources, checked 2026-10-11: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits ; https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site ; https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https ; https://docs.github.com/en/get-started/learning-about-github/githubs-plans ; https://github.com/pricing ; https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors

## AWS

Amplify Hosting. Build $0.01 a minute after 1,000 free minutes; storage $0.023 per GB-month after 5 GB; data out $0.15 per GB after 15 GB; SSR requests $0.30 per million after 500,000. The free tier wording conflicts on the page: the table says "Free for 12 months", while the news section says accounts made on or after 2025-07-15 get up to $200 in credits and a 6-month free plan. So for a new account the free allowance is UNVERIFIED. Costs: today $0, launch day $0 to $1.50, 100,000 visitors $12.75 to $15, 1 million $148 to $150, the bot day about $5. No spend cap is mentioned. Headers go in `customHttp.yml` in the repo; redirects are console rules (Amplify forwards query parameters on 301s); `AWS_COMMIT_ID` replaces `COMMIT_REF`. The redirects living in the console instead of a repo file breaks the "netlify.toml is the source" pattern unless scripted. Effort: medium to high.

S3 plus CloudFront, flat-rate plans (per distribution): Free $0 with 1 million requests, 100 GB and 5 GB of S3 credit; Pro $15 with 10 million requests and 50 TB; Business $200 with 125 million; Premium $1,000. "No overage charges", and "Blocked DDoS attacks and requests blocked by AWS WAF never count against your usage allowance." Allowances "are not hard limits": email alerts at 50%, 80% and 100%, a first spike up to 3x is absorbed, and only months of sustained excess lead to delivery that "might be adjusted". This is the only option besides Cloudflare where a bot flood can never become a bill.
Pay as you go instead: 1 TB out and 10 million requests a month are always free, then $0.085 per GB (US) and $0.01 per 10,000 HTTPS requests. At 1 million visitors that is 16 million billable requests, about $16.
Costs: today and launch day $0 on either; 100,000 visitors $0 (flat Free absorbs the first 2.6x spike, then Pro at $15; pay as you go is $0); 1 million visitors $200 flat or about $16 pay as you go.
Repo changes are the heaviest here: a GitHub Actions deploy (build, `aws s3 sync`, cache invalidation), a response headers policy for the CSP, a CloudFront Function for the redirects AND for serving `/about/` from `about/index.html`, Lambda for the form and per diem, `GITHUB_SHA` for version.txt. Effort: high.

Sources, checked 2026-10-11: https://aws.amazon.com/amplify/pricing/ ; https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html ; https://docs.aws.amazon.com/amplify/latest/userguide/custom-headers.html ; https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html ; https://aws.amazon.com/cloudfront/pricing/ ; https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/ ; https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html

## Azure Static Web Apps

Free plan, labeled "For personal projects": 100 GB a month, 250 MB per environment, 15,000 files, 2 custom domains, no SLA. "In the free plan if your site exceeds the 100 GB quota, we will not be able to serve your site." Standard: $9 per app per month with 100 GB, then $0.20 per GB (US regions, from Microsoft's retail price API; the marketing page shows dashes instead of numbers). Costs: today $0, launch day $0, 100,000 visitors at the Free cap or $9 on Standard, 1 million visitors $9 + 900 x $0.20 = $189. Headers and redirects go in `staticwebapp.config.json`; per diem and the form become managed Azure Functions; deploys run as a GitHub Action, so `GITHUB_SHA` replaces `COMMIT_REF`. Effort: medium. It solves nothing Cloudflare does not solve for less.

Sources, checked 2026-10-11: https://azure.microsoft.com/en-us/pricing/details/app-service/static/ ; https://learn.microsoft.com/en-us/azure/static-web-apps/plans ; https://learn.microsoft.com/en-us/azure/static-web-apps/quotas ; https://prices.azure.com/api/retail/prices (filter productName eq 'Static Web Apps')

## Firebase Hosting

The two official pages disagree. The pricing page says 10 GB storage and 360 MB a day of transfer free, then $0.026 per GB and $0.15 per GB. The Hosting quotas page says 10 GB a MONTH of transfer free, and on the free Spark plan, past that, "a short grace period" and then sites are disabled until next month; Blaze bills $0.15 per GB. Either way, one launch day (10 GB) ends Spark. Blaze costs: today $0, launch day about $0, 100,000 visitors $13.50, 1 million $148.50, no spend cap found. Old releases count toward the 10 GB storage. Headers and 301s go in `firebase.json`; functions need Blaze; deploy via GitHub Actions. Effort: medium. No reason to pick it for this site.

Sources, checked 2026-10-11: https://firebase.google.com/pricing ; https://firebase.google.com/docs/hosting/usage-quotas-pricing ; https://firebase.google.com/docs/hosting/full-config

## Render (static sites)

Static sites are free to deploy, but they draw on the workspace's bandwidth and build minutes. Plans since 2026-04-23 (all workspaces moved by 2026-08-01): Hobby $0 with 5 GB bandwidth and 500 pipeline minutes; Pro $25 with 25 GB and 1,000 minutes; Scale $499 with 1 TB and 5,000 minutes. Bandwidth over is $0.15 per GB; minutes over are $5 per 1,000. With no card on file, "Render spins down your workspace's services until the start of the next month." Costs on Hobby with a card: today $0, launch day $0.75, 100,000 visitors $14.25, 1 million $149.25. Headers and routes can live in `render.yaml`; a static site has no functions, so the per diem would need a separate web service or would fall back to the standard rate; no forms. `RENDER_GIT_COMMIT` exists as a name in the Blueprint docs but its value is not described (UNVERIFIED). Whether Hobby forbids commercial use is UNVERIFIED (a search summary of the pricing page called it for personal projects; the page itself would not load its plan details for me). Effort: medium.

Sources, checked 2026-10-11: https://render.com/docs/static-sites ; https://render.com/docs/outbound-bandwidth ; https://render.com/docs/build-pipeline ; https://render.com/changelog/updated-plans-for-render-workspaces ; https://render.com/docs/blueprint-spec ; https://render.com/docs/new-workspace-plans ; https://render.com/pricing (plan details did not render)

## Bunny (CDN first)

Standard network $0.01 per GB in North America and Europe, $0.03 in Asia and Oceania, $0.045 South America, $0.06 Middle East and Africa; "No Request Fees"; $1 monthly minimum. Storage $0.01 per GB for one region (HDD), $0.02 per region on SSD. It is prepaid: "your account is disabled and, after 60 days, your stored data is deleted" if the balance goes negative, so it also needs auto recharge on. You can set monthly bandwidth limits as overcharge protection, which is a pause by another name. Costs: today $1, launch day $1, 100,000 visitors $1, 1 million visitors $10, the bot day about $1 at the Asia rate. There is no build system and no repo config: you write a GitHub Action that builds and uploads, and the headers and redirects are Edge Rules in the dashboard. No forms; Edge Scripting exists but I did not check its pricing (UNVERIFIED). Effort: high. Bunny makes the most sense later as a CDN for the big data files only, not as the whole host.

Sources, checked 2026-10-11: https://bunny.net/pricing/ ; https://bunny.net/pricing/storage/ ; https://bunny.net/docs/billing/add-funds

## Hybrid setups

Cloudflare in front of Netlify (proxied). Not recommended. Netlify's support guide, last reviewed by Netlify Support in July 2025, says an extra CDN "can break our atomic rollbacks and deploys", adds network hops, and that Netlify "will not provide any further tech support" on that setup below Enterprise. It would cut Netlify bandwidth only if the cache rules were tuned, and it still needs DNS on Cloudflare. If DNS is moving to Cloudflare anyway, host there.

Cloudflare DNS, Netlify serving, Cloudflare warm standby. This is the safe bridge. Move DNS to Cloudflare in DNS-only mode (grey cloud, no proxy), pointing at Netlify exactly as today, so nothing about Netlify changes. Build the same repo on a Cloudflare Worker at its free workers.dev address on every push; it costs nothing. If Netlify ever pauses or fails, attach the custom domain to the Worker and the site is back in minutes instead of a nameserver wait. Until the form and per diem routes exist on the Worker, the standby is the read-only site: everything works except the signup and the live per diem rate. Do the DNS move at least a week before the launch or after it, not in launch week.

Netlify primary, heavy data elsewhere. Moving `/assets/data/*` (48 of the 62 MB, and most of the bytes on the map pages) to R2 or Bunny on a `data.` subdomain would cut Netlify's bandwidth credits. R2 has free egress and 10 GB free storage. But it means a CSP connect-src change, CORS, and new fetch paths in every tool that loads data. Only worth it if the decision is to stay on Netlify for years at high traffic.

Cloudflare primary, Netlify standby (after the move). Keep the Netlify project with builds stopped and the last deploy live, on the Free plan, for a quarter. If the Cloudflare cutover shows a problem, point DNS back.

## Ranked recommendations

### 1. Launch month (now through October 2026)

1. Netlify Personal with auto recharge ON. David's hands, ten minutes: Team settings, Usage & billing, Configure auto recharge, Enabled. Delete the duplicate project the same day. Confirm the 50/75/90/100% emails go to an inbox he reads, and look at the Usage page's real bandwidth number. Each 10,000-visitor day costs about 252 credits, which is about $2.50 at pack prices once the included 1,000 are gone. A bad bot day is about $8.
2. If October looks like more than about seven launch-size days, switch to Netlify Pro for the month ($20, 3,000 credits, cheaper packs). Below that, Personal is cheaper.
3. Optional and only if there is time a week out: move DNS to Cloudflare in DNS-only mode with Email Routing set up first, and stand up the read-only Cloudflare standby. If it would land in launch week, skip it; auto recharge already removes the pause.

### 2. The next year

1. Cloudflare Workers static assets as the primary host. $0 at every traffic level in this report, $5 a month if Worker use ever needs the paid plan. Static traffic can never pause the site or run up a bill. Works if the repo goes private by deploying from GitHub Actions with Wrangler, if the GitHub app turns out not to. About a day of build work on the steps above, keeping `netlify.toml` as the source file.
2. Netlify Pro, if David would rather not move anything. $20 flat up to roughly 113,000 visitors a month, then uncapped credit packs.
3. Vercel Pro with Flat Rate CDN. $20 to $40 a month at these levels and spike-proof billing, but it is the same migration work as Cloudflare for a higher bill.

### 3. If it really grows

1. Cloudflare Workers Paid ($5). Add R2 for any data file that would pass 25 MiB, and consider content-hashed file names so the data can be cached for a year instead of an hour.
2. CloudFront flat-rate (Pro $15, Business $200) if an AWS home is wanted. Attack traffic never counts, and there are no overage charges.
3. Bunny as the CDN for the heavy data files only, about $10 per TB in North America.

For scale: by the same arithmetic, a million visitors a month is about $170 on Netlify Pro and about $254 on Personal.

## Things I could not verify

- GitHub Pro's price (third-party sources say $4 a month; not on GitHub's pricing page).
- Whether Cloudflare `_redirects` forwards an incoming query string. Test on a preview.
- Whether Cloudflare's and Vercel's GitHub apps build from a private personal repo (neither page says it outright).
- Whether Netlify bills bot or blocked traffic, and whether a Netlify rate-limit rule can protect static data files.
- Netlify's commercial-use terms in the self-serve subscription agreement (the Terms of Use say nothing either way).
- Amplify's free allowance for a new AWS account (the page contradicts itself).
- Firebase Spark's free transfer (360 MB a day on one official page, 10 GB a month on another).
- Render Hobby's commercial terms and the value of `RENDER_GIT_COMMIT`; Bunny Edge Scripting pricing.
- Vercel Pro's included requests (10 million on the pricing page, 1 million in the Flat Rate docs).
- The real ratio of page views to visitors, and the real bandwidth including bots. GoatCounter and the Netlify Usage page have both.

## All sources (checked 2026-10-11)

Netlify: https://www.netlify.com/pricing/ ; https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/ ; https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/configure-auto-recharge ; https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/billing-faq-for-credit-based-plans/ ; https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/ ; https://www.netlify.com/legal/terms-of-use/ ; https://answers.netlify.com/t/support-guide-why-not-proxy-to-netlify/8869 ; https://answers.netlify.com/t/site-outage-caused-by-465k-automated-requests-33-gb-from-a-single-country-need-prevention-guidance/165510

Cloudflare: https://developers.cloudflare.com/workers/platform/pricing/ ; https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ ; https://developers.cloudflare.com/workers/platform/limits/ ; https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/ ; https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ ; https://developers.cloudflare.com/workers/static-assets/headers/ ; https://developers.cloudflare.com/workers/static-assets/redirects/ ; https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/ ; https://developers.cloudflare.com/pages/ ; https://developers.cloudflare.com/pages/platform/limits/ ; https://developers.cloudflare.com/pages/functions/pricing/ ; https://developers.cloudflare.com/pages/configuration/headers/ ; https://developers.cloudflare.com/pages/configuration/redirects/ ; https://developers.cloudflare.com/pages/configuration/custom-domains/ ; https://developers.cloudflare.com/pages/configuration/build-configuration/ ; https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/ ; https://www.cloudflare.com/service-specific-terms-application-services/ ; https://developers.cloudflare.com/email-routing/ ; https://developers.cloudflare.com/r2/pricing/

Vercel: https://vercel.com/pricing ; https://vercel.com/docs/plans/hobby ; https://vercel.com/docs/plans/pro-plan ; https://vercel.com/docs/limits/fair-use-guidelines ; https://vercel.com/docs/pricing/flat-rate-cdn ; https://vercel.com/docs/manage-cdn-usage ; https://vercel.com/changelog/flat-rate-cdn-is-now-ga-for-pro-teams ; https://vercel.com/docs/git/vercel-for-github

GitHub: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits ; https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site ; https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https ; https://docs.github.com/en/get-started/learning-about-github/githubs-plans ; https://github.com/pricing ; https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors

AWS: https://aws.amazon.com/amplify/pricing/ ; https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html ; https://docs.aws.amazon.com/amplify/latest/userguide/custom-headers.html ; https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html ; https://aws.amazon.com/cloudfront/pricing/ ; https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/ ; https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html

Azure: https://azure.microsoft.com/en-us/pricing/details/app-service/static/ ; https://learn.microsoft.com/en-us/azure/static-web-apps/plans ; https://learn.microsoft.com/en-us/azure/static-web-apps/quotas ; https://prices.azure.com/api/retail/prices

Firebase: https://firebase.google.com/pricing ; https://firebase.google.com/docs/hosting/usage-quotas-pricing ; https://firebase.google.com/docs/hosting/full-config

Render: https://render.com/docs/static-sites ; https://render.com/docs/outbound-bandwidth ; https://render.com/docs/build-pipeline ; https://render.com/changelog/updated-plans-for-render-workspaces ; https://render.com/docs/blueprint-spec ; https://render.com/docs/new-workspace-plans

Bunny: https://bunny.net/pricing/ ; https://bunny.net/pricing/storage/ ; https://bunny.net/docs/billing/add-funds

Namecheap: https://www.namecheap.com/support/knowledgebase/article.aspx/308/2214/how-to-set-up-free-email-forwarding/
