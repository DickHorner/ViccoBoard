# Copilot Prompt - [P5-1] Exam Repositories & Data Models

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
- Primary issue: $(@{Id=P5-1; Name=Exam Repositories & Data Models; PriorityLine=**Priority:** HIGH | **Effort:** 2 days; Description=Implement persistence layer for exams.; Tasks=System.Object[]; Acceptance=System.Object[]; RelatesTo=Plan.md §6.9, modules/exams}.Id)"
  # Copilot Prompt - [P5-1] Exam Repositories & Data Models  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += '- Max secondary issues: 0 unless explicitly required by dependency.'
  # Copilot Prompt - [P5-1] Exam Repositories & Data Models  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += '- Do not implement unrelated issue IDs.'
  # Copilot Prompt - [P5-1] Exam Repositories & Data Models  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += ''
  if(@{Id=P5-1; Name=Exam Repositories & Data Models; PriorityLine=**Priority:** HIGH | **Effort:** 2 days; Description=Implement persistence layer for exams.; Tasks=System.Object[]; Acceptance=System.Object[]; RelatesTo=Plan.md §6.9, modules/exams}.PriorityLine){ # Copilot Prompt - [P5-1] Exam Repositories & Data Models  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += 
## Issue Description
- Implement persistence layer for exams.

## Required Tasks (from tracker)
- [ ] Exam repository (CRUD + queries)
- [ ] TaskNode repository (3-level hierarchy)
- [ ] Criterion repository
- [ ] Add schema migrations
- [ ] Unit tests

## Acceptance Criteria (must be evidenced)
- CRUD operations functional
- Hierarchy represented correctly
- Queries efficient
- Tests pass

## Traceability
- Relates to: Plan.md §6.9, modules/exams

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
