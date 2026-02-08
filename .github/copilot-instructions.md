# ViccoBoard Tight-Leash Execution Protocol

## 0) Mission
Continue parity implementation without architecture drift.
No bloat, no duplicate data paths, no hidden shortcuts.

## 1) Hard Rules (non-negotiable)
1. Never add direct UI access to `../db`, Dexie tables, or storage adapters.
2. Never add/restore app-layer repositories/use-cases in `apps/teacher-ui`.
3. Student data is centralized only via `modules/students` + bridge.
4. Sport logic goes through `modules/sport` + sport bridge.
5. Exams logic goes through `modules/exams` + exams bridge.
6. No feature removal/simplification; unknown spec -> `Plan.md §9` TBD entry.
7. No `@ts-nocheck` additions. Remove existing ones when touching a file.
8. No placeholder logic in production paths (“TODO placeholder”, fake calculations, mock persistence).
9. `docs/agents/SPORTZENS_PARITY_v2.md` is a mandatory instruction file for parity work and must be followed as binding scope/gate guidance.

## 2) Forbidden Changes
1. No new `useDatabase` usage in views/stores/composables.
2. No imports of `../db` outside approved storage/bootstrap internals.
3. No parallel student stores/repos in apps or storage package.
4. No bypassing module boundaries “just to make tests pass”.

## 3) Allowed Work Unit Size
1. One PR = max 1–3 checkbox IDs from `Plan.md §6` or parity ledger items.
2. Keep diffs narrow and traceable.
3. If scope grows, stop and split into follow-up PRs.

## 4) Mandatory Pre-Edit Checks
1. Read `AGENTS.md`.
2. Read `docs/agents/SPORTZENS_PARITY_v2.md`.
3. Read `Plan.md` relevant checkbox section.
4. Read parity ledger rows being touched.
5. State exact target IDs before coding.

## 5) Mandatory Post-Edit Gates
Run all and require green:
1. `npm run lint:docs`
2. `npm run build:packages`
3. `npm run build:ipad`
4. `npm test`
5. `npm run test --workspace=@viccoboard/exams`
6. `npm run test --workspace=@viccoboard/sport`
7. `npm run test --workspace=teacher-ui`
8. `npm run test --workspace=@viccoboard/students`

## 6) Parity Ledger Discipline
For every item moved to done:
1. Update `implemented` from `no` -> `yes`.
2. Fill `location` with exact file+symbol.
3. Fill `tests` with exact test file+name.
4. Never leave new completed items as `N/A`.

## 7) Required Output Format (every run)
1. Target IDs worked on.
2. Files changed + why.
3. Gate command results (pass/fail).
4. Ledger rows updated.
5. Remaining blockers + next smallest actionable step.

## 8) Stop Conditions (must halt and report)
1. Need to violate a hard rule to proceed.
2. Spec ambiguity that could change behavior.
3. Cross-module refactor required beyond current 1–3 IDs.
4. Unexpected unrelated file changes appear.

## 9) Priority Queue (always in this order)
1. Architecture compliance regressions.
2. Failing tests/builds.
3. Parity gaps with existing infrastructure.
4. New feature work.
