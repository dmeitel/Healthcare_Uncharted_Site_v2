---
date: 2026-10-20
milestone: "Daily Huddle: new data sets (lab normals, drug classes)"
commit: ""
---

# Daily Huddle: new data sets (lab normals, drug classes)

Medical Science stops being mostly arithmetic: about 35 normal ranges and the drug classes clinicians use, then the rest of the ranked data sets, each as its own bank version.

## What shipped

- Bank version 4, first dealt Friday Oct 30 (board #17): 269 new questions, and Medical Science grows from 228 to 497.
- The drug classes: 251 questions from the 200 drugs Medicare Part D filled most in 2024, their classes from NLM's RxClass (the FDA's Established Pharmacologic Class): 159 of "which class is it in" and 92 of "which of these is". The answers use the names a clinician says, from the hand-written list in scripts/data/huddle-drug-class-names.json; no wrong answer is half right. `npm run huddle:drugs` pulls the data again.
- Eighteen more normal ranges, thirty-four in all, each citing a public page read live (NCBI Bookshelf, NHLBI, MedlinePlus). AST and ALT were left out, because the sources disagree with each other and with the ABIM sheet. David checked every one against the ABIM sheet, so none is a draft:
  - What is a normal prothrombin time (PT) for an adult: About 10 to 13 seconds (StatPearls, Prothrombin Time; ABIM sheet: 11 to 13 seconds)
  - What is a normal activated partial thromboplastin time (aPTT) for an adult: 25 to 35 seconds (StatPearls, Partial Thromboplastin Time; ABIM sheet: 25 to 35 seconds)
  - What is the normal serum albumin for an adult: 3.5 to 5.0 g/dL (Clinical Methods, 3rd edition, Serum Albumin and Globulin; ABIM sheet: 3.5 to 5.5 g/dL)
  - What is the normal total serum calcium for an adult: 8.5 to 10.5 mg/dL (StatPearls, Hypocalcemia; ABIM sheet: 8.6 to 10.2 mg/dL)
  - What is the normal serum magnesium for an adult: 1.7 to 2.2 mg/dL (StatPearls, Magnesium Toxicity; ABIM sheet: 1.6 to 2.6 mg/dL)
  - What is the normal serum phosphate for an adult: 2.5 to 4.5 mg/dL (StatPearls, Hyperphosphatemia; ABIM sheet: 3.0 to 4.5 mg/dL)
  - What is the normal serum creatinine for adult women: 0.5 to 1.1 mg/dL (StatPearls, Creatinine Clearance; ABIM sheet: 0.50 to 1.10 mg/dL)
  - What is the normal serum creatinine for adult men: 0.6 to 1.2 mg/dL (StatPearls, Creatinine Clearance; ABIM sheet: 0.70 to 1.30 mg/dL)
  - What is the normal hemoglobin range for adult men: 14 to 17 g/dL (NHLBI, Anemia: Diagnosis; ABIM sheet: 14 to 18 g/dL)
  - What is the normal hematocrit for adult women: 36% to 44% (NHLBI, Anemia: Diagnosis; ABIM sheet: 37% to 47%)
  - What is the normal hematocrit for adult men: 41% to 50% (NHLBI, Anemia: Diagnosis; ABIM sheet: 42% to 50%)
  - What is a normal total serum bilirubin for an adult: Less than 1 mg/dL (StatPearls, Hyperbilirubinemia; ABIM sheet: 0.3 to 1.0 mg/dL)
  - Above what blood lactate level is it called hyperlactatemia: 2 mmol/L (StatPearls, Lactic Acidosis; ABIM sheet: 0.7 to 2.1 mmol/L)
  - What total cholesterol does MedlinePlus call healthy for adults: Less than 200 mg/dL (MedlinePlus, Cholesterol Levels; ABIM sheet: Desirable under 200 mg/dL)
  - What LDL cholesterol does MedlinePlus call healthy for adults: Less than 100 mg/dL (MedlinePlus, Cholesterol Levels; ABIM sheet: Optimal under 100 mg/dL)
  - What HDL cholesterol does MedlinePlus call best for adults: 60 mg/dL or more (MedlinePlus, Cholesterol Levels; ABIM sheet: Low under 40 (men), under 50 (women))
  - What triglyceride level does MedlinePlus call healthy for adults: Less than 150 mg/dL (MedlinePlus, Triglycerides Test; ABIM sheet: Normal under 150 mg/dL (fasting))
  - What A1C percentage is normal, by the cutoffs used to diagnose diabetes: Below 5.7% (MedlinePlus, Hemoglobin A1C (HbA1c) Test; ABIM sheet: 4.0% to 5.6%)
- From version 4 a normal range can come every other board: a year from Oct 30 deals 3.0 a week, 4 at most, with no question back inside 60 days.
- Boards #12 to #48 are pinned as version 3 deals them, and a bank version the live site already has is closed even before its first day.

## QA

- 21 item(s) on David's list: 21 good.
- 0 item(s) came back for a second look after a tweak.
- The machine went first: passed 2026-10-20 23:29, 57 min. 7 checks over the whole site, every page at nine screen sizes.

## Pages this changes on the live site

- /fun/daily-huddle/

## Windows since the last push


Each window's close note, in docs/sessions/, says what it did on the day.
