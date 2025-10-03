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
}

// Stub service class
class WorkflowTemplates {
  async getTemplates(): Promise<WorkflowTemplate[]> {
    return [];
  }
}

export const workflowTemplates = new WorkflowTemplates();
