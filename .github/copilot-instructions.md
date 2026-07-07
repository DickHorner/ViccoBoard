# ViccoBoard Copilot Instructions

Primary engineering policy: [`../HANDBOOK.md`](../HANDBOOK.md).

Do not treat this file as a second rulebook. It only tells GitHub Copilot where the current source of truth lives and which ViccoBoard boundaries are non-negotiable.

## Mandatory read order

1. `HANDBOOK.md`
2. `agents.md`
3. `Plan.md` for product scope
4. `docs/planning/ISSUES_TRACKER.md` for active work packages
5. `docs/status/STATUS.md` for current status
6. `DEVELOPMENT.md` for commands and repo shape

For Sport parity work, also read `docs/agents/sport_parity_v2.md`.

## Repo boundaries

- Web-only, local-first, iPadOS/Safari-compatible.
- Architecture direction: `apps -> modules -> packages`.
- UI uses module bridges/use-cases instead of direct storage access.
- No app-layer repositories or duplicate student data paths.
- No feature removal or option simplification without explicit `Plan.md` TBD handling.
- No new dependencies, generic helpers, flags, or architecture unless required by the current slice.

## Execution discipline

Use the Handbook sequence: Context, Idiom, Slice, Shape, Patch, Delete, Prove, Report, Stop.

Before editing, inspect two or three similar repo locations and follow their patterns. After editing, run the strongest feasible checks and state what remains unverified.

## Required report shape

- DONE
- NOT DONE
- CHECKS
- READY FOR NEXT STEP
