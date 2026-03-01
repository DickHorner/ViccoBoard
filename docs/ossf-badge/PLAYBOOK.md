# OpenSSF Best Practices Badge Fast-Track (CII)

This playbook is designed to get ViccoBoard to an OpenSSF Best Practices badge as quickly and credibly as possible.

## 1) Why this matters

OpenSSF Scorecard's `CII-Best-Practices` check only increases when the project is enrolled on https://www.bestpractices.dev and has at least an in-progress badge.

Score mapping used by Scorecard:
- Gold: 10
- Silver: 7
- Passing: 5
- In Progress: 2

Reference: https://github.com/ossf/scorecard/blob/cd152cb6742c5b8f2f3d2b5193b41d9c50905198/docs/checks.md#cii-best-practices

## 2) Current blocker (manual account step)

The only hard blocker we cannot complete from CI/CLI is account-bound project enrollment on bestpractices.dev.

## 3) One-shot enrollment steps

1. Sign in: https://www.bestpractices.dev/en/login
2. Create project: https://www.bestpractices.dev/en/projects/new
3. Use:
   - Name: `ViccoBoard`
   - Homepage: `https://github.com/DickHorner/ViccoBoard`
   - Repo URL: `https://github.com/DickHorner/ViccoBoard`
4. Save and open your new project page.
5. Start with required passing-level criteria.

## 4) Evidence map (copy/paste helper)

Use these repo artifacts as evidence/justification links in the badge form:

- Project homepage, what it does, interaction:
  - `README.md`
  - `README.en.md`
  - `INDEX.md`
- Contribution process and expectations:
  - `CONTRIBUTING.md`
  - `.github/ISSUE_TEMPLATE/*`
  - `.github/PULL_REQUEST_TEMPLATE.md`
- License:
  - `LICENSE`
  - root `package.json` (`license: MIT`)
- Public repo and change history:
  - Git history on `main`
  - GitHub pull requests/issues
- Security process:
  - `SECURITY.md` (private reporting + response targets)
- Secure/community behavior:
  - `CODE_OF_CONDUCT.md`
- Build + CI + static analysis:
  - `.github/workflows/ci.yml`
  - `.github/workflows/codeql.yml`
  - `.github/workflows/scorecard.yml`
  - `.github/workflows/docs-guardrails.yml`
- Dependency updates:
  - `.github/dependabot.yml`
- Release process:
  - `.github/workflows/release.yml`
- Code review ownership:
  - `.github/CODEOWNERS`

## 5) Recommended first badge target

Target `In Progress` first (fastest Scorecard lift), then complete passing criteria incrementally.

## 6) After project creation

Once the project exists, add the official badge URL in README.

Expected URL pattern:
- Badge image: `https://www.bestpractices.dev/projects/<PROJECT_ID>/badge`
- Project page: `https://www.bestpractices.dev/projects/<PROJECT_ID>`

Do not add placeholder IDs.

## 7) Scorecard zero-check reality (as of 2026-02-26)

These are the three checks currently at zero in Scorecard and what can move them.

### Maintained = 0

- Current reason: repository is younger than 90 days.
- Repo creation date (GitHub API): 2026-01-12.
- Earliest date this can score above 0: 2026-04-12.
- This check is time-gated by Scorecard and cannot be forced by repo file changes.

### Code-Review = 0

- Current reason: `0/6 approved changesets` in recent history.
- Scorecard uses recent changes (roughly the last ~30 commits).
- Direct pushes to `main` by the same human contributor keep this at 0.
- Fastest path to lift:
  1. Route all human changes through PRs.
  2. Get approval from a non-author human reviewer before merge.
  3. Keep doing this until unreviewed human changes age out of the recent commit window.

### CII-Best-Practices = 0

- Current reason: project is not enrolled in OpenSSF Best Practices.
- Earliest lift is `In Progress` (= score 2) after account-bound enrollment.
- Required manual step: register the repository on https://www.bestpractices.dev.

## 8) Quick command to re-check only zero checks

Run:

```bash
npm run scorecard:zeros
```

This script fetches live data from:
- `https://api.securityscorecards.dev/projects/github.com/DickHorner/ViccoBoard`
- `https://api.github.com/repos/DickHorner/ViccoBoard`

It prints blockers and actionability for `Maintained`, `Code-Review`, and `CII-Best-Practices`.

## 9) Code-review lift companion

Use this alongside this badge playbook:

- `docs/ossf-badge/CODE_REVIEW_LIFT_PLAYBOOK.md`

It documents a practical path to move `Code-Review` from zero without forcing an abrupt workflow break.

## 10) After you get a bestpractices.dev project ID

1. Copy the numeric project ID from the project URL.
2. Run:

```bash
npm run badge:bestpractices -- <PROJECT_ID>
```

This updates both `README.md` and `README.en.md` with:
- top badge: `OpenSSF Best Practices`
- reference links: `badge-bestpractices` + `bestpractices`

3. Commit and push to `main`.
4. Re-check status with:

```bash
npm run scorecard:zeros
```
