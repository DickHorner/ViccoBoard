# ViccoBoard Development Guide

Engineering policy source of truth: [`HANDBOOK.md`](./HANDBOOK.md).

This file keeps repo-specific commands and shape. It must not redefine the Handbook.

## Hard constraints

- Web-only deployment: static assets, iPadOS Safari target.
- Local-first default: no runtime server requirement.
- Architecture direction: `apps -> modules -> packages`.
- Domain logic lives in `modules/*`.
- Shared contracts live in `packages/core`.
- Storage adapters live in `packages/storage`.
- Student management is centralized in `modules/students`; no parallel app-level student stores or repositories.
- UI must use module bridges/use-cases instead of direct storage paths.
- Export uses download; import uses file input.
- Online integrations must be optional and off by default.

## Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git

## Setup

```bash
npm install
npm run build
npm run dev:ui
```

## Quality gate

Run the strongest feasible gate for the slice. Shared branches should pass:

```bash
npm run lint:docs
npm run typecheck
npm run test
npm run build
```

For package-only work:

```bash
npm run build:packages
```

For iPad-target UI work:

```bash
npm run build:ipad
```

## Project structure

```text
ViccoBoard/
├── apps/
│   └── teacher-ui/      # Vue 3 teacher app
├── modules/             # Domain modules
│   ├── students/
│   ├── sport/
│   ├── exams/
│   ├── export/
│   └── integrations/
├── packages/            # Shared packages
│   ├── core/
│   ├── plugins/
│   └── storage/
├── docs/                # Maintained product, planning, QA and runbook docs
├── .github/             # GitHub-specific templates and instructions
├── HANDBOOK.md          # Engineering policy source of truth
├── Plan.md              # Product and feature scope source
├── agents.md            # Agent entrypoint adapter
└── INDEX.md             # Documentation index
```

## Implementation rules

Follow `HANDBOOK.md` for every patch:

1. Inspect two to three similar repo locations.
2. Define the smallest slice and explicit non-goals.
3. Clarify data shape, invariants, failure paths, trust boundaries and machine costs.
4. Implement only the requested slice.
5. Delete weirdness before reporting.
6. Run feasible checks.
7. Report DONE / NOT DONE / CHECKS / READY FOR NEXT STEP.

## TypeScript and Vue conventions

- Use strict TypeScript.
- Prefer explicit return types for exported functions.
- Prefer interfaces for public object shapes.
- Keep imports repo-native and avoid unused imports.
- Keep business logic out of Vue views; route it through module bridges and use-cases.
- Keep tests close to the affected package or workspace pattern.
- Use `.js` extensions for ESM-relative imports when required by the existing package pattern.

## Documentation rules

- Product scope belongs in `Plan.md`.
- Engineering policy belongs in `HANDBOOK.md`.
- Active work tracking belongs in `docs/planning/ISSUES_TRACKER.md`.
- Current status belongs in `docs/status/STATUS.md`.
- Do not create another rulebook. Add adapters or links instead.

## Storage notes

ViccoBoard targets IndexedDB for browser/runtime storage with migrations. Node-side SQLite support is retained for tests and maintenance tooling. iPadOS Safari may evict local storage after inactivity, so backup/export/import flows must stay explicit and user-visible.
