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
