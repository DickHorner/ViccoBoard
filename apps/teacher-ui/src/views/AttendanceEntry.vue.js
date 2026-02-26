/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getSportBridge } from '../composables/useSportBridge';
import { getStudentsBridge } from '../composables/useStudentsBridge';
import { AttendanceStatus } from '@viccoboard/core';
const route = useRoute();
const { t } = useI18n();
// State
const classes = ref([]);
const students = ref([]);
const selectedClassId = ref('');
const loading = ref(false);
const saving = ref(false);
const saveError = ref('');
const saveSuccess = ref('');
const statusCatalog = ref([]);
const catalogLoading = ref(false);
const attendance = ref({});
// Bridge access
const SportBridge = getSportBridge();
const studentsBridge = getStudentsBridge();
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
// Status options derived from catalog
// Maps catalog StatusOption to UI format compatible with existing AttendanceStatus enum
const statusOptions = computed(() => {
    return statusCatalog.value
        .filter(status => status.active)
        .sort((a, b) => a.order - b.order)
        .map(status => {
        // Map common codes to AttendanceStatus enum values for backward compatibility
        let enumValue;
        const code = status.code.toUpperCase();
        switch (code) {
            case 'P':
                enumValue = AttendanceStatus.Present;
                break;
            case 'A':
            case 'AB':
                enumValue = AttendanceStatus.Absent;
                break;
            case 'E':
                enumValue = AttendanceStatus.Excused;
                break;
            case 'L':
            case 'V':
                enumValue = AttendanceStatus.Late;
                break;
            case 'PA':
                enumValue = AttendanceStatus.Passive;
                break;
            default:
                // For custom statuses, use Present as fallback (or could extend enum)
                enumValue = AttendanceStatus.Present;
        }
        return {
            value: enumValue,
            label: status.name,
            short: status.code,
            color: status.color,
            icon: status.icon
        };
    });
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
    if (![AttendanceStatus.Absent, AttendanceStatus.Excused].includes(status)) {
        delete attendance.value[studentId].reason;
    }
};
const setStudentStatus = (studentId, status) => {
    setStatus(studentId, status);
};
const markAllPresent = async () => {
    students.value.forEach(student => {
        setStatus(student.id, AttendanceStatus.Present);
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
        statusCatalog.value = [];
        return;
    }
    loading.value = true;
    catalogLoading.value = true;
    try {
        // Load students and status catalog in parallel
        const [studentsResult, catalog] = await Promise.all([
            studentsBridge.studentRepository.findByClassGroup(selectedClassId.value),
            studentsBridge.statusCatalogRepository.getOrCreateForClassGroup(selectedClassId.value, 'attendance')
        ]);
        students.value = studentsResult;
        statusCatalog.value = catalog.statuses;
        attendance.value = {};
    }
    catch (err) {
        console.error('Failed to load students or status catalog:', err);
        saveError.value = t('COMMON.error');
    }
    finally {
        loading.value = false;
        catalogLoading.value = false;
    }
};
const handleSaveAttendance = async () => {
    saveError.value = '';
    saveSuccess.value = '';
    saving.value = true;
    try {
        if (!selectedClassId.value) {
            throw new Error('Keine Klasse ausgewählt');
        }
        // Create a lesson for today
        const lesson = await SportBridge.createLessonUseCase.execute({
            classGroupId: selectedClassId.value,
            date: new Date()
        });
        // Prepare attendance records
        const records = Object.entries(attendance.value).map(([studentId, entry]) => ({
            studentId,
            lessonId: lesson.id,
            status: entry.status,
            reason: entry.reason,
            notes: undefined
        }));
        // Save using batch record
        await SportBridge.recordAttendanceUseCase.executeBatch(records);
        const savedCount = records.length;
        saveSuccess.value = `${t('COMMON.success')} (${savedCount})`;
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
            saveError.value = t('COMMON.error');
        }
    }
    finally {
        saving.value = false;
    }
};
// Lifecycle
onMounted(async () => {
    try {
        classes.value = await SportBridge.classGroupRepository.findAll();
        // Check if classId is passed via query params
        const classIdFromQuery = route.query.classId;
        if (classIdFromQuery) {
            selectedClassId.value = classIdFromQuery;
            await onClassChange();
        }
    }
    catch (err) {
        console.error('Failed to load classes:', err);
        saveError.value = t('COMMON.error');
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
/** @type {__VLS_StyleScopedClasses['btn-bulk']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-bulk']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['student-row']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['reason-input']} */ ;
/** @type {__VLS_StyleScopedClasses['reason-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['status-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-col']} */ ;
/** @type {__VLS_StyleScopedClasses['reason-col']} */ ;
/** @type {__VLS_StyleScopedClasses['status-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-view']} */ ;
/** @type {__VLS_StyleScopedClasses['status-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-bulk']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
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
(__VLS_ctx.t('COMMON.back'));
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.t('ANWESENHEIT.title'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
(__VLS_ctx.t('ANWESENHEIT.status'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "attendance-form" },
});
/** @type {__VLS_StyleScopedClasses['attendance-form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.t('ANWESENHEIT.liste'));
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
(__VLS_ctx.t('KLASSEN.klasse'));
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
(__VLS_ctx.t('KLASSEN.klasse'));
for (const [cls] of __VLS_vFor((__VLS_ctx.classes))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (cls.id),
        value: (cls.id),
    });
    (cls.name);
    (cls.schoolYear);
    // @ts-ignore
    [t, t, t, t, t, t, currentDate, onClassChange, selectedClassId, classes,];
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
    (__VLS_ctx.t('KLASSEN.klasse'));
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
    (__VLS_ctx.t('COMMON.loading'));
}
else if (__VLS_ctx.selectedClassId && __VLS_ctx.students.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.t('KLASSEN.keine-schueler'));
}
else if (__VLS_ctx.students.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-content" },
    });
    /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
    if (__VLS_ctx.statusOptions.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "status-summary" },
        });
        /** @type {__VLS_StyleScopedClasses['status-summary']} */ ;
        for (const [status] of __VLS_vFor((__VLS_ctx.statusOptions))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (status.value),
                ...{ class: "status-item" },
                ...{ style: ({ borderLeftColor: status.color || '#ccc' }) },
            });
            /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-label" },
            });
            /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
            (status.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-count" },
            });
            /** @type {__VLS_StyleScopedClasses['status-count']} */ ;
            (__VLS_ctx.countByStatus(status.value));
            // @ts-ignore
            [t, t, t, selectedClassId, selectedClassId, loading, students, students, statusOptions, statusOptions, countByStatus,];
        }
    }
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
    (__VLS_ctx.t('ANWESENHEIT.present'));
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
    (__VLS_ctx.t('SCHUELER.schueler'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "status-col" },
    });
    /** @type {__VLS_StyleScopedClasses['status-col']} */ ;
    (__VLS_ctx.t('ANWESENHEIT.status'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "reason-col" },
    });
    /** @type {__VLS_StyleScopedClasses['reason-col']} */ ;
    (__VLS_ctx.t('ANWESENHEIT.reason'));
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
        if (__VLS_ctx.statusOptions.length > 0) {
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
                            if (!(__VLS_ctx.statusOptions.length > 0))
                                return;
                            __VLS_ctx.setStudentStatus(student.id, status.value);
                            // @ts-ignore
                            [t, t, t, t, students, statusOptions, statusOptions, markAllPresent, saving, setStudentStatus,];
                        } },
                    key: (status.value),
                    ...{ class: (['status-btn', `status-btn-${status.value.toLowerCase()}`, {
                                'active': __VLS_ctx.attendance[student.id]?.status === status.value
                            }]) },
                    ...{ style: (__VLS_ctx.attendance[student.id]?.status === status.value ? {
                            borderColor: status.color || '#667eea',
                            backgroundColor: status.color ? status.color + '22' : '#f0f0f0'
                        } : {}) },
                    disabled: (__VLS_ctx.saving || __VLS_ctx.catalogLoading),
                    title: (status.label),
                });
                /** @type {__VLS_StyleScopedClasses['status-btn']} */ ;
                /** @type {__VLS_StyleScopedClasses['active']} */ ;
                (status.icon || status.short);
                // @ts-ignore
                [saving, attendance, attendance, catalogLoading,];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "status-buttons" },
            });
            /** @type {__VLS_StyleScopedClasses['status-buttons']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
            (__VLS_ctx.t('COMMON.loading'));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "reason-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['reason-cell']} */ ;
        if (__VLS_ctx.attendance[student.id] && [__VLS_ctx.AttendanceStatus.Absent, __VLS_ctx.AttendanceStatus.Excused].includes(__VLS_ctx.attendance[student.id].status)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                value: (__VLS_ctx.attendance[student.id].reason),
                type: "text",
                ...{ class: "reason-input" },
                placeholder: (`${__VLS_ctx.t('ANWESENHEIT.reason')}...`),
                disabled: (__VLS_ctx.saving),
            });
            /** @type {__VLS_StyleScopedClasses['reason-input']} */ ;
        }
        // @ts-ignore
        [t, t, saving, attendance, attendance, attendance, AttendanceStatus, AttendanceStatus,];
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
    (__VLS_ctx.saving ? __VLS_ctx.t('COMMON.loading') : __VLS_ctx.t('COMMON.save'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearAttendance) },
        ...{ class: "btn-secondary" },
        disabled: (!__VLS_ctx.hasAnyAttendance || __VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    (__VLS_ctx.t('COMMON.delete'));
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
[t, t, t, saving, saving, saving, handleSaveAttendance, hasAnyAttendance, hasAnyAttendance, clearAttendance, saveError, saveError, saveSuccess, saveSuccess,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
