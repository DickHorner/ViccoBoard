/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import { useExamsBridge } from '../composables/useExamsBridge';
// ============================================================================
// Router
// ============================================================================
const router = useRouter();
const route = useRoute();
const { examRepository } = useExamsBridge();
const formData = reactive({
    title: '',
    description: '',
    tasks: []
});
const errors = reactive({});
const isSaving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const isEditing = computed(() => !!route.params.id);
// ============================================================================
// Computed Properties
// ============================================================================
const totalPoints = computed(() => formData.tasks.reduce((sum, task) => sum + (task.points || 0), 0));
const totalPointsWithBonus = computed(() => formData.tasks.reduce((sum, task) => sum + (task.points || 0) + (task.bonusPoints || 0), 0));
const tasksWithCriteria = computed(() => formData.tasks.filter(task => task.criteria.length > 0).length);
const canAddTask = computed(() => {
    // Can add task if current tasks are valid
    return !formData.tasks.some(task => !task.title?.trim() || task.points < 0);
});
const canSave = computed(() => {
    return (formData.title.trim().length > 0 &&
        formData.tasks.length > 0 &&
        formData.tasks.every(task => task.title?.trim().length > 0 && task.points >= 0) &&
        !Object.values(errors).some(e => e !== undefined));
});
// ============================================================================
// Methods - Initialization
// ============================================================================
const createNewTask = () => ({
    id: uuidv4(),
    title: `Task ${formData.tasks.length + 1}`,
    points: 0,
    bonusPoints: 0,
    isChoice: false,
    criteria: []
});
const createNewCriterion = () => ({
    id: uuidv4(),
    text: '',
    points: 0
});
onMounted(async () => {
    if (isEditing.value && route.params.id) {
        try {
            if (!examRepository) {
                console.error('Exam repository is not available');
                errorMessage.value = 'Unable to load exam for editing. Please try again later.';
                return;
            }
            const examId = route.params.id;
            const exam = await examRepository.findById(examId);
            if (exam && exam.mode === 'simple') {
                formData.title = exam.title;
                formData.description = exam.description || '';
                // Convert exam structure back to draft format
                formData.tasks = exam.structure.tasks.map(task => ({
                    id: task.id,
                    title: task.title,
                    points: task.points,
                    bonusPoints: task.bonusPoints || 0,
                    isChoice: task.isChoice,
                    criteria: task.criteria.map(crit => ({
                        id: crit.id,
                        text: crit.text,
                        points: crit.points
                    }))
                }));
            }
        }
        catch (err) {
            console.error('Failed to load exam:', err);
            errorMessage.value = 'Failed to load exam for editing';
        }
    }
});
// ============================================================================
// Methods - Task Management
// ============================================================================
const addTask = () => {
    formData.tasks.push(createNewTask());
};
const removeTask = (index) => {
    formData.tasks.splice(index, 1);
};
// ============================================================================
// Methods - Criterion Management
// ============================================================================
const addCriterion = (taskIndex) => {
    const task = formData.tasks[taskIndex];
    if (task) {
        task.criteria.push(createNewCriterion());
    }
};
const removeCriterion = (taskIndex, criterionIndex) => {
    const task = formData.tasks[taskIndex];
    if (task) {
        task.criteria.splice(criterionIndex, 1);
    }
};
// ============================================================================
// Methods - Validation
// ============================================================================
const validateTitle = () => {
    errors.title = undefined;
    if (!formData.title.trim()) {
        errors.title = 'Exam title is required';
    }
};
const validateTaskTitle = (index) => {
    if (!errors.tasks)
        errors.tasks = [];
    if (!errors.tasks[index])
        errors.tasks[index] = {};
    const task = formData.tasks[index];
    if (!task.title?.trim()) {
        errors.tasks[index].title = 'Task title is required';
    }
    else {
        errors.tasks[index].title = undefined;
    }
};
const validateTaskPoints = (index) => {
    if (!errors.tasks)
        errors.tasks = [];
    if (!errors.tasks[index])
        errors.tasks[index] = {};
    const task = formData.tasks[index];
    if (task.points < 0) {
        errors.tasks[index].points = 'Points cannot be negative';
    }
    else {
        errors.tasks[index].points = undefined;
    }
};
const validateTaskBonusPoints = (index) => {
    if (!errors.tasks)
        errors.tasks = [];
    if (!errors.tasks[index])
        errors.tasks[index] = {};
    const task = formData.tasks[index];
    if (task.bonusPoints < 0) {
        errors.tasks[index].bonusPoints = 'Bonus points cannot be negative';
    }
    else {
        errors.tasks[index].bonusPoints = undefined;
    }
};
const validateCriterion = (taskIndex, criterionIndex) => {
    const criterion = formData.tasks[taskIndex]?.criteria[criterionIndex];
    if (criterion && criterion.points < 0) {
        // Mark as error (could add to errors object if needed)
        console.warn('Criterion points cannot be negative');
    }
};
// ============================================================================
// Methods - Save & Cancel
// ============================================================================
const saveExam = async () => {
    // Clear previous messages
    errorMessage.value = '';
    successMessage.value = '';
    // Validate before save
    validateTitle();
    formData.tasks.forEach((_, index) => {
        validateTaskTitle(index);
        validateTaskPoints(index);
        validateTaskBonusPoints(index);
    });
    if (!canSave.value) {
        errorMessage.value = 'Please fix the errors above before saving';
        return;
    }
    isSaving.value = true;
    try {
        const tasks = formData.tasks.map((task, index) => ({
            id: task.id,
            level: 1,
            order: index + 1,
            title: task.title.trim(),
            points: task.points,
            bonusPoints: task.bonusPoints || 0,
            isChoice: task.isChoice,
            criteria: task.criteria.map(crit => ({
                id: crit.id,
                text: crit.text.trim() || 'Criterion',
                formatting: {},
                points: crit.points,
                aspectBased: false
            })),
            allowComments: false,
            allowSupportTips: false,
            commentBoxEnabled: false,
            subtasks: []
        }));
        if (!examRepository) {
            throw new Error('Exam repository is not initialized');
        }
        const exam = {
            id: isEditing.value ? route.params.id : uuidv4(),
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            mode: 'simple',
            structure: {
                parts: [],
                tasks,
                allowsComments: false,
                allowsSupportTips: false,
                totalPoints: totalPoints.value
            },
            gradingKey: {
                id: uuidv4(),
                name: 'default',
                type: 'percentage',
                totalPoints: totalPoints.value,
                gradeBoundaries: [],
                roundingRule: { type: 'nearest', decimalPlaces: 1 },
                errorPointsToGrade: false,
                customizable: true,
                modifiedAfterCorrection: false
            },
            printPresets: [],
            candidates: [],
            status: 'draft',
            createdAt: new Date(),
            lastModified: new Date()
        };
        // Save via repository
        if (isEditing.value) {
            await examRepository.update(exam.id, exam);
            successMessage.value = 'Exam updated successfully!';
        }
        else {
            await examRepository.create(exam);
            successMessage.value = 'Exam created successfully!';
        }
        // Clear errors and navigate back after a short delay
        setTimeout(() => {
            router.back();
        }, 1500);
    }
    catch (err) {
        console.error('Failed to save exam:', err);
        errorMessage.value = `Failed to save exam: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
    finally {
        isSaving.value = false;
    }
};
const cancelEdit = () => {
    router.back();
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['builder-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['task-title-input']} */ ;
/** @type {__VLS_StyleScopedClasses['criteria-header']} */ ;
/** @type {__VLS_StyleScopedClasses['criterion-input']} */ ;
/** @type {__VLS_StyleScopedClasses['criterion-points-input']} */ ;
/** @type {__VLS_StyleScopedClasses['structure-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-small']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-section']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['simple-exam-builder']} */ ;
/** @type {__VLS_StyleScopedClasses['task-header']} */ ;
/** @type {__VLS_StyleScopedClasses['task-details']} */ ;
/** @type {__VLS_StyleScopedClasses['criterion-row']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-section']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-section']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "simple-exam-builder" },
});
/** @type {__VLS_StyleScopedClasses['simple-exam-builder']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "builder-header" },
});
/** @type {__VLS_StyleScopedClasses['builder-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
(__VLS_ctx.isEditing ? 'Edit Exam' : 'Create Simple Exam');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "subtitle" },
});
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "section exam-details" },
});
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['exam-details']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    for: "exam-title",
    ...{ class: "label-required" },
});
/** @type {__VLS_StyleScopedClasses['label-required']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onBlur: (__VLS_ctx.validateTitle) },
    id: "exam-title",
    value: (__VLS_ctx.formData.title),
    type: "text",
    placeholder: "e.g., Math Quiz, Biology Test",
    ...{ class: "form-input" },
});
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
if (__VLS_ctx.errors.title) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error-message" },
    });
    /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
    (__VLS_ctx.errors.title);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    for: "exam-description",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    id: "exam-description",
    value: (__VLS_ctx.formData.description),
    placeholder: "Add notes about this exam",
    ...{ class: "form-textarea" },
    rows: "3",
});
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "section tasks-section" },
});
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['tasks-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-header" },
});
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addTask) },
    ...{ class: "btn btn-primary btn-sm" },
    disabled: (!__VLS_ctx.canAddTask),
});
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
if (__VLS_ctx.formData.tasks.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "task-list" },
    });
    /** @type {__VLS_StyleScopedClasses['task-list']} */ ;
    for (const [task, taskIndex] of __VLS_vFor((__VLS_ctx.formData.tasks))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (task.id),
            ...{ class: "task-card" },
        });
        /** @type {__VLS_StyleScopedClasses['task-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "task-header" },
        });
        /** @type {__VLS_StyleScopedClasses['task-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "task-number" },
        });
        /** @type {__VLS_StyleScopedClasses['task-number']} */ ;
        (taskIndex + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onBlur: (...[$event]) => {
                    if (!!(__VLS_ctx.formData.tasks.length === 0))
                        return;
                    __VLS_ctx.validateTaskTitle(taskIndex);
                    // @ts-ignore
                    [isEditing, validateTitle, formData, formData, formData, formData, errors, errors, addTask, canAddTask, validateTaskTitle,];
                } },
            value: (task.title),
            type: "text",
            placeholder: "Task title (e.g., Task 1, Task 2a)",
            ...{ class: "task-title-input" },
        });
        /** @type {__VLS_StyleScopedClasses['task-title-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.formData.tasks.length === 0))
                        return;
                    __VLS_ctx.removeTask(taskIndex);
                    // @ts-ignore
                    [removeTask,];
                } },
            ...{ class: "btn btn-danger btn-sm" },
            title: (`Remove task ${taskIndex + 1}`),
        });
        /** @type {__VLS_StyleScopedClasses['btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "task-details" },
        });
        /** @type {__VLS_StyleScopedClasses['task-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            for: (`task-points-${taskIndex}`),
            ...{ class: "label-required" },
        });
        /** @type {__VLS_StyleScopedClasses['label-required']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onBlur: (...[$event]) => {
                    if (!!(__VLS_ctx.formData.tasks.length === 0))
                        return;
                    __VLS_ctx.validateTaskPoints(taskIndex);
                    // @ts-ignore
                    [validateTaskPoints,];
                } },
            id: (`task-points-${taskIndex}`),
            type: "number",
            min: "0",
            step: "1",
            ...{ class: "form-input points-input" },
        });
        (task.points);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        /** @type {__VLS_StyleScopedClasses['points-input']} */ ;
        if (__VLS_ctx.errors.tasks?.[taskIndex]?.points) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "error-message" },
            });
            /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
            (__VLS_ctx.errors.tasks[taskIndex].points);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            for: (`task-bonus-${taskIndex}`),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onBlur: (...[$event]) => {
                    if (!!(__VLS_ctx.formData.tasks.length === 0))
                        return;
                    __VLS_ctx.validateTaskBonusPoints(taskIndex);
                    // @ts-ignore
                    [errors, errors, validateTaskBonusPoints,];
                } },
            id: (`task-bonus-${taskIndex}`),
            type: "number",
            min: "0",
            step: "1",
            ...{ class: "form-input points-input" },
        });
        (task.bonusPoints);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        /** @type {__VLS_StyleScopedClasses['points-input']} */ ;
        if (__VLS_ctx.errors.tasks?.[taskIndex]?.bonusPoints) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "error-message" },
            });
            /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
            (__VLS_ctx.errors.tasks[taskIndex].bonusPoints);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group checkbox" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        /** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            id: (`task-choice-${taskIndex}`),
            type: "checkbox",
        });
        (task.isChoice);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            for: (`task-choice-${taskIndex}`),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "criteria-section" },
        });
        /** @type {__VLS_StyleScopedClasses['criteria-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "criteria-header" },
        });
        /** @type {__VLS_StyleScopedClasses['criteria-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.formData.tasks.length === 0))
                        return;
                    __VLS_ctx.addCriterion(taskIndex);
                    // @ts-ignore
                    [errors, errors, addCriterion,];
                } },
            ...{ class: "btn btn-secondary btn-xs" },
            title: "Add criterion to this task",
        });
        /** @type {__VLS_StyleScopedClasses['btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-xs']} */ ;
        if (task.criteria.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "empty-criteria" },
            });
            /** @type {__VLS_StyleScopedClasses['empty-criteria']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "criteria-list" },
            });
            /** @type {__VLS_StyleScopedClasses['criteria-list']} */ ;
            for (const [criterion, critIndex] of __VLS_vFor((task.criteria))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (criterion.id),
                    ...{ class: "criterion-row" },
                });
                /** @type {__VLS_StyleScopedClasses['criterion-row']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ onBlur: (...[$event]) => {
                            if (!!(__VLS_ctx.formData.tasks.length === 0))
                                return;
                            if (!!(task.criteria.length === 0))
                                return;
                            __VLS_ctx.validateCriterion(taskIndex, critIndex);
                            // @ts-ignore
                            [validateCriterion,];
                        } },
                    value: (criterion.text),
                    type: "text",
                    placeholder: "Criterion description",
                    ...{ class: "criterion-input" },
                });
                /** @type {__VLS_StyleScopedClasses['criterion-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    type: "number",
                    min: "0",
                    step: "0.5",
                    ...{ class: "criterion-points-input" },
                    title: "Points for this criterion",
                    placeholder: "Pts",
                });
                (criterion.points);
                /** @type {__VLS_StyleScopedClasses['criterion-points-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.formData.tasks.length === 0))
                                return;
                            if (!!(task.criteria.length === 0))
                                return;
                            __VLS_ctx.removeCriterion(taskIndex, critIndex);
                            // @ts-ignore
                            [removeCriterion,];
                        } },
                    ...{ class: "btn btn-danger btn-sm" },
                    title: (`Remove criterion ${critIndex + 1}`),
                });
                /** @type {__VLS_StyleScopedClasses['btn']} */ ;
                /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
                /** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
                // @ts-ignore
                [];
            }
        }
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.formData.tasks.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section preview-section" },
    });
    /** @type {__VLS_StyleScopedClasses['section']} */ ;
    /** @type {__VLS_StyleScopedClasses['preview-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-item" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "preview-label" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "preview-value" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-value']} */ ;
    (__VLS_ctx.formData.tasks.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-item" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "preview-label" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "preview-value" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-value']} */ ;
    (__VLS_ctx.totalPoints);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-item" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "preview-label" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "preview-value" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-value']} */ ;
    (__VLS_ctx.totalPointsWithBonus);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-item" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "preview-label" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "preview-value" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-value']} */ ;
    (__VLS_ctx.tasksWithCriteria);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "structure-preview" },
    });
    /** @type {__VLS_StyleScopedClasses['structure-preview']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "task-preview-list" },
    });
    /** @type {__VLS_StyleScopedClasses['task-preview-list']} */ ;
    for (const [task, idx] of __VLS_vFor((__VLS_ctx.formData.tasks))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (task.id),
            ...{ class: "task-preview" },
        });
        /** @type {__VLS_StyleScopedClasses['task-preview']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "task-preview-title" },
        });
        /** @type {__VLS_StyleScopedClasses['task-preview-title']} */ ;
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (task.title || '(no title)');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "task-preview-info" },
        });
        /** @type {__VLS_StyleScopedClasses['task-preview-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (task.points);
        if (task.bonusPoints > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (task.bonusPoints);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (task.criteria.length);
        if (task.isChoice) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        if (task.criteria.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "criteria-preview" },
            });
            /** @type {__VLS_StyleScopedClasses['criteria-preview']} */ ;
            for (const [crit] of __VLS_vFor((task.criteria))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (crit.id),
                    ...{ class: "crit-preview" },
                });
                /** @type {__VLS_StyleScopedClasses['crit-preview']} */ ;
                (crit.text || '(no text)');
                (crit.points);
                // @ts-ignore
                [formData, formData, formData, totalPoints, totalPointsWithBonus, tasksWithCriteria,];
            }
        }
        // @ts-ignore
        [];
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "section actions-section" },
});
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.saveExam) },
    ...{ class: "btn btn-primary btn-lg" },
    disabled: (!__VLS_ctx.canSave),
    title: "Save exam to database",
});
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-lg']} */ ;
(__VLS_ctx.isSaving ? 'Saving...' : 'Save Exam');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.cancelEdit) },
    ...{ class: "btn btn-secondary btn-lg" },
});
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-lg']} */ ;
if (__VLS_ctx.successMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert alert-success" },
    });
    /** @type {__VLS_StyleScopedClasses['alert']} */ ;
    /** @type {__VLS_StyleScopedClasses['alert-success']} */ ;
    (__VLS_ctx.successMessage);
}
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert alert-error" },
    });
    /** @type {__VLS_StyleScopedClasses['alert']} */ ;
    /** @type {__VLS_StyleScopedClasses['alert-error']} */ ;
    (__VLS_ctx.errorMessage);
}
// @ts-ignore
[saveExam, canSave, isSaving, cancelEdit, successMessage, successMessage, errorMessage, errorMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
