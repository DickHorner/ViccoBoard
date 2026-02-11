# Copilot Prompt - [P5-2] Simple Exam Builder UI

You are in STRICT COMPLIANCE mode for ViccoBoard.

## Mandatory Reading (before any action)
- `.github/copilot-instructions.md`
- `agents.md`
- `Plan.md` (especially section 6 and section 9)
- `docs/agents/SPORTZENS_PARITY_v2.md`
- `docs/planning/ISSUES_TRACKER.md`
- `docs/status/STATUS.md`

## Execution Mode
- Declare mode at start: `AUDIT` or `IMPLEMENTATION`.
- For this run, use `IMPLEMENTATION`.
- Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.

## Scope Lock
- Primary issue: `P5-2` - Simple Exam Builder UI
- Priority/Effort: HIGH / 3 days
- Max secondary issues: 0 unless explicitly required by dependency.
- Do not implement unrelated issue IDs.

## Issue Description
- Implement UI for creating simple exams.

## Required Tasks (from tracker)
- [ ] Create exam form
- [ ] Add tasks sequentially
- [ ] Set point values
- [ ] Define criteria
- [ ] Save and preview

## Acceptance Criteria (must be evidenced)
- Can create complete simple exam
- All fields validated
- Preview shows structure
- Saves correctly

## Traceability
- Relates to: Plan.md section 6.9 (Simple mode)

## Evidence Required (mandatory)
- Create or update `docs/evidence/P5-2-evidence.md` from `docs/evidence/_template.md`.
- For each acceptance criterion, include exact file and line references.
- Include runtime verification steps when UI or behavior is involved.
- If any criterion is not verified, mark as `GAP` and do not claim completion.

## Non-Negotiable Constraints
- No direct DB access in UI/composables (`../db`, Dexie tables, app-layer repositories).
- No architecture drift: use module bridges and use-cases only.
- Student management stays centralized (`packages/core` + `modules/students`).
- Criteria and status options must stay configurable catalogs where applicable.
- No feature deletion or simplification; ambiguous specs go to `Plan.md` section 9 as TBD.

## Mandatory Output Structure
1. Pre-edit declaration:
   - mode
   - exact files to touch
   - risks/dependencies
2. Implementation summary with file references.
3. Verification matrix (VERIFIED/GAP/NOT VERIFIED) for each acceptance criterion.
4. Gate command results:
   - `npm run lint:docs`
   - `npm run build:packages`
   - `npm run build:ipad`
   - `npm test`
5. Architecture audit output:
   - `rg -n "from '../db'|from './db'|Dexie|useDatabase\(" apps/teacher-ui/src`
6. Explicit list of remaining blockers and the next smallest step.
