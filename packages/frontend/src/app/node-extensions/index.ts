/**
 * Node Extensions - Main Export
 * Complete UI extension system for workflow nodes
 */

// Initialize components and themes immediately
import "./bodies"; // Auto-registers specialized components
import "./nodeUiRegistry"; // Initializes the registry and factory
import "./themes"; // Initializes theme system including Gmail theme

// ============================================================================
// Core Registry System
// ============================================================================
export {
  nodeUiRegistry,
  getCustomBodyComponent,
  getCustomPropertiesPanelComponent,
  registerCustomBodyComponent,
  registerCustomPropertiesPanelComponent,
  registerLazyBodyComponent,
  registerLazyPropertiesPanel,
  preloadNodeComponents,
  hasCustomBody,
  hasCustomPropertiesPanel,
  getRegistryStatistics,
  listRegisteredComponentTypes,
  enhancedRegistry,
} from "./nodeUiRegistry";

export { componentFactory, ComponentFactory } from "./ComponentFactory";

// ============================================================================
// Theme System
// ============================================================================
export {
  defaultTheme,
  darkTheme,
  themeManager,
  ThemeManager,
  useNodeTheme,
  NodeThemeProvider,
  useNodeThemeContext,
} from "./themes";

// ============================================================================
// Reusable Components
// ============================================================================
export { default as NodeBadge } from "./components/NodeBadge";
export {
  NodeBadgeGroup,
  createStatusBadge,
  createCountBadge,
  createTextBadge,
  createIconBadge,
} from "./components/NodeBadge";

export { default as NodeHandle } from "./components/NodeHandle";
export {
  NodeHandleGroup,
  createInputHandle,
  createOutputHandle,
  createAIHandle,
  createConditionHandle,
  createWebhookHandle,
  createTriggerHandle,
} from "./components/NodeHandle";

export { default as EnhancedNodeToolbar } from "./components/EnhancedNodeToolbar";
export { default as PropertyField } from "./components/PropertyField";

// ============================================================================
// Specialized Node Bodies (existing)
// ============================================================================
export { default as AIAgentNodeBody } from "./AIAgentNodeBody";
export { default as ConditionNodeBody } from "./ConditionNodeBody";

// ============================================================================
// Type Definitions
// ============================================================================
export type {
  // Core types
  CustomNodeBodyProps,
  CustomPropertiesPanelProps,
  CustomHandleRendererProps,
  CustomToolbarProps,

  // Enhanced node type
  EnhancedNodeTypeDescription,

  // Visual system
  NodeShape,
  NodeAnimation,
  NodeVisualConfig,
  NodeGradient,
  NodeBadge as NodeBadgeType,
  BadgePosition,

  // Component system
  CustomHandle,
  HandleStyle,
  ToolbarAction,

  // Theme system
  NodeTheme,
  NodeColorScheme,
  NodeTypography,
  NodeSpacing,
  NodeAnimationConfig,
  ThemeVariant,

  // Registry system
  UIComponentFactory,
  EnhancedNodeRegistry,
  ThemeManager as IThemeManager,

  // Utility types
  DeepPartial,
  NodeUIConfig,
  ResponsiveValue,
} from "./types";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Initialize the node extension system
 */
export function initializeNodeExtensions(): void {
  // System is auto-initialized via imports
  console.log("Node Extensions System initialized");
  console.log("Registry stats:", getRegistryStatistics());
}

/**
 * Get the current system version
 */
export function getVersion(): string {
  return "2.0.0"; // Enhanced UI system version
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
