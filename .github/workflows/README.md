# GitHub Actions Workflows

This folder contains the automated quality and security workflows for ViccoBoard.

## Workflows

### `ci.yml` (`CI`)
Runs on pushes and pull requests to `main`.

Checks in order:
1. `npm ci`
2. `npm run lint:docs`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

### `codeql.yml` (`CodeQL`)
Runs on pushes/PRs to `main` and weekly.

- Static analysis for JavaScript/TypeScript
- Uploads findings to GitHub Security tab

### `scorecards.yml` (`Scorecards`)
Runs on pushes to `main`, weekly, manual trigger, and branch-protection updates.

- Executes OpenSSF Scorecard checks
- Publishes SARIF results to GitHub code scanning
- Uploads the SARIF artifact for inspection

### `docs-guardrails.yml` (`Docs Guardrails`)
Fast docs-policy validation on push/PR.

### `release.yml` (`Release Build`)
Manual release workflow (`workflow_dispatch`) for artifact packaging and GitHub Releases.

## Local parity check

Run the same core gate locally before opening a PR:

```bash
npm run lint:docs
npm run typecheck
npm run test
npm run build
```
