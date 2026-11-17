<template>
  <section class="student-list-page app-page">
    <header class="student-list-page__header">
      <div class="student-list-page__hero-top">
        <div class="student-list-page__hero-copy">
          <p class="student-list-page__eyebrow">
            <span class="student-list-page__status-dot" aria-hidden="true"></span>
            SCHÜLERVERWALTUNG
          </p>
          <h1>{{ t('SCHUELER.schueleruebersicht') }}</h1>
          <p class="student-list-page__intro">
            Klassenübergreifend suchen, Stammdaten pflegen und Schülerprofile direkt öffnen.
          </p>
        </div>
        <div class="student-list-page__hero-actions">
          <VoltSecondaryButton
            label="CSV importieren"
            icon="pi pi-upload"
            outlined
            @click="showImportDialog = true"
          />
          <VoltButton
            :label="t('SCHUELER.schueler-hinzu')"
            icon="pi pi-user-plus"
            @click="openCreateDialog"
          />
        </div>
      </div>

      <div class="student-list-page__hero-metrics" aria-label="Schülerstatistik">
        <div class="student-list-page__metric">
          <span>Aktuell sichtbar</span>
          <strong>{{ loading ? '–' : filteredStudents.length }}</strong>
        </div>
        <div class="student-list-page__metric">
          <span>Männlich</span>
          <strong>{{ loading ? '–' : genderStats.male }}</strong>
        </div>
        <div class="student-list-page__metric">
          <span>Weiblich</span>
          <strong>{{ loading ? '–' : genderStats.female }}</strong>
        </div>
      </div>
    </header>

    <section class="student-list-page__toolbar app-card" aria-label="Schüler filtern">
      <div class="student-list-page__toolbar-heading">
        <div>
          <h2>Suche & Filter</h2>
          <p>Suche nach Namen oder grenze die Schülerliste gezielt ein.</p>
        </div>
        <VoltSecondaryButton
          v-if="hasActiveFilters"
          label="Zurücksetzen"
          icon="pi pi-filter-slash"
          text
          @click="resetFilters"
        />
      </div>

      <div class="student-list-page__filters">
        <div class="student-list-page__filter student-list-page__filter--search">
          <label for="student-search">Schüler suchen</label>
          <div class="student-list-page__search">
            <i class="pi pi-search" aria-hidden="true"></i>
            <VoltInputText
              id="student-search"
              v-model="searchQuery"
              class="student-list-page__input"
              :placeholder="t('SEARCH.placeholder') || 'Name eingeben…'"
            />
          </div>
        </div>
        <div class="student-list-page__filter">
          <label for="student-class-filter">Klasse</label>
          <VoltSelect
            id="student-class-filter"
            v-model="filterClass"
            class="student-list-page__input"
            :options="classOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Alle Klassen"
            showClear
          />
        </div>
        <div class="student-list-page__filter">
          <label for="student-gender-filter">Geschlecht</label>
          <VoltSelect
            id="student-gender-filter"
            v-model="filterGender"
            class="student-list-page__input"
            :options="genderOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Alle"
            showClear
          />
        </div>
      </div>

      <div class="student-list-page__toolbar-footer">
        <label class="student-list-page__archived">
          <input v-model="showArchivedStudents" type="checkbox" />
          Ehemalige und archivierte Schüler anzeigen
        </label>
        <span class="student-list-page__result-count">{{ filteredStudents.length }} Treffer</span>
      </div>
    </section>

    <div v-if="selectedStudents.length > 0" class="student-list-page__selection-bar">
      <span><strong>{{ selectedStudents.length }}</strong> Schüler ausgewählt</span>
      <div class="student-list-page__selection-actions">
        <VoltSecondaryButton
          :label="`${selectedStudents.length} verschieben`"
          icon="pi pi-arrow-right-arrow-left"
          outlined
          @click="bulkMoveToClass"
        />
        <VoltDangerButton
          :label="`${selectedStudents.length} löschen`"
          icon="pi pi-trash"
          outlined
          @click="bulkDelete"
        />
      </div>
    </div>

    <section v-if="loading" class="app-card app-status-panel">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" />
      <p>Schüler werden geladen...</p>
    </section>

    <section v-else-if="error" class="app-card app-status-panel">
      <Message severity="error" :closable="false">{{ error }}</Message>
      <VoltButton label="Erneut versuchen" icon="pi pi-refresh" @click="loadData"  />
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

              <VoltSecondaryButton
                label="Start"
                icon="pi pi-home"
                text
                @click="router.push('/')"
               />
            </div>
          </template>

          <template #empty>
            <div class="student-list-page__empty">
              <h3>Keine Schüler gefunden</h3>
              <p>{{ emptyStateMessage }}</p>
              <VoltSecondaryButton
                v-if="hasActiveFilters"
                label="Filter zurücksetzen"
                icon="pi pi-filter-slash"
                text
                @click="resetFilters"
               />
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3.25rem" />

          <Column field="lastName" :header="t('SCHUELER.nachname')" sortable>
            <template #body="{ data }">
              <div class="student-list-page__identity">
                <span class="student-list-page__avatar" :title="data.id" aria-hidden="true">
                  {{ data.firstName?.charAt(0) }}{{ data.lastName?.charAt(0) }}
                </span>
                <span class="student-list-page__name-cell">
                  <strong class="student-list-page__name">{{ data.lastName }}</strong>
                  <small v-if="data.original.contactInfo?.email" :title="data.original.contactInfo.email">
                    {{ data.original.contactInfo.email }}
                  </small>
                </span>
              </div>
            </template>
          </Column>

          <Column field="firstName" :header="t('SCHUELER.name')" sortable />

          <Column field="className" :header="t('SCHUELER.klasse')" sortable>
            <template #body="{ data }">
              <span class="student-list-page__class-tag">{{ data.className || '–' }}</span>
            </template>
          </Column>

          <Column field="genderLabel" :header="t('SCHUELER.geschlecht')" sortable>
            <template #body="{ data }">
              <span class="student-list-page__gender-tag">{{ data.genderLabel || '–' }}</span>
            </template>
          </Column>

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
                <VoltSecondaryButton
                  icon="pi pi-pencil"
                  text
                  rounded
                  aria-label="Schüler bearbeiten"
                  @click="editStudent(data.original)"
                 />
                <VoltSecondaryButton
                  icon="pi pi-user"
                  text
                  rounded
                  aria-label="Profil öffnen"
                  @click="openStudentProfile(data.id)"
                 />
                <VoltDangerButton
                  icon="pi pi-trash"
                  text
                  rounded
                  aria-label="Schüler löschen"
                  @click="deleteStudent(data.original)"
                 />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

    </section>

    <VoltDialog
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
            <VoltInputText
              id="student-first-name"
              v-model="studentForm.firstName"
              class="student-list-page__input"
            />
          </div>

          <div class="app-field">
            <label for="student-last-name">{{ t('SCHUELER.nachname') }} *</label>
            <VoltInputText
              id="student-last-name"
              v-model="studentForm.lastName"
              class="student-list-page__input"
            />
          </div>

          <div class="app-field">
            <label for="student-class">{{ t('SCHUELER.klasse') }} *</label>
            <VoltSelect
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
            <VoltSelect
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
            <VoltInputText
              id="student-date-of-birth"
              v-model="studentForm.dateOfBirth"
              class="student-list-page__input"
              placeholder="TT.MM.JJJJ"
            />
            <p class="app-field-hint">Vollständiges Datum im Format TT.MM.JJJJ</p>
          </div>

          <div class="app-field">
            <label for="student-email">{{ t('SCHUELER.email') }}</label>
            <VoltInputText
              id="student-email"
              v-model="studentForm.email"
              class="student-list-page__input"
              type="email"
            />
          </div>

          <div class="app-field">
            <label for="student-parent-email">{{ t('SCHUELER.parent-email') }}</label>
            <VoltInputText
              id="student-parent-email"
              v-model="studentForm.parentEmail"
              class="student-list-page__input"
              type="email"
            />
          </div>

          <div class="app-field">
            <label for="student-phone">{{ t('SCHUELER.phone') }}</label>
            <VoltInputText
              id="student-phone"
              v-model="studentForm.phone"
              class="student-list-page__input"
              type="tel"
            />
          </div>
        </div>

        <div class="student-list-page__dialog-actions">
          <VoltSecondaryButton
            type="button"
            :label="t('COMMON.cancel') || 'Abbrechen'"
            text
            @click="closeEditor"
           />
          <VoltButton
            type="submit"
            :label="saving ? 'Wird gespeichert...' : t('SCHUELER.speichern')"
            :loading="saving"
           />
        </div>
      </form>
    </VoltDialog>

    <VoltDialog
      v-model:visible="showImportDialog"
      modal
      :draggable="false"
      :dismissableMask="true"
      :header="t('SCHUELER.csv-import')"
      :style="{ width: 'min(42rem, calc(100vw - 2rem))' }"
    >
      <div class="app-form-grid">
        <div class="app-field">
          <label for="student-import-class-existing">Zielklasse auswählen</label>
          <VoltSelect
            id="student-import-class-existing"
            v-model="importClassGroupId"
            class="student-list-page__input"
            :options="classOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Aus bestehender Klasse wählen"
            showClear
          />
        </div>

        <div class="app-field">
          <label for="student-import-class-new">Neue Zielklasse</label>
          <VoltInputText
            id="student-import-class-new"
            v-model="importClassName"
            class="student-list-page__input"
            placeholder="z. B. 8b"
            :disabled="Boolean(importClassGroupId)"
          />
          <p class="app-field-hint">
            Wenn eine Zielklasse gesetzt ist, muss die CSV keine Klasse-/Teilklasse-Spalte enthalten.
          </p>
        </div>

        <div class="app-field">
          <label for="student-csv-import">CSV-Datei auswählen</label>
          <input
            id="student-csv-import"
            type="file"
            accept=".csv,text/csv"
            @change="handleCsvFileSelection"
          />
          <p class="app-field-hint">
            Die Kopfzeile darf in Zeile 2 stehen. Pflichtspalten: Vorname, Nachname; Klasse nur, wenn oben keine Zielklasse gewählt ist.
            Optional: Geburtsdatum, Geschlecht (m/w), E-Mail. Komma, Semikolon und Tab werden erkannt.
          </p>
        </div>

        <div class="app-field">
          <label class="app-data-note">
            <input
              v-model="importGenerateSchoolEmails"
              type="checkbox"
              :disabled="importBusy"
              @change="refreshImportPreview"
            />
            Fehlende Schul-E-Mails aus Vor- und Nachnamen erzeugen
          </label>
          <p class="app-field-hint">
            Muster: vorname.nachname@vvb-gym.de; Doppelvornamen mit Bindestrich.
            Vorhandene Adressen bleiben erhalten. Bitte die Vorschau prüfen:
            Eine erzeugte Adresse bestätigt nicht, dass das Postfach existiert.
          </p>
        </div>

        <div class="app-actions-row">
          <VoltSecondaryButton
            type="button"
            label="RC-Demo-CSV-Paket laden"
            icon="pi pi-database"
            outlined
            :loading="importBusy"
            @click="previewDemoImport"
           />
          <VoltDangerButton
            type="button"
            label="Demo-Daten löschen"
            icon="pi pi-trash"
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

          <DataTable
            :value="importPreview.candidates"
            :rows="10"
            paginator
            stripedRows
            scrollable
            size="small"
          >
            <Column header="Schüler">
              <template #body="{ data }">{{ data.firstName }} {{ data.lastName }}</template>
            </Column>
            <Column header="m/w">
              <template #body="{ data }">{{ data.gender === 'f' ? 'w' : (data.gender ?? '–') }}</template>
            </Column>
            <Column field="email" header="E-Mail">
              <template #body="{ data }">{{ data.email || '–' }}</template>
            </Column>
            <Column header="Status">
              <template #body="{ data }">
                {{ data.status === 'ready' ? 'Bereit' : data.status === 'skip_existing' ? 'Vorhanden' : data.status === 'conflict' ? 'Konflikt' : 'Ungültig' }}
              </template>
            </Column>
          </DataTable>
        </div>

        <div class="student-list-page__dialog-actions">
          <VoltSecondaryButton
            type="button"
            :label="t('COMMON.cancel') || 'Abbrechen'"
            text
            @click="showImportDialog = false; resetImportState()"
           />
          <VoltButton
            type="button"
            label="Import ausführen"
            icon="pi pi-upload"
            :disabled="!importPreview || importBusy || importPreview.summary.imported === 0"
            :loading="importBusy"
            @click="executeImport"
           />
        </div>
      </div>
    </VoltDialog>
  </section>
</template>

<script setup lang="ts">
import Column from 'openvue/column'
import DataTable from 'openvue/datatable'
import Message from 'openvue/message'
import ProgressSpinner from 'openvue/progressspinner'
import { useStudentListView } from '../composables/useStudentListView'
import VoltButton from '../volt/Button.vue'
import VoltDangerButton from '../volt/DangerButton.vue'
import VoltDialog from '../volt/Dialog.vue'
import VoltInputText from '../volt/InputText.vue'
import VoltSecondaryButton from '../volt/SecondaryButton.vue'
import VoltSelect from '../volt/Select.vue'
import { formatGermanDateOfBirth } from '../utils/locale-format'

const {
  t,
  router,
  loading,
  error,
  searchQuery,
  filterClass,
  filterGender,
  showArchivedStudents,
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
  importClassGroupId,
  importClassName,
  importGenerateSchoolEmails,
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
  refreshImportPreview,
  previewDemoImport,
  executeImport,
  deleteDemoData,
  resetImportState
} = useStudentListView()
</script>

<style scoped src="./StudentList.css"></style>
