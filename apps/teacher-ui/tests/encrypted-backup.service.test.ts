/** @jest-environment node */
import { webcrypto } from 'node:crypto'
import {
  decryptBackupContent,
  encryptBackupContent,
  isEncryptedBackup
} from '../src/services/encrypted-backup.service'

Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto })

const legacyBackup = JSON.stringify({
  format: 'viccoboard-live-data-backup',
  formatVersion: 1,
  databaseName: 'viccoboard',
  exportedAt: '2026-11-13T00:00:00.000Z',
  stores: [{ name: 'students', records: [{ id: 'test-student', first_name: 'Löwen' }] }]
})

describe('encrypted backup format', () => {
  it('round-trips large content including non-ASCII data', async () => {
    const content = legacyBackup + 'ä'.repeat(20000) + 'ü'
    const encrypted = await encryptBackupContent(content, 'Eine lange Testpassphrase 2026')
    expect(isEncryptedBackup(JSON.parse(encrypted))).toBe(true)
    expect(encrypted).not.toContain('test-student')
    expect(await decryptBackupContent(JSON.parse(encrypted), 'Eine lange Testpassphrase 2026')).toBe(content)
  })

  it('uses a fresh salt and nonce on every export', async () => {
    const first = JSON.parse(await encryptBackupContent(legacyBackup, 'Eine lange Testpassphrase 2026'))
    const second = JSON.parse(await encryptBackupContent(legacyBackup, 'Eine lange Testpassphrase 2026'))
    expect(first.kdf.salt).not.toBe(second.kdf.salt)
    expect(first.cipher.iv).not.toBe(second.cipher.iv)
    expect(first.ciphertext).not.toBe(second.ciphertext)
  })

  it('rejects wrong passwords and tampered ciphertext', async () => {
    const encrypted = JSON.parse(await encryptBackupContent(legacyBackup, 'Eine lange Testpassphrase 2026'))
    await expect(decryptBackupContent(encrypted, 'Falsches Passwort 123456789')).rejects.toThrow('Backup-Passwort falsch')
    encrypted.ciphertext = encrypted.ciphertext.replace(/^./, encrypted.ciphertext[0] === 'A' ? 'B' : 'A')
    await expect(decryptBackupContent(encrypted, 'Eine lange Testpassphrase 2026')).rejects.toThrow('Backup-Passwort falsch')
  })

  it('rejects unsupported versions, excessive work factors and short export passwords', async () => {
    await expect(encryptBackupContent(legacyBackup, 'kurz')).rejects.toThrow('12 Zeichen')
    const encrypted = JSON.parse(await encryptBackupContent(legacyBackup, 'Eine lange Testpassphrase 2026'))
    encrypted.formatVersion = 2
    await expect(decryptBackupContent(encrypted, 'Eine lange Testpassphrase 2026')).rejects.toThrow('nicht unterstützt')
    encrypted.formatVersion = 1
    encrypted.kdf.iterations = 2_000_001
    await expect(decryptBackupContent(encrypted, 'Eine lange Testpassphrase 2026')).rejects.toThrow('nicht unterstützt')
  })

  it('does not mistake legacy unencrypted backups for encrypted files', () => {
    expect(isEncryptedBackup(JSON.parse(legacyBackup))).toBe(false)
  })
})
