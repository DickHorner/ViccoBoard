# Sport APK → ViccoBoard Parity Ledger

**Version:** 1.1.0  
**Date:** 2026-03-12 (refreshed from 2026-02-07 baseline)  
**Scope:** v2 (WOW excluded)

## Executive Summary

This ledger tracks functional and options parity between the Sport APK and ViccoBoard implementation.

**Status (March 2026):** Partial parity. Core grading, measurements, and basic tools are implemented. Open gaps remain in calendar, video-delay, tracking, table management, full persistence for teams/scoreboard/tactics, and security/backup. See Phase Status table in §7.  
**WOW Status:** Explicitly excluded from scope v2 (`excluded_by_scope_v2`)

---

## 1. i18n Keyset Statistics

### Source Files
- `docs/parity-spec/sport-apk/i18n/Sport.de.json` (German)
- `docs/parity-spec/sport-apk/i18n/Sport.en.json` (English)

### Key Hierarchy (Top-Level Sections)
1. **HELLO** - Welcome messages
2. **ENCRYPTION** - Encryption setup/unlock (20+ keys)
3. **MENU** - Main navigation menu (15+ keys)
4. **TOURNAMENTS** - Tournament management (15+ keys)
5. **TOURNAMENT** - Individual tournament details (25+ keys)
6. **COMMON** - Common UI strings (10+ keys)
7. **ANALYTICS** - Analytics dashboard (15+ keys)
8. **TRACKING** - Tracking features (pushups, etc.) (20+ keys)
9. **KLASSEN** - Class management (German) (30+ keys)
10. **CLASSES** - Class management (English) (20+ keys)
11. **WEEK** - Weekday names (7 keys)
12. **SETTINGS** - Settings panel (60+ keys)
13. **USERS** - User management (15+ keys)
14. **TURNIER** - Tournament (German) (20+ keys)
15. **GRADES** - Grading system (80+ keys)
16. **INFOS** - Info/about section (40+ keys)
17. **SCHUELER** - Student management (German) (40+ keys)
18. **STUDENTS** - Student management (English) (50+ keys)
19. **STUNDEN** - Lessons (German) (20+ keys)
20. **LESSONS** - Lessons (English) (20+ keys)
21. **TABLES** - Table/grading tables (40+ keys)
22. **GRADESCHEME** - Grade schemes (10+ keys)
23. **COOPER** - Cooper test (10+ keys)
24. **SHUTTLE** - Shuttle run (10+ keys)
25. **MITTELSTRECKE** - Middle distance (10+ keys)
26. **BEWERTUNGSHILFE** - Grading help/guidelines (15+ keys)
27. **TEAM** - Team creation (20+ keys)
28. **ANWESENHEIT** - Attendance (20+ keys)
29. **EXPORT** - Export functionality (10+ keys)
30. **TABELLE** - Table evaluation (5+ keys)
31. **LOCK** - App lock (5+ keys)
32. **STUNDENPLAN** - Timetable (10+ keys)
33. **COLORS** - Color definitions (15+ keys)
34. **UEBUNGEN** - Exercises (20+ keys)
35. **TOAST** - Toast notifications (60+ keys)
36. **TIMER** - Timer tool (25+ keys)
37. **SORT** - Sorting options (10+ keys)
38. **MULTISTOP** - Multi-stopwatch (20+ keys)
39. **WOW** - Workout of the Week (**EXCLUDED_BY_SCOPE_V2**) (60+ keys)
40. **FEEDBACK** - Feedback system (10+ keys)
41. **SportABZEICHEN** - Sports badge (25+ keys)
42. **BUNDESJUGENDSPIELE** - Federal youth games (15+ keys)
43. **KALENDER** - Calendar (15+ keys)
44. **KAISER** - King tournament (20+ keys)
45. **TACTICS** - Tactics board (5+ keys)
46. **SCORES** - Scoreboard (5+ keys)
47. **DELAY** - Video delay (5+ keys)
48. **ALERT** - Alert dialogs (15+ keys)
49. **USER_PROFILE** - User profile (30+ keys)
50. **CONFIRM** - Confirmation dialogs (15+ keys)
51. **EMAIL** - Email input (5+ keys)
52. **LICENSES** - License management (15+ keys)
53. **ABSENCES** - Absences tracking (5+ keys)
54. **REGISTER** - Registration (10+ keys)
55. **CALENDAR** - Calendar views (20+ keys)
56. **SEARCH** - Search placeholder (2+ keys)
57. **SELECT** - Selection dialogs (10+ keys)
58. **CATEGORIES** - Category management (30+ keys)
59. **KING** - King tournament detail (20+ keys)
60. **LOGIN** - Login/unlock (20+ keys)
61. **HOME** - Home screen (5+ keys)

