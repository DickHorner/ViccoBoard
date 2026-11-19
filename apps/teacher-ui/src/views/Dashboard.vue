<template>
  <section class="dashboard-view">
    <header class="dashboard-header">
      <div>
        <h1>Dashboard</h1>
        <p>Stunden, Unterricht und Organisation auf einen Blick.</p>
      </div>
      <Button
        label="Anpassen"
        icon="pi pi-cog"
        size="small"
        severity="secondary"
        outlined
        @click="preferencesOpen = true"
      />
    </header>

    <div class="dashboard-grid">
      <Panel v-if="panelIsVisible('next')" header="Jetzt / Als Nächstes">
        <Message v-if="workspaceError" severity="warn">{{ workspaceError }}</Message>
        <p v-else-if="loadingWorkspace">Unterrichtsdaten werden geladen…</p>
        <div v-else-if="currentOrNextLesson" class="dashboard-stack">
          <span>{{ currentOrNextMode }}</span>
          <strong>{{ getSubjectName(currentOrNextLesson.subjectId) }} · {{ getClassName(currentOrNextLesson.classGroupId) }}</strong>
          <span>{{ formatLessonDateTime(currentOrNextLesson.date) }}</span>
          <div class="app-actions-row">
            <Button as="router-link" :to="`/lessons/${currentOrNextLesson.id}/workspace`" label="Arbeitsbereich" size="small" severity="secondary" outlined />
            <Button as="router-link" :to="`/attendance?classId=${currentOrNextLesson.classGroupId}&lessonId=${currentOrNextLesson.id}`" label="Anwesenheit" size="small" severity="secondary" outlined />
          </div>
          <small v-if="upcomingLesson">
            Danach: {{ getSubjectName(upcomingLesson.subjectId) }} · {{ getClassName(upcomingLesson.classGroupId) }} um {{ formatLessonTime(upcomingLesson.date) }}
          </small>
        </div>
        <div v-else class="dashboard-stack">
          <span>Für heute ist noch keine Stunde hinterlegt.</span>
          <div class="app-actions-row">
            <Button as="router-link" to="/schedule" label="Stundenplan" size="small" severity="secondary" outlined />
          </div>
        </div>
      </Panel>

      <Panel v-if="panelIsVisible('teaching')" header="Unterricht">
        <div class="app-actions-row">
          <Button
            v-for="link in linksFor('teaching')"
            :key="link.to"
            as="router-link"
            :to="link.to"
            :label="link.label"
            severity="secondary"
            outlined
            size="small"
          />
        </div>
        <p v-if="linksFor('teaching').length === 0">Keine Einträge ausgewählt.</p>
      </Panel>

      <Panel v-if="panelIsVisible('organization')" header="Organisation">
        <div class="app-actions-row">
          <Button
            v-for="link in linksFor('organization')"
            :key="link.to"
            as="router-link"
            :to="link.to"
            :label="link.label"
            severity="secondary"
            outlined
            size="small"
          />
        </div>
        <p v-if="linksFor('organization').length === 0">Keine Einträge ausgewählt.</p>
      </Panel>

      <Panel v-if="panelIsVisible('shortcuts')" header="Schnellzugriffe">
        <div class="app-actions-row">
          <Button
            v-for="link in linksFor('shortcuts')"
            :key="link.to"
            as="router-link"
            :to="link.to"
            :label="link.label"
            severity="secondary"
            outlined
            size="small"
          />
        </div>
        <p v-if="linksFor('shortcuts').length === 0">Keine Einträge ausgewählt.</p>
      </Panel>

      <Panel v-if="panelIsVisible('today')" header="Heute" class="dashboard-wide">
        <Message v-if="workspaceError" severity="warn">{{ workspaceError }}</Message>
        <p v-else-if="loadingWorkspace">Unterrichtsdaten werden geladen…</p>
        <p v-else-if="todayLessons.length === 0">Heute sind noch keine Stunden eingetragen.</p>
        <ul v-else class="dashboard-list">
          <li v-for="lesson in todayLessons.slice(0, 4)" :key="lesson.id">
            <Button
              as="router-link"
              :to="`/lessons/${lesson.id}/workspace`"
              :label="`${getSubjectName(lesson.subjectId)} · ${getClassName(lesson.classGroupId)}`"
              size="small"
              severity="secondary"
              text
            />
            <span>{{ formatLessonTime(lesson.date) }}</span>
          </li>
        </ul>
        <Button as="router-link" to="/schedule" label="Zum Stundenplan" size="small" severity="secondary" text />
      </Panel>

      <Panel v-if="panelIsVisible('activity')" header="Letzte Aktivitäten" class="dashboard-wide">
        <Message v-if="workspaceError" severity="warn">{{ workspaceError }}</Message>
        <p v-else-if="loadingWorkspace">Aktivitäten werden geladen…</p>
        <p v-else-if="recentActivity.length === 0">Keine Aktivitäten vorhanden.</p>
        <ul v-else class="dashboard-list">
          <li v-for="activity in recentActivity" :key="activity.id">
            <span>Anwesenheit erfasst</span>
            <small>{{ formatDate(activity.timestamp) }}</small>
          </li>
        </ul>
      </Panel>
    </div>

    <Dialog v-model:visible="preferencesOpen" header="Dashboard anpassen" modal :style="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }">
      <div class="app-form-grid">
        <div class="app-field">
          <label>Sichtbare Bereiche</label>
          <div class="dashboard-option-list">
            <label v-for="panel in dashboardPanels" :key="panel.id">
              <Checkbox v-model="preferences.panels" :inputId="`dashboard-${panel.id}`" :value="panel.id" />
              {{ panel.label }}
            </label>
          </div>
        </div>
        <div v-for="group in configurableGroups" :key="group.id" class="app-field">
          <label :for="`dashboard-links-${group.id}`">{{ group.label }}</label>
          <MultiSelect
            :id="`dashboard-links-${group.id}`"
            v-model="preferences.links[group.id]"
            :options="availableLinks"
            optionLabel="label"
            optionValue="to"
            filter
            display="chip"
            :maxSelectedLabels="2"
            fluid
            placeholder="Einträge auswählen"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Zurücksetzen" size="small" severity="secondary" text @click="resetPreferences" />
        <Button label="Fertig" size="small" @click="preferencesOpen = false" />
      </template>
    </Dialog>

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
          <Button size="small" type="button" severity="secondary" label="Abbrechen" @click="closeModal" />
          <Button size="small" type="submit" :label="creating ? t('COMMON.loading') : t('KLASSEN.button-hinzufuegen')" :loading="creating" :disabled="creating" />
        </div>
      </form>
    </Dialog>


  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'openvue/button'
