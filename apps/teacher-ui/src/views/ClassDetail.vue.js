/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
// @ts-nocheck
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { initializeSportBridge, useClassGroups } from '../composables/useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge';
const route = useRoute();
// State
const classId = route.params.id;
const classGroup = ref(null);
const students = ref([]);
const loading = ref(false);
const loadingStudents = ref(false);
const error = ref('');
const showAddStudentModal = ref(false);
const addingStudent = ref(false);
const addStudentError = ref('');
const showEditModal = ref(false);
const statistics = ref({
    attendanceRate: 0,
    totalLessons: 0,
    assessmentCount: 0
});
const newStudent = ref({
    firstName: '',
    lastName: '',
    birthYear: undefined,
    gender: '',
    email: ''
});
initializeSportBridge();
initializeStudentsBridge();
// Composables
const classGroups = useClassGroups();
const studentsBridge = getStudentsBridge();
// Methods
const loadData = async () => {
    loading.value = true;
    error.value = '';
    try {
        // Load class details
        classGroup.value = await classGroups.findById(classId);
        if (!classGroup.value) {
            error.value = 'Klasse nicht gefunden';
            return;
        }
        // Load students for this class
        students.value = await studentsBridge.studentRepository.findByClassGroup(classId);
    }
    catch (err) {
        console.error('Failed to load class:', err);
        error.value = 'Fehler beim Laden der Klasse. Bitte versuchen Sie es erneut.';
    }
    finally {
        loading.value = false;
    }
};
const handleAddStudent = async () => {
    addStudentError.value = '';
    addingStudent.value = true;
    try {
        await studentsBridge.addStudentUseCase.execute({
            firstName: newStudent.value.firstName.trim(),
            lastName: newStudent.value.lastName.trim(),
            classGroupId: classId,
            birthYear: newStudent.value.birthYear,
            gender: newStudent.value.gender || undefined,
            email: newStudent.value.email.trim() || undefined
        });
        // Reload students
        students.value = await studentsBridge.studentRepository.findByClassGroup(classId);
        // Reset form and close modal
        closeAddStudentModal();
    }
    catch (err) {
        console.error('Failed to add student:', err);
        if (err instanceof Error) {
            addStudentError.value = err.message;
        }
        else {
            addStudentError.value = 'Fehler beim Hinzufügen des Schülers. Bitte versuchen Sie es erneut.';
        }
    }
    finally {
        addingStudent.value = false;
    }
};
const closeAddStudentModal = () => {
    showAddStudentModal.value = false;
    addStudentError.value = '';
    newStudent.value = { firstName: '', lastName: '', birthYear: undefined, gender: '', email: '' };
};
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('de-DE');
};
const getGradingSchemeDisplay = () => {
    return classGroup.value?.gradingScheme || 'Standard';
};
const getClassColorStyle = (color) => {
    if (!color) {
        return { backgroundColor: '#e0e0e0' };
    }
    const colorMap = {
        white: '#f8f9fa',
        green: '#7ed957',
        red: '#ff6b6b',
        blue: '#4dabf7',
        orange: '#ffa94d',
        yellow: '#ffd43b',
        grey: '#adb5bd'
    };
    return { backgroundColor: colorMap[color] || '#e0e0e0' };
};
const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};
// Lifecycle
onMounted(() => {
    loadData();
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
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['student-card']} */ ;
/** @type {__VLS_StyleScopedClasses['student-info']} */ ;
/** @type {__VLS_StyleScopedClasses['student-info']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['class-info']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['header-content']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "class-detail-view" },
});
/** @type {__VLS_StyleScopedClasses['class-detail-view']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-content" },
});
/** @type {__VLS_StyleScopedClasses['header-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "class-title" },
});
/** @type {__VLS_StyleScopedClasses['class-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "class-color" },
    ...{ style: (__VLS_ctx.getClassColorStyle(__VLS_ctx.classGroup?.color)) },
});
/** @type {__VLS_StyleScopedClasses['class-color']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.classGroup?.name || 'Wird geladen...');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
if (__VLS_ctx.classGroup) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.classGroup))
                    return;
                __VLS_ctx.showEditModal = true;
                // @ts-ignore
                [getClassColorStyle, classGroup, classGroup, classGroup, showEditModal,];
            } },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
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
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.error);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.loadData) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
else if (__VLS_ctx.classGroup) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "class-info" },
    });
    /** @type {__VLS_StyleScopedClasses['class-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.classGroup.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.classGroup.schoolYear);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.students.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.getGradingSchemeDisplay());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.classGroup.archived ? 'Archiviert' : 'Aktiv');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.formatDate(__VLS_ctx.classGroup.createdAt));
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.classGroup))
                    return;
                __VLS_ctx.showAddStudentModal = true;
                // @ts-ignore
                [classGroup, classGroup, classGroup, classGroup, classGroup, loading, error, error, loadData, students, getGradingSchemeDisplay, formatDate, showAddStudentModal,];
            } },
        ...{ class: "btn-primary btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-content" },
    });
    /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
    if (__VLS_ctx.loadingStudents) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-state-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spinner-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else if (__VLS_ctx.students.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "student-list" },
        });
        /** @type {__VLS_StyleScopedClasses['student-list']} */ ;
        for (const [student] of __VLS_vFor((__VLS_ctx.students))) {
            let __VLS_0;
            /** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                key: (student.id),
                to: (`/students/${student.id}`),
                ...{ class: "student-card" },
            }));
            const __VLS_2 = __VLS_1({
                key: (student.id),
                to: (`/students/${student.id}`),
                ...{ class: "student-card" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            /** @type {__VLS_StyleScopedClasses['student-card']} */ ;
            const { default: __VLS_5 } = __VLS_3.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "student-avatar" },
            });
            /** @type {__VLS_StyleScopedClasses['student-avatar']} */ ;
            (__VLS_ctx.getInitials(student.firstName, student.lastName));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "student-info" },
            });
            /** @type {__VLS_StyleScopedClasses['student-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            (student.firstName);
            (student.lastName);
            if (student.birthYear) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
                (student.birthYear);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "student-arrow" },
            });
            /** @type {__VLS_StyleScopedClasses['student-arrow']} */ ;
            // @ts-ignore
            [students, students, loadingStudents, getInitials,];
            var __VLS_3;
            // @ts-ignore
            [];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-content" },
    });
    /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "info-note" },
    });
    /** @type {__VLS_StyleScopedClasses['info-note']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stats-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.statistics.attendanceRate);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.statistics.totalLessons);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.statistics.assessmentCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-content" },
    });
    /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
    let __VLS_6;
    /** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        to: (`/attendance?classId=${__VLS_ctx.classGroup.id}`),
        ...{ class: "action-button" },
    }));
    const __VLS_8 = __VLS_7({
        to: (`/attendance?classId=${__VLS_ctx.classGroup.id}`),
        ...{ class: "action-button" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['action-button']} */ ;
    const { default: __VLS_11 } = __VLS_9.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "action-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['action-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    // @ts-ignore
    [classGroup, statistics, statistics, statistics,];
    var __VLS_9;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.classGroup))
                    return;
                __VLS_ctx.showEditModal = true;
                // @ts-ignore
                [showEditModal,];
            } },
        ...{ class: "action-button" },
    });
    /** @type {__VLS_StyleScopedClasses['action-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "action-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['action-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
if (__VLS_ctx.showAddStudentModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeAddStudentModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.classGroup?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeAddStudentModal) },
        ...{ class: "modal-close" },
        'aria-label': "Dialog schließen",
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.handleAddStudent) },
        ...{ class: "modal-form" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "firstName",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "firstName",
        value: (__VLS_ctx.newStudent.firstName),
        type: "text",
        placeholder: "z.B. Max",
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "lastName",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "lastName",
        value: (__VLS_ctx.newStudent.lastName),
        type: "text",
        placeholder: "z.B. Mustermann",
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "birthYear",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "birthYear",
        type: "number",
        placeholder: "z.B. 2010",
        min: "1900",
        max: (new Date().getFullYear()),
        ...{ class: "form-input" },
    });
    (__VLS_ctx.newStudent.birthYear);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "gender",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        id: "gender",
        value: (__VLS_ctx.newStudent.gender),
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "male",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "female",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "diverse",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "email",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "email",
        type: "email",
        placeholder: "z.B. max@schule.de",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.newStudent.email);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    if (__VLS_ctx.addStudentError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.addStudentError);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeAddStudentModal) },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (__VLS_ctx.addingStudent),
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.addingStudent ? 'Wird hinzugefügt...' : 'Schüler hinzufügen');
}
// @ts-ignore
[classGroup, showAddStudentModal, closeAddStudentModal, closeAddStudentModal, closeAddStudentModal, handleAddStudent, newStudent, newStudent, newStudent, newStudent, newStudent, addStudentError, addStudentError, addingStudent, addingStudent,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
