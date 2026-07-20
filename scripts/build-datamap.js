#!/usr/bin/env node
'use strict';
/**
 * build-datamap.js — the site's data architecture, as data.
 *
 * Merges a curated node/edge table (sources → pipeline → datasets →
 * build-time intermediates → tools, accurate as of 2026-07-07) with live
 * fs.stat size + mtime for every file that exists on disk, and writes:
 *
 *   src/assets/data/derived/datamap.json   (~15KB; the Data Observatory fetches it)
 *
 * Validation: every edge endpoint must exist in the node table; a dangling
 * edge fails the build loudly instead of shipping a broken map.
 *
 *   node scripts/build-datamap.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'assets', 'data', 'derived', 'datamap.json');

/* ────────────────────────────────────────────────────────────────────
   CURATED TABLE — kinds: source | script | dataset | intermediate | tool
   stat:  repo-relative file to fs.stat (bytes + mtime)
   stats: multiple files summed into one node (bytes = sum, mtime = newest)
──────────────────────────────────────────────────────────────────── */
const NODES = [
  // ── SOURCES (external) ──────────────────────────────────────────
  { id: 'src-cms-care-compare', kind: 'source', label: 'CMS Care Compare', provenance: 'official',
    detail: 'Hospital General Information download. One leg of the us-hospitals merge.' },
  { id: 'src-cms-asc', kind: 'source', label: 'CMS ASC Dataset', provenance: 'official',
    detail: 'Ambulatory surgical center listing behind us-ascs.json.' },
  { id: 'src-cms-dialysis', kind: 'source', label: 'CMS Dialysis Dataset', provenance: 'official',
    detail: 'Dialysis facility compare data behind us-dialysis.json.' },
  { id: 'src-cms-dmepos', kind: 'source', label: 'CMS DMEPOS CSV', provenance: 'official',
    detail: 'Supplier directory CSV; build-suppliers.js resolves the current download URL from the CMS metastore (the raw URL carries a rotating hash).' },
  { id: 'src-cdc-places', kind: 'source', label: 'CDC PLACES', provenance: 'official',
    detail: 'County health measures via the Socrata API (swc5-untb).' },
  { id: 'src-bls-laus', kind: 'source', label: 'BLS LAUS', provenance: 'official',
    detail: 'Local Area Unemployment Statistics, county grain.' },
  { id: 'src-census-saipe', kind: 'source', label: 'Census SAIPE', provenance: 'official',
    detail: 'Small Area Income and Poverty Estimates.' },
  { id: 'src-census-sahie', kind: 'source', label: 'Census SAHIE', provenance: 'official',
    detail: 'Small Area Health Insurance Estimates.' },
  { id: 'src-census-fips', kind: 'source', label: 'Census FIPS / us-atlas', provenance: 'official',
    detail: 'County FIPS spine + us-atlas TopoJSON, pulled from the CDN by build-geo.js.' },
  { id: 'src-ahrq', kind: 'source', label: 'AHRQ Compendium 2023', provenance: 'official',
    detail: 'Health-system crosswalk merged into us-hospitals.json.' },
  { id: 'src-hifld', kind: 'source', label: 'HIFLD / CovidCareMap', provenance: 'official',
    detail: 'Bed counts and facility geometry merged into us-hospitals.json.' },
  { id: 'src-bls-ooh', kind: 'source', label: 'BLS OOH', provenance: 'official',
    detail: 'Occupational Outlook Handbook pay + growth behind the career tree BLS layers.' },
  { id: 'src-hand-curated', kind: 'source', label: 'Hand-Curated (editorial)', provenance: 'editorial',
    detail: 'The editorial layer: vendors, career tree structure, atlas concepts, registries, metric ledger.' },

  // ── PIPELINE (scripts/) ─────────────────────────────────────────
  { id: 'js-pull-places', kind: 'script', label: 'pull/places.js', stat: 'scripts/pull/places.js',
    detail: 'Refreshable CDC PLACES pull. Dry-run by default; writes county metrics into countyData.json.' },
  { id: 'js-pull-bls', kind: 'script', label: 'pull/bls.js', stat: 'scripts/pull/bls.js',
    detail: 'Refreshable BLS LAUS pull. Dry-run by default.' },
  { id: 'js-pull-saipe', kind: 'script', label: 'pull/saipe.js', stat: 'scripts/pull/saipe.js',
    detail: 'Refreshable Census SAIPE pull. Dry-run by default.' },
  { id: 'js-pull-sahie', kind: 'script', label: 'pull/sahie.js', stat: 'scripts/pull/sahie.js',
    detail: 'Refreshable Census SAHIE pull. Dry-run by default.' },
  { id: 'js-build-suppliers', kind: 'script', label: 'build-suppliers.js', stat: 'scripts/build-suppliers.js',
    detail: 'Fetch-on-build; resolves the CMS DMEPOS URL via the dataset metastore (pinned URL is fallback only), then splits the directory into four supplier datasets.' },
  { id: 'js-build-geo', kind: 'script', label: 'build-geo.js', stat: 'scripts/build-geo.js',
    detail: 'Pulls us-atlas TopoJSON from the CDN; writes the county population and lakes basemap files.' },
  { id: 'js-build-data', kind: 'script', label: 'build-data.js', stat: 'scripts/build-data.js',
    detail: 'Rollups: facilities by state / county / system, national summary, suppliers by state. Build-only outputs.' },
  { id: 'js-build-entities', kind: 'script', label: 'build-entities.js', stat: 'scripts/build-entities.js',
    detail: '10-adapter unified graph. Reads every major dataset, validates links (incl. the cross-links metric-name guard), writes the search graph.' },

  // ── DATASETS (deployed, src/assets/data/) ───────────────────────
  { id: 'ds-us-hospitals', kind: 'dataset', label: 'us-hospitals.json', stat: 'src/assets/data/us-hospitals.json',
    refresh: 'hand-maintained', provenance: 'official',
    detail: '5,366 hospitals. CMS Care Compare merged with the AHRQ system crosswalk and HIFLD/CovidCareMap beds.',
    consumers: ['Operators Map (eager)', 'facility.js (build)'] },
  { id: 'ds-us-ascs', kind: 'dataset', label: 'us-ascs.json', stat: 'src/assets/data/us-ascs.json',
    refresh: 'hand-maintained', provenance: 'official',
    detail: '5,611 ambulatory surgical centers.', consumers: ['Operators Map (lazy)'] },
  { id: 'ds-us-dialysis', kind: 'dataset', label: 'us-dialysis.json', stat: 'src/assets/data/us-dialysis.json',
    refresh: 'hand-maintained', provenance: 'official',
    detail: '7,557 dialysis facilities.', consumers: ['Operators Map (lazy)'] },
  { id: 'ds-suppliers-pharmacy', kind: 'dataset', label: 'us-suppliers-pharmacy.json', stat: 'src/assets/data/us-suppliers-pharmacy.json',
    refresh: 'fetch-on-build', provenance: 'official',
    detail: '40,606 pharmacy locations. The single heaviest deployed file on the site.', consumers: ['Operators Map (lazy)'] },
  { id: 'ds-suppliers-dme', kind: 'dataset', label: 'us-suppliers-dme.json', stat: 'src/assets/data/us-suppliers-dme.json',
    refresh: 'fetch-on-build', provenance: 'official',
    detail: '6,367 DME supplier locations.', consumers: ['Operators Map (lazy)'] },
  { id: 'ds-suppliers-optical', kind: 'dataset', label: 'us-suppliers-optical.json', stat: 'src/assets/data/us-suppliers-optical.json',
    refresh: 'fetch-on-build', provenance: 'official',
    detail: '5,023 optical supplier locations.', consumers: ['Operators Map (lazy)'] },
  { id: 'ds-suppliers-op', kind: 'dataset', label: 'us-suppliers-orthotics-prosthetics.json', stat: 'src/assets/data/us-suppliers-orthotics-prosthetics.json',
    refresh: 'fetch-on-build', provenance: 'official',
    detail: '4,566 orthotics and prosthetics locations.', consumers: ['Operators Map (lazy)'] },
  { id: 'ds-us-counties', kind: 'dataset', label: 'us-counties.json', stat: 'src/assets/data/us-counties.json',
    refresh: 'fetch-on-build', provenance: 'official',
    detail: 'County population spine.', consumers: ['Operators Map (eager)', 'facility.js (build)'] },
  { id: 'ds-us-lakes', kind: 'dataset', label: 'us-lakes.json', stat: 'src/assets/data/us-lakes.json',
    refresh: 'fetch-on-build', provenance: 'official',
    detail: 'Basemap water geometry.', consumers: ['Operators Map (eager)'] },
  { id: 'ds-county-data', kind: 'dataset', label: 'countyData.json', stat: 'src/assets/data/countyData.json',
    refresh: 'auto-pull', provenance: 'official',
    detail: 'County metrics across 3 lenses. The one dataset the four pull scripts refresh.',
    consumers: ['Multi-Lens Map (eager)', 'Operators Map (eager)'] },
  { id: 'ds-career-tree', kind: 'dataset', label: 'career-tree.json', stat: 'src/assets/data/career-tree.json',
    refresh: 'hand-maintained', provenance: 'editorial',
    detail: 'The tiered-hex career structure: roles, tiers, paths.', consumers: ['Career Tree (eager)'] },
  { id: 'ds-career-tree-bls', kind: 'dataset', label: 'career-tree-bls.json', stat: 'src/assets/data/career-tree-bls.json',
    refresh: 'hand-maintained', provenance: 'official',
    detail: 'BLS pay + outlook enrichment keyed role → SOC.', consumers: ['Career Tree (eager)'] },
  { id: 'ds-career-tree-growth', kind: 'dataset', label: 'career-tree-growth-detail.json', stat: 'src/assets/data/career-tree-growth-detail.json',
    refresh: 'hand-maintained', provenance: 'official',
    detail: 'Per-tile growth how/show enrichment.', consumers: ['Career Tree (eager)'] },
  { id: 'ds-career-tree-creds', kind: 'dataset', label: 'career-tree-creds.json', stat: 'src/assets/data/career-tree-creds.json',
    refresh: 'hand-maintained', provenance: 'official',
    detail: 'Credential reality: pass rates, fees, program lengths, entry requirements. Sourced from the boards themselves; feeds the panels, the bill, and the Getting-in checklists.',
    consumers: ['Career Tree (eager)'] },
  { id: 'ds-vendors', kind: 'dataset', label: 'vendors.json', stat: 'src/assets/data/vendors.json',
    refresh: 'hand-maintained', provenance: 'editorial',
    detail: '117 vendors across 20 healthcare-tech sectors.', consumers: ['Vendor Directory (eager)'] },
  { id: 'ds-search-graph', kind: 'dataset', label: 'derived/search-graph.json', stat: 'src/assets/data/derived/search-graph.json',
    refresh: 'derived', provenance: 'derived',
    detail: '23,090-node unified graph. The one build-entities artifact that deploys; lazy-loaded since 2026-07.',
    consumers: ['Atlas search (lazy)'] },

  // ── INTERMEDIATES (build-time: src/_data + data-build, NOT deployed as-is) ──
  { id: 'int-state-data', kind: 'intermediate', label: 'stateData.json', stat: 'src/_data/stateData.json',
    refresh: 'hand-maintained', provenance: 'official',
    detail: '7 lenses of state metrics, sourced per the metricsConfig ledger. EMBEDDED into the Multi-Lens Map at build.',
    consumers: ['Multi-Lens Map (embedded)', 'Learn/Rounds pages (embedded)', 'build-entities.js (read)'] },
  { id: 'int-metrics-config', kind: 'intermediate', label: 'metricsConfig.json', stat: 'src/_data/metricsConfig.json',
    refresh: 'hand-maintained', provenance: 'editorial',
    detail: 'The provenance ledger: every metric, its source, year, and units.',
    consumers: ['Multi-Lens Map (embedded)', 'build-entities.js (read)'] },
  { id: 'int-data-years', kind: 'intermediate', label: 'dataYears.json', stat: 'src/_data/dataYears.json',
    refresh: 'hand-maintained', provenance: 'editorial',
    detail: 'Data-vintage year stamps embedded at build.', consumers: ['Multi-Lens Map (embedded)'] },
  { id: 'int-references', kind: 'intermediate', label: 'references.js', stat: 'src/_data/references.js',
    refresh: 'hand-maintained', provenance: 'editorial',
    detail: 'The citation ledger: every external source the site cites, half extracted from metricsConfig, half curated with per-article consumers. Renders the /learn/sources/ database at build.',
    consumers: ['Learn Sources page (embedded)', 'Learn/Rounds pages (embedded)'] },
  { id: 'int-registries', kind: 'intermediate', label: 'registries/ (6 files)',
    stats: ['src/_data/registries/geo.json', 'src/_data/registries/counties.json', 'src/_data/registries/systems.json',
            'src/_data/registries/facility-types.json', 'src/_data/registries/ownership.json', 'src/_data/registries/taxonomy.json'],
    path: 'src/_data/registries/', refresh: 'hand-maintained', provenance: 'editorial',
    detail: 'The shared spine: geo, counties, systems, facility-types, ownership, taxonomy. The backbone adapter reads these.',
    consumers: ['build-entities.js (read)'] },
  { id: 'int-entities', kind: 'intermediate', label: 'entities.json', stat: 'data-build/entities.json',
    refresh: 'derived', provenance: 'derived',
    detail: 'The typed node graph. Lives outside src/ on purpose: NOT deployed. Injected into Atlas Craft at build.',
    consumers: ['Atlas Craft (embedded)'] },
  { id: 'int-search-index', kind: 'intermediate', label: 'search-index.json', stat: 'data-build/search-index.json',
    refresh: 'derived', provenance: 'derived',
    detail: 'Build-time search index. NOT deployed; the live atlas fetches search-graph.json instead.' },
  { id: 'int-fac-state', kind: 'intermediate', label: 'facilities-by-state.json', stat: 'data-build/facilities-by-state.json',
    refresh: 'derived', provenance: 'derived',
    detail: 'Build-only rollup consumed by src/_data at template time. NOT deployed.' },
  { id: 'int-fac-county', kind: 'intermediate', label: 'facilities-by-county.json', stat: 'data-build/facilities-by-county.json',
    refresh: 'derived', provenance: 'derived',
    detail: 'Build-only rollup. NOT deployed.' },
  { id: 'int-fac-system', kind: 'intermediate', label: 'facilities-by-system.json', stat: 'data-build/facilities-by-system.json',
    refresh: 'derived', provenance: 'derived',
    detail: 'Build-only rollup. NOT deployed.' },
  { id: 'int-national-summary', kind: 'intermediate', label: 'national-summary.json', stat: 'data-build/national-summary.json',
    refresh: 'derived', provenance: 'derived',
    detail: 'Build-only national rollup. NOT deployed.' },
  { id: 'int-suppliers-by-state', kind: 'intermediate', label: 'suppliers-by-state.json', stat: 'data-build/suppliers-by-state.json',
    refresh: 'derived', provenance: 'derived',
    detail: 'Build-only supplier rollup; the suppliers adapter reads this, not the four big files.',
    consumers: ['build-entities.js (read)'] },

  // ── TOOLS (consumer pages) ──────────────────────────────────────
  { id: 'tool-operators-map', kind: 'tool', label: 'Operators Map', path: '/tools/healthcare-operators-map/',
    detail: 'The facility map. Eager basemap + hospitals; every other layer lazy-loads on toggle.' },
  { id: 'tool-multi-lens', kind: 'tool', label: 'Multi-Lens Map', path: '/tools/multi-lens-map/',
    detail: 'State choropleth, 7 lenses. State data rides in the HTML at build; county grain fetches at init.' },
  { id: 'tool-career-tree', kind: 'tool', label: 'Career Tree', path: '/tools/healthcare-career-tree/',
    detail: 'Tiered-hex role progression with BLS pay/outlook enrichment.' },
  { id: 'tool-vendor-directory', kind: 'tool', label: 'Vendor Directory', path: '/tools/healthcare-vendor-directory/',
    detail: '20 sectors, 117 vendors, sourced market-share carousel.' },
  { id: 'tool-atlas', kind: 'tool', label: 'Atlas (search + HUD)', path: '/atlas/',
    detail: 'The hex atlas. Search rides the unified graph, lazy-fetched on first use.' },
  { id: 'tool-atlas-craft', kind: 'tool', label: 'Atlas Craft', path: '/atlas/craft/',
    detail: 'Relationship-explorer canvas. The entity graph is injected into the template at build.' },
  { id: 'tool-hospital-map', kind: 'tool', label: 'Hospital Map', path: '/tools/hospital-map/',
    detail: 'Camera-zoom map. No external data files.' },
  { id: 'tool-sql-mystery', kind: 'tool', label: 'Clinical SQL Mystery', path: '/tools/clinical-sql-mystery/',
    detail: 'Synthetic in-page data. Nothing fetched.' },
  { id: 'tool-iceberg-map', kind: 'tool', label: 'Iceberg Map', path: '/tools/healthcare-iceberg-map/',
    detail: 'Hand-drawn concept map. No data files.' },
  { id: 'tool-learn-rounds', kind: 'tool', label: 'Learn / Rounds pages', path: '/learn/',
    detail: 'Editorial pages that pull stateData-derived stats at build.' },
];

