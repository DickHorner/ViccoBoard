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

## 6) OpenSSF Best Practices Badge

- **Signals:** Open source process maturity (policy/process checklist).
- **Why not auto-added:** Requires manual project enrollment and checklist completion.
- **User inputs needed:** Best Practices project registration and maintainer updates.
- **Setup steps:**
  - Register project in OpenSSF Best Practices.
  - Complete checklist items.
  - Add badge once project has a public score.

## 7) CII Best Practices Badge (legacy ecosystem)

- **Signals:** Historic OSS process quality marker.
- **Why not auto-added:** Legacy program state and manual onboarding requirements.
- **User inputs needed:** Decision whether to use modern OpenSSF Best Practices instead.
- **Setup steps:**
  - Prefer OpenSSF Best Practices badge unless explicit CII requirement exists.

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
