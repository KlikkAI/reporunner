/**
 * Workflow Templates and Automation Patterns
 *
 * Pre-built workflow templates for common automation scenarios,
 * pattern library, and intelligent workflow suggestions.
 */

import type { WorkflowNodeInstance } from "../nodes/types";
import type { WorkflowEdge } from "../stores/leanWorkflowStore";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedSetupTime: number; // minutes
  nodes: TemplateNode[];
  edges: TemplateEdge[];
  variables: TemplateVariable[];
  configuration: TemplateConfiguration;
  metadata: {
    author: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    usageCount: number;
    rating: number;
    reviews: TemplateReview[];
  };
}

export interface TemplateNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    integration?: string;
    nodeType?: string;
    properties?: Record<string, any>;
    requiredCredentials?: string[];
    configurationHints?: string[];
  };
}

export interface TemplateEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  conditions?: Record<string, any>;
}

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "credential" | "webhook_url";
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
}

export interface TemplateConfiguration {
  requiredIntegrations: string[];
  requiredCredentials: string[];
  webhookEndpoints: number;
  schedulingRequired: boolean;
  triggersRequired: boolean;
  conditionalBranches: number;
  estimatedExecutionTime: number; // seconds
  resourceRequirements: {
    memory: "low" | "medium" | "high";
    cpu: "low" | "medium" | "high";
    storage: "low" | "medium" | "high";
  };
}

export interface TemplateReview {
  userId: string;
  rating: number;
  comment: string;
  helpful: number;
  createdAt: string;
}

export type TemplateCategory =
  | "communication"
  | "data-processing"
  | "automation"
  | "ai-ml"
  | "business"
  | "development"
  | "monitoring"
  | "integration"
  | "social-media"
  | "ecommerce";

export interface AutomationPattern {
  id: string;
  name: string;
  description: string;
  pattern: PatternType;
  applicableNodes: string[];
  suggestedConnections: SuggestedConnection[];
  benefits: string[];
  complexity: "simple" | "moderate" | "complex";
}

export type PatternType =
  | "sequential"
  | "parallel"
  | "conditional"
  | "loop"
  | "fan-out"
  | "fan-in"
  | "pipeline"
  | "event-driven"
  | "batch-processing"
  | "real-time-stream";

export interface SuggestedConnection {
  from: string;
  to: string;
  condition?: string;
  dataTransformation?: string;
}

export class WorkflowTemplatesService {
  private templates = new Map<string, WorkflowTemplate>();
  private patterns = new Map<string, AutomationPattern>();
  private userFavorites = new Set<string>();
  private recentlyUsed: string[] = [];

  constructor() {
    this.initializeBuiltInTemplates();
    this.initializeAutomationPatterns();
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TemplateCategory): WorkflowTemplate[] {
    return this.getAllTemplates().filter(
      (template) => template.category === category,
    );
  }

