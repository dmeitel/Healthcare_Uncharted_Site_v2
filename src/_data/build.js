// Build timestamp — evaluated once per Eleventy build, i.e. the last deploy.
// Surfaced on the home page Site Status as "Last updated".
module.exports = {
  date: new Date().toISOString(),
};
