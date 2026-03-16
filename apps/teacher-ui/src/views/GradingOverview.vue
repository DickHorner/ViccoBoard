<template>
  <div class="grading-overview-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>Bewertungsübersicht</h2>
      <p class="page-description">Verwalten Sie Bewertungskategorien und erfassen Sie Noten.</p>
    </div>

    <div class="quick-links">
      <button class="quick-link-btn" @click="$router.push('/grading/tables')">
        📊 Tabellenverwaltung
      </button>
      <button class="quick-link-btn" @click="$router.push('/settings/catalogs')">
        📋 Kriterienkataloge
      </button>
    </div>

    <div class="grading-content">
      <section class="card">
        <h3>Klasse auswählen</h3>
        <div class="form-section">
          <select v-model="selectedClassId" class="form-select" @change="onClassChange">
            <option value="">Klasse auswählen...</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
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
                  <button class="btn-secondary btn-small" @click="openGradingEntry(category)">
                    Noten erfassen
                  </button>
                  <button class="btn-text btn-small" @click="viewHistory(category)">
                    Historie
                  </button>
                  <button class="btn-text btn-small" @click="openEditCategoryModal(category)">
                    ✏️
                  </button>
                  <button
                    class="btn-danger-text btn-small"
                    :disabled="deletingCategoryId === category.id"
                    @click="confirmDeleteCategory(category)"
                  >
                    {{ deletingCategoryId === category.id ? '…' : '🗑' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="categories.length > 0 && students.length > 0" class="card">
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

    <div v-if="showCreateCategoryModal" class="modal-overlay" @click="showCreateCategoryModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Neue Bewertungskategorie</h3>
          <button class="close-btn" @click="showCreateCategoryModal = false">×</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="createCategory">
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
              <label for="category-type">Typ*</label>
              <select id="category-type" v-model="newCategory.type" required>
                <option value="">Typ auswählen...</option>
                <option value="criteria">Kriterienbasiert</option>
                <option value="time">Zeitbasiert</option>
                <option value="cooper">Cooper-Test</option>
                <option value="shuttle">Shuttle-Run</option>
                <option value="mittelstrecke">Mittelstrecke</option>
                <option value="Sportabzeichen">Sportabzeichen</option>
                <option value="bjs">Bundesjugendspiele</option>
                <option value="verbal">Verbal</option>
              </select>
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
  </div>

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
            <input id="edit-category-name" v-model="editCategoryForm.name" type="text" required placeholder="Kategoriename" />
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
        <button class="btn-danger-solid" :disabled="!!deletingCategoryId" @click="executeDeleteCategory">
          {{ deletingCategoryId ? 'Wird gelöscht…' : 'Löschen' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
</script>

<style scoped src="./GradingOverview.css"></style>
