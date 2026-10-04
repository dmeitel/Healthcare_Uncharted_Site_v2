# Vital Stats: where each number lives on the site

Written 2026-10-03 by `node scripts/report-vital-stats-links.js`. Re-run it after any change to the question builders or the tools.

Every answer screen in the game now links to the view of a site tool that shows the number, or the thing the question
is about. EXACT means the view shows the question's own number. NEAR means it opens on the right state, job, system or
hospital but the number itself is not on the page yet. NONE means nothing on the site has it. The NEAR and NONE groups
below are the work list for step 2, biggest first.

| Questions | Exact | Near | None |
|---|---|---|---|
| Everyday and state games (3,669) | 3,505 | 142 | 22 |
| Health system games (23,641) | 23,606 | 35 | 0 |

## Everyday and state games: what is not exact yet

### 96 questions: The map shows these hospitals but has no filter for this count.

- How many hospitals on CMS's Care Compare hospital list in June 2026 had a five-star overall rating? (opens every hospital on the U.S. Hospital Operations Map)
- How many hospitals on CMS's Care Compare hospital list in June 2026 reported no emergency services? (opens every hospital on the U.S. Hospital Operations Map)
- How many for-profit hospitals were on CMS's Care Compare hospital list in June 2026? (opens every hospital on the U.S. Hospital Operations Map)
- and 93 more

### 27 questions: The map is by state; this U.S. total is not written on it.

- What percent of people in the U.S. were uninsured for all of 2025? (opens every state on the U.S. Population Health Map)
- How many people in the U.S. were uninsured for all of 2025, in millions? (opens every state on the U.S. Population Health Map)
- What percent of people in the U.S. had employment-based health insurance for some or all of 2025? (opens every state on the U.S. Population Health Map)
- and 24 more

### 22 questions: Nothing on the site shows this yet.

- How much did the U.S. spend on health care in 2024, in trillions of dollars?
- How much did the U.S. spend on health care per person in 2024, in dollars?
- What share of U.S. gross domestic product went to health care in 2024, as a percent?
- and 19 more

### 9 questions: The map colors every state, but counting the states over the line is left to the reader.

- As of 2026, how many states, counting DC, have adopted the ACA Medicaid expansion? (opens every state on the U.S. Population Health Map)
- In how many of the fifty states did at least one in three adults have obesity in 2023? (opens every state on the U.S. Population Health Map)
- In how many of the fifty states did 15 percent or more of adults smoke cigarettes in 2023? (opens every state on the U.S. Population Health Map)
- and 6 more

### 6 questions: The map's price view was taken down 2026-07-29 (the price project is parked).

- What gross charge does Intermountain Medical Center post for a brain MRI without contrast (CPT 70551), in dollars? (opens Intermountain Medical Center on the U.S. Hospital Operations Map)
- What gross charge does University of Utah Hospital and Clinics post for a brain MRI without contrast (CPT 70551), in dollars? (opens University of Utah Hospital on the U.S. Hospital Operations Map)
- What gross charge does Brigham City Community Hospital post for a brain MRI without contrast (CPT 70551), in dollars? (opens Utah on the U.S. Hospital Operations Map)
- and 3 more

### 4 questions: The map shows every state's median; the gap between the top and bottom state is left to the reader.

- How far apart, in dollars a year, were the median pay for registered nurses in the best-paid state and in the lowest-paid state in May 2025? (opens every state on the U.S. Population Health Map)
- How far apart, in dollars a year, were the median pay for respiratory therapists in the best-paid state and in the lowest-paid state in May 2025? (opens every state on the U.S. Population Health Map)
- How far apart, in dollars a year, were the median pay for nurse practitioners in the best-paid state and in the lowest-paid state in May 2025? (opens every state on the U.S. Population Health Map)
- and 1 more

## Health system games: by question type

| Type | Questions | On the map? | What is missing |
|---|---|---|---|
| beds | 2,872 | exact |  |
| fte | 2,612 | exact |  |
| occ | 2,538 | exact |  |
| dc | 2,534 | exact |  |
| mcr | 2,482 | exact |  |
| los | 2,424 | exact |  |
| mcd | 2,418 | exact |  |
| icu | 1,929 | exact |  |
| res | 913 | exact |  |
| state | 436 | exact |  |
| count | 250 | exact |  |
| beds-all | 250 | exact |  |
| fte-all | 250 | exact |  |
| dc-all | 248 | exact |  |
| mcr-all | 248 | exact |  |
| mcd-all | 248 | exact |  |
| icu-all | 246 | exact |  |
| res-all | 212 | exact |  |
| rural | 153 | exact |  |
| cah | 137 | exact |  |
| share | 112 | exact |  |
| states | 94 | exact |  |
| cur-staff (the system's own figure) | 7 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| count (the system's own figure) | 4 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-revenue (the system's own figure) | 4 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-volume (the system's own figure) | 2 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-clin (the system's own figure) | 2 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-births (the system's own figure) | 2 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-magnet (the system's own figure) | 2 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| beds-all (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| states (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-offices (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-members (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-member-states (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-video-visits (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-clinics (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-select-health (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-ed-visits (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| dc-all (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-er-visits (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
| cur-community-benefit (the system's own figure) | 1 | near | The system publishes this itself; the map shows the cost report figures beside it. |
