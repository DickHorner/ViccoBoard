<template>
  <div class="shuttle-timer">
    <div class="timer-display">
      <div class="time">{{ displayTime }}</div>
      <div class="level-info" v-if="currentLevel">
        Level {{ currentLevel.level }} - Lane {{ currentLevel.lane }}
      </div>
    </div>

    <div class="timer-controls">
      <button 
        v-if="!isRunning && !hasStarted" 
        @click="handleStart" 
        class="btn-start"
        :style="{ minHeight: '44px', minWidth: '44px' }"
      >
        {{ t('SHUTTLE.start') }}
      </button>
      
      <button 
        v-if="isRunning" 
        @click="handlePause" 
        class="btn-pause"
        :style="{ minHeight: '44px', minWidth: '44px' }"
      >
        {{ t('COMMON.pause') }}
      </button>
      
      <button 
        v-if="!isRunning && hasStarted" 
        @click="handleResume" 
        class="btn-resume"
        :style="{ minHeight: '44px', minWidth: '44px' }"
      >
        {{ t('COMMON.continue') }}
      </button>
      
      <button 
        @click="handleStop" 
        class="btn-stop"
        :disabled="!hasStarted"
        :style="{ minHeight: '44px', minWidth: '44px' }"
      >
        {{ t('COMMON.stop') }}
      </button>
    </div>

    <div class="audio-status" v-if="audioEnabled && !audioReady">
      <p class="warning">{{ t('SHUTTLE.audio-unlock-required') }}</p>
    </div>

    <div class="student-stops" v-if="hasStarted">
      <h3>{{ t('SHUTTLE.individual-stops') }}</h3>
      <div class="student-list">
        <div 
          v-for="student in students" 
          :key="student.id"
          class="student-item"
        >
          <span class="student-name">{{ student.firstName }} {{ student.lastName }}</span>
          <button
            v-if="!studentStops[student.id]"
            @click="stopStudent(student.id)"
            class="btn-stop-student"
            :disabled="!isRunning"
            :style="{ minHeight: '44px', minWidth: '120px' }"
          >
            {{ t('SHUTTLE.stop') }}
          </button>
          <span v-else class="stopped-time">
            {{ formatTime(studentStops[student.id]) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { PrecisionTimer, formatTimeSimple } from '../utils/precision-timer';
import { getAudioService } from '../services/audio.service';
import type { Student, Sport } from '@viccoboard/core';

const { t } = useI18n();

interface Props {
  students: Student[];
  config: Sport.ShuttleRunConfig;
  audioEnabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  audioEnabled: true
});

const emit = defineEmits<{
  complete: [stops: Record<string, number>];
}>();

const timer = new PrecisionTimer();
const audioService = getAudioService();

const isRunning = ref(false);
const hasStarted = ref(false);
const audioReady = ref(false);
const currentTime = ref(0);
const studentStops = ref<Record<string, number>>({});
const currentLevelIndex = ref(0);

const displayTime = computed(() => formatTimeSimple(currentTime.value));

const currentLevel = computed(() => {
  if (props.config.levels.length === 0) return null;
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

function stopStudent(studentId: string) {
  if (!isRunning.value) return;
  
  studentStops.value[studentId] = currentTime.value;
  
  // Play beep for individual stop
  if (audioReady.value) {
    audioService.playSignal('beep-short', 600);
  }
}

function checkLevelTransition(elapsed: number) {
  if (!currentLevel.value) return;
  
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

function formatTime(ms: number): string {
  return formatTimeSimple(ms);
}

onMounted(() => {
  audioService.setEnabled(props.audioEnabled && props.config.audioSignalsEnabled);
});

onUnmounted(() => {
  timer.dispose();
});
</script>

<style scoped>
.shuttle-timer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.timer-display {
  text-align: center;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.time {
  font-size: 3rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #333;
}

.level-info {
  margin-top: 0.5rem;
  font-size: 1.2rem;
  color: #666;
}

.timer-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-start,
.btn-pause,
.btn-resume,
.btn-stop,
.btn-stop-student {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-start {
  background: #4CAF50;
  color: white;
}

.btn-start:hover {
  background: #45a049;
}

.btn-pause {
  background: #FF9800;
  color: white;
}

.btn-resume {
  background: #2196F3;
  color: white;
}

.btn-stop {
  background: #f44336;
  color: white;
}

.btn-stop:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.audio-status {
  padding: 1rem;
  background: #fff3cd;
  border-radius: 6px;
  text-align: center;
}

.warning {
  color: #856404;
  margin: 0;
}

.student-stops {
  border-top: 2px solid #eee;
  padding-top: 1.5rem;
}

.student-stops h3 {
  margin-bottom: 1rem;
  color: #333;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 6px;
}

.student-name {
  font-weight: 500;
  flex: 1;
}

.btn-stop-student {
  background: #dc3545;
  color: white;
}

.stopped-time {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #4CAF50;
  padding: 0.5rem 1rem;
}

@media (max-width: 768px) {
  .time {
    font-size: 2rem;
  }
  
  .timer-controls {
    flex-direction: column;
  }
  
  .student-item {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
}
</style>
