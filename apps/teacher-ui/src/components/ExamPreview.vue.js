/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { useExamBuilderStore } from '../stores/examBuilderStore';
const store = useExamBuilderStore();
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['preview-header']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-meta']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "panel exam-preview" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['exam-preview']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "preview-header" },
});
/** @type {__VLS_StyleScopedClasses['preview-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "pill" },
});
/** @type {__VLS_StyleScopedClasses['pill']} */ ;
(__VLS_ctx.store.totalPoints);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "preview-meta" },
});
/** @type {__VLS_StyleScopedClasses['preview-meta']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.store.title || 'Untitled exam');
if (__VLS_ctx.store.description) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.store.description);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
if (__VLS_ctx.store.tasks.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.ol, __VLS_intrinsics.ol)({
        ...{ class: "preview-tasks" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-tasks']} */ ;
    for (const [task] of __VLS_vFor((__VLS_ctx.store.tasks))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (task.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "task-line" },
        });
        /** @type {__VLS_StyleScopedClasses['task-line']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (task.title || 'Untitled task');
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pill" },
        });
        /** @type {__VLS_StyleScopedClasses['pill']} */ ;
        (task.points);
        if (task.subtasks.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "criteria-list" },
            });
            /** @type {__VLS_StyleScopedClasses['criteria-list']} */ ;
            for (const [subtask] of __VLS_vFor((task.subtasks))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (subtask.id),
                });
                (subtask.title || 'Subtask');
                (subtask.points);
                if (subtask.subtasks.length) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                        ...{ class: "criteria-list" },
                    });
                    /** @type {__VLS_StyleScopedClasses['criteria-list']} */ ;
                    for (const [leaf] of __VLS_vFor((subtask.subtasks))) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                            key: (leaf.id),
                        });
                        (leaf.title || 'Subtask');
                        (leaf.points);
                        // @ts-ignore
                        [store, store, store, store, store, store,];
                    }
                }
                // @ts-ignore
                [];
            }
        }
        // @ts-ignore
        [];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "empty" },
    });
    /** @type {__VLS_StyleScopedClasses['empty']} */ ;
}
if (__VLS_ctx.store.mode === 'complex' && __VLS_ctx.store.parts.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-meta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
    for (const [part] of __VLS_vFor((__VLS_ctx.store.parts))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (part.id),
        });
        (part.name || 'Unnamed part');
        (part.taskIds.length);
        // @ts-ignore
        [store, store, store,];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
