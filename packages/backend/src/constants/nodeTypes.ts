/**
 * Node Type Constants
 */

export const NODE_TYPES = {
  // Core node types
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  TRANSFORM: 'transform',

  // AI/ML nodes
  AI_AGENT: 'ai-agent',
  EMBEDDING: 'embedding',
  VECTOR_STORE: 'vector-store',

  // Communication nodes
  GMAIL_TRIGGER: 'gmail-trigger',
  GMAIL_SEND: 'gmail-send',
  SLACK_SEND: 'slack-send',
  WEBHOOK: 'webhook',

  // Data nodes
  DATABASE: 'database',
  FILE: 'file',
  TRANSFORM_DATA: 'transform-data',

  // Flow control
  DELAY: 'delay',
  LOOP: 'loop',
  BRANCH: 'branch',
} as const;

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  OLLAMA: 'ollama',
} as const;

export const NODE_CATEGORIES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  LOGIC: 'logic',
  DATA: 'data',
  COMMUNICATION: 'communication',
  AI_ML: 'ai-ml',
} as const;
