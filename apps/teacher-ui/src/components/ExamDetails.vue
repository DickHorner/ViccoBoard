<template>
  <section class="panel exam-details">
    <h2>Exam details</h2>

    <div class="field">
      <label for="title">Title <span class="required">*</span></label>
      <input
        id="title"
        v-model="store.title"
        type="text"
        placeholder="Exam title"
        required
      />
    </div>

    <div class="field">
      <label for="description">Description</label>
      <textarea
        id="description"
        v-model="store.description"
        rows="4"
        placeholder="Optional description for students"
      />
    </div>

    <div class="field">
      <label for="classGroupId">Class group ID</label>
      <input
        id="classGroupId"
        v-model="store.classGroupId"
        type="text"
        placeholder="Optional"
      />
    </div>

    <div class="field">
      <label>Exam mode</label>
      <div class="mode-pills">
        <button
          type="button"
          class="pill"
          :class="{ active: store.mode === 'simple' }"
          @click="store.setMode('simple')"
        >
          Simple
        </button>
        <button
          type="button"
          class="pill"
          :class="{ active: store.mode === 'complex' }"
          @click="store.setMode('complex')"
        >
          Complex
        </button>
      </div>
      <p class="help-text">
        <template v-if="store.mode === 'simple'">
          Simple mode: flat list of tasks with criteria
        </template>
        <template v-else>
          Complex mode: nested tasks (3 levels), exam parts, choice tasks
        </template>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useExamBuilderStore } from '../stores/examBuilderStore'

const store = useExamBuilderStore()
</script>

<style scoped>
.exam-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  font-size: 0.9rem;
}

.required {
  color: var(--color-danger, #e74c3c);
}

input[type="text"],
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
}

textarea {
  resize: vertical;
}

.mode-pills {
  display: flex;
  gap: 0.5rem;
}

.pill {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 20px;
  background: var(--color-background, #fff);
  cursor: pointer;
  transition: all 0.2s;
}

.pill:hover {
  background: var(--color-hover, #f5f5f5);
}

.pill.active {
  background: var(--color-primary, #3498db);
  color: #fff;
  border-color: var(--color-primary, #3498db);
}

.help-text {
  font-size: 0.85rem;
  color: var(--color-text-muted, #777);
  margin: 0;
}
</style>
