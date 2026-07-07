# Motherlode Activation Notes

Primary policy file: `HANDBOOK.md`.

This prompt fragment is an adapter for audit-oriented work. It is intentionally short so it does not become another rulebook.

## Scope order

- Start from `HANDBOOK.md`.
- Use repo context and risk surface to decide which audit findings matter.
- Keep remediation small, reversible and tied to the declared slice.
- Use `.motherlode/scripts/audit.ps1` only as evidence input.
- Record changed files, check results, unresolved risks and the next smallest action.

## Gate notes

- No critical security regression.
- No hidden source of truth.
- No completion claim without evidence.
- No enabled rule without rationale.
