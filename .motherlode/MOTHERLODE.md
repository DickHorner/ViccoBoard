# Motherlode Adapter

Motherlode is no longer a separate engineering constitution in this repo.

Primary engineering policy source of truth: [`../HANDBOOK.md`](../HANDBOOK.md).

## Role of `.motherlode`

`.motherlode` remains useful as audit, prompt and evidence tooling. It contributes risk and proof perspectives, but it must not define rules that conflict with or duplicate the Handbook.

## Operating order

1. Read `HANDBOOK.md`.
2. Inspect repo-local product scope in `Plan.md` and active work in `docs/planning/ISSUES_TRACKER.md`.
3. Use `.motherlode/scripts/audit.ps1` when audit output is useful for the current slice.
4. Treat audit findings as evidence input, not as automatic architecture permission.
5. Apply fixes in small reversible slices and prove them through repo-native checks.

## Enforcement boundary

Motherlode checks may flag risk. The Handbook decides how work is scoped, shaped, patched, simplified and reported.

Do not create another local constitution from Motherlode output. If a durable rule is needed, update `HANDBOOK.md` or link to it from an adapter document.
