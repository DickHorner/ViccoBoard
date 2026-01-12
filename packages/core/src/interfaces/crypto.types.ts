/**
 * Crypto Interface
 * Defines contracts for encryption/decryption operations
 */

export interface CryptoService {
  /**
   * Hash a password for storage
   */
  hashPassword(password: string): Promise<string>;
  
  /**
   * Verify a password against its hash
   */
  verifyPassword(password: string, hash: string): Promise<boolean>;
  
  /**
   * Generate a random encryption key
   */
  generateKey(): Promise<string>;
  
  /**
   * Encrypt data
   */
  encrypt(data: string, key: string): Promise<string>;
  
  /**
   * Decrypt data
   */
  decrypt(encryptedData: string, key: string): Promise<string>;
  
  /**
   * Generate a secure random token
   */
  generateToken(length?: number): Promise<string>;
  
  /**
   * Hash data (one-way)
   */
  hash(data: string): Promise<string>;
}

export interface SecureStorage {
  /**
   * Store sensitive data securely
   */
  set(key: string, value: string): Promise<void>;
  
  /**
   * Retrieve sensitive data
   */
  get(key: string): Promise<string | null>;
  
  /**
   * Delete sensitive data
   */
  delete(key: string): Promise<void>;
  
  /**
   * Check if key exists
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Clear all data (use with caution!)
   */
  clear(): Promise<void>;
}
