/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
const route = useRoute();
const { gradeCategories, performanceEntries } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();
const categoryId = route.params.id;
const category = ref(null);
const students = ref([]);
const entries = ref([]);
const loading = ref(true);
const error = ref(null);
const selectedStudentId = ref('');
const dateFrom = ref('');
const dateTo = ref('');
onMounted(async () => {
    await loadData();
});
async function loadData() {
    loading.value = true;
    error.value = null;
    try {
        // Load category
        category.value = await gradeCategories.value?.findById(categoryId) ?? null;
        if (!category.value) {
            error.value = 'Kategorie nicht gefunden';
            return;
        }
        // Load students
        students.value = await studentRepository.value?.findByClassGroup(category.value.classGroupId) ?? [];
        // Load all performance entries for this category
        entries.value = await performanceEntries.value?.findByCategory(categoryId) ?? [];
        // Sort by timestamp descending (newest first)
        entries.value.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    catch (err) {
        console.error('Failed to load history:', err);
        error.value = 'Fehler beim Laden der Historie';
    }
    finally {
        loading.value = false;
    }
}
const filteredEntries = computed(() => {
    let filtered = entries.value;
    // Filter by student
    if (selectedStudentId.value) {
        filtered = filtered.filter(e => e.studentId === selectedStudentId.value);
    }
    // Filter by date range
    if (dateFrom.value) {
        const fromDate = new Date(dateFrom.value);
        filtered = filtered.filter(e => e.timestamp >= fromDate);
    }
    if (dateTo.value) {
        const toDate = new Date(dateTo.value);
        toDate.setHours(23, 59, 59, 999); // End of day
        filtered = filtered.filter(e => e.timestamp <= toDate);
    }
    return filtered;
});
const studentStatistics = computed(() => {
    if (!selectedStudentId.value)
        return null;
    const studentEntries = filteredEntries.value.filter(e => e.studentId === selectedStudentId.value);
    if (studentEntries.length === 0)
        return null;
    const gradesWithValues = studentEntries
        .filter(e => e.calculatedGrade !== undefined && e.calculatedGrade !== null)
        .map(e => Number(e.calculatedGrade));
    const averageGrade = gradesWithValues.length > 0
        ? (gradesWithValues.reduce((sum, g) => sum + g, 0) / gradesWithValues.length).toFixed(2)
        : '—';
    const bestGrade = gradesWithValues.length > 0
        ? Math.min(...gradesWithValues).toString()
        : '—';
    const lastEntry = studentEntries.length > 0
        ? formatDate(studentEntries[0].timestamp)
        : '—';
    return {
        totalEntries: studentEntries.length,
        averageGrade,
        bestGrade,
        lastEntry
    };
});
function getStudentName(studentId) {
    const student = students.value.find(s => s.id === studentId);
    if (!student)
        return 'Unbekannt';
    return `${student.firstName} ${student.lastName}`;
}
function formatDateTime(date) {
    return new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}
function formatDate(date) {
    return new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}
function formatMeasurements(measurements) {
    if (!measurements || Object.keys(measurements).length === 0) {
        return '—';
    }
    // Format measurements based on type
    const formatted = [];
    for (const [key, value] of Object.entries(measurements)) {
        if (key === 'time') {
            formatted.push(`Zeit: ${value.toFixed(2)}s`);
        }
        else {
            formatted.push(`${key}: ${value}`);
        }
    }
    return formatted.join(', ');
}
function escapeCSVField(field) {
    // Escape quotes by doubling them and wrap in quotes if contains special chars
    const needsEscape = /[",\n\r]/.test(field);
    if (needsEscape) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}
function exportHistory() {
    try {
        // Create CSV content with proper escaping
        let csv = 'Datum/Zeit,Schüler,Messwerte,Note,Kommentar\n';
        for (const entry of filteredEntries.value) {
            const row = [
                formatDateTime(entry.timestamp),
                getStudentName(entry.studentId),
                formatMeasurements(entry.measurements),
                entry.calculatedGrade?.toString() || '',
                entry.comment || ''
            ];
            csv += row.map(field => escapeCSVField(field)).join(',') + '\n';
        }
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bewertungshistorie_${category.value?.name || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }
    catch (err) {
        console.error('Failed to export history:', err);
        toast.error('Fehler beim Exportieren der Historie');
    }
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-item']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grade-history-view" },
});
/** @type {__VLS_StyleScopedClasses['grade-history-view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$router.back();
            // @ts-ignore
            [$router,];
        } },
    ...{ class: "back-button" },
});
/** @type {__VLS_StyleScopedClasses['back-button']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
(__VLS_ctx.category ? `Historie für: ${__VLS_ctx.category.name}` : 'Zeigen Sie die Historie der Bewertungen an.');
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.error);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.loadData) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
else if (__VLS_ctx.category) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "history-content" },
    });
    /** @type {__VLS_StyleScopedClasses['history-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card filters-card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    /** @type {__VLS_StyleScopedClasses['filters-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-item" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "student-filter",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        id: "student-filter",
        value: (__VLS_ctx.selectedStudentId),
        ...{ class: "form-select" },
    });
    /** @type {__VLS_StyleScopedClasses['form-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [student] of __VLS_vFor((__VLS_ctx.students))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (student.id),
            value: (student.id),
        });
        (student.firstName);
        (student.lastName);
        // @ts-ignore
        [category, category, category, loading, error, error, loadData, selectedStudentId, students,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-item" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "date-from",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "date-from",
        type: "date",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.dateFrom);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-item" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "date-to",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "date-to",
        type: "date",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.dateTo);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportHistory) },
        ...{ class: "btn-secondary btn-small" },
        disabled: (__VLS_ctx.filteredEntries.length === 0),
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-content" },
    });
    /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
    if (__VLS_ctx.filteredEntries.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "history-table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['history-table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "history-table" },
        });
        /** @type {__VLS_StyleScopedClasses['history-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [entry] of __VLS_vFor((__VLS_ctx.filteredEntries))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (entry.id),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "timestamp-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['timestamp-cell']} */ ;
            (__VLS_ctx.formatDateTime(entry.timestamp));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "student-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['student-cell']} */ ;
            (__VLS_ctx.getStudentName(entry.studentId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "measurements-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['measurements-cell']} */ ;
            (__VLS_ctx.formatMeasurements(entry.measurements));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "grade-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['grade-cell']} */ ;
            if (entry.calculatedGrade) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "grade-badge" },
                });
                /** @type {__VLS_StyleScopedClasses['grade-badge']} */ ;
                (entry.calculatedGrade);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "grade-missing" },
                });
                /** @type {__VLS_StyleScopedClasses['grade-missing']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "comment-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['comment-cell']} */ ;
            (entry.comment || '—');
            // @ts-ignore
            [dateFrom, dateTo, exportHistory, filteredEntries, filteredEntries, filteredEntries, formatDateTime, getStudentName, formatMeasurements,];
        }
    }
    if (__VLS_ctx.selectedStudentId && __VLS_ctx.studentStatistics) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "card" },
        });
        /** @type {__VLS_StyleScopedClasses['card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (__VLS_ctx.getStudentName(__VLS_ctx.selectedStudentId));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stats-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-item" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        (__VLS_ctx.studentStatistics.totalEntries);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-item" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        (__VLS_ctx.studentStatistics.averageGrade);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-item" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        (__VLS_ctx.studentStatistics.bestGrade);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-item" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-label" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stat-value" },
        });
        /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
        (__VLS_ctx.studentStatistics.lastEntry);
    }
}
// @ts-ignore
[selectedStudentId, selectedStudentId, getStudentName, studentStatistics, studentStatistics, studentStatistics, studentStatistics, studentStatistics,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
