<template>
  <section class="student-calendar app-page">
    <header class="student-calendar__header">
      <div>
        <p class="student-calendar__eyebrow">Schülerverwaltung</p>
        <h1>Abwesenheiten & Verletzungen</h1>
        <p class="student-calendar__intro">
          Datumsbezogene Einträge unabhängig von einzelnen Unterrichtsstunden verwalten und IServ-Abwesenheiten importieren.
        </p>
      </div>
      <Button label="Zur Schülerliste" icon="pi pi-users" severity="secondary" outlined @click="router.push('/students')" />
    </header>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <section class="app-card student-calendar__section">
      <h2 class="app-section-title">Manueller Eintrag</h2>
      <div class="student-calendar__form-grid">
        <div class="app-field">
          <label for="calendar-student">Schüler *</label>
          <Select
            id="calendar-student"
            v-model="selectedStudentId"
            :options="studentOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Schüler auswählen"
            filter
          />
        </div>
        <div class="app-field">
          <label for="calendar-type">Art *</label>
          <Select id="calendar-type" v-model="manualType" :options="typeOptions" optionLabel="label" optionValue="value" />
        </div>
        <div class="app-field">
          <label for="calendar-start">Von *</label>
          <InputText id="calendar-start" v-model="manualStartDate" type="date" />
        </div>
        <div class="app-field">
          <label for="calendar-end">Bis *</label>
          <InputText id="calendar-end" v-model="manualEndDate" type="date" />
        </div>
        <div class="app-field student-calendar__notes">
          <label for="calendar-notes">Notiz</label>
          <Textarea id="calendar-notes" v-model="manualNotes" rows="3" autoResize />
        </div>
      </div>
      <Button label="Eintrag speichern" icon="pi pi-save" :disabled="!canSaveManual" :loading="saving" @click="saveManualEntry" />
    </section>

    <section class="app-card student-calendar__section">
      <h2 class="app-section-title">IServ-Abwesenheiten importieren</h2>
      <p class="app-section-copy">
        ZIP-Export auswählen. Importiert wird ausschließlich die Detaildatei „Schüler Abwesenheiten“; „Fehlzeiten_Summe“ ist eine abgeleitete Summe und wird nicht doppelt gespeichert.
      </p>
      <input type="file" accept=".zip,application/zip" :disabled="importBusy" @change="handleZipSelection">

      <div v-if="importPreview" class="student-calendar__preview">
        <p>
          {{ importPreview.summary.detailFiles }} Detaildateien, {{ importPreview.summary.rows }} Zeilen:
          {{ importPreview.summary.ready }} neu, {{ importPreview.summary.skipped }} bereits vorhanden,
          {{ importPreview.summary.conflicts }} Konflikte, {{ importPreview.summary.errors }} Fehler.
        </p>
        <ul v-if="importPreview.issues.length" class="student-calendar__issues">
          <li v-for="issue in importPreview.issues.slice(0, 20)" :key="`${issue.filePath}-${issue.rowNumber}-${issue.message}`">
            {{ issue.filePath || 'Archiv' }}<template v-if="issue.rowNumber"> · Zeile {{ issue.rowNumber }}</template>: {{ issue.message }}
          </li>
        </ul>
        <p v-if="importPreview.issues.length > 20" class="app-data-note">Weitere {{ importPreview.issues.length - 20 }} Hinweise ausgeblendet.</p>
        <Button
          label="IServ-Import ausführen"
          icon="pi pi-upload"
          :disabled="importPreview.summary.ready === 0 || importBusy"
          :loading="importBusy"
          @click="executeIservImport"
        />
      </div>
    </section>

    <section class="app-card student-calendar__section">
      <div class="student-calendar__history-header">
        <div>
          <h2 class="app-section-title">Kalenderverlauf</h2>
          <p class="app-section-copy">{{ selectedStudentLabel || 'Schüler auswählen' }}</p>
        </div>
      </div>

      <p v-if="selectedStudentId && entries.length === 0" class="app-data-note">Noch keine Kalendereinträge vorhanden.</p>
      <div v-else class="student-calendar__entries">
        <article v-for="entry in entries" :key="entry.id" class="student-calendar__entry">
          <div>
            <strong>{{ entry.type === 'injury' ? 'Verletzung' : 'Abwesenheit' }}</strong>
            <span>{{ formatRange(entry.startDate, entry.endDate) }}</span>
          </div>
          <div class="student-calendar__entry-meta">
            <span v-if="entry.status">{{ entry.status }}</span>
            <span v-if="entry.period">Zeitraum: {{ entry.period }}</span>
            <span v-if="entry.missedDays !== undefined">{{ entry.missedDays }} Fehltage</span>
            <span v-if="entry.missedHours !== undefined">{{ entry.missedHours }} Fehlstunden</span>
            <span v-if="entry.missedMinutes !== undefined">{{ entry.missedMinutes }} Fehlminuten</span>
            <span>{{ entry.source === 'iserv' ? 'IServ' : 'manuell' }}</span>
          </div>
          <p v-if="entry.notes">{{ entry.notes }}</p>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import type { ClassGroup, Student, StudentCalendarEntry } from '@viccoboard/core';
import type { IservAbsenceImportPreview, IservArchiveTextFile } from '@viccoboard/students';
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import { readIservZipFile } from '../utils/iserv-zip';

