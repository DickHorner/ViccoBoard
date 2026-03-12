# ViccoBoard Development Status

**Last Updated:** March 12, 2026  
**Project Stage:** Sport Epic – Feedback, Statistiken, Konfiguration  
**Global Guideline:** The Zen of Python is the primary coding and review philosophy (explicit, simple, readable, one clear way).

---

## Current State

- [x] Architecture boundary enforcement (`apps -> modules -> packages`)
- [x] Naming migration to release terms (`sport`, `kbr`)
- [x] Documentation consolidation under `docs/`
- [x] Root README tab layout
- [x] Pre-push quality gate with structural + build/test checks
- [x] Zen of Python explicitly anchored in core governance docs

---

## Phase Progress

- [x] Phase 1 - Foundation
- [x] Phase 2 - Teacher UI Foundation
- [x] Phase 3 - Sport Grading Engine
- [x] Phase 4 - Sport Tests & Measurements
- [x] Phase 5 - KBR Exam Builder
- [x] Phase 6 - KBR Correction & Grading
- [ ] Phase 7 - Sport Epic: Feedback, Statistiken, Konfiguration (in progress — see #144)
- [ ] Phase 8+ incremental release extensions (post-release scope)

---

## Sport Epic #144 – Status (Issue Map)

| Issue | Title | Status |
|-------|-------|--------|
| #147 | Feedback-MVP mit Auswertung liefern | ✅ implemented |
| #146 | Statistikbereich als eigener Einstieg aufbauen | ✅ implemented |
| #148 | Sport-Konfigurationszentrum in den Einstellungen freischalten | ✅ implemented |
| #145 | Parity- und Status-Dokumentation an den Ist-Stand anpassen | ✅ this update |

### Real State of Sport Features (as of March 2026)

**Implemented and reachable in UI:**
- Class management, student management, lesson tracking
- Attendance entry with configurable status catalog
- Grading: criteria, time-based, Cooper, Shuttle-Run, Mittelstrecke, Sportabzeichen, BJS
- Live tools: Timer, Scoreboard, TeamBuilder, Tournaments, TacticsBoard
- Feedback MVP: Smiley-Abfrage and Bewertungsskala with result storage and analysis view
- Statistics: Dedicated `/subjects/sport/statistics` route with attendance, performance, and tool usage overviews
- Sport configuration center: `/settings/sport` entry point linked from Settings

**Known gaps (not yet implemented, tracked in Plan.md §9):**
- WOW (excluded by scope v2)
- Verbal assessments (Plan.md §6.3)
- Fehlzeiten status metadata in export (Plan.md §6.2)
- Würfeln tool (Plan.md §6.6)
- Full security/encryption/app-lock (Plan.md §6.1)
- Backup/restore UI (Plan.md §6.1)

---

## Quality Gates

The repository is configured to block pushes unless these pass:

- [x] `npm run lint:docs`
- [x] `npm run build:packages`
- [x] `npm run test`
- [x] `npm run build`

The push hook also blocks:

- [x] legacy naming reintroduction blocked by hook policy
- [x] generated sidecar artifacts (`.js/.d.ts` next to `.ts`, `.bak`)
- [x] non-allowlisted root docs
- [x] missing Zen/README governance anchors

---

## Next Milestone

- [ ] Sport Epic #144 PR review and merge
- [ ] Final release QA sign-off + tag creation

