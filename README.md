# ViccoBoard

ViccoBoard is a local-first teacher suite that combines SportZens and KURT workflows in one TypeScript monorepo.

## Core Principles

- Keep all required features from SportZens and KURT.
- Keep domain logic inside modules, not in the UI layer.
- Keep runtime web-only and Safari-compatible (iPadOS target).
- Keep data local-first with explicit export/import flows.

## Repository Structure

```text
ViccoBoard/
├── apps/
│   ├── demo/           # CLI demo
│   └── teacher-ui/     # Vue 3 teacher application
├── modules/
│   ├── students/       # Central student management
│   ├── sport/          # Sport domain
│   └── exams/          # Exams/KURT domain
├── packages/
│   ├── core/           # Shared interfaces/types/validators
│   ├── storage/        # IndexedDB + SQLite adapters and migrations
│   └── plugins/        # Plugin contracts/registry
├── docs/               # Project documentation
├── Plan.md             # Master feature specification
└── agents.md           # Agent guardrails
```

## Quick Start

```bash
npm install
npm run build
npm run dev:ui
```

## Useful Commands

```bash
npm run test
npm run build:packages
npm run build:ipad
npm run lint:docs
npm run demo
```

## Documentation

- [Documentation Index](./INDEX.md)
- [Master Plan](./Plan.md)
- [Architecture Decisions](./ARCHITECTURE_DECISIONS.md)
- [Developer Guide](./DEVELOPMENT.md)
- [Docs Hub](./docs/README.md)

## Status Notes

Session and verification artifacts were consolidated under `docs/sessions/`, `docs/verification/`, and `docs/reviews/`.

## License

UNLICENSED (private repository)
