/**
 * Debug Panel Component
 *
 * Comprehensive debugging interface providing:
 * - Breakpoint management and execution control
 * - Step-through debugging with call stack visualization
 * - Data inspection and variable watching
 * - Execution history and replay functionality
 * - Performance profiling and metrics
 */

import {
  BugOutlined,
  CodeOutlined,
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Switch,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { enhancedDebuggingService } from '@/core/services/enhancedDebuggingService';
import type {
  CallStackFrame,
  DebugEvent,
  DebugMetrics,
  DebugSession,
  ExecutionStep,
  WatchExpression,
} from '@/core/types/debugging';
import { JsonViewer } from '@/design-system';
import { cn } from '@/design-system/utils';

const { Title, Text } = Typography;

interface DebugPanelProps {
  workflowId?: string;
  executionId?: string;
  className?: string;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ workflowId, executionId, className }) => {
  const [activeTab, setActiveTab] = useState('controls');
  const [session, setSession] = useState<DebugSession | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [_currentStep, _setCurrentStep] = useState<ExecutionStep | null>(null);

  const [watchExpressions, _setWatchExpressions] = useState<WatchExpression[]>([]);
  const [callStack, setCallStack] = useState<CallStackFrame[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [executionHistory, _setExecutionHistory] = useState<ExecutionStep[]>([]);
  const [metrics, setMetrics] = useState<DebugMetrics | null>(null);
  const [isBreakpointModalOpen, setIsBreakpointModalOpen] = useState(false);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [newWatchExpression, setNewWatchExpression] = useState('');

  const updateSessionData = useCallback(() => {
    const currentSession = enhancedDebuggingService.getCurrentSession();
    if (currentSession) {
      setSession(currentSession);
      setCallStack(enhancedDebuggingService.getCallStack());
      setVariables(enhancedDebuggingService.getVariables());
      setMetrics(enhancedDebuggingService.getDebugMetrics());
    }
  }, []);

  const handleDebugEvent = useCallback(
    (event: DebugEvent) => {
      switch (event.type) {
        case 'session-started':
          setIsDebugging(true);
          break;
        case 'session-ended':
          setIsDebugging(false);
          setIsPaused(false);
          setSession(null);
          break;
        case 'step-completed':
          _setCurrentStep(event.data);
          updateSessionData();
          break;
        case 'breakpoint-hit':
          setIsPaused(true);
          updateSessionData();
          break;
        case 'error-occurred':
          setIsPaused(true);
          updateSessionData();
          break;
      }
    },
    [updateSessionData]
  );

  // Subscribe to debug events
  useEffect(() => {
    const unsubscribe = enhancedDebuggingService.subscribe((event: DebugEvent) => {
      handleDebugEvent(event);
    });

    return unsubscribe;
  }, [handleDebugEvent]);

  const startDebugging = useCallback(async () => {
    if (!(workflowId && executionId)) {
      return;
    }

    try {
      await enhancedDebuggingService.startDebugging(workflowId, executionId);
      setIsDebugging(true);
      updateSessionData();
    } catch (_error) {}
  }, [workflowId, executionId, updateSessionData]);

  const stopDebugging = useCallback(() => {
    enhancedDebuggingService.stopDebugging();
    setIsDebugging(false);
    setIsPaused(false);
    setSession(null);
  }, []);

  const pauseExecution = useCallback(() => {
    enhancedDebuggingService.pauseExecution();
    setIsPaused(true);
  }, []);

  const resumeExecution = useCallback(() => {
    enhancedDebuggingService.resumeExecution();
    setIsPaused(false);
  }, []);

  const stepOver = useCallback(() => {
    enhancedDebuggingService.stepOver();
    setIsPaused(true);
  }, []);

  const stepInto = useCallback(() => {
    enhancedDebuggingService.stepInto();
    setIsPaused(true);
  }, []);

  const stepOut = useCallback(() => {
    enhancedDebuggingService.stepOut();
    setIsPaused(true);
  }, []);

  const addBreakpoint = useCallback(
    (nodeId: string, condition?: string) => {
      enhancedDebuggingService.addBreakpoint(nodeId, {
        nodeId,
        enabled: true,
        hitCount: 0,
        condition,
        actions: [{ type: 'pause' }],
        createdAt: Date.now(),
      });
      updateSessionData();
    },
    [updateSessionData]
  );

  const removeBreakpoint = useCallback(
    (nodeId: string, breakpointId: string) => {
      enhancedDebuggingService.removeBreakpoint(nodeId, breakpointId);
      updateSessionData();
    },
    [updateSessionData]
  );

  const toggleBreakpoint = useCallback(
    (nodeId: string, breakpointId: string) => {
      enhancedDebuggingService.toggleBreakpoint(nodeId, breakpointId);
      updateSessionData();
    },
    [updateSessionData]
  );

  const addWatchExpression = useCallback(() => {
    if (newWatchExpression.trim()) {
      enhancedDebuggingService.addWatchExpression(newWatchExpression.trim());
      setNewWatchExpression('');
      setIsWatchModalOpen(false);
      updateSessionData();
    }
  }, [newWatchExpression, updateSessionData]);

  const removeWatchExpression = useCallback(
    (id: string) => {
      enhancedDebuggingService.removeWatchExpression(id);
      updateSessionData();
    },
    [updateSessionData]
  );

  const getStatusColor = () => {
    if (!isDebugging) {
      return 'gray';
    }
    if (isPaused) {
      return 'orange';
    }
    return 'green';
  };

  const getStatusText = () => {
    if (!isDebugging) {
      return 'Not Debugging';
    }
    if (isPaused) {
      return 'Paused';
    }
    return 'Running';
  };

  const renderDebugControls = () => (
    <Card size="small" className="bg-gray-800 border-gray-600 mb-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BugOutlined className="text-blue-400" />
            <Title level={5} className="text-white mb-0">
              Debug Controls
            </Title>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              status={getStatusColor() as any}
              text={getStatusText()}
              className="text-gray-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isDebugging ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={startDebugging}
              disabled={!(workflowId && executionId)}
            >
              Start Debugging
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={resumeExecution}>
                  Resume
                </Button>
              ) : (
                <Button icon={<PauseCircleOutlined />} onClick={pauseExecution}>
                  Pause
                </Button>
              )}

              <Button
                icon={<StepForwardOutlined />}
                onClick={stepOver}
                disabled={!isPaused}
                title="Step Over"
              />

              <Button
                icon={<StepBackwardOutlined />}
                onClick={stepInto}
                disabled={!isPaused}
                title="Step Into"
              />

              <Button
                icon={<StopOutlined />}
                onClick={stepOut}
                disabled={!isPaused}
                title="Step Out"
              />

              <Button danger icon={<StopOutlined />} onClick={stopDebugging}>
                Stop
              </Button>
            </>
          )}
        </div>

        {session && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Text className="text-gray-400">Session ID:</Text>
              <div className="text-white font-mono">{session.id}</div>
            </div>
            <div>
              <Text className="text-gray-400">Step Count:</Text>
              <div className="text-white">{session.stepCount}</div>
            </div>
            <div>
              <Text className="text-gray-400">Duration:</Text>
              <div className="text-white">
                {Math.round((Date.now() - session.startTime) / 1000)}s
              </div>
            </div>
            <div>
              <Text className="text-gray-400">Current Node:</Text>
              <div className="text-white">{session.currentNodeId || 'None'}</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  const renderBreakpoints = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={5} className="text-white mb-0">
          Breakpoints
        </Title>
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setIsBreakpointModalOpen(true)}
        >
          Add Breakpoint
        </Button>
      </div>

      {session && session.breakpoints.size === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <BugOutlined className="text-4xl mb-2" />
          <div>No breakpoints set</div>
          <div className="text-xs mt-2">Add breakpoints to pause execution at specific nodes</div>
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from(session?.breakpoints.entries() || []).map(([nodeId, breakpoints]) =>
            breakpoints.map((breakpoint) => (
              <Card key={breakpoint.id} size="small" className="bg-gray-800 border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      size="small"
                      checked={breakpoint.enabled}
                      onChange={() => toggleBreakpoint(nodeId, breakpoint.id)}
                    />
                    <div>
                      <div className="text-white text-sm font-medium">Node: {nodeId}</div>
                      {breakpoint.condition && (
                        <div className="text-gray-400 text-xs">
                          Condition: {breakpoint.condition}
                        </div>
                      )}
                      <div className="text-gray-500 text-xs">Hits: {breakpoint.hitCount}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      count={breakpoint.hitCount}
                      size="small"
                      style={{ backgroundColor: '#1890ff' }}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeBreakpoint(nodeId, breakpoint.id)}
                      className="text-red-400 hover:text-red-300"
                    />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderWatchExpressions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={5} className="text-white mb-0">
          Watch Expressions
        </Title>
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setIsWatchModalOpen(true)}
        >
          Add Watch
        </Button>
      </div>

      {watchExpressions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <EyeOutlined className="text-4xl mb-2" />
          <div>No watch expressions</div>
          <div className="text-xs mt-2">Add expressions to monitor variable values</div>
        </div>
      ) : (
        <div className="space-y-2">
          {watchExpressions.map((watch) => (
            <Card key={watch.id} size="small" className="bg-gray-800 border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-white text-sm font-mono">{watch.expression}</div>
                  <div className="text-gray-400 text-xs mt-1">
                    {watch.error ? (
                      <span className="text-red-400">Error: {watch.error}</span>
                    ) : (
                      <>
                        <span className="text-green-400">Value: </span>
                        <span className="font-mono">
                          {typeof watch.value === 'object'
                            ? JSON.stringify(watch.value)
                            : String(watch.value)}
                        </span>
                        <span className="text-gray-500 ml-2">({watch.type})</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeWatchExpression(watch.id)}
                  className="text-red-400 hover:text-red-300"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderCallStack = () => (
    <div className="space-y-4">
      <Title level={5} className="text-white mb-0">
        Call Stack
      </Title>

      {callStack.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <CodeOutlined className="text-4xl mb-2" />
          <div>Call stack is empty</div>
          <div className="text-xs mt-2">Start debugging to see the call stack</div>
        </div>
      ) : (
        <Timeline
          items={callStack.map((frame, index) => ({
            color: index === callStack.length - 1 ? 'blue' : 'gray',
            children: (
              <div className="space-y-1">
                <div className="text-white font-medium">{frame.nodeName}</div>
                <div className="text-gray-400 text-sm">{frame.nodeType}</div>
                <div className="text-gray-500 text-xs">
                  {new Date(frame.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ),
          }))}
        />
      )}
    </div>
  );

  const renderVariables = () => (
    <div className="space-y-4">
      <Title level={5} className="text-white mb-0">
        Variables
      </Title>

      {Object.keys(variables).length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <InfoCircleOutlined className="text-4xl mb-2" />
          <div>No variables available</div>
          <div className="text-xs mt-2">Variables will appear during execution</div>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(variables).map(([key, value]) => (
            <Card key={key} size="small" className="bg-gray-800 border-gray-600">
              <div className="space-y-2">
                <div className="text-white font-medium">{key}</div>
                <JsonViewer data={value} theme="dark" collapsed={1} maxHeight="200px" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderExecutionHistory = () => (
    <div className="space-y-4">
      <Title level={5} className="text-white mb-0">
        Execution History
      </Title>

      {executionHistory.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <HistoryOutlined className="text-4xl mb-2" />
          <div>No execution history</div>
          <div className="text-xs mt-2">Execution steps will appear here</div>
        </div>
      ) : (
        <Timeline
          items={executionHistory.map((step) => ({
            color:
              step.action === 'error' ? 'red' : step.action === 'breakpoint' ? 'orange' : 'blue',
            children: (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{step.nodeId}</span>
                  <Tag
                    color={
                      step.action === 'error'
                        ? 'red'
                        : step.action === 'breakpoint'
                          ? 'orange'
                          : step.action === 'start'
                            ? 'blue'
                            : 'green'
                    }
                  >
                    {step.action}
                  </Tag>
                </div>
                <div className="text-gray-500 text-xs">
                  {new Date(step.timestamp).toLocaleTimeString()}
                  {step.duration && ` (${step.duration}ms)`}
                </div>
                {step.error && (
                  <div className="text-red-400 text-xs">Error: {step.error.message}</div>
                )}
              </div>
            ),
          }))}
        />
      )}
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-4">
      <Title level={5} className="text-white mb-0">
        Debug Metrics
      </Title>

      {!metrics ? (
        <div className="text-center text-gray-500 py-8">
          <SettingOutlined className="text-4xl mb-2" />
          <div>No metrics available</div>
          <div className="text-xs mt-2">Start debugging to see performance metrics</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Card size="small" className="bg-gray-800 border-gray-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{metrics.totalSteps}</div>
              <div className="text-gray-400 text-sm">Total Steps</div>
            </div>
          </Card>

          <Card size="small" className="bg-gray-800 border-gray-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{metrics.breakpointHits}</div>
              <div className="text-gray-400 text-sm">Breakpoint Hits</div>
            </div>
          </Card>

          <Card size="small" className="bg-gray-800 border-gray-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{metrics.errors}</div>
              <div className="text-gray-400 text-sm">Errors</div>
            </div>
          </Card>

          <Card size="small" className="bg-gray-800 border-gray-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {Math.round(metrics.averageStepTime)}ms
              </div>
              <div className="text-gray-400 text-sm">Avg Step Time</div>
            </div>
          </Card>

          <Card size="small" className="bg-gray-800 border-gray-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{metrics.callStackDepth}</div>
              <div className="text-gray-400 text-sm">Call Stack Depth</div>
            </div>
          </Card>

          <Card size="small" className="bg-gray-800 border-gray-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {Math.round(metrics.memoryUsage)}MB
              </div>
              <div className="text-gray-400 text-sm">Memory Usage</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('h-full bg-gray-900 border-r border-gray-700', className)}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <BugOutlined className="text-red-400 text-lg" />
          <Title level={4} className="text-white mb-0">
            Debug Panel
          </Title>
        </div>
        <Text className="text-gray-400 text-sm">
          Advanced debugging tools for workflow execution
        </Text>
      </div>

      <div className="p-4">
        {renderDebugControls()}

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="debug-tabs"
          items={[
            {
              key: 'breakpoints',
              label: (
                <span>
                  <BugOutlined className="mr-1" />
                  Breakpoints
                  {session && session.breakpoints.size > 0 && (
                    <Badge
                      count={Array.from(session.breakpoints.values()).flat().length}
                      size="small"
                      className="ml-2"
                    />
                  )}
                </span>
              ),
              children: renderBreakpoints(),
            },
            {
              key: 'watch',
              label: (
                <span>
                  <EyeOutlined className="mr-1" />
                  Watch
                  {watchExpressions.length > 0 && (
                    <Badge count={watchExpressions.length} size="small" className="ml-2" />
                  )}
                </span>
              ),
              children: renderWatchExpressions(),
            },
            {
              key: 'callstack',
              label: (
                <span>
                  <CodeOutlined className="mr-1" />
                  Call Stack
                  {callStack.length > 0 && (
                    <Badge count={callStack.length} size="small" className="ml-2" />
                  )}
                </span>
              ),
              children: renderCallStack(),
            },
            {
              key: 'variables',
              label: (
                <span>
                  <InfoCircleOutlined className="mr-1" />
                  Variables
                  {Object.keys(variables).length > 0 && (
                    <Badge count={Object.keys(variables).length} size="small" className="ml-2" />
                  )}
                </span>
              ),
              children: renderVariables(),
            },
            {
              key: 'history',
              label: (
                <span>
                  <HistoryOutlined className="mr-1" />
                  History
                  {executionHistory.length > 0 && (
                    <Badge count={executionHistory.length} size="small" className="ml-2" />
                  )}
                </span>
              ),
              children: renderExecutionHistory(),
            },
            {
              key: 'metrics',
              label: (
                <span>
                  <SettingOutlined className="mr-1" />
                  Metrics
                </span>
              ),
              children: renderMetrics(),
            },
          ]}
        />
      </div>

      {/* Add Breakpoint Modal */}
      <Modal
        title="Add Breakpoint"
        open={isBreakpointModalOpen}
        onCancel={() => setIsBreakpointModalOpen(false)}
        onOk={() => {
          if (selectedNodeId) {
            addBreakpoint(selectedNodeId);
            setIsBreakpointModalOpen(false);
            setSelectedNodeId('');
          }
        }}
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="Node ID" required>
            <Input
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              placeholder="Enter node ID"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Watch Expression Modal */}
      <Modal
        title="Add Watch Expression"
        open={isWatchModalOpen}
        onCancel={() => setIsWatchModalOpen(false)}
        onOk={addWatchExpression}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="Expression" required>
            <Input
              value={newWatchExpression}
              onChange={(e) => setNewWatchExpression(e.target.value)}
              placeholder="e.g., $input.user.name, variables.count, $output.result"
            />
          </Form.Item>
          <Alert
            message="Expression Examples"
            description={
              <ul className="mt-2 text-sm">
                <li>
                  <code>$input.user.name</code> - Access input data
                </li>
                <li>
                  <code>$output.result</code> - Access output data
                </li>
                <li>
                  <code>variables.count</code> - Access workflow variables
                </li>
                <li>
                  <code>JSON.stringify($input)</code> - Convert to JSON
                </li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  );
};

export default DebugPanel;
