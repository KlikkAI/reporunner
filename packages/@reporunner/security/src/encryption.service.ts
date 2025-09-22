import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
  createHash,
} from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyDerivation: string;
}

export interface EncryptionOptions {
  algorithm?: string;
  saltLength?: number;
  ivLength?: number;
  tagLength?: number;
  keyLength?: number;
  iterations?: number;
}

export class EncryptionService {
  private readonly defaultOptions: Required<EncryptionOptions> = {
    algorithm: "aes-256-gcm",
    saltLength: 32,
    ivLength: 16,
    tagLength: 16,
    keyLength: 32,
    iterations: 100000,
  };

  private options: Required<EncryptionOptions>;

  constructor(options?: EncryptionOptions) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  async encrypt(data: string, masterKey: string): Promise<EncryptedData> {
    // Generate random salt and IV
    const salt = randomBytes(this.options.saltLength);
    const iv = randomBytes(this.options.ivLength);

    // Derive encryption key from master key
    const key = await this.deriveKey(masterKey, salt);

    // Create cipher
    const cipher = createCipheriv(this.options.algorithm, key, iv);

    // Encrypt data
    const encryptedBuffers: Buffer[] = [];
    encryptedBuffers.push(cipher.update(data, "utf8"));
    encryptedBuffers.push(cipher.final());
    const encrypted = Buffer.concat(encryptedBuffers);

    // Get auth tag for GCM mode
    const authTag = (cipher as any).getAuthTag();

    return {
      encrypted: encrypted.toString("base64"),
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      algorithm: this.options.algorithm,
      keyDerivation: "scrypt",
    };
  }

  /**
   * Decrypt data encrypted with encrypt()
   */
  async decrypt(
    encryptedData: EncryptedData,
    masterKey: string,
  ): Promise<string> {
    // Parse base64 encoded values
    const encrypted = Buffer.from(encryptedData.encrypted, "base64");
    const salt = Buffer.from(encryptedData.salt, "base64");
    const iv = Buffer.from(encryptedData.iv, "base64");
    const authTag = Buffer.from(encryptedData.authTag, "base64");

    // Derive the same key
    const key = await this.deriveKey(masterKey, salt);

    // Create decipher
    const decipher = createDecipheriv(
      encryptedData.algorithm || this.options.algorithm,
      key,
      iv,
    );

    // Set auth tag for GCM mode
    (decipher as any).setAuthTag(authTag);

    // Decrypt data
    const decryptedBuffers: Buffer[] = [];
    decryptedBuffers.push(decipher.update(encrypted));
    decryptedBuffers.push(decipher.final());

    return Buffer.concat(decryptedBuffers).toString("utf8");
  }

  /**
   * Encrypt large data using streaming
   */
  async encryptStream(
    inputStream: NodeJS.ReadableStream,
    outputStream: NodeJS.WritableStream,
    masterKey: string,
  ): Promise<EncryptedData> {
    const salt = randomBytes(this.options.saltLength);
    const iv = randomBytes(this.options.ivLength);
    const key = await this.deriveKey(masterKey, salt);

    const cipher = createCipheriv(this.options.algorithm, key, iv);

    return new Promise((resolve, reject) => {
      inputStream
        .pipe(cipher)
        .pipe(outputStream)
        .on("finish", () => {
          const authTag = (cipher as any).getAuthTag();
          resolve({
            encrypted: "", // Stream output, no base64 string
            salt: salt.toString("base64"),
            iv: iv.toString("base64"),
            authTag: authTag.toString("base64"),
            algorithm: this.options.algorithm,
            keyDerivation: "scrypt",
          });
        })
        .on("error", reject);
    });
  }

  /**
   * Generate encryption key for field-level encryption
   */
  async generateFieldKey(
    masterKey: string,
    fieldName: string,
  ): Promise<string> {
    const hash = createHash("sha256");
    hash.update(`${masterKey}:${fieldName}`);
    return hash.digest("hex");
  }

