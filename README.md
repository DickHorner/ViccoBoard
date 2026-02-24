# ViccoBoard

A local-first teacher suite that unifies **Sport** and **KBR** workflows in one TypeScript monorepo.

## Core Engineering Principles

- The **Zen of Python** is the global coding philosophy for this repository (clarity, simplicity, explicitness, readability).
- Preserve feature completeness while keeping boundaries clean (`apps -> modules -> packages`).
- Keep runtime web-only and Safari-compatible (iPadOS target).
- Keep data local-first with explicit export/import workflows.

<details open>
<summary><strong>Tab 1 · Product Overview</strong></summary>

### Repository Structure

```text
ViccoBoard/
├── apps/
│   ├── demo/           # CLI demo
│   └── teacher-ui/     # Vue 3 teacher application
├── modules/
│   ├── students/       # Central student management
│   ├── sport/          # Sport domain
│   └── exams/          # KBR domain
├── packages/
│   ├── core/           # Shared interfaces/types/validators
│   ├── storage/        # IndexedDB + SQLite adapters and migrations
│   └── plugins/        # Plugin contracts/registry
├── docs/               # Project documentation
├── Plan.md             # Master feature specification
└── agents.md           # Agent guardrails
```

### Quick Start

```bash
npm install
npm run build
npm run dev:ui
```

### Useful Commands

```bash
npm run lint:docs
npm run build:packages
npm run test
npm run build
npm run demo
```

### Documentation

- [Documentation Index](./INDEX.md)
- [Master Plan](./Plan.md)
- [Architecture Decisions](./ARCHITECTURE_DECISIONS.md)
- [Developer Guide](./DEVELOPMENT.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Docs Hub](./docs/README.md)

</details>

<details>
<summary><strong>Tab 2 · AI / Reviewer / Maintainer Info</strong></summary>

### AI + Review Guardrails

- Primary review instructions: [docs/reviews/AI_CODE_REVIEW_INSTRUCTIONS.md](./docs/reviews/AI_CODE_REVIEW_INSTRUCTIONS.md)
- PR review guidelines: [.github/AI_PR_REVIEW_GUIDELINES.md](./.github/AI_PR_REVIEW_GUIDELINES.md)
- Copilot review instructions: [.github/.copilot-review-instructions.md](./.github/.copilot-review-instructions.md)
- Agent operating constraints: [agents.md](./agents.md)

### Release Quality Gates

- Documentation guardrails: `npm run lint:docs`
- Package compile gate: `npm run build:packages`
- Workspace tests gate: `npm run test`
- Production build gate: `npm run build`
- Git push guard hook: `.githooks/pre-push` (installed via `npm run hooks:install`)

### Maintainer Notes

- Session and verification artifacts are under `docs/sessions/`, `docs/verification/`, and `docs/reviews/`.
- Keep references and examples aligned with real lowercase paths (`modules/sport`, `@viccoboard/sport`).
- Keep naming stable for release (`sport`, `kbr`).

</details>

## License

UNLICENSED (private repository)


