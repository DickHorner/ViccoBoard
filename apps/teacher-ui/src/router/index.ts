import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    parent?: string
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/Dashboard.vue'),
    alias: '/dashboard',
    meta: { title: 'Dashboard' }
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: () => import('../views/ScheduleOverview.vue'),
    meta: { title: 'Stundenplan', parent: '/' }
  },
  {
    path: '/classes',
    name: 'classes',
    component: () => import('../views/ClassesOverview.vue'),
    meta: { title: 'Klassen', parent: '/' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsOverview.vue'),
    meta: { title: 'Einstellungen', parent: '/' }
  },
  {
    path: '/settings/catalogs',
    name: 'catalog-management',
    component: () => import('../views/CatalogManagement.vue'),
    meta: { title: 'Katalogverwaltung', parent: '/settings' }
  },
  {
    path: '/subjects/sport',
    name: 'subject-sport',
    component: () => import('../views/SportHub.vue'),
    meta: { title: 'Sport', parent: '/' }
  },
  {
    path: '/subjects/sport/statistics',
    name: 'sport-statistics',
    component: () => import('../views/SportStatisticsView.vue'),
    meta: { title: 'Sport Statistiken', parent: '/subjects/sport' }
  },
  {
    path: '/subjects/sport/tables',
    name: 'sport-tables',
    component: () => import('../views/SportTablesView.vue'),
    meta: { title: 'Sport Tabellen', parent: '/subjects/sport' }
  },
  {
    path: '/subjects/kbr',
    name: 'subject-kbr',
    component: () => import('../views/KBRHub.vue'),
    meta: { title: 'KBR', parent: '/' }
  },
  {
    path: '/exams',
    name: 'exams',
    component: () => import('../views/ExamsOverview.vue'),
    meta: { title: 'KBR Pruefungen', parent: '/subjects/kbr' }
  },
  {
    path: '/exams/new',
    name: 'exam-new',
    component: () => import('../views/KBRExamBuilder.vue'),
    meta: { title: 'New Exam', parent: '/exams' }
  },
  {
    path: '/exams/simple/new',
    name: 'simple-exam-new',
    component: () => import('../views/SimpleExamBuilder.vue'),
    meta: { title: 'Create Simple Exam', parent: '/exams' }
  },
  {
    path: '/exams/simple/:id',
    name: 'simple-exam-edit',
    component: () => import('../views/SimpleExamBuilder.vue'),
    meta: { title: 'Edit Simple Exam', parent: '/exams' }
  },
  {
    path: '/exams/:id',
    name: 'exam-edit',
    component: () => import('../views/KBRExamBuilder.vue'),
    meta: { title: 'Exam Builder', parent: '/exams' }
  },
  {
    path: '/exams/:id/correct',
    name: 'exam-correct',
    component: () => import('../views/CorrectionCompactUI_v2.vue'),
    meta: { title: 'Exam Correction', parent: '/exams' }
  },
  {
    path: '/exams/:id/analysis',
    name: 'exam-analysis',
    component: () => import('../views/KBRExamAnalysisPage.vue'),
    meta: { title: 'KBR Analyse', parent: '/exams' }
  },
  {
    path: '/classes/:id',
    name: 'class-detail',
    component: () => import('../views/ClassDetail.vue'),
    meta: { title: 'Klasse', parent: '/classes' }
  },
  {
    path: '/students',
    name: 'students',
    component: () => import('../views/StudentList.vue'),
    meta: { title: 'Schueler', parent: '/' }
  },
  {
    path: '/students/:id',
    name: 'student-profile',
    component: () => import('../views/StudentProfile.vue'),
    meta: { title: 'Student Profile', parent: '/students' }
  },
  {
    path: '/attendance',
    name: 'attendance',
    component: () => import('../views/AttendanceEntry.vue'),
    meta: { title: 'Anwesenheit', parent: '/subjects/sport' }
  },
  {
    path: '/lessons',
    name: 'lessons',
    component: () => import('../views/LessonList.vue'),
    meta: { title: 'Stunden', parent: '/subjects/sport' }
  },
  {
    path: '/lessons/:id/workspace',
    name: 'lesson-workspace',
    component: () => import('../views/LessonWorkspace.vue'),
    meta: { title: 'Stunden-Workspace', parent: '/lessons' }
  },
  {
    path: '/grading',
    name: 'grading-overview',
    component: () => import('../views/GradingOverview.vue'),
    meta: { title: 'Sport Bewertung', parent: '/subjects/sport' }
  },
  {
    path: '/grading/criteria/:id',
    name: 'criteria-grading',
    component: () => import('../views/CriteriaGradingEntry.vue'),
    meta: { title: 'Criteria Grading', parent: '/grading' }
  },
  {
    path: '/grading/time/:id',
    name: 'time-grading',
    component: () => import('../views/TimeGradingEntry.vue'),
    meta: { title: 'Time-Based Grading', parent: '/grading' }
  },
  {
    path: '/grading/cooper/:id',
    name: 'cooper-grading',
    component: () => import('../views/CooperGradingEntry.vue'),
    meta: { title: 'Cooper Grading', parent: '/grading' }
  },
  {
    path: '/grading/shuttle/:id',
    name: 'shuttle-grading',
    component: () => import('../views/ShuttleGradingEntry.vue'),
    meta: { title: 'Shuttle Grading', parent: '/grading' }
  },
  {
    path: '/grading/mittelstrecke/:id',
    name: 'mittelstrecke-grading',
    component: () => import('../views/MittelstreckeGradingEntry.vue'),
    meta: { title: 'Mittelstrecke Grading', parent: '/grading' }
  },
  {
    path: '/grading/Sportabzeichen/:id',
    name: 'Sportabzeichen-grading',
    component: () => import('../views/SportabzeichenGradingEntry.vue'),
    meta: { title: 'Sportabzeichen', parent: '/grading' }
  },
  {
    path: '/grading/bjs/:id',
    name: 'bjs-grading',
    component: () => import('../views/BJSGradingEntry.vue'),
    meta: { title: 'Bundesjugendspiele', parent: '/grading' }
  },
  {
    path: '/grading/verbal/:id',
    name: 'verbal-grading',
    component: () => import('../views/VerbalGradingEntry.vue'),
    meta: { title: 'Verbalbeurteilung', parent: '/grading' }
  },
  {
    path: '/grading/tables',
    name: 'table-management',
    component: () => import('../views/TableManagement.vue'),
    meta: { title: 'Tabellenverwaltung', parent: '/grading' }
  },
  {
    path: '/grading/history/:id',
    name: 'grade-history',
    component: () => import('../views/GradeHistory.vue'),
    meta: { title: 'Grade History', parent: '/grading' }
  },
  {
    path: '/tools/timer',
    name: 'timer',
    component: () => import('../views/Timer.vue'),
    meta: { title: 'Timer', parent: '/subjects/sport' }
  },
  {
    path: '/tools/multistop',
    name: 'multistop',
    component: () => import('../views/Multistop.vue'),
    meta: { title: 'Multistop', parent: '/subjects/sport' }
  },
  {
    path: '/tools/scoreboard',
    name: 'scoreboard',
    component: () => import('../views/Scoreboard.vue'),
    meta: { title: 'Scoreboard', parent: '/subjects/sport' }
  },
  {
    path: '/tools/teams',
    name: 'teams',
    component: () => import('../views/TeamBuilder.vue'),
    meta: { title: 'Teams', parent: '/subjects/sport' }
  },
  {
    path: '/tools/tournaments',
    name: 'tournaments',
    component: () => import('../views/Tournaments.vue'),
    meta: { title: 'Tournaments', parent: '/subjects/sport' }
  },
  {
    path: '/tools/tactics',
    name: 'tactics',
    component: () => import('../views/TacticsBoard.vue'),
    meta: { title: 'Tactics', parent: '/subjects/sport' }
  },
  {
    path: '/tools/feedback',
    name: 'feedback',
    component: () => import('../views/FeedbackTool.vue'),
    meta: { title: 'Feedback', parent: '/subjects/sport' }
  },
  {
    path: '/tools/dice',
    name: 'dice',
    component: () => import('../views/DiceTool.vue'),
    meta: { title: 'Wuerfeln', parent: '/subjects/sport' }
  },
  {
    path: '/tools/video-delay',
    name: 'video-delay',
    component: () => import('../views/VideoDelay.vue'),
    meta: { title: 'Video Delay', parent: '/subjects/sport' }
  },
  {
    path: '/settings/sport',
    name: 'settings-sport',
    component: () => import('../views/SportSettingsView.vue'),
    meta: { title: 'Sport-Konfiguration', parent: '/settings' }
  }
]

export function resolveBackFallbackPath(route: RouteLocationNormalizedLoaded): string {
  return route.meta.parent ?? '/'
}

export function getSafeBackNavigationTarget(
  route: RouteLocationNormalizedLoaded,
  hasInternalBackTarget: boolean
): string | null {
  if (hasInternalBackTarget) {
    return null
  }

  const fallbackPath = resolveBackFallbackPath(route)
  return fallbackPath === route.fullPath ? '/' : fallbackPath
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  }
})

const originalBack = router.back.bind(router)

router.back = () => {
  const hasInternalBackTarget = typeof window !== 'undefined' && Boolean(window.history.state?.back)

  const target = getSafeBackNavigationTarget(router.currentRoute.value, hasInternalBackTarget)
  if (target === null) {
    originalBack()
    return
  }

  void router.push(target)
}

export default router
