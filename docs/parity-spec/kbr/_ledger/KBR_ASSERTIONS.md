# KURT Parity Assertions

**Version:** 1.0.0  
**Date:** 2026-02-07  
**Purpose:** Define "Definition of Done" for each KURT checkbox

---

## 1. Definition of "Implemented"

A KURT checkbox is marked `implemented=yes` when:
1. **Data Model:** All necessary entities/fields exist and persist correctly
2. **Business Logic:** Core use cases are implemented and tested
3. **UI:** Feature is accessible and functional in teacher-ui
4. **Tests:** At least 1 passing test (unit or integration) per critical path
5. **Documentation:** Feature is documented in user-facing help (if complex)

---

## 2. Per-Section Criteria

### §6.9 Prüfungen anlegen (Strukturen)

#### DoD for "Exam Builder Simple Mode" (6.9.2)
- [ ] Create exam with title, description, date
- [ ] Add tasks (flat list, no subtasks)
- [ ] Assign points per task
- [ ] Save/load exam from DB
- [ ] Test: Create exam → save → reload → fields match

#### DoD for "Exam Builder Complex Mode" (6.9.3)
- [ ] Toggle complex mode
- [ ] Create tasks with 3 levels (Task → Level1 → Level2)
- [ ] Wahlaufgaben (choice tasks) can be marked
- [ ] Bonuspunkte (bonus points) can be assigned
- [ ] Comments/Fördertipps toggleable per task
- [ ] Test: Create complex exam → 3 levels → save/reload → structure preserved

#### DoD for "Prüfungsteile" (6.9.7)
- [ ] Define exam parts (e.g., "Teil A", "Teil B")
- [ ] Assign tasks to parts
- [ ] Calculate subtotal points/grades per part automatically
- [ ] Mark parts as "optional printable"
- [ ] Test: Exam with 2 parts → assign tasks → subtotals correct

---

### §6.10 Notenschlüssel

#### DoD for "Grade Key Engine" (6.10.1-6.10.4)
- [ ] Define grade boundaries as percentages (e.g., 90% = 1.0)
- [ ] Convert percentages to point thresholds automatically
- [ ] Support multiple presets (e.g., IHK, Standard, Custom)
- [ ] Allow retroactive changes without data loss
- [ ] Test: Create exam with 100 points → set 90%=1.0 → assert threshold=90 points

#### DoD for "Rounding Logic" (6.10.6)
- [ ] Configure rounding (up/down/nearest)
- [ ] Apply rounding to final grades
- [ ] Test: 89.5 points with "round up" → grade=1.0; "round down" → grade=1.3

---

### §6.11 Korrigieren (Flows & Modi)

#### DoD for "Compact Correction UI" (6.11.1-6.11.3)
- [ ] Display all tasks/subtasks in compact form
- [ ] Enter points per task → auto-calculate total
- [ ] Show points to next grade level
- [ ] Tab navigation between point fields
- [ ] Display real-time grade
- [ ] Test: Enter points → assert total/grade correct

#### DoD for "Task-wise Correction (AWK)" (6.11.4)
- [ ] Switch to "correct by task" mode
- [ ] Display table: all candidates, one task column at a time
- [ ] Enter points for all candidates for task 1 → next task
- [ ] Save/commit corrections
- [ ] Test: Correct task 1 for 3 candidates → assert all saved

#### DoD for "Alternative Grading (++/+/0/-/--)" (6.11.9)
- [ ] Toggle alternative grading mode
- [ ] Enter ++/+/0/-/-- instead of numeric points
- [ ] Convert symbols to points (configurable mapping)
- [ ] Test: Enter "++" → assert mapped to max points

---

### §6.12 Fördertipps (DB, Zuweisung, QR, Auswertung)

#### DoD for "Fördertipps Database" (6.12.1, 6.12.3-6.12.4)
- [ ] CRUD for Fördertipps (title, description, categories, 3 links)
- [ ] Assign tips to tasks/subtasks during correction
- [ ] Persist assignments
- [ ] Test: Create tip → assign to task → reload → assignment persists

#### DoD for "QR Code Generation" (6.12.5)
- [ ] Generate QR code for each tip (encoding link or tip ID)
- [ ] Display QR in UI
- [ ] Export QR as image/PDF
- [ ] Test: Generate QR → decode → assert correct URL

#### DoD for "Fördertipps Weighting" (6.12.7-6.12.8)
- [ ] Assign priority/weight to tips
- [ ] Sort tips by weight in dropdown
- [ ] Display preview (name, description, count, category)
- [ ] Test: Create 3 tips with weights → assert sorted correctly

---

### §6.13 Auswertung & nachträgliche Anpassung

#### DoD for "Difficulty Analysis" (6.13.1)
- [ ] Calculate average points per task
- [ ] Identify tasks with low average (difficult)
- [ ] Display distribution histogram
- [ ] Test: 10 candidates, task 1 avg=3/10 → assert flagged as difficult

