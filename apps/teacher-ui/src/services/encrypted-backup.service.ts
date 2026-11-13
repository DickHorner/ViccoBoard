const BACKUP_FORMAT = 'viccoboard-encrypted-backup'
const BACKUP_VERSION = 1
const KDF_ITERATIONS = 600_000
const SALT_SIZE = 16
const IV_SIZE = 12
const BASE64_ENCODE_CHUNK_SIZE = 24 * 1024
const BASE64_DECODE_CHUNK_SIZE = 32 * 1024

interface EncryptedBackupFile {
  format: typeof BACKUP_FORMAT
  formatVersion: number
  kdf: {
    algorithm: 'PBKDF2'
    hash: 'SHA-256'
    iterations: number
    salt: string
  }
  cipher: {
    algorithm: 'AES-256-GCM'
    iv: string
  }
  ciphertext: string
}

export function isEncryptedBackup(value: unknown): boolean {
  return Boolean(value) && typeof value === 'object' &&
    (value as Record<string, unknown>).format === BACKUP_FORMAT
}

export async function encryptBackupContent(content: string, password: string): Promise<string> {
  if (password.trim().length < 12) {
    throw new Error('Das Backup-Passwort muss mindestens 12 Zeichen enthalten.')
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE))
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE))
  const key = await deriveKey(password, salt, KDF_ITERATIONS)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(content)
  )

  const file: EncryptedBackupFile = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_VERSION,
    kdf: {
      algorithm: 'PBKDF2',
      hash: 'SHA-256',
      iterations: KDF_ITERATIONS,
      salt: encodeBase64(salt)
    },
    cipher: { algorithm: 'AES-256-GCM', iv: encodeBase64(iv) },
    ciphertext: encodeBase64(new Uint8Array(ciphertext))
  }

  return JSON.stringify(file)
}

export async function decryptBackupContent(value: unknown, password: string): Promise<string> {
  if (!isEncryptedBackup(value)) {
    throw new Error('Keine verschlüsselte ViccoBoard-Sicherung.')
  }

  const file = value as EncryptedBackupFile
  if (file.formatVersion !== BACKUP_VERSION ||
      file.kdf?.algorithm !== 'PBKDF2' ||
      file.kdf.hash !== 'SHA-256' ||
      !Number.isInteger(file.kdf.iterations) ||
      file.kdf.iterations < 100_000 || file.kdf.iterations > 2_000_000 ||
      file.cipher?.algorithm !== 'AES-256-GCM') {
    throw new Error('Das verschlüsselte Backupformat wird nicht unterstützt.')
  }

  const salt = decodeBase64(file.kdf.salt)
  const iv = decodeBase64(file.cipher.iv)
  const ciphertext = decodeBase64(file.ciphertext)
  if (salt.length !== SALT_SIZE || iv.length !== IV_SIZE || ciphertext.length < 16) {
    throw new Error('Die verschlüsselte Backup-Datei ist ungültig.')
  }
  if (!password) {
    throw new Error('Bitte das Backup-Passwort eingeben.')
  }

  const key = await deriveKey(password, salt, file.kdf.iterations)
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    return new TextDecoder('utf-8', { fatal: true }).decode(plaintext)
  } catch {
    throw new Error('Backup-Passwort falsch oder Sicherung beschädigt.')
  }
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const source = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    source,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function encodeBase64(bytes: Uint8Array): string {
  const parts: string[] = []
  for (let index = 0; index < bytes.length; index += BASE64_ENCODE_CHUNK_SIZE) {
    parts.push(btoa(String.fromCharCode(...bytes.subarray(index, index + BASE64_ENCODE_CHUNK_SIZE))))
  }
  return parts.join('')
}

function decodeBase64(value: unknown): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || value.length === 0 || value.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error('Die verschlüsselte Backup-Datei ist ungültig.')
  }

  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0
  const bytes = new Uint8Array(new ArrayBuffer((value.length / 4) * 3 - padding))
  let offset = 0
  for (let index = 0; index < value.length; index += BASE64_DECODE_CHUNK_SIZE) {
    const chunk = atob(value.slice(index, index + BASE64_DECODE_CHUNK_SIZE))
    for (let i = 0; i < chunk.length; i++) {
      bytes[offset++] = chunk.charCodeAt(i)
    }
  }
  return bytes
}
