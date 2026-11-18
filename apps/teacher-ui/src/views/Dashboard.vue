<template>
  <div class="dashboard-view">
    <div class="page-header">
      <p class="dashboard-eyebrow">Startseite</p>
      <h2>Start</h2>
      <p class="page-description">Schneller Einstieg in die aktuelle Arbeit: Stunde, Unterricht und Organisation.</p>
    </div>

    <div class="focus-grid">
      <section class="card app-card focus-card focus-card-primary">
        <h3>Jetzt / Als Nächstes</h3>
        <div v-if="loadingWorkspace" class="loading-state-small">Unterrichtsdaten werden geladen…</div>
        <div v-else-if="workspaceError" class="error-state">{{ workspaceError }}</div>
        <div v-else-if="currentOrNextLesson" class="focus-content">
          <p class="focus-meta">{{ currentOrNextMode }}</p>
          <h4>{{ getSubjectName(currentOrNextLesson.subjectId) }} · {{ getClassName(currentOrNextLesson.classGroupId) }}</h4>
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
            Danach: {{ getSubjectName(upcomingLesson.subjectId) }} · {{ getClassName(upcomingLesson.classGroupId) }} um {{ formatLessonTime(upcomingLesson.date) }}
          </p>
        </div>
        <div v-else class="empty-state">
          <p>Für heute ist noch keine Stunde hinterlegt.</p>
          <RouterLink to="/schedule" class="action-button action-button-inline">
            Stundenplan öffnen
          </RouterLink>
        </div>
      </section>

      <section class="card app-card focus-card">
        <h3>Unterricht</h3>
        <div class="card-links">
          <RouterLink v-for="link in instructionLinks" :key="link.to" :to="link.to" class="dashboard-link">
            <strong>{{ link.title }}</strong>
            <span>{{ link.description }}</span>
          </RouterLink>
        </div>
      </section>

      <section class="card app-card focus-card">
        <h3>Organisation</h3>
        <div class="card-links">
          <RouterLink v-for="link in organizationLinks" :key="link.to" :to="link.to" class="dashboard-link">
            <strong>{{ link.title }}</strong>
            <span>{{ link.description }}</span>
          </RouterLink>
        </div>
      </section>

      <section class="card app-card focus-card focus-card-wide">
        <div class="card-header">
          <h3>Heute</h3>
          <RouterLink to="/schedule" class="btn-text">Zum Stundenplan</RouterLink>
        </div>
        <div v-if="loadingWorkspace" class="loading-state-small">Unterrichtsdaten werden geladen…</div>
        <div v-else-if="workspaceError" class="error-state">{{ workspaceError }}</div>
        <div v-else-if="todayLessons.length === 0" class="empty-state">
          <p>Heute sind noch keine Stunden eingetragen.</p>
        </div>
        <div v-else class="lesson-timeline">
          <RouterLink
            v-for="lesson in todayLessons.slice(0, 4)"
            :key="lesson.id"
            :to="`/lessons/${lesson.id}/workspace`"
            class="lesson-timeline-item"
          >
            <strong>{{ getSubjectName(lesson.subjectId) }} · {{ getClassName(lesson.classGroupId) }}</strong>
            <span>{{ formatLessonTime(lesson.date) }}</span>
          </RouterLink>
        </div>
      </section>
    </div>
    
    <div class="dashboard-grid">
      <section class="card app-card classes-card">
        <div class="card-header">
          <h3>{{ t('KLASSEN.title') }}</h3>
          <Button icon="pi pi-plus" :label="t('KLASSEN.hinzu')" @click="showCreateModal = true" />
        </div>
        
        <!-- Search/Filter -->
        <div class="search-bar" v-if="classes.length > 0">
          <div class="search-controls">
            <InputText v-model="searchQuery" :placeholder="t('SEARCH.placeholder')" :aria-label="t('SEARCH.placeholder')" class="dashboard-search" />
            <Select v-model="filterSchoolYear" :options="schoolYearOptions" optionLabel="label" optionValue="value" aria-label="Schuljahr filtern" class="dashboard-school-year" />
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
            <Button :label="t('COMMON.retry') || 'Erneut versuchen'" @click="loadData" />
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
              <RouterLink
                :to="`/classes/${cls.id}`"
                class="class-card"
                @pointerenter="prefetchClassStudents(cls.id)"
                @pointerdown="prefetchClassStudents(cls.id)"
                @focus="prefetchClassStudents(cls.id)"
                @click="rememberClassForNavigation(cls)"
              >
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
                <Button icon="pi pi-pencil" severity="secondary" text rounded @click.stop="editClass(cls)" :title="t('CLASSES.edit')" :aria-label="t('CLASSES.edit')" />
                <Button
                  :icon="cls.archived ? 'pi pi-replay' : 'pi pi-box'"
                  severity="secondary"
                  text
                  rounded
                  @click.stop="toggleArchiveClass(cls)"
                  :title="cls.archived ? t('COMMON.unarchive') || 'Wiederherstellen' : t('COMMON.archive') || 'Archivieren'"
                  :aria-label="cls.archived ? t('COMMON.unarchive') || 'Wiederherstellen' : t('COMMON.archive') || 'Archivieren'"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  @click.stop="confirmDeleteClass(cls)"
                  :title="`Klasse ${cls.name} löschen`"
                  :aria-label="`Klasse ${cls.name} löschen`"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="card app-card">
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
      
      <section class="card app-card">
        <h3>Letzte Aktivitäten</h3>
        <div class="card-content">
          <!-- Loading State -->
          <div v-if="loadingWorkspace" class="loading-state-small">
            <div class="spinner-small"></div>
            <p>Wird geladen...</p>
          </div>
          
          <div v-else-if="workspaceError" class="error-state">{{ workspaceError }}</div>

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
    

    <!-- Create Class Dialog -->
    <Dialog :visible="showCreateModal" @update:visible="visible => { if (!visible) closeModal() }" modal :header="t('KLASSEN.hinzu')" :style="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }">
      <form @submit.prevent="handleCreateClass" class="modal-form">
        <div class="form-group">
          <label for="className">Klassenname *</label>
          <InputText id="className" v-model="newClass.name" placeholder="z.B. Klasse 9a Sport" required fluid />
        </div>
        <div class="form-group">
          <label for="schoolYear">Schuljahr *</label>
          <InputText id="schoolYear" v-model="newClass.schoolYear" placeholder="z.B. 2025/2026" pattern="\\d{4}/\\d{4}" required fluid />
          <small class="form-hint">Format: YYYY/YYYY</small>
        </div>
        <div class="form-group">
          <label for="gradeLevel">Klassenstufe</label>
          <InputNumber inputId="gradeLevel" :modelValue="newClass.gradeLevel" @update:modelValue="value => newClass.gradeLevel = value ?? undefined" :min="1" :max="13" :useGrouping="false" placeholder="z. B. 9" fluid />
        </div>
        <div class="form-group">
          <label for="gradingScheme">{{ t('KLASSEN.notenschema') }}</label>
          <Select inputId="gradingScheme" v-model="newClass.gradingScheme" :options="gradingSchemeOptions" optionLabel="label" optionValue="value" fluid />
        </div>
        <div class="form-group">
          <label for="classColor">{{ t('KLASSEN.color') || 'Klassenfarbe' }}</label>
          <Select inputId="classColor" v-model="newClass.color" :options="colorSelectOptions" optionLabel="label" optionValue="value" fluid />
        </div>
        <Message v-if="error" severity="error" role="alert">{{ error }}</Message>
        <div class="modal-actions">
          <Button type="button" severity="secondary" label="Abbrechen" @click="closeModal" />
          <Button type="submit" :label="creating ? t('COMMON.loading') : t('KLASSEN.button-hinzufuegen')" :loading="creating" :disabled="creating" />
        </div>
      </form>
    </Dialog>

    <!-- Edit Class Dialog -->
    <Dialog :visible="showEditModal" @update:visible="visible => { if (!visible) closeEditModal() }" modal header="Klasse bearbeiten" :style="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }">
      <form @submit.prevent="handleUpdateClass" class="modal-form">
        <div class="form-group">
          <label for="editClassName">Klassenname *</label>
          <InputText id="editClassName" v-model="editClassData.name" required fluid />
        </div>
        <div class="form-group">
          <label for="editSchoolYear">Schuljahr *</label>
          <InputText id="editSchoolYear" v-model="editClassData.schoolYear" pattern="\\d{4}/\\d{4}" required fluid />
          <small class="form-hint">Format: YYYY/YYYY</small>
        </div>
        <div class="form-group">
          <label for="editGradeLevel">Klassenstufe</label>
          <InputNumber inputId="editGradeLevel" :modelValue="editClassData.gradeLevel" @update:modelValue="value => editClassData.gradeLevel = value ?? undefined" :min="1" :max="13" :useGrouping="false" placeholder="z. B. 9" fluid />
        </div>
        <div class="form-group">
          <label for="editGradingScheme">Notenschema</label>
          <Select inputId="editGradingScheme" v-model="editClassData.gradingScheme" :options="gradingSchemeOptions" optionLabel="label" optionValue="value" fluid />
        </div>
        <div class="form-group">
          <label for="editClassColor">Klassenfarbe</label>
          <Select inputId="editClassColor" v-model="editClassData.color" :options="colorSelectOptions" optionLabel="label" optionValue="value" fluid />
        </div>
        <Message v-if="editError" severity="error" role="alert">{{ editError }}</Message>
        <div class="modal-actions">
          <Button type="button" severity="secondary" label="Abbrechen" @click="closeEditModal" />
          <Button type="submit" :label="updating ? 'Wird aktualisiert...' : 'Klasse aktualisieren'" :loading="updating" :disabled="updating" />
        </div>
      </form>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog :visible="showDeleteModal" @update:visible="visible => { if (!visible) closeDeleteModal() }" modal header="Klasse löschen" :style="{ width: '28rem', maxWidth: 'calc(100vw - 2rem)' }">
      <div class="modal-content">
        <p>Möchten Sie <strong>{{ classToDelete?.name }}</strong> wirklich löschen?</p>
        <p class="warning-text">Diese Aktion kann nicht rückgängig gemacht werden.</p>
        <Message v-if="deleteError" severity="error" role="alert">{{ deleteError }}</Message>
        <div class="modal-actions">
          <Button type="button" severity="secondary" label="Abbrechen" @click="closeDeleteModal" />
          <Button severity="danger" :label="deleting ? 'Wird gelöscht...' : 'Klasse löschen'" :loading="deleting" :disabled="deleting" @click="handleDeleteClass" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import Button from 'openvue/button'
