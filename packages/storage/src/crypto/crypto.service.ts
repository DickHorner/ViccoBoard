/**
 * Crypto Service Implementation
 * Provides encryption, hashing, and secure key management
 * Uses Web Crypto API for secure encryption with proper key derivation
 * 
 * ✅ Browser-Compatible: Uses only standard Web Crypto APIs available in all modern browsers
 * ✅ Node.js Compatible: Same APIs work in Node.js 15+
 */

import * as bcrypt from 'bcryptjs';
import { CryptoService, SecureStorage } from '@viccoboard/core';

const SALT_ROUNDS = 10;
const DEFAULT_TOKEN_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;

// Fixed salt for key derivation (in production, store this securely or generate per-database)
// Use Web Crypto API for salt generation - works in both browsers and Node.js
const DERIVATION_SALT_STRING = 'ViccoBoard-v1-salt-fixed-2026';
const PADDED_SALT = new TextEncoder().encode(
  (DERIVATION_SALT_STRING + '\x00'.repeat(32)).substring(0, 32)
);

export class CryptoServiceImpl implements CryptoService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a cryptographically secure random key
   * Uses Web Crypto API getRandomValues() available in Node.js 15+ and all modern browsers
   */
  async generateKey(): Promise<string> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt data using AES-256-GCM with PBKDF2 key derivation
   * Format: Base64(IV || encrypted data || auth tag)
   */
  async encrypt(data: string, password: string): Promise<string> {
    try {
      const key = await this.deriveKey(password);
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );

      // Concatenate IV + encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 using Web-standard approach (works in both Node.js and browser)
      return btoa(String.fromCharCode.apply(null, Array.from(combined) as any));
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
      
      // Decode base64 using Web-standard approach
      const binaryString = atob(encryptedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (bytes.length < 12) {
        throw new Error('Invalid encrypted data: too short');
      }

      const iv = bytes.subarray(0, 12);
      const ciphertext = bytes.subarray(12);

      const decrypted = await crypto.subtle.decrypt(
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
   * Uses Web Crypto API SubtleCrypto - available in Node.js 15+ and all modern browsers
   */
  private async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
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

  /**
   * Generate a secure random token in hex format
   */
  async generateToken(length: number = DEFAULT_TOKEN_LENGTH): Promise<string> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash data using SHA-256
   * Uses Web Crypto API SubtleCrypto - available in Node.js 15+ and all modern browsers
   */
  async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
