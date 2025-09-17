/**
 * Enhanced Debug Panel
 *
 * Comprehensive debugging interface with breakpoints, call stack,
 * variable inspection, and step-through execution controls.
 * Inspired by modern IDE debugging panels.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Drawer,
  Tabs,
  Button,
  Card,
  Badge,
  Tooltip,
  Input,
  Switch,
  Tree,
  Table,
  Progress,
} from "antd";
import {
  BugOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  StepBackwardOutlined,
  StopOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownOutlined,
  RightOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  DatabaseOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { cn } from "@/design-system/utils";
import { workflowDebugger } from "@/core/services/workflowDebugger";
import { useLeanWorkflowStore } from "@/core/stores/leanWorkflowStore";
import type {
  DebugSession,
  DebugBreakpoint,
  DebugFrame,
  DebugVariable,
  DebugStep,
} from "@/core/services/workflowDebugger";

const { TextArea } = Input;

interface DebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  position?: "left" | "right" | "bottom";
  currentExecutionId?: string;
}

interface BreakpointItemProps {
  breakpoint: DebugBreakpoint;
  onToggle: (nodeId: string) => void;
  onRemove: (nodeId: string) => void;
  onEdit: (nodeId: string, condition?: string) => void;
}

const BreakpointItem: React.FC<BreakpointItemProps> = ({
  breakpoint,
  onToggle,
  onRemove,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [condition, setCondition] = useState(breakpoint.condition || "");

  const handleSave = useCallback(() => {
    onEdit(breakpoint.nodeId, condition || undefined);
    setIsEditing(false);
  }, [breakpoint.nodeId, condition, onEdit]);

  return (
    <Card
      size="small"
      className={cn("mb-2", !breakpoint.enabled && "opacity-50")}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={cn(
                "w-3 h-3 rounded-full cursor-pointer",
                breakpoint.enabled ? "bg-red-500" : "bg-gray-300",
              )}
              onClick={() => onToggle(breakpoint.nodeId)}
            />
            <span className="text-sm font-medium">
              Node: {breakpoint.nodeId}
            </span>
            <Badge count={breakpoint.hitCount} size="small" />
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Input
                placeholder="Condition (e.g., input.value > 100)"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                size="small"
              />
              <div className="flex gap-1">
                <Button size="small" type="primary" onClick={handleSave}>
                  Save
                </Button>
                <Button size="small" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {breakpoint.condition && (
                <div className="text-xs text-gray-600 mb-1">
                  Condition:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {breakpoint.condition}
                  </code>
                </div>
              )}
              <div className="flex gap-1">
                <Button
                  size="small"
                  type="text"
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600"
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => onRemove(breakpoint.nodeId)}
                  className="text-red-600"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

const BreakpointsTab: React.FC<{ session?: DebugSession }> = ({ session }) => {
  const [newBreakpointNode, setNewBreakpointNode] = useState("");
  const [newBreakpointCondition, setNewBreakpointCondition] = useState("");
  const { nodes } = useLeanWorkflowStore();

  const breakpoints = useMemo(() => workflowDebugger.getBreakpoints(), []);

  const handleAddBreakpoint = useCallback(() => {
    if (!newBreakpointNode.trim()) return;

    workflowDebugger.setBreakpoint(
      newBreakpointNode.trim(),
      newBreakpointCondition.trim() || undefined,
    );

    setNewBreakpointNode("");
    setNewBreakpointCondition("");
  }, [newBreakpointNode, newBreakpointCondition]);

  const handleToggleBreakpoint = useCallback((nodeId: string) => {
    workflowDebugger.toggleBreakpoint(nodeId);
  }, []);

  const handleRemoveBreakpoint = useCallback((nodeId: string) => {
    workflowDebugger.removeBreakpoint(nodeId);
  }, []);

  const handleEditBreakpoint = useCallback(
    (nodeId: string, condition?: string) => {
      workflowDebugger.setBreakpoint(nodeId, condition);
    },
    [],
  );

  return (
    <div className="p-3 space-y-4">
      {/* Add Breakpoint */}
      <Card size="small" title="Add Breakpoint">
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-600">Node ID</label>
            <Input
              placeholder="Enter node ID"
              value={newBreakpointNode}
              onChange={(e) => setNewBreakpointNode(e.target.value)}
              size="small"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">
              Condition (optional)
            </label>
            <Input
              placeholder="e.g., input.value > 100"
              value={newBreakpointCondition}
              onChange={(e) => setNewBreakpointCondition(e.target.value)}
              size="small"
            />
          </div>
          <Button
            type="primary"
            size="small"
            onClick={handleAddBreakpoint}
            disabled={!newBreakpointNode.trim()}
            block
          >
            Add Breakpoint
          </Button>
        </div>
      </Card>

      {/* Breakpoints List */}
      <div>
        <h3 className="text-sm font-medium mb-2">
          Breakpoints ({breakpoints.length})
        </h3>
        {breakpoints.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <BugOutlined className="text-2xl mb-2" />
            <div className="text-sm">No breakpoints set</div>
          </div>
        ) : (
          breakpoints.map((breakpoint) => (
            <BreakpointItem
              key={breakpoint.id}
              breakpoint={breakpoint}
              onToggle={handleToggleBreakpoint}
              onRemove={handleRemoveBreakpoint}
              onEdit={handleEditBreakpoint}
            />
          ))
        )}
      </div>
    </div>
  );
};

