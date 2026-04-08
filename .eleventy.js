module.exports = function(eleventyConfig) {

  // Copy static assets to the built site as-is
  eleventyConfig.addPassthroughCopy("src/assets");

  // Tool pages — standalone HTML files, passed through without Eleventy processing
  // Each becomes a clean URL: /tools/ai-healthcare-map/, etc.
  eleventyConfig.addPassthroughCopy({"src/tools/ai-healthcare-map":               "tools/ai-healthcare-map"});
  eleventyConfig.addPassthroughCopy({"src/tools/clinical-sql-mystery":            "tools/clinical-sql-mystery"});
  eleventyConfig.addPassthroughCopy({"src/tools/event-vs-request-vs-observation": "tools/event-vs-request-vs-observation"});

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    htmlTemplateEngine: "njk"
  };

};