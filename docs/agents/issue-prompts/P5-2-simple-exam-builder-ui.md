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
- Primary issue: $(@{Id=P5-2; Name=Simple Exam Builder UI; PriorityLine=**Priority:** HIGH | **Effort:** 3 days; Description=Implement UI for creating simple exams.; Tasks=System.Object[]; Acceptance=System.Object[]; RelatesTo=Plan.md §6.9 (Simple mode)}.Id)"
  # Copilot Prompt - [P5-2] Simple Exam Builder UI  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += '- Max secondary issues: 0 unless explicitly required by dependency.'
  # Copilot Prompt - [P5-2] Simple Exam Builder UI  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += '- Do not implement unrelated issue IDs.'
  # Copilot Prompt - [P5-2] Simple Exam Builder UI  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += ''
  if(@{Id=P5-2; Name=Simple Exam Builder UI; PriorityLine=**Priority:** HIGH | **Effort:** 3 days; Description=Implement UI for creating simple exams.; Tasks=System.Object[]; Acceptance=System.Object[]; RelatesTo=Plan.md §6.9 (Simple mode)}.PriorityLine){ # Copilot Prompt - [P5-2] Simple Exam Builder UI  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += 
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
- Relates to: Plan.md §6.9 (Simple mode)

## Non-Negotiable Constraints
- No app-layer direct DB path usage (`../db`, Dexie tables, storage adapters in UI/composables).
- No architecture drift: use module bridges/use-cases only.
- Criteria/status options must remain configurable where applicable.
- Do not claim done/compliant without file+line evidence.

## Mandatory Output Structure
1. Pre-edit declaration:
   - mode
   - exact files to touch
   - risks/dependencies
2. Implementation summary with file references.
3. Verification matrix (VERIFIED/GAP/NOT VERIFIED) for each acceptance criterion.
4. Command results:
   - `npm run lint:docs`
   - `npm run build:packages`
   - `npm run build:ipad`
   - `npm test`
5. Architecture audit output:
   - `Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "from '../db'" -SimpleMatch`
   - `Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "useDatabase(" -SimpleMatch`
6. Explicit list of remaining blockers and next smallest step.
