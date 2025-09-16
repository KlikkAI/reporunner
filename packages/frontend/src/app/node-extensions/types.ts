/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Enhanced Node UI Type System
 * Extends base n8n types with advanced UI customization capabilities
 */

import type { INodeTypeDescription } from "@/core/nodes/types";
import type { ComponentType, CSSProperties } from "react";

// ============================================================================
// Visual Enhancement Types
// ============================================================================

export type NodeShape =
  | "rectangle"
  | "circle"
  | "diamond"
  | "hexagon"
  | "octagon";
export type NodeAnimation =
  | "pulse"
  | "glow"
  | "flow"
  | "bounce"
  | "shake"
  | "none";
export type BadgePosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
export type HandleStyle = "circle" | "square" | "diamond" | "triangle";

export interface NodeGradient {
  from: string;
  to: string;
  direction?:
    | "to-right"
    | "to-left"
    | "to-top"
    | "to-bottom"
    | "to-top-right"
    | "to-bottom-left";
}

export interface NodeBadge {
  id: string;
  text: string;
  color: string;
  backgroundColor: string;
  position: BadgePosition;
  icon?: string;
  condition?: string; // Expression to determine when to show
}

export interface ToolbarAction {
  id: string;
  icon: string;
  label: string;
  action: string;
  condition?: string; // Expression to determine when to show
  shortcut?: string;
}

export interface CustomHandle {
  id: string;
  type: "source" | "target";
  position: "top" | "right" | "bottom" | "left";
  style: HandleStyle;
  color: string;
  size?: number;
  label?: string;
}

// ============================================================================
// Theme System Types
// ============================================================================

export interface NodeColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  border: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface NodeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface NodeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
}

export interface NodeAnimationConfig {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface NodeTheme {
  name: string;
  colors: NodeColorScheme;
  typography: NodeTypography;
  spacing: NodeSpacing;
  animations: NodeAnimationConfig;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

// ============================================================================
// Visual Configuration Types
// ============================================================================

export interface NodeVisualConfig {
  shape?: NodeShape;
  gradient?: NodeGradient;
  animation?: NodeAnimation;
  badges?: NodeBadge[];
  customStyles?: CSSProperties;
  theme?: string; // Theme name reference
  size?: {
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
  };
  handles?: CustomHandle[];
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  border?: {
    width?: number;
    style?: "solid" | "dashed" | "dotted";
    color?: string;
  };
}

// ============================================================================
// Component Interface Types
// ============================================================================

export interface CustomNodeBodyProps {
  nodeId: string;
  nodeData: any;
  selected: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onOpenProperties?: () => void;
  theme?: NodeTheme;
  visualConfig?: NodeVisualConfig;
}

export interface CustomPropertiesPanelProps {
  nodeId: string;
  nodeData: any;
  onChange: (updates: any) => void;
  onClose: () => void;
  onTest?: () => Promise<any>;
  theme?: NodeTheme;
}

export interface CustomHandleRendererProps {
  nodeId: string;
  handles: CustomHandle[];
  theme?: NodeTheme;
}

export interface CustomToolbarProps {
  nodeId: string;
  actions: ToolbarAction[];
  onActionClick: (actionId: string) => void;
  theme?: NodeTheme;
}

// ============================================================================
// Enhanced Node Type Description
// ============================================================================

export interface EnhancedNodeTypeDescription extends INodeTypeDescription {
  // UI Extension Points
  customBodyComponent?: string;
  customPropertiesPanelComponent?: string;
  customHandleRenderer?: string;
  customToolbarActions?: ToolbarAction[];

  // Visual Configuration
  visual?: NodeVisualConfig;

  // Advanced Features
  features?: {
    // Execution features
    streaming?: boolean;
    batching?: boolean;
    caching?: boolean;
    retries?: boolean;

    // UI features
    resizable?: boolean;
    collapsible?: boolean;
    draggable?: boolean;
    copyable?: boolean;

    // Advanced behaviors
    aiPowered?: boolean;
    requiresAuth?: boolean;
    supportsWebhooks?: boolean;
    realTimeUpdates?: boolean;
  };

  // Performance hints
  performance?: {
    expensive?: boolean; // Hint for virtualization
    memoryIntensive?: boolean;
    cpuIntensive?: boolean;
    networkIntensive?: boolean;
  };