  /**
   * Encrypt specific fields in an object
   */
  async encryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
    masterKey: string,
  ): Promise<T> {
    const encrypted = { ...obj };

    for (const field of fields) {
      if (obj[field] !== undefined && obj[field] !== null) {
        const fieldKey = await this.generateFieldKey(masterKey, String(field));
        const encryptedData = await this.encrypt(String(obj[field]), fieldKey);
        (encrypted as any)[field] = JSON.stringify(encryptedData);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt specific fields in an object
   */
  async decryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
    masterKey: string,
  ): Promise<T> {
    const decrypted = { ...obj };

    for (const field of fields) {
      if (obj[field] !== undefined && obj[field] !== null) {
        try {
          const fieldKey = await this.generateFieldKey(
            masterKey,
            String(field),
          );
          const encryptedData = JSON.parse(String(obj[field]));
          (decrypted as any)[field] = await this.decrypt(
            encryptedData,
            fieldKey,
          );
        } catch (error) {
          // Field might not be encrypted, leave as is
          console.warn(`Failed to decrypt field ${String(field)}:`, error);
        }
      }
    }

    return decrypted;
  }

  /**
   * Rotate encryption keys
   */
  async rotateEncryption(
    encryptedData: EncryptedData,
    oldMasterKey: string,
    newMasterKey: string,
  ): Promise<EncryptedData> {
    // Decrypt with old key
    const decrypted = await this.decrypt(encryptedData, oldMasterKey);

    // Re-encrypt with new key
    return await this.encrypt(decrypted, newMasterKey);
  }

  /**
   * Generate cryptographically secure random token
   */
  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString("hex");
  }

  /**
   * Hash data using SHA-256
   */
  hash(data: string): string {
    return createHash("sha256").update(data).digest("hex");
  }

  /**
   * Compare hash with data
   */
  verifyHash(data: string, hash: string): boolean {
    return this.hash(data) === hash;
  }

  /**
   * Derive encryption key from master key using scrypt
   */
  private async deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(
      masterKey,
      salt,
      this.options.keyLength,
    )) as Buffer;
  }

  /**
   * Create deterministic encryption (same input = same output)
   * WARNING: Less secure, use only when necessary (e.g., for searching encrypted data)
   */
  async encryptDeterministic(data: string, masterKey: string): Promise<string> {
    // Use a deterministic salt based on the master key
    const salt = createHash("sha256").update(masterKey).digest();
    const key = await this.deriveKey(
      masterKey,
      salt.slice(0, this.options.saltLength),
    );

    // Use a deterministic IV (less secure but necessary for deterministic encryption)
    const iv = createHash("sha256")
      .update(data)
      .digest()
      .slice(0, this.options.ivLength);

    const cipher = createCipheriv("aes-256-cbc", key, iv); // CBC mode for deterministic
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    return encrypted;
  }

  /**
   * Encrypt sensitive data with expiration
   */
  async encryptWithExpiry(
    data: string,
    masterKey: string,
    expiryMs: number,
  ): Promise<EncryptedData & { expiry: number }> {
    const encrypted = await this.encrypt(data, masterKey);
    const expiry = Date.now() + expiryMs;

    return {
      ...encrypted,
      expiry,
    };
  }

  /**
   * Decrypt data with expiry check
   */
  async decryptWithExpiry(
    encryptedData: EncryptedData & { expiry: number },
    masterKey: string,
  ): Promise<string | null> {
    if (Date.now() > encryptedData.expiry) {
      return null; // Data has expired
    }

    return await this.decrypt(encryptedData, masterKey);
  }

  /**
   * Validate encryption strength
   */
  validateEncryptionStrength(masterKey: string): {
    isStrong: boolean;
    score: number;
    suggestions: string[];
  } {
    let score = 0;
    const suggestions: string[] = [];

    // Check length
    if (masterKey.length >= 32) score += 25;
    else if (masterKey.length >= 16) score += 15;
    else suggestions.push("Use at least 32 characters");

    // Check for uppercase
    if (/[A-Z]/.test(masterKey)) score += 25;
    else suggestions.push("Include uppercase letters");

    // Check for lowercase
    if (/[a-z]/.test(masterKey)) score += 25;
    else suggestions.push("Include lowercase letters");

    // Check for numbers
    if (/\d/.test(masterKey)) score += 12.5;
    else suggestions.push("Include numbers");

    // Check for special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(masterKey)) score += 12.5;
    else suggestions.push("Include special characters");

    return {
      isStrong: score >= 75,
      score,
      suggestions,
    };
  }
}

// Export a singleton instance for convenience
export const encryptionService = new EncryptionService();

export default EncryptionService;
