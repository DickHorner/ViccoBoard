# OpenSSF Badges — ViccoBoard

ViccoBoard tracks **two separate OpenSSF signals**. Neither is a substitute for testing the application or protecting personal data.

## 1) OpenSSF Best Practices (CII)

- **Registered project:** [ViccoBoard — project 12057](https://www.bestpractices.dev/projects/12057)
- **Official badge:** `https://www.bestpractices.dev/projects/12057/badge`
- **Public project listing:** [Best Practices project directory](https://www.bestpractices.dev/de/projects?status=in_progress)
- A publicly indexed directory snapshot showed **96% progress** (potentially stale). This is **not** a Passing badge. Use the official project page for the live state.
- **Maintainer action:** sign in at [bestpractices.dev](https://www.bestpractices.dev/en/login) and complete/review the outstanding items. Do **not** create a duplicate project.

Evidence to use for applicable criteria:

| Topic | Repo evidence |
| --- | --- |
| Description, setup, product limits | `README.md`, `README.en.md`, `DEVELOPMENT.md`, `INDEX.md` |
| License | `LICENSE`, `package.json` |
| Contribution process | `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md` |
| Conduct and security reporting | `CODE_OF_CONDUCT.md`, `SECURITY.md` |
| CI, SAST, dependency updates | `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`, `.github/dependabot.yml` |
| Supply chain | `.github/workflows/scorecard.yml`, `osv-scanner.toml` |
| Ownership and maintenance | `.github/CODEOWNERS`, GitHub issues and pull request history |

**Never mark an item fulfilled solely because a file exists.** Check the actual criterion and evidence. In particular, browser data and JSON backups currently have **no app-level encryption**; App Lock is not complete.

## 2) OpenSSF Scorecard

- **Public report:** https://scorecard.dev/viewer/?uri=github.com/DickHorner/ViccoBoard
- **Official badge:** `https://api.scorecard.dev/projects/github.com/DickHorner/ViccoBoard/badge`
- **Workflow:** [Scorecard supply-chain security](../../.github/workflows/scorecard.yml)
- The workflow uses `ossf/scorecard-action` and `publish_results: true`, with SARIF uploaded to GitHub code scanning.
- A successful GitHub Actions run confirms the workflow ran. **It does not mean that each individual Scorecard check scored 10/10.** Check the public report for findings.

OpenSSF Best Practices and Scorecard are different programs, with different grading rules and badges. Both are linked from the top of the README.

## 3) Keeping the README in sync

The two README files use reference-style Markdown badges so their links are easy to audit. After any change, confirm that the project-specific URLs refer to this repository/project ID.

For an already registered Best Practices project, the existing helper remains available:

```bash
npm run badge:bestpractices -- 12057
```

This helper requires the `[![OpenSSF Scorecard][badge-scorecard]][scorecard]` anchor in both READMEs.

Run at least `npm run lint:docs` and `npm run lint:openssf` after editing badge documentation.
