# Navigation PR Split Plan

## Goal

Split the current navigation and workspace refactor into small PRs that follow the repo guardrails:

- focused scope
- clear Plan.md traceability
- tests included where logic changed
- no silent feature loss

This plan assumes the current working tree changes are split into **4 PRs**.

## PR 1

**Title**

`[teacher-ui] Refactor primary navigation shell (Plan.md §6.2 Schnelle Navigation in Unterfunktionen)`

**Scope**

- replace flat primary navigation with grouped IA
- keep existing feature routes reachable
- add route skeleton for new high-level destinations
- keep scope limited to shell + top-level route structure

**Files**

- `apps/teacher-ui/src/layouts/AppLayout.vue`
- `apps/teacher-ui/src/navigation.ts`
- `apps/teacher-ui/src/router/index.ts`
- `apps/teacher-ui/tests/navigation.test.ts`
- `docs/ui/information-architecture-gap-analysis.md`
- `docs/ui/navigation_pr_split_plan.md`

**Plan.md references**

- `§6.2 Schnelle Navigation in Unterfunktionen`
- supportive context: `§5 UI-Informationsarchitektur`

**Why separate**

- this is the architectural frame for all following UI work
- reviewers can focus on IA and route grouping without mixing in feature-specific changes

**Tests**

- `npm test --workspace=teacher-ui`
- `npm run typecheck --workspace=teacher-ui`

## PR 2

**Title**

`[teacher-ui] Add landing dashboard and organization entry points (Plan.md §6.1 Einstellungen, §6.2 Stundenübersicht, §6.2 Stunden-Direktsprünge)`

**Scope**

- turn dashboard into a real landing page
- add `Stundenplan`, `Klassen`, and `Einstellungen` entry screens
- add dashboard logic for `Jetzt / Als Naechstes`

**Files**

- `apps/teacher-ui/src/views/Dashboard.vue`
- `apps/teacher-ui/src/views/ScheduleOverview.vue`
- `apps/teacher-ui/src/views/ClassesOverview.vue`
- `apps/teacher-ui/src/views/SettingsOverview.vue`
- `apps/teacher-ui/src/utils/dashboard-workspace.ts`
- `apps/teacher-ui/tests/dashboard-workspace.test.ts`

**Plan.md references**

- `§6.1 Einstellungen`
- `§6.2 Stunden: Stundenübersicht`
- `§6.2 Stunden: Direktsprünge zu Tools/Funktionen`

**Why separate**

- this is the organization layer
- it is user-facing, but still independent from subject-specific depth

**Tests**

- `npm test --workspace=teacher-ui`
- `npm run typecheck --workspace=teacher-ui`
- `npm run build --workspace=teacher-ui`

## PR 3

**Title**

`[teacher-ui] Add Sport and KBR subject hubs with surfaced module scope (Plan.md §6.3, §6.6, §6.9, §6.11)`

**Scope**

- add `Sport` and `KBR` hub screens
- surface more module depth through counts and direct feature links
- expose sport tool-session repository through bridge
- add KBR analysis entry from overview

**Files**

- `apps/teacher-ui/src/composables/useSportBridge.ts`
- `apps/teacher-ui/src/views/SportHub.vue`
- `apps/teacher-ui/src/views/KBRHub.vue`
- `apps/teacher-ui/src/views/ExamsOverview.vue`

**Plan.md references**

- `§6.3 Sport — Benotung & Bewertungssystem`
- `§6.6 Sport — Live-Unterrichtstools`
- `§6.9 KBR — Prüfungen anlegen`
- `§6.11 KBR — Korrektur`

**Why separate**

- this is where the app starts exposing more of the already existing module capability
- it should be reviewed together with domain owners, not bundled into shell work

**Tests**

- `npm test --workspace=teacher-ui`
- `npm run typecheck --workspace=teacher-ui`
- `npm run build --workspace=teacher-ui`

## PR 4

**Title**

`[teacher-ui] Add lesson workspace and KBR analysis route (Plan.md §6.2 Stunden-Direktsprünge, §6.11 Korrektur)`

