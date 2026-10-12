// THE AUTHORS on the About page (2026-10-11, his pick A on AB2: "go with A"). Every author is one card with the same parts:
// a photo, a name, credentials, a role line, the bio (its first part face up, the rest behind "More about"), credentials
// tiles if any, what they wrote here, and their links. A new guest or staff author is a new entry here; the page and the card
// (src/_includes/components/author-card.njk) do not change. The words were moved off the About page as written.
//   bio, more, moreAfter: paragraphs (HTML allowed); credentials: {abbr, full}; works: {href, title, meta}
module.exports = [
  {
    id: "david-eitel",
    name: "David Eitel",
    creds: "RRT · MHA · MSRT · RRT-ACCS",
    role: "Founder and editor",
    photo: "/assets/images/David_Picture.jpg",
    photoW: 341,
    photoH: 512,
    tags: [
      "Respiratory Therapy",
      "Health Administration",
      "Clinical Informatics",
      "EHR Architecture",
      "Health Data Standards",
      "AI in Healthcare"
    ],
    bio: [
      "I started my career as a Registered Respiratory Therapist in the ICU: bedside care, mechanical ventilation, hemodynamic monitoring, and all the documentation that goes with it. That experience gave me something rare in informatics: I know what the data <em>means</em> at the bedside, and I know how it lives in the tables. Most people in this field get one or the other."
    ],
    more: [
      "From there I moved through health administration and into clinical informatics. That&rsquo;s the operational layer where clinical care, data architecture, and health system management intersect. That path is what makes this map possible."
    ],
    credentials: [
      {
        abbr: "RRT",
        full: "Registered Respiratory Therapist &middot; National Board for Respiratory Care (NBRC)"
      },
      {
        abbr: "MHA",
        full: "Master of Health Administration &middot; Graduate-level health systems leadership and management"
      },
      {
        abbr: "MSRT",
        full: "Master of Science in Respiratory Therapy &middot; Advanced clinical and research credentials"
      },
      {
        abbr: "RRT-ACCS",
        full: "Adult Critical Care Specialty &middot; NBRC specialty credential for ICU and acute care"
      }
    ],
    moreAfter: [
      "I currently work at <strong>Intermountain Health</strong> in healthcare informatics. Healthcare Uncharted is an independent educational project &middot; not affiliated with or endorsed by my employer."
    ],
    works: [],
    linkedin: "https://www.linkedin.com/in/davidmeitel/",
    card: "/me/"
  },
  {
    id: "chrysalis-ashton",
    name: "Chrysalis Ashton",
    creds: "MSRC · RRT",
    role: "Guest author",
    photo: "/assets/images/chrysalis_ashton.jpg",
    photoW: 320,
    photoH: 320,
    tags: [
      "Post-Acute Care",
      "Home Care &amp; DME",
      "Advocacy"
    ],
    bio: [
      "Chrysalis Ashton is a respiratory therapist with 13 years of experience and a dedicated advocate for the post-acute care profession. After beginning her career in acute care, she found her passion for home care and DME, where she has served in several roles including Clinical Director and Compliance Officer."
    ],
    more: [
      "Chrysalis actively advances the respiratory profession by coordinating partnerships with RT education programs, mentoring future clinicians, and volunteering as an AARC Delegate and home care chair-elect for her state respiratory society. She is a graduate of the AARC&rsquo;s inaugural Emerging Leaders Program (2024), a COPD Foundation State Captain, and participates in several AAHomecare committees and work groups."
    ],
    credentials: [],
    moreAfter: [],
    works: [
      {
        href: "/learn/oxygen-payment-cuts/",
        title: "The Erosion of Home Oxygen Reimbursement",
        meta: "Medicare Reimbursement &middot; Home Oxygen Therapy &middot; 1989&ndash;2025 &middot; An interactive analysis of 35 years of payment cuts and their impact on patient access and provider viability."
      },
      {
        href: "/learn/home-respiratory-timeline/",
        title: "History of Home Respiratory Therapy",
        meta: "Historical Reference &middot; Home Care &middot; 1940s&ndash;Present &middot; From \"oxygen orderlies\" in the 1940s to modern PAP therapy and home ventilation &middot; a century of evolution in the home care setting."
      }
    ],
    linkedin: "https://www.linkedin.com/in/chrysalis-ashton-msrc-rrt-23a033bb/"
  }
];
