<template>
  <div
    class="task-card"
    :class="{ nested: level > 1, dragging: isDragging, dragover: isDragOver }"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragleave="isDragOver = false"
  >
    <div class="task-header">
      <div
        class="drag-handle"
        draggable="true"
        :title="`Aufgabe ${taskNumber} zum Umordnen ziehen`"
        :aria-label="`Ziehpunkt für Aufgabe ${taskNumber}. Mit Alt+Pfeil hoch oder Alt+Pfeil runter per Tastatur umordnen.`"
        role="button"
        tabindex="0"
        @keydown.enter.prevent="handleKeyActivate"
        @keydown.space.prevent="handleKeyActivate"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
        @keydown="handleKeyReorder"
      >
        ⋮⋮
      </div>
      <component :is="headerTag">Aufgabe {{ taskNumber }}</component>
      <div class="task-actions">
        <button
          v-if="index > 0"
          class="ghost"
          type="button"
          @click="$emit('moveUp')"
          title="Nach oben"
        >
          ↑
        </button>
        <button
          v-if="!isLast"
          class="ghost"
          type="button"
          @click="$emit('moveDown')"
          title="Nach unten"
        >
          ↓
        </button>
        <button class="ghost" type="button" @click="$emit('remove')" title="Aufgabe entfernen">
          ✕
        </button>
      </div>
    </div>

    <div class="field">
      <label :for="`task-title-${task.id}`">Titel</label>
      <input
        :id="`task-title-${task.id}`"
        v-model="task.title"
        type="text"
        placeholder="Aufgabentitel"
      />
    </div>

    <div class="field-grid">
      <div class="field">
        <label :for="`task-points-${task.id}`">Punkte</label>
        <input
          :id="`task-points-${task.id}`"
          v-model.number="task.points"
          type="number"
          min="0"
          step="0.5"
          :readonly="isPointsDerived"
          :disabled="isPointsDerived"
          :class="{ 'input-derived': isPointsDerived }"
          @input="store.recalculateTaskPoints()"
        />
        <small v-if="isPointsDerived" class="field-hint">
          {{ pointsHint }}
        </small>
      </div>
      <div class="field">
        <label :for="`task-bonus-${task.id}`">Bonuspunkte</label>
        <input
          :id="`task-bonus-${task.id}`"
          v-model.number="task.bonusPoints"
          type="number"
          min="0"
          step="0.5"
        />
      </div>
    </div>

    <div v-if="mode === 'complex'" class="field">
      <label class="choice-toggle">
        <input v-model="task.isChoice" type="checkbox" />
        Wahlaufgabe
      </label>
      <input
        v-if="task.isChoice"
        v-model="task.choiceGroup"
        type="text"
        placeholder="Wahlgruppe (z. B. A, B, C)"
      />
    </div>

    <div class="collection-fields">
      <label class="choice-toggle">
        <input v-model="task.reusable" type="checkbox" />
        In die Sammlung
      </label>
      <div class="field">
        <label :for="`task-subject-${task.id}`">Fach</label>
        <input
          :id="`task-subject-${task.id}`"
          v-model="task.subject"
          type="text"
          placeholder="z. B. KBR"
        />
      </div>
      <div class="field">
        <label :for="`task-grade-${task.id}`">Klassenstufe</label>
        <input
          :id="`task-grade-${task.id}`"
          v-model="task.gradeLevel"
          type="text"
          placeholder="z. B. 11"
        />
      </div>
    </div>

    <div class="criteria-block">
      <div class="panel-header">
        <component :is="criteriaHeaderTag">Kriterien / Erwartungshorizont</component>
        <button class="ghost" type="button" @click="store.addCriterion(task)">
          Kriterium hinzufügen
        </button>
      </div>
      <div v-if="task.criteria.length > 0 && task.subtasks.length > 0" class="criteria-conflict-warning" role="alert" aria-live="polite">
        ⚠ Kriterien werden ignoriert, wenn Teilaufgaben vorhanden sind. Bitte Kriterien entfernen oder in die Teilaufgaben verschieben.
      </div>
      <div v-if="task.criteria.length === 0" class="empty">
        Noch keine Kriterien.
      </div>
      <div
        v-for="criterion in task.criteria"
        :key="criterion.id"
        class="criterion-row"
      >
        <input
          v-model="criterion.text"
          type="text"
          placeholder="Kriterium"
        />
        <input
          v-model.number="criterion.points"
          type="number"
          min="0"
          step="0.5"
          @input="store.recalculateTaskPoints()"
        />
        <button
          class="ghost"
          type="button"
          @click="store.removeCriterion(task, criterion.id)"
        >
          Entfernen
        </button>
      </div>
    </div>

    <div v-if="canAddSubtasks" class="subtasks">
      <div class="panel-header">
        <component :is="subtasksHeaderTag">Teilaufgaben {{ subtasksLevel }}</component>
        <button
          class="ghost"
          type="button"
          @click="store.addSubtask(task, nextLevel)"
        >
          Teilaufgabe hinzufügen
        </button>
      </div>

      <TaskEditor
        v-for="(subtask, subIndex) in task.subtasks"
        :key="subtask.id"
        :task="subtask"
        :index="subIndex"
        :level="nextLevel"
        :mode="mode"
        :numbering-path="`${taskNumber}.${subIndex + 1}`"
        :parent-task="task"
        :is-last="subIndex === task.subtasks.length - 1"
        @remove="store.removeNestedTask(task, subtask.id)"
        @moveUp="store.moveTask(task.subtasks, subIndex, -1)"
        @moveDown="store.moveTask(task.subtasks, subIndex, 1)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useExamBuilderStore, type TaskDraft } from '../stores/examBuilderStore'
