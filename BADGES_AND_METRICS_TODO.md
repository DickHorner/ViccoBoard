# BADGES_AND_METRICS_TODO

This file tracks useful badges/metrics that were **not** auto-added because they need external setup, credentials, or first-time platform onboarding.

## Not added automatically (needs user input)

## 1) Codecov Coverage

- **Signals:** Test coverage trend and patch coverage quality.
- **Why not auto-added:** Needs Codecov app/org setup and repository authorization.
- **User inputs needed:** Install Codecov GitHub App for this repo.
- **Setup steps:**
  - Install Codecov GitHub App for `DickHorner/ViccoBoard`.
  - Decide if private uploads require a token.
  - Add coverage upload step to CI (`npm run test -- --coverage`).
  - Add Codecov badge after first successful upload.

## 2) SonarCloud Quality Gate

- **Signals:** Maintainability, reliability, security hotspots, duplication.
- **Why not auto-added:** Requires SonarCloud project creation + organization binding + token/project key.
- **User inputs needed:** Sonar organization, project key, Sonar token secret.
- **Setup steps:**
  - Create SonarCloud project linked to this repo.
  - Add `SONAR_TOKEN` secret in GitHub.
  - Add SonarCloud workflow step using project key.
  - Add Quality Gate badge after first analysis.

## 3) Codacy Grade

- **Signals:** Static analysis quality grade and issue trend.
- **Why not auto-added:** Requires Codacy account/project onboarding.
- **User inputs needed:** Codacy project token or linked app authorization.
- **Setup steps:**
  - Import repository into Codacy.
  - Configure analysis rules and language settings.
  - Add Codacy badge endpoint to README after first run.

## 4) Code Climate Maintainability

- **Signals:** Maintainability score and technical debt trend.
- **Why not auto-added:** Requires Code Climate project setup.
- **User inputs needed:** Code Climate repo binding and test reporter token (if coverage upload is used).
- **Setup steps:**
  - Add repository to Code Climate.
  - Optional: upload test coverage from CI.
  - Add maintainability badge once analysis is active.

## 5) Snyk Vulnerability Badge

- **Signals:** Known dependency vulnerabilities and fix availability.
- **Why not auto-added:** Requires Snyk account and GitHub integration.
- **User inputs needed:** Snyk org/project binding, optional token secret.
- **Setup steps:**
  - Import repo into Snyk.
  - Enable dependency scanning.
  - Add Snyk workflow/badge after first scan.

## Already available — restored in README

The README badges are rendered from live data where supported:

- **CI** — `ci.yml`, push/PR status
- **CodeQL** — `codeql.yml`, push/PR status
- **OpenSSF Scorecard** — `scorecard.yml` with `publish_results: true`, public supply-chain score
- **OpenSSF Best Practices** — existing project [12057](https://www.bestpractices.dev/projects/12057), currently listed as *in progress*; **96%** was publicly indexed when checked, **not Passing**
- **MIT License** — root `LICENSE`
- **Contributors, last commit, open issues and PRs** — public GitHub metadata
- **Vue 3, TypeScript, iPad Safari target, local-first** — informational static badges, not independent security certification

**Important:** OpenSSF Scorecard (numeric automated checks) and Best Practices (maintainer-answered process criteria) are different systems. Both were restored as badges. The Best Practices progress still needs maintainer action to reach an officially awarded level. See [the playbook](./docs/ossf-badge/PLAYBOOK.md).

## 6) OpenSSF Best Practices (maintainer follow-up)

- Project **12057 already exists**, so do **not** register a duplicate.
- Open https://www.bestpractices.dev/projects/12057.
- Review remaining criteria with actual evidence. Current 96% indexed progress is below the Passing threshold.
- Badge is already in `README.md` and `README.en.md`.
- Confirm the official badge status at the project's site before announcing certification.

## 7) CII Best Practices (same program)

The OpenSSF Best Practices Badge is the successor branding for CII Best Practices. This is **not** a third badge to pursue.

## 8) npm Downloads Badge

- **Signals:** Package adoption over time.
- **Why not auto-added:** No ViccoBoard package is currently published to npm registry.
- **User inputs needed:** Published npm package names/scopes.
- **Setup steps:**
  - Publish selected package(s) to npm.
  - Add download badge(s) for published package names.

## 9) Docker Pulls Badge

- **Signals:** Runtime image adoption and deployment readiness.
- **Why not auto-added:** No official Docker image/repository is currently published.
- **User inputs needed:** Docker Hub or GHCR image name and publish workflow decision.
- **Setup steps:**
  - Decide image strategy (`teacher-ui` static image or full bundle image).
  - Publish image via GitHub Actions.
  - Add pulls/downloads badge for chosen registry.

## 10) Latest Release Badge

- **Signals:** Current tagged release availability.
- **Why not auto-added:** No release tags detected yet.
- **User inputs needed:** First semantic version release tag (e.g., `v0.1.0`).
- **Setup steps:**
  - Run `release.yml` with a real version.
  - Verify GitHub release is published.
  - Add `latest release` badge to README.

