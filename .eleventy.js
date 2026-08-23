module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/downloads");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/site.webmanifest");
  eleventyConfig.addPassthroughCopy("src/brand");                                  // brand kit -> /brand/
  eleventyConfig.addPassthroughCopy({ "src/brand/favicon.ico": "favicon.ico" });   // root /favicon.ico for auto-discovery

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
