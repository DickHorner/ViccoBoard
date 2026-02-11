# Copilot Prompt - [P6-4] Comment Boxes & Task-Wise Correction

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
- Primary issue: $(@{Id=P6-4; Name=Comment Boxes & Task-Wise Correction; PriorityLine=**Priority:** MEDIUM | **Effort:** 2 days; Description=Implement comment system and table-based correction view.; Tasks=System.Object[]; Acceptance=System.Object[]; RelatesTo=Plan.md §6.11 & §6.15}.Id)"
  # Copilot Prompt - [P6-4] Comment Boxes & Task-Wise Correction  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += '- Max secondary issues: 0 unless explicitly required by dependency.'
  # Copilot Prompt - [P6-4] Comment Boxes & Task-Wise Correction  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += '- Do not implement unrelated issue IDs.'
  # Copilot Prompt - [P6-4] Comment Boxes & Task-Wise Correction  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += ''
  if(@{Id=P6-4; Name=Comment Boxes & Task-Wise Correction; PriorityLine=**Priority:** MEDIUM | **Effort:** 2 days; Description=Implement comment system and table-based correction view.; Tasks=System.Object[]; Acceptance=System.Object[]; RelatesTo=Plan.md §6.11 & §6.15}.PriorityLine){ # Copilot Prompt - [P6-4] Comment Boxes & Task-Wise Correction  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += 
## Issue Description
- Implement comment system and table-based correction view.

## Required Tasks (from tracker)
- [ ] Comment boxes per task level
- [ ] Table-mode correction view
- [ ] Sort by task or candidate
- [ ] Comment storage and display
- [ ] Copy comments between candidates

## Acceptance Criteria (must be evidenced)
- Comments save and display
- Table view shows all data
- Sorting works correctly
- Comment reuse functional

## Traceability
- Relates to: Plan.md §6.11 & §6.15

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
