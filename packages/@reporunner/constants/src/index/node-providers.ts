} as
const;
// Minimal valid export to satisfy type-check; fill with real content later
export const NODE_PROVIDERS: Record<string, unknown> = {};
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  OLLAMA: 'ollama',
  MISTRAL: 'mistral',
  COHERE: 'cohere',
} as const;

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

export default {
  SYSTEM,
  API,
  DATABASE,
  AUTH,
  WEBSOCKET,
  UPLOAD,
  QUEUE,
  ERROR_CODES,
  EVENTS,
  PATTERNS,
  NODE_TYPES,
  NODE_CATEGORIES,
  AI_PROVIDERS,
  MESSAGES,
};
