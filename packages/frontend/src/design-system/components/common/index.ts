/**
 * Common UI Components
 * Shared components used across different node types
 */

export { default as EnhancedNodeToolbar } from './EnhancedNodeToolbar'
export { default as PropertyField } from './PropertyField'

// Re-export utility functions from app node-extensions for backward compatibility
export { 
  createStatusBadge,
  createCountBadge,
  createTextBadge,
  createIconBadge
} from '../../../app/node-extensions/components/NodeBadge'

export {
  createInputHandle,
  createOutputHandle,
  createAIHandle,
  createConditionHandle,
  createWebhookHandle,
  createTriggerHandle
} from '../../../app/node-extensions/components/NodeHandle'