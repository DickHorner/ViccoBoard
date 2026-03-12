<template>
  <section class="sport-settings">
    <header class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <div>
        <h1>Sport-Konfiguration</h1>
        <p class="subtitle">Shuttle-Run-Setup, Status-Katalog, Tabellen und fachspezifische Einstellungen.</p>
      </div>
    </header>

    <div class="settings-sections">
      <!-- Shuttle-Run config -->
      <section class="config-card">
        <p class="eyebrow">Test-Konfiguration</p>
        <h2>Shuttle-Run-Konfiguration</h2>
        <p>Konfigurationstabellen importieren oder bestehende verwalten.</p>
        <RouterLink to="/grading" class="config-link">Zur Bewertungsübersicht →</RouterLink>
      </section>

      <!-- Status catalog -->
      <section class="config-card">
        <p class="eyebrow">Anwesenheit</p>
        <h2>Status-Katalog</h2>
        <p>Anwesenheitsstatus anpassen: Kürzel, Bezeichnung, Farbe und Reihenfolge.</p>
        <RouterLink to="/attendance" class="config-link">Zu Anwesenheitserfassung →</RouterLink>
      </section>

      <!-- Table management -->
      <section class="config-card">
        <p class="eyebrow">Bewertungstabellen</p>
        <h2>Tabellen & Normen</h2>
        <p>Leistungstabellen für Cooper-Test, Shuttle-Run und weitere Disziplinen verwalten.</p>
        <RouterLink to="/grading" class="config-link">Zur Bewertungsübersicht →</RouterLink>
      </section>

      <!-- Grade categories -->
      <section class="config-card">
        <p class="eyebrow">Bewertung</p>
        <h2>Bewertungskategorien</h2>
        <p>Kriterienkataloge, Zeitgrenzen und Gewichtungen für alle Bewertungsformen einsehen.</p>
        <RouterLink to="/grading" class="config-link">Zu Bewertung & Tests →</RouterLink>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.sport-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.page-header h1 {
  margin: 0;
}

.subtitle {
  color: #64748b;
  margin: 0.25rem 0 0;
}

.back-button {
  background: none;
  border: none;
  color: #0f766e;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  min-height: 44px;
  white-space: nowrap;
}

.settings-sections {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.config-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-card h2 {
  margin: 0;
  font-size: 1.05rem;
}

.config-card p {
  color: #64748b;
  margin: 0;
  font-size: 0.875rem;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #0f766e;
  font-weight: 700;
}

.config-link {
  margin-top: auto;
  color: #0f766e;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  padding-top: 0.5rem;
}

.config-link:hover {
  text-decoration: underline;
}
</style>
