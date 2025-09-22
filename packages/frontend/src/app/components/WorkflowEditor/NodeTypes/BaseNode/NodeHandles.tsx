import React from 'react';
import { Handle, Position } from 'reactflow';
import type { HandleConfig } from './index';

interface NodeHandlesProps {
  config: HandleConfig;
  nodeType?: string;
  integration?: string;
  // Connection information for AI handles
  aiHandleConnections?: {
    ai_languageModel?: boolean;
    ai_memory?: boolean;
    ai_tool?: boolean;
  };
  // Connection state for output handles
  hasOutgoingConnection?: boolean;
}

// Handle styling based on connection type and node type
const getHandleStyle = (handleId: string, nodeType?: string) => {
  // AI-specific handle styling
  switch (handleId) {
    case 'ai_languageModel':
      return 'w-3 h-3 bg-blue-400 border-2 border-white rounded-full hover:bg-blue-300 transition-colors';
    case 'ai_embedding':
      return 'w-3 h-3 bg-indigo-400 border-2 border-white rounded-full hover:bg-indigo-300 transition-colors';
    case 'ai_vectorStore':
      return 'w-3 h-3 bg-purple-400 border-2 border-white rounded-full hover:bg-purple-300 transition-colors';
    case 'ai_tool':
      return 'w-3 h-3 bg-teal-400 border-2 border-white rounded-full hover:bg-teal-300 transition-colors';
    case 'ai_memory':
      return 'w-3 h-3 bg-orange-400 border-2 border-white rounded-full hover:bg-orange-300 transition-colors';
    default:
      // Condition node handles get different styling
      if (nodeType === 'condition') {
        if (handleId === 'default') {
          return 'w-3 h-3 bg-gray-500 border-2 border-gray-700 rounded-full hover:bg-gray-400 transition-colors';
        }
        return 'w-3 h-3 bg-green-500 border-2 border-green-700 rounded-full hover:bg-green-400 transition-colors';
      }
      // Default handle styling
      return 'w-3 h-3 bg-gray-600 border-2 border-gray-800 rounded-full hover:bg-gray-500 transition-colors';
  }
};

