module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addPassthroughCopy({"src/tools/clinical-sql-mystery": "tools/clinical-sql-mystery"});
  eleventyConfig.addPassthroughCopy({"src/tools/ai-healthcare-map": "tools/ai-healthcare-map"});
  eleventyConfig.addPassthroughCopy("src/downloads");

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

  // ── FILTERS ──────────────────────────────────────────────────────────
  eleventyConfig.addFilter("dateFilter", function(date) {
    if (!date) return "";
    const d = new Date(date);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return d.toLocaleDateString("en-US", options);
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
