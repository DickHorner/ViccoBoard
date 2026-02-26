/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { PrecisionTimer, formatTimeSimple } from '../utils/precision-timer';
import { getAudioService } from '../services/audio.service';
const { t } = useI18n();
const props = withDefaults(defineProps(), {
    audioEnabled: true
});
const emit = defineEmits();
const timer = new PrecisionTimer();
const audioService = getAudioService();
const isRunning = ref(false);
const hasStarted = ref(false);
const audioReady = ref(false);
const currentTime = ref(0);
const studentStops = ref({});
const currentLevelIndex = ref(0);
const displayTime = computed(() => formatTimeSimple(currentTime.value));
const currentLevel = computed(() => {
    if (props.config.levels.length === 0)
        return null;
    return props.config.levels[currentLevelIndex.value] || null;
});
async function handleStart() {
    // Unlock audio on user gesture (Safari requirement)
    if (props.audioEnabled && props.config.audioSignalsEnabled) {
        audioReady.value = await audioService.unlock();
    }
    hasStarted.value = true;
    isRunning.value = true;
    // Play start beep
    if (audioReady.value) {
        await audioService.playSignal('beep-long');
    }
    timer.start((elapsed) => {
        currentTime.value = elapsed;
        checkLevelTransition(elapsed);
    });
}
function handlePause() {
    isRunning.value = false;
    timer.pause();
}
function handleResume() {
    isRunning.value = true;
    timer.start();
}
function handleStop() {
    isRunning.value = false;
    hasStarted.value = false;
    timer.stop();
    // Emit results
    emit('complete', studentStops.value);
    // Reset
    currentTime.value = 0;
    studentStops.value = {};
    currentLevelIndex.value = 0;
}
function stopStudent(studentId) {
    if (!isRunning.value)
        return;
    studentStops.value[studentId] = currentTime.value;
    // Play beep for individual stop
    if (audioReady.value) {
        audioService.playSignal('beep-short', 600);
    }
}
function checkLevelTransition(elapsed) {
    if (!currentLevel.value)
        return;
    const level = currentLevel.value;
    const levelDuration = level.duration * 1000; // Convert to ms
    // Check if we should transition to next level
    const expectedTime = currentLevelIndex.value * levelDuration;
    if (elapsed >= expectedTime + levelDuration) {
        // Move to next level
        if (currentLevelIndex.value < props.config.levels.length - 1) {
            currentLevelIndex.value++;
            // Play level transition beep
            if (audioReady.value) {
                audioService.playSignal('beep-long');
            }
        }
    }
}
function formatTime(ms) {
    return formatTimeSimple(ms);
}
onMounted(() => {
    audioService.setEnabled(props.audioEnabled && props.config.audioSignalsEnabled);
});
onUnmounted(() => {
    timer.dispose();
});
const __VLS_defaults = {
    audioEnabled: true
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
/** @type {__VLS_StyleScopedClasses['btn-start']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-start']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-pause']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-resume']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-stop']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-stop']} */ ;
/** @type {__VLS_StyleScopedClasses['student-stops']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-stop-student']} */ ;
/** @type {__VLS_StyleScopedClasses['time']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['student-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "shuttle-timer" },
});
/** @type {__VLS_StyleScopedClasses['shuttle-timer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "timer-display" },
});
/** @type {__VLS_StyleScopedClasses['timer-display']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "time" },
});
/** @type {__VLS_StyleScopedClasses['time']} */ ;
(__VLS_ctx.displayTime);
if (__VLS_ctx.currentLevel) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "level-info" },
    });
    /** @type {__VLS_StyleScopedClasses['level-info']} */ ;
    (__VLS_ctx.currentLevel.level);
    (__VLS_ctx.currentLevel.lane);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "timer-controls" },
});
/** @type {__VLS_StyleScopedClasses['timer-controls']} */ ;
if (!__VLS_ctx.isRunning && !__VLS_ctx.hasStarted) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleStart) },
        ...{ class: "btn-start" },
        ...{ style: ({ minHeight: '44px', minWidth: '44px' }) },
    });
    /** @type {__VLS_StyleScopedClasses['btn-start']} */ ;
    (__VLS_ctx.t('SHUTTLE.start'));
}
if (__VLS_ctx.isRunning) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handlePause) },
        ...{ class: "btn-pause" },
        ...{ style: ({ minHeight: '44px', minWidth: '44px' }) },
    });
    /** @type {__VLS_StyleScopedClasses['btn-pause']} */ ;
    (__VLS_ctx.t('COMMON.pause'));
}
if (!__VLS_ctx.isRunning && __VLS_ctx.hasStarted) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleResume) },
        ...{ class: "btn-resume" },
        ...{ style: ({ minHeight: '44px', minWidth: '44px' }) },
    });
    /** @type {__VLS_StyleScopedClasses['btn-resume']} */ ;
    (__VLS_ctx.t('COMMON.continue'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleStop) },
    ...{ class: "btn-stop" },
    disabled: (!__VLS_ctx.hasStarted),
    ...{ style: ({ minHeight: '44px', minWidth: '44px' }) },
});
/** @type {__VLS_StyleScopedClasses['btn-stop']} */ ;
(__VLS_ctx.t('COMMON.stop'));
if (__VLS_ctx.audioEnabled && !__VLS_ctx.audioReady) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "audio-status" },
    });
    /** @type {__VLS_StyleScopedClasses['audio-status']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "warning" },
    });
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    (__VLS_ctx.t('SHUTTLE.audio-unlock-required'));
}
if (__VLS_ctx.hasStarted) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "student-stops" },
    });
    /** @type {__VLS_StyleScopedClasses['student-stops']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t('SHUTTLE.individual-stops'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "student-list" },
    });
    /** @type {__VLS_StyleScopedClasses['student-list']} */ ;
    for (const [student] of __VLS_vFor((__VLS_ctx.students))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (student.id),
            ...{ class: "student-item" },
        });
        /** @type {__VLS_StyleScopedClasses['student-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "student-name" },
        });
        /** @type {__VLS_StyleScopedClasses['student-name']} */ ;
        (student.firstName);
        (student.lastName);
        if (!__VLS_ctx.studentStops[student.id]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.hasStarted))
                            return;
                        if (!(!__VLS_ctx.studentStops[student.id]))
                            return;
                        __VLS_ctx.stopStudent(student.id);
                        // @ts-ignore
                        [displayTime, currentLevel, currentLevel, currentLevel, isRunning, isRunning, isRunning, hasStarted, hasStarted, hasStarted, hasStarted, handleStart, t, t, t, t, t, t, handlePause, handleResume, handleStop, audioEnabled, audioReady, students, studentStops, stopStudent,];
                    } },
                ...{ class: "btn-stop-student" },
                disabled: (!__VLS_ctx.isRunning),
                ...{ style: ({ minHeight: '44px', minWidth: '120px' }) },
            });
            /** @type {__VLS_StyleScopedClasses['btn-stop-student']} */ ;
            (__VLS_ctx.t('SHUTTLE.stop'));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "stopped-time" },
            });
            /** @type {__VLS_StyleScopedClasses['stopped-time']} */ ;
            (__VLS_ctx.formatTime(__VLS_ctx.studentStops[student.id]));
        }
        // @ts-ignore
        [isRunning, t, studentStops, formatTime,];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default {};
