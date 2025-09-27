// AI Provider Constants
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  OLLAMA: 'ollama',
  MISTRAL: 'mistral',
  COHERE: 'cohere',
} as const;

// Node Category Constants
export const NODE_CATEGORIES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  LOGIC: 'logic',
  DATA: 'data',
  COMMUNICATION: 'communication',
  AI_ML: 'ai-ml',
  INTEGRATION: 'integration',
  UTILITY: 'utility',
} as const;

// Node Provider Constants
export const NODE_PROVIDERS: Record<string, unknown> = {};

// Node Type Constants
export const NODE_TYPES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  WEBHOOK: 'webhook',
  EMAIL: 'email',
  TRANSFORM: 'transform',
  AI_AGENT: 'ai-agent',
  DATABASE: 'database',
} as const;

// Default Messages
export const MESSAGES = {
  SUCCESS: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    OPERATION_COMPLETED: 'Operation completed successfully',
  },
  ERROR: {
    INTERNAL_ERROR: 'An internal error occurred. Please try again later.',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    NOT_FOUND: 'The requested resource was not found',
    VALIDATION_FAILED: 'Validation failed. Please check your input.',
    RATE_LIMITED: 'Too many requests. Please try again later.',
  },
} as const;
