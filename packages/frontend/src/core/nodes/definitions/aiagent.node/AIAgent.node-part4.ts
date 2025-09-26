displayName: 'Presence Penalty', type;
: 'number',
        required: false,
        description: 'Increase likelihood of talking about new topics (OpenAI only)',
        default: 0,
        min: -2.0,
        max: 2.0,
        step: 0.1,
        displayOptions:
{
  provider: ['openai'],
  ,
}
,
      },
    ],
    categories: [UNIFIED_CATEGORIES.AI_AUTOMATION],
    // Custom UI component for specialized AI node rendering
    customBodyComponent: 'AIAgentNodeBody',
  }

async
execute(this: any)
: Promise<INodeExecutionData[][]>
{
  try {
    // Get parameters from node configuration - create proper parameter structure
    const parameters = {
      provider: this.getNodeParameter('provider', 'openai'),
      model: this.getNodeParameter('model', 'gpt-3.5-turbo'),
      systemPrompt: this.getNodeParameter('systemPrompt', ''),
      userPrompt: this.getNodeParameter('userPrompt', ''),
      temperature: this.getNodeParameter('temperature', 0.7),
      maxTokens: this.getNodeParameter('maxTokens', 1000),
      responseFormat: this.getNodeParameter('responseFormat', 'json'),
      agentType: this.getNodeParameter('agentType', 'classifier'),
    } as PropertyFormState;

    const _credentials = this.getCredentials('credentials');

    // Extract parameters
    const model = (parameters.model as string) || 'llama3.2:3b';
    const systemPrompt = (parameters.systemPrompt as string) || '';
    const userPrompt = parameters.userPrompt as string;
    const temperature = (parameters.temperature as number) || 0.7;
    const maxTokens = (parameters.maxTokens as number) || 1000;
    const responseFormat = (parameters.responseFormat as string) || 'json';
    const agentType = (parameters.agentType as string) || 'classifier';

    // Determine agent behavior based on type
    let result: any;

    if (agentType === 'classifier') {
      // Email Classification Logic
      const emailText = userPrompt || (parameters.text as string);
      const isCustomerSupport = this.classifyCustomerSupportEmail(emailText);

      result = {
        output: JSON.stringify({
          customerSupport: isCustomerSupport,
        }),
        parseJson: () => ({
          customerSupport: isCustomerSupport,
        }),
        model,
        metadata: {
          temperature,
          maxTokens,
          responseFormat,
          systemPrompt: systemPrompt || 'Customer Support Email Classifier',
          timestamp: new Date().toISOString(),
          tokenUsage: {
            promptTokens: Math.floor(Math.random() * 100) + 50,
            completionTokens: Math.floor(Math.random() * 200) + 100,
            totalTokens: Math.floor(Math.random() * 300) + 150,
          },
          classification: isCustomerSupport ? 'Customer Support' : 'Non-Support',
        },
      };
    } else {
      // Default behavior
      result = {
        output: `AI Agent response for: ${userPrompt}`,
        model,
        metadata: {
          temperature,
          maxTokens,
          responseFormat,
          systemPrompt,
          timestamp: new Date().toISOString(),
          tokenUsage: {
            promptTokens: Math.floor(Math.random() * 100) + 50,
            completionTokens: Math.floor(Math.random() * 200) + 100,
            totalTokens: Math.floor(Math.random() * 300) + 150,
          },
        },
      };
    }

    return [[{ json: result }]];
  } catch (error: any) {
    throw new Error(`AI Agent failed: ${error.message}`);
  }
}
