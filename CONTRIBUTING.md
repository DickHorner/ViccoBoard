# Contributing to ViccoBoard

Thanks for helping build ViccoBoard.

ViccoBoard is a teacher-first, local-first project for classroom practice in the DACH region.
Contributions from educators and developers are equally important.

## Start here

- [README.md](./README.md)
- [README.en.md](./README.en.md)
- [INDEX.md](./INDEX.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)
- [Plan.md](./Plan.md)

## Ways to contribute

### For educators

- Report classroom pain points and workflow friction
- Propose modules for specific subjects and school forms
- Share anonymized sample rubrics, grading rules, and process checklists
- Test new flows and provide practical feedback
- Add screenshots/GIFs and explain the teaching scenario they support

### For developers

- Fix bugs and reliability issues
- Improve module boundaries (`apps -> modules -> packages`)
- Add tests and hardening
- Improve iPadOS/Safari compatibility
- Improve docs and onboarding

## Development quality gate

Before pushing a branch, run:

```bash
npm run lint:docs
npm run typecheck
npm run test
npm run build
```

## Module Proposal (subject + school form)

Open a `Module proposal` issue (template provided) and include:

1. **Subject + school form** (example: `Sport - Sek I`, `Deutsch - Oberstufe`)
2. **Teaching workflow** (what currently takes time, where mistakes happen)
3. **Must-have outcomes** (what should be faster, safer, clearer)
4. **Data model hints** (entities, fields, privacy needs)
5. **Assessment logic** (grading, rubrics, special rules)
6. **Export/report needs** (PDF, CSV, parent communication)
7. **iPad/Safari constraints** (touch, offline, file flow)

A strong proposal lets us build a reusable module without reworking the core.

## Branch and PR expectations

- Keep PRs focused and small when possible
- Include tests for behavior changes
- Link issues in the PR description
- Mention known limitations clearly
- Avoid unrelated refactors in the same PR

## Architecture rules (short)

- No direct domain DB access from UI outside bridge/composable boundaries
- Reuse shared contracts from `packages/core`
- Keep extensibility through modules/plugins, not hardcoded one-offs
- Preserve local-first defaults (online integrations must stay optional)

## Community

By participating, you agree to our [Code of Conduct](./CODE_OF_CONDUCT.md).
