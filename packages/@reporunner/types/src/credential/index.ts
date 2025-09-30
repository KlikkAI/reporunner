/**
 * Credential Types - Authentication and API credentials
 */

import type { ID, Timestamp, BaseEntity } from '../common';

/**
 * Credential type
 */
export type CredentialType =
  | 'apiKey'
  | 'oauth2'
  | 'oauth1'
  | 'basic'
  | 'jwt'
  | 'serviceAccount'
  | 'custom';

/**
 * OAuth2 grant type
 */
export type OAuth2GrantType =
  | 'authorizationCode'
  | 'clientCredentials'
  | 'password'
  | 'implicit';

/**
 * Credential data - varies by type
 */
export interface ICredentialData {
  // API Key
  apiKey?: string;
  apiSecret?: string;

  // OAuth2
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: Timestamp;
  scope?: string;

  // OAuth1
  consumerKey?: string;
  consumerSecret?: string;
  token?: string;
  tokenSecret?: string;

  // Basic Auth
  username?: string;
  password?: string;

  // JWT
  jwtToken?: string;

  // Service Account
  clientEmail?: string;
  privateKey?: string;
  projectId?: string;

  // Custom fields
  [key: string]: any;
}

/**
 * Credential test result
 */
export interface ICredentialTestResult {
  success: boolean;
  message?: string;
  testedAt: Timestamp;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Credential interface
 */
export interface ICredential extends BaseEntity {
  name: string;
  type: CredentialType;
  credentialType: string; // e.g., 'gmailOAuth2Api', 'slackApi'
  data: ICredentialData;
  encryptedData?: string; // Encrypted version of sensitive data
  organizationId?: ID;
  ownerId: ID;
  sharedWith?: ID[];
  lastTestedAt?: Timestamp;
  testResult?: ICredentialTestResult;
  isExpired?: boolean;
  expiresAt?: Timestamp;
}

/**
 * Credential definition for node types
 */
export interface ICredentialDefinition {
  name: string;
  displayName: string;
  type: CredentialType;
  properties: Array<{
    name: string;
    type: 'string' | 'password' | 'hidden';
    required?: boolean;
    displayName: string;
    description?: string;
    placeholder?: string;
  }>;
  authenticate?: {
    type: 'oauth2' | 'oauth1' | 'apiKey' | 'bearer';
    properties?: Record<string, any>;
  };
  test?: {
    request: {
      url: string;
      method: string;
    };
  };
}

/**
 * OAuth configuration
 */
export interface IOAuthConfig {
  authUrl: string;
  accessTokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scope: string;
  grantType: OAuth2GrantType;
  redirectUri?: string;
}