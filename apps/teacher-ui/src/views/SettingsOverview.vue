<template>
  <section class="settings-overview">
    <header class="page-header">
      <div>
        <h1>Einstellungen</h1>
        <p class="subtitle">Zentraler Einstieg für Sicherheit, Backups, Sprache und fachspezifische Konfigurationen.</p>
      </div>
    </header>

    <div class="settings-grid">
      <article
        v-for="card in settingsCards"
        :key="card.title"
        class="settings-card app-card"
        :class="{ 'settings-card--link': card.to }"
      >
        <template v-if="card.to">
          <RouterLink :to="card.to" class="card-link">
            <p class="eyebrow">{{ card.status }}</p>
            <h2>{{ card.title }}</h2>
            <p>{{ card.description }}</p>
          </RouterLink>
        </template>
        <template v-else>
          <p class="eyebrow">{{ card.status }}</p>
          <h2>{{ card.title }}</h2>
          <p>{{ card.description }}</p>
        </template>
      </article>


    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { settingsCards } from '../settings-sections'
</script>

<style scoped>
.settings-overview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header h1,
.settings-card h2 {
  margin: 0;
}

.subtitle,
.settings-card p {
  color: #64748b;
}

.settings-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
}

.settings-card {
  padding: 1.25rem;
}

.settings-card--link {
  padding: 0;
}

.card-link {
  display: block;
  padding: 1.25rem;
  text-decoration: none;
  color: inherit;
  border-radius: inherit;
}

.card-link:hover {
  background: var(--surface-soft);
}

.card-link:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: var(--accent-strong);
  font-weight: 700;
}
</style>
