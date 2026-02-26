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
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['part-header']} */ ;
/** @type {__VLS_StyleScopedClasses['chip']} */ ;
/** @type {__VLS_StyleScopedClasses['chip']} */ ;
/** @type {__VLS_StyleScopedClasses['ghost']} */ ;
if (__VLS_ctx.store.mode === 'complex') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "panel exam-parts" },
    });
    /** @type {__VLS_StyleScopedClasses['panel']} */ ;
    /** @type {__VLS_StyleScopedClasses['exam-parts']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "panel-header" },
    });
    /** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.store.mode === 'complex'))
                    return;
                __VLS_ctx.store.addPart();
                // @ts-ignore
                [store, store,];
            } },
        ...{ class: "ghost" },
        type: "button",
    });
    /** @type {__VLS_StyleScopedClasses['ghost']} */ ;
    if (__VLS_ctx.store.parts.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty" },
        });
        /** @type {__VLS_StyleScopedClasses['empty']} */ ;
    }
    for (const [part, index] of __VLS_vFor((__VLS_ctx.store.parts))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (part.id),
            ...{ class: "part-card" },
        });
        /** @type {__VLS_StyleScopedClasses['part-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "part-header" },
        });
        /** @type {__VLS_StyleScopedClasses['part-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (index + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.store.mode === 'complex'))
                        return;
                    __VLS_ctx.store.removePart(part.id);
                    // @ts-ignore
                    [store, store, store,];
                } },
            ...{ class: "ghost" },
            type: "button",
        });
        /** @type {__VLS_StyleScopedClasses['ghost']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field" },
        });
        /** @type {__VLS_StyleScopedClasses['field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            for: (`part-name-${part.id}`),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            id: (`part-name-${part.id}`),
            value: (part.name),
            type: "text",
            placeholder: "Part name",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field" },
        });
        /** @type {__VLS_StyleScopedClasses['field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            for: (`part-description-${part.id}`),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
            id: (`part-description-${part.id}`),
            value: (part.description),
            rows: "2",
            placeholder: "Optional",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['field-grid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "choice-toggle" },
        });
        /** @type {__VLS_StyleScopedClasses['choice-toggle']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (part.calculateSubScore);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "choice-toggle" },
        });
        /** @type {__VLS_StyleScopedClasses['choice-toggle']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (part.printable);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['field-grid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "choice-toggle" },
        });
        /** @type {__VLS_StyleScopedClasses['choice-toggle']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "radio",
            value: "points",
        });
        (part.scoreType);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "choice-toggle" },
        });
        /** @type {__VLS_StyleScopedClasses['choice-toggle']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "radio",
            value: "grade",
        });
        (part.scoreType);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field" },
        });
        /** @type {__VLS_StyleScopedClasses['field']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "chip-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['chip-grid']} */ ;
        for (const [task] of __VLS_vFor((__VLS_ctx.store.flatTasks))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                key: (task.id),
                ...{ class: "chip" },
            });
            /** @type {__VLS_StyleScopedClasses['chip']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "checkbox",
                value: (task.id),
            });
            (part.taskIds);
            (task.title || task.id.slice(0, 4));
            // @ts-ignore
            [store,];
        }
        if (part.taskIds.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "help-text" },
            });
            /** @type {__VLS_StyleScopedClasses['help-text']} */ ;
        }
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
