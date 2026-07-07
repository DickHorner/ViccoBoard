# Motherlode

Motherlode is retained as audit and evidence tooling for ViccoBoard.

Engineering policy source of truth: [`../HANDBOOK.md`](../HANDBOOK.md).

## What belongs here

- `scripts/`: audit and activation helpers.
- `config/`: audit configuration.
- `checks/`: optional executable checks.
- `templates/`: reusable evidence artifacts.
- `prompts/`: adapters that point agents back to `HANDBOOK.md`.

## What does not belong here

- A second engineering constitution.
- New agent rules that duplicate `HANDBOOK.md`.
- Repo-specific product scope; that belongs in `Plan.md` and active planning docs.

## Typical usage

```powershell
pwsh -NoLogo -File .\.motherlode\scripts\bootstrap.ps1
pwsh -NoLogo -File .\.motherlode\scripts\audit.ps1
pwsh -NoLogo -File .\.motherlode\scripts\activate.ps1 -RunAudit
```

Audit output is evidence input. It does not override repo-first scope control.