const CallStackTab: React.FC<{ session?: DebugSession }> = ({ session }) => {
  if (!session) {
    return (
      <div className="p-3 text-center text-gray-500 py-8">
        <CodeOutlined className="text-3xl mb-2" />
        <div className="text-sm">No active debug session</div>
      </div>
    );
  }

  const callStackData = session.callStack
    .map((nodeId, index) => {
      const frame = session.frames.find((f) => f.nodeId === nodeId);
      return {
        key: index,
        index: session.callStack.length - index,
        nodeId,
        nodeName: frame?.nodeName || nodeId,
        nodeType: frame?.nodeType || "unknown",
        status: frame?.status || "pending",
        duration: frame?.performance.duration || 0,
      };
    })
    .reverse(); // Show most recent first

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      width: 40,
      render: (index: number, record: any) => (
        <span
          className={cn(
            "text-xs",
            index === 1 && "font-bold text-blue-600", // Current frame
          )}
        >
          {index}
        </span>
      ),
    },
    {
      title: "Node",
      dataIndex: "nodeName",
      key: "nodeName",
      render: (name: string, record: any) => (
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-gray-500">{record.nodeType}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (status: string) => (
        <Badge
          status={
            status === "completed"
              ? "success"
              : status === "failed"
                ? "error"
                : status === "running"
                  ? "processing"
                  : "default"
          }
          text={status}
        />
      ),
    },
    {
      title: "Time",
      dataIndex: "duration",
      key: "duration",
      width: 70,
      render: (duration: number) => (
        <span className="text-xs">{duration > 0 ? `${duration}ms` : "-"}</span>
      ),
    },
  ];

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <CodeOutlined className="text-blue-600" />
        <span className="text-sm font-medium">Call Stack</span>
        <Badge count={session.callStack.length} size="small" />
      </div>

      <Table
        dataSource={callStackData}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ y: 300 }}
        className="debug-call-stack"
      />
    </div>
  );
};

