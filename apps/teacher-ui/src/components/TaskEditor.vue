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
        title="Drag to reorder"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
        aria-hidden="true"
      >
        ⋮⋮
      </div>
      <component :is="headerTag">Task {{ taskNumber }}</component>
      <div class="task-actions">
        <button
          v-if="index > 0"
          class="ghost"
          type="button"
          @click="$emit('moveUp')"
          title="Move up"
        >
          ↑
        </button>
        <button
          v-if="!isLast"
          class="ghost"
          type="button"
          @click="$emit('moveDown')"
          title="Move down"
        >
          ↓
        </button>
        <button class="ghost" type="button" @click="$emit('remove')" title="Remove task">
          ✕
        </button>
      </div>
    </div>

    <div class="field">
      <label :for="`task-title-${task.id}`">Title</label>
      <input
        :id="`task-title-${task.id}`"
        v-model="task.title"
        type="text"
        placeholder="Task title"
      />
    </div>

    <div class="field-grid">
      <div class="field">
        <label :for="`task-points-${task.id}`">Points</label>
        <input
          :id="`task-points-${task.id}`"
          v-model.number="task.points"
          type="number"
          min="0"
          step="0.5"
        />
      </div>
      <div class="field">
        <label :for="`task-bonus-${task.id}`">Bonus points</label>
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
        Choice task
      </label>
      <input
        v-if="task.isChoice"
        v-model="task.choiceGroup"
        type="text"
        placeholder="Choice group (e.g., A, B, C)"
      />
    </div>

    <div class="criteria-block">
      <div class="panel-header">
        <component :is="criteriaHeaderTag">Criteria</component>
        <button class="ghost" type="button" @click="store.addCriterion(task)">
          Add criterion
        </button>
      </div>
      <div v-if="task.criteria.length === 0" class="empty">
        No criteria yet.
      </div>
      <div
        v-for="criterion in task.criteria"
        :key="criterion.id"
        class="criterion-row"
      >
        <input
          v-model="criterion.text"
          type="text"
          placeholder="Criterion"
        />
        <input
          v-model.number="criterion.points"
          type="number"
          min="0"
          step="0.5"
        />
        <button
          class="ghost"
          type="button"
          @click="store.removeCriterion(task, criterion.id)"
        >
          Remove
        </button>
      </div>
    </div>

    <div v-if="canAddSubtasks" class="subtasks">
      <div class="panel-header">
        <component :is="subtasksHeaderTag">Subtasks {{ subtasksLevel }}</component>
        <button
          class="ghost"
          type="button"
          @click="store.addSubtask(task, nextLevel)"
        >
          Add subtask
        </button>
      </div>

      <TaskEditor
        v-for="(subtask, subIndex) in task.subtasks"
        :key="subtask.id"
        :task="subtask"
        :index="subIndex"
        :level="nextLevel"
        :mode="mode"
        :parent-index="index"
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

interface Props {
  task: TaskDraft
  index: number
  level: 1 | 2 | 3
  mode: 'simple' | 'complex'
  parentIndex?: number
  isLast?: boolean
  parentTask?: TaskDraft
}

const props = withDefaults(defineProps<Props>(), {
  parentIndex: 0,
  isLast: false
})

defineEmits<{
  remove: []
  moveUp: []
  moveDown: []
}>()

const store = useExamBuilderStore()
const isDragging = ref(false)
const isDragOver = ref(false)

const canAddSubtasks = computed(() => props.mode === 'complex' && props.level < 3)
const nextLevel = computed(() => (props.level + 1) as 2 | 3)

const taskNumber = computed(() => {
  if (props.level === 1) return `${props.index + 1}`
  if (props.level === 2) return `${props.parentIndex + 1}.${props.index + 1}`
  return `${props.parentIndex + 1}.?.${props.index + 1}`
})

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
  if (props.level === 1) return '(level 2)'
  return '(level 3)'
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
      console.warn('Cannot move tasks between different hierarchy levels')
      return
    }

    // Same task, no-op
    if (taskId === props.task.id) return

    // Attempt reordering based on context
    if (props.level === 1 && fromLevel === 1) {
      // Root level reorder
      const fromPos = store.tasks.findIndex(t => t.id === taskId)
      if (fromPos !== -1) {
        store.moveTask(store.tasks, fromPos, props.index - fromPos)
      }
    } else if (props.level > 1 && props.parentTask) {
      // Nested level reorder within same parent
      // Validate that dragged task belongs to the same parent
      if (data.parentId !== props.parentTask.id) {
        console.warn('Cannot move tasks between different parent subtask lists')
        return
      }
      const fromPos = props.parentTask.subtasks.findIndex(t => t.id === taskId)
      if (fromPos !== -1) {
        store.moveTask(props.parentTask.subtasks, fromPos, props.index - fromPos)
      }
    }
  } catch (err) {
    console.error('Error processing drop:', err)
  }
}

const handleDragEnd = () => {
  isDragging.value = false
  isDragOver.value = false
}
</script>

<style scoped>
.task-card {
  padding: 1.5rem;
  border: 2px solid var(--color-border, #ddd);
  border-radius: 8px;
  background: var(--color-background, #fff);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  cursor: grab;
  transition: all 0.2s;
}

.task-card:active {
  cursor: grabbing;
}

.task-card.nested {
  margin-left: 1.5rem;
  background: var(--color-background-subtle, #f9f9f9);
}

.task-card.dragging {
  opacity: 0.5;
  background: var(--color-border, #ddd);
  border-color: var(--color-warning, #f39c12);
}

.task-card.dragover {
  border-color: var(--color-primary, #3498db);
  border-style: dashed;
  background: var(--color-primary-light, #e3f2fd);
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.drag-handle {
  cursor: grab;
  color: var(--color-text-muted, #999);
  font-size: 1.2rem;
  flex-shrink: 0;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.task-header h3,
.task-header h4,
.task-header h5 {
  margin: 0;
  flex: 1;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  font-weight: 500;
  font-size: 0.9rem;
}

.choice-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
}

input[type="text"],
input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
}

.criteria-block,
.subtasks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.panel-header h4,
.panel-header h5,
.panel-header h6 {
  margin: 0;
  font-size: 1rem;
}

.criterion-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.5rem;
  align-items: center;
}

.ghost {
  padding: 0.25rem 0.75rem;
  border: 1px dashed var(--color-border, #ddd);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.ghost:hover {
  background: var(--color-hover, #f5f5f5);
  border-color: var(--color-primary, #3498db);
}

.empty {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-muted, #777);
  font-size: 0.9rem;
  font-style: italic;
}
</style>
