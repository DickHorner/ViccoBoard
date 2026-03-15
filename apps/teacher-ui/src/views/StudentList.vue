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
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
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
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge'
import { useToast } from '../composables/useToast'
import type { Student, ClassGroup } from '@viccoboard/core'

interface StudentFormState {
  firstName: string
  lastName: string
  classGroupId: string | null
  gender: 'm' | 'w' | null
  email: string
  parentEmail: string
  phone: string
}

interface StudentRow {
  id: string
  firstName: string
  lastName: string
  className: string
  genderLabel: string
  birthYear?: number
  original: Student
}

const { t } = useI18n()
const router = useRouter()
const toast = useToast()

initializeSportBridge()
initializeStudentsBridge()

const sportBridge = getSportBridge()
const studentsBridge = getStudentsBridge()

const loading = ref(true)
const error = ref<string | null>(null)
const students = ref<Student[]>([])
const classes = ref<ClassGroup[]>([])

const searchQuery = ref('')
const filterClass = ref<string | null>(null)
const filterGender = ref<'m' | 'w' | null>(null)
const selectedStudents = ref<StudentRow[]>([])

const showEditor = ref(false)
const showImportDialog = ref(false)
const editingStudent = ref<Student | null>(null)
const saving = ref(false)

const currentYear = new Date().getFullYear()

const defaultStudentForm = (): StudentFormState => ({
  firstName: '',
  lastName: '',
  classGroupId: null,
  gender: null,
  email: '',
  parentEmail: '',
  phone: ''
})

const studentForm = ref<StudentFormState>(defaultStudentForm())
const birthYearInput = ref('')
const csvData = ref('')

const classOptions = computed(() =>
  classes.value.map((classGroup) => ({
    label: classGroup.name,
    value: classGroup.id
  }))
)

const genderOptions = computed(() => [
  { label: t('SCHUELER.maennlich'), value: 'm' as const },
  { label: t('SCHUELER.weiblich'), value: 'w' as const }
])

const classNameById = computed(() =>
  new Map(classes.value.map((classGroup) => [classGroup.id, classGroup.name]))
)

const studentRows = computed<StudentRow[]>(() =>
  students.value.map((student) => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    className: classNameById.value.get(student.classGroupId) ?? '-',
    genderLabel: getGenderDisplay(student.gender),
    birthYear: student.birthYear,
    original: student
  }))
)

const filteredStudents = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return studentRows.value.filter((student) => {
    const matchesQuery = query.length === 0
      || `${student.firstName} ${student.lastName}`.toLowerCase().includes(query)
      || student.className.toLowerCase().includes(query)

    const matchesClass = !filterClass.value || student.original.classGroupId === filterClass.value
    const matchesGender = !filterGender.value
      || student.original.gender === (filterGender.value === 'm' ? 'male' : 'female')

    return matchesQuery && matchesClass && matchesGender
  })
})

const hasActiveFilters = computed(() =>
  searchQuery.value.trim().length > 0 || Boolean(filterClass.value) || Boolean(filterGender.value)
)

const emptyStateMessage = computed(() => {
  if (hasActiveFilters.value) {
    return 'Passen Sie Suche oder Filter an, um Schüler wieder einzublenden.'
  }

  return 'Noch keine Schüler vorhanden. Sie können direkt manuell anlegen oder per CSV importieren.'
})

const genderStats = computed(() => ({
  male: filteredStudents.value.filter((student) => student.original.gender === 'male').length,
  female: filteredStudents.value.filter((student) => student.original.gender === 'female').length
}))

async function loadData() {
  try {
    loading.value = true
    error.value = null

    const [loadedStudents, loadedClasses] = await Promise.all([
      studentsBridge.studentRepository.findAll(),
      sportBridge.classGroupRepository.findAll()
    ])

    students.value = loadedStudents
    classes.value = loadedClasses
    selectedStudents.value = []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Fehler beim Laden'
  } finally {
    loading.value = false
  }
}

