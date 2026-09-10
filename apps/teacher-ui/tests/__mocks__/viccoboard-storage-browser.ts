type QueryCriteria = Record<string, unknown>

type QueryOptions = {
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  offset?: number
  limit?: number
}

export type StorageAdapter = {
  initialize(): Promise<void>
  getAll<T = any>(tableName: string, criteria?: Record<string, any>): Promise<T[]>
  getById<T = any>(tableName: string, id: string): Promise<T | null>
  insert(tableName: string, record: Record<string, any>): Promise<void>
  update(tableName: string, id: string, updates: Record<string, any>): Promise<void>
  delete(tableName: string, id: string): Promise<boolean>
  count(tableName: string, criteria?: Record<string, any>): Promise<number>
}

export class InMemoryStorageAdapter implements StorageAdapter {
  private tables: Map<string, Map<string, Record<string, any>>> = new Map()

  async initialize(): Promise<void> {
    this.tables.clear()
  }

  async getAll<T = any>(tableName: string, criteria?: Record<string, any>): Promise<T[]> {
    const table = this.tables.get(tableName)
    if (!table) return []

    let rows = Array.from(table.values())

    if (criteria && Object.keys(criteria).length > 0) {
      rows = rows.filter((row) =>
        Object.entries(criteria).every(([key, value]) => row[key] === value)
      )
    }

    return rows as T[]
  }

  async getById<T = any>(tableName: string, id: string): Promise<T | null> {
    const table = this.tables.get(tableName)
    if (!table) return null
    return (table.get(id) as T) ?? null
  }

  async insert(tableName: string, record: Record<string, any>): Promise<void> {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, new Map())
    }

    this.tables.get(tableName)!.set(record.id, { ...record })
  }

  async update(tableName: string, id: string, updates: Record<string, any>): Promise<void> {
    const table = this.tables.get(tableName)
    if (!table) return

    const existing = table.get(id)
    if (existing) {
      table.set(id, { ...existing, ...updates })
    }
  }

  async delete(tableName: string, id: string): Promise<boolean> {
    const table = this.tables.get(tableName)
    if (!table) return false
    return table.delete(id)
  }

  async count(tableName: string, criteria?: Record<string, any>): Promise<number> {
    const rows = await this.getAll(tableName, criteria)
    return rows.length
  }
}

export abstract class AdapterRepository<T> {
  protected adapter: StorageAdapter
  protected tableName: string

  constructor(adapter: StorageAdapter, tableName: string) {
    this.adapter = adapter
    this.tableName = tableName
  }

  abstract mapToEntity(row: any): T
  abstract mapToRow(entity: Partial<T>): any

  async findById(id: string): Promise<T | null> {
    const row = await this.adapter.getById(this.tableName, id)
    return row ? this.mapToEntity(row) : null
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    const rows = await this.adapter.getAll(this.tableName)
    let entities = rows.map((row) => this.mapToEntity(row))

    if (options?.orderBy) {
      const key = options.orderBy as keyof T
      const direction = options.orderDirection === 'desc' ? -1 : 1
      entities = entities.sort((left, right) => {
        const leftValue = left[key] as any
        const rightValue = right[key] as any
        if (leftValue < rightValue) return -1 * direction
        if (leftValue > rightValue) return 1 * direction
        return 0
      })
    }

    if (options?.offset !== undefined || options?.limit !== undefined) {
      const start = options.offset || 0
      const end = options.limit ? start + options.limit : undefined
      entities = entities.slice(start, end)
    }

    return entities
  }

  async find(criteria: QueryCriteria): Promise<T[]> {
    if (Object.keys(criteria).length === 0) {
      return this.findAll()
    }

    const rows = await this.adapter.getAll(this.tableName, criteria)
    return rows.map((row) => this.mapToEntity(row))
  }

  async create(entity: Omit<T, 'id' | 'createdAt' | 'lastModified'>): Promise<T> {
    const now = new Date()
    const entityWithMeta = {
      ...entity,
      id: createId(),
      createdAt: now,
      lastModified: now
    } as T

    const row = this.mapToRow(entityWithMeta)
    await this.adapter.insert(this.tableName, row)

    return entityWithMeta
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const existing = await this.findById(id)

    if (!existing) {
      throw new Error(`Entity with id ${id} not found`)
    }

    const row = this.mapToRow({
      ...updates,
      lastModified: new Date()
    })
    await this.adapter.update(this.tableName, id, row)

    return this.findById(id) as Promise<T>
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, id)
  }

  async count(criteria?: QueryCriteria): Promise<number> {
    return this.adapter.count(this.tableName, criteria)
  }
}

const createId = (): string => {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto)
  if (randomUUID) return randomUUID()

  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
