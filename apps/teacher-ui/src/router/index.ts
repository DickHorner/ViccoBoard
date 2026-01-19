import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: 'Dashboard' }
  },
  {
    path: '/classes/:id',
    name: 'class-detail',
    component: () => import('../views/ClassDetail.vue'),
    meta: { title: 'Class Detail' }
  },
  {
    path: '/students',
    name: 'students',
    component: () => import('../views/StudentList.vue'),
    meta: { title: 'Students' }
  },
  {
    path: '/students/:id',
    name: 'student-profile',
    component: () => import('../views/StudentProfile.vue'),
    meta: { title: 'Student Profile' }
  },
  {
    path: '/attendance',
    name: 'attendance',
    component: () => import('../views/AttendanceEntry.vue'),
    meta: { title: 'Attendance Entry' }
  },
  {
    path: '/grading',
    name: 'grading-overview',
    component: () => import('../views/GradingOverview.vue'),
    meta: { title: 'Grading Overview' }
  },
  {
    path: '/grading/criteria/:id',
    name: 'criteria-grading',
    component: () => import('../views/CriteriaGradingEntry.vue'),
    meta: { title: 'Criteria Grading' }
  },
  {
    path: '/grading/time/:id',
    name: 'time-grading',
    component: () => import('../views/TimeGradingEntry.vue'),
    meta: { title: 'Time-Based Grading' }
  },
  {
    path: '/grading/history/:id',
    name: 'grade-history',
    component: () => import('../views/GradeHistory.vue'),
    meta: { title: 'Grade History' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    // If there's a saved position (browser back/forward), use it
    if (savedPosition) {
      return savedPosition
    }
    // For hash links, scroll to the element
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    // Otherwise, scroll to top
    return { top: 0, behavior: 'smooth' }
  }
})

export default router
