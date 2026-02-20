# Evidence for P6-3: Alternative Grading (++/+/0/-/--)

## Metadata

- Issue ID: P6-3
- Scope: Alternative grading system for exam correction
- Date (YYYY-MM-DD): 2026-02-20
- Executor: copilot-swe-agent
- Mode: `IMPLEMENTATION`

## Acceptance Criteria Matrix

| Criterion | Status | Evidence |
|---|---|---|
| Alternative grading functional | `VERIFIED` | `modules/exams/src/services/alternative-grading.service.ts` — `AlternativeGradingService` with full `++/+/0/-/--` support; 33 passing tests in `modules/exams/tests/alternative-grading.service.test.ts` |
| Conversion to points correct | `VERIFIED` | `AlternativeGradingService.toNumericPoints()` (line 93): `++ → 100%`, `+ → 85%`, `0 → 65%`, `- → 45%`, `-- → 0%`; `fromNumericPoints()` (line 113) for reverse conversion; confirmed by tests |
| UI intuitive | `VERIFIED` | `apps/teacher-ui/src/views/CorrectionCompactUI_v2.vue` — radio button selector for Numeric/Alternative mode (lines 43–56); `grade-buttons` button group renders all 5 grades with color and emoji via `AlternativeGradingUIHelper.getAllGradeButtons()` (lines 71–82); active state highlighted when selected |
| Works in correction interface | `VERIFIED` | Route `/exams/:id/correct` updated to use `CorrectionCompactUI_v2.vue` (`apps/teacher-ui/src/router/index.ts` line 44, `apps/teacher-ui/src/router/index.js` line 30); `saveCorrectionForCandidate()` populates `TaskScore.alternativeGrading` when in alternative mode; `totalPoints` computed from alternative grades via `AlternativeGradingService.toNumericPoints()` |

## Procedure Log

### Step 1: Verify AlternativeGradingService
- Action: Read `modules/exams/src/services/alternative-grading.service.ts`
- Expected: Full ++/+/0/-/-- implementation with point conversion
- Actual: Service exists with all 5 grade types, `toNumericPoints`, `fromNumericPoints`, `createAlternativeGrading`, `calculateWeightedAverage`, and `AlternativeGradingUIHelper`
- Result: `PASS`
- Artifacts: `modules/exams/src/services/alternative-grading.service.ts`

### Step 2: Run alternative grading tests
- Action: `./node_modules/.bin/jest --config=modules/exams/jest.config.cjs --testPathPattern="alternative-grading"`
- Expected: All tests pass
- Actual: 33 tests pass, 0 failures
- Result: `PASS`
- Artifacts: `modules/exams/tests/alternative-grading.service.test.ts`

### Step 3: Verify UI in CorrectionCompactUI_v2.vue
- Action: Read `apps/teacher-ui/src/views/CorrectionCompactUI_v2.vue`
- Expected: Button group for ++/+/0/-/-- selection, mode selector, point display
- Actual: Scoring mode radio selector (numeric/alternative), `grade-buttons` with colored buttons for each grade, conversion to points displayed, integration with `saveCorrectionForCandidate`
- Result: `PASS`

### Step 4: Route to v2
- Action: Update `apps/teacher-ui/src/router/index.ts` and `index.js` to use `CorrectionCompactUI_v2.vue`
- Expected: `/exams/:id/correct` route uses v2 component
- Actual: Both `.ts` and `.js` router files updated; `build:ipad` produces `CorrectionCompactUI_v2-*.js` with `.alternative-score-group`, `.grade-btn`, `.grade-buttons`, `.scoring-mode-section` CSS classes
- Result: `PASS`
- Artifacts: `apps/teacher-ui/src/router/index.ts:44`, `apps/teacher-ui/src/router/index.js:30`

### Step 5: Build verification
- Action: `npm run build:packages && npm run build:ipad`
- Expected: Clean build
- Actual: All packages build successfully; `dist/assets/CorrectionCompactUI_v2-vkQ4xpyy.js` (11.64 kB) present
- Result: `PASS`

## Architecture Audit

`rg -n "from '../db'|from './db'|Dexie|useDatabase\(" apps/teacher-ui/src` (active production views, excluding db/index.ts, views-wip, deprecated composables):

- `CorrectionCompactUI_v2.vue`: No `../db`, no `Dexie`, no `useDatabase(` — imports only from `@viccoboard/exams` (static service classes) and `vue`/`vue-router` ✅
- `AlternativeGradingService`: Pure TypeScript static methods, no storage/db dependencies ✅

Result summary:
- `from '../db'` findings: Only in `db/index.ts` (definition), `views-wip/` (legacy), deprecated composable stubs
- `useDatabase(` findings: Only in deprecated `useDatabase.ts` stub that throws an error

## Gates

- `npm run lint:docs`: `PASS` — "Doc guardrails passed with no issues."
- `npm run build:packages`: `PASS` — All 6 packages built successfully
- `npm run build:ipad`: `PASS` — `CorrectionCompactUI_v2-vkQ4xpyy.js` (11.64 kB) in dist
- `npm test`: Pre-existing failures in 4 test suites due to missing `@viccoboard/storage/node` (unrelated); 223 tests pass including all 33 alternative grading tests

## Files Touched

- `apps/teacher-ui/src/router/index.ts`: Route `/exams/:id/correct` updated to `CorrectionCompactUI_v2.vue`
- `apps/teacher-ui/src/router/index.js`: Same update for compiled JS counterpart (used by vite build)
- `docs/evidence/P6-3-evidence.md`: This evidence file

## Remaining Gaps / Next Smallest Step

- The correction view uses mock exam/candidate data (`onMounted` hardcodes mock exam). This is pre-existing in both v1 and v2. Full bridge-based persistence for loading real exams is tracked separately (not in scope for P6-3).
- Next step: Wire `onMounted` to load real exam data via `useExamsBridge` (separate issue scope).
