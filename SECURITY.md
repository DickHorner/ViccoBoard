# Security Policy

## Supported Versions

Security fixes are applied to the latest `main` branch.

## Reporting a Vulnerability

Please do **not** open public issues for vulnerabilities.

Use private reporting:

1. GitHub Security Advisory (preferred)
2. Or contact the repository owner: https://github.com/DickHorner

Please include:

- Affected component/path
- Reproduction steps
- Expected vs actual behavior
- Impact assessment (confidentiality/integrity/availability)
- Suggested mitigation (optional)

## Response Targets

- Initial acknowledgement: within 5 business days
- Confidential triage response: within 14 days
- Coordinated remediation and disclosure plan after patch readiness
- Publicly known critical vulnerabilities should be fixed within 60 days when feasible

## Scope priorities

Because ViccoBoard handles sensitive school data, priority is highest for:

- Authentication/lock bypass
- Data exfiltration or unintended data exposure
- Backup/restore integrity issues
- Storage encryption/key-handling weaknesses
- Dependency supply-chain vulnerabilities in runtime paths

## Project security baseline

- Local-first default operation
- Optional integrations must remain opt-in
- Architecture boundaries (`apps -> modules -> packages`)
- Required CI quality gate before merge

Related docs:

- [docs/qa/SECURITY_AND_QA_CHECKLIST.md](./docs/qa/SECURITY_AND_QA_CHECKLIST.md)
- [docs/ossf-badge/PLAYBOOK.md](./docs/ossf-badge/PLAYBOOK.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)
