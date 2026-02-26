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
/** @type {__VLS_StyleScopedClasses['pill']} */ ;
/** @type {__VLS_StyleScopedClasses['pill']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "panel exam-details" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['exam-details']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    for: "title",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "required" },
});
/** @type {__VLS_StyleScopedClasses['required']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    id: "title",
    value: (__VLS_ctx.store.title),
    type: "text",
    placeholder: "Exam title",
    required: true,
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    for: "description",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
    id: "description",
    value: (__VLS_ctx.store.description),
    rows: "4",
    placeholder: "Optional description for students",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    for: "classGroupId",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    id: "classGroupId",
    value: (__VLS_ctx.store.classGroupId),
    type: "text",
    placeholder: "Optional",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mode-pills" },
});
/** @type {__VLS_StyleScopedClasses['mode-pills']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.store.setMode('simple');
            // @ts-ignore
            [store, store, store, store,];
        } },
    type: "button",
    ...{ class: "pill" },
    ...{ class: ({ active: __VLS_ctx.store.mode === 'simple' }) },
});
/** @type {__VLS_StyleScopedClasses['pill']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.store.setMode('complex');
            // @ts-ignore
            [store, store,];
        } },
    type: "button",
    ...{ class: "pill" },
    ...{ class: ({ active: __VLS_ctx.store.mode === 'complex' }) },
});
/** @type {__VLS_StyleScopedClasses['pill']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "help-text" },
});
/** @type {__VLS_StyleScopedClasses['help-text']} */ ;
if (__VLS_ctx.store.mode === 'simple') {
}
else {
}
// @ts-ignore
[store, store,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
