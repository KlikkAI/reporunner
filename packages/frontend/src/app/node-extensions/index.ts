/**
 * Node Extensions - Main Export
 * Complete UI extension system for workflow nodes
 */

// Initialize components and themes immediately
import './bodies'; // Auto-registers specialized components
import './nodeUiRegistry'; // Initializes the registry and factory
import './themes'; // Initializes theme system including Gmail theme

// Import functions for internal use
import { getRegistryStatistics, listRegisteredComponentTypes } from './nodeUiRegistry';
import { themeManager } from './themes';

// ============================================================================
// Specialized Node Bodies (existing)
// ============================================================================
export { default as AIAgentNodeBody } from './AIAgentNodeBody';

export { ComponentFactory, componentFactory } from './ComponentFactory';
export { default as ConditionNodeBody } from './ConditionNodeBody';
export { default as EnhancedNodeToolbar } from './components/EnhancedNodeToolbar';
// ============================================================================
// Reusable Components
// ============================================================================
export {
  createCountBadge,
  createIconBadge,
  createStatusBadge,
  createTextBadge,
  default as NodeBadge,
  NodeBadgeGroup,
} from './components/NodeBadge';
export {
  createAIHandle,
  createConditionHandle,
  createInputHandle,
  createOutputHandle,
  createTriggerHandle,
  createWebhookHandle,
  default as NodeHandle,
  NodeHandleGroup,
} from './components/NodeHandle';
export { default as PropertyField } from './components/PropertyField';
// ============================================================================
// Core Registry System
// ============================================================================
export {
  enhancedRegistry,
  getCustomBodyComponent,
  getCustomPropertiesPanelComponent,
  getRegistryStatistics,
  hasCustomBody,
  hasCustomPropertiesPanel,
  listRegisteredComponentTypes,
  nodeUiRegistry,
  preloadNodeComponents,
  registerCustomBodyComponent,
  registerCustomPropertiesPanelComponent,
  registerLazyBodyComponent,
  registerLazyPropertiesPanel,
} from './nodeUiRegistry';
// ============================================================================
// Theme System
// ============================================================================
export {
  darkTheme,
  defaultTheme,
  NodeThemeProvider,
  ThemeManager,
  themeManager,
  useNodeTheme,
  useNodeThemeContext,
} from './themes';

// ============================================================================
// Type Definitions
// ============================================================================
export type {
  BadgePosition,
  // Component system
  CustomHandle,
  CustomHandleRendererProps,
  // Core types
  CustomNodeBodyProps,
  CustomPropertiesPanelProps,
  CustomToolbarProps,
  // Utility types
  DeepPartial,
  EnhancedNodeRegistry,
  // Enhanced node type
  EnhancedNodeTypeDescription,
  HandleStyle,
  NodeAnimation,
  NodeAnimationConfig,
  NodeBadge as NodeBadgeType,
  NodeColorScheme,
  NodeGradient,
  // Visual system
  NodeShape,
  NodeSpacing,
  // Theme system
  NodeTheme,
  NodeTypography,
  NodeUIConfig,
  NodeVisualConfig,
  ResponsiveValue,
  ThemeManager as IThemeManager,
  ThemeVariant,
  ToolbarAction,
  // Registry system
  UIComponentFactory,
} from './types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Initialize the node extension system
 */
export function initializeNodeExtensions(): void {
  // System is auto-initialized via imports
  console.log('Node Extensions System initialized');
  console.log('Registry stats:', getRegistryStatistics());
}

/**
 * Get the current system version
 */
export function getVersion(): string {
  return '2.0.0'; // Enhanced UI system version
}

/**
 * Get system information
 */
export function getSystemInfo() {
  return {
    version: getVersion(),
    components: listRegisteredComponentTypes(),
    stats: getRegistryStatistics(),
    themes: themeManager.getAllThemes().map((t) => t.name),
    currentTheme: themeManager.getCurrentTheme().name,
  };
}
