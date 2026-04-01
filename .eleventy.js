module.exports = function(eleventyConfig) {

  // Copy static assets to the built site as-is
  eleventyConfig.addPassthroughCopy("src/assets");

  // Tell Eleventy where to find source files and where to output the built site
  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    // Allow HTML files to use the layout system
    htmlTemplateEngine: "njk"
  };
};