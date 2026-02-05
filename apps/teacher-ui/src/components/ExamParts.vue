<template>
  <section v-if="store.mode === 'complex'" class="panel exam-parts">
    <div class="panel-header">
      <h2>Exam parts</h2>
      <button class="ghost" type="button" @click="store.addPart()">
        Add part
      </button>
    </div>

    <div v-if="store.parts.length === 0" class="empty">
      No parts yet. Add parts to group tasks into sections.
    </div>

    <div
      v-for="(part, index) in store.parts"
      :key="part.id"
      class="part-card"
    >
      <div class="part-header">
        <h3>Part {{ index + 1 }}</h3>
        <button class="ghost" type="button" @click="store.removePart(part.id)">
          Remove
        </button>
      </div>

      <div class="field">
        <label :for="`part-name-${part.id}`">Name</label>
        <input
          :id="`part-name-${part.id}`"
          v-model="part.name"
          type="text"
          placeholder="Part name"
        />
      </div>

      <div class="field">
        <label :for="`part-description-${part.id}`">Description</label>
        <textarea
          :id="`part-description-${part.id}`"
          v-model="part.description"
          rows="2"
          placeholder="Optional"
        />
      </div>

      <div class="field-grid">
        <label class="choice-toggle">
          <input v-model="part.calculateSubScore" type="checkbox" />
          Calculate sub score
        </label>
        <label class="choice-toggle">
          <input v-model="part.printable" type="checkbox" />
          Printable
        </label>
      </div>

      <div class="field-grid">
        <label class="choice-toggle">
          <input v-model="part.scoreType" type="radio" value="points" />
          Points
        </label>
        <label class="choice-toggle">
          <input v-model="part.scoreType" type="radio" value="grade" />
          Grade
        </label>
      </div>

      <div class="field">
        <label>Included tasks</label>
        <div class="chip-grid">
          <label
            v-for="task in store.flatTasks"
            :key="task.id"
            class="chip"
          >
            <input
              type="checkbox"
              :value="task.id"
              v-model="part.taskIds"
            />
            {{ task.title || task.id.slice(0, 4) }}
          </label>
        </div>
        <p v-if="part.taskIds.length === 0" class="help-text">
          Select at least one task for this part
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useExamBuilderStore } from '../stores/examBuilderStore'

const store = useExamBuilderStore()
</script>

<style scoped>
.exam-parts {
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

.part-card {
  padding: 1.5rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 8px;
  background: var(--color-background, #fff);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.part-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.part-header h3 {
  margin: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

label {
  font-weight: 500;
  font-size: 0.9rem;
}

.choice-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
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

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 20px;
  background: var(--color-background, #fff);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: normal;
}

.chip:hover {
  background: var(--color-hover, #f5f5f5);
}

.chip:has(input:checked) {
  background: var(--color-primary-light, #e3f2fd);
  border-color: var(--color-primary, #3498db);
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

.help-text {
  font-size: 0.85rem;
  color: var(--color-text-muted, #777);
  margin: 0;
}
</style>
