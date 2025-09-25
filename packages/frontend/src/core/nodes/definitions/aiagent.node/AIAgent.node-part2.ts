{
  name: 'Gemini Pro Vision', value;
  : 'gemini-pro-vision'
}
,
        ],
        displayOptions:
{
  show: {
    provider: ['google'],
  }
  ,
}
,
      },
{
  name: 'model', displayName;
  : 'Local Model',
  type: 'string', required;
  : true,
        description: 'Ollama model name (e.g., llama3.2, mistral, codellama)',
        default: 'llama3.2',
        placeholder: 'llama3.2, mistral, codellama, etc.',
        displayOptions:
  {
    show: {
      provider: ['ollama'],
    }
    ,
  }
  ,
}
,
{
  name: 'credentials', displayName;
  : 'Credentials',
  type: 'credentialsSelect', required;
  : true,
        description: 'Authentication credentials for the AI provider',
        credentialTypes: [
          'openaiApi',
          'anthropicApi',
          'googleAiApi',
          'azureOpenAiApi',
          'awsBedrockApi',
        ],
        displayOptions:
  {
    show: {
      provider: ['openai', 'anthropic', 'google', 'azure_openai', 'aws_bedrock'],
    }
    ,
  }
  ,
}
,
{
  name: 'ollamaUrl', displayName;
  : 'Ollama Server URL',
  type: 'string', required;
  : false,
        description: 'Ollama server URL (default: http://localhost:11434)',
        default: 'http://localhost:11434',
        placeholder: 'http://localhost:11434',
        displayOptions:
  {
    show: {
      provider: ['ollama'],
    }
    ,
  }
  ,
}
,
{
  name: 'systemPrompt', displayName;
  : 'System Prompt',
  type: 'text', required;
  : false,
        description: 'System prompt to define AI behavior and context',
        default: '',
        placeholder: 'You are a helpful assistant that...',
        rows: 4,
}
,
{
  name: 'agentType', displayName;
  : 'Agent Type',
  type: 'select', required;
  : false,
        description: 'Type of AI agent for specialized tasks',
        default: 'general',
        options: [
  {
    name: 'General AI Agent', value;
    : 'general'
  }
  ,
  {
    name: 'Email Classifier', value;
    : 'classifier'
  }
  ,
  {
    name: 'Customer Support Agent', value;
    : 'support-agent'
  }
  ,
        ],
}
,
{
  name: 'promptTemplate', displayName;
  : 'Prompt Template',
  type: 'select', required;
  : false,
        description: 'Pre-built prompt templates for common use cases',
        default: 'custom',
        options: [
  {
    name: 'Custom Prompt', value;
    : 'custom'
  }
  ,
  {
    name: 'Email Support Classification', value;
    : 'email_classification',
  }
  ,
  {
    name: 'Sentiment Analysis', value;
    : 'sentiment_analysis'
  }
  ,
  {
    name: 'Content Summarization', value;
    : 'summarization'
  }
  ,
        ],
        displayOptions:
  {
    show: {
      agentType: ['classifier', 'general'],
    }
    ,
  }
  ,
}
,