#### DoD for "Punkteänderungsassistent" (6.13.2)
- [ ] Adjust task weights → recalculate all grades
- [ ] Preserve point ratios between candidates
- [ ] Test: Task 1 weight 10→20 → assert all grades recalculated correctly

---

### §6.14 Langzeit-Überblick & Notizen

#### DoD for "Long-term Overview" (6.14.1-6.14.3)
- [ ] Display all exams for candidate across school year
- [ ] Show competency development (if categorized)
- [ ] Add internal notes (visible only to teacher)
- [ ] Test: Candidate with 3 exams → assert all visible in overview

---

### §6.15 Rückmeldung/Kommentare

#### DoD for "Comments Reuse" (6.15.3)
- [ ] Display comments from other candidates in same exam
- [ ] Copy comment to current candidate
- [ ] Edit copied comment
- [ ] Test: Add comment to candidate A → copy to candidate B → assert copied

---

### §6.16 PDF Export

#### DoD for "PDF Feedback Sheets" (6.16.1-6.16.3)
- [ ] Generate PDF with: candidate name, task points, comments, tips, grade
- [ ] Support 4 layouts (compact, detailed, column, full)
- [ ] Batch export all PDFs with one click
- [ ] Test: Generate PDF → assert contains all expected fields

#### DoD for "Signature Options" (6.16.7)
- [ ] Upload signature image
- [ ] Draw signature in canvas
- [ ] Leave signature blank
- [ ] Insert signature in PDF
- [ ] Test: Upload image → generate PDF → assert signature present

---

### §6.18 E-Mail-Versand

#### DoD for "Email Templates" (6.18.1-6.18.2)
- [ ] Define email template with placeholders (e.g., {{name}}, {{grade}})
- [ ] Fill placeholders with candidate data
- [ ] Generate mailto: link or .eml file
- [ ] Test: Template with {{name}} → fill with "Max" → assert "Max" in email body

---

### §6.22 Oberstufenklausuren & EWH

#### DoD for "EWH Workflow" (6.22.1-6.22.2, 6.22.5)
- [ ] Define subtask aspects/subcriteria
- [ ] Format criteria text (bold/italic)
- [ ] Support 0-15 point scale
- [ ] Handle Wahlaufgaben with subcriteria
- [ ] Test: Create Oberstufe exam with EWH → 3 aspects → format bold → save/reload → format preserved

---

## 3. Universal Test Strategy

### Unit Tests (modules/exams/tests/)
- **Entities:** Test all domain models (Exam, TaskNode, CorrectionEntry, SupportTip)
- **Use Cases:** Test all critical flows (CreateExam, RecordCorrection, CalculateGrade)
- **Repositories:** Test CRUD + queries

### Integration Tests (apps/teacher-ui/tests/)
- **Workflows:** Test end-to-end flows (create exam → assign candidates → correct → export PDF)
- **UI Components:** Test key forms (ExamBuilder, CorrectionMask, Fördertipps Manager)

### Regression Tests
- **Grade Calculation:** Test edge cases (0 points, max points, bonus points, rounding)
- **Roundtrip:** Create exam → export → import → assert equal

---

## 4. Acceptance Gates

### GATE 1: Exam Builder Complete
**Pass Condition:** All §6.9 checkboxes `implemented=yes` + tests passing

**Test Command:**
```bash
npm run test:exams-builder
```

---

### GATE 2: Grading Engine Complete
**Pass Condition:** All §6.10 checkboxes `implemented=yes` + boundary tests passing

**Test Command:**
```bash
npm run test:grading-engine
```

---

### GATE 3: Correction UI Complete
**Pass Condition:** All §6.11 checkboxes `implemented=yes` + UI flow tests passing

**Test Command:**
```bash
npm run test:correction-ui
```

---

### GATE 4: Fördertipps Complete
**Pass Condition:** All §6.12 checkboxes `implemented=yes` + QR generation tests passing

**Test Command:**
```bash
npm run test:foerdertipps
```

---

### GATE 5: Export & Communication Complete
**Pass Condition:** All §6.16 + §6.18 checkboxes `implemented=yes` + PDF/email tests passing

**Test Command:**
```bash
npm run test:export
```

---

### GATE 6: Advanced Features Complete
**Pass Condition:** All §6.13-§6.15, §6.17, §6.19-§6.22 checkboxes `implemented=yes`

**Test Command:**
```bash
npm run test:advanced
```

---

## 5. Handling TBD Items

### E-Mail Placeholders (§6.18.2)
**Issue:** Plan.md mentions "Platzhalter automatisch korrekt befüllen" but doesn't list placeholders

**Workaround:** Implement common placeholders:
- `{{name}}`: Candidate name
- `{{grade}}`: Final grade
- `{{points}}`: Total points
- `{{max_points}}`: Max possible points
- `{{exam_title}}`: Exam title
- `{{date}}`: Exam date

**If more needed:** Add to Plan.md §9 TBD + mark in KURT_MATRIX

### WebUntis Import (§6.20.1)
**Issue:** Import method unclear (CSV vs API)

**Workaround:** Implement CSV import first; mark API as TBD

---

**END OF KURT_ASSERTIONS.md**
