module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addPassthroughCopy({"src/tools/ai-healthcare-map":    "tools/ai-healthcare-map"});
  eleventyConfig.addPassthroughCopy({"src/tools/clinical-sql-mystery": "tools/clinical-sql-mystery"});
  eleventyConfig.addPassthroughCopy("src/downloads");

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    htmlTemplateEngine: "njk"
  };

};
