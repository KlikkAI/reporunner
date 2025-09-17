/**
 * Advanced AI Workflow Orchestration Service
 * Provides intelligent workflow automation with multi-modal AI capabilities
 */

export interface AIModel {
  id: string;
  name: string;
  provider:
    | "openai"
    | "anthropic"
    | "google"
    | "cohere"
    | "huggingface"
    | "ollama";
  type: "language" | "vision" | "embedding" | "speech" | "code" | "multimodal";
  capabilities: AICapability[];
  maxTokens: number;
  costPer1kTokens: number;
  inputModalities: ("text" | "image" | "audio" | "video" | "code")[];
  outputModalities: ("text" | "image" | "audio" | "code" | "structured_data")[];
  contextWindow: number;
  latency: "low" | "medium" | "high";
  availability: "public" | "private" | "enterprise";
}

export interface AICapability {
  name: string;
  description: string;
  category:
    | "reasoning"
    | "creativity"
    | "analysis"
    | "coding"
    | "vision"
    | "audio"
    | "multimodal";
  proficiency: 1 | 2 | 3 | 4 | 5; // 1=basic, 5=expert
}

export interface AIWorkflowNode {
  id: string;
  type:
    | "ai_reasoning"
    | "ai_vision"
    | "ai_audio"
    | "ai_code"
    | "ai_decision"
    | "ai_synthesis";
  config: AINodeConfig;
  dependencies: string[];
  outputs: AINodeOutput[];
  retryPolicy: RetryPolicy;
  fallbackModel?: string;
  costBudget?: number;
  qualityThreshold?: number;
}

export interface AINodeConfig {
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  stopSequences?: string[];
  tools?: AITool[];
  inputSchema?: any;
  outputSchema?: any;
  validationRules?: ValidationRule[];
}

export interface AITool {
  name: string;
  description: string;
  parameters: any;
  handler: string; // Function reference
  required: boolean;
}

export interface AINodeOutput {
  type: "text" | "structured" | "image" | "audio" | "code" | "decision";
  content: any;
  confidence: number;
  metadata: {
    model: string;
    tokensUsed: number;
    latency: number;
    cost: number;
    timestamp: Date;
  };
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: "linear" | "exponential" | "fixed";
  retryConditions: (
    | "error"
    | "low_confidence"
    | "timeout"
    | "quality_threshold"
  )[];
  fallbackStrategy:
    | "different_model"
    | "simplified_prompt"
    | "human_escalation";
}

export interface ValidationRule {
  type: "schema" | "regex" | "length" | "confidence" | "custom";
  rule: any;
  errorMessage: string;
  severity: "warning" | "error" | "critical";
}

export interface AIWorkflowExecution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed" | "paused";
  startTime: Date;
  endTime?: Date;
  nodeExecutions: AINodeExecution[];
  totalCost: number;
  totalTokens: number;
  qualityScore: number;
  insights: AIInsight[];
}

export interface AINodeExecution {
  nodeId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startTime: Date;
  endTime?: Date;
  inputs: any;
  outputs: AINodeOutput[];
  retryAttempts: number;
  cost: number;
  latency: number;
  qualityMetrics: QualityMetrics;
}

export interface QualityMetrics {
  relevance: number; // 0-1
  accuracy: number; // 0-1
  completeness: number; // 0-1
  coherence: number; // 0-1
  factuality: number; // 0-1
  creativity: number; // 0-1
}

export interface AIInsight {
  type:
    | "optimization"
    | "cost_saving"
    | "quality_improvement"
    | "performance"
    | "error_pattern";
  message: string;
  recommendation: string;
  impact: "low" | "medium" | "high";
  confidence: number;
  data: any;
}

export interface MultiModalWorkflow {
  id: string;
  name: string;
  description: string;
  inputTypes: (
    | "text"
    | "image"
    | "audio"
    | "video"
    | "document"
    | "structured_data"
  )[];
  outputTypes: (
    | "text"
    | "image"
    | "audio"
    | "video"
    | "report"
    | "structured_data"
    | "code"
  )[];
  nodes: AIWorkflowNode[];
  edges: WorkflowEdge[];
  triggers: WorkflowTrigger[];
  metadata: WorkflowMetadata;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
  dataTransform?: string;
  weight?: number;
}

