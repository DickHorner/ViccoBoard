# ViccoBoard Development Issues Tracker

**Baseline Commit:** d8875dd  

**Last status refresh:** February 24, 2026
---

## Phase 2: Teacher UI Foundation (1-2 weeks)

### Issue P2-1: UI Framework Decision & Setup
**Priority:** CRITICAL | **Effort:** 1-2 days

**Description:**
Decide on UI framework and set up initial project structure.

**Framework constraint:**
Vue 3 only (web-first, static assets; no Electron/React Native/Flutter).

**Acceptance Criteria:**
- Framework chosen and justified
- Initial project structure created
- Dependencies installed and building
- Can run `npm run dev` to start dev server

**Relates to:** Plan.md section 2.1 (Core-UI Shell)

---

### Issue P2-2: Navigation & Layout Structure
**Priority:** CRITICAL | **Effort:** 2-3 days

**Description:**
Implement main application navigation and layout structure.

**Tasks:**
- [x] Create main app layout (header, sidebar, content area)
- [x] Implement navigation router (teacher app)
- [x] Create layout components for responsive design
- [x] Support Touch/Split-View iPad layouts
- [x] Implement dashboard routing

**Acceptance Criteria:**
- Can navigate between main screens
- Touch targets ≥ 44px
- Works in portrait/landscape
- Responsive for ½ split view

**Relates to:** Plan.md section 5 (UI Information Architecture)

---

### Issue P2-3: Dashboard Screen
**Priority:** CRITICAL | **Effort:** 2 days

**Description:**
Implement dashboard showing classes, recent activity, quick actions.

**Tasks:**
- [x] Display list of classes
- [x] Show recent lessons
- [x] Show recent exams (when KBR ready)
- [x] Quick action buttons (new class, new exam)
- [x] Search/filter classes

**Acceptance Criteria:**
- Classes load from storage
- Can create new class from dashboard
- Works offline
- Loading states handled

**Relates to:** Plan.md section 5 (Dashboard)

---

### Issue P2-4: Class List & Class Detail Screen
**Priority:** CRITICAL | **Effort:** 3 days

**Description:**
Implement detailed class management screens.

**Tasks:**
- [x] Class list with inline actions
- [x] Class detail view
- [x] Edit class information
- [x] View class statistics
- [x] Manage grading scheme selection

**Acceptance Criteria:**
- Can view all classes
- Can create/edit classes
- Statistics displayed correctly
- All operations persist offline

**Relates to:** Plan.md §6.2 (Sport - Kernverwaltung)

---

### Issue P2-5: Student Management Screens
**Priority:** CRITICAL | **Effort:** 3 days

**Description:**
Implement student list and profile screens.

**Tasks:**
- [x] Student list view with search
- [x] Add student form
- [x] Student profile view
- [x] Edit student information
- [x] Photo management

**Acceptance Criteria:**
- Can add/edit/delete students
- Search by name/ID works
- Photos display correctly
- Data persists offline

**Relates to:** Plan.md §6.2 (Student management)

---

### Issue P2-6: Attendance Entry Form
**Priority:** CRITICAL | **Effort:** 2 days

**Description:**
Implement quick attendance entry UI.

**Tasks:**
- [x] Create attendance entry form
- [x] Support quick status selection (default + custom statuses from status catalog)
- [x] Add reason field for absence
- [x] Bulk attendance entry
- [x] Summary display

**Acceptance Criteria:**
- Can record attendance for all students
- Status options clear and quick to select
- Status options come from configurable catalog (not hardcoded only)
- Form validates correctly
- Changes save to storage

**Relates to:** Plan.md §6.2 (Fehlzeiten)

---

### Issue P2-7: Connect to Sport Module Repositories
**Priority:** CRITICAL | **Effort:** 2 days

**Description:**
Wire UI screens to existing Sport module repositories and use cases.

**Tasks:**
- [x] Integrate CreateClassUseCase
- [x] Integrate AddStudentUseCase
- [x] Integrate RecordAttendanceUseCase
- [x] Hook up repository queries
- [x] Add error handling and notifications

**Acceptance Criteria:**
- Can create class from UI
- Can add students
- Can record attendance
- All data persists via storage layer

**Relates to:** modules/sport use cases

---

### Issue P2-8: Custom Status & Criteria Catalog Foundation
**Priority:** CRITICAL | **Effort:** 3 days

**Description:**
Implement configurable catalogs for status and criteria options as shared foundation for multiple sections.

**Tasks:**
- [x] Add StatusCatalog domain model/repository/use-case (add, rename, disable, reorder)
- [x] Add CriteriaCatalog domain model/repository/use-case (add, rename, disable, reorder)
- [x] Wire attendance UI to StatusCatalog (class/context specific)
- [x] Persist catalog metadata (e.g. code/color/active/order)
- [x] Add export/import coverage for catalogs
- [x] Add unit/integration tests for catalog CRUD + usage

