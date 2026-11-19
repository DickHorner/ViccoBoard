<template>
  <section class="app-form-grid">
    <header class="app-actions-row">
      <h1>Klassen</h1>
      <Button
        as="router-link"
        to="/?createClass=1"
        label="Neue Klasse"
        icon="pi pi-plus"
        size="small"
      />
    </header>

    <Panel header="Klassenverwaltung">
      <div class="app-form-grid">
        <div class="app-actions-row">
          <InputText
            v-model="searchQuery"
            type="search"
            aria-label="Klasse oder Schuljahr suchen"
            placeholder="Klasse oder Schuljahr suchen"
          />
          <label class="app-actions-row" for="archived-classes">
            <Checkbox v-model="showArchived" inputId="archived-classes" binary />
            Archivierte anzeigen
          </label>
          <span class="app-data-note">{{ visibleClasses.length }} Klassen sichtbar</span>
        </div>

        <Message v-if="loadError" severity="error" role="alert">{{ loadError }}</Message>
        <Button v-if="loadError" label="Erneut versuchen" size="small" severity="secondary" outlined @click="loadData" />
        <Message v-if="metricsError" severity="warn" role="status">{{ metricsError }}</Message>
        <Message v-if="classActionError && !deleteDialogOpen" severity="error" role="alert">{{ classActionError }}</Message>

        <DataTable
          v-if="!loadError"
          :value="visibleClasses"
          :loading="loading"
          size="small"
          paginator
          :rows="10"
          stripedRows
        >
          <template #empty>Keine Klassen gefunden.</template>
          <Column field="classGroup.name" header="Klasse" sortable>
            <template #body="{ data }">
              <Button
                as="router-link"
                :to="`/classes/${data.classGroup.id}`"
                :label="data.classGroup.name"
                severity="secondary"
                text
                size="small"
                @pointerenter="prefetchClassStudents(data.classGroup.id)"
                @pointerdown="prefetchClassStudents(data.classGroup.id)"
                @focus="prefetchClassStudents(data.classGroup.id)"
                @click="rememberClassForNavigation(data.classGroup)"
              />
            </template>
          </Column>
          <Column field="classGroup.schoolYear" header="Schuljahr" sortable />
          <Column field="studentCount" header="Schüler" sortable>
            <template #body="{ data }">{{ data.studentCount === null ? '…' : data.studentCount ?? '–' }}</template>
          </Column>
          <Column field="lessonCount" header="Stunden" sortable>
            <template #body="{ data }">{{ data.lessonCount === null ? '…' : data.lessonCount ?? '–' }}</template>
          </Column>
          <Column header="Status">
            <template #body="{ data }">
              <Tag :value="data.classGroup.archived ? 'Archiviert' : 'Aktiv'" :severity="data.classGroup.archived ? 'secondary' : 'success'" />
            </template>
          </Column>
          <Column header="Aktionen">
            <template #body="{ data }">
              <div class="app-actions-row">
                <Button as="router-link" :to="`/lessons?classId=${data.classGroup.id}`" icon="pi pi-calendar" severity="secondary" text size="small" aria-label="Stunden öffnen" title="Stunden öffnen" />
                <Button as="router-link" :to="`/attendance?classId=${data.classGroup.id}`" icon="pi pi-check-square" severity="secondary" text size="small" aria-label="Anwesenheit öffnen" title="Anwesenheit öffnen" />
                <Button
                  :icon="data.classGroup.archived ? 'pi pi-replay' : 'pi pi-box'"
                  severity="secondary"
                  text
                  size="small"
                  :disabled="busyClassId !== null"
                  :aria-label="data.classGroup.archived ? 'Klasse wiederherstellen' : 'Klasse archivieren'"
                  :title="data.classGroup.archived ? 'Klasse wiederherstellen' : 'Klasse archivieren'"
                  @click="toggleArchiveClass(data.classGroup)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  size="small"
                  :disabled="busyClassId !== null"
                  :aria-label="`Klasse ${data.classGroup.name} löschen`"
                  @click="confirmDeleteClass(data.classGroup)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </Panel>

    <Dialog v-model:visible="deleteDialogOpen" modal header="Klasse löschen" :style="{ width: '28rem', maxWidth: 'calc(100vw - 2rem)' }">
      <p>Klasse <strong>{{ classToDelete?.name }}</strong> wirklich löschen? Das kann nicht rückgängig gemacht werden.</p>
      <Message v-if="classActionError" severity="error" role="alert">{{ classActionError }}</Message>
      <template #footer>
        <Button label="Abbrechen" severity="secondary" size="small" :disabled="busyClassId !== null" @click="deleteDialogOpen = false" />
        <Button label="Löschen" severity="danger" size="small" :loading="busyClassId !== null" :disabled="busyClassId !== null" @click="deleteClass" />
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import Button from 'openvue/button'
import Checkbox from 'openvue/checkbox'
import Column from 'openvue/column'
import DataTable from 'openvue/datatable'
import Dialog from 'openvue/dialog'
import Panel from 'openvue/panel'
import InputText from 'openvue/inputtext'
import Message from 'openvue/message'
import Tag from 'openvue/tag'
import { useClassGroups, useLessons } from '../composables/useSportBridge'
import { useStudents } from '../composables/useStudentsBridge'
import type { ClassGroup } from '@viccoboard/core'
import { prefetchClassStudents, rememberClassForNavigation, scheduleViewPrefetch } from '../services/navigation-prefetch'
import { recordRouteContentReady } from '../utils/navigation-performance'

