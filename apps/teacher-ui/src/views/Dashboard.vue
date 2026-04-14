<template>
  <div class="dashboard-view">
    <div class="page-header">
      <p class="dashboard-eyebrow">Startseite</p>
      <h2>Start</h2>
      <p class="page-description">Schneller Einstieg in die aktuelle Arbeit: Stunde, Unterricht und Organisation.</p>
    </div>

    <div class="focus-grid">
      <section class="card focus-card focus-card-primary">
        <h3>Jetzt / Als Nächstes</h3>
        <div v-if="currentOrNextLesson" class="focus-content">
          <p class="focus-meta">{{ currentOrNextMode }}</p>
          <h4>{{ getClassName(currentOrNextLesson.classGroupId) }}</h4>
          <p>{{ formatLessonDateTime(currentOrNextLesson.date) }}</p>

          <div class="focus-actions">
            <RouterLink :to="`/lessons/${currentOrNextLesson.id}/workspace`" class="action-button action-button-inline">
              Arbeitsbereich öffnen
            </RouterLink>
            <RouterLink :to="`/attendance?classId=${currentOrNextLesson.classGroupId}&lessonId=${currentOrNextLesson.id}`" class="action-button action-button-inline">
              Anwesenheit
            </RouterLink>
          </div>

          <p v-if="upcomingLesson" class="focus-follow-up">
            Danach: {{ getClassName(upcomingLesson.classGroupId) }} um {{ formatLessonTime(upcomingLesson.date) }}
          </p>
        </div>
        <div v-else class="empty-state">
          <p>Für heute ist noch keine Stunde hinterlegt.</p>
          <RouterLink to="/schedule" class="action-button action-button-inline">
            Stundenplan öffnen
          </RouterLink>
        </div>
      </section>

      <section class="card focus-card">
        <h3>Unterricht</h3>
        <div class="card-links">
          <RouterLink v-for="link in instructionLinks" :key="link.to" :to="link.to" class="dashboard-link">
            <strong>{{ link.title }}</strong>
            <span>{{ link.description }}</span>
          </RouterLink>
        </div>
      </section>

      <section class="card focus-card">
        <h3>Organisation</h3>
        <div class="card-links">
          <RouterLink v-for="link in organizationLinks" :key="link.to" :to="link.to" class="dashboard-link">
            <strong>{{ link.title }}</strong>
            <span>{{ link.description }}</span>
          </RouterLink>
        </div>
      </section>

      <section class="card focus-card focus-card-wide">
        <div class="card-header">
          <h3>Heute</h3>
          <RouterLink to="/schedule" class="btn-text btn-small">Zum Stundenplan</RouterLink>
        </div>
        <div v-if="todayLessons.length === 0" class="empty-state">
          <p>Heute sind noch keine Stunden eingetragen.</p>
        </div>
        <div v-else class="lesson-timeline">
          <RouterLink
            v-for="lesson in todayLessons.slice(0, 4)"
            :key="lesson.id"
            :to="`/lessons/${lesson.id}/workspace`"
            class="lesson-timeline-item"
          >
            <strong>{{ getClassName(lesson.classGroupId) }}</strong>
            <span>{{ formatLessonTime(lesson.date) }}</span>
          </RouterLink>
        </div>
      </section>
    </div>
    
    <div class="dashboard-grid">
      <section class="card classes-card">
        <div class="card-header">
          <h3>{{ t('KLASSEN.title') }}</h3>
          <button class="btn-primary btn-small" @click="showCreateModal = true">
            + {{ t('KLASSEN.hinzu') }}
          </button>
        </div>
        
        <!-- Search/Filter -->
        <div class="search-bar" v-if="classes.length > 0">
          <div class="search-controls">
            <input v-model="searchQuery" type="text" :placeholder="t('SEARCH.placeholder')" class="search-input" />
            <select v-model="filterSchoolYear" class="filter-select">
              <option value="">{{ t('KLASSEN.schuljahr') }}: {{ t('COMMON.alle') || 'Alle' }}</option>
              <option v-for="year in schoolYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>
          <label class="archive-toggle">
            <input type="checkbox" v-model="showArchived" />
            {{ t('COMMON.archivierte-anzeigen') || 'Archivierte anzeigen' }}
          </label>
        </div>

        <div class="card-content">
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>{{ t('COMMON.loading') }}</p>
          </div>

          <!-- Error State -->
          <div v-else-if="loadError" class="error-state">
            <p>{{ loadError }}</p>
            <button class="btn-primary btn-small" @click="loadData">
              {{ t('COMMON.retry') || 'Erneut versuchen' }}
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredClasses.length === 0 && searchQuery === ''" class="empty-state">
            <p>{{ t('KLASSEN.no-classes') }}</p>
          </div>
          
          <!-- No Results State -->
          <div v-else-if="filteredClasses.length === 0" class="empty-state">
            <p>{{ t('COMMON.no-results') || `Keine Klassen gefunden für "${searchQuery}"` }}</p>
          </div>
          
          <!-- Classes List -->
          <div v-else class="class-list">
            <div v-for="cls in filteredClasses" :key="cls.id" class="class-card-wrapper">
              <RouterLink :to="`/classes/${cls.id}`" class="class-card">
                <div class="class-info">
                  <div class="class-title">
                    <span class="class-color" :style="getClassColorStyle(cls.color)"></span>
                    <h4>{{ cls.name }}</h4>
                  </div>
                  <p class="class-meta">{{ cls.schoolYear }}</p>
                </div>
                <div class="class-arrow">→</div>
              </RouterLink>
              <div class="class-actions">
                <button @click.stop="editClass(cls)" class="action-btn" :title="t('CLASSES.edit')" :aria-label="t('CLASSES.edit')">
                  ✏️
                </button>
                <button
                  @click.stop="toggleArchiveClass(cls)"
                  class="action-btn"
                  :title="cls.archived ? t('COMMON.unarchive') || 'Wiederherstellen' : t('COMMON.archive') || 'Archivieren'"
                  :aria-label="cls.archived ? t('COMMON.unarchive') || 'Wiederherstellen' : t('COMMON.archive') || 'Archivieren'"
                >
                  {{ cls.archived ? '📤' : '📥' }}
                </button>
                <button
                  @click.stop="confirmDeleteClass(cls)"
                  class="action-btn action-btn-danger"
                  :title="`Klasse ${cls.name} löschen`"
                  :aria-label="`Klasse ${cls.name} löschen`"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="card">
        <h3>Schnellzugriffe</h3>
        <div class="card-content">
          <button class="action-button" @click="showCreateModal = true">
            <span class="action-icon">📚</span>
            <span>Neue Klasse erstellen</span>
          </button>
          <RouterLink to="/students" class="action-button">
            <span class="action-icon">👥</span>
            <span>Alle Schüler anzeigen</span>
          </RouterLink>
          <RouterLink to="/attendance" class="action-button">
            <span class="action-icon">✓</span>
            <span>Anwesenheit erfassen</span>
          </RouterLink>
        </div>
      </section>
      
      <section class="card">
        <h3>Letzte Aktivitäten</h3>
        <div class="card-content">
          <!-- Loading State -->
          <div v-if="loading" class="loading-state-small">
            <div class="spinner-small"></div>
            <p>Wird geladen...</p>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="recentActivity.length === 0" class="empty-state">
            <p>Keine Aktivitäten zum Anzeigen.</p>
          </div>
          
          <!-- Recent Activity List -->
          <div v-else class="activity-list">
            <div 
              v-for="activity in recentActivity" 
              :key="activity.id"
              class="activity-item"
            >
              <span class="activity-icon">{{ getActivityIcon(activity.status) }}</span>
              <div class="activity-details">
                <p class="activity-text">Anwesenheit erfasst</p>
                <p class="activity-time">{{ formatDate(activity.timestamp) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    
    <!-- Create Class Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ t('KLASSEN.hinzu') }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        
        <form @submit.prevent="handleCreateClass" class="modal-form">
          <div class="form-group">
            <label for="className">Klassenname *</label>
            <input id="className" v-model="newClass.name" type="text" placeholder="z.B. Klasse 9a Sport" required class="form-input" />
          </div>
          
          <div class="form-group">
            <label for="schoolYear">Schuljahr *</label>
            <input id="schoolYear" v-model="newClass.schoolYear" type="text" placeholder="z.B. 2025/2026" pattern="\d{4}/\d{4}" required class="form-input" />
            <small class="form-hint">Format: YYYY/YYYY</small>
          </div>

          <div class="form-group">
            <label for="gradingScheme">{{ t('KLASSEN.notenschema') }}</label>
            <select id="gradingScheme" v-model="newClass.gradingScheme" class="form-input">
              <option v-for="(label, key) in gradingSchemes" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="classColor">{{ t('KLASSEN.color') || 'Klassenfarbe' }}</label>
            <select id="classColor" v-model="newClass.color" class="form-input">
              <option value="">{{ t('COMMON.none') || 'Keine' }}</option>
              <option v-for="color in classColorOptions" :key="color.value" :value="color.value">
                {{ color.label }}
              </option>
            </select>
          </div>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">
              {{ t('COMMON.cancel') || t('CANCEL') }}
            </button>
            <button type="submit" :disabled="creating" class="btn-primary">
              {{ creating ? t('COMMON.loading') : t('KLASSEN.button-hinzufuegen') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Edit Class Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Klasse bearbeiten</h3>
          <button class="modal-close" @click="closeEditModal">✕</button>
        </div>
        
        <form @submit.prevent="handleUpdateClass" class="modal-form">
          <div class="form-group">
            <label for="editClassName">Klassenname *</label>
            <input id="editClassName" v-model="editClassData.name" type="text" required class="form-input" />
          </div>
          
          <div class="form-group">
            <label for="editSchoolYear">Schuljahr *</label>
            <input id="editSchoolYear" v-model="editClassData.schoolYear" type="text" pattern="\d{4}/\d{4}" required class="form-input" />
            <small class="form-hint">Format: YYYY/YYYY</small>
          </div>

          <div class="form-group">
            <label for="editGradingScheme">Notenschema</label>
            <select id="editGradingScheme" v-model="editClassData.gradingScheme" class="form-input">
              <option v-for="(label, key) in gradingSchemes" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="editClassColor">Klassenfarbe</label>
            <select id="editClassColor" v-model="editClassData.color" class="form-input">
              <option value="">Keine</option>
              <option v-for="color in classColorOptions" :key="color.value" :value="color.value">
                {{ color.label }}
              </option>
            </select>
          </div>
          
          <div v-if="editError" class="error-message">
            {{ editError }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeEditModal" class="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" :disabled="updating" class="btn-primary">
              {{ updating ? 'Wird aktualisiert...' : 'Klasse aktualisieren' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal modal-small" @click.stop>
        <div class="modal-header">
          <h3>Klasse löschen</h3>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        
        <div class="modal-content">
          <p>Möchten Sie <strong>{{ classToDelete?.name }}</strong> wirklich löschen?</p>
          <p class="warning-text">Diese Aktion kann nicht rückgängig gemacht werden.</p>
          
          <div v-if="deleteError" class="error-message">
            {{ deleteError }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeDeleteModal" class="btn-secondary">
              Abbrechen
            </button>
            <button @click="handleDeleteClass" :disabled="deleting" class="btn-danger">
              {{ deleting ? 'Wird gelöscht...' : 'Klasse löschen' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useDashboardView } from '../composables/useDashboardView'

const {
  t,
  classes,
  recentActivity,
  loading,
  loadError,
  searchQuery,
  filterSchoolYear,
  showArchived,
  showCreateModal,
  creating,
  error,
  newClass,
  showEditModal,
  editClassData,
  editError,
  updating,
  showDeleteModal,
  classToDelete,
  deleteError,
  deleting,
  gradingSchemes,
  classColorOptions,
  instructionLinks,
  organizationLinks,
  schoolYears,
  todayLessons,
  currentOrNextLesson,
  upcomingLesson,
  currentOrNextMode,
  filteredClasses,
  loadData,
  getClassName,
  formatLessonTime,
  formatLessonDateTime,
  handleCreateClass,
  closeModal,
  editClass,
  handleUpdateClass,
  closeEditModal,
  getClassColorStyle,
  confirmDeleteClass,
  handleDeleteClass,
  toggleArchiveClass,
  closeDeleteModal,
  getActivityIcon,
  formatDate
} = useDashboardView()
</script>

<style src="../styles/modal.css"></style>

<style scoped src="./Dashboard.style2.css"></style>
