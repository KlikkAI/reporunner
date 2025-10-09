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
import { useEnhancedExecutionStore } from '@/core/stores/enhancedExecutionStore';
import { useLeanWorkflowStore } from '@/core/stores/leanWorkflowStore';
import type { WorkflowNodeData } from '@/core/types/workflow';
import DebugPanel from './DebugPanel';
import { ExecutionPanel } from './ExecutionPanel';

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
  void _reactFlowInstance; // Suppress unused variable warning
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Use existing stores
  const { activeWorkflow, updateWorkflow, isLoading } = useLeanWorkflowStore();
  const { currentExecution, executionHistory, activeExecutions } = useEnhancedExecutionStore();

  const nodes = activeWorkflow?.nodes || [];
  const edges = activeWorkflow?.edges || [];

  // Stub implementations for missing functions
  const updateEdge = useCallback((_edges: any) => {
    // Stub: would update edges in workflow
  }, []);
  const removeNode = useCallback((_nodeId: string) => {
    // Stub: would remove node from workflow
  }, []);
  const saveWorkflow = useCallback(async () => {
    if (activeWorkflow) {
      await updateWorkflow(activeWorkflow.id, activeWorkflow);
    }
  }, [activeWorkflow, updateWorkflow]);

  const execution = currentExecution;
  const isExecuting = activeExecutions.size > 0;
  const startExecution = useCallback(() => {
    // Stub: would start execution
  }, []);
  const stopExecution = useCallback(() => {
    // Stub: would stop execution
  }, []);

  // Enhanced node types with execution status
  const enhancedNodes = useMemo(() => {
    return (nodes as any[]).map((node: Node<WorkflowNodeData>) => ({
      ...node,
      data: {
        ...node.data,
        executionStatus: (execution as any)?.nodeStates?.[node.id]?.status,
        executionData: (execution as any)?.nodeStates?.[node.id]?.data,
        isSelected: selectedNodeId === node.id,
        onSelect: () => setSelectedNodeId(node.id),
        onDelete: readOnly ? undefined : () => removeNode(node.id),
        onEdit: readOnly ? undefined : () => setSelectedNodeId(node.id),
      },
    }));
  }, [nodes, execution, selectedNodeId, readOnly, removeNode]);

  // Enhanced edges with execution flow
  const enhancedEdges = useMemo(() => {
    return edges.map((edge: any) => ({
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

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
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
              {execution.progress?.totalNodes && (
                <span className="text-xs text-gray-500">
                  {Math.round(
                    ((execution.progress.completedNodes?.length || 0) /
                      execution.progress.totalNodes) *
                      100
                  )}
                  %
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

      {/* Node Palette - Commented out until implemented */}
      {/* {!(readOnly || isFullscreen) && (
        <NodePalette
          onNodeAdd={addNode}
          className="absolute left-4 top-20 w-64 max-h-96 overflow-y-auto"
        />
      )} */}

      {/* Property Panel - Commented out until implemented */}
      {/* {selectedNode && (
        <PropertyPanel
          node={selectedNode}
          onUpdate={updateNode}
          onClose={() => setSelectedNodeId(null)}
          readOnly={readOnly}
          className="absolute right-4 top-20 w-80 max-h-96 overflow-y-auto"
        />
      )} */}

      {/* Execution Panel */}
      <ExecutionPanel
        isVisible={showExecutionPanel}
        onToggle={() => setShowExecutionPanel(false)}
      />

      {/* Debug Panel */}
      {showDebugPanel && (
        <DebugPanel
          workflowId={workflowId}
          executionId={execution?.id}
          className="absolute top-4 right-4 w-96 max-h-96"
        />
      )}
    </div>
  );
};

export default EnhancedWorkflowCanvas;
