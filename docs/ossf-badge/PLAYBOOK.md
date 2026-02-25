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
