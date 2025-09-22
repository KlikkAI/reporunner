/**
 * Encryption and security utilities
 */

import crypto from 'crypto';
// Note: bcrypt would need to be installed: npm install bcrypt @types/bcrypt

export class EncryptionUtils {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SALT_ROUNDS = 12;

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string, key: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(EncryptionUtils.ALGORITHM, key);
    cipher.setAAD(Buffer.from('additional-data'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(
    encryptedData: { encrypted: string; iv: string; tag: string },
    key: string
  ): string {
    const decipher = crypto.createDecipher(EncryptionUtils.ALGORITHM, key);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash password using bcrypt (requires bcrypt package)
   */
  static async hashPassword(password: string): Promise<string> {
    // return bcrypt.hash(password, this.SALT_ROUNDS);
    throw new Error('bcrypt package not installed. Run: npm install bcrypt @types/bcrypt');
  }

  /**
   * Compare password with hash (requires bcrypt package)
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    // return bcrypt.compare(password, hash);
    throw new Error('bcrypt package not installed. Run: npm install bcrypt @types/bcrypt');
  }

  /**
   * Generate secure random string
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Create hash of string
   */
  static createHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }
}