const router = useRouter();
const toast = useToast();
initializeSportBridge();
initializeStudentsBridge();
const sportBridge = getSportBridge();
const studentsBridge = getStudentsBridge();

const students = ref<Student[]>([]);
const classes = ref<ClassGroup[]>([]);
const entries = ref<StudentCalendarEntry[]>([]);
const selectedStudentId = ref<string | null>(null);
const manualType = ref<'absence' | 'injury'>('absence');
const manualStartDate = ref('');
const manualEndDate = ref('');
const manualNotes = ref('');
const saving = ref(false);
const error = ref<string | null>(null);
const importBusy = ref(false);
const importFiles = ref<IservArchiveTextFile[]>([]);
const importPreview = ref<IservAbsenceImportPreview | null>(null);

const classNameById = computed(() => new Map(classes.value.map((group) => [group.id, group.name])));
const studentOptions = computed(() => students.value
  .map((student) => ({
    value: student.id,
    label: `${student.lastName}, ${student.firstName} · ${classNameById.value.get(student.classGroupId) ?? 'ohne Klasse'}`
  }))
  .sort((left, right) => left.label.localeCompare(right.label, 'de')));
const selectedStudentLabel = computed(() => studentOptions.value.find((option) => option.value === selectedStudentId.value)?.label ?? '');
const typeOptions = [
  { label: 'Abwesenheit', value: 'absence' as const },
  { label: 'Verletzung', value: 'injury' as const }
];
const canSaveManual = computed(() => Boolean(
  selectedStudentId.value && manualStartDate.value && manualEndDate.value && manualStartDate.value <= manualEndDate.value
));

onMounted(loadData);
watch(selectedStudentId, () => void loadEntries());

async function loadData(): Promise<void> {
  try {
    error.value = null;
    [students.value, classes.value] = await Promise.all([
      studentsBridge.studentRepository.findAll(),
      sportBridge.classGroupRepository.findAll()
    ]);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Daten konnten nicht geladen werden.';
  }
}

async function loadEntries(): Promise<void> {
  if (!selectedStudentId.value) {
    entries.value = [];
    return;
  }
  entries.value = await studentsBridge.studentCalendarEntryRepository.findByStudent(selectedStudentId.value);
}

async function saveManualEntry(): Promise<void> {
  if (!canSaveManual.value || !selectedStudentId.value) return;

  try {
    saving.value = true;
    await studentsBridge.studentCalendarEntryRepository.create({
      studentId: selectedStudentId.value,
      type: manualType.value,
      startDate: manualStartDate.value,
      endDate: manualEndDate.value,
      notes: manualNotes.value.trim() || undefined,
      source: 'manual'
    });
    manualStartDate.value = '';
    manualEndDate.value = '';
    manualNotes.value = '';
    await loadEntries();
    toast.success('Kalendereintrag gespeichert');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Kalendereintrag konnte nicht gespeichert werden.');
  } finally {
    saving.value = false;
  }
}

async function handleZipSelection(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  try {
    importBusy.value = true;
    importPreview.value = null;
    importFiles.value = await readIservZipFile(file);
    importPreview.value = await studentsBridge.iservAbsenceImportUseCase.preview(importFiles.value);
  } catch (err) {
    importFiles.value = [];
    toast.error(err instanceof Error ? err.message : 'IServ-ZIP konnte nicht gelesen werden.');
  } finally {
    importBusy.value = false;
  }
}

async function executeIservImport(): Promise<void> {
  if (!importFiles.value.length || !importPreview.value) return;

  try {
    importBusy.value = true;
    const result = await studentsBridge.iservAbsenceImportUseCase.execute(importFiles.value);
    toast.success(`${result.imported} IServ-Abwesenheiten importiert`);
    importPreview.value = await studentsBridge.iservAbsenceImportUseCase.preview(importFiles.value);
    await loadEntries();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'IServ-Abwesenheiten konnten nicht importiert werden.');
  } finally {
    importBusy.value = false;
  }
}

function formatRange(startDate: string, endDate: string): string {
  const format = (value: string) => {
    const [year, month, day] = value.split('-');
    return `${Number(day)}.${Number(month)}.${year}`;
  };
  return startDate === endDate ? format(startDate) : `${format(startDate)}–${format(endDate)}`;
}
</script>

<style scoped>
.student-calendar { display: flex; flex-direction: column; gap: 1.5rem; }
.student-calendar__header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; flex-wrap: wrap; }
.student-calendar__header h1 { margin: 0; }
.student-calendar__eyebrow { margin: 0 0 0.35rem; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; font-weight: 700; }
.student-calendar__intro { max-width: 48rem; color: #64748b; }
.student-calendar__section { display: flex; flex-direction: column; gap: 1rem; }
.student-calendar__form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 1rem; }
.student-calendar__notes { grid-column: 1 / -1; }
.student-calendar__preview { display: flex; flex-direction: column; gap: 0.75rem; }
.student-calendar__issues { margin: 0; padding-left: 1.25rem; }
.student-calendar__entries { display: flex; flex-direction: column; gap: 0.75rem; }
.student-calendar__entry { border: 1px solid rgba(15, 23, 42, 0.1); border-radius: 12px; padding: 1rem; }
.student-calendar__entry > div:first-child { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.student-calendar__entry-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; color: #64748b; font-size: 0.9rem; }
.student-calendar__entry p { margin-bottom: 0; }
</style>
