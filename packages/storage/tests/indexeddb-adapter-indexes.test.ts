import 'fake-indexeddb/auto';
import { IndexedDBAdapter } from '../src/adapters/indexeddb.adapter';

describe('IndexedDBAdapter indexed reads', () => {
  let db: IDBDatabase;
  let adapter: IndexedDBAdapter;

  beforeEach(async () => {
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('indexeddb-adapter-index-test', 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('rows', { keyPath: 'id' });
        store.createIndex('class_group_id', 'class_group_id');
        store.createIndex('status', 'status');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    adapter = new IndexedDBAdapter(db);
    await adapter.insert('rows', { id: 'b', class_group_id: '9b', status: 'inactive' });
    await adapter.insert('rows', { id: 'a', class_group_id: '9b', status: 'active' });
    await adapter.insert('rows', { id: 'c', class_group_id: '9a', status: 'active' });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    db.close();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('indexeddb-adapter-index-test');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('IndexedDB deletion blocked'));
    });
  });

  it('uses the index for one filter while keeping primary-key order', async () => {
    const indexedRead = jest.spyOn(IDBIndex.prototype, 'getAll');
    const tableRead = jest.spyOn(IDBObjectStore.prototype, 'getAll');

    const rows = await adapter.getAll<{ id: string }>('rows', { class_group_id: '9b' });

    expect(rows.map(row => row.id)).toEqual(['a', 'b']);
    expect(indexedRead).toHaveBeenCalledWith('9b');
    expect(tableRead).not.toHaveBeenCalled();
  });

  it('applies remaining filters after an indexed read', async () => {
    const rows = await adapter.getAll<{ id: string }>('rows', {
      class_group_id: '9b',
      status: 'active'
    });

    expect(rows.map(row => row.id)).toEqual(['a']);
  });

  it('preserves fallback behavior for missing indexes and invalid index keys', async () => {
    const tableRead = jest.spyOn(IDBObjectStore.prototype, 'getAll');

    expect((await adapter.getAll<{ id: string }>('rows', { missing: undefined })).map(row => row.id))
      .toEqual(['a', 'b', 'c']);
    expect((await adapter.getAll<{ id: string }>('rows', { class_group_id: null })).map(row => row.id))
      .toEqual([]);
    expect((await adapter.getAll<{ id: string }>('rows')).map(row => row.id))
      .toEqual(['a', 'b', 'c']);
    expect(tableRead).toHaveBeenCalledTimes(3);
  });

  it('counts indexed matches without fetching rows', async () => {
    const indexedCount = jest.spyOn(IDBIndex.prototype, 'count');
    const tableRead = jest.spyOn(IDBObjectStore.prototype, 'getAll');

    expect(await adapter.count('rows', { class_group_id: '9b' })).toBe(2);
    expect(await adapter.count('rows', { class_group_id: 'missing' })).toBe(0);
    expect(indexedCount).toHaveBeenCalledWith('9b');
    expect(tableRead).not.toHaveBeenCalled();
  });

  it('counts composite criteria and unfiltered rows correctly', async () => {
    expect(await adapter.count('rows', { class_group_id: '9b', status: 'active' })).toBe(1);
    expect(await adapter.count('rows', { class_group_id: '9b', status: 'missing' })).toBe(0);
    expect(await adapter.count('rows')).toBe(3);
  });
});
