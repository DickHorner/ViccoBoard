# ViccoBoard Development Issues Tracker

**Baseline Commit:** d8875dd  
**Created:** January 16, 2026

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
- [ ] Create main app layout (header, sidebar, content area)
- [ ] Implement navigation router (teacher app)
- [ ] Create layout components for responsive design
- [ ] Support Touch/Split-View iPad layouts
- [ ] Implement dashboard routing

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
- [ ] Display list of classes
- [ ] Show recent lessons
- [ ] Show recent exams (when KURT ready)
- [ ] Quick action buttons (new class, new exam)
- [ ] Search/filter classes

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
- [ ] Class list with inline actions
- [ ] Class detail view
- [ ] Edit class information
- [ ] View class statistics
- [ ] Manage grading scheme selection

**Acceptance Criteria:**
- Can view all classes
- Can create/edit classes
- Statistics displayed correctly
- All operations persist offline

**Relates to:** Plan.md §6.2 (SportZens - Kernverwaltung)

---

### Issue P2-5: Student Management Screens
**Priority:** CRITICAL | **Effort:** 3 days

**Description:**
Implement student list and profile screens.

**Tasks:**
- [ ] Student list view with search
- [ ] Add student form
- [ ] Student profile view
- [ ] Edit student information
- [ ] Photo management

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
- [ ] Create attendance entry form
- [ ] Support quick status selection (default + custom statuses from status catalog)
- [ ] Add reason field for absence
- [ ] Bulk attendance entry
- [ ] Summary display

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
- [ ] Integrate CreateClassUseCase
- [ ] Integrate AddStudentUseCase
- [ ] Integrate RecordAttendanceUseCase
- [ ] Hook up repository queries
- [ ] Add error handling and notifications

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
- [ ] Add StatusCatalog domain model/repository/use-case (add, rename, disable, reorder)
- [ ] Add CriteriaCatalog domain model/repository/use-case (add, rename, disable, reorder)
- [ ] Wire attendance UI to StatusCatalog (class/context specific)
- [ ] Persist catalog metadata (e.g. code/color/active/order)
- [ ] Add export/import coverage for catalogs
- [ ] Add unit/integration tests for catalog CRUD + usage

**Acceptance Criteria:**
- Users can define extra attendance statuses without code changes
- Catalog changes are reflected in entry forms, statistics, and exports
- Catalogs persist offline and survive reload/restore
- Tests cover CRUD, ordering, activation, and consumer integration

**Relates to:** Plan.md §6.2, §6.3 (custom criteria/status options)

---

## Phase 3: SportZens - Grading Engine (2-3 weeks)

### Issue P3-1: Grading Schema & Category Repositories
**Priority:** HIGH | **Effort:** 3 days

**Description:**
Implement data layer for grading schemes and categories.

**Tasks:**
- [ ] GradeScheme repository (CRUD + queries)
- [ ] GradeCategory repository (CRUD + queries)
- [ ] PerformanceEntry repository
- [ ] Add schema migration for grading tables
- [ ] Unit tests for repositories

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
- [ ] Support up to 8 criteria per category
- [ ] Implement weighting system
- [ ] Calculate composite grades from criteria
- [ ] Handle slider-based input (0-100)
- [ ] Add validation rules

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
- [ ] Define best/worst time boundaries
- [ ] Implement linear mapping algorithm
- [ ] Calculate grades from times
- [ ] Allow post-hoc boundary adjustment
- [ ] Tests for calculation accuracy

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
- [ ] Grading overview screen
- [ ] Criteria grading entry form
- [ ] Time-based grading entry form
- [ ] Grade history view
- [ ] Bulk entry support

**Acceptance Criteria:**
- Can enter grades intuitively
- Changes save immediately
- Works offline
- Touch-friendly controls

**Relates to:** UI/UX requirements

---

## Phase 4: SportZens - Tests & Measurements (2-3 weeks)

### Issue P4-1: Shuttle Run Implementation
**Priority:** HIGH | **Effort:** 3 days

**Description:**
Implement complete Shuttle Run test workflow.

**Tasks:**
- [ ] ShuttleRunConfig repository
- [ ] Shuttle Run timer UI
- [ ] Result collection and validation
- [ ] Auto-calculation with table lookup
- [ ] Audio signal integration

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
- [ ] Track rounds/distance
- [ ] Support running and swimming modes
- [ ] Auto-calculate grades from table
- [ ] Result storage
- [ ] Sportart configuration

**Acceptance Criteria:**
- Can select sport mode
- Results calculated correctly
- Works with custom tables
- Data persists

**Relates to:** Plan.md §6.5 (Cooper-Test)

---

### Issue P4-3: Sportabzeichen (Sports Badge) System
**Priority:** MEDIUM | **Effort:** 2 days

**Description:**
Implement age-dependent sports badge evaluation.

**Tasks:**
- [ ] Age calculation from birth year
- [ ] Age-based performance standards
- [ ] Badge achievement tracking
- [ ] PDF export for overview
- [ ] Results archive

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

## Phase 5: KURT - Exam Builder (2-3 weeks)

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
- [ ] Create exam form
- [ ] Add tasks sequentially
- [ ] Set point values
- [ ] Define criteria
- [ ] Save and preview

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

## Phase 6: KURT - Correction & Grading (2-3 weeks)

### Issue P6-1: Correction Entry Repository & Use Cases
**Priority:** HIGH | **Effort:** 2 days

**Description:**
Implement data layer for exam corrections.

**Tasks:**
- [ ] CorrectionEntry repository
- [ ] RecordCorrectionUseCase
- [ ] CalculateGradeUseCase
- [ ] Support partial/full correction
- [ ] Tests

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
- [ ] Candidate selector
- [ ] Task overview with points earned
- [ ] Show points to next grade
- [ ] Tab navigation between point fields
- [ ] Real-time grade calculation

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
- [ ] Support ++/+/0/-/-- grading
- [ ] Convert to points mapping
- [ ] UI button group for selection
- [ ] Integration with correction

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
- [ ] Comment boxes per task level
- [ ] Table-mode correction view
- [ ] Sort by task or candidate
- [ ] Comment storage and display
- [ ] Copy comments between candidates

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

**Next Step:** Move to Task 2 (Update ROADMAP.md & STATUS.md)
