/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { useExamBuilderStore } from '../stores/examBuilderStore';
import TaskEditor from './TaskEditor.vue';
const store = useExamBuilderStore();
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['ghost']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "panel task-list" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['task-list']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "panel-header" },
});
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.store.addTask();
            // @ts-ignore
            [store,];
        } },
    ...{ class: "ghost" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['ghost']} */ ;
if (__VLS_ctx.store.tasks.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty" },
    });
    /** @type {__VLS_StyleScopedClasses['empty']} */ ;
}
for (const [task, index] of __VLS_vFor((__VLS_ctx.store.tasks))) {
    const __VLS_0 = TaskEditor;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onRemove': {} },
        ...{ 'onMoveUp': {} },
        ...{ 'onMoveDown': {} },
        key: (task.id),
        task: (task),
        index: (index),
        level: (1),
        mode: (__VLS_ctx.store.mode),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onRemove': {} },
        ...{ 'onMoveUp': {} },
        ...{ 'onMoveDown': {} },
        key: (task.id),
        task: (task),
        index: (index),
        level: (1),
        mode: (__VLS_ctx.store.mode),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ remove: {} },
        { onRemove: (...[$event]) => {
                __VLS_ctx.store.removeTask(task.id);
                // @ts-ignore
                [store, store, store, store,];
            } });
    const __VLS_7 = ({ moveUp: {} },
        { onMoveUp: (...[$event]) => {
                __VLS_ctx.store.moveTask(__VLS_ctx.store.tasks, index, -1);
                // @ts-ignore
                [store, store,];
            } });
    const __VLS_8 = ({ moveDown: {} },
        { onMoveDown: (...[$event]) => {
                __VLS_ctx.store.moveTask(__VLS_ctx.store.tasks, index, 1);
                // @ts-ignore
                [store, store,];
            } });
    var __VLS_3;
    var __VLS_4;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
