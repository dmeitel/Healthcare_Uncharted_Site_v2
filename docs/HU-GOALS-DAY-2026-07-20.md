# Goals Day: The Leadership Pillar, Three Series Articles, and the Pipeline Seams
## 2026-07-20 evening session. BUILT, 23/23 verify green, UNCOMMITTED, awaiting David's read.

The July audit's strategic gaps, worked in one session. Four long-read articles drafted IN DAVID'S VOICE FOR HIS EDIT: the claims are sourced, but the words are a draft until he says otherwise.

## What shipped

### 1. The leadership pillar exists now
- **Article 10, "Leading the AI Transition: Run It Like a Formulary"** at /learn/leading-the-ai-transition/. The frame: govern clinical AI the way pharmacy governs drugs (intake, evidence review, monitoring, deprescribing). Anchored on ASTP Data Brief 80 (71% of hospitals run predictive AI), Health Affairs 2025 (44% bias-checked), the AMA 2026 sentiment survey (85% want a seat, 27% got no training), the Joint Commission/CHAI rulebook timeline, RAND's failure root-causes, Sittig-Singh, Han 2005, and the VA unknown queue. Honest flags kept: the nursing AI survey gap is named as a gap, RAND's 80% is "estimates cited by RAND," no invented governance RCT.
- **Learn index has a gold Leadership filter + tag.** Card live.
- **Home Path 03 (For Leaders) now lands on the leadership article** instead of the Iceberg tool.
- Go-deeper card uses the new career-tree deep link (?role=cmio), tying the pillar to the tool layer.

### 2. Three of the four Coming Soon articles are live
- **Article 04, "The Payer: Claims, Codes, and Prior Auth"** at /learn/the-payer/. The spine: 19% denied, under 1% appealed, 80.7% of MA appeals overturned, OIG's 13%. Code-system ledger table, MedPAC's $84B/$40B coding-intensity numbers, CMS-0057-F deadlines, the AHIP pledge with the 33%-believe-it caveat. Deep-links the multi-lens map payer lens.
- **Article 05, "The Policy Makers: HITECH, Meaningful Use, and the 21st Century Cures Act"** at /learn/hitech-to-cures/. Arc: paid to adopt, forced to share. $35B+ (CMS's own words, replacing the old card's stale $25.9B), the causal Adler-Milstein study, Sinsky/Shanafelt/Melnick on what adoption cost, Cures enforcement timeline, TEFCA's 11 QHINs, the behavioral-health two-tier ending. Goodhart link to the field guide.
- **Article 09, "The Change Healthcare Cyberattack: A System Stress Test"** at /learn/change-healthcare-stress-test/. Every load-bearing number is .gov, Congressional record, or UHG's own filings: Feb 12 no-MFA entry, $22M ransom, 192.7M people, $3.09B cost, $9.03B loans, OFR's single-point-of-failure verdict, and the still-unfinalized HIPAA Security Rule as the dry ending. The old card's unsupported "$1.6T" figure replaced with OFR's $2T.
- **Article 06 (HL7 to FHIR) is the ONLY Coming Soon left.** Its research agent was stopped mid-run from David's side; say the word and it gets the same treatment.

### 3. References ledger
44 new curated entries with four new consumer chips (Articles 04/05/09/10), plus usedBy appends on FDA device list, Surgeon General advisory (URL also fixed, the hhs.gov PDF now 403s, moved to NCBI), and NCSBN. Sources page renders them.

### 4. Pipeline seams (from the July 7 audit), all closed
- build-suppliers.js resolves the CMS CSV URL from the dataset metastore at fetch time (the pinned hash HAD already rotated, the next refresh would have 404'd).
- atlas-concepts adapter now FAILS the build loudly on anchor miss or sanity-floor breach (7 zones/101 concepts baseline, floors 5/60) instead of shipping zero concept nodes.
- cross-links.js carries METRIC_EXPECT: every positional metric reference pins its expected name; build-entities verifies against metricsConfig and names the drifted metric on failure. Negative-tested.
- State-FIPS table deduped into scripts/lib/fips.js, required by all five former copies.
- BLS User-Agent: already fixed previously (stale audit item).

### 5. Stale audit items closed by inspection, no work needed
CSP is enforced (not report-only). Home Path 01 already points at the live AI article. Articles 07/08 (the "Coming Soon evergreen anchors") have been live for a while. Rounds-index fallback copy made evergreen (was "first rounds drop soon" + an em dash).

## David's QA list
1. Read all four articles AS DRAFTS OF YOUR VOICE. The facts are verified; the sentences are mine until you bless or rewrite them. Fastest check: the four thesis strips and the four endings.
2. Learn index: filter by Leadership, tap through all four new cards, confirm Article 06 is the only Coming Soon.
3. Home page: Path 03 CTA reads "Start with the leadership playbook" and lands right.
4. /learn/sources/: filter by the four new article chips.
5. Article 10's career-tree deep link (?role=cmio) and Article 04's multi-lens deep link (?lens=payer) both land snapped.
6. Spot-check any source link that matters to you; every one was fetch-verified today, some (SEC, HHS, CMS) 403 automated tools but load in a browser.

## Watch list / not done
- Article 06 FHIR: pending your go.
- Perf leftovers from the audit (HTML minification, self-host fonts, a11y rollout to small tools): untouched today, still open.
- data-build/ intermediates are still git-tracked (audit seam #5, not in today's scope).
- Data Observatory: UPDATED same session. Two nodes added (career-tree-creds.json, a pre-existing gap, and references.js), stale suppliers-URL details corrected, datamap regenerated (59 nodes / 80 edges) and serving. scripts/lib/fips.js and build-og-cards.js deliberately left off the map: one is a shared lib, the other outputs brand images, neither is data architecture. Overrule if you want them drawn.
- county-grain expansion + scheduled pulls: deferred, its own session.
