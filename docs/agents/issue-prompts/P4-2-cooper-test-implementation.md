# Copilot Prompt - [P4-2] Cooper Test Implementation

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
- Primary issue: `P4-2` - Cooper Test Implementation
- Priority/Effort: HIGH / 2 days
- Max secondary issues: 0 unless explicitly required by dependency.
- Do not implement unrelated issue IDs.

## Issue Description
- Implement Cooper Test (running/swimming) workflow.

## Required Tasks (from tracker)
- [ ] Track rounds/distance
- [ ] Support running and swimming modes
- [ ] Auto-calculate grades from table
- [ ] Result storage
- [ ] Sportart configuration

## Acceptance Criteria (must be evidenced)
- Can select sport mode
- Results calculated correctly
- Works with custom tables
- Data persists

## Traceability
- Relates to: Plan.md section 6.5 (Cooper-Test)

## Evidence Required (mandatory)
- Create or update `docs/evidence/P4-2-evidence.md` from `docs/evidence/_template.md`.
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
