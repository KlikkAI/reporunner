/**
 * Edge Types and Connection Definitions
 */

import type { Edge, EdgeProps } from 'reactflow';

// Connection types for different kinds of data flow
export enum ConnectionType {
  Main = 'main',
  Error = 'error',
  Success = 'success',
  Condition = 'condition',
  AI_LanguageModel = 'ai_languageModel',
  AI_Embedding = 'ai_embedding',
  AI_VectorStore = 'ai_vectorStore',
  AI_Tool = 'ai_tool',
  Data = 'data',
  File = 'file',
  Binary = 'binary',
}

export type ConnectionTypeValue = `${ConnectionType}`;

// Enhanced edge data
export interface WorkflowEdgeData {
  connectionType: ConnectionType;
  label?: string;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  transformations?: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}

// Custom edge props for React Flow
export interface CustomEdgeProps extends EdgeProps {
  data?: WorkflowEdgeData;
}

// Connection validation
export interface ConnectionRule {
  sourceType: string;
  targetType: string;
  allowedConnections: ConnectionType[];
  maxConnections?: number;
}

// Connection point definition
export interface ConnectionPoint {
  id: string;
  type: ConnectionType;
  name: string;
  required: boolean;
  multiple: boolean;
}

// Node connection configuration
export interface NodeConnectionConfig {
  inputs: ConnectionPoint[];
  outputs: ConnectionPoint[];
  maxInputs?: number;
  maxOutputs?: number;
}

// Connection validation result
export interface ConnectionValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

// Connection utilities
export class ConnectionUtils {
  /**
   * Validate if two nodes can be connected
   */
  static validateConnection(
    sourceNodeType: string,
    targetNodeType: string,
    connectionType: ConnectionType
  ): ConnectionValidationResult {
    // Basic validation - all main connections are allowed
    if (connectionType === ConnectionType.Main) {
      return { valid: true };
    }

    // AI-specific connection validation
    if (connectionType.startsWith('ai_')) {
      const aiTypes = ['ai-agent', 'llm', 'embedding', 'vector-store'];
      if (!(aiTypes.includes(sourceNodeType) || aiTypes.includes(targetNodeType))) {
        return {
          valid: false,
          error: 'AI connections can only be made between AI-compatible nodes',
        };
      }
    }

    // Error connections can come from any node
    if (connectionType === ConnectionType.Error) {
      return { valid: true };
    }

    // Condition connections must come from condition nodes
    if (connectionType === ConnectionType.Condition) {
      if (sourceNodeType !== 'condition') {
        return {
          valid: false,
          error: 'Condition connections can only originate from condition nodes',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get default connection type between two node types
   */
  static getDefaultConnectionType(sourceNodeType: string, targetNodeType: string): ConnectionType {
    // AI nodes prefer AI connections
    const aiTypes = ['ai-agent', 'llm', 'embedding', 'vector-store'];
    if (aiTypes.includes(sourceNodeType) || aiTypes.includes(targetNodeType)) {
      if (sourceNodeType === 'llm' || targetNodeType === 'llm') {
        return ConnectionType.AI_LanguageModel;
      }
      if (sourceNodeType === 'embedding' || targetNodeType === 'embedding') {
        return ConnectionType.AI_Embedding;
      }
      if (sourceNodeType === 'vector-store' || targetNodeType === 'vector-store') {
        return ConnectionType.AI_VectorStore;
      }
    }

    // Condition nodes use condition connections for branches
    if (sourceNodeType === 'condition') {
      return ConnectionType.Condition;
    }

    // Default to main connection
    return ConnectionType.Main;
  }

  /**
   * Get connection color for visualization
   */
  static getConnectionColor(connectionType: ConnectionType): string {
    switch (connectionType) {
      case ConnectionType.Main:
        return '#6b7280';
      case ConnectionType.Error:
        return '#ef4444';
      case ConnectionType.Success:
        return '#10b981';
      case ConnectionType.Condition:
        return '#f59e0b';
      case ConnectionType.AI_LanguageModel:
        return '#8b5cf6';
      case ConnectionType.AI_Embedding:
        return '#06b6d4';
      case ConnectionType.AI_VectorStore:
        return '#14b8a6';
      case ConnectionType.AI_Tool:
        return '#f97316';
      case ConnectionType.Data:
        return '#3b82f6';
      case ConnectionType.File:
        return '#84cc16';
      case ConnectionType.Binary:
        return '#6b7280';
      default:
        return '#6b7280';
    }
  }

  /**
   * Get connection style for React Flow
   */
  static getConnectionStyle(connectionType: ConnectionType): React.CSSProperties {
    return {
      stroke: ConnectionUtils.getConnectionColor(connectionType),
      strokeWidth: 2,
      strokeDasharray: connectionType === ConnectionType.Condition ? '5,5' : undefined,
    };
  }
}

// Export commonly used types
export type WorkflowEdge = Edge<WorkflowEdgeData>;
