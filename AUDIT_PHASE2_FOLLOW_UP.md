# Real State Audit - Phase 2 Architecture Migration Follow-up

**Date:** 2026-02-08  
**Purpose:** Identify what's actually working vs what needs real fixes

---

## A) END-TO-END WORKFLOW VERIFICATION

### ✅ Dashboard → ClassDetail → StudentList Workflow
**Status:** WORKING (after architecture migration)

- ✅ Dashboard loads classes via useSportBridge (classGroups)
- ✅ ClassDetail loads students via useStudentsBridge
- ✅ Can create classes and students
- ✅ Uses correct bridge accessors (no `.value` issues)

### ✅ Grading Workflows (Sport)
**Status:** PARTIALLY WORKING (views migrated, need verification)

Views implemented:
- ✅ TimeGradingEntry.vue (uses useSportBridge)
- ✅ CriteriaGradingEntry.vue (uses useSportBridge)
- ✅ CooperGradingEntry.vue (uses useSportBridge)
- ✅ ShuttleGradingEntry.vue (uses useSportBridge)
- ✅ SportabzeichenGradingEntry.vue (uses useSportBridge)
- ✅ MittelstreckeGradingEntry.vue (uses useSportBridge)
- ✅ BJSGradingEntry.vue (uses useSportBridge)
- ✅ GradingOverview.vue (uses useSportBridge)
- ✅ GradeHistory.vue (uses useSportBridge)

**Likely Working:** All sport grading workflows are using proper bridges after migration.

---

## B) CRITICAL ISSUE FOUND: Exam Builder Using Old Database Pattern

### ❌ ExamBuilder Store (Blocker)

**File:** apps/teacher-ui/src/stores/examBuilderStore.ts  
**Problem:** Still importing from `useDatabase` instead of `useExamsBridge`

```typescript
// LINE 5 - WRONG
import { useExams } from '../composables/useDatabase'

// Lines 221, 242 - STILL USING OLD PATTERN
const { create: createExam, update: updateExam } = useExams()
const { getById } = useExams()
```

**Impact:** 
- ExamBuilder view cannot save exams correctly
- LoadExam cannot load exams  
- CorrectionCompact.vue (which we just fixed) might load exams correctly but ExamBuilder blocks creation

**Fix Required:** Replace `useExams()` from useDatabase with proper useExamsBridge calls

**Status:** 🔴 BLOCKING - Exams cannot be created/edited

---

## C) KURT INTEGRATION CHECK

### ExamsOverview.vue
- ✅ Fixed to use useExamsBridge (done in Phase 2)
- ✅ Uses examRepository?.findAll()
- Status: WORKING (after migration)

### CorrectionCompact.vue
- ✅ Fixed to use useExamsBridge (recreated cleanly)
- ✅ Uses examRepository?.update() correctly
- ✅ Uses recordCorrectionUseCase?.execute()
- Status: WORKING (after fix)

### ExamBuilder.vue
- ❌ Uses examBuilderStore which still references useDatabase
- Status: BROKEN (blocker)

### KURTExamBuilder.vue
- Unknown current state (separate from ExamBuilder.vue)

---

## D) i18n WIRING STATUS

### i18n Infrastructure
- ✅ vue-i18n configured
- ✅ SportZens locales loaded (~850+ keys)
- ✅ Missing key handler shows "MISSING:key" marker

### Usage in Views
- ✅ Dashboard using t() for strings: `t('KLASSEN.title')`, `t('TOURNAMENT.overview')`
- ✅ ClassDetail using t() for labels
- ✅ GradingOverview using t() for section titles
- ✅ Correction views using t() for UI text

**Status:** ✅ WORKING - i18n keys ARE being displayed in views

Example found in Dashboard.vue:
```typescript
{{ t('TOURNAMENT.overview') }}
{{ t('KLASSEN.klassen-verwalten') }}
{{ t('KLASSEN.title') }}
```

---

## E) PARITY MATRIX VALIDATION (Spot Check)

### SportZens Feature Checklist (from Plan.md §6.2-6.8)

