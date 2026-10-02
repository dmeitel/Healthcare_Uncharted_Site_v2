# Vital Stats · the Intermountain numbers, for David to check

Every number the Intermountain game can ask about one hospital, one row per hospital, biggest first. Built 2026-10-01 from
the hospitals' 2024 Medicare cost reports (CMS HCRIS). A blank cell means the game does not ask that question about that
hospital (no full year on file, too few beds, no residents).

**What to look for:** a number you know is wrong, a hospital that is missing or does not belong to Intermountain, or a
name nobody uses. Say which row and what you know; Claude traces it back to the report and either fixes the row or drops
the question. Do not send anything from inside Intermountain's own systems; the game only uses public numbers.

**How the numbers are counted, so a fair difference is not read as an error:**

- Beds are the beds each hospital kept available over the year on its cost report, which usually runs under its licensed count.
- ICU beds count every intensive and special care unit on the report, neonatal and pediatric included.
- Medicare and Medicaid shares are shares of inpatient days and include Medicare Advantage and Medicaid managed care.
- Employees are hospital payroll in full-time equivalents. Clinics, Select Health and system offices file no cost report.

| Hospital | Where | Beds | ICU beds | Discharges | Avg stay, days | Beds filled % | Medicare % | Medicaid % | Employees (FTE) | Residents (FTE) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Intermountain Medical Center | Murray, UT | 486 | 144 | 27,950 | 5.0 | 78 | 39 | 21 | 3,908 | 75 |
| Primary Children's Hospital | Salt Lake City, UT | 353 | 160 | 13,471 | 6.6 | 71 |  | 44 | 4,072 | 171 |
| Saint Joseph Hospital | Denver, CO | 352 | 81 | 15,746 | 4.9 | 60 | 36 | 31 | 1,741 | 102 |
| Utah Valley Hospital | Provo, UT | 307 | 91 | 17,725 | 4.6 | 72 | 38 | 25 | 2,267 | 23 |
| McKay-Dee Hospital | Ogden, UT | 287 | 82 | 17,596 | 4.2 | 70 | 34 | 27 | 2,032 | 21 |
| St. George Regional Hospital | St George, UT | 280 | 56 | 19,818 | 3.9 | 75 | 48 | 20 | 2,137 |  |
| LDS Hospital | Salt Lake City, UT | 256 | 28 | 9,744 | 4.7 | 49 | 26 | 28 | 1,154 |  |
| St. Mary's Regional Hospital | Grand Junction, CO | 252 | 56 | 12,024 | 5.0 | 65 | 47 | 27 | 1,551 | 25 |
| Lutheran Medical Center | Wheat Ridge, CO | 235 | 44 | 11,678 | 4.4 | 60 | 51 | 25 | 1,500 |  |
| St. Vincent Regional Hospital | Billings, MT | 226 | 49 | 12,272 | 5.0 | 74 | 42 | 26 | 1,262 | 9 |
| Good Samaritan Medical Center | Lafayette, CO | 183 | 36 | 10,093 | 4.4 | 66 | 54 | 17 | 950 |  |
| Logan Regional Hospital | Logan, UT | 121 | 32 | 6,175 | 3.4 | 47 | 33 | 21 | 812 |  |
| Platte Valley Hospital | Brighton, CO | 89 | 16 | 3,788 | 3.5 | 41 | 39 | 32 | 564 |  |
| American Fork Hospital | American Fork, UT | 89 | 29 | 6,687 | 3.4 | 70 | 20 | 15 | 707 |  |
| Riverton Hospital | Riverton, UT | 87 | 23 | 5,425 | 3.5 | 60 | 22 | 16 | 591 |  |
| St. James Hospital | Butte, MT | 69 | 11 | 2,641 | 4.0 | 42 | 57 | 20 | 348 |  |
| Alta View Hospital | Sandy, UT | 57 | 6 | 3,031 | 3.1 | 45 | 38 | 13 | 438 |  |
| Cedar City Hospital | Cedar City, UT | 48 | 6 | 2,199 | 2.5 | 31 | 40 | 23 | 365 |  |
| Park City Hospital | Park City, UT | 37 | 4 | 1,518 | 2.5 | 28 | 33 | 14 | 311 |  |
| Layton Hospital | Layton, UT | 37 | 4 | 4,231 | 2.6 | 81 | 21 | 16 | 419 |  |
| Spanish Fork Hospital | Spanish Fork, UT | 28 |  | 1,871 | 2.6 | 48 | 26 | 17 | 280 |  |
| Cassia Regional Hospital | Burley, ID | 25 | 6 | 1,347 | 3.1 | 46 | 40 | 26 | 278 |  |
| Holy Rosary Hospital | Miles City, MT | 25 | 5 | 687 | 6.4 | 48 | 56 | 14 | 221 |  |
| Sevier Valley Hospital | Richfield, UT | 24 |  | 837 | 2.6 | 25 | 44 | 20 | 157 |  |
| Orem Community Hospital | Orem, UT | 24 |  | 802 | 3.3 | 30 |  | 19 | 126 |  |
| Fillmore Community Hospital | Fillmore, UT | 19 |  | 228 | 3.7 | 12 |  |  | 56 |  |
| Heber Valley Hospital | Heber City, UT | 19 |  | 795 | 2.6 | 29 | 38 | 9 | 155 |  |
| Delta Community Hospital | Delta, UT | 18 |  | 193 |  | 11 |  |  | 62 |  |
| Sanpete Valley Hospital | Mount Pleasant, UT | 18 |  | 424 | 3.1 | 20 | 49 | 13 |  |  |
| Bear River Valley Hospital | Tremonton, UT | 16 |  | 359 | 2.4 | 15 |  |  | 111 |  |
| Garfield Memorial Hospital | Panguitch, UT | 15 |  | 270 | 4.2 | 21 | 53 | 7 | 99 |  |