/* mode: eager | lazy | embedded (dataset→tool only); omitted = pipeline flow */
const EDGES = [
  // sources → pull/build scripts
  { from: 'src-cdc-places', to: 'js-pull-places' },
  { from: 'src-bls-laus', to: 'js-pull-bls' },
  { from: 'src-census-saipe', to: 'js-pull-saipe' },
  { from: 'src-census-sahie', to: 'js-pull-sahie' },
  { from: 'src-cms-dmepos', to: 'js-build-suppliers' },
  { from: 'src-census-fips', to: 'js-build-geo' },
  { from: 'src-hand-curated', to: 'js-build-entities' },   // atlas-concepts adapter

  // sources → hand-assembled datasets/intermediates (no repo script)
  { from: 'src-cms-care-compare', to: 'ds-us-hospitals' },
  { from: 'src-ahrq', to: 'ds-us-hospitals' },
  { from: 'src-hifld', to: 'ds-us-hospitals' },
  { from: 'src-cms-asc', to: 'ds-us-ascs' },
  { from: 'src-cms-dialysis', to: 'ds-us-dialysis' },
  { from: 'src-bls-ooh', to: 'ds-career-tree-bls' },
  { from: 'src-bls-ooh', to: 'ds-career-tree-growth' },
  { from: 'src-hand-curated', to: 'ds-career-tree' },
  { from: 'src-hand-curated', to: 'ds-career-tree-creds' },   // board-sourced numbers, hand-merged
  { from: 'src-hand-curated', to: 'int-references' },
  { from: 'src-hand-curated', to: 'ds-vendors' },
  { from: 'src-hand-curated', to: 'int-state-data' },
  { from: 'src-hand-curated', to: 'int-metrics-config' },
  { from: 'src-hand-curated', to: 'int-data-years' },
  { from: 'src-hand-curated', to: 'int-registries' },

  // scripts → what they write
  { from: 'js-pull-places', to: 'ds-county-data' },
  { from: 'js-pull-bls', to: 'ds-county-data' },
  { from: 'js-pull-saipe', to: 'ds-county-data' },
  { from: 'js-pull-sahie', to: 'ds-county-data' },
  { from: 'js-build-suppliers', to: 'ds-suppliers-pharmacy' },
  { from: 'js-build-suppliers', to: 'ds-suppliers-dme' },
  { from: 'js-build-suppliers', to: 'ds-suppliers-optical' },
  { from: 'js-build-suppliers', to: 'ds-suppliers-op' },
  { from: 'js-build-geo', to: 'ds-us-counties' },
  { from: 'js-build-geo', to: 'ds-us-lakes' },
  { from: 'js-build-data', to: 'int-fac-state' },
  { from: 'js-build-data', to: 'int-fac-county' },
  { from: 'js-build-data', to: 'int-fac-system' },
  { from: 'js-build-data', to: 'int-national-summary' },
  { from: 'js-build-data', to: 'int-suppliers-by-state' },
  { from: 'js-build-entities', to: 'int-entities' },
  { from: 'js-build-entities', to: 'int-search-index' },
  { from: 'js-build-entities', to: 'ds-search-graph' },

  // what build-data READS
  { from: 'ds-us-hospitals', to: 'js-build-data' },
  { from: 'ds-us-ascs', to: 'js-build-data' },
  { from: 'ds-us-dialysis', to: 'js-build-data' },
  { from: 'ds-suppliers-pharmacy', to: 'js-build-data' },
  { from: 'ds-suppliers-dme', to: 'js-build-data' },
  { from: 'ds-suppliers-optical', to: 'js-build-data' },
  { from: 'ds-suppliers-op', to: 'js-build-data' },

  // what build-entities READS (the 10 adapters)
  { from: 'int-registries', to: 'js-build-entities' },     // backbone
  { from: 'ds-career-tree', to: 'js-build-entities' },     // career-tree
  { from: 'ds-us-hospitals', to: 'js-build-entities' },    // facilities
  { from: 'ds-us-ascs', to: 'js-build-entities' },         // ascs
  { from: 'ds-us-dialysis', to: 'js-build-entities' },     // dialysis
  { from: 'int-state-data', to: 'js-build-entities' },     // metrics
  { from: 'int-metrics-config', to: 'js-build-entities' }, // metrics (ledger)
  { from: 'ds-county-data', to: 'js-build-entities' },     // county-metrics
  { from: 'int-suppliers-by-state', to: 'js-build-entities' }, // suppliers
  { from: 'ds-vendors', to: 'js-build-entities' },         // vendors

  // datasets → tools
  { from: 'ds-us-hospitals', to: 'tool-operators-map', mode: 'eager' },
  { from: 'ds-us-ascs', to: 'tool-operators-map', mode: 'lazy' },
  { from: 'ds-us-dialysis', to: 'tool-operators-map', mode: 'lazy' },
  { from: 'ds-suppliers-pharmacy', to: 'tool-operators-map', mode: 'lazy' },
  { from: 'ds-suppliers-dme', to: 'tool-operators-map', mode: 'lazy' },
  { from: 'ds-suppliers-optical', to: 'tool-operators-map', mode: 'lazy' },
  { from: 'ds-suppliers-op', to: 'tool-operators-map', mode: 'lazy' },
  { from: 'ds-us-counties', to: 'tool-operators-map', mode: 'eager' },
  { from: 'ds-us-lakes', to: 'tool-operators-map', mode: 'eager' },
  { from: 'ds-county-data', to: 'tool-operators-map', mode: 'eager' },
  { from: 'ds-county-data', to: 'tool-multi-lens', mode: 'eager' },
  { from: 'ds-career-tree', to: 'tool-career-tree', mode: 'eager' },
  { from: 'ds-career-tree-bls', to: 'tool-career-tree', mode: 'eager' },
  { from: 'ds-career-tree-growth', to: 'tool-career-tree', mode: 'eager' },
  { from: 'ds-career-tree-creds', to: 'tool-career-tree', mode: 'eager' },
  { from: 'ds-vendors', to: 'tool-vendor-directory', mode: 'eager' },
  { from: 'ds-search-graph', to: 'tool-atlas', mode: 'lazy' },

  // intermediates → tools (build-time embeds)
  { from: 'int-state-data', to: 'tool-multi-lens', mode: 'embedded' },
  { from: 'int-metrics-config', to: 'tool-multi-lens', mode: 'embedded' },
  { from: 'int-data-years', to: 'tool-multi-lens', mode: 'embedded' },
  { from: 'int-state-data', to: 'tool-learn-rounds', mode: 'embedded' },
  { from: 'int-references', to: 'tool-learn-rounds', mode: 'embedded' },
  { from: 'int-entities', to: 'tool-atlas-craft', mode: 'embedded' },
];