import { useToast } from '../composables/useToast'

interface Props {
  task: TaskDraft
  index: number
  level: 1 | 2 | 3
  mode: 'simple' | 'complex'
  numberingPath: string
  isLast?: boolean
  parentTask?: TaskDraft
}

const props = withDefaults(defineProps<Props>(), {
  isLast: false
})

defineEmits<{
  remove: []
  moveUp: []
  moveDown: []
}>()

const store = useExamBuilderStore()
const toast = useToast()
const isDragging = ref(false)
const isDragOver = ref(false)

const canAddSubtasks = computed(() => props.mode === 'complex' && props.level < 3)
const nextLevel = computed(() => (props.level + 1) as 2 | 3)
const isPointsDerived = computed(() => props.task.subtasks.length > 0 || props.task.criteria.length > 0)
const pointsHint = computed(() => {
  if (props.task.subtasks.length > 0) {
    return 'Wird automatisch aus den Teilaufgaben berechnet.'
  }
  if (props.task.criteria.length > 0) {
    return 'Wird automatisch aus den Kriterien berechnet.'
  }
  return ''
})

const taskNumber = computed(() => props.numberingPath)

const headerTag = computed(() => {
  if (props.level === 1) return 'h3'
  if (props.level === 2) return 'h4'
  return 'h5'
})

const criteriaHeaderTag = computed(() => {
  if (props.level === 1) return 'h4'
  if (props.level === 2) return 'h5'
  return 'h6'
})

const subtasksHeaderTag = computed(() => {
  if (props.level === 1) return 'h4'
  return 'h5'
})

const subtasksLevel = computed(() => {
  if (props.level === 1) return '(Ebene 2)'
  return '(Ebene 3)'
})

// Drag-and-drop handlers
const handleDragStart = (event: DragEvent) => {
  isDragging.value = true
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify({
      taskId: props.task.id,
      level: props.level,
      index: props.index,
      parentId: props.parentTask?.id || null
    }))
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  if (!event.dataTransfer) return

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    const { taskId, level: fromLevel } = data

    // Only allow drops within same level for safety
    if (fromLevel !== props.level) {
      toast.warning('Aufgaben können nicht zwischen verschiedenen Hierarchieebenen verschoben werden.')
      return
    }

    // Same task, no-op
    if (taskId === props.task.id) return

    // Attempt reordering based on context
    if (props.level === 1 && fromLevel === 1) {
      // Root level reorder
      const fromPos = store.tasks.findIndex((t: TaskDraft) => t.id === taskId)
      if (fromPos !== -1) {
        store.moveTask(store.tasks, fromPos, props.index - fromPos)
      }
    } else if (props.level > 1 && props.parentTask) {
      // Nested level reorder within same parent
      // Validate that dragged task belongs to the same parent
      if (data.parentId !== props.parentTask.id) {
        toast.warning('Aufgaben können nicht zwischen verschiedenen Teilaufgabenlisten verschoben werden.')
        return
      }
      const fromPos = props.parentTask.subtasks.findIndex((t: TaskDraft) => t.id === taskId)
      if (fromPos !== -1) {
        store.moveTask(props.parentTask.subtasks, fromPos, props.index - fromPos)
      }
    }
  } catch (err) {
    toast.error('Fehler beim Umordnen der Aufgaben. Bitte erneut versuchen.')
  }
}

const handleDragEnd = () => {
  isDragging.value = false
  isDragOver.value = false
}

const handleKeyReorder = (event: KeyboardEvent) => {
  if (!event.altKey) return
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (props.level === 1) {
      store.moveTask(store.tasks, props.index, -1)
    } else if (props.parentTask) {
      store.moveTask(props.parentTask.subtasks, props.index, -1)
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (props.level === 1) {
      store.moveTask(store.tasks, props.index, 1)
    } else if (props.parentTask) {
      store.moveTask(props.parentTask.subtasks, props.index, 1)
    }
  }
}

const handleKeyActivate = (event: KeyboardEvent) => {
  if (event.repeat) return
  toast.info('Mit Alt+Pfeil hoch oder Alt+Pfeil runter lassen sich Aufgaben umordnen.')
}
</script>

<style scoped src="./TaskEditor.css"></style>
