export interface CredentialType {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  properties: CredentialProperty[];
  testFunction?: string;
  authenticate?: AuthenticateFunction;
}

// API response format for credential types
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

export interface AuthenticateFunction {
  type: 'predefined' | 'generic';
  properties?: Record<string, string>;
}

export interface Credential {
  id: string;
  _id?: string; // MongoDB _id for backward compatibility
  name: string;
  type: string;
  integration?: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  testedAt?: string;
  isValid?: boolean;
}

export interface CredentialTestResult {
  success: boolean;
  message: string;
  data?: any;
  details?: Record<string, unknown>;
}

// Predefined credential types for workflow automation
export const credentialTypes: CredentialType[] = [
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
