---
name: Copilot Parity Task
about: Assign a constrained parity implementation task to Copilot
title: "[P?-?] "
labels: ["copilot-task"]
assignees: []
---

## Scope

- Primary issue ID: `[P*-*]`
- Secondary IDs (optional, max 2):
- Out of scope:

## Mandatory Instructions (Copilot Must Follow)

Copilot must follow these files before editing code:

1. `.github/copilot-instructions.md`
2. `agents.md`
3. `Plan.md` (especially section 6 and section 9)
4. `docs/agents/sport_parity_v2.md`

## Execution Mode Declaration (Required)

Copilot must start by declaring exactly one mode:

1. `AUDIT` - verification only, evidence collection, gap reporting.
2. `IMPLEMENTATION` - code changes for declared IDs, followed by gate validation.

Rules:

1. No implicit mode switching.
2. Verification questions default to `AUDIT`.
3. In `AUDIT`, no completion/compliance claim unless each scoped checkbox is VERIFIED.
4. In `IMPLEMENTATION`, no parity completion claim without gate evidence.

## Truthfulness Protocol (Required)

Copilot must explicitly separate:

1. What was VERIFIED.
2. What was inferred.
3. What was NOT VERIFIED.

If any scoped item is unverified, Copilot must mark it as `NOT VERIFIED` and provide the next verification step.

## Pre-Coding Response (Required)

Copilot must first reply with:

1. The hard rules it will apply for this run.
2. Exact target IDs and acceptance criteria.
3. Planned files/modules to touch.
4. Selected execution mode (`AUDIT` or `IMPLEMENTATION`) and why.

## Implementation Requirements

1. Keep scope strictly within declared IDs.
2. No architecture drift (no direct app-layer DB access, no module boundary bypass).
3. No completion claim without test/build evidence.
4. Treat app-layer Dexie imports/composables as migration debt: migrate active consumers to bridges/use-cases.

## Post-Coding Report (Required)

Copilot must provide:

1. Gate results:
- `npm run lint:docs`
- `npm run build:packages`
- `npm run build:ipad`
- `npm test`
2. Architecture audit results:
- `Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "from '../db'" -SimpleMatch`
- `Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "useDatabase(" -SimpleMatch`
3. Traceability IDs:
- Primary issue ID
- Related `Plan.md` checkbox IDs
4. Changed files summary (one line per file).
5. Remaining blockers and next smallest step.
6. Verification evidence summary:
- Count VERIFIED
- Count GAP
- Count NOT VERIFIED

## Acceptance Criteria

- [ ] Scope implemented for the declared IDs only
- [ ] All required gates are green
- [ ] Architecture audit output is included
- [ ] Traceability IDs are included in final report
- [ ] Verification evidence summary is included
- [ ] No hard-rule violations
