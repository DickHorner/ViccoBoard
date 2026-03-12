---
name: Sport Epic
about: Track a sport parity epic with reviewable child work packages
title: "[Sport Epic] "
labels: ["enhancement", "Sport"]
assignees: []
---

## Outcome

Describe the user-visible capability this epic unlocks and why it matters for Sport parity.

## Gap Summary

- Current state:
- Missing depth:
- Blocking workflows:

## Scope

- 

## Out of Scope

- 

## Child Work Packages

- [ ] Placeholder child issue

## Acceptance Criteria

- [ ] The epic outcome is visible in the app
- [ ] All child work packages are merged
- [ ] Relevant `Plan.md` checkboxes are linked from child issues
- [ ] Reviewers can validate the result without hidden follow-up work

## Traceability

- `Plan.md`:
- Parity reference:
- Related docs:

## Architecture Guardrails

- Keep organization concerns (`Lesson`, `Attendance`, `Student`, `ClassGroup`) subject-agnostic.
- Keep Sport business logic in `modules/sport` or explicit bridges/adapters.
- Do not bypass repository/use-case boundaries from the UI.
- Preserve offline-first and iPadOS Safari constraints.

## Roles

### Boundary-Cop-Auftrag

Describe the required domain boundaries, interfaces, and adapter constraints for this epic.

### Sport-Domain-Auftrag

Describe the sport-specific implementation goals for this epic.

### QA-Auftrag

Describe the required tests, manual checks, and regression risks for this epic.

