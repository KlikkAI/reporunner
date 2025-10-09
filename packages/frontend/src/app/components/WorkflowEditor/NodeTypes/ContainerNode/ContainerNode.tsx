/**
 * Container Node Component
 *
 * Supports multiple container types:
 * - Loop containers for iteration workflows
 * - Parallel containers for concurrent execution
 * - Conditional containers for branching logic
 * - Subflow containers for nested workflows
 */

import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { Node } from 'reactflow';
import { Handle, Position, useReactFlow } from 'reactflow';
import { cn } from '@/design-system/utils';

export type ContainerType = 'loop' | 'parallel' | 'conditional' | 'subflow';

export interface ContainerNodeData {
  label: string;
  containerType: ContainerType;
  children: Node[];
  config: {
    // Loop configuration
    loopMode?: 'forEach' | 'while' | 'count';
    loopCondition?: string;
    loopCount?: number;
    loopVariable?: string;

    // Parallel configuration
    parallelMode?: 'all' | 'first' | 'race';
    maxConcurrency?: number;

    // Conditional configuration
    conditions?: Array<{
      id: string;
      condition: string;
      label: string;
    }>;

    // Subflow configuration
    subflowId?: string;
    passthrough?: boolean;
  };

  // Container visual properties
  dimensions: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
  };

  // Auto-resize settings
  autoResize: boolean;
  padding: number;

  // Container state
  isExpanded: boolean;
  isCollapsed: boolean;
}

interface ContainerNodeProps {
  id: string;
  data: ContainerNodeData;
  selected?: boolean;
}

const getContainerStyles = (containerType: ContainerType, selected: boolean) => {
  const baseStyles = 'relative border-2 border-dashed rounded-lg transition-all duration-200';

  const typeStyles = {
    loop: 'border-purple-400 bg-purple-900/10',
    parallel: 'border-blue-400 bg-blue-900/10',
    conditional: 'border-yellow-400 bg-yellow-900/10',
    subflow: 'border-green-400 bg-green-900/10',
  };

  const selectedStyles = selected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-400' : '';

  return cn(baseStyles, typeStyles[containerType], selectedStyles);
};

const getContainerIcon = (containerType: ContainerType) => {
  const icons = {
    loop: '🔄',
    parallel: '⚡',
    conditional: '🔀',
    subflow: '📦',
  };
  return icons[containerType];
};

const ContainerHeader: React.FC<{
  containerType: ContainerType;
  label: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEdit: () => void;
}> = ({ containerType, label, isExpanded, onToggleExpanded, onEdit }) => (
  <div className="flex items-center justify-between p-2 bg-gray-800 rounded-t border-b border-gray-600">
    <div className="flex items-center gap-2">
      <span className="text-lg">{getContainerIcon(containerType)}</span>
      <span className="text-sm font-medium text-white capitalize">{label || containerType}</span>
    </div>

    <div className="flex items-center gap-1">
      <button
        onClick={onEdit}
        className="p-1 text-gray-400 hover:text-white transition-colors"
        title="Edit container"
      >
        ⚙️
      </button>
      <button
        onClick={onToggleExpanded}
        className="p-1 text-gray-400 hover:text-white transition-colors"
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? '▼' : '▶'}
      </button>
    </div>
  </div>
);

const DropZone: React.FC<{
  containerType: ContainerType;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  hasChildren: boolean;
}> = ({ containerType, onDrop, onDragOver, hasChildren }) => (
  <div
    className={cn(
      'flex-1 flex items-center justify-center transition-all duration-200',
      'border-2 border-dashed border-gray-600 rounded m-2',
      'hover:border-gray-400 hover:bg-gray-800/20'
    )}
    onDrop={onDrop}
    onDragOver={onDragOver}
  >
    {!hasChildren ? (
      <div className="text-center p-8">
        <div className="text-3xl mb-2">{getContainerIcon(containerType)}</div>
        <div className="text-sm text-gray-400">
          Drop nodes here to add them to this {containerType}
        </div>
        {containerType === 'loop' && (
          <div className="text-xs text-gray-500 mt-1">Nodes will be executed repeatedly</div>
        )}
        {containerType === 'parallel' && (
          <div className="text-xs text-gray-500 mt-1">Nodes will be executed concurrently</div>
        )}
      </div>
    ) : (
      <div className="w-full h-full min-h-[200px] p-2">
        {/* Child nodes will be rendered here */}
        <div className="text-xs text-gray-500 text-center">Container content ({containerType})</div>
      </div>
    )}
  </div>
);

