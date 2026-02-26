/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSportBridge } from '../composables/useSportBridge';
import { useToast } from '../composables/useToast';
import { v4 as uuidv4 } from 'uuid';
const { t } = useI18n();
const { SportBridge } = useSportBridge();
const toast = useToast();
// State
const mode = ref('countdown');
const isRunning = ref(false);
const isPaused = ref(false);
const soundEnabled = ref(true);
const saving = ref(false);
const sessionId = ref(uuidv4());
// Countdown state
const countdownMinutes = ref(5);
const countdownSeconds = ref(0);
const timeRemaining = ref(0);
let intervalId = null;
// Stopwatch state
const elapsedTime = ref(0);
const lapTimes = ref([]);
// Interval timer state
const workTime = ref(30);
const restTime = ref(10);
const rounds = ref(5);
const currentRound = ref(1);
const currentPhase = ref('work');
// Format time in MM:SS or HH:MM:SS
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
}
// Countdown timer
function startCountdown() {
    const totalMs = (countdownMinutes.value * 60 + countdownSeconds.value) * 1000;
    if (totalMs === 0)
        return;
    timeRemaining.value = totalMs;
    isRunning.value = true;
    isPaused.value = false;
    intervalId = window.setInterval(() => {
        if (timeRemaining.value > 0) {
            timeRemaining.value -= 100;
        }
        else {
            stopTimer();
            if (soundEnabled.value) {
                playBeep();
            }
        }
    }, 100);
}
// Stopwatch
function startStopwatch() {
    elapsedTime.value = 0;
    lapTimes.value = [];
    isRunning.value = true;
    isPaused.value = false;
    intervalId = window.setInterval(() => {
        elapsedTime.value += 100;
    }, 100);
}
function recordLap() {
    lapTimes.value.push({
        number: lapTimes.value.length + 1,
        time: elapsedTime.value
    });
}
// Interval timer
function startInterval() {
    currentRound.value = 1;
    currentPhase.value = 'work';
    timeRemaining.value = workTime.value * 1000;
    isRunning.value = true;
    isPaused.value = false;
    intervalId = window.setInterval(() => {
        if (timeRemaining.value > 0) {
            timeRemaining.value -= 100;
        }
        else {
            // Phase transition
            if (currentPhase.value === 'work') {
                if (restTime.value > 0) {
                    currentPhase.value = 'rest';
                    timeRemaining.value = restTime.value * 1000;
                    if (soundEnabled.value)
                        playBeep();
                }
                else {
                    nextRound();
                }
            }
            else {
                nextRound();
            }
        }
    }, 100);
}
function nextRound() {
    if (currentRound.value < rounds.value) {
        currentRound.value++;
        currentPhase.value = 'work';
        timeRemaining.value = workTime.value * 1000;
        if (soundEnabled.value)
            playBeep();
    }
    else {
        stopTimer();
        if (soundEnabled.value)
            playBeep();
    }
}
// Timer controls
function pauseTimer() {
    isPaused.value = true;
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
function resumeTimer() {
    isPaused.value = false;
    if (mode.value === 'countdown') {
        intervalId = window.setInterval(() => {
            if (timeRemaining.value > 0) {
                timeRemaining.value -= 100;
            }
            else {
                stopTimer();
                if (soundEnabled.value)
                    playBeep();
            }
        }, 100);
    }
    else if (mode.value === 'stopwatch') {
        intervalId = window.setInterval(() => {
            elapsedTime.value += 100;
        }, 100);
    }
    else if (mode.value === 'interval') {
        intervalId = window.setInterval(() => {
            if (timeRemaining.value > 0) {
                timeRemaining.value -= 100;
            }
            else {
                if (currentPhase.value === 'work') {
                    if (restTime.value > 0) {
                        currentPhase.value = 'rest';
                        timeRemaining.value = restTime.value * 1000;
                        if (soundEnabled.value)
                            playBeep();
                    }
                    else {
                        nextRound();
                    }
                }
                else {
                    nextRound();
                }
            }
        }, 100);
    }
}
function resetTimer() {
    stopTimer();
    timeRemaining.value = 0;
    elapsedTime.value = 0;
    lapTimes.value = [];
    currentRound.value = 1;
    currentPhase.value = 'work';
}
function stopTimer() {
    isRunning.value = false;
    isPaused.value = false;
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
function playBeep() {
    // Simple beep using Web Audio API
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
    catch (e) {
        console.warn('Audio not available:', e);
    }
}
async function saveTimerResult() {
    saving.value = true;
    try {
        const useCase = SportBridge.value?.recordTimerResultUseCase;
        if (!useCase) {
            throw new Error('RecordTimerResultUseCase not available');
        }
        let elapsedMs = 0;
        let durationMs = undefined;
        let intervalMs = undefined;
        let intervalCount = undefined;
        if (mode.value === 'countdown') {
            elapsedMs = (countdownMinutes.value * 60 + countdownSeconds.value) * 1000 - timeRemaining.value;
            durationMs = (countdownMinutes.value * 60 + countdownSeconds.value) * 1000;
        }
        else if (mode.value === 'stopwatch') {
            elapsedMs = elapsedTime.value;
        }
        else if (mode.value === 'interval') {
            elapsedMs = (currentRound.value - 1) * (workTime.value + restTime.value) * 1000 +
                (currentPhase.value === 'rest' ? restTime.value * 1000 : workTime.value * 1000);
            intervalMs = (workTime.value + restTime.value) * 1000;
            intervalCount = currentRound.value;
        }
        const _result = await useCase.execute({
            sessionId: sessionId.value,
            mode: mode.value,
            elapsedMs,
            durationMs,
            intervalMs,
            intervalCount,
            audioEnabled: soundEnabled.value,
            metadata: {
                timestamp: new Date(),
                lapTimes: mode.value === 'stopwatch' ? lapTimes.value : undefined
            }
        });
        void _result;
        sessionId.value = uuidv4();
    }
    catch (error) {
        console.error('Failed to save timer result:', error);
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
/** @type {__VLS_StyleScopedClasses['mode-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['mode-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['time-input']} */ ;
/** @type {__VLS_StyleScopedClasses['time-input']} */ ;
/** @type {__VLS_StyleScopedClasses['time-display']} */ ;
/** @type {__VLS_StyleScopedClasses['time-display']} */ ;
/** @type {__VLS_StyleScopedClasses['time-display']} */ ;
/** @type {__VLS_StyleScopedClasses['time-display']} */ ;
/** @type {__VLS_StyleScopedClasses['current-phase']} */ ;
/** @type {__VLS_StyleScopedClasses['work']} */ ;
/** @type {__VLS_StyleScopedClasses['current-phase']} */ ;
/** @type {__VLS_StyleScopedClasses['rest']} */ ;
/** @type {__VLS_StyleScopedClasses['lap-times']} */ ;
/** @type {__VLS_StyleScopedClasses['lap-item']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
/** @type {__VLS_StyleScopedClasses['time-display']} */ ;
/** @type {__VLS_StyleScopedClasses['time-input-group']} */ ;
/** @type {__VLS_StyleScopedClasses['time-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "timer-view" },
});
/** @type {__VLS_StyleScopedClasses['timer-view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.t('TIMER.set'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
(__VLS_ctx.t('TIMER.settings'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "timer-modes" },
});
/** @type {__VLS_StyleScopedClasses['timer-modes']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mode = 'countdown';
            // @ts-ignore
            [t, t, mode,];
        } },
    ...{ class: "mode-btn" },
    ...{ class: ({ active: __VLS_ctx.mode === 'countdown' }) },
});
/** @type {__VLS_StyleScopedClasses['mode-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
(__VLS_ctx.t('TIMER.set'));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mode = 'stopwatch';
            // @ts-ignore
            [t, mode, mode,];
        } },
    ...{ class: "mode-btn" },
    ...{ class: ({ active: __VLS_ctx.mode === 'stopwatch' }) },
});
/** @type {__VLS_StyleScopedClasses['mode-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mode = 'interval';
            // @ts-ignore
            [mode, mode,];
        } },
    ...{ class: "mode-btn" },
    ...{ class: ({ active: __VLS_ctx.mode === 'interval' }) },
});
/** @type {__VLS_StyleScopedClasses['mode-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
(__VLS_ctx.t('TIMER.workout'));
(__VLS_ctx.t('TIMER.rest'));
if (__VLS_ctx.mode === 'countdown') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card timer-card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    /** @type {__VLS_StyleScopedClasses['timer-card']} */ ;
    if (!__VLS_ctx.isRunning && !__VLS_ctx.isPaused) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "timer-setup" },
        });
        /** @type {__VLS_StyleScopedClasses['timer-setup']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "time-input-group" },
        });
        /** @type {__VLS_StyleScopedClasses['time-input-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "time-input" },
        });
        /** @type {__VLS_StyleScopedClasses['time-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.t('TIMER.minutes'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "0",
            max: "99",
            ...{ class: "form-input" },
        });
        (__VLS_ctx.countdownMinutes);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "time-separator" },
        });
        /** @type {__VLS_StyleScopedClasses['time-separator']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "time-input" },
        });
        /** @type {__VLS_StyleScopedClasses['time-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.t('TIMER.seconds'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "0",
            max: "59",
            ...{ class: "form-input" },
        });
        (__VLS_ctx.countdownSeconds);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.startCountdown) },
            ...{ class: "btn-primary btn-large" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-large']} */ ;
        (__VLS_ctx.t('COMMON.start') || 'Start');
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "timer-display" },
        });
        /** @type {__VLS_StyleScopedClasses['timer-display']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "time-display" },
            ...{ class: ({ warning: __VLS_ctx.timeRemaining < 10000, finished: __VLS_ctx.timeRemaining === 0 }) },
        });
        /** @type {__VLS_StyleScopedClasses['time-display']} */ ;
        /** @type {__VLS_StyleScopedClasses['warning']} */ ;
        /** @type {__VLS_StyleScopedClasses['finished']} */ ;
        (__VLS_ctx.formatTime(__VLS_ctx.timeRemaining));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "timer-controls" },
        });
        /** @type {__VLS_StyleScopedClasses['timer-controls']} */ ;
        if (__VLS_ctx.isRunning && !__VLS_ctx.isPaused) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.pauseTimer) },
                ...{ class: "btn-secondary" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
            (__VLS_ctx.t('COMMON.pause') || 'Pause');
        }
        if (__VLS_ctx.isPaused) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.resumeTimer) },
                ...{ class: "btn-primary" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
            (__VLS_ctx.t('COMMON.resume') || 'Resume');
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.resetTimer) },
            ...{ class: "btn-danger" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
        (__VLS_ctx.t('COMMON.reset') || 'Reset');
        if (__VLS_ctx.timeRemaining === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "timer-finished" },
            });
            /** @type {__VLS_StyleScopedClasses['timer-finished']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            (__VLS_ctx.t('TIMER.finished'));
        }
    }
}
if (__VLS_ctx.mode === 'stopwatch') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card timer-card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    /** @type {__VLS_StyleScopedClasses['timer-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "timer-display" },
    });
    /** @type {__VLS_StyleScopedClasses['timer-display']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "time-display" },
    });
    /** @type {__VLS_StyleScopedClasses['time-display']} */ ;
    (__VLS_ctx.formatTime(__VLS_ctx.elapsedTime));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "timer-controls" },
    });
    /** @type {__VLS_StyleScopedClasses['timer-controls']} */ ;
    if (!__VLS_ctx.isRunning) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.startStopwatch) },
            ...{ class: "btn-primary btn-large" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-large']} */ ;
        (__VLS_ctx.t('COMMON.start') || 'Start');
    }
    if (__VLS_ctx.isRunning && !__VLS_ctx.isPaused) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.pauseTimer) },
            ...{ class: "btn-secondary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        (__VLS_ctx.t('COMMON.pause') || 'Pause');
    }
    if (__VLS_ctx.isPaused) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.resumeTimer) },
            ...{ class: "btn-primary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        (__VLS_ctx.t('COMMON.resume') || 'Resume');
    }
    if (__VLS_ctx.isRunning || __VLS_ctx.isPaused) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.recordLap) },
            ...{ class: "btn-warning" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.resetTimer) },
        ...{ class: "btn-danger" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
    (__VLS_ctx.t('COMMON.reset') || 'Reset');
    if (__VLS_ctx.lapTimes.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "lap-times" },
        });
        /** @type {__VLS_StyleScopedClasses['lap-times']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        (__VLS_ctx.t('MULTISTOP.times'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "lap-list" },
        });
        /** @type {__VLS_StyleScopedClasses['lap-list']} */ ;
        for (const [lap, index] of __VLS_vFor((__VLS_ctx.lapTimes))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (index),
                ...{ class: "lap-item" },
            });
            /** @type {__VLS_StyleScopedClasses['lap-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "lap-number" },
            });
            /** @type {__VLS_StyleScopedClasses['lap-number']} */ ;
            (lap.number);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "lap-time" },
            });
            /** @type {__VLS_StyleScopedClasses['lap-time']} */ ;
            (__VLS_ctx.formatTime(lap.time));
            // @ts-ignore
            [t, t, t, t, t, t, t, t, t, t, t, t, t, t, mode, mode, mode, isRunning, isRunning, isRunning, isRunning, isRunning, isPaused, isPaused, isPaused, isPaused, isPaused, isPaused, countdownMinutes, countdownSeconds, startCountdown, timeRemaining, timeRemaining, timeRemaining, timeRemaining, formatTime, formatTime, formatTime, pauseTimer, pauseTimer, resumeTimer, resumeTimer, resetTimer, resetTimer, elapsedTime, startStopwatch, recordLap, lapTimes, lapTimes,];
        }
    }
}
if (__VLS_ctx.mode === 'interval') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card timer-card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    /** @type {__VLS_StyleScopedClasses['timer-card']} */ ;
    if (!__VLS_ctx.isRunning && !__VLS_ctx.isPaused) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "timer-setup" },
        });
        /** @type {__VLS_StyleScopedClasses['timer-setup']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "interval-setup" },
        });
        /** @type {__VLS_StyleScopedClasses['interval-setup']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.t('TIMER.workout-time'));
        (__VLS_ctx.t('TIMER.seconds'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "1",
            max: "999",
            ...{ class: "form-input" },
        });
        (__VLS_ctx.workTime);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.t('TIMER.pause-time'));
        (__VLS_ctx.t('TIMER.seconds'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "0",
            max: "999",
            ...{ class: "form-input" },
        });
        (__VLS_ctx.restTime);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "form-group" },
        });
        /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        (__VLS_ctx.t('TIMER.rounds'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "number",
            min: "1",
            max: "50",
            ...{ class: "form-input" },
        });
        (__VLS_ctx.rounds);
        /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.startInterval) },
            ...{ class: "btn-primary btn-large" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-large']} */ ;
        (__VLS_ctx.t('COMMON.start') || 'Start');
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "timer-display" },
        });
        /** @type {__VLS_StyleScopedClasses['timer-display']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "interval-info" },
        });
        /** @type {__VLS_StyleScopedClasses['interval-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "current-phase" },
            ...{ class: (__VLS_ctx.currentPhase) },
        });
        /** @type {__VLS_StyleScopedClasses['current-phase']} */ ;
        (__VLS_ctx.currentPhase === 'work' ? __VLS_ctx.t('TIMER.workout') : __VLS_ctx.t('TIMER.rest'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "round-info" },
        });
        /** @type {__VLS_StyleScopedClasses['round-info']} */ ;
        (__VLS_ctx.t('TIMER.round'));
        (__VLS_ctx.currentRound);
        (__VLS_ctx.rounds);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "time-display" },
            ...{ class: ({ work: __VLS_ctx.currentPhase === 'work', rest: __VLS_ctx.currentPhase === 'rest' }) },
        });
        /** @type {__VLS_StyleScopedClasses['time-display']} */ ;
        /** @type {__VLS_StyleScopedClasses['work']} */ ;
        /** @type {__VLS_StyleScopedClasses['rest']} */ ;
        (__VLS_ctx.formatTime(__VLS_ctx.timeRemaining));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "timer-controls" },
        });
        /** @type {__VLS_StyleScopedClasses['timer-controls']} */ ;
        if (__VLS_ctx.isRunning && !__VLS_ctx.isPaused) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.pauseTimer) },
                ...{ class: "btn-secondary" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
            (__VLS_ctx.t('COMMON.pause') || 'Pause');
        }
        if (__VLS_ctx.isPaused) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.resumeTimer) },
                ...{ class: "btn-primary" },
            });
            /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
            (__VLS_ctx.t('COMMON.resume') || 'Resume');
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.resetTimer) },
            ...{ class: "btn-danger" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
        (__VLS_ctx.t('COMMON.reset') || 'Reset');
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
(__VLS_ctx.t('TIMER.sound-settings'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-content" },
});
/** @type {__VLS_StyleScopedClasses['card-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "checkbox-label" },
});
/** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "checkbox",
});
(__VLS_ctx.soundEnabled);
(__VLS_ctx.t('TIMER.enable-sounds'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.saveTimerResult) },
    ...{ class: "btn-primary btn-large" },
    disabled: (__VLS_ctx.saving || (!__VLS_ctx.isRunning && __VLS_ctx.elapsedTime === 0 && __VLS_ctx.timeRemaining === 0)),
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-large']} */ ;
(__VLS_ctx.saving ? __VLS_ctx.t('COMMON.syncing') : '💾 ' + __VLS_ctx.t('COMMON.save'));
// @ts-ignore
[t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, mode, isRunning, isRunning, isRunning, isPaused, isPaused, isPaused, timeRemaining, timeRemaining, formatTime, pauseTimer, resumeTimer, resetTimer, elapsedTime, workTime, restTime, rounds, rounds, startInterval, currentPhase, currentPhase, currentPhase, currentPhase, currentRound, soundEnabled, saveTimerResult, saving, saving,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
