# Contributing to ViccoBoard

Thank you for contributing to ViccoBoard.

This repository follows a local-first, web-only architecture and a strict quality gate. Before opening a PR, review the docs below and align your changes with existing project patterns.

## Start Here

- [README.md](./README.md) - Project overview and command quick-start
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow and hard constraints
- [INDEX.md](./INDEX.md) - Documentation index
- [Plan.md](./Plan.md) - Product/spec baseline
- [agents.md](./agents.md) - Agent and workflow guardrails

## Review and Quality Guidance

- [AI code review instructions](./docs/reviews/AI_CODE_REVIEW_INSTRUCTIONS.md)
- [PR review guidelines](./.github/AI_PR_REVIEW_GUIDELINES.md)
- [PR template](./.github/PULL_REQUEST_TEMPLATE.md)

## Definition of Done

Run and pass all required gates before push/PR:

```bash
npm run lint:docs
npm run build:packages
npm run test
npm run build
```

## Contribution Rules

1. Follow Zen of Python principles: explicit, simple, readable.
2. Keep diffs minimal and scoped. Avoid unrelated drive-by refactors.
3. Respect architecture boundaries (`apps -> modules -> packages`).
4. Do not introduce new heavy dependencies without strong justification.
5. Add or update tests for behavioral changes.
