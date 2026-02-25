<a id="top"></a>

<div align="center">

# ViccoBoard

**A modular, local-first teaching assistant for educators - optimized for iPadOS/Safari and built to grow by subject modules.**

[Deutsch](./README.md) | [English](./README.en.md)

[![CI][badge-ci]][ci]
[![CodeQL][badge-codeql]][codeql]
[![Scorecards Workflow][badge-scorecards-workflow]][scorecards-workflow]
[![OpenSSF Scorecard][badge-scorecard]][scorecard]
[![License][badge-license]][license]

[Quickstart](#quickstart) · [Docs](./INDEX.md) · [Roadmap](#roadmap-high-level) · [Contributing](./CONTRIBUTING.md)

</div>

## Why ViccoBoard?

ViccoBoard unifies everyday teacher workflows (class organization, assessment, exam work) in one local-first app.
It is designed for practical school use: fast input, offline-first behavior, and strong modular boundaries.

## Modular approach (core differentiator)

ViccoBoard separates:

- `apps/*` for UI
- `modules/*` for domain workflows (currently `students`, `sport`, `exams`)
- `packages/*` for shared contracts/infrastructure (`core`, `storage`, `plugins`)

This allows feature depth to grow by module (subject + school form) without rewriting the core.

## Current product scope (today)

- Class, lesson, student, and attendance management
- Configurable attendance status catalogs
- Sport grading categories and entry flows (criteria/time/cooper/shuttle/mittelstrecke/Sportabzeichen/BJS)
- Timer, team builder, and scoreboard classroom tools
- KBR exam builder foundations (simple/complex exam structures)
- Local-first IndexedDB storage path with migrations

See the German README for a detailed "Today" matrix and status granularity.

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

## Contributing

- Start here: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Security Policy: [SECURITY.md](./SECURITY.md)
- Module proposals: use the `Module proposal` issue template

## Roadmap (high level)

- **Now**: sport + exam foundations, local-first storage, core classroom workflows
- **Next**: complete end-to-end correction hardening, replace remaining placeholder views, UX polish
- **Later (Vision)**: more subject/school-form modules, deeper export/reporting, optional integrations via plugins

Roadmap docs: [Plan.md](./Plan.md), [docs/planning/ROADMAP.md](./docs/planning/ROADMAP.md)

## License

MIT - see [LICENSE](./LICENSE).

<!-- Badges -->
[badge-ci]: https://img.shields.io/github/actions/workflow/status/DickHorner/ViccoBoard/ci.yml?branch=main&label=CI
[badge-codeql]: https://img.shields.io/github/actions/workflow/status/DickHorner/ViccoBoard/codeql.yml?branch=main&label=CodeQL
[badge-scorecards-workflow]: https://img.shields.io/github/actions/workflow/status/DickHorner/ViccoBoard/scorecards.yml?branch=main&label=Scorecards
[badge-scorecard]: https://api.securityscorecards.dev/projects/github.com/DickHorner/ViccoBoard/badge
[badge-license]: https://img.shields.io/github/license/DickHorner/ViccoBoard

<!-- Links -->
[ci]: https://github.com/DickHorner/ViccoBoard/actions/workflows/ci.yml
[codeql]: https://github.com/DickHorner/ViccoBoard/actions/workflows/codeql.yml
[scorecards-workflow]: https://github.com/DickHorner/ViccoBoard/actions/workflows/scorecards.yml
[scorecard]: https://securityscorecards.dev/viewer/?uri=github.com/DickHorner/ViccoBoard
[license]: https://github.com/DickHorner/ViccoBoard/blob/main/LICENSE
