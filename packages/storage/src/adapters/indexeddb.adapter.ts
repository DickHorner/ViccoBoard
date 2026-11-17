/**
 * IndexedDB Storage Adapter
 * Wraps IndexedDB operations in the common StorageAdapter interface
 */

import { StorageAdapter, TableSchema } from './storage-adapter.interface.js';

export class IndexedDBAdapter implements StorageAdapter {
  private activeTransaction: IDBTransaction | null = null;
  private activeMode: IDBTransactionMode | null = null;

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
    const storeNames = Array.from(this.db.objectStoreNames);
    if (storeNames.length === 0) {
      return callback();
    }

    return new Promise<T>((resolve, reject) => {
      const tx = this.db.transaction(storeNames, 'readwrite');
      this.activeTransaction = tx;
      this.activeMode = 'readwrite';

      let callbackResolved = false;
      let callbackValue: T | undefined;
      let callbackError: unknown;
      let txCompleted = false;

      const cleanup = () => {
        this.activeTransaction = null;
        this.activeMode = null;
      };

      const finishIfReady = () => {
        if (!txCompleted || !callbackResolved) return;
        if (callbackError) {
          reject(callbackError);
          return;
        }
        resolve(callbackValue as T);
      };

      tx.oncomplete = () => {
        txCompleted = true;
        cleanup();
        finishIfReady();
      };

      tx.onerror = () => {
        cleanup();
        reject(tx.error ?? new Error('IndexedDB transaction failed'));
      };

      tx.onabort = () => {
        cleanup();
        reject(tx.error ?? new Error('IndexedDB transaction aborted'));
      };

      try {
        const result = callback();
        Promise.resolve(result).then(
          (value) => {
            callbackResolved = true;
            callbackValue = value;
            finishIfReady();
          },
          (error) => {
            callbackResolved = true;
            callbackError = error;
            try {
              tx.abort();
            } catch {
              // Ignore abort errors
            }
            finishIfReady();
          }
        );
      } catch (error) {
        callbackResolved = true;
        callbackError = error;
        try {
          tx.abort();
        } catch {
          // Ignore abort errors
        }
        finishIfReady();
      }
    });
  }

  async tableExists(tableName: string): Promise<boolean> {
    return this.db.objectStoreNames.contains(tableName);
  }

  async createTable(tableName: string, schema: TableSchema): Promise<void> {
    if (this.db.objectStoreNames.contains(tableName)) {
      return;
    }

    let store: IDBObjectStore;
    try {
      store = this.db.createObjectStore(tableName, { keyPath: 'id' });
    } catch (error) {
      throw new Error('IndexedDB createTable must be called during a version upgrade');
    }

    if (schema.indexes) {
      for (const index of schema.indexes) {
        const keyPath = index.columns.length === 1 ? index.columns[0] : index.columns;
        store.createIndex(index.name, keyPath, { unique: !!index.unique });
      }
    }
  }

  async getAll<T = any>(tableName: string, criteria?: Record<string, any>): Promise<T[]> {
    const { store } = this.getStore(tableName, 'readonly');
    const filters = Object.entries(criteria ?? {});
    const indexedFilter = filters.find(([field, value]) =>
      store.indexNames.contains(field) &&
      (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)))
    );
    const results = await this.requestToPromise(
      indexedFilter
        ? store.index(indexedFilter[0]).getAll(indexedFilter[1])
        : store.getAll()
    );

    const filtered = filters.length === 0
      ? results as T[]
      : (results as T[]).filter(item =>
          filters.every(([key, value]) => (item as Record<string, any>)[key] === value)
        );

    // getAll() on an object store returns primary-key order; an index does not.
    return indexedFilter
      ? filtered.sort((a, b) => {
          const left = (a as Record<string, any>).id;
          const right = (b as Record<string, any>).id;
          return indexedDB.cmp(left, right);
        })
      : filtered;
  }

  async getById<T = any>(tableName: string, id: string): Promise<T | null> {
    const { store } = this.getStore(tableName, 'readonly');
    const result = await this.requestToPromise(store.get(id));
    return (result as T | undefined) ?? null;
  }

  async insert(tableName: string, record: Record<string, any>): Promise<void> {
    const { store } = this.getStore(tableName, 'readwrite');
    await this.requestToPromise(store.add(record));
  }

  async update(tableName: string, id: string, updates: Record<string, any>): Promise<void> {
    const { store } = this.getStore(tableName, 'readwrite');

    return new Promise<void>((resolve, reject) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result as Record<string, any> | undefined;
        if (!existing) {
          reject(new Error(`Record with id ${id} not found`));
          return;
        }

        const updated = { ...existing, ...updates, id };
        const putRequest = store.put(updated);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async delete(tableName: string, id: string): Promise<boolean> {
    const { store } = this.getStore(tableName, 'readwrite');
    await this.requestToPromise(store.delete(id));
    return true;
  }

  async count(tableName: string, criteria?: Record<string, any>): Promise<number> {
    const filters = Object.entries(criteria ?? {});
    const { store } = this.getStore(tableName, 'readonly');

    if (filters.length === 0) {
      return this.requestToPromise(store.count());
    }

    if (filters.length === 1) {
      const [field, value] = filters[0];
      if (store.indexNames.contains(field) &&
        (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)))) {
        return this.requestToPromise(store.index(field).count(value));
      }
    }

    return (await this.getAll(tableName, criteria)).length;
  }

  private getStore(tableName: string, mode: IDBTransactionMode): {
    store: IDBObjectStore;
  } {
    if (this.activeTransaction) {
      if (!this.activeTransaction.objectStoreNames.contains(tableName)) {
        throw new Error(`Store "${tableName}" is not part of the active transaction`);
      }
      if (mode === 'readwrite' && this.activeMode !== 'readwrite') {
        throw new Error('Active transaction is read-only');
      }
      return { store: this.activeTransaction.objectStore(tableName) };
    }

    const tx = this.db.transaction([tableName], mode);
    return { store: tx.objectStore(tableName) };
  }

  private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
