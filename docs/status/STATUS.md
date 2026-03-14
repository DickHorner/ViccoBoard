# ViccoBoard Development Status

**Last Updated:** March 14, 2026  
**Primary Source of Truth:** [Plan.md](../../Plan.md) for scope, [docs/planning/ISSUES_TRACKER.md](../planning/ISSUES_TRACKER.md) for work packages, and GitHub issues/PRs for live execution status.

---

## Repository State

- `apps -> modules -> packages` boundaries are in place and enforced in day-to-day work.
- Teacher UI, shared packages, and domain modules build through the standard quality gate.
- Documentation was reduced to maintained product, planning, runbook, and parity material.

---

## Product State

### Implemented Foundation

- Core local-first teacher app shell with offline-capable browser deployment
- Central student management and sport module wiring
- Sport class, student, lesson, attendance, grading, table, and live-tool workflows
- KBR exam builder and correction foundations

### Active Work Areas

- Remaining Plan.md checklist items not yet marked complete
- Final parity cleanup and missing option-level gaps
- Security, backup, and release hardening work

### Explicit Scope Rule

- WOW remains excluded by `sport_parity_v2.md` scope v2 and must not be removed from specifications.

---

## Quality Gates

Shared branch pushes must pass:

- `npm run lint:docs`
- `npm run build:packages`
- `npm run test`
- `npm run build`

