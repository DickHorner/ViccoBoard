<template>
  <div class="tactics-view">
    <div class="page-header">
      <h2>{{ t('TACTICS.title') }}</h2>
    </div>

    <div class="content">
      <section class="card">
        <h3>Taktikboard</h3>
        <p>Interaktives Taktikboard für verschiedene Sportarten befindet sich in Entwicklung.</p>
        <ul>
          <li>Zeichnen von Spielzügen</li>
          <li>Spieler-Positionen</li>
          <li>Pfeile und Linien</li>
          <li>Verschiedene Spielfelder</li>
          <li>Snapshots speichern</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.tactics-view {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header h2 {
  margin: 0.5rem 0;
  font-size: 1.75rem;
  color: #333;
}

.content {
  margin-top: 2rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #333;
}
</style>
