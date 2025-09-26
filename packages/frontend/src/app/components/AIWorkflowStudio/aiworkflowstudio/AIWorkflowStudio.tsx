import {
  AudioOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  ExperimentOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  SettingOutlined,
  SoundOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Input,
  InputNumber,
  Modal,
  message,
  Progress,
  Row,
  Select,
  Slider,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
  Upload,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  type AIModel,
  type AINodeConfig,
  type AIWorkflowExecution,
  aiOrchestrationService,
  type MultiModalWorkflow,
} from '@/core/services/aiOrchestrationService';
import { useEffect } from './hooks/useEffect';
import { useState } from './hooks/useState';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

interface AIWorkflowStudioProps {
  visible: boolean;
  onClose: () => void;
}

export const AIWorkflowStudio: React.FC<AIWorkflowStudioProps> = ({ visible, onClose }) => {
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [nodeConfig, setNodeConfig] = useState<Partial<AINodeConfig>>({
    prompt: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 1000,
  });
  const [currentExecution, setCurrentExecution] = useState<AIWorkflowExecution | null>(null);
  const [executionHistory, setExecutionHistory] = useState<AIWorkflowExecution[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [workflowInputs, setWorkflowInputs] = useState<Record<string, any>>({});

  useEffect(() => {
    if (visible) {
      loadAvailableModels();
    }
  }, [visible, loadAvailableModels]);

  const loadAvailableModels = () => {
    const models = aiOrchestrationService.getAvailableModels();
    setAvailableModels(models);
    if (models.length > 0) {
      setSelectedModel(models[0].id);
    }
  };

  const handleExecuteWorkflow = async () => {
    if (!selectedModel) {
      message.error('Please select an AI model');
      return;
    }

    setIsExecuting(true);
    try {
      // Create a simple workflow for demonstration
      const workflow: Omit<MultiModalWorkflow, 'id'> = {
        name: 'AI Studio Workflow',
        description: 'Interactive AI workflow execution',
        inputTypes: ['text', 'image', 'audio'],
        outputTypes: ['text', 'structured_data'],
        nodes: [
          {
            id: 'main-node',
            type: 'ai_reasoning',
            config: {
              modelId: selectedModel,
              ...nodeConfig,
            } as AINodeConfig,
            dependencies: [],
            outputs: [],
            retryPolicy: {
              maxRetries: 2,
              backoffStrategy: 'exponential',
              retryConditions: ['error', 'low_confidence'],
              fallbackStrategy: 'different_model',
            },
          },
        ],
        edges: [],
        triggers: [{ type: 'manual', config: {}, enabled: true }],
        metadata: {
          version: '1.0.0',
          author: 'AI Studio',
          tags: ['interactive', 'multi-modal'],
          category: 'experimental',
          complexity: 'simple',
          estimatedCost: 0.1,
          estimatedTime: 5000,
          lastUpdated: new Date(),
        },
      };

      const createdWorkflow = await aiOrchestrationService.createMultiModalWorkflow(workflow);
      const execution = await aiOrchestrationService.executeWorkflow(
        createdWorkflow.id,
        workflowInputs
      );

      setCurrentExecution(execution);
      setExecutionHistory((prev: AIWorkflowExecution[]) => [execution, ...prev]);
      message.success('Workflow executed successfully!');
    } catch (error: any) {
      message.error(`Execution failed: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFileUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        content: e.target?.result,
        timestamp: new Date(),
      };
      setUploadedFiles((prev: any[]) => [...prev, fileData]);
      setWorkflowInputs((prev: Record<string, any>) => ({
        ...prev,
        files: [...(prev.files || []), fileData],
      }));
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('audio/')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }

    return false; // Prevent auto upload
  };

  const getModelIcon = (model: AIModel) => {
    switch (model.type) {
      case 'language':
        return <RobotOutlined />;
      case 'vision':
        return <EyeOutlined />;
      case 'speech':
        return <AudioOutlined />;
      case 'code':
        return <CodeOutlined />;
      case 'multimodal':
        return <ExperimentOutlined />;
      default:
        return <ThunderboltOutlined />;
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'text':
        return <FileTextOutlined />;
      case 'image':
        return <FileImageOutlined />;
      case 'audio':
        return <SoundOutlined />;
      case 'video':
        return <VideoCameraOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  const executionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <Text code>{id.slice(-8)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'blue';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Quality',
      dataIndex: 'qualityScore',
      key: 'qualityScore',
      width: 100,
      render: (score: number) => (
        <Progress
          percent={Math.round(score * 100)}
          size="small"
          status={score >= 0.8 ? 'success' : score >= 0.6 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: 'Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 80,
      render: (cost: number) => <Text>${cost.toFixed(4)}</Text>,
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 100,
      render: (_: unknown, record: AIWorkflowExecution) => {
        if (!record.endTime) return '-';
        const duration = record.endTime.getTime() - record.startTime.getTime();
        return <Text>{(duration / 1000).toFixed(1)}s</Text>;
      },
    },
  ];

  const tabs = [
    {
      key: 'builder',
      label: (
        <span>
          <SettingOutlined />
          AI Builder
        </span>
      ),
      children: (
        <div style={{ padding: '24px' }}>
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Card title="AI Model Configuration" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Select AI Model</Text>
                    <Select
                      value={selectedModel}
                      onChange={setSelectedModel}
                      style={{ width: '100%', marginTop: 8 }}
                      placeholder="Choose an AI model"
                    >
                      {availableModels.map((model) => (
                        <Option key={model.id} value={model.id}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>
                              {getModelIcon(model)} {model.name}
                            </span>
                            <div>
                              <Tag>{model.provider}</Tag>
                              <Tag color="blue">${model.costPer1kTokens}/1k</Tag>
                            </div>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {selectedModel &&
                    (() => {
                      const model = availableModels.find((m) => m.id === selectedModel);
                      if (!model) return null;

                      return (
                        <div>
                          <Divider style={{ margin: '16px 0' }} />
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Model Details</Text>
                            <div style={{ marginTop: 8 }}>
                              <div>
                                <Text type="secondary">Type:</Text> <Tag>{model.type}</Tag>
                              </div>
                              <div style={{ marginTop: 4 }}>
                                <Text type="secondary">Input:</Text>
                                {model.inputModalities.map((modality) => (
                                  <Tag
                                    key={modality}
                                    icon={getModalityIcon(modality)}
                                    style={{ marginLeft: 4 }}
                                  >
                                    {modality}
                                  </Tag>
                                ))}
                              </div>
                              <div style={{ marginTop: 4 }}>
                                <Text type="secondary">Output:</Text>
                                {model.outputModalities.map((modality) => (
                                  <Tag
                                    key={modality}
                                    icon={getModalityIcon(modality)}
                                    style={{ marginLeft: 4 }}
                                  >
                                    {modality}
                                  </Tag>
                                ))}
                              </div>
                              <div style={{ marginTop: 4 }}>
                                <Text type="secondary">Context Window:</Text>{' '}
                                <Text>{model.contextWindow.toLocaleString()} tokens</Text>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Text strong>Capabilities</Text>
                            <div style={{ marginTop: 8 }}>
                              {model.capabilities.map((cap) => (
                                <Tag key={cap.name} color="purple">
                                  {cap.name} ({cap.proficiency}/5)
                                </Tag>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  <Divider />

                  <div>
                    <Text strong>Main Prompt</Text>
                    <TextArea
                      value={nodeConfig.prompt}
                      onChange={(e) =>
                        setNodeConfig((prev) => ({
                          ...prev,
                          prompt: e.target.value,
                        }))
                      }
                      placeholder="Enter your main prompt here..."
                      rows={4}
                      style={{ marginTop: 8 }}
                    />
                  </div>

                  <div>
                    <Text strong>System Prompt (Optional)</Text>
                    <TextArea
                      value={nodeConfig.systemPrompt}
                      onChange={(e) =>
                        setNodeConfig((prev) => ({
                          ...prev,
                          systemPrompt: e.target.value,
                        }))
                      }
                      placeholder="Enter system instructions..."
                      rows={3}
                      style={{ marginTop: 8 }}
                    />
                  </div>

                  <Row gutter={16}>
                    <Col span={12}>
                      <div>
                        <Text strong>Temperature</Text>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={nodeConfig.temperature}
                          onChange={(value) =>
                            setNodeConfig((prev) => ({
                              ...prev,
                              temperature: value,
                            }))
                          }
                          style={{ marginTop: 8 }}
                        />
                        <Text type="secondary">Current: {nodeConfig.temperature}</Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <Text strong>Max Tokens</Text>
                        <InputNumber
                          min={1}
                          max={
                            selectedModel
                              ? availableModels.find((m) => m.id === selectedModel)?.maxTokens
                              : 4096
                          }
                          value={nodeConfig.maxTokens}
                          onChange={(value) =>
                            setNodeConfig((prev) => ({
                              ...prev,
                              maxTokens: value || 1000,
                            }))
                          }
                          style={{ width: '100%', marginTop: 8 }}
                        />
                      </div>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Multi-Modal Inputs" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Text Input</Text>
                    <TextArea
                      value={workflowInputs.text || ''}
                      onChange={(e) =>
                        setWorkflowInputs((prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                      placeholder="Enter text input for the AI model..."
                      rows={4}
                      style={{ marginTop: 8 }}
                    />
                  </div>

                  <div>
                    <Text strong>File Uploads</Text>
                    <Dragger
                      multiple
                      beforeUpload={handleFileUpload}
                      showUploadList={false}
                      style={{ marginTop: 8 }}
                    >
                      <p className="ant-upload-drag-icon">
                        <CloudUploadOutlined />
                      </p>
                      <p className="ant-upload-text">Click or drag files to upload</p>
                      <p className="ant-upload-hint">
                        Support for images, audio, video, and documents
                      </p>
                    </Dragger>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div>
                      <Text strong>Uploaded Files</Text>
                      <div style={{ marginTop: 8 }}>
                        {uploadedFiles.map((file, index) => (
                          <Tag
                            key={index}
                            icon={getModalityIcon(file.type.split('/')[0])}
                            style={{ marginBottom: 4, marginRight: 4 }}
                          >
                            {file.name}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  <Divider />

                  <Button
                    type="primary"
                    size="large"
                    onClick={handleExecuteWorkflow}
                    loading={isExecuting}
                    disabled={!selectedModel || !nodeConfig.prompt}
                    icon={<PlayCircleOutlined />}
                    style={{ width: '100%' }}
                  >
                    {isExecuting ? 'Executing...' : 'Execute AI Workflow'}
                  </Button>

                  {selectedModel &&
                    nodeConfig.prompt &&
                    (() => {
                      const model = availableModels.find((m) => m.id === selectedModel);
                      if (!model) return null;

                      const estimatedTokens = Math.ceil((nodeConfig.prompt?.length || 0) / 4);
                      const estimatedCost = (estimatedTokens / 1000) * model.costPer1kTokens;

                      return (
                        <Alert
                          message="Execution Estimate"
                          description={
                            <div>
                              <div>Estimated tokens: ~{estimatedTokens}</div>
                              <div>Estimated cost: ${estimatedCost.toFixed(4)}</div>
                            </div>
                          }
                          type="info"
                          showIcon
                        />
                      );
                    })()}
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'execution',
      label: (
        <span>
          <PlayCircleOutlined />
          Execution Results
        </span>
      ),
      children: (
        <div style={{ padding: '24px' }}>
          {currentExecution ? (
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Card title={`Execution ${currentExecution.id.slice(-8)}`} size="small">
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="Status"
                        value={currentExecution.status}
                        valueStyle={{
                          color: currentExecution.status === 'completed' ? '#3f8600' : '#cf1322',
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Quality Score"
                        value={Math.round(currentExecution.qualityScore * 100)}
                        suffix="%"
                        valueStyle={{
                          color: currentExecution.qualityScore >= 0.8 ? '#3f8600' : '#fa8c16',
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Total Cost"
                        value={currentExecution.totalCost}
                        prefix="$"
                        precision={4}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic title="Tokens Used" value={currentExecution.totalTokens} />
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Node Executions" size="small">
                  <Timeline>
                    {currentExecution.nodeExecutions.map((nodeExec, index) => (
                      <Timeline.Item
                        key={index}
                        color={
                          nodeExec.status === 'completed'
                            ? 'green'
                            : nodeExec.status === 'failed'
                              ? 'red'
                              : 'blue'
                        }
                      >
                        <div>
                          <Text strong>Node {nodeExec.nodeId}</Text>
                          <div style={{ marginTop: 4 }}>
                            <Tag color={nodeExec.status === 'completed' ? 'green' : 'red'}>
                              {nodeExec.status}
                            </Tag>
                            <Text type="secondary">
                              {nodeExec.endTime
                                ? `${((nodeExec.endTime.getTime() - nodeExec.startTime.getTime()) / 1000).toFixed(1)}s`
                                : 'Running...'}
                            </Text>
                          </div>
                          {nodeExec.outputs.length > 0 && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: 8,
                                background: '#f5f5f5',
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ fontSize: '12px' }}>
                                {typeof nodeExec.outputs[0].content === 'string'
                                  ? nodeExec.outputs[0].content.slice(0, 200) +
                                    (nodeExec.outputs[0].content.length > 200 ? '...' : '')
                                  : JSON.stringify(nodeExec.outputs[0].content).slice(0, 200)}
                              </Text>
                            </div>
                          )}
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Quality Metrics" size="small">
                  {currentExecution.nodeExecutions.length > 0 && (
                    <div>
                      {Object.entries(currentExecution.nodeExecutions[0].qualityMetrics).map(
                        ([metric, value]) => (
                          <div key={metric} style={{ marginBottom: 8 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 4,
                              }}
                            >
                              <Text>{metric.charAt(0).toUpperCase() + metric.slice(1)}</Text>
                              <Text>{Math.round(value * 100)}%</Text>
                            </div>
                            <Progress
                              percent={Math.round(value * 100)}
                              size="small"
                              status={
                                value >= 0.8 ? 'success' : value >= 0.6 ? 'normal' : 'exception'
                              }
                              showInfo={false}
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </Card>

                {currentExecution.insights.length > 0 && (
                  <Card title="AI Insights" size="small" style={{ marginTop: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {currentExecution.insights.map((insight, index) => (
                        <Alert
                          key={index}
                          message={insight.message}
                          description={insight.recommendation}
                          type={insight.impact === 'high' ? 'warning' : 'info'}
                          showIcon
                          style={{ fontSize: '12px' }}
                        />
                      ))}
                    </Space>
                  </Card>
                )}
              </Col>
            </Row>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <ExperimentOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <Title level={4} type="secondary">
                No execution results yet
              </Title>
              <Paragraph type="secondary">
                Execute a workflow from the AI Builder tab to see results here
              </Paragraph>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <BarChartOutlined />
          Execution History
        </span>
      ),
      children: (
        <div style={{ padding: '24px' }}>
          <Card title="Execution History" size="small">
            <Table
              dataSource={executionHistory}
              columns={executionColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({
                onClick: () => setCurrentExecution(record),
              })}
              style={{ cursor: 'pointer' }}
            />
          </Card>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ExperimentOutlined style={{ marginRight: 8 }} />
          AI Workflow Studio
          <Badge count="Beta" style={{ marginLeft: 8 }} />
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ top: 20 }}
      bodyStyle={{ padding: 0 }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs}
        style={{ minHeight: '70vh' }}
      />
    </Modal>
  );
};
