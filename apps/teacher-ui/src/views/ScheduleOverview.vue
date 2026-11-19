<template>
  <section class="schedule-overview">
    <header class="schedule-header">
      <div>
        <p class="schedule-eyebrow">Unterricht</p>
        <h1>Stundenplan</h1>
        <p class="app-section-copy">Wochennahe Übersicht der vorhandenen Unterrichtsstunden.</p>
      </div>
      <div class="app-actions-row schedule-header-actions">
        <Button label="Fach anlegen" icon="pi pi-plus" severity="secondary" outlined @click="showSubjectForm = true" />
        <Button label="Stunden verwalten" icon="pi pi-calendar" @click="router.push('/lessons')" />
      </div>
    </header>

    <div v-if="loading" class="app-card app-status-panel" role="status">Stunden werden geladen…</div>
    <div v-else-if="loadError" class="app-card app-status-panel">
      <Message severity="error" role="alert">{{ loadError }}</Message>
      <Button label="Erneut versuchen" icon="pi pi-refresh" @click="loadData" />
    </div>
    <template v-else>
      <div class="schedule-focus-grid">
        <section class="app-card schedule-panel">
          <h2 class="app-section-title">Jetzt / Als Nächstes</h2>
          <div v-if="currentOrNextLesson" class="schedule-focus">
            <Tag :value="currentOrNextMode" severity="info" />
            <h3>{{ getLessonTitle(currentOrNextLesson) }}</h3>
            <p>{{ getSubjectName(currentOrNextLesson.subjectId) }} · {{ getClassName(currentOrNextLesson.classGroupId) }}</p>
            <p class="app-section-copy">{{ formatLessonDateTime(currentOrNextLesson) }}</p>
            <div class="app-actions-row">
              <Button label="Arbeitsbereich öffnen" icon="pi pi-arrow-right" severity="secondary" outlined @click="router.push(getLessonWorkspaceUrl(currentOrNextLesson))" />
              <Button label="Anwesenheit" icon="pi pi-check-square" @click="router.push(getAttendanceUrl(currentOrNextLesson))" />
            </div>
          </div>
          <p v-else class="app-section-copy">Heute sind noch keine Stunden eingetragen.</p>
        </section>

        <section class="app-card schedule-panel">
          <h2 class="app-section-title">Danach</h2>
          <div v-if="upcomingLesson" class="schedule-upcoming">
            <strong>{{ getLessonTitle(upcomingLesson) }}</strong>
            <p>{{ getSubjectName(upcomingLesson.subjectId) }} · {{ getClassName(upcomingLesson.classGroupId) }}</p>
            <p class="app-section-copy">{{ formatLessonDateTime(upcomingLesson) }}</p>
            <RouterLink :to="getLessonWorkspaceUrl(upcomingLesson)" class="schedule-text-link">Stunde öffnen</RouterLink>
          </div>
          <p v-else class="app-section-copy">Keine weitere Stunde für heute gefunden.</p>
        </section>
      </div>

      <section class="app-card schedule-panel">
        <div class="schedule-heading">
          <div>
            <h2 class="app-section-title">Nächste 7 Tage</h2>
            <p class="app-section-copy">Gruppiert nach Kalendertag, sortiert nach Startzeit.</p>
          </div>
          <Tag :value="scheduledLessonCount + ' Einträge'" severity="secondary" />
        </div>

        <div class="schedule-days">
          <section
            v-for="day in scheduleDays"
            :key="day.key"
            class="schedule-day"
            :class="{ 'schedule-day-today': day.isToday }"
          >
            <header class="schedule-day-header">
              <div>
                <h3>{{ day.weekday }} · {{ day.label }}</h3>
                <Tag v-if="day.isToday" value="Heute" severity="info" />
              </div>
              <Tag :value="day.lessons.length + ' Stunden'" severity="secondary" />
            </header>

            <div v-if="day.markers.length" class="schedule-markers">
              <Tag
                v-for="marker in day.markers"
                :key="day.key + '-' + marker.type + '-' + marker.label"
                :value="marker.label"
                :severity="marker.type === 'holiday' ? 'danger' : 'info'"
              />
            </div>

            <p v-if="day.lessons.length === 0" class="app-section-copy">Keine Stunden eingetragen.</p>
            <div v-else class="schedule-lessons">
              <RouterLink
                v-for="lesson in day.lessons"
                :key="lesson.id"
                :to="getLessonWorkspaceUrl(lesson)"
                class="schedule-lesson-link"
              >
                <time>{{ formatLessonTime(lesson) }}</time>
                <div>
                  <strong>{{ getLessonTitle(lesson) }}</strong>
                  <p>{{ getSubjectName(lesson.subjectId) }} · {{ getClassName(lesson.classGroupId) }}{{ getLessonMeta(lesson) }}</p>
                  <small v-if="getLessonHourSlotLabel(lesson)">{{ getLessonHourSlotLabel(lesson) }}</small>
                </div>
                <i class="pi pi-chevron-right" aria-hidden="true"></i>
              </RouterLink>
            </div>
          </section>
        </div>
      </section>
    </template>

    <Dialog
      :visible="showSubjectForm"
      modal
      header="Fach anlegen"
      :closable="!creatingSubject"
      :style="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }"
      @update:visible="visible => { if (!visible && !creatingSubject) closeSubjectForm() }"
    >
      <form class="schedule-subject-form" @submit.prevent="handleCreateSubject">
        <p class="app-section-copy">
          Fächer gelten klassenübergreifend und können anschließend Stunden oder Sequenzen zugeordnet werden.
        </p>
        <div class="app-field">
          <label for="schedule-subject-name">Fachname *</label>
          <InputText
            id="schedule-subject-name"
            v-model="newSubjectName"
            placeholder="Fachname"
            autocomplete="off"
            required
            fluid
          />
        </div>
        <div class="app-field">
          <label for="schedule-subject-profile">Arbeitsbereich</label>
          <Select
            inputId="schedule-subject-profile"
            v-model="newSubjectProfile"
            :options="subjectProfileOptions"
            optionLabel="label"
            optionValue="value"
            fluid
          />
        </div>
        <div v-if="subjects.length" class="schedule-subject-list">
          <span class="app-data-note">Bestehende Fächer</span>
          <div class="app-chip-row">
            <Tag v-for="subject in subjects" :key="subject.id" :value="subject.name" severity="secondary" />
          </div>
        </div>
        <Message v-if="subjectError" severity="error" role="alert">{{ subjectError }}</Message>
        <div class="app-actions-row schedule-dialog-actions">
          <Button type="button" label="Abbrechen" severity="secondary" :disabled="creatingSubject" @click="closeSubjectForm" />
          <Button
            type="submit"
            label="Fach anlegen"
            icon="pi pi-plus"
            :loading="creatingSubject"
            :disabled="creatingSubject || !newSubjectName.trim()"
          />
        </div>
      </form>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Button from 'openvue/button'
