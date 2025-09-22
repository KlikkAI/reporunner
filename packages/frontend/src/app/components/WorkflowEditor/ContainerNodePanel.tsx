/**
 * Container Node Panel
 *
 * Side panel for adding and managing container nodes in the workflow editor.
 * Provides drag-and-drop functionality for creating loop, parallel, conditional,
 * try-catch, and batch containers.
 */

import {
  InfoCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useState } from 'react';
import {
  type ContainerNodeConfig,
  createBatchContainer,
  createConditionalContainer,
  createLoopContainer,
  createParallelContainer,
  createTryCatchContainer,
} from '@/core/types/containerNodes';
import { cn } from '@/design-system/utils';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface ContainerNodePanelProps {
  onAddContainer: (container: ContainerNodeConfig) => void;
  className?: string;
}

interface ContainerTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createFunction: (
    id: string,
    name: string,
    position: { x: number; y: number }
  ) => ContainerNodeConfig;
}

const ContainerNodePanel: React.FC<ContainerNodePanelProps> = ({ onAddContainer, className }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContainerTemplate | null>(null);
  const [createForm] = Form.useForm();

  const containerTemplates: ContainerTemplate[] = [
    {
      id: 'loop',
      name: 'Loop Container',
      description: 'Execute child nodes repeatedly based on conditions',
      icon: '🔄',
      color: '#3b82f6',
      createFunction: createLoopContainer,
    },
    {
      id: 'parallel',
      name: 'Parallel Container',
      description: 'Execute child nodes simultaneously with concurrency control',
      icon: '⚡',
      color: '#22c55e',
      createFunction: createParallelContainer,
    },
    {
      id: 'conditional',
      name: 'Conditional Container',
      description: 'Execute child nodes based on conditional logic',
      icon: '❓',
      color: '#f59e0b',
      createFunction: createConditionalContainer,
    },
    {
      id: 'try-catch',
      name: 'Try-Catch Container',
      description: 'Handle errors and retry logic for child nodes',
      icon: '🛡️',
      color: '#ef4444',
      createFunction: createTryCatchContainer,
    },
    {
      id: 'batch',
      name: 'Batch Container',
      description: 'Process data in batches with size and delay controls',
      icon: '📦',
      color: '#a855f7',
      createFunction: createBatchContainer,
    },
  ];

  const handleDragStart = (event: React.DragEvent, template: ContainerTemplate) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({
        type: 'container',
        template: template.id,
        name: template.name,
      })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCreateContainer = (values: any) => {
    if (!selectedTemplate) return;

    const container = selectedTemplate.createFunction(
      `container_${Date.now()}`,
      values.name,
      { x: 100, y: 100 } // Default position
    );

    onAddContainer(container);
    setIsCreateModalOpen(false);
    createForm.resetFields();
    setSelectedTemplate(null);
  };

  const openCreateModal = (template: ContainerTemplate) => {
    setSelectedTemplate(template);
    setIsCreateModalOpen(true);
    createForm.setFieldsValue({
      name: template.name,
    });
  };

  return (
    <div className={cn('h-full bg-gray-900 border-r border-gray-700', className)}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <Title level={4} className="text-white mb-0">
            Container Nodes
          </Title>
          <Tooltip title="Add custom container">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                // Open custom container creation
              }}
              className="text-gray-400 hover:text-gray-300"
            />
          </Tooltip>
        </div>
        <Text className="text-gray-400 text-sm">
          Advanced workflow structures for complex automation patterns
        </Text>
      </div>

      <div className="p-4 space-y-4">
        <Collapse ghost defaultActiveKey={['containers']} className="bg-transparent">
          <Panel
            header={
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">Container Types</span>
                <Badge count={containerTemplates.length} size="small" />
              </div>
            }
            key="containers"
            className="bg-gray-800"
          >
            <div className="space-y-2">
              {containerTemplates.map((template) => (
                <Card
                  key={template.id}
                  size="small"
                  className="bg-gray-800 border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                  draggable
                  onDragStart={(e) => handleDragStart(e, template)}
                  onClick={() => openCreateModal(template)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">{template.name}</div>
                      <div className="text-gray-400 text-xs">{template.description}</div>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip title="Drag to canvas">
                        <Button
                          type="text"
                          size="small"
                          icon={<ReloadOutlined />}
                          className="text-gray-400 hover:text-gray-300"
                        />
                      </Tooltip>
                      <Tooltip title="Create directly">
                        <Button
                          type="text"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateModal(template);
                          }}
                          className="text-gray-400 hover:text-gray-300"
                        />
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Panel>
        </Collapse>

        <div className="space-y-2">
          <Title level={5} className="text-white mb-2">
            Quick Actions
          </Title>

          <Space direction="vertical" className="w-full">
            <Button
              type="dashed"
              className="w-full text-left h-auto p-3"
              onClick={() => {
                // Create a simple loop container
                const container = createLoopContainer(`loop_${Date.now()}`, 'Quick Loop', {
                  x: 200,
                  y: 200,
                });
                onAddContainer(container);
              }}
            >
              <div className="flex items-center gap-2">
                <ReloadOutlined className="text-blue-400" />
                <div>
                  <div className="text-white text-sm">Quick Loop</div>
                  <div className="text-gray-400 text-xs">10 iterations, 1s delay</div>
                </div>
              </div>
            </Button>

            <Button
              type="dashed"
              className="w-full text-left h-auto p-3"
              onClick={() => {
                // Create a simple parallel container
                const container = createParallelContainer(
                  `parallel_${Date.now()}`,
                  'Quick Parallel',
                  { x: 200, y: 200 }
                );
                onAddContainer(container);
              }}
            >
              <div className="flex items-center gap-2">
                <ThunderboltOutlined className="text-green-400" />
                <div>
                  <div className="text-white text-sm">Quick Parallel</div>
                  <div className="text-gray-400 text-xs">5 concurrent executions</div>
                </div>
              </div>
            </Button>

            <Button
              type="dashed"
              className="w-full text-left h-auto p-3"
              onClick={() => {
                // Create a simple conditional container
                const container = createConditionalContainer(
                  `conditional_${Date.now()}`,
                  'Quick Conditional',
                  { x: 200, y: 200 }
                );
                onAddContainer(container);
              }}
            >
              <div className="flex items-center gap-2">
                <QuestionCircleOutlined className="text-yellow-400" />
                <div>
                  <div className="text-white text-sm">Quick Conditional</div>
                  <div className="text-gray-400 text-xs">Basic if-then logic</div>
                </div>
              </div>
            </Button>
          </Space>
        </div>

        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <InfoCircleOutlined />
            <span>Drag containers to canvas or click to create directly</span>
          </div>
        </div>
      </div>

      {/* Create Container Modal */}
      <Modal
        title={`Create ${selectedTemplate?.name || 'Container'}`}
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          setSelectedTemplate(null);
        }}
        onOk={() => createForm.submit()}
        width={500}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateContainer}>
          <Form.Item
            name="name"
            label="Container Name"
            rules={[{ required: true, message: 'Please enter a container name' }]}
          >
            <Input placeholder="Enter container name" />
          </Form.Item>

          {selectedTemplate && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{selectedTemplate.icon}</span>
                <span className="font-medium">{selectedTemplate.name}</span>
              </div>
              <div className="text-gray-600 text-sm">{selectedTemplate.description}</div>
            </div>
          )}

          {selectedTemplate?.id === 'loop' && (
            <>
              <Form.Item name="loopLimit" label="Maximum Iterations" initialValue={10}>
                <InputNumber min={1} max={1000} className="w-full" />
              </Form.Item>
              <Form.Item name="loopDelay" label="Delay Between Iterations (ms)" initialValue={1000}>
                <InputNumber min={0} max={10000} className="w-full" />
              </Form.Item>
            </>
          )}

          {selectedTemplate?.id === 'parallel' && (
            <>
              <Form.Item name="maxConcurrency" label="Maximum Concurrency" initialValue={5}>
                <InputNumber min={1} max={20} className="w-full" />
              </Form.Item>
              <Form.Item name="parallelStrategy" label="Execution Strategy" initialValue="all">
                <Select>
                  <Select.Option value="all">Wait for All</Select.Option>
                  <Select.Option value="race">First to Complete</Select.Option>
                  <Select.Option value="any">Any to Complete</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ContainerNodePanel;
