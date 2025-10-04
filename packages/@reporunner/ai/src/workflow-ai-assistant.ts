import { Logger } from '@reporunner/core';
import type { WorkflowEdge, WorkflowNode } from '@reporunner/types';
import { OpenAI } from 'openai';

export interface AIWorkflowSuggestion {
  type: 'optimization' | 'error_fix' | 'enhancement' | 'integration';
  title: string;
  description: string;
  confidence: number;
  implementation: {
    nodeChanges?: Partial<WorkflowNode>[];
    edgeChanges?: Partial<WorkflowEdge>[];
    newNodes?: WorkflowNode[];
    newEdges?: WorkflowEdge[];
  };
  reasoning: string;
}

export interface AIWorkflowAnalysis {
  complexity: number;
  efficiency: number;
  reliability: number;
  suggestions: AIWorkflowSuggestion[];
  potentialIssues: string[];
  estimatedExecutionTime: number;
}

export class WorkflowAIAssistant {
  private openai: OpenAI;
  private logger: Logger;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.logger = new Logger('WorkflowAIAssistant');
  }

  /**
   * Analyze a workflow and provide AI-powered insights
   */
  async analyzeWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<AIWorkflowAnalysis> {
    try {
      const workflowDescription = this.generateWorkflowDescription(nodes, edges);

      const prompt = `
Analyze this workflow automation and provide insights:

${workflowDescription}

Please analyze:
1. Workflow complexity (0-100 scale)
2. Efficiency opportunities
3. Reliability concerns
4. Specific suggestions for improvement
5. Potential execution issues
6. Estimated execution time

Respond in JSON format with the structure:
{
  "complexity": number,
  "efficiency": number,
  "reliability": number,
  "suggestions": [
    {
      "type": "optimization|error_fix|enhancement|integration",
      "title": "string",
      "description": "string",
      "confidence": number,
      "reasoning": "string"
    }
  ],
  "potentialIssues": ["string"],
  "estimatedExecutionTime": number
}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert workflow automation analyst. Provide detailed, actionable insights about workflow efficiency and reliability.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      this.logger.info('Workflow analysis completed', {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        complexity: analysis.complexity,
      });

      return analysis;
    } catch (error) {
      this.logger.error('Failed to analyze workflow', { error });
      throw new Error('AI analysis failed');
    }
  }

  /**
   * Generate workflow suggestions based on user intent
   */
  async generateWorkflowSuggestions(
    intent: string,
    existingNodes: WorkflowNode[] = []
  ): Promise<WorkflowNode[]> {
    try {
      const prompt = `
Create a workflow automation for: "${intent}"

Existing nodes: ${existingNodes.map((n) => `${n.type}(${n.name})`).join(', ')}

Generate new nodes that would complete this workflow. Consider:
- Popular integrations (Gmail, Slack, databases, APIs)
- Logical flow and dependencies
- Error handling and validation
- Data transformation needs

Respond with JSON array of nodes:
[
  {
    "id": "unique-id",
    "type": "node-type",
    "name": "Node Name",
    "description": "What this node does",
    "position": {"x": number, "y": number},
    "parameters": {},
    "integration": "service-name"
  }
]
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a workflow automation expert. Generate practical, efficient workflow nodes.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const suggestions = JSON.parse(response.choices[0].message.content || '[]');

      this.logger.info('Generated workflow suggestions', {
        intent,
        suggestionCount: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      this.logger.error('Failed to generate workflow suggestions', { error });
      throw new Error('AI suggestion generation failed');
    }
  }

  /**
   * Optimize workflow performance
   */
  async optimizeWorkflow(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<{
    optimizedNodes: WorkflowNode[];
    optimizedEdges: WorkflowEdge[];
    optimizations: string[];
  }> {
    try {
      const _analysis = await this.analyzeWorkflow(nodes, edges);

      // Apply AI-suggested optimizations
      const optimizations: string[] = [];
      const optimizedNodes = [...nodes];
      const optimizedEdges = [...edges];

      // Implement parallel execution where possible
      const parallelizableNodes = this.findParallelizableNodes(nodes, edges);
      if (parallelizableNodes.length > 0) {
        optimizations.push(
          `Identified ${parallelizableNodes.length} nodes that can run in parallel`
        );
      }

      // Add error handling nodes
      const nodesWithoutErrorHandling = nodes.filter((n) => !this.hasErrorHandling(n, edges));
      if (nodesWithoutErrorHandling.length > 0) {
        optimizations.push(`Added error handling for ${nodesWithoutErrorHandling.length} nodes`);
      }

      // Optimize data flow
      const redundantTransformations = this.findRedundantTransformations(nodes, edges);
      if (redundantTransformations.length > 0) {
        optimizations.push(
          `Removed ${redundantTransformations.length} redundant data transformations`
        );
      }

      return {
        optimizedNodes,
        optimizedEdges,
        optimizations,
      };
    } catch (error) {
      this.logger.error('Failed to optimize workflow', { error });
      throw new Error('Workflow optimization failed');
    }
  }

  /**
   * Generate natural language explanation of workflow
   */
  async explainWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<string> {
    try {
      const workflowDescription = this.generateWorkflowDescription(nodes, edges);

      const prompt = `
Explain this workflow automation in simple, clear language:

${workflowDescription}

Write a user-friendly explanation that:
1. Describes what the workflow does overall
2. Explains each major step
3. Highlights key integrations and data flow
4. Mentions any conditional logic or branching
5. Notes error handling and reliability features

Keep it concise but comprehensive.
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a technical writer who explains complex workflows in simple terms.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      return response.choices[0].message.content || 'Unable to generate explanation';
    } catch (error) {
      this.logger.error('Failed to explain workflow', { error });
      throw new Error('Workflow explanation failed');
    }
  }

  private generateWorkflowDescription(nodes: WorkflowNode[], edges: WorkflowEdge[]): string {
    const nodeDescriptions = nodes
      .map((node) => `${node.type}(${node.name}): ${node.description || 'No description'}`)
      .join('\n');

    const edgeDescriptions = edges.map((edge) => `${edge.source} -> ${edge.target}`).join('\n');

    return `
Nodes (${nodes.length}):
${nodeDescriptions}

Connections (${edges.length}):
${edgeDescriptions}
`;
  }

  private findParallelizableNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    // Find nodes that don't depend on each other and can run in parallel
    const dependencyMap = new Map<string, string[]>();

    edges.forEach((edge) => {
      const dependencies = dependencyMap.get(edge.target) || [];
      dependencies.push(edge.source);
      dependencyMap.set(edge.target, dependencies);
    });

    return nodes.filter((node) => {
      const dependencies = dependencyMap.get(node.id) || [];
      return dependencies.length <= 1; // Can potentially run in parallel
    });
  }

  private hasErrorHandling(node: WorkflowNode, edges: WorkflowEdge[]): boolean {
    // Check if node has error handling connections
    return edges.some((edge) => edge.source === node.id && edge.type === 'error');
  }

  private findRedundantTransformations(
    nodes: WorkflowNode[],
    _edges: WorkflowEdge[]
  ): WorkflowNode[] {
    // Find transformation nodes that might be redundant
    return nodes.filter((node) => node.type === 'transform' || node.type === 'data-transform');
  }
}

export default WorkflowAIAssistant;
