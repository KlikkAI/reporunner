import { useState } from './hooks/useState';
import { useEffect } from './hooks/useEffect';
import { useCallback } from './hooks/useCallback';
/**
 * AI Assistant Panel
 *
 * Comprehensive AI-powered workflow assistance panel providing:
 * - Natural language workflow generation
 * - Intelligent optimization suggestions
 * - Error diagnosis and solutions
 * - Performance recommendations
 * - Pattern recognition and best practices
 */

import {
  BugOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  // PatternOutlined,
  SendOutlined,
  SettingOutlined,
  StarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  List,
  Modal,
  Progress,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { WorkflowDefinition } from '@/core/nodes/types';
import type {
  AIWorkflowSuggestion,
  ErrorDiagnosis,
  NaturalLanguageRequest,
  WorkflowAnalysis,
} from '@/core/services/aiAssistantService';
import { aiAssistantService } from '@/core/services/aiAssistantService';
import { cn } from '@/design-system/utils';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AIAssistantPanelProps {
  workflow?: WorkflowDefinition;
  onApplySuggestion?: (suggestion: AIWorkflowSuggestion) => void;
  onGenerateWorkflow?: (workflow: WorkflowDefinition) => void;
  className?: string;
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  workflow,
  onApplySuggestion,
  onGenerateWorkflow,
  className,
}) => {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AIWorkflowSuggestion[]>([]);
  const [_errors] = useState<ErrorDiagnosis[]>([]); // TODO: Implement error handling
  const [analysis, setAnalysis] = useState<WorkflowAnalysis | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AIWorkflowSuggestion | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Load suggestions when workflow changes
  useEffect(() => {
    if (workflow) {
      loadSuggestions();
      loadAnalysis();
    }
  }, [workflow, loadAnalysis, loadSuggestions]);

  const loadSuggestions = useCallback(async () => {
    if (!workflow) return;

    try {
      const workflowSuggestions = await aiAssistantService.analyzeWorkflow(workflow);
      setSuggestions(workflowSuggestions);
    } catch (_error) {}
  }, [workflow]);

  const loadAnalysis = useCallback(async () => {
    if (!workflow) return;

    try {
      // Simulate analysis loading
      const mockAnalysis: WorkflowAnalysis = {
        complexity: 0.6,
        performance: {
          bottlenecks: ['Sequential processing', 'Large data sets'],
          optimizationOpportunities: ['Parallel processing', 'Data caching'],
          estimatedImprovement: 0.4,
        },
        reliability: {
          errorProneNodes: ['http-node-1', 'database-node-2'],
          missingErrorHandling: ['http-node-1'],
          suggestions: ['Add try-catch containers', 'Implement retry logic'],
        },
        maintainability: {
          codeQuality: 0.7,
          documentation: 0.5,
          modularity: 0.8,
        },
        patterns: {
          detected: ['Sequential Pattern', 'Data Transformation Pattern'],
          recommendations: ['Use Parallel Container', 'Add Error Handling'],
        },
      };
      setAnalysis(mockAnalysis);
    } catch (_error) {}
  }, [workflow]);

  const handleGenerateWorkflow = useCallback(async () => {
    if (!naturalLanguageInput.trim()) return;

    setIsGenerating(true);
    try {
      const request: NaturalLanguageRequest = {
        text: naturalLanguageInput,
        context: {
          currentWorkflow: workflow,
          userIntent: 'workflow-generation',
        },
      };

      const result = await aiAssistantService.generateWorkflowFromText(request);
      onGenerateWorkflow?.(result.workflow);

      // Show success message
      Modal.success({
        title: 'Workflow Generated Successfully',
        content: (
          <div>
            <p>{result.explanation}</p>
            <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
            <p>Complexity: {(result.estimatedComplexity * 100).toFixed(1)}%</p>
          </div>
        ),
      });
    } catch (_error) {
      Modal.error({
        title: 'Generation Failed',
        content: 'Failed to generate workflow from natural language description.',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [naturalLanguageInput, workflow, onGenerateWorkflow]);

  const handleApplySuggestion = useCallback(
    (suggestion: AIWorkflowSuggestion) => {
      onApplySuggestion?.(suggestion);

      // Remove applied suggestion
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));

      Modal.success({
        title: 'Suggestion Applied',
        content: `${suggestion.title} has been applied to your workflow.`,
      });
    },
    [onApplySuggestion]
  );

  const handleViewSuggestionDetails = useCallback((suggestion: AIWorkflowSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsDetailModalOpen(true);
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'blue';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization':
        return <ThunderboltOutlined className="text-yellow-500" />;
      case 'error-fix':
        return <BugOutlined className="text-red-500" />;
      case 'enhancement':
        return <StarOutlined className="text-blue-500" />;
      case 'pattern':
        return <BulbOutlined className="text-purple-500" />;
      default:
        return <BulbOutlined className="text-gray-500" />;
    }
  };

  const renderSuggestionCard = (suggestion: AIWorkflowSuggestion) => (
    <Card
      key={suggestion.id}
      size="small"
      className="mb-3 bg-gray-800 border-gray-600 hover:border-gray-500 transition-colors"
      actions={[
        <Tooltip key="details" title="View Details">
          <Button
            type="text"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => handleViewSuggestionDetails(suggestion)}
            className="text-gray-400 hover:text-gray-300"
          />
        </Tooltip>,
        <Tooltip key="apply" title="Apply Suggestion">
          <Button
            type="text"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApplySuggestion(suggestion)}
            className="text-green-400 hover:text-green-300"
          />
        </Tooltip>,
      ]}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(suggestion.type)}
            <span className="text-white font-medium text-sm">{suggestion.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tag color={getImpactColor(suggestion.impact)}>{suggestion.impact}</Tag>
            <Badge
              count={`${(suggestion.confidence * 100).toFixed(0)}%`}
              style={{ backgroundColor: '#1890ff' }}
            />
          </div>
        </div>

        <Text className="text-gray-400 text-xs">{suggestion.description}</Text>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Category: {suggestion.category}</span>
          {suggestion.estimatedBenefit.performance && (
            <span>Performance: +{(suggestion.estimatedBenefit.performance * 100).toFixed(0)}%</span>
          )}
        </div>
      </div>
    </Card>
  );

  const renderAnalysisMetrics = () => {
    if (!analysis) return null;

    return (
      <div className="space-y-4">
        <Card size="small" className="bg-gray-800 border-gray-600">
          <Title level={5} className="text-white mb-3">
            Workflow Analysis
          </Title>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Complexity</span>
                <span className="text-gray-400">{(analysis.complexity * 100).toFixed(0)}%</span>
              </div>
              <Progress
                percent={analysis.complexity * 100}
                strokeColor="#3b82f6"
                showInfo={false}
                size="small"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Performance</span>
                <span className="text-gray-400">
                  {(analysis.performance.estimatedImprovement * 100).toFixed(0)}% improvement
                  possible
                </span>
              </div>
              <Progress
                percent={analysis.performance.estimatedImprovement * 100}
                strokeColor="#22c55e"
                showInfo={false}
                size="small"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Maintainability</span>
                <span className="text-gray-400">
                  {(analysis.maintainability.codeQuality * 100).toFixed(0)}%
                </span>
              </div>
              <Progress
                percent={analysis.maintainability.codeQuality * 100}
                strokeColor="#f59e0b"
                showInfo={false}
                size="small"
              />
            </div>
          </div>
        </Card>

        {analysis.performance.bottlenecks.length > 0 && (
          <Alert
            message="Performance Bottlenecks Detected"
            description={
              <ul className="mt-2">
                {analysis.performance.bottlenecks.map((bottleneck, index) => (
                  <li key={index} className="text-sm">
                    {bottleneck}
                  </li>
                ))}
              </ul>
            }
            type="warning"
            showIcon
            className="bg-yellow-900 border-yellow-600"
          />
        )}

        {analysis.reliability.missingErrorHandling.length > 0 && (
          <Alert
            message="Missing Error Handling"
            description={`${analysis.reliability.missingErrorHandling.length} nodes need error handling`}
            type="error"
            showIcon
            className="bg-red-900 border-red-600"
          />
        )}
      </div>
    );
  };

  return (
    <div className={cn('h-full bg-gray-900 border-r border-gray-700', className)}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <RobotOutlined className="text-blue-400 text-lg" />
          <Title level={4} className="text-white mb-0">
            AI Assistant
          </Title>
        </div>
        <Text className="text-gray-400 text-sm">
          Intelligent workflow optimization and generation
        </Text>
      </div>

      <div className="p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="ai-assistant-tabs"
          items={[
            {
              key: 'suggestions',
              label: (
                <span>
                  <BulbOutlined className="mr-1" />
                  Suggestions
                  {suggestions.length > 0 && (
                    <Badge count={suggestions.length} size="small" className="ml-2" />
                  )}
                </span>
              ),
              children: (
                <div className="space-y-4">
                  {suggestions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <BulbOutlined className="text-4xl mb-2" />
                      <div>No suggestions available</div>
                      <div className="text-xs mt-2">
                        {workflow
                          ? 'Workflow analysis in progress...'
                          : 'Load a workflow to get AI suggestions'}
                      </div>
                    </div>
                  ) : (
                    <div>{suggestions.map(renderSuggestionCard)}</div>
                  )}
                </div>
              ),
            },
            {
              key: 'generate',
              label: (
                <span>
                  <SendOutlined className="mr-1" />
                  Generate
                </span>
              ),
              children: (
                <div className="space-y-4">
                  <Card size="small" className="bg-gray-800 border-gray-600">
                    <Title level={5} className="text-white mb-3">
                      Natural Language to Workflow
                    </Title>
                    <div className="space-y-3">
                      <TextArea
                        value={naturalLanguageInput}
                        onChange={(e) => setNaturalLanguageInput(e.target.value)}
                        placeholder="Describe your workflow in natural language...&#10;&#10;Example: 'Send an email notification when a new order is received, then update the inventory database'"
                        rows={4}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleGenerateWorkflow}
                        loading={isGenerating}
                        disabled={!naturalLanguageInput.trim()}
                        className="w-full"
                      >
                        Generate Workflow
                      </Button>
                    </div>
                  </Card>

                  <Card size="small" className="bg-gray-800 border-gray-600">
                    <Title level={5} className="text-white mb-3">
                      Quick Templates
                    </Title>
                    <div className="space-y-2">
                      <Button
                        type="dashed"
                        size="small"
                        className="w-full text-left"
                        onClick={() =>
                          setNaturalLanguageInput('Send email notification when form is submitted')
                        }
                      >
                        📧 Email Notification
                      </Button>
                      <Button
                        type="dashed"
                        size="small"
                        className="w-full text-left"
                        onClick={() =>
                          setNaturalLanguageInput('Process uploaded files and save to database')
                        }
                      >
                        📁 File Processing
                      </Button>
                      <Button
                        type="dashed"
                        size="small"
                        className="w-full text-left"
                        onClick={() =>
                          setNaturalLanguageInput('Sync data between two APIs every hour')
                        }
                      >
                        🔄 Data Synchronization
                      </Button>
                    </div>
                  </Card>
                </div>
              ),
            },
            {
              key: 'analysis',
              label: (
                <span>
                  <SettingOutlined className="mr-1" />
                  Analysis
                </span>
              ),
              children: renderAnalysisMetrics(),
            },
          ]}
        />
      </div>

      {/* Suggestion Details Modal */}
      <Modal
        title={selectedSuggestion?.title}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="apply"
            type="primary"
            onClick={() => {
              if (selectedSuggestion) {
                handleApplySuggestion(selectedSuggestion);
                setIsDetailModalOpen(false);
              }
            }}
          >
            Apply Suggestion
          </Button>,
        ]}
        width={600}
      >
        {selectedSuggestion && (
          <div className="space-y-4">
            <div>
              <Text className="text-gray-600">{selectedSuggestion.description}</Text>
            </div>

            <div>
              <Title level={5}>Reasoning</Title>
              <Text className="text-gray-600">{selectedSuggestion.reasoning}</Text>
            </div>

            {selectedSuggestion.suggestedChanges.length > 0 && (
              <div>
                <Title level={5}>Suggested Changes</Title>
                <List
                  size="small"
                  dataSource={selectedSuggestion.suggestedChanges}
                  renderItem={(change) => (
                    <List.Item>
                      <div className="space-y-1">
                        <div className="font-medium">{change.type}</div>
                        <div className="text-sm text-gray-600">{change.reason}</div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {Object.keys(selectedSuggestion.estimatedBenefit).length > 0 && (
              <div>
                <Title level={5}>Estimated Benefits</Title>
                <div className="space-y-2">
                  {selectedSuggestion.estimatedBenefit.performance && (
                    <div className="flex justify-between">
                      <span>Performance:</span>
                      <span className="text-green-500">
                        +{(selectedSuggestion.estimatedBenefit.performance * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {selectedSuggestion.estimatedBenefit.reliability && (
                    <div className="flex justify-between">
                      <span>Reliability:</span>
                      <span className="text-blue-500">
                        +{(selectedSuggestion.estimatedBenefit.reliability * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {selectedSuggestion.estimatedBenefit.maintainability && (
                    <div className="flex justify-between">
                      <span>Maintainability:</span>
                      <span className="text-purple-500">
                        +{(selectedSuggestion.estimatedBenefit.maintainability * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AIAssistantPanel;
