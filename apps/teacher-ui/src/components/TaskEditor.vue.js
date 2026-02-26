/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, ref } from 'vue';
import { useExamBuilderStore } from '../stores/examBuilderStore';
import { useToast } from '../composables/useToast';
const props = withDefaults(defineProps(), {
    parentIndex: 0,
    isLast: false
});
const __VLS_emit = defineEmits();
const store = useExamBuilderStore();
const toast = useToast();
const isDragging = ref(false);
const isDragOver = ref(false);
const canAddSubtasks = computed(() => props.mode === 'complex' && props.level < 3);
const nextLevel = computed(() => (props.level + 1));
const taskNumber = computed(() => {
    if (props.level === 1)
        return `${props.index + 1}`;
    if (props.level === 2)
        return `${props.parentIndex + 1}.${props.index + 1}`;
    return `${props.parentIndex + 1}.?.${props.index + 1}`;
});
const headerTag = computed(() => {
    if (props.level === 1)
        return 'h3';
    if (props.level === 2)
        return 'h4';
    return 'h5';
});
const criteriaHeaderTag = computed(() => {
    if (props.level === 1)
        return 'h4';
    if (props.level === 2)
        return 'h5';
    return 'h6';
});
const subtasksHeaderTag = computed(() => {
    if (props.level === 1)
        return 'h4';
    return 'h5';
});
const subtasksLevel = computed(() => {
    if (props.level === 1)
        return '(level 2)';
    return '(level 3)';
});
// Drag-and-drop handlers
const handleDragStart = (event) => {
    isDragging.value = true;
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', JSON.stringify({
            taskId: props.task.id,
            level: props.level,
            index: props.index,
            parentId: props.parentTask?.id || null
        }));
    }
};
const handleDragOver = (event) => {
    event.preventDefault();
    isDragOver.value = true;
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
    }
};
const handleDrop = (event) => {
    event.preventDefault();
    isDragOver.value = false;
    if (!event.dataTransfer)
        return;
    try {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        const { taskId, level: fromLevel } = data;
        // Only allow drops within same level for safety
        if (fromLevel !== props.level) {
            toast.warning('Cannot move tasks between different hierarchy levels');
            return;
        }
        // Same task, no-op
        if (taskId === props.task.id)
            return;
        // Attempt reordering based on context
        if (props.level === 1 && fromLevel === 1) {
            // Root level reorder
            const fromPos = store.tasks.findIndex(t => t.id === taskId);
            if (fromPos !== -1) {
                store.moveTask(store.tasks, fromPos, props.index - fromPos);
            }
        }
        else if (props.level > 1 && props.parentTask) {
            // Nested level reorder within same parent
            // Validate that dragged task belongs to the same parent
            if (data.parentId !== props.parentTask.id) {
                toast.warning('Cannot move tasks between different parent subtask lists');
                return;
            }
            const fromPos = props.parentTask.subtasks.findIndex(t => t.id === taskId);
            if (fromPos !== -1) {
                store.moveTask(props.parentTask.subtasks, fromPos, props.index - fromPos);
            }
        }
    }
    catch (err) {
        toast.error('Error reordering tasks. Please try again.');
    }
};
const handleDragEnd = () => {
    isDragging.value = false;
    isDragOver.value = false;
};
const handleKeyReorder = (event) => {
    if (!event.altKey)
        return;
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (props.level === 1) {
            store.moveTask(store.tasks, props.index, -1);
        }
        else if (props.parentTask) {
            store.moveTask(props.parentTask.subtasks, props.index, -1);
        }
    }
    else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (props.level === 1) {
            store.moveTask(store.tasks, props.index, 1);
        }
        else if (props.parentTask) {
            store.moveTask(props.parentTask.subtasks, props.index, 1);
        }
    }
};
const handleKeyActivate = (event) => {
    if (event.repeat)
        return;
    toast.info('Use Alt+Up or Alt+Down to reorder tasks.');
};
const __VLS_defaults = {
    parentIndex: 0,
    isLast: false
};
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['task-card']} */ ;
/** @type {__VLS_StyleScopedClasses['task-card']} */ ;
/** @type {__VLS_StyleScopedClasses['task-card']} */ ;
/** @type {__VLS_StyleScopedClasses['task-card']} */ ;
/** @type {__VLS_StyleScopedClasses['drag-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['task-header']} */ ;
/** @type {__VLS_StyleScopedClasses['task-header']} */ ;
/** @type {__VLS_StyleScopedClasses['task-header']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['ghost']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onDragover: (__VLS_ctx.handleDragOver) },
    ...{ onDrop: (__VLS_ctx.handleDrop) },
    ...{ onDragleave: (...[$event]) => {
            __VLS_ctx.isDragOver = false;
            // @ts-ignore
            [handleDragOver, handleDrop, isDragOver,];
        } },
    ...{ class: "task-card" },
    ...{ class: ({ nested: __VLS_ctx.level > 1, dragging: __VLS_ctx.isDragging, dragover: __VLS_ctx.isDragOver }) },
});
/** @type {__VLS_StyleScopedClasses['task-card']} */ ;
/** @type {__VLS_StyleScopedClasses['nested']} */ ;
/** @type {__VLS_StyleScopedClasses['dragging']} */ ;
/** @type {__VLS_StyleScopedClasses['dragover']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "task-header" },
});
/** @type {__VLS_StyleScopedClasses['task-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onKeydown: (__VLS_ctx.handleKeyActivate) },
    ...{ onKeydown: (__VLS_ctx.handleKeyActivate) },
    ...{ onDragstart: (__VLS_ctx.handleDragStart) },
    ...{ onDragend: (__VLS_ctx.handleDragEnd) },
    ...{ onKeydown: (__VLS_ctx.handleKeyReorder) },
    ...{ class: "drag-handle" },
    aaaaaaaaaaaaaaaaaaaaaaaaaaaassssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss: true,
    draggable: "true",
    title: (`Drag to reorder task ${__VLS_ctx.taskNumber}`),
    'aria-label': (`Drag handle for task ${__VLS_ctx.taskNumber}. Use Alt+Up or Alt+Down to reorder with keyboard.`),
    role: "button",
    tabindex: "0",
});
/** @type {__VLS_StyleScopedClasses['drag-handle']} */ ;
const __VLS_0 = (__VLS_ctx.headerTag);
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
(__VLS_ctx.taskNumber);
// @ts-ignore
[isDragOver, level, isDragging, handleKeyActivate, handleKeyActivate, handleDragStart, handleDragEnd, handleKeyReorder, taskNumber, taskNumber, taskNumber, headerTag,];
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "task-actions" },
});
/** @type {__VLS_StyleScopedClasses['task-actions']} */ ;
if (__VLS_ctx.index > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.index > 0))
                    return;
                __VLS_ctx.$emit('moveUp');
                // @ts-ignore
                [index, $emit,];
            } },
        ...{ class: "ghost" },
        type: "button",
        title: "Move up",
    });
    /** @type {__VLS_StyleScopedClasses['ghost']} */ ;
}
if (!__VLS_ctx.isLast) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.isLast))
                    return;
                __VLS_ctx.$emit('moveDown');
                // @ts-ignore
                [$emit, isLast,];
            } },
        ...{ class: "ghost" },
        type: "button",
        title: "Move down",
    });
    /** @type {__VLS_StyleScopedClasses['ghost']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('remove');
            // @ts-ignore
            [$emit,];
        } },
    ...{ class: "ghost" },
    type: "button",
    title: "Remove task",
});
/** @type {__VLS_StyleScopedClasses['ghost']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    for: (`task-title-${__VLS_ctx.task.id}`),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    id: (`task-title-${__VLS_ctx.task.id}`),
    value: (__VLS_ctx.task.title),
    type: "text",
    placeholder: "Task title",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field-grid" },
});
/** @type {__VLS_StyleScopedClasses['field-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    for: (`task-points-${__VLS_ctx.task.id}`),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    id: (`task-points-${__VLS_ctx.task.id}`),
    type: "number",
    min: "0",
    step: "0.5",
});
(__VLS_ctx.task.points);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    for: (`task-bonus-${__VLS_ctx.task.id}`),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    id: (`task-bonus-${__VLS_ctx.task.id}`),
    type: "number",
    min: "0",
    step: "0.5",
});
(__VLS_ctx.task.bonusPoints);
if (__VLS_ctx.mode === 'complex') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "choice-toggle" },
    });
    /** @type {__VLS_StyleScopedClasses['choice-toggle']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.task.isChoice);
    if (__VLS_ctx.task.isChoice) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (__VLS_ctx.task.choiceGroup),
            type: "text",
            placeholder: "Choice group (e.g., A, B, C)",
        });
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "criteria-block" },
});
/** @type {__VLS_StyleScopedClasses['criteria-block']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "panel-header" },
});
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
const __VLS_6 = (__VLS_ctx.criteriaHeaderTag);
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
// @ts-ignore
[task, task, task, task, task, task, task, task, task, task, task, task, mode, criteriaHeaderTag,];
var __VLS_9;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.store.addCriterion(__VLS_ctx.task);
            // @ts-ignore
            [task, store,];
        } },
    ...{ class: "ghost" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['ghost']} */ ;
