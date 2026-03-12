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
        <h2>{{ t('SETTINGS.shuttle-konfiguration') }}</h2>
        <p>{{ t('SETTINGS.shuttle-import') }}</p>

        <div class="import-form">
          <div class="form-group">
            <label for="config-name">Name</label>
            <input
              id="config-name"
              v-model="importName"
              type="text"
              class="form-input"
              placeholder="z.B. Standard 20m"
            />
          </div>

          <div class="form-group">
            <label>Format</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="importFormat" value="csv" /> CSV
              </label>
              <label class="radio-label">
                <input type="radio" v-model="importFormat" value="json" /> JSON
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="config-file">Datei auswählen (.{{ importFormat }})</label>
            <input
              id="config-file"
              ref="fileInput"
              type="file"
              :accept="importFormat === 'csv' ? '.csv,text/csv' : '.json,application/json'"
              class="file-input"
              @change="handleFileSelected"
            />
          </div>

          <div v-if="importFileName" class="file-preview">
            Ausgewählt: <strong>{{ importFileName }}</strong>
          </div>

          <div class="import-actions">
            <label class="audio-toggle">
              <input type="checkbox" v-model="importAudio" />
              Audio-Signale aktivieren
            </label>
            <button
              class="btn-primary"
              :disabled="!importFileContent || importing"
              @click="runImport"
            >
              {{ importing ? 'Importiere…' : 'Konfiguration importieren' }}
            </button>
          </div>

          <div v-if="importError" class="error-message">{{ importError }}</div>
          <div v-if="importSuccess" class="success-message">{{ importSuccess }}</div>
        </div>

        <!-- Existing imported configs -->
        <div v-if="importedConfigs.length > 0" class="imported-list">
          <p class="list-label">Importierte Konfigurationen ({{ importedConfigs.length }})</p>
          <ul class="config-list">
            <li v-for="cfg in importedConfigs" :key="cfg.id" class="config-item">
              <span class="config-name">{{ cfg.name }}</span>
              <span class="config-meta">{{ cfg.levels.length }} Einträge · {{ formatDate(cfg.createdAt) }}</span>
            </li>
          </ul>
        </div>

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
        <h2>Tabellen &amp; Normen</h2>
        <p>Leistungstabellen für Cooper-Test, Shuttle-Run und weitere Disziplinen verwalten.</p>
        <RouterLink to="/grading" class="config-link">Zur Bewertungsübersicht →</RouterLink>
      </section>

      <!-- Grade categories -->
      <section class="config-card">
        <p class="eyebrow">Bewertung</p>
        <h2>Bewertungskategorien</h2>
        <p>Kriterienkataloge, Zeitgrenzen und Gewichtungen für alle Bewertungsformen einsehen.</p>
        <RouterLink to="/grading" class="config-link">Zu Bewertung &amp; Tests →</RouterLink>
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

const { t, locale } = useI18n()

initializeSportBridge()
const bridge = getSportBridge()

const importName = ref('')
const importFormat = ref<'csv' | 'json'>('csv')
const importAudio = ref(true)
const importFileContent = ref<string | null>(null)
const importFileName = ref('')
const importing = ref(false)
const importError = ref('')
const importSuccess = ref('')
const importedConfigs = ref<Sport.ShuttleRunConfig[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  importFileName.value = file.name
  importError.value = ''
  importSuccess.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    importFileContent.value = (e.target?.result as string) ?? null
  }
  reader.onerror = () => {
    importError.value = 'Datei konnte nicht gelesen werden.'
    importFileContent.value = null
  }
  reader.readAsText(file, 'utf-8')
}

async function runImport() {
  if (!importFileContent.value) return

  importing.value = true
  importError.value = ''
  importSuccess.value = ''

  try {
    const result = await bridge.importShuttleRunConfigUseCase.execute({
      rawContent: importFileContent.value,
      format: importFormat.value,
      name: importName.value || importFileName.value.replace(/\.[^.]+$/, ''),
      audioSignalsEnabled: importAudio.value
    })

    importSuccess.value = `✓ Konfiguration „${result.config.name}" importiert (${result.levelsImported} Einträge).`
    importFileContent.value = null
    importFileName.value = ''
    importName.value = ''
    if (fileInput.value) fileInput.value.value = ''

    await loadImportedConfigs()
  } catch (err: any) {
    importError.value = (err as Error)?.message ?? 'Import fehlgeschlagen.'
  } finally {
    importing.value = false
  }
}

async function loadImportedConfigs() {
  try {
    importedConfigs.value = await bridge.shuttleRunConfigRepository.findBySource('imported')
  } catch {
    // silently ignore on load failure
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(locale.value, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(loadImportedConfigs)
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
  gap: 0.75rem;
}

.config-card h2 {
  margin: 0;
  font-size: 1.05rem;
}

.config-card > p {
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

.import-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.form-input {
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 0.875rem;
}

.file-input {
  font-size: 0.875rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.file-preview {
  font-size: 0.8rem;
  color: #475569;
}

.import-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.audio-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-primary {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  background: #0f766e;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 40px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: #ffebee;
  color: #c62828;
  font-size: 0.8rem;
}

.success-message {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 0.8rem;
}

.imported-list {
  border-top: 1px solid #e2e8f0;
  padding-top: 0.75rem;
}

.list-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem;
}

.config-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.875rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
}

.config-name {
  font-weight: 600;
  color: #0f172a;
}

.config-meta {
  color: #64748b;
  font-size: 0.75rem;
}

.config-link {
  margin-top: auto;
  color: #0f766e;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  padding-top: 0.25rem;
}

.config-link:hover {
  text-decoration: underline;
}
</style>
