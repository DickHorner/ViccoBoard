/**
 * Crypto Service Implementation
 * Provides encryption, hashing, and secure key management
 * Uses Web Crypto API for secure encryption with proper key derivation
 */

import * as bcrypt from 'bcryptjs';
import { CryptoService, SecureStorage } from '@viccoboard/core';
import { randomBytes, createHash, webcrypto } from 'crypto';

const SALT_ROUNDS = 10;
const DEFAULT_TOKEN_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;

// Fixed salt for key derivation (in production, store this securely or generate per-database)
const DERIVATION_SALT = Buffer.from('ViccoBoard-v1-salt-fixed-2026'); // 28 bytes, pad to 32
const PADDED_SALT = Buffer.concat([DERIVATION_SALT, Buffer.alloc(4)]);

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

  /**
   * Encrypt data using AES-256-GCM with PBKDF2 key derivation
   * Format: Base64(IV || encrypted data || auth tag)
   */
  async encrypt(data: string, password: string): Promise<string> {
    try {
      const key = await this.deriveKey(password);
      const iv = webcrypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const encrypted = await webcrypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );

      // Concatenate IV + encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      return Buffer.from(combined).toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data encrypted with encrypt()
   */
  async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      const key = await this.deriveKey(password);
      const combined = Buffer.from(encryptedData, 'base64');

      if (combined.length < 12) {
        throw new Error('Invalid encrypted data: too short');
      }

      const iv = combined.subarray(0, 12);
      const ciphertext = combined.subarray(12);

      const decrypted = await webcrypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Derive AES-256 key from password using PBKDF2
   */
  private async deriveKey(password: string): Promise<webcrypto.CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await webcrypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return webcrypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: PADDED_SALT,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async generateToken(length: number = DEFAULT_TOKEN_LENGTH): Promise<string> {
    return randomBytes(length).toString('hex');
  }

  async hash(data: string): Promise<string> {
    return createHash('sha256').update(data).digest('hex');
  }
}

/**
 * Session-Based Secure Storage with TTL
 * 
 * ⚠️ SECURITY WARNING ⚠️
 * This is BROWSER-ONLY, SHORT-LIVED storage suitable for SESSION TOKENS ONLY.
 * 
 * DO NOT USE FOR:
 * - Passwords or encryption keys
 * - Long-term secrets
 * - Sensitive user data
 * 
 * SAFE FOR:
 * - Session tokens with automatic expiry
 * - Temporary UI state (< 5 minutes)
 * - Cache keys that refresh frequently
 * 
 * All entries expire after 5 minutes and are automatically cleaned up.
 * For long-term secrets, use encrypted IndexedDB or platform-specific secure storage.
 */
export class SessionSecureStorage implements SecureStorage {
  private storage: Map<string, { value: string; expires: number }> = new Map();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-cleanup expired entries every minute
    this.cleanupInterval =setInterval(() => this.cleanup(), 60 * 1000);
  }

  async set(key: string, value: string): Promise<void> {
    this.storage.set(key, {
      value,
      expires: Date.now() + this.TTL_MS
    });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.storage.get(key);
    if (!entry) {
      return null;
    }

    // Check expiry
    if (Date.now() > entry.expires) {
      this.storage.delete(key);
      return null;
    }

    return entry.value;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.storage.get(key);
    if (!entry) {
      return false;
    }

    // Check expiry
    if (Date.now() > entry.expires) {
      this.storage.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.expires) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Stop cleanup interval (call when shutting down)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.storage.clear();
  }
}

// Singleton instances
export const cryptoService = new CryptoServiceImpl();
export const secureStorage = new SessionSecureStorage();
