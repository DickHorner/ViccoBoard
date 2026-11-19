<template>
  <div class="grading-overview-view sport-ui">
    <div class="page-header">
      <Button text severity="secondary" icon="pi pi-arrow-left" @click="$router.back()">Zurück</Button>
      <h2>Bewerten & Prüfen</h2>
      <p class="page-description">Prüfungen durchführen, Bewertungen erfassen und Bewertungskategorien verwalten.</p>
    </div>

    <div class="quick-links app-actions-row">
      <Button label="Leistungsabnahmen" icon="pi pi-clipboard" severity="secondary" outlined @click="$router.push('/subjects/sport/assessments')" />
      <Button label="Eigene Prüfung durchführen" icon="pi pi-pencil" severity="secondary" outlined @click="$router.push('/subjects/sport/exam')" />
      <Button label="Tabellenverwaltung" icon="pi pi-table" severity="secondary" outlined @click="$router.push('/grading/tables')" />
      <Button label="Kriterienkataloge" icon="pi pi-list" severity="secondary" outlined @click="$router.push('/settings/catalogs')" />
    </div>

    <div class="grading-content">
      <section class="card app-card">
        <h3>Klasse auswählen</h3>
        <div class="form-section">
          <label for="grading-class">Klasse</label>
          <Select
            inputId="grading-class"
            v-model="selectedClassId"
            :options="classOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Klasse auswählen"
            fluid
          />
        </div>
      </section>

      <div v-if="!selectedClassId" class="empty-state">
        <p>Wählen Sie eine Klasse, um Bewertungskategorien zu sehen.</p>
      </div>

      <div v-else-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Kategorien werden geladen...</p>
      </div>

      <div v-else-if="selectedClassId">
        <section class="card app-card">
          <div class="card-header">
            <h3>Bewertungskategorien</h3>
            <Button @click="showCreateCategoryModal = true">
              + Neue Kategorie
            </Button>
          </div>

          <div class="card-content">
            <div v-if="categories.length === 0" class="empty-state">
              <p>Noch keine Bewertungskategorien. Erstellen Sie Ihre erste Kategorie.</p>
            </div>

            <div v-else class="category-list">
              <div v-for="category in categories" :key="category.id" class="category-card">
                <div class="category-info">
                  <h4>{{ category.name }}</h4>
                  <p class="category-type">{{ getCategoryTypeLabel(category.type) }}</p>
                  <p class="category-weight">Gewicht: {{ category.weight }}%</p>
                  <p v-if="category.description" class="category-description">
                    {{ category.description }}
                  </p>
                </div>

                <div class="category-actions">
                  <Button severity="secondary" outlined @click="openGradingEntry(category)">
                    Noten erfassen
                  </Button>
                  <Button severity="secondary" text @click="viewHistory(category)">
                    Historie
                  </Button>
                  <Button severity="secondary" text @click="openEditCategoryModal(category)">
                    ✏️
                  </Button>
                  <Button severity="danger" text
                   
                    :disabled="deletingCategoryId === category.id"
                    @click="confirmDeleteCategory(category)"
                  >
                    {{ deletingCategoryId === category.id ? '…' : '🗑' }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="categories.length > 0 && students.length > 0" class="card app-card">
          <h3>Bewertungsfortschritt</h3>
          <div class="card-content">
            <div class="progress-table-wrapper">
              <table class="progress-table">
                <thead>
                  <tr>
                    <th>Schüler</th>
                    <th v-for="category in categories" :key="category.id" :title="category.name">
                      {{ category.name }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in students" :key="student.id">
                    <td class="student-name">{{ student.firstName }} {{ student.lastName }}</td>
                    <td v-for="category in categories" :key="category.id" class="grade-cell">
                      <span v-if="getStudentGrade(student.id, category.id)" class="grade-value">
                        {{ formatGrade(getStudentGrade(student.id, category.id)) }}
                      </span>
                      <span v-else class="grade-missing">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>

    <Dialog
      :visible="showCreateCategoryModal"
      modal
      header="Neue Bewertungskategorie"
      :closable="!saving"
      :style="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }"
      @update:visible="visible => { if (!visible && !saving) showCreateCategoryModal = false }"
    >
      <form class="grading-dialog-form" @submit.prevent="createCategory">
        <div class="app-field">
          <label for="category-name">Name *</label>
          <InputText id="category-name" v-model="newCategory.name" required fluid placeholder="z. B. Ausdauer, Technik, Teamfähigkeit" />
        </div>
        <div class="app-field">
          <label for="category-description">Beschreibung</label>
          <Textarea id="category-description" v-model="newCategory.description" rows="3" autoResize fluid placeholder="Optionale Beschreibung" />
        </div>
        <div class="app-field">
          <label for="category-type">Typ *</label>
          <Select
            inputId="category-type"
            v-model="newCategory.type"
            :options="categoryTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Typ auswählen"
            required
            fluid
          />
        </div>
        <div class="app-field">
          <label for="category-weight">Gewicht (%) *</label>
          <InputNumber
            inputId="category-weight"
            :modelValue="newCategory.weight"
            @update:modelValue="value => newCategory.weight = value ?? 0"
            :min="0"
            :max="100"
            :useGrouping="false"
            fluid
          />
        </div>
        <div class="app-actions-row grading-dialog-actions">
          <Button label="Abbrechen" severity="secondary" :disabled="saving" @click="showCreateCategoryModal = false" />
          <Button type="submit" :label="saving ? 'Wird erstellt…' : 'Erstellen'" :loading="saving" :disabled="saving || !newCategory.name.trim() || !newCategory.type" />
        </div>
      </form>
    </Dialog>

    <Dialog
      :visible="showEditCategoryModal"
      modal
      header="Kategorie bearbeiten"
      :closable="!saving"
      :style="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }"
      @update:visible="visible => { if (!visible && !saving) closeEditModal() }"
    >
      <form class="grading-dialog-form" @submit.prevent="saveEditCategory">
        <div class="app-field">
          <label for="edit-category-name">Name *</label>
          <InputText id="edit-category-name" v-model="editCategoryForm.name" required fluid placeholder="Kategoriename" />
        </div>
        <div class="app-field">
          <label for="edit-category-description">Beschreibung</label>
          <Textarea id="edit-category-description" v-model="editCategoryForm.description" rows="3" autoResize fluid placeholder="Optionale Beschreibung" />
        </div>
        <div class="app-field">
          <label for="edit-category-weight">Gewicht (%) *</label>
          <InputNumber
            inputId="edit-category-weight"
            :modelValue="editCategoryForm.weight"
            @update:modelValue="value => editCategoryForm.weight = value ?? 0"
            :min="0"
            :max="100"
            :useGrouping="false"
            fluid
          />
        </div>
        <div class="app-actions-row grading-dialog-actions">
          <Button label="Abbrechen" severity="secondary" :disabled="saving" @click="closeEditModal" />
          <Button type="submit" :label="saving ? 'Wird gespeichert…' : 'Speichern'" :loading="saving" :disabled="saving || !editCategoryForm.name.trim()" />
        </div>
      </form>
    </Dialog>

    <Dialog
      :visible="Boolean(deleteCategoryTarget)"
      modal
      header="Kategorie löschen?"
      :closable="!deletingCategoryId"
      :style="{ width: '30rem', maxWidth: 'calc(100vw - 2rem)' }"
      @update:visible="visible => { if (!visible && !deletingCategoryId) deleteCategoryTarget = null }"
    >
      <p>Möchtest Du die Kategorie <strong>{{ deleteCategoryTarget?.name }}</strong> wirklich löschen?</p>
      <Message severity="warn" role="alert">
        Zugehörige Leistungseinträge bleiben erhalten, sind aber ohne Kategorie nicht mehr auswertbar.
      </Message>
      <div class="app-actions-row grading-dialog-actions">
        <Button label="Abbrechen" severity="secondary" :disabled="Boolean(deletingCategoryId)" @click="deleteCategoryTarget = null" />
        <Button label="Löschen" severity="danger" :loading="Boolean(deletingCategoryId)" :disabled="Boolean(deletingCategoryId)" @click="executeDeleteCategory" />
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import Button from 'openvue/button'
import Dialog from 'openvue/dialog'
import InputNumber from 'openvue/inputnumber'
import InputText from 'openvue/inputtext'
import Message from 'openvue/message'
import Select from 'openvue/select'
import Textarea from 'openvue/textarea'
import { useGradingOverviewView } from '../composables/useGradingOverviewView'

const {
  categories,
  classes,
  closeEditModal,
  confirmDeleteCategory,
  createCategory,
  deleteCategoryTarget,
  deletingCategoryId,
  editCategoryForm,
  executeDeleteCategory,
  formatGrade,
  getCategoryTypeLabel,
  getStudentGrade,
  loading,
  newCategory,
  onClassChange,
  openEditCategoryModal,
  openGradingEntry,
  saving,
  saveEditCategory,
  selectedClassId,
  showCreateCategoryModal,
  showEditCategoryModal,
  students,
  viewHistory
} = useGradingOverviewView()

const classOptions = computed(() => classes.value.map(cls => ({
  value: cls.id,
  label: `${cls.name} (${cls.schoolYear})`
})))
const categoryTypeOptions = [
  { label: 'Kriterienbasiert', value: 'criteria' },
  { label: 'Zeitbasiert', value: 'time' },
  { label: 'Messwert nach Tabelle', value: 'performance' },
  { label: 'Cooper-Test', value: 'cooper' },
  { label: 'Shuttle-Run', value: 'shuttle' },
  { label: 'Mittelstrecke', value: 'mittelstrecke' },
  { label: 'Sportabzeichen', value: 'Sportabzeichen' },
  { label: 'Bundesjugendspiele', value: 'bjs' },
  { label: 'Verbal', value: 'verbal' }
]

watch(selectedClassId, () => { void onClassChange() })
</script>

<style scoped src="./GradingOverview.css"></style>
<style scoped>
.grading-dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.grading-dialog-actions {
  justify-content: flex-end;
}
</style>
