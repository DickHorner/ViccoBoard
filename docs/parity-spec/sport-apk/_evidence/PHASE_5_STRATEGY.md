# Phase 5 Implementation Strategy — Sport Workflows/UI

**Phase:** 5 — Sport Workflows/UI Implementation  
**Status:** 🚧 IN PROGRESS  
**Start Date:** 2026-02-07  
**Gate Condition:** All 15+ major Sport workflows must be functional with UI screens

---

## Current State Analysis

### ✅ Already Implemented (Partial)
| Component | File | Status | Completeness |
|-----------|------|--------|--------------|
| Dashboard | `views/Dashboard.vue` | ✅ Functional | ~70% (search, create modal) |
| Class Detail | `views/ClassDetail.vue` | ✅ Functional | ~80% (info, students, stats) |
| Attendance Entry | `views/AttendanceEntry.vue` | ⚠️ Unknown | To be checked |
| Grading Overview | `views/GradingOverview.vue` | ⚠️ Unknown | To be checked |
| Criteria Grading | `views/CriteriaGradingEntry.vue` | ⚠️ Unknown | To be checked |
| Time Grading | `views/TimeGradingEntry.vue` | ⚠️ Unknown | To be checked |
| Student Profile | `views/StudentProfile.vue` | ⚠️ Unknown | To be checked |
| Grade History | `views/GradeHistory.vue` | ⚠️ Unknown | To be checked |

### ❌ Missing (Stub/Not Implemented)
| Component | Required i18n | Priority | Notes |
|-----------|---------------|----------|-------|
| Student List | SCHUELER, STUDENTS | 🔴 HIGH | Currently just a stub! |
| Cooper Test UI | COOPER | 🟡 MEDIUM | Table-based grading workflow |
| Shuttle Run UI | SHUTTLE | 🟡 MEDIUM | Table-based grading workflow |
| Multistop Timer | MULTISTOP | 🟡 MEDIUM | Multi-stopwatch tool |
| Middle Distance | MITTELSTRECKE | 🟡 MEDIUM | Time-based grading |
| Sportabzeichen | SportABZEICHEN | 🟡 MEDIUM | Badge tracking + PDF export |
| Bundesjugendspiele | BUNDESJUGENDSPIELE | 🟡 MEDIUM | Federal Sports games tracking |
| King Tournament | KAISER, KING | 🟢 LOW | Tournament bracket |
| Team Builder | TEAM | 🟡 MEDIUM | Random team generation |
| Tournaments | TOURNAMENTS | 🟢 LOW | Tournament management |
| Feedback System | FEEDBACK | 🟡 MEDIUM | Multiple feedback methods |
| Calendar View | KALENDER | 🟢 LOW | Calendar integration |
| Timer Tool | TIMER | 🟡 MEDIUM | Countdown/stopwatch |
| Scoreboard | SCORES | 🟡 MEDIUM | Live score display |
| Tactics Board | TACTICS | 🟢 LOW | Drawing board for tactics |
| Video Delay | DELAY | 🟢 LOW | Video delay tool |
| Tracking | TRACKING | 🟢 LOW | Pushup/exercise tracking |
| Table Import/Export | TABLES | 🟡 MEDIUM | CSV import, PDF export |

---

## Implementation Phases (Sequential)

### 🎯 Phase 5.1: Student Management (High Priority)
**Gate:** Student List view must be fully functional with all Sport features

**Tasks:**
1. ✅ Analyze `StudentList.vue` current state (stub)
2. ⏳ Implement student table with all columns (name, class, gender, DoB, notes)
3. ⏳ Implement search/filter functionality
4. ⏳ Implement "Add Student" modal with all fields
5. ⏳ Implement "Import Students" (CSV/clipboard)
6. ⏳ Implement bulk operations (delete, move to class)
7. ⏳ Implement public code generation
8. ⏳ Integrate i18n keys (SCHUELER.*, STUDENTS.*)
9. ⏳ Add tests for student CRUD operations

**i18n Coverage:**
- SCHUELER.* (~40 keys German)
- STUDENTS.* (~50 keys English)

**Estimated Items:** ~15 PARITY_MATRIX rows

---

### 🎯 Phase 5.2: Class Management (Enhancement)
**Gate:** Class Management must support all optional fields + SchoolYear switching

**Tasks:**
1. ⏳ Enhance Dashboard.vue with SchoolYear filter
2. ⏳ Implement "Archive Class" functionality
3. ⏳ Implement Class color picker
4. ⏳ Implement Class settings (grading scheme)
5. ⏳ Implement Class statistics (extended)
6. ⏳ Integrate i18n keys (KLASSEN.*, CLASSES.*)
7. ⏳ Add tests for class archival/filter workflows

**i18n Coverage:**
- KLASSEN.* (~30 keys German)
- CLASSES.* (~20 keys English)

**Estimated Items:** ~10 PARITY_MATRIX rows

---

### 🎯 Phase 5.3: Attendance Tracking (Validate/Enhance)
**Gate:** Attendance view must support all absence reasons + statistics

**Tasks:**
1. ⏳ Check AttendanceEntry.vue completeness
2. ⏳ Implement absence reasons (sick, excused, unexcused, late)
3. ⏳ Implement attendance statistics per student/class
4. ⏳ Implement calendar view integration
5. ⏳ Integrate i18n keys (ANWESENHEIT.*, ABSENCES.*)
6. ⏳ Add tests for attendance workflows

**i18n Coverage:**
- ANWESENHEIT.* (~20 keys)
- ABSENCES.* (~5 keys)

**Estimated Items:** ~8 PARITY_MATRIX rows

---

### 🎯 Phase 5.4: Grading Workflows (Core Tests)
**Gate:** All core grading workflows must be functional