if (__VLS_ctx.task.criteria.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty" },
    });
    /** @type {__VLS_StyleScopedClasses['empty']} */ ;
}
for (const [criterion] of __VLS_vFor((__VLS_ctx.task.criteria))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (criterion.id),
        ...{ class: "criterion-row" },
    });
    /** @type {__VLS_StyleScopedClasses['criterion-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (criterion.text),
        type: "text",
        placeholder: "Criterion",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: "0",
        step: "0.5",
    });
    (criterion.points);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.store.removeCriterion(__VLS_ctx.task, criterion.id);
                // @ts-ignore
                [task, task, task, store,];
            } },
        ...{ class: "ghost" },
        type: "button",
    });
    /** @type {__VLS_StyleScopedClasses['ghost']} */ ;
    // @ts-ignore
    [];
}
if (__VLS_ctx.canAddSubtasks) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "subtasks" },
    });
    /** @type {__VLS_StyleScopedClasses['subtasks']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "panel-header" },
    });
    /** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
    const __VLS_12 = (__VLS_ctx.subtasksHeaderTag);
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
    const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
    const { default: __VLS_17 } = __VLS_15.slots;
    (__VLS_ctx.subtasksLevel);
    // @ts-ignore
    [canAddSubtasks, subtasksHeaderTag, subtasksLevel,];
    var __VLS_15;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.canAddSubtasks))
                    return;
                __VLS_ctx.store.addSubtask(__VLS_ctx.task, __VLS_ctx.nextLevel);
                // @ts-ignore
                [task, store, nextLevel,];
            } },
        ...{ class: "ghost" },
        type: "button",
    });
    /** @type {__VLS_StyleScopedClasses['ghost']} */ ;
    for (const [subtask, subIndex] of __VLS_vFor((__VLS_ctx.task.subtasks))) {
        let __VLS_18;
        /** @ts-ignore @type {typeof __VLS_components.TaskEditor} */
        TaskEditor;
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
            ...{ 'onRemove': {} },
            ...{ 'onMoveUp': {} },
            ...{ 'onMoveDown': {} },
            key: (subtask.id),
            task: (subtask),
            index: (subIndex),
            level: (__VLS_ctx.nextLevel),
            mode: (__VLS_ctx.mode),
            parentIndex: (__VLS_ctx.index),
            parentTask: (__VLS_ctx.task),
            isLast: (subIndex === __VLS_ctx.task.subtasks.length - 1),
        }));
        const __VLS_20 = __VLS_19({
            ...{ 'onRemove': {} },
            ...{ 'onMoveUp': {} },
            ...{ 'onMoveDown': {} },
            key: (subtask.id),
            task: (subtask),
            index: (subIndex),
            level: (__VLS_ctx.nextLevel),
            mode: (__VLS_ctx.mode),
            parentIndex: (__VLS_ctx.index),
            parentTask: (__VLS_ctx.task),
            isLast: (subIndex === __VLS_ctx.task.subtasks.length - 1),
        }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        let __VLS_23;
        const __VLS_24 = ({ remove: {} },
            { onRemove: (...[$event]) => {
                    if (!(__VLS_ctx.canAddSubtasks))
                        return;
                    __VLS_ctx.store.removeNestedTask(__VLS_ctx.task, subtask.id);
                    // @ts-ignore
                    [index, task, task, task, task, mode, store, nextLevel,];
                } });
        const __VLS_25 = ({ moveUp: {} },
            { onMoveUp: (...[$event]) => {
                    if (!(__VLS_ctx.canAddSubtasks))
                        return;
                    __VLS_ctx.store.moveTask(__VLS_ctx.task.subtasks, subIndex, -1);
                    // @ts-ignore
                    [task, store,];
                } });
        const __VLS_26 = ({ moveDown: {} },
            { onMoveDown: (...[$event]) => {
                    if (!(__VLS_ctx.canAddSubtasks))
                        return;
                    __VLS_ctx.store.moveTask(__VLS_ctx.task.subtasks, subIndex, 1);
                    // @ts-ignore
                    [task, store,];
                } });
        var __VLS_21;
        var __VLS_22;
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default {};
