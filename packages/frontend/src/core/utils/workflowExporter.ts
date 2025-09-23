// Workflow Exporter - Convert Visual Workflow to Backend-Ready JSON
import type { Edge, Node } from 'reactflow';

export interface BackendWorkflowNode {
  parameters: Record<string, any>;
  type: string;
  typeVersion: number;
  position: [number, number];
  id: string;
  name: string;
  notesInFlow?: boolean;
  credentials?: Record<string, any>;
  notes?: string;
  disabled?: boolean;
  webhookId?: string;
  alwaysOutputData?: boolean;
}

export interface BackendWorkflowEdge {
  node: string;
  type: string;
  index: number;
}

export interface BackendWorkflow {
  nodes: BackendWorkflowNode[];
  connections: Record<string, { main: BackendWorkflowEdge[][] }>;
  pinData: Record<string, any>;
  meta: {
    instanceId: string;
    templateId?: string;
    version?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * Export visual workflow to backend-ready JSON format
 * Compatible with n8n-style workflow structure for Golang backend
 */
export function exportWorkflowToBackend(
  nodes: Node[],
  edges: Edge[],
  workflowMeta?: {
    templateId?: string;
    version?: string;
  }
): BackendWorkflow {
  // Convert React Flow nodes to backend format
  const backendNodes: BackendWorkflowNode[] = nodes.map((node) => {
    const nodeData = node.data;

    return {
      parameters: convertToBackendParameters(nodeData),
      type: mapNodeTypeToBackend(node.type, nodeData),
      typeVersion: getNodeTypeVersion(node.type),
      position: [node.position.x, node.position.y],
      id: node.id,
      name: nodeData.name || node.id,
      notesInFlow: Boolean(nodeData.notes),
      credentials: nodeData.credentials ? mapCredentialsToBackend(nodeData.credentials) : undefined,
      notes: nodeData.notes || '',
      disabled: nodeData.disabled || false,
      webhookId: nodeData.webhookId,
      alwaysOutputData: nodeData.alwaysOutputData || false,
    };
  });

  // Convert React Flow edges to backend connections
  const connections: Record<string, { main: BackendWorkflowEdge[][] }> = {};

  nodes.forEach((node) => {
    const nodeEdges = edges.filter((edge) => edge.source === node.id);

    if (nodeEdges.length > 0) {
      connections[node.data.name || node.id] = {
        main: [
          nodeEdges.map((edge) => {
            const targetNode = nodes.find((n) => n.id === edge.target);
            return {
              node: targetNode?.data.name || edge.target,
              type: 'main',
              index: 0,
            };
          }),
        ],
      };
    }
  });

  return {
    nodes: backendNodes,
    connections,
    pinData: {},
    meta: {
      instanceId: generateInstanceId(),
      templateId: workflowMeta?.templateId,
      version: workflowMeta?.version || '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Convert frontend node parameters to backend format
 */
function convertToBackendParameters(nodeData: any): Record<string, any> {
  const integration = nodeData.integration;
  const nodeType = nodeData.nodeType;
  const config = nodeData.configuration || {};

  // Handle different node types
  switch (integration) {
    case 'gmail':
      return convertGmailParameters(config, nodeType);

    case 'ai-agent':
      return convertAiAgentParameters(config);

    case 'condition':
      return convertConditionParameters(config);

    case 'data-transformation':
      return convertTransformParameters(config);

    case 'email':
      return convertEmailParameters(config);

    default:
      return config;
  }
}

/**
 * Convert Gmail node parameters
 */
function convertGmailParameters(config: any, nodeType: string): Record<string, any> {
  if (nodeType === 'trigger') {
    return {
      pollTimes: config.pollTimes || {
        item: [{ mode: 'everyMinute' }],
      },
      simple: config.simple || false,
      filters: config.filters || {
        readStatus: 'both',
        sender: '',
      },
      options: config.options || {},
    };
  }

  if (nodeType === 'createDraft') {
    return {
      descriptionType: 'manual',
      toolDescription: 'Consume the Gmail API to createDraft response',
      resource: 'draft',
      subject: config.subject || '={{ $fromAI("Subject") }}',
      message: config.message || '={{ $fromAI("Message", ``, "string") }}',
      options: {
        threadId: config.threadId || '={{ $("Edit Fields").item.json.threadid }}',
        sendTo: config.sendTo || '={{ $("Edit Fields").item.json.sender }}',
      },
    };
  }

  return config;
}

/**
 * Convert AI Agent parameters - Full configuration for sentiment analysis and other AI tasks
 */
function convertAiAgentParameters(config: any): Record<string, any> {
  return {
    // AI Provider Configuration
    provider: config.provider || 'openai',
    model: config.model || 'gpt-3.5-turbo',
    credentials: config.credentials || '',

    // Prompt Configuration
    systemPrompt: config.systemPrompt || '',
    userPrompt: config.userPrompt || 'Analyze the sentiment of the following text: {{input}}',

    // Model Parameters
    temperature: config.temperature !== undefined ? config.temperature : 0.7,
    maxTokens: config.maxTokens || 1000,
    responseFormat: config.responseFormat || 'text',
    streaming: config.streaming || false,

    // Advanced Parameters (provider-specific)
    topP: config.topP !== undefined ? config.topP : 1.0,
    frequencyPenalty: config.frequencyPenalty || 0,
    presencePenalty: config.presencePenalty || 0,

    // Ollama-specific
    ollamaUrl: config.ollamaUrl || 'http://localhost:11434',

    // Configuration compatibility
    promptType: config.promptType || 'define',
    text: config.text || '={{ $json.body }}',
    options: {
      systemMessage: config.options?.systemMessage || config.systemPrompt || '',
    },
  };
}

/**
 * Convert Condition node parameters
 */
function convertConditionParameters(config: any): Record<string, any> {
  const outputs = config.outputs || [];

  return {
    rules: {
      values: outputs.map((output: any, _index: number) => ({
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict',
            version: 2,
          },
          conditions: [
            {
              leftValue: output.condition || '={{ $json.output.parseJson().customerSupport }}',
              rightValue: '',
              operator: {
                type: 'boolean',
                operation: output.label.toLowerCase().includes('support') ? 'true' : 'false',
                singleValue: true,
              },
              id: generateConditionId(),
            },
          ],
          combinator: 'and',
        },
        renameOutput: true,
        outputKey: output.label,
      })),
    },
    options: {},
  };
}

/**
 * Convert Transform/Edit Fields parameters
 */
function convertTransformParameters(config: any): Record<string, any> {
  return {
    assignments: {
      assignments: config.assignments?.assignments || [],
    },
    options: config.options || {},
  };
}

/**
 * Convert Email parameters
 */
function convertEmailParameters(config: any): Record<string, any> {
  return {
    fromEmail: config.fromEmail || 'noreply@reporunner.com',
    toEmail: config.toEmail || '',
    subject: config.subject || 'Workflow Notification',
    emailFormat: config.emailFormat || 'text',
    text: config.text || config.message || '',
    options: config.options || {},
  };
}

/**
 * Map frontend node types to backend node types
 */
function mapNodeTypeToBackend(nodeType: string | undefined, nodeData: any): string {
  const integration = nodeData.integration;

  // Map based on integration and node type
  if (integration === 'gmail') {
    if (nodeData.nodeType === 'trigger') return 'n8n-nodes-base.gmailTrigger';
    if (nodeData.nodeType === 'createDraft') return 'n8n-nodes-base.gmailTool';
    return 'n8n-nodes-base.gmail';
  }

  if (integration === 'ai-agent') {
    return '@n8n/n8n-nodes-langchain.agent';
  }

  if (integration === 'condition' || nodeType === 'condition') {
    return 'n8n-nodes-base.switch';
  }

  if (integration === 'data-transformation' || nodeData.nodeType === 'transform') {
    return 'n8n-nodes-base.set';
  }

  if (integration === 'email') {
    return 'n8n-nodes-base.emailSend';
  }

  if (integration === 'pgvector') {
    return '@n8n/n8n-nodes-langchain.vectorStorePGVector';
  }

  if (integration === 'ollama') {
    return '@n8n/n8n-nodes-langchain.lmChatOllama';
  }

  // Default mapping
  return `n8n-nodes-base.${nodeType || 'default'}`;
}

/**
 * Get node type version
 */
function getNodeTypeVersion(nodeType: string | undefined): number {
  // Version mapping for different node types
  const versionMap: Record<string, number> = {
    trigger: 1.2,
    action: 2.1,
    condition: 3.2,
    transform: 3.4,
    email: 2.1,
  };

  return versionMap[nodeType || 'action'] || 1.0;
}

/**
 * Map credentials to backend format
 */
function mapCredentialsToBackend(credentials: any): Record<string, any> {
  if (!credentials) return {};

  return {
    [credentials.type]: {
      id: credentials.id || generateCredentialId(),
      name: credentials.name || `${credentials.type} account`,
    },
  };
}

/**
 * Generate unique instance ID
 */
function generateInstanceId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Generate unique condition ID
 */
function generateConditionId(): string {
  return `condition-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique credential ID
 */
function generateCredentialId(): string {
  return `cred-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Export workflow with Customer Support MVP template
 */
export function exportCustomerSupportMvp(nodes: Node[], edges: Edge[]): BackendWorkflow {
  return exportWorkflowToBackend(nodes, edges, {
    templateId: 'customer-support-mvp',
    version: '1.0.0',
  });
}

/**
 * Validate workflow before export
 */
export function validateWorkflowForExport(
  nodes: Node[],
  edges: Edge[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required nodes
  const hasGmailTrigger = nodes.some(
    (n) => n.data.integration === 'gmail' && n.data.nodeType === 'trigger'
  );
  const hasAiClassifier = nodes.some((n) => n.data.integration === 'ai-agent');
  const hasCondition = nodes.some((n) => n.type === 'condition');

  if (!hasGmailTrigger) errors.push('Gmail Trigger node is required');
  if (!hasAiClassifier) errors.push('AI Classifier node is required');
  if (!hasCondition) errors.push('Condition/Switch node is required');

  // Check connections
  const disconnectedNodes = nodes.filter((node) => {
    const hasIncoming = edges.some((edge) => edge.target === node.id);
    // const hasOutgoing = edges.some(edge => edge.source === node.id)
    const isTrigger = node.type === 'trigger';

    return !isTrigger && !hasIncoming;
  });

  if (disconnectedNodes.length > 0) {
    warnings.push(`${disconnectedNodes.length} nodes are not connected to the workflow`);
  }

  // Check credentials
  const nodesWithoutCredentials = nodes.filter((node) => {
    const needsCredentials = ['gmail', 'ai-agent', 'ollama', 'pgvector'].includes(
      node.data.integration
    );
    return needsCredentials && !node.data.credentials;
  });

  if (nodesWithoutCredentials.length > 0) {
    errors.push('Some nodes are missing required credentials');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
