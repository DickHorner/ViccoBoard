# ViccoBoard

**Ein modularer, lokal-first Teaching Assistant für Lehrkräfte, optimiert für iPadOS/Safari.**

[Deutsch](./README.md) | [English](./README.en.md)

[![CI][badge-ci]][ci]
[![CodeQL][badge-codeql]][codeql]
[![License][badge-license]][license]

## Scope

ViccoBoard bündelt Unterrichtsarbeit in einer lokalen Web-App:

- Klassen, Stunden, Schüler und Anwesenheit,
- Sport-Bewertung und Live-Tools,
- KBR-Prüfungsaufbau und Korrektur,
- lokale IndexedDB-Speicherung.

## Struktur

```text
apps/      Vue Teacher UI
modules/   Fachlogik
packages/  geteilte Contracts, Plugins und Storage
```

## Einstieg

- [HANDBOOK.md](./HANDBOOK.md) — Engineering-Policy
- [Plan.md](./Plan.md) — Produkt- und Feature-Scope
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Setup und Kommandos
- [INDEX.md](./INDEX.md) — gepflegte Dokumentation

## Schnellstart

```bash
npm install
npm run build
npm run dev:ui
```

## Checks

```bash
npm run lint:docs
npm run typecheck
npm run test
npm run build
```

## Lizenz

MIT - siehe [LICENSE](./LICENSE).

<!-- Badges -->
[badge-ci]: https://img.shields.io/github/actions/workflow/status/DickHorner/ViccoBoard/ci.yml?branch=main&label=CI
[badge-codeql]: https://img.shields.io/github/actions/workflow/status/DickHorner/ViccoBoard/codeql.yml?branch=main&label=CodeQL
[badge-license]: https://img.shields.io/github/license/DickHorner/ViccoBoard

<!-- Links -->
[ci]: https://github.com/DickHorner/ViccoBoard/actions/workflows/ci.yml
[codeql]: https://github.com/DickHorner/ViccoBoard/actions/workflows/codeql.yml
[license]: https://github.com/DickHorner/ViccoBoard/blob/main/LICENSE
