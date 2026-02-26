/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import { BJSGradingService } from '@viccoboard/sport';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { SportBridge, gradeCategories, performanceEntries } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();
const bjsService = new BJSGradingService();
const categoryId = route.params.id;
const loading = ref(true);
const saving = ref(false);
const students = ref([]);
const performances = reactive({});
const totalPoints = reactive({});
const gradingTable = ref(null);
const bjsConfig = ref(null);
onMounted(async () => {
    await loadData();
});
async function loadData() {
    loading.value = true;
    try {
        const category = await gradeCategories.value?.findById(categoryId);
        if (!category) {
            toast.error('Kategorie nicht gefunden');
            router.back();
            return;
        }
        bjsConfig.value = category.configuration;
        students.value = await studentRepository.value?.findByClassGroup(category.classGroupId) ?? [];
        // Load grading table if referenced in config
        if (bjsConfig.value?.gradingTable) {
            gradingTable.value = await SportBridge.value?.tableDefinitionRepository.findById(bjsConfig.value.gradingTable);
            if (!gradingTable.value) {
                console.warn(`BJS grading table not found: ${bjsConfig.value.gradingTable}`);
            }
        }
        // Initialize performance objects
        students.value.forEach(student => {
            performances[student.id] = {
                sprint: null,
                sprung: null,
                wurf: null,
                ausdauer: null
            };
            totalPoints[student.id] = 0;
        });
        // Load existing entries (if any)
        const entries = await performanceEntries.value?.findByCategory(categoryId) ?? [];
        entries.forEach(entry => {
            if (entry.measurements) {
                performances[entry.studentId] = {
                    sprint: entry.measurements.sprint || null,
                    sprung: entry.measurements.sprung || null,
                    wurf: entry.measurements.wurf || null,
                    ausdauer: entry.measurements.ausdauer || null
                };
                calculatePoints(entry.studentId);
            }
        });
    }
    catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Fehler beim Laden der Daten');
    }
    finally {
        loading.value = false;
    }
}
function calculatePoints(studentId) {
    const perf = performances[studentId];
    if (!perf)
        return;
    // If we have a grading table, use proper BJS scoring via the service
    if (gradingTable.value && bjsConfig.value?.disciplines) {
        try {
            const result = bjsService.calculateScore({
                disciplines: bjsConfig.value.disciplines,
                performances: perf,
                table: gradingTable.value,
                context: {}
            });
            totalPoints[studentId] = result.totalPoints;
            return;
        }
        catch (error) {
            console.warn(`Failed to calculate BJS points for student ${studentId}:`, error);
            // Fall back to simplified calculation if table lookup fails
        }
    }
    // Fallback: simplified point calculation (if no table available)
    // This should be replaced with actual table lookup
    let points = 0;
    if (perf.sprint > 0) {
        points += Math.max(0, Math.round(200 - perf.sprint * 10));
    }
    if (perf.sprung > 0) {
        points += Math.round(perf.sprung * 50);
    }
    if (perf.wurf > 0) {
        points += Math.round(perf.wurf * 30);
    }
    if (perf.ausdauer > 0) {
        points += Math.max(0, Math.round(300 - perf.ausdauer * 20));
    }
    totalPoints[studentId] = points;
}
function getCertificateType(studentId) {
    const points = totalPoints[studentId] || 0;
    // Official BJS thresholds (simplified - actual values depend on age/gender)
    if (points >= 1000)
        return 'ehrenurkunde'; // Honor certificate
    if (points >= 600)
        return 'siegerurkunde'; // Winner certificate
    if (points > 0)
        return 'teilnahmeurkunde'; // Participation certificate
    return null;
}
function getCertificateLabel(type) {
    if (!type)
        return '';
    const labels = {
        ehrenurkunde: t('BUNDESJUGENDSPIELE.ehrenurkunde'),
        siegerurkunde: t('BUNDESJUGENDSPIELE.siegerurkunde'),
        teilnahmeurkunde: t('BUNDESJUGENDSPIELE.teilnahmeurkunde')
    };
    return labels[type] || '';
}
function getCertificateCount(type) {
    return students.value.filter(s => getCertificateType(s.id) === type).length;
}
async function saveAll() {
    saving.value = true;
    try {
        const savePromises = [];
        for (const student of students.value) {
            const perf = performances[student.id];
            const points = totalPoints[student.id];
            const certType = getCertificateType(student.id);
            if (!perf || points === 0 || !certType)
                continue;
            const measurements = {
                sprint: perf.sprint,
                sprung: perf.sprung,
                wurf: perf.wurf,
                ausdauer: perf.ausdauer,
                totalPoints: points,
                certificateType: certType
            };
            savePromises.push(SportBridge.value?.recordGradeUseCase.execute({
                studentId: student.id,
                categoryId: categoryId,
                measurements,
                calculatedGrade: certType,
                metadata: { timestamp: new Date().toISOString() }
            }) ?? Promise.resolve());
        }
        await Promise.all(savePromises);
        toast.success(t('COMMON.success'));
    }
    catch (error) {
        console.error('Failed to save grades:', error);
        toast.error('Fehler beim Speichern');
    }
    finally {
        saving.value = false;
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
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['grading-table']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-input']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-stats']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "bjs-view" },
});
/** @type {__VLS_StyleScopedClasses['bjs-view']} */ ;
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
(__VLS_ctx.t('BUNDESJUGENDSPIELE.info-titel'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "info-text" },
});
/** @type {__VLS_StyleScopedClasses['info-text']} */ ;
(__VLS_ctx.t('BUNDESJUGENDSPIELE.info1'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "info-text" },
});
/** @type {__VLS_StyleScopedClasses['info-text']} */ ;
(__VLS_ctx.t('BUNDESJUGENDSPIELE.info2'));
__VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
    href: (__VLS_ctx.t('BUNDESJUGENDSPIELE.link')),
    target: "_blank",
    ...{ class: "info-link" },
});
/** @type {__VLS_StyleScopedClasses['info-link']} */ ;
(__VLS_ctx.t('BUNDESJUGENDSPIELE.link'));
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t('BUNDESJUGENDSPIELE.disziplinen-einzeln'));
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
    (__VLS_ctx.t('BUNDESJUGENDSPIELE.sprint'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('BUNDESJUGENDSPIELE.sprung'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('BUNDESJUGENDSPIELE.wurf'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('BUNDESJUGENDSPIELE.ausdauer'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    (__VLS_ctx.t('BUNDESJUGENDSPIELE.punkte'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.calculatePoints(student.id);
                    // @ts-ignore
                    [t, t, t, t, t, t, t, t, t, t, t, t, t, t, loading, students, calculatePoints,];
                } },
            type: "number",
            ...{ class: "perf-input" },
            step: "0.01",
            placeholder: "Zeit (s)",
        });
        (__VLS_ctx.performances[student.id].sprint);
        /** @type {__VLS_StyleScopedClasses['perf-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.calculatePoints(student.id);
                    // @ts-ignore
                    [calculatePoints, performances,];
                } },
            type: "number",
            ...{ class: "perf-input" },
            step: "0.01",
            placeholder: "Weite (m)",
        });
        (__VLS_ctx.performances[student.id].sprung);
        /** @type {__VLS_StyleScopedClasses['perf-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.calculatePoints(student.id);
                    // @ts-ignore
                    [calculatePoints, performances,];
                } },
            type: "number",
            ...{ class: "perf-input" },
            step: "0.01",
            placeholder: "Weite (m)",
        });
        (__VLS_ctx.performances[student.id].wurf);
        /** @type {__VLS_StyleScopedClasses['perf-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onInput: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.calculatePoints(student.id);
                    // @ts-ignore
                    [calculatePoints, performances,];
                } },
            type: "number",
            ...{ class: "perf-input" },
            step: "0.01",
            placeholder: "Zeit (min)",
        });
        (__VLS_ctx.performances[student.id].ausdauer);
        /** @type {__VLS_StyleScopedClasses['perf-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "points-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['points-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.totalPoints[student.id] || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "certificate-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['certificate-cell']} */ ;
        if (__VLS_ctx.getCertificateType(student.id)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "certificate-badge" },
                ...{ class: (`cert-${__VLS_ctx.getCertificateType(student.id)}`) },
            });
            /** @type {__VLS_StyleScopedClasses['certificate-badge']} */ ;
            (__VLS_ctx.getCertificateLabel(__VLS_ctx.getCertificateType(student.id)));
        }
        // @ts-ignore
        [performances, totalPoints, getCertificateType, getCertificateType, getCertificateType, getCertificateLabel,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-stats']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    (__VLS_ctx.t('BUNDESJUGENDSPIELE.ehrenurkunde'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.getCertificateCount('ehrenurkunde'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    (__VLS_ctx.t('BUNDESJUGENDSPIELE.siegerurkunde'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.getCertificateCount('siegerurkunde'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    (__VLS_ctx.t('BUNDESJUGENDSPIELE.teilnahmeurkunde'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.getCertificateCount('teilnahmeurkunde'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "action-buttons" },
    });
    /** @type {__VLS_StyleScopedClasses['action-buttons']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveAll) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.saving ? __VLS_ctx.t('COMMON.syncing') : __VLS_ctx.t('COMMON.save'));
}
// @ts-ignore
[t, t, t, t, t, getCertificateCount, getCertificateCount, getCertificateCount, saveAll, saving, saving,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
