/**
 * ViccoBoard Storage Package
 * Exports storage, crypto, and repository implementations
 */

export * from './storage';
export * from './crypto/crypto.service';
export * from './repositories/base.repository';
export * from './migrations/001_initial_schema';
export * from './indexeddb.storage';

// Version
export const STORAGE_VERSION = '0.1.0';