**Scope**

- add lesson-centric workspace route
- route dashboard, schedule, and lesson list into the lesson workspace
- add analysis wrapper page for KBR
- fix analysis screen follow-up link

**Files**

- `apps/teacher-ui/src/views/LessonWorkspace.vue`
- `apps/teacher-ui/src/views/KBRExamAnalysisPage.vue`
- `apps/teacher-ui/src/views/ExamAnalysis.vue`
- `apps/teacher-ui/src/views/LessonList.vue`
- `apps/teacher-ui/src/views/Dashboard.vue`
- `apps/teacher-ui/src/views/ScheduleOverview.vue`
- `apps/teacher-ui/src/utils/lesson-workspace.ts`
- `apps/teacher-ui/tests/lesson-workspace.test.ts`

**Plan.md references**

- `§6.2 Stunden: Direktsprünge zu Tools/Funktionen`
- `§6.11 KBR — Korrektur`

**Why separate**

- this is the bridge from organization into subject work
- it changes daily workflow paths and deserves isolated validation

**Tests**

- `npm test --workspace=teacher-ui`
- `npm run typecheck --workspace=teacher-ui`
- `npm run build --workspace=teacher-ui`

## Suggested Order

1. PR 1: shell + route skeleton
2. PR 2: dashboard + organization
3. PR 3: subject hubs + surfaced module scope
4. PR 4: lesson workspace + KBR analysis

## Review Notes

- PR 1 should be checked mainly for IA correctness and Safari/iPad friendliness.
- PR 2 should be checked mainly for landing-page usefulness and organization-layer boundaries.
- PR 3 should be checked mainly for domain correctness and whether the surfaced links really reflect module capability.
- PR 4 should be checked mainly for workflow coherence: lesson -> workspace -> domain task.

## Practical Cherry-Pick Guide

If you want to split manually from the current working tree, use path-based staging:

### PR 1 staging

- `git add apps/teacher-ui/src/layouts/AppLayout.vue`
- `git add apps/teacher-ui/src/navigation.ts`
- `git add apps/teacher-ui/src/router/index.ts`
- `git add apps/teacher-ui/tests/navigation.test.ts`
- `git add docs/ui/information-architecture-gap-analysis.md`
- `git add docs/ui/navigation_pr_split_plan.md`

### PR 2 staging

- `git add apps/teacher-ui/src/views/Dashboard.vue`
- `git add apps/teacher-ui/src/views/ScheduleOverview.vue`
- `git add apps/teacher-ui/src/views/ClassesOverview.vue`
- `git add apps/teacher-ui/src/views/SettingsOverview.vue`
- `git add apps/teacher-ui/src/utils/dashboard-workspace.ts`
- `git add apps/teacher-ui/tests/dashboard-workspace.test.ts`

### PR 3 staging

- `git add apps/teacher-ui/src/composables/useSportBridge.ts`
- `git add apps/teacher-ui/src/views/SportHub.vue`
- `git add apps/teacher-ui/src/views/KBRHub.vue`
- `git add apps/teacher-ui/src/views/ExamsOverview.vue`

### PR 4 staging

- `git add apps/teacher-ui/src/views/LessonWorkspace.vue`
- `git add apps/teacher-ui/src/views/KBRExamAnalysisPage.vue`
- `git add apps/teacher-ui/src/views/ExamAnalysis.vue`
- `git add apps/teacher-ui/src/views/LessonList.vue`
- `git add apps/teacher-ui/src/views/Dashboard.vue`
- `git add apps/teacher-ui/src/views/ScheduleOverview.vue`
- `git add apps/teacher-ui/src/utils/lesson-workspace.ts`
- `git add apps/teacher-ui/tests/lesson-workspace.test.ts`

## Caution

`Dashboard.vue`, `ScheduleOverview.vue`, and `router/index.ts` span multiple concerns. If you want perfectly clean PR boundaries, use interactive staging on those files and split hunks carefully instead of staging the whole file at once.
