/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createUuid } from '../utils/uuid';
import { useExamsBridge } from '../composables/useExamsBridge';
import { useToast } from '../composables/useToast';
const route = useRoute();
const router = useRouter();
const { examRepository, recordCorrectionUseCase, gradingKeyService } = useExamsBridge();
const { success, error } = useToast();
const exam = ref(null);
const tasks = ref([]);
const candidates = ref([]);
const selectedCandidateId = ref('');
const candidateFirstName = ref('');
const candidateLastName = ref('');
const taskScores = ref({});
const useAlternativeGrading = ref(false);
const alternativeGrades = ref({});
const alternativeOptions = ['++', '+', '0', '-', '--'];
// Tab navigation: collect score input refs by index
const scoreInputEls = ref([]);
const registerScoreInput = (el, index) => {
    if (el) {
        scoreInputEls.value[index] = el;
        return;
    }
    delete scoreInputEls.value[index];
};
const focusScoreInput = (index) => {
    const target = scoreInputEls.value[index];
    if (target) {
        target.focus();
        target.select();
    }
};
const onScoreKeydown = (event, index) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const next = scoreInputEls.value[index + 1];
        if (next) {
            next.focus();
            next.select();
        }
    }
};
const alternativeToPoints = (task, option) => {
    const max = task.points || 0;
    switch (option) {
        case '++':
            return max;
        case '+':
            return max * 0.75;
        case '0':
            return max * 0.5;
        case '-':
            return max * 0.25;
        case '--':
            return 0;
        default:
            return 0;
    }
};
const setAlternative = (task, option) => {
    alternativeGrades.value[task.id] = option;
    taskScores.value[task.id] = Number(alternativeToPoints(task, option).toFixed(1));
};
const maxPoints = computed(() => exam.value?.gradingKey.totalPoints ?? 0);
const totalPoints = computed(() => tasks.value.reduce((sum, task) => sum + (taskScores.value[task.id] || 0), 0));
const percentageScore = computed(() => maxPoints.value > 0 ? (totalPoints.value / maxPoints.value) * 100 : 0);
const pointsToNextGrade = computed(() => {
    const gradingKey = exam.value?.gradingKey;
    if (!gradingKey)
        return 'n/a';
    const pts = gradingKeyService?.pointsToNextGrade(totalPoints.value, gradingKey);
    if (pts === undefined || pts === null)
        return 'n/a';
    return pts.toFixed(1);
});
const canSave = computed(() => {
    return Boolean(exam.value && selectedCandidateId.value);
});
const loadExam = async () => {
    const examId = route.params.id;
    if (!examId) {
        error('No exam ID provided.');
        router.push('/exams');
        return;
    }
    const data = await examRepository?.findById(examId) ?? null;
    if (!data) {
        error('Exam not found.');
        router.push('/exams');
        return;
    }
    exam.value = data;
    candidates.value = data.candidates;
    tasks.value = data.structure.tasks.filter(task => task.level === 1);
    taskScores.value = {};
    alternativeGrades.value = {};
    tasks.value.forEach(task => {
        taskScores.value[task.id] = 0;
    });
};
const addCandidate = async () => {
    if (!exam.value)
        return;
    if (!candidateFirstName.value.trim() || !candidateLastName.value.trim()) {
        error('Provide first and last name.');
        return;
    }
    const candidate = {
        id: createUuid(),
        examId: exam.value.id,
        firstName: candidateFirstName.value.trim(),
        lastName: candidateLastName.value.trim()
    };
    candidates.value = [...candidates.value, candidate];
    exam.value.candidates = candidates.value;
    await examRepository?.update(exam.value.id, exam.value);
    selectedCandidateId.value = candidate.id;
    candidateFirstName.value = '';
    candidateLastName.value = '';
    success('Candidate added.');
};
const saveCorrection = async () => {
    if (!exam.value || !selectedCandidateId.value)
        return;
    const now = new Date();
    const entry = {
        id: createUuid(),
        examId: exam.value.id,
        candidateId: selectedCandidateId.value,
        taskScores: tasks.value.map(task => ({
            taskId: task.id,
            points: taskScores.value[task.id] || 0,
            maxPoints: task.points,
            timestamp: now
        })),
        totalPoints: totalPoints.value,
        totalGrade: percentageScore.value.toFixed(1),
        percentageScore: percentageScore.value,
        comments: [],
        supportTips: [],
        status: 'in-progress',
        lastModified: now
    };
    await recordCorrectionUseCase?.execute(entry);
    success('Correction saved.');
};
const goBack = () => router.push('/exams');
watch(useAlternativeGrading, (enabled) => {
    if (enabled) {
        tasks.value.forEach(task => {
            if (!alternativeGrades.value[task.id]) {
                setAlternative(task, '0');
            }
        });
        return;
    }
    nextTick(() => focusScoreInput(0));
});
watch(tasks, () => {
    // Clear stale refs; the upcoming render will repopulate via registerScoreInput
    scoreInputEls.value = [];
    if (!useAlternativeGrading.value) {
        nextTick(() => focusScoreInput(0));
    }
});
onMounted(() => {
    loadExam();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pill']} */ ;
/** @type {__VLS_StyleScopedClasses['choice-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['alt-button']} */ ;
/** @type {__VLS_StyleScopedClasses['alt-button']} */ ;
/** @type {__VLS_StyleScopedClasses['candidate-add']} */ ;
/** @type {__VLS_StyleScopedClasses['task-row']} */ ;
/** @type {__VLS_StyleScopedClasses['summary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "correction-compact" },
});
/** @type {__VLS_StyleScopedClasses['correction-compact']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "correction-header" },
});
/** @type {__VLS_StyleScopedClasses['correction-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "subtitle" },
});
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "ghost" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['ghost']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.saveCorrection) },
    ...{ class: "primary" },
    type: "button",
    disabled: (!__VLS_ctx.canSave),
});
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "panel" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "panel-header" },
});
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
if (__VLS_ctx.exam) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "pill" },
    });
    /** @type {__VLS_StyleScopedClasses['pill']} */ ;
    (__VLS_ctx.exam.title);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid-two" },
});
/** @type {__VLS_StyleScopedClasses['grid-two']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    for: "candidate-select",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    id: "candidate-select",
    value: (__VLS_ctx.selectedCandidateId),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (const [candidate] of __VLS_vFor((__VLS_ctx.candidates))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (candidate.id),
        value: (candidate.id),
    });
    (candidate.firstName);
    (candidate.lastName);
    // @ts-ignore
    [goBack, saveCorrection, canSave, exam, exam, selectedCandidateId, candidates,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field" },
});
/** @type {__VLS_StyleScopedClasses['field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "candidate-add" },
});
/** @type {__VLS_StyleScopedClasses['candidate-add']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.candidateFirstName),
    type: "text",
    placeholder: "First name",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.candidateLastName),
    type: "text",
    placeholder: "Last name",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.addCandidate) },
    ...{ class: "ghost" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['ghost']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "panel" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "panel-header" },
});
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary" },
});
/** @type {__VLS_StyleScopedClasses['summary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.totalPoints);
(__VLS_ctx.maxPoints);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "pill" },
});
/** @type {__VLS_StyleScopedClasses['pill']} */ ;
(__VLS_ctx.percentageScore.toFixed(1));
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "choice-toggle" },
});
/** @type {__VLS_StyleScopedClasses['choice-toggle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "checkbox",
});
(__VLS_ctx.useAlternativeGrading);
if (__VLS_ctx.tasks.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty" },
    });
    /** @type {__VLS_StyleScopedClasses['empty']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "task-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['task-grid']} */ ;
    for (const [task, taskIndex] of __VLS_vFor((__VLS_ctx.tasks))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (task.id),
            ...{ class: "task-row" },
        });
        /** @type {__VLS_StyleScopedClasses['task-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "task-info" },
        });
        /** @type {__VLS_StyleScopedClasses['task-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (task.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "muted" },
        });
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
        (task.points);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "task-score" },
        });
        /** @type {__VLS_StyleScopedClasses['task-score']} */ ;
        if (__VLS_ctx.useAlternativeGrading) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "alt-grade-group" },
            });
            /** @type {__VLS_StyleScopedClasses['alt-grade-group']} */ ;
            for (const [option] of __VLS_vFor((__VLS_ctx.alternativeOptions))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.tasks.length === 0))
                                return;
                            if (!(__VLS_ctx.useAlternativeGrading))
                                return;
                            __VLS_ctx.setAlternative(task, option);
                            // @ts-ignore
                            [candidateFirstName, candidateLastName, addCandidate, totalPoints, maxPoints, percentageScore, useAlternativeGrading, useAlternativeGrading, tasks, tasks, alternativeOptions, setAlternative,];
                        } },
                    key: (option),
                    type: "button",
                    ...{ class: "alt-button" },
                    ...{ class: ({ active: __VLS_ctx.alternativeGrades[task.id] === option }) },
                });
                /** @type {__VLS_StyleScopedClasses['alt-button']} */ ;
                /** @type {__VLS_StyleScopedClasses['active']} */ ;
                (option);
                // @ts-ignore
                [alternativeGrades,];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onFocus: (...[$event]) => {
                        if (!!(__VLS_ctx.tasks.length === 0))
                            return;
                        if (!!(__VLS_ctx.useAlternativeGrading))
                            return;
                        $event.target.select();
                        // @ts-ignore
                        [];
                    } },
                ...{ onKeydown: (...[$event]) => {
                        if (!!(__VLS_ctx.tasks.length === 0))
                            return;
                        if (!!(__VLS_ctx.useAlternativeGrading))
                            return;
                        __VLS_ctx.onScoreKeydown($event, taskIndex);
                        // @ts-ignore
                        [onScoreKeydown,];
                    } },
                ref: ((el) => __VLS_ctx.registerScoreInput(el, taskIndex)),
                type: "number",
                min: "0",
                max: (task.points),
                step: "0.5",
                ...{ class: "score-input" },
                tabindex: (taskIndex + 1),
                'aria-label': (`Points for ${task.title} (max ${task.points})`),
            });
            (__VLS_ctx.taskScores[task.id]);
            /** @type {__VLS_StyleScopedClasses['score-input']} */ ;
        }
        // @ts-ignore
        [registerScoreInput, taskScores,];
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "panel summary-panel" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary" },
});
/** @type {__VLS_StyleScopedClasses['summary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "muted" },
});
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
(__VLS_ctx.pointsToNextGrade);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "summary-value" },
});
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.totalPoints);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "muted" },
});
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
(__VLS_ctx.maxPoints);
// @ts-ignore
[totalPoints, maxPoints, pointsToNextGrade,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