const NodeHandles: React.FC<NodeHandlesProps> = ({
  config,
  integration,
  aiHandleConnections = {},
  hasOutgoingConnection,
  nodeType,
}) => {
  // Determine if this node should have AI handles based on integration
  const isAIAgent = integration === 'ai-agent';
  // Determine if this node should have plus icons for outputs
  // Show for all node types

  return (
    <>
      {/* Standard Input Handle - positioned properly for AI agents */}
      {config.input?.show && (
        <Handle
          type="target"
          position={Position.Left}
          id="main"
          className="w-3 h-3 bg-gray-600 border-2 border-gray-800 hover:bg-gray-500 transition-colors"
          style={{ left: '-6px', top: isAIAgent ? '50%' : '50%' }}
        />
      )}

      {/* AI-specific handles for AI Agent nodes - positioned at bottom with vertical connection lines */}
      {isAIAgent && (
        <>
          {/* Vertical connection lines for AI handles - only show if not connected */}
          {!aiHandleConnections.ai_languageModel && (
            <div
              className="absolute w-px h-14 bg-gray-400"
              style={{
                bottom: '-56px',
                left: '25%',
                transform: 'translateX(-50%)',
                zIndex: -1,
              }}
            />
          )}
          {!aiHandleConnections.ai_memory && (
            <div
              className="absolute w-px h-14 bg-gray-400"
              style={{
                bottom: '-56px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: -1,
              }}
            />
          )}
          {!aiHandleConnections.ai_tool && (
            <div
              className="absolute w-px h-14 bg-gray-400"
              style={{
                bottom: '-56px',
                left: '75%',
                transform: 'translateX(-50%)',
                zIndex: -1,
              }}
            />
          )}

          {/* Plus Icons for AI handles - positioned below the node - only show if not connected */}
          {!aiHandleConnections.ai_languageModel && (
            <Handle
              type="target"
              position={Position.Bottom}
              id="plus-ai_languageModel"
              className="!w-6 !h-6 !bg-gray-700 !border !border-gray-400 !rounded-sm hover:!bg-gray-50 !cursor-pointer !transition-colors !flex !items-center !justify-center !absolute"
              style={{
                bottom: '-58px',
                left: '25%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-blue-400 pointer-events-none"
              >
                <path
                  d="M6 1V11M1 6H11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Handle>
          )}

          {!aiHandleConnections.ai_memory && (
            <Handle
              type="target"
              position={Position.Bottom}
              id="plus-ai_memory"
              className="!w-6 !h-6 !bg-gray-700 !border !border-gray-400 !rounded-sm hover:!bg-gray-50 !cursor-pointer !transition-colors !flex !items-center !justify-center !absolute"
              style={{
                bottom: '-58px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-orange-400 pointer-events-none"
              >
                <path
                  d="M6 1V11M1 6H11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Handle>
          )}

          {!aiHandleConnections.ai_tool && (
            <Handle
              type="target"
              position={Position.Bottom}
              id="plus-ai_tool"
              className="!w-6 !h-6 !bg-gray-700 !border !border-gray-400 !rounded-sm hover:!bg-gray-50 !cursor-pointer !transition-colors !flex !items-center !justify-center !absolute"
              style={{
                bottom: '-58px',
                left: '75%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-teal-400 pointer-events-none"
              >
                <path
                  d="M6 1V11M1 6H11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Handle>
          )}

          {/* Actual functional AI handles (visible at bottom edge of node) */}
          <Handle
            type="target"
            position={Position.Bottom}
            id="ai_languageModel"
            className={getHandleStyle('ai_languageModel', nodeType)}
            style={{
              bottom: '-6px',
              left: '25%',
              transform: 'translateX(-50%)',
            }}
          />
          <Handle
            type="target"
            position={Position.Bottom}
            id="ai_memory"
            className={getHandleStyle('ai_memory', nodeType)}
            style={{
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
          <Handle
            type="target"
            position={Position.Bottom}
            id="ai_tool"
            className={getHandleStyle('ai_tool', nodeType)}
            style={{
              bottom: '-6px',
              left: '75%',
              transform: 'translateX(-50%)',
            }}
          />

          {/* Labels for bottom handles - positioned below plus icons */}
          <div
            className="absolute text-xs text-blue-400 font-medium pointer-events-none"
            style={{
              bottom: '-75px',
              left: '25%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}
          >
            LLM
          </div>
          <div
            className="absolute text-xs text-orange-400 font-medium pointer-events-none"
            style={{
              bottom: '-75px',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}
          >
            Mem
          </div>
          <div
            className="absolute text-xs text-teal-400 font-medium pointer-events-none"
            style={{
              bottom: '-75px',
              left: '75%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}
          >
            Tool
          </div>
        </>
      )}

      {/* Output Handles with Plus Icons and Connection Lines */}
      {config.outputs?.map((output) => {
        console.log('NodeHandles: Rendering output handle', {
          id: output.id,
          position: output.position.top,
          nodeType,
          label: output.label,
        });
        return (
          <React.Fragment key={output.id}>
            {/* Actual Output Handle */}
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              className={getHandleStyle(output.id, nodeType)}
              style={{
                right: '-6px',
                top: output.position.top || '50%',
                transform: 'translateY(-50%)',
                zIndex: 10, // Ensure handles are above other elements
              }}
            />

            {/* Output Label */}
            {output.label && (
              <div
                className="absolute text-xs text-gray-400 font-medium pointer-events-none"
                style={{
                  right: '-60px',
                  top: output.position.top || '40%',
                  transform: 'translateY(-50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                {output.label}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Condition node specific connection lines and draggable plus icons */}
      {nodeType === 'condition' &&
        !hasOutgoingConnection &&
        config.outputs?.map((output) => (
          <React.Fragment key={`condition-plus-${output.id}`}>
            {/* Connection Line for Condition Output */}
            <div
              className="absolute w-14 h-px bg-gray-400"
              style={{
                top: output.position.top || '50%',
                right: '-50px',
                transform: 'translateY(-50%)',
                zIndex: -1,
              }}
            />
            {/* Draggable Plus Icon Handle for Condition */}
            <Handle
              type="source"
              position={Position.Right}
              id={`plus-${output.id}`}
              className="!w-6 !h-6 !bg-gray-700 !border !border-gray-400 !rounded-sm hover:!bg-gray-50 !cursor-pointer !transition-colors !flex !items-center !justify-center !absolute"
              style={{
                top: output.position.top || '50%',
                right: '-58px',
                transform: 'translateY(-50%)',
                zIndex: 1000,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-500 pointer-events-none"
              >
                <path
                  d="M6 1V11M1 6H11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Handle>
          </React.Fragment>
        ))}

      {/* Connection lines and plus icons for outputs (All node types except AI Agent and Condition - they have their own) */}
      {!isAIAgent &&
        nodeType !== 'condition' &&
        !hasOutgoingConnection &&
        config.outputs?.map((output) => (
          <React.Fragment key={`plus-${output.id}`}>
            {/* Connection Line for Standard Outputs */}
            <div
              className="absolute w-14 h-px bg-gray-400"
              style={{
                top: output.position.top || '50%',
                right: '-50px',
                transform: 'translateY(-50%)',
                zIndex: -1,
              }}
            />
            {/* Draggable Plus Icon Handle for Standard Outputs */}
            <Handle
              type="source"
              position={Position.Right}
              id={`plus-${output.id}`}
              className="!w-6 !h-6 !bg-gray-700 !border !border-gray-400 !rounded-sm hover:!bg-gray-50 !cursor-pointer !transition-colors !flex !items-center !justify-center !absolute"
              style={{
                top: output.position.top || '50%',
                right: '-58px',
                transform: 'translateY(-50%)',
                zIndex: 1000,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-500 pointer-events-none"
              >
                <path
                  d="M6 1V11M1 6H11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Handle>
          </React.Fragment>
        ))}

      {/* Connection lines and plus icons for outputs (AI Agent only) */}
      {isAIAgent &&
        !hasOutgoingConnection &&
        config.outputs?.map((output) => (
          <React.Fragment key={`plus-${output.id}`}>
            {/* Connection Line for Output */}
            <div
              className="absolute w-14 h-px bg-gray-400"
              style={{
                top: output.position.top || '50%',
                right: '-50px',
                transform: 'translateY(-50%)',
                zIndex: -1,
              }}
            />
            {/* Plus Icon Handle */}
            <Handle
              type="source"
              position={Position.Right}
              id={`plus-${output.id}`}
              className="!w-6 !h-6 !bg-gray-700 !border !border-gray-400 !rounded-sm hover:!bg-gray-50 !cursor-pointer !transition-colors !flex !items-center !justify-center !absolute"
              style={{
                top: output.position.top || '50%',
                right: '-58px',
                transform: 'translateY(-50%)',
                zIndex: 1000,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-500 pointer-events-none"
              >
                <path
                  d="M6 1V11M1 6H11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Handle>
          </React.Fragment>
        ))}
    </>
  );
};

export default NodeHandles;
