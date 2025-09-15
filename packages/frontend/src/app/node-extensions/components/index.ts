/**
 * Node Extension Components Export
 * Centralized exports for all reusable UI components
 */

export { default as NodeBadge, NodeBadgeGroup } from "./NodeBadge";
export {
  createStatusBadge,
  createCountBadge,
  createTextBadge,
  createIconBadge,
} from "./NodeBadge";

export { default as NodeHandle, NodeHandleGroup } from "./NodeHandle";
export {
  createInputHandle,
  createOutputHandle,
  createAIHandle,
  createConditionHandle,
  createWebhookHandle,
  createTriggerHandle,
} from "./NodeHandle";

export { default as EnhancedNodeToolbar } from "./EnhancedNodeToolbar";
export { default as PropertyField } from "./PropertyField";

// Re-export types for convenience
export type {
  NodeBadge as NodeBadgeType,
  CustomHandle,
  ToolbarAction,
  BadgePosition,
  HandleStyle,
  NodeTheme,
} from "../types";
