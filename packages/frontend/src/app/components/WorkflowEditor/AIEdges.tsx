import type React from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from 'reactflow';
import type { CustomEdgeData } from '@/core/types/edge';

// Base AI Edge component with shared styling
const BaseAIEdge: React.FC<
  EdgeProps<CustomEdgeData> & {
    strokeColor: string;
    label?: string;
    animated?: boolean;
  }
> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  strokeColor,
  label,
  animated = false,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
          strokeDasharray: animated ? '5,5' : undefined,
          animation: animated ? 'dash 1s linear infinite' : undefined,
        }}
        markerEnd={`url(#ai-marker-${strokeColor.replace('#', '')})`}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

/**
 * AI Language Model Edge - LLM to AI Agent connections
 * Color: Blue (#3B82F6)
 */
export const AILanguageModelEdge: React.FC<EdgeProps<CustomEdgeData>> = (props) => (
  <BaseAIEdge {...props} strokeColor="#3B82F6" label="LLM" animated={true} />
);

/**
 * AI Embedding Edge - Embeddings to Vector Store connections
 * Color: Indigo (#6366F1)
 */
export const AIEmbeddingEdge: React.FC<EdgeProps<CustomEdgeData>> = (props) => (
  <BaseAIEdge {...props} strokeColor="#6366F1" label="Embeddings" />
);

/**
 * AI Vector Store Edge - Vector Store to Tool connections
 * Color: Purple (#8B5CF6)
 */
export const AIVectorStoreEdge: React.FC<EdgeProps<CustomEdgeData>> = (props) => (
  <BaseAIEdge {...props} strokeColor="#8B5CF6" label="Vector DB" />
);

/**
 * AI Tool Edge - Tool to AI Agent connections
 * Color: Teal (#14B8A6)
 */
export const AIToolEdge: React.FC<EdgeProps<CustomEdgeData>> = (props) => (
  <BaseAIEdge {...props} strokeColor="#14B8A6" label="Tool" animated={true} />
);

/**
 * AI Edge Markers - Custom arrow markers for AI connections
 */
export const AIEdgeMarkers: React.FC = () => (
  <defs>
    {/* Blue marker for Language Model connections */}
    <marker
      id="ai-marker-3B82F6"
      markerWidth="10"
      markerHeight="10"
      refX="9"
      refY="3"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <polygon points="0,0 0,6 9,3" fill="#3B82F6" stroke="#3B82F6" strokeWidth="1" />
    </marker>

    {/* Indigo marker for Embedding connections */}
    <marker
      id="ai-marker-6366F1"
      markerWidth="10"
      markerHeight="10"
      refX="9"
      refY="3"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <polygon points="0,0 0,6 9,3" fill="#6366F1" stroke="#6366F1" strokeWidth="1" />
    </marker>

    {/* Purple marker for Vector Store connections */}
    <marker
      id="ai-marker-8B5CF6"
      markerWidth="10"
      markerHeight="10"
      refX="9"
      refY="3"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <polygon points="0,0 0,6 9,3" fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="1" />
    </marker>

    {/* Teal marker for Tool connections */}
    <marker
      id="ai-marker-14B8A6"
      markerWidth="10"
      markerHeight="10"
      refX="9"
      refY="3"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <polygon points="0,0 0,6 9,3" fill="#14B8A6" stroke="#14B8A6" strokeWidth="1" />
    </marker>
  </defs>
);

// CSS for animated edges
export const AIEdgeStyles = `
  @keyframes dash {
    to {
      stroke-dashoffset: -10;
    }
  }
`;