export const ContainerNode: React.FC<ContainerNodeProps> = ({ id, data, selected = false }) => {
  const { setNodes } = useReactFlow();
  const [isDragOver, setIsDragOver] = useState(false);

  const { containerType, children, dimensions, isExpanded, config } = data;

  const handleToggleExpanded = useCallback(() => {
    // Update node data to toggle expanded state
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                isExpanded: !node.data.isExpanded,
              },
            }
          : node
      )
    );
  }, [id, setNodes]);

  const handleEdit = useCallback(() => {}, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);

      try {
        const data = event.dataTransfer.getData('application/reactflow');
        if (!data) {
          return;
        }

        const { type, nodeTypeData, integrationData } = JSON.parse(data);

        // Calculate position within container
        const containerRect = event.currentTarget.getBoundingClientRect();
        const relativeX = event.clientX - containerRect.left;
        const relativeY = event.clientY - containerRect.top;

        // Create new node within container
        const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNode = {
          id: newNodeId,
          type: type,
          position: { x: relativeX - 50, y: relativeY - 25 }, // Center on drop point
          parameters: {},
          data: {
            label: nodeTypeData?.displayName || nodeTypeData?.name || type,
            integration: integrationData?.id,
            nodeType: nodeTypeData?.name || nodeTypeData?.id,
            configuration: {},
            credentials: [],
            // Mark this node as belonging to the container
            parentContainer: id,
            containerType: containerType,
          },
        };

        // Add the new node and update container to include this child
        setNodes((nodes) => [
          ...nodes,
          newNode,
          ...nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    children: [...(node.data.children || []), newNode],
                  },
                }
              : node
          ),
        ]);
      } catch (_error) {}
    },
    [id, containerType, setNodes]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    // Only hide if leaving the container entirely
    if (!event.currentTarget.contains(event.relatedTarget as HTMLElement)) {
      setIsDragOver(false);
    }
  }, []);

  // Calculate container handles based on type
  const containerHandles = useMemo(() => {
    switch (containerType) {
      case 'loop':
        return {
          inputs: [{ id: 'input', position: Position.Left }],
          outputs: [
            { id: 'loop-start', position: Position.Right, label: 'Loop Start' },
            { id: 'loop-end', position: Position.Bottom, label: 'Loop End' },
          ],
        };
      case 'parallel':
        return {
          inputs: [{ id: 'input', position: Position.Left }],
          outputs: [
            {
              id: 'parallel-branch',
              position: Position.Right,
              label: 'Branch',
            },
            {
              id: 'parallel-complete',
              position: Position.Bottom,
              label: 'Complete',
            },
          ],
        };
      case 'conditional':
        return {
          inputs: [{ id: 'input', position: Position.Left }],
          outputs:
            config.conditions?.map((condition, index) => ({
              id: condition.id,
              position: Position.Right,
              label: condition.label,
              style: { top: `${20 + index * 30}%` },
            })) || [],
        };
      case 'subflow':
        return {
          inputs: [{ id: 'input', position: Position.Left }],
          outputs: [{ id: 'output', position: Position.Right }],
        };
      default:
        return { inputs: [], outputs: [] };
    }
  }, [containerType, config.conditions]);

  return (
    <div
      className={cn(
        getContainerStyles(containerType, selected),
        isDragOver && 'ring-2 ring-blue-400 ring-opacity-50',
        'min-w-[300px] min-h-[200px]'
      )}
      style={{
        width: dimensions.width,
        height: isExpanded ? dimensions.height : 'auto',
      }}
      onDragLeave={handleDragLeave}
    >
      {/* Container Handles */}
      {containerHandles.inputs.map((handle) => (
        <Handle
          key={handle.id}
          type="target"
          position={handle.position}
          id={handle.id}
          className="!bg-gray-600 !border-2 !border-gray-400"
        />
      ))}

      {containerHandles.outputs.map((handle) => (
        <Handle
          key={handle.id}
          type="source"
          position={handle.position}
          id={handle.id}
          className="!bg-gray-600 !border-2 !border-gray-400"
          style={'style' in handle ? handle.style : undefined}
        >
          {'label' in handle && handle.label && (
            <div className="absolute top-0 left-full ml-2 text-xs text-gray-400 whitespace-nowrap">
              {handle.label}
            </div>
          )}
        </Handle>
      ))}

      {/* Container Header */}
      <ContainerHeader
        containerType={containerType}
        label={data.label}
        isExpanded={isExpanded}
        onToggleExpanded={handleToggleExpanded}
        onEdit={handleEdit}
      />

      {/* Container Content */}
      {isExpanded && (
        <DropZone
          containerType={containerType}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          hasChildren={children.length > 0}
        />
      )}

      {/* Container Footer with Stats */}
      <div className="px-2 py-1 bg-gray-800 rounded-b border-t border-gray-600">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>{children.length} nodes</span>
          {containerType === 'parallel' && config.maxConcurrency && (
            <span>Max: {config.maxConcurrency}</span>
          )}
          {containerType === 'loop' && config.loopMode && <span>{config.loopMode}</span>}
        </div>
      </div>
    </div>
  );
};

export default ContainerNode;
