/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
const router = useRouter();
const { SportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();
const classes = ref([]);
const selectedClassId = ref('');
const categories = ref([]);
const students = ref([]);
const performanceEntries = ref([]);
const loading = ref(false);
const saving = ref(false);
const showCreateCategoryModal = ref(false);
const newCategory = ref({
    name: '',
    description: '',
    type: '',
    weight: 0
});
onMounted(async () => {
    await loadClasses();
});
async function loadClasses() {
    try {
        classes.value = await SportBridge.value?.classGroupRepository.findAll() ?? [];
    }
    catch (error) {
        console.error('Failed to load classes:', error);
    }
}
async function onClassChange() {
    if (!selectedClassId.value) {
        categories.value = [];
        students.value = [];
        performanceEntries.value = [];
        return;
    }
    loading.value = true;
    try {
        // Load categories, students, and performance entries
        categories.value = await SportBridge.value?.gradeCategoryRepository.findByClassGroup(selectedClassId.value) ?? [];
        students.value = await studentRepository.value?.findByClassGroup(selectedClassId.value) ?? [];
        // Load all performance entries for students in this class in parallel
        const entryPromises = students.value.map((student) => SportBridge.value?.performanceEntryRepository.findByStudent(student.id) ?? Promise.resolve([]));
        const entriesPerStudent = await Promise.all(entryPromises);
        performanceEntries.value = entriesPerStudent.flat();
    }
    catch (error) {
        console.error('Failed to load grading data:', error);
    }
    finally {
        loading.value = false;
    }
}
function getCategoryTypeLabel(type) {
    const labels = {
        criteria: 'Kriterienbasiert',
        time: 'Zeitbasiert',
        cooper: 'Cooper-Test',
        shuttle: 'Shuttle-Run',
        mittelstrecke: 'Mittelstrecke',
        Sportabzeichen: 'Sportabzeichen',
        bjs: 'Bundesjugendspiele',
        verbal: 'Verbal'
    };
    return labels[type] || type;
}
function getStudentGrade(studentId, categoryId) {
    const entry = performanceEntries.value.find(e => e.studentId === studentId && e.categoryId === categoryId);
    return entry?.calculatedGrade || null;
}
function formatGrade(grade) {
    if (grade === null || grade === undefined)
        return '—';
    return String(grade);
}
function openGradingEntry(category) {
    if (category.type === 'criteria') {
        router.push(`/grading/criteria/${category.id}`);
    }
    else if (category.type === 'time') {
        router.push(`/grading/time/${category.id}`);
    }
    else if (category.type === 'cooper') {
        router.push(`/grading/cooper/${category.id}`);
    }
    else if (category.type === 'shuttle') {
        router.push(`/grading/shuttle/${category.id}`);
    }
    else if (category.type === 'mittelstrecke') {
        router.push(`/grading/mittelstrecke/${category.id}`);
    }
    else if (category.type === 'Sportabzeichen') {
        router.push(`/grading/Sportabzeichen/${category.id}`);
    }
    else if (category.type === 'bjs') {
        router.push(`/grading/bjs/${category.id}`);
    }
    else {
        toast.info('Dieser Bewertungstyp wird noch nicht unterstützt.');
    }
}
function viewHistory(category) {
    router.push(`/grading/history/${category.id}`);
}
async function createCategory() {
    if (!selectedClassId.value)
        return;
    if (!newCategory.value.name || !newCategory.value.type)
        return;
    saving.value = true;
    try {
        // Create default configuration based on type
        let configuration;
        if (newCategory.value.type === 'criteria') {
            configuration = {
                type: 'criteria',
                criteria: [],
                allowSelfAssessment: false,
                selfAssessmentViaWOW: false
            };
        }
        else if (newCategory.value.type === 'time') {
            configuration = {
                type: 'time',
                bestGrade: 1,
                worstGrade: 6,
                linearMapping: true,
                adjustableAfterwards: true
            };
        }
        else if (newCategory.value.type === 'cooper') {
            configuration = {
                type: 'cooper',
                SportType: 'running',
                distanceUnit: 'meters',
                autoEvaluation: true
            };
        }
        else if (newCategory.value.type === 'shuttle') {
            configuration = {
                type: 'shuttle',
                autoEvaluation: true
            };
        }
        else if (newCategory.value.type === 'mittelstrecke') {
            configuration = {
                type: 'mittelstrecke',
                autoEvaluation: true
            };
        }
        else if (newCategory.value.type === 'Sportabzeichen') {
            configuration = {
                type: 'Sportabzeichen',
                requiresBirthYear: true,
                ageDependent: true,
                disciplines: [],
                pdfExportEnabled: true
            };
        }
        else if (newCategory.value.type === 'bjs') {
            configuration = {
                type: 'bjs',
                disciplines: [],
                autoGrading: true
            };
        }
        else if (newCategory.value.type === 'verbal') {
            configuration = {
                type: 'verbal',
                fields: [],
                scales: [],
                exportFormat: 'text'
            };
        }
        else {
            throw new Error('Unsupported category type');
        }
        await SportBridge.value?.createGradeCategoryUseCase.execute({
            classGroupId: selectedClassId.value,
            name: newCategory.value.name,
            description: newCategory.value.description || undefined,
            type: newCategory.value.type,
            weight: newCategory.value.weight,
            configuration
        });
        // Reset form
        newCategory.value = { name: '', description: '', type: '', weight: 0 };
        showCreateCategoryModal.value = false;
        // Reload categories
        await onClassChange();
    }
    catch (error) {
        console.error('Failed to create category:', error);
        let userMessage = 'Die Kategorie konnte nicht erstellt werden.';
        if (error instanceof Error) {
            if (error.message === 'Unsupported category type') {
                userMessage = 'Die ausgewählte Bewertungskategorie wird nicht unterstützt. Bitte wählen Sie einen anderen Typ.';
            }
            else if (error.message && error.message.trim().length > 0) {
                userMessage = `Die Kategorie konnte nicht erstellt werden: ${error.message}`;
            }
        }
        toast.error(userMessage);
    }
    finally {
        saving.value = false;
    }
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
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-text']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-text']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-table']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-table']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-table']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['category-card']} */ ;
/** @type {__VLS_StyleScopedClasses['category-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['category-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-table']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-table']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grading-overview-view" },
});
/** @type {__VLS_StyleScopedClasses['grading-overview-view']} */ ;
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
    ...{ class: "grading-content" },
});
/** @type {__VLS_StyleScopedClasses['grading-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-section" },
});
/** @type {__VLS_StyleScopedClasses['form-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.onClassChange) },
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
    [onClassChange, selectedClassId, classes,];
}
if (!__VLS_ctx.selectedClassId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
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
else if (__VLS_ctx.selectedClassId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
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
                if (!!(!__VLS_ctx.selectedClassId))
                    return;
                if (!!(__VLS_ctx.loading))
                    return;
                if (!(__VLS_ctx.selectedClassId))
                    return;
                __VLS_ctx.showCreateCategoryModal = true;
                // @ts-ignore
                [selectedClassId, selectedClassId, loading, showCreateCategoryModal,];
            } },
        ...{ class: "btn-primary btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-content" },
    });
    /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
    if (__VLS_ctx.categories.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "category-list" },
        });
        /** @type {__VLS_StyleScopedClasses['category-list']} */ ;
        for (const [category] of __VLS_vFor((__VLS_ctx.categories))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (category.id),
                ...{ class: "category-card" },
            });
            /** @type {__VLS_StyleScopedClasses['category-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "category-info" },
            });
            /** @type {__VLS_StyleScopedClasses['category-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            (category.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "category-type" },
            });
            /** @type {__VLS_StyleScopedClasses['category-type']} */ ;
            (__VLS_ctx.getCategoryTypeLabel(category.type));
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "category-weight" },
            });
            /** @type {__VLS_StyleScopedClasses['category-weight']} */ ;
            (category.weight);
            if (category.description) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "category-description" },
                });
                /** @type {__VLS_StyleScopedClasses['category-description']} */ ;
                (category.description);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "category-actions" },
            });
            /** @type {__VLS_StyleScopedClasses['category-actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.selectedClassId))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.selectedClassId))
                            return;
                        if (!!(__VLS_ctx.categories.length === 0))
                            return;
                        __VLS_ctx.openGradingEntry(category);
                        // @ts-ignore
                        [categories, categories, getCategoryTypeLabel, openGradingEntry,];
                    } },
                ...{ class: "btn-secondary btn-small" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.selectedClassId))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.selectedClassId))
                            return;
                        if (!!(__VLS_ctx.categories.length === 0))
                            return;
                        __VLS_ctx.viewHistory(category);
                        // @ts-ignore
                        [viewHistory,];
                    } },
                ...{ class: "btn-text btn-small" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-text']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.categories.length > 0 && __VLS_ctx.students.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "card" },
        });
        /** @type {__VLS_StyleScopedClasses['card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-content" },
        });
        /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "progress-table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['progress-table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "progress-table" },
        });
        /** @type {__VLS_StyleScopedClasses['progress-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        for (const [category] of __VLS_vFor((__VLS_ctx.categories))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
                key: (category.id),
                title: (category.name),
            });
            (category.name);
            // @ts-ignore
            [categories, categories, students,];
        }
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
            for (const [category] of __VLS_vFor((__VLS_ctx.categories))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    key: (category.id),
                    ...{ class: "grade-cell" },
                });
                /** @type {__VLS_StyleScopedClasses['grade-cell']} */ ;
                if (__VLS_ctx.getStudentGrade(student.id, category.id)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "grade-value" },
                    });
                    /** @type {__VLS_StyleScopedClasses['grade-value']} */ ;
                    (__VLS_ctx.formatGrade(__VLS_ctx.getStudentGrade(student.id, category.id)));
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "grade-missing" },
                    });
                    /** @type {__VLS_StyleScopedClasses['grade-missing']} */ ;
                }
                // @ts-ignore
                [categories, students, getStudentGrade, getStudentGrade, formatGrade,];
            }
            // @ts-ignore
            [];
        }
    }
}
if (__VLS_ctx.showCreateCategoryModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCreateCategoryModal))
                    return;
                __VLS_ctx.showCreateCategoryModal = false;
                // @ts-ignore
                [showCreateCategoryModal, showCreateCategoryModal,];
            } },
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
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCreateCategoryModal))
                    return;
                __VLS_ctx.showCreateCategoryModal = false;
                // @ts-ignore
                [showCreateCategoryModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.createCategory) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "category-name",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "category-name",
        value: (__VLS_ctx.newCategory.name),
        type: "text",
        required: true,
        placeholder: "z.B. Ausdauer, Technik, Teamfähigkeit",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "category-description",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        id: "category-description",
        value: (__VLS_ctx.newCategory.description),
        rows: "3",
        placeholder: "Optionale Beschreibung...",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "category-type",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        id: "category-type",
        value: (__VLS_ctx.newCategory.type),
        required: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "criteria",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "time",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "cooper",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "shuttle",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "mittelstrecke",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "Sportabzeichen",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "bjs",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "verbal",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "category-weight",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "category-weight",
        type: "number",
        min: "0",
        max: "100",
        required: true,
        placeholder: "0-100",
    });
    (__VLS_ctx.newCategory.weight);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCreateCategoryModal))
                    return;
                __VLS_ctx.showCreateCategoryModal = false;
                // @ts-ignore
                [showCreateCategoryModal, createCategory, newCategory, newCategory, newCategory, newCategory,];
            } },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.saving ? 'Wird erstellt...' : 'Erstellen');
}
// @ts-ignore
[saving, saving,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