  /**
   * Search templates by query
   */
  searchTemplates(query: string): WorkflowTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllTemplates().filter(
      (template) =>
        template.name.toLowerCase().includes(lowercaseQuery) ||
        template.description.toLowerCase().includes(lowercaseQuery) ||
        template.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
    );
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): WorkflowTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Create workflow from template
   */
  createWorkflowFromTemplate(
    templateId: string,
    variables: Record<string, any> = {},
  ): { nodes: WorkflowNodeInstance[]; edges: WorkflowEdge[] } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    // Track usage
    template.metadata.usageCount++;
    this.addToRecentlyUsed(templateId);

    // Process template nodes with variable substitution
    const nodes: WorkflowNodeInstance[] = template.nodes.map((templateNode) => {
      const nodeData = { ...templateNode.data };

      // Substitute variables in properties
      if (nodeData.properties) {
        nodeData.properties = this.substituteVariables(
          nodeData.properties,
          variables,
        );
      }

      return {
        id: templateNode.id,
        type: templateNode.type,
        position: templateNode.position,
        parameters: nodeData.properties || {},
        credentials: [],
        name: nodeData.label,
        notes: nodeData.description,
      } as WorkflowNodeInstance;
    });

    // Process template edges
    const edges: WorkflowEdge[] = template.edges.map((templateEdge) => ({
      id: templateEdge.id,
      source: templateEdge.source,
      target: templateEdge.target,
      type: templateEdge.type || "default",
      data: templateEdge.label
        ? { label: templateEdge.label, conditions: templateEdge.conditions }
        : undefined,
    }));

    return { nodes, edges };
  }

  /**
   * Get recommended templates based on existing workflow
   */
  getRecommendedTemplates(
    existingNodes: WorkflowNodeInstance[],
    limit = 5,
  ): WorkflowTemplate[] {
    const nodeTypes = new Set(existingNodes.map((node) => node.type));
    const integrations = new Set(
      existingNodes
        .map((node: any) => node?.data?.integration)
        .filter(Boolean) as string[],
    );

    return this.getAllTemplates()
      .map((template) => ({
        template,
        score: this.calculateRelevanceScore(template, nodeTypes, integrations),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.template);
  }

  /**
   * Get automation patterns
   */
  getAutomationPatterns(): AutomationPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns applicable to specific nodes
   */
  getApplicablePatterns(nodeTypes: string[]): AutomationPattern[] {
    return this.getAutomationPatterns().filter((pattern) =>
      pattern.applicableNodes.some((nodeType) => nodeTypes.includes(nodeType)),
    );
  }

  /**
   * Add template to favorites
   */
  addToFavorites(templateId: string): void {
    this.userFavorites.add(templateId);
  }

  /**
   * Remove template from favorites
   */
  removeFromFavorites(templateId: string): void {
    this.userFavorites.delete(templateId);
  }

  /**
   * Get user's favorite templates
   */
  getFavoriteTemplates(): WorkflowTemplate[] {
    return Array.from(this.userFavorites)
      .map((id) => this.getTemplate(id))
      .filter(Boolean) as WorkflowTemplate[];
  }

  /**
   * Get recently used templates
   */
  getRecentlyUsedTemplates(limit = 10): WorkflowTemplate[] {
    return this.recentlyUsed
      .slice(0, limit)
      .map((id) => this.getTemplate(id))
      .filter(Boolean) as WorkflowTemplate[];
  }

  /**
   * Rate a template
   */
  rateTemplate(templateId: string, rating: number, comment?: string): void {
    const template = this.getTemplate(templateId);
    if (!template) return;

    const review: TemplateReview = {
      userId: "current-user", // Would come from auth context
      rating,
      comment: comment || "",
      helpful: 0,
      createdAt: new Date().toISOString(),
    };

    template.metadata.reviews.push(review);

    // Update average rating
    const avgRating =
      template.metadata.reviews.reduce((sum, r) => sum + r.rating, 0) /
      template.metadata.reviews.length;
    template.metadata.rating = Math.round(avgRating * 10) / 10;
  }

  // Private methods

  private initializeBuiltInTemplates(): void {
    const templates: WorkflowTemplate[] = [
      {
        id: "email-processing-pipeline",
        name: "Email Processing Pipeline",
        description:
          "Automatically process incoming emails, extract attachments, and organize data",
        category: "communication",
        tags: ["email", "automation", "data-extraction"],
        difficulty: "intermediate",
        estimatedSetupTime: 15,
        nodes: [
          {
            id: "trigger-1",
            type: "trigger",
            position: { x: 100, y: 100 },
            data: {
              label: "Email Trigger",
              description: "Monitors inbox for new emails",
              integration: "gmail",
              nodeType: "email-trigger",
              properties: {
                mailbox: "INBOX",
                filters: { hasAttachment: true },
              },
              requiredCredentials: ["gmail-oauth"],
            },
          },
          {
            id: "extract-1",
            type: "transform",
            position: { x: 350, y: 100 },
            data: {
              label: "Extract Attachments",
              description: "Extract and save email attachments",
              integration: "core",
              nodeType: "data-extractor",
              properties: {
                extractionType: "attachments",
                saveLocation: "/attachments",
              },
            },
          },
          {
            id: "condition-1",
            type: "condition",
            position: { x: 600, y: 100 },
            data: {
              label: "Check File Type",
              description: "Route based on attachment type",
              integration: "core",
              nodeType: "condition",
              properties: {
                condition: "data.fileType === 'pdf'",
              },
            },
          },
          {
            id: "action-1",
            type: "action",
            position: { x: 850, y: 50 },
            data: {
              label: "Process PDF",
              description: "Extract text from PDF files",
              integration: "pdf-parser",
              nodeType: "pdf-processor",
            },
          },
          {
            id: "action-2",
            type: "action",
            position: { x: 850, y: 150 },
            data: {
              label: "Store File",
              description: "Store other file types",
              integration: "storage",
              nodeType: "file-storage",
            },
          },
        ],
        edges: [
          { id: "e1", source: "trigger-1", target: "extract-1" },
          { id: "e2", source: "extract-1", target: "condition-1" },
          {
            id: "e3",
            source: "condition-1",
            target: "action-1",
            label: "true",
          },
          {
            id: "e4",
            source: "condition-1",
            target: "action-2",
            label: "false",
          },
        ],
        variables: [
          {
            name: "emailFilter",
            type: "string",
            required: false,
            description: "Filter criteria for emails",
            defaultValue: "hasAttachment: true",
          },
          {
            name: "storageLocation",
            type: "string",
            required: true,
            description: "Directory to store attachments",
            defaultValue: "/attachments",
          },
        ],
        configuration: {
          requiredIntegrations: ["gmail", "storage"],
          requiredCredentials: ["gmail-oauth"],
          webhookEndpoints: 0,
          schedulingRequired: false,
          triggersRequired: true,
          conditionalBranches: 1,
          estimatedExecutionTime: 30,
          resourceRequirements: {
            memory: "medium",
            cpu: "low",
            storage: "medium",
          },
        },
        metadata: {
          author: "Reporunner Team",
          version: "1.0.0",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          usageCount: 0,
          rating: 4.5,
          reviews: [],
        },
      },
      {
        id: "ai-content-moderation",
        name: "AI Content Moderation",
        description: "Automatically moderate user-generated content using AI",
        category: "ai-ml",
        tags: ["ai", "moderation", "content", "automation"],
        difficulty: "advanced",
        estimatedSetupTime: 25,
        nodes: [
          {
            id: "webhook-1",
            type: "webhook",
            position: { x: 100, y: 100 },
            data: {
              label: "Content Webhook",
              description: "Receives content for moderation",
              integration: "webhook",
              nodeType: "webhook-trigger",
            },
          },
          {
            id: "ai-1",
            type: "ai-agent",
            position: { x: 350, y: 100 },
            data: {
              label: "Content Analyzer",
              description: "Analyze content for violations",
              integration: "openai",
              nodeType: "ai-agent",
              properties: {
                model: "gpt-4",
                prompt: "Analyze this content for policy violations...",
              },
              requiredCredentials: ["openai-api"],
            },
          },
          {
            id: "condition-1",
            type: "condition",
            position: { x: 600, y: 100 },
            data: {
              label: "Violation Check",
              description: "Check if content violates policies",
              integration: "core",
              nodeType: "condition",
              properties: {
                condition: "data.analysis.violation === true",
              },
            },
          },
          {
            id: "action-1",
            type: "action",
            position: { x: 850, y: 50 },
            data: {
              label: "Flag Content",
              description: "Flag violating content",
              integration: "database",
              nodeType: "database-update",
            },
          },
          {
            id: "action-2",
            type: "action",
            position: { x: 850, y: 150 },
            data: {
              label: "Approve Content",
              description: "Approve clean content",
              integration: "database",
              nodeType: "database-update",
            },
          },
        ],
        edges: [
          { id: "e1", source: "webhook-1", target: "ai-1" },
          { id: "e2", source: "ai-1", target: "condition-1" },
          {
            id: "e3",
            source: "condition-1",
            target: "action-1",
            label: "violation",
          },
          {
            id: "e4",
            source: "condition-1",
            target: "action-2",
            label: "clean",
          },
        ],
        variables: [
          {
            name: "aiModel",
            type: "string",
            required: true,
            description: "AI model to use for analysis",
            defaultValue: "gpt-4",
            validation: {
              options: ["gpt-3.5-turbo", "gpt-4", "claude-3"],
            },
          },
          {
            name: "strictnessLevel",
            type: "number",
            required: false,
            description: "Moderation strictness (1-10)",
            defaultValue: 5,
            validation: { min: 1, max: 10 },
          },
        ],
        configuration: {
          requiredIntegrations: ["openai", "database", "webhook"],
          requiredCredentials: ["openai-api", "database-connection"],
          webhookEndpoints: 1,
          schedulingRequired: false,
          triggersRequired: true,
          conditionalBranches: 1,
          estimatedExecutionTime: 10,
          resourceRequirements: {
            memory: "high",
            cpu: "medium",
            storage: "low",
          },
        },
        metadata: {
          author: "Reporunner Team",
          version: "1.0.0",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          usageCount: 0,
          rating: 4.7,
          reviews: [],
        },
      },
      {
        id: "social-media-scheduler",
        name: "Social Media Scheduler",
        description:
          "Schedule and publish content across multiple social media platforms",
        category: "social-media",
        tags: ["social-media", "scheduling", "automation", "content"],
        difficulty: "intermediate",
        estimatedSetupTime: 20,
        nodes: [
          {
            id: "schedule-1",
            type: "trigger",
            position: { x: 100, y: 100 },
            data: {
              label: "Content Schedule",
              description: "Scheduled content trigger",
              integration: "scheduler",
              nodeType: "cron-trigger",
              properties: {
                schedule: "0 9 * * *", // Daily at 9 AM
              },
            },
          },
          {
            id: "fetch-1",
            type: "action",
            position: { x: 350, y: 100 },
            data: {
              label: "Fetch Content",
              description: "Get scheduled content from database",
              integration: "database",
              nodeType: "database-query",
            },
          },
          {
            id: "loop-1",
            type: "loop",
            position: { x: 600, y: 100 },
            data: {
              label: "For Each Platform",
              description: "Process each social media platform",
              integration: "core",
              nodeType: "for-each-loop",
            },
          },
          {
            id: "action-1",
            type: "action",
            position: { x: 850, y: 100 },
            data: {
              label: "Post Content",
              description: "Publish to social media platform",
              integration: "social-media",
              nodeType: "social-post",
              requiredCredentials: ["twitter-api", "linkedin-api"],
            },
          },
        ],
        edges: [
          { id: "e1", source: "schedule-1", target: "fetch-1" },
          { id: "e2", source: "fetch-1", target: "loop-1" },
          { id: "e3", source: "loop-1", target: "action-1" },
        ],
        variables: [
          {
            name: "publishTime",
            type: "string",
            required: true,
            description: "Time to publish content (cron format)",
            defaultValue: "0 9 * * *",
          },
          {
            name: "platforms",
            type: "string",
            required: true,
            description: "Comma-separated list of platforms",
            defaultValue: "twitter,linkedin,facebook",
          },
        ],
        configuration: {
          requiredIntegrations: ["database", "social-media", "scheduler"],
          requiredCredentials: ["twitter-api", "linkedin-api", "facebook-api"],
          webhookEndpoints: 0,
          schedulingRequired: true,
          triggersRequired: true,
          conditionalBranches: 0,
          estimatedExecutionTime: 60,
          resourceRequirements: {
            memory: "medium",
            cpu: "low",
            storage: "low",
          },
        },
        metadata: {
          author: "Reporunner Team",
          version: "1.0.0",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          usageCount: 0,
          rating: 4.3,
          reviews: [],
        },
      },
    ];

    templates.forEach((template) => {
      this.templates.set(template.id, template);
    });
  }

  private initializeAutomationPatterns(): void {
    const patterns: AutomationPattern[] = [
      {
        id: "sequential-processing",
        name: "Sequential Processing",
        description: "Process data through a series of steps in order",
        pattern: "sequential",
        applicableNodes: ["action", "transform", "ai-agent"],
        suggestedConnections: [
          { from: "input", to: "step1" },
          { from: "step1", to: "step2" },
          { from: "step2", to: "output" },
        ],
        benefits: [
          "Simple to understand",
          "Predictable execution",
          "Easy debugging",
        ],
        complexity: "simple",
      },
      {
        id: "conditional-branching",
        name: "Conditional Branching",
        description: "Route data based on conditions",
        pattern: "conditional",
        applicableNodes: ["condition", "action"],
        suggestedConnections: [
          { from: "input", to: "condition" },
          { from: "condition", to: "path1", condition: "true" },
          { from: "condition", to: "path2", condition: "false" },
        ],
        benefits: ["Dynamic routing", "Error handling", "Business logic"],
        complexity: "moderate",
      },
      {
        id: "parallel-processing",
        name: "Parallel Processing",
        description: "Execute multiple tasks simultaneously",
        pattern: "parallel",
        applicableNodes: ["action", "ai-agent", "webhook"],
        suggestedConnections: [
          { from: "input", to: "task1" },
          { from: "input", to: "task2" },
          { from: "input", to: "task3" },
          { from: "task1", to: "merge" },
          { from: "task2", to: "merge" },
          { from: "task3", to: "merge" },
        ],
        benefits: ["Faster execution", "Resource optimization", "Scalability"],
        complexity: "complex",
      },
      {
        id: "event-driven",
        name: "Event-Driven Architecture",
        description: "React to events and triggers",
        pattern: "event-driven",
        applicableNodes: ["trigger", "webhook", "action"],
        suggestedConnections: [
          { from: "event", to: "processor" },
          { from: "processor", to: "action" },
        ],
        benefits: ["Real-time processing", "Decoupled components", "Scalable"],
        complexity: "moderate",
      },
    ];

    patterns.forEach((pattern) => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  private substituteVariables(obj: any, variables: Record<string, any>): any {
    if (typeof obj === "string") {
      return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] !== undefined ? variables[varName] : match;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.substituteVariables(item, variables));
    }

    if (typeof obj === "object" && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.substituteVariables(value, variables);
      }
      return result;
    }

    return obj;
  }

  private calculateRelevanceScore(
    template: WorkflowTemplate,
    nodeTypes: Set<string>,
    integrations: Set<string>,
  ): number {
    let score = 0;

    // Score based on matching node types
    const templateNodeTypes = new Set(template.nodes.map((node) => node.type));
    const nodeTypeOverlap = Array.from(nodeTypes).filter((type) =>
      templateNodeTypes.has(type),
    );
    score += nodeTypeOverlap.length * 2;

    // Score based on matching integrations
    const templateIntegrations = new Set(
      template.nodes.map((node) => node.data.integration).filter(Boolean),
    );
    const integrationOverlap = Array.from(integrations).filter((integration) =>
      templateIntegrations.has(integration),
    );
    score += integrationOverlap.length * 3;

    // Bonus for popular templates
    score += Math.log(template.metadata.usageCount + 1);

    // Bonus for highly rated templates
    score += template.metadata.rating;

    return score;
  }

  private addToRecentlyUsed(templateId: string): void {
    // Remove if already exists
    this.recentlyUsed = this.recentlyUsed.filter((id) => id !== templateId);

    // Add to beginning
    this.recentlyUsed.unshift(templateId);

    // Keep only last 10
    this.recentlyUsed = this.recentlyUsed.slice(0, 10);
  }
}

// Export singleton instance
export const workflowTemplates = new WorkflowTemplatesService();