**Acceptance Criteria:**
- Users can define extra attendance statuses without code changes
- Catalog changes are reflected in entry forms, statistics, and exports
- Catalogs persist offline and survive reload/restore
- Tests cover CRUD, ordering, activation, and consumer integration

**Relates to:** Plan.md §6.2, §6.3 (custom criteria/status options)

---

## Phase 3: Sport - Grading Engine (2-3 weeks)

### Issue P3-1: Grading Schema & Category Repositories
**Priority:** HIGH | **Effort:** 3 days

**Description:**
Implement data layer for grading schemes and categories.

**Tasks:**
- [x] GradeScheme repository (CRUD + queries)
- [x] GradeCategory repository (CRUD + queries)
- [x] PerformanceEntry repository
- [x] Add schema migration for grading tables
- [x] Unit tests for repositories

**Acceptance Criteria:**
- Can create/read/update grading schemes
- Categories linked to schemes correctly
- Queries efficient
- Tests pass

**Relates to:** Plan.md §6.3, modules/sport

---

### Issue P3-2: Criteria-Based Grading Logic
**Priority:** HIGH | **Effort:** 3 days

**Description:**
Implement criteria-based grading calculation engine.

**Tasks:**
- [x] Support up to 8 criteria per category
- [x] Implement weighting system
- [x] Calculate composite grades from criteria
- [x] Handle slider-based input (0-100)
- [x] Add validation rules

**Acceptance Criteria:**
- Grades calculated correctly
- Weights adjustable
- Handles edge cases
- Tests validate math

**Relates to:** Plan.md §6.3 (Notenkategorien: Kriterien)

---

### Issue P3-3: Time-Based Grading Logic
**Priority:** HIGH | **Effort:** 2 days

**Description:**
Implement time-based grading with linear mapping.

**Tasks:**
- [x] Define best/worst time boundaries
- [x] Implement linear mapping algorithm
- [x] Calculate grades from times
- [x] Allow post-hoc boundary adjustment
- [x] Tests for calculation accuracy

**Acceptance Criteria:**
- Linear mapping correct mathematically
- Can adjust boundaries
- Times mapped to correct grades
- Tests with sample data pass

**Relates to:** Plan.md §6.3 (Notenkategorien: Zeit)

---

### Issue P3-4: Grading UI Screens
**Priority:** HIGH | **Effort:** 3 days

**Description:**
Implement UI for entering grades.

**Tasks:**
- [x] Grading overview screen
- [x] Criteria grading entry form
- [x] Time-based grading entry form
- [x] Grade history view
- [x] Bulk entry support

**Acceptance Criteria:**
- Can enter grades intuitively
- Changes save immediately
- Works offline
- Touch-friendly controls

**Relates to:** UI/UX requirements

---

## Phase 4: Sport - Tests & Measurements (2-3 weeks)

### Issue P4-1: Shuttle Run Implementation
**Priority:** HIGH | **Effort:** 3 days

**Description:**
Implement complete Shuttle Run test workflow.

**Tasks:**
- [x] ShuttleRunConfig repository
- [x] Shuttle Run timer UI
- [x] Result collection and validation
- [x] Auto-calculation with table lookup
- [x] Audio signal integration

**Acceptance Criteria:**
- Timer starts/stops correctly
- Results saved per student
- Grade calculated automatically
- Audio signals play

**Relates to:** Plan.md §6.5 (Shuttle-Run)

---

### Issue P4-2: Cooper Test Implementation
**Priority:** HIGH | **Effort:** 2 days

**Description:**
Implement Cooper Test (running/swimming) workflow.

**Tasks:**
- [x] Track rounds/distance
- [x] Support running and swimming modes
- [x] Auto-calculate grades from table
- [x] Result storage
- [x] Sportart configuration

**Acceptance Criteria:**
- Can select Sport mode
- Results calculated correctly
- Works with custom tables
- Data persists

**Relates to:** Plan.md §6.5 (Cooper-Test)

---

### Issue P4-3: Sportabzeichen (Sports Badge) System
**Priority:** MEDIUM | **Effort:** 2 days

**Description:**
Implement age-dependent Sports badge evaluation.

**Tasks:**
- [x] Age calculation from birth year
- [x] Age-based performance standards
- [x] Badge achievement tracking
- [x] PDF export for overview
- [x] Results archive

**Acceptance Criteria:**
- Age-based standards applied
- Badge achievements accurate
- PDF shows all students
- Historical data available

**Relates to:** Plan.md §6.5 (Sportabzeichen)

---

### Issue P4-4: Live Tools - Timer Plugin
**Priority:** HIGH | **Effort:** 2 days | **Status:** COMPLETE ✅

**Description:**
Implement Timer tool plugin.

**Tasks:**
- [x] Timer plugin implementation
- [x] UI for timer controls
- [x] Support countdown/stopwatch/intervals
- [x] Audio notifications
- [x] Store timer results

