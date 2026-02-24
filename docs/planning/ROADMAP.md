# ViccoBoard Release Roadmap

**Last Updated:** February 24, 2026  
**Guiding Philosophy:** Zen of Python first (explicit, simple, readable).

---

## Roadmap Status

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Foundation, core packages, storage, initial modules | [x] Complete |
| Phase 2 | Teacher UI foundation and module wiring | [x] Complete |
| Phase 3 | Sport grading engines and UI flows | [x] Complete |
| Phase 4 | Sport test workflows and tooling | [x] Complete |
| Phase 5 | KBR exam builder data model + UI | [x] Complete |
| Phase 6 | KBR correction and grading workflows | [x] Complete |
| Phase 7 | Post-release enhancements | [ ] Planned |
| Phase 8 | Post-release diagnostics/remediation extensions | [ ] Planned |
| Phase 9 | Post-release export/print expansion | [ ] Planned |
| Phase 10 | Post-release integrations/sharing | [ ] Planned |
| Phase 11 | Ongoing QA hardening | [ ] Continuous |
| Phase 12 | Documentation and release operations | [x] In progress |

---

## Release-Hardening Checklist

- [x] Remove internal codename remnants from tracked files/paths
- [x] Normalize release naming (`kbr`, `sport`) across code and docs
- [x] Enforce naming policy in pre-push hook
- [x] Consolidate and clean documentation structure
- [x] Add explicit Zen of Python anchors in governance docs
- [x] Keep root README in two-tab layout (product vs maintainer/AI)
- [x] Keep tracking documents aligned with actual implementation state
- [ ] Cut release tag and changelog entry

---

## Operational Rule

All changes must preserve module boundaries and pass the full pre-push quality gate before any shared branch push.




