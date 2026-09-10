import { computed, ref } from 'vue'
import { getStorageAdapter } from '../services/storage.service'
import { PlanningBlockRepository } from '../services/planning-block.repository'

let planningBridgeInstance: PlanningBridge | null = null

interface PlanningBridge {
  planningBlockRepository: PlanningBlockRepository
}

export function initializePlanningBridge(): PlanningBridge {
  if (planningBridgeInstance) {
    return planningBridgeInstance
  }

  const adapter = getStorageAdapter()
  const planningBlockRepository = new PlanningBlockRepository(adapter)

  planningBridgeInstance = {
    planningBlockRepository
  }

  return planningBridgeInstance
}

export function getPlanningBridge(): PlanningBridge {
  if (!planningBridgeInstance) {
    throw new Error('PlanningBridge not initialized. Call initializePlanningBridge() first.')
  }

  return planningBridgeInstance
}

export function usePlanningBlocks(): PlanningBlockRepository {
  return getPlanningBridge().planningBlockRepository
}

export function usePlanningBridge() {
  const bridge = ref<PlanningBridge | null>(planningBridgeInstance)
  const isInitialized = computed(() => bridge.value !== null)

  return {
    planningBridge: bridge,
    isInitialized,
    planningBlocks: computed(() => bridge.value?.planningBlockRepository)
  }
}

export {
  PlanningBlockRepository
}
