updatedAt: new Date().toISOString(),
},
  }
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