interface ClassOverviewEntry {
  classGroup: ClassGroup
  studentCount: number | null | undefined
  lessonCount: number | null | undefined
}

const classGroups = useClassGroups()
const lessonsRepository = useLessons()
const { repository: studentRepository } = useStudents()

const loading = ref(true)
const loadError = ref('')
const metricsError = ref('')
let cancelViewPrefetch: (() => void) | null = null
const searchQuery = ref('')
const showArchived = ref(false)
const classes = ref<ClassOverviewEntry[]>([])
const busyClassId = ref<string | null>(null)
const classActionError = ref('')
const classToDelete = ref<ClassGroup | null>(null)
const deleteDialogOpen = ref(false)

const visibleClasses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return classes.value.filter((entry) => {
    if (entry.classGroup.archived && !showArchived.value) return false
    if (!query) {
      return true
    }

    return entry.classGroup.name.toLowerCase().includes(query)
      || entry.classGroup.schoolYear.toLowerCase().includes(query)
  })
})

const loadData = async () => {
  loading.value = true
  loadError.value = ''
  metricsError.value = ''

  try {
    const allClasses = await classGroups.findAll()
    classes.value = allClasses.map(classGroup => ({
      classGroup,
      studentCount: null,
      lessonCount: null
    }))
  } catch (error) {
    console.error('Failed to load class overview:', error)
    loadError.value = 'Die Klassenübersicht konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }

  if (loadError.value) return

  await nextTick()
  recordRouteContentReady('classes')
  cancelViewPrefetch = scheduleViewPrefetch(() => import('./ClassDetail.vue'))

  void Promise.all(classes.value.map(async entry => {
    const classId = entry.classGroup.id
    const [students, lessons] = await Promise.allSettled([
      studentRepository.value?.countByClassGroup(classId) ?? Promise.resolve(0),
      lessonsRepository.count({ class_group_id: classId })
    ])

    entry.studentCount = students.status === 'fulfilled' ? students.value : undefined
    entry.lessonCount = lessons.status === 'fulfilled' ? lessons.value : undefined

    if (students.status === 'rejected' || lessons.status === 'rejected') {
      metricsError.value = 'Einige Klassenzahlen konnten nicht geladen werden.'
      console.error('Failed to load class counts:', classId, students, lessons)
    }
  }))
}

const toggleArchiveClass = async (classGroup: ClassGroup) => {
  if (busyClassId.value) return
  busyClassId.value = classGroup.id
  classActionError.value = ''
  try {
    await classGroups.update(classGroup.id, { archived: !classGroup.archived })
    await loadData()
  } catch (error) {
    console.error('Failed to toggle class archive:', error)
    classActionError.value = 'Der Klassenstatus konnte nicht geändert werden.'
  } finally {
    busyClassId.value = null
  }
}

const confirmDeleteClass = (classGroup: ClassGroup) => {
  classToDelete.value = classGroup
  deleteDialogOpen.value = true
  classActionError.value = ''
}

const deleteClass = async () => {
  const selected = classToDelete.value
  if (!selected || busyClassId.value) return
  busyClassId.value = selected.id
  classActionError.value = ''
  try {
    await classGroups.delete(selected.id)
    deleteDialogOpen.value = false
    classToDelete.value = null
    await loadData()
  } catch (error) {
    console.error('Failed to delete class:', error)
    classActionError.value = 'Die Klasse konnte nicht gelöscht werden.'
  } finally {
    busyClassId.value = null
  }
}

onMounted(() => {
  void loadData()
})

onUnmounted(() => {
  cancelViewPrefetch?.()
})
</script>