  // Analytics and monitoring
  telemetry?: {
    trackUsage?: boolean;
    trackPerformance?: boolean;
    trackErrors?: boolean;
    customEvents?: string[];
  };
}

// ============================================================================
// Component Factory Types
// ============================================================================

export interface UIComponentFactory {
  createNodeBody(type: string): ComponentType<CustomNodeBodyProps> | null;
  createPropertiesPanel(
    type: string,
  ): ComponentType<CustomPropertiesPanelProps> | null;
  createHandleRenderer(
    type: string,
  ): ComponentType<CustomHandleRendererProps> | null;
  createToolbar(type: string): ComponentType<CustomToolbarProps> | null;

  // Registration methods
  registerBodyComponent(
    name: string,
    component: ComponentType<CustomNodeBodyProps>,
  ): void;
  registerPropertiesPanel(
    name: string,
    component: ComponentType<CustomPropertiesPanelProps>,
  ): void;
  registerHandleRenderer(
    name: string,
    component: ComponentType<CustomHandleRendererProps>,
  ): void;
  registerToolbar(
    name: string,
    component: ComponentType<CustomToolbarProps>,
  ): void;

  // Utility methods
  hasCustomBody(type: string): boolean;
  hasCustomPropertiesPanel(type: string): boolean;
  hasCustomHandleRenderer(type: string): boolean;
  hasCustomToolbar(type: string): boolean;
}

// ============================================================================
// Theme Manager Types
// ============================================================================

export interface ThemeManager {
  getTheme(name: string): NodeTheme | null;
  getCurrentTheme(): NodeTheme;
  setCurrentTheme(name: string): void;
  registerTheme(theme: NodeTheme): void;
  getAllThemes(): NodeTheme[];

  // CSS variable generation
  generateCSSVariables(theme: NodeTheme): Record<string, string>;
  applyCSSVariables(theme: NodeTheme): void;
}

// ============================================================================
// Registry Enhancement Types
// ============================================================================

export interface EnhancedNodeRegistry {
  // Basic registry operations
  registerNodeType(nodeType: {
    description: EnhancedNodeTypeDescription;
  }): void;
  getNodeType(
    typeName: string,
  ): { description: EnhancedNodeTypeDescription } | undefined;
  getAllNodeTypes(): Array<{ description: EnhancedNodeTypeDescription }>;

  // UI component operations
  getCustomBodyComponent(
    typeName: string,
  ): ComponentType<CustomNodeBodyProps> | null;
  getCustomPropertiesPanel(
    typeName: string,
  ): ComponentType<CustomPropertiesPanelProps> | null;
  getCustomHandleRenderer(
    typeName: string,
  ): ComponentType<CustomHandleRendererProps> | null;
  getCustomToolbar(typeName: string): ComponentType<CustomToolbarProps> | null;

  // Theme operations
  getNodeTheme(typeName: string): NodeTheme | null;
  getVisualConfig(typeName: string): NodeVisualConfig | null;

  // Search and filtering
  searchByFeature(
    feature: keyof EnhancedNodeTypeDescription["features"],
  ): string[];
  searchByCategory(category: string): string[];
  searchByProvider(provider: string): string[];

  // Performance optimization
  preloadComponents(nodeTypes: string[]): Promise<void>;
  getComponentBundle(nodeTypes: string[]): Promise<Record<string, any>>;
}

// ============================================================================
// Event System Types
// ============================================================================

export interface NodeUIEvent {
  type: string;
  nodeId: string;
  data?: any;
  timestamp: number;
}

export interface NodeUIEventHandler {
  (event: NodeUIEvent): void;
}

export interface NodeUIEventManager {
  on(eventType: string, handler: NodeUIEventHandler): void;
  off(eventType: string, handler: NodeUIEventHandler): void;
  emit(event: NodeUIEvent): void;

  // Predefined events
  onNodeHover(nodeId: string, handler: NodeUIEventHandler): void;
  onNodeSelect(nodeId: string, handler: NodeUIEventHandler): void;
  onNodeEdit(nodeId: string, handler: NodeUIEventHandler): void;
  onNodeExecute(nodeId: string, handler: NodeUIEventHandler): void;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NodeUIConfig = DeepPartial<NodeVisualConfig>;

export type ThemeVariant = "light" | "dark" | "auto";

export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}

// ============================================================================
// Export Types for External Use
// ============================================================================

export type { INodeTypeDescription, ComponentType, CSSProperties };
