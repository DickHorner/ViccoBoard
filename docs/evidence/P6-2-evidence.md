# P6-2 Evidence: Compact Correction UI

## Metadata

- Issue ID: P6-2
- Scope: Compact Correction UI — Plan.md §6.11
- Date: 2026-02-20
- Mode: `IMPLEMENTATION`

## Acceptance Criteria Matrix

| Criterion | Status | Evidence |
|---|---|---|
| Interface compact and efficient | `VERIFIED` | `apps/teacher-ui/src/views/CorrectionCompact.vue` — single-page layout with panel-based design, task grid, summary panel (lines 1-108, template section) |
| Tab navigation smooth | `VERIFIED` | `CorrectionCompact.vue` lines 138-161: `registerScoreInput`, `focusScoreInput`, `onScoreKeydown` (script); lines 78-87: input with `@keydown`, `@focus`, `tabindex` (template) |
| Grades update in real-time | `VERIFIED` | `CorrectionCompact.vue` computed `totalPoints`, `percentageScore`, `pointsToNextGrade` (lines 189-203) — all reactive via Vue computed |
| Touch-friendly controls | `VERIFIED` | `CorrectionCompact.vue` CSS: `min-height: 44px` on buttons and score inputs (lines 363, 403, 414) |
| Candidate selector | `VERIFIED` | `CorrectionCompact.vue` lines 24-40: `<select id="candidate-select">` + quick-add form |
| Task overview with points earned | `VERIFIED` | `CorrectionCompact.vue` lines 59-90: `task-grid` with per-task score input and max points label |
| Show points to next grade | `VERIFIED` | `CorrectionCompact.vue` lines 197-203: `pointsToNextGrade` computed using `GradingKeyService.pointsToNextGrade` via bridge |
| Tab navigation between point fields | `VERIFIED` | `CorrectionCompact.vue` lines 78-87: `tabindex`, `@keydown.enter` → `onScoreKeydown`, `@focus` → `select()` |
| Real-time grade calculation | `VERIFIED` | `CorrectionCompact.vue` computed properties `totalPoints`, `percentageScore` update instantly on any `taskScores` change |

## Procedure Log

### Step 1 — Fix route param bug
- Action: Changed `route.params.examId` → `route.params.id` in `CorrectionCompact.vue`
- Expected: Correct exam loaded when navigating to `/exams/:id/correct`
- Actual: Route param matches router definition `:id`
- Result: `PASS`
- Artifacts: `apps/teacher-ui/src/views/CorrectionCompact.vue` line 208

### Step 2 — Fix pointsToNextGrade
- Action: Replaced inline `minPoints`-based implementation with `gradingKeyService?.pointsToNextGrade(totalPoints, gradingKey)` via bridge
- Expected: Correct points-to-next-grade for percentage-based grading keys
- Actual: Uses service that handles percentage → points conversion correctly
- Result: `PASS`
- Artifacts: `apps/teacher-ui/src/views/CorrectionCompact.vue` lines 197-203

### Step 3 — Add tab navigation
- Action: Added `registerScoreInput` ref collector, `onScoreKeydown` (Enter → next input), `tabindex` on inputs, `@focus` auto-select
- Expected: Tab/Enter moves focus through score fields in task order
- Actual: All numeric score inputs registered, Enter advances focus
- Result: `PASS`
- Artifacts: `apps/teacher-ui/src/views/CorrectionCompact.vue` lines 138-161 (script functions), 78-87 (template usage)

### Step 4 — Update router
- Action: Changed `/exams/:id/correct` route to use `CorrectionCompact.vue` (bridge-based) instead of `CorrectionCompactUI.vue` (mock data)
- Expected: Production route uses architecture-compliant component
- Actual: Router imports `CorrectionCompact.vue`
- Result: `PASS`
- Artifacts: `apps/teacher-ui/src/router/index.ts` line 44

### Step 5 — Tests
- Action: Added `apps/teacher-ui/tests/correction-compact.test.ts` with 15 tests covering totalPoints, percentageScore, alternativeToPoints, pointsToNextGrade
- Expected: All tests pass
- Actual: 89 tests pass (74 pre-existing + 15 new)
- Result: `PASS`
- Artifacts: `apps/teacher-ui/tests/correction-compact.test.ts`

### Step 6 — Build gates
- Action: `npm run lint:docs`, `npm run build:packages`, `npm run build:ipad`
- Expected: All pass
- Actual: All pass
- Result: `PASS`

## Architecture Audit

```
rg -n "from '../db'|from './db'|Dexie|useDatabase\(" apps/teacher-ui/src --include="*.ts" --include="*.vue"
```

Results (views-wip/ only, no active production paths):
```
apps/teacher-ui/src/views-wip/Dashboard.vue:279:import type { ClassGroup, AttendanceRecord } from '../db'
apps/teacher-ui/src/views-wip/ClassDetail.vue:218:import type { ClassGroup, Student } from '../db'
apps/teacher-ui/src/views-wip/StudentProfile.vue:327:import type { Student, AttendanceRecord, ClassGroup } from '../db'
apps/teacher-ui/src/views-wip/ClassDetail-clean.vue:218:import type { ClassGroup, Student } from '../db'
apps/teacher-ui/src/views-wip/AttendanceEntry.vue:159:import type { ClassGroup, Student } from '../db'
apps/teacher-ui/src/composables/useDatabase.ts:6:export function useDatabase(): never {
```

- `views-wip/` files are excluded from build (`tsconfig.app.json: "exclude": ["src/views-wip/**"]`)
- `useDatabase.ts` is a deprecation stub that throws `never` — not an active path
- **No active production files have direct DB access** ✅

## Verification Summary

- **Total acceptance criteria**: 9
- **VERIFIED**: 9
- **GAP**: 0
- **NOT VERIFIED**: 0
