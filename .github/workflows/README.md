# GitHub Actions Workflows

This folder contains the automated quality and security workflows for ViccoBoard.

## Workflows

### `ci.yml` (`CI`)
Runs on pushes and pull requests to `main`.

Checks in order:
1. `npm ci`
2. `npm run lint:docs`
3. `npm run lint:workflows`
4. `npm run typecheck`
5. `npm run test`
6. `npm run build`

### `codeql.yml` (`CodeQL`)
Runs on pushes/PRs to `main` and weekly.

- Static analysis for JavaScript/TypeScript
- Uploads findings to GitHub Security tab

### `scorecard.yml` (`Scorecard supply-chain security`)
Runs on pushes to `main`, weekly, and branch-protection updates.

- Executes OpenSSF Scorecard checks
- Publishes SARIF results to GitHub code scanning
- Publishes Scorecard results for the public badge

### `dependabot-auto-merge.yml` (`Dependabot auto-merge`)
Runs on pull requests opened by `dependabot[bot]`.

- Fetches Dependabot update metadata
- Auto-approves and squash-merges **patch** and **minor** updates when CI passes
- **Major** version bumps are left for manual review

### `docs-guardrails.yml` (`Docs Guardrails`)
Fast docs-policy validation on push/PR.

### `release.yml` (`Release Build`)
Manual release workflow (`workflow_dispatch`) for artifact packaging and GitHub Releases.

### `publish-packages.yml` (`Publish Packages`)
Manual/tag-driven npm publishing workflow for workspace packages.

- Publishes `@viccoboard/core`, `@viccoboard/plugins`, `@viccoboard/storage`
- Requires repository secret: `NPM_TOKEN`

## Local parity check

Run the same core gate locally before opening a PR:

```bash
npm run lint:docs
npm run lint:workflows
npm run typecheck
npm run test
npm run build
```
