/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/edge.ts - Enhanced with AI connection types for 13-node workflow
export const ConnectionType = {
  Main: 'main',
  Supplemental: 'supplemental',
  // AI-specific connection types for n8n workflow compatibility
  AILanguageModel: 'ai_languageModel', // LLM → AI Agent connections
  AIEmbedding: 'ai_embedding', // Embeddings → Vector Store connections
  AIVectorStore: 'ai_vectorStore', // Vector Store → Tool connections
  AITool: 'ai_tool', // Tool → AI Agent connections
} as const;

export type ConnectionTypeValue = (typeof ConnectionType)[keyof typeof ConnectionType];

// AI-specific connection types for type safety
export type AIConnectionType = 'ai_languageModel' | 'ai_embedding' | 'ai_vectorStore' | 'ai_tool';

export interface CustomEdgeData {
  onDelete?: (id: string) => void;
  connectionType?: ConnectionTypeValue;
  status?: 'success' | 'error' | 'running' | 'pinned';
  maxConnections?: number;
}

export type CustomEdgeProps = {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
  markerEnd?: string;
  data?: CustomEdgeData;
  selected?: boolean;
  hovered?: boolean;
  bringToFront?: boolean;
};
