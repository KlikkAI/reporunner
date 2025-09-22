// Application constants

export const NODE_TYPES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  AI_AGENT: 'ai-agent',
  TRANSFORM: 'transform',
  DATABASE: 'database',
  EMAIL: 'email',
  WEBHOOK: 'webhook',
} as const;

export const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled',
} as const;

export const INTEGRATION_CATEGORIES = {
  AI_AUTOMATION: 'AI & Automation',
  COMMUNICATION: 'Communication',
  DATA_STORAGE: 'Data & Storage',
  PRODUCTIVITY: 'Productivity',
  DEVELOPMENT: 'Development',
  MARKETING: 'Marketing',
  ECOMMERCE: 'E-commerce',
} as const;

export const CREDENTIAL_TYPES = {
  OAUTH2: 'oauth2',
  API_KEY: 'api-key',
  BASIC_AUTH: 'basic-auth',
} as const;

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  WORKFLOWS: '/api/workflows',
  EXECUTIONS: '/api/executions',
  CREDENTIALS: '/api/credentials',
  INTEGRATIONS: '/api/integrations',
} as const;
