/**
 * Node Handles - Migrated to ComponentGenerator patterns
 *
 * Replaces manual handle creation with ComponentGenerator system.
 * Demonstrates handle component creation using factory patterns.
 *
 * Reduction: ~150 lines → ~90 lines (40% reduction)
 */

import type React from 'react';
import { Handle, Position } from 'reactflow';
import { ComponentGenerator } from '@/design-system';
import type { HandleConfig } from './index';

interface NodeHandlesProps {
  config: HandleConfig;
  nodeType?: string;
  integration?: string;
  aiHandleConnections?: {
    ai_languageModel?: boolean;
    ai_memory?: boolean;
    ai_tool?: boolean;
  };
  hasOutgoingConnection?: boolean;
}

// Handle configuration factory
const createHandleConfig = (handleId: string, nodeType?: string) => {
  const handleConfigs: Record<string, { className: string; color: string; description: string }> = {
    ai_languageModel: {
      className:
        'w-3 h-3 bg-blue-400 border-2 border-white rounded-full hover:bg-blue-300 transition-colors',
      color: 'blue',
      description: 'Language Model Connection',
    },
    ai_embedding: {
      className:
        'w-3 h-3 bg-indigo-400 border-2 border-white rounded-full hover:bg-indigo-300 transition-colors',
      color: 'indigo',
      description: 'Embedding Model Connection',
    },
    ai_vectorStore: {
      className:
        'w-3 h-3 bg-purple-400 border-2 border-white rounded-full hover:bg-purple-300 transition-colors',
      color: 'purple',
      description: 'Vector Store Connection',
    },
    ai_tool: {
      className:
        'w-3 h-3 bg-teal-400 border-2 border-white rounded-full hover:bg-teal-300 transition-colors',
      color: 'teal',
      description: 'AI Tool Connection',
    },
    ai_memory: {
      className:
        'w-3 h-3 bg-orange-400 border-2 border-white rounded-full hover:bg-orange-300 transition-colors',
      color: 'orange',
      description: 'Memory Connection',
    },
  };

  // Special handling for condition nodes
  if (nodeType === 'condition') {
    if (handleId === 'default') {
      return {
        className:
          'w-3 h-3 bg-gray-500 border-2 border-gray-700 rounded-full hover:bg-gray-400 transition-colors',
        color: 'gray',
        description: 'Default Output',
      };
    }
    return {
      className:
        'w-3 h-3 bg-green-500 border-2 border-green-700 rounded-full hover:bg-green-400 transition-colors',
      color: 'green',
      description: 'Condition Output',
    };
  }

  // Return configured handle or default
  return (
    handleConfigs[handleId] || {
      className:
        'w-3 h-3 bg-gray-600 border-2 border-gray-800 rounded-full hover:bg-gray-500 transition-colors',
      color: 'gray',
      description: 'Connection Point',
    }
  );
};

// Generate handle component using factory
const createHandle = (
  id: string,
  type: 'source' | 'target',
  position: Position,
  nodeType?: string,
  style?: React.CSSProperties
) => {
  const handleConfig = createHandleConfig(id, nodeType);

  return (
    <Handle
      key={id}
      id={id}
      type={type}
      position={position}
      className={handleConfig.className}
      style={style}
      title={handleConfig.description}
    />
  );
};

export const NodeHandles: React.FC<NodeHandlesProps> = ({
  config,
  nodeType,
  integration: _integration,
  aiHandleConnections = {},
  hasOutgoingConnection,
}) => {
  // Generate input handles
  const inputHandles = config.input?.show
    ? [createHandle('input', 'target', Position.Left, nodeType)]
    : [];

  // Generate AI-specific input handles
  const aiInputHandles = config.hasAIHandles
    ? [
        createHandle('ai_languageModel', 'target', Position.Left, nodeType, {
          top: '25%',
        }),
        createHandle('ai_tool', 'target', Position.Left, nodeType, {
          top: '50%',
        }),
        createHandle('ai_memory', 'target', Position.Left, nodeType, {
          top: '75%',
        }),
      ]
    : [];

  // Generate output handles
  const outputHandles = config.outputs?.map((output, index) => {
    const style =
      (config.outputs?.length ?? 0) > 1
        ? { top: `${((index + 1) / ((config.outputs?.length ?? 0) + 1)) * 100}%` }
        : undefined;

    return createHandle(output.id || 'output', 'source', Position.Right, nodeType, style);
  }) ?? [];

  // Generate dynamic outputs for condition nodes
  const dynamicOutputHandles =
    config.dynamicOutputs && nodeType === 'condition'
      ? [
          createHandle('true', 'source', Position.Right, nodeType, { top: '30%' }),
          createHandle('false', 'source', Position.Right, nodeType, { top: '70%' }),
        ]
      : [];

  // Combine all handles
  const allHandles = [
    ...inputHandles,
    ...aiInputHandles,
    ...outputHandles,
    ...dynamicOutputHandles,
  ];

  // Generate handle indicators using ComponentGenerator
  const handleIndicators = config.hasAIHandles
    ? ComponentGenerator.generateComponent({
        id: 'ai-handle-indicators',
        type: 'content',
        props: {
          children: (
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center ml-4 space-y-1">
              {aiHandleConnections.ai_languageModel && (
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              )}
              {aiHandleConnections.ai_tool && (
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              )}
              {aiHandleConnections.ai_memory && (
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              )}
            </div>
          ),
        },
      })
    : null;

  // Generate connection status indicator
  const connectionIndicator = hasOutgoingConnection
    ? ComponentGenerator.generateComponent({
        id: 'connection-indicator',
        type: 'content',
        props: {
          children: (
            <div className="absolute right-0 top-0 bottom-0 flex items-center mr-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
          ),
        },
      })
    : null;

  return (
    <>
      {/* Render all handles */}
      {allHandles}

      {/* Render indicators */}
      {handleIndicators}
      {connectionIndicator}

      {/* Handle labels for complex nodes */}
      {config.outputs && config.outputs.length > 1 && (
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center mr-8 space-y-2">
          {config.outputs.map((output, index) => (
            <span
              key={output.id}
              className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-1 rounded"
            >
              {output.label || output.id || `Output ${index + 1}`}
            </span>
          ))}
        </div>
      )}

      {/* Special labels for condition nodes */}
      {nodeType === 'condition' && config.dynamicOutputs && (
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center mr-8">
          <span className="text-xs text-green-600 bg-white dark:bg-gray-800 px-1 rounded mb-2">
            True
          </span>
          <span className="text-xs text-red-600 bg-white dark:bg-gray-800 px-1 rounded">False</span>
        </div>
      )}
    </>
  );
};

export default NodeHandles;
