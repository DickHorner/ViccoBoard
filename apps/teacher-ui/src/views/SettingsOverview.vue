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
            <span class="settings-status">{{ card.status }}</span>
            <strong>{{ card.title }}</strong>
            <span class="settings-description">{{ card.description }}</span>
            <i class="pi pi-angle-right" aria-hidden="true"></i>
          </RouterLink>
        </template>
        <template v-else>
          <span class="settings-status">{{ card.status }}</span>
          <strong>{{ card.title }}</strong>
          <span class="settings-description">{{ card.description }}</span>
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
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-size: 13.5px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
  gap: 0 24px;
  padding: 4px 16px;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  background: var(--surface-glass);
}

.settings-card,
.card-link {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 3px 12px;
  align-content: center;
  padding: 12px 0;
  border: 0;
  border-bottom: 1px solid var(--surface-border);
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

.settings-card--link,
.settings-card--link .card-link {
  padding: 0;
}

.settings-card--link .card-link {
  padding: 12px 0;
  text-decoration: none;
  color: inherit;
}

.settings-card--link .card-link:hover {
  color: var(--accent-strong);
}

.card-link:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: -2px;
}

.settings-status {
  grid-column: 1 / -1;
  color: var(--color-muted);
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.settings-card strong {
  font-size: 13.5px;
}

.settings-description {
  grid-column: 1;
  color: var(--color-muted);
  font-size: 12px;
}

.card-link .pi {
  grid-column: 2;
  grid-row: 2 / span 2;
  align-self: center;
  color: var(--color-muted);
  font-size: 12px;
}
</style>
