import type React from 'react';
import { useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import NodeToolbar from '../components/WorkflowEditor/NodeTypes/BaseNode/NodeToolbar';
import { useSmartMenuPosition } from '../hooks/useSmartMenuPosition';
import type { CustomNodeBodyProps } from './nodeUiRegistry';
import { NodeIcon, NodeLabel, StatusBadge } from './shared';

/**
 * Custom AI Agent Node Body Component
 * Gmail-style UI with AI-specific features and handles
 */
const AIAgentNodeBody: React.FC<CustomNodeBodyProps> = ({
  nodeId,
  nodeData,
  selected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onDelete,

  onOpenProperties,
}) => {
  const displayName = nodeData.name || nodeData.label || 'AI Agent';
  const provider = nodeData.parameters?.provider || 'Google (Gemini)';
  const icon = '🤖'; // Simple robot emoji like old frontend

  // Menu state for NodeToolbar
  const [showLocalMenu, setShowLocalMenu] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { positionClasses, positionStyles } = useSmartMenuPosition({
    isOpen: showLocalMenu,
    triggerRef: menuTriggerRef,
    menuRef: menuRef,
    offset: 4,
    onClose: () => setShowLocalMenu(false),
  });

  // Click-outside handling is now centralized in useSmartMenuPosition hook

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onOpenProperties?.();
  };

  return (
    <div className="flex flex-col">
      <div className="relative">
        <div className="flex items-center">
          <div
            className={`
              relative flex items-center justify-center bg-gray-800 p-4 shadow-lg transition-all duration-200
              rounded-md min-w-[80px] max-w-[150px] min-h-[60px]
              ${selected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-purple-400' : ''}
              ${isHovered ? 'hover:shadow-xl hover:scale-105 ring-2 ring-offset-2 ring-offset-gray-900 ring-purple-400' : ''}
            `}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onDoubleClick={handleDoubleClick}
          >
            {/* Standard Input Handle */}
            <Handle
              type="target"
              position={Position.Left}
              id="input_0"
              style={{
                background: '#555',
                width: 10,
                height: 10,
                left: -5,
                top: '25%',
              }}
            />

            {/* AI Language Model Handle */}
            <Handle
              type="target"
              position={Position.Left}
              id="ai_languageModel"
              style={{
                background: '#8b5cf6',
                width: 8,
                height: 8,
                left: -4,
                top: '45%',
              }}
            />

            {/* AI Memory Handle */}
            <Handle
              type="target"
              position={Position.Left}
              id="ai_memory"
              style={{
                background: '#f59e0b',
                width: 8,
                height: 8,
                left: -4,
                top: '65%',
              }}
            />

            {/* AI Tool Handle */}
            <Handle
              type="target"
              position={Position.Left}
              id="ai_tool"
              style={{
                background: '#ef4444',
                width: 8,
                height: 8,
                left: -4,
                top: '85%',
              }}
            />

            {/* Output Handle */}
            <Handle
              type="source"
              position={Position.Right}
              id="output_0"
              style={{
                background: '#555',
                width: 10,
                height: 10,
                right: -5,
              }}
            />

            {/* AI Agent Icon */}
            <NodeIcon icon={icon} displayName={displayName} size="md" />

            {/* Shared NodeToolbar */}
            <NodeToolbar
              visible={isHovered}
              onPlay={() => console.log('Play AI Agent:', nodeId)}
              onStop={() => console.log('Stop AI Agent:', nodeId)}
              onDelete={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              onMenuToggle={() => setShowLocalMenu(!showLocalMenu)}
              menuTriggerRef={menuTriggerRef}
            />

            {/* Menu Dropdown */}
            {showLocalMenu && (
              <div
                ref={menuRef}
                className={`${positionClasses} bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1 min-w-[120px]`}
                style={positionStyles}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenProperties?.();
                    setShowLocalMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                >
                  <span>📂</span> Open
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Test AI Agent:', nodeId);
                    setShowLocalMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                >
                  <span>🧪</span> Test
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Copy AI Agent:', nodeId);
                    setShowLocalMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                >
                  <span>📄</span> Copy
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Duplicate AI Agent:', nodeId);
                    setShowLocalMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                >
                  <span>📋</span> Duplicate
                </button>
                <hr className="my-1 border-gray-600" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                    setShowLocalMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                >
                  <span>🗑️</span> Delete
                </button>
              </div>
            )}

            {/* Status Badge */}
            {nodeData.disabled && <StatusBadge type="disabled" position="top-right" />}
          </div>
        </div>
      </div>

      {/* Node Label */}
      <NodeLabel displayName={displayName} subtitle={provider} maxWidth={150} />
    </div>
  );
};

export default AIAgentNodeBody;
