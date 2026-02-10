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
4. `docs/agents/SPORTZENS_PARITY_v2.md`

## Pre-Coding Response (Required)

Copilot must first reply with:

1. The hard rules it will apply for this run.
2. Exact target IDs and acceptance criteria.
3. Planned files/modules to touch.

## Implementation Requirements

1. Keep scope strictly within declared IDs.
2. No architecture drift (no direct app-layer DB access, no module boundary bypass).
3. No completion claim without test/build evidence.

## Post-Coding Report (Required)

Copilot must provide:

1. Gate results:
- `npm run lint:docs`
- `npm run build:packages`
- `npm run build:ipad`
- `npm test`
2. Traceability IDs:
- Primary issue ID
- Related `Plan.md` checkbox IDs
3. Changed files summary (one line per file).
4. Remaining blockers and next smallest step.

## Acceptance Criteria

- [ ] Scope implemented for the declared IDs only
- [ ] All required gates are green
- [ ] Traceability IDs are included in final report
- [ ] No hard-rule violations
