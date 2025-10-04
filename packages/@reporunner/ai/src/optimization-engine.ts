import { Logger } from '@reporunner/core';
import type { Workflow, WorkflowEdge, WorkflowNode } from '@reporunner/types';
import { OpenAI } from 'openai';

export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'reliability' | 'cost' | 'security' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  check: (workflow: Workflow) => OptimizationIssue[];
  fix?: (workflow: Workflow, issue: OptimizationIssue) => Workflow;
}

export interface OptimizationIssue {
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  nodeIds?: string[];
  edgeIds?: string[];
  suggestion: string;
  autoFixable: boolean;
  estimatedImpact: {
    performance?: number; // 0-100 scale
    cost?: number; // 0-100 scale
    reliability?: number; // 0-100 scale
  };
}

export interface OptimizationReport {
  workflowId: string;
  analyzedAt: Date;
  overallScore: number; // 0-100
  issues: OptimizationIssue[];
  recommendations: OptimizationRecommendation[];
  metrics: {
    complexity: number;
    parallelizability: number;
    errorHandling: number;
    resourceEfficiency: number;
  };
}

export interface OptimizationRecommendation {
  type: 'parallel_execution' | 'caching' | 'error_handling' | 'resource_optimization' | 'data_flow';
  title: string;
  description: string;
  implementation: {
    nodeChanges?: Array<{ nodeId: string; changes: Partial<WorkflowNode> }>;
    newNodes?: WorkflowNode[];
    newEdges?: WorkflowEdge[];
    configChanges?: Record<string, any>;
  };
  estimatedBenefit: {
    performanceGain: number; // percentage
    costReduction: number; // percentage
    reliabilityImprovement: number; // percentage
  };
}

export class WorkflowOptimizationEngine {
  private logger: Logger;
  private openai: OpenAI;
  private rules: OptimizationRule[] = [];

  constructor(openaiApiKey: string) {
    this.logger = new Logger('WorkflowOptimizationEngine');
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.initializeRules();
  }

  /**
   * Analyze workflow and generate comprehensive optimization report
   */
  async analyzeWorkflow(workflow: Workflow): Promise<OptimizationReport> {
    try {
      this.logger.info('Starting workflow optimization analysis', { workflowId: workflow.id });

      // Run all optimization rules
      const issues: OptimizationIssue[] = [];
      for (const rule of this.rules) {
        const ruleIssues = rule.check(workflow);
        issues.push(...ruleIssues);
      }

      // Generate AI-powered recommendations
      const aiRecommendations = await this.generateAIRecommendations(workflow, issues);

      // Calculate metrics
      const metrics = this.calculateMetrics(workflow);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(issues, metrics);

      const report: OptimizationReport = {
        workflowId: workflow.id,
        analyzedAt: new Date(),
        overallScore,
        issues,
        recommendations: aiRecommendations,
        metrics,
      };

      this.logger.info('Workflow optimization analysis completed', {
        workflowId: workflow.id,
        overallScore,
        issueCount: issues.length,
        recommendationCount: aiRecommendations.length,
      });

      return report;
    } catch (error) {
      this.logger.error('Failed to analyze workflow', { error, workflowId: workflow.id });
      throw error;
    }
  }

  /**
   * Auto-optimize workflow based on recommendations
   */
  async optimizeWorkflow(
    workflow: Workflow,
    selectedRecommendations?: string[]
  ): Promise<{ optimizedWorkflow: Workflow; appliedOptimizations: string[] }> {
    try {
      const report = await this.analyzeWorkflow(workflow);
      let optimizedWorkflow = { ...workflow };
      const appliedOptimizations: string[] = [];

      // Apply selected recommendations or all auto-fixable issues
      const recommendationsToApply = selectedRecommendations
        ? report.recommendations.filter((r) => selectedRecommendations.includes(r.type))
        : report.recommendations;

      for (const recommendation of recommendationsToApply) {
        optimizedWorkflow = this.applyRecommendation(optimizedWorkflow, recommendation);
        appliedOptimizations.push(recommendation.type);
      }

      // Apply auto-fixable issues
      for (const issue of report.issues.filter((i) => i.autoFixable)) {
        const rule = this.rules.find((r) => r.id === issue.ruleId);
        if (rule?.fix) {
          optimizedWorkflow = rule.fix(optimizedWorkflow, issue);
          appliedOptimizations.push(issue.ruleId);
        }
      }

      this.logger.info('Workflow optimization completed', {
        workflowId: workflow.id,
        appliedOptimizations,
      });

      return { optimizedWorkflow, appliedOptimizations };
    } catch (error) {
      this.logger.error('Failed to optimize workflow', { error, workflowId: workflow.id });
      throw error;
    }
  }

