import crypto from 'node:crypto';
import { logger } from './logger';

/**
 * Encryption utility for sensitive data (credentials, API keys, etc.)
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment or generate a warning
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;

  if (!key) {
    logger.warn(
      'WARNING: CREDENTIAL_ENCRYPTION_KEY not set. Using default key. NOT SECURE FOR PRODUCTION!'
    );
    return Buffer.from('default_insecure_key_32chars!!', 'utf-8').slice(0, 32);
  }

  // Ensure key is exactly 32 bytes (256 bits)
  if (key.length < 32) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be at least 32 characters long');
  }

  return Buffer.from(key, 'utf-8').slice(0, 32);
}

/**
 * Encrypt sensitive data
 * @param data - Data to encrypt (will be JSON stringified)
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
export function encrypt(data: unknown): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const dataString = JSON.stringify(data);
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypt sensitive data
 * @param encryptedData - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted data (parsed from JSON)
 */
export function decrypt(encryptedData: string): unknown {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a secure random key suitable for CREDENTIAL_ENCRYPTION_KEY
 * @returns Random 32-character string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64').slice(0, 32);
}

/**
 * Hash sensitive data (one-way, for comparison only)
 * Uses SHA-256 with salt
 * @param data - Data to hash
 * @returns Hashed string in format: salt:hash
 */
export function hash(data: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.createHmac('sha256', salt).update(data).digest('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify hashed data
 * @param data - Original data
 * @param hashedData - Hashed data in format: salt:hash
 * @returns true if data matches hash
 */
export function verifyHash(data: string, hashedData: string): boolean {
  const [salt, originalHash] = hashedData.split(':');
  const hash = crypto.createHmac('sha256', salt).update(data).digest('hex');
  return hash === originalHash;
}
