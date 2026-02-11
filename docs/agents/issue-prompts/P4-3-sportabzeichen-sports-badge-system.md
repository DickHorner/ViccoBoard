# Copilot Prompt - [P4-3] Sportabzeichen (Sports Badge) System

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
- Primary issue: $(@{Id=P4-3; Name=Sportabzeichen (Sports Badge) System; PriorityLine=**Priority:** MEDIUM | **Effort:** 2 days; Description=Implement age-dependent sports badge evaluation.; Tasks=System.Object[]; Acceptance=System.Object[]; RelatesTo=Plan.md §6.5 (Sportabzeichen)}.Id)"
  # Copilot Prompt - [P4-3] Sportabzeichen (Sports Badge) System  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += '- Max secondary issues: 0 unless explicitly required by dependency.'
  # Copilot Prompt - [P4-3] Sportabzeichen (Sports Badge) System  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += '- Do not implement unrelated issue IDs.'
  # Copilot Prompt - [P4-3] Sportabzeichen (Sports Badge) System  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += ''
  if(@{Id=P4-3; Name=Sportabzeichen (Sports Badge) System; PriorityLine=**Priority:** MEDIUM | **Effort:** 2 days; Description=Implement age-dependent sports badge evaluation.; Tasks=System.Object[]; Acceptance=System.Object[]; RelatesTo=Plan.md §6.5 (Sportabzeichen)}.PriorityLine){ # Copilot Prompt - [P4-3] Sportabzeichen (Sports Badge) System  You are in STRICT COMPLIANCE mode for ViccoBoard.  ## Mandatory Reading (before any action) - `.github/copilot-instructions.md` - `agents.md` - `Plan.md` (especially section 6 and section 9) - `docs/agents/SPORTZENS_PARITY_v2.md` - `docs/planning/ISSUES_TRACKER.md` - `docs/status/STATUS.md`  ## Execution Mode - Declare mode at start: `AUDIT` or `IMPLEMENTATION`. - For this run, use `IMPLEMENTATION`. - Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.  ## Scope Lock += 
## Issue Description
- Implement age-dependent sports badge evaluation.

## Required Tasks (from tracker)
- [ ] Age calculation from birth year
- [ ] Age-based performance standards
- [ ] Badge achievement tracking
- [ ] PDF export for overview
- [ ] Results archive

## Acceptance Criteria (must be evidenced)
- Age-based standards applied
- Badge achievements accurate
- PDF shows all students
- Historical data available

## Traceability
- Relates to: Plan.md §6.5 (Sportabzeichen)

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