function getGenderDisplay(gender?: 'male' | 'female' | 'diverse'): string {
  if (gender === 'male') return t('SCHUELER.maennlich')
  if (gender === 'female') return t('SCHUELER.weiblich')
  if (gender === 'diverse') return 'Divers'
  return '-'
}

function resetForm() {
  studentForm.value = defaultStudentForm()
  birthYearInput.value = ''
}

function resetFilters() {
  searchQuery.value = ''
  filterClass.value = null
  filterGender.value = null
}

function openCreateDialog() {
  editingStudent.value = null
  resetForm()
  showEditor.value = true
}

function editStudent(student: Student) {
  editingStudent.value = student
  studentForm.value = {
    firstName: student.firstName,
    lastName: student.lastName,
    classGroupId: student.classGroupId,
    gender: student.gender === 'male' ? 'm' : student.gender === 'female' ? 'w' : null,
    email: student.contactInfo?.email || '',
    parentEmail: student.contactInfo?.parentEmail || '',
    phone: student.contactInfo?.phone || ''
  }
  birthYearInput.value = student.birthYear ? String(student.birthYear) : ''
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  editingStudent.value = null
  resetForm()
}

function openStudentProfile(studentId: string) {
  void router.push(`/students/${studentId}`)
}

function parseBirthYear(): number | undefined {
  const rawValue = birthYearInput.value.trim()

  if (!rawValue) {
    return undefined
  }

  const parsed = Number.parseInt(rawValue, 10)

  if (Number.isNaN(parsed) || parsed < 1900 || parsed > currentYear) {
    throw new Error(`Geburtsjahr muss zwischen 1900 und ${currentYear} liegen.`)
  }

  return parsed
}

async function saveStudent() {
  const firstName = studentForm.value.firstName.trim()
  const lastName = studentForm.value.lastName.trim()
  const classGroupId = studentForm.value.classGroupId

  if (!firstName || !lastName || !classGroupId) {
    toast.error('Bitte Vorname, Nachname und Klasse ausfüllen.')
    return
  }

  try {
    saving.value = true

    const birthYear = parseBirthYear()
    const gender = studentForm.value.gender === 'm'
      ? 'male'
      : studentForm.value.gender === 'w'
        ? 'female'
        : undefined

    if (editingStudent.value) {
      await studentsBridge.studentRepository.update(editingStudent.value.id, {
        firstName,
        lastName,
        classGroupId,
        birthYear,
        gender,
        contactInfo: {
          email: studentForm.value.email || undefined,
          parentEmail: studentForm.value.parentEmail || undefined,
          phone: studentForm.value.phone || undefined
        }
      })
      toast.success('Schüler aktualisiert')
    } else {
      await studentsBridge.addStudentUseCase.execute({
        firstName,
        lastName,
        classGroupId,
        birthYear,
        gender,
        email: studentForm.value.email || undefined,
        parentEmail: studentForm.value.parentEmail || undefined,
        phone: studentForm.value.phone || undefined
      })
      toast.success('Schüler hinzugefügt')
    }

    await loadData()
    closeEditor()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern')
  } finally {
    saving.value = false
  }
}

async function deleteStudent(student: Student) {
  const confirmed = window.confirm(`Schüler "${student.firstName} ${student.lastName}" wirklich löschen?`)

  if (!confirmed) {
    return
  }

  try {
    await studentsBridge.studentRepository.delete(student.id)
    toast.success('Schüler gelöscht')
    await loadData()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen')
  }
}

async function bulkDelete() {
  if (selectedStudents.value.length === 0) {
    return
  }

  const confirmed = window.confirm(`${selectedStudents.value.length} Schüler wirklich löschen?`)

  if (!confirmed) {
    return
  }

  try {
    for (const student of selectedStudents.value) {
      await studentsBridge.studentRepository.delete(student.id)
    }

    toast.success(`${selectedStudents.value.length} Schüler gelöscht`)
    await loadData()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen')
  }
}

