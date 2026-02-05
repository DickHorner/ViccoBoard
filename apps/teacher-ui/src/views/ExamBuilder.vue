<template>
  <section class="exam-builder">
    <div class="builder-header">
      <div class="title-area">
        <h1>{{ store.isEditing ? 'Edit exam' : 'New exam' }}</h1>
        <p class="subtitle">
          {{ store.mode === 'simple' ? 'Simple exam: flat task list' : 'Complex exam: nested tasks, parts' }}
        </p>
      </div>
      <div class="header-actions">
        <button type="button" @click="goBack">Back</button>
        <button type="button" :disabled="!store.canSave" @click="handleSave">Save</button>
      </div>
    </div>

    <div class="builder-layout">
      <form class="builder-main">
        <ExamDetails />
        <TaskList />
        <ExamParts />
      </form>

      <ExamPreview />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamBuilderStore } from '../stores/examBuilderStore'
import ExamDetails from '../components/ExamDetails.vue'
import TaskList from '../components/TaskList.vue'
import ExamParts from '../components/ExamParts.vue'
import ExamPreview from '../components/ExamPreview.vue'

const route = useRoute()
const router = useRouter()
const store = useExamBuilderStore()

const examId = computed(() => route.params.id as string | undefined)

const goBack = (): void => {
  router.push('/exams')
}

const handleSave = async (): Promise<void> => {
  await store.saveExam()
}

onMounted(() => {
  const id = examId.value
  if (id) {
    store.loadExam(id)
  } else if (store.tasks.length === 0) {
    store.addTask()
  }
})
</script>

<style scoped>
.exam-builder {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.title-area h1 {
  margin: 0 0 0.5rem 0;
}

.subtitle {
  margin: 0;
  color: var(--color-text-muted, #777);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.5rem 1.5rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  background: var(--color-primary, #3498db);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: var(--color-primary-dark, #2980b9);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button[type="button"]:first-child {
  background: transparent;
  color: var(--color-text, #333);
}

.builder-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

@media (max-width: 1200px) {
  .builder-layout {
    grid-template-columns: 1fr;
  }
}

.builder-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.panel {
  padding: 1.5rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 8px;
  background: var(--color-background, #fff);
}
</style>

