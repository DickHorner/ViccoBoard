<template>
  <section class="settings-overview">
    <header class="page-header">
      <div>
        <h1>Einstellungen</h1>
        <p class="subtitle">Zentraler Einstieg fuer Sicherheit, Backups, Sprache und fachspezifische Konfigurationen.</p>
      </div>
    </header>

    <div class="settings-grid">
      <article
        v-for="card in settingsCards"
        :key="card.title"
        class="settings-card"
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

      <RouterLink
        :to="{ name: 'catalog-management' }"
        class="settings-card settings-card-link"
      >
        <p class="eyebrow">verfügbar</p>
        <h2>Katalogverwaltung</h2>
        <p>Status- und Kriterienkataloge für Anwesenheit, Mitarbeit und Verhalten konfigurieren, sortieren und aktivieren/deaktivieren.</p>
      </RouterLink>
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
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.settings-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
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
  border-radius: 18px;
  transition: background 0.15s;
}

.card-link:hover {
  background: #f0fdfa;
}

.settings-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  border-color: #0f766e;
  transition: box-shadow 0.15s;
}

.settings-card-link:hover {
  box-shadow: 0 4px 16px rgba(15, 118, 110, 0.12);
}

.settings-card-link h2 {
  color: #0f766e;
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #0f766e;
  font-weight: 700;
}
</style>
