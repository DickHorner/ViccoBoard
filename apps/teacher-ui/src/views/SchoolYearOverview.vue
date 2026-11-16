<template>
  <section class="school-year-page">
    <header>
      <h1>Schuljahre verwalten</h1>
      <p>Klassen kontrolliert übernehmen oder archivieren. Prüfungen und Korrekturen bleiben beim alten Schuljahr.</p>
    </header>

    <p v-if="loading" class="notice">Schuljahre werden geladen …</p>
    <p v-else-if="error" class="notice error" role="alert">{{ error }}</p>

    <template v-else>
      <section class="card">
        <h2>Aktives Schuljahr: {{ activeYear }}</h2>
        <p>
          Nächstes Schuljahr: <strong>{{ targetYear }}</strong>.
          Für ältere Jahre bleiben archivierte Klassen und Prüfungen erhalten.
        </p>
        <p v-if="otherYears.length">
          Weitere Schuljahre im Datenbestand: {{ otherYears.join(' · ') }}
        </p>
        <RouterLink to="/exams">Prüfungen und Prüfungsarchiv öffnen</RouterLink>
      </section>

      <section v-if="sourceClasses.length === 0" class="card">
        <h2>Keine aktiven Klassen</h2>
        <p>Für {{ activeYear }} sind keine aktiven Klassen vorhanden. Lege zuerst Klassen an.</p>
        <RouterLink to="/classes">Zur Klassenverwaltung</RouterLink>
      </section>

      <template v-else>
        <section class="card">
          <h2>Klassen für {{ targetYear }} vorbereiten</h2>
          <p>
            Entscheide für jede Klasse, ob sie im alten Jahr archiviert oder mit neuer
            Klassenstufe und einer Kopie der Schülerliste fortgeführt wird.
          </p>

          <div v-for="group in sourceClasses" :key="group.id" class="class-row">
            <div class="class-name">
              <strong>{{ group.name }}</strong>
              <span>Klassenstufe {{ group.gradeLevel ?? 'nicht hinterlegt' }} · {{ studentCounts[group.id] ?? 0 }} Schüler</span>
            </div>
            <label>
              Entscheidung
              <select v-model="choices[group.id].action" @change="resetPreview">
                <option value="undecided">Bitte wählen</option>
                <option value="archive">Archivieren</option>
                <option value="promote">Aufsteigen lassen</option>
              </select>
            </label>
            <div v-if="choices[group.id].action === 'promote'" class="promotion-fields">
              <label>
                Neuer Klassenname
                <input v-model.trim="choices[group.id].targetName" type="text" required @input="resetPreview" />
              </label>
              <label>
                Neue Klassenstufe
                <input
                  v-model.number="choices[group.id].targetGradeLevel"
                  type="number"
                  min="1"
                  max="13"
                  required
                  @input="resetPreview"
                />
              </label>
            </div>
          </div>

          <div class="actions">
            <button type="button" :disabled="busy" @click="reviewSwitch">Vorschau prüfen</button>
          </div>
        </section>

        <section v-if="preview" class="card review">
          <h2>Vorschau – noch nichts geändert</h2>
          <dl class="numbers">
            <div><dt>Archivierte Klassen</dt><dd>{{ preview.archivedClasses + preview.promotedClasses }}</dd></div>
            <div><dt>Neue Klassen</dt><dd>{{ preview.promotedClasses }}</dd></div>
            <div><dt>Übernommene Schülerprofile</dt><dd>{{ preview.copiedStudents }}</dd></div>
            <div><dt>Historische KBR-Prüfungen</dt><dd>{{ preview.historicalExams }}</dd></div>
          </dl>
          <p>
            Schülerprofile werden für das neue Jahr kopiert. Alte Schüler-IDs, Noten, Stunden,
            Abwesenheiten und Prüfungskorrekturen bleiben unverändert im alten Jahr.
            Prüfungsvorlagen, gespeicherte Aufgaben, Fördertipps und Bewertungstabellen
            bleiben bestehen.
          </p>
          <p>
            Unzugeordnete Prüfungsentwürfe ohne Datum oder Klasse können keinem Schuljahr
            zugeordnet werden und bleiben deshalb verfügbar.
          </p>
          <label class="check">
            <input v-model="backupConfirmed" type="checkbox" />
            Ich habe vor diesem Wechsel ein aktuelles Backup der lokalen Daten erstellt.
          </label>
          <label>
            Zur Bestätigung <strong>{{ targetYear }}</strong> eingeben:
            <input v-model.trim="confirmation" type="text" :placeholder="targetYear" />
          </label>
          <div class="actions">
            <RouterLink to="/settings/backups">Backup erstellen</RouterLink>
            <button
              type="button"
              :disabled="busy || !backupConfirmed || confirmation !== targetYear"
              @click="performSwitch"
            >
              {{ busy ? 'Schuljahr wird gewechselt …' : 'Schuljahr jetzt wechseln' }}
            </button>
          </div>
        </section>
      </template>

      <p v-if="success" class="notice success" role="status">
        Schuljahreswechsel nach {{ activeYear }} abgeschlossen. Die alten Klassen sind archiviert.
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { ClassGroup } from '@viccoboard/core'
import { getSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge } from '../composables/useStudentsBridge'
import { getExamsBridge } from '../composables/useExamsBridge'
import { getStorageAdapter } from '../services/storage.service'
import {
  SchoolYearTransitionService,
  nextSchoolYear,
  suggestedClassName,
  type SchoolYearSwitchInput,
  type SchoolYearSwitchPreview
} from '../services/school-year.service'

