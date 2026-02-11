# Evidence Template

Use this template for issue-level evidence files (for example `docs/evidence/p4-1/workflow-checklist.md`).

## Metadata

- Issue ID:
- Scope:
- Date (YYYY-MM-DD):
- Executor:
- Mode: `AUDIT` / `IMPLEMENTATION`

## Acceptance Criteria Matrix

| Criterion | Status (`VERIFIED` / `GAP` / `NOT VERIFIED`) | Evidence |
|---|---|---|
|  |  |  |
|  |  |  |
|  |  |  |

## Procedure Log

### Step 1
- Action:
- Expected:
- Actual:
- Result: `PASS` / `FAIL`
- Artifacts (file paths, screenshots, logs):
- Notes:

### Step 2
- Action:
- Expected:
- Actual:
- Result: `PASS` / `FAIL`
- Artifacts (file paths, screenshots, logs):
- Notes:

### Step 3
- Action:
- Expected:
- Actual:
- Result: `PASS` / `FAIL`
- Artifacts (file paths, screenshots, logs):
- Notes:

## Persistence Check (if applicable)

- Save action performed:
- Reload action performed:
- Data present after reload: `YES` / `NO`
- Evidence:

## Architecture Audit

Run and paste summarized results:

- `Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "from '../db'" -SimpleMatch`
- `Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "useDatabase(" -SimpleMatch`

Result summary:
- `from '../db'` findings:
- `useDatabase(` findings:

## Gates

- `npm run lint:docs`:
- `npm run build:packages`:
- `npm run build:ipad`:
- `npm test`:

## Files Touched

- `path/to/file`: reason
- `path/to/file`: reason

## Remaining Gaps / Next Smallest Step

- Gap:
- Next step:

