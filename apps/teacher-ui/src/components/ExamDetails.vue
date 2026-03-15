<template>
  <section class="panel exam-details">
    <h2>Prüfungsdetails</h2>

    <div class="field">
      <label for="title">Titel <span class="required">*</span></label>
      <input
        id="title"
        v-model="store.title"
        type="text"
        placeholder="Prüfungstitel"
        required
      />
    </div>

    <div class="field">
      <label for="description">Beschreibung</label>
      <textarea
        id="description"
        v-model="store.description"
        rows="4"
        placeholder="Optionale Beschreibung für Schüler"
      />
    </div>

    <div class="field">
      <label for="classGroupId">Klassen-ID</label>
      <input
        id="classGroupId"
        v-model="store.classGroupId"
        type="text"
        placeholder="Optional"
      />
    </div>

    <div class="field">
      <label>Prüfungsmodus</label>
      <div class="mode-pills">
        <button
          type="button"
          class="pill"
          :class="{ active: store.mode === 'simple' }"
          @click="store.setMode('simple')"
        >
          Einfach
        </button>
        <button
          type="button"
          class="pill"
          :class="{ active: store.mode === 'complex' }"
          @click="store.setMode('complex')"
        >
          Komplex
        </button>
      </div>
      <p class="help-text">
        <template v-if="store.mode === 'simple'">
          Einfacher Modus: flache Aufgabenliste mit Kriterien
        </template>
        <template v-else>
          Komplexer Modus: verschachtelte Aufgaben (3 Ebenen), Prüfungsteile und Wahlaufgaben
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
