# ViccoBoard Development Roadmap

**Last Updated:** February 3, 2026  
**Current Progress:** 44/176 features (baseline) + backend additions (P4-1..P5-1)  
**Status:** Phase 2 pending; backend work started in Phases 4-5

---

## Overview

ViccoBoard combines **SportZens** (PE class management) and **KURT** (exam/assessment) into a unified teacher application. This roadmap outlines the phased delivery of all 176 features from the specification in Plan.md.

**Target Timeline:** 18-22 weeks from Phase 2 start

---

## Phase 1: Foundation ✅ COMPLETE

**Duration:** 8-10 weeks (Dec 2024 - Jan 2026)  
**Status:** 100% Complete

### Deliverables
- [x] Type system (core package)
- [x] Plugin registry and contracts
- [x] Encrypted local storage with IndexedDB + SQLite adapters
- [x] Sport module repositories (Class, Student, Attendance)
- [x] First 3 use cases (CreateClass, AddStudent, RecordAttendance)
- [x] Demo application with end-to-end functionality
- [x] Build pipeline (npm workspaces, TypeScript strict mode)

### Validation
- ✅ Demo runs without errors (8 sequential steps)
- ✅ Attendance statistics calculate correctly
- ✅ Data persists to encrypted storage
- ✅ All packages build cleanly
- ✅ Architecture proven with working proof-of-concept

---

## Phase 2: Teacher UI Foundation

**Duration:** 1-2 weeks  
**Effort:** ~7 developer-days  
**Features:** 7 issues (P2-1 through P2-7)

### Goals
- Establish UI framework
- Build core navigation and layout
- Create core screen templates
- Connect to existing Sport module

### Key Issues
| ID | Title | Effort | Priority |
|---|---|---|---|
| P2-1 | UI Framework Decision & Setup | 1-2d | 🔴 CRITICAL |
| P2-2 | Navigation & Layout Structure | 2-3d | 🔴 CRITICAL |
| P2-3 | Dashboard Screen | 2d | 🔴 CRITICAL |
| P2-4 | Class List & Detail Screen | 3d | 🔴 CRITICAL |
| P2-5 | Student Management | 3d | 🔴 CRITICAL |
| P2-6 | Attendance Entry Form | 2d | 🔴 CRITICAL |
| P2-7 | Connect to Sport Module | 2d | 🔴 CRITICAL |

### Success Metrics
- [ ] Can navigate all screens without errors
- [ ] Can create a class and add students
- [ ] Can record attendance for a lesson
- [ ] All operations work offline
- [ ] UI responsive on iPad (portrait/landscape/split-view)
- [ ] Touch targets ≥ 44px

### Dependencies
- Blocks: Phases 3-6 (all require UI to test)

---

## Phase 3: SportZens - Grading Engine

**Duration:** 2-3 weeks  
**Effort:** ~8 developer-days  
**Features:** 4 issues (P3-1 through P3-4)

### Goals
- Implement grading scheme management
- Build calculation engines (criteria, time-based)
- Create grading entry UI
- Support all grading modes from specification

### Key Issues
| ID | Title | Effort | Priority |
|---|---|---|---|
| P3-1 | Grading Repositories | 3d | 🟠 HIGH |
| P3-2 | Criteria-Based Grading | 3d | 🟠 HIGH |
| P3-3 | Time-Based Grading | 2d | 🟠 HIGH |
| P3-4 | Grading UI Screens | 3d | 🟠 HIGH |

### Success Metrics
- [ ] Can create grading schemes with up to 8 criteria
- [ ] Grades calculated correctly (criteria, time-based, composite)
- [ ] Can enter grades via UI quickly
- [ ] Grade calculations tested against specification examples
- [ ] History available for post-hoc adjustments

### Dependencies
- Blocked by: Phase 2 (needs UI framework)
- Partially blocks: Phase 4 (some features depend on grading)

---

## Phase 4: SportZens - Tests & Measurements

**Duration:** 2-3 weeks  
**Effort:** ~9 developer-days  
**Features:** 4 issues (P4-1 through P4-4)

### Goals
- Implement specialized test workflows (Shuttle Run, Cooper, Sportabzeichen)
- Build timer and measurement tools
- Create result tracking and PDF export

### Progress Update (Feb 3, 2026)
- Backend repositories/services/migrations/tests implemented for P4-1..P4-4
- UI wiring, result persistence, and audio playback still pending
- PRs: #41 (Shuttle Run), #43 (Cooper), #44 (Sportabzeichen), #42 (Timer plugin)

### Key Issues
| ID | Title | Effort | Priority |
|---|---|---|---|
| P4-1 | Shuttle Run Implementation | 3d | 🟠 HIGH |
| P4-2 | Cooper Test Implementation | 2d | 🟠 HIGH |
| P4-3 | Sportabzeichen System | 2d | 🟡 MEDIUM |
| P4-4 | Timer Plugin | 2d | 🟠 HIGH |

