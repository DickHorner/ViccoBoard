/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useModal } from '../composables/useModal';
import { getInitials, getTodayDateString, debounce } from '../utils/student';
// State
const students = ref([]);
const classes = ref([]);
const loading = ref(true);
const loadError = ref('');
const searchQuery = ref('');
const showAddModal = ref(false);
const creating = ref(false);
const error = ref('');
const newStudent = ref({
    firstName: '',
    lastName: '',
    classId: '',
    dateOfBirth: '',
    email: ''
});
// Composables
const { SportBridge } = useSportBridge();
const { repository: studentRepository, addStudentUseCase } = useStudents();
// Debounced search for performance
const debouncedSearchQuery = ref('');
const debouncedSearch = debounce((value) => {
    debouncedSearchQuery.value = value;
}, 300);
watch(searchQuery, (newValue) => {
    debouncedSearch(newValue);
});
// Computed
const filteredStudents = computed(() => {
    if (!debouncedSearchQuery.value) {
        return students.value;
    }
    const query = debouncedSearchQuery.value.toLowerCase();
    return students.value.filter(student => student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query));
});
const hasClasses = computed(() => classes.value.length > 0);
const canAddStudent = computed(() => hasClasses.value);
// Methods
const loadStudents = async () => {
    loading.value = true;
    loadError.value = '';
    try {
        const studentRepo = studentRepository.value;
        const classGroupRepo = SportBridge.value?.classGroupRepository;
        if (!studentRepo || !classGroupRepo) {
            throw new Error('Bridges are not initialized');
        }
        students.value = await studentRepo.findAll();
        classes.value = await classGroupRepo.findAll();
    }
    catch (err) {
        console.error('Failed to load students:', err);
        loadError.value = 'Fehler beim Laden der Schüler. Bitte versuchen Sie es erneut.';
    }
    finally {
        loading.value = false;
    }
};
const handleAddStudent = async () => {
    error.value = '';
    creating.value = true;
    try {
        const useCase = addStudentUseCase.value;
        if (!useCase) {
            throw new Error('AddStudentUseCase not available');
        }
        const birthYear = newStudent.value.dateOfBirth
            ? new Date(newStudent.value.dateOfBirth).getFullYear()
            : undefined;
        await useCase.execute({
            firstName: newStudent.value.firstName.trim(),
            lastName: newStudent.value.lastName.trim(),
            classGroupId: newStudent.value.classId,
            birthYear,
            email: newStudent.value.email || undefined
        });
        // Reload students
        await loadStudents();
        // Reset form and close modal
        newStudent.value = {
            firstName: '',
            lastName: '',
            classId: '',
            dateOfBirth: '',
            email: ''
        };
        showAddModal.value = false;
    }
    catch (err) {
        console.error('Failed to add student:', err);
        error.value = err instanceof Error ? err.message : 'Failed to add student. Please try again.';
    }
    finally {
        creating.value = false;
    }
};
const closeAddModal = () => {
    showAddModal.value = false;
    error.value = '';
    newStudent.value = {
        firstName: '',
        lastName: '',
        classId: '',
        dateOfBirth: '',
        email: ''
    };
};
const getClassName = (classId) => {
    const classGroup = classes.value.find(c => c.id === classId);
    return classGroup ? classGroup.name : 'Unbekannte Klasse';
};
const openAddModal = () => {
    if (!hasClasses.value) {
        error.value = 'Erstellen Sie zunächst eine Klasse, bevor Sie Schüler hinzufügen.';
        return;
    }
    showAddModal.value = true;
};
// Enable keyboard accessibility for modal (after function definitions)
useModal(showAddModal, closeAddModal);
// Lifecycle
onMounted(() => {
    loadStudents();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['student-card']} */ ;
/** @type {__VLS_StyleScopedClasses['student-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['student-info']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['controls-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['student-card']} */ ;
/** @type {__VLS_StyleScopedClasses['student-arrow']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "student-list-view" },
});
/** @type {__VLS_StyleScopedClasses['student-list-view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "controls-bar" },
});
/** @type {__VLS_StyleScopedClasses['controls-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "search-bar" },
});
/** @type {__VLS_StyleScopedClasses['search-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: "Nach Name oder ID durchsuchen...",
    ...{ class: "search-input" },
});
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openAddModal) },
    ...{ class: "btn-primary" },
    disabled: (!__VLS_ctx.canAddStudent),
    title: (!__VLS_ctx.canAddStudent ? 'Erstellen Sie zunächst eine Klasse' : 'Neuen Schüler hinzufügen'),
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
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
else if (__VLS_ctx.loadError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.loadError);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.loadStudents) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
else if (__VLS_ctx.students.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    if (!__VLS_ctx.hasClasses) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openAddModal) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.canAddStudent),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
else if (__VLS_ctx.filteredStudents.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.searchQuery);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "student-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['student-grid']} */ ;
    for (const [student] of __VLS_vFor((__VLS_ctx.filteredStudents))) {
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
        if (student.photoUri) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                src: (student.photoUri),
                alt: (student.firstName + ' ' + student.lastName),
            });
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.getInitials(student.firstName, student.lastName));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "student-info" },
        });
        /** @type {__VLS_StyleScopedClasses['student-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (student.firstName);
        (student.lastName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "student-class" },
        });
        /** @type {__VLS_StyleScopedClasses['student-class']} */ ;
        (__VLS_ctx.getClassName(student.classGroupId));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "student-id" },
            title: (`Full ID: ${student.id}`),
        });
        /** @type {__VLS_StyleScopedClasses['student-id']} */ ;
        (student.id.substring(0, 8));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "student-arrow" },
        });
        /** @type {__VLS_StyleScopedClasses['student-arrow']} */ ;
        // @ts-ignore
        [searchQuery, searchQuery, openAddModal, openAddModal, canAddStudent, canAddStudent, canAddStudent, loading, loadError, loadError, loadStudents, students, hasClasses, filteredStudents, filteredStudents, getInitials, getClassName,];
        var __VLS_3;
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.showAddModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeAddModal) },
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeAddModal) },
        ...{ class: "modal-close" },
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
        placeholder: "Vorname eingeben",
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
        placeholder: "Nachname eingeben",
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "classId",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        id: "classId",
        value: (__VLS_ctx.newStudent.classId),
        required: true,
        ...{ class: "form-input" },
        disabled: (!__VLS_ctx.hasClasses),
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.hasClasses ? 'Wählen Sie eine Klasse' : 'Keine Klassen verfügbar');
    for (const [classGroup] of __VLS_vFor((__VLS_ctx.classes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (classGroup.id),
            value: (classGroup.id),
        });
        (classGroup.name);
        // @ts-ignore
        [hasClasses, hasClasses, showAddModal, closeAddModal, closeAddModal, handleAddStudent, newStudent, newStudent, newStudent, classes,];
    }
    if (!__VLS_ctx.hasClasses) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "form-hint error-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['form-hint']} */ ;
        /** @type {__VLS_StyleScopedClasses['error-hint']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "dateOfBirth",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "dateOfBirth",
        type: "date",
        max: (__VLS_ctx.getTodayDateString()),
        ...{ class: "form-input" },
    });
    (__VLS_ctx.newStudent.dateOfBirth);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
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
        placeholder: "schueler@example.de",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.newStudent.email);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    if (__VLS_ctx.error) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.error);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeAddModal) },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (__VLS_ctx.creating),
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.creating ? 'Wird hinzugefügt...' : 'Schüler hinzufügen');
}
// @ts-ignore
[hasClasses, closeAddModal, newStudent, newStudent, getTodayDateString, error, error, creating, creating,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
