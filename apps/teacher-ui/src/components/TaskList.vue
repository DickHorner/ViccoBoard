<template>
  <section class="panel task-list">
    <div class="panel-header">
      <h2>Tasks</h2>
      <button class="ghost" type="button" @click="store.addTask()">
        Add task
      </button>
    </div>

    <div v-if="store.tasks.length === 0" class="empty">
      Add at least one task to get started
    </div>

    <TaskEditor
      v-for="(task, index) in store.tasks"
      :key="task.id"
      :task="task"
      :index="index"
      :level="1"
      :mode="store.mode"
      @remove="store.removeTask(task.id)"
      @moveUp="store.moveTask(store.tasks, index, -1)"
      @moveDown="store.moveTask(store.tasks, index, 1)"
    />
  </section>
</template>

<script setup lang="ts">
import { useExamBuilderStore } from '../stores/examBuilderStore'
import TaskEditor from './TaskEditor.vue'

const store = useExamBuilderStore()
</script>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.panel-header h2 {
  margin: 0;
}

.ghost {
  padding: 0.5rem 1rem;
  border: 1px dashed var(--color-border, #ddd);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.ghost:hover {
  background: var(--color-hover, #f5f5f5);
  border-color: var(--color-primary, #3498db);
}

.empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted, #777);
  border: 2px dashed var(--color-border, #ddd);
  border-radius: 8px;
}
</style>
