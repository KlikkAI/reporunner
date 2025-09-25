import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';

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
