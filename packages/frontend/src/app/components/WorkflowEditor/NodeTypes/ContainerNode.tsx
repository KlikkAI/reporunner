/**
 * Container Node Component
 *
 * Advanced container nodes that can hold other nodes and provide
 * complex execution patterns like loops, parallel processing, and conditionals.
 */

import React, { useState, useCallback, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Button,
  Space,
  Tooltip,
  Badge,
  Dropdown,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  ExpandOutlined,
  CompressOutlined,
  MoreOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { cn } from "@/design-system/utils";
import type {
  ContainerNodeConfig,
  ContainerExecutionState,
  ContainerResizeEvent,
  ContainerDropEvent,
} from "@/core/types/containerNodes";

interface ContainerNodeProps extends NodeProps {
  data: {
    config: ContainerNodeConfig;
    state: ContainerExecutionState;
    onResize?: (event: ContainerResizeEvent) => void;
    onDrop?: (event: ContainerDropEvent) => void;
    onConfigChange?: (config: ContainerNodeConfig) => void;
    onExecute?: (containerId: string) => void;
    onStop?: (containerId: string) => void;
  };
}

const ContainerNode: React.FC<ContainerNodeProps> = ({ data, selected }) => {
  const { config, state, onResize, onDrop, onConfigChange, onExecute, onStop } =
    data;
  const [isResizing, setIsResizing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configForm] = Form.useForm();
  const resizeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== resizeRef.current) return;

      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = config.dimensions.width;
      const startHeight = config.dimensions.height;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const newWidth = Math.max(200, startWidth + deltaX);
        const newHeight = Math.max(150, startHeight + deltaY);

        onResize?.({
          containerId: config.id,
          newDimensions: { width: newWidth, height: newHeight },
          childrenPositions: [], // Would be calculated based on children
        });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [config, onResize],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const nodeData = e.dataTransfer.getData("application/reactflow");
      if (!nodeData) return;

      const nodeInfo = JSON.parse(nodeData);
      const rect = e.currentTarget.getBoundingClientRect();
      const position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      onDrop?.({
        containerId: config.id,
        nodeId: nodeInfo.id,
        position,
      });
    },
    [config.id, onDrop],
  );

  const handleExecute = useCallback(() => {
    onExecute?.(config.id);
  }, [config.id, onExecute]);

  const handleStop = useCallback(() => {
    onStop?.(config.id);
  }, [config.id, onStop]);

  const handleConfigChange = useCallback(
    (values: any) => {
      const newConfig = {
        ...config,
        executionConfig: { ...config.executionConfig, ...values },
      };
      onConfigChange?.(newConfig);
      setIsConfigModalOpen(false);
    },
    [config, onConfigChange],
  );

  const getStatusIcon = () => {
    switch (state.status) {
      case "running":
        return <PlayCircleOutlined className="text-green-500" />;
      case "completed":
        return <PlayCircleOutlined className="text-blue-500" />;
      case "failed":
        return <StopOutlined className="text-red-500" />;
      case "paused":
        return <PauseCircleOutlined className="text-yellow-500" />;
      default:
        return <PlayCircleOutlined className="text-gray-500" />;
    }
  };

  const getContainerIcon = () => {
    switch (config.type) {
      case "loop":
        return "🔄";
      case "parallel":
        return "⚡";
      case "conditional":
        return "❓";
      case "try-catch":
        return "🛡️";
      case "batch":
        return "📦";
      default:
        return "📁";
    }
  };

  const menuItems = [
    {
      key: "config",
      label: "Configure",
      icon: <SettingOutlined />,
      onClick: () => setIsConfigModalOpen(true),
    },
    {
      key: "expand",
      label: "Expand",
      icon: <ExpandOutlined />,
      onClick: () => {
        onResize?.({
          containerId: config.id,
          newDimensions: { width: 600, height: 500 },
          childrenPositions: [],
        });
      },
    },
    {
      key: "compress",
      label: "Compress",
      icon: <CompressOutlined />,
      onClick: () => {
        onResize?.({
          containerId: config.id,
          newDimensions: { width: 300, height: 200 },
          childrenPositions: [],
        });
      },
    },
    {
      type: "divider" as const,
    },
    {
      key: "delete",
      label: "Delete Container",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        // Handle container deletion
      },
    },
  ];

  return (
    <>
      <div
        className={cn(
          "relative border-2 rounded-lg transition-all duration-200",
          selected && "ring-2 ring-blue-500 ring-opacity-50",
          isResizing && "cursor-nw-resize",
        )}
        style={{
          width: config.dimensions.width,
          height: config.dimensions.height,
          backgroundColor: config.style.backgroundColor,
          borderColor: config.style.borderColor,
          borderWidth: config.style.borderWidth,
          borderRadius: config.style.borderRadius,
          opacity: config.style.opacity,
          zIndex: config.style.zIndex,
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Container Header */}
        <div className="absolute top-0 left-0 right-0 p-2 bg-gray-900 bg-opacity-80 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getContainerIcon()}</span>
              <span className="text-sm font-semibold text-white">
                {config.name}
              </span>
              <Badge
                count={config.children.length}
                size="small"
                style={{ backgroundColor: "#1890ff" }}
              />
            </div>

            <Space size="small">
              {state.status === "running" ? (
                <Tooltip title="Stop execution">
                  <Button
                    type="text"
                    size="small"
                    icon={<StopOutlined />}
                    onClick={handleStop}
                    className="text-red-400 hover:text-red-300"
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Start execution">
                  <Button
                    type="text"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={handleExecute}
                    className="text-green-400 hover:text-green-300"
                  />
                </Tooltip>
              )}

              <Dropdown
                menu={{ items: menuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  className="text-gray-400 hover:text-gray-300"
                />
              </Dropdown>
            </Space>
          </div>
        </div>

        {/* Container Status */}
        <div className="absolute top-8 left-2 right-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-gray-300 capitalize">{state.status}</span>
            </div>

            {state.currentIteration !== undefined && (
              <div className="text-gray-400">
                {state.currentIteration}/{state.totalIterations || "∞"}
              </div>
            )}
          </div>
        </div>

        {/* Container Content Area */}
        <div className="absolute top-16 left-2 right-2 bottom-2 bg-gray-800 bg-opacity-50 rounded border border-gray-600">
          <div className="p-2 h-full overflow-auto">
            {config.children.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-2xl mb-2">📁</div>
                  <div className="text-sm">Drop nodes here</div>
                  <div className="text-xs">to add them to this container</div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {config.children.map((childId) => (
                  <div
                    key={childId}
                    className="p-1 bg-gray-700 rounded text-xs text-gray-300"
                  >
                    {childId}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className="absolute bottom-0 right-0 w-3 h-3 cursor-nw-resize bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={handleMouseDown}
        />

        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="w-3 h-3 bg-blue-500 border-2 border-white"
        />

        {/* Output Handles */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="w-3 h-3 bg-green-500 border-2 border-white"
        />
      </div>

      {/* Configuration Modal */}
      <Modal
        title={`Configure ${config.name}`}
        open={isConfigModalOpen}
        onCancel={() => setIsConfigModalOpen(false)}
        onOk={() => configForm.submit()}
        width={600}
      >
        <Form
          form={configForm}
          layout="vertical"
          initialValues={config.executionConfig}
          onFinish={handleConfigChange}
        >
          {config.type === "loop" && (
            <>
              <Form.Item name="loopType" label="Loop Type">
                <Select>
                  <Select.Option value="for">For Loop</Select.Option>
                  <Select.Option value="while">While Loop</Select.Option>
                  <Select.Option value="foreach">For Each</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="loopLimit" label="Maximum Iterations">
                <InputNumber min={1} max={1000} />
              </Form.Item>

              <Form.Item name="loopDelay" label="Delay Between Iterations (ms)">
                <InputNumber min={0} max={10000} />
              </Form.Item>
            </>
          )}

          {config.type === "parallel" && (
            <>
              <Form.Item name="maxConcurrency" label="Maximum Concurrency">
                <InputNumber min={1} max={20} />
              </Form.Item>

              <Form.Item name="parallelStrategy" label="Execution Strategy">
                <Select>
                  <Select.Option value="all">Wait for All</Select.Option>
                  <Select.Option value="race">First to Complete</Select.Option>
                  <Select.Option value="any">Any to Complete</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}

          {config.type === "conditional" && (
            <Form.Item name="conditionExpression" label="Condition Expression">
              <Input.TextArea
                placeholder="Enter JavaScript expression, e.g., $input.value > 10"
                rows={3}
              />
            </Form.Item>
          )}

          {config.type === "try-catch" && (
            <>
              <Form.Item name="retryAttempts" label="Retry Attempts">
                <InputNumber min={0} max={10} />
              </Form.Item>

              <Form.Item name="retryDelay" label="Retry Delay (ms)">
                <InputNumber min={0} max={10000} />
              </Form.Item>

              <Form.Item name="errorHandling" label="Error Handling">
                <Select>
                  <Select.Option value="stop">Stop on Error</Select.Option>
                  <Select.Option value="continue">
                    Continue on Error
                  </Select.Option>
                  <Select.Option value="retry">Retry on Error</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}

          {config.type === "batch" && (
            <>
              <Form.Item name="batchSize" label="Batch Size">
                <InputNumber min={1} max={100} />
              </Form.Item>

              <Form.Item name="batchDelay" label="Batch Delay (ms)">
                <InputNumber min={0} max={10000} />
              </Form.Item>

              <Form.Item name="batchStrategy" label="Batch Strategy">
                <Select>
                  <Select.Option value="sequential">Sequential</Select.Option>
                  <Select.Option value="parallel">Parallel</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default ContainerNode;
