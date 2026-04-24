/**
 * Adapter-Aware Base Repository
 * Uses StorageAdapter interface instead of SQLite-specific APIs
 */

import { Repository, QueryOptions, QueryCriteria } from '@viccoboard/core';
import { StorageAdapter } from '../adapters/storage-adapter.interface.js';
import { v4 as uuidv4 } from 'uuid';

export abstract class AdapterRepository<T> implements Repository<T> {
  protected adapter: StorageAdapter;
  protected tableName: string;

  constructor(adapter: StorageAdapter, tableName: string) {
    this.adapter = adapter;
    this.tableName = tableName;
  }

  abstract mapToEntity(row: any): T;
  abstract mapToRow(entity: Partial<T>): any;

  async findById(id: string): Promise<T | null> {
    const row = await this.adapter.getById(this.tableName, id);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    const rows = await this.adapter.getAll(this.tableName);
    let entities = rows.map(row => this.mapToEntity(row));

    // Apply sorting
    if (options?.orderBy) {
      const key = options.orderBy as keyof T;
      const direction = options.orderDirection === 'desc' ? -1 : 1;
      entities.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
        return 0;
      });
    }

    // Apply pagination
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      entities = entities.slice(start, end);
    }

    return entities;
  }

  async find(criteria: QueryCriteria): Promise<T[]> {
    if (Object.keys(criteria).length === 0) {
      return this.findAll();
    }

    const rows = await this.adapter.getAll(this.tableName, criteria);
    return rows.map(row => this.mapToEntity(row));
  }

  async create(entity: Omit<T, 'id' | 'createdAt' | 'lastModified'>): Promise<T> {
    const id = uuidv4();
    const now = new Date();

    const entityWithMeta = {
      ...entity,
      id,
      createdAt: now,
      lastModified: now
    } as T;

    const row = this.mapToRow(entityWithMeta);
    await this.adapter.insert(this.tableName, row);

    return entityWithMeta;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const existing = await this.findById(id);

    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    const updatesWithMeta = {
      ...updates,
      lastModified: new Date()
    };

    const row = this.mapToRow(updatesWithMeta);
    await this.adapter.update(this.tableName, id, row);

    return this.findById(id) as Promise<T>;
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(this.tableName, id);
  }

  async count(criteria?: QueryCriteria): Promise<number> {
    return this.adapter.count(this.tableName, criteria);
  }
}