import Dialog from 'openvue/dialog'
import InputNumber from 'openvue/inputnumber'
import InputText from 'openvue/inputtext'
import Message from 'openvue/message'
import Select from 'openvue/select'
import { RouterLink } from 'vue-router'
import { useDashboardView } from '../composables/useDashboardView'
import { prefetchClassStudents, rememberClassForNavigation, scheduleViewPrefetch } from '../services/navigation-prefetch'

const {
  t,
  classes,
  recentActivity,
  loading,
  loadError,
  loadingWorkspace,
  workspaceError,
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
  getSubjectName,
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

const schoolYearOptions = computed(() => [
  { label: `${t('KLASSEN.schuljahr')}: ${t('COMMON.alle') || 'Alle'}`, value: '' },
  ...schoolYears.value.map(year => ({ label: year, value: year }))
])
const gradingSchemeOptions = Object.entries(gradingSchemes).map(([value, label]) => ({ value, label }))
const colorSelectOptions = [{ value: '', label: 'Keine' }, ...classColorOptions]

let cancelViewPrefetch: (() => void) | null = null
watch(loading, isLoading => {
  if (!isLoading && !cancelViewPrefetch) {
    cancelViewPrefetch = scheduleViewPrefetch(() => import('./ClassDetail.vue'))
  }
}, { immediate: true })

onUnmounted(() => {
  cancelViewPrefetch?.()
})
</script>

<style scoped src="./Dashboard.style2.css"></style>