import Checkbox from 'openvue/checkbox'
import Dialog from 'openvue/dialog'
import InputNumber from 'openvue/inputnumber'
import InputText from 'openvue/inputtext'
import Message from 'openvue/message'
import MultiSelect from 'openvue/multiselect'
import Panel from 'openvue/panel'
import Select from 'openvue/select'
import router from '../router'
import { useDashboardView } from '../composables/useDashboardView'
import {
  dashboardPanels,
  defaultDashboardPreferences,
  normalizeDashboardPreferences,
  type DashboardLinkGroup,
  type DashboardPanelId
} from '../utils/dashboard-preferences'

const {
  t,
  recentActivity,
  loadingWorkspace,
  workspaceError,
  showCreateModal,
  creating,
  error,
  newClass,
  gradingSchemes,
  classColorOptions,
  todayLessons,
  currentOrNextLesson,
  upcomingLesson,
  currentOrNextMode,
  getClassName,
  getSubjectName,
  formatLessonTime,
  formatLessonDateTime,
  handleCreateClass,
  closeModal,
  formatDate
} = useDashboardView()

const route = useRoute()
const preferencesOpen = ref(false)
const configurableGroups: { id: DashboardLinkGroup; label: string }[] = [
  { id: 'teaching', label: 'Unterricht' },
  { id: 'organization', label: 'Organisation' },
  { id: 'shortcuts', label: 'Schnellzugriffe' }
]

interface DashboardLink {
  to: string
  label: string
}

const availableLinks: DashboardLink[] = [
  { to: '/?createClass=1', label: 'Neue Klasse' },
  ...router.getRoutes()
    .filter(record => !record.path.includes(':') && record.path !== '/' && record.path !== '/dashboard' && typeof record.meta.title === 'string')
    .map(record => ({ to: record.path, label: record.meta.title as string }))
]

const linkByPath = new Map(availableLinks.map(link => [link.to, link]))
const preferenceKey = 'viccoboard-dashboard-widgets'
const legacyKey = 'viccoboard-dashboard-panels'

const readPreferences = () => {
  try {
    const stored = window.localStorage.getItem(preferenceKey)
    if (stored !== null) return normalizeDashboardPreferences(JSON.parse(stored), new Set(linkByPath.keys()))
    const legacy = window.localStorage.getItem(legacyKey)
    if (legacy !== null) return normalizeDashboardPreferences({ panels: JSON.parse(legacy) }, new Set(linkByPath.keys()))
  } catch (error) {
    console.warn('Dashboard-Einstellungen können nicht gelesen werden:', error)
  }
  return normalizeDashboardPreferences(null, new Set(linkByPath.keys()))
}

const preferences = ref(readPreferences())
const panelIsVisible = (id: DashboardPanelId) => preferences.value.panels.includes(id)
const linksFor = (group: DashboardLinkGroup): DashboardLink[] =>
  preferences.value.links[group]
    .map(path => linkByPath.get(path))
    .filter((link): link is DashboardLink => link !== undefined)

const resetPreferences = () => {
  preferences.value = normalizeDashboardPreferences(defaultDashboardPreferences, new Set(linkByPath.keys()))
}

watch(preferences, value => {
  try {
    window.localStorage.setItem(preferenceKey, JSON.stringify(value))
  } catch (error) {
    console.warn('Dashboard-Einstellungen können nicht gespeichert werden:', error)
  }
}, { deep: true })

watch(() => route.query.createClass, value => {
  if (value === '1') showCreateModal.value = true
}, { immediate: true })

watch(showCreateModal, isOpen => {
  if (isOpen || route.query.createClass !== '1') return
  const { createClass: _createClass, ...query } = route.query
  void router.replace({ path: '/', query })
})

const gradingSchemeOptions = Object.entries(gradingSchemes).map(([value, label]) => ({ value, label }))
const colorSelectOptions = [{ value: '', label: 'Keine' }, ...classColorOptions]
</script>

<style scoped src="./Dashboard.style2.css"></style>
