/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';
import { useExamsBridge } from '../composables/useExamsBridge';
const router = useRouter();
const route = useRoute();
const { examRepository } = useExamsBridge();
const exam = ref(null);
const isEditing = computed(() => !!route.params.id);
const canSave = computed(() => {
    return exam.value && exam.value.title && exam.value.structure.tasks.length > 0;
});
const handleModeChange = () => {
    if (!exam.value)
        return;
    // Clear subtasks if switching from complex to simple
    if (exam.value.mode === Exams.ExamMode.Simple) {
        exam.value.structure.tasks.forEach(task => {
            task.subtasks = [];
        });
    }
};
const addTask = () => {
    if (!exam.value)
        return;
    const newTask = {
        id: uuidv4(),
        level: 1,
        order: exam.value.structure.tasks.length,
        title: `Task ${exam.value.structure.tasks.length + 1}`,
        points: 0,
        isChoice: false,
        criteria: [],
        allowComments: exam.value.structure.allowsComments,
        allowSupportTips: exam.value.structure.allowsSupportTips,
        commentBoxEnabled: false,
        subtasks: []
    };
    exam.value.structure.tasks.push(newTask);
    updateTotalPoints();
};
const removeTask = (idx) => {
    if (!exam.value)
        return;
    exam.value.structure.tasks.splice(idx, 1);
    updateTotalPoints();
};
const addCriterion = (taskIdx) => {
    if (!exam.value)
        return;
    const task = exam.value.structure.tasks[taskIdx];
    if (!task)
        return;
    task.criteria.push({
        id: uuidv4(),
        text: '',
        points: 0,
        formatting: {},
        aspectBased: false
    });
};
const removeCriterion = (taskIdx, critIdx) => {
    if (!exam.value)
        return;
    const task = exam.value.structure.tasks[taskIdx];
    if (!task)
        return;
    task.criteria.splice(critIdx, 1);
};
const addSubtask = (taskIdx) => {
    if (!exam.value)
        return;
    const task = exam.value.structure.tasks[taskIdx];
    if (!task)
        return;
    task.subtasks.push(uuidv4());
};
const removeSubtask = (taskIdx, subtaskIdx) => {
    if (!exam.value)
        return;
    const task = exam.value.structure.tasks[taskIdx];
    if (!task)
        return;
    task.subtasks.splice(subtaskIdx, 1);
};
const addPart = () => {
    if (!exam.value)
        return;
    exam.value.structure.parts.push({
        id: uuidv4(),
        name: `Part ${exam.value.structure.parts.length + 1}`,
        taskIds: [],
        calculateSubScore: false,
        scoreType: 'points',
        printable: true,
        order: exam.value.structure.parts.length
    });
};
const removePart = (idx) => {
    if (!exam.value)
        return;
    exam.value.structure.parts.splice(idx, 1);
};
const updateTotalPoints = () => {
    if (!exam.value)
        return;
    const taskPoints = exam.value.structure.tasks.reduce((sum, task) => sum + task.points, 0);
    exam.value.gradingKey.totalPoints = taskPoints;
};
const saveExam = async () => {
    if (!exam.value || !canSave.value)
        return;
    try {
        if (isEditing.value) {
            await examRepository?.update(exam.value.id, exam.value);
        }
        else {
            await examRepository?.create(exam.value);
        }
        router.push('/exams');
    }
    catch (error) {
        console.error('Failed to save exam:', error);
    }
};
const goBack = () => {
    router.push('/exams');
};
onMounted(async () => {
    if (isEditing.value) {
        // Load existing exam
        const id = route.params.id;
        const loaded = await examRepository?.findById(id);
        if (loaded) {
            exam.value = loaded;
        }
    }
    else {
        // Create new exam
        exam.value = {
            id: uuidv4(),
            title: '',
            mode: Exams.ExamMode.Simple,
            structure: {
                parts: [],
                tasks: [],
                allowsComments: false,
                allowsSupportTips: false,
                totalPoints: 0
            },
            gradingKey: {
                id: uuidv4(),
                name: 'Default',
                type: Exams.GradingKeyType.Points,
                totalPoints: 0,
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
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['boundaries-table']} */ ;
/** @type {__VLS_StyleScopedClasses['boundaries-table']} */ ;
/** @type {__VLS_StyleScopedClasses['boundaries-table']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-small']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-small']} */ ;
/** @type {__VLS_StyleScopedClasses['exam-builder-page']} */ ;
/** @type {__VLS_StyleScopedClasses['builder-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['task-header']} */ ;
/** @type {__VLS_StyleScopedClasses['task-title-input']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "exam-builder-page" },
});
/** @type {__VLS_StyleScopedClasses['exam-builder-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "builder-header" },
});
/** @type {__VLS_StyleScopedClasses['builder-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
(__VLS_ctx.isEditing ? 'Edit Exam' : 'Create Exam');
if (__VLS_ctx.exam) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.exam.mode === 'simple' ? 'Simple: flat task list' : 'Complex: nested tasks (3 levels)');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "actions" },
});
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "btn-secondary" },
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.saveExam) },
    ...{ class: "btn-primary" },
    disabled: (!__VLS_ctx.canSave),
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
if (__VLS_ctx.exam) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "builder-content" },
    });
    /** @type {__VLS_StyleScopedClasses['builder-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section" },
    });
    /** @type {__VLS_StyleScopedClasses['section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.exam.title),
        type: "text",
        placeholder: "Exam title",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.exam.description),
        placeholder: "Optional exam description",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-row" },
    });
    /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handleModeChange) },
        value: (__VLS_ctx.exam.mode),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "simple",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "complex",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.exam.structure.allowsComments);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.exam.structure.allowsSupportTips);
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section" },
    });
    /** @type {__VLS_StyleScopedClasses['section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addTask) },
        ...{ class: "btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    if (__VLS_ctx.exam.structure.tasks.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    }
    for (const [task, idx] of __VLS_vFor((__VLS_ctx.exam.structure.tasks))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (task.id),
            ...{ class: "task-card" },
        });
        /** @type {__VLS_StyleScopedClasses['task-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "task-header" },
        });
        /** @type {__VLS_StyleScopedClasses['task-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (task.title),
            type: "text",
            placeholder: "Task title (e.g., Task 1, Task 2a)",
            ...{ class: "task-title-input" },
        });
        /** @type {__VLS_StyleScopedClasses['task-title-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.exam))
                        return;
                    __VLS_ctx.removeTask(idx);
                    // @ts-ignore
                    [isEditing, exam, exam, exam, exam, exam, exam, exam, exam, exam, exam, goBack, saveExam, canSave, handleModeChange, addTask, removeTask,];
                } },
            ...{ class: "btn-danger-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-danger-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "task-details" },
        });
        /** @type {__VLS_StyleScopedClasses['task-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "0",
            step: "1",
        });
        (task.points);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "0",
            step: "1",
        });
        (task.bonusPoints);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group checkbox" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        /** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (task.isChoice);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group checkbox" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        /** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (task.allowComments);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        if (task.criteria.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "criteria-list" },
            });
            /** @type {__VLS_StyleScopedClasses['criteria-list']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            for (const [criterion, cidx] of __VLS_vFor((task.criteria))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (criterion.id),
                    ...{ class: "criterion-item" },
                });
                /** @type {__VLS_StyleScopedClasses['criterion-item']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
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
                    ...{ class: "points-input" },
                    title: "Points",
                });
                (criterion.points);
                /** @type {__VLS_StyleScopedClasses['points-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.exam))
                                return;
                            if (!(task.criteria.length > 0))
                                return;
                            __VLS_ctx.removeCriterion(idx, cidx);
                            // @ts-ignore
                            [removeCriterion,];
                        } },
                    ...{ class: "btn-danger-small" },
                });
                /** @type {__VLS_StyleScopedClasses['btn-danger-small']} */ ;
                // @ts-ignore
                [];
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.exam))
                        return;
                    __VLS_ctx.addCriterion(idx);
                    // @ts-ignore
                    [addCriterion,];
                } },
            ...{ class: "btn-secondary-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary-small']} */ ;
        if (__VLS_ctx.exam.mode === 'complex' && task.subtasks.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "subtasks-section" },
            });
            /** @type {__VLS_StyleScopedClasses['subtasks-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            for (const [subtaskId, sidx] of __VLS_vFor((task.subtasks))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (subtaskId),
                    ...{ class: "subtask-row" },
                });
                /** @type {__VLS_StyleScopedClasses['subtask-row']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (sidx + 1);
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.exam))
                                return;
                            if (!(__VLS_ctx.exam.mode === 'complex' && task.subtasks.length > 0))
                                return;
                            __VLS_ctx.removeSubtask(idx, sidx);
                            // @ts-ignore
                            [exam, removeSubtask,];
                        } },
                    ...{ class: "btn-danger-small" },
                });
                /** @type {__VLS_StyleScopedClasses['btn-danger-small']} */ ;
                // @ts-ignore
                [];
            }
        }
        if (__VLS_ctx.exam.mode === 'complex') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.exam))
                            return;
                        if (!(__VLS_ctx.exam.mode === 'complex'))
                            return;
                        __VLS_ctx.addSubtask(idx);
                        // @ts-ignore
                        [exam, addSubtask,];
                    } },
                ...{ class: "btn-secondary-small" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-secondary-small']} */ ;
        }
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section" },
    });
    /** @type {__VLS_StyleScopedClasses['section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-header" },
    });
    /** @type {__VLS_StyleScopedClasses['section-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addPart) },
        ...{ class: "btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    if (__VLS_ctx.exam.structure.parts.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    }
    for (const [part, pidx] of __VLS_vFor((__VLS_ctx.exam.structure.parts))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (part.id),
            ...{ class: "part-card" },
        });
        /** @type {__VLS_StyleScopedClasses['part-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (part.name),
            type: "text",
            placeholder: "Part name (e.g., Part A)",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-row" },
        });
        /** @type {__VLS_StyleScopedClasses['form-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group checkbox" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        /** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (part.calculateSubScore);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group checkbox" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        /** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (part.printable);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.exam))
                        return;
                    __VLS_ctx.removePart(pidx);
                    // @ts-ignore
                    [exam, exam, addPart, removePart,];
                } },
            ...{ class: "btn-danger-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-danger-small']} */ ;
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section" },
    });
    /** @type {__VLS_StyleScopedClasses['section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.exam.gradingKey.type),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "percentage",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "points",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "error-points",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: "0",
        step: "1",
        readonly: true,
    });
    (__VLS_ctx.exam.gradingKey.totalPoints);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.exam.gradingKey.roundingRule.type),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "up",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "down",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "nearest",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "none",
    });
    if (__VLS_ctx.exam.gradingKey.gradeBoundaries.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "boundaries-table" },
        });
        /** @type {__VLS_StyleScopedClasses['boundaries-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [boundary] of __VLS_vFor((__VLS_ctx.exam.gradingKey.gradeBoundaries))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (boundary.grade),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (boundary.grade);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (boundary.minPercentage);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (boundary.maxPercentage);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (boundary.displayValue);
            // @ts-ignore
            [exam, exam, exam, exam, exam,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section summary" },
    });
    /** @type {__VLS_StyleScopedClasses['section']} */ ;
    /** @type {__VLS_StyleScopedClasses['summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "label" },
    });
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "value" },
    });
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.exam.structure.tasks.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "label" },
    });
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "value" },
    });
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.exam.gradingKey.totalPoints);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "label" },
    });
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "value" },
    });
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.exam.structure.parts.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-item" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "label" },
    });
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "value" },
    });
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.exam.mode === 'simple' ? 'Simple' : 'Complex');
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading" },
    });
    /** @type {__VLS_StyleScopedClasses['loading']} */ ;
}
// @ts-ignore
[exam, exam, exam, exam,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
