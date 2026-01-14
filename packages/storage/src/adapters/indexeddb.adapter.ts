/**
 * IndexedDB Storage Adapter
 * Wraps IndexedDB operations in the common StorageAdapter interface
 */

import { StorageAdapter, TableSchema } from './storage-adapter.interface';

export class IndexedDBAdapter implements StorageAdapter {
  constructor(private db: IDBDatabase) {}

  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    // IndexedDB doesn't support SQL queries, this is a placeholder
    // In practice, you'd parse the query or use a different API
    throw new Error('IndexedDB does not support SQL queries. Use getAll() instead.');
  }

  async queryOne<T = any>(query: string, params?: any[]): Promise<T | null> {
    throw new Error('IndexedDB does not support SQL queries. Use getById() instead.');
  }

  async execute(query: string, params?: any[]): Promise<{ changes: number; lastId?: any }> {
    throw new Error('IndexedDB does not support SQL queries. Use insert/update/delete methods.');
  }

  async transaction<T>(callback: () => T | Promise<T>): Promise<T> {
    // IndexedDB transactions are more complex - for now, just execute the callback
    // Real implementation would create an IDBTransaction and handle rollback
    return callback();
  }

  async tableExists(tableName: string): Promise<boolean> {
    return this.db.objectStoreNames.contains(tableName);
  }

  async createTable(tableName: string, schema: TableSchema): Promise<void> {
    // In IndexedDB, "tables" are object stores
    // This would typically be done during database upgrade
    if (!this.db.objectStoreNames.contains(tableName)) {
      // Can't create object store outside of version change transaction
      // This is a limitation - stores must be created during db.open
      console.warn(`Cannot create object store ${tableName} - must be done during version upgrade`);
    }
  }

  async getAll<T = any>(tableName: string, criteria?: Record<string, any>): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([tableName], 'readonly');
      const store = transaction.objectStore(tableName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result as T[];
        
        // Filter by criteria if provided
        if (criteria && Object.keys(criteria).length > 0) {
          results = results.filter(item => {
            return Object.keys(criteria).every(key => {
              return (item as any)[key] === criteria[key];
            });
          });
        }
        
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getById<T = any>(tableName: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([tableName], 'readonly');
      const store = transaction.objectStore(tableName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async insert(tableName: string, record: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([tableName], 'readwrite');
      const store = transaction.objectStore(tableName);
      const request = store.add(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async update(tableName: string, id: string, updates: Record<string, any>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Get existing record
        const existing = await this.getById(tableName, id);
        if (!existing) {
          reject(new Error(`Record with id ${id} not found`));
          return;
        }

        // Merge updates
        const updated = { ...existing, ...updates, id };

        const transaction = this.db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.put(updated);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async delete(tableName: string, id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([tableName], 'readwrite');
      const store = transaction.objectStore(tableName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async count(tableName: string, criteria?: Record<string, any>): Promise<number> {
    if (!criteria || Object.keys(criteria).length === 0) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([tableName], 'readonly');
        const store = transaction.objectStore(tableName);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    // With criteria, we need to getAll and filter
    const results = await this.getAll(tableName, criteria);
    return results.length;
  }
}
