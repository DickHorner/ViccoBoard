/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { SportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();
const categoryId = route.params.id;
const loading = ref(true);
const saving = ref(false);
const exporting = ref(false);
const students = ref([]);
const disciplineCategories = ['ausdauer', 'kraft', 'schnelligkeit', 'koordination'];
const selectedCategory = ref('ausdauer');
// Simplified discipline structure (in production, could load from config)
const disciplines = ref([
    { id: 'd1', name: '3000m Lauf', category: 'endurance', measurementUnit: 'seconds' },
    { id: 'd2', name: 'Schwimmen 200m', category: 'endurance', measurementUnit: 'seconds' },
    { id: 'd3', name: 'Standweitsprung', category: 'strength', measurementUnit: 'cm' },
    { id: 'd4', name: 'Kugelstoßen', category: 'strength', measurementUnit: 'meters' },
    { id: 'd5', name: 'Sprint 100m', category: 'speed', measurementUnit: 'seconds' },
    { id: 'd6', name: 'Seilspringen', category: 'coordination', measurementUnit: 'count' }
]);
const disciplineSelections = ref({});
const performances = ref({});
const levels = ref({});
const studentResults = ref({});
const allStandards = ref([]);
const hasChanges = ref(false);
onMounted(async () => {
    await loadData();
});
async function loadData() {
    loading.value = true;
    try {
        const category = await SportBridge.value?.gradeCategoryRepository.findById(categoryId) ?? null;
        if (!category) {
            toast.error('Kategorie nicht gefunden');
            router.back();
            return;
        }
        students.value = await studentRepository.value?.findByClassGroup(category.classGroupId) ?? [];
        // Load all Sportabzeichen standards
        allStandards.value = await SportBridge.value?.SportabzeichenStandardRepository.findAll() ?? [];
        // Load existing results for each student
        for (const student of students.value) {
            const results = await SportBridge.value?.SportabzeichenResultRepository.findByStudent(student.id) ?? [];
            studentResults.value[student.id] = results;
        }
    }
    catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Fehler beim Laden der Daten');
    }
    finally {
        loading.value = false;
    }
}
function getFilteredDisciplines(category) {
    // Map UI category names to Sport type category names
    const categoryMap = {
        'ausdauer': 'endurance',
        'kraft': 'strength',
        'schnelligkeit': 'speed',
        'koordination': 'coordination'
    };
    const mappedCategory = categoryMap[category];
    return disciplines.value.filter(d => d.category === mappedCategory);
}
function onDisciplineChange(studentId) {
    hasChanges.value = true;
    onPerformanceChange(studentId);
}
async function onPerformanceChange(studentId) {
    hasChanges.value = true;
    const disciplineId = disciplineSelections.value[studentId];
    const performance = performances.value[studentId];
    if (!disciplineId || performance === undefined || performance === null) {
        levels.value[studentId] = 'none';
        return;
    }
    const student = students.value.find(s => s.id === studentId);
    if (!student || !student.birthYear) {
        // If no birth year, cannot calculate age-based level
        levels.value[studentId] = 'none';
        return;
    }
    // Calculate age using service
    const service = SportBridge.value?.SportabzeichenService;
    if (!service) {
        levels.value[studentId] = 'none';
        return;
    }
    const age = service.calculateAgeFromBirthYear(student.birthYear, new Date());
    const gender = student.gender || 'diverse';
    // Evaluate performance using service with all standards
    const achievedLevel = service.evaluatePerformance(allStandards.value, {
        disciplineId,
        gender,
        age,
        performanceValue: performance
    });
    levels.value[studentId] = achievedLevel;
}
function getOverallLevel(studentId) {
    const results = studentResults.value[studentId] || [];
    if (results.length === 0)
        return 'none';
    const service = SportBridge.value?.SportabzeichenService;
    if (!service)
        return 'none';
    return service.calculateOverallLevel(results);
}
async function saveAll() {
    saving.value = true;
    try {
        const useCase = SportBridge.value?.recordSportabzeichenResultUseCase;
        if (!useCase) {
            throw new Error('RecordSportabzeichenResultUseCase not available');
        }
        for (const student of students.value) {
            const disciplineId = disciplineSelections.value[student.id];
            const performance = performances.value[student.id];
            const level = levels.value[student.id];
            if (!disciplineId || performance === undefined || performance === null || level === 'none') {
                continue;
            }
            if (!student.birthYear) {
                console.warn(`Student ${student.id} has no birth year, skipping`);
                continue;
            }
            const discipline = disciplines.value.find(d => d.id === disciplineId);
            if (!discipline) {
                console.warn(`Discipline ${disciplineId} not found, skipping`);
                continue;
            }
            const gender = student.gender || 'diverse';
            // Save result using use case
            const result = await useCase.execute({
                studentId: student.id,
                disciplineId,
                birthYear: student.birthYear,
                gender,
                performanceValue: performance,
                unit: discipline.measurementUnit,
                testDate: new Date()
            });
            // Update local results
            if (!studentResults.value[student.id]) {
                studentResults.value[student.id] = [];
            }
            const existingIndex = studentResults.value[student.id].findIndex(r => r.disciplineId === disciplineId);
            if (existingIndex >= 0) {
                studentResults.value[student.id][existingIndex] = result;
            }
            else {
                studentResults.value[student.id].push(result);
            }
        }
        hasChanges.value = false;
        toast.success(t('COMMON.success'));
    }
    catch (error) {
        console.error('Failed to save:', error);
        toast.error('Fehler beim Speichern');
    }
    finally {
        saving.value = false;
    }
}
async function exportPdf() {
    exporting.value = true;
    try {
        const service = SportBridge.value?.SportabzeichenService;
        if (!service) {
            throw new Error('SportabzeichenService not available');
        }
        // Build report data
        const entries = students.value.map(student => {
            const results = studentResults.value[student.id] || [];
            const age = student.birthYear ? service.calculateAgeFromBirthYear(student.birthYear) : 0;
            const gender = student.gender || 'diverse';
            const overallLevel = getOverallLevel(student.id);
            return {
                studentName: `${student.firstName} ${student.lastName}`,
                age,
                gender,
                overallLevel,
                results: results.map(r => {
                    const discipline = disciplines.value.find(d => d.id === r.disciplineId);
                    return {
                        disciplineName: discipline?.name || r.disciplineId,
                        performance: `${r.performanceValue} ${r.unit}`,
                        level: r.achievedLevel
                    };
                })
            };
        });
        const pdfBytes = await service.generateOverviewPdf({
            title: t('SportABZEICHEN.title'),
            generatedAt: new Date(),
            entries
        });
        // Trigger download
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sportabzeichen-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('PDF erfolgreich erstellt');
    }
    catch (error) {
        console.error('Failed to export PDF:', error);
        toast.error('Fehler beim Exportieren');
    }
    finally {
        exporting.value = false;
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
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-button']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-button']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['overall-level']} */ ;
/** @type {__VLS_StyleScopedClasses['overall-level']} */ ;
/** @type {__VLS_StyleScopedClasses['overall-level']} */ ;
/** @type {__VLS_StyleScopedClasses['overall-level']} */ ;
/** @type {__VLS_StyleScopedClasses['discipline-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-button']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "Sportabzeichen-view" },
});
/** @type {__VLS_StyleScopedClasses['Sportabzeichen-view']} */ ;
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
(__VLS_ctx.t('COMMON.back'));
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.t('SportABZEICHEN.title'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "info-text" },
});
/** @type {__VLS_StyleScopedClasses['info-text']} */ ;
(__VLS_ctx.t('SportABZEICHEN.explainer'));
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
    (__VLS_ctx.t('COMMON.loading'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "content" },
    });
    /** @type {__VLS_StyleScopedClasses['content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "discipline-tabs" },
    });
    /** @type {__VLS_StyleScopedClasses['discipline-tabs']} */ ;
    for (const [cat] of __VLS_vFor((__VLS_ctx.disciplineCategories))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.selectedCategory = cat;
                    // @ts-ignore
                    [t, t, t, t, loading, disciplineCategories, selectedCategory,];
                } },
            key: (cat),
            ...{ class: ({ active: __VLS_ctx.selectedCategory === cat }) },
            ...{ class: "tab-button" },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        /** @type {__VLS_StyleScopedClasses['tab-button']} */ ;
        (__VLS_ctx.t(`SportABZEICHEN.${cat}`));
        // @ts-ignore
        [t, selectedCategory,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t(`SportABZEICHEN.${__VLS_ctx.selectedCategory}`));
    if (__VLS_ctx.hasChanges) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.saveAll) },
            ...{ class: "btn-primary btn-small" },
            disabled: (__VLS_ctx.saving),
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        (__VLS_ctx.saving ? __VLS_ctx.t('COMMON.syncing') : __VLS_ctx.t('COMMON.save'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "grading-table" },
    });
    /** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('SCHUELER.name'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('SportABZEICHEN.disziplin'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('SportABZEICHEN.leistung'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('SportABZEICHEN.bronze'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('SportABZEICHEN.silber'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('SportABZEICHEN.gold'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [student] of __VLS_vFor((__VLS_ctx.students))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (student.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "student-name" },
        });
        /** @type {__VLS_StyleScopedClasses['student-name']} */ ;
        (student.firstName);
        (student.lastName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            ...{ onChange: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.onDisciplineChange(student.id);
                    // @ts-ignore
                    [t, t, t, t, t, t, t, t, t, selectedCategory, hasChanges, saveAll, saving, saving, students, onDisciplineChange,];
                } },
            value: (__VLS_ctx.disciplineSelections[student.id]),
            ...{ class: "discipline-select" },
        });
        /** @type {__VLS_StyleScopedClasses['discipline-select']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        (__VLS_ctx.t('CATEGORIES.select-grading-table'));
        for (const [disc] of __VLS_vFor((__VLS_ctx.getFilteredDisciplines(__VLS_ctx.selectedCategory)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: (disc.id),
                value: (disc.id),
            });
            (disc.name);
            // @ts-ignore
            [t, selectedCategory, disciplineSelections, getFilteredDisciplines,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.onPerformanceChange(student.id);
                    // @ts-ignore
                    [onPerformanceChange,];
                } },
            type: "number",
            ...{ class: "performance-input" },
            step: "0.01",
        });
        (__VLS_ctx.performances[student.id]);
        /** @type {__VLS_StyleScopedClasses['performance-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "level-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['level-cell']} */ ;
        if (__VLS_ctx.levels[student.id] && __VLS_ctx.levels[student.id] !== 'none') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "level-badge" },
                ...{ class: (`level-${__VLS_ctx.levels[student.id]}`) },
            });
            /** @type {__VLS_StyleScopedClasses['level-badge']} */ ;
            (__VLS_ctx.levels[student.id] === 'bronze' ? '🥉' : '');
            (__VLS_ctx.levels[student.id] === 'silver' ? '🥈' : '');
            (__VLS_ctx.levels[student.id] === 'gold' ? '🥇' : '');
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "level-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['level-cell']} */ ;
        if (__VLS_ctx.levels[student.id] === 'silver' || __VLS_ctx.levels[student.id] === 'gold') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "level-badge" },
                ...{ class: (`level-${__VLS_ctx.levels[student.id]}`) },
            });
            /** @type {__VLS_StyleScopedClasses['level-badge']} */ ;
            (__VLS_ctx.levels[student.id] === 'silver' ? '🥈' : '');
            (__VLS_ctx.levels[student.id] === 'gold' ? '🥇' : '');
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "level-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['level-cell']} */ ;
        if (__VLS_ctx.levels[student.id] === 'gold') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "level-badge level-gold" },
            });
            /** @type {__VLS_StyleScopedClasses['level-badge']} */ ;
            /** @type {__VLS_StyleScopedClasses['level-gold']} */ ;
        }
        // @ts-ignore
        [performances, levels, levels, levels, levels, levels, levels, levels, levels, levels, levels, levels, levels,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t('SportABZEICHEN.gesamtergebnis'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
    for (const [student] of __VLS_vFor((__VLS_ctx.students))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (student.id),
            ...{ class: "summary-item" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "student-name-summary" },
        });
        /** @type {__VLS_StyleScopedClasses['student-name-summary']} */ ;
        (student.firstName);
        (student.lastName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "overall-level" },
            ...{ class: (`level-${__VLS_ctx.getOverallLevel(student.id)}`) },
        });
        /** @type {__VLS_StyleScopedClasses['overall-level']} */ ;
        (__VLS_ctx.getOverallLevel(student.id).toUpperCase());
        // @ts-ignore
        [t, students, getOverallLevel, getOverallLevel,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportPdf) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.exporting),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.exporting ? 'Erstelle PDF...' : 'Übersicht als PDF exportieren');
}
// @ts-ignore
[exportPdf, exporting, exporting,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
