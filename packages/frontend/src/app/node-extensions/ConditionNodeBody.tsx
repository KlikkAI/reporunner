import type React from 'react';
import { useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import NodeToolbar from '../components/WorkflowEditor/NodeTypes/BaseNode/NodeToolbar';
import { useSmartMenuPosition } from '../hooks/useSmartMenuPosition';
import { NodeIcon, NodeLabel, StatusBadge } from './shared';
import type { CustomNodeBodyProps } from './types';

/**
 * Custom Condition Node Body Component
 * Gmail-style UI with condition-specific features and dual outputs
 */
const ConditionNodeBody: React.FC<CustomNodeBodyProps> = ({
  nodeId: _nodeId,
  nodeData,
  selected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onDelete,
  onOpenProperties,
}) => {
  const displayName = nodeData.name || nodeData.label || 'Condition';
  const mode = nodeData.parameters?.mode || 'expression';
  const rules = nodeData.parameters?.rules || [];

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
  const logic = nodeData.parameters?.logic || 'AND';
  const icon = '❓'; // Question mark for condition

  // Generate subtitle based on condition configuration
  const getSubtitle = () => {
    if (mode === 'rules' && rules.length > 0) {
      return `${rules.length} rule${rules.length > 1 ? 's' : ''} (${logic})`;
    }
    return 'Expression Mode';
  };

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
              ${selected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-yellow-400' : ''}
              ${isHovered ? 'hover:shadow-xl hover:scale-105 ring-2 ring-offset-2 ring-offset-gray-900 ring-yellow-400' : ''}
            `}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onDoubleClick={handleDoubleClick}
          >
            {/* Input Handle */}
            <Handle
              type="target"
              position={Position.Left}
              id="input_0"
              style={{
                background: '#555',
                width: 10,
                height: 10,
                left: -5,
              }}
            />

            {/* True Output Handle */}
            <Handle
              type="source"
              position={Position.Right}
              id="output_0"
              style={{
                background: '#22c55e', // green for true
                width: 10,
                height: 10,
                right: -5,
                top: '35%',
              }}
            />

            {/* False Output Handle */}
            <Handle
              type="source"
              position={Position.Right}
              id="output_1"
              style={{
                background: '#ef4444', // red for false
                width: 10,
                height: 10,
                right: -5,
                top: '65%',
              }}
            />

            {/* Condition Icon */}
            <NodeIcon icon={icon} displayName={displayName} size="md" />

            {/* Output Labels */}
            <div
              className="absolute right-0 text-xs text-white px-1 py-0.5 rounded-l pointer-events-none z-10"
              style={{
                top: '35%',
                backgroundColor: '#22c55e',
                transform: 'translateY(-50%)',
                marginRight: '-1px',
                fontSize: '10px',
              }}
            >
              T
            </div>
            <div
              className="absolute right-0 text-xs text-white px-1 py-0.5 rounded-l pointer-events-none z-10"
              style={{
                top: '65%',
                backgroundColor: '#ef4444',
                transform: 'translateY(-50%)',
                marginRight: '-1px',
                fontSize: '10px',
              }}
            >
              F
            </div>

            {/* Shared NodeToolbar */}
            <NodeToolbar
              visible={isHovered}
              onPlay={() => {}}
              onStop={() => {}}
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
                    setShowLocalMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                >
                  <span>🧪</span> Test
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLocalMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                >
                  <span>📄</span> Copy
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
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

            {/* Status Badges */}
            {nodeData.disabled && <StatusBadge type="disabled" position="top-right" />}
            {mode === 'rules' && rules.length > 0 && (
              <StatusBadge type="count" content={rules.length} position="top-left" color="yellow" />
            )}
          </div>
        </div>
      </div>

      {/* Node Label */}
      <NodeLabel displayName={displayName} subtitle={getSubtitle()} maxWidth={150} />
    </div>
  );
};

export default ConditionNodeBody;
