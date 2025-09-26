value: 'sentence-transformers/all-MiniLM-L6-v2', displayOptions;
:
{
  provider: ['huggingface', 'local'],
  ,
}
,
          },
{
  name: 'all-mpnet-base-v2', value;
  : 'sentence-transformers/all-mpnet-base-v2',
            displayOptions:
      provider: ['huggingface', 'local'],
    ,
  ,
}
,
{
  name: 'embed-english-v3.0', value;
  : 'embed-english-v3.0',
            displayOptions:
      provider: ['cohere'],
    ,
  ,
}
,
        ],
        description: 'Embedding model to use',
      },
{
  displayName: 'Text Field', name;
  : 'textField',
  type: 'string',
  default: 'text',
        required: true,
        description: 'Field containing the text to embed',
        placeholder: 'text, content, description',
}
,
{
  displayName: 'Batch Size', name;
  : 'batchSize',
  type: 'number',
  default: 10,
        min: 1,
        max: 100,
        description: 'Number of texts to process in each batch',
}
,
{
  displayName: 'Normalize Embeddings', name;
  : 'normalize',
  type: 'boolean',
  default: true,
        description: 'Normalize embeddings to unit length',
}
,
{
  displayName: 'Include Metadata', name;
  : 'includeMetadata',
  type: 'boolean',
  default: true,
        description: 'Include embedding metadata in output',
}
,
{
  displayName: 'Dimensions', name;
  : 'dimensions',
  type: 'number',
  default: 1536,
        min: 1,
        max: 3072,
        displayOptions:
      provider: ['openai'], model
  : ['text-embedding-3-small', 'text-embedding-3-large'],
    ,
  ,
        description: 'Number of dimensions for the embedding (OpenAI v3 models only)',
}
,
    ],
    categories: ['AI/Automation'],
  }

async
execute(this: any)
: Promise<INodeExecutionData[][]>
{
    const inputData = this.getInputData();
    const provider = this.getNodeParameter('provider', 'openai') as string;
    const model = this.getNodeParameter('model', 'text-embedding-ada-002') as string;
    const textField = this.getNodeParameter('textField', 'text') as string;
    const batchSize = this.getNodeParameter('batchSize', 10) as number;
    const normalize = this.getNodeParameter('normalize', true) as boolean;
    const includeMetadata = this.getNodeParameter('includeMetadata', true) as boolean;
    const dimensions = this.getNodeParameter('dimensions', 1536) as number;

    const results: INodeExecutionData[] = [];

    // Process input data in batches
    for (let i = 0; i < inputData.length; i += batchSize) {
      const batch = inputData.slice(i, i + batchSize);

      for (const item of batch) {
        const textToEmbed = item.json[textField] || '';

        if (!textToEmbed) {
          results.push({