### Success Metrics
- [ ] Shuttle Run timer works, results auto-calculate
- [ ] Cooper Test supports multiple modes
- [ ] Age-based sports badge evaluation correct
- [ ] Timer tool usable during lessons
- [ ] All test workflows accessible from grading screens

### Dependencies
- Blocked by: Phase 2 (UI) and Phase 3 (grading foundation)

---

## Phase 5: KURT - Exam Builder

**Duration:** 2-3 weeks  
**Effort:** ~12 developer-days  
**Features:** 3 issues (P5-1 through P5-3)

### Goals
- Implement exam data layer
- Build simple and complex exam builder UIs
- Support all exam structure types from specification

### Key Issues
| ID | Title | Effort | Priority |
|---|---|---|---|
| P5-1 | Exam Repositories | 2d | 🟠 HIGH |
| P5-2 | Simple Exam Builder | 3d | 🟠 HIGH |
| P5-3 | Complex Exam Builder | 4d | 🟠 HIGH |

### Success Metrics
- [ ] Can build simple exams (flat task list)
- [ ] Can build complex exams (3-level hierarchy, choice tasks, bonus)
- [ ] Exam structure persists to storage
- [ ] Can import/export exam definitions
- [ ] Builder UIs intuitive for teachers

### Dependencies
- Blocked by: Phase 2 (UI framework)
- Independent of: Phase 3 & 4 (can work in parallel)

---

## Phase 6: KURT - Correction & Grading

**Duration:** 2-3 weeks  
**Effort:** ~8 developer-days  
**Features:** 4 issues (P6-1 through P6-4)

### Goals
- Implement correction entry system
- Build compact correction interface
- Support multiple grading modes (points, alternative, table)
- Add comment system and batch operations

### Key Issues
| ID | Title | Effort | Priority |
|---|---|---|---|
| P6-1 | Correction Repositories | 2d | 🟠 HIGH |
| P6-2 | Compact Correction UI | 3d | 🟠 HIGH |
| P6-3 | Alternative Grading | 1d | 🟡 MEDIUM |
| P6-4 | Comments & Table View | 2d | 🟡 MEDIUM |

### Success Metrics
- [ ] Can enter grades efficiently (compact UI)
- [ ] All grading modes functional
- [ ] Comment system works (storage, reuse, display)
- [ ] Tab navigation between fields
- [ ] Real-time grade calculation with feedback

### Dependencies
- Blocked by: Phase 2 (UI) and Phase 5 (exam structure needed)

---

## Phase 7: SportZens - Advanced Features

**Duration:** 2-3 weeks  
**Effort:** ~10 developer-days  
**Features:** ~8 issues

### Goals
- Verbal evaluations & feedback system
- Advanced statistics and trend analysis
- WOW (student workout tracking) backend + web interface
- Student self-assessment features

### Key Areas (Details in ISSUES_TRACKER.md)
- Feedback collection methods (form-based, rubric-based, comparison)
- Performance statistics and charts
- WOW browser interface and progress tracking
- Attendance trends and patterns

### Dependencies
- Blocked by: Phase 3 (grading foundation)

---

## Phase 8: KURT - Remediation & Diagnostics

**Duration:** 2 weeks  
**Effort:** ~8 developer-days  
**Features:** ~6 issues

### Goals
- Implement remediation tips database
- Build question weighting system
- Create long-term performance analysis
- Support special achievement tracking

### Key Areas
- Remediation tips management (up to 3 links, QR codes, weighting)
- Difficulty adjustment assistant
- Long-term student performance tracking
- Special achievements and anonymization

### Dependencies
- Blocked by: Phase 6 (correction data needed)

---

## Phase 9: Export & Print Pipeline

**Duration:** 2-3 weeks  
**Effort:** ~12 developer-days  
**Features:** ~6 issues

### Goals
- Implement PDF rendering (4 feedback layouts)
- Build email template system
- Create batch export functionality
- Support signature capture and PDF signing

### Key Areas
- Rückmeldebogen PDF (4 customizable layouts)
- Feedback form layout selections and presets
- Email merge with placeholders
- Signature capture (handwriting, image, empty)
- Batch export (all students, selected classes)
- Sportabzeichen PDF overview

### Dependencies
- Blocked by: Phase 6 (correction data for feedback)

---

## Phase 10: Integrations & Sharing

**Duration:** 2 weeks  
**Effort:** ~8 developer-days  
**Features:** ~5 issues

### Goals
- Implement WebUntis student import
- Build grade app clipboard export
- Create teacher sharing system
- Support WOW result sharing