const VariablesTab: React.FC<{ session?: DebugSession }> = ({ session }) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [watchExpression, setWatchExpression] = useState("");

  const currentFrame = session?.frames[session.frames.length - 1];

  const handleAddWatch = useCallback(() => {
    if (!session || !watchExpression.trim()) return;

    workflowDebugger.addWatchExpression(session.id, watchExpression.trim());
    setWatchExpression("");
  }, [session, watchExpression]);

  const handleRemoveWatch = useCallback(
    (expression: string) => {
      if (!session) return;
      workflowDebugger.removeWatchExpression(session.id, expression);
    },
    [session],
  );

  // Convert variables to tree structure
  const variableTree = useMemo(() => {
    if (!currentFrame) return [];

    const scopeGroups = currentFrame.variables.reduce(
      (groups, variable) => {
        if (!groups[variable.scope]) {
          groups[variable.scope] = [];
        }
        groups[variable.scope].push(variable);
        return groups;
      },
      {} as Record<string, DebugVariable[]>,
    );

    return Object.entries(scopeGroups).map(([scope, variables]) => ({
      title: scope.toUpperCase(),
      key: scope,
      icon: <DatabaseOutlined />,
      children: variables.map((variable) => ({
        title: (
          <div className="flex justify-between items-center">
            <span>
              <span className="font-medium">{variable.name}</span>
              <span className="text-xs text-gray-500 ml-2">
                ({variable.type})
              </span>
            </span>
            <span className="text-xs text-blue-600">
              {JSON.stringify(variable.value).slice(0, 50)}
              {JSON.stringify(variable.value).length > 50 ? "..." : ""}
            </span>
          </div>
        ),
        key: `${scope}-${variable.name}`,
        isLeaf: true,
      })),
    }));
  }, [currentFrame]);

  if (!session) {
    return (
      <div className="p-3 text-center text-gray-500 py-8">
        <EyeOutlined className="text-3xl mb-2" />
        <div className="text-sm">No active debug session</div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Watch Expressions */}
      <Card size="small" title="Watch">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter expression to watch"
              value={watchExpression}
              onChange={(e) => setWatchExpression(e.target.value)}
              size="small"
              onPressEnter={handleAddWatch}
            />
            <Button
              type="primary"
              size="small"
              onClick={handleAddWatch}
              disabled={!watchExpression.trim()}
            >
              Add
            </Button>
          </div>

          {session.watchedVariables.map((watch, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-gray-50 p-2 rounded"
            >
              <div className="flex-1">
                <div className="text-sm font-medium">{watch.expression}</div>
                <div className="text-xs text-gray-600">
                  {watch.error ? (
                    <span className="text-red-600">Error: {watch.error}</span>
                  ) : (
                    JSON.stringify(watch.value)
                  )}
                </div>
              </div>
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveWatch(watch.expression)}
                className="text-red-600"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Variables Tree */}
      <div>
        <h3 className="text-sm font-medium mb-2">Variables</h3>
        {variableTree.length > 0 ? (
          <Tree
            treeData={variableTree}
            defaultExpandAll
            showIcon
            className="debug-variables-tree"
          />
        ) : (
          <div className="text-center text-gray-500 py-4">
            <DatabaseOutlined className="text-2xl mb-2" />
            <div className="text-sm">No variables available</div>
          </div>
        )}
      </div>
    </div>
  );
};

