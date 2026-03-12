# Sport Epic And Work Package Backlog

This backlog translates the current Sport gap analysis into GitHub epics and PR-sized work packages.
It is designed for the current GitHub workflow:

- no reliance on selectable subagents in GitHub itself
- each issue includes role-oriented instructions instead of agent triggers
- each work package should end in one focused PR against `main`

## Principles

- Epics group a coherent user-facing capability.
- Work packages stay small enough for one reviewable PR.
- Organization concerns stay subject-agnostic.
- Sport-specific logic lives in `modules/sport` plus explicit UI bridges.
- WOW remains out of scope for this backlog until scope changes.

## Recommended Review Order

1. Sport Backbone And Lesson Context
2. Sport Tables And Grading Completion
3. Sport Test And Measurement Workflows
4. Sport Live Teaching Tools
5. Sport Feedback, Statistics, And Configuration

## Epic 1: Sport Backbone And Lesson Context

Outcome:
Sport workflows open in a real lesson/class/student context instead of isolated screens.

GitHub epic:
- [#123](https://github.com/DickHorner/ViccoBoard/issues/123) `[Sport Epic] Backbone und Unterrichtskontext schliessen`

Work packages:

1. [#124](https://github.com/DickHorner/ViccoBoard/issues/124) Lesson-bound attendance repair
   - `Plan.md`: §6.2 attendance per lesson, attendance management, export readiness
   - Goal: `AttendanceEntry` respects existing `lessonId`, can reopen existing attendance, and stops creating duplicate lessons when editing.
2. [#125](https://github.com/DickHorner/ViccoBoard/issues/125) Student profile from placeholder to real history screen
   - `Plan.md`: §6.2 performance development, attendance monitoring
   - Goal: `StudentProfile` shows attendance history, performance history, and sport-specific summaries instead of a placeholder.
3. [#126](https://github.com/DickHorner/ViccoBoard/issues/126) Lesson workspace continue-working shortcuts
   - `Plan.md`: §6.2 quick navigation, direct jumps, lesson-level shortcuts
   - Goal: `LessonWorkspace` becomes the anchor for launching sport tools with current lesson metadata.
4. [#127](https://github.com/DickHorner/ViccoBoard/issues/127) Class detail as sport workbench
   - `Plan.md`: §6.2 quick navigation, student development, attendance visibility
   - Goal: `ClassDetail` exposes grading, tables, tools, and real summary data instead of thin navigation cards.

## Epic 2: Sport Tables And Grading Completion

Outcome:
Sport grading becomes complete, editable, and table-driven instead of partially wired.

GitHub epic:
- [#128](https://github.com/DickHorner/ViccoBoard/issues/128) `[Sport Epic] Tabellen und Benotung vollstaendig machen`

Work packages:

1. [#129](https://github.com/DickHorner/ViccoBoard/issues/129) Table management screen
   - `Plan.md`: §6.4 all table import/export items
   - Goal: add a dedicated tables area with template import, validation, activation, and preview.
2. [#130](https://github.com/DickHorner/ViccoBoard/issues/130) Grading category lifecycle completion
   - `Plan.md`: §6.3 category management and weighting
   - Goal: categories can be edited, deleted, templated, and fully routed by type.
3. [#131](https://github.com/DickHorner/ViccoBoard/issues/131) Verbal assessments as first-class feature
   - `Plan.md`: §6.3 verbal assessments
   - Goal: verbal assessment categories stop dead-ending and gain a minimal usable workflow.
4. [#132](https://github.com/DickHorner/ViccoBoard/issues/132) Cross-context criteria catalogs
   - `Plan.md`: §6.3 criteria catalogs across contexts, §6.2 configurable attendance status catalog
   - Goal: shared configurable catalogs are visible and reusable across attendance, behavior, and grading contexts.

## Epic 3: Sport Test And Measurement Workflows

Outcome:
All major measurement workflows become end-to-end workflows with persistence, evaluation, and export hooks.

GitHub epic:
- [#133](https://github.com/DickHorner/ViccoBoard/issues/133) `[Sport Epic] Test- und Mess-Workflows Ende-zu-Ende schliessen`

Work packages:

1. [#134](https://github.com/DickHorner/ViccoBoard/issues/134) Shuttle-run configuration and session management
   - `Plan.md`: §6.5 Shuttle-Run
   - Goal: import configurations through settings, run sessions with audio cues, and retain results/history.
2. [#135](https://github.com/DickHorner/ViccoBoard/issues/135) Cooper workflow end-to-end
   - `Plan.md`: §6.5 Cooper-Test
   - Goal: class-bound Cooper sessions support rounds, sport type, table evaluation, and history.
3. [#136](https://github.com/DickHorner/ViccoBoard/issues/136) Middle-distance flow from multistop to grading
   - `Plan.md`: §6.5 Mittelstrecke
   - Goal: `Multistop` persists sessions and can hand results into the middle-distance grading flow.
4. [#137](https://github.com/DickHorner/ViccoBoard/issues/137) Sportabzeichen and BJS completion
   - `Plan.md`: §6.5 Sportabzeichen and Bundesjugendspiele
   - Goal: complete data capture, direct evaluation, and overview export hooks for both workflows.

## Epic 4: Sport Live Teaching Tools

Outcome:
Sport tools behave like real classroom tools with sessions, history, handoffs, and persistence.

GitHub epic:
- [#138](https://github.com/DickHorner/ViccoBoard/issues/138) `[Sport Epic] Live-Unterrichtstools auf Produktniveau bringen`

Work packages:

1. [#139](https://github.com/DickHorner/ViccoBoard/issues/139) Team builder persistence and fairness rules
   - `Plan.md`: §6.6 Teams
   - Goal: generated teams persist, can be reopened, and support stronger balancing rules.
2. [#140](https://github.com/DickHorner/ViccoBoard/issues/140) Scoreboard session model and team handoff
   - `Plan.md`: §6.6 Scoreboard
   - Goal: the scoreboard becomes a persistent match tool with team imports, event log, and timer linkage.
3. [#141](https://github.com/DickHorner/ViccoBoard/issues/141) Tournament planning MVP
   - `Plan.md`: §6.6 Turnierplanung
   - Goal: build and persist at least round-robin and knockout tournaments with score integration.
4. [#142](https://github.com/DickHorner/ViccoBoard/issues/142) Dice tool with logging
   - `Plan.md`: §6.6 Würfeln
   - Goal: add the missing dice tool with range selection, results log, and lesson context.
5. [#143](https://github.com/DickHorner/ViccoBoard/issues/143) Tactics board snapshots MVP
   - `Plan.md`: §6.6 Taktikboard
   - Goal: add a usable board with annotations, snapshots, and local persistence.

## Epic 5: Sport Feedback, Statistics, And Configuration

Outcome:
Sport gets the missing feedback, analytics, and configuration depth required for day-to-day use.

GitHub epic:
- [#144](https://github.com/DickHorner/ViccoBoard/issues/144) `[Sport Epic] Feedback, Statistik und Konfiguration schliessen`

Work packages:

1. [#145](https://github.com/DickHorner/ViccoBoard/issues/145) Feedback MVP with analysis
   - `Plan.md`: §6.7 Feedback
   - Goal: implement at least two feedback methods, result storage, and a basic analysis view.
2. [#146](https://github.com/DickHorner/ViccoBoard/issues/146) Statistics shell
   - `Plan.md`: §6.7 Statistiken
   - Goal: add a dedicated statistics area for attendance, usage, and performance overviews.
3. [#147](https://github.com/DickHorner/ViccoBoard/issues/147) Sport configuration center
   - `Plan.md`: §6.1 settings, §6.2 attendance status catalogs, §6.4 tables, §6.5 Shuttle-Run config
   - Goal: `SettingsOverview` becomes a real control center for sport-relevant configuration.
4. [#148](https://github.com/DickHorner/ViccoBoard/issues/148) Sport parity documentation refresh
   - `Plan.md`: traceability requirement across §6
   - Goal: align parity docs and status docs with actual implementation status and open gaps.

## Issue Authoring Rules

Every epic and every work package should include:

- explicit `Plan.md` references
- scope and non-scope
- acceptance criteria
- unit/integration/manual test expectations
- `Boundary-Cop-Auftrag`
- `Sport-Domain-Auftrag`
- `QA-Auftrag`

Every work package should stay small enough to merge without stacked PRs.
