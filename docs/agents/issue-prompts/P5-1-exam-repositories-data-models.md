# Copilot Prompt - [P5-1] Exam Repositories and Data Models

You are in STRICT COMPLIANCE mode for ViccoBoard.

## Mandatory Reading (before any action)
- `.github/copilot-instructions.md`
- `agents.md`
- `Plan.md` (especially section 6 and section 9)
- `docs/agents/sport_parity_v2.md`
- `docs/planning/ISSUES_TRACKER.md`
- `docs/status/STATUS.md`

## Execution Mode
- Declare mode at start: `AUDIT` or `IMPLEMENTATION`.
- For this run, use `IMPLEMENTATION`.
- Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.

## Scope Lock
- Primary issue: `P5-1` - Exam Repositories and Data Models
- Priority/Effort: HIGH / 2 days
- Max secondary issues: 0 unless explicitly required by dependency.
- Do not implement unrelated issue IDs.

## Issue Description
- Implement persistence layer for exams.

## Required Tasks (from tracker)
- [ ] Exam repository (CRUD plus queries)
- [ ] TaskNode repository (3-level hierarchy)
- [ ] Criterion repository
- [ ] Schema migrations
- [ ] Unit tests

## Acceptance Criteria (must be evidenced)
- CRUD operations functional
- Hierarchy represented correctly
- Queries efficient
- Tests pass

## Traceability
- Relates to: Plan.md section 6.9, modules/exams

## Evidence Required (mandatory)
- Create or update `docs/evidence/P5-1-evidence.md` from `docs/evidence/_template.md`.
- For each acceptance criterion, include exact file and line references.
- Include runtime verification steps when UI or behavior is involved.
- If any criterion is not verified, mark as `GAP` and do not claim completion.

## Non-Negotiable Constraints
- No direct DB access in UI/composables (`../db`, Dexie tables, app-layer repositories).
- No architecture drift: use module bridges and use-cases only.
- Student management stays centralized (`packages/core` + `modules/students`).
- Criteria and status options must stay configurable catalogs where applicable.
- No feature deletion or simplification; ambiguous specs go to `Plan.md` section 9 as TBD.

## GitHub Workflow (mandatory, no stacked PRs)
1. Resolve the GitHub issue number for `P5-1` before coding.
   - Run: `gh issue list --state open --search "P5-1 in:title"`
2. Sync from `main` and branch only from `origin/main`.
   - Run in order:
     - `git fetch origin`
     - `git checkout main`
     - `git pull --ff-only origin main`
     - `git checkout -b copilot/p5-1-<short-slug>`
3. Do not create stacked PRs.
   - Branch must not be based on another feature branch.
   - PR base must always be `main`.
   - If any existing open PR is based on a non-`main` base or your branch is behind an unmerged feature branch, stop and restack onto `main`.
4. One PR closes one issue.
   - Include exactly one closing keyword for the primary issue: `Closes #<issue_number>`.
   - Do not add additional `Closes/Fixes/Resolves` lines for other issues; use `Refs #<issue_number>` for non-primary links.
5. Implement only this issue scope, then run all required gates.
6. Commit with a traceable message that includes `P5-1`.
7. Push branch and open a PR to `main`.
   - PR title starts with `[P5-1] ...`
   - PR body must include: `Closes #<issue_number>` (primary issue only)
8. After merge, verify the linked issue is actually closed.
   - If not closed, run: `gh issue close <issue_number> --comment "Closed via merged PR for P5-1."`
9. Never report completion until PR URL exists and the issue state is `closed`.


## Mandatory Output Structure
1. Pre-edit declaration:
   - mode
   - exact files to touch
   - risks/dependencies
   - GitHub issue number resolved for `P5-1`
   - branch name to use
2. Implementation summary with file references.
3. Verification matrix (VERIFIED/GAP/NOT VERIFIED) for each acceptance criterion.
4. Gate command results:
   - `npm run lint:docs`
   - `npm run build:packages`
   - `npm run build:ipad`
   - `npm test`
5. Architecture audit output:
   - Prefer: `rg -n "from '../db'|from './db'|Dexie|useDatabase\(" apps/teacher-ui/src`
   - Fallback if `rg` is unavailable: `Get-ChildItem apps/teacher-ui/src -Recurse -Include *.ts,*.vue,*.js | Select-String -Pattern "from '../db'|from './db'|Dexie|useDatabase\("`
6. PR and issue closure proof:
   - branch name
   - commit SHA(s)
   - PR URL
   - explicit line showing `Closes #<issue_number>` in PR body
   - issue URL and final state (`closed`)
   - open PR list snapshot proving no stacking: `gh pr list --state open --json number,title,headRefName,baseRefName`
7. Explicit list of remaining blockers and the next smallest step.
