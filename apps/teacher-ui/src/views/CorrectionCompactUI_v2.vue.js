/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';
import { GradingKeyService, AlternativeGradingService, AlternativeGradingUIHelper, STANDARD_ALTERNATIVE_SCALE, } from '@viccoboard/exams';
const router = useRouter();
// Props/State
const exam = ref(null);
const candidates = ref([]);
const corrections = ref(new Map());
const currentCandidate = ref(null);
const currentCorrection = ref(null);
// UI State
const candidateFilter = ref('');
const scoringMode = ref('numeric');
const taskScores = ref({});
const taskAlternativeGrades = ref({});
const taskComments = ref({});
const markAsSpecial = ref(false);
const specialNotes = ref('');
const showTipsModal = ref(false);
const tipsSearchQuery = ref('');
const selectedTipsIds = ref([]);
const allSupportTips = ref([]);
const hasChanges = ref(false);
// Alternative grading configuration
const alternativeGrades = computed(() => AlternativeGradingUIHelper.getAllGradeButtons(STANDARD_ALTERNATIVE_SCALE));
const filteredCandidates = computed(() => {
    const filter = candidateFilter.value.toLowerCase();
    return candidates.value.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(filter));
});
const currentCandidateIndex = computed(() => candidates.value.findIndex(c => c.id === currentCandidate.value?.id));
const totalPoints = computed(() => {
    if (scoringMode.value === 'numeric') {
        return Object.values(taskScores.value).reduce((sum, pts) => sum + pts, 0);
    }
    else {
        // Calculate from alternative grades
        if (!exam.value)
            return 0;
        return exam.value.structure.tasks.reduce((sum, task) => {
            const grade = taskAlternativeGrades.value[task.id];
            if (grade) {
                return sum + AlternativeGradingService.toNumericPoints(grade, task.points, STANDARD_ALTERNATIVE_SCALE);
            }
            return sum;
        }, 0);
    }
});
const percentageScore = computed(() => {
    if (!exam.value || exam.value.gradingKey.totalPoints === 0)
        return 0;
    return (totalPoints.value / exam.value.gradingKey.totalPoints) * 100;
});
const currentGrade = computed(() => {
    if (!exam.value)
        return 'N/A';
    const result = GradingKeyService.calculateGrade(totalPoints.value, exam.value.gradingKey);
    return result.grade;
});
const pointsToNextGrade = computed(() => {
    if (!exam.value)
        return 0;
    return GradingKeyService.pointsToNextGrade(totalPoints.value, exam.value.gradingKey);
});
// Methods
const selectCandidate = (candidate) => {
    saveCorrectionForCandidate();
    currentCandidate.value = candidate;
    loadCorrectionForCandidate(candidate);
};
const loadCorrectionForCandidate = async (candidate) => {
    // Simulate loading - in real implementation, fetch from repository
    let correction = corrections.value.get(candidate.id);
    if (!correction && exam.value) {
        correction = {
            id: uuidv4(),
            examId: exam.value.id,
            candidateId: candidate.id,
            taskScores: [],
            totalPoints: 0,
            totalGrade: 'N/A',
            percentageScore: 0,
            comments: [],
            supportTips: [],
            status: 'in-progress',
            lastModified: new Date()
        };
        corrections.value.set(candidate.id, correction);
    }
    currentCorrection.value = correction || null;
    // Load task scores
    taskScores.value = {};
    taskAlternativeGrades.value = {};
    taskComments.value = {};
    if (exam.value) {
        exam.value.structure.tasks.forEach(task => {
            const score = correction?.taskScores.find(ts => ts.taskId === task.id);
            taskScores.value[task.id] = score?.points || 0;
            if (score?.alternativeGrading) {
                taskAlternativeGrades.value[task.id] = score.alternativeGrading.type;
            }
            taskComments.value[task.id] = score?.comment || '';
        });
    }
};
const onScoringModeChange = () => {
    // When switching modes, convert scores
    if (scoringMode.value === 'alternative' && exam.value) {
        // Convert numeric to alternative
        exam.value.structure.tasks.forEach(task => {
            const numericPoints = taskScores.value[task.id] || 0;
            const grade = AlternativeGradingService.fromNumericPoints(numericPoints, task.points, STANDARD_ALTERNATIVE_SCALE);
            taskAlternativeGrades.value[task.id] = grade;
        });
    }
    else if (scoringMode.value === 'numeric' && exam.value) {
        // Convert alternative to numeric (already handled by computed totalPoints)
        exam.value.structure.tasks.forEach(task => {
            const grade = taskAlternativeGrades.value[task.id];
            if (grade) {
                const points = AlternativeGradingService.toNumericPoints(grade, task.points, STANDARD_ALTERNATIVE_SCALE);
                taskScores.value[task.id] = points;
            }
        });
    }
};
const setAlternativeGrade = (taskId, grade) => {
    taskAlternativeGrades.value[taskId] = grade;
    updateGrade();
};
const getGradeLabel = (grade) => {
    const config = AlternativeGradingService.getGradeConfig(grade, STANDARD_ALTERNATIVE_SCALE);
    return `${config.emoji} ${config.label}`;
};
const getAlternativeGradePoints = (taskId, maxPoints) => {
    const grade = taskAlternativeGrades.value[taskId];
    if (!grade)
        return 0;
    return AlternativeGradingService.toNumericPoints(grade, maxPoints, STANDARD_ALTERNATIVE_SCALE);
};
const saveCorrectionForCandidate = async () => {
    if (!currentCandidate.value || !currentCorrection.value || !exam.value)
        return;
    const taskScoresArray = exam.value.structure.tasks.map(task => {
        const score = {
            taskId: task.id,
            points: scoringMode.value === 'numeric' ? (taskScores.value[task.id] || 0) : getAlternativeGradePoints(task.id, task.points),
            maxPoints: task.points,
            comment: taskComments.value[task.id],
            timestamp: new Date()
        };
        // Add alternative grading info if in alternative mode
        if (scoringMode.value === 'alternative' && taskAlternativeGrades.value[task.id]) {
            score.alternativeGrading = AlternativeGradingService.createAlternativeGrading(taskAlternativeGrades.value[task.id], task.points, STANDARD_ALTERNATIVE_SCALE);
        }
        return score;
    });
    currentCorrection.value.taskScores = taskScoresArray;
    currentCorrection.value.totalPoints = totalPoints.value;
    currentCorrection.value.totalGrade = currentGrade.value;
    currentCorrection.value.percentageScore = percentageScore.value;
    currentCorrection.value.lastModified = new Date();
    corrections.value.set(currentCandidate.value.id, currentCorrection.value);
    hasChanges.value = true;
};
const finalizeCorrectionForCandidate = async () => {
    if (!currentCorrection.value)
        return;
    currentCorrection.value.status = 'completed';
    currentCorrection.value.correctedAt = new Date();
    await saveCorrectionForCandidate();
};
const updateGrade = () => {
    // Grade updates automatically via computed properties
};
const removeSupportTip = (tipId) => {
    if (!currentCorrection.value)
        return;
    currentCorrection.value.supportTips = currentCorrection.value.supportTips.filter(st => st.supportTipId !== tipId);
    hasChanges.value = true;
};
const toggleTipSelection = (tipId) => {
    const idx = selectedTipsIds.value.indexOf(tipId);
    if (idx >= 0) {
        selectedTipsIds.value.splice(idx, 1);
    }
    else {
        selectedTipsIds.value.push(tipId);
    }
};
const applySelectedTips = () => {
    if (!currentCorrection.value)
        return;
    const newTips = selectedTipsIds.value.map(id => ({
        supportTipId: id,
        assignedAt: new Date()
    }));
    currentCorrection.value.supportTips = newTips;
    showTipsModal.value = false;
    hasChanges.value = true;
};
const saveCorrectionBatch = async () => {
    // Save all corrections
    console.log('Saving all corrections...', corrections.value);
    hasChanges.value = false;
};
const getCorrectionStatus = (candidateId) => {
    const correction = corrections.value.get(candidateId);
    return correction ? correction.status : null;
};
const correctionPercentage = (candidateId) => {
    const correction = corrections.value.get(candidateId);
    if (!correction || !exam.value)
        return 0;
    const scoredTasks = correction.taskScores.filter(ts => ts.points > 0).length;
    const totalTasks = exam.value.structure.tasks.length;
    return totalTasks > 0 ? Math.round((scoredTasks / totalTasks) * 100) : 0;
};
const goBack = () => {
    router.push('/exams');
};
onMounted(async () => {
    // Load exam and candidates from route params
    // For now, mock data
    exam.value = {
        id: 'exam-1',
        title: 'Mathematics Test',
        mode: Exams.ExamMode.Simple,
        structure: {
            parts: [],
            tasks: [
                {
                    id: 'task-1',
                    level: 1,
                    order: 0,
                    title: 'Task 1',
                    points: 10,
                    isChoice: false,
                    criteria: [],
                    allowComments: true,
                    allowSupportTips: true,
                    commentBoxEnabled: true,
                    subtasks: []
                },
                {
                    id: 'task-2',
                    level: 1,
                    order: 1,
                    title: 'Task 2',
                    points: 15,
                    isChoice: false,
                    criteria: [],
                    allowComments: true,
                    allowSupportTips: true,
                    commentBoxEnabled: true,
                    subtasks: []
                }
            ],
            allowsComments: true,
            allowsSupportTips: true,
            totalPoints: 25
        },
        gradingKey: {
            id: 'key-1',
            name: 'Standard',
            type: Exams.GradingKeyType.Percentage,
            totalPoints: 25,
            gradeBoundaries: [
                { grade: 1, minPercentage: 92, displayValue: '1' },
                { grade: 2, minPercentage: 81, displayValue: '2' },
                { grade: 3, minPercentage: 70, displayValue: '3' },
                { grade: 4, minPercentage: 60, displayValue: '4' },
                { grade: 5, minPercentage: 50, displayValue: '5' },
                { grade: 6, minPercentage: 0, displayValue: '6' }
            ],
            roundingRule: { type: 'nearest', decimalPlaces: 1 },
            errorPointsToGrade: false,
            customizable: true,
            modifiedAfterCorrection: false
        },
        printPresets: [],
        candidates: [],
        status: 'in-progress',
        createdAt: new Date(),
        lastModified: new Date()
    };
    candidates.value = [
        { id: '1', examId: 'exam-1', firstName: 'Alice', lastName: 'Smith' },
        { id: '2', examId: 'exam-1', firstName: 'Bob', lastName: 'Johnson' },
        { id: '3', examId: 'exam-1', firstName: 'Charlie', lastName: 'Brown' }
    ];
    if (candidates.value.length > 0) {
        selectCandidate(candidates.value[0]);
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['mode-option']} */ ;
/** @type {__VLS_StyleScopedClasses['grade-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['grade-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "correction-container" },
});
/** @type {__VLS_StyleScopedClasses['correction-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "correction-header" },
});
/** @type {__VLS_StyleScopedClasses['correction-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-info" },
});
/** @type {__VLS_StyleScopedClasses['header-info']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
(__VLS_ctx.exam?.title || 'Exam Correction');
if (__VLS_ctx.exam) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "exam-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['exam-meta']} */ ;
    (__VLS_ctx.candidates.length);
    (__VLS_ctx.exam.gradingKey.totalPoints);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.saveCorrectionBatch) },
    ...{ class: "btn-primary" },
    disabled: (!__VLS_ctx.hasChanges),
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
(__VLS_ctx.hasChanges ? 'Save All Changes' : 'All Saved');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "btn-secondary" },
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
if (__VLS_ctx.exam) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "correction-layout" },
    });
    /** @type {__VLS_StyleScopedClasses['correction-layout']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "candidates-sidebar" },
    });
    /** @type {__VLS_StyleScopedClasses['candidates-sidebar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sidebar-header" },
    });
    /** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.candidates.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.candidateFilter),
        type: "text",
        placeholder: "Search...",
        ...{ class: "filter-input" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "candidates-list" },
    });
    /** @type {__VLS_StyleScopedClasses['candidates-list']} */ ;
    for (const [candidate] of __VLS_vFor((__VLS_ctx.filteredCandidates))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.exam))
                        return;
                    __VLS_ctx.selectCandidate(candidate);
                    // @ts-ignore
                    [exam, exam, exam, exam, candidates, candidates, saveCorrectionBatch, hasChanges, hasChanges, goBack, candidateFilter, filteredCandidates, selectCandidate,];
                } },
            key: (candidate.id),
            ...{ class: (['candidate-btn', { active: __VLS_ctx.currentCandidate?.id === candidate.id }]) },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        /** @type {__VLS_StyleScopedClasses['candidate-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "candidate-name" },
        });
        /** @type {__VLS_StyleScopedClasses['candidate-name']} */ ;
        (candidate.firstName);
        (candidate.lastName);
        if (__VLS_ctx.getCorrectionStatus(candidate.id)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "status-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
            (__VLS_ctx.correctionPercentage(candidate.id));
        }
        // @ts-ignore
        [currentCandidate, getCorrectionStatus, correctionPercentage,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "correction-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['correction-panel']} */ ;
    if (__VLS_ctx.currentCandidate && __VLS_ctx.currentCorrection && __VLS_ctx.exam) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "correction-form" },
        });
        /** @type {__VLS_StyleScopedClasses['correction-form']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "candidate-header" },
        });
        /** @type {__VLS_StyleScopedClasses['candidate-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        (__VLS_ctx.currentCandidate.firstName);
        (__VLS_ctx.currentCandidate.lastName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status" },
            ...{ class: (`status-${__VLS_ctx.currentCorrection.status}`) },
        });
        /** @type {__VLS_StyleScopedClasses['status']} */ ;
        (__VLS_ctx.currentCorrection.status);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "scoring-mode-section" },
        });
        /** @type {__VLS_StyleScopedClasses['scoring-mode-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mode-selector" },
        });
        /** @type {__VLS_StyleScopedClasses['mode-selector']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "mode-option" },
        });
        /** @type {__VLS_StyleScopedClasses['mode-option']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (__VLS_ctx.onScoringModeChange) },
            type: "radio",
            value: "numeric",
        });
        (__VLS_ctx.scoringMode);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "mode-option" },
        });
        /** @type {__VLS_StyleScopedClasses['mode-option']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (__VLS_ctx.onScoringModeChange) },
            type: "radio",
            value: "alternative",
        });
        (__VLS_ctx.scoringMode);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "scoring-section" },
        });
        /** @type {__VLS_StyleScopedClasses['scoring-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        for (const [task] of __VLS_vFor((__VLS_ctx.exam.structure.tasks))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (task.id),
                ...{ class: "task-scoring" },
            });
            /** @type {__VLS_StyleScopedClasses['task-scoring']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "task-title" },
            });
            /** @type {__VLS_StyleScopedClasses['task-title']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
            (task.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "max-points" },
            });
            /** @type {__VLS_StyleScopedClasses['max-points']} */ ;
            (task.points);
            if (__VLS_ctx.scoringMode === 'numeric') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "score-input-group" },
                });
                /** @type {__VLS_StyleScopedClasses['score-input-group']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                    ...{ onInput: (__VLS_ctx.updateGrade) },
                    type: "number",
                    min: "0",
                    max: (task.points),
                    step: "0.5",
                    ...{ class: "score-input" },
                });
                (__VLS_ctx.taskScores[task.id]);
                /** @type {__VLS_StyleScopedClasses['score-input']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "points-to-next" },
                });
                /** @type {__VLS_StyleScopedClasses['points-to-next']} */ ;
                (__VLS_ctx.pointsToNextGrade);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "alternative-score-group" },
                });
                /** @type {__VLS_StyleScopedClasses['alternative-score-group']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "grade-buttons" },
                });
                /** @type {__VLS_StyleScopedClasses['grade-buttons']} */ ;
                for (const [grade] of __VLS_vFor((__VLS_ctx.alternativeGrades))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.exam))
                                    return;
                                if (!(__VLS_ctx.currentCandidate && __VLS_ctx.currentCorrection && __VLS_ctx.exam))
                                    return;
                                if (!!(__VLS_ctx.scoringMode === 'numeric'))
                                    return;
                                __VLS_ctx.setAlternativeGrade(task.id, grade.type);
                                // @ts-ignore
                                [exam, exam, currentCandidate, currentCandidate, currentCandidate, currentCorrection, currentCorrection, currentCorrection, onScoringModeChange, onScoringModeChange, scoringMode, scoringMode, scoringMode, updateGrade, taskScores, pointsToNextGrade, alternativeGrades, setAlternativeGrade,];
                            } },
                        key: (grade.type),
                        ...{ class: (['grade-btn', { active: __VLS_ctx.taskAlternativeGrades[task.id] === grade.type }]) },
                        ...{ style: ({ backgroundColor: grade.backgroundColor }) },
                        title: (grade.title),
                    });
                    /** @type {__VLS_StyleScopedClasses['active']} */ ;
                    /** @type {__VLS_StyleScopedClasses['grade-btn']} */ ;
                    (grade.label);
                    // @ts-ignore
                    [taskAlternativeGrades,];
                }
                if (__VLS_ctx.taskAlternativeGrades[task.id]) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "selected-grade-info" },
                    });
                    /** @type {__VLS_StyleScopedClasses['selected-grade-info']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "grade-label" },
                    });
                    /** @type {__VLS_StyleScopedClasses['grade-label']} */ ;
                    (__VLS_ctx.getGradeLabel(__VLS_ctx.taskAlternativeGrades[task.id]));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "grade-points" },
                    });
                    /** @type {__VLS_StyleScopedClasses['grade-points']} */ ;
                    (__VLS_ctx.getAlternativeGradePoints(task.id, task.points));
                }
            }
            if (__VLS_ctx.exam.structure.allowsComments) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "comment-box" },
                });
                /** @type {__VLS_StyleScopedClasses['comment-box']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
                    value: (__VLS_ctx.taskComments[task.id]),
                    placeholder: (`Comment for ${task.title}...`),
                    ...{ class: "comment-input" },
                    rows: "2",
                });
                /** @type {__VLS_StyleScopedClasses['comment-input']} */ ;
            }
            // @ts-ignore
            [exam, taskAlternativeGrades, taskAlternativeGrades, getGradeLabel, getAlternativeGradePoints, taskComments,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "total-score-section" },
        });
        /** @type {__VLS_StyleScopedClasses['total-score-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "score-display" },
        });
        /** @type {__VLS_StyleScopedClasses['score-display']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "score-item" },
        });
        /** @type {__VLS_StyleScopedClasses['score-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "score-value" },
        });
        /** @type {__VLS_StyleScopedClasses['score-value']} */ ;
        (__VLS_ctx.totalPoints);
        (__VLS_ctx.exam.gradingKey.totalPoints);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "score-item" },
        });
        /** @type {__VLS_StyleScopedClasses['score-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "score-value" },
        });
        /** @type {__VLS_StyleScopedClasses['score-value']} */ ;
        (__VLS_ctx.percentageScore.toFixed(1));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "score-item highlight" },
        });
        /** @type {__VLS_StyleScopedClasses['score-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['highlight']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "grade-value" },
        });
        /** @type {__VLS_StyleScopedClasses['grade-value']} */ ;
        (__VLS_ctx.currentGrade);
        if (__VLS_ctx.exam.structure.allowsSupportTips) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "support-tips-section" },
            });
            /** @type {__VLS_StyleScopedClasses['support-tips-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "tips-input" },
            });
            /** @type {__VLS_StyleScopedClasses['tips-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.exam))
                            return;
                        if (!(__VLS_ctx.currentCandidate && __VLS_ctx.currentCorrection && __VLS_ctx.exam))
                            return;
                        if (!(__VLS_ctx.exam.structure.allowsSupportTips))
                            return;
                        __VLS_ctx.showTipsModal = true;
                        // @ts-ignore
                        [exam, exam, totalPoints, percentageScore, currentGrade, showTipsModal,];
                    } },
                ...{ class: "btn-secondary-small" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-secondary-small']} */ ;
            if (__VLS_ctx.currentCorrection.supportTips.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "assigned-tips" },
                });
                /** @type {__VLS_StyleScopedClasses['assigned-tips']} */ ;
                for (const [tip] of __VLS_vFor((__VLS_ctx.currentCorrection.supportTips))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        key: (tip.supportTipId),
                        ...{ class: "tip-badge" },
                    });
                    /** @type {__VLS_StyleScopedClasses['tip-badge']} */ ;
                    (tip.supportTipId);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(__VLS_ctx.exam))
                                    return;
                                if (!(__VLS_ctx.currentCandidate && __VLS_ctx.currentCorrection && __VLS_ctx.exam))
                                    return;
                                if (!(__VLS_ctx.exam.structure.allowsSupportTips))
                                    return;
                                if (!(__VLS_ctx.currentCorrection.supportTips.length > 0))
                                    return;
                                __VLS_ctx.removeSupportTip(tip.supportTipId);
                                // @ts-ignore
                                [currentCorrection, currentCorrection, removeSupportTip,];
                            } },
                        ...{ class: "btn-remove" },
                    });
                    /** @type {__VLS_StyleScopedClasses['btn-remove']} */ ;
                    // @ts-ignore
                    [];
                }
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "highlight-section" },
        });
        /** @type {__VLS_StyleScopedClasses['highlight-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "checkbox-label" },
        });
        /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (__VLS_ctx.markAsSpecial);
        if (__VLS_ctx.markAsSpecial) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "special-input" },
            });
            /** @type {__VLS_StyleScopedClasses['special-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
                value: (__VLS_ctx.specialNotes),
                placeholder: "Notes about special aspects of this work...",
                ...{ class: "comment-input" },
                rows: "3",
            });
            /** @type {__VLS_StyleScopedClasses['comment-input']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "nav-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['nav-buttons']} */ ;
        if (__VLS_ctx.currentCandidateIndex > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.exam))
                            return;
                        if (!(__VLS_ctx.currentCandidate && __VLS_ctx.currentCorrection && __VLS_ctx.exam))
                            return;
                        if (!(__VLS_ctx.currentCandidateIndex > 0))
                            return;
                        __VLS_ctx.selectCandidate(__VLS_ctx.candidates[__VLS_ctx.currentCandidateIndex - 1]);
                        // @ts-ignore
                        [candidates, selectCandidate, markAsSpecial, markAsSpecial, specialNotes, currentCandidateIndex, currentCandidateIndex,];
                    } },
                ...{ class: "btn-nav" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-nav']} */ ;
        }
        if (__VLS_ctx.currentCandidateIndex < __VLS_ctx.candidates.length - 1) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.exam))
                            return;
                        if (!(__VLS_ctx.currentCandidate && __VLS_ctx.currentCorrection && __VLS_ctx.exam))
                            return;
                        if (!(__VLS_ctx.currentCandidateIndex < __VLS_ctx.candidates.length - 1))
                            return;
                        __VLS_ctx.selectCandidate(__VLS_ctx.candidates[__VLS_ctx.currentCandidateIndex + 1]);
                        // @ts-ignore
                        [candidates, candidates, selectCandidate, currentCandidateIndex, currentCandidateIndex,];
                    } },
                ...{ class: "btn-nav" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-nav']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.saveCorrectionForCandidate) },
            ...{ class: "btn-primary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.finalizeCorrectionForCandidate) },
            ...{ class: "btn-success" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-success']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-candidate" },
        });
        /** @type {__VLS_StyleScopedClasses['no-candidate']} */ ;
    }
}
if (__VLS_ctx.showTipsModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showTipsModal))
                    return;
                __VLS_ctx.showTipsModal = false;
                // @ts-ignore
                [showTipsModal, showTipsModal, saveCorrectionForCandidate, finalizeCorrectionForCandidate,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.tipsSearchQuery),
        type: "text",
        placeholder: "Search support tips...",
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tips-list" },
    });
    /** @type {__VLS_StyleScopedClasses['tips-list']} */ ;
    for (const [tip] of __VLS_vFor((__VLS_ctx.allSupportTips))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (tip.id),
            ...{ class: "tip-item" },
        });
        /** @type {__VLS_StyleScopedClasses['tip-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "checkbox-label" },
        });
        /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (...[$event]) => {
                    if (!(__VLS_ctx.showTipsModal))
                        return;
                    __VLS_ctx.toggleTipSelection(tip.id);
                    // @ts-ignore
                    [tipsSearchQuery, allSupportTips, toggleTipSelection,];
                } },
            checked: (__VLS_ctx.selectedTipsIds.includes(tip.id)),
            type: "checkbox",
        });
        (tip.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "tip-description" },
        });
        /** @type {__VLS_StyleScopedClasses['tip-description']} */ ;
        (tip.shortDescription);
        // @ts-ignore
        [selectedTipsIds,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-buttons" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-buttons']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.applySelectedTips) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showTipsModal))
                    return;
                __VLS_ctx.showTipsModal = false;
                // @ts-ignore
                [showTipsModal, applySelectedTips,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
