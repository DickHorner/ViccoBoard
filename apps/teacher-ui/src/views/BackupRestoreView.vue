<template>
  <section class="backup-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Live-Daten</p>
        <h1>Backups & Wiederherstellung</h1>
        <p class="subtitle">
          Erstelle vor Live-Importen und Gerätewechseln eine vollständige lokale Sicherung.
        </p>
      </div>
    </header>

    <section class="warning-card" role="alert">
      <h2>Wichtig</h2>
      <p>
        ViccoBoard speichert lokal im Browser. App-Dateien und lokale Daten sind getrennt.
        Für Gerätewechsel brauchst Du eine Backup-Datei.
      </p>
    </section>

    <div class="backup-grid">
      <article class="backup-card">
        <h2>Backup exportieren</h2>
        <p>Exportiert alle lokalen ViccoBoard-Daten aus IndexedDB als JSON-Datei.</p>
        <button type="button" :disabled="busy" @click="exportBackup">
          Backup-Datei herunterladen
        </button>
      </article>

      <article class="backup-card">
        <h2>Backup wiederherstellen</h2>
        <p>
          Importiert eine ViccoBoard-Backup-Datei differenziell. Neue Datensätze werden ergänzt,
          nicht geänderte Datensätze bleiben unberührt.
        </p>
        <input
          type="file"
          accept="application/json,.json"
          :disabled="busy"
          @change="handleRestoreFile"
        />
      </article>
    </div>

    <p v-if="statusMessage" class="status-message" role="status">
      {{ statusMessage }}
    </p>
    <p v-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  buildBackupFileName,
  createLiveDataBackup,
  parseLiveDataBackup,
  restoreLiveDataBackup
} from '../services/live-data-backup.service'

const busy = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')

async function exportBackup(): Promise<void> {
  try {
    busy.value = true
    statusMessage.value = ''
    errorMessage.value = ''

    const backup = await createLiveDataBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = buildBackupFileName()
    link.click()
    URL.revokeObjectURL(url)

    statusMessage.value = 'Backup-Datei wurde erstellt.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Backup konnte nicht erstellt werden.'
  } finally {
    busy.value = false
  }
}

async function handleRestoreFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  const confirmed = window.confirm('Backup-Datei importieren?')
  if (!confirmed) {
    input.value = ''
    return
  }

  try {
    busy.value = true
    statusMessage.value = ''
    errorMessage.value = ''

    const backup = parseLiveDataBackup(await file.text())
    const result = await restoreLiveDataBackup(backup)
    statusMessage.value = [
      `${result.insertedRecords} neu`,
      `${result.mergedRecords} ergänzt`,
      `${result.unchangedRecords} unverändert`,
      `${result.conflictRecords} Konflikte`,
      `${result.importedStores} Bereiche geprüft`
    ].join(' · ')

    if (result.skippedStores.length > 0) {
      statusMessage.value += ` · Übersprungen: ${result.skippedStores.join(', ')}`
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Backup konnte nicht importiert werden.'
  } finally {
    busy.value = false
    input.value = ''
  }
}
</script>

<style scoped>
.backup-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header h1,
.backup-card h2,
.warning-card h2 {
  margin: 0;
}

.subtitle,
.backup-card p,
.warning-card p {
  color: #64748b;
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #0f766e;
  font-weight: 700;
}

.warning-card,
.backup-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem;
}

.warning-card {
  border-color: #f59e0b;
  background: #fffbeb;
}

.backup-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.backup-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

button {
  align-self: flex-start;
  border: 0;
  border-radius: 999px;
  background: #0f766e;
  color: white;
  padding: 0.75rem 1rem;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.status-message,
.error-message {
  border-radius: 12px;
  padding: 0.75rem 1rem;
}

.status-message {
  background: #ecfdf5;
  color: #047857;
}

.error-message {
  background: #fef2f2;
  color: #b91c1c;
}
</style>
