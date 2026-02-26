/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge';
const { t } = useI18n();
// Initialize bridges
initializeSportBridge();
initializeStudentsBridge();
const SportBridge = getSportBridge();
const studentsBridge = getStudentsBridge();
// State
const classes = ref([]);
const students = ref([]);
const selectedClassId = ref('');
const numberOfStopwatches = ref(4);
const timers = ref([]);
const capturedTimes = ref([]);
const toast = ref({
    show: false,
    message: '',
    type: 'success'
});
// Computed
const availableStudents = computed(() => {
    const assignedIds = timers.value
        .filter(t => t.studentId)
        .map(t => t.studentId);
    return students.value.filter(s => !assignedIds.includes(s.id));
});
const allRunning = computed(() => {
    return timers.value.every(t => t.isRunning || t.isStopped);
});
const noneRunning = computed(() => {
    return timers.value.every(t => !t.isRunning);
});
const hasStoppedTimers = computed(() => {
    return timers.value.some(t => t.isStopped && t.time > 0);
});
// Initialize timers
function initializeTimers() {
    timers.value = Array.from({ length: numberOfStopwatches.value }, () => ({
        studentId: '',
        time: 0,
        isRunning: false,
        isStopped: false,
        intervalId: null,
        laps: []
    }));
}
// Load data
async function loadClasses() {
    try {
        classes.value = await SportBridge.classGroupRepository.findAll();
    }
    catch (error) {
        showToast('Error loading classes', 'error');
        console.error(error);
    }
}
async function loadStudents() {
    if (!selectedClassId.value) {
        students.value = [];
        return;
    }
    try {
        students.value = await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value);
        initializeTimers();
    }
    catch (error) {
        showToast('Error loading students', 'error');
        console.error(error);
    }
}
function getStudentName(studentId) {
    const student = students.value.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : '';
}
// Timer controls
function startTimer(index) {
    const timer = timers.value[index];
    if (!timer.studentId)
        return;
    timer.isRunning = true;
    timer.isStopped = false;
    timer.intervalId = window.setInterval(() => {
        timer.time += 10;
    }, 10);
}
function stopTimer(index) {
    const timer = timers.value[index];
    timer.isRunning = false;
    timer.isStopped = true;
    if (timer.intervalId) {
        clearInterval(timer.intervalId);
        timer.intervalId = null;
    }
}
function resetTimer(index) {
    const timer = timers.value[index];
    stopTimer(index);
    timer.time = 0;
    timer.isStopped = false;
    timer.laps = [];
}
function assignStudent(_index) {
    // Student assigned via v-model
}
function unassignStudent(index) {
    resetTimer(index);
    timers.value[index].studentId = '';
}
// Global controls
function startAllTimers() {
    timers.value.forEach((timer, index) => {
        if (timer.studentId && !timer.isRunning && !timer.isStopped) {
            startTimer(index);
        }
    });
}
function stopAllTimers() {
    timers.value.forEach((timer, index) => {
        if (timer.isRunning) {
            stopTimer(index);
        }
    });
}
function resetAllTimers() {
    timers.value.forEach((_, index) => {
        resetTimer(index);
    });
}
// Save times
function saveTime(index) {
    const timer = timers.value[index];
    if (!timer.studentId || timer.time === 0)
        return;
    capturedTimes.value.push({
        studentId: timer.studentId,
        studentName: getStudentName(timer.studentId),
        time: timer.time,
        timestamp: Date.now(),
        laps: [...timer.laps]
    });
    showToast(`Time saved: ${getStudentName(timer.studentId)} - ${formatTime(timer.time)}`, 'success');
    resetTimer(index);
}
function saveAllTimes() {
    let saved = 0;
    timers.value.forEach((timer, index) => {
        if (timer.isStopped && timer.time > 0) {
            saveTime(index);
            saved++;
        }
    });
    if (saved > 0) {
        showToast(`${saved} times saved`, 'success');
    }
}
function deleteRecord(index) {
    capturedTimes.value.splice(index, 1);
    showToast('Record deleted', 'success');
}
// Format time in MM:SS.ms
function formatTime(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((ms % 1000) / 10);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`;
}
// Export
function exportTimes() {
    if (capturedTimes.value.length === 0)
        return;
    const csv = [
        'Student,Time (mm:ss.ms),Timestamp',
        ...capturedTimes.value.map(record => `"${record.studentName}","${formatTime(record.time)}","${new Date(record.timestamp).toLocaleString()}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multistop-times-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Times exported', 'success');
}
// Toast
function showToast(message, type = 'success') {
    toast.value = { show: true, message, type };
    setTimeout(() => {
        toast.value.show = false;
    }, 3000);
}
// Lifecycle
loadClasses();
initializeTimers();
onUnmounted(() => {
    // Clean up all intervals
    timers.value.forEach(timer => {
        if (timer.intervalId) {
            clearInterval(timer.intervalId);
        }
    });
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['stopwatch-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stopwatch-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stopwatch-card']} */ ;
/** @type {__VLS_StyleScopedClasses['running']} */ ;
/** @type {__VLS_StyleScopedClasses['time-display']} */ ;
/** @type {__VLS_StyleScopedClasses['stopped']} */ ;
/** @type {__VLS_StyleScopedClasses['time-display']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['stopwatches-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['time-display']} */ ;
/** @type {__VLS_StyleScopedClasses['global-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['global-controls']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "multistop-view" },
});
/** @type {__VLS_StyleScopedClasses['multistop-view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.t('MULTISTOP.bewerte'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
(__VLS_ctx.t('MULTISTOP.capture-time'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
(__VLS_ctx.t('KLASSEN.klasse'));
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ onChange: (__VLS_ctx.loadStudents) },
    value: (__VLS_ctx.selectedClassId),
    ...{ class: "form-input" },
});
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.t('SELECT.ok'));
(__VLS_ctx.t('KLASSEN.klasse'));
for (const [cls] of __VLS_vFor((__VLS_ctx.classes))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (cls.id),
        value: (cls.id),
    });
    (cls.name);
    // @ts-ignore
    [t, t, t, t, t, loadStudents, selectedClassId, classes,];
}
if (__VLS_ctx.selectedClassId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('MULTISTOP.schueler-anzahl'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.resetAllTimers) },
        type: "number",
        min: "1",
        max: (__VLS_ctx.students.length),
        ...{ class: "form-input" },
    });
    (__VLS_ctx.numberOfStopwatches);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
}
if (__VLS_ctx.selectedClassId && __VLS_ctx.numberOfStopwatches > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stopwatches-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['stopwatches-grid']} */ ;
    for (const [timer, index] of __VLS_vFor((__VLS_ctx.timers))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (index),
            ...{ class: "stopwatch-card" },
            ...{ class: ({
                    running: timer.isRunning,
                    stopped: timer.isStopped,
                    assigned: timer.studentId
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['stopwatch-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['running']} */ ;
        /** @type {__VLS_StyleScopedClasses['stopped']} */ ;
        /** @type {__VLS_StyleScopedClasses['assigned']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stopwatch-header" },
        });
        /** @type {__VLS_StyleScopedClasses['stopwatch-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "stopwatch-number" },
        });
        /** @type {__VLS_StyleScopedClasses['stopwatch-number']} */ ;
        (index + 1);
        if (timer.studentId) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.selectedClassId && __VLS_ctx.numberOfStopwatches > 0))
                            return;
                        if (!(timer.studentId))
                            return;
                        __VLS_ctx.unassignStudent(index);
                        // @ts-ignore
                        [t, selectedClassId, selectedClassId, resetAllTimers, students, numberOfStopwatches, numberOfStopwatches, timers, unassignStudent,];
                    } },
                ...{ class: "btn-icon btn-small" },
                title: (__VLS_ctx.t('COMMON.delete')),
            });
            /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        }
        if (!timer.studentId) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "student-select" },
            });
            /** @type {__VLS_StyleScopedClasses['student-select']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.selectedClassId && __VLS_ctx.numberOfStopwatches > 0))
                            return;
                        if (!(!timer.studentId))
                            return;
                        __VLS_ctx.assignStudent(index);
                        // @ts-ignore
                        [t, assignStudent,];
                    } },
                value: (timer.studentId),
                ...{ class: "form-input form-input-small" },
            });
            /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
            /** @type {__VLS_StyleScopedClasses['form-input-small']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                value: "",
            });
            (__VLS_ctx.t('MULTISTOP.select-student-hint'));
            for (const [student] of __VLS_vFor((__VLS_ctx.availableStudents))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (student.id),
                    value: (student.id),
                });
                (student.firstName);
                (student.lastName);
                // @ts-ignore
                [t, availableStudents,];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "student-name" },
            });
            /** @type {__VLS_StyleScopedClasses['student-name']} */ ;
            (__VLS_ctx.getStudentName(timer.studentId));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "time-display" },
        });
        /** @type {__VLS_StyleScopedClasses['time-display']} */ ;
        (__VLS_ctx.formatTime(timer.time));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stopwatch-controls" },
        });
        /** @type {__VLS_StyleScopedClasses['stopwatch-controls']} */ ;
        if (!timer.isRunning && !timer.isStopped) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.selectedClassId && __VLS_ctx.numberOfStopwatches > 0))
                            return;
                        if (!(!timer.isRunning && !timer.isStopped))
                            return;
                        __VLS_ctx.startTimer(index);
                        // @ts-ignore
                        [getStudentName, formatTime, startTimer,];
                    } },
                ...{ class: "btn-primary btn-small" },
                disabled: (!timer.studentId),
            });
            /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        }
        if (timer.isRunning) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.selectedClassId && __VLS_ctx.numberOfStopwatches > 0))
                            return;
                        if (!(timer.isRunning))
                            return;
                        __VLS_ctx.stopTimer(index);
                        // @ts-ignore
                        [stopTimer,];
                    } },
                ...{ class: "btn-warning btn-small" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
            (__VLS_ctx.t('COMMON.stop') || 'Stop');
        }
        if (timer.isStopped) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.selectedClassId && __VLS_ctx.numberOfStopwatches > 0))
                            return;
                        if (!(timer.isStopped))
                            return;
                        __VLS_ctx.saveTime(index);
                        // @ts-ignore
                        [t, saveTime,];
                    } },
                ...{ class: "btn-success btn-small" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-success']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
            (__VLS_ctx.t('COMMON.save'));
        }
        if (timer.time > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.selectedClassId && __VLS_ctx.numberOfStopwatches > 0))
                            return;
                        if (!(timer.time > 0))
                            return;
                        __VLS_ctx.resetTimer(index);
                        // @ts-ignore
                        [t, resetTimer,];
                    } },
                ...{ class: "btn-secondary btn-small" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        }
        if (timer.laps.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "lap-times-mini" },
            });
            /** @type {__VLS_StyleScopedClasses['lap-times-mini']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            (timer.laps.length);
        }
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.selectedClassId && __VLS_ctx.numberOfStopwatches > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "global-controls" },
    });
    /** @type {__VLS_StyleScopedClasses['global-controls']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.startAllTimers) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.allRunning),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.t('COMMON.start-all') || 'Start All');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.stopAllTimers) },
        ...{ class: "btn-warning" },
        disabled: (__VLS_ctx.noneRunning),
    });
    /** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
    (__VLS_ctx.t('COMMON.stop-all') || 'Stop All');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.resetAllTimers) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    (__VLS_ctx.t('COMMON.reset-all') || 'Reset All');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveAllTimes) },
        ...{ class: "btn-success" },
        disabled: (!__VLS_ctx.hasStoppedTimers),
    });
    /** @type {__VLS_StyleScopedClasses['btn-success']} */ ;
    (__VLS_ctx.t('COMMON.save-all') || 'Save All');
}
if (__VLS_ctx.capturedTimes.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t('MULTISTOP.captured-times'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exportTimes) },
        ...{ class: "btn-secondary btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    (__VLS_ctx.t('COMMON.export') || 'Export');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "captured-times-list" },
    });
    /** @type {__VLS_StyleScopedClasses['captured-times-list']} */ ;
    for (const [record, index] of __VLS_vFor((__VLS_ctx.capturedTimes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (index),
            ...{ class: "time-record" },
        });
        /** @type {__VLS_StyleScopedClasses['time-record']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "record-info" },
        });
        /** @type {__VLS_StyleScopedClasses['record-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (record.studentName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "record-time" },
        });
        /** @type {__VLS_StyleScopedClasses['record-time']} */ ;
        (__VLS_ctx.formatTime(record.time));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "record-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['record-meta']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        (new Date(record.timestamp).toLocaleTimeString());
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.capturedTimes.length > 0))
                        return;
                    __VLS_ctx.deleteRecord(index);
                    // @ts-ignore
                    [t, t, t, t, t, t, selectedClassId, resetAllTimers, numberOfStopwatches, formatTime, startAllTimers, allRunning, stopAllTimers, noneRunning, saveAllTimes, hasStoppedTimers, capturedTimes, capturedTimes, exportTimes, deleteRecord,];
                } },
            ...{ class: "btn-icon btn-danger btn-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.toast.show) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast" },
        ...{ class: (__VLS_ctx.toast.type) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    (__VLS_ctx.toast.message);
}
// @ts-ignore
[toast, toast, toast,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
