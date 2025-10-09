import type React from 'react';

// Base props interface that all nodes extend
export interface BaseNodeData {
  label: string;
  integration?: string;
  integrationData?: {
    id: string;
    name: string;
    icon: string;
    category: string;
  };
  nodeTypeData?: {
    id: string;
    name: string;
    type: string;
    description: string;
  };
  config?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  icon?: string;
  name?: string;
  description?: string;
  onDelete?: (nodeId: string) => void;
  onConnect?: (sourceNodeId: string) => void;
  onOpenProperties?: (nodeId: string) => void;
  hasOutgoingConnection?: boolean;
  isSelected?: boolean;
  // For AI agents, track connections to specific handles
  edges?: Array<{
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
  }>;
  // Condition node specific properties
  outputs?: Array<{
    id: string;
    label: string;
    position: { top: string };
    color: string;
    condition?: string;
  }>;
  nodeSize?: {
    width: number;
    height: number;
  };
  conditionRules?: any[];
}

export interface BaseNodeProps {
  id?: string;
  data: BaseNodeData;
  selected?: boolean;
}

// Handle configuration for different node types
export interface HandleConfig {
  input?: {
    show: boolean;
    position?: { top?: string; left?: string };
  };
  outputs?: Array<{
    id: string;
    position: { top?: string; right?: string };
    color?: string;
    label?: string;
    removable?: boolean;
  }>;
  dynamicOutputs?: boolean;
  maxOutputs?: number;
  hasAIHandles?: boolean; // Flag to indicate AI-specific handles needed
}

// Visual configuration for different node types
export interface VisualConfig {
  shape: string; // CSS classes for border-radius
  defaultIcon: string | React.ReactNode; // Fallback icon
  selectionRingColor: string; // CSS class for selection ring
  dimensions: {
    minWidth: string;
    maxWidth?: string;
    minHeight?: string;
    // Support for dynamic inline styles
    style?: React.CSSProperties;
  };
}

export interface BaseNodeConfig {
  handles: HandleConfig;
  visual: VisualConfig;
}