function bulkMoveToClass() {
  toast.warning('Sammelverschiebung ist noch nicht umgesetzt.')
}

async function importCSV() {
  if (!csvData.value.trim()) {
    toast.error('Keine Daten zum Importieren')
    return
  }

  try {
    const lines = csvData.value.trim().split('\n')
    let imported = 0

    for (const line of lines) {
      const [firstName, lastName, className, gender, birthYearValue] = line.split(',').map((part) => part.trim())

      if (!firstName || !lastName || !className) {
        continue
      }

      let classGroup = classes.value.find((entry) => entry.name === className)

      if (!classGroup) {
        classGroup = await sportBridge.classGroupRepository.create({
          name: className,
          schoolYear: String(currentYear)
        })
        classes.value.push(classGroup)
      }

      await studentsBridge.addStudentUseCase.execute({
        firstName,
        lastName,
        classGroupId: classGroup.id,
        gender: gender === 'm' ? 'male' : gender === 'w' ? 'female' : undefined,
        birthYear: birthYearValue ? Number.parseInt(birthYearValue, 10) : undefined
      })

      imported += 1
    }

    toast.success(`${imported} Schüler importiert`)
    csvData.value = ''
    showImportDialog.value = false
    await loadData()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Fehler beim Importieren')
  }
}

onMounted(() => {
  void loadData()
})
</script>

<style scoped>
.student-list-page {
  display: grid;
  gap: 1.5rem;
}

.student-list-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.student-list-page__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-strong);
}

.student-list-page__header h1 {
  margin: 0;
  font-size: clamp(1.9rem, 3vw, 2.5rem);
  line-height: 1.1;
}

.student-list-page__intro {
  max-width: 54rem;
  margin: 0.6rem 0 0;
  color: var(--color-muted);
}

.student-list-page__toolbar,
.student-list-page__table-card {
  padding: 1.1rem 1.15rem;
}

.student-list-page__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.student-list-page__filters {
  display: flex;
  flex: 1 1 44rem;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.student-list-page__field,
.student-list-page__input {
  flex: 1 1 14rem;
  min-width: 12rem;
}

.student-list-page__toolbar-side {
  display: grid;
  gap: 0.85rem;
  justify-items: end;
}

.student-list-page__content {
  display: grid;
  gap: 1rem;
}

.student-list-page__table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.student-list-page__empty {
  display: grid;
  gap: 0.75rem;
  justify-items: center;
  padding: 2rem 1rem;
  text-align: center;
}

.student-list-page__empty h3,
.student-list-page__empty p {
  margin: 0;
}

.student-list-page__empty p {
  max-width: 34rem;
  color: var(--color-muted);
}

.student-list-page__name-cell {
  display: grid;
  gap: 0.15rem;
}

.student-list-page__name {
  font-weight: 600;
  color: var(--color-ink);
}

.student-list-page__name-cell small {
  color: var(--color-subtle);
}

.student-list-page__row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

.student-list-page__stats {
  padding-bottom: 0.2rem;
}

.student-list-page__dialog-form {
  padding-top: 0.35rem;
}

.student-list-page__dialog-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.student-list-page__textarea {
  width: 100%;
}

.student-list-page__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.student-list-page :deep(.student-list-page__input),
.student-list-page :deep(.student-list-page__field),
.student-list-page :deep(.student-list-page__textarea) {
  width: 100%;
}

@media (max-width: 960px) {
  .student-list-page__dialog-grid {
    grid-template-columns: 1fr;
  }

  .student-list-page__toolbar-side {
    justify-items: stretch;
    width: 100%;
  }
}

@media (max-width: 720px) {
  .student-list-page__toolbar,
  .student-list-page__table-card {
    padding: 1rem;
  }

  .student-list-page__dialog-actions,
  .student-list-page__row-actions,
  .student-list-page__header {
    align-items: stretch;
  }
}
</style>
