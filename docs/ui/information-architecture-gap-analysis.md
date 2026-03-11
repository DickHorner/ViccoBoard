# Information Architecture Gap Analysis

## Context

This analysis compares the current `apps/teacher-ui` navigation against the target navigation model discussed on March 11, 2026:

- a real landing-page dashboard
- a cross-subject organization layer (`Stundenplan`, `Klassen`, `Schueler`, `Stunden`, `Anwesenheit`, `Einstellungen`)
- subject hubs for `Sport` and `KBR`
- feature access that follows context first, tool second

The external reference is the Firefox Profiler page shared by the user. The useful transferable patterns are:

- persistent app shell
- very small primary navigation
- context-sensitive secondary workspace
- emphasis on "what am I working on right now?"
- tools grouped under a domain instead of exposed globally

## Current State Summary

The current teacher UI already contains many feature screens, but the navigation model is still flat.

Observed in [AppLayout.vue](/apps/teacher-ui/src/layouts/AppLayout.vue), [index.ts](/apps/teacher-ui/src/router/index.ts), and [Dashboard.vue](/apps/teacher-ui/src/views/Dashboard.vue):

- the primary sidebar mixes global areas, subject areas, and individual sport tools
- `Dashboard` currently behaves mostly like a class list
- there is no dedicated `Klassen` overview route
- there is no dedicated `Stundenplan` route
- there is no dedicated `Einstellungen` route
- sport tools are top-level navigation items instead of living under `Sport`
- KBR has an overview route, but not yet a real subject hub
- lesson context does not yet act as the central handoff point into subject-specific workspaces

## Target Navigation Model

### Level 1: Global

- `Dashboard`

### Level 2: Organization

- `Stundenplan`
- `Klassen`
- `Schueler`
- `Stunden`
- `Anwesenheit`
- `Einstellungen`

### Level 3: Subjects

- `Sport`
- `KBR`
- later additional subjects

### Access Principle

- organizational entities stay subject-neutral
- subject-specific tools and grading live under the relevant subject
- the current or next lesson becomes the main entry into the active workspace

## Gap Matrix

| Area | Desired Feature | Current State | Gap Status | Notes / Evidence |
| --- | --- | --- | --- | --- |
| Global IA | Minimal primary navigation with clear layers | Sidebar exposes dashboard, exams, students, lessons, attendance, grading, and 7 separate sport tools on one level | High | [AppLayout.vue](/apps/teacher-ui/src/layouts/AppLayout.vue) hardcodes a flat `navItems` list |
| Global IA | Organization separated from subject-specific functions | `Lessons`, `Attendance`, `Grading`, and sport tools are mixed together | High | `Grading` is effectively sport-specific today, but is exposed as a global area in [index.ts](/apps/teacher-ui/src/router/index.ts) |
| Dashboard | Landing page instead of class manager | Dashboard mostly shows classes, quick actions, recent activity | Medium | [Dashboard.vue](/apps/teacher-ui/src/views/Dashboard.vue) is useful, but not yet a system-wide start surface |
| Dashboard | "Current / next lesson" entry point | No dedicated current-lesson panel exists | High | No dashboard logic for running or upcoming lessons was found in [Dashboard.vue](/apps/teacher-ui/src/views/Dashboard.vue) |
| Dashboard | Daily schedule overview | Not implemented | High | No `Stundenplan` view or route exists in [index.ts](/apps/teacher-ui/src/router/index.ts) |
| Dashboard | Resume work across domains | Recent activity is attendance-focused only | Medium | Current activity list in [Dashboard.vue](/apps/teacher-ui/src/views/Dashboard.vue) does not surface recent exams, corrections, or last-opened subject work |
| Organization | Dedicated class overview | No `/classes` overview route; class access starts from dashboard cards only | High | Router contains `/classes/:id` but no `/classes` in [index.ts](/apps/teacher-ui/src/router/index.ts) |
| Organization | Subject-neutral class management | Class management exists, but the surrounding flow still comes from a sport-oriented dashboard and tracker history | Medium | [ClassDetail.vue](/apps/teacher-ui/src/views/ClassDetail.vue) exists, but IA positioning is not neutral yet |
| Organization | Central student management | Implemented and reachable | Low | [StudentList.vue](/apps/teacher-ui/src/views/StudentList.vue) and [StudentProfile.vue](/apps/teacher-ui/src/views/StudentProfile.vue) are present |
| Organization | Schedule as the parent context for lessons | Lesson list exists, but not as part of a real scheduling model | High | [LessonList.vue](/apps/teacher-ui/src/views/LessonList.vue) manages individual lessons, not a timetable |
| Organization | Attendance linked to schedule and lesson context | Attendance exists and accepts lesson/class query params | Medium | [LessonList.vue](/apps/teacher-ui/src/views/LessonList.vue) links to `/attendance?classId=...&lessonId=...`, which is a good base but not yet schedule-led |
| Organization | Settings surface | Not implemented | High | i18n contains settings strings, but no settings route or view was found in `apps/teacher-ui/src/views` or [index.ts](/apps/teacher-ui/src/router/index.ts) |
| Subject Hubs | Sport hub page | Missing | High | Sport functionality is split between `/grading/*` and `/tools/*`, with no `/subjects/sport` entry |
| Subject Hubs | KBR hub page | Partial | Medium | [ExamsOverview.vue](/apps/teacher-ui/src/views/ExamsOverview.vue) acts as an exams list, but not yet a broader `KBR` workspace |
| Sport Access | Sport tools grouped under Sport | Timer, multistop, scoreboard, teams, tournaments, tactics, feedback are global nav items | High | Current top-level routing in [AppLayout.vue](/apps/teacher-ui/src/layouts/AppLayout.vue) works against the desired IA |
| Sport Access | Sport grading grouped under Sport | Sport grading is reachable via a global `/grading` overview | High | [GradingOverview.vue](/apps/teacher-ui/src/views/GradingOverview.vue) is domain-specific but globally placed |
| Sport Access | Lesson-to-sport workspace handoff | Missing | High | No subject-aware lesson workspace route was found; current lesson actions mostly jump to attendance |
| KBR Access | KBR feature grouping beyond exams list | Partial | Medium | Exam builder and correction screens exist, but no KBR workspace navigation layer ties them together |
| KBR Access | Reliable correction navigation | Broken link in current overview | High | [ExamsOverview.vue](/apps/teacher-ui/src/views/ExamsOverview.vue) pushes to `/corrections/${id}`, but router defines `/exams/:id/correct` in [index.ts](/apps/teacher-ui/src/router/index.ts) |
| Deep Linking | Current lesson opens the correct subject workspace | Missing | High | No route family like `/lessons/:id/workspace` or `/subjects/:subject/lessons/:id` exists |
| Deep Linking | Secondary navigation per workspace | Missing | High | The app currently has one main sidebar only; there is no second-level navigation structure |
| UX | "Current object" header context like profiler | Partial | Low | [AppLayout.vue](/apps/teacher-ui/src/layouts/AppLayout.vue) shows a page title, but not an active object such as current class, lesson, or exam |

