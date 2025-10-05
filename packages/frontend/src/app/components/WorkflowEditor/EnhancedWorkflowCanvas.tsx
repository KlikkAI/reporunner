import {
  BugOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  HistoryOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Badge, Button, Space } from 'antd';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  type Connection,
  Controls,
  MiniMap,
  type Node,
  Panel,
  useReactFlow,
} from 'reactflow';
import { useWorkflowExecution } from '@/core/hooks/useWorkflowExecution';
import { useWorkflowStore } from '@/core/stores/workflowStore';
import { DebugPanel } from './DebugPanel';
import { ExecutionPanel } from './ExecutionPanel';
import { NodePalette } from './NodePalette';
import { PropertyPanel } from './PropertyPanel';

interface EnhancedWorkflowCanvasProps {
  workflowId?: string;
  readOnly?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  className?: string;
}

export const EnhancedWorkflowCanvas: React.FC<EnhancedWorkflowCanvasProps> = ({
  workflowId,
  readOnly = false,
  showMinimap = true,
  showControls = true,
  className = '',
}) => {
  const _reactFlowInstance = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const { nodes, edges, updateNode, updateEdge, addNode, removeNode, saveWorkflow, isLoading } =
    useWorkflowStore();

  const { execution, isExecuting, startExecution, stopExecution, executionHistory } =
    useWorkflowExecution(workflowId);

  // Enhanced node types with execution status
  const enhancedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        executionStatus: execution?.nodeStates?.[node.id]?.status,
        executionData: execution?.nodeStates?.[node.id]?.data,
        isSelected: selectedNodeId === node.id,
        onSelect: () => setSelectedNodeId(node.id),
        onDelete: readOnly ? undefined : () => removeNode(node.id),
        onEdit: readOnly ? undefined : () => setSelectedNodeId(node.id),
      },
    }));
  }, [nodes, execution, selectedNodeId, readOnly, removeNode]);

  // Enhanced edges with execution flow
  const enhancedEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      animated: execution?.activeEdges?.includes(edge.id),
      style: {
        ...edge.style,
        stroke: execution?.activeEdges?.includes(edge.id) ? '#1890ff' : '#d9d9d9',
        strokeWidth: execution?.activeEdges?.includes(edge.id) ? 3 : 1,
      },
    }));
  }, [edges, execution]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) {
        return;
      }

      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'smoothstep',
        animated: false,
      };

      updateEdge(addEdge(newEdge, edges));
    },
    [edges, updateEdge, readOnly]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (readOnly) {
      return;
    }
    await saveWorkflow();
  }, [saveWorkflow, readOnly]);

  const handleExecute = useCallback(async () => {
    if (isExecuting) {
      await stopExecution();
    } else {
      await startExecution();
      setShowExecutionPanel(true);
    }
  }, [isExecuting, startExecution, stopExecution]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const toggleDebug = useCallback(() => {
    setShowDebugPanel(!showDebugPanel);
  }, [showDebugPanel]);

  const selectedNode = useMemo(() => {
    return selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  }, [selectedNodeId, nodes]);

  return (
    <div
      className={`relative h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className}`}
    >
      {/* Toolbar */}
      <Panel position="top-left" className="m-4">
        <Space>
          <Button
            type="primary"
            icon={isExecuting ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={handleExecute}
            loading={isLoading}
            disabled={readOnly || nodes.length === 0}
          >
            {isExecuting ? 'Stop' : 'Execute'}
          </Button>

          {!readOnly && (
            <Button icon={<SaveOutlined />} onClick={handleSave} loading={isLoading}>
              Save
            </Button>
          )}

          <Button
            icon={<BugOutlined />}
            onClick={toggleDebug}
            type={showDebugPanel ? 'primary' : 'default'}
          >
            Debug
          </Button>

          <Button
            icon={<HistoryOutlined />}
            onClick={() => setShowExecutionPanel(true)}
            disabled={!executionHistory.length}
          >
            <Badge count={executionHistory.length} size="small">
              History
            </Badge>
          </Button>

          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          />
        </Space>
      </Panel>

      {/* Execution Status */}
      {execution && (
        <Panel position="top-right" className="m-4">
          <div className="bg-white rounded-lg shadow-lg p-3 border">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  execution.status === 'running'
                    ? 'bg-blue-500 animate-pulse'
                    : execution.status === 'success'
                      ? 'bg-green-500'
                      : execution.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium capitalize">{execution.status}</span>
              {execution.progress && (
                <span className="text-xs text-gray-500">
                  {Math.round(execution.progress * 100)}%
                </span>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* Main Canvas */}
      <ReactFlow
        nodes={enhancedNodes}
        edges={enhancedEdges}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
      >
        {showControls && <Controls />}
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              const status = node.data?.executionStatus;
              if (status === 'success') {
                return '#52c41a';
              }
              if (status === 'error') {
                return '#ff4d4f';
              }
              if (status === 'running') {
                return '#1890ff';
              }
              return '#d9d9d9';
            }}
            className="!bg-white !border !border-gray-200"
          />
        )}
        <Background color="#f0f0f0" gap={20} />
      </ReactFlow>

      {/* Node Palette */}
      {!(readOnly || isFullscreen) && (
        <NodePalette
          onNodeAdd={addNode}
          className="absolute left-4 top-20 w-64 max-h-96 overflow-y-auto"
        />
      )}

      {/* Property Panel */}
      {selectedNode && (
        <PropertyPanel
          node={selectedNode}
          onUpdate={updateNode}
          onClose={() => setSelectedNodeId(null)}
          readOnly={readOnly}
          className="absolute right-4 top-20 w-80 max-h-96 overflow-y-auto"
        />
      )}

      {/* Execution Panel */}
      {showExecutionPanel && (
        <ExecutionPanel
          execution={execution}
          history={executionHistory}
          onClose={() => setShowExecutionPanel(false)}
          className="absolute bottom-4 left-4 right-4 h-64"
        />
      )}

      {/* Debug Panel */}
      {showDebugPanel && (
        <DebugPanel
          nodes={nodes}
          edges={edges}
          execution={execution}
          onClose={() => setShowDebugPanel(false)}
          className="absolute top-4 right-4 w-96 max-h-96"
        />
      )}
    </div>
  );
};

export default EnhancedWorkflowCanvas;
