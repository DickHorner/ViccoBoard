import type { PlanningBlock } from '@viccoboard/core'
import { AdapterRepository, type StorageAdapter } from '@viccoboard/storage/browser'

export class PlanningBlockRepository extends AdapterRepository<PlanningBlock> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'planning_blocks')
  }

  mapToEntity(row: any): PlanningBlock {
    return {
      id: row.id,
      classGroupId: row.class_group_id,
      title: row.title,
      startDate: row.start_date,
      endDate: row.end_date,
      color: row.color || undefined,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    }
  }

  mapToRow(entity: Partial<PlanningBlock>): any {
    const row: any = {}

    if (entity.id !== undefined) row.id = entity.id
    if (entity.classGroupId !== undefined) row.class_group_id = entity.classGroupId
    if (entity.title !== undefined) row.title = entity.title
    if (entity.startDate !== undefined) row.start_date = entity.startDate
    if (entity.endDate !== undefined) row.end_date = entity.endDate
    if (entity.color !== undefined) row.color = entity.color
    if (entity.notes !== undefined) row.notes = entity.notes
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString()
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString()

    return row
  }

  async create(
    entity: Omit<PlanningBlock, 'id' | 'createdAt' | 'lastModified'>
  ): Promise<PlanningBlock> {
    this.assertValidPlanningBlock(entity)
    return super.create(entity)
  }

  async update(id: string, updates: Partial<PlanningBlock>): Promise<PlanningBlock> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`)
    }

    this.assertValidPlanningBlock({ ...existing, ...updates })
    return super.update(id, updates)
  }

  async findByClassGroup(classGroupId: string): Promise<PlanningBlock[]> {
    const blocks = await this.find({ class_group_id: classGroupId })
    return blocks.sort(comparePlanningBlocks)
  }

  private assertValidPlanningBlock(
    block: Pick<PlanningBlock, 'classGroupId' | 'title' | 'startDate' | 'endDate'>
  ): void {
    if (!block.classGroupId.trim()) {
      throw new Error('classGroupId is required')
    }

    if (!block.title.trim()) {
      throw new Error('title is required')
    }

    if (!isDateKey(block.startDate)) {
      throw new Error('startDate must use YYYY-MM-DD format')
    }

    if (!isDateKey(block.endDate)) {
      throw new Error('endDate must use YYYY-MM-DD format')
    }

    if (block.startDate > block.endDate) {
      throw new Error('startDate must be before or equal to endDate')
    }
  }
}

export const comparePlanningBlocks = (left: PlanningBlock, right: PlanningBlock): number => {
  if (left.startDate !== right.startDate) {
    return left.startDate.localeCompare(right.startDate)
  }

  if (left.endDate !== right.endDate) {
    return left.endDate.localeCompare(right.endDate)
  }

  return left.title.localeCompare(right.title)
}

const isDateKey = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