export interface WorkflowTrigger {
  type: "manual" | "api" | "webhook" | "schedule" | "event" | "file_upload";
  config: any;
  enabled: boolean;
}

export interface WorkflowMetadata {
  version: string;
  author: string;
  tags: string[];
  category: string;
  complexity: "simple" | "medium" | "complex" | "expert";
  estimatedCost: number;
  estimatedTime: number;
  lastUpdated: Date;
}

export class AIOrchestrationService {
  private models: Map<string, AIModel> = new Map();
  private workflows: Map<string, MultiModalWorkflow> = new Map();
  private executions: Map<string, AIWorkflowExecution> = new Map();
  private modelPerformanceHistory: Map<string, ModelPerformanceData> =
    new Map();

  constructor() {
    this.initializeModels();
  }

  // Model Management
  private initializeModels(): void {
    const models: AIModel[] = [
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: "openai",
        type: "language",
        capabilities: [
          {
            name: "Reasoning",
            description: "Complex logical reasoning",
            category: "reasoning",
            proficiency: 5,
          },
          {
            name: "Code Generation",
            description: "Software development",
            category: "coding",
            proficiency: 5,
          },
          {
            name: "Analysis",
            description: "Data and text analysis",
            category: "analysis",
            proficiency: 5,
          },
        ],
        maxTokens: 4096,
        costPer1kTokens: 0.03,
        inputModalities: ["text"],
        outputModalities: ["text", "code", "structured_data"],
        contextWindow: 128000,
        latency: "medium",
        availability: "public",
      },
      {
        id: "claude-3-opus",
        name: "Claude 3 Opus",
        provider: "anthropic",
        type: "language",
        capabilities: [
          {
            name: "Reasoning",
            description: "Advanced reasoning",
            category: "reasoning",
            proficiency: 5,
          },
          {
            name: "Creativity",
            description: "Creative writing",
            category: "creativity",
            proficiency: 5,
          },
          {
            name: "Analysis",
            description: "Complex analysis",
            category: "analysis",
            proficiency: 5,
          },
        ],
        maxTokens: 4096,
        costPer1kTokens: 0.015,
        inputModalities: ["text"],
        outputModalities: ["text", "structured_data"],
        contextWindow: 200000,
        latency: "medium",
        availability: "public",
      },
      {
        id: "gpt-4-vision",
        name: "GPT-4 Vision",
        provider: "openai",
        type: "multimodal",
        capabilities: [
          {
            name: "Vision",
            description: "Image understanding",
            category: "vision",
            proficiency: 4,
          },
          {
            name: "Reasoning",
            description: "Visual reasoning",
            category: "reasoning",
            proficiency: 4,
          },
          {
            name: "Analysis",
            description: "Visual analysis",
            category: "analysis",
            proficiency: 4,
          },
        ],
        maxTokens: 4096,
        costPer1kTokens: 0.04,
        inputModalities: ["text", "image"],
        outputModalities: ["text", "structured_data"],
        contextWindow: 128000,
        latency: "medium",
        availability: "public",
      },
      {
        id: "whisper-large",
        name: "Whisper Large",
        provider: "openai",
        type: "speech",
        capabilities: [
          {
            name: "Speech Recognition",
            description: "Audio transcription",
            category: "audio",
            proficiency: 5,
          },
          {
            name: "Translation",
            description: "Audio translation",
            category: "audio",
            proficiency: 4,
          },
        ],
        maxTokens: 0,
        costPer1kTokens: 0.006,
        inputModalities: ["audio"],
        outputModalities: ["text"],
        contextWindow: 0,
        latency: "low",
        availability: "public",
      },
      {
        id: "dall-e-3",
        name: "DALL-E 3",
        provider: "openai",
        type: "vision",
        capabilities: [
          {
            name: "Image Generation",
            description: "Text to image",
            category: "creativity",
            proficiency: 5,
          },
          {
            name: "Creativity",
            description: "Artistic creation",
            category: "creativity",
            proficiency: 5,
          },
        ],
        maxTokens: 0,
        costPer1kTokens: 0.08,
        inputModalities: ["text"],
        outputModalities: ["image"],
        contextWindow: 0,
        latency: "high",
        availability: "public",
      },
    ];