  /**
   * Generate performance predictions for workflow
   */
  async predictPerformance(workflow: Workflow): Promise<{
    estimatedExecutionTime: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      network: number;
    };
    bottlenecks: Array<{
      nodeId: string;
      type: 'cpu' | 'memory' | 'network' | 'dependency';
      severity: number;
      description: string;
    }>;
    scalabilityScore: number;
  }> {
    try {
      const prompt = `
Analyze this workflow for performance prediction:

Nodes: ${workflow.nodes.length}
Edges: ${workflow.edges.length}

Node Types: ${workflow.nodes.map((n) => n.type).join(', ')}

Provide performance prediction in JSON format:
{
  "estimatedExecutionTime": number (seconds),
  "resourceUsage": {
    "cpu": number (0-100),
    "memory": number (MB),
    "network": number (KB/s)
  },
  "bottlenecks": [
    {
      "nodeId": "string",
      "type": "cpu|memory|network|dependency",
      "severity": number (0-100),
      "description": "string"
    }
  ],
  "scalabilityScore": number (0-100)
}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a workflow performance analysis expert. Provide accurate performance predictions.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      this.logger.error('Failed to predict performance', { error });
      throw error;
    }
  }

  private initializeRules(): void {
    this.rules = [
      // Performance Rules
      {
        id: 'sequential_execution',
        name: 'Sequential Execution Detected',
        description: 'Nodes that can run in parallel are executing sequentially',
        category: 'performance',
        severity: 'medium',
        check: (workflow) => {
          const issues: OptimizationIssue[] = [];
          const parallelizableNodes = this.findParallelizableNodes(workflow);

          if (parallelizableNodes.length > 1) {
            issues.push({
              ruleId: 'sequential_execution',
              severity: 'medium',
              message: `${parallelizableNodes.length} nodes can be executed in parallel`,
              nodeIds: parallelizableNodes.map((n) => n.id),
              suggestion: 'Configure parallel execution to improve performance',
              autoFixable: true,
              estimatedImpact: { performance: 40 },
            });
          }

          return issues;
        },
        fix: (workflow, issue) => {
          // Add parallel execution configuration
          const updatedNodes = workflow.nodes.map((node) => {
            if (issue.nodeIds?.includes(node.id)) {
              return {
                ...node,
                parameters: {
                  ...node.parameters,
                  executionMode: 'parallel',
                },
              };
            }
            return node;
          });

          return { ...workflow, nodes: updatedNodes };
        },
      },

      // Reliability Rules
      {
        id: 'missing_error_handling',
        name: 'Missing Error Handling',
        description: 'Critical nodes lack proper error handling',
        category: 'reliability',
        severity: 'high',
        check: (workflow) => {
          const issues: OptimizationIssue[] = [];
          const nodesWithoutErrorHandling = workflow.nodes.filter(
            (node) => !this.hasErrorHandling(node, workflow.edges) && this.isCriticalNode(node)
          );

          for (const node of nodesWithoutErrorHandling) {
            issues.push({
              ruleId: 'missing_error_handling',
              severity: 'high',
              message: `Critical node "${node.name}" lacks error handling`,
              nodeIds: [node.id],
              suggestion: 'Add error handling to improve workflow reliability',
              autoFixable: true,
              estimatedImpact: { reliability: 60 },
            });
          }

          return issues;
        },
        fix: (workflow, issue) => {
          // Add error handling nodes
          const newNodes: WorkflowNode[] = [];
          const newEdges: WorkflowEdge[] = [];

          if (issue.nodeIds) {
            for (const nodeId of issue.nodeIds) {
              const errorHandlerNode: WorkflowNode = {
                id: `error_handler_${nodeId}_${Date.now()}`,
                type: 'error-handler',
                name: 'Error Handler',
                position: { x: 0, y: 0 }, // Position will be calculated
                parameters: {
                  retryCount: 3,
                  retryDelay: 1000,
                  fallbackAction: 'continue',
                },
                credentials: [],
                disabled: false,
              };

              const errorEdge: WorkflowEdge = {
                id: `error_edge_${nodeId}_${Date.now()}`,
                source: nodeId,
                target: errorHandlerNode.id,
                type: 'error',
              };

              newNodes.push(errorHandlerNode);
              newEdges.push(errorEdge);
            }
          }

          return {
            ...workflow,
            nodes: [...workflow.nodes, ...newNodes],
            edges: [...workflow.edges, ...newEdges],
          };
        },
      },

      // Cost Optimization Rules
      {
        id: 'expensive_operations',
        name: 'Expensive Operations',
        description: 'Workflow contains resource-intensive operations that could be optimized',
        category: 'cost',
        severity: 'medium',
        check: (workflow) => {
          const issues: OptimizationIssue[] = [];
          const expensiveNodes = workflow.nodes.filter((node) => this.isExpensiveOperation(node));

          for (const node of expensiveNodes) {
            issues.push({
              ruleId: 'expensive_operations',
              severity: 'medium',
              message: `Node "${node.name}" performs expensive operations`,
              nodeIds: [node.id],
              suggestion: 'Consider caching or optimization strategies',
              autoFixable: false,
              estimatedImpact: { cost: 30, performance: 20 },
            });
          }

          return issues;
        },
      },

      // Security Rules
      {
        id: 'insecure_data_flow',
        name: 'Insecure Data Flow',
        description: 'Sensitive data flows through insecure channels',
        category: 'security',
        severity: 'critical',
        check: (workflow) => {
          const issues: OptimizationIssue[] = [];
          const insecureFlows = this.detectInsecureDataFlows(workflow);

          for (const flow of insecureFlows) {
            issues.push({
              ruleId: 'insecure_data_flow',
              severity: 'critical',
              message: `Sensitive data flows insecurely from ${flow.source} to ${flow.target}`,
              nodeIds: [flow.source, flow.target],
              suggestion: 'Add encryption or secure data handling',
              autoFixable: false,
              estimatedImpact: { reliability: 80 },
            });
          }

          return issues;
        },
      },

      // Maintainability Rules
      {
        id: 'complex_workflow',
        name: 'High Complexity',
        description: 'Workflow has high complexity that may impact maintainability',
        category: 'maintainability',
        severity: 'low',
        check: (workflow) => {
          const complexity = this.calculateComplexity(workflow);
          const issues: OptimizationIssue[] = [];

          if (complexity > 80) {
            issues.push({
              ruleId: 'complex_workflow',
              severity: complexity > 90 ? 'high' : 'medium',
              message: `Workflow complexity is ${complexity}/100`,
              suggestion: 'Consider breaking into smaller sub-workflows',
              autoFixable: false,
              estimatedImpact: { reliability: 20 },
            });
          }

          return issues;
        },
      },
    ];
  }

  private async generateAIRecommendations(
    workflow: Workflow,
    issues: OptimizationIssue[]
  ): Promise<OptimizationRecommendation[]> {
    try {
      const prompt = `
Analyze this workflow and provide optimization recommendations:

Workflow: ${workflow.nodes.length} nodes, ${workflow.edges.length} edges
Issues found: ${issues.map((i) => `${i.severity}: ${i.message}`).join('; ')}

Node types: ${workflow.nodes.map((n) => n.type).join(', ')}

Provide recommendations in JSON format:
[
  {
    "type": "parallel_execution|caching|error_handling|resource_optimization|data_flow",
    "title": "string",
    "description": "string",
    "estimatedBenefit": {
      "performanceGain": number,
      "costReduction": number,
      "reliabilityImprovement": number
    }
  }
]
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a workflow optimization expert. Provide actionable recommendations.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      });

      const recommendations = JSON.parse(response.choices[0].message.content || '[]');

      // Add implementation details for each recommendation
      return recommendations.map((rec: any) => ({
        ...rec,
        implementation: this.generateImplementationPlan(rec.type, workflow),
      }));
    } catch (error) {
      this.logger.error('Failed to generate AI recommendations', { error });
      return [];
    }
  }

  private generateImplementationPlan(
    type: string,
    workflow: Workflow
  ): OptimizationRecommendation['implementation'] {
    switch (type) {
      case 'parallel_execution': {
        const parallelizableNodes = this.findParallelizableNodes(workflow);
        return {
          nodeChanges: parallelizableNodes.map((node) => ({
            nodeId: node.id,
            changes: {
              parameters: {
                ...node.parameters,
                executionMode: 'parallel',
              },
            },
          })),
        };
      }

      case 'caching':
        return {
          newNodes: [
            {
              id: `cache_node_${Date.now()}`,
              type: 'cache',
              name: 'Cache Layer',
              position: { x: 100, y: 100 },
              parameters: {
                ttl: 3600,
                strategy: 'lru',
              },
              credentials: [],
              disabled: false,
            },
          ],
        };

      case 'error_handling':
        return {
          newNodes: workflow.nodes
            .filter((node) => !this.hasErrorHandling(node, workflow.edges))
            .map((node) => ({
              id: `error_handler_${node.id}_${Date.now()}`,
              type: 'error-handler',
              name: `Error Handler for ${node.name}`,
              position: { x: node.position.x + 200, y: node.position.y },
              parameters: {
                retryCount: 3,
                retryDelay: 1000,
              },
              credentials: [],
              disabled: false,
            })),
        };

      default:
        return {};
    }
  }

  private calculateMetrics(workflow: Workflow) {
    return {
      complexity: this.calculateComplexity(workflow),
      parallelizability: this.calculateParallelizability(workflow),
      errorHandling: this.calculateErrorHandlingScore(workflow),
      resourceEfficiency: this.calculateResourceEfficiency(workflow),
    };
  }

  private calculateOverallScore(issues: OptimizationIssue[], metrics: any): number {
    const severityWeights = { low: 1, medium: 2, high: 4, critical: 8 };
    const totalIssueWeight = issues.reduce(
      (sum, issue) => sum + severityWeights[issue.severity],
      0
    );
    const maxPossibleWeight = issues.length * 8; // Assuming all critical

    const issueScore =
      maxPossibleWeight > 0 ? (1 - totalIssueWeight / maxPossibleWeight) * 100 : 100;
    const metricsScore =
      (metrics.complexity +
        metrics.parallelizability +
        metrics.errorHandling +
        metrics.resourceEfficiency) /
      4;

    return Math.round((issueScore + metricsScore) / 2);
  }

  private findParallelizableNodes(workflow: Workflow): WorkflowNode[] {
    // Find nodes that don't have dependencies on each other
    const dependencyMap = new Map<string, string[]>();

    workflow.edges.forEach((edge) => {
      const deps = dependencyMap.get(edge.target) || [];
      deps.push(edge.source);
      dependencyMap.set(edge.target, deps);
    });

    return workflow.nodes.filter((node) => {
      const deps = dependencyMap.get(node.id) || [];
      return deps.length <= 1 && !this.isCriticalSequentialNode(node);
    });
  }

  private hasErrorHandling(node: WorkflowNode, edges: WorkflowEdge[]): boolean {
    return edges.some((edge) => edge.source === node.id && edge.type === 'error');
  }

  private isCriticalNode(node: WorkflowNode): boolean {
    const criticalTypes = ['database', 'api-call', 'payment', 'email', 'webhook'];
    return criticalTypes.includes(node.type);
  }

  private isExpensiveOperation(node: WorkflowNode): boolean {
    const expensiveTypes = [
      'ai-processing',
      'image-processing',
      'video-processing',
      'large-dataset',
    ];
    return expensiveTypes.includes(node.type);
  }

  private isCriticalSequentialNode(node: WorkflowNode): boolean {
    const sequentialTypes = ['database-transaction', 'state-machine', 'approval'];
    return sequentialTypes.includes(node.type);
  }

  private detectInsecureDataFlows(_workflow: Workflow): Array<{ source: string; target: string }> {
    // Simplified implementation - would need more sophisticated analysis
    return [];
  }

  private calculateComplexity(workflow: Workflow): number {
    const nodeCount = workflow.nodes.length;
    const edgeCount = workflow.edges.length;
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(workflow);

    return Math.min(100, nodeCount * 2 + edgeCount + cyclomaticComplexity * 5);
  }

  private calculateCyclomaticComplexity(workflow: Workflow): number {
    // Simplified cyclomatic complexity calculation
    const decisionNodes = workflow.nodes.filter((node) =>
      ['condition', 'switch', 'loop'].includes(node.type)
    ).length;

    return decisionNodes + 1;
  }

  private calculateParallelizability(workflow: Workflow): number {
    const parallelizableNodes = this.findParallelizableNodes(workflow);
    return Math.round((parallelizableNodes.length / workflow.nodes.length) * 100);
  }

  private calculateErrorHandlingScore(workflow: Workflow): number {
    const criticalNodes = workflow.nodes.filter((node) => this.isCriticalNode(node));
    const nodesWithErrorHandling = criticalNodes.filter((node) =>
      this.hasErrorHandling(node, workflow.edges)
    );

    return criticalNodes.length > 0
      ? Math.round((nodesWithErrorHandling.length / criticalNodes.length) * 100)
      : 100;
  }

  private calculateResourceEfficiency(workflow: Workflow): number {
    // Simplified resource efficiency calculation
    const expensiveNodes = workflow.nodes.filter((node) => this.isExpensiveOperation(node));
    const totalNodes = workflow.nodes.length;

    return totalNodes > 0 ? Math.round((1 - expensiveNodes.length / totalNodes) * 100) : 100;
  }

  private applyRecommendation(
    workflow: Workflow,
    recommendation: OptimizationRecommendation
  ): Workflow {
    const updatedWorkflow = { ...workflow };

    if (recommendation.implementation.nodeChanges) {
      updatedWorkflow.nodes = updatedWorkflow.nodes.map((node) => {
        const change = recommendation.implementation.nodeChanges?.find((c) => c.nodeId === node.id);
        return change ? { ...node, ...change.changes } : node;
      });
    }

    if (recommendation.implementation.newNodes) {
      updatedWorkflow.nodes = [...updatedWorkflow.nodes, ...recommendation.implementation.newNodes];
    }

    if (recommendation.implementation.newEdges) {
      updatedWorkflow.edges = [...updatedWorkflow.edges, ...recommendation.implementation.newEdges];
    }

    return updatedWorkflow;
  }
}

export default WorkflowOptimizationEngine;
