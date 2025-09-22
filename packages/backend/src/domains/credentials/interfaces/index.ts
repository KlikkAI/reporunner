/**
 * Credentials domain interfaces
 */

export interface ICredential {
  id: string;
  name: string;
  userId: string;
  integration: string;
  data: any; // Encrypted credential data
  verified: boolean;
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICredentialCreateRequest {
  name: string;
  integration: string;
  data: Record<string, any>;
}

export interface ICredentialUpdateRequest {
  name?: string;
  data?: Record<string, any>;
}

export interface ICredentialTestResult {
  success: boolean;
  message?: string;
  details?: any;
}

export interface IDecryptedCredential extends Omit<ICredential, 'data'> {
  data: Record<string, any>; // Decrypted credential data
}
