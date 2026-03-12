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
      <!-- Shuttle-Run config import -->
      <section class="config-card">
        <p class="eyebrow">Test-Konfiguration</p>
        <h2>Shuttle-Run-Konfiguration</h2>
        <p>{{ t('SHUTTLE.import-config-hint') }}</p>
        <div class="import-row">
          <label class="file-label">
            <span class="config-link">{{ t('SHUTTLE.import-config') }} →</span>
            <input
              type="file"
              accept=".json"
              class="file-input-hidden"
              @change="importShuttleConfig"
            />
          </label>
        </div>
        <p v-if="importMessage" :class="importError ? 'msg-error' : 'msg-success'">
          {{ importMessage }}
        </p>
        <p v-if="importedConfigs.length > 0" class="existing-configs">
          {{ t('SHUTTLE.configs-count', { count: importedConfigs.length }) }}
        </p>
        <RouterLink to="/grading" class="config-link-secondary">Zur Bewertungsübersicht →</RouterLink>
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
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import type { Sport } from '@viccoboard/core'

const { t } = useI18n()

initializeSportBridge()
const SportBridge = getSportBridge()

const importMessage = ref('')
const importError = ref(false)
const importedConfigs = ref<Sport.ShuttleRunConfig[]>([])

onMounted(async () => {
  try {
    importedConfigs.value = await SportBridge.shuttleRunConfigRepository.findAll()
  } catch {
    // Non-blocking
  }
})

async function importShuttleConfig(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  importMessage.value = ''
  importError.value = false

  try {
    const text = await file.text()
    const parsed: unknown = JSON.parse(text)

    // Accept either a single config object or an array
    const configs: unknown[] = Array.isArray(parsed) ? parsed : [parsed]

    let saved = 0
    for (const raw of configs) {
      const cfg = raw as Record<string, unknown>
      if (!cfg.name || !Array.isArray(cfg.levels)) {
        throw new Error('Invalid config format: missing "name" or "levels"')
      }
      await SportBridge.shuttleRunConfigRepository.create({
        name: String(cfg.name),
        levels: cfg.levels as Sport.ShuttleRunConfig['levels'],
        audioSignalsEnabled: cfg.audioSignalsEnabled === true,
        source: 'imported'
      })
      saved++
    }

    importedConfigs.value = await SportBridge.shuttleRunConfigRepository.findAll()
    importMessage.value = t('SHUTTLE.config-imported') + ` (${saved})`
  } catch (err: unknown) {
    importError.value = true
    importMessage.value = t('SHUTTLE.config-import-error') +
      (err instanceof Error ? ': ' + err.message : '')
  } finally {
    // Reset the input so the same file can be re-selected
    input.value = ''
  }
}
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

.config-link-secondary {
  color: #64748b;
  font-size: 0.8rem;
  text-decoration: none;
  margin-top: 0.25rem;
}

.config-link-secondary:hover {
  text-decoration: underline;
}

.import-row {
  display: flex;
  align-items: center;
}

.file-label {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.file-input-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.msg-success {
  color: #0f766e;
  font-size: 0.85rem;
  margin: 0;
}

.msg-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0;
}

.existing-configs {
  color: #64748b;
  font-size: 0.8rem;
  margin: 0;
}
</style>
