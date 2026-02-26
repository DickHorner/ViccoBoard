# Teacher UI Navigation Report

## Routes With No Incoming Edges
- `/exams/simple/new` (route:simple-exam-new, SimpleExamBuilder.vue)
- `/exams/simple/:id` (route:simple-exam-edit, SimpleExamBuilder.vue)
- `/exams/:id` (route:exam-edit, KBRExamBuilder.vue)
- `/exams/:id/correct` (route:exam-correct, CorrectionCompactUI_v2.vue)

## Unresolved Edges
- `link` from `apps/teacher-ui/src/views/ExamAnalysis.vue` to `correction-compact` (name)
- `push` from `apps/teacher-ui/src/views/ExamsOverview.vue` to `/corrections/${id}` (template)

## Shared Sources (Import Context)
- `apps/teacher-ui/src/layouts/AppLayout.vue` | importingScreens: none | importingViews: none
- `apps/teacher-ui/src/stores/examBuilderStore.ts` | importingScreens: none | importingViews: apps/teacher-ui/src/views/ExamBuilder.vue
- `apps/teacher-ui/src/views-wip/ClassDetail-clean.vue` | importingScreens: none | importingViews: none
- `apps/teacher-ui/src/views-wip/ClassDetail.vue` | importingScreens: none | importingViews: none
- `apps/teacher-ui/src/views-wip/Dashboard.vue` | importingScreens: none | importingViews: none
- `apps/teacher-ui/src/views-wip/GradingOverview.vue` | importingScreens: none | importingViews: none
- `apps/teacher-ui/src/views-wip/StudentList.vue` | importingScreens: none | importingViews: none
- `apps/teacher-ui/src/views-wip/StudentProfile.vue` | importingScreens: none | importingViews: none

## Suggested Manual Fixes
- Add a small override map file (for example `docs/ui/navigation.overrides.json`) for dynamic destinations that cannot be statically resolved.
- Prefer `router.push({ name: ... })` and `:to="{ name: ... }"` for hard-to-parse computed paths.
- For shared modules that navigate indirectly, add explicit metadata comments with intended source screens.
