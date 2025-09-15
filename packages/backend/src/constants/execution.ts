/**
 * Execution Constants
 */

export const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled'
} as const;

export const EXECUTION_DEFAULTS = {
  TIMEOUT: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  MAX_CONCURRENT: 10
} as const;

export const ERROR_HANDLING_STRATEGIES = {
  STOP: 'stop',
  CONTINUE: 'continue',
  RETRY: 'retry'
} as const;

export const WORKFLOW_EXECUTION_EVENTS = {
  STARTED: 'execution:started',
  NODE_COMPLETED: 'execution:node_completed',
  NODE_FAILED: 'execution:node_failed',
  COMPLETED: 'execution:completed',
  FAILED: 'execution:failed',
  CANCELLED: 'execution:cancelled'
} as const;