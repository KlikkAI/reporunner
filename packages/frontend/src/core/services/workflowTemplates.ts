/**
 * Workflow Templates - Stub
 * This service was removed during consolidation.
 * Minimal types provided for backward compatibility.
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: any[];
  edges: any[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime?: string;
  metadata?: {
    usageCount?: number;
    rating?: number;
    tags?: string[];
    [key: string]: any;
  };
}

export interface AutomationPattern {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  templateCount?: number;
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

  async createWorkflowFromTemplate(_templateId: string, _variables?: Record<string, any>): Promise<any> {
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
}

export const workflowTemplates = new WorkflowTemplates();
