import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface Credential {
  id: string;
  integrationName: string;
  userId: string;
  type: 'api_key' | 'oauth_token' | 'password' | 'certificate' | 'custom';
  name: string;
  value: string; // Encrypted
  metadata?: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  tags?: string[];
  isActive: boolean;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

export interface CredentialFilter {
  integrationName?: string;
  userId?: string;
  type?: Credential['type'];
  tags?: string[];
  isActive?: boolean;
  includeExpired?: boolean;
}

export interface CredentialRotationPolicy {
  maxAge?: number; // Days
  autoRotate?: boolean;
  notifyBeforeExpiry?: number; // Days
  allowManualRotation?: boolean;
}

export class CredentialManager extends EventEmitter {
  private credentials: Map<string, Credential> = new Map();
  private encryptionKey: Buffer;
  private algorithm: string = 'aes-256-gcm';
  private rotationPolicies: Map<string, CredentialRotationPolicy> = new Map();
  private accessLog: Array<{
    credentialId: string;
    timestamp: Date;
    action: string;
    userId?: string;
  }> = [];

  constructor(masterKey?: string) {
    super();

    // Use provided master key or generate one
    if (masterKey) {
      this.encryptionKey = this.deriveKey(masterKey);
    } else {
      // In production, this should be loaded from secure storage
      this.encryptionKey = crypto.randomBytes(32);
      console.warn(
        'Using auto-generated encryption key. In production, use a persistent master key.'
      );
    }

    this.startExpiryChecker();
  }

  /**
   * Derive encryption key from master key
   */
  private deriveKey(masterKey: string): Buffer {
    const salt = 'reporunner-credential-salt'; // In production, use a random salt stored securely
    return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
  }

  /**
   * Encrypt data
   */
  private encrypt(data: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: this.algorithm,
    };
  }

  /**
   * Decrypt data
   */
  private decrypt(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      this.encryptionKey,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Store credential
   */
  async storeCredential(
    integrationName: string,
    userId: string,
    type: Credential['type'],
    name: string,
    value: string,
    metadata?: Record<string, any>,
    expiresAt?: Date,
    tags?: string[]
  ): Promise<string> {
    const id = this.generateCredentialId();

    // Encrypt the credential value
    const encryptedData = this.encrypt(value);
    const encryptedValue = JSON.stringify(encryptedData);

    const credential: Credential = {
      id,
      integrationName,
      userId,
      type,
      name,
      value: encryptedValue,
      metadata,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
      tags,
      isActive: true,
    };

    this.credentials.set(id, credential);

    // Log the action
    this.logAccess(id, 'create', userId);

    this.emit('credential:created', {
      id,
      integrationName,
      userId,
      type,
      name,
    });

    return id;
  }

  /**
   * Retrieve credential
   */
  async retrieveCredential(
    id: string,
    userId?: string,
    decrypt: boolean = true
  ): Promise<Partial<Credential> | null> {
    const credential = this.credentials.get(id);

    if (!credential || !credential.isActive) {
      return null;
    }

    // Check if credential is expired
    if (credential.expiresAt && new Date() > credential.expiresAt) {
      this.emit('credential:expired', {
        id,
        integrationName: credential.integrationName,
      });
      return null;
    }

    // Update access information
    credential.lastAccessedAt = new Date();
    credential.accessCount++;

    // Log the access
    this.logAccess(id, 'retrieve', userId);

    // Return credential with decrypted value if requested
    const result = { ...credential };

    if (decrypt) {
      try {
        const encryptedData = JSON.parse(credential.value);
        result.value = this.decrypt(encryptedData);
      } catch (error: any) {
        this.emit('credential:decrypt_error', { id, error: error.message });
        throw new Error(`Failed to decrypt credential: ${error.message}`);
      }
    } else {
      // Don't return the encrypted value if not decrypting
      delete result.value;
    }

    return result;
  }

  /**
   * Update credential
   */
  async updateCredential(
    id: string,
    updates: {
      value?: string;
      metadata?: Record<string, any>;
      expiresAt?: Date;
      tags?: string[];
    }
  ): Promise<boolean> {
    const credential = this.credentials.get(id);

    if (!credential) {
      return false;
    }

    // Encrypt new value if provided
    if (updates.value) {
      const encryptedData = this.encrypt(updates.value);
      credential.value = JSON.stringify(encryptedData);
    }

    // Update other fields
    if (updates.metadata !== undefined) {
      credential.metadata = updates.metadata;
    }
    if (updates.expiresAt !== undefined) {
      credential.expiresAt = updates.expiresAt;
    }
    if (updates.tags !== undefined) {
      credential.tags = updates.tags;
    }

    credential.updatedAt = new Date();

    // Log the action
    this.logAccess(id, 'update');

    this.emit('credential:updated', {
      id,
      integrationName: credential.integrationName,
    });

    return true;
  }

  /**
   * Delete credential
   */
  async deleteCredential(id: string): Promise<boolean> {
    const credential = this.credentials.get(id);

    if (!credential) {
      return false;
    }

    // Soft delete by marking as inactive
    credential.isActive = false;
    credential.updatedAt = new Date();

    // Log the action
    this.logAccess(id, 'delete');

    // Optionally, permanently delete after a delay
    setTimeout(
      () => {
        this.credentials.delete(id);
      },
      7 * 24 * 60 * 60 * 1000
    ); // Delete after 7 days

    this.emit('credential:deleted', {
      id,
      integrationName: credential.integrationName,
    });

    return true;
  }

  /**
   * Rotate credential
   */
  async rotateCredential(id: string, newValue: string): Promise<string> {
    const oldCredential = this.credentials.get(id);

    if (!oldCredential) {
      throw new Error('Credential not found');
    }

    // Create new credential with same metadata
    const newId = await this.storeCredential(
      oldCredential.integrationName,
      oldCredential.userId,
      oldCredential.type,
      oldCredential.name,
      newValue,
      oldCredential.metadata,
      oldCredential.expiresAt,
      oldCredential.tags
    );

    // Mark old credential as rotated
    oldCredential.isActive = false;
    oldCredential.metadata = {
      ...oldCredential.metadata,
      rotatedTo: newId,
      rotatedAt: new Date(),
    };

    this.emit('credential:rotated', {
      oldId: id,
      newId,
      integrationName: oldCredential.integrationName,
    });

    return newId;
  }

  /**
   * Find credentials
   */
  findCredentials(filter: CredentialFilter): Credential[] {
    const results: Credential[] = [];

    this.credentials.forEach((credential) => {
      // Apply filters
      if (filter.integrationName && credential.integrationName !== filter.integrationName) {
        return;
      }
      if (filter.userId && credential.userId !== filter.userId) {
        return;
      }
      if (filter.type && credential.type !== filter.type) {
        return;
      }
      if (filter.isActive !== undefined && credential.isActive !== filter.isActive) {
        return;
      }
      if (!filter.includeExpired && credential.expiresAt && new Date() > credential.expiresAt) {
        return;
      }
      if (filter.tags && filter.tags.length > 0) {
        const hasAllTags = filter.tags.every((tag) => credential.tags?.includes(tag));
        if (!hasAllTags) {
          return;
        }
      }

      // Don't include the encrypted value in search results
      const result = { ...credential };
      delete (result as any).value;
      results.push(result);
    });

    return results;
  }

  /**
   * Set rotation policy
   */
  setRotationPolicy(integrationName: string, policy: CredentialRotationPolicy): void {
    this.rotationPolicies.set(integrationName, policy);

    this.emit('policy:set', {
      integrationName,
      policy,
    });
  }

  /**
   * Check for expiring credentials
   */
  private startExpiryChecker(): void {
    setInterval(
      () => {
        const now = new Date();

        this.credentials.forEach((credential) => {
          if (!credential.isActive || !credential.expiresAt) {
            return;
          }

          const daysUntilExpiry = Math.ceil(
            (credential.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Check rotation policy
          const policy = this.rotationPolicies.get(credential.integrationName);

          if (policy?.notifyBeforeExpiry && daysUntilExpiry <= policy.notifyBeforeExpiry) {
            this.emit('credential:expiring_soon', {
              id: credential.id,
              integrationName: credential.integrationName,
              daysUntilExpiry,
              expiresAt: credential.expiresAt,
            });
          }

          // Check if credential has expired
          if (daysUntilExpiry <= 0) {
            credential.isActive = false;
            this.emit('credential:expired', {
              id: credential.id,
              integrationName: credential.integrationName,
            });
          }
        });
      },
      60 * 60 * 1000
    ); // Check every hour
  }

  /**
   * Log access
   */
  private logAccess(credentialId: string, action: string, userId?: string): void {
    this.accessLog.push({
      credentialId,
      timestamp: new Date(),
      action,
      userId,
    });

    // Keep only last 10000 entries
    if (this.accessLog.length > 10000) {
      this.accessLog = this.accessLog.slice(-10000);
    }
  }

  /**
   * Get access log
   */
  getAccessLog(credentialId?: string): typeof this.accessLog {
    if (credentialId) {
      return this.accessLog.filter((entry) => entry.credentialId === credentialId);
    }
    return [...this.accessLog];
  }

  /**
   * Generate credential ID
   */
  private generateCredentialId(): string {
    return `cred_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Export credentials (encrypted)
   */
  async exportCredentials(): Promise<string> {
    const data = {
      credentials: Array.from(this.credentials.entries()),
      policies: Array.from(this.rotationPolicies.entries()),
      exportedAt: new Date(),
    };

    const encrypted = this.encrypt(JSON.stringify(data));
    return JSON.stringify(encrypted);
  }

  /**
   * Import credentials
   */
  async importCredentials(encryptedExport: string): Promise<number> {
    try {
      const encryptedData = JSON.parse(encryptedExport);
      const decrypted = this.decrypt(encryptedData);
      const data = JSON.parse(decrypted);

      let imported = 0;

      // Import credentials
      for (const [id, credential] of data.credentials) {
        this.credentials.set(id, credential);
        imported++;
      }

      // Import policies
      for (const [name, policy] of data.policies) {
        this.rotationPolicies.set(name, policy);
      }

      this.emit('credentials:imported', { count: imported });

      return imported;
    } catch (error: any) {
      throw new Error(`Failed to import credentials: ${error.message}`);
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalCredentials: number;
    activeCredentials: number;
    expiredCredentials: number;
    credentialsByType: Record<string, number>;
    credentialsByIntegration: Record<string, number>;
    recentAccesses: number;
  } {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
      totalCredentials: this.credentials.size,
      activeCredentials: 0,
      expiredCredentials: 0,
      credentialsByType: {} as Record<string, number>,
      credentialsByIntegration: {} as Record<string, number>,
      recentAccesses: this.accessLog.filter((entry) => entry.timestamp > oneDayAgo).length,
    };

    this.credentials.forEach((credential) => {
      if (credential.isActive) {
        if (credential.expiresAt && credential.expiresAt < now) {
          stats.expiredCredentials++;
        } else {
          stats.activeCredentials++;
        }
      }

      stats.credentialsByType[credential.type] =
        (stats.credentialsByType[credential.type] || 0) + 1;
      stats.credentialsByIntegration[credential.integrationName] =
        (stats.credentialsByIntegration[credential.integrationName] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear all credentials
   */
  clearAll(): void {
    this.credentials.clear();
    this.rotationPolicies.clear();
    this.accessLog = [];
  }
}

// Singleton instance
let credentialManagerInstance: CredentialManager | null = null;

export function getCredentialManager(masterKey?: string): CredentialManager {
  if (!credentialManagerInstance) {
    credentialManagerInstance = new CredentialManager(masterKey);
  }
  return credentialManagerInstance;
}

export default CredentialManager;
