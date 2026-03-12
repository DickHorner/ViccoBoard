<template>
  <div class="grading-overview-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>Bewertungsübersicht</h2>
      <p class="page-description">Verwalten Sie Bewertungskategorien und erfassen Sie Noten.</p>
    </div>

    <!-- Quick Links -->
    <div class="quick-links">
      <button class="quick-link-btn" @click="$router.push('/grading/tables')">
        📊 Tabellenverwaltung
      </button>
      <button class="quick-link-btn" @click="$router.push('/settings/catalogs')">
        📋 Kriterienkataloge
      </button>
    </div>
    
    <div class="grading-content">
      <!-- Class Selection -->
      <section class="card">
        <h3>Klasse auswählen</h3>
        <div class="form-section">
          <select 
            v-model="selectedClassId" 
            class="form-select"
            @change="onClassChange"
          >
            <option value="">Klasse auswählen...</option>
            <option 
              v-for="cls in classes" 
              :key="cls.id" 
              :value="cls.id"
            >
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
        </div>
      </section>

      <!-- No Class Selected -->
      <div v-if="!selectedClassId" class="empty-state">
        <p>Wählen Sie eine Klasse, um Bewertungskategorien zu sehen.</p>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Kategorien werden geladen...</p>
      </div>

      <!-- Grade Categories -->
      <div v-else-if="selectedClassId">
        <section class="card">
          <div class="card-header">
            <h3>Bewertungskategorien</h3>
            <button class="btn-primary btn-small" @click="showCreateCategoryModal = true">
              + Neue Kategorie
            </button>
          </div>
          
          <div class="card-content">
            <div v-if="categories.length === 0" class="empty-state">
              <p>Noch keine Bewertungskategorien. Erstellen Sie Ihre erste Kategorie.</p>
            </div>
            
            <div v-else class="category-list">
              <div 
                v-for="category in categories" 
                :key="category.id"
                class="category-card"
              >
                <div class="category-info">
                  <h4>{{ category.name }}</h4>
                  <p class="category-type">{{ getCategoryTypeLabel(category.type) }}</p>
                  <p class="category-weight">Gewicht: {{ category.weight }}%</p>
                  <p v-if="category.description" class="category-description">
                    {{ category.description }}
                  </p>
                </div>
                
                <div class="category-actions">
                  <button 
                    class="btn-secondary btn-small"
                    @click="openGradingEntry(category)"
                  >
                    Noten erfassen
                  </button>
                  <button 
                    class="btn-text btn-small"
                    @click="viewHistory(category)"
                  >
                    Historie
                  </button>
                  <button
                    class="btn-text btn-small"
                    @click="openEditCategoryModal(category)"
                  >
                    ✏️
                  </button>
                  <button
                    class="btn-icon btn-small btn-danger-icon"
                    :title="'Kategorie löschen: ' + category.name"
                    @click="openDeleteConfirm(category)"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Grade Progress Summary -->
        <section class="card" v-if="categories.length > 0 && students.length > 0">
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
                    <td class="student-name">
                      {{ student.firstName }} {{ student.lastName }}
                    </td>
                    <td 
                      v-for="category in categories" 
                      :key="category.id"
                      class="grade-cell"
                    >
                      <span 
                        v-if="getStudentGrade(student.id, category.id)"
                        class="grade-value"
                      >
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

    <!-- Create Category Modal -->
    <div v-if="showCreateCategoryModal" class="modal-overlay" @click="showCreateCategoryModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Neue Bewertungskategorie</h3>
          <button class="close-btn" @click="showCreateCategoryModal = false">×</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="createCategory">
            <div class="form-group">
              <label for="category-type">Typ*</label>
              <select 
                id="category-type"
                v-model="newCategory.type" 
                required
                @change="applyPreset(newCategory.type)"
              >
                <option value="">Typ auswählen...</option>
                <option
                  v-for="t in SUPPORTED_TYPES"
                  :key="t.value"
                  :value="t.value"
                >{{ t.label }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="category-name">Name*</label>
              <input 
                id="category-name"
                v-model="newCategory.name" 
                type="text" 
                required
                placeholder="z.B. Ausdauer, Technik, Teamfähigkeit"
              />
            </div>
            
            <div class="form-group">
              <label for="category-description">Beschreibung</label>
              <textarea 
                id="category-description"
                v-model="newCategory.description"
                rows="3"
                placeholder="Optionale Beschreibung..."
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="category-weight">Gewicht (%)*</label>
              <input 
                id="category-weight"
                v-model.number="newCategory.weight" 
                type="number" 
                min="0" 
                max="100"
                required
                placeholder="0-100"
              />
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showCreateCategoryModal = false">
                Abbrechen
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Wird erstellt...' : 'Erstellen' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Category Modal -->
    <div v-if="showEditCategoryModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Kategorie bearbeiten</h3>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="saveEditCategory">
            <div class="form-group">
              <label for="edit-category-name">Name*</label>
              <input
                id="edit-category-name"
                v-model="editForm.name"
                type="text"
                required
                placeholder="Kategoriename"
              />
            </div>

            <div class="form-group">
              <label for="edit-category-description">Beschreibung</label>
              <textarea
                id="edit-category-description"
                v-model="editForm.description"
                rows="3"
                placeholder="Optionale Beschreibung..."
              ></textarea>
            </div>

            <div class="form-group">
              <label for="edit-category-weight">Gewicht (%)*</label>
              <input
                id="edit-category-weight"
                v-model.number="editForm.weight"
                type="number"
                min="0"
                max="100"
                required
                placeholder="0-100"
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeEditModal">
                Abbrechen
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Wird gespeichert...' : 'Speichern' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click="closeDeleteConfirm">
      <div class="modal modal-small" @click.stop>
        <div class="modal-header">
          <h3>Kategorie löschen?</h3>
          <button class="close-btn" @click="closeDeleteConfirm">×</button>
        </div>
        <div class="modal-content">
          <p>
            Möchten Sie die Kategorie <strong>{{ deletingCategory?.name }}</strong> wirklich löschen?
          </p>
          <p v-if="deleteEntryCount > 0" class="warning-text">
            ⚠️ Es gibt <strong>{{ deleteEntryCount }}</strong> erfasste Noteneinträge für diese Kategorie. Diese werden zusammen mit der Kategorie <strong>unwiderruflich gelöscht</strong>.
          </p>
          <p v-else class="info-text">Es gibt keine erfassten Noteneinträge für diese Kategorie.</p>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeDeleteConfirm">
              Abbrechen
            </button>
            <button type="button" class="btn-danger" :disabled="deleting" @click="confirmDeleteCategory">
              {{ deleting ? 'Wird gelöscht...' : 'Löschen' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Category Modal -->
  <div v-if="showEditCategoryModal" class="modal-overlay" @click.self="closeEditModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Kategorie bearbeiten</h3>
        <button class="close-btn" @click="closeEditModal">×</button>
      </div>
      <div class="modal-content">
        <form @submit.prevent="saveEditCategory">
          <div class="form-group">
            <label for="edit-category-name">Name*</label>
            <input
              id="edit-category-name"
              v-model="editCategoryForm.name"
              type="text"
              required
              placeholder="Kategoriename"
            />
          </div>
          <div class="form-group">
            <label for="edit-category-description">Beschreibung</label>
            <textarea
              id="edit-category-description"
              v-model="editCategoryForm.description"
              rows="3"
              placeholder="Optionale Beschreibung…"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="edit-category-weight">Gewicht (%)*</label>
            <input
              id="edit-category-weight"
              v-model.number="editCategoryForm.weight"
              type="number"
              min="0"
              max="100"
              required
              placeholder="0-100"
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeEditModal">Abbrechen</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Wird gespeichert…' : 'Speichern' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Delete Category Confirmation -->
  <div v-if="deleteCategoryTarget" class="modal-overlay" @click.self="deleteCategoryTarget = null">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Kategorie löschen?</h3>
        <button class="close-btn" @click="deleteCategoryTarget = null">×</button>
      </div>
      <div class="modal-content">
        <p>
          Möchten Sie die Kategorie <strong>{{ deleteCategoryTarget.name }}</strong> wirklich löschen?
        </p>
        <p style="color:#c00; font-size:0.875rem;">
          Alle zugehörigen Leistungseinträge bleiben erhalten, sind aber ohne Kategorie nicht mehr auswertbar.
        </p>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" @click="deleteCategoryTarget = null">Abbrechen</button>
        <button
          class="btn-danger-solid"
          :disabled="!!deletingCategoryId"
          @click="executeDeleteCategory"
        >
          {{ deletingCategoryId ? 'Wird gelöscht…' : 'Löschen' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSportBridge, getSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import type { Sport } from '@viccoboard/core';

// Supported types have a dedicated grading-entry route+view.
// 'verbal' is intentionally excluded as no view exists yet.
const SUPPORTED_TYPES: { value: Sport.GradeCategoryType; label: string }[] = [
  { value: 'criteria' as Sport.GradeCategoryType, label: 'Kriterienbasiert' },
  { value: 'time' as Sport.GradeCategoryType, label: 'Zeitbasiert' },
  { value: 'cooper' as Sport.GradeCategoryType, label: 'Cooper-Test' },
  { value: 'shuttle' as Sport.GradeCategoryType, label: 'Shuttle-Run' },
  { value: 'mittelstrecke' as Sport.GradeCategoryType, label: 'Mittelstrecke' },
  { value: 'Sportabzeichen' as Sport.GradeCategoryType, label: 'Sportabzeichen' },
  { value: 'bjs' as Sport.GradeCategoryType, label: 'Bundesjugendspiele' },
];

const TYPE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  SUPPORTED_TYPES.map(t => [t.value, t.label])
);

/** Category presets: sensible defaults keyed by type */
const CATEGORY_PRESETS: Record<string, { name: string; description: string; weight: number; configuration: Sport.GradeCategoryConfig }> = {
  criteria: {
    name: 'Technik & Teamfähigkeit',
    description: 'Bewertung technischer Fähigkeiten und der Zusammenarbeit',
    weight: 30,
    configuration: {
      type: 'criteria',
      criteria: [],
      allowSelfAssessment: false,
      selfAssessmentViaWOW: false,
    },
  },
  time: {
    name: 'Sprint 100 m',
    description: 'Zeitbasierte Bewertung des 100-m-Sprints',
    weight: 20,
    configuration: {
      type: 'time',
      bestGrade: 1,
      worstGrade: 6,
      linearMapping: true,
      adjustableAfterwards: true,
    },
  },
  cooper: {
    name: 'Cooper-Test Ausdauer',
    description: '12-Minuten-Lauftest nach Cooper',
    weight: 25,
    configuration: {
      type: 'cooper',
      SportType: 'running',
      distanceUnit: 'meters',
      autoEvaluation: true,
    },
  },
  shuttle: {
    name: 'Shuttle-Run',
    description: 'Mehrstufiger Ausdauertest',
    weight: 25,
    configuration: {
      type: 'shuttle',
      autoEvaluation: true,
    },
  },
  mittelstrecke: {
    name: 'Mittelstrecke 800 m',
    description: 'Laufbewertung über 800 Meter',
    weight: 20,
    configuration: {
      type: 'mittelstrecke',
      autoEvaluation: true,
    },
  },
  Sportabzeichen: {
    name: 'Sportabzeichen',
    description: 'Deutsches Sportabzeichen – altersbezogene Disziplinen',
    weight: 15,
    configuration: {
      type: 'Sportabzeichen',
      requiresBirthYear: true,
      ageDependent: true,
      disciplines: [],
      pdfExportEnabled: true,
    },
  },
  bjs: {
    name: 'Bundesjugendspiele',
    description: 'Wettbewerbs- oder Leichtathletikfestformat',
    weight: 15,
    configuration: {
      type: 'bjs',
      disciplines: [],
      autoGrading: true,
    },
  },
};

function buildDefaultConfiguration(type: string): Sport.GradeCategoryConfig {
  const preset = CATEGORY_PRESETS[type];
  if (preset) return { ...preset.configuration };
  throw new Error('Unsupported category type');
}

const router = useRouter();
const { SportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();

const classes = ref<any[]>([]);
const selectedClassId = ref<string>('');
const categories = ref<Sport.GradeCategory[]>([]);
const students = ref<any[]>([]);
const performanceEntries = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

// Edit category state
const showEditCategoryModal = ref(false);
const editingCategory = ref<Sport.GradeCategory | null>(null);
const editCategoryForm = ref({ name: '', description: '', weight: 0 });

// Delete category state
const deleteCategoryTarget = ref<Sport.GradeCategory | null>(null);
const deletingCategoryId = ref<string | null>(null);

const newCategory = ref({
  name: '',
  description: '',
  type: '' as any,
  weight: 0,
});

// Edit modal
const showEditCategoryModal = ref(false);
const editingCategory = ref<Sport.GradeCategory | null>(null);
const editForm = ref({
  name: '',
  description: '',
  weight: 0,
});

// Delete confirm modal
const showDeleteConfirmModal = ref(false);
const deletingCategory = ref<Sport.GradeCategory | null>(null);
const deleteEntryCount = ref(0);

onMounted(async () => {
  await loadClasses();
});

async function loadClasses() {
  try {
    classes.value = await SportBridge.value?.classGroupRepository.findAll() ?? [];
  } catch (error) {
    console.error('Failed to load classes:', error);
  }
}

async function onClassChange() {
  if (!selectedClassId.value) {
    categories.value = [];
    students.value = [];
    performanceEntries.value = [];
    return;
  }

  loading.value = true;
  try {
    categories.value = await SportBridge.value?.gradeCategoryRepository.findByClassGroup(selectedClassId.value) ?? [];
    students.value = await studentRepository.value?.findByClassGroup(selectedClassId.value) ?? [];

    const entryPromises = students.value.map((student) =>
      SportBridge.value?.performanceEntryRepository.findByStudent(student.id) ?? Promise.resolve([])
    );
    const entriesPerStudent = await Promise.all(entryPromises);
    performanceEntries.value = entriesPerStudent.flat();
  } catch (error) {
    console.error('Failed to load grading data:', error);
  } finally {
    loading.value = false;
  }
}

function getCategoryTypeLabel(type: any): string {
  return TYPE_LABEL_MAP[type] || type;
}

function getStudentGrade(studentId: string, categoryId: string): string | number | null {
  const entry = performanceEntries.value.find(
    e => e.studentId === studentId && e.categoryId === categoryId
  );
  return entry?.calculatedGrade || null;
}

function formatGrade(grade: string | number | null): string {
  if (grade === null || grade === undefined) return '—';
  return String(grade);
}

function openGradingEntry(category: Sport.GradeCategory) {
  const routes: Record<string, string> = {
    criteria: `/grading/criteria/${category.id}`,
    time: `/grading/time/${category.id}`,
    cooper: `/grading/cooper/${category.id}`,
    shuttle: `/grading/shuttle/${category.id}`,
    mittelstrecke: `/grading/mittelstrecke/${category.id}`,
    Sportabzeichen: `/grading/Sportabzeichen/${category.id}`,
    bjs: `/grading/bjs/${category.id}`,
  };
  const route = routes[category.type];
  if (route) {
    router.push(route);
  if (category.type === 'criteria') {
    router.push(`/grading/criteria/${category.id}`);
  } else if (category.type === 'time') {
    router.push(`/grading/time/${category.id}`);
  } else if (category.type === 'cooper') {
    router.push(`/grading/cooper/${category.id}`);
  } else if (category.type === 'shuttle') {
    router.push(`/grading/shuttle/${category.id}`);
  } else if (category.type === 'mittelstrecke') {
    router.push(`/grading/mittelstrecke/${category.id}`);
  } else if (category.type === 'Sportabzeichen') {
    router.push(`/grading/Sportabzeichen/${category.id}`);
  } else if (category.type === 'bjs') {
    router.push(`/grading/bjs/${category.id}`);
  } else if (category.type === 'verbal') {
    router.push(`/grading/verbal/${category.id}`);
  } else {
    toast.info('Dieser Bewertungstyp wird noch nicht unterstützt.');
  }
}

function viewHistory(category: Sport.GradeCategory) {
  router.push(`/grading/history/${category.id}`);
}

// ── Preset application ────────────────────────────────────────────────────────

function applyPreset(type: string) {
  const preset = CATEGORY_PRESETS[type];
  if (!preset) return;
  newCategory.value.name = preset.name;
  newCategory.value.description = preset.description;
  newCategory.value.weight = preset.weight;
}

// ── Create ────────────────────────────────────────────────────────────────────
// ── Edit category ─────────────────────────────────────────────────────────────

function openEditCategoryModal(category: Sport.GradeCategory): void {
  editingCategory.value = category;
  editCategoryForm.value = {
    name: category.name,
    description: category.description ?? '',
    weight: category.weight
  };
  showEditCategoryModal.value = true;
}

function closeEditModal(): void {
  showEditCategoryModal.value = false;
  editingCategory.value = null;
}

async function saveEditCategory(): Promise<void> {
  if (!editingCategory.value) return;
  saving.value = true;
  try {
    const bridge = getSportBridge();
    await bridge.updateGradeCategoryUseCase.execute({
      id: editingCategory.value.id,
      name: editCategoryForm.value.name,
      description: editCategoryForm.value.description || undefined,
      weight: editCategoryForm.value.weight
    });
    toast.success('Kategorie aktualisiert.');
    closeEditModal();
    await onClassChange();
  } catch (e: any) {
    toast.error(e?.message ?? 'Fehler beim Speichern.');
  } finally {
    saving.value = false;
  }
}

// ── Delete category ───────────────────────────────────────────────────────────

function confirmDeleteCategory(category: Sport.GradeCategory): void {
  deleteCategoryTarget.value = category;
}

async function executeDeleteCategory(): Promise<void> {
  if (!deleteCategoryTarget.value) return;
  deletingCategoryId.value = deleteCategoryTarget.value.id;
  try {
    const bridge = getSportBridge();
    await bridge.deleteGradeCategoryUseCase.execute(deleteCategoryTarget.value.id);
    toast.success('Kategorie gelöscht.');
    deleteCategoryTarget.value = null;
    await onClassChange();
  } catch (e: any) {
    toast.error(e?.message ?? 'Fehler beim Löschen.');
  } finally {
    deletingCategoryId.value = null;
  }
}

async function createCategory() {
  if (!selectedClassId.value) return;
  if (!newCategory.value.name || !newCategory.value.type) return;

  saving.value = true;
  try {
    const configuration = buildDefaultConfiguration(newCategory.value.type);

    await SportBridge.value?.createGradeCategoryUseCase.execute({
      classGroupId: selectedClassId.value,
      name: newCategory.value.name,
      description: newCategory.value.description || undefined,
      type: newCategory.value.type as Sport.GradeCategoryType,
      weight: newCategory.value.weight,
      configuration,
    });

    newCategory.value = { name: '', description: '', type: '', weight: 0 };
    showCreateCategoryModal.value = false;
    await onClassChange();
  } catch (error) {
    console.error('Failed to create category:', error);
    let userMessage = 'Die Kategorie konnte nicht erstellt werden.';
    if (error instanceof Error && error.message.trim().length > 0) {
      userMessage = `Die Kategorie konnte nicht erstellt werden: ${error.message}`;
    }
    toast.error(userMessage);
  } finally {
    saving.value = false;
  }
}

// ── Edit ──────────────────────────────────────────────────────────────────────

function openEditModal(category: Sport.GradeCategory) {
  editingCategory.value = category;
  editForm.value = {
    name: category.name,
    description: category.description ?? '',
    weight: category.weight,
  };
  showEditCategoryModal.value = true;
}

function closeEditModal() {
  showEditCategoryModal.value = false;
  editingCategory.value = null;
}

async function saveEditCategory() {
  if (!editingCategory.value) return;
  if (!editForm.value.name.trim()) return;

  saving.value = true;
  try {
    await SportBridge.value?.updateGradeCategoryUseCase.execute({
      id: editingCategory.value.id,
      name: editForm.value.name,
      description: editForm.value.description || undefined,
      weight: editForm.value.weight,
    });

    closeEditModal();
    await onClassChange();
    toast.success('Kategorie erfolgreich aktualisiert.');
  } catch (error) {
    console.error('Failed to update category:', error);
    toast.error('Die Kategorie konnte nicht aktualisiert werden.');
  } finally {
    saving.value = false;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function openDeleteConfirm(category: Sport.GradeCategory) {
  deletingCategory.value = category;
  // Count how many performance entries reference this category
  try {
    const entries = await SportBridge.value?.performanceEntryRepository.findByCategory(category.id) ?? [];
    deleteEntryCount.value = entries.length;
  } catch {
    deleteEntryCount.value = 0;
  }
  showDeleteConfirmModal.value = true;
}

function closeDeleteConfirm() {
  showDeleteConfirmModal.value = false;
  deletingCategory.value = null;
  deleteEntryCount.value = 0;
}

async function confirmDeleteCategory() {
  if (!deletingCategory.value) return;

  deleting.value = true;
  try {
    await SportBridge.value?.deleteGradeCategoryUseCase.execute({
      id: deletingCategory.value.id,
    });

    closeDeleteConfirm();
    await onClassChange();
    toast.success('Kategorie wurde gelöscht.');
  } catch (error) {
    console.error('Failed to delete category:', error);
    toast.error('Die Kategorie konnte nicht gelöscht werden.');
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.grading-overview-view {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  margin: 0.5rem 0;
  font-size: 1.75rem;
  color: #333;
}

.page-description {
  color: #666;
  margin: 0.5rem 0;
}

.back-button {
  background: none;
  border: none;
  color: #0066cc;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  touch-action: manipulation;
}

.back-button:hover {
  text-decoration: underline;
}

.grading-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #333;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
}

.card-content {
  margin-top: 1rem;
}

.form-section {
  margin-bottom: 1rem;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 44px;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0066cc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.category-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.category-type {
  font-size: 0.875rem;
  color: #666;
  margin: 0.25rem 0;
}

.category-weight {
  font-size: 0.875rem;
  color: #666;
  margin: 0.25rem 0;
  font-weight: 500;
}

.category-description {
  font-size: 0.875rem;
  color: #888;
  margin: 0.5rem 0 0 0;
}

.category-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-primary, .btn-secondary, .btn-text {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 44px;
  min-width: 44px;
  white-space: nowrap;
}

.btn-primary {
  background-color: #0066cc;
  color: white;
}

.btn-primary:hover {
  background-color: #0052a3;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-text {
  background-color: transparent;
  color: #0066cc;
  border: 1px solid #0066cc;
}

.btn-text:hover {
  background-color: #f0f7ff;
}

.btn-danger-text {
  background-color: transparent;
  color: #c0392b;
  border: 1px solid #c0392b;
  padding: 0.625rem 1.25rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 44px;
  min-width: 44px;
}

.btn-danger-text:hover {
  background-color: #fdf2f2;
}

.btn-danger-text:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger-solid {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 44px;
}

.btn-danger-solid:hover {
  background-color: #b02a37;
}

.btn-danger-solid:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-links {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.quick-link-btn {
  background: #f0f7ff;
  color: #0066cc;
  border: 1px solid #b3d4f7;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 44px;
}

.quick-link-btn:hover {
  background: #daeeff;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 44px;
}

.progress-table-wrapper {
  overflow-x: auto;
  margin-top: 1rem;
}

.progress-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.progress-table th,
.progress-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.progress-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
}

.progress-table .student-name {
  font-weight: 500;
}

.grade-cell {
  text-align: center;
}

.grade-value {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #e6f7e6;
  color: #2d6a2d;
  border-radius: 4px;
  font-weight: 500;
}

.grade-missing {
  color: #999;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background-color: #f0f0f0;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  box-sizing: border-box;
  min-height: 44px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.modal-small {
  max-width: 420px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.4rem;
  border-radius: 4px;
  min-height: 36px;
  min-width: 36px;
  touch-action: manipulation;
}

.btn-icon:hover {
  background-color: #f0f0f0;
}

.btn-danger-icon:hover {
  background-color: #ffe0e0;
}

.btn-danger {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 44px;
  background-color: #cc3300;
  color: white;
}

.btn-danger:hover {
  background-color: #a32800;
}

.btn-danger:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.warning-text {
  color: #8a4700;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 0.75rem;
  margin: 0.75rem 0;
}

.info-text {
  color: #555;
  margin: 0.75rem 0;
}

@media (max-width: 768px) {
  .category-card {
    flex-direction: column;
  }
  
  .category-actions {
    flex-direction: row;
    width: 100%;
  }
  
  .category-actions button {
    flex: 1;
  }
  
  .progress-table {
    font-size: 0.75rem;
  }
  
  .progress-table th,
  .progress-table td {
    padding: 0.5rem;
  }
}
</style>

