/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useClassGroups, useStudents, useAttendance } from '../composables/useSportBridge';
import { createUuid } from '../utils/uuid';
const route = useRoute();
// Status options for quick selection
const statusOptions = [
    { value: 'present', label: 'Anwesend', short: 'A' },
    { value: 'absent', label: 'Abwesend', short: 'Ab' },
    { value: 'late', label: 'Verspätet', short: 'V' },
    { value: 'excused', label: 'Entschuldigt', short: 'E' },
    { value: 'passive', label: 'Passiv', short: 'P' }
];
// State
const classes = ref([]);
const students = ref([]);
const selectedClassId = ref('');
const loading = ref(false);
const saving = ref(false);
const saveError = ref('');
const saveSuccess = ref('');
const attendance = ref({});
// Composables
const classGroups = useClassGroups();
const studentsComposable = useStudents();
const attendanceComposable = useAttendance();
// Computed
const currentDate = computed(() => {
    return new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});
const hasAnyAttendance = computed(() => {
    return Object.keys(attendance.value).length > 0;
});
// Methods
const countByStatus = (status) => {
    return Object.values(attendance.value).filter(a => a.status === status).length;
};
const setStatus = (studentId, status) => {
    if (!attendance.value[studentId]) {
        attendance.value[studentId] = { status };
    }
    else {
        attendance.value[studentId].status = status;
    }
    // Clear reason if not absent/excused
    if (!['absent', 'excused'].includes(status)) {
        delete attendance.value[studentId].reason;
    }
};
const setStudentStatus = (studentId, status) => {
    setStatus(studentId, status);
};
const markAllPresent = async () => {
    students.value.forEach(student => {
        setStatus(student.id, 'present');
    });
};
const clearAttendance = () => {
    attendance.value = {};
    saveError.value = '';
};
const onClassChange = async () => {
    if (!selectedClassId.value) {
        students.value = [];
        attendance.value = {};
        return;
    }
    loading.value = true;
    try {
        students.value = await studentsComposable.getByClassId(selectedClassId.value);
        attendance.value = {};
    }
    catch (err) {
        console.error('Failed to load students:', err);
    }
    finally {
        loading.value = false;
    }
};
const handleSaveAttendance = async () => {
    saveError.value = '';
    saveSuccess.value = '';
    saving.value = true;
    try {
        // Generate a unique lesson ID for this attendance session
        const lessonId = `lesson-${createUuid()}`;
        // Prepare attendance records
        const records = Object.entries(attendance.value).map(([studentId, entry]) => ({
            studentId,
            lessonId,
            status: entry.status,
            reason: entry.reason,
            notes: undefined
        }));
        // Save using batch record
        await attendanceComposable.recordBatch(records);
        const savedCount = records.length;
        saveSuccess.value = `Anwesenheit für ${savedCount} Schüler erfolgreich gespeichert`;
        // Reset attendance after brief display
        setTimeout(() => {
            if (saveSuccess.value.includes(savedCount.toString())) {
                attendance.value = {};
                saveSuccess.value = '';
            }
        }, 2000);
    }
    catch (err) {
        console.error('Failed to save attendance:', err);
        if (err instanceof Error) {
            saveError.value = err.message;
        }
        else {
            saveError.value = 'Fehler beim Speichern der Anwesenheit. Bitte versuchen Sie es erneut.';
        }
    }
    finally {
        saving.value = false;
    }
};
// Lifecycle
onMounted(async () => {
    try {
        classes.value = await classGroups.getAll();
        // Check if classId is passed via query params
        const classIdFromQuery = route.query.classId;
        if (classIdFromQuery) {
            selectedClassId.value = classIdFromQuery;
            await onClassChange();
        }
    }
    catch (err) {
        console.error('Failed to load classes:', err);
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['back-button']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['form-select']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-row']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status-present']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status-absent']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status-late']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status-excused']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status-passive']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['reason-input']} */ ;
/** @type {__VLS_StyleScopedClasses['reason-input']} */ ;
/** @type {__VLS_StyleScopedClasses['reason-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['save-message']} */ ;
/** @type {__VLS_StyleScopedClasses['save-message']} */ ;
/** @type {__VLS_StyleScopedClasses['status-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-view']} */ ;
/** @type {__VLS_StyleScopedClasses['status-summary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "attendance-view" },
});
/** @type {__VLS_StyleScopedClasses['attendance-view']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "attendance-form" },
});
/** @type {__VLS_StyleScopedClasses['attendance-form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.currentDate);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-section" },
});
/** @type {__VLS_StyleScopedClasses['form-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    for: "class-select",
    ...{ class: "form-label" },
});
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onClassChange) },
    id: "class-select",
    value: (__VLS_ctx.selectedClassId),
    ...{ class: "form-select" },
});
/** @type {__VLS_StyleScopedClasses['form-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [cls] of __VLS_vFor((__VLS_ctx.classes))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (cls.id),
        value: (cls.id),
    });
    (cls.name);
    (cls.schoolYear);
    // @ts-ignore
    [currentDate, onClassChange, selectedClassId, classes,];
}
if (!__VLS_ctx.selectedClassId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-content" },
    });
    /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
}
else if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.selectedClassId && __VLS_ctx.students.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.students.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-content" },
    });
    /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['status-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-item status-present" },
    });
    /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['status-present']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-count" },
    });
    /** @type {__VLS_StyleScopedClasses['status-count']} */ ;
    (__VLS_ctx.countByStatus('present'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-item status-absent" },
    });
    /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['status-absent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-count" },
    });
    /** @type {__VLS_StyleScopedClasses['status-count']} */ ;
    (__VLS_ctx.countByStatus('absent'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-item status-late" },
    });
    /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['status-late']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-count" },
    });
    /** @type {__VLS_StyleScopedClasses['status-count']} */ ;
    (__VLS_ctx.countByStatus('late'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-item status-excused" },
    });
    /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['status-excused']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-count" },
    });
    /** @type {__VLS_StyleScopedClasses['status-count']} */ ;
    (__VLS_ctx.countByStatus('excused'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "status-item status-passive" },
    });
    /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['status-passive']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-label" },
    });
    /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-count" },
    });
    /** @type {__VLS_StyleScopedClasses['status-count']} */ ;
    (__VLS_ctx.countByStatus('passive'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bulk-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['bulk-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.markAllPresent) },
        ...{ class: "btn-bulk" },
        disabled: (__VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-bulk']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "attendance-table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['attendance-table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "attendance-table" },
    });
    /** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "student-name-col" },
    });
    /** @type {__VLS_StyleScopedClasses['student-name-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "status-col" },
    });
    /** @type {__VLS_StyleScopedClasses['status-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "reason-col" },
    });
    /** @type {__VLS_StyleScopedClasses['reason-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [student] of __VLS_vFor((__VLS_ctx.students))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (student.id),
            ...{ class: "student-row" },
        });
        /** @type {__VLS_StyleScopedClasses['student-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "student-name" },
        });
        /** @type {__VLS_StyleScopedClasses['student-name']} */ ;
        (student.firstName);
        (student.lastName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "status-buttons-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['status-buttons-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "status-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['status-buttons']} */ ;
        for (const [status] of __VLS_vFor((__VLS_ctx.statusOptions))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.selectedClassId))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.selectedClassId && __VLS_ctx.students.length === 0))
                            return;
                        if (!(__VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.setStudentStatus(student.id, status.value);
                        // @ts-ignore
                        [selectedClassId, selectedClassId, loading, students, students, students, countByStatus, countByStatus, countByStatus, countByStatus, countByStatus, markAllPresent, saving, statusOptions, setStudentStatus,];
                    } },
                key: (status.value),
                ...{ class: (['status-btn', `status-btn-${status.value}`, {
                            'active': __VLS_ctx.attendance[student.id]?.status === status.value
                        }]) },
                disabled: (__VLS_ctx.saving),
                title: (status.label),
            });
            /** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            (status.short);
            // @ts-ignore
            [saving, attendance,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "reason-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['reason-cell']} */ ;
        if (__VLS_ctx.attendance[student.id] && ['absent', 'excused'].includes(__VLS_ctx.attendance[student.id].status)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                value: (__VLS_ctx.attendance[student.id].reason),
                type: "text",
                ...{ class: "reason-input" },
                placeholder: "Grund eingeben...",
                disabled: (__VLS_ctx.saving),
            });
            /** @type {__VLS_StyleScopedClasses['reason-input']} */ ;
        }
        // @ts-ignore
        [saving, attendance, attendance, attendance,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleSaveAttendance) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.hasAnyAttendance || __VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.saving ? 'Wird gespeichert...' : 'Anwesenheit speichern');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearAttendance) },
        ...{ class: "btn-secondary" },
        disabled: (!__VLS_ctx.hasAnyAttendance || __VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    if (__VLS_ctx.saveError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.saveError);
    }
    if (__VLS_ctx.saveSuccess) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "success-message" },
        });
        /** @type {__VLS_StyleScopedClasses['success-message']} */ ;
        (__VLS_ctx.saveSuccess);
    }
}
// @ts-ignore
[saving, saving, saving, handleSaveAttendance, hasAnyAttendance, hasAnyAttendance, clearAttendance, saveError, saveError, saveSuccess, saveSuccess,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