import Dialog from 'openvue/dialog'
import InputText from 'openvue/inputtext'
import Message from 'openvue/message'
import Select from 'openvue/select'
import Tag from 'openvue/tag'
import { useClassGroups, useLessons, useSubjects } from '../composables/useSportBridge'
import { getDashboardLessonState } from '../utils/dashboard-workspace'
import type { ClassGroup, Lesson, Subject, SubjectWorkspaceProfile } from '@viccoboard/core'
import { formatGermanDateTime, formatGermanTime } from '../utils/locale-format'
import {
  getScheduleCalendarMarkers,
  type ResolvedScheduleCalendarMarker
} from '../utils/schedule-calendar-markers'
import { getScheduleHourSlot } from './schedule-hour-grid'
import { recordRouteContentReady } from '../utils/navigation-performance'

interface ScheduleDay {
  key: string
  label: string
  weekday: string
  isToday: boolean
  lessons: Lesson[]
  markers: ResolvedScheduleCalendarMarker[]
}

const router = useRouter()
const classGroups = useClassGroups()
const subjectsRepository = useSubjects()
const lessonsRepository = useLessons()

const loading = ref(true)
const loadError = ref('')
const classes = ref<ClassGroup[]>([])
const subjects = ref<Subject[]>([])
const lessons = ref<Lesson[]>([])
const showSubjectForm = ref(false)
const newSubjectName = ref('')
const newSubjectProfile = ref<SubjectWorkspaceProfile>('generic')
const creatingSubject = ref(false)
const subjectError = ref('')
const subjectProfileOptions: Array<{ label: string; value: SubjectWorkspaceProfile }> = [
  { label: 'Allgemein', value: 'generic' },
  { label: 'Sport-Arbeitsbereich', value: 'sport' },
  { label: 'KBR-Arbeitsbereich', value: 'kbr' }
]
const now = ref(Date.now())