### Total Estimated i18n Keys
- **Leaf keys (approx):** 900-1000 strings
- **WOW-related keys:** ~60 keys (**excluded_by_scope_v2**)
- **In-scope keys:** ~850-950 strings

---

## 2. Schema Inventory

### Schema Files Location
`docs/parity-spec/sport-apk/schemas/*.schema.json`

### Schema List with Field Counts

| Schema | File | Field Count | Required Fields | Scope |
|--------|------|-------------|-----------------|-------|
| **class** | class.schema.json | 15 | 4 (id, name, school_year, teacher_id) | in_scope_v2 |
| **student** | student.schema.json | 11 | 5 (class_id, first_name, id, last_name, teacher_id) | in_scope_v2 |
| **grade** | grade.schema.json | 17 | 7 (category_id, class_id, id, student_id, teacher_id, type, year) | in_scope_v2 |
| **category** | category.schema.json | 18 | 7 (class_id, id, name, teacher_id, type, weight, year) | in_scope_v2 |
| **table** | table.schema.json | 12 | 4 (grade_scheme, id, name, teacher_id) | in_scope_v2 |
| **gradeWeighting** | gradeWeighting.schema.json | 4 | 4 (attendance, grades, remarks, wow) | in_scope_v2 (wow field retained, set to 0) |
| **newDayData** | newDayData.schema.json | 4 | 1 (date) | in_scope_v2 |
| **userData** | userData.schema.json | 8 | 3 (email, id, role) | in_scope_v2 |
| **wow** | wow.schema.json | 3 | 2 (name, wowtyp) | **excluded_by_scope_v2** |

### Total Schemas
- **Total:** 9 schemas
- **In-scope:** 8 schemas (wow excluded)
- **Total fields in-scope:** 89 fields

---

## 3. Schema → ViccoBoard Mapping

### Priority 1: Core Entities (Implemented)

| Sport Schema | ViccoBoard Entity/Type | Location | Status |
|------------------|------------------------|----------|--------|
| **class** | `ClassGroup` | `packages/core/src/interfaces/core.types.ts` + `modules/sport/src/repositories/class-group.repository.ts` | ✅ Exists |
| **student** | `Student` | `packages/core/src/interfaces/core.types.ts` + `modules/students/src/repositories/student.repository.ts` | ✅ Exists |
| **grade** | `PerformanceEntry` | `packages/core/src/interfaces/sport.types.ts` + `modules/sport/src/repositories/performance-entry.repository.ts` | ✅ Exists |
| **category** | `GradeCategory` | `packages/core/src/interfaces/sport.types.ts` + `modules/sport/src/repositories/grade-category.repository.ts` | ✅ Exists |
| **table** | `TableDefinition` | `packages/core/src/interfaces/sport.types.ts` + `modules/sport/src/repositories/table-definition.repository.ts` | ✅ Exists |
| **userData** | `TeacherAccount` | `packages/core/src/interfaces/core.types.ts` | ✅ Exists |

### Priority 2: Sport-Specific (Needs Field Parity Check)

| Sport Schema | ViccoBoard Mapping | Status |
|------------------|-------------------|--------|
| **gradeWeighting** | Grade scheme weighting settings | 🟡 Partial (needs field check) |
| **newDayData** | `Lesson` | `packages/core/src/interfaces/core.types.ts` + `modules/sport/src/repositories/lesson.repository.ts` (field check) |

### Priority 3: Excluded

| Sport Schema | ViccoBoard Status | Scope |
|------------------|-------------------|-------|
| **wow** | NOT IMPLEMENTED | **excluded_by_scope_v2** |

---

## 4. Workflow/Route Inventory (from i18n)

### Navigation Routes (from MENU)

