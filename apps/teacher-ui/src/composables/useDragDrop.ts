import { ref, computed } from 'vue'

interface DragState {
  draggedIndex: number | null
  draggedLevel: number
  draggedFrom: 'root' | 'subtasks'
  parentId: string | null
}

export function useDragDrop() {
  const dragState = ref<DragState>({
    draggedIndex: null,
    draggedLevel: 1,
    draggedFrom: 'root',
    parentId: null
  })

  const isDragging = computed(() => dragState.value.draggedIndex !== null)

  const setDragStart = (index: number, level: number, from: 'root' | 'subtasks', parentId?: string) => {
    dragState.value = {
      draggedIndex: index,
      draggedLevel: level,
      draggedFrom: from,
      parentId: parentId || null
    }
  }

  const clearDrag = () => {
    dragState.value = {
      draggedIndex: null,
      draggedLevel: 1,
      draggedFrom: 'root',
      parentId: null
    }
  }

  const getDragInfo = () => dragState.value

  return {
    dragState,
    isDragging,
    setDragStart,
    clearDrag,
    getDragInfo
  }
}
