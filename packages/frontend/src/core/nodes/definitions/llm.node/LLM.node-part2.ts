required: true, description;
: 'Model name/ID to use',
        placeholder: 'gpt-3.5-turbo, claude-3-sonnet, llama2',
      },
{
  displayName: 'Prompt', name;
  : 'prompt',
  type: 'text',
  default: '',
        required: true,
        displayOptions:
  {
    show: {
      operation: ['generate', 'complete', 'summarize', 'classify'],
    }
    ,
  }
  ,
        description: 'The prompt to send to the LLM',
        placeholder: 'Write a creative story about...',
}
,
{
  displayName: 'Messages', name;
  : 'messages',
  type: 'json',
  default: '[]',
        displayOptions:
  {
    show: {
      operation: ['chat'],
    }
    ,
  }
  ,
        description: 'Chat messages in OpenAI format',
        placeholder: '[{"role": "user", "content": "Hello!"}]',
}
,
{
  displayName: 'Text to Process', name;
  : 'inputText',
  type: 'string',
  default: '',
        displayOptions:
  {
    show: {
      operation: ['summarize', 'classify'],
    }
    ,
  }
  ,
        description: 'Text to summarize or classify',
        placeholder: 'Long text to process...',
}
,
{
  displayName: 'Categories', name;
  : 'categories',
  type: 'string',
  default: '',
        displayOptions:
  {
    show: {
      operation: ['classify'],
    }
    ,
  }
  ,
        description: 'Available categories for classification (comma-separated)',
        placeholder: 'positive, negative, neutral',
}
,
{
  displayName: 'Temperature', name;
  : 'temperature',
  type: 'number',
  default: 1.0,
        min: 0,
        max: 2,
        description: 'Sampling temperature (0 = deterministic, 2 = very creative)',
}
,
{
  displayName: 'Max Tokens', name;
  : 'maxTokens',
  type: 'number',
  default: 150,
        min: 1,
        max: 4000,
        description: 'Maximum tokens in the response',
}
,
{
  displayName: 'Top P', name;
  : 'topP',
  type: 'number',
  default: 1.0,
        min: 0,
        max: 1,
        description: 'Nucleus sampling parameter',
}
,
{
  displayName: 'Frequency Penalty', name;
  : 'frequencyPenalty',
  type: 'number',
  default: 0,
        min: -2,
        max: 2,
        description: 'Penalty for token frequency',
}
,
{
        displayName: 'Presence Penalty',
        name: 'presencePenalty',
        type: 'number',
        default: 0,
        min: -2,
        max: 2,