type Choice = {
  action: 'undecided' | 'archive' | 'promote'
  targetName: string
  targetGradeLevel?: number
}

const sport = getSportBridge()
const students = getStudentsBridge()
const exams = getExamsBridge()
const service = new SchoolYearTransitionService(
  sport.classGroupRepository,
  students.studentRepository,
  exams.examRepository,
  getStorageAdapter()
)

const loading = ref(true)
const busy = ref(false)
const error = ref('')
const success = ref(false)
const activeYear = ref('')
const allClasses = ref<ClassGroup[]>([])
const studentCounts = ref<Record<string, number>>({})
const choices = ref<Record<string, Choice>>({})
const preview = ref<SchoolYearSwitchPreview | null>(null)
const confirmation = ref('')
const backupConfirmed = ref(false)

const targetYear = computed(() => activeYear.value ? nextSchoolYear(activeYear.value) : '')
const sourceClasses = computed(() =>
  allClasses.value.filter(group => !group.archived && group.schoolYear === activeYear.value)
)
const otherYears = computed(() =>
  [...new Set(allClasses.value.map(group => group.schoolYear))]
    .filter(year => year !== activeYear.value).sort().reverse()
)

function resetPreview(): void {
  preview.value = null
  confirmation.value = ''
  backupConfirmed.value = false
  error.value = ''
}

async function load(): Promise<void> {
  loading.value = true
  try {
    activeYear.value = await service.currentYear()
    allClasses.value = await sport.classGroupRepository.findAll()
    const counts = await Promise.all(sourceClasses.value.map(async group => [
      group.id,
      await students.studentRepository.countByClassGroup(group.id)
    ] as const))
    studentCounts.value = Object.fromEntries(counts)
    choices.value = Object.fromEntries(sourceClasses.value.map(group => [
      group.id,
      {
        action: 'undecided',
        targetName: suggestedClassName(group),
        targetGradeLevel: group.gradeLevel ? group.gradeLevel + 1 : undefined
      }
    ]))
    resetPreview()
  } catch (loadError) {
    error.value = loadError instanceof Error ? loadError.message : 'Schuljahre konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

function buildInput(): SchoolYearSwitchInput {
  return {
    fromYear: activeYear.value,
    targetYear: targetYear.value,
    decisions: sourceClasses.value.map(group => {
      const choice = choices.value[group.id]
      if (choice.action === 'undecided') {
        throw new Error(`Bitte für Klasse ${group.name} eine Entscheidung treffen.`)
      }
      return choice.action === 'archive'
        ? { classGroupId: group.id, action: 'archive' }
        : {
            classGroupId: group.id,
            action: 'promote',
            targetName: choice.targetName,
            targetGradeLevel: choice.targetGradeLevel
          }
    })
  }
}

async function reviewSwitch(): Promise<void> {
  error.value = ''
  resetPreview()
  try {
    preview.value = await service.preview(buildInput())
  } catch (reviewError) {
    error.value = reviewError instanceof Error ? reviewError.message : 'Vorschau fehlgeschlagen.'
  }
}

async function performSwitch(): Promise<void> {
  if (!preview.value || !backupConfirmed.value || confirmation.value !== targetYear.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await service.execute(buildInput())
    success.value = true
    await load()
  } catch (switchError) {
    error.value = switchError instanceof Error ? switchError.message : 'Schuljahreswechsel fehlgeschlagen.'
  } finally {
    busy.value = false
  }
}

onMounted(() => { void load() })
</script>

<style scoped>
.school-year-page { max-width: 1050px; padding: 1rem; margin: 0 auto; display: grid; gap: 1.25rem; color: #17324b; }
.school-year-page header p { color: #64748b; }
.card { background: white; border: 1px solid #dbe4ed; border-radius: 16px; padding: 1.4rem; }
.card h2 { margin-top: 0; }
.class-row { display: grid; grid-template-columns: minmax(160px, 1fr) 180px; align-items: start; gap: 1rem; padding: 1.2rem 0; border-top: 1px solid #e2e8f0; }
.class-name { display: flex; flex-direction: column; gap: .3rem; }
.class-name span { color: #64748b; font-size: .9rem; }
.promotion-fields { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 1rem; }
.promotion-fields label { flex: 1; min-width: 180px; }
label:not(.check) { display: flex; flex-direction: column; gap: .35rem; font-weight: 600; }
input:not([type="checkbox"]), select { min-height: 44px; border: 1px solid #94a3b8; border-radius: 8px; padding: .5rem; font: inherit; max-width: 100%; }
.actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 1rem; margin-top: 1.25rem; }
button { min-height: 44px; background: #0f766e; color: white; border: 0; border-radius: 9px; padding: .7rem 1rem; cursor: pointer; font-weight: 700; }
button:disabled { opacity: .45; cursor: not-allowed; }
.review { border-color: #0f766e; }
.numbers { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
.numbers div { padding: .85rem; background: #ecfdf5; border-radius: 8px; }
.numbers dt { color: #475569; font-size: .85rem; }
.numbers dd { margin: .4rem 0 0; font-size: 1.6rem; font-weight: 800; }
.check { display: flex; align-items: flex-start; gap: .7rem; margin: 1.5rem 0; }
.check input { margin-top: .25rem; }
.notice { background: #edf5ff; padding: 1rem; border-radius: 8px; }
.notice.error { background: #fff0ef; color: #9f1239; }
.notice.success { background: #e7fbef; color: #166534; }
@media (max-width: 650px) { .class-row { grid-template-columns: 1fr; } .promotion-fields { grid-column: auto; flex-direction: column; } }
</style>