## Feature-by-Feature Assessment

### Dashboard

Current strengths:

- classes are visible immediately
- quick actions already exist
- recent activity concept exists

Main gaps:

- no `running now / next up` lesson card
- no timetable block
- no clear split between organization and subjects
- no "continue working" area spanning Sport and KBR

### Organization Layer

Current strengths:

- student management exists
- lesson list exists
- attendance entry exists
- attendance already accepts lesson context

Main gaps:

- no timetable feature
- no dedicated class list route
- no settings hub
- lesson and attendance are not yet framed as cross-subject organizational features

### Sport

Current strengths:

- grading overview exists
- dedicated grading entry screens exist
- multiple live tools exist

Main gaps:

- no Sport hub
- tools are too prominent globally
- grading is exposed as generic/global although it is currently sport-specific
- no lesson-centric jump into sport workspaces

### KBR

Current strengths:

- exam overview exists
- exam builder routes exist
- correction UI exists

Main gaps:

- no KBR hub
- correction entry point is currently misrouted from the overview
- export, analysis, and correction are not organized as one coherent workspace in navigation

## Recommended IA Refactor Order

1. Introduce the new top-level model in the app shell:
   - `Dashboard`
   - `Organisation`
   - `Sport`
   - `KBR`
   - utility links for `Einstellungen`

2. Add missing organization routes:
   - `/schedule`
   - `/classes`
   - `/settings`

3. Convert `Dashboard` into a true landing page:
   - current lesson
   - next lesson
   - today overview
   - quick access
   - continue working

4. Create subject hubs:
   - `/subjects/sport`
   - `/subjects/kbr`

5. Move sport-specific items behind the Sport hub:
   - grading
   - tests
   - live tools
   - statistics

6. Introduce lesson workspace routing:
   - lesson as the entry point
   - subject-specific actions from lesson context

7. Fix broken KBR navigation before broader IA work lands:
   - exams overview correction link

## Immediate Priorities

### Critical

- add `Stundenplan`
- add `Klassen` overview route
- add `Einstellungen`
- create subject hubs for `Sport` and `KBR`
- remove sport tools from the global primary menu
- add current/next lesson to dashboard
- fix KBR correction routing mismatch

### Important

- add resume-work widgets on dashboard
- make lessons the central bridge between organization and subjects
- expose secondary navigation within subject workspaces

### Lower-Risk Follow-up

- enrich top header with active lesson/class/exam context
- add smarter deep links from dashboard cards into subject-specific workflows
