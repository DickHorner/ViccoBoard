# SportZens APK → ViccoBoard Parity Ledger

**Version:** 1.0.0  
**Date:** 2026-02-07  
**Scope:** v2 (WOW excluded)

## Executive Summary

This ledger tracks 100% functional and options parity between the SportZens APK and ViccoBoard implementation.

**Status:** Initial baseline established  
**WOW Status:** Explicitly excluded from scope v2 (`excluded_by_scope_v2`)

---

## 1. i18n Keyset Statistics

### Source Files
- `docs/parity-spec/sportzens-apk/i18n/sportzens.de.json` (German)
- `docs/parity-spec/sportzens-apk/i18n/sportzens.en.json` (English)

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
41. **SPORTABZEICHEN** - Sports badge (25+ keys)
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
`docs/parity-spec/sportzens-apk/forms/*.schema.json`

### Schema List with Field Counts

| Schema | File | Field Count | Required Fields | Scope |
|--------|------|-------------|-----------------|-------|
| **class** | class.schema.json | 14 | 4 (id, name, school_year, teacher_id) | in_scope_v2 |
| **student** | student.schema.json | 11 | 5 (class_id, first_name, id, last_name, teacher_id) | in_scope_v2 |
| **grade** | grade.schema.json | 16 | 7 (category_id, class_id, id, student_id, teacher_id, type, year) | in_scope_v2 |
| **category** | category.schema.json | 17 | 7 (class_id, id, name, teacher_id, type, weight, year) | in_scope_v2 |
| **table** | table.schema.json | 11 | 4 (grade_scheme, id, name, teacher_id) | in_scope_v2 |
| **gradeWeighting** | gradeWeighting.schema.json | 4 | 4 (attendance, grades, remarks, wow) | in_scope_v2 (wow field = 0 for v2) |
| **userData** | userData.schema.json | 8 | 3 (email, id, role) | in_scope_v2 |
| **newDayData** | newDayData.schema.json | 4 | 1 (date) | in_scope_v2 |
| **wow** | wow.schema.json | 3 | 2 (name, wowtyp) | **excluded_by_scope_v2** |

### Total Schemas
- **Total:** 9 schemas
- **In-scope:** 8 schemas (wow excluded)
- **Total fields in-scope:** ~90 fields

---

## 3. Schema → ViccoBoard Mapping

### Priority 1: Core Entities (Implemented)

| SportZens Schema | ViccoBoard Entity/Type | Location | Status |
|------------------|------------------------|----------|--------|
| **class** | `ClassGroup` | `modules/sport/src/types/class-group.ts` | ✅ Exists |
| **student** | `Student` | `modules/sport/src/types/student.ts` | ✅ Exists |
| **grade** | `GradeEntry` | `modules/sport/src/types/grade.ts` | ✅ Exists |
| **category** | `GradeCategory` | `modules/sport/src/types/grade-category.ts` | ✅ Exists |
| **table** | `GradingTable` | `modules/sport/src/types/grading-table.ts` | ✅ Exists |
| **userData** | User (app-level) | `packages/core/src/types/user.ts` | ✅ Exists |

### Priority 2: SportZens-Specific (Needs Field Parity Check)

| SportZens Schema | ViccoBoard Mapping | Status |
|------------------|-------------------|--------|
| **gradeWeighting** | Class/Student settings | 🟡 Partial (needs field check) |
| **newDayData** | Lesson/Event | 🟡 Partial (needs field check) |

### Priority 3: Excluded

| SportZens Schema | ViccoBoard Status | Scope |
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
| Class Management | KLASSEN, CLASSES | in_scope_v2 | 🟡 Needs field check |
| Student Management | SCHUELER, STUDENTS | in_scope_v2 | 🟡 Needs field check |
| Grading (Criteria) | GRADES.criteria-title | in_scope_v2 | ⚠️ TODO |
| Grading (Time) | GRADES.time | in_scope_v2 | ⚠️ TODO |
| Grading (Cooper) | COOPER | in_scope_v2 | ⚠️ TODO |
| Grading (Shuttle) | SHUTTLE | in_scope_v2 | ⚠️ TODO |
| Grading (Multistop) | MULTISTOP | in_scope_v2 | ⚠️ TODO |
| Grading (Middle Distance) | MITTELSTRECKE | in_scope_v2 | ⚠️ TODO |
| Sportabzeichen | SPORTABZEICHEN | in_scope_v2 | ⚠️ TODO |
| Bundesjugendspiele | BUNDESJUGENDSPIELE | in_scope_v2 | ⚠️ TODO |
| King Tournament | KAISER, KING | in_scope_v2 | ⚠️ TODO |
| Teams | TEAM | in_scope_v2 | ⚠️ TODO |
| Tournaments | TOURNAMENTS, TOURNAMENT | in_scope_v2 | ⚠️ TODO |
| Attendance | ANWESENHEIT | in_scope_v2 | ⚠️ TODO |
| Lessons | STUNDEN, LESSONS | in_scope_v2 | 🟡 Basic exists |
| Tables Import/Export | TABLES | in_scope_v2 | ⚠️ TODO |
| Feedback | FEEDBACK | in_scope_v2 | ⚠️ TODO |
| Calendar | KALENDER, CALENDAR | in_scope_v2 | ⚠️ TODO |
| Timer | TIMER | in_scope_v2 | ⚠️ TODO |
| Scoreboard | SCORES | in_scope_v2 | ⚠️ TODO |
| Tactics Board | TACTICS | in_scope_v2 | ⚠️ TODO |
| Video Delay | DELAY | in_scope_v2 | ⚠️ TODO |
| Tracking | TRACKING | in_scope_v2 | ⚠️ TODO |
| **WOW** | **WOW** | **excluded_by_scope_v2** | ❌ NOT IMPLEMENTED |

---

## 5. WOW Exclusion Documentation

### Rationale
Per SPORTZENS_PARITY_v2.md specification, WOW (Workout of the Week) is explicitly excluded from scope v2 to focus on core sports assessment and KURT implementation.

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

## 7. Next Steps (Phase 2+)

1. ✅ Phase 1: Ledger established (this file)
2. ⏳ Phase 2: KURT spec ingest from Plan.md
3. ⏳ Phase 3: i18n infrastructure + string parity tests
4. ⏳ Phase 4: Schema roundtrip tests for all 8 in-scope schemas
5. ⏳ Phase 5-8: Workflow implementation + UI parity
6. ⏳ Phase 9: Security/backup quality gate
7. ⏳ Phase 10: Final report

---

**END OF PARITY_LEDGER.md**
