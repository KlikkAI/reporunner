/**
 * Frontend-Specific Credential Types
 *
 * Extends @reporunner/types with frontend-specific credential types
 * following the "extend, don't replace" pattern.
 *
 * Base types from @reporunner/types:
 * - ICredential: Basic credential entity
 * - ICredentialData: Credential data structure
 * - ICredentialTestResult: Test result structure
 * - ICredentialDefinition: Credential definition
 *
 * Frontend extensions:
 * - UI-specific API response formats
 * - Form property definitions
 * - Predefined credential configurations
 */

import type { CredentialType, ICredential } from '@reporunner/shared';

// ============================================================================
// Extended Credential Types
// ============================================================================

/**
 * Frontend Credential - extends ICredential with UI-specific fields
 */
export interface Credential
  extends Omit<
    ICredential,
    'credentialType' | 'organizationId' | 'ownerId' | 'sharedWith' | 'encryptedData' | 'type'
  > {
  _id?: string; // MongoDB _id for backward compatibility
  type: CredentialType; // Credential type identifier (use base type)
  integration: string; // Associated integration (required)
  testedAt?: string; // Last test timestamp
  isValid?: boolean; // Test validation status
}

// ============================================================================
// Frontend-Specific API Response Format
// ============================================================================

/**
 * API response format for credential types
 * Used for dynamic form generation from backend
 */
export interface CredentialTypeApiResponse {
  type: string;
  name: string;
  description: string;
  category: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    placeholder?: string;
    validation?: Record<string, unknown>;
  }>;
  supportsOAuth2: boolean;
  supportsTest: boolean;
  integrations: string[];
  icon?: string;
  displayName?: string;
}

// ============================================================================
// UI Form Property Definitions
// ============================================================================

/**
 * Credential property for dynamic form generation
 * Frontend-specific for UI rendering
 */
export interface CredentialProperty {
  displayName: string;
  name: string;
  type: 'string' | 'password' | 'number' | 'boolean' | 'options' | 'hidden';
  required?: boolean;
  default?: string | number | boolean;
  placeholder?: string;
  description?: string;
  options?: Array<{
    name: string;
    value: string | number;
  }>;
  displayOptions?: {
    show?: Record<string, string[]>;
    hide?: Record<string, string[]>;
  };
}

/**
 * Credential type definition for UI
 * Includes form properties and authentication config
 */
export interface CredentialTypeDefinition {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  properties: CredentialProperty[];
  testFunction?: string;
  authenticate?: AuthenticateFunction;
}

/**
 * Authentication function configuration
 */
export interface AuthenticateFunction {
  type: 'predefined' | 'generic';
  properties?: Record<string, string>;
}

/**
 * Credential test result (frontend version)
 * Simpler than ICredentialTestResult from @reporunner/types
 */
export interface CredentialTestResult {
  success: boolean;
  message: string;
  data?: any;
  details?: Record<string, unknown>;
}

// ============================================================================
// Predefined Credential Configurations
// ============================================================================

/**
 * Predefined credential types for workflow automation
 * Frontend-specific configurations for common integrations
 */
export const credentialTypes: CredentialTypeDefinition[] = [
  {
    name: 'gmailOAuth2',
    displayName: 'Gmail',
    description: 'Connect your Gmail account - no technical setup required',
    icon: '📧',
    properties: [
      // No properties needed - using shared OAuth app credentials
    ],
    authenticate: {
      type: 'predefined',
      properties: {
        oauth: 'OAuth2',
      },
    },
  },
  {
    name: 'smtp',
    displayName: 'SMTP',
    description: 'SMTP email authentication',
    icon: '📮',
    properties: [
      {
        displayName: 'User',
        name: 'user',
        type: 'string',
        required: true,
        placeholder: 'name@email.com',
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'password',
        required: true,
      },
      {
        displayName: 'Host',
        name: 'host',
        type: 'string',
        required: true,
        placeholder: 'smtp.gmail.com',
      },
      {
        displayName: 'Port',
        name: 'port',
        type: 'number',
        required: true,
        default: 587,
      },
      {
        displayName: 'Secure',
        name: 'secure',
        type: 'boolean',
        default: true,
        description: 'Use TLS',
      },
    ],
  },
  {
    name: 'httpBasicAuth',
    displayName: 'HTTP Basic Auth',
    description: 'Username and password authentication',
    icon: '🔐',
    properties: [
      {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        required: true,
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'password',
        required: true,
      },
    ],
  },
  {
    name: 'apiKey',
    displayName: 'API Key',
    description: 'Simple API key authentication',
    icon: '🔑',
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'password',
        required: true,
        placeholder: 'Enter your API key',
      },
      {
        displayName: 'Header Name',
        name: 'headerName',
        type: 'string',
        default: 'X-API-Key',
        description: 'The header to send the API key in',
      },
    ],
  },
  {
    name: 'bearerToken',
    displayName: 'Bearer Token',
    description: 'Bearer token authentication',
    icon: '🎫',
    properties: [
      {
        displayName: 'Token',
        name: 'token',
        type: 'password',
        required: true,
        placeholder: 'Enter your bearer token',
      },
    ],
  },
  {
    name: 'oauth2',
    displayName: 'OAuth2',
    description: 'Generic OAuth2 authentication',
    icon: '🔒',
    properties: [
      {
        displayName: 'Authorization URL',
        name: 'authUrl',
        type: 'string',
        required: true,
      },
      {
        displayName: 'Access Token URL',
        name: 'accessTokenUrl',
        type: 'string',
        required: true,
      },
      {
        displayName: 'Client ID',
        name: 'clientId',
        type: 'string',
        required: true,
      },
      {
        displayName: 'Client Secret',
        name: 'clientSecret',
        type: 'password',
        required: true,
      },
      {
        displayName: 'Scope',
        name: 'scope',
        type: 'string',
        placeholder: 'email profile',
      },
    ],
    authenticate: {
      type: 'generic',
      properties: {
        oauth: 'OAuth2',
      },
    },
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get credential type by name
 */
export function getCredentialType(name: string): CredentialTypeDefinition | undefined {
  return credentialTypes.find((ct) => ct.name === name);
}

/**
 * Get all credential type names
 */
export function getCredentialTypeNames(): string[] {
  return credentialTypes.map((ct) => ct.name);
}

/**
 * Check if credential is expired
 */
export function isCredentialExpired(credential: Credential): boolean {
  if (!credential.expiresAt) {
    return false;
  }
  return new Date(credential.expiresAt) < new Date();
}

/**
 * Check if credential needs testing
 */
export function needsCredentialTest(credential: Credential): boolean {
  if (!credential.testedAt) {
    return true;
  }

  // Test if older than 24 hours
  const testDate = new Date(credential.testedAt);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return testDate < dayAgo;
}
