# OpenSSF Best Practices Claim Sheet (Passing) - 2026-02-27

Use this as a copy/paste sheet while filling `https://www.bestpractices.dev/en/projects/new` and then the Passing criteria form.

## Badge level forecast (today)

- Current official badge: **none yet** (project not enrolled on bestpractices.dev).
- Expected right after enrollment: **In Progress** (yes).
- **Passing** today: **not yet guaranteed**; a few required claims still need setup or explicit manual confirmation.
- **Silver/Gold** today: **no** (both require lower levels first; Gold also requires multi-person/multi-org conditions not yet met).

## Evidence bundle (reusable links)

- `E1` README: https://github.com/DickHorner/ViccoBoard/blob/main/README.md
- `E2` English README: https://github.com/DickHorner/ViccoBoard/blob/main/README.en.md
- `E3` Contributing: https://github.com/DickHorner/ViccoBoard/blob/main/CONTRIBUTING.md
- `E4` Security policy: https://github.com/DickHorner/ViccoBoard/blob/main/SECURITY.md
- `E5` License file: https://github.com/DickHorner/ViccoBoard/blob/main/LICENSE
- `E6` Issue templates: https://github.com/DickHorner/ViccoBoard/tree/main/.github/ISSUE_TEMPLATE
- `E7` PR template: https://github.com/DickHorner/ViccoBoard/blob/main/.github/PULL_REQUEST_TEMPLATE.md
- `E8` CI workflow: https://github.com/DickHorner/ViccoBoard/blob/main/.github/workflows/ci.yml
- `E9` CodeQL workflow: https://github.com/DickHorner/ViccoBoard/blob/main/.github/workflows/codeql.yml
- `E10` Dependabot config: https://github.com/DickHorner/ViccoBoard/blob/main/.github/dependabot.yml
- `E11` Crypto service: https://github.com/DickHorner/ViccoBoard/blob/main/packages/storage/src/crypto/crypto.service.ts
- `E12` Package manifest: https://github.com/DickHorner/ViccoBoard/blob/main/package.json
- `E13` Repo issues: https://github.com/DickHorner/ViccoBoard/issues
- `E14` Repo PRs: https://github.com/DickHorner/ViccoBoard/pulls
- `E15` Actions runs: https://github.com/DickHorner/ViccoBoard/actions
- `E16` Tags: https://github.com/DickHorner/ViccoBoard/tags
- `E17` Releases: https://github.com/DickHorner/ViccoBoard/releases
- `E18` Documentation index: https://github.com/DickHorner/ViccoBoard/blob/main/INDEX.md
- `E19` Architecture decisions: https://github.com/DickHorner/ViccoBoard/blob/main/ARCHITECTURE_DECISIONS.md
- `E20` Scorecard workflow: https://github.com/DickHorner/ViccoBoard/blob/main/.github/workflows/scorecard.yml

## Passing criteria (MUST) - claim-by-claim

Status legend:
- `READY` = safe to claim now
- `MANUAL` = likely true, but you must personally confirm facts in the portal
- `ACTION` = do this before claiming `Met`
- `NA` = recommended N/A text provided

