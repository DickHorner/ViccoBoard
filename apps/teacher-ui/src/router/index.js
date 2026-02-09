import { createRouter, createWebHistory } from 'vue-router';
const routes = [
    {
        path: '/',
        name: 'dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: 'Dashboard' }
    },
    {
        path: '/exams',
        name: 'exams',
        component: () => import('../views/ExamsOverview.vue'),
        meta: { title: 'Exams' }
    },
    {
        path: '/exams/new',
        name: 'exam-new',
        component: () => import('../views/KURTExamBuilder.vue'),
        meta: { title: 'New Exam' }
    },
    {
        path: '/exams/:id',
        name: 'exam-edit',
        component: () => import('../views/KURTExamBuilder.vue'),
        meta: { title: 'Exam Builder' }
    },
    {
        path: '/exams/:id/correct',
        name: 'exam-correct',
        component: () => import('../views/CorrectionCompactUI.vue'),
        meta: { title: 'Exam Correction' }
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
        path: '/lessons',
        name: 'lessons',
        component: () => import('../views/LessonList.vue'),
        meta: { title: 'Lessons' }
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
        path: '/grading/cooper/:id',
        name: 'cooper-grading',
        component: () => import('../views/CooperGradingEntry.vue'),
        meta: { title: 'Cooper Grading' }
    },
    {
        path: '/grading/shuttle/:id',
        name: 'shuttle-grading',
        component: () => import('../views/ShuttleGradingEntry.vue'),
        meta: { title: 'Shuttle Grading' }
    },
    {
        path: '/grading/mittelstrecke/:id',
        name: 'mittelstrecke-grading',
        component: () => import('../views/MittelstreckeGradingEntry.vue'),
        meta: { title: 'Mittelstrecke Grading' }
    },
    {
        path: '/grading/sportabzeichen/:id',
        name: 'sportabzeichen-grading',
        component: () => import('../views/SportabzeichenGradingEntry.vue'),
        meta: { title: 'Sportabzeichen' }
    },
    {
        path: '/grading/bjs/:id',
        name: 'bjs-grading',
        component: () => import('../views/BJSGradingEntry.vue'),
        meta: { title: 'Bundesjugendspiele' }
    },
    {
        path: '/grading/history/:id',
        name: 'grade-history',
        component: () => import('../views/GradeHistory.vue'),
        meta: { title: 'Grade History' }
    },
    {
        path: '/tools/timer',
        name: 'timer',
        component: () => import('../views/Timer.vue'),
        meta: { title: 'Timer' }
    },
    {
        path: '/tools/multistop',
        name: 'multistop',
        component: () => import('../views/Multistop.vue'),
        meta: { title: 'Multistop' }
    },
    {
        path: '/tools/scoreboard',
        name: 'scoreboard',
        component: () => import('../views/Scoreboard.vue'),
        meta: { title: 'Scoreboard' }
    },
    {
        path: '/tools/teams',
        name: 'teams',
        component: () => import('../views/TeamBuilder.vue'),
        meta: { title: 'Teams' }
    },
    {
        path: '/tools/tournaments',
        name: 'tournaments',
        component: () => import('../views/Tournaments.vue'),
        meta: { title: 'Tournaments' }
    },
    {
        path: '/tools/tactics',
        name: 'tactics',
        component: () => import('../views/TacticsBoard.vue'),
        meta: { title: 'Tactics' }
    },
    {
        path: '/tools/feedback',
        name: 'feedback',
        component: () => import('../views/FeedbackTool.vue'),
        meta: { title: 'Feedback' }
    }
];
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, _from, savedPosition) {
        // If there's a saved position (browser back/forward), use it
        if (savedPosition) {
            return savedPosition;
        }
        // For hash links, scroll to the element
        if (to.hash) {
            return { el: to.hash, behavior: 'smooth' };
        }
        // Otherwise, scroll to top
        return { top: 0, behavior: 'smooth' };
    }
});
export default router;
