import type React from 'react';
import { memo, useMemo, useRef, useState } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { getCustomBodyComponent } from '@/app/node-extensions/nodeUiRegistry';
import { nodeRegistry, type WorkflowNodeInstance } from '@/core';
import { useSmartMenuPosition } from '../../../hooks/useSmartMenuPosition';
import NodeToolbar from './BaseNode/NodeToolbar';

interface RegistryNodeData extends WorkflowNodeInstance {
  onDelete?: () => void;
  onEdit?: () => void;
  onOpenProperties?: () => void;
}

interface RegistryNodeProps extends NodeProps<RegistryNodeData> {}

/**
 * RegistryNode - A React Flow node component that uses the Node Registry
 * This component looks up node definitions from the registry to render nodes
 */
const RegistryNode: React.FC<RegistryNodeProps> = ({ data, selected, id }) => {
  // Hover state for custom toolbar
  const [isHovered, setIsHovered] = useState(false);
  // Menu state for NodeMenu
  const [showMenu, setShowMenu] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { positionClasses, positionStyles } = useSmartMenuPosition({
    isOpen: showMenu,
    triggerRef: menuTriggerRef as React.RefObject<HTMLElement>,
    menuRef: menuRef as React.RefObject<HTMLElement>,
    offset: 4,
    onClose: () => setShowMenu(false),
  });

  // Click-outside handling is now centralized in useSmartMenuPosition hook
  // Look up the node definition from the registry
  const nodeDefinition = useMemo(() => {
    return nodeRegistry.getNodeTypeDescription(data.type);
  }, [data.type]);

  // Get visual configuration
  const { icon, displayName, subtitle } = useMemo(() => {
    if (!nodeDefinition) {
      return {
        icon: '❓',
        displayName: data.type,
        color: '#666',
        subtitle: 'Unknown node type',
      };
    }

    // Build subtitle from parameters if template exists
    let subtitle = nodeDefinition.subtitle || '';
    if (subtitle && data.parameters) {
      subtitle = subtitle.replace(/\{\{[^}]+\}\}/g, (match) => {
        const paramPath = match.replace('{{$parameter["', '').replace('"]}}', '');
        return data.parameters[paramPath] || '';
      });
    }

    return {
      icon: nodeDefinition.icon || nodeDefinition.iconUrl || '📦',
      displayName: data.name || nodeDefinition.displayName,
      color: nodeDefinition.defaults?.color || '#1890ff',
      subtitle,
    };
  }, [nodeDefinition, data.name, data.parameters]);

  // Determine node status

  // Render handles based on node definition
  const renderHandles = () => {
    if (!nodeDefinition) return null;

    const handles = [];

    // Input handles
    if (nodeDefinition.inputs?.length > 0) {
      handles.push(
        <Handle
          key="input-main"
          type="target"
          position={Position.Left}
          id="input_0"
          style={{
            background: '#555',
            width: 10,
            height: 10,
            // No top property - handle will be vertically centered by default
          }}
        />
      );
    }

    // Output handles
    if (nodeDefinition.outputs?.length > 0) {
      nodeDefinition.outputs.forEach((_, index) => {
        // For single output, don't set top (centers by default)
        // For multiple outputs, calculate vertical distribution
        const handleStyle: React.CSSProperties = {
          background: '#555',
          width: 10,
          height: 10,
        };

        if (nodeDefinition.outputs.length > 1) {
          handleStyle.top = `${((index + 1) / (nodeDefinition.outputs.length + 1)) * 100}%`;
        }
        // No top property for single output - centers by default

        handles.push(
          <Handle
            key={`output-${index}`}
            type="source"
            position={Position.Right}
            id={`output_${index}`}
            style={handleStyle}
          />
        );
      });
    }

    return handles;
  };

  // Simple status indicator logic - integrated into main template

  // Toolbar handlers
  const handlePlay = (nodeId: string) => {
    console.log('Play node:', nodeId);
    // TODO: Implement play functionality
  };

  const handleStop = (nodeId: string) => {
    console.log('Stop node:', nodeId);
    // TODO: Implement stop functionality
  };

  const handleDelete = (nodeId: string) => {
    console.log('Delete node:', nodeId);
    data.onDelete?.();
  };

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    // Handle double-click to open properties panel
    event.stopPropagation();
    console.log('Double-click on registry node:', id);
    data.onOpenProperties?.();
  };

  // Render shared node toolbar and menu
  const renderToolbarAndMenu = () => {
    const toolbarVisible = isHovered; // Show on hover only, not requiring selection

    return (
      <>
        <NodeToolbar
          visible={toolbarVisible}
          onPlay={() => handlePlay(id)}
          onStop={() => handleStop(id)}
          onDelete={(e) => {
            e.stopPropagation();
            handleDelete(id);
          }}
          onMenuToggle={handleMenuToggle}
          menuTriggerRef={menuTriggerRef as React.RefObject<HTMLButtonElement>}
        />
        {/* Custom dark-themed menu with smart positioning */}
        {showMenu && (
          <div
            ref={menuRef}
            className={`${positionClasses} bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1 min-w-[120px]`}
            style={positionStyles}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onOpenProperties?.();
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            >
              <span>📂</span> Open
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement test functionality
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            >
              <span>🧪</span> Test
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement copy functionality
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            >
              <span>📄</span> Copy
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement duplicate functionality
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            >
              <span>📋</span> Duplicate
            </button>
            <hr className="my-1 border-gray-600" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(id);
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
            >
              <span>🗑️</span> Delete
            </button>
          </div>
        )}
      </>
    );
  };

  // Check for custom body component
  const CustomBodyComponent = useMemo(() => {
    if (!nodeDefinition?.customBodyComponent) return null;
    return getCustomBodyComponent(nodeDefinition.customBodyComponent);
  }, [nodeDefinition]);

  // If custom body component exists, use it instead of default rendering
  if (CustomBodyComponent) {
    return (
      <div
        className={`registry-node ${selected ? 'selected' : ''} relative`}
        style={{
          opacity: data.disabled ? 0.5 : 1,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
      >
        {/* Custom body components handle their own handles and toolbars internally */}
        <CustomBodyComponent
          nodeId={id}
          nodeData={data}
          selected={selected}
          isHovered={isHovered}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDelete={data.onDelete}
          onEdit={data.onEdit}
          onOpenProperties={data.onOpenProperties}
        />
      </div>
    );
  }

  return (
    <div
      className={`registry-node ${selected ? 'selected' : ''} relative`}
      style={{
        opacity: data.disabled ? 0.5 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {renderHandles()}
      {renderToolbarAndMenu()}

      {/* Gmail-style Base Template for All Nodes */}
      <div className="flex flex-col">
        <div className="relative">
          <div
            className={`
              relative flex items-center justify-center bg-gray-800 p-4 shadow-lg transition-all duration-200
              rounded-md min-w-[80px] max-w-[150px] min-h-[60px]
              ${selected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-red-400' : ''}
              ${isHovered ? 'hover:shadow-xl hover:scale-105 ring-2 ring-offset-2 ring-offset-gray-900 ring-red-400' : ''}
            `}
          >
            {/* Dynamic Node Icon */}
            <div className="flex items-center justify-center">
              {icon.startsWith('http') || icon.startsWith('/') ? (
                <img
                  src={icon}
                  alt={displayName}
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
              ) : (
                <span className="text-2xl">{icon}</span>
              )}
              {/* Fallback icon for broken images */}
              <span className="hidden text-xl">📦</span>
            </div>

            {/* Status Indicators */}
            {(data.disabled || data.retryOnFail || data.continueOnFail) && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">
                  {data.disabled ? '!' : data.retryOnFail ? 'R' : 'C'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Node Label - Below the node */}
        <div className="mt-2 text-white text-sm font-medium text-center max-w-[150px] truncate">
          {displayName}
        </div>

        {/* Subtitle if exists */}
        {subtitle && (
          <div className="text-xs text-gray-400 text-center max-w-[150px] truncate">{subtitle}</div>
        )}
      </div>
    </div>
  );
};

export default memo(RegistryNode);
