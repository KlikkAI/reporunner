/**
 * Workflow Templates - Stub
 * This service was removed during consolidation.
 * Minimal types provided for backward compatibility.
 */

export type TemplateCategory =
  | 'communication'
  | 'data-processing'
  | 'automation'
  | 'ai-ml'
  | 'business'
  | 'development'
  | 'monitoring'
  | 'integration'
  | 'social-media'
  | 'ecommerce';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  nodes: any[];
  edges: any[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime?: string;
  tags?: string[];
  variables?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  configuration?: {
    requiredIntegrations: string[];
    conditionalBranches: number;
    schedulingRequired: boolean;
    triggersRequired: boolean;
    resourceRequirements: {
      memory: 'low' | 'medium' | 'high';
      cpu: 'low' | 'medium' | 'high';
    };
  };
  metadata?: {
    usageCount?: number;
    rating?: number;
    tags?: string[];
    updatedAt?: string;
    [key: string]: any;
  };
}

export interface AutomationPattern {
  id: string;
  name: string;
  description: string;
  pattern?: 'sequential' | 'parallel' | 'conditional';
  complexity?: 'simple' | 'moderate' | 'complex';
  applicableNodes?: string[];
  benefits?: string[];
  category: string;
}

// Stub service class
class WorkflowTemplates {
  async getTemplates(): Promise<WorkflowTemplate[]> {
    return [];
  }

  async searchTemplates(_query: string): Promise<WorkflowTemplate[]> {
    return [];
  }

  async getAutomationPatterns(): Promise<AutomationPattern[]> {
    return [];
  }

  async createWorkflowFromTemplate(
    _templateId: string,
    _variables?: Record<string, any>
  ): Promise<any> {
    return null;
  }

  async getFavoriteTemplates(): Promise<WorkflowTemplate[]> {
    return [];
  }

  async addToFavorites(_templateId: string): Promise<void> {
    // Stub
  }

  async removeFromFavorites(_templateId: string): Promise<void> {
    // Stub
  }

  async getRecentlyUsedTemplates(): Promise<WorkflowTemplate[]> {
    return [];
  }
}

export const workflowTemplates = new WorkflowTemplates();
