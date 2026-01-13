/**
 * Base Repository Implementation
 * Provides common CRUD operations for all repositories
 */

import { Repository, QueryOptions, QueryCriteria } from '@viccoboard/core';
import { SQLiteStorage } from '../storage';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseRepository<T> implements Repository<T> {
  protected storage: SQLiteStorage;
  protected tableName: string;

  constructor(storage: SQLiteStorage, tableName: string) {
    this.storage = storage;
    this.tableName = tableName;
  }

  abstract mapToEntity(row: any): T;
  abstract mapToRow(entity: Partial<T>): any;

  async findById(id: string): Promise<T | null> {
    const db = this.storage.getDatabase();
    const row = db
      .prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`)
      .get(id);
    
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    const db = this.storage.getDatabase();
    let sql = `SELECT * FROM ${this.tableName}`;
    
    if (options?.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    }
    
    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
    }
    
    if (options?.offset) {
      sql += ` OFFSET ${options.offset}`;
    }
    
    const rows = db.prepare(sql).all();
    return rows.map(row => this.mapToEntity(row));
  }

  async find(criteria: QueryCriteria): Promise<T[]> {
    const db = this.storage.getDatabase();
    const keys = Object.keys(criteria);
    
    if (keys.length === 0) {
      return this.findAll();
    }
    
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const values = keys.map(key => criteria[key]);
    
    const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
    const rows = db.prepare(sql).all(...values);
    
    return rows.map(row => this.mapToEntity(row));
  }

  async create(entity: Omit<T, 'id' | 'createdAt' | 'lastModified'>): Promise<T> {
    const db = this.storage.getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const entityWithMeta = {
      ...entity,
      id,
      createdAt: now,
      lastModified: now
    };
    
    const row = this.mapToRow(entityWithMeta);
    const keys = Object.keys(row);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => row[key]);
    
    const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    db.prepare(sql).run(...values);
    
    return entityWithMeta as T;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const db = this.storage.getDatabase();
    const existing = await this.findById(id);
    
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }
    
    const updatesWithMeta = {
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    const row = this.mapToRow(updatesWithMeta);
    const keys = Object.keys(row);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = [...keys.map(key => row[key]), id];
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    db.prepare(sql).run(...values);
    
    return this.findById(id) as Promise<T>;
  }

  async delete(id: string): Promise<boolean> {
    const db = this.storage.getDatabase();
    const result = db
      .prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
      .run(id);
    
    return result.changes > 0;
  }

  async count(criteria?: QueryCriteria): Promise<number> {
    const db = this.storage.getDatabase();
    
    if (!criteria || Object.keys(criteria).length === 0) {
      const result = db
        .prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`)
        .get() as { count: number };
      return result.count;
    }
    
    const keys = Object.keys(criteria);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const values = keys.map(key => criteria[key]);
    
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`;
    const result = db.prepare(sql).get(...values) as { count: number };
    
    return result.count;
  }
}