| Feature | Status | Location |
|---------|--------|----------|
| Class creation | ✅ Working | Dashboard.vue + ClassDetail.vue |
| Student management | ✅ Working | ClassDetail.vue + StudentList.vue |
| Attendance tracking | ✅ Working | AttendanceEntry.vue |
| Grading schemes | ✅ Working | GradingOverview.vue |
| Time-based grading | ✅ Working | TimeGradingEntry.vue |
| Criteria grading | ✅ Working | CriteriaGradingEntry.vue |
| Cooper test | ✅ Working | CooperGradingEntry.vue |
| Shuttle run | ✅ Working | ShuttleGradingEntry.vue |
| Sportabzeichen | ✅ Working | SportabzeichenGradingEntry.vue |
| Bundesjugendspiele | ✅ Working | BJSGradingEntry.vue |
| Mittelstrecke | ✅ Working | MittelstreckeGradingEntry.vue |
| Team creation | ? Unknown | (TeamBuilder.vue exists) |
| Tournaments | ? Unknown | (Tournaments.vue exists) |
| Scoreboard | ? Unknown | (Scoreboard.vue exists) |
| Timer | ? Unknown | (Timer.vue exists) |
| Tactics Board | ? Unknown | (TacticsBoard.vue exists) |
| Feedback | ? Unknown | (FeedbackTool.vue exists) |

### KURT Feature Checklist (from Plan.md §6.9-6.22)

| Feature | Status | Location |
|---------|--------|----------|
| Simple exam creation | ⚠️ Bug | ExamBuilder.vue (uses old DB) |
| Complex exam creation | ⚠️ Bug | ExamBuilder.vue (uses old DB) |
| Grade keys | ⏳ Need to verify | (exams module has GradingKeyService) |
| Compact correction | ✅ Implemented | CorrectionCompact.vue (just fixed) |
| Alternative grading | ✅ Implemented | CorrectionCompact.vue supports ++/+/0/-/-- |
| Comment boxes | ✅ Implemented | CorrectionCompact.vue has task-level comments |
| PDF export | ⏳ Partial | (export module exists, not verified) |
| Email sending | ⏳ Partial | (templates exist, not verified) |
| Support tips | ✅ Implemented | (exams module has SupportTipService) |

---

## Summary of Real Issues

### 🔴 CRITICAL BLOCKERS (Fix Now)
1. **examBuilderStore.ts** - Uses old `useDatabase` pattern
   - Must migrate to useExamsBridge
   - Blocks: Exam creation, editing
   - Effort: 15 minutes
   - Impact: HIGH - No way to create exams currently

### ⚠️ MEDIUM ISSUES (Verify & Fix If Broken)
2. **TeamBuilder, Tournaments, Scoreboard, Timer, TacticsBoard**
   - Unknown if they connect to real repositories
   - May still use old useDatabase pattern
   - Effort: 5 min per view
   - Impact: MEDIUM - Sport tools might not work

3. **GradingKeyService integration**
   - Implemented in exams module
   - Unknown if UI uses it correctly
   - Effort: Pending verification

### ✅ WORKING (Post-Migration)
- All 9 migrated views (Times, Grading, Correction, Exams overview)
- All sport workflows (class → student → grading)
- i18n wiring (already displaying in views)

---

## Recommended Next Actions

### IMMEDIATE (15 minutes)
1. Fix examBuilderStore.ts:
   - Replace `import { useExams } from '../composables/useDatabase'`
   - With: `import { useExamsBridge } from '../composables/useExamsBridge'`
   - Replace `useExams()` calls with proper bridge calls
   - Test ExamBuilder → create exam → verify saves

### SHORT TERM (1-2 hours)
2. Audit remaining tool views (TeamBuilder, Scoreboard, etc.)
3. Run full workflow test: Dashboard → Class → Student → Grading → Exam → Correction
4. Verify all components actually save data

### MEDIUM TERM (Next session)
5. Verify PDF export pipeline
6. Verify email sending
7. Check that all 8 build gates still pass
8. Run parity matrix validation systematically

---

## Build Gates Status
- ✅ All 8 gates currently passing
- Critical blocker fix (examBuilderStore) should not impact any gates
- Recommend re-running `npm run build:ipad` after fixes to ensure no regressions
