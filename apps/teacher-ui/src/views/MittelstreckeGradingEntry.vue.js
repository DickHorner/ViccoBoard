/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import { MittelstreckeGradingService } from '@viccoboard/sport';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { SportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();
const mittelstreckeService = new MittelstreckeGradingService();
const categoryId = route.params.id;
const categoryName = ref('');
const loading = ref(true);
const saving = ref(false);
const students = ref([]);
const tables = ref([]);
const selectedTableId = ref('');
const times = ref({});
const grades = ref({});
const existingEntries = ref({});
const hasChanges = ref(false);
onMounted(async () => {
    await loadData();
});
async function loadData() {
    loading.value = true;
    try {
        // Load category
        const category = await SportBridge.value?.gradeCategoryRepository.findById(categoryId) ?? null;
        if (!category) {
            toast.error('Kategorie nicht gefunden');
            router.back();
            return;
        }
        categoryName.value = category.name;
        // Load students
        students.value = await studentRepository.value?.findByClassGroup(category.classGroupId) ?? [];
        // Load tables
        tables.value = await SportBridge.value?.tableDefinitionRepository.findAll() ?? [];
        // Load existing performance entries
        const entries = await SportBridge.value?.performanceEntryRepository.findByCategory(categoryId) ?? [];
        entries.forEach((entry) => {
            existingEntries.value[entry.studentId] = entry;
            if (entry.measurements?.timeInSeconds) {
                times.value[entry.studentId] = formatSecondsToTime(entry.measurements.timeInSeconds);
            }
            if (entry.calculatedGrade) {
                grades.value[entry.studentId] = entry.calculatedGrade;
            }
        });
    }
    catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Fehler beim Laden der Daten');
    }
    finally {
        loading.value = false;
    }
}
function formatSecondsToTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
function parseTimeToSeconds(timeStr) {
    if (!timeStr || !timeStr.trim())
        return null;
    // Try to parse mm:ss.ms format
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?$/);
    if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = match[3] ? parseInt(match[3].padEnd(2, '0'), 10) : 0;
        return minutes * 60 + seconds + milliseconds / 100;
    }
    // Try to parse just seconds
    const secondsMatch = timeStr.match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (secondsMatch) {
        const secs = parseInt(secondsMatch[1], 10);
        const ms = secondsMatch[2] ? parseInt(secondsMatch[2].padEnd(2, '0'), 10) : 0;
        return secs + ms / 100;
    }
    return null;
}
function onTimeChange(studentId) {
    hasChanges.value = true;
    const timeStr = times.value[studentId];
    const timeInSeconds = parseTimeToSeconds(timeStr);
    if (timeInSeconds !== null && selectedTableId.value) {
        // Calculate grade from table
        const grade = calculateGradeFromTable(timeInSeconds);
        grades.value[studentId] = grade;
    }
    else {
        grades.value[studentId] = '';
    }
}
function calculateGradeFromTable(timeInSeconds) {
    if (!selectedTableId.value)
        return '';
    const table = tables.value.find(t => t.id === selectedTableId.value);
    if (!table || !table.entries)
        return '';
    try {
        const result = mittelstreckeService.calculateGradeFromTime({
            timeInSeconds,
            table,
            context: {} // Could add gender/age context if available on the student
        });
        return result.grade;
    }
    catch (error) {
        console.error('Failed to calculate grade from table:', error);
        return '';
    }
}
async function saveAll() {
    saving.value = true;
    try {
        const savePromises = [];
        for (const student of students.value) {
            const timeStr = times.value[student.id];
            const grade = grades.value[student.id];
            if (!timeStr || !grade)
                continue;
            const timeInSeconds = parseTimeToSeconds(timeStr);
            if (timeInSeconds === null)
                continue;
            const measurements = {
                timeInSeconds,
                timeFormatted: timeStr
            };
            if (SportBridge.value) {
                savePromises.push(SportBridge.value.recordGradeUseCase.execute({
                    studentId: student.id,
                    categoryId: categoryId,
                    measurements,
                    calculatedGrade: grade
                }));
            }
        }
        await Promise.all(savePromises);
        hasChanges.value = false;
        toast.success(t('COMMON.success'));
    }
    catch (error) {
        console.error('Failed to save grades:', error);
        toast.error('Fehler beim Speichern');
    }
    finally {
        saving.value = false;
    }
}
function getGradeClass(grade) {
    const numGrade = typeof grade === 'string' ? parseFloat(grade) : grade;
    if (isNaN(numGrade))
        return '';
    if (numGrade <= 2.0)
        return 'grade-good';
    if (numGrade <= 3.5)
        return 'grade-ok';
    return 'grade-poor';
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['back-button']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['time-input']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['student-name']} */ ;
/** @type {__VLS_StyleScopedClasses['time-input-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grade-cell']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mittelstrecke-grading-view" },
});
/** @type {__VLS_StyleScopedClasses['mittelstrecke-grading-view']} */ ;
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
(__VLS_ctx.t('MITTELSTRECKE.bewerte'));
(__VLS_ctx.categoryName);
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.t('COMMON.loading'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grading-content" },
    });
    /** @type {__VLS_StyleScopedClasses['grading-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t('MITTELSTRECKE.tabelle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.selectedTableId),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.t('TABLES.select-table'));
    for (const [table] of __VLS_vFor((__VLS_ctx.tables))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (table.id),
            value: (table.id),
        });
        (table.name);
        // @ts-ignore
        [t, t, t, t, t, categoryName, loading, selectedTableId, tables,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t('MITTELSTRECKE.alle-schueler'));
    if (__VLS_ctx.hasChanges) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.saveAll) },
            ...{ class: "btn-primary btn-small" },
            disabled: (__VLS_ctx.saving),
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        (__VLS_ctx.saving ? __VLS_ctx.t('COMMON.syncing') : __VLS_ctx.t('COMMON.save'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grading-table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['grading-table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "grading-table" },
    });
    /** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('SCHUELER.name'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('MITTELSTRECKE.gesamt'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('MITTELSTRECKE.note'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [student] of __VLS_vFor((__VLS_ctx.students))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (student.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "student-name" },
        });
        /** @type {__VLS_StyleScopedClasses['student-name']} */ ;
        (student.firstName);
        (student.lastName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "time-input-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['time-input-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.onTimeChange(student.id);
                    // @ts-ignore
                    [t, t, t, t, t, t, hasChanges, saveAll, saving, saving, students, onTimeChange,];
                } },
            type: "text",
            value: (__VLS_ctx.times[student.id]),
            ...{ class: "time-input" },
            placeholder: "mm:ss.ms",
        });
        /** @type {__VLS_StyleScopedClasses['time-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "grade-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['grade-cell']} */ ;
        if (__VLS_ctx.grades[student.id]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "grade-value" },
                ...{ class: (__VLS_ctx.getGradeClass(__VLS_ctx.grades[student.id])) },
            });
            /** @type {__VLS_StyleScopedClasses['grade-value']} */ ;
            (__VLS_ctx.grades[student.id]);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "grade-missing" },
            });
            /** @type {__VLS_StyleScopedClasses['grade-missing']} */ ;
        }
        // @ts-ignore
        [times, grades, grades, grades, getGradeClass,];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
