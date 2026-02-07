<template>
  <div class="tournaments-view">
    <div class="page-header">
      <h2>{{ t('TOURNAMENTS.title') }}</h2>
      <p>{{ t('TOURNAMENTS.mode_info.title') }}</p>
    </div>

    <div class="content">
      <section class="card">
        <h3>{{ t('TOURNAMENT.overview') }}</h3>
        <p>Turniere-Verwaltung befindet sich in Entwicklung.</p>
        <ul>
          <li>Jeder gegen Jeden (Round Robin)</li>
          <li>K.-o.-System</li>
          <li>Gruppen + Playoffs</li>
          <li>Felder → Finale</li>
          <li>Zufällige Teams</li>
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
.tournaments-view {
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
