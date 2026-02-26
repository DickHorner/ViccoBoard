/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useExamsBridge } from '../composables/useExamsBridge';
const router = useRouter();
const { examRepository } = useExamsBridge();
const exams = ref([]);
const loading = ref(true);
const loadExams = async () => {
    loading.value = true;
    const result = await examRepository?.findAll() ?? [];
    exams.value = result;
    loading.value = false;
};
const createNew = () => {
    router.push('/exams/new');
};
const editExam = (id) => {
    router.push(`/exams/${id}`);
};
const openCorrection = (id) => {
    router.push(`/corrections/${id}`);
};
const formatStatus = (status) => {
    switch (status) {
        case 'in-progress':
            return 'In progress';
        case 'completed':
            return 'Completed';
        default:
            return 'Draft';
    }
};
const formatDate = (date) => new Date(date).toLocaleDateString();
onMounted(() => {
    loadExams();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['exam-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "exams-overview" },
});
/** @type {__VLS_StyleScopedClasses['exams-overview']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "overview-header" },
});
/** @type {__VLS_StyleScopedClasses['overview-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "subtitle" },
});
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.createNew) },
    ...{ class: "primary" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "state-card" },
    });
    /** @type {__VLS_StyleScopedClasses['state-card']} */ ;
}
else if (__VLS_ctx.exams.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "state-card" },
    });
    /** @type {__VLS_StyleScopedClasses['state-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.createNew) },
        ...{ class: "primary" },
        type: "button",
    });
    /** @type {__VLS_StyleScopedClasses['primary']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "exam-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['exam-grid']} */ ;
    for (const [exam] of __VLS_vFor((__VLS_ctx.exams))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
            key: (exam.id),
            ...{ class: "exam-card" },
        });
        /** @type {__VLS_StyleScopedClasses['exam-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "exam-header" },
        });
        /** @type {__VLS_StyleScopedClasses['exam-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (exam.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status" },
            ...{ class: (`status-${exam.status}`) },
        });
        /** @type {__VLS_StyleScopedClasses['status']} */ ;
        (__VLS_ctx.formatStatus(exam.status));
        if (exam.description) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "exam-desc" },
            });
            /** @type {__VLS_StyleScopedClasses['exam-desc']} */ ;
            (exam.description);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "exam-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['exam-meta']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (exam.structure.tasks.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (exam.structure.totalPoints);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "meta-date" },
        });
        /** @type {__VLS_StyleScopedClasses['meta-date']} */ ;
        (__VLS_ctx.formatDate(exam.lastModified));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "exam-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['exam-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.exams.length === 0))
                        return;
                    __VLS_ctx.editExam(exam.id);
                    // @ts-ignore
                    [createNew, createNew, loading, exams, exams, formatStatus, formatDate, editExam,];
                } },
            ...{ class: "ghost" },
            type: "button",
        });
        /** @type {__VLS_StyleScopedClasses['ghost']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.exams.length === 0))
                        return;
                    __VLS_ctx.openCorrection(exam.id);
                    // @ts-ignore
                    [openCorrection,];
                } },
            ...{ class: "ghost" },
            type: "button",
        });
        /** @type {__VLS_StyleScopedClasses['ghost']} */ ;
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