/* ────────────────────────────────────────────────────────────────────
   PLAIN TERMS — one simple-language sentence or two per node: what it is
   and how it works within the site. Rendered first in the Observatory's
   side panel. Every node MUST have one; the build warns on gaps.
──────────────────────────────────────────────────────────────────── */
const PLAIN = {
  // sources
  'src-cms-care-compare': 'The federal government\'s public list of every Medicare-certified hospital. We download it, clean it, and merge it into our one hospital file.',
  'src-cms-asc':          'CMS\'s public list of Medicare-certified outpatient surgery centers. The raw material behind us-ascs.json.',
  'src-cms-dialysis':     'CMS\'s public list of dialysis clinics, including which chain runs each one. Becomes us-dialysis.json.',
  'src-cms-dmepos':       'CMS\'s directory of medical equipment suppliers, pharmacies, and optical shops. A build script downloads the current copy and splits it into four map layers.',
  'src-cdc-places':       'CDC\'s county-by-county health estimates: diabetes, obesity, checkups, and more. A pull script refreshes our county metrics from it.',
  'src-bls-laus':         'The Bureau of Labor Statistics\' county unemployment numbers. One feeder of the county metrics file.',
  'src-census-saipe':     'Census income and poverty estimates for every county. Another feeder of the county metrics file.',
  'src-census-sahie':     'Census health-insurance coverage estimates for every county. Another feeder of the county metrics file.',
  'src-census-fips':      'The government\'s numbering system for states and counties, plus the map shapes. The spine every geographic file on this site joins on.',
  'src-ahrq':             'A federal research file that says which health system owns which hospital. Merged into the hospital file so the map can browse by system.',
  'src-hifld':            'Federal infrastructure data carrying bed counts and facility locations. Another leg of the hospital merge.',
  'src-bls-ooh':          'The government\'s career handbook: typical pay and projected job growth for every occupation. Powers the Career Tree\'s salary and outlook layers.',
  'src-hand-curated':     'Everything written by hand for this site: the career tree structure, the vendor list, the metric ledger, the atlas concepts, the citation ledger. The editorial layer.',

  // pipeline scripts
  'js-pull-places':    'Fetches fresh CDC county health numbers and writes them into countyData.json. Run when CDC publishes a new year.',
  'js-pull-bls':       'Fetches county unemployment from BLS and writes it into countyData.json.',
  'js-pull-saipe':     'Fetches county income estimates from the Census into countyData.json.',
  'js-pull-sahie':     'Fetches county uninsured rates from the Census into countyData.json.',
  'js-build-suppliers':'Downloads the CMS supplier directory, collapses duplicate storefronts into single points, and splits the result into the four supplier map layers.',
  'js-build-geo':      'Downloads county map shapes and population, and writes the geographic base files the maps draw.',
  'js-build-data':     'The adder-upper: facilities per state, per county, per system. Its outputs feed page templates while the site builds.',
  'js-build-entities': 'The big joiner. Reads every major dataset, links hospitals to states to metrics to careers into one graph, and writes the Atlas search file. Refuses to build if any link dangles.',

  // datasets (deployed)
  'ds-us-hospitals':      'Every U.S. hospital in one file: name, location, type, beds, star rating, owning system. The Hospital Operations Map loads it the moment the page opens.',
  'ds-us-ascs':           'Outpatient surgery centers. Sits on the shelf until you toggle that layer on the map.',
  'ds-us-dialysis':       'Dialysis clinics with their chains. Loads on the map when toggled.',
  'ds-suppliers-pharmacy':'Every Medicare-enrolled pharmacy, 40,000+ points. The heaviest file on the site, which is exactly why it only loads when you ask for it, one state at a time.',
  'ds-suppliers-dme':     'Home medical equipment suppliers. Loads on toggle.',
  'ds-suppliers-optical': 'Optical and vision suppliers. Loads on toggle.',
  'ds-suppliers-op':      'Orthotics and prosthetics suppliers. Loads on toggle.',
  'ds-us-counties':       'The population of every county. The maps use it for labels and per-person math.',
  'ds-us-lakes':          'Lakes and coastline shapes, so the maps read as maps.',
  'ds-county-data':       'County health, income, and coverage metrics across three lenses. Both maps tint counties with it, and the four pull scripts are what keep it fresh.',
  'ds-career-tree':       'The Career Tree itself: 158 real roles, their families and tiers, and the promotion roads between them. Edit this file and the tool redraws.',
  'ds-career-tree-bls':   'Real pay and job growth per role, matched to government occupation codes. The Career Tree\'s salary heatmap.',
  'ds-career-tree-growth':'The how-to text behind each expertise tile: how you build the skill, how you show it.',
  'ds-career-tree-creds': 'The credential reality file: exam pass rates, fees, program lengths, and what getting into each program takes. Powers the credential panels, the plan\'s bill, and the Getting-in checklists.',
  'ds-vendors':           'The healthcare-tech vendor directory: 117 companies across 20 sectors, with sourced market-share notes.',
  'ds-search-graph':      'One big web connecting everything on this page: hospitals, states, metrics, careers, concepts. Atlas search reads it, and it is only fetched when someone actually searches.',

  // build-time intermediates
  'int-state-data':        'State numbers for all seven lenses of the Multi-Lens Map. Baked directly into that page when the site builds, so the map opens with zero data fetches.',
  'int-metrics-config':    'The ledger for those numbers: what each metric is, which source it came from, and when we retrieved it. The provenance system.',
  'int-data-years':        'Which year each metric\'s data actually comes from. Keeps the maps honest about vintage.',
  'int-references':        'Every outside source the site cites, in one list with per-article tags. The /learn/sources/ page is rendered from it at build.',
  'int-registries':        'The shared spelling of things: state codes, county IDs, health-system names, facility types. Every other file agrees with these six.',
  'int-entities':          'The full typed graph before trimming. Too big to ship to browsers; instead it is injected into Atlas Craft while the site builds.',
  'int-search-index':      'A build-time search helper. Never deployed; the live site uses the smaller search graph instead.',
  'int-fac-state':         'Facilities added up per state. Used while building pages, never shipped to browsers.',
  'int-fac-county':        'Facilities added up per county. Build-time only.',
  'int-fac-system':        'Facilities added up per health system. Build-time only.',
  'int-national-summary':  'The national totals a few pages quote. Computed at build, never shipped.',
  'int-suppliers-by-state':'Supplier counts per state: the small summary the graph builder reads so it never has to open the four big supplier files.',

  // tools
  'tool-operators-map':    'The facility map. Opens with hospitals loaded; every other layer streams in only when you toggle it.',
  'tool-multi-lens':       'The state choropleth with seven lenses. State data rides inside the page itself; county detail arrives at startup.',
  'tool-career-tree':      'The career planner. Loads all four career files up front, then everything runs in the browser.',
  'tool-vendor-directory': 'The vendor browser: one data file, loaded on open.',
  'tool-atlas':            'The concept atlas. Browsing costs nothing; search taps the big graph, fetched lazily on first use.',
  'tool-atlas-craft':      'The relationship-explorer canvas. Its entire dataset was baked into the page at build time.',
  'tool-hospital-map':     'The older camera-zoom hospital map. Self-contained.',
  'tool-sql-mystery':      'The SQL teaching game. All data is synthetic, on purpose. Nothing fetched.',
  'tool-iceberg-map':      'The hand-drawn concept map. No data files at all.',
  'tool-learn-rounds':     'The article pages. Any live statistic they quote was pulled from the state data while the site built.',
};

