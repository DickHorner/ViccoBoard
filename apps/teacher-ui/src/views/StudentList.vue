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
          label="CSV-Import"
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

          <Column field="birthYear" :header="t('SCHUELER.geburtsjahr')" sortable>
            <template #body="{ data }">
              {{ data.birthYear ?? '-' }}
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
            <label for="student-birth-year">{{ t('SCHUELER.geburtsjahr') }}</label>
            <InputText
              id="student-birth-year"
              v-model="birthYearInput"
              class="student-list-page__input"
              inputmode="numeric"
              :placeholder="String(currentYear)"
            />
            <p class="app-field-hint">{{ t('SCHUELER.geburt-hinweis') }}</p>
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
          <label for="student-csv-import">CSV-Daten</label>
          <Textarea
            id="student-csv-import"
            v-model="csvData"
            class="student-list-page__textarea"
            rows="10"
            autoResize
            placeholder="Max,Mustermann,10a,m,2010&#10;Anna,Schmidt,10a,w,2009"
          />
          <p class="app-field-hint">
            Format: Vorname,Nachname,Klasse,Geschlecht (m/w),Geburtsjahr
          </p>
        </div>

        <div class="student-list-page__dialog-actions">
          <Button
            type="button"
            :label="t('COMMON.cancel') || 'Abbrechen'"
            severity="secondary"
            text
            @click="showImportDialog = false"
          />
          <Button
            type="button"
            label="Importieren"
            icon="pi pi-upload"
            :disabled="!csvData.trim()"
            @click="importCSV"
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
import Textarea from 'primevue/textarea'
import { useStudentListView } from '../composables/useStudentListView'

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
  currentYear,
  studentForm,
  birthYearInput,
  csvData,
  classOptions,
  genderOptions,
  filteredStudents,
  hasActiveFilters,
  emptyStateMessage,
  genderStats,
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
  importCSV
} = useStudentListView()
</script>

<style scoped src="./StudentList.css"></style>
