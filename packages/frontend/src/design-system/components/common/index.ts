/**
 * Common UI Components
 * Shared components used across different node types
 */

// Re-export utility functions from app node-extensions for backward compatibility
export {
  createCountBadge,
  createIconBadge,
  createStatusBadge,
  createTextBadge,
} from '../../../app/node-extensions/components/NodeBadge';
export {
  createAIHandle,
  createConditionHandle,
  createInputHandle,
  createOutputHandle,
  createTriggerHandle,
  createWebhookHandle,
} from '../../../app/node-extensions/components/NodeHandle';
export { default as EnhancedNodeToolbar } from './EnhancedNodeToolbar';
export { default as PropertyField } from './PropertyField';