## The system as a whole

- How many full-time-equivalent employees do Intermountain Health's hospitals have on payroll, added together? **28,684**  
  From all 31 hospitals' latest cost reports, mostly 2024. (Medicare hospital cost reports (CMS HCRIS, Worksheet S-3), fiscal year 2024 file)
- How many full-time-equivalent resident physicians train in Intermountain Health's hospitals, added together? **428**  
  7 of its hospitals report residents; Primary Children's Hospital trains the most, 171. (Medicare hospital cost reports (CMS HCRIS, Worksheet S-3), fiscal year 2024 file)
- How many caregivers worked for Intermountain Health in 2025? **69,500**  
  17,500 of them are nurses. (Intermountain Health, 2025 System Fast Facts)
- How many nurses worked for Intermountain Health in 2025, by its fact sheet? **17,500**  
  Out of 69,500 caregivers in all. (Intermountain Health, 2025 System Fast Facts)
- Across all of Intermountain Health's hospitals, what percent of inpatient days were for Medicare patients? **36%**  
  Across every U.S. hospital's cost report it is 44 percent. (Medicare hospital cost reports (CMS HCRIS, Worksheet S-3), fiscal year 2024 file)
- Across all of Intermountain Health's hospitals, what percent of inpatient days were for Medicaid patients? **25%**  
  Across every U.S. hospital's cost report it is 24 percent. (Medicare hospital cost reports (CMS HCRIS, Worksheet S-3), fiscal year 2024 file)
- How many people does Select Health, Intermountain's health plan, cover, in millions? **1.1 million**  
  Select Health was founded in 1983, by its own 2025 fact sheet. (Intermountain Health, 2025 System Fast Facts)
- How many hospitals does Intermountain Health run, by the federal list of health systems? **31**  
  Utah 22, Colorado 5, Montana 3 and Idaho 1. A system's own count can differ: it may count campuses on their own, or hospitals that joined after 2023. (AHRQ Compendium of U.S. Health Systems, 2023, matched to CMS's hospital list (the site's June 2026 pull))
- In how many states does Intermountain Health run a hospital, by the federal list? **4**  
  Colorado, Idaho, Montana and Utah. (AHRQ Compendium of U.S. Health Systems, 2023, matched to CMS's hospital list (the site's June 2026 pull))
