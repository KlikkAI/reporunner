export class WorkflowGenerator {
  generateBasicWorkflow(name: string, description?: string): any {
    return {
      id: this.generateId(),
      name,
      description: description || `Basic workflow: ${name}`,
      version: '1.0.0',
      nodes: [
        {
          id: 'start',
          type: 'trigger',
          name: 'Start',
          properties: {},
          outputs: ['node-1'],
        },
        {
          id: 'node-1',
          type: 'action',
          name: 'Process',
          properties: {},
          inputs: ['start'],
          outputs: ['end'],
        },
        {
          id: 'end',
          type: 'output',
          name: 'End',
          properties: {},
          inputs: ['node-1'],
        },
      ],
      connections: [
        { from: 'start', to: 'node-1' },
        { from: 'node-1', to: 'end' },
      ],
    };
  }

  generateAPIWorkflow(name: string, description?: string): any {
    return {
      id: this.generateId(),
      name,
      description: description || `API workflow: ${name}`,
      version: '1.0.0',
      nodes: [
        {
          id: 'webhook',
          type: 'webhook',
          name: 'Webhook Trigger',
          properties: {
            method: 'POST',
            path: `/api/workflows/${name.toLowerCase().replace(/\s+/g, '-')}`,
          },
          outputs: ['validate'],
        },
        {
          id: 'validate',
          type: 'validator',
          name: 'Validate Input',
          properties: {
            schema: {},
          },
          inputs: ['webhook'],
          outputs: ['process'],
        },
        {
          id: 'process',
          type: 'function',
          name: 'Process Data',
          properties: {
            code: '// Process the incoming data\nreturn data;',
          },
          inputs: ['validate'],
          outputs: ['response'],
        },
        {
          id: 'response',
          type: 'http-response',
          name: 'Send Response',
          properties: {
            statusCode: 200,
          },
          inputs: ['process'],
        },
      ],
      connections: [
        { from: 'webhook', to: 'validate' },
        { from: 'validate', to: 'process' },
        { from: 'process', to: 'response' },
      ],
    };
  }

  private generateId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class NodeGenerator {
  generateActionNode(name: string, category: string): string {
    return `import { Node, NodeConfig, ExecutionContext } from '@reporunner/core';

export interface ${name}Config extends NodeConfig {
  // Add your configuration properties here
}

export class ${name} extends Node<${name}Config> {
  static category = '${category}';
  static description = '${name} node';
  
  async execute(context: ExecutionContext): Promise<any> {
    const { data } = context;
    
    // Implement your node logic here
    console.log('Executing ${name} with data:', data);
    
    return {
      ...data,
      processed: true,
      timestamp: new Date().toISOString(),
    };
  }
  
  async validate(): Promise<boolean> {
    // Add validation logic
    return true;
  }
}

export default ${name};`;
  }

  generateTriggerNode(name: string, category: string): string {
    return `import { TriggerNode, NodeConfig, ExecutionContext } from '@reporunner/core';

export interface ${name}Config extends NodeConfig {
  schedule?: string;
  // Add your configuration properties here
}

export class ${name} extends TriggerNode<${name}Config> {
  static category = '${category}';
  static description = '${name} trigger node';
  
  async start(): Promise<void> {
    // Setup your trigger (e.g., schedule, webhook, etc.)
    console.log('Starting ${name} trigger');
  }
  
  async stop(): Promise<void> {
    // Cleanup your trigger
    console.log('Stopping ${name} trigger');
  }
  
  protected async onTrigger(data: any): Promise<void> {
    // Handle trigger event
    await this.emit('trigger', data);
  }
}

export default ${name};`;
  }

  generateTransformNode(name: string, category: string): string {
    return `import { Node, NodeConfig, ExecutionContext } from '@reporunner/core';

export interface ${name}Config extends NodeConfig {
  mapping?: Record<string, string>;
  // Add your configuration properties here
}

export class ${name} extends Node<${name}Config> {
  static category = '${category}';
  static description = '${name} transform node';
  
  async execute(context: ExecutionContext): Promise<any> {
    const { data } = context;
    const { mapping } = this.config;
    
    // Transform the data based on mapping
    let transformed = { ...data };
    
    if (mapping) {
      transformed = Object.entries(mapping).reduce((acc, [from, to]) => {
        if (data[from] !== undefined) {
          acc[to] = data[from];
        }
        return acc;
      }, {} as any);
    }
    
    return transformed;
  }
}

export default ${name};`;
  }
}