const classesById = computed(() => new Map(classes.value.map((classGroup) => [classGroup.id, classGroup])))
const subjectsById = computed(() => new Map(subjects.value.map((subject) => [subject.id, subject])))

const activeStates = computed(() =>
  Array.from(new Set(classes.value.map((classGroup) => normalizeState(classGroup.state)).filter(Boolean)))
)

const lessonState = computed(() => getDashboardLessonState(lessons.value, new Date(now.value)))
const currentOrNextLesson = computed(() => lessonState.value.currentOrNextLesson)
const upcomingLesson = computed(() => lessonState.value.upcomingLesson)

const scheduleDays = computed<ScheduleDay[]>(() => {
  const today = startOfDay(new Date(now.value))
  const grouped = new Map<string, Lesson[]>()

  for (const lesson of lessons.value) {
    const key = getDateKey(lesson.date)
    const dayLessons = grouped.get(key) ?? []
    dayLessons.push(lesson)
    grouped.set(key, dayLessons)
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    const key = getDateKey(date)
    const dayLessons = grouped.get(key) ?? []

    return {
      key,
      label: date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' }),
      weekday: date.toLocaleDateString('de-DE', { weekday: 'long' }),
      isToday: index === 0,
      lessons: [...dayLessons].sort(compareLessonsByStartTime),
      markers: getScheduleCalendarMarkers(key, activeStates.value)
    }
  })
})

const scheduledLessonCount = computed(() =>
  scheduleDays.value.reduce((count, day) => count + day.lessons.length, 0)
)

const currentOrNextMode = computed(() => {
  if (!currentOrNextLesson.value) {
    return 'Heute'
  }

  return currentOrNextLesson.value.date.getTime() >= now.value ? 'Als Nächstes' : 'Zuletzt heute'
})

const loadData = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const [loadedClasses, loadedSubjects] = await Promise.all([
      classGroups.findAll(),
      subjectsRepository.findAll()
    ])
    classes.value = loadedClasses
    subjects.value = loadedSubjects.sort((left, right) => left.name.localeCompare(right.name, 'de-DE'))

    const today = startOfDay(new Date())
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 7)

    const allLessons = await Promise.all(
      loadedClasses.map((classGroup) => {
        if (typeof lessonsRepository.findByDateRange === 'function') {
          return lessonsRepository.findByDateRange(classGroup.id, today, endDate)
        }
        return lessonsRepository.findByClassGroup(classGroup.id)
      })
    )

    lessons.value = allLessons.flat()
  } catch (error) {
    console.error('Failed to load schedule overview:', error)
    loadError.value = 'Die Stundenplanansicht konnte nicht geladen werden.'
  } finally {
    loading.value = false
  }
  if (!loadError.value) {
    await nextTick()
    recordRouteContentReady('schedule')
  }
}

const getClassName = (classGroupId: string): string =>
  classesById.value.get(classGroupId)?.name ?? 'Unbekannte Klasse'

const getSubjectName = (subjectId: string): string =>
  subjectsById.value.get(subjectId)?.name ?? 'Unzugeordnet'

const getLessonTitle = (lesson: Lesson): string =>
  lesson.title?.trim() || getSubjectName(lesson.subjectId)

const getLessonMeta = (lesson: Lesson): string => {
  const meta: string[] = []
  if (lesson.durationMinutes) {
    meta.push(String(lesson.durationMinutes) + ' min')
  }
  if (lesson.room) {
    meta.push(lesson.room)
  }
  return meta.length > 0 ? ' · ' + meta.join(' · ') : ''
}

const getLessonWorkspaceUrl = (lesson: Lesson): string =>
  '/lessons/' + lesson.id + '/workspace'

const getAttendanceUrl = (lesson: Lesson): string =>
  '/attendance?classId=' + lesson.classGroupId + '&lessonId=' + lesson.id

const closeSubjectForm = () => {
  showSubjectForm.value = false
  newSubjectName.value = ''
  newSubjectProfile.value = 'generic'
  subjectError.value = ''
}

