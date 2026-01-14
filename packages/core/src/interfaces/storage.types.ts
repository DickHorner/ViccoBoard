/**
 * Storage Interface
 * Defines contracts for encrypted local database operations
 */

export interface Storage {
  /**
   * Initialize storage with encryption
   */
  initialize(password: string): Promise<void>;
  
  /**
   * Close storage connection
   */
  close(): Promise<void>;
  
  /**
   * Check if storage is initialized
   */
  isInitialized(): boolean;
  
  /**
   * Run database migrations
   */
  migrate(): Promise<void>;
  
  /**
   * Transaction support (synchronous callback required by some backends like better-sqlite3)
   */
  transaction<T>(callback: () => T): Promise<T>;
}

export interface Repository<T> {
  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>;
  
  /**
   * Find all entities
   */
  findAll(options?: QueryOptions): Promise<T[]>;
  
  /**
   * Find entities by criteria
   */
  find(criteria: QueryCriteria): Promise<T[]>;
  
  /**
   * Create new entity
   */
  create(entity: Omit<T, 'id' | 'createdAt' | 'lastModified'>): Promise<T>;
  
  /**
   * Update existing entity
   */
  update(id: string, updates: Partial<T>): Promise<T>;
  
  /**
   * Delete entity
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Count entities
   */
  count(criteria?: QueryCriteria): Promise<number>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface QueryCriteria {
  [key: string]: any;
}

export interface Migration {
  version: number;
  name: string;
  up(): Promise<void>;
  down(): Promise<void>;
}
