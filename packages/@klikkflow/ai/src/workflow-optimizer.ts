/**
 * AI-Powered Workflow Optimizer
 * Analyzes workflows and provides optimization suggestions using AI
 */

import { Logger } from '@klikkflow/core';
import { z } from 'zod';
import type { ILLMProvider } from './base/ai-provider';

// Workflow analysis schemas
export const WorkflowAnalysisSchema = z.object({
  workflowId: z.string(),
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
      config: z.record(z.string(), z.any()),
      connections: z.array(z.string()),
      executionTime: z.number().optional(),
      errorRate: z.number().optional(),
    })
  ),
  executionHistory: z.array(
    z.object({
      executionId: z.string(),
      startTime: z.date(),
      endTime: z.date(),
      status: z.enum(['success', 'error', 'timeout']),
      nodeExecutions: z.array(
        z.object({
          nodeId: z.string(),
          duration: z.number(),
          status: z.enum(['success', 'error', 'skipped']),
          errorMessage: z.string().optional(),
        })
      ),
    })
  ),
  metrics: z.object({
    totalExecutions: z.number(),
    successRate: z.number(),
    averageExecutionTime: z.number(),
    errorCount: z.number(),
  }),
});

export type WorkflowAnalysis = z.infer<typeof WorkflowAnalysisSchema>;