const handleCreateSubject = async () => {
  subjectError.value = ''
  if (!newSubjectName.value.trim()) {
    subjectError.value = 'Bitte einen Fachnamen eingeben.'
    return
  }
  creatingSubject.value = true

  try {
    await subjectsRepository.create({
      name: newSubjectName.value.trim(),
      workspaceProfile: newSubjectProfile.value
    })
    subjects.value = (await subjectsRepository.findAll())
      .sort((left, right) => left.name.localeCompare(right.name, 'de-DE'))
    closeSubjectForm()
  } catch (error) {
    subjectError.value = error instanceof Error ? error.message : 'Fach konnte nicht angelegt werden.'
  } finally {
    creatingSubject.value = false
  }
}

const getLessonHourSlotLabel = (lesson: Lesson): string =>
  getScheduleHourSlot(lesson.startTime, lesson.durationMinutes)?.label ?? ''

const formatLessonTime = (lesson: Lesson): string =>
  lesson.startTime || formatGermanTime(lesson.date)

const formatLessonDateTime = (lesson: Lesson): string =>
  formatGermanDateTime(lesson.date, { weekday: 'short' }) + ' · ' + formatLessonTime(lesson)

const compareLessonsByStartTime = (left: Lesson, right: Lesson): number =>
  getLessonStartMinutes(left) - getLessonStartMinutes(right)

const getLessonStartMinutes = (lesson: Lesson): number => {
  const parsed = parseTimeToMinutes(lesson.startTime)
  if (parsed !== null) {
    return parsed
  }

  return lesson.date.getHours() * 60 + lesson.date.getMinutes()
}

const parseTimeToMinutes = (time: string | undefined): number | null => {
  if (!time) {
    return null
  }

  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    return null
  }

  return hours * 60 + minutes
}

const startOfDay = (date: Date): Date => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const getDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

const normalizeState = (state: string | undefined): string => {
  if (!state) {
    return ''
  }

  const normalized = state.trim().toUpperCase()
  if (normalized === 'BERLIN') {
    return 'BE'
  }
  if (normalized === 'BRANDENBURG') {
    return 'BB'
  }
  return normalized
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.schedule-overview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.schedule-header,
.schedule-heading,
.schedule-day-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.schedule-header h1,
.schedule-day-header h3,
.schedule-focus h3,
.schedule-upcoming p,
.schedule-focus p,
.schedule-upcoming strong {
  margin: 0;
}

.schedule-eyebrow {
  margin: 0 0 0.25rem;
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 700;
}

.schedule-header-actions {
  align-items: center;
}

.schedule-header :deep(.p-button),
.schedule-panel :deep(.p-button),
.schedule-subject-form :deep(.p-button) {
  min-height: 44px;
}

.schedule-focus-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 1rem;
}

.schedule-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  padding: 1.25rem;
}

.schedule-focus,
.schedule-upcoming,
.schedule-subject-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-focus .p-tag {
  align-self: flex-start;
}

.schedule-focus h3 {
  font-size: 1.25rem;
  color: var(--color-ink);
}

.schedule-days {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 1rem;
}

.schedule-day {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.9rem;
}

.schedule-day-today {
  border-color: var(--accent-strong);
}

.schedule-day-header h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.schedule-markers,
.schedule-lessons,
.schedule-subject-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.schedule-lesson-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 44px;
  padding: 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
  color: var(--color-ink);
  text-decoration: none;
}

.schedule-lesson-link:hover {
  border-color: var(--accent-strong);
  background: var(--surface-soft);
}

.schedule-lesson-link:focus-visible,
.schedule-text-link:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.schedule-lesson-link time {
  min-width: 3rem;
  font-weight: 700;
  color: var(--accent-strong);
}

.schedule-lesson-link div {
  flex: 1;
  min-width: 0;
}

.schedule-lesson-link p,
.schedule-lesson-link small {
  margin: 0.2rem 0 0;
  color: var(--color-muted);
  overflow-wrap: anywhere;
}

.schedule-lesson-link .pi {
  color: var(--color-muted);
}

.schedule-text-link {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 44px;
  color: var(--accent-strong);
  font-weight: 600;
}

.schedule-subject-form :deep(.p-inputtext),
.schedule-subject-form :deep(.p-select) {
  min-height: 44px;
}

.schedule-dialog-actions {
  justify-content: flex-end;
}

@media (max-width: 580px) {
  .schedule-header-actions {
    width: 100%;
  }

  .schedule-header-actions :deep(.p-button) {
    flex: 1 1 100%;
  }
}
</style>
