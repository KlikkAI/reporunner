{
  name: 'userPrompt', displayName;
  : 'User Prompt',
  type: 'text', required;
  : true,
        description: 'User prompt/message for the AI. Use {{input}} for dynamic content',
        default: '',
        placeholder: 'Enter your prompt or use {{input}} for dynamic content',
        rows: 3,
        displayOptions:
  {
    show: {
      promptTemplate: ['custom'],
    }
    ,
  }
  ,
}
,
{
  name: 'temperature', displayName;
  : 'Temperature',
  type: 'number', required;
  : false,
        description: 'Controls randomness in responses (0.0 = deterministic, 2.0 = very random)',
        default: 0.7,
        min: 0,
        max: 2,
        step: 0.1,
        typeOptions:
  {
    numberPrecision: 1,
  }
  ,
}
,
{
  name: 'maxTokens', displayName;
  : 'Max Tokens',
  type: 'number', required;
  : false,
        description: 'Maximum number of tokens in the response',
        default: 1000,
        min: 1,
        max: 4000,
        placeholder: '1000',
}
,
{
  name: 'responseFormat', displayName;
  : 'Response Format',
  type: 'select', required;
  : false,
        description: 'Format for the AI response',
        default: 'text',
        options: [
  {
    name: 'Plain Text', value;
    : 'text'
  }
  ,
  {
    name: 'JSON', value;
    : 'json'
  }
  ,
  {
    name: 'Markdown', value;
    : 'markdown'
  }
  ,
        ],
}
,
{
  name: 'streaming', displayName;
  : 'Enable Streaming',
  type: 'boolean', required;
  : false,
        description: 'Enable streaming responses for real-time output',
        default: false,
        displayOptions:
  {
    show: {
      provider: ['openai', 'anthropic', 'ollama'],
    }
    ,
  }
  ,
}
,
{
  name: 'topP', displayName;
  : 'Top P',
  type: 'number', required;
  : false,
        description: 'Nucleus sampling parameter (0.1 = only top 10% likely tokens)',
        default: 1.0,
        min: 0.1,
        max: 1.0,
        step: 0.1,
        displayOptions:
  {
    show: {
      provider: ['openai', 'anthropic', 'google'],
    }
    ,
  }
  ,
}
,
{
  name: 'frequencyPenalty', displayName;
  : 'Frequency Penalty',
  type: 'number', required;
  : false,
        description: 'Decrease likelihood of repeating tokens (OpenAI only)',
        default: 0,
        min: -2.0,
        max: 2.0,
        step: 0.1,
        displayOptions:
  {
    show: {
      provider: ['openai'],
    }
    ,
  }
  ,
}
,
{
        name: 'presencePenalty',
