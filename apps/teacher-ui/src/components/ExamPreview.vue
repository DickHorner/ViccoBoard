<template>
  <aside class="panel exam-preview">
    <div class="preview-header">
      <h2>Preview</h2>
      <span class="pill">{{ store.totalPoints }} points</span>
    </div>

    <div class="preview-meta">
      <p><strong>{{ store.title || 'Untitled exam' }}</strong></p>
      <p v-if="store.description">{{ store.description }}</p>
      <p v-else class="muted">
        Add a description if you want students to see context.
      </p>
    </div>

    <ol v-if="store.tasks.length > 0" class="preview-tasks">
      <li v-for="task in store.tasks" :key="task.id">
        <div class="task-line">
          <span>{{ task.title || 'Untitled task' }}</span>
          <span class="pill">{{ task.points }} pts</span>
        </div>
        <ul v-if="task.subtasks.length" class="criteria-list">
          <li v-for="subtask in task.subtasks" :key="subtask.id">
            {{ subtask.title || 'Subtask' }} ({{ subtask.points }} pts)
            <ul v-if="subtask.subtasks.length" class="criteria-list">
              <li v-for="leaf in subtask.subtasks" :key="leaf.id">
                {{ leaf.title || 'Subtask' }} ({{ leaf.points }} pts)
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ol>
    <p v-else class="empty">No tasks added yet</p>

    <div v-if="store.mode === 'complex' && store.parts.length > 0" class="preview-meta">
      <h3>Exam parts</h3>
      <ul>
        <li v-for="part in store.parts" :key="part.id">
          {{ part.name || 'Unnamed part' }} — {{ part.taskIds.length }} tasks
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useExamBuilderStore } from '../stores/examBuilderStore'

const store = useExamBuilderStore()
</script>

<style scoped>
.exam-preview {
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.preview-header h2 {
  margin: 0;
}

.pill {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: var(--color-primary-light, #e3f2fd);
  color: var(--color-primary, #3498db);
  font-size: 0.85rem;
  font-weight: 600;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-meta p {
  margin: 0;
}

.preview-meta strong {
  font-size: 1.1rem;
}

.muted {
  color: var(--color-text-muted, #777);
  font-size: 0.9rem;
  font-style: italic;
}

.preview-tasks {
  margin: 0;
  padding-left: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.criteria-list {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary, #555);
}

.empty {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-text-muted, #777);
  font-style: italic;
}

h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
}

ul {
  margin: 0;
  padding-left: 1.5rem;
}

li {
  margin: 0.25rem 0;
}
</style>
