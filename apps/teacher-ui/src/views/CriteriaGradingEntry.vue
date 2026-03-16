<template>
  <div class="criteria-grading-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>{{ category?.name || 'Kriterienbasierte Bewertung' }}</h2>
      <p class="page-description">
        Erfassen Sie Bewertungen basierend auf definierten Kriterien.
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Daten werden geladen...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="$router.go(0)">Erneut versuchen</button>
    </div>

    <div v-else-if="category" class="grading-content">
      <section class="card category-info-card">
        <h3>Kategorieinformationen</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Typ:</label>
            <span>Kriterienbasiert</span>
          </div>
          <div class="info-item">
            <label>Gewicht:</label>
            <span>{{ category.weight }}%</span>
          </div>
          <div class="info-item">
            <label>Kriterien:</label>
            <span>{{ criteria.length }}</span>
          </div>
        </div>

        <div class="criteria-actions">
          <button
            v-if="criteria.length < 8"
            class="btn-secondary btn-small"
            @click="showAddCriterionModal = true"
          >
            + Kriterium hinzufügen
          </button>
          <span v-if="criteria.length >= 8" class="info-note">
            Maximum 8 Kriterien erreicht
          </span>
        </div>

        <div v-if="criteria.length > 0" class="criteria-list">
          <div v-for="(criterion, index) in criteria" :key="criterion.id" class="criterion-item">
            <div class="criterion-info">
              <strong>{{ criterion.name }}</strong>
              <span class="criterion-range">
                ({{ criterion.minValue }} - {{ criterion.maxValue }} Punkte, Gewicht: {{ criterion.weight }}%)
              </span>
              <p v-if="criterion.description" class="criterion-description">
                {{ criterion.description }}
              </p>
            </div>
            <button class="btn-danger-text btn-small" :disabled="saving" @click="removeCriterion(index)">
              Entfernen
            </button>
          </div>
        </div>

        <div v-else class="empty-state-small">
          <p>Keine Kriterien definiert. Fügen Sie Kriterien hinzu, um mit der Bewertung zu beginnen.</p>
        </div>
      </section>

      <section v-if="criteria.length > 0 && students.length > 0" class="card">
        <div class="card-header">
          <h3>Bewertungseingabe</h3>
          <div class="header-actions">
            <button class="btn-secondary btn-small" @click="toggleBulkMode">
              {{ bulkMode ? 'Einzelmodus' : 'Bulk-Modus' }}
            </button>
            <button class="btn-primary btn-small" :disabled="saving || !hasUnsavedChanges" @click="saveAllGrades">
              {{ saving ? 'Speichern...' : 'Alle speichern' }}
            </button>
          </div>
        </div>

        <div class="card-content">
          <p class="info-note">
            💡 Änderungen werden automatisch gespeichert. Bewegen Sie sich zwischen Feldern mit Tab.
          </p>

          <div class="grading-table-wrapper">
            <table class="grading-table">
              <thead>
                <tr>
                  <th class="student-col">Schüler</th>
                  <th
                    v-for="criterion in criteria"
                    :key="criterion.id"
                    class="criterion-col"
                    :title="criterion.name"
                  >
                    {{ criterion.name }}
                    <br>
                    <span class="col-subtitle">({{ criterion.minValue }}-{{ criterion.maxValue }})</span>
                  </th>
                  <th class="total-col">Gesamt</th>
                  <th class="grade-col">Note</th>
                  <th class="actions-col">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in students"
                  :key="student.id"
                  :class="{ 'highlight-row': hasUnsavedChangesForStudent(student.id) }"
                >
                  <td class="student-name">
                    <div class="student-name-cell">
                      {{ student.firstName }} {{ student.lastName }}
                      <div v-if="participationOptions.length > 0" class="participation-badges">
                        <button
                          v-for="opt in participationOptions"
                          :key="opt.code"
                          type="button"
                          :class="['participation-chip', { selected: participationStatus.get(student.id) === opt.code }]"
                          :style="participationStatus.get(student.id) === opt.code
                            ? { background: opt.color || '#94a3b8', color: '#fff', borderColor: opt.color || '#94a3b8' }
                            : { borderColor: opt.color || '#94a3b8' }"
                          :title="opt.name"
                          @click="setParticipation(student.id, opt.code)"
                        >{{ opt.icon || opt.code }}</button>
                      </div>
                    </div>
                  </td>
                  <td v-for="criterion in criteria" :key="criterion.id" class="input-cell">
                    <input
                      type="number"
                      :min="criterion.minValue"
                      :max="criterion.maxValue"
                      :step="0.5"
                      :value="getGradeValue(student.id, criterion.id)"
                      class="grade-input"
                      :disabled="saving"
                      @input="onGradeChange(student.id, criterion.id, ($event.target as HTMLInputElement)?.value)"
                      @blur="saveStudentGrade(student.id)"
                    />
                  </td>
                  <td class="total-cell">
                    <strong>{{ calculateTotal(student.id).toFixed(1) }}</strong>
                  </td>
                  <td class="grade-cell">
                    <span class="calculated-grade">{{ calculateGrade(student.id) }}</span>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-text-small" title="Kommentar hinzufügen" @click="addComment(student.id)">
                      💬
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section v-if="students.length === 0" class="card">
        <div class="empty-state">
          <p>Keine Schüler in dieser Klasse gefunden.</p>
        </div>
      </section>
    </div>

    <div v-if="showAddCriterionModal" class="modal-overlay" @click="showAddCriterionModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Kriterium hinzufügen</h3>
          <button class="close-btn" @click="showAddCriterionModal = false">×</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="addCriterion">
            <div class="form-group">
              <label for="criterion-name">Name*</label>
              <input
                id="criterion-name"
                v-model="newCriterion.name"
                type="text"
                required
                placeholder="z.B. Technik, Taktik, Teamwork"
              />
            </div>

            <div class="form-group">
              <label for="criterion-description">Beschreibung</label>
              <textarea
                id="criterion-description"
                v-model="newCriterion.description"
                rows="2"
                placeholder="Optionale Beschreibung..."
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="criterion-min">Min. Punkte*</label>
                <input id="criterion-min" v-model.number="newCriterion.minValue" type="number" required min="0" />
              </div>

              <div class="form-group">
                <label for="criterion-max">Max. Punkte*</label>
                <input id="criterion-max" v-model.number="newCriterion.maxValue" type="number" required min="0" />
              </div>
            </div>

            <div class="form-group">
              <label for="criterion-weight">Gewicht (%)*</label>
              <input
                id="criterion-weight"
                v-model.number="newCriterion.weight"
                type="number"
                min="0"
                max="100"
                required
                placeholder="0-100"
              />
              <small>Verbleibende Gewichtung: {{ remainingWeight }}%</small>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showAddCriterionModal = false">
                Abbrechen
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Hinzufügen...' : 'Hinzufügen' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div v-if="showCommentModal" class="modal-overlay" @click="showCommentModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Kommentar hinzufügen</h3>
          <button class="close-btn" @click="showCommentModal = false">×</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="saveComment">
            <div class="form-group">
              <label for="comment-text">Kommentar</label>
              <textarea
                id="comment-text"
                v-model="currentComment"
                rows="5"
                placeholder="Fügen Sie einen Kommentar hinzu..."
              ></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showCommentModal = false">
                Abbrechen
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Speichern...' : 'Speichern' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCriteriaGradingEntryView } from '../composables/useCriteriaGradingEntryView'

const {
  addComment,
  addCriterion,
  bulkMode,
  calculateGrade,
  calculateTotal,
  category,
  criteria,
  currentComment,
  error,
  getGradeValue,
  hasUnsavedChanges,
  hasUnsavedChangesForStudent,
  loading,
  newCriterion,
  onGradeChange,
  participationOptions,
  participationStatus,
  remainingWeight,
  removeCriterion,
  saveAllGrades,
  saveComment,
  saveStudentGrade,
  saving,
  setParticipation,
  showAddCriterionModal,
  showCommentModal,
  students,
  toggleBulkMode
} = useCriteriaGradingEntryView()
</script>

<style scoped src="./CriteriaGradingEntry.css"></style>
