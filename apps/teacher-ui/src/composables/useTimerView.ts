import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
const uuidv4 = () => crypto.randomUUID();

import { useSportBridge } from './useSportBridge';
import { useToast } from './useToast';
import {
  INTERVAL_PRESETS,
  type IntervalPreset,
  calcRingOffset,
  calcTotalIntervalDurationMs,
  circleCircumference,
} from '../utils/timer-presets';

export function useTimerView() {
  const { t } = useI18n();
  const { SportBridge } = useSportBridge();
  const toast = useToast();

  const SVG_R = 80;
  const CIRCUMFERENCE = circleCircumference(SVG_R);
  const PRESENTER_R = 130;
  const PRESENTER_CIRCUMFERENCE = circleCircumference(PRESENTER_R);

  const mode = ref<'countdown' | 'stopwatch' | 'interval'>('countdown');
  const isRunning = ref(false);
  const isPaused = ref(false);
  const soundEnabled = ref(true);
  const saving = ref(false);
  const sessionId = ref(uuidv4());
  const presenterMode = ref(false);

  const countdownMinutes = ref(5);
  const countdownSeconds = ref(0);
  const timeRemaining = ref(0);
  const countdownTotalMs = ref(0);
  let intervalId: number | null = null;

  const elapsedTime = ref(0);
  const lapTimes = ref<Array<{ number: number; time: number }>>([]);

  const workTime = ref(30);
  const restTime = ref(10);
  const rounds = ref(5);
  const currentRound = ref(1);
  const currentPhase = ref<'work' | 'rest'>('work');
  const totalElapsedMs = ref(0);

  const phaseDurationMs = computed(() =>
    currentPhase.value === 'work' ? workTime.value * 1000 : restTime.value * 1000,
  );

  const totalIntervalDurationMs = computed(() =>
    calcTotalIntervalDurationMs(workTime.value * 1000, restTime.value * 1000, rounds.value),
  );

  const countdownRingOffset = computed(() =>
    calcRingOffset(timeRemaining.value, countdownTotalMs.value, CIRCUMFERENCE),
  );

  const intervalRingOffset = computed(() =>
    calcRingOffset(timeRemaining.value, phaseDurationMs.value, CIRCUMFERENCE),
  );

  const presenterIntervalRingOffset = computed(() =>
    calcRingOffset(timeRemaining.value, phaseDurationMs.value, PRESENTER_CIRCUMFERENCE),
  );

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  function startCountdown() {
    const totalMs = (countdownMinutes.value * 60 + countdownSeconds.value) * 1000;
    if (totalMs === 0) return;

    countdownTotalMs.value = totalMs;
    timeRemaining.value = totalMs;
    isRunning.value = true;
    isPaused.value = false;

    intervalId = window.setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value -= 100;
      } else {
        stopTimer();
        if (soundEnabled.value) {
          playBeep();
        }
      }
    }, 100);
  }

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
      time: elapsedTime.value,
    });
  }

  function startInterval() {
    currentRound.value = 1;
    currentPhase.value = 'work';
    timeRemaining.value = workTime.value * 1000;
    totalElapsedMs.value = 0;
    isRunning.value = true;
    isPaused.value = false;

    intervalId = window.setInterval(() => {
      totalElapsedMs.value += 100;
      if (timeRemaining.value > 0) {
        timeRemaining.value -= 100;
      } else if (currentPhase.value === 'work') {
        if (restTime.value > 0) {
          currentPhase.value = 'rest';
          timeRemaining.value = restTime.value * 1000;
          if (soundEnabled.value) playBeep();
        } else {
          nextRound();
        }
      } else {
        nextRound();
      }
    }, 100);
  }

  function nextRound() {
    if (currentRound.value < rounds.value) {
      currentRound.value++;
      currentPhase.value = 'work';
      timeRemaining.value = workTime.value * 1000;
      if (soundEnabled.value) playBeep();
    } else {
      stopTimer();
      if (soundEnabled.value) playBeep();
    }
  }

  function applyPreset(preset: IntervalPreset) {
    workTime.value = preset.work;
    restTime.value = preset.rest;
    rounds.value = preset.rounds;
  }

  function togglePresenter() {
    presenterMode.value = !presenterMode.value;
  }

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
        } else {
          stopTimer();
          if (soundEnabled.value) playBeep();
        }
      }, 100);
    } else if (mode.value === 'stopwatch') {
      intervalId = window.setInterval(() => {
        elapsedTime.value += 100;
      }, 100);
    } else if (mode.value === 'interval') {
      intervalId = window.setInterval(() => {
        totalElapsedMs.value += 100;
        if (timeRemaining.value > 0) {
          timeRemaining.value -= 100;
        } else if (currentPhase.value === 'work') {
          if (restTime.value > 0) {
            currentPhase.value = 'rest';
            timeRemaining.value = restTime.value * 1000;
            if (soundEnabled.value) playBeep();
          } else {
            nextRound();
          }
        } else {
          nextRound();
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
    totalElapsedMs.value = 0;
    countdownTotalMs.value = 0;
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
    try {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
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
      let durationMs: number | undefined;
      let intervalMs: number | undefined;
      let intervalCount: number | undefined;

      if (mode.value === 'countdown') {
        elapsedMs = (countdownMinutes.value * 60 + countdownSeconds.value) * 1000 - timeRemaining.value;
        durationMs = (countdownMinutes.value * 60 + countdownSeconds.value) * 1000;
      } else if (mode.value === 'stopwatch') {
        elapsedMs = elapsedTime.value;
      } else if (mode.value === 'interval') {
        elapsedMs = totalElapsedMs.value;
        intervalMs = (workTime.value + restTime.value) * 1000;
        intervalCount = currentRound.value;
      }

      const result = await useCase.execute({
        sessionId: sessionId.value,
        mode: mode.value,
        elapsedMs,
        durationMs,
        intervalMs,
        intervalCount,
        audioEnabled: soundEnabled.value,
        metadata: {
          timestamp: new Date(),
          lapTimes: mode.value === 'stopwatch' ? lapTimes.value : undefined,
        },
      });

      void result;
      sessionId.value = uuidv4();
    } catch (error) {
      console.error('Failed to save timer result:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      saving.value = false;
    }
  }

  return {
    t,
    INTERVAL_PRESETS,
    CIRCUMFERENCE,
    PRESENTER_CIRCUMFERENCE,
    mode,
    isRunning,
    isPaused,
    soundEnabled,
    saving,
    presenterMode,
    countdownMinutes,
    countdownSeconds,
    timeRemaining,
    elapsedTime,
    lapTimes,
    workTime,
    restTime,
    rounds,
    currentRound,
    currentPhase,
    totalElapsedMs,
    totalIntervalDurationMs,
    countdownRingOffset,
    intervalRingOffset,
    presenterIntervalRingOffset,
    formatTime,
    startCountdown,
    startStopwatch,
    recordLap,
    startInterval,
    applyPreset,
    togglePresenter,
    pauseTimer,
    resumeTimer,
    resetTimer,
    saveTimerResult,
  };
}
