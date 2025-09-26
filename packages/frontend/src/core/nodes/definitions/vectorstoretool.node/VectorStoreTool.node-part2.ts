displayName: 'Embedding Provider', name;
: 'embeddingProvider',
type: 'options',
default: 'openai',
        required: true,
        options: [
{
  name: 'OpenAI', value;
  : 'openai',
}
,
{
  name: 'Hugging Face', value;
  : 'huggingface',
}
,
{
  name: 'Local', value;
  : 'local',
}
,
        ],
        description: 'Embedding model provider for query vectors',
      },
{
  displayName: 'Index Name', name;
  : 'indexName',
  type: 'string',
  default: 'knowledge-base',
        required: true,
        description: 'Vector store index/collection name',
        placeholder: 'knowledge-base, documents, embeddings',
}
,
{
  displayName: 'Query', name;
  : 'query',
  type: 'text',
  default: '',
        required: true,
        displayOptions:
      toolMode: ['semantic-search', 'smart-retrieval', 'qa'],
    ,
  ,
        description: 'Search query or question',
        placeholder: 'What is machine learning? How to implement RAG?',
}
,
{
  displayName: 'Context Field', name;
  : 'contextField',
  type: 'string',
  default: 'content',
        displayOptions:
      toolMode: ['recommendation', 'extraction'],
    ,
  ,
        description: 'Field containing context for recommendations/extraction',
        placeholder: 'content, text, description',
}
,
{
  displayName: 'Max Results', name;
  : 'maxResults',
  type: 'number',
  default: 5,
        min: 1,
        max: 50,
        description: 'Maximum number of results to return',
}
,
{
  displayName: 'Similarity Threshold', name;
  : 'similarityThreshold',
  type: 'number',
  default: 0.7,
        min: 0,
        max: 1,
        description: 'Minimum similarity score for results',
}
,
{
  displayName: 'Include Context', name;
  : 'includeContext',
  type: 'boolean',
  default: true,
        displayOptions:
      toolMode: ['qa', 'smart-retrieval'],
    ,
  ,
        description: 'Include relevant context in the response',
}
,
{
        displayName: 'Context Window',
        name: 'contextWindow',
        type: 'number',
        default: 3,
        min: 1,
        max: 10,
        displayOptions: 
            toolMode: ['qa', 'smart-retrieval'],
            includeContext: [true],,,
