module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addPassthroughCopy({"src/tools/clinical-sql-mystery": "tools/clinical-sql-mystery"});
  eleventyConfig.addPassthroughCopy("src/downloads");

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
