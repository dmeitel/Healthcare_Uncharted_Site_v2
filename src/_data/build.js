// Build stamp — evaluated once per Eleventy build, i.e. the last deploy.
// `date` is surfaced on the home page Site Status as "Last updated".
// `commit` is the commit Netlify built from (it sets COMMIT_REF); it is published as /version.txt
// so `npm run ship -- --live` can tell when the live site is on the commit that was pushed.
// On David's computer there is no COMMIT_REF and the file says "local".
module.exports = {
  date: new Date().toISOString(),
  commit: process.env.COMMIT_REF || '',
};
