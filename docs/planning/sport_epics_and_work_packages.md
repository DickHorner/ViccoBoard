# Sport Epics And Work Packages

This document gives a small audit-friendly map from sport epics to the GitHub work packages that implement them. It is a planning index only; feature scope still comes from [Plan.md](../../Plan.md), and day-to-day execution status comes from [ISSUES_TRACKER.md](./ISSUES_TRACKER.md) plus the linked GitHub issues and PRs.

## Epic 5: Live Teaching Tools

GitHub epic: `#138` `[Sport Epic] Live-Unterrichtstools auf Produktniveau bringen`

Traceability:
- `Plan.md` section `6.6`
- Sport parity focus: live teaching tools below the page layer with explicit session models and modeled handoffs

Work packages:

| GitHub issue | Scope | Plan.md trace |
| --- | --- | --- |
| `#140` | Team builder persistence, reopen flow, balancing rules, later handoffs | `§6.6 Teams einteilen` |
| `#139` | Persistent scoreboard session, team import, event log, timer linkage | `§6.6 Scoreboard` |
| `#141` | Tournament MVP with persistence, round-robin and knockout, standings/bracket, scoreboard/direct result flow | `§6.6 Turnierplanung` |
| `#142` | Dice tool route, configurable range, lesson-linked logging | `§6.6 Würfeln` |
| `#143` | Tactics board MVP with snapshots and local reopen flow | `§6.6 Taktikboard` |

Completion notes:
- The explicit scoreboard-to-tournament result flow landed after the first tournament MVP and is covered by follow-up implementation work on `#141`.
- Later polish for the scoreboard presenter mode, 4-team layout, inline timer, and direct tournament handoff was added after the initial child packages and remains part of the same epic outcome.

## Epic 6: Feedback, Statistics, And Sport Settings

GitHub epic: `#144`

Traceability:
- `Plan.md` sections `6.1`, `6.2`, `6.4`, `6.5`, and `6.7`

Work packages:

| GitHub issue | Scope | Plan.md trace |
| --- | --- | --- |
| `#147` | Feedback methods, persistence, and summary view | `§6.7 Feedback` |
| `#146` | Dedicated sport statistics entry point and overview screens | `§6.7 Statistiken` |
| `#148` | Sport settings hub and configuration entry points | `§6.1`, `§6.2`, `§6.4`, `§6.5` |
| `#145` | Parity and status documentation refresh | Traceability support |

## Review Notes

Use this file with:
- [ISSUES_TRACKER.md](./ISSUES_TRACKER.md)
- [STATUS.md](../status/STATUS.md)
- [PARITY_LEDGER.md](../parity-spec/sport-apk/_ledger/PARITY_LEDGER.md)

If a work package exists in GitHub but is not listed here, add it instead of silently folding it into another item.
