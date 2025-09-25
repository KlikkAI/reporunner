export interface EnhancedNodeRegistry {
  // Basic registry operations
  registerNodeType(nodeType: { description: EnhancedNodeTypeDescription }): void;
  getNodeType(typeName: string): { description: EnhancedNodeTypeDescription } | undefined;
  getAllNodeTypes(): Array<{ description: EnhancedNodeTypeDescription }>;

  // UI component operations
  getCustomBodyComponent(typeName: string): ComponentType<CustomNodeBodyProps> | null;
  getCustomPropertiesPanel(typeName: string): ComponentType<CustomPropertiesPanelProps> | null;
  getCustomHandleRenderer(typeName: string): ComponentType<CustomHandleRendererProps> | null;
  getCustomToolbar(typeName: string): ComponentType<CustomToolbarProps> | null;

  // Theme operations
  getNodeTheme(typeName: string): NodeTheme | null;
  getVisualConfig(typeName: string): NodeVisualConfig | null;

  // Search and filtering
  searchByFeature(feature: keyof EnhancedNodeTypeDescription['features']): string[];
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

export type NodeUIEventHandler = (event: NodeUIEvent) => void;

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

export type ThemeVariant = 'light' | 'dark' | 'auto';

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
