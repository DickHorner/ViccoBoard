<template>
  <section class="student-list-page app-page">
    <header class="student-list-page__header">
      <div>
        <p class="student-list-page__eyebrow">Zentrale Schülerverwaltung</p>
        <h1>{{ t('SCHUELER.schueleruebersicht') }}</h1>
        <p class="student-list-page__intro">
          Stammdaten, Klassenbezug und Schnellaktionen an einem Ort. Die Datenlogik bleibt unverändert,
          die Oberfläche ist jetzt die erste PrimeVue-Referenzansicht der App.
        </p>
      </div>

      <div class="app-actions-row">
        <Button
          label="CSV-Datei importieren"
          icon="pi pi-upload"
          severity="secondary"
          outlined
          @click="showImportDialog = true"
        />
        <Button
          :label="t('SCHUELER.schueler-hinzu')"
          icon="pi pi-user-plus"
          @click="openCreateDialog"
        />
      </div>
    </header>

    <section class="student-list-page__toolbar app-card">
      <div class="student-list-page__filters">
        <IconField class="student-list-page__field">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            class="student-list-page__input"
            :placeholder="t('SEARCH.placeholder') || 'Schüler suchen...'"
          />
        </IconField>

        <Select
          v-model="filterClass"
          class="student-list-page__input"
          :options="classOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Klasse filtern"
          showClear
        />

        <Select
          v-model="filterGender"
          class="student-list-page__input"
          :options="genderOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Geschlecht filtern"
          showClear
        />
      </div>

      <div class="student-list-page__toolbar-side">
        <div v-if="selectedStudents.length > 0" class="app-actions-row">
          <Button
            :label="`${selectedStudents.length} verschieben`"
            icon="pi pi-arrow-right-arrow-left"
            severity="secondary"
            outlined
            @click="bulkMoveToClass"
          />
          <Button
            :label="`${selectedStudents.length} löschen`"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="bulkDelete"
          />
        </div>

        <span class="app-data-note">{{ filteredStudents.length }} Schüler sichtbar</span>
      </div>
    </section>

    <section v-if="loading" class="app-card app-status-panel">
      <ProgressSpinner strokeWidth="4" style="width: 2.5rem; height: 2.5rem" />
      <p>Schüler werden geladen...</p>
    </section>

    <section v-else-if="error" class="app-card app-status-panel">
      <Message severity="error" :closable="false">{{ error }}</Message>
      <Button label="Erneut versuchen" icon="pi pi-refresh" @click="loadData" />
    </section>

    <section v-else class="student-list-page__content">
      <div class="app-card student-list-page__table-card">
        <DataTable
          v-model:selection="selectedStudents"
          :value="filteredStudents"
          dataKey="id"
          paginator
          :rows="25"
          :rowsPerPageOptions="[10, 25, 50]"
          stripedRows
          removableSort
          scrollable
          tableStyle="min-width: 62rem"
          sortField="lastName"
          :sortOrder="1"
          currentPageReportTemplate="{first}-{last} von {totalRecords}"
          paginatorTemplate="RowsPerPageDropdown PrevPageLink CurrentPageReport NextPageLink"
        >
          <template #header>
            <div class="student-list-page__table-header">
              <div>
                <h2 class="app-section-title">{{ t('SCHUELER.schueler') }}</h2>
                <p class="app-section-copy">
                  Direkter Zugriff auf Profile, Klassenzuordnung und Kommunikationsdaten.
                </p>
              </div>

              <Button
                label="Start"
                icon="pi pi-home"
                severity="secondary"
                text
                @click="router.push('/')"
              />
            </div>
          </template>

          <template #empty>
            <div class="student-list-page__empty">
              <h3>Keine Schüler gefunden</h3>
              <p>{{ emptyStateMessage }}</p>
              <Button
                v-if="hasActiveFilters"
                label="Filter zurücksetzen"
                icon="pi pi-filter-slash"
                severity="secondary"
                text
                @click="resetFilters"
              />
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3.25rem" />

          <Column field="lastName" :header="t('SCHUELER.nachname')" sortable />

          <Column field="firstName" :header="t('SCHUELER.name')" sortable>
            <template #body="{ data }">
              <div class="student-list-page__name-cell">
                <span class="student-list-page__name">{{ data.firstName }} {{ data.lastName }}</span>
                <small>{{ data.id }}</small>
              </div>
            </template>
          </Column>

          <Column field="className" :header="t('SCHUELER.klasse')" sortable />

          <Column field="genderLabel" :header="t('SCHUELER.geschlecht')" sortable />

          <Column field="dateOfBirth" header="Geburtsdatum" sortable>
            <template #body="{ data }">
              <div class="student-list-page__name-cell">
                <span>{{ formatGermanDateOfBirth(data.dateOfBirth) || '—' }}</span>
                <small v-if="data.legacyFlag" class="app-data-note">Legacy-Datum fehlt</small>
              </div>
            </template>
          </Column>
          <Column header="Aktionen" :exportable="false" headerStyle="width: 10rem">
            <template #body="{ data }">
              <div class="student-list-page__row-actions">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  severity="secondary"
                  aria-label="Schüler bearbeiten"
                  @click="editStudent(data.original)"
                />
                <Button
                  icon="pi pi-user"
                  text
                  rounded
                  severity="secondary"
                  aria-label="Profil öffnen"
                  @click="openStudentProfile(data.id)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  aria-label="Schüler löschen"
                  @click="deleteStudent(data.original)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <section class="app-chip-row student-list-page__stats">
        <div class="app-chip">
          <span>Gesamt</span>
          <strong>{{ filteredStudents.length }}</strong>
        </div>
        <div class="app-chip">
          <span>Männlich</span>
          <strong>{{ genderStats.male }}</strong>
        </div>
        <div class="app-chip">
          <span>Weiblich</span>
          <strong>{{ genderStats.female }}</strong>
        </div>
      </section>
    </section>

    <Dialog
      v-model:visible="showEditor"
      modal
      :draggable="false"
      :dismissableMask="true"
      :header="editingStudent ? t('SCHUELER.schueler-bearbeiten') : t('SCHUELER.schueler-hinzu')"
      :style="{ width: 'min(42rem, calc(100vw - 2rem))' }"
    >
      <form class="student-list-page__dialog-form app-form-grid" @submit.prevent="saveStudent">
        <div class="student-list-page__dialog-grid">
          <div class="app-field">
            <label for="student-first-name">{{ t('SCHUELER.name') }} *</label>
            <InputText
              id="student-first-name"
              v-model="studentForm.firstName"
              class="student-list-page__input"
            />
          </div>

          <div class="app-field">
            <label for="student-last-name">{{ t('SCHUELER.nachname') }} *</label>
            <InputText
              id="student-last-name"
              v-model="studentForm.lastName"
              class="student-list-page__input"
            />
          </div>

          <div class="app-field">
            <label for="student-class">{{ t('SCHUELER.klasse') }} *</label>
            <Select
              id="student-class"
              v-model="studentForm.classGroupId"
              class="student-list-page__input"
              :options="classOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Klasse wählen"
            />
          </div>

          <div class="app-field">
            <label for="student-gender">{{ t('SCHUELER.geschlecht') }}</label>
            <Select
              id="student-gender"
              v-model="studentForm.gender"
              class="student-list-page__input"
              :options="genderOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Optional"
              showClear
            />
          </div>

          <div class="app-field">
            <label for="student-date-of-birth">Geburtsdatum *</label>
            <InputText
              id="student-date-of-birth"
              v-model="studentForm.dateOfBirth"
              class="student-list-page__input"
              placeholder="YYYY-MM-DD"
            />
            <p class="app-field-hint">Vollständiges Datum im Format YYYY-MM-DD</p>
          </div>

          <div class="app-field">
            <label for="student-email">{{ t('SCHUELER.email') }}</label>
            <InputText
              id="student-email"
              v-model="studentForm.email"
              class="student-list-page__input"
              type="email"
            />
          </div>

          <div class="app-field">
            <label for="student-parent-email">{{ t('SCHUELER.parent-email') }}</label>
            <InputText
              id="student-parent-email"
              v-model="studentForm.parentEmail"
              class="student-list-page__input"
              type="email"
            />
          </div>

          <div class="app-field">
            <label for="student-phone">{{ t('SCHUELER.phone') }}</label>
            <InputText
              id="student-phone"
              v-model="studentForm.phone"
              class="student-list-page__input"
              type="tel"
            />
          </div>
        </div>

        <div class="student-list-page__dialog-actions">
          <Button
            type="button"
            :label="t('COMMON.cancel') || 'Abbrechen'"
            severity="secondary"
            text
            @click="closeEditor"
          />
          <Button
            type="submit"
            :label="saving ? 'Wird gespeichert...' : t('SCHUELER.speichern')"
            :loading="saving"
          />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showImportDialog"
      modal
      :draggable="false"
      :dismissableMask="true"
      :header="t('SCHUELER.csv-import')"
      :style="{ width: 'min(42rem, calc(100vw - 2rem))' }"
    >
      <div class="app-form-grid">
        <div class="app-field">
          <label for="student-csv-import">CSV-Datei auswählen</label>
          <input
            id="student-csv-import"
            type="file"
            accept=".csv,text/csv"
            @change="handleCsvFileSelection"
          />
          <p class="app-field-hint">
            Pflichtspalten: Vorname, Nachname, Klasse, Teilklasse, Geburtsdatum, Geschlecht, E-Mail
          </p>
        </div>

        <div class="app-actions-row">
          <Button
            type="button"
            label="RC-Demo-CSV-Paket laden"
            icon="pi pi-database"
            severity="secondary"
            outlined
            :loading="importBusy"
            @click="previewDemoImport"
          />
          <Button
            type="button"
            label="Demo-Daten löschen"
            icon="pi pi-trash"
            severity="danger"
            outlined
            :loading="importBusy"
            @click="deleteDemoData"
          />
        </div>

        <div v-if="importPreview" class="app-card">
          <h3 class="app-section-title">Importvorschau</h3>
          <p class="app-section-copy">
            {{ importPreview.summary.read }} gelesen,
            {{ importPreview.summary.valid }} gültig,
            {{ importPreview.summary.imported }} bereit zum Import,
            {{ importPreview.summary.skipped }} Überspringen,
            {{ importPreview.summary.conflicts }} Konflikte,
            {{ importPreview.summary.errors }} Fehler.
          </p>

          <ul v-if="importPreview.issues.length > 0" class="error-list" role="alert">
            <li
              v-for="issue in importPreview.issues"
              :key="`${issue.rowNumber}-${issue.field}-${issue.message}`"
              class="error-item"
            >
              Zeile {{ issue.rowNumber }} · {{ issue.field }} · {{ issue.message }}
            </li>
          </ul>
        </div>

        <div class="student-list-page__dialog-actions">
          <Button
            type="button"
            :label="t('COMMON.cancel') || 'Abbrechen'"
            severity="secondary"
            text
            @click="showImportDialog = false; resetImportState()"
          />
          <Button
            type="button"
            label="Import ausführen"
            icon="pi pi-upload"
            :disabled="!importPreview || importBusy || importPreview.summary.imported === 0"
            :loading="importBusy"
            @click="executeImport"
          />
        </div>
      </div>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Select from 'primevue/select'
import { useStudentListView } from '../composables/useStudentListView'
import { formatGermanDateOfBirth } from '../utils/locale-format'

const {
  t,
  router,
  loading,
  error,
  searchQuery,
  filterClass,
  filterGender,
  selectedStudents,
  showEditor,
  showImportDialog,
  editingStudent,
  saving,
  importBusy,
  studentForm,
  classOptions,
  genderOptions,
  filteredStudents,
  hasActiveFilters,
  emptyStateMessage,
  genderStats,
  importPreview,
  loadData,
  resetFilters,
  openCreateDialog,
  editStudent,
  closeEditor,
  openStudentProfile,
  saveStudent,
  deleteStudent,
  bulkDelete,
  bulkMoveToClass,
  handleCsvFileSelection,
  previewDemoImport,
  executeImport,
  deleteDemoData,
  resetImportState
} = useStudentListView()
</script>

<style scoped src="./StudentList.css"></style>
