/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge';
import { AttendanceStatus } from '@viccoboard/core';
const { t } = useI18n();
initializeSportBridge();
initializeStudentsBridge();
const SportBridge = getSportBridge();
const studentsBridge = getStudentsBridge();
const classes = ref([]);
const selectedClassId = ref('');
const students = ref([]);
const teamCount = ref(2);
const teamLabel = ref('Team');
const useLatestAttendance = ref(false);
const genderMode = ref('mixed');
const warning = ref('');
const teams = ref([]);
const canGenerate = computed(() => selectedClassId.value && students.value.length > 0 && teamCount.value >= 2);
async function loadClasses() {
    classes.value = await SportBridge.classGroupRepository.findAll();
}
async function loadStudents() {
    warning.value = '';
    teams.value = [];
    if (!selectedClassId.value) {
        students.value = [];
        return;
    }
    const allStudents = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value);
    if (!useLatestAttendance.value) {
        students.value = allStudents;
        return;
    }
    const lesson = await SportBridge.lessonRepository.getMostRecent(selectedClassId.value);
    if (!lesson) {
        warning.value = t('COMMON.error');
        students.value = allStudents;
        return;
    }
    const attendance = await SportBridge.attendanceRepository.findByLesson(lesson.id);
    if (attendance.length === 0) {
        warning.value = t('COMMON.error');
        students.value = allStudents;
        return;
    }
    const presentIds = attendance
        .filter(record => [AttendanceStatus.Present, AttendanceStatus.Passive].includes(record.status))
        .map(record => record.studentId);
    const filtered = allStudents.filter(student => presentIds.includes(student.id));
    if (filtered.length === 0) {
        warning.value = t('COMMON.error');
        students.value = allStudents;
        return;
    }
    students.value = filtered;
}
function shuffle(input) {
    const array = [...input];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function generateTeams() {
    if (!canGenerate.value)
        return;
    const members = genderMode.value === 'separated'
        ? buildSeparatedTeams()
        : buildMixedTeams();
    teams.value = members;
}
function buildMixedTeams() {
    const shuffled = shuffle(students.value);
    const result = Array.from({ length: teamCount.value }, (_, index) => ({
        name: `${teamLabel.value} ${index + 1}`,
        students: []
    }));
    shuffled.forEach((student, index) => {
        result[index % teamCount.value].students.push(student);
    });
    return result;
}
function buildSeparatedTeams() {
    const males = students.value.filter(student => student.gender === 'male');
    const females = students.value.filter(student => student.gender === 'female');
    const others = students.value.filter(student => !student.gender);
    const mixed = [...shuffle(males), ...shuffle(females), ...shuffle(others)];
    const result = Array.from({ length: teamCount.value }, (_, index) => ({
        name: `${teamLabel.value} ${index + 1}`,
        students: []
    }));
    mixed.forEach((student, index) => {
        result[index % teamCount.value].students.push(student);
    });
    return result;
}
function clearTeams() {
    teams.value = [];
}
loadClasses();
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['team-card']} */ ;
/** @type {__VLS_StyleScopedClasses['team-card']} */ ;
/** @type {__VLS_StyleScopedClasses['team-card']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "team-view" },
});
/** @type {__VLS_StyleScopedClasses['team-view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$router.back();
            // @ts-ignore
            [$router,];
        } },
    ...{ class: "back-button" },
});
/** @type {__VLS_StyleScopedClasses['back-button']} */ ;
(__VLS_ctx.t('COMMON.back'));
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.t('TEAM.team-erstellen'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
(__VLS_ctx.t('TEAM.teams-klasse'));
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row" },
});
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('KLASSEN.klasse'));
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.loadStudents) },
    value: (__VLS_ctx.selectedClassId),
    ...{ class: "form-input" },
});
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.t('KLASSEN.klasse'));
for (const [cls] of __VLS_vFor((__VLS_ctx.classes))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (cls.id),
        value: (cls.id),
    });
    (cls.name);
    (cls.schoolYear);
    // @ts-ignore
    [t, t, t, t, t, loadStudents, selectedClassId, classes,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('TEAM.anzahl'));
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "number",
    min: "2",
    ...{ class: "form-input" },
});
(__VLS_ctx.teamCount);
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('TEAM.bezeichnung'));
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.teamLabel),
    type: "text",
    ...{ class: "form-input" },
});
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-row" },
});
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "checkbox-row" },
});
/** @type {__VLS_StyleScopedClasses['checkbox-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "checkbox",
});
(__VLS_ctx.useLatestAttendance);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.t('TEAM.anwesenheit'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('TEAM.geschlecht'));
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.genderMode),
    ...{ class: "form-input" },
});
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "mixed",
});
(__VLS_ctx.t('TEAM.gemischt'));
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "separated",
});
(__VLS_ctx.t('TEAM.getrennt'));
if (__VLS_ctx.warning) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "warning-banner" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-banner']} */ ;
    (__VLS_ctx.warning);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-actions" },
});
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.generateTeams) },
    ...{ class: "btn-primary" },
    disabled: (!__VLS_ctx.canGenerate),
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
(__VLS_ctx.t('TEAM.erstellen'));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.clearTeams) },
    ...{ class: "btn-secondary" },
    disabled: (__VLS_ctx.teams.length === 0),
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
(__VLS_ctx.t('TEAM.loeschen'));
if (__VLS_ctx.teams.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t('TEAM.turniere'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "teams-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['teams-grid']} */ ;
    for (const [team] of __VLS_vFor((__VLS_ctx.teams))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (team.name),
            ...{ class: "team-card" },
        });
        /** @type {__VLS_StyleScopedClasses['team-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        (team.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
        for (const [student] of __VLS_vFor((team.students))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (student.id),
            });
            (student.firstName);
            (student.lastName);
            // @ts-ignore
            [t, t, t, t, t, t, t, t, t, teamCount, teamLabel, useLatestAttendance, genderMode, warning, warning, generateTeams, canGenerate, clearTeams, teams, teams, teams,];
        }
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