| Criterion | Status | Suggested claim text | Evidence |
|---|---|---|---|
| `description_good` | READY | "The project website (README) clearly states ViccoBoard's purpose and target users (teacher workflows)." | E1, E2 |
| `interact` | READY | "The project website explains how to obtain, provide feedback, and contribute (README + CONTRIBUTING + issue templates)." | E1, E3, E6 |
| `contribution` | READY | "Contribution documentation describes the PR-based contribution process and expectations." | E3, E7 |
| `floss_license` | READY | "Project outputs are FLOSS and licensed under MIT." | E5, E12 |
| `license_location` | READY | "License is stored in standard repository location at project root (`LICENSE`)." | E5 |
| `documentation_basics` | READY | "Basic end-user and developer documentation is provided via README, INDEX, and docs/ structure." | E1, E18 |
| `documentation_interface` | READY | "Reference interface documentation exists through typed contracts and module APIs." | E19, E11 |
| `sites_https` | READY | "Project website/repo/distribution endpoints use HTTPS (GitHub + bestpractices links)." | E1, E13, E17 |
| `discussion` | READY | "Public searchable issue and PR discussions are enabled and accessible by URL." | E13, E14 |
| `maintained` | MANUAL | "Repository is actively maintained with recent commits and merged PRs." | E14, E15 |
| `repo_public` | READY | "Source repository is public, version-controlled, and URL-addressable." | E13 |
| `repo_track` | READY | "Repository history tracks who changed what and when via git commits/PRs." | E14 |
| `repo_interim` | READY | "Repository includes interim changes between releases (ongoing branch/PR history)." | E14 |
| `version_unique` | ACTION | "Each user-facing release has a unique version identifier." | E12, E16 |
| `release_notes` | ACTION | "Each release includes human-readable release notes summarizing major changes and upgrade impact." | E17 |
| `release_notes_vulns` | NA | "N/A: No release notes for vulnerability-fix releases yet; no published runtime CVE fix notes in releases." | E17 |
| `report_process` | READY | "Project provides a public process for bug reports via GitHub Issues and templates." | E6, E13 |
| `report_responses` | MANUAL | "A majority of bug reports in the last 2-12 months were acknowledged by maintainers." | E13 |
| `report_archive` | READY | "Public archive of reports and responses is available in the issue tracker." | E13 |
| `vulnerability_report_process` | READY | "Project site publishes vulnerability reporting process in SECURITY.md." | E4 |
| `vulnerability_report_private` | READY | "Private vulnerability reporting path is documented (GitHub Security Advisory / owner contact)." | E4 |
| `vulnerability_report_response` | NA | "N/A: No private vulnerability reports received in the last 6 months requiring response-time measurement." | E4 |
| `build` | READY | "A working automated build system exists (`npm run build`) and is executed in CI." | E8, E12 |
| `test` | READY | "Automated FLOSS tests are provided and documented, and run in CI." | E8, E12 |
| `test_policy` | READY | "Contribution policy requires tests for behavior changes/new functionality." | E3, E7 |
| `tests_are_added` | MANUAL | "Recent major changes include associated automated tests as evidenced in merged PRs." | E14 |
| `warnings` | READY | "Project uses strict TypeScript compiler settings and CI gates to detect code issues." | E8, E12 |
| `warnings_fixed` | READY | "Warnings/errors are addressed before merge through required CI checks." | E8, E15 |
| `know_secure_design` | MANUAL | "At least one primary developer is familiar with secure software design practices and applies them in project policy and reviews." | E4, E9 |
| `know_common_errors` | MANUAL | "At least one primary developer understands common vulnerability classes relevant to this stack and mitigation techniques." | E4, E9 |
| `crypto_published` | READY | "Cryptography relies on publicly reviewed algorithms/protocols (AES-GCM, PBKDF2, SHA-256, bcrypt)." | E11 |
| `crypto_floss` | READY | "Cryptographic functionality is implemented with FLOSS tooling/libraries." | E11, E12 |
| `crypto_keylength` | READY | "Defaults use modern key sizes/parameters (AES-256, PBKDF2 iterations, bcrypt cost), with no intentionally weakened defaults." | E11 |
| `crypto_working` | READY | "Default crypto mechanisms avoid broken algorithms/modes (no MD5/DES/RC4 defaults)." | E11 |
| `crypto_password_storage` | READY | "Password storage uses iterated salted hash via bcrypt (`bcrypt.hash`/`compare`)." | E11 |
| `crypto_random` | READY | "Cryptographic keys/tokens/nonces are generated using `crypto.getRandomValues` (CSPRNG)." | E11 |
| `delivery_mitm` | READY | "Project delivery and source access use HTTPS/SSH-backed channels." | E13, E17 |
| `delivery_unsigned` | READY | "Project does not use insecure hash-over-HTTP trust flow for release verification." | E17 |
| `vulnerabilities_fixed_60_days` | MANUAL | "No medium+ vulnerability has remained publicly unpatched for over 60 days." | E13 |
| `no_leaked_credentials` | MANUAL | "No valid private credential is intentionally exposed in public repository content." | E13 |
| `static_analysis` | READY | "Static analysis (CodeQL) is applied on push/PR and scheduled runs." | E9 |
| `static_analysis_fixed` | MANUAL | "Medium+ exploitable static-analysis findings are tracked and fixed in a timely manner." | E9, E13 |
| `dynamic_analysis_fixed` | NA | "N/A: No confirmed medium+ exploitable vulnerabilities reported by dynamic analysis tooling in the evaluated period." | E8 |

## Minimum actions to unlock Passing fastest

1. Create first tagged release and release notes (`version_unique`, `release_notes`).
2. Fill manual evidence fields carefully (`maintained`, `report_responses`, `tests_are_added`, secure-dev knowledge criteria).
3. Confirm vulnerability SLA claim with current alert state before submitting `vulnerabilities_fixed_60_days`.
4. Enroll on bestpractices.dev first to move from "none" to "in progress".

## Silver/Gold quick reality check

- Silver requires Passing first. Current likely blockers: passing release/version evidence, plus Silver items like formal governance roles, coding-standards enforcement evidence, and assurance case depth.
- Gold requires Silver plus stronger contributor/2FA/review/coverage/reproducibility/security-review evidence. Current repo is not there yet.
