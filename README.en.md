# ViccoBoard

**A modular, local-first teaching assistant for educators, optimized for iPadOS/Safari.**

[Deutsch](./README.md) | [English](./README.en.md)

[![CI][badge-ci]][ci]
[![CodeQL][badge-codeql]][codeql]
[![License][badge-license]][license]

## Scope

ViccoBoard unifies everyday teacher workflows in one local-first web app:

- class, lesson, student and attendance management,
- configurable attendance status catalogs,
- sport grading and classroom tools,
- KBR exam builder and correction foundations,
- IndexedDB-based local storage with migrations.

## Architecture

```text
apps/      Vue teacher UI
modules/   domain workflows: students, sport, exams
packages/  shared contracts, plugins and storage
```

The active architecture direction is `apps -> modules -> packages`. UI code uses module bridges and use-cases instead of direct storage access.

## Start here

- [HANDBOOK.md](./HANDBOOK.md) — engineering policy source
- [Plan.md](./Plan.md) — product and feature scope
- [DEVELOPMENT.md](./DEVELOPMENT.md) — setup, commands and repo shape
- [INDEX.md](./INDEX.md) — remaining maintained documentation

## Quickstart

```bash
npm install
npm run build
npm run dev:ui
```

Quality gate:

```bash
npm run lint:docs
npm run typecheck
npm run test
npm run build
```

## License

MIT - see [LICENSE](./LICENSE).

<!-- Badges -->
[badge-ci]: https://img.shields.io/github/actions/workflow/status/DickHorner/ViccoBoard/ci.yml?branch=main&label=CI
[badge-codeql]: https://img.shields.io/github/actions/workflow/status/DickHorner/ViccoBoard/codeql.yml?branch=main&label=CodeQL
[badge-license]: https://img.shields.io/github/license/DickHorner/ViccoBoard

<!-- Links -->
[ci]: https://github.com/DickHorner/ViccoBoard/actions/workflows/ci.yml
[codeql]: https://github.com/DickHorner/ViccoBoard/actions/workflows/codeql.yml
[license]: https://github.com/DickHorner/ViccoBoard/blob/main/LICENSE
