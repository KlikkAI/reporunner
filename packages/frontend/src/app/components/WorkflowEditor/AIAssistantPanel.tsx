/**
 * AI Assistant Panel
 *
 * Comprehensive AI assistance interface with chat, workflow analysis,
 * suggestions, and settings. Inspired by SIM's copilot panel and
 * GitHub Copilot's assistance patterns.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Drawer,
  Tabs,
  Button,
  Card,
  Badge,
  Alert,
  Tooltip,
  Input,
  Switch,
  Slider,
} from "antd";
import {
  RobotOutlined,
  MessageOutlined,
  BarChartOutlined,
  BulbOutlined,
  SettingOutlined,
  SendOutlined,
  ClearOutlined,
  CheckOutlined,
  CloseOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  RocketOutlined,
  TrophyOutlined,
  LineChartOutlined,
  SafetyOutlined,
  DollarOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { cn } from "@/design-system/utils";
import { useAIAssistantStore } from "@/core/stores/aiAssistantStore";
import { useLeanWorkflowStore } from "@/core/stores/leanWorkflowStore";
import { workflowOptimizer } from "@/core/services/workflowOptimizer";
import type {
  WorkflowIssue,
  WorkflowSuggestion,
  NodeSuggestion,
} from "@/core/services/aiAssistantService";
import type {
  WorkflowOptimizationReport,
  OptimizationSuggestion,
} from "@/core/services/workflowOptimizer";

const { TextArea } = Input;

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessageProps {
  message: any;
  isLast: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast }) => {
  const isUser = message.type === "user";
  const isSystem = message.type === "system";

  return (
    <div className={cn("mb-3", isUser ? "text-right" : "text-left")}>
      <div
        className={cn(
          "inline-block max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm",
          isUser
            ? "bg-blue-600 text-white"
            : isSystem
              ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
              : "bg-gray-200 text-gray-800",
        )}
      >
        {message.content}
      </div>
      {!isUser && !isSystem && (
        <div className="text-xs text-gray-500 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      )}
      {message.suggestions && message.suggestions.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-gray-600 mb-1">Suggested nodes:</div>
          <div className="space-y-1">
            {message.suggestions.map((suggestion: NodeSuggestion) => (
              <div
                key={suggestion.nodeType}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-100"
                onClick={() => {
                  // TODO: Implement node addition from suggestion
                  console.log("Add suggested node:", suggestion);
                }}
              >
                <span className="font-medium">{suggestion.displayName}</span>
                <span className="ml-1 opacity-75">
                  ({Math.round(suggestion.confidence * 100)}% confident)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ChatTab: React.FC = () => {
  const {
    chatHistory,
    isProcessingChat,
    chatInput,
    setChatInput,
    sendChatMessage,
    clearChatHistory,
  } = useAIAssistantStore();

  const { nodes, edges } = useLeanWorkflowStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isProcessingChat) return;

    await sendChatMessage(chatInput, {
      currentNodes: nodes,
      currentEdges: edges,
      timestamp: new Date().toISOString(),
    });
  }, [chatInput, isProcessingChat, sendChatMessage, nodes, edges]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <RobotOutlined className="text-blue-600" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <Tooltip title="Clear chat history">
          <Button
            type="text"
            size="small"
            icon={<ClearOutlined />}
            onClick={clearChatHistory}
            disabled={chatHistory.length === 0}
          />
        </Tooltip>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <RobotOutlined className="text-3xl mb-2" />
            <div className="text-sm">
              Hi! I'm your AI workflow assistant. I can help you:
            </div>
            <div className="text-xs mt-2 space-y-1">
              <div>• Analyze and optimize your workflows</div>
              <div>• Suggest appropriate nodes</div>
              <div>• Fix common issues</div>
              <div>• Answer workflow questions</div>
            </div>
          </div>
        ) : (
          chatHistory.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={index === chatHistory.length - 1}
            />
          ))
        )}
        {isProcessingChat && (
          <div className="text-left">
            <div className="inline-block bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm">
              <span className="animate-pulse">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <TextArea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your workflow..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            disabled={isProcessingChat}
            className="flex-1"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || isProcessingChat}
            className="self-end"
          />
        </div>
      </div>
    </div>
  );
};

const AnalysisTab: React.FC = () => {
  const {
    currentAnalysis,
    isAnalyzing,
    analysisTimestamp,
    analyzeWorkflow,
    refreshAnalysis,
  } = useAIAssistantStore();

  const { nodes, edges } = useLeanWorkflowStore();

  const handleAnalyze = useCallback(() => {
    analyzeWorkflow(nodes, edges);
  }, [analyzeWorkflow, nodes, edges]);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return "green";
      case "moderate":
        return "orange";
      case "complex":
        return "red";
      default:
        return "gray";
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return "green";
    if (efficiency >= 60) return "orange";
    return "red";
  };

  return (
    <div className="p-3 space-y-4">
      {/* Analysis Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChartOutlined className="text-green-600" />
          <span className="text-sm font-medium">Workflow Analysis</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={refreshAnalysis}
            disabled={isAnalyzing}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<BarChartOutlined />}
            onClick={handleAnalyze}
            loading={isAnalyzing}
          >
            Analyze
          </Button>
        </div>
      </div>

      {/* Analysis Results */}
      {currentAnalysis ? (
        <div className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card size="small" className="text-center">
              <div className="text-xs text-gray-500">Complexity</div>
              <Badge
                color={getComplexityColor(currentAnalysis.complexity)}
                text={currentAnalysis.complexity.toUpperCase()}
                className="text-sm font-medium"
              />
            </Card>
            <Card size="small" className="text-center">
              <div className="text-xs text-gray-500">Efficiency</div>
              <div
                className={cn(
                  "text-lg font-bold",
                  getEfficiencyColor(currentAnalysis.efficiency) === "green"
                    ? "text-green-600"
                    : getEfficiencyColor(currentAnalysis.efficiency) ===
                        "orange"
                      ? "text-orange-600"
                      : "text-red-600",
                )}
              >
                {currentAnalysis.efficiency}%
              </div>
            </Card>
          </div>

          {/* Patterns */}
          {currentAnalysis.patterns.length > 0 && (
            <Card size="small" title="Detected Patterns">
              <div className="space-y-2">
                {currentAnalysis.patterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    className="border-l-2 border-blue-400 pl-3"
                  >
                    <div className="text-sm font-medium">{pattern.name}</div>
                    <div className="text-xs text-gray-600">
                      {pattern.description}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Confidence: {Math.round(pattern.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Analysis Timestamp */}
          {analysisTimestamp && (
            <div className="text-xs text-gray-500 text-center">
              Last analyzed: {new Date(analysisTimestamp).toLocaleString()}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <BarChartOutlined className="text-3xl mb-2" />
          <div className="text-sm mb-3">No analysis available</div>
          <Button
            type="primary"
            icon={<BarChartOutlined />}
            onClick={handleAnalyze}
            loading={isAnalyzing}
            disabled={nodes.length === 0}
          >
            Analyze Workflow
          </Button>
        </div>
      )}
    </div>
  );
};

const SuggestionsTab: React.FC = () => {
  const {
    activeIssues,
    activeSuggestions,
    dismissIssue,
    dismissSuggestion,
    applySuggestion,
    autoFixIssue,
  } = useAIAssistantStore();

  const { nodes, edges } = useLeanWorkflowStore();

  const handleAutoFix = useCallback(
    async (issueId: string) => {
      const success = await autoFixIssue(issueId, nodes, edges);
      if (success) {
        // Issue will be automatically dismissed by the store
        console.log("Issue auto-fixed successfully");
      } else {
        console.log("Auto-fix failed");
      }
    },
    [autoFixIssue, nodes, edges],
  );

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <WarningOutlined className="text-red-600" />;
      case "high":
        return <WarningOutlined className="text-orange-600" />;
      case "medium":
        return <InfoCircleOutlined className="text-yellow-600" />;
      case "low":
        return <InfoCircleOutlined className="text-blue-600" />;
      default:
        return <InfoCircleOutlined className="text-gray-600" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <ThunderboltOutlined className="text-red-600" />;
      case "medium":
        return <BulbOutlined className="text-orange-600" />;
      case "low":
        return <BulbOutlined className="text-blue-600" />;
      default:
        return <BulbOutlined className="text-gray-600" />;
    }
  };

  return (
    <div className="p-3 space-y-4">
      {/* Issues Section */}
      {activeIssues.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <WarningOutlined className="text-orange-600" />
            <span className="text-sm font-medium">
              Issues ({activeIssues.length})
            </span>
          </div>
          <div className="space-y-2">
            {activeIssues.map((issue) => (
              <Alert
                key={issue.id}
                type={
                  issue.severity === "critical" || issue.severity === "high"
                    ? "error"
                    : "warning"
                }
                showIcon
                message={
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{issue.title}</div>
                      <div className="text-xs mt-1">{issue.description}</div>
                      {issue.solution && (
                        <div className="text-xs text-blue-600 mt-2">
                          💡 {issue.solution}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      {issue.autoFixAvailable && (
                        <Tooltip title="Auto-fix this issue">
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={() => handleAutoFix(issue.id)}
                            className="text-green-600"
                          />
                        </Tooltip>
                      )}
                      <Tooltip title="Dismiss this issue">
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => dismissIssue(issue.id)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                }
                className="text-left"
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggestions Section */}
      {activeSuggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BulbOutlined className="text-blue-600" />
            <span className="text-sm font-medium">
              Suggestions ({activeSuggestions.length})
            </span>
          </div>
          <div className="space-y-2">
            {activeSuggestions.map((suggestion) => (
              <Card
                key={suggestion.id}
                size="small"
                className="border-l-4 border-blue-400"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getPriorityIcon(suggestion.priority)}
                      <span className="text-sm font-medium">
                        {suggestion.title}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {suggestion.description}
                    </div>
                    <div className="text-xs text-green-600">
                      Expected benefit: {suggestion.expectedBenefit}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Tooltip title="Apply this suggestion">
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => applySuggestion(suggestion.id)}
                        className="text-green-600"
                      />
                    </Tooltip>
                    <Tooltip title="Dismiss this suggestion">
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => dismissSuggestion(suggestion.id)}
                      />
                    </Tooltip>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeIssues.length === 0 && activeSuggestions.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <BulbOutlined className="text-3xl mb-2" />
          <div className="text-sm">No issues or suggestions</div>
          <div className="text-xs mt-2">Your workflow looks good!</div>
        </div>
      )}
    </div>
  );
};

const SettingsTab: React.FC = () => {
  const {
    config,
    autoAnalyze,
    showSuggestionTooltips,
    updateConfig,
    toggleAutoAnalyze,
    toggleSuggestionTooltips,
  } = useAIAssistantStore();

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <SettingOutlined className="text-gray-600" />
        <span className="text-sm font-medium">AI Assistant Settings</span>
      </div>

      {/* AI Provider */}
      <Card size="small" title="AI Provider">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600">Provider</label>
            <div className="mt-1">
              <select
                value={config.provider}
                onChange={(e) =>
                  updateConfig({ provider: e.target.value as any })
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="mock">Mock (Development)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="local">Local AI</option>
              </select>
            </div>
          </div>

          {config.provider !== "mock" && (
            <div>
              <label className="text-xs text-gray-600">API Key</label>
              <Input.Password
                placeholder="Enter your API key"
                size="small"
                className="mt-1"
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-600">
              Temperature: {config.temperature}
            </label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={config.temperature}
              onChange={(value) => updateConfig({ temperature: value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Max Tokens</label>
            <Input
              type="number"
              value={config.maxTokens}
              onChange={(e) =>
                updateConfig({ maxTokens: parseInt(e.target.value) })
              }
              size="small"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Behavior Settings */}
      <Card size="small" title="Behavior">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm">Auto-analyze workflows</div>
              <div className="text-xs text-gray-500">
                Automatically analyze when workflow changes
              </div>
            </div>
            <Switch
              checked={autoAnalyze}
              onChange={toggleAutoAnalyze}
              size="small"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm">Show suggestion tooltips</div>
              <div className="text-xs text-gray-500">
                Display helpful tooltips for suggestions
              </div>
            </div>
            <Switch
              checked={showSuggestionTooltips}
              onChange={toggleSuggestionTooltips}
              size="small"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

const OptimizationTab: React.FC = () => {
  const { nodes, edges } = useLeanWorkflowStore();
  const [optimizationReport, setOptimizationReport] =
    useState<WorkflowOptimizationReport | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>(
    [],
  );
  const [isApplyingOptimizations, setIsApplyingOptimizations] = useState(false);

  const handleAnalyzeOptimizations = useCallback(async () => {
    if (nodes.length === 0) return;

    setIsOptimizing(true);
    try {
      const report = await workflowOptimizer.analyzeWorkflow(nodes, edges);
      setOptimizationReport(report);
    } catch (error) {
      console.error("Optimization analysis failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  }, [nodes, edges]);

  const handleApplyOptimizations = useCallback(async () => {
    if (!optimizationReport || selectedOptimizations.length === 0) return;

    setIsApplyingOptimizations(true);
    try {
      const result = await workflowOptimizer.applyOptimizations(
        nodes,
        edges,
        selectedOptimizations,
      );

      // TODO: Update the workflow with optimized nodes and edges
      console.log("Optimizations applied:", result);

      // Clear selections and refresh analysis
      setSelectedOptimizations([]);
      handleAnalyzeOptimizations();
    } catch (error) {
      console.error("Failed to apply optimizations:", error);
    } finally {
      setIsApplyingOptimizations(false);
    }
  }, [
    nodes,
    edges,
    optimizationReport,
    selectedOptimizations,
    handleAnalyzeOptimizations,
  ]);

  const toggleOptimizationSelection = useCallback((suggestionId: string) => {
    setSelectedOptimizations((prev) =>
      prev.includes(suggestionId)
        ? prev.filter((id) => id !== suggestionId)
        : [...prev, suggestionId],
    );
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "performance":
        return <RocketOutlined className="text-blue-600" />;
      case "reliability":
        return <SafetyOutlined className="text-green-600" />;
      case "maintainability":
        return <ToolOutlined className="text-purple-600" />;
      case "cost":
        return <DollarOutlined className="text-orange-600" />;
      case "security":
        return <SafetyOutlined className="text-red-600" />;
      default:
        return <BulbOutlined className="text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="p-3 space-y-4">
      {/* Optimization Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RocketOutlined className="text-blue-600" />
          <span className="text-sm font-medium">Workflow Optimization</span>
        </div>
        <div className="flex gap-2">
          {optimizationReport && selectedOptimizations.length > 0 && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleApplyOptimizations}
              loading={isApplyingOptimizations}
              className="bg-green-600 hover:bg-green-700"
            >
              Apply ({selectedOptimizations.length})
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            icon={<LineChartOutlined />}
            onClick={handleAnalyzeOptimizations}
            loading={isOptimizing}
            disabled={nodes.length === 0}
          >
            Analyze
          </Button>
        </div>
      </div>

      {/* Optimization Results */}
      {optimizationReport ? (
        <div className="space-y-4">
          {/* Overall Score */}
          <Card size="small" title="Optimization Score">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-gray-500">Current</div>
                <div
                  className={cn(
                    "text-xl font-bold",
                    getScoreColor(optimizationReport.overallScore.current),
                  )}
                >
                  {optimizationReport.overallScore.current}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Potential</div>
                <div
                  className={cn(
                    "text-xl font-bold",
                    getScoreColor(optimizationReport.overallScore.potential),
                  )}
                >
                  {optimizationReport.overallScore.potential}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Improvement</div>
                <div className="text-xl font-bold text-green-600">
                  +{optimizationReport.overallScore.improvement}%
                </div>
              </div>
            </div>
          </Card>

          {/* Workflow Stats */}
          <Card size="small" title="Workflow Statistics">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Complexity:</span>
                <span className="ml-1 font-medium">
                  {optimizationReport.workflowStats.complexity}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Nodes:</span>
                <span className="ml-1 font-medium">
                  {optimizationReport.workflowStats.totalNodes}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Edges:</span>
                <span className="ml-1 font-medium">
                  {optimizationReport.workflowStats.totalEdges}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Parallel Ops:</span>
                <span className="ml-1 font-medium">
                  {
                    optimizationReport.workflowStats
                      .parallelizationOpportunities
                  }
                </span>
              </div>
            </div>
          </Card>

          {/* Optimization Suggestions by Category */}
          {Object.entries(optimizationReport.categories).map(
            ([category, suggestions]) => {
              if (suggestions.length === 0) return null;

              return (
                <Card
                  key={category}
                  size="small"
                  title={
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <span className="capitalize">{category}</span>
                      <Badge count={suggestions.length} size="small" />
                    </div>
                  }
                >
                  <div className="space-y-2">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className={cn(
                          "border rounded p-2 cursor-pointer transition-all",
                          selectedOptimizations.includes(suggestion.id)
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300",
                        )}
                        onClick={() =>
                          toggleOptimizationSelection(suggestion.id)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                checked={selectedOptimizations.includes(
                                  suggestion.id,
                                )}
                                onChange={() =>
                                  toggleOptimizationSelection(suggestion.id)
                                }
                                className="w-3 h-3"
                              />
                              <span className="text-sm font-medium">
                                {suggestion.title}
                              </span>
                              <Badge
                                text={suggestion.priority.toUpperCase()}
                                color={
                                  suggestion.priority === "high"
                                    ? "red"
                                    : suggestion.priority === "medium"
                                      ? "orange"
                                      : "blue"
                                }
                              />
                            </div>
                            <div className="text-xs text-gray-600 mb-2 ml-5">
                              {suggestion.description}
                            </div>
                            <div className="text-xs text-blue-600 ml-5">
                              💡 {suggestion.reasoning}
                            </div>
                            <div className="text-xs text-green-600 ml-5 mt-1">
                              <strong>Benefit:</strong>{" "}
                              {suggestion.estimatedBenefit.description}
                              {suggestion.estimatedBenefit.quantified && (
                                <span className="ml-1">
                                  ({suggestion.estimatedBenefit.quantified})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 ml-5 mt-1">
                              Confidence:{" "}
                              {Math.round(suggestion.confidence * 100)}%
                              {suggestion.rule.automatable && (
                                <span className="ml-2 text-green-600">
                                  Auto-applicable
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            },
          )}

          {/* Analysis Timestamp */}
          <div className="text-xs text-gray-500 text-center">
            Last analyzed:{" "}
            {new Date(optimizationReport.timestamp).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <RocketOutlined className="text-3xl mb-2" />
          <div className="text-sm mb-3">Optimize your workflow</div>
          <div className="text-xs mb-4 text-gray-400">
            Get AI-powered suggestions to improve performance, reliability, and
            maintainability
          </div>
          <Button
            type="primary"
            icon={<LineChartOutlined />}
            onClick={handleAnalyzeOptimizations}
            loading={isOptimizing}
            disabled={nodes.length === 0}
          >
            Analyze Workflow
          </Button>
        </div>
      )}
    </div>
  );
};

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeTab,
    setActiveTab,
    activeIssues,
    activeSuggestions,
    isProcessingChat,
  } = useAIAssistantStore();

  const tabItems = [
    {
      key: "chat",
      label: (
        <span className="flex items-center gap-1">
          <MessageOutlined />
          Chat
          {isProcessingChat && (
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
          )}
        </span>
      ),
      children: <ChatTab />,
    },
    {
      key: "analysis",
      label: (
        <span className="flex items-center gap-1">
          <BarChartOutlined />
          Analysis
        </span>
      ),
      children: <AnalysisTab />,
    },
    {
      key: "suggestions",
      label: (
        <span className="flex items-center gap-1">
          <BulbOutlined />
          Suggestions
          {(activeIssues.length > 0 || activeSuggestions.length > 0) && (
            <Badge
              count={activeIssues.length + activeSuggestions.length}
              size="small"
              style={{ backgroundColor: "#ff4d4f" }}
            />
          )}
        </span>
      ),
      children: <SuggestionsTab />,
    },
    {
      key: "optimization",
      label: (
        <span className="flex items-center gap-1">
          <RocketOutlined />
          Optimize
        </span>
      ),
      children: <OptimizationTab />,
    },
    {
      key: "settings",
      label: (
        <span className="flex items-center gap-1">
          <SettingOutlined />
          Settings
        </span>
      ),
      children: <SettingsTab />,
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <RobotOutlined className="text-blue-600" />
          <span>AI Assistant</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={400}
      className="ai-assistant-panel"
      bodyStyle={{ padding: 0 }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        items={tabItems}
        className="h-full"
        tabBarStyle={{ margin: 0, paddingLeft: 16, paddingRight: 16 }}
      />
    </Drawer>
  );
};

export default AIAssistantPanel;