**Subtasks:**
1. ⏳ **Cooper Test** (COOPER.* ~10 keys)
   - Table-based grading with age/gender categories
   - Import Cooper tables from settings
   - Quick entry UI for distance values
2. ⏳ **Shuttle Run** (SHUTTLE.* ~10 keys)
   - Table-based grading for 2x/4x runs
   - Audio cues integration
   - Import Shuttle tables
3. ⏳ **Middle Distance** (MITTELSTRECKE.* ~10 keys)
   - Time-based grading with min/max values
   - Linear interpolation
   - Distance selection (800m, 1000m, etc.)

**Estimated Items:** ~30 PARITY_MATRIX rows

---

### 🎯 Phase 5.5: Tools Integration
**Gate:** All Sport tools must be accessible and functional

**Subtasks:**
1. ⏳ **Timer** (TIMER.* ~25 keys)
   - Countdown timer
   - Stopwatch with lap times
   - Persistent state
2. ⏳ **Multistop** (MULTISTOP.* ~20 keys)
   - Multiple simultaneous stopwatches
   - Student name assignment
   - Export results
3. ⏳ **Scoreboard** (SCORES.* ~5 keys)
   - Live score display
   - Fullscreen mode for projection
4. ⏳ **Tactics Board** (TACTICS.* ~5 keys)
   - Drawing canvas
   - Save/load tactics
5. ⏳ **Team Builder** (TEAM.* ~20 keys)
   - Random team generation
   - Balanced teams (by skill/gender)
   - Save team configurations

**Estimated Items:** ~40 PARITY_MATRIX rows

---

### 🎯 Phase 5.6: Advanced Features
**Gate:** Sportabzeichen, Bundesjugendspiele, Tournaments, Feedback

**Subtasks:**
1. ⏳ **Sportabzeichen** (SportABZEICHEN.* ~25 keys)
   - Badge tracking (Bronze/Silver/Gold)
   - Discipline requirements
   - PDF overview export
2. ⏳ **Bundesjugendspiele** (BUNDESJUGENDSPIELE.* ~15 keys)
   - Discipline tracking (100m, Weitsprung, Wurf)
   - Point calculation
   - Certificate generation
3. ⏳ **Tournaments** (TOURNAMENTS.* ~40 keys)
   - Tournament bracket creation
   - Match tracking
   - Winner determination
4. ⏳ **Feedback System** (FEEDBACK.* ~10 keys)
   - Multiple feedback methods (dice, cards, etc.)
   - Feedback history per student

**Estimated Items:** ~35 PARITY_MATRIX rows

---

### 🎯 Phase 5.7: Export/Import/Tables
**Gate:** All data can be exported/imported without loss

**Subtasks:**
1. ⏳ **Table Import** (TABLES.* ~40 keys)
   - CSV import for Cooper/Shuttle tables
   - Table editor UI
   - Validation + error handling
2. ⏳ **Data Export** (EXPORT.* ~10 keys)
   - CSV export for classes/students/grades
   - PDF export for reports
   - Backup/restore functionality (Phase 9 dependency)

**Estimated Items:** ~20 PARITY_MATRIX rows

---

## Gate 5 Pass Criteria

✅ **All criteria must be met:**

1. **Student Management:**
   - Student List view fully functional (no stubs)
   - All CRUD operations working
   - CSV import functional
   - Public code generation working

2. **Class Management:**
   - SchoolYear filter working
   - Archive/unarchive working
   - All optional fields editable
   - Statistics displaying correctly

3. **Attendance:**
   - Daily attendance entry working
   - All absence reasons supported
   - Statistics calculating correctly

4. **Grading Workflows:**
   - Criteria-based grading: ✅
   - Time-based grading: ✅
   - Cooper Test: ✅
   - Shuttle Run: ✅
   - Middle Distance: ✅

5. **Tools:**
   - Timer: ✅
   - Multistop: ✅
   - Scoreboard: ✅
   - Tactics Board: ✅
   - Team Builder: ✅

6. **Advanced Features:**
   - Sportabzeichen: ✅
   - Bundesjugendspiele: ✅
   - Tournaments: ✅
   - Feedback: ✅

7. **Export/Import:**
   - Table import: ✅
   - CSV export: ✅
   - Data backup: ✅ (basic, full in Phase 9)

8. **i18n Integration:**
   - All ~170 Sport i18n keys used in UI
   - No hardcoded strings
   - Missing key handler working

9. **Tests:**
   - Unit tests for all new use cases
   - Integration tests for workflows
   - UI tests for critical paths (optional but recommended)

10. **Documentation:**
    - Each subphase has PHASE_5_X_COMPLETION.md
    - PARITY_MATRIX.csv updated with implementation status

---

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **i18n keys implemented** | ~170 keys | 0 | ⏳ 0% |
| **Workflows implemented** | 15+ workflows | ~3 partial | ⏳ ~20% |
| **Optional schema fields** | ~20 fields | ~5 | ⏳ ~25% |
| **PARITY_MATRIX rows** | ~170 rows | ~80 | ⏳ ~47% |
| **Tests coverage** | 80%+ | TBD | ⏳ TBD |

**Current Progress:** ~20% estimated (some views exist but incomplete)  
**Target Progress:** 100% (all workflows functional)

---

## Next Steps

1. **Start Phase 5.1:** Implement StudentList.vue (HIGH PRIORITY - currently stub)
2. Check existing views for completeness
3. Systematically implement each workflow
4. Update PARITY_MATRIX.csv after each completion
5. Generate PHASE_5_X_COMPLETION.md documents as evidence

---

**Status:** 🚧 Ready to begin Phase 5.1 (Student Management)