/* ── merge live stats ─────────────────────────────────────────────── */
const missing = [];
function statOne(rel) {
  try { return fs.statSync(path.join(ROOT, rel)); }
  catch { missing.push(rel); return null; }
}

const nodes = NODES.map((n) => {
  const out = { id: n.id, kind: n.kind, label: n.label };
  if (n.stat) {
    out.path = n.stat;
    const s = statOne(n.stat);
    if (s) { out.bytes = s.size; out.mtime = s.mtime.toISOString(); }
    else { out.note = 'file missing at build time'; }
  } else if (n.stats) {
    out.path = n.path;
    let bytes = 0, mtime = 0, found = 0;
    for (const rel of n.stats) {
      const s = statOne(rel);
      if (s) { bytes += s.size; mtime = Math.max(mtime, s.mtime.getTime()); found++; }
    }
    if (found) { out.bytes = bytes; out.mtime = new Date(mtime).toISOString(); }
    else { out.note = 'files missing at build time'; }
  } else if (n.path) {
    out.path = n.path;
  }
  if (n.refresh) out.refresh = n.refresh;
  if (n.provenance) out.provenance = n.provenance;
  if (PLAIN[n.id]) out.plain = PLAIN[n.id];
  if (n.detail) out.detail = n.detail;
  if (n.consumers) out.consumers = n.consumers;
  return out;
});

