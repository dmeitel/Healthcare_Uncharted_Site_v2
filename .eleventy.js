module.exports = function(eleventyConfig) {

  /* What is copied into the site as it is: [source, where it lands]. One list, read twice: by the copy, and by the
     prune after a full build, which keeps a copied file only while its source is still in src. */
  const PASSTHROUGH = [
    ["src/assets", "assets"],
    ["src/downloads", "downloads"],
    ["src/robots.txt", "robots.txt"],
    ["src/site.webmanifest", "site.webmanifest"],
    ["src/brand", "brand"],                     // brand kit -> /brand/
    ["src/brand/favicon.ico", "favicon.ico"],   // root /favicon.ico for auto-discovery
    ["src/.well-known/security.txt", ".well-known/security.txt"],   // how to report a security problem (RFC 9116), 2026-10-11
  ];
  for (const [src, out] of PASSTHROUGH) {
    if (src === "src/" + out) eleventyConfig.addPassthroughCopy(src);
    else eleventyConfig.addPassthroughCopy({ [src]: out });
  }

  /* Data files under src/assets/data that no page ever fetches. All of src/assets
     is passed through, so without this they ship: 6.7MB of dead weight per deploy.
     us-suppliers-pharmacy.json is a pipeline input (build-geo-serving.js and
     build-hospital-enrichment.js read it from the repo, not from the site).
     us-lakes.json is a leftover of the pre-MapLibre canvas maps, which drew their
     own water; the vector basemap has drawn it since. Confirm a candidate is
     really orphaned by grepping the built _site for its filename before adding it. */
  const NOT_SHIPPED = ["us-suppliers-pharmacy.json", "us-lakes.json"];
  eleventyConfig.on("eleventy.after", ({ dir }) => {
    const fs = require("fs"), path = require("path");
    for (const name of NOT_SHIPPED) {
      const f = path.join(dir.output, "assets", "data", name);
      if (fs.existsSync(f)) fs.rmSync(f);
    }
  });

  /* A full build leaves nothing behind it did not make (David, 2026-10-07: "make sure we delete old pages ... so they
     don't get found"). Eleventy never deletes, so a page that moved stayed in _site on this computer, where the hub and
     the checks read it. Not on the live-reload server's partial rebuilds, which write only what changed.
     scripts/lib/prune-site.js; tests/prune-site.test.js. */
  eleventyConfig.on("eleventy.after", ({ dir, results, runMode, incremental, outputMode }) => {
    if (runMode !== "build" || incremental || (outputMode && outputMode !== "fs") || !Array.isArray(results)) return;
    const { pruneSite, pageOf } = require("./scripts/lib/prune-site.js");
    const r = pruneSite({ out: dir.output, root: __dirname, written: results.map(t => t.outputPath), passthrough: PASSTHROUGH });
    if (r.refused) console.log("[11ty] Prune skipped: " + r.refused + ".");
    else if (r.removed.length) {
      const pages = r.removed.filter(f => /(^|\/)index\.html$/.test(f)).map(pageOf);
      console.log("[11ty] Pruned " + r.removed.length + " file(s) no source makes any more" + (pages.length ? ", " + pages.length + " of them pages: " + pages.join(" ") : "") + ".");
    }
  });

  // ── COLLECTIONS ──────────────────────────────────────────────────────────
  // Define named collections for site architecture (avoiding data-file shadowing)
  
  eleventyConfig.addCollection("learnPages", function(collection) {
    return collection
      .getAll()
      .filter(item => item.data.section === "learn" && item.data.status === "published")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

  eleventyConfig.addCollection("toolPages", function(collection) {
    return collection
      .getAll()
      .filter(item => item.data.section === "tool")
      .sort((a, b) => (a.data.order || 999) - (b.data.order || 999));
  });

  eleventyConfig.addCollection("labPages", function(collection) {
    return collection
      .getAll()
      .filter(item => item.data.section === "lab")
      .sort((a, b) => (a.data.order || 999) - (b.data.order || 999));
  });

  eleventyConfig.addCollection("talkPages", function(collection) {
    return collection
      .getAll()
      .filter(item => item.data.section === "talk")
      .sort((a, b) => {
        const aDate = a.data.date ? new Date(a.data.date) : new Date(0);
        const bDate = b.data.date ? new Date(b.data.date) : new Date(0);
        return bDate - aDate;
      });
  });

  eleventyConfig.addCollection("roundsPages", function(collection) {
    return collection
      .getAll()
      .filter(item => item.data.section === "rounds" && item.data.status === "published")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

  // The games, a section of their own since 2026-10-11 (DECISIONS BR3); the home page's Fun key counts them.
  eleventyConfig.addCollection("funPages", function(collection) {
    return collection.getAll().filter(item => item.data.section === "fun");
  });

  eleventyConfig.addCollection("featuredPages", function(collection) {
    const all = collection.getAll();
    const featured = all.filter(item => {
      const isFeatured = item.data.featured === true;
      const isPublished = item.data.status === "published";
      const hasData = !!item.data;
      return isFeatured && isPublished && hasData;
    });
    return featured.sort((a, b) => {
      const aDate = a.data.date ? new Date(a.data.date) : new Date(0);
      const bDate = b.data.date ? new Date(b.data.date) : new Date(0);
      return bDate - aDate;
    });
  });

  // ── LEARN MODULES collection ─────────────────────────────────────────
  // Counts standalone learn pages (passthrough copies — no frontmatter)
  // by matching their output URL pattern. Excludes the index and talks.
  eleventyConfig.addCollection("learnModules", function(collection) {
    return collection.getAll().filter(item => {
      if (!item.url) return false;
      return (
        item.url.includes("/learn/") &&
        !item.url.includes("/talks/") &&
        item.url !== "/learn/"
      );
    });
  });

  // ── FILTERS ──────────────────────────────────────────────────────────
  // A page's real last-changed date: the last commit that touched its source (2026-10-11, the sitemap's lastmod; Google
  // uses lastmod only when it is accurate, and a file's own timestamp is the clone time on Netlify). Falls back to the
  // page's date when git has no answer.
  const lastChangedCache = new Map();
  eleventyConfig.addFilter("lastChanged", function(inputPath, fallback) {
    if (!inputPath) return fallback;
    if (!lastChangedCache.has(inputPath)) {
      let iso = "";
      try { iso = require("child_process").execFileSync("git", ["log", "-1", "--format=%cI", "--", inputPath], { encoding: "utf8" }).trim(); } catch (e) { iso = ""; }
      lastChangedCache.set(inputPath, iso);
    }
    const iso = lastChangedCache.get(inputPath);
    return iso ? new Date(iso) : fallback;
  });

  eleventyConfig.addFilter("json", function(value) {
    return JSON.stringify(value);
  });

  eleventyConfig.addFilter("dateFilter", function(date) {
    if (!date) return "";
    const d = new Date(date);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return d.toLocaleDateString("en-US", options);
  });

  eleventyConfig.addFilter("dateISO", function(date) {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  });

  // RSS 2.0 requires RFC-822 dates ("Thu, 10 Sep 2026 00:00:00 GMT"), which is
  // what toUTCString produces. Only feed.njk uses this; dateISO is date-only and
  // a <pubDate> without a time is rejected by some readers and mail services.
  eleventyConfig.addFilter("dateRFC822", function(date) {
    if (!date) return "";
    return new Date(date).toUTCString();
  });

  return {
    dir: {
      input:    "src",
      includes: "_includes",
      data:     "_data",
      output:   "_site"
    },
    htmlTemplateEngine: "njk"
  };

};
