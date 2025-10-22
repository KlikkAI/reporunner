import type { CredentialType } from '../../../../../shared/src/types/auth';
import { Credential, type ICredential } from '../../../models/Credential';
import { decrypt, encrypt } from '../../../utils/crypto';
import { logger } from '../../../utils/logger';

export interface CreateCredentialData {
  name: string;
  type: CredentialType;
  integration: string;
  data: Record<string, unknown>;
  expiresAt?: Date;
}

export interface UpdateCredentialData {
  name?: string;
  data?: Record<string, unknown>;
  expiresAt?: Date;
  isActive?: boolean;
}

export class CredentialService {
  private static instance: CredentialService;

  private constructor() {}

  public static getInstance(): CredentialService {
    if (!CredentialService.instance) {
      CredentialService.instance = new CredentialService();
    }
    return CredentialService.instance;
  }

  /**
   * Get all credentials for a user (without sensitive data)
   */
  async getCredentials(userId: string): Promise<ICredential[]> {
    try {
      const credentials = await Credential.find({ userId, isActive: true })
        .select('-data') // Exclude sensitive data
        .sort({ createdAt: -1 })
        .lean();

      return credentials;
    } catch (error) {
      logger.error('Error fetching credentials:', error);
      throw new Error('Failed to fetch credentials');
    }
  }

  /**
   * Get all credentials (debug only - admin access required)
   */
  async getAllCredentialsDebug(): Promise<ICredential[]> {
    try {
      const credentials = await Credential.find()
        .select('-data') // Even in debug, don't expose raw data
        .sort({ createdAt: -1 })
        .lean();

      return credentials;
    } catch (error) {
      logger.error('Error fetching all credentials (debug):', error);
      throw new Error('Failed to fetch credentials');
    }
  }

  /**
   * Get credential by ID with decrypted data
   */
  async getCredentialById(credentialId: string, userId: string): Promise<ICredential | null> {
    try {
      const credential = await Credential.findOne({
        _id: credentialId,
        userId,
        isActive: true,
      }).select('+data'); // Explicitly include encrypted data

      if (!credential) {
        return null;
      }

      // Decrypt the data before returning
      if (credential.data) {
        try {
          // Data is stored as encrypted string, decrypt it back to object
          credential.data = decrypt(credential.data as unknown as string) as Record<
            string,
            unknown
          >;
        } catch (decryptError) {
          logger.error('Failed to decrypt credential data:', decryptError);
          throw new Error('Failed to decrypt credential data');
        }
      }

      return credential;
    } catch (error) {
      logger.error('Error fetching credential by ID:', error);
      throw new Error('Failed to fetch credential');
    }
  }

  /**
   * Create new credential with encrypted data
   */
  async createCredential(
    userId: string,
    credentialData: CreateCredentialData
  ): Promise<ICredential> {
    try {
      // Encrypt credential data before storing (returns string, stored as Mixed type)
      const encryptedData = encrypt(credentialData.data) as unknown as Record<string, unknown>;

      const credential = await Credential.create({
        userId,
        name: credentialData.name,
        type: credentialData.type,
        integration: credentialData.integration,
        data: encryptedData,
        expiresAt: credentialData.expiresAt,
        verified: false,
        isValid: true,
        isActive: true,
      });

      // Remove encrypted data from response
      const credentialObj = credential.toObject();
      (credentialObj as { data?: unknown }).data = undefined;

      logger.info(`Credential created: ${credential._id} for user: ${userId}`);
      return credentialObj as ICredential;
    } catch (error) {
      logger.error('Error creating credential:', error);
      throw new Error('Failed to create credential');
    }
  }

  /**
   * Update credential
   */
  async updateCredential(
    credentialId: string,
    userId: string,
    updates: UpdateCredentialData
  ): Promise<ICredential> {
    try {
      const credential = await Credential.findOne({
        _id: credentialId,
        userId,
      });

      if (!credential) {
        throw new Error('Credential not found');
      }

      // Update fields
      if (updates.name !== undefined) {
        credential.name = updates.name;
      }

      if (updates.data !== undefined) {
        // Encrypt new data (encrypt returns string, stored in data field)
        credential.data = encrypt(updates.data) as unknown as Record<string, unknown>;
      }

      if (updates.expiresAt !== undefined) {
        credential.expiresAt = updates.expiresAt;
      }

      if (updates.isActive !== undefined) {
        credential.isActive = updates.isActive;
      }

      await credential.save();

      // Remove encrypted data from response
      const credentialObj = credential.toObject();
      (credentialObj as { data?: unknown }).data = undefined;

      logger.info(`Credential updated: ${credentialId}`);
      return credentialObj as ICredential;
    } catch (error) {
      logger.error('Error updating credential:', error);
      throw new Error('Failed to update credential');
    }
  }

  /**
   * Delete credential (soft delete)
   */
  async deleteCredential(credentialId: string, userId: string): Promise<void> {
    try {
      const credential = await Credential.findOne({
        _id: credentialId,
        userId,
      });

      if (!credential) {
        throw new Error('Credential not found');
      }

      // Soft delete by marking as inactive
      credential.isActive = false;
      await credential.save();

      logger.info(`Credential deleted: ${credentialId}`);
    } catch (error) {
      logger.error('Error deleting credential:', error);
      throw new Error('Failed to delete credential');
    }
  }

  /**
   * Test credential connection
   */
  async testCredential(
    credentialId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const credential = await this.getCredentialById(credentialId, userId);

      if (!credential) {
        throw new Error('Credential not found');
      }

      if (credential.isExpired?.()) {
        return {
          success: false,
          message: 'Credential has expired',
        };
      }

      // Mark credential as used
      await Credential.findByIdAndUpdate(credentialId, {
        $set: { lastUsed: new Date(), verified: true },
      });

      // TODO: Implement actual connection tests based on credential type
      // For now, return success if credential exists and is not expired
      return {
        success: true,
        message: 'Credential test successful',
      };
    } catch (error) {
      logger.error('Error testing credential:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Credential test failed',
      };
    }
  }

  /**
   * Test Gmail credential specifically
   */
  async testGmailCredential(
    credentialId: string,
    userId: string,
    filters: Record<string, unknown>
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const credential = await this.getCredentialById(credentialId, userId);

      if (!credential) {
        throw new Error('Credential not found');
      }

      if (credential.type !== 'gmailOAuth2') {
        throw new Error('Credential is not a Gmail OAuth2 credential');
      }

      if (credential.isExpired?.()) {
        return {
          success: false,
          message: 'Gmail credential has expired. Please re-authenticate.',
        };
      }

      // Mark credential as used
      await Credential.findByIdAndUpdate(credentialId, {
        $set: { lastUsed: new Date(), verified: true },
      });

      // TODO: Implement actual Gmail API connection test
      // For now, return mock success
      logger.info(`Gmail credential test initiated for: ${credentialId} with filters:`, filters);

      return {
        success: true,
        message: 'Gmail credential test successful',
        data: {
          // Mock data - replace with actual Gmail API response
          emails: [],
          count: 0,
        },
      };
    } catch (error) {
      logger.error('Error testing Gmail credential:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gmail credential test failed',
      };
    }
  }
}
