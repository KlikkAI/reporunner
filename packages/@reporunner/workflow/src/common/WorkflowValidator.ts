// Workflow validator reusing patterns from workflow-engine
import { WorkflowValidationError } from '../types/error-types';

export class WorkflowValidator {
  validate(workflow: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!workflow) {
      errors.push('Workflow is required');
      return { isValid: false, errors };
    }

    if (!workflow.id) {
      errors.push('Workflow ID is required');
    }

    if (!workflow.name) {
      errors.push('Workflow name is required');
    }

    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push('Workflow must have nodes array');
    } else {
      // Validate nodes
      const nodeErrors = this.validateNodes(workflow.nodes);
      errors.push(...nodeErrors);
    }

    if (workflow.connections && Array.isArray(workflow.connections)) {
      // Validate connections
      const connectionErrors = this.validateConnections(workflow.connections, workflow.nodes);
      errors.push(...connectionErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateOrThrow(workflow: any): void {
    const result = this.validate(workflow);
    if (!result.isValid) {
      throw new WorkflowValidationError('Workflow validation failed', result.errors);
    }
  }

  private validateNodes(nodes: any[]): string[] {
    const errors: string[] = [];
    const nodeIds = new Set<string>();

    for (const node of nodes) {
      if (!node.id) {
        errors.push('Node must have an ID');
        continue;
      }

      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);

      if (!node.type) {
        errors.push(`Node ${node.id} must have a type`);
      }

      if (!node.name) {
        errors.push(`Node ${node.id} must have a name`);
      }
    }

    return errors;
  }

  private validateConnections(connections: any[], nodes: any[]): string[] {
    const errors: string[] = [];
    const nodeIds = new Set(nodes.map(node => node.id));

    for (const connection of connections) {
      if (!connection.source?.nodeId) {
        errors.push('Connection must have source node ID');
        continue;
      }

      if (!connection.destination?.nodeId) {
        errors.push('Connection must have destination node ID');
        continue;
      }

      if (!nodeIds.has(connection.source.nodeId)) {
        errors.push(`Connection references non-existent source node: ${connection.source.nodeId}`);
      }

      if (!nodeIds.has(connection.destination.nodeId)) {
        errors.push(`Connection references non-existent destination node: ${connection.destination.nodeId}`);
      }
    }

    return errors;
  }
}