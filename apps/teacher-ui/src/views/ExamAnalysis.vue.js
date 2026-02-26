/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { ExamAnalysisService, AnalysisUIHelper } from '@viccoboard/exams';
const props = defineProps();
const tabs = ['statistics', 'difficulty', 'adjustment', 'risk', 'variance'];
const selectedTab = ref('statistics');
const analysis = ref(null);
const outliers = ref(null);
const adjustmentSuggestion = ref(null);
const studentsAtRisk = ref([]);
const taskVariance = ref(new Map());
const targetDifficulty = ref(0.6);
const riskThreshold = ref(50);
const difficultySort = ref('title');
const riskSort = ref('percentage');
const performAnalysis = () => {
    analysis.value = ExamAnalysisService.analyzeExamDifficulty(props.exam, props.corrections);
    outliers.value = ExamAnalysisService.identifyOutliers(analysis.value, 0.2);
    studentsAtRisk.value = ExamAnalysisService.identifyStudentsAtRisk(props.corrections, riskThreshold.value);
    taskVariance.value = ExamAnalysisService.calculateTaskVariance(props.corrections, props.exam);
};
const calculateAdjustments = () => {
    adjustmentSuggestion.value = ExamAnalysisService.suggestPointAdjustments(props.exam, props.corrections, targetDifficulty.value);
};
const refreshAnalysis = () => {
    performAnalysis();
};
const exportAnalysis = () => {
    const exportData = {
        exam: props.exam.title,
        timestamp: new Date().toISOString(),
        statistics: analysis.value,
        outliers: outliers.value,
        atRisk: studentsAtRisk.value
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${props.exam.id}-${Date.now()}.json`;
    a.click();
};
const applyAdjustments = () => {
    // This would emit an event or call a use case to actually apply the adjustments
    alert('Adjustment application would be implemented via use-case pattern');
};
const resetAdjustments = () => {
    adjustmentSuggestion.value = null;
};
const sortBy = (field) => {
    if (difficultySort.value === field) {
        difficultySort.value = field; // Toggle would go here
    }
    else {
        difficultySort.value = field;
    }
};
const sortRiskBy = (field) => {
    if (riskSort.value === field) {
        riskSort.value = field; // Toggle would go here
    }
    else {
        riskSort.value = field;
    }
};
const sortedDifficulties = computed(() => {
    if (!analysis.value)
        return [];
    const sorted = [...analysis.value.taskDifficulties];
    sorted.sort((a, b) => {
        switch (difficultySort.value) {
            case 'title':
                return a.taskTitle.localeCompare(b.taskTitle);
            case 'difficultyIndex':
                return a.difficultyIndex - b.difficultyIndex;
            case 'averageScore':
                return a.averageScore - b.averageScore;
            case 'standardDeviation':
                return b.standardDeviation - a.standardDeviation;
            default:
                return 0;
        }
    });
    return sorted;
});
const sortedAtRisk = computed(() => {
    const sorted = [...studentsAtRisk.value];
    sorted.sort((a, b) => {
        switch (riskSort.value) {
            case 'name':
                return getCandidateName(a.candidateId).localeCompare(getCandidateName(b.candidateId));
            case 'percentage':
                return a.percentage - b.percentage;
            case 'riskLevel':
                return a.riskLevel.localeCompare(b.riskLevel);
            default:
                return 0;
        }
    });
    return sorted;
});
// Helper functions
const formatScore = (value) => {
    if (value === undefined)
        return '—';
    return value.toFixed(2);
};
const formatPercentage = (value) => {
    if (value === undefined)
        return '—';
    return (value * 100).toFixed(1);
};
const getDifficultyText = (index) => {
    return AnalysisUIHelper.formatDifficultyText(index);
};
const getDifficultyColor = (index) => {
    return AnalysisUIHelper.getDifficultyColor(index);
};
const getDifficultyClass = (index) => {
    if (index < 0.3)
        return 'very-difficult';
    if (index < 0.5)
        return 'difficult';
    if (index < 0.7)
        return 'moderate';
    if (index < 0.85)
        return 'easy';
    return 'very-easy';
};
const getPercentage = (value, total) => {
    return (value / total) * 100;
};
const getChangeIndicator = (current, suggested) => {
    if (suggested > current)
        return `+${suggested - current} ↑`;
    if (suggested < current)
        return `${suggested - current} ↓`;
    return '— (no change)';
};
const getChangeClass = (current, suggested) => {
    if (suggested > current)
        return 'increase';
    if (suggested < current)
        return 'decrease';
    return 'unchanged';
};
const formatRiskLevel = (level) => {
    return AnalysisUIHelper.formatRiskLevel(level);
};
const getCandidateName = (candidateId) => {
    const candidate = props.candidates?.find(c => c.id === candidateId);
    if (!candidate)
        return 'Unknown';
    return `${candidate.firstName} ${candidate.lastName}`.trim();
};
const getTabLabel = (tab) => {
    switch (tab) {
        case 'statistics':
            return 'Statistics';
        case 'difficulty':
            return 'Difficulty';
        case 'adjustment':
            return 'Adjustments';
        case 'risk':
            return 'At Risk';
        case 'variance':
            return 'Variance';
        default:
            return tab;
    }
};
const getTaskTitle = (taskId) => {
    const task = props.exam.structure.tasks.find(t => t.id === taskId);
    return task?.title || 'Unknown Task';
};
const getSortIcon = (field) => {
    if (difficultySort.value === field || riskSort.value === field) {
        return '↓'; // Would be toggled for direction
    }
    return '';
};
const getVarianceClass = (variance) => {
    if (variance < 2)
        return 'consistent';
    if (variance < 4)
        return 'moderate-variance';
    return 'high-variance';
};
const getVariancePercentage = (variance) => {
    // Normalize to 0-100% based on reasonable variance range
    return Math.min((variance / 6) * 100, 100);
};
onMounted(() => {
    performAnalysis();
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-calculate']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-apply']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reset']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-reset']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['analysis-section']} */ ;
/** @type {__VLS_StyleScopedClasses['grade-distribution']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-table']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-table']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-table']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-table']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-table']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-row']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-row']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-row']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-row']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-row']} */ ;
/** @type {__VLS_StyleScopedClasses['difficulty-row']} */ ;
/** @type {__VLS_StyleScopedClasses['outlier-group']} */ ;
/** @type {__VLS_StyleScopedClasses['outlier-group']} */ ;
/** @type {__VLS_StyleScopedClasses['outlier-group']} */ ;
/** @type {__VLS_StyleScopedClasses['adjustment-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['adjustment-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['adjustment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['adjustment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['adjustment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['adjustment-table']} */ ;
/** @type {__VLS_StyleScopedClasses['change-class']} */ ;
/** @type {__VLS_StyleScopedClasses['change-class']} */ ;
/** @type {__VLS_StyleScopedClasses['impact-analysis']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-table']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-table']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-table']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-table']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-row']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-row']} */ ;
/** @type {__VLS_StyleScopedClasses['critical']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-row']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-row']} */ ;
/** @type {__VLS_StyleScopedClasses['student-link']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['critical']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['warning']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['ok']} */ ;
/** @type {__VLS_StyleScopedClasses['variance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['variance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['variance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['variance-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "exam-analysis" },
});
/** @type {__VLS_StyleScopedClasses['exam-analysis']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analysis-header" },
});
/** @type {__VLS_StyleScopedClasses['analysis-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
(__VLS_ctx.exam.title);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-controls" },
});
/** @type {__VLS_StyleScopedClasses['header-controls']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.refreshAnalysis) },
    ...{ class: "btn-refresh" },
});
/** @type {__VLS_StyleScopedClasses['btn-refresh']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.exportAnalysis) },
    ...{ class: "btn-export" },
});
/** @type {__VLS_StyleScopedClasses['btn-export']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "analysis-tabs" },
});
/** @type {__VLS_StyleScopedClasses['analysis-tabs']} */ ;
for (const [tab] of __VLS_vFor((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectedTab = tab;
                // @ts-ignore
                [exam, refreshAnalysis, exportAnalysis, tabs, selectedTab,];
            } },
        key: (tab),
        ...{ class: (['tab-btn', { active: __VLS_ctx.selectedTab === tab }]) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
    (__VLS_ctx.getTabLabel(tab));
    // @ts-ignore
    [selectedTab, getTabLabel,];
}
if (__VLS_ctx.selectedTab === 'statistics') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analysis-section" },
    });
    /** @type {__VLS_StyleScopedClasses['analysis-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stats-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.analysis?.totalCandidates);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.analysis?.completedCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatScore(__VLS_ctx.analysis?.averageScore));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatScore(__VLS_ctx.analysis?.medianScore));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatScore(__VLS_ctx.analysis?.minScore));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatScore(__VLS_ctx.analysis?.maxScore));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.formatScore(__VLS_ctx.analysis?.standardDeviation));
    if (__VLS_ctx.analysis) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grade-distribution" },
        });
        /** @type {__VLS_StyleScopedClasses['grade-distribution']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grade-bars" },
        });
        /** @type {__VLS_StyleScopedClasses['grade-bars']} */ ;
        for (const [[grade, count]] of __VLS_vFor((__VLS_ctx.analysis.gradeDistribution))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (grade),
                ...{ class: "grade-bar-container" },
            });
            /** @type {__VLS_StyleScopedClasses['grade-bar-container']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "grade-label" },
            });
            /** @type {__VLS_StyleScopedClasses['grade-label']} */ ;
            (grade);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "grade-bar" },
            });
            /** @type {__VLS_StyleScopedClasses['grade-bar']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "grade-bar-fill" },
                ...{ style: ({ width: __VLS_ctx.getPercentage(count, __VLS_ctx.analysis.totalCandidates) + '%' }) },
            });
            /** @type {__VLS_StyleScopedClasses['grade-bar-fill']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "grade-count" },
            });
            /** @type {__VLS_StyleScopedClasses['grade-count']} */ ;
            (count);
            // @ts-ignore
            [selectedTab, analysis, analysis, analysis, analysis, analysis, analysis, analysis, analysis, analysis, analysis, formatScore, formatScore, formatScore, formatScore, formatScore, getPercentage,];
        }
    }
}
if (__VLS_ctx.selectedTab === 'difficulty') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analysis-section" },
    });
    /** @type {__VLS_StyleScopedClasses['analysis-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "difficulty-table" },
    });
    /** @type {__VLS_StyleScopedClasses['difficulty-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedTab === 'difficulty'))
                    return;
                __VLS_ctx.sortBy('title');
                // @ts-ignore
                [selectedTab, sortBy,];
            } },
        ...{ class: "sortable" },
    });
    /** @type {__VLS_StyleScopedClasses['sortable']} */ ;
    (__VLS_ctx.getSortIcon('title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedTab === 'difficulty'))
                    return;
                __VLS_ctx.sortBy('difficultyIndex');
                // @ts-ignore
                [sortBy, getSortIcon,];
            } },
        ...{ class: "sortable" },
    });
    /** @type {__VLS_StyleScopedClasses['sortable']} */ ;
    (__VLS_ctx.getSortIcon('difficultyIndex'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedTab === 'difficulty'))
                    return;
                __VLS_ctx.sortBy('averageScore');
                // @ts-ignore
                [sortBy, getSortIcon,];
            } },
        ...{ class: "sortable" },
    });
    /** @type {__VLS_StyleScopedClasses['sortable']} */ ;
    (__VLS_ctx.getSortIcon('averageScore'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedTab === 'difficulty'))
                    return;
                __VLS_ctx.sortBy('standardDeviation');
                // @ts-ignore
                [sortBy, getSortIcon,];
            } },
        ...{ class: "sortable" },
    });
    /** @type {__VLS_StyleScopedClasses['sortable']} */ ;
    (__VLS_ctx.getSortIcon('standardDeviation'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [task] of __VLS_vFor((__VLS_ctx.sortedDifficulties))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (task.taskId),
            ...{ class: (['difficulty-row', __VLS_ctx.getDifficultyClass(task.difficultyIndex)]) },
        });
        /** @type {__VLS_StyleScopedClasses['difficulty-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "task-title" },
        });
        /** @type {__VLS_StyleScopedClasses['task-title']} */ ;
        (task.taskTitle);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "difficulty-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['difficulty-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ style: ({ color: __VLS_ctx.getDifficultyColor(task.difficultyIndex) }) },
        });
        (__VLS_ctx.getDifficultyText(task.difficultyIndex));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatScore(task.averageScore));
        (task.maxPoints);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatScore(task.standardDeviation));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "critical" },
        });
        /** @type {__VLS_StyleScopedClasses['critical']} */ ;
        (task.criticalCount);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "excellent" },
        });
        /** @type {__VLS_StyleScopedClasses['excellent']} */ ;
        (task.excellentCount);
        // @ts-ignore
        [formatScore, formatScore, getSortIcon, sortedDifficulties, getDifficultyClass, getDifficultyColor, getDifficultyText,];
    }
    if (__VLS_ctx.outliers) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "outliers-section" },
        });
        /** @type {__VLS_StyleScopedClasses['outliers-section']} */ ;
        if (__VLS_ctx.outliers.veryDifficult.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "outlier-group" },
            });
            /** @type {__VLS_StyleScopedClasses['outlier-group']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
            for (const [task] of __VLS_vFor((__VLS_ctx.outliers.veryDifficult))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (task.taskId),
                });
                (task.taskTitle);
                (__VLS_ctx.formatPercentage(task.difficultyIndex));
                // @ts-ignore
                [outliers, outliers, outliers, formatPercentage,];
            }
        }
        if (__VLS_ctx.outliers.veryEasy.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "outlier-group" },
            });
            /** @type {__VLS_StyleScopedClasses['outlier-group']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({});
            for (const [task] of __VLS_vFor((__VLS_ctx.outliers.veryEasy))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (task.taskId),
                });
                (task.taskTitle);
                (__VLS_ctx.formatPercentage(task.difficultyIndex));
                // @ts-ignore
                [outliers, outliers, formatPercentage,];
            }
        }
    }
}
if (__VLS_ctx.selectedTab === 'adjustment') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analysis-section" },
    });
    /** @type {__VLS_StyleScopedClasses['analysis-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "adjustment-controls" },
    });
    /** @type {__VLS_StyleScopedClasses['adjustment-controls']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "range",
        min: "0.3",
        max: "0.8",
        step: "0.05",
    });
    (__VLS_ctx.targetDifficulty);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.formatPercentage(__VLS_ctx.targetDifficulty * 100));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.calculateAdjustments) },
        ...{ class: "btn-calculate" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-calculate']} */ ;
    if (__VLS_ctx.adjustmentSuggestion) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "adjustment-results" },
        });
        /** @type {__VLS_StyleScopedClasses['adjustment-results']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "adjustment-table" },
        });
        /** @type {__VLS_StyleScopedClasses['adjustment-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [adj] of __VLS_vFor((__VLS_ctx.adjustmentSuggestion.adjustments))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (adj.taskId),
                ...{ class: ({ 'has-change': adj.currentPoints !== adj.suggestedPoints }) },
            });
            /** @type {__VLS_StyleScopedClasses['has-change']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "task-title" },
            });
            /** @type {__VLS_StyleScopedClasses['task-title']} */ ;
            (adj.taskTitle);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (adj.currentPoints);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (adj.suggestedPoints);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: (__VLS_ctx.getChangeClass(adj.currentPoints, adj.suggestedPoints)) },
            });
            (__VLS_ctx.getChangeIndicator(adj.currentPoints, adj.suggestedPoints));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "reason" },
            });
            /** @type {__VLS_StyleScopedClasses['reason']} */ ;
            (adj.reason);
            // @ts-ignore
            [selectedTab, formatPercentage, targetDifficulty, targetDifficulty, calculateAdjustments, adjustmentSuggestion, adjustmentSuggestion, getChangeClass, getChangeIndicator,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "impact-analysis" },
        });
        /** @type {__VLS_StyleScopedClasses['impact-analysis']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.formatScore(__VLS_ctx.adjustmentSuggestion.impactAnalysis.gradeShift));
        if (__VLS_ctx.adjustmentSuggestion.adjustments.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "no-changes" },
            });
            /** @type {__VLS_StyleScopedClasses['no-changes']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "action-buttons" },
        });
        /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.applyAdjustments) },
            ...{ class: "btn-apply" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-apply']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.resetAdjustments) },
            ...{ class: "btn-reset" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-reset']} */ ;
    }
}
if (__VLS_ctx.selectedTab === 'risk') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analysis-section" },
    });
    /** @type {__VLS_StyleScopedClasses['analysis-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "risk-controls" },
    });
    /** @type {__VLS_StyleScopedClasses['risk-controls']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "range",
        min: "30",
        max: "80",
        step: "5",
    });
    (__VLS_ctx.riskThreshold);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.riskThreshold);
    if (__VLS_ctx.studentsAtRisk.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "risk-table" },
        });
        /** @type {__VLS_StyleScopedClasses['risk-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedTab === 'risk'))
                        return;
                    if (!(__VLS_ctx.studentsAtRisk.length > 0))
                        return;
                    __VLS_ctx.sortRiskBy('name');
                    // @ts-ignore
                    [selectedTab, formatScore, adjustmentSuggestion, adjustmentSuggestion, applyAdjustments, resetAdjustments, riskThreshold, riskThreshold, studentsAtRisk, sortRiskBy,];
                } },
            ...{ class: "sortable" },
        });
        /** @type {__VLS_StyleScopedClasses['sortable']} */ ;
        (__VLS_ctx.getSortIcon('name'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedTab === 'risk'))
                        return;
                    if (!(__VLS_ctx.studentsAtRisk.length > 0))
                        return;
                    __VLS_ctx.sortRiskBy('percentage');
                    // @ts-ignore
                    [getSortIcon, sortRiskBy,];
                } },
            ...{ class: "sortable" },
        });
        /** @type {__VLS_StyleScopedClasses['sortable']} */ ;
        (__VLS_ctx.getSortIcon('percentage'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedTab === 'risk'))
                        return;
                    if (!(__VLS_ctx.studentsAtRisk.length > 0))
                        return;
                    __VLS_ctx.sortRiskBy('riskLevel');
                    // @ts-ignore
                    [getSortIcon, sortRiskBy,];
                } },
            ...{ class: "sortable" },
        });
        /** @type {__VLS_StyleScopedClasses['sortable']} */ ;
        (__VLS_ctx.getSortIcon('riskLevel'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [student] of __VLS_vFor((__VLS_ctx.sortedAtRisk))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (student.candidateId),
                ...{ class: (['risk-row', student.riskLevel]) },
            });
            /** @type {__VLS_StyleScopedClasses['risk-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            let __VLS_0;
            /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
            routerLink;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                to: ({ name: 'correction-compact', params: { candidateId: student.candidateId } }),
                ...{ class: "student-link" },
            }));
            const __VLS_2 = __VLS_1({
                to: ({ name: 'correction-compact', params: { candidateId: student.candidateId } }),
                ...{ class: "student-link" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            /** @type {__VLS_StyleScopedClasses['student-link']} */ ;
            const { default: __VLS_5 } = __VLS_3.slots;
            (__VLS_ctx.getCandidateName(student.candidateId));
            // @ts-ignore
            [getSortIcon, sortedAtRisk, getCandidateName,];
            var __VLS_3;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.formatPercentage(student.percentage));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: (['risk-badge', student.riskLevel]) },
            });
            /** @type {__VLS_StyleScopedClasses['risk-badge']} */ ;
            (__VLS_ctx.formatRiskLevel(student.riskLevel));
            // @ts-ignore
            [formatPercentage, formatRiskLevel,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "no-risk" },
        });
        /** @type {__VLS_StyleScopedClasses['no-risk']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
}
if (__VLS_ctx.selectedTab === 'variance') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "analysis-section" },
    });
    /** @type {__VLS_StyleScopedClasses['analysis-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "variance-table" },
    });
    /** @type {__VLS_StyleScopedClasses['variance-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [[taskId, variance]] of __VLS_vFor((__VLS_ctx.taskVariance))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (taskId),
            ...{ class: (__VLS_ctx.getVarianceClass(variance)) },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.getTaskTitle(taskId));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (__VLS_ctx.formatScore(variance));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "consistency-bar" },
        });
        /** @type {__VLS_StyleScopedClasses['consistency-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "consistency-fill" },
            ...{ style: ({ width: __VLS_ctx.getVariancePercentage(variance) + '%' }) },
        });
        /** @type {__VLS_StyleScopedClasses['consistency-fill']} */ ;
        // @ts-ignore
        [selectedTab, formatScore, taskVariance, getVarianceClass, getTaskTitle, getVariancePercentage,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "variance-note" },
    });
    /** @type {__VLS_StyleScopedClasses['variance-note']} */ ;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