| i18n Key | Feature | Route | Scope |
|----------|---------|-------|-------|
| MENU.tables | Tabellen (Grading Tables) | /tables | in_scope_v2 |
| MENU.analytics | Analytics | /analytics | in_scope_v2 |
| MENU.tournaments | Turniere (Tournaments) | /tournaments | in_scope_v2 |
| MENU.scoreboard | Scoreboard | /scoreboard | in_scope_v2 |
| MENU.tacticboard | Taktikboard | /tacticboard | in_scope_v2 |
| MENU.video-delay | Video Delay | /video-delay | in_scope_v2 |
| MENU.timer | Timer | /timer | in_scope_v2 |
| MENU.timetable | Stundenplan (Timetable) | /timetable | in_scope_v2 |
| MENU.settings | Einstellungen (Settings) | /settings | in_scope_v2 |
| MENU.infos | Infos | /infos | in_scope_v2 |
| MENU.calendar | Kalender (Calendar) | /calendar | in_scope_v2 |
| MENU.tracking | Tracking (Pushups etc.) | /tracking | in_scope_v2 |

### Core Workflows

| Workflow | i18n Section | Scope | Status |
|----------|--------------|-------|--------|
| Class Management | KLASSEN, CLASSES | in_scope_v2 | ✅ Implemented (`ClassesOverview.vue`, `ClassDetail.vue`) |
| Student Management | SCHUELER, STUDENTS | in_scope_v2 | ✅ Implemented (`StudentList.vue`, `StudentProfile.vue`) |
| Grading (Criteria) | GRADES.criteria-title | in_scope_v2 | ✅ Implemented (`CriteriaGradingEntry.vue`) |
| Grading (Time) | GRADES.time | in_scope_v2 | ✅ Implemented (`TimeGradingEntry.vue`) |
| Grading (Cooper) | COOPER | in_scope_v2 | ✅ Implemented (`CooperGradingEntry.vue`, `RecordCooperTestResultUseCase`) |
| Grading (Shuttle) | SHUTTLE | in_scope_v2 | ✅ Implemented (`ShuttleGradingEntry.vue`) |
| Grading (Multistop) | MULTISTOP | in_scope_v2 | ✅ Implemented (`Multistop.vue`) |
| Grading (Middle Distance) | MITTELSTRECKE | in_scope_v2 | ✅ Implemented (`MittelstreckeGradingEntry.vue`) |
| Sportabzeichen | SportABZEICHEN | in_scope_v2 | ✅ Implemented (`SportabzeichenGradingEntry.vue`, `sportabzeichen.service.ts`) |
| Bundesjugendspiele | BUNDESJUGENDSPIELE | in_scope_v2 | ✅ Implemented (`BJSGradingEntry.vue`) |
| King Tournament | KAISER, KING | in_scope_v2 | ⚠️ GAP (not yet implemented) |
| Teams | TEAM | in_scope_v2 | ✅ Basic UI (`TeamBuilder.vue`); persistence and fairness rules open (#139) |
| Tournaments | TOURNAMENTS, TOURNAMENT | in_scope_v2 | ✅ Basic UI (`Tournaments.vue`); full session model open (#141) |
| Attendance | ANWESENHEIT | in_scope_v2 | ✅ Basic (`AttendanceEntry.vue`); lesson-bound repair open (#124) |
| Lessons | STUNDEN, LESSONS | in_scope_v2 | ✅ Implemented (`LessonList.vue`, `LessonWorkspace.vue`) |
| Tables Import/Export | TABLES | in_scope_v2 | ⚠️ GAP (management screen open – #129) |
| Feedback | FEEDBACK | in_scope_v2 | ✅ In codebase (`FeedbackTool.vue`, `RecordFeedbackSessionUseCase`); issue #147 open |
| Calendar | KALENDER, CALENDAR | in_scope_v2 | ⚠️ GAP (not yet implemented) |
| Timer | TIMER | in_scope_v2 | ✅ Implemented (`Timer.vue`, `record-timer-result.use-case.ts`) |
| Scoreboard | SCORES | in_scope_v2 | ✅ Basic UI (`Scoreboard.vue`); session model open (#140) |
| Tactics Board | TACTICS | in_scope_v2 | ✅ Basic UI (`TacticsBoard.vue`); snapshots open (#143) |
| Video Delay | DELAY | in_scope_v2 | ⚠️ GAP (not yet implemented) |
| Tracking | TRACKING | in_scope_v2 | ⚠️ GAP (not yet implemented) |
| Statistics | ANALYTICS | in_scope_v2 | ✅ In codebase (`SportStatistics.vue`, `/subjects/sport/statistics`); issue #147 open |
| Sport Settings | SETTINGS | in_scope_v2 | ✅ In codebase (`SportSettingsView.vue`, `/settings/sport`); issue #148 open |
| **WOW** | **WOW** | **excluded_by_scope_v2** | ❌ NOT IMPLEMENTED |

---

## 5. WOW Exclusion Documentation

### Rationale
Per sport_parity_v2.md specification, WOW (Workout of the Week) is explicitly excluded from scope v2 to focus on core Sports assessment and KBR implementation.

### Affected Components

#### i18n Keys (excluded)
- `WOW.*` (~60 keys)
- All subkeys under WOW section

#### Schemas (excluded)
- `wow.schema.json` (full schema)

#### Workflows (excluded)
- WOW creation/editing
- WOW student tracking
- WOW workout timer
- WOW results collection
- WOW-based grading

#### Field References (handled)
- `gradeWeighting.wow` field: Set to 0 for v2 scope; field retained for schema compatibility

### Preservation Strategy
1. **Keep i18n keys:** Retain WOW.* keys in locale files for future scope expansion
2. **Keep schema:** Retain wow.schema.json file
3. **Disable UI:** If WOW UI components exist, hide behind feature flag
4. **Mark clearly:** All WOW items marked as `excluded_by_scope_v2` in parity matrix

---

## 6. Traceability

### Link to PARITY_MATRIX.csv
See `PARITY_MATRIX.csv` for row-by-row parity tracking of every i18n key, schema field, and workflow.

### Link to PARITY_ASSERTIONS.md
See `PARITY_ASSERTIONS.md` for definitions of "parity" and test strategies.

---

## 7. Phase Status (Updated March 2026)

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Baseline + Build | ✅ Done (2026-02-07) |
| Phase 1 | Sport Ledger | ✅ Done (2026-02-07) |
| Phase 2 | KBR Ledger | ✅ Done (2026-02-07) |
| Phase 3 | i18n Infrastructure | ⚠️ GAP (no vue-i18n, strings still hardcoded in components) |
| Phase 4 | Schema Parity | ✅ Partial (core schemas implemented; schema roundtrip tests in modules/sport/tests/) |
| Phase 5 | Sport Workflows/UI | ✅ Partial (see workflow table above; open gaps: Calendar, Video Delay, Tracking, King Tournament, Table management, full persistence for Teams/Scoreboard/Tactics) |
| Phase 6 | KBR Data Layer + Builder | ✅ Done (P5-1, P5-2, P5-3 complete) |
| Phase 7 | KBR Correction + Grading | ✅ Done (P6-1..P6-4 complete) |
| Phase 8 | KBR Fördertipps/Export/Mail | ⏳ Pending (KBR advanced features) |
| Phase 9 | Security/Backup | ⚠️ GAP (app-lock, backup/restore not implemented) |
| Phase 10 | Finalization + Report | ⏳ Pending |

### Open Gaps (backlog tracking issues)

| Gap | Tracking Issue |
|-----|----------------|
| Feedback formal close | #147 |
| Sport configuration formal close | #148 |
| Parity/status docs (this PR) | #145 |
| Lesson-bound attendance | #124 |
| Student profile with real history | #125 |
| Lesson workspace shortcuts | #126 |
| Class detail as sport workbench | #127 |
| Table management screen | #129 |
| Category lifecycle (edit/delete/template) | #130 |
| Verbal assessments | #131 |
| Cross-context criteria catalogs | #132 |
| Shuttle-run config and session management | #134 |
| Cooper workflow end-to-end | #135 |
| Middle-distance flow | #136 |
| Sportabzeichen and BJS completion | #137 |
| Team builder persistence | #139 |
| Scoreboard session model | #140 |
| Tournament planning MVP | #141 |
| Dice tool | #142 |
| Tactics board snapshots | #143 |

---

**END OF PARITY_LEDGER.md**