**Acceptance Criteria:**
- [x] Timer starts/stops/resets correctly
- [x] All modes functional
- [x] Results saved to database
- [x] No audio on mute works

**Relates to:** Plan.md §6.6 (Tools)

**Implementation:** [RecordTimerResultUseCase.ts](../../modules/sport/src/use-cases/record-timer-result.use-case.ts) + [Timer.vue](../../apps/teacher-ui/src/views/Timer.vue) + [useSportBridge.ts](../../apps/teacher-ui/src/composables/useSportBridge.ts)

---

## Phase 5: KBR - Exam Builder (2-3 weeks)

### Issue P5-1: Exam Repositories & Data Models
**Priority:** HIGH | **Effort:** 2 days

**Description:**
Implement persistence layer for exams.

**Tasks:**
- [x] Exam repository (CRUD + queries)
- [x] TaskNode repository (3-level hierarchy)
- [x] Criterion repository
- [x] Add schema migrations
- [x] Unit tests

**Acceptance Criteria:**
- CRUD operations functional
- Hierarchy represented correctly
- Queries efficient
- Tests pass

**Relates to:** Plan.md §6.9, modules/exams

---

### Issue P5-2: Simple Exam Builder UI
**Priority:** HIGH | **Effort:** 3 days

**Description:**
Implement UI for creating simple exams.

**Tasks:**
- [x] Create exam form
- [x] Add tasks sequentially
- [x] Set point values
- [x] Define criteria
- [x] Save and preview

**Acceptance Criteria:**
- Can create complete simple exam
- All fields validated
- Preview shows structure
- Saves correctly

**Relates to:** Plan.md §6.9 (Simple mode)

---

### Issue P5-3: Complex Exam Builder UI
**Priority:** HIGH | **Effort:** 4 days

**Description:**
Implement UI for complex 3-level exam builder.

**Tasks:**
- [x] Drag-and-drop task/subtask management
- [x] Multiple hierarchy levels
- [x] Choice task support
- [x] Bonus point configuration
- [x] Exam parts management

**Acceptance Criteria:**
- Can build 3-level hierarchy
- Choice tasks work
- Bonus points configurable
- Exam parts defined correctly

**Relates to:** Plan.md §6.9 (Complex mode)

---

## Phase 6: KBR - Correction & Grading (2-3 weeks)

### Issue P6-1: Correction Entry Repository & Use Cases
**Priority:** HIGH | **Effort:** 2 days

**Description:**
Implement data layer for exam corrections.

**Tasks:**
- [x] CorrectionEntry repository
- [x] RecordCorrectionUseCase
- [x] CalculateGradeUseCase
- [x] Support partial/full correction
- [x] Tests

**Acceptance Criteria:**
- Can record grades per task
- Totals calculated correctly
- Supports partial entry
- Tests comprehensive

**Relates to:** Plan.md §6.11

---

### Issue P6-2: Compact Correction UI
**Priority:** HIGH | **Effort:** 3 days

**Description:**
Implement compact correction interface.

**Tasks:**
- [x] Candidate selector
- [x] Task overview with points earned
- [x] Show points to next grade
- [x] Tab navigation between point fields
- [x] Real-time grade calculation

**Acceptance Criteria:**
- Interface compact and efficient
- Tab navigation smooth
- Grades update in real-time
- Touch-friendly controls

**Relates to:** Plan.md §6.11 (Kompakte Korrekturmaske)

---

### Issue P6-3: Alternative Grading (++/+/0/-/--)
**Priority:** MEDIUM | **Effort:** 1 day

**Description:**
Implement alternative grading system option.

**Tasks:**
- [x] Support ++/+/0/-/-- grading
- [x] Convert to points mapping
- [x] UI button group for selection
- [x] Integration with correction

**Acceptance Criteria:**
- Alternative grading functional
- Conversion to points correct
- UI intuitive
- Works in correction interface

**Relates to:** Plan.md §6.11 (Alternative Bepunktung)

---

### Issue P6-4: Comment Boxes & Task-Wise Correction
**Priority:** MEDIUM | **Effort:** 2 days

**Description:**
Implement comment system and table-based correction view.

**Tasks:**
- [x] Comment boxes per task level
- [x] Table-mode correction view
- [x] Sort by task or candidate
- [x] Comment storage and display
- [x] Copy comments between candidates

**Acceptance Criteria:**
- Comments save and display
- Table view shows all data
- Sorting works correctly
- Comment reuse functional

**Relates to:** Plan.md §6.11 & §6.15

---

## Summary Metrics

**Total Issues:** 20  
**Total Estimated Effort:** ~18-22 weeks  
**Critical Path Items:** Phases 2-3 (Foundation + UI)

**Blocks & Dependencies:**
- Phase 2 blocks Phases 3-6 (no UI = can't test features)
- Phase 3 partially blocks Phase 4 (grading foundation needed)
- Phase 5 independent, can proceed after Phase 3 starts

---

**Next Step:** Release QA sign-off and tagging