// Optimization suggestion schemas
export const OptimizationSuggestionSchema = z.object({
  id: z.string(),
  type: z.enum(['performance', 'reliability', 'cost', 'maintainability']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  description: z.string(),
  impact: z.object({
    performanceImprovement: z.number().optional(),
    costReduction: z.number().optional(),
    reliabilityImprovement: z.number().optional(),
  }),
  implementation: z.object({
    difficulty: z.enum(['easy', 'medium', 'hard']),
    estimatedTime: z.string(),
    steps: z.array(z.string()),
    codeChanges: z
      .array(
        z.object({
          nodeId: z.string(),
          changes: z.record(z.string(), z.any()),
        })
      )
      .optional(),
  }),
  reasoning: z.string(),
});

export type OptimizationSuggestion = z.infer<typeof OptimizationSuggestionSchema>;

export const OptimizationReportSchema = z.object({
  workflowId: z.string(),
  analysisDate: z.date(),
  overallScore: z.number().min(0).max(100),
  suggestions: z.array(OptimizationSuggestionSchema),
  metrics: z.object({
    currentPerformance: z.number(),
    potentialImprovement: z.number(),
    estimatedCostSavings: z.number().optional(),
  }),
  summary: z.string(),
});

export type OptimizationReport = z.infer<typeof OptimizationReportSchema>;

export class WorkflowOptimizer {
  private logger: Logger;
  private llmProvider: ILLMProvider;

  constructor(llmProvider: ILLMProvider) {
    this.logger = new Logger('WorkflowOptimizer');
    this.llmProvider = llmProvider;
  }

  /**
   * Analyze workflow and generate optimization suggestions
   */
  async analyzeWorkflow(analysis: WorkflowAnalysis): Promise<OptimizationReport> {
    try {
      this.logger.info(`Analyzing workflow: ${analysis.workflowId}`);

      // Validate input
      const validatedAnalysis = WorkflowAnalysisSchema.parse(analysis);

      // Generate AI-powered analysis
      const suggestions = await this.generateOptimizationSuggestions(validatedAnalysis);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(validatedAnalysis);

      // Generate summary
      const summary = await this.generateSummary(validatedAnalysis, suggestions);

      // Calculate potential improvements
      const metrics = this.calculatePotentialImprovements(validatedAnalysis, suggestions);

      const report: OptimizationReport = {
        workflowId: validatedAnalysis.workflowId,
        analysisDate: new Date(),
        overallScore,
        suggestions,
        metrics,
        summary,
      };

      this.logger.info(
        `Workflow analysis completed: ${analysis.workflowId}, Score: ${overallScore}`
      );
      return report;
    } catch (error) {
      this.logger.error('Workflow analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate optimization suggestions using AI
   */
  private async generateOptimizationSuggestions(
    analysis: WorkflowAnalysis
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze performance bottlenecks
    const performanceSuggestions = await this.analyzePerformanceBottlenecks(analysis);
    suggestions.push(...performanceSuggestions);

    // Analyze reliability issues
    const reliabilitySuggestions = await this.analyzeReliabilityIssues(analysis);
    suggestions.push(...reliabilitySuggestions);

    // Analyze cost optimization opportunities
    const costSuggestions = await this.analyzeCostOptimization(analysis);
    suggestions.push(...costSuggestions);

    // Analyze maintainability improvements
    const maintainabilitySuggestions = await this.analyzeMaintainability(analysis);
    suggestions.push(...maintainabilitySuggestions);

    // Use AI to generate additional insights
    const aiSuggestions = await this.generateAISuggestions(analysis);
    suggestions.push(...aiSuggestions);

    // Sort by priority and impact
    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Analyze performance bottlenecks
   */
  private async analyzePerformanceBottlenecks(
    analysis: WorkflowAnalysis
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Find slow nodes
    const slowNodes = analysis.nodes.filter(
      (node) => node.executionTime && node.executionTime > analysis.metrics.averageExecutionTime * 2
    );

    for (const node of slowNodes) {
      suggestions.push({
        id: `perf-${node.id}`,
        type: 'performance',
        priority: 'high',
        title: `Optimize slow node: ${node.name}`,
        description: `Node "${node.name}" is taking ${node.executionTime}ms on average, which is significantly slower than other nodes.`,
        impact: {
          performanceImprovement: 30,
        },
        implementation: {
          difficulty: 'medium',
          estimatedTime: '2-4 hours',
          steps: [
            'Review node configuration for optimization opportunities',
            'Consider caching frequently accessed data',
            'Optimize database queries if applicable',
            'Consider parallel processing where possible',
          ],
        },
        reasoning:
          'Performance bottlenecks can significantly impact overall workflow execution time and user experience.',
      });
    }

    // Detect sequential processing that could be parallelized
    const sequentialChains = this.detectSequentialChains(analysis);
    for (const chain of sequentialChains) {
      if (chain.length > 3) {
        suggestions.push({
          id: `parallel-${chain[0]}`,
          type: 'performance',
          priority: 'medium',
          title: 'Parallelize sequential operations',
          description: `Found a chain of ${chain.length} sequential nodes that could potentially be parallelized.`,
          impact: {
            performanceImprovement: 40,
          },
          implementation: {
            difficulty: 'hard',
            estimatedTime: '1-2 days',
            steps: [
              'Analyze dependencies between nodes',
              'Identify nodes that can run in parallel',
              'Restructure workflow to enable parallel execution',
              'Test parallel execution thoroughly',
            ],
          },
          reasoning: 'Parallel execution can significantly reduce overall workflow execution time.',
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze reliability issues
   */
  private async analyzeReliabilityIssues(
    analysis: WorkflowAnalysis
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Find nodes with high error rates
    const unreliableNodes = analysis.nodes.filter(
      (node) => node.errorRate && node.errorRate > 0.05 // More than 5% error rate
    );

    for (const node of unreliableNodes) {
      suggestions.push({
        id: `reliability-${node.id}`,
        type: 'reliability',
        priority: 'high',
        title: `Improve reliability of ${node.name}`,
        description: `Node "${node.name}" has an error rate of ${((node.errorRate || 0) * 100).toFixed(1)}%, which is above the recommended threshold.`,
        impact: {
          reliabilityImprovement: 25,
        },
        implementation: {
          difficulty: 'medium',
          estimatedTime: '4-8 hours',
          steps: [
            'Add retry logic with exponential backoff',
            'Implement proper error handling and logging',
            'Add input validation and sanitization',
            'Consider circuit breaker pattern for external services',
          ],
        },
        reasoning: 'High error rates can cause workflow failures and poor user experience.',
      });
    }

    // Check for missing error handling
    const nodesWithoutErrorHandling = analysis.nodes.filter(
      (node) => !node.config.errorHandling && node.type !== 'trigger'
    );

    if (nodesWithoutErrorHandling.length > 0) {
      suggestions.push({
        id: 'error-handling-missing',
        type: 'reliability',
        priority: 'medium',
        title: 'Add error handling to nodes',
        description: `${nodesWithoutErrorHandling.length} nodes are missing proper error handling configuration.`,
        impact: {
          reliabilityImprovement: 20,
        },
        implementation: {
          difficulty: 'easy',
          estimatedTime: '1-2 hours',
          steps: [
            'Review each node for error handling requirements',
            'Add try-catch blocks where appropriate',
            'Configure retry policies for transient failures',
            'Set up proper error notifications',
          ],
        },
        reasoning: 'Proper error handling prevents workflow failures and improves debugging.',
      });
    }

    return suggestions;
  }

  /**
   * Analyze cost optimization opportunities
   */
  private async analyzeCostOptimization(
    analysis: WorkflowAnalysis
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for expensive operations that could be cached
    const expensiveNodes = analysis.nodes.filter(
      (node) =>
        node.type.includes('api') || node.type.includes('database') || node.type.includes('ai')
    );

    if (expensiveNodes.length > 0) {
      suggestions.push({
        id: 'caching-opportunity',
        type: 'cost',
        priority: 'medium',
        title: 'Implement caching for expensive operations',
        description: `Found ${expensiveNodes.length} nodes that perform expensive operations and could benefit from caching.`,
        impact: {
          costReduction: 30,
          performanceImprovement: 50,
        },
        implementation: {
          difficulty: 'medium',
          estimatedTime: '4-6 hours',
          steps: [
            'Identify cacheable data and operations',
            'Implement caching layer (Redis, memory cache, etc.)',
            'Set appropriate cache expiration policies',
            'Monitor cache hit rates and effectiveness',
          ],
        },
        reasoning:
          'Caching can reduce API calls, database queries, and AI model invocations, leading to cost savings.',
      });
    }

    // Check for redundant operations
    const duplicateOperations = this.findDuplicateOperations(analysis);
    if (duplicateOperations.length > 0) {
      suggestions.push({
        id: 'eliminate-duplicates',
        type: 'cost',
        priority: 'high',
        title: 'Eliminate redundant operations',
        description: `Found ${duplicateOperations.length} sets of duplicate operations that could be consolidated.`,
        impact: {
          costReduction: 40,
          performanceImprovement: 30,
        },
        implementation: {
          difficulty: 'medium',
          estimatedTime: '2-4 hours',
          steps: [
            'Identify duplicate operations and their purposes',
            'Consolidate duplicate operations into shared nodes',
            'Update workflow connections accordingly',
            'Test consolidated workflow thoroughly',
          ],
        },
        reasoning:
          'Eliminating redundant operations reduces resource usage and improves efficiency.',
      });
    }

    return suggestions;
  }

  /**
   * Analyze maintainability improvements
   */
  private async analyzeMaintainability(
    analysis: WorkflowAnalysis
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for complex nodes that could be broken down
    const complexNodes = analysis.nodes.filter(
      (node) => Object.keys(node.config).length > 10 || node.connections.length > 5
    );

    if (complexNodes.length > 0) {
      suggestions.push({
        id: 'simplify-complex-nodes',
        type: 'maintainability',
        priority: 'medium',
        title: 'Simplify complex nodes',
        description: `Found ${complexNodes.length} nodes with high complexity that could be broken down into smaller, more manageable pieces.`,
        impact: {},
        implementation: {
          difficulty: 'medium',
          estimatedTime: '4-8 hours',
          steps: [
            'Identify complex nodes and their responsibilities',
            'Break down complex nodes into smaller, focused nodes',
            'Create reusable sub-workflows where appropriate',
            'Update documentation and naming conventions',
          ],
        },
        reasoning: 'Simpler nodes are easier to understand, test, and maintain.',
      });
    }

    // Check for naming conventions
    const poorlyNamedNodes = analysis.nodes.filter(
      (node) => node.name.length < 3 || !/^[A-Z]/.test(node.name) || node.name.includes('Node')
    );

    if (poorlyNamedNodes.length > 0) {
      suggestions.push({
        id: 'improve-naming',
        type: 'maintainability',
        priority: 'low',
        title: 'Improve node naming conventions',
        description: `${poorlyNamedNodes.length} nodes have unclear or inconsistent names.`,
        impact: {},
        implementation: {
          difficulty: 'easy',
          estimatedTime: '30 minutes',
          steps: [
            'Review node names for clarity and consistency',
            'Use descriptive, action-oriented names',
            'Follow consistent naming conventions',
            'Update documentation to reflect new names',
          ],
        },
        reasoning: 'Clear naming improves workflow readability and maintainability.',
      });
    }

    return suggestions;
  }

  /**
   * Generate AI-powered suggestions using LLM
   */
  private async generateAISuggestions(
    analysis: WorkflowAnalysis
  ): Promise<OptimizationSuggestion[]> {
    try {
      const prompt = this.buildAnalysisPrompt(analysis);

      const response = await this.llmProvider.complete({
        model: 'gpt-4o',
        prompt,
        maxTokens: 1000,
        temperature: 0.3,
      });

      // Parse AI response and convert to suggestions
      const content = response.choices[0]?.message?.content || '';
      return this.parseAISuggestions(content);
    } catch (error) {
      this.logger.error('Failed to generate AI suggestions:', error);
      return [];
    }
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(analysis: WorkflowAnalysis): string {
    return `
Analyze the following workflow and provide optimization suggestions:

Workflow ID: ${analysis.workflowId}
Total Nodes: ${analysis.nodes.length}
Success Rate: ${(analysis.metrics.successRate * 100).toFixed(1)}%
Average Execution Time: ${analysis.metrics.averageExecutionTime}ms
Total Executions: ${analysis.metrics.totalExecutions}

Node Types: ${analysis.nodes.map((n) => n.type).join(', ')}

Recent Execution History:
${analysis.executionHistory
  .slice(0, 5)
  .map((exec) => `- ${exec.status} (${exec.endTime.getTime() - exec.startTime.getTime()}ms)`)
  .join('\n')}

Please provide 1-2 specific optimization suggestions focusing on:
1. Performance improvements
2. Reliability enhancements
3. Cost optimization
4. Best practices

Format each suggestion as:
TITLE: [Brief title]
DESCRIPTION: [Detailed description]
IMPACT: [Expected impact]
STEPS: [Implementation steps]
`;
  }

  /**
   * Parse AI suggestions from response
   */
  private parseAISuggestions(response: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Simple parsing logic - in production, use more sophisticated parsing
    const sections = response.split('TITLE:').slice(1);

    sections.forEach((section, index) => {
      const lines = section.trim().split('\n');
      const title = lines[0]?.trim();

      if (title) {
        suggestions.push({
          id: `ai-suggestion-${index}`,
          type: 'performance',
          priority: 'medium',
          title,
          description: this.extractSection(section, 'DESCRIPTION') || 'AI-generated suggestion',
          impact: { performanceImprovement: 15 },
          implementation: {
            difficulty: 'medium',
            estimatedTime: '2-4 hours',
            steps: this.extractSteps(section) || ['Implement AI suggestion'],
          },
          reasoning: 'AI-generated optimization suggestion based on workflow analysis.',
        });
      }
    });

    return suggestions;
  }

  /**
   * Extract section content from AI response
   */
  private extractSection(text: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}:\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract steps from AI response
   */
  private extractSteps(text: string): string[] | null {
    const stepsMatch = text.match(/STEPS:\s*([\s\S]*?)(?=\n[A-Z]+:|$)/i);
    if (stepsMatch) {
      return stepsMatch[1]
        .split('\n')
        .map((step) => step.trim())
        .filter((step) => step.length > 0);
    }
    return null;
  }

  /**
   * Calculate overall workflow score
   */
  private calculateOverallScore(analysis: WorkflowAnalysis): number {
    let score = 100;

    // Deduct points for low success rate
    if (analysis.metrics.successRate < 0.95) {
      score -= (0.95 - analysis.metrics.successRate) * 100;
    }

    // Deduct points for slow execution
    const avgTime = analysis.metrics.averageExecutionTime;
    if (avgTime > 5000) {
      // More than 5 seconds
      score -= Math.min(20, (avgTime - 5000) / 1000);
    }

    // Deduct points for high error count
    if (analysis.metrics.errorCount > 0) {
      const errorRate = analysis.metrics.errorCount / analysis.metrics.totalExecutions;
      score -= errorRate * 50;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Generate summary using AI
   */
  private async generateSummary(
    analysis: WorkflowAnalysis,
    suggestions: OptimizationSuggestion[]
  ): Promise<string> {
    try {
      const prompt = `
Summarize the workflow analysis results:

Workflow: ${analysis.workflowId}
Overall Score: ${this.calculateOverallScore(analysis)}/100
Success Rate: ${(analysis.metrics.successRate * 100).toFixed(1)}%
Suggestions: ${suggestions.length}

Key suggestions:
${suggestions
  .slice(0, 3)
  .map((s) => `- ${s.title}`)
  .join('\n')}

Provide a brief, actionable summary in 2-3 sentences.
`;

      const response = await this.llmProvider.complete({
        model: 'gpt-4o',
        prompt,
        maxTokens: 200,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Failed to generate summary:', error);
      return `Workflow analysis completed with ${suggestions.length} optimization suggestions. Focus on ${suggestions.filter((s) => s.priority === 'high').length} high-priority improvements to enhance performance and reliability.`;
    }
  }

  /**
   * Calculate potential improvements
   */
  private calculatePotentialImprovements(
    analysis: WorkflowAnalysis,
    suggestions: OptimizationSuggestion[]
  ) {
    const performanceImprovements = suggestions
      .map((s) => s.impact.performanceImprovement || 0)
      .reduce((sum, val) => sum + val, 0);

    const costSavings = suggestions
      .map((s) => s.impact.costReduction || 0)
      .reduce((sum, val) => sum + val, 0);

    return {
      currentPerformance: this.calculateOverallScore(analysis),
      potentialImprovement: Math.min(100, performanceImprovements),
      estimatedCostSavings: costSavings > 0 ? costSavings : undefined,
    };
  }

  /**
   * Detect sequential chains of nodes
   */
  private detectSequentialChains(analysis: WorkflowAnalysis): string[][] {
    const chains: string[][] = [];
    const visited = new Set<string>();

    for (const node of analysis.nodes) {
      if (!visited.has(node.id) && node.connections.length === 1) {
        const chain = this.buildChain(node.id, analysis.nodes, visited);
        if (chain.length > 1) {
          chains.push(chain);
        }
      }
    }

    return chains;
  }

  /**
   * Build a chain of connected nodes
   */
  private buildChain(
    startNodeId: string,
    nodes: WorkflowAnalysis['nodes'],
    visited: Set<string>
  ): string[] {
    const chain = [startNodeId];
    visited.add(startNodeId);

    const currentNode = nodes.find((n) => n.id === startNodeId);
    if (currentNode && currentNode.connections.length === 1) {
      const nextNodeId = currentNode.connections[0];
      if (!visited.has(nextNodeId)) {
        chain.push(...this.buildChain(nextNodeId, nodes, visited));
      }
    }

    return chain;
  }

  /**
   * Find duplicate operations in workflow
   */
  private findDuplicateOperations(analysis: WorkflowAnalysis): string[][] {
    const duplicates: string[][] = [];
    const nodesByType = new Map<string, string[]>();

    // Group nodes by type and configuration
    for (const node of analysis.nodes) {
      const key = `${node.type}-${JSON.stringify(node.config)}`;
      if (!nodesByType.has(key)) {
        nodesByType.set(key, []);
      }
      nodesByType.get(key)?.push(node.id);
    }

    // Find groups with more than one node
    for (const [_key, nodeIds] of nodesByType) {
      if (nodeIds.length > 1) {
        duplicates.push(nodeIds);
      }
    }

    return duplicates;
  }
}
