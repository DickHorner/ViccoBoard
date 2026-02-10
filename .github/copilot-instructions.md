# ViccoBoard Tight-Leash Execution Protocol

## 0) Mission
Continue parity implementation without architecture drift.
No bloat, no duplicate data paths, no hidden shortcuts.

## 0.1) preamble
You are in ZERO-TRUST PARITY AUDIT mode for ViccoBoard.

Read first (mandatory):
- agents.md
- Plan.md (especially §6 and §9)
- docs/agents/SPORTZENS_PARITY_v2.md
- docs/planning/ISSUES_TRACKER.md
- docs/status/STATUS.md
- .github/copilot-instructions.md

Non-negotiable rules:
1. Never claim “implemented/compliant” without file+line evidence.
2. Never infer parity from “tests pass”.
3. Every Plan.md checkbox must be classified as:
   - VERIFIED (with proof)
   - GAP (missing/incorrect)
   - NOT VERIFIED (not yet tested)
4. If UI is required, verify actual UI control type (example: slider must be `<input type="range">`).
5. If required parity ledger artifacts are missing, create them before any completion claim.
6. Do not close issues unless all relevant checkboxes are VERIFIED with proof.

Required outputs:
1. Verification matrix (one row per checkbox in scope):
   - Checkbox ID
   - Status (VERIFIED/GAP/NOT VERIFIED)
   - Evidence: file path + line
   - If GAP: exact remediation step
2. “What I verified vs what I did not verify” section.
3. Commands executed and exact results.
4. Updated parity ledger files and references.
5. Coverage summary:
   - total checkboxes in scope
   - count VERIFIED / GAP / NOT VERIFIED
6. Only after that: prioritized fix plan.

Hard fail condition:
If any claim lacks concrete evidence, mark it as NOT VERIFIED, not VERIFIED.

## 0.2) Execution Mode Declaration (Mandatory)
Every run must start by declaring one mode:
1. `AUDIT`: verify scope, collect evidence, report gaps. No implementation claims.
2. `IMPLEMENTATION`: code changes for declared issue IDs, then gate validation.

Rules:
1. Never mix modes implicitly.
2. If asked a verification question, default to `AUDIT`.
3. In `AUDIT`, never state or imply “done/compliant” unless each scoped checkbox is VERIFIED.
4. In `IMPLEMENTATION`, never claim parity completion without post-edit gates and evidence.

## 0.3) Truthfulness Protocol
1. Distinguish clearly between:
   - what was verified
   - what was inferred
   - what was not verified
2. Prohibited completion wording without proof:
   - “fully implemented”
   - “meets all criteria”
   - “parity achieved”
3. If any scoped item is unverified, explicitly state:
   - “NOT VERIFIED” and why
   - exact next verification step


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
10. Criteria/status options in relevant areas (at least attendance) must be configurable catalogs, not hardcoded-only enums.

## 2) Forbidden Changes
1. No new `useDatabase` usage in views/stores/composables.
2. No imports of `../db` outside approved storage/bootstrap internals.
3. No parallel student stores/repos in apps or storage package.
4. No bypassing module boundaries “just to make tests pass”.
5. Do not keep direct Dexie-path composables (`useDatabase.ts`, `useExams.ts`, `useCorrections.ts`) as active production paths.

## 2.1) Dexie Migration Enforcement (Current Priority)
1. Existing app-layer Dexie access is treated as migration debt, not acceptable steady-state architecture.
2. Migrate active consumers to bridges/use-cases first (`useSportBridge`, `useExamsBridge`, `useStudentsBridge`).
3. Only after active consumers are migrated and gates are green may legacy files be removed or reduced to explicit deprecation stubs.
4. Never claim completion while active code still imports `../db` from app-layer composables/views/stores.
5. Mandatory evidence in final report:
   - search results for `from '../db'` and `useDatabase(` in `apps/teacher-ui/src`
   - list of remaining legacy files (if any) with justification and follow-up issue ID

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
9. Architecture audit commands (must be included in report):
   - `Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "from '../db'" -SimpleMatch`
   - `Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "useDatabase(" -SimpleMatch`

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
4. Verification evidence summary (what is VERIFIED vs GAP vs NOT VERIFIED).
5. Ledger rows updated.
6. Remaining blockers + next smallest actionable step.

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

## 10) GitHub Issue Handling Protocol
1. Every implementation run must declare exactly one primary issue ID (`[P*-*]`), with at most two secondary IDs.
2. Before coding, verify the issue is open and its acceptance criteria are listed in the run plan.
3. If the issue is closed but tracker tasks are still open, reopen the issue before coding.
4. If tracker tasks exist without a GitHub issue, create one with matching ID/title from `docs/planning/ISSUES_TRACKER.md`.
5. Keep issue scope strict: do not implement unrelated tracker IDs in the same run.
6. Do not mark tracker checkboxes or close the issue until all mandatory gates are green.
7. On completion, post a concise issue update containing:
   - changed files
   - gate command results
   - linked Plan.md checkbox IDs
   - remaining blockers (if any)
8. Close an issue only when all listed tasks and acceptance criteria are satisfied with evidence from tests/builds.