- How many Intermountain Health hospitals are in Utah, by the federal list? **22**  
  That is 22 of the 52 hospitals in Utah on CMS's list. (AHRQ Compendium of U.S. Health Systems, 2023, matched to CMS's hospital list (the site's June 2026 pull))
- How many Intermountain Health hospitals are in Colorado, by the federal list? **5**  
  That is 5 of the 97 hospitals in Colorado on CMS's list. (AHRQ Compendium of U.S. Health Systems, 2023, matched to CMS's hospital list (the site's June 2026 pull))
- How many Intermountain Health hospitals are in Montana, by the federal list? **3**  
  That is 3 of the 63 hospitals in Montana on CMS's list. (AHRQ Compendium of U.S. Health Systems, 2023, matched to CMS's hospital list (the site's June 2026 pull))
- How many Intermountain Health hospitals are in Idaho, by the federal list? **1**  
  That is 1 of the 48 hospitals in Idaho on CMS's list. (AHRQ Compendium of U.S. Health Systems, 2023, matched to CMS's hospital list (the site's June 2026 pull))
- What percent of the hospitals in Utah belong to Intermountain Health? **42%**  
  22 of 52. The next biggest system there, HCA Healthcare, has 8. (CMS Care Compare, Hospital General Information (the site's June 2026 pull), matched to AHRQ's 2023 Compendium)
- How many of Intermountain Health's hospitals are critical access hospitals? **7**  
  They are Cassia Regional Hospital, Delta Community Hospital, Fillmore Community Hospital, Garfield Memorial Hospital, Heber Valley Hospital, Holy Rosary Hospital and Sanpete Valley Hospital. (CMS Care Compare, Hospital General Information (the site's June 2026 pull), matched to AHRQ's 2023 Compendium)
- How many of Intermountain Health's hospitals are outside a metropolitan area? **11**  
  The other 20 are in metro areas. (CMS Provider of Services file (April 2026), matched to AHRQ's 2023 Compendium)
- How many beds do Intermountain Health's hospitals report to Medicare, added together? **4,082**  
  From all 31 hospitals' latest cost reports, mostly 2024. (Medicare hospital cost reports (CMS HCRIS, Worksheet S-3), fiscal year 2024 file)
- How many beds does Intermountain Health's biggest hospital report to Medicare? **486**  
  It is Intermountain Medical Center. Primary Children's Hospital is next, with 353. (Medicare hospital cost reports (CMS HCRIS, Worksheet S-3), fiscal year 2024 file)
- How many intensive care beds do Intermountain Health's hospitals report to Medicare, added together? **969**  
  That is 24 percent of their 4,082 beds. From all 31 hospitals' latest cost reports, mostly 2024. (Medicare hospital cost reports (CMS HCRIS, Worksheet S-3), fiscal year 2024 file)
- How many inpatient discharges did Intermountain Health's hospitals report in a year, added together? **211,625**  
  About 580 a day. From all 31 hospitals' latest cost reports, mostly 2024. (Medicare hospital cost reports (CMS HCRIS, Worksheet S-3), fiscal year 2024 file)
- How many hospitals does Intermountain Health count on its own 2025 fact sheet? **34**  
  One of them is a virtual hospital. The federal list, which runs on 2023 ownership, matches 31. (Intermountain Health, 2025 System Fast Facts)
- How many clinics does Intermountain Health count on its 2025 fact sheet? **414**  
  Its About page rounds the number to 400. (Intermountain Health, 2025 System Fast Facts)
- How many babies were born in Intermountain Health's care in 2025? **37,477**  
  Its annual report page gives a slightly different count, 37,682. (Intermountain Health, 2025 System Fast Facts)
- How many emergency department visits did Intermountain Health count in 2025? **875,443**  
  Inpatient surgeries came to 52,622 the same year. (Intermountain Health, 2025 System Fast Facts)
- How many Magnet hospitals did Intermountain Health count in 2025? **7**  
  The same fact sheet counts 34 hospitals in all. (Intermountain Health, 2025 System Fast Facts)
- What was Intermountain Health's net operating revenue for 2025, in billions of dollars? **$16.06 billion**  
  Net operating expenses were $15.92 billion. (Intermountain Health, 2025 System Fast Facts)
