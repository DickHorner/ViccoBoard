/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge';
const { t } = useI18n();
const route = useRoute();
initializeSportBridge();
initializeStudentsBridge();
const SportBridge = getSportBridge();
const studentsBridge = getStudentsBridge();
const category = ref(null);
const students = ref([]);
const tables = ref([]);
const configs = ref([]);
const selectedSportType = ref('running');
const selectedConfigId = ref('');
const selectedTableId = ref('');
const lapLengthMeters = ref(400);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const results = ref({});
const currentDate = computed(() => {
    return new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});
const selectedTable = computed(() => tables.value.find(table => table.id === selectedTableId.value) || null);
const selectedConfig = computed(() => configs.value.find(config => config.id === selectedConfigId.value) || null);
function buildContext(student) {
    const genderShort = student.gender === 'male' ? 'm' : student.gender === 'female' ? 'w' : 'd';
    const age = student.birthYear ? new Date().getFullYear() - student.birthYear : undefined;
    return {
        gender: genderShort,
        genderLong: student.gender,
        age,
        birthYear: student.birthYear,
        SportType: selectedSportType.value
    };
}
function initResults(existingEntries = []) {
    const initial = {};
    students.value.forEach(student => {
        const entry = existingEntries.find(item => item.studentId === student.id);
        const measurements = entry?.measurements || {};
        const rounds = Number(measurements.rounds) || 0;
        const extraMeters = Number(measurements.extraMeters) || 0;
        const distanceMeters = Number(measurements.distanceMeters) || 0;
        initial[student.id] = {
            rounds,
            extraMeters,
            distanceMeters,
            grade: entry?.calculatedGrade
        };
    });
    results.value = initial;
}
function recalculate(studentId) {
    const entry = results.value[studentId];
    if (!entry)
        return;
    const rounds = Number(entry.rounds) || 0;
    const extraMeters = Number(entry.extraMeters) || 0;
    const distance = SportBridge.cooperTestService.calculateDistance(rounds, lapLengthMeters.value, extraMeters);
    entry.distanceMeters = distance;
    if (selectedTable.value) {
        try {
            const student = students.value.find(s => s.id === studentId);
            if (student) {
                entry.grade = SportBridge.cooperTestService.calculateGradeFromTable(selectedTable.value, distance, buildContext(student));
            }
        }
        catch (error) {
            entry.grade = undefined;
        }
    }
}
function resetAll() {
    students.value.forEach(student => {
        results.value[student.id].rounds = 0;
        results.value[student.id].extraMeters = 0;
        recalculate(student.id);
    });
}
async function saveAll() {
    if (!category.value || !selectedTableId.value || !selectedConfigId.value)
        return;
    saving.value = true;
    errorMessage.value = '';
    successMessage.value = '';
    try {
        const entries = students.value.map(student => {
            const entry = results.value[student.id];
            if (!entry || entry.distanceMeters <= 0)
                return null;
            return SportBridge.recordCooperTestResultUseCase.execute({
                studentId: student.id,
                categoryId: category.value.id,
                configId: selectedConfigId.value,
                SportType: selectedSportType.value,
                rounds: entry.rounds,
                lapLengthMeters: lapLengthMeters.value,
                extraMeters: entry.extraMeters,
                calculatedGrade: entry.grade,
                tableId: selectedTableId.value
            });
        }).filter(Boolean);
        if (entries.length === 0) {
            errorMessage.value = t('COMMON.error');
            return;
        }
        await Promise.all(entries);
        successMessage.value = t('COMMON.success');
    }
    catch (error) {
        errorMessage.value = t('COMMON.error');
    }
    finally {
        saving.value = false;
    }
}
async function handleTableChange() {
    if (!category.value)
        return;
    const config = category.value.configuration;
    if (selectedTableId.value && config.gradingTable !== selectedTableId.value) {
        await SportBridge.gradeCategoryRepository.update(category.value.id, {
            configuration: {
                ...config,
                gradingTable: selectedTableId.value
            }
        });
    }
    students.value.forEach(student => recalculate(student.id));
}
async function handleSportTypeChange() {
    if (!category.value)
        return;
    const config = category.value.configuration;
    if (config.SportType !== selectedSportType.value) {
        await SportBridge.gradeCategoryRepository.update(category.value.id, {
            configuration: {
                ...config,
                SportType: selectedSportType.value
            }
        });
    }
    await loadConfigs(selectedSportType.value);
    students.value.forEach(student => recalculate(student.id));
}
async function handleConfigChange() {
    const config = selectedConfig.value;
    if (!config)
        return;
    if (Number.isFinite(config.lapLengthMeters)) {
        lapLengthMeters.value = config.lapLengthMeters;
    }
    if (!selectedTableId.value && config.gradingTableId) {
        selectedTableId.value = config.gradingTableId;
    }
    students.value.forEach(student => recalculate(student.id));
}
async function loadConfigs(SportType) {
    configs.value = await SportBridge.cooperTestConfigRepository.findBySportType(SportType);
    if (selectedConfigId.value) {
        const stillAvailable = configs.value.some(config => config.id === selectedConfigId.value);
        if (!stillAvailable) {
            selectedConfigId.value = '';
        }
    }
    if (!selectedConfigId.value && configs.value.length > 0) {
        selectedConfigId.value = configs.value[0].id;
    }
    const activeConfig = configs.value.find(config => config.id === selectedConfigId.value);
    if (activeConfig && Number.isFinite(activeConfig.lapLengthMeters)) {
        lapLengthMeters.value = activeConfig.lapLengthMeters;
    }
}
onMounted(async () => {
    try {
        const categoryId = route.params.id;
        category.value = await SportBridge.gradeCategoryRepository.findById(categoryId);
        if (!category.value) {
            errorMessage.value = t('COMMON.error');
            loading.value = false;
            return;
        }
        students.value = await studentsBridge.studentRepository.findByClassGroup(category.value.classGroupId);
        tables.value = await SportBridge.tableDefinitionRepository.findAll();
        const existingEntries = await SportBridge.performanceEntryRepository.findByCategory(category.value.id);
        const config = category.value.configuration;
        selectedTableId.value = config.gradingTable ?? '';
        selectedSportType.value = config.SportType ?? 'running';
        await loadConfigs(selectedSportType.value);
        const lapLengthFromEntry = existingEntries.find(entry => entry.measurements?.lapLengthMeters)?.measurements?.lapLengthMeters;
        if (lapLengthFromEntry) {
            lapLengthMeters.value = Number(lapLengthFromEntry) || lapLengthMeters.value;
        }
        initResults(existingEntries);
    }
    catch (error) {
        errorMessage.value = t('COMMON.error');
    }
    finally {
        loading.value = false;
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['cooper-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cooper-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "cooper-view" },
});
/** @type {__VLS_StyleScopedClasses['cooper-view']} */ ;
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
(__VLS_ctx.t('COOPER.bewerte-cooper'));
(__VLS_ctx.currentDate);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
(__VLS_ctx.t('COOPER.tabelle'));
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
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
else if (__VLS_ctx.category) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "config-row" },
    });
    /** @type {__VLS_StyleScopedClasses['config-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('COOPER.Sportart'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handleSportTypeChange) },
        value: (__VLS_ctx.selectedSportType),
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "running",
    });
    (__VLS_ctx.t('COOPER.running'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "swimming",
    });
    (__VLS_ctx.t('COOPER.swimming'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('COOPER.config'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handleConfigChange) },
        value: (__VLS_ctx.selectedConfigId),
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.t('COOPER.config'));
    for (const [config] of __VLS_vFor((__VLS_ctx.configs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (config.id),
            value: (config.id),
        });
        (config.name);
        // @ts-ignore
        [t, t, t, t, t, t, t, t, t, currentDate, loading, category, handleSportTypeChange, selectedSportType, handleConfigChange, selectedConfigId, configs,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('COOPER.tabelle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handleTableChange) },
        value: (__VLS_ctx.selectedTableId),
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.t('COOPER.tabelle'));
    for (const [table] of __VLS_vFor((__VLS_ctx.tables))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (table.id),
            value: (table.id),
        });
        (table.name);
        // @ts-ignore
        [t, t, handleTableChange, selectedTableId, tables,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('COOPER.bahn'));
    (__VLS_ctx.t('COOPER.meter'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: "1",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.lapLengthMeters);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    if (!__VLS_ctx.selectedConfigId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "warning-banner" },
        });
        /** @type {__VLS_StyleScopedClasses['warning-banner']} */ ;
        (__VLS_ctx.t('COOPER.config'));
        (__VLS_ctx.t('COMMON.error'));
    }
    else if (!__VLS_ctx.selectedTableId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "warning-banner" },
        });
        /** @type {__VLS_StyleScopedClasses['warning-banner']} */ ;
        (__VLS_ctx.t('COOPER.tabelle'));
        (__VLS_ctx.t('COMMON.error'));
    }
    if (__VLS_ctx.students.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "cooper-table" },
        });
        /** @type {__VLS_StyleScopedClasses['cooper-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('SCHUELER.schueler'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('COOPER.runden'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('COOPER.bahn'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('COOPER.gesamt'));
        (__VLS_ctx.t('COOPER.meter'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('COOPER.note'));
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
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.recalculate(student.id);
                        // @ts-ignore
                        [t, t, t, t, t, t, t, t, t, t, t, t, selectedConfigId, selectedTableId, lapLengthMeters, students, students, recalculate,];
                    } },
                type: "number",
                min: "0",
                ...{ class: "table-input" },
            });
            (__VLS_ctx.results[student.id].rounds);
            /** @type {__VLS_StyleScopedClasses['table-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onInput: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.recalculate(student.id);
                        // @ts-ignore
                        [recalculate, results,];
                    } },
                type: "number",
                min: "0",
                ...{ class: "table-input" },
            });
            (__VLS_ctx.results[student.id].extraMeters);
            /** @type {__VLS_StyleScopedClasses['table-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.results[student.id].distanceMeters);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "grade-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['grade-cell']} */ ;
            (__VLS_ctx.results[student.id].grade ?? '—');
            // @ts-ignore
            [results, results, results,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.resetAll) },
        ...{ class: "btn-secondary" },
        disabled: (__VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    (__VLS_ctx.t('COOPER.noten-neu'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveAll) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.saving || !__VLS_ctx.selectedTableId || !__VLS_ctx.selectedConfigId),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.saving ? __VLS_ctx.t('COMMON.loading') : __VLS_ctx.t('COMMON.save'));
    if (__VLS_ctx.errorMessage) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.errorMessage);
    }
    if (__VLS_ctx.successMessage) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "success-message" },
        });
        /** @type {__VLS_StyleScopedClasses['success-message']} */ ;
        (__VLS_ctx.successMessage);
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    (__VLS_ctx.t('COMMON.error'));
}
// @ts-ignore
[t, t, t, t, selectedConfigId, selectedTableId, resetAll, saving, saving, saving, saveAll, errorMessage, errorMessage, successMessage, successMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
