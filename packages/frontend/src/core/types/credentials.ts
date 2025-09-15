export interface CredentialType {
  name: string
  displayName: string
  description: string
  icon: string
  properties: CredentialProperty[]
  testFunction?: string
  authenticate?: AuthenticateFunction
}

export interface CredentialProperty {
  displayName: string
  name: string
  type: 'string' | 'password' | 'number' | 'boolean' | 'options' | 'hidden'
  required?: boolean
  default?: string | number | boolean
  placeholder?: string
  description?: string
  options?: Array<{
    name: string
    value: string | number
  }>
  displayOptions?: {
    show?: Record<string, string[]>
    hide?: Record<string, string[]>
  }
}

export interface AuthenticateFunction {
  type: 'predefined' | 'generic'
  properties?: Record<string, string>
}

export interface Credential {
  id: string
  _id?: string // MongoDB _id for backward compatibility
  name: string
  type: string
  integration?: string
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
  testedAt?: string
  isValid?: boolean
}

export interface CredentialTestResult {
  success: boolean
  message: string
  data?: any
  details?: Record<string, unknown>
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
        default: 'smtp.gmail.com',
        placeholder: 'smtp.gmail.com',
      },
      {
        displayName: 'Port',
        name: 'port',
        type: 'number',
        required: true,
        default: 465,
      },
      {
        displayName: 'Secure',
        name: 'secure',
        type: 'boolean',
        default: true,
        description: 'Use SSL/TLS',
      },
    ],
  },
  {
    name: 'httpBasicAuth',
    displayName: 'HTTP Basic Auth',
    description: 'Basic authentication for HTTP requests',
    icon: '🔐',
    properties: [
      {
        displayName: 'User',
        name: 'user',
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
    name: 'httpHeaderAuth',
    displayName: 'HTTP Header Auth',
    description: 'Header-based authentication',
    icon: '🔑',
    properties: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        default: 'Authorization',
        placeholder: 'Authorization',
      },
      {
        displayName: 'Value',
        name: 'value',
        type: 'password',
        required: true,
        placeholder: 'Bearer token123',
      },
    ],
  },
  {
    name: 'apiKey',
    displayName: 'API Key',
    description: 'Simple API key authentication',
    icon: '🗝️',
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'password',
        required: true,
      },
    ],
  },
  {
    name: 'postgres',
    displayName: 'PostgreSQL',
    description: 'PostgreSQL database credentials',
    icon: '🐘',
    properties: [
      {
        displayName: 'Host',
        name: 'host',
        type: 'string',
        required: true,
        default: 'localhost',
      },
      {
        displayName: 'Database',
        name: 'database',
        type: 'string',
        required: true,
      },
      {
        displayName: 'User',
        name: 'user',
        type: 'string',
        required: true,
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'password',
        required: true,
      },
      {
        displayName: 'Port',
        name: 'port',
        type: 'number',
        default: 5432,
      },
      {
        displayName: 'SSL',
        name: 'ssl',
        type: 'boolean',
        default: false,
      },
    ],
  },
  {
    name: 'mysql',
    displayName: 'MySQL',
    description: 'MySQL database credentials',
    icon: '🐬',
    properties: [
      {
        displayName: 'Host',
        name: 'host',
        type: 'string',
        required: true,
        default: 'localhost',
      },
      {
        displayName: 'Database',
        name: 'database',
        type: 'string',
        required: true,
      },
      {
        displayName: 'User',
        name: 'user',
        type: 'string',
        required: true,
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'password',
        required: true,
      },
      {
        displayName: 'Port',
        name: 'port',
        type: 'number',
        default: 3306,
      },
    ],
  },
  // AI Provider Credentials
  {
    name: 'openaiApi',
    displayName: 'OpenAI API',
    description: 'OpenAI API key for GPT models',
    icon: '🤖',
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'password',
        required: true,
        placeholder: 'sk-...',
        description:
          'Get your API key from https://platform.openai.com/api-keys',
      },
      {
        displayName: 'Organization ID (Optional)',
        name: 'organizationId',
        type: 'string',
        required: false,
        placeholder: 'org-...',
        description: 'Optional organization ID for team accounts',
      },
    ],
  },
  {
    name: 'anthropicApi',
    displayName: 'Anthropic API',
    description: 'Anthropic API key for Claude models',
    icon: '🧠',
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'password',
        required: true,
        placeholder: 'sk-ant-...',
        description: 'Get your API key from https://console.anthropic.com/',
      },
    ],
  },
  {
    name: 'googleAiApi',
    displayName: 'Google AI API',
    description: 'Google AI Studio API key for Gemini models',
    icon: '🔷',
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'password',
        required: true,
        placeholder: 'AIza...',
        description: 'Get your API key from https://aistudio.google.com/',
      },
    ],
  },
  {
    name: 'azureOpenAiApi',
    displayName: 'Azure OpenAI',
    description: 'Azure OpenAI Service credentials',
    icon: '☁️',
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'password',
        required: true,
        description: 'Azure OpenAI API key',
      },
      {
        displayName: 'Endpoint',
        name: 'endpoint',
        type: 'string',
        required: true,
        placeholder: 'https://your-resource.openai.azure.com/',
        description: 'Azure OpenAI endpoint URL',
      },
      {
        displayName: 'API Version',
        name: 'apiVersion',
        type: 'string',
        required: true,
        default: '2024-02-01',
        placeholder: '2024-02-01',
        description: 'API version to use',
      },
    ],
  },
  {
    name: 'awsBedrockApi',
    displayName: 'AWS Bedrock',
    description: 'AWS Bedrock service credentials',
    icon: '🟠',
    properties: [
      {
        displayName: 'Access Key ID',
        name: 'accessKeyId',
        type: 'password',
        required: true,
        description: 'AWS Access Key ID',
      },
      {
        displayName: 'Secret Access Key',
        name: 'secretAccessKey',
        type: 'password',
        required: true,
        description: 'AWS Secret Access Key',
      },
      {
        displayName: 'Region',
        name: 'region',
        type: 'string',
        required: true,
        default: 'us-east-1',
        placeholder: 'us-east-1',
        description: 'AWS region for Bedrock service',
      },
    ],
  },
]