    models.forEach((model) => {
      this.models.set(model.id, model);
    });
  }

  // Workflow Creation and Management
  async createMultiModalWorkflow(
    workflow: Omit<MultiModalWorkflow, "id">,
  ): Promise<MultiModalWorkflow> {
    const id = this.generateId();
    const newWorkflow: MultiModalWorkflow = {
      ...workflow,
      id,
      metadata: {
        ...workflow.metadata,
        lastUpdated: new Date(),
      },
    };

    // Validate workflow
    const validation = await this.validateWorkflow(newWorkflow);
    if (!validation.isValid) {
      throw new Error(
        `Workflow validation failed: ${validation.errors.join(", ")}`,
      );
    }

    // Optimize workflow
    const optimized = await this.optimizeWorkflow(newWorkflow);

    this.workflows.set(id, optimized);
    return optimized;
  }

  async validateWorkflow(
    workflow: MultiModalWorkflow,
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for circular dependencies
    if (this.hasCircularDependencies(workflow)) {
      errors.push("Workflow contains circular dependencies");
    }

    // Validate model availability
    for (const node of workflow.nodes) {
      const model = this.models.get(node.config.modelId);
      if (!model) {
        errors.push(`Model ${node.config.modelId} not found`);
      } else if (
        model.availability === "private" &&
        !this.hasPrivateAccess(model.id)
      ) {
        errors.push(`No access to private model ${model.id}`);
      }
    }

    // Check input/output compatibility
    for (const edge of workflow.edges) {
      const fromNode = workflow.nodes.find((n) => n.id === edge.from);
      const toNode = workflow.nodes.find((n) => n.id === edge.to);

      if (fromNode && toNode) {
        const compatible = this.areModelsCompatible(
          fromNode.config.modelId,
          toNode.config.modelId,
        );
        if (!compatible) {
          warnings.push(
            `Potential compatibility issue between ${edge.from} and ${edge.to}`,
          );
        }
      }
    }

    // Estimate costs
    const estimatedCost = await this.estimateWorkflowCost(workflow);
    if (estimatedCost > 100) {
      warnings.push(`High estimated cost: $${estimatedCost.toFixed(2)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async optimizeWorkflow(
    workflow: MultiModalWorkflow,
  ): Promise<MultiModalWorkflow> {
    const optimized = { ...workflow };

    // Model selection optimization
    for (const node of optimized.nodes) {
      const optimalModel = await this.selectOptimalModel(node);
      if (optimalModel && optimalModel !== node.config.modelId) {
        node.config.modelId = optimalModel;
      }
    }

    // Parallel execution optimization
    const parallelGroups = this.identifyParallelExecutionGroups(optimized);

    // Cost optimization
    await this.optimizeForCost(optimized);

    // Quality optimization
    await this.optimizeForQuality(optimized);

    return optimized;
  }

  // Workflow Execution
  async executeWorkflow(
    workflowId: string,
    inputs: any,
  ): Promise<AIWorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const execution: AIWorkflowExecution = {
      id: this.generateId(),
      workflowId,
      status: "running",
      startTime: new Date(),
      nodeExecutions: [],
      totalCost: 0,
      totalTokens: 0,
      qualityScore: 0,
      insights: [],
    };

    this.executions.set(execution.id, execution);

    try {
      // Execute nodes in topological order
      const executionOrder = this.getTopologicalOrder(workflow);

      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        const nodeExecution = await this.executeNode(node, inputs, execution);
        execution.nodeExecutions.push(nodeExecution);

        // Update totals
        execution.totalCost += nodeExecution.cost;
        execution.totalTokens += nodeExecution.outputs.reduce(
          (sum, output) => sum + output.metadata.tokensUsed,
          0,
        );

        // Check for early termination conditions
        if (nodeExecution.status === "failed" && !node.retryPolicy) {
          execution.status = "failed";
          break;
        }

        // Update inputs for next nodes
        inputs = { ...inputs, [nodeId]: nodeExecution.outputs };
      }

      // Calculate final metrics
      execution.qualityScore = this.calculateQualityScore(execution);
      execution.insights = await this.generateInsights(execution);
      execution.status = "completed";
      execution.endTime = new Date();
    } catch (error) {
      execution.status = "failed";
      execution.endTime = new Date();
      console.error("Workflow execution failed:", error);
    }

    return execution;
  }

  private async executeNode(
    node: AIWorkflowNode,
    inputs: any,
    execution: AIWorkflowExecution,
  ): Promise<AINodeExecution> {
    const nodeExecution: AINodeExecution = {
      nodeId: node.id,
      status: "running",
      startTime: new Date(),
      inputs,
      outputs: [],
      retryAttempts: 0,
      cost: 0,
      latency: 0,
      qualityMetrics: {
        relevance: 0,
        accuracy: 0,
        completeness: 0,
        coherence: 0,
        factuality: 0,
        creativity: 0,
      },
    };

    const model = this.models.get(node.config.modelId);
    if (!model) {
      nodeExecution.status = "failed";
      nodeExecution.endTime = new Date();
      return nodeExecution;
    }

    let attempts = 0;
    const maxAttempts = node.retryPolicy.maxRetries + 1;

    while (attempts < maxAttempts) {
      try {
        const startTime = Date.now();

        // Execute AI model
        const output = await this.callAIModel(model, node.config, inputs);

        const endTime = Date.now();
        const latency = endTime - startTime;

        // Validate output
        const validation = await this.validateOutput(output, node.config);
        if (!validation.isValid) {
          throw new Error(
            `Output validation failed: ${validation.errors.join(", ")}`,
          );
        }

        // Calculate quality metrics
        const qualityMetrics = await this.calculateQualityMetrics(
          output,
          node.config,
        );

        nodeExecution.outputs.push(output);
        nodeExecution.cost += output.metadata.cost;
        nodeExecution.latency = latency;
        nodeExecution.qualityMetrics = qualityMetrics;
        nodeExecution.status = "completed";
        nodeExecution.endTime = new Date();

        // Update model performance history
        this.updateModelPerformance(
          model.id,
          latency,
          output.metadata.cost,
          qualityMetrics,
        );

        break;
      } catch (error) {
        attempts++;
        nodeExecution.retryAttempts = attempts;

        if (attempts >= maxAttempts) {
          nodeExecution.status = "failed";
          nodeExecution.endTime = new Date();
          console.error(
            `Node ${node.id} failed after ${attempts} attempts:`,
            error,
          );
        } else {
          // Apply retry strategy
          await this.applyRetryStrategy(node.retryPolicy, attempts);
        }
      }
    }

    return nodeExecution;
  }

  private async callAIModel(
    model: AIModel,
    config: AINodeConfig,
    inputs: any,
  ): Promise<AINodeOutput> {
    // This would integrate with actual AI model APIs
    // For now, we'll simulate the call

    const tokensUsed = Math.floor(Math.random() * config.maxTokens) + 100;
    const cost = (tokensUsed / 1000) * model.costPer1kTokens;
    const confidence = 0.7 + Math.random() * 0.3;

    // Simulate different output types based on model type
    let content: any;
    let outputType: AINodeOutput["type"];

    switch (model.type) {
      case "language":
        content = `AI-generated text response for ${config.prompt}`;
        outputType = "text";
        break;
      case "vision":
        content = {
          description: "Generated image",
          url: "https://example.com/image.jpg",
        };
        outputType = "image";
        break;
      case "speech":
        content = "Transcribed audio content";
        outputType = "text";
        break;
      case "code":
        content = 'function example() { return "AI-generated code"; }';
        outputType = "code";
        break;
      default:
        content = { result: "AI processing result" };
        outputType = "structured";
    }

    return {
      type: outputType,
      content,
      confidence,
      metadata: {
        model: model.id,
        tokensUsed,
        latency: 100 + Math.random() * 2000,
        cost,
        timestamp: new Date(),
      },
    };
  }

  // Optimization Methods
  private async selectOptimalModel(
    node: AIWorkflowNode,
  ): Promise<string | null> {
    const currentModel = this.models.get(node.config.modelId);
    if (!currentModel) return null;

    // Find models with similar capabilities
    const alternatives = Array.from(this.models.values()).filter(
      (model) =>
        model.type === currentModel.type &&
        model.capabilities.some((cap) =>
          currentModel.capabilities.some(
            (currentCap) =>
              currentCap.category === cap.category &&
              Math.abs(currentCap.proficiency - cap.proficiency) <= 1,
          ),
        ),
    );

    // Score models based on cost, performance, and quality
    let bestModel = currentModel;
    let bestScore = this.scoreModel(currentModel, node);

    for (const model of alternatives) {
      const score = this.scoreModel(model, node);
      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }

    return bestModel.id !== currentModel.id ? bestModel.id : null;
  }

  private scoreModel(model: AIModel, node: AIWorkflowNode): number {
    const performance = this.modelPerformanceHistory.get(model.id);

    // Base score from capabilities
    let score =
      model.capabilities.reduce((sum, cap) => sum + cap.proficiency, 0) /
      model.capabilities.length;

    // Cost factor (lower cost = higher score)
    score += (1 / model.costPer1kTokens) * 0.1;

    // Latency factor
    const latencyScore =
      model.latency === "low" ? 1 : model.latency === "medium" ? 0.7 : 0.4;
    score += latencyScore * 0.2;

    // Historical performance
    if (performance) {
      score += performance.averageQuality * 0.3;
      score += (1 / performance.averageLatency) * 0.0001;
    }

    return score;
  }

  // Utility Methods
  private hasCircularDependencies(workflow: MultiModalWorkflow): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const dependencies =
        workflow.nodes.find((n) => n.id === nodeId)?.dependencies || [];
      for (const dep of dependencies) {
        if (hasCycle(dep)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (hasCycle(node.id)) return true;
    }

    return false;
  }

  private hasPrivateAccess(modelId: string): boolean {
    // Check if user has access to private models
    return true; // Simplified for demo
  }

  private areModelsCompatible(fromModelId: string, toModelId: string): boolean {
    const fromModel = this.models.get(fromModelId);
    const toModel = this.models.get(toModelId);

    if (!fromModel || !toModel) return false;

    // Check if output modalities of fromModel match input modalities of toModel
    return fromModel.outputModalities.some((output) =>
      toModel.inputModalities.includes(output as any),
    );
  }

  private async estimateWorkflowCost(
    workflow: MultiModalWorkflow,
  ): Promise<number> {
    let totalCost = 0;

    for (const node of workflow.nodes) {
      const model = this.models.get(node.config.modelId);
      if (model) {
        // Estimate based on max tokens and cost per 1k tokens
        const estimatedCost =
          (node.config.maxTokens / 1000) * model.costPer1kTokens;
        totalCost += estimatedCost;
      }
    }

    return totalCost;
  }

  private identifyParallelExecutionGroups(
    workflow: MultiModalWorkflow,
  ): string[][] {
    // Implementation would analyze dependencies and identify nodes that can run in parallel
    return []; // Simplified for demo
  }

  private async optimizeForCost(workflow: MultiModalWorkflow): Promise<void> {
    // Implement cost optimization strategies
  }

  private async optimizeForQuality(
    workflow: MultiModalWorkflow,
  ): Promise<void> {
    // Implement quality optimization strategies
  }

  private getTopologicalOrder(workflow: MultiModalWorkflow): string[] {
    // Implement topological sort based on dependencies
    return workflow.nodes.map((n) => n.id); // Simplified for demo
  }

  private async validateOutput(
    output: AINodeOutput,
    config: AINodeConfig,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate against schema if provided
    if (config.outputSchema) {
      // Schema validation logic
    }

    // Apply validation rules
    if (config.validationRules) {
      for (const rule of config.validationRules) {
        // Apply validation rule
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async calculateQualityMetrics(
    output: AINodeOutput,
    config: AINodeConfig,
  ): Promise<QualityMetrics> {
    // Calculate quality metrics based on output and configuration
    return {
      relevance: 0.8 + Math.random() * 0.2,
      accuracy: 0.7 + Math.random() * 0.3,
      completeness: 0.8 + Math.random() * 0.2,
      coherence: 0.9 + Math.random() * 0.1,
      factuality: 0.8 + Math.random() * 0.2,
      creativity: 0.6 + Math.random() * 0.4,
    };
  }

  private updateModelPerformance(
    modelId: string,
    latency: number,
    cost: number,
    quality: QualityMetrics,
  ): void {
    const existing = this.modelPerformanceHistory.get(modelId) || {
      totalCalls: 0,
      averageLatency: 0,
      averageCost: 0,
      averageQuality: 0,
      lastUpdated: new Date(),
    };

    const totalCalls = existing.totalCalls + 1;
    const avgQuality =
      (quality.relevance +
        quality.accuracy +
        quality.completeness +
        quality.coherence +
        quality.factuality +
        quality.creativity) /
      6;

    this.modelPerformanceHistory.set(modelId, {
      totalCalls,
      averageLatency:
        (existing.averageLatency * existing.totalCalls + latency) / totalCalls,
      averageCost:
        (existing.averageCost * existing.totalCalls + cost) / totalCalls,
      averageQuality:
        (existing.averageQuality * existing.totalCalls + avgQuality) /
        totalCalls,
      lastUpdated: new Date(),
    });
  }

  private async applyRetryStrategy(
    retryPolicy: RetryPolicy,
    attempt: number,
  ): Promise<void> {
    let delay = 1000; // Base delay of 1 second

    switch (retryPolicy.backoffStrategy) {
      case "linear":
        delay = delay * attempt;
        break;
      case "exponential":
        delay = delay * Math.pow(2, attempt - 1);
        break;
      case "fixed":
        // Keep base delay
        break;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private calculateQualityScore(execution: AIWorkflowExecution): number {
    const nodeScores = execution.nodeExecutions.map((ne) => {
      const metrics = ne.qualityMetrics;
      return (
        (metrics.relevance +
          metrics.accuracy +
          metrics.completeness +
          metrics.coherence +
          metrics.factuality +
          metrics.creativity) /
        6
      );
    });

    return (
      nodeScores.reduce((sum, score) => sum + score, 0) / nodeScores.length
    );
  }

  private async generateInsights(
    execution: AIWorkflowExecution,
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Cost insights
    if (execution.totalCost > 10) {
      insights.push({
        type: "cost_saving",
        message: `High execution cost: $${execution.totalCost.toFixed(2)}`,
        recommendation:
          "Consider using more cost-effective models or optimizing prompts",
        impact: "medium",
        confidence: 0.8,
        data: { totalCost: execution.totalCost },
      });
    }

    // Quality insights
    if (execution.qualityScore < 0.7) {
      insights.push({
        type: "quality_improvement",
        message: `Low quality score: ${(execution.qualityScore * 100).toFixed(1)}%`,
        recommendation:
          "Review prompts and consider using higher-quality models",
        impact: "high",
        confidence: 0.9,
        data: { qualityScore: execution.qualityScore },
      });
    }

    return insights;
  }

  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getAvailableModels(): AIModel[] {
    return Array.from(this.models.values());
  }

  getModelsByType(type: AIModel["type"]): AIModel[] {
    return Array.from(this.models.values()).filter(
      (model) => model.type === type,
    );
  }

  getWorkflow(id: string): MultiModalWorkflow | undefined {
    return this.workflows.get(id);
  }

  getExecution(id: string): AIWorkflowExecution | undefined {
    return this.executions.get(id);
  }

  getModelPerformance(modelId: string): ModelPerformanceData | undefined {
    return this.modelPerformanceHistory.get(modelId);
  }
}

interface ModelPerformanceData {
  totalCalls: number;
  averageLatency: number;
  averageCost: number;
  averageQuality: number;
  lastUpdated: Date;
}

// Singleton instance
export const aiOrchestrationService = new AIOrchestrationService();
