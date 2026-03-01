# OpenSSF Best Practices Pre-check (2026-02-27)

## Scope

This is a repo-evidence pre-check against the OpenSSF Best Practices **Passing** criteria (current list on bestpractices.dev).

- Repository: `https://github.com/DickHorner/ViccoBoard`
- Snapshot date: `2026-02-27`
- Source criteria page: `https://www.bestpractices.dev/en/criteria/0`

## Executive summary

- Badge status: **not yet enrolled** on bestpractices.dev (this is the primary blocker for any CII/Best-Practices score lift).
- Governance and security baseline are strong (security policy, CI, CodeQL, Dependabot, license, contribution docs).
- The biggest practical gap is still **human code review evidence** on recent changesets.
- Release/signing related criteria are mostly **not yet established** because there are no releases/tags yet.

## Current external signals

- OpenSSF Scorecard snapshot (`2026-02-26`): overall `7.4`
- `CII-Best-Practices`: `0` (not enrolled)
- `Code-Review`: `0` (`0/6 approved changesets`)
- `Maintained`: `0` (time-gated because repo age; earliest gate-clear date `2026-04-12`)

## Criteria pre-check matrix (selected high-signal Passing criteria)

| Criterion | Status | Evidence | Notes |
|---|---|---|---|
| 17 (version-controlled) | Likely met | GitHub repo + commit history | Public Git history is active. |
| 18 (uses public repo) | Met | GitHub public repository | Repository is public. |
| 21 (license) | Met | `LICENSE`, `package.json` license | MIT present. |
| 23 (roadmap) | Met | `README.md`, `docs/planning/ROADMAP.md` | Roadmap is documented. |
| 24 (architecture) | Met | `ARCHITECTURE_DECISIONS.md` | Architecture docs exist. |
| 28 (contribution process) | Met | `CONTRIBUTING.md` | Contribution guidance is present. |
| 29 (bug-report process) | Met | `.github/ISSUE_TEMPLATE/bug_report.yml` | Structured bug reporting enabled. |
| 30 (English docs) | Met | `README.en.md` | English overview available. |
| 31 (install/build instructions) | Met | `README.md` / `README.en.md` quickstart | Build/run steps are documented. |
| 42 (code style checking) | Partial | CI includes docs/workflow lint + typecheck | No explicit code formatter/linter policy for all TS/Vue code. |
| 43 (build from source process) | Met | CI + documented commands | Build is reproducible in CI pipeline. |
| 46 (evidence checklist) | Met | `docs/qa/SECURITY_AND_QA_CHECKLIST.md` | Security/QA checklist exists. |
| 56 (changes reviewed by another qualified person) | Likely unmet | Scorecard `Code-Review = 0` | Needs non-author human approvals consistently. |
| 57 (no unreviewed check-ins to release branch) | Likely unmet | Ruleset allows admin bypass + direct push history | Needs stricter no-bypass practice + review history. |
| 58 (code tested before release) | Met | `.github/workflows/ci.yml` required checks | CI test/build checks are enforced. |
| 60 (dependencies pinned to avoid tampering) | Partial | Scorecard `Pinned-Dependencies = 9` | One GitHub Action not pinned by hash (`setup-labels.yml`). |
| 61 (vuln reporting process documented) | Met | `SECURITY.md` | Reporting channel is documented. |
| 62 (private vuln reports accepted) | Met | `SECURITY.md` | Private reporting explicitly requested. |
| 63 (acknowledge reports in <=14 days) | Met | `SECURITY.md` | 14-day triage target documented. |
| 66 (public critical vulns fixed in <=60 days) | Likely met | `SECURITY.md` | 60-day target documented. |
| 78 (signed releases) | Likely unmet | No GitHub releases/tags yet | Needs release + signing process if this criterion is claimed. |
| 79 (fix medium+ vulns in <=60 days) | Likely met | `npm audit --json` currently 0 vulns | Keep this continuously monitored. |
| 83 (dynamic code analysis/testing) | Met | CI tests + CodeQL + fuzz/property tests | Strong evidence of automated checks. |
| 85 (SAST used) | Met | `.github/workflows/codeql.yml` | CodeQL on push/PR/schedule. |
| 87 (no generated binaries in source repo) | Met | Scorecard `Binary-Artifacts = 10` | No binary artifacts reported. |
| 89 (maintained build dependencies) | Met | `.github/dependabot.yml` | Weekly dependency update automation. |
| 109 (tracks dependencies) | Met | Dependabot + lockfile | Dependency tracking in place. |
| 112 (process to update dependencies) | Met | Dependabot PR workflow | Ongoing update process exists. |
| 113 (support status documented) | Met | `SECURITY.md` supported versions section | Support policy on `main` documented. |
| 19, 22 (release version IDs + release notes) | At risk | No tags/releases currently | Add first release/tag + release notes process. |
| 84 (2FA for privileged accounts) | Manual verification needed | GitHub account/org setting (not in repo) | Must be confirmed in account settings. |

## Manual-review bucket (not fully verifiable from repo alone)

The following criteria likely need claim-by-claim justification on bestpractices.dev and cannot be fully auto-verified from this repo snapshot alone:

`38, 39, 40, 45, 49, 50, 51, 52, 55, 64, 67, 68, 69, 72, 73, 74, 75, 76, 77, 80, 81, 86, 94, 96, 98, 99, 100, 101, 102, 103, 104, 106, 107, 108, 110, 114, 118`

## Priority actions to improve badge-readiness fastest

1. Enroll project on bestpractices.dev and reach **In Progress** first.
2. Add at least one additional human reviewer and enforce reviewed PR merges for human-authored changes.
3. Pin the remaining unpinned GitHub Action by commit hash in `.github/workflows/setup-labels.yml`.
4. Create first tagged release and release-notes process (`v0.1.0`+).
5. Decide release-signing approach (or mark release-signing criteria as not applicable with justification if truly inapplicable).
6. Confirm 2FA policy for all privileged GitHub accounts.
7. Keep weekly re-check loop with `npm run scorecard:zeros`.
