import type { Request } from 'express';
export interface AuthenticatedUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  tier?: string;
  organizationId?: string;
  tokenId?: string;
  sessionId?: string;
  profileCompleted?: boolean;
  [key: string]: unknown;
}
export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
/**
 * Credential types supported by the platform
 */
export type CredentialType =
  | 'gmailOAuth2'
  | 'openaiApi'
  | 'anthropicApi'
  | 'googleAiApi'
  | 'azureOpenAiApi'
  | 'awsBedrockApi'
  | 'ollamaApi'
  | 'postgres'
  | 'mongodb'
  | 'mysql'
  | 'redis'
  | 'slack'
  | 'discord'
  | 'webhook'
  | 'custom';
/**
 * Base credential interface
 */
export interface ICredential {
  id: string;
  name: string;
  type: CredentialType;
  userId: string;
  integration: string;
  data: any;
  verified?: boolean;
  isValid?: boolean;
  lastUsed?: Date | string;
  expiresAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
//# sourceMappingURL=auth.d.ts.map
