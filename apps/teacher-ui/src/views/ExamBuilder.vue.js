/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useExamBuilderStore } from '../stores/examBuilderStore';
import ExamDetails from '../components/ExamDetails.vue';
import TaskList from '../components/TaskList.vue';
import ExamParts from '../components/ExamParts.vue';
import ExamPreview from '../components/ExamPreview.vue';
const route = useRoute();
const router = useRouter();
const store = useExamBuilderStore();
const examId = computed(() => route.params.id);
const goBack = () => {
    router.push('/exams');
};
const handleSave = async () => {
    await store.saveExam();
};
onMounted(() => {
    const id = examId.value;
    if (id) {
        store.loadExam(id);
    }
    else if (store.tasks.length === 0) {
        store.addTask();
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['builder-layout']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "exam-builder" },
});
/** @type {__VLS_StyleScopedClasses['exam-builder']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "builder-header" },
});
/** @type {__VLS_StyleScopedClasses['builder-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "title-area" },
});
/** @type {__VLS_StyleScopedClasses['title-area']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
(__VLS_ctx.store.isEditing ? 'Edit exam' : 'New exam');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "subtitle" },
});
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
(__VLS_ctx.store.mode === 'simple' ? 'Simple exam: flat task list' : 'Complex exam: nested tasks, parts');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    type: "button",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleSave) },
    type: "button",
    disabled: (!__VLS_ctx.store.canSave),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "builder-layout" },
});
/** @type {__VLS_StyleScopedClasses['builder-layout']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ class: "builder-main" },
});
/** @type {__VLS_StyleScopedClasses['builder-main']} */ ;
const __VLS_0 = ExamDetails;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_5 = TaskList;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const __VLS_10 = ExamParts;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({}));
const __VLS_12 = __VLS_11({}, ...__VLS_functionalComponentArgsRest(__VLS_11));
const __VLS_15 = ExamPreview;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({}));
const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
// @ts-ignore
[store, store, store, goBack, handleSave,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
