# OpenSSF Best Practices Badge Fast-Track (CII)

This playbook tracks the repository evidence and maintainer steps for pursuing the OpenSSF Best Practices badge.

## 1) Repository evidence

Use these repository artifacts when completing the badge criteria:

- Project overview and usage:
  - `README.md`
  - `README.en.md`
  - `INDEX.md`
- Contribution process:
  - `CONTRIBUTING.md`
  - `.github/ISSUE_TEMPLATE/*`
  - `.github/PULL_REQUEST_TEMPLATE.md`
- License:
  - `LICENSE`
  - root `package.json`
- Security process:
  - `SECURITY.md`
- Community standards:
  - `CODE_OF_CONDUCT.md`
- Build, CI, and static analysis:
  - `.github/workflows/ci.yml`
  - `.github/workflows/codeql.yml`
  - `.github/workflows/scorecard.yml`
  - `.github/workflows/docs-guardrails.yml`
- Dependency updates:
  - `.github/dependabot.yml`
- Release process:
  - `.github/workflows/release.yml`
- Code ownership:
  - `.github/CODEOWNERS`

## 2) Badge workflow

1. Sign in at `https://www.bestpractices.dev/en/login`.
2. Create or open the ViccoBoard project entry.
3. Use the repository evidence above for the applicable criteria.
4. Keep the badge status and repository documentation in sync.
5. Add or update the official badge URL in the README only when a real project ID exists.

Do not add placeholder project IDs.
