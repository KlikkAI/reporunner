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
  createPropertiesPanel(type: string): ComponentType<CustomPropertiesPanelProps> | null;
  createHandleRenderer(type: string): ComponentType<CustomHandleRendererProps> | null;
  createToolbar(type: string): ComponentType<CustomToolbarProps> | null;

  // Registration methods
  registerBodyComponent(name: string, component: ComponentType<CustomNodeBodyProps>): void;
  registerPropertiesPanel(name: string, component: ComponentType<CustomPropertiesPanelProps>): void;
  registerHandleRenderer(name: string, component: ComponentType<CustomHandleRendererProps>): void;
  registerToolbar(name: string, component: ComponentType<CustomToolbarProps>): void;

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
