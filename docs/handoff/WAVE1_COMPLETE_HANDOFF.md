# Handoff: Wave 1 Complete - Architecture Compliance

**Date:** 2026-02-10
**Commits:** `d9bf7a2`, `62d3df6` (on `main`)
**All gates green:** lint:docs, build:packages, build:ipad, test (241 tests, 34 suites)

---

## What Was Done (Wave 1)

### Problem
STATUS.md claimed "zero legacy database imports in production code" but the architecture audit found:
- `Dashboard.vue:343` imported types from `../db` (production view, in router)
- `Dashboard.vue:337` had `@ts-nocheck` (violates Rule 7)
- `classGroups.remove()` called a non-existent method (hidden by @ts-nocheck)
- `activity.date` referenced a non-existent property (should be `activity.timestamp`)
- `@viccoboard/students` tests were broken (missing `InMemoryStorageAdapter`)

### Fixes Applied

| File | Change |
|------|--------|
| `apps/teacher-ui/src/views/Dashboard.vue` | Replaced `import type {..} from '../db'` with `from '@viccoboard/core'`; removed `@ts-nocheck`; fixed `activity.date` -> `activity.timestamp`; fixed `classGroups.remove()` -> `.delete()`; widened `gradingScheme` ref type |
| `apps/teacher-ui/src/composables/useDatabase.ts` | Added `@deprecated` JSDoc header |
| `apps/teacher-ui/src/composables/useExams.ts` | Added `@deprecated` JSDoc header |
| `apps/teacher-ui/src/composables/useCorrections.ts` | Added `@deprecated` JSDoc header |
| `packages/storage/src/adapters/in-memory.adapter.ts` | **NEW** - `InMemoryStorageAdapter` for unit tests |
| `packages/storage/src/index.ts` | Added `InMemoryStorageAdapter` export |
| `modules/students/jest.config.cjs` | Added `moduleNameMapper` for `@viccoboard/core` and `@viccoboard/storage` (matching Sport module pattern) |
| Deleted: `useDatabase.js/.d.ts`, `useExams.js/.d.ts`, `useCorrections.js/.d.ts` | Removed compiled artifacts of deprecated composables |

---

## Current Architecture Audit (Post-Wave 1)

### Production views (`views/*.vue`) - CLEAN
```
from '../db'     -> 0 matches
useDatabase(     -> 0 matches
useExams(        -> 0 matches
useCorrections(  -> 0 matches
```

### Deprecated composables (still present, marked @deprecated)
These are NOT called by any production view. Only `views-wip/` references them:
- `composables/useDatabase.ts` - imports `db` from `../db`
- `composables/useExams.ts` - imports `db` from `../db`
- `composables/useCorrections.ts` - imports `db` from `../db`

### views-wip/ (NOT in router, NOT production)
6 files still import from `../db` or call `useDatabase()`. These are staging/draft views.

---

## What Remains (Wave 2 + Wave 3)

### Wave 2: Feature Completion

#### P2-6: Wire AttendanceEntry UI to StatusCatalog from bridge
- **Domain layer:** DONE (StatusCatalogRepository, AddStatus/UpdateStatus/ReorderStatus use cases, all tested)
- **Bridge:** DONE (`useStudentsBridge.ts` exposes catalog methods)
- **UI integration:** NOT DONE
- **Target files:** `apps/teacher-ui/src/views/AttendanceEntry.vue`
- **What to do:** Replace hardcoded status options with dynamic catalog from `useStudents()` bridge; add status management UI (add/edit/reorder/deactivate statuses per class group)
- **Reference:** The `views-wip/AttendanceEntry.vue` has the old pattern; the production `views/AttendanceEntry.vue` needs the bridge-based pattern

#### P5-3: Complex Exam Builder verification
- **Target:** `apps/teacher-ui/src/views/KBRExamBuilder.vue`
- **What to verify:** 3-level task hierarchy (Task -> Subtask -> Sub-subtask), choice tasks (Wahlteil), bonus points
- **Bridge:** `useExamsBridge.ts` provides repos + use cases

#### P6-4: Comment Boxes & Task-Wise Correction
- **Target:** `apps/teacher-ui/src/views/CorrectionCompactUI.vue`
- **What to do:** Complete task-wise comment boxes, per-task correction workflow
- **Bridge:** `useExamsBridge.ts` provides `CommentManagementService`

### Wave 3: E2E Verification & Parity

#### P4-1 to P4-4: Sport test workflows
- Shuttle Run, Cooper Test, Sportabzeichen, Timer
- Services and UI exist; need to verify full bridge-connected workflow
- **Target views:** `ShuttleGradingEntry.vue`, `CooperGradingEntry.vue`, `SportabzeichenGradingEntry.vue`, `Timer.vue`

#### Parity Matrices
- Required by `docs/agents/sport_parity_v2.md`
- Must produce feature parity comparison: Sport v1 vs ViccoBoard

---

## Critical Architecture Rules

1. **No `from '../db'` in production views/stores/composables** (except deprecated stubs)
2. **All data access via bridges:** UI -> Bridge -> UseCase -> Repository -> StorageAdapter
3. **No `@ts-nocheck`** - remove when touching any file (Rule 7)
4. **Dexie migration plan:** `src/db/` directory must NOT be deleted until all consumers migrated and gates green
5. **Do not claim completion** if active code imports `../db` from app-layer composables/views/stores

## Mandatory Gate Commands

```bash
npm run lint:docs
npm run build:packages
npm run build:ipad
npm test
```

## Architecture Audit Commands (include in final report)

```powershell
Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "from '../db'" -SimpleMatch
Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "useDatabase(" -SimpleMatch
```

## Key Files to Read Before Starting

| File | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Architecture rules, mandatory reading |
| `agents.md` | Multi-agent structure, bridge pattern |
| `Plan.md` (esp. sections 6, 9) | Feature checklist, storage migration TBD |
| `docs/agents/sport_parity_v2.md` | Parity execution plan |
| `docs/planning/ISSUES_TRACKER.md` | Issue tracking (P2-1 to P6-4) |
| `docs/status/STATUS.md` | Current status claims (verify against audit) |

## Module Map

```
packages/core       -> @viccoboard/core      (types, interfaces, validators)
packages/storage    -> @viccoboard/storage    (adapters, repos, migrations)
packages/plugins    -> @viccoboard/plugins    (plugin registry)
modules/sport       -> @viccoboard/sport      (18 repos, 13 use cases, 5 services)
modules/exams       -> @viccoboard/exams      (6 repos, 3 use cases, 7 services)
modules/students    -> @viccoboard/students   (2 repos, 5 use cases)
apps/teacher-ui     -> teacher-ui             (Vue 3 + Vite, production views)
```

## Bridge Composables (the ONLY way UI should access domain)

| Bridge | File | Provides |
|--------|------|----------|
| Sport | `composables/useSportBridge.ts` | `useClassGroups()`, `useLessons()`, `useAttendance()`, `useSportBridge()` |
| Exams | `composables/useExamsBridge.ts` | `useExamsBridge()` -> repos, services, use cases |
| Students | `composables/useStudentsBridge.ts` | `useStudents()` -> StudentRepo, StatusCatalogRepo, use cases |
