/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge';
import { buildShuttleRunSchedule, getCurrentShuttleSegment } from '../utils/shuttle-run-schedule';
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
const selectedTableId = ref('');
const selectedConfigId = ref('');
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
const isRunning = ref(false);
const isPaused = ref(false);
const elapsedMs = ref(0);
const soundEnabled = ref(true);
let intervalId = null;
let lastSegmentIndex = -1;
let startEpoch = 0;
let accumulatedMs = 0;
const selectedTable = computed(() => tables.value.find(table => table.id === selectedTableId.value) || null);
const selectedConfig = computed(() => configs.value.find(config => config.id === selectedConfigId.value) || null);
const runSchedule = computed(() => {
    if (!selectedConfig.value)
        return [];
    return buildShuttleRunSchedule(selectedConfig.value.levels);
});
const totalDurationMs = computed(() => {
    if (runSchedule.value.length === 0)
        return 0;
    return runSchedule.value[runSchedule.value.length - 1].endMs;
});
const currentSegment = computed(() => getCurrentShuttleSegment(runSchedule.value, elapsedMs.value));
const currentLevel = computed(() => currentSegment.value?.level ?? '');
const currentLane = computed(() => currentSegment.value?.lane ?? '');
const availableLevels = computed(() => {
    if (!selectedConfig.value)
        return [];
    const levels = selectedConfig.value.levels.map(level => level.level);
    return Array.from(new Set(levels)).sort((a, b) => a - b);
});
function availableLanes(level) {
    if (!selectedConfig.value || level === '')
        return [];
    return selectedConfig.value.levels
        .filter(entry => entry.level === level)
        .map(entry => entry.lane)
        .sort((a, b) => a - b);
}
function initResults(existingEntries = []) {
    const initial = {};
    students.value.forEach(student => {
        const entry = existingEntries.find(item => item.studentId === student.id);
        const measurements = entry?.measurements || {};
        initial[student.id] = {
            level: Number(measurements.level) || '',
            lane: Number(measurements.lane) || '',
            grade: entry?.calculatedGrade,
            stopped: false
        };
    });
    results.value = initial;
}
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const pad = (value) => value.toString().padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}`;
}
function playBeep() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    catch (error) {
        console.warn('Audio not available:', error);
    }
}
function tick() {
    if (!isRunning.value)
        return;
    elapsedMs.value = accumulatedMs + (Date.now() - startEpoch);
    if (totalDurationMs.value > 0 && elapsedMs.value >= totalDurationMs.value) {
        elapsedMs.value = totalDurationMs.value;
        finishTest();
        return;
    }
    const segment = getCurrentShuttleSegment(runSchedule.value, elapsedMs.value);
    const index = segment ? runSchedule.value.indexOf(segment) : -1;
    if (index !== lastSegmentIndex && index !== -1) {
        if (lastSegmentIndex !== -1 && soundEnabled.value) {
            playBeep();
        }
        lastSegmentIndex = index;
    }
}
function startTest() {
    if (!selectedConfig.value || runSchedule.value.length === 0)
        return;
    resetTimerState();
    isRunning.value = true;
    startEpoch = Date.now();
    intervalId = window.setInterval(tick, 100);
    if (soundEnabled.value) {
        playBeep();
    }
}
function pauseTest() {
    if (!isRunning.value)
        return;
    isRunning.value = false;
    isPaused.value = true;
    accumulatedMs = elapsedMs.value;
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
function resumeTest() {
    if (!isPaused.value)
        return;
    isPaused.value = false;
    isRunning.value = true;
    startEpoch = Date.now();
    intervalId = window.setInterval(tick, 100);
}
function finishTest() {
    isRunning.value = false;
    isPaused.value = false;
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
    if (soundEnabled.value && elapsedMs.value >= totalDurationMs.value) {
        playBeep();
    }
}
function resetTimerState() {
    isRunning.value = false;
    isPaused.value = false;
    elapsedMs.value = 0;
    accumulatedMs = 0;
    startEpoch = 0;
    lastSegmentIndex = -1;
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
function recalculate(studentId) {
    const entry = results.value[studentId];
    if (!entry || entry.level === '' || entry.lane === '') {
        entry.grade = undefined;
        return;
    }
    if (selectedTable.value) {
        try {
            entry.grade = SportBridge.shuttleRunService.calculateGradeFromTable(selectedTable.value, entry.level, entry.lane);
        }
        catch (error) {
            entry.grade = undefined;
        }
    }
}
function resetAll() {
    students.value.forEach(student => {
        results.value[student.id].level = '';
        results.value[student.id].lane = '';
        results.value[student.id].grade = undefined;
        results.value[student.id].stopped = false;
    });
}
function stopStudent(studentId) {
    const segment = currentSegment.value;
    if (!segment)
        return;
    results.value[studentId].level = segment.level;
    results.value[studentId].lane = segment.lane;
    results.value[studentId].stopped = true;
    recalculate(studentId);
}
function clearStudent(studentId) {
    results.value[studentId].level = '';
    results.value[studentId].lane = '';
    results.value[studentId].grade = undefined;
    results.value[studentId].stopped = false;
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
            if (!entry || entry.level === '' || entry.lane === '')
                return null;
            return SportBridge.recordShuttleRunResultUseCase.execute({
                studentId: student.id,
                categoryId: category.value.id,
                configId: selectedConfigId.value,
                level: Number(entry.level),
                lane: Number(entry.lane),
                calculatedGrade: entry.grade
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
async function handleConfigChange() {
    if (!category.value)
        return;
    const config = category.value.configuration;
    await SportBridge.gradeCategoryRepository.update(category.value.id, {
        configuration: {
            ...config,
            gradingTable: selectedTableId.value || undefined,
            configId: selectedConfigId.value || undefined
        }
    });
    resetTimerState();
    students.value.forEach(student => recalculate(student.id));
}
watch(selectedConfig, (config) => {
    resetTimerState();
    soundEnabled.value = config?.audioSignalsEnabled ?? true;
});
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
        configs.value = await SportBridge.shuttleRunConfigRepository.findAll();
        const existingEntries = await SportBridge.performanceEntryRepository.findByCategory(category.value.id);
        const config = category.value.configuration;
        selectedTableId.value = config.gradingTable ?? '';
        selectedConfigId.value = config.configId ?? '';
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
/** @type {__VLS_StyleScopedClasses['shuttle-table']} */ ;
/** @type {__VLS_StyleScopedClasses['shuttle-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "shuttle-view" },
});
/** @type {__VLS_StyleScopedClasses['shuttle-view']} */ ;
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
(__VLS_ctx.t('SHUTTLE.bewerte-shuttle'));
(__VLS_ctx.currentDate);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
(__VLS_ctx.t('SHUTTLE.tabelle'));
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
    (__VLS_ctx.t('SHUTTLE.tabelle'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handleConfigChange) },
        value: (__VLS_ctx.selectedTableId),
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.t('SHUTTLE.tabelle'));
    for (const [table] of __VLS_vFor((__VLS_ctx.tables))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (table.id),
            value: (table.id),
        });
        (table.name);
        // @ts-ignore
        [t, t, t, t, t, t, currentDate, loading, category, handleConfigChange, selectedTableId, tables,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('SHUTTLE.stufe'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.handleConfigChange) },
        value: (__VLS_ctx.selectedConfigId),
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.t('SHUTTLE.level'));
    for (const [config] of __VLS_vFor((__VLS_ctx.configs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (config.id),
            value: (config.id),
        });
        (config.name);
        // @ts-ignore
        [t, t, handleConfigChange, selectedConfigId, configs,];
    }
    if (__VLS_ctx.selectedConfig) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "timer-panel" },
        });
        /** @type {__VLS_StyleScopedClasses['timer-panel']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "timer-status" },
        });
        /** @type {__VLS_StyleScopedClasses['timer-status']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "status-item" },
        });
        /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-label" },
        });
        /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
        (__VLS_ctx.t('SHUTTLE.elapsed'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-value" },
        });
        /** @type {__VLS_StyleScopedClasses['status-value']} */ ;
        (__VLS_ctx.formatTime(__VLS_ctx.elapsedMs));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "status-item" },
        });
        /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-label" },
        });
        /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
        (__VLS_ctx.t('SHUTTLE.current-level'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-value" },
        });
        /** @type {__VLS_StyleScopedClasses['status-value']} */ ;
        (__VLS_ctx.currentLevel || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "status-item" },
        });
        /** @type {__VLS_StyleScopedClasses['status-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-label" },
        });
        /** @type {__VLS_StyleScopedClasses['status-label']} */ ;
        (__VLS_ctx.t('SHUTTLE.current-lane'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-value" },
        });
        /** @type {__VLS_StyleScopedClasses['status-value']} */ ;
        (__VLS_ctx.currentLane || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "timer-controls" },
        });
        /** @type {__VLS_StyleScopedClasses['timer-controls']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.startTest) },
            ...{ class: "btn-primary" },
            disabled: (__VLS_ctx.isRunning || !__VLS_ctx.selectedConfig),
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        (__VLS_ctx.t('SHUTTLE.start'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.pauseTest) },
            ...{ class: "btn-secondary" },
            disabled: (!__VLS_ctx.isRunning),
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        (__VLS_ctx.t('SHUTTLE.pause'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.resumeTest) },
            ...{ class: "btn-secondary" },
            disabled: (!__VLS_ctx.isPaused),
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        (__VLS_ctx.t('SHUTTLE.resume'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.finishTest) },
            ...{ class: "btn-secondary" },
            disabled: (!__VLS_ctx.isRunning && !__VLS_ctx.isPaused),
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        (__VLS_ctx.t('SHUTTLE.finish'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.resetTimerState) },
            ...{ class: "btn-secondary" },
            disabled: (__VLS_ctx.isRunning),
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        (__VLS_ctx.t('SHUTTLE.reset'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "sound-toggle" },
        });
        /** @type {__VLS_StyleScopedClasses['sound-toggle']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
        });
        (__VLS_ctx.soundEnabled);
        (__VLS_ctx.t('SHUTTLE.sound-enabled'));
    }
    if (!__VLS_ctx.selectedTableId || !__VLS_ctx.selectedConfigId) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "warning-banner" },
        });
        /** @type {__VLS_StyleScopedClasses['warning-banner']} */ ;
        (__VLS_ctx.t('COMMON.error'));
    }
    if (__VLS_ctx.students.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "shuttle-table" },
        });
        /** @type {__VLS_StyleScopedClasses['shuttle-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('SCHUELER.schueler'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('SHUTTLE.level'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('SHUTTLE.bahn'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('SHUTTLE.note'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('SHUTTLE.actions'));
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
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.recalculate(student.id);
                        // @ts-ignore
                        [t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, selectedTableId, selectedConfigId, selectedConfig, selectedConfig, formatTime, elapsedMs, currentLevel, currentLane, startTest, isRunning, isRunning, isRunning, isRunning, pauseTest, resumeTest, isPaused, isPaused, finishTest, resetTimerState, soundEnabled, students, students, recalculate,];
                    } },
                value: (__VLS_ctx.results[student.id].level),
                ...{ class: "table-input" },
                disabled: (!__VLS_ctx.selectedConfig),
            });
            /** @type {__VLS_StyleScopedClasses['table-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: "",
            });
            (__VLS_ctx.t('SHUTTLE.level'));
            for (const [level] of __VLS_vFor((__VLS_ctx.availableLevels))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (level),
                    value: (level),
                });
                (level);
                // @ts-ignore
                [t, selectedConfig, results, availableLevels,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.recalculate(student.id);
                        // @ts-ignore
                        [recalculate,];
                    } },
                value: (__VLS_ctx.results[student.id].lane),
                ...{ class: "table-input" },
                disabled: (!__VLS_ctx.selectedConfig || !__VLS_ctx.results[student.id].level),
            });
            /** @type {__VLS_StyleScopedClasses['table-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: "",
            });
            (__VLS_ctx.t('SHUTTLE.bahn'));
            for (const [lane] of __VLS_vFor((__VLS_ctx.availableLanes(__VLS_ctx.results[student.id].level)))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (lane),
                    value: (lane),
                });
                (lane);
                // @ts-ignore
                [t, selectedConfig, results, results, results, availableLanes,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "grade-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['grade-cell']} */ ;
            (__VLS_ctx.results[student.id].grade ?? '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "action-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['action-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.stopStudent(student.id);
                        // @ts-ignore
                        [results, stopStudent,];
                    } },
                ...{ class: "btn-secondary btn-stop" },
                disabled: (!__VLS_ctx.isRunning || !__VLS_ctx.currentSegment),
            });
            /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-stop']} */ ;
            (__VLS_ctx.t('SHUTTLE.stop'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.clearStudent(student.id);
                        // @ts-ignore
                        [t, isRunning, currentSegment, clearStudent,];
                    } },
                ...{ class: "btn-secondary btn-clear" },
                disabled: (__VLS_ctx.isRunning),
            });
            /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-clear']} */ ;
            (__VLS_ctx.t('SHUTTLE.clear'));
            // @ts-ignore
            [t, isRunning,];
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
    (__VLS_ctx.t('SHUTTLE.noten-neu'));
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
[t, t, t, t, selectedTableId, selectedConfigId, resetAll, saving, saving, saving, saveAll, errorMessage, errorMessage, successMessage, successMessage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