### Key Areas
- WebUntis API integration (student/timetable import)
- Grade app clipboard format export
- Share exam templates between teachers
- Share remediation resources
- WOW result delivery to students (QR-based)

### Dependencies
- Blocked by: Phase 6 (exam/grade data) and Phase 7 (WOW)

---

## Phase 11: Testing & Quality Assurance

**Duration:** 3-4 weeks  
**Effort:** ~15 developer-days  
**Features:** ~10 issues

### Goals
- Implement comprehensive test coverage
- Build regression test suite
- Create UI flow tests
- Validate PDF/CSV generation
- Performance testing

### Key Areas
- Unit tests for all calculation engines
- Integration tests for workflows
- UI flow tests (sport lesson → grading → PDF)
- Offline functionality validation
- iPad/Safari specific testing
- PDF/CSV output validation

### Dependencies
- Blocked by: All previous phases (tests cover features)

---

## Phase 12: Documentation & Release

**Duration:** 1-2 weeks  
**Effort:** ~5 developer-days  
**Features:** ~3 issues

### Goals
- Complete user documentation
- Create teacher guides
- Build admin/setup documentation
- Prepare release package

### Key Areas
- User manual for teachers
- Quick-start guides per module
- Administrator setup guide
- Feature documentation
- FAQ and troubleshooting
- Release notes and changelog

### Dependencies
- Blocks: Public release

---

## Critical Path Analysis

**Longest Path:** Phase 2 → Phase 3 → Phase 4 → Phase 6 → Phase 9 → Phase 11

**Critical Issues (order matters):**
1. P2-1: UI Framework (unblocks everything)
2. P2-2 to P2-7: Core UI (enables feature development)
3. P3-1 to P3-4: Grading engine (foundation for all grading)
4. P5-1 to P5-3: Exam structure (needed for correction)
5. P6-1 to P6-4: Correction UI (needed for PDF/stats)
6. Phase 9: PDF export (high user value)

**Parallel Opportunities:**
- Phase 5 (KURT exams) can proceed alongside Phase 3-4
- Phase 7-8 can start once Phase 6 is complete
- Phase 10 integrations can start once dependent phases complete

---

## Success Metrics by Phase

| Phase | Target % | Key Metric |
|---|---|---|
| Phase 1 | 25% | Foundation working, demo proves architecture |
| Phase 2 | 35% | UI functional, can navigate and create classes |
| Phase 3 | 45% | Grading calculated correctly |
| Phase 4 | 50% | Tests and measurements working |
| Phase 5 | 60% | Exams buildable in both modes |
| Phase 6 | 70% | Correction workflow complete |
| Phase 7 | 75% | SportZens features complete |
| Phase 8 | 80% | KURT diagnostics complete |
| Phase 9 | 85% | Export and PDF working |
| Phase 10 | 90% | Integrations functional |
| Phase 11 | 95% | Tests comprehensive, quality validated |
| Phase 12 | 100% | Documented and released |

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| UI Framework choice impacts all future work | HIGH | Phase 2-1 includes evaluation period; choose wisely |
| PDF library complexity | HIGH | Start early (Phase 9), use proven library (pdfkit/puppeteer) |
| Offline-first challenging with large datasets | MEDIUM | Test early with real data sizes; optimize queries |
| iPad/Safari compatibility issues | MEDIUM | Continuous testing on device; avoid File API |
| KURT feature complexity | MEDIUM | Break into small issues; test early and often |
| Email delivery without backend | MEDIUM | Use mailto: with CSV export as fallback |

---

## Effort Burn-Down

```
26 weeks total
Phase 1:  ✅ Complete (8 weeks prior)
Phase 2:   2 weeks  (7 issues)
Phase 3:   2 weeks  (4 issues)
Phase 4:   2 weeks  (4 issues)
Phase 5:   2 weeks  (3 issues)
Phase 6:   2 weeks  (4 issues)
Phase 7:   2 weeks  (~8 issues)
Phase 8:   2 weeks  (~6 issues)
Phase 9:   2 weeks  (~6 issues)
Phase 10:  2 weeks  (~5 issues)
Phase 11:  3 weeks  (~10 issues)
Phase 12:  1 week   (~3 issues)
─────────────────
TOTAL:    26 weeks (Phase 2-12)
```

---

## How to Use This Roadmap

1. **For Planning:** Use phase durations to estimate resources
2. **For Prioritization:** Focus on critical path items first
3. **For Dependencies:** Check blocks before starting a phase
4. **For Tracking:** Update completed issues in ISSUES_TRACKER.md
5. **For Communication:** Share phase updates with stakeholders

---

**Next Review:** After Phase 2 UI decision + P5-2 progress  
**Baseline Commit:** d8875dd
