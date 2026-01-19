/**
 * Crypto Service Implementation
 * Provides encryption, hashing, and secure key management
 */

import * as bcrypt from 'bcryptjs';
import * as CryptoJS from 'crypto-js';
import { CryptoService, SecureStorage } from '@viccoboard/core';
import { randomBytes, createHash } from 'crypto';

const SALT_ROUNDS = 10;
const DEFAULT_TOKEN_LENGTH = 32;

export class CryptoServiceImpl implements CryptoService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateKey(): Promise<string> {
    return randomBytes(32).toString('hex');
  }

  async encrypt(data: string, key: string): Promise<string> {
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  async decrypt(encryptedData: string, key: string): Promise<string> {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  async generateToken(length: number = DEFAULT_TOKEN_LENGTH): Promise<string> {
    return randomBytes(length).toString('hex');
  }

  async hash(data: string): Promise<string> {
    return createHash('sha256').update(data).digest('hex');
  }
}

/**
 * In-Memory Secure Storage Implementation
 * Note: For production, this should use platform-specific secure storage
 * (e.g., iOS Keychain, Android Keystore, or encrypted file system)
 */
export class InMemorySecureStorage implements SecureStorage {
  private storage: Map<string, string> = new Map();

  async set(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

// Singleton instances
export const cryptoService = new CryptoServiceImpl();
export const secureStorage = new InMemorySecureStorage();
