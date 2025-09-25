text: config.text || '={{ $json.body }}', options;
:
{
  systemMessage: config.options?.systemMessage || config.systemPrompt || '',
}
,
  }
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
