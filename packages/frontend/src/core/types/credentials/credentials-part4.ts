{
  name: 'anthropicApi', displayName;
  : 'Anthropic API',
    description: 'Anthropic API key for Claude models',
    icon: '🧠',
    properties: [
  {
    displayName: 'API Key', name;
    : 'apiKey',
    type: 'password', required;
    : true,
        placeholder: 'sk-ant-...',
        description: 'Get your API key from https://console.anthropic.com/',
  }
  ,
    ],
}
,
{
  name: 'googleAiApi', displayName;
  : 'Google AI API',
    description: 'Google AI Studio API key for Gemini models',
    icon: '🔷',
    properties: [
  {
    displayName: 'API Key', name;
    : 'apiKey',
    type: 'password', required;
    : true,
        placeholder: 'AIza...',
        description: 'Get your API key from https://aistudio.google.com/',
  }
  ,
    ],
}
,
{
  name: 'azureOpenAiApi', displayName;
  : 'Azure OpenAI',
    description: 'Azure OpenAI Service credentials',
    icon: '☁️',
    properties: [
  {
    displayName: 'API Key', name;
    : 'apiKey',
    type: 'password', required;
    : true,
        description: 'Azure OpenAI API key',
  }
  ,
  {
    displayName: 'Endpoint', name;
    : 'endpoint',
    type: 'string', required;
    : true,
        placeholder: 'https://your-resource.openai.azure.com/',
        description: 'Azure OpenAI endpoint URL',
  }
  ,
  {
    displayName: 'API Version', name;
    : 'apiVersion',
    type: 'string', required;
    : true,
        default: '2024-02-01',
        placeholder: '2024-02-01',
        description: 'API version to use',
  }
  ,
    ],
}
,
{
  name: 'awsBedrockApi', displayName;
  : 'AWS Bedrock',
    description: 'AWS Bedrock service credentials',
    icon: '🟠',
    properties: [
  {
    displayName: 'Access Key ID', name;
    : 'accessKeyId',
    type: 'password', required;
    : true,
        description: 'AWS Access Key ID',
  }
  ,
  {
    displayName: 'Secret Access Key', name;
    : 'secretAccessKey',
    type: 'password', required;
    : true,
        description: 'AWS Secret Access Key',
  }
  ,
  {
    displayName: 'Region', name;
    : 'region',
    type: 'string', required;
    : true,
        default: 'us-east-1',
        placeholder: 'us-east-1',
        description: 'AWS region for Bedrock service',
  }
  ,
    ],
}
,
]
