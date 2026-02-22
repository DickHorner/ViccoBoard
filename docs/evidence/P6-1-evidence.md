# Evidence: P6-1 — Correction Entry Repository and Use Cases

## Metadata

- Issue ID: P6-1
- Scope: Correction Entry Repository, RecordCorrectionUseCase, CalculateGradeUseCase
- Date (YYYY-MM-DD): 2026-02-20
- Executor: copilot-swe-agent
- Mode: `IMPLEMENTATION`

## Acceptance Criteria Matrix

| Criterion | Status | Evidence |
|---|---|---|
| Can record grades per task | `VERIFIED` | `modules/exams/src/use-cases/record-correction.use-case-v2.ts:44-50` — `taskScores` array processed and totals computed; test: `record-correction.use-case.test.ts` "records a new correction as in-progress" |
| Totals calculated correctly | `VERIFIED` | `modules/exams/src/use-cases/record-correction.use-case-v2.ts:52-62` — `totalPoints` summed from taskScores; grade computed via `GradingKeyService.calculateGrade`; tests: "calculates grade correctly from grading key", "calculates totals from multiple task scores" |
| Supports partial entry | `VERIFIED` | `modules/exams/src/use-cases/record-correction.use-case-v2.ts:36-46` — status defaults to `in-progress`, `correctedAt` not set unless `finalizeCorrection=true`; test: "records a new correction as in-progress (partial entry)" |
| Tests comprehensive | `VERIFIED` | `modules/exams/tests/correction-entry.repository.test.ts` (5 tests), `modules/exams/tests/calculate-grade.use-case.test.ts` (2 tests), `modules/exams/tests/record-correction.use-case.test.ts` (9 tests) — 16 tests total covering all acceptance criteria |

## Procedure Log

### Step 1: Audit existing implementation
- Action: Read all files in `modules/exams/src/repositories/` and `modules/exams/src/use-cases/`
- Expected: All required components exist
- Actual: CorrectionEntryRepository, RecordCorrectionUseCase (v2), and CalculateGradeUseCase all present
- Result: `PASS`
- Artifacts: `modules/exams/src/repositories/correction-entry.repository.ts`, `modules/exams/src/use-cases/record-correction.use-case-v2.ts`, `modules/exams/src/use-cases/calculate-grade.use-case.ts`

### Step 2: Identify missing test coverage
- Action: List test files in `modules/exams/tests/`
- Expected: Tests for all use cases
- Actual: Tests for CorrectionEntryRepository and CalculateGradeUseCase existed; no test for RecordCorrectionUseCase
- Result: `GAP` → remediated in Step 3
- Notes: `record-correction.use-case.test.ts` was missing

### Step 3: Create RecordCorrectionUseCase test
- Action: Created `modules/exams/tests/record-correction.use-case.test.ts` with 9 test cases
- Expected: All 9 tests pass
- Actual: All 9 tests pass (PASS: 9/9)
- Result: `PASS`
- Artifacts: `modules/exams/tests/record-correction.use-case.test.ts`

### Step 4: Run full test suite
- Action: `npm test` from repository root
- Expected: All tests pass
- Actual: 241 exams tests pass, 273 sport tests pass, 74 teacher-ui tests pass, 24 students tests pass
- Result: `PASS`

## Persistence Check

- Save action performed: `correctionRepo.createEntry()` / `correctionRepo.create()` via SQLiteStorage in-memory
- Reload action performed: `correctionRepo.findByExamAndCandidate()` / `correctionRepo.findByExam()` after save
- Data present after reload: `YES`
- Evidence: `record-correction.use-case.test.ts` — "updates existing correction entry on second call" verifies single entry persisted and updated

## Architecture Audit

Run results:

```
rg -n "from '../db'|from './db'|Dexie|useDatabase\(" apps/teacher-ui/src
```

Result: **no matches** (only legacy stub `useDatabase.ts` which throws an error when called)

- `from '../db'` findings: **none**
- `useDatabase(` findings: **none in active code** (disabled stub only)

## Gates

- `npm run lint:docs`: `PASS` — "Doc guardrails passed with no issues."
- `npm run build:packages`: `PASS` — all 6 packages compiled without errors
- `npm run build:ipad`: not run (no UI changes in this PR)
- `npm test`: `PASS` — 612 total tests across all workspaces

## Files Touched

- `modules/exams/tests/record-correction.use-case.test.ts`: **created** — 9 comprehensive tests for RecordCorrectionUseCase covering partial entry, full correction, grade calculation, multi-task totals, update flow, comments, support tips, error handling, and empty entry
- `docs/evidence/P6-1-evidence.md`: **created** — this file

## Remaining Gaps / Next Smallest Step

- No remaining gaps for P6-1.
- Next step: P6-2 (Compact Correction UI — Tab Nav, points to next grade, realtime grade display)
