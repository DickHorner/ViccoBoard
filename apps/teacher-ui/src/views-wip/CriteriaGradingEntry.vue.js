/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import { v4 as uuidv4 } from 'uuid';
const route = useRoute();
const { SportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();
const categoryId = route.params.id;
const category = ref(null);
const students = ref([]);
const gradeEntries = ref(new Map());
const comments = ref(new Map());
const loading = ref(true);
const saving = ref(false);
const error = ref(null);
const bulkMode = ref(false);
const hasUnsavedChanges = ref(false);
const unsavedStudents = ref(new Set());
const showAddCriterionModal = ref(false);
const showCommentModal = ref(false);
const currentCommentStudentId = ref(null);
const currentComment = ref('');
const newCriterion = ref({
    name: '',
    description: '',
    minValue: 0,
    maxValue: 10,
    weight: 100
});
const criteria = computed(() => {
    if (!category.value)
        return [];
    const config = category.value.configuration;
    return config.criteria || [];
});
const remainingWeight = computed(() => {
    const totalWeight = criteria.value.reduce((sum, c) => sum + c.weight, 0);
    return Math.max(0, 100 - totalWeight);
});
onMounted(async () => {
    await loadData();
});
async function loadData() {
    loading.value = true;
    error.value = null;
    try {
        // Load category
        category.value = await SportBridge.value.gradeCategoryRepository.read(categoryId);
        if (!category.value) {
            error.value = 'Kategorie nicht gefunden';
            return;
        }
        // Load students
        students.value = await studentRepository.value?.findByClassGroup(category.value.classGroupId) ?? [];
        // Load existing grades
        for (const student of students.value) {
            const entries = await SportBridge.value.performanceEntryRepository
                .findByStudentAndCategory(student.id, categoryId);
            if (entries.length > 0) {
                const latestEntry = entries[entries.length - 1];
                const studentGrades = new Map();
                // Parse measurements
                if (latestEntry.measurements) {
                    Object.entries(latestEntry.measurements).forEach(([criterionId, value]) => {
                        studentGrades.set(criterionId, value);
                    });
                }
                gradeEntries.value.set(student.id, studentGrades);
                if (latestEntry.comment) {
                    comments.value.set(student.id, latestEntry.comment);
                }
            }
        }
    }
    catch (err) {
        console.error('Failed to load grading data:', err);
        error.value = 'Fehler beim Laden der Daten';
    }
    finally {
        loading.value = false;
    }
}
function getGradeValue(studentId, criterionId) {
    const value = gradeEntries.value.get(studentId)?.get(criterionId);
    return value === undefined ? '' : value;
}
function onGradeChange(studentId, criterionId, rawValue) {
    // Mark student as having unsaved changes
    hasUnsavedChanges.value = true;
    unsavedStudents.value.add(studentId);
    // Derive numeric value from various possible input forms
    let value;
    if (typeof rawValue === 'number') {
        value = rawValue;
    }
    else if (typeof rawValue === 'string') {
        const parsed = Number(rawValue);
        value = Number.isNaN(parsed) ? undefined : parsed;
    }
    else if (rawValue && typeof rawValue === 'object' && 'target' in rawValue) {
        const eventTarget = rawValue.target;
        if (eventTarget && typeof eventTarget.value === 'string') {
            const parsed = Number(eventTarget.value);
            value = Number.isNaN(parsed) ? undefined : parsed;
        }
    }
    // Ensure there is a grade map for this student
    let studentGrades = gradeEntries.value.get(studentId);
    if (!studentGrades) {
        studentGrades = new Map();
        gradeEntries.value.set(studentId, studentGrades);
    }
    // Update or remove the grade entry for this criterion
    if (value === undefined) {
        studentGrades.delete(criterionId);
    }
    else {
        studentGrades.set(criterionId, value);
    }
}
function hasUnsavedChangesForStudent(studentId) {
    return unsavedStudents.value.has(studentId);
}
function calculateTotal(studentId) {
    const studentGrades = gradeEntries.value.get(studentId);
    if (!studentGrades)
        return 0;
    let total = 0;
    for (const criterion of criteria.value) {
        const value = studentGrades.get(criterion.id) || 0;
        total += value * (criterion.weight / 100);
    }
    return total;
}
const DEFAULT_GRADING_THRESHOLDS = [
    { minPercentage: 92, grade: '1' },
    { minPercentage: 81, grade: '2' },
    { minPercentage: 67, grade: '3' },
    { minPercentage: 50, grade: '4' },
    { minPercentage: 30, grade: '5' },
    { minPercentage: 0, grade: '6' }
];
function calculateGrade(studentId) {
    const total = calculateTotal(studentId);
    // Determine the maximum possible weighted score based on criteria
    const maxPossible = criteria.value.reduce((sum, c) => sum + (c.maxValue * (c.weight / 100)), 0);
    if (maxPossible === 0)
        return '—';
    const percentage = (total / maxPossible) * 100;
    // Allow category-specific grading scales when available, otherwise fall back to default
    const categoryGradingScale = category.value?.gradingScale;
    const gradingScale = categoryGradingScale && categoryGradingScale.length > 0
        ? categoryGradingScale
        : DEFAULT_GRADING_THRESHOLDS;
    for (const threshold of gradingScale) {
        if (percentage >= threshold.minPercentage) {
            return threshold.grade;
        }
    }
    // Fallback: return the lowest grade defined in the scale
    return gradingScale[gradingScale.length - 1]?.grade ?? '—';
}
async function saveStudentGrade(studentId) {
    if (!unsavedStudents.value.has(studentId))
        return;
    const studentGrades = gradeEntries.value.get(studentId);
    if (!studentGrades)
        return;
    saving.value = true;
    try {
        const measurements = {};
        studentGrades.forEach((value, criterionId) => {
            measurements[criterionId] = value;
        });
        await SportBridge.value.recordGradeUseCase.execute({
            studentId,
            categoryId,
            measurements,
            calculatedGrade: calculateGrade(studentId),
            comment: comments.value.get(studentId)
        });
        unsavedStudents.value.delete(studentId);
        if (unsavedStudents.value.size === 0) {
            hasUnsavedChanges.value = false;
        }
    }
    catch (err) {
        console.error('Failed to save grade:', err);
        toast.error('Fehler beim Speichern der Note');
    }
    finally {
        saving.value = false;
    }
}
async function saveAllGrades() {
    saving.value = true;
    try {
        for (const studentId of unsavedStudents.value) {
            await saveStudentGrade(studentId);
        }
        toast.success('Alle Noten gespeichert!');
    }
    catch (err) {
        console.error('Failed to save all grades:', err);
        toast.error('Fehler beim Speichern einiger Noten');
    }
    finally {
        saving.value = false;
    }
}
async function addCriterion() {
    if (!newCriterion.value.name || !category.value)
        return;
    if (newCriterion.value.weight > remainingWeight.value) {
        toast.warning(`Die Gewichtung darf ${remainingWeight.value}% nicht überschreiten.`);
        return;
    }
    // Validate minValue < maxValue
    if (newCriterion.value.minValue >= newCriterion.value.maxValue) {
        toast.error('Der Minimalwert muss kleiner als der Maximalwert sein.');
        return;
    }
    saving.value = true;
    try {
        const config = category.value.configuration;
        const updatedCriteria = [
            ...config.criteria,
            {
                id: uuidv4(),
                name: newCriterion.value.name,
                description: newCriterion.value.description || undefined,
                weight: newCriterion.value.weight,
                minValue: newCriterion.value.minValue,
                maxValue: newCriterion.value.maxValue
            }
        ];
        const updatedConfig = {
            ...config,
            criteria: updatedCriteria
        };
        const updatedCategory = {
            ...category.value,
            configuration: updatedConfig,
            lastModified: new Date()
        };
        await SportBridge.value.gradeCategoryRepository.update(category.value.id, updatedCategory);
        category.value = updatedCategory;
        // Reset form
        newCriterion.value = {
            name: '',
            description: '',
            minValue: 0,
            maxValue: 10,
            weight: 100
        };
        showAddCriterionModal.value = false;
    }
    catch (err) {
        console.error('Failed to add criterion:', err);
        toast.error('Fehler beim Hinzufügen des Kriteriums');
    }
    finally {
        saving.value = false;
    }
}
async function removeCriterion(index) {
    if (!category.value)
        return;
    if (!confirm('Möchten Sie dieses Kriterium wirklich entfernen?'))
        return;
    saving.value = true;
    try {
        const config = category.value.configuration;
        const updatedCriteria = config.criteria.filter((_, i) => i !== index);
        const updatedConfig = {
            ...config,
            criteria: updatedCriteria
        };
        const updatedCategory = {
            ...category.value,
            configuration: updatedConfig,
            lastModified: new Date()
        };
        await SportBridge.value.gradeCategoryRepository.update(category.value.id, updatedCategory);
        category.value = updatedCategory;
    }
    catch (err) {
        console.error('Failed to remove criterion:', err);
        toast.error('Fehler beim Entfernen des Kriteriums');
    }
    finally {
        saving.value = false;
    }
}
function toggleBulkMode() {
    toast.info('Der Bulk-Modus ist derzeit nicht verfügbar.');
}
function addComment(studentId) {
    currentCommentStudentId.value = studentId;
    currentComment.value = comments.value.get(studentId) || '';
    showCommentModal.value = true;
}
async function saveComment() {
    if (!currentCommentStudentId.value)
        return;
    comments.value.set(currentCommentStudentId.value, currentComment.value);
    unsavedStudents.value.add(currentCommentStudentId.value);
    hasUnsavedChanges.value = true;
    await saveStudentGrade(currentCommentStudentId.value);
    showCommentModal.value = false;
    currentCommentStudentId.value = null;
    currentComment.value = '';
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['criterion-info']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grade-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-text']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grade-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "criteria-grading-view" },
});
/** @type {__VLS_StyleScopedClasses['criteria-grading-view']} */ ;
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
(__VLS_ctx.category?.name || 'Kriterienbasierte Bewertung');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
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
else if (__VLS_ctx.category) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grading-content" },
    });
    /** @type {__VLS_StyleScopedClasses['grading-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card category-info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    /** @type {__VLS_StyleScopedClasses['category-info-card']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.category.weight);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.criteria.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "criteria-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['criteria-actions']} */ ;
    if (__VLS_ctx.criteria.length < 8) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.category))
                        return;
                    if (!(__VLS_ctx.criteria.length < 8))
                        return;
                    __VLS_ctx.showAddCriterionModal = true;
                    // @ts-ignore
                    [category, category, category, loading, error, error, loadData, criteria, criteria, showAddCriterionModal,];
                } },
            ...{ class: "btn-secondary btn-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    }
    if (__VLS_ctx.criteria.length >= 8) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "info-note" },
        });
        /** @type {__VLS_StyleScopedClasses['info-note']} */ ;
    }
    if (__VLS_ctx.criteria.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "criteria-list" },
        });
        /** @type {__VLS_StyleScopedClasses['criteria-list']} */ ;
        for (const [criterion, index] of __VLS_vFor((__VLS_ctx.criteria))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (criterion.id),
                ...{ class: "criterion-item" },
            });
            /** @type {__VLS_StyleScopedClasses['criterion-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "criterion-info" },
            });
            /** @type {__VLS_StyleScopedClasses['criterion-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (criterion.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "criterion-range" },
            });
            /** @type {__VLS_StyleScopedClasses['criterion-range']} */ ;
            (criterion.minValue);
            (criterion.maxValue);
            (criterion.weight);
            if (criterion.description) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "criterion-description" },
                });
                /** @type {__VLS_StyleScopedClasses['criterion-description']} */ ;
                (criterion.description);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.criteria.length > 0))
                            return;
                        __VLS_ctx.removeCriterion(index);
                        // @ts-ignore
                        [criteria, criteria, criteria, removeCriterion,];
                    } },
                ...{ class: "btn-danger-text btn-small" },
                disabled: (__VLS_ctx.saving),
            });
            /** @type {__VLS_StyleScopedClasses['btn-danger-text']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
            // @ts-ignore
            [saving,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state-small" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    if (__VLS_ctx.criteria.length > 0 && __VLS_ctx.students.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "card" },
        });
        /** @type {__VLS_StyleScopedClasses['card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "header-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.toggleBulkMode) },
            ...{ class: "btn-secondary btn-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        (__VLS_ctx.bulkMode ? 'Einzelmodus' : 'Bulk-Modus');
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.saveAllGrades) },
            ...{ class: "btn-primary btn-small" },
            disabled: (__VLS_ctx.saving || !__VLS_ctx.hasUnsavedChanges),
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        (__VLS_ctx.saving ? 'Speichern...' : 'Alle speichern');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-content" },
        });
        /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "info-note" },
        });
        /** @type {__VLS_StyleScopedClasses['info-note']} */ ;
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "student-col" },
        });
        /** @type {__VLS_StyleScopedClasses['student-col']} */ ;
        for (const [criterion] of __VLS_vFor((__VLS_ctx.criteria))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
                key: (criterion.id),
                ...{ class: "criterion-col" },
                title: (criterion.name),
            });
            /** @type {__VLS_StyleScopedClasses['criterion-col']} */ ;
            (criterion.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "col-subtitle" },
            });
            /** @type {__VLS_StyleScopedClasses['col-subtitle']} */ ;
            (criterion.minValue);
            (criterion.maxValue);
            // @ts-ignore
            [criteria, criteria, saving, saving, students, toggleBulkMode, bulkMode, saveAllGrades, hasUnsavedChanges,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "total-col" },
        });
        /** @type {__VLS_StyleScopedClasses['total-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "grade-col" },
        });
        /** @type {__VLS_StyleScopedClasses['grade-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "actions-col" },
        });
        /** @type {__VLS_StyleScopedClasses['actions-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [student] of __VLS_vFor((__VLS_ctx.students))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (student.id),
                ...{ class: ({ 'highlight-row': __VLS_ctx.hasUnsavedChangesForStudent(student.id) }) },
            });
            /** @type {__VLS_StyleScopedClasses['highlight-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "student-name" },
            });
            /** @type {__VLS_StyleScopedClasses['student-name']} */ ;
            (student.firstName);
            (student.lastName);
            for (const [criterion] of __VLS_vFor((__VLS_ctx.criteria))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                    key: (criterion.id),
                    ...{ class: "input-cell" },
                });
                /** @type {__VLS_StyleScopedClasses['input-cell']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ onInput: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.error))
                                return;
                            if (!(__VLS_ctx.category))
                                return;
                            if (!(__VLS_ctx.criteria.length > 0 && __VLS_ctx.students.length > 0))
                                return;
                            __VLS_ctx.onGradeChange(student.id, criterion.id, $event.target.value);
                            // @ts-ignore
                            [criteria, students, hasUnsavedChangesForStudent, onGradeChange,];
                        } },
                    ...{ onBlur: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.error))
                                return;
                            if (!(__VLS_ctx.category))
                                return;
                            if (!(__VLS_ctx.criteria.length > 0 && __VLS_ctx.students.length > 0))
                                return;
                            __VLS_ctx.saveStudentGrade(student.id);
                            // @ts-ignore
                            [saveStudentGrade,];
                        } },
                    type: "number",
                    min: (criterion.minValue),
                    max: (criterion.maxValue),
                    step: (0.5),
                    value: (__VLS_ctx.getGradeValue(student.id, criterion.id)),
                    ...{ class: "grade-input" },
                    disabled: (__VLS_ctx.saving),
                });
                /** @type {__VLS_StyleScopedClasses['grade-input']} */ ;
                // @ts-ignore
                [saving, getGradeValue,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "total-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['total-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.calculateTotal(student.id).toFixed(1));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "grade-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['grade-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "calculated-grade" },
            });
            /** @type {__VLS_StyleScopedClasses['calculated-grade']} */ ;
            (__VLS_ctx.calculateGrade(student.id));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "actions-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['actions-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.criteria.length > 0 && __VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.addComment(student.id);
                        // @ts-ignore
                        [calculateTotal, calculateGrade, addComment,];
                    } },
                ...{ class: "btn-text-small" },
                title: ('Kommentar hinzufügen'),
            });
            /** @type {__VLS_StyleScopedClasses['btn-text-small']} */ ;
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.students.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "card" },
        });
        /** @type {__VLS_StyleScopedClasses['card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
}
if (__VLS_ctx.showAddCriterionModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAddCriterionModal))
                    return;
                __VLS_ctx.showAddCriterionModal = false;
                // @ts-ignore
                [showAddCriterionModal, showAddCriterionModal, students,];
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
                if (!(__VLS_ctx.showAddCriterionModal))
                    return;
                __VLS_ctx.showAddCriterionModal = false;
                // @ts-ignore
                [showAddCriterionModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.addCriterion) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "criterion-name",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "criterion-name",
        value: (__VLS_ctx.newCriterion.name),
        type: "text",
        required: true,
        placeholder: "z.B. Technik, Taktik, Teamwork",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "criterion-description",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        id: "criterion-description",
        value: (__VLS_ctx.newCriterion.description),
        rows: "2",
        placeholder: "Optionale Beschreibung...",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "criterion-min",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "criterion-min",
        type: "number",
        required: true,
        min: "0",
    });
    (__VLS_ctx.newCriterion.minValue);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "criterion-max",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "criterion-max",
        type: "number",
        required: true,
        min: "0",
    });
    (__VLS_ctx.newCriterion.maxValue);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "criterion-weight",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "criterion-weight",
        type: "number",
        min: "0",
        max: "100",
        required: true,
        placeholder: "0-100",
    });
    (__VLS_ctx.newCriterion.weight);
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    (__VLS_ctx.remainingWeight);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAddCriterionModal))
                    return;
                __VLS_ctx.showAddCriterionModal = false;
                // @ts-ignore
                [showAddCriterionModal, addCriterion, newCriterion, newCriterion, newCriterion, newCriterion, newCriterion, remainingWeight,];
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
    (__VLS_ctx.saving ? 'Hinzufügen...' : 'Hinzufügen');
}
if (__VLS_ctx.showCommentModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCommentModal))
                    return;
                __VLS_ctx.showCommentModal = false;
                // @ts-ignore
                [saving, saving, showCommentModal, showCommentModal,];
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
                if (!(__VLS_ctx.showCommentModal))
                    return;
                __VLS_ctx.showCommentModal = false;
                // @ts-ignore
                [showCommentModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.saveComment) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "comment-text",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        id: "comment-text",
        value: (__VLS_ctx.currentComment),
        rows: "5",
        placeholder: "Fügen Sie einen Kommentar hinzu...",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCommentModal))
                    return;
                __VLS_ctx.showCommentModal = false;
                // @ts-ignore
                [showCommentModal, saveComment, currentComment,];
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
    (__VLS_ctx.saving ? 'Speichern...' : 'Speichern');
}
// @ts-ignore
[saving, saving,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
