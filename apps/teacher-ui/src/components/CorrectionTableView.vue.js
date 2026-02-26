/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed } from 'vue';
const props = defineProps();
const emit = defineEmits();
// View state
const viewMode = ref('table');
const searchQuery = ref('');
const sortBy = ref('name');
const currentTaskId = ref('');
const showCommentsModal = ref(false);
const selectedCandidate = ref(null);
const commentTaskId = ref(undefined);
const editingComment = ref({ text: '', printable: true, availableAfterReturn: true });
const copyTargetIds = ref([]);
// Computed properties
const filteredAndSortedCandidates = computed(() => {
    let filtered = props.candidates.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.value.toLowerCase()));
    return filtered.sort((a, b) => {
        if (sortBy.value.startsWith('task:')) {
            const taskId = sortBy.value.slice(5);
            return getTaskScore(b.id, taskId) - getTaskScore(a.id, taskId);
        }
        switch (sortBy.value) {
            case 'name':
                return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
            case 'total':
                return getTotalPoints(b.id) - getTotalPoints(a.id);
            case 'percentage':
                return getPercentage(b.id) - getPercentage(a.id);
            case 'grade':
                return getGrade(a.id).localeCompare(getGrade(b.id));
            default:
                return 0;
        }
    });
});
const totalCandidates = computed(() => props.candidates.length);
const completedCount = computed(() => Array.from(props.corrections.values()).filter(c => c.status === 'completed').length);
const averageScore = computed(() => {
    const scores = props.candidates.map(c => getTotalPoints(c.id));
    return scores.reduce((sum, s) => sum + s, 0) / props.candidates.length;
});
const averageGrade = computed(() => {
    const grades = props.candidates.map(c => {
        const gradeStr = getGrade(c.id);
        return parseInt(gradeStr) || 0;
    });
    const avg = grades.reduce((sum, g) => sum + g, 0) / props.candidates.length;
    return isNaN(avg) ? 'N/A' : avg.toFixed(1);
});
// Helper methods
const getTaskScore = (candidateId, taskId) => {
    const correction = props.corrections.get(candidateId);
    const taskScore = correction?.taskScores.find(ts => ts.taskId === taskId);
    return taskScore?.points || 0;
};
const getTaskMaxPoints = (taskId) => {
    const task = props.exam.structure.tasks.find(t => t.id === taskId);
    return task?.points || 0;
};
const getTotalPoints = (candidateId) => {
    const correction = props.corrections.get(candidateId);
    return correction?.totalPoints || 0;
};
const getPercentage = (candidateId) => {
    const total = getTotalPoints(candidateId);
    if (props.exam.gradingKey.totalPoints === 0)
        return 0;
    return (total / props.exam.gradingKey.totalPoints) * 100;
};
const getGrade = (candidateId) => {
    const correction = props.corrections.get(candidateId);
    return correction?.totalGrade?.toString() || 'N/A';
};
const getCorrectionStatus = (candidateId) => {
    const correction = props.corrections.get(candidateId);
    return correction ? correction.status : null;
};
const hasComment = (candidateId, taskId) => {
    const correction = props.corrections.get(candidateId);
    const hasTaskScoreComment = !!correction?.taskScores.find(ts => ts.taskId === taskId)?.comment;
    const hasEntryComment = correction?.comments.some(c => c.taskId === taskId) ?? false;
    return hasTaskScoreComment || hasEntryComment;
};
const isTaskCompleted = (candidateId, taskId) => {
    const score = getTaskScore(candidateId, taskId);
    return score > 0;
};
const jumpToCandidate = (candidate, task) => {
    if (props.onJumpToCandidate) {
        props.onJumpToCandidate(candidate, task);
    }
};
const jumpToTaskForCandidate = (candidate, taskId) => {
    const task = props.exam.structure.tasks.find(t => t.id === taskId);
    if (task && props.onJumpToCandidate) {
        props.onJumpToCandidate(candidate, task);
    }
};
const openCommentsModal = (candidate, taskId) => {
    selectedCandidate.value = candidate;
    commentTaskId.value = taskId;
    const correction = props.corrections.get(candidate.id);
    const existingComment = taskId
        ? correction?.comments.find(c => c.taskId === taskId && c.level === 'task')
        : correction?.comments.find(c => c.level === 'exam');
    editingComment.value = {
        text: existingComment?.text || '',
        printable: existingComment?.printable ?? true,
        availableAfterReturn: existingComment?.availableAfterReturn ?? true
    };
    copyTargetIds.value = [];
    showCommentsModal.value = true;
};
// Expose for parent component usage
const __VLS_exposed = {
    openCommentsModal
};
defineExpose(__VLS_exposed);
const saveComment = () => {
    const trimmedText = editingComment.value.text.trim();
    if (selectedCandidate.value && trimmedText) {
        const commentPayload = {
            taskId: commentTaskId.value,
            level: (commentTaskId.value ? 'task' : 'exam'),
            text: trimmedText,
            printable: editingComment.value.printable,
            availableAfterReturn: editingComment.value.availableAfterReturn
        };
        emit('save-comment', {
            candidateId: selectedCandidate.value.id,
            comment: commentPayload
        });
        if (copyTargetIds.value.length > 0) {
            emit('copy-comments', {
                sourceCandidateId: selectedCandidate.value.id,
                targetCandidateIds: copyTargetIds.value,
                comment: commentPayload
            });
        }
    }
    showCommentsModal.value = false;
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
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['correction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['correction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['correction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['correction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['correction-table']} */ ;
/** @type {__VLS_StyleScopedClasses['sticky-col']} */ ;
/** @type {__VLS_StyleScopedClasses['percentage']} */ ;
/** @type {__VLS_StyleScopedClasses['grade-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['grade-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['grade-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['grade-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['awk-header']} */ ;
/** @type {__VLS_StyleScopedClasses['awk-item']} */ ;
/** @type {__VLS_StyleScopedClasses['awk-item']} */ ;
/** @type {__VLS_StyleScopedClasses['awk-score']} */ ;
/** @type {__VLS_StyleScopedClasses['score-value']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "correction-table-container" },
});
/** @type {__VLS_StyleScopedClasses['correction-table-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-header" },
});
/** @type {__VLS_StyleScopedClasses['table-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-controls" },
});
/** @type {__VLS_StyleScopedClasses['header-controls']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "filter-group" },
});
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: "Search candidates...",
    ...{ class: "search-input" },
});
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.sortBy),
    ...{ class: "sort-select" },
});
/** @type {__VLS_StyleScopedClasses['sort-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "name",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "total",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "percentage",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "grade",
});
for (const [task] of __VLS_vFor((__VLS_ctx.exam.structure.tasks))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (`sort-task-${task.id}`),
        value: (`task:${task.id}`),
    });
    (task.title);
    // @ts-ignore
    [searchQuery, sortBy, exam,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "view-toggle" },
});
/** @type {__VLS_StyleScopedClasses['view-toggle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'table';
            // @ts-ignore
            [viewMode,];
        } },
    ...{ class: (['view-btn', { active: __VLS_ctx.viewMode === 'table' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'compact';
            // @ts-ignore
            [viewMode, viewMode,];
        } },
    ...{ class: (['view-btn', { active: __VLS_ctx.viewMode === 'compact' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'awk';
            // @ts-ignore
            [viewMode, viewMode,];
        } },
    ...{ class: (['view-btn', { active: __VLS_ctx.viewMode === 'awk' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
if (__VLS_ctx.viewMode === 'table') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-view" },
    });
    /** @type {__VLS_StyleScopedClasses['table-view']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "correction-table" },
    });
    /** @type {__VLS_StyleScopedClasses['correction-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "sticky-col" },
    });
    /** @type {__VLS_StyleScopedClasses['sticky-col']} */ ;
    for (const [task] of __VLS_vFor((__VLS_ctx.exam.structure.tasks))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            key: (task.id),
            ...{ class: "task-col" },
        });
        /** @type {__VLS_StyleScopedClasses['task-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "task-header" },
        });
        /** @type {__VLS_StyleScopedClasses['task-header']} */ ;
        (task.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "task-max" },
        });
        /** @type {__VLS_StyleScopedClasses['task-max']} */ ;
        (task.points);
        // @ts-ignore
        [exam, viewMode, viewMode,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "sticky-col total-col" },
    });
    /** @type {__VLS_StyleScopedClasses['sticky-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['total-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "sticky-col percent-col" },
    });
    /** @type {__VLS_StyleScopedClasses['sticky-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['percent-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "sticky-col grade-col" },
    });
    /** @type {__VLS_StyleScopedClasses['sticky-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['grade-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [candidate] of __VLS_vFor((__VLS_ctx.filteredAndSortedCandidates))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (candidate.id),
            ...{ class: "candidate-row" },
        });
        /** @type {__VLS_StyleScopedClasses['candidate-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "sticky-col candidate-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['sticky-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['candidate-cell']} */ ;
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
            (__VLS_ctx.getCorrectionStatus(candidate.id));
        }
        for (const [task] of __VLS_vFor((__VLS_ctx.exam.structure.tasks))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.viewMode === 'table'))
                            return;
                        __VLS_ctx.jumpToCandidate(candidate, task);
                        // @ts-ignore
                        [exam, filteredAndSortedCandidates, getCorrectionStatus, getCorrectionStatus, jumpToCandidate,];
                    } },
                key: (`${candidate.id}-${task.id}`),
                ...{ class: "score-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['score-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "score-display" },
            });
            /** @type {__VLS_StyleScopedClasses['score-display']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "score-value" },
            });
            /** @type {__VLS_StyleScopedClasses['score-value']} */ ;
            (__VLS_ctx.getTaskScore(candidate.id, task.id));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "score-max" },
            });
            /** @type {__VLS_StyleScopedClasses['score-max']} */ ;
            (task.points);
            if (__VLS_ctx.hasComment(candidate.id, task.id)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "comment-indicator" },
                });
                /** @type {__VLS_StyleScopedClasses['comment-indicator']} */ ;
            }
            // @ts-ignore
            [getTaskScore, hasComment,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "sticky-col total-col" },
        });
        /** @type {__VLS_StyleScopedClasses['sticky-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['total-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "total-points" },
        });
        /** @type {__VLS_StyleScopedClasses['total-points']} */ ;
        (__VLS_ctx.getTotalPoints(candidate.id));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "sticky-col percent-col" },
        });
        /** @type {__VLS_StyleScopedClasses['sticky-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['percent-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "percentage" },
        });
        /** @type {__VLS_StyleScopedClasses['percentage']} */ ;
        (__VLS_ctx.getPercentage(candidate.id).toFixed(1));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "sticky-col grade-col" },
        });
        /** @type {__VLS_StyleScopedClasses['sticky-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['grade-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: (['grade-badge', `grade-${__VLS_ctx.getGrade(candidate.id)}`]) },
        });
        /** @type {__VLS_StyleScopedClasses['grade-badge']} */ ;
        (__VLS_ctx.getGrade(candidate.id));
        // @ts-ignore
        [getTotalPoints, getPercentage, getGrade, getGrade,];
    }
}
if (__VLS_ctx.viewMode === 'table') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "statistics" },
    });
    /** @type {__VLS_StyleScopedClasses['statistics']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.averageScore.toFixed(1));
    (__VLS_ctx.exam.gradingKey.totalPoints);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.completedCount);
    (__VLS_ctx.totalCandidates);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.averageGrade);
}
if (__VLS_ctx.viewMode === 'awk') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "awk-view" },
    });
    /** @type {__VLS_StyleScopedClasses['awk-view']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "awk-header" },
    });
    /** @type {__VLS_StyleScopedClasses['awk-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.currentTaskId),
        ...{ class: "task-selector" },
    });
    /** @type {__VLS_StyleScopedClasses['task-selector']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [task] of __VLS_vFor((__VLS_ctx.exam.structure.tasks))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (task.id),
            value: (task.id),
        });
        (task.title);
        (task.points);
        // @ts-ignore
        [exam, exam, viewMode, viewMode, averageScore, completedCount, totalCandidates, averageGrade, currentTaskId,];
    }
    if (__VLS_ctx.currentTaskId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "awk-list" },
        });
        /** @type {__VLS_StyleScopedClasses['awk-list']} */ ;
        for (const [candidate] of __VLS_vFor((__VLS_ctx.filteredAndSortedCandidates))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.viewMode === 'awk'))
                            return;
                        if (!(__VLS_ctx.currentTaskId))
                            return;
                        __VLS_ctx.jumpToTaskForCandidate(candidate, __VLS_ctx.currentTaskId);
                        // @ts-ignore
                        [filteredAndSortedCandidates, currentTaskId, currentTaskId, jumpToTaskForCandidate,];
                    } },
                key: (candidate.id),
                ...{ class: (['awk-item', { completed: __VLS_ctx.isTaskCompleted(candidate.id, __VLS_ctx.currentTaskId) }]) },
            });
            /** @type {__VLS_StyleScopedClasses['completed']} */ ;
            /** @type {__VLS_StyleScopedClasses['awk-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "awk-candidate" },
            });
            /** @type {__VLS_StyleScopedClasses['awk-candidate']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "candidate-name" },
            });
            /** @type {__VLS_StyleScopedClasses['candidate-name']} */ ;
            (candidate.firstName);
            (candidate.lastName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "awk-score" },
            });
            /** @type {__VLS_StyleScopedClasses['awk-score']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "score-value" },
            });
            /** @type {__VLS_StyleScopedClasses['score-value']} */ ;
            (__VLS_ctx.getTaskScore(candidate.id, __VLS_ctx.currentTaskId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "score-max" },
            });
            /** @type {__VLS_StyleScopedClasses['score-max']} */ ;
            (__VLS_ctx.getTaskMaxPoints(__VLS_ctx.currentTaskId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "awk-actions" },
            });
            /** @type {__VLS_StyleScopedClasses['awk-actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.viewMode === 'awk'))
                            return;
                        if (!(__VLS_ctx.currentTaskId))
                            return;
                        __VLS_ctx.jumpToTaskForCandidate(candidate, __VLS_ctx.currentTaskId);
                        // @ts-ignore
                        [getTaskScore, currentTaskId, currentTaskId, currentTaskId, currentTaskId, jumpToTaskForCandidate, isTaskCompleted, getTaskMaxPoints,];
                    } },
                ...{ class: "edit-btn" },
            });
            /** @type {__VLS_StyleScopedClasses['edit-btn']} */ ;
            // @ts-ignore
            [];
        }
    }
}
if (__VLS_ctx.showCommentsModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCommentsModal))
                    return;
                __VLS_ctx.showCommentsModal = false;
                // @ts-ignore
                [showCommentsModal, showCommentsModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.selectedCandidate?.firstName);
    (__VLS_ctx.selectedCandidate?.lastName);
    if (__VLS_ctx.commentTaskId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.exam.structure.tasks.find(t => t.id === __VLS_ctx.commentTaskId)?.title);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "comments-editor" },
    });
    /** @type {__VLS_StyleScopedClasses['comments-editor']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "comment-item" },
    });
    /** @type {__VLS_StyleScopedClasses['comment-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.editingComment.text),
        type: "text",
        ...{ class: "comment-text-input" },
        placeholder: "Enter comment...",
    });
    /** @type {__VLS_StyleScopedClasses['comment-text-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "comment-options" },
    });
    /** @type {__VLS_StyleScopedClasses['comment-options']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "checkbox-label" },
    });
    /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.editingComment.printable);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "checkbox-label" },
    });
    /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.editingComment.availableAfterReturn);
    if (__VLS_ctx.candidates.length > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "copy-section" },
        });
        /** @type {__VLS_StyleScopedClasses['copy-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "copy-label" },
        });
        /** @type {__VLS_StyleScopedClasses['copy-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "copy-candidates" },
        });
        /** @type {__VLS_StyleScopedClasses['copy-candidates']} */ ;
        for (const [c] of __VLS_vFor((__VLS_ctx.candidates.filter(c => c.id !== __VLS_ctx.selectedCandidate?.id)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                key: (c.id),
                ...{ class: "checkbox-label" },
            });
            /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "checkbox",
                value: (c.id),
            });
            (__VLS_ctx.copyTargetIds);
            (c.firstName);
            (c.lastName);
            // @ts-ignore
            [exam, selectedCandidate, selectedCandidate, selectedCandidate, commentTaskId, commentTaskId, editingComment, editingComment, editingComment, candidates, candidates, copyTargetIds,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-buttons" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-buttons']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveComment) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCommentsModal))
                    return;
                __VLS_ctx.showCommentsModal = false;
                // @ts-ignore
                [showCommentsModal, saveComment,];
            } },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
    __typeEmits: {},
    __typeProps: {},
});
export default {};
