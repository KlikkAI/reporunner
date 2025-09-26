import type React from 'react';
import { useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import NodeToolbar from '../../components/WorkflowEditor/NodeTypes/BaseNode/NodeToolbar';
import { useSmartMenuPosition } from '../../hooks/useSmartMenuPosition';
import type { CustomNodeBodyProps } from '../nodeUiRegistry';
import { useEnter } from './hooks/useEnter';
import { useEvent } from './hooks/useEvent';
import { useLeave } from './hooks/useLeave';
import { useRef } from './hooks/useRef';
import { useSmartMenuPosition } from './hooks/useSmartMenuPosition';
import { useState } from './hooks/useState';

interface GmailNodeBodyProps extends CustomNodeBodyProps {
  nodeData: any;
  selected: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDelete?: () => void;
  onOpenProperties?: () => void;
}

/**
 * Custom Gmail Node Body Component
 * Replicates the old UI style with small, rounded design
 */
const GmailNodeBody: React.FC<GmailNodeBodyProps> = ({
  nodeData,
  selected,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  onDelete,
  onOpenProperties,
}) => {
  const displayName = nodeData.name || nodeData.label || 'Gmail';
  const icon = 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg';

  // Menu state for NodeToolbar
  const [showLocalMenu, setShowLocalMenu] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { positionClasses, positionStyles } = useSmartMenuPosition({
    isOpen: showLocalMenu,
    triggerRef: menuTriggerRef,
    menuRef,
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
              ${selected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-red-400' : ''}
              ${isHovered ? 'hover:shadow-xl hover:scale-105 ring-2 ring-offset-2 ring-offset-gray-900 ring-red-400' : ''}
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

            {/* Gmail Icon */}
            <div className="flex items-center justify-center">
              <img
                src={icon}
                alt="Gmail"
                className="w-6 h-6"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling;
                  if (fallback) {
                    fallback.classList.remove('hidden');
                  }
                }}
              />
              <span className="hidden text-xl">📧</span>
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

            {/* Status Indicators */}
            {nodeData.disabled && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node Label - Below the node */}
      <div className="mt-2 text-white text-sm font-medium text-center max-w-[100px] truncate">
        {displayName}
      </div>
    </div>
  );
};

export default GmailNodeBody;