const noPlain = nodes.filter((n) => !n.plain).map((n) => n.id);
if (noPlain.length) console.warn('  WARN: nodes missing a PLAIN entry: ' + noPlain.join(', '));

/* ── validate: no dangling edges, no duplicate ids ────────────────── */
const ids = new Set();
for (const n of nodes) {
  if (ids.has(n.id)) { console.error('FATAL: duplicate node id "' + n.id + '"'); process.exit(1); }
  ids.add(n.id);
}
const dangling = EDGES.filter((e) => !ids.has(e.from) || !ids.has(e.to));
if (dangling.length) {
  console.error('FATAL: dangling edge endpoints:');
  for (const e of dangling) console.error('  ' + e.from + ' -> ' + e.to);
  process.exit(1);
}

/* ── write ────────────────────────────────────────────────────────── */
const out = {
  _meta: {
    generated_by: 'scripts/build-datamap.js',
    generated: new Date().toISOString(),
    note: 'Curated architecture table merged with live fs.stat. Regenerate after adding a dataset or tool.',
  },
  nodes,
  edges: EDGES,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log('datamap: ' + nodes.length + ' nodes, ' + EDGES.length + ' edges -> ' + path.relative(ROOT, OUT) + ' (' + kb + ' KB)');
if (missing.length) console.log('  note: ' + missing.length + ' file(s) not found on disk: ' + missing.join(', '));