const PerformanceTab: React.FC<{ session?: DebugSession }> = ({ session }) => {
  if (!session) {
    return (
      <div className="p-3 text-center text-gray-500 py-8">
        <BarChartOutlined className="text-3xl mb-2" />
        <div className="text-sm">No active debug session</div>
      </div>
    );
  }

  const performanceData = session.frames
    .filter((frame) => frame.performance.duration)
    .map((frame) => ({
      key: frame.id,
      nodeName: frame.nodeName,
      nodeType: frame.nodeType,
      duration: frame.performance.duration!,
      status: frame.status,
    }))
    .sort((a, b) => b.duration - a.duration);

  const totalTime = performanceData.reduce(
    (sum, item) => sum + item.duration,
    0,
  );
  const maxTime = Math.max(...performanceData.map((item) => item.duration));

  const columns = [
    {
      title: "Node",
      dataIndex: "nodeName",
      key: "nodeName",
      render: (name: string, record: any) => (
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-gray-500">{record.nodeType}</div>
        </div>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      width: 120,
      render: (duration: number) => (
        <div>
          <div className="text-sm font-medium">{duration}ms</div>
          <Progress
            percent={(duration / maxTime) * 100}
            size="small"
            showInfo={false}
            strokeColor="#1890ff"
          />
        </div>
      ),
    },
    {
      title: "% of Total",
      dataIndex: "duration",
      key: "percentage",
      width: 80,
      render: (duration: number) => (
        <span className="text-xs">
          {((duration / totalTime) * 100).toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <div className="p-3 space-y-4">
      {/* Performance Summary */}
      <Card size="small" title="Performance Summary">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-xs text-gray-500">Total Time</div>
            <div className="text-lg font-bold text-blue-600">{totalTime}ms</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Nodes Executed</div>
            <div className="text-lg font-bold text-green-600">
              {performanceData.length}
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Table */}
      <div>
        <h3 className="text-sm font-medium mb-2">Node Performance</h3>
        <Table
          dataSource={performanceData}
          columns={columns}
          pagination={false}
          size="small"
          scroll={{ y: 300 }}
        />
      </div>
    </div>
  );
};

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isVisible,
  onToggle,
  position = "right",
  currentExecutionId,
}) => {
  const [activeSession, setActiveSession] = useState<DebugSession | null>(null);
  const [activeTab, setActiveTab] = useState("breakpoints");

  // Debug control handlers
  const handleStepInto = useCallback(() => {
    if (!activeSession) return;
    workflowDebugger.executeStep(activeSession.id, { type: "step_into" });
  }, [activeSession]);

  const handleStepOver = useCallback(() => {
    if (!activeSession) return;
    workflowDebugger.executeStep(activeSession.id, { type: "step_over" });
  }, [activeSession]);

  const handleContinue = useCallback(() => {
    if (!activeSession) return;
    workflowDebugger.executeStep(activeSession.id, { type: "continue" });
  }, [activeSession]);

  const handlePause = useCallback(() => {
    if (!activeSession) return;
    workflowDebugger.executeStep(activeSession.id, { type: "pause" });
  }, [activeSession]);

  const handleStop = useCallback(() => {
    if (!activeSession) return;
    workflowDebugger.executeStep(activeSession.id, { type: "stop" });
    setActiveSession(null);
  }, [activeSession]);

  // Update active session when execution changes
  useEffect(() => {
    if (currentExecutionId) {
      const sessions = workflowDebugger.getActiveSessions();
      const session = sessions.find(
        (s) => s.executionId === currentExecutionId,
      );
      setActiveSession(session || null);
    } else {
      setActiveSession(null);
    }
  }, [currentExecutionId]);

  const tabItems = [
    {
      key: "breakpoints",
      label: (
        <span className="flex items-center gap-1">
          <BugOutlined />
          Breakpoints
        </span>
      ),
      children: <BreakpointsTab session={activeSession || undefined} />,
    },
    {
      key: "callstack",
      label: (
        <span className="flex items-center gap-1">
          <CodeOutlined />
          Call Stack
        </span>
      ),
      children: <CallStackTab session={activeSession || undefined} />,
    },
    {
      key: "variables",
      label: (
        <span className="flex items-center gap-1">
          <EyeOutlined />
          Variables
        </span>
      ),
      children: <VariablesTab session={activeSession || undefined} />,
    },
    {
      key: "performance",
      label: (
        <span className="flex items-center gap-1">
          <BarChartOutlined />
          Performance
        </span>
      ),
      children: <PerformanceTab session={activeSession || undefined} />,
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BugOutlined className="text-orange-600" />
            <span>Debug Panel</span>
            {activeSession && (
              <Badge
                status={
                  activeSession.status === "running"
                    ? "processing"
                    : activeSession.status === "paused"
                      ? "warning"
                      : activeSession.status === "completed"
                        ? "success"
                        : "error"
                }
                text={activeSession.status}
              />
            )}
          </div>

          {/* Debug Controls */}
          {activeSession && (
            <div className="flex gap-1">
              <Tooltip title="Step Into">
                <Button
                  type="text"
                  size="small"
                  icon={<StepForwardOutlined />}
                  onClick={handleStepInto}
                  disabled={activeSession.status !== "paused"}
                />
              </Tooltip>
              <Tooltip title="Step Over">
                <Button
                  type="text"
                  size="small"
                  icon={<StepBackwardOutlined />}
                  onClick={handleStepOver}
                  disabled={activeSession.status !== "paused"}
                />
              </Tooltip>
              {activeSession.status === "paused" ? (
                <Tooltip title="Continue">
                  <Button
                    type="text"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={handleContinue}
                    className="text-green-600"
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Pause">
                  <Button
                    type="text"
                    size="small"
                    icon={<PauseCircleOutlined />}
                    onClick={handlePause}
                    disabled={activeSession.status !== "running"}
                    className="text-orange-600"
                  />
                </Tooltip>
              )}
              <Tooltip title="Stop">
                <Button
                  type="text"
                  size="small"
                  icon={<StopOutlined />}
                  onClick={handleStop}
                  className="text-red-600"
                />
              </Tooltip>
            </div>
          )}
        </div>
      }
      placement={position}
      onClose={onToggle}
      open={isVisible}
      width={450}
      className="debug-panel"
      bodyStyle={{ padding: 0 }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="h-full"
        tabBarStyle={{ margin: 0, paddingLeft: 16, paddingRight: 16 }}
      />
    </Drawer>
  );
};

export default DebugPanel;
