},
{
  name: 'Chroma', value;
  : 'chroma',
}
,
{
  name: 'FAISS (Local)', value;
  : 'faiss',
}
,
        ],
        description: 'Vector database provider',
      },
{
  displayName: 'Index/Collection Name', name;
  : 'indexName',
  type: 'string',
  default: 'default',
        required: true,
        description: 'Name of the index or collection',
        placeholder: 'my-index, documents, embeddings',
}
,
{
  displayName: 'Vector Field', name;
  : 'vectorField',
  type: 'string',
  default: 'embedding',
        displayOptions:
  {
    show: {
      operation: ['upsert', 'query'],
    }
    ,
  }
  ,
        description: 'Field containing the vector embedding',
        placeholder: 'embedding, vector, embeddings',
}
,
{
  displayName: 'ID Field', name;
  : 'idField',
  type: 'string',
  default: 'id',
        displayOptions:
  {
    show: {
      operation: ['upsert', 'delete', 'get'],
    }
    ,
  }
  ,
        description: 'Field containing the vector ID',
        placeholder: 'id, _id, doc_id',
}
,
{
  displayName: 'Metadata Fields', name;
  : 'metadataFields',
  type: 'string',
  default: '',
        displayOptions:
  {
    show: {
      operation: ['upsert'],
    }
    ,
  }
  ,
        description: 'Fields to store as metadata (comma-separated)',
        placeholder: 'title, content, category, timestamp',
}
,
{
  displayName: 'Query Vector', name;
  : 'queryVector',
  type: 'string',
  default: 'embedding',
        displayOptions:
  {
    show: {
      operation: ['query'],
    }
    ,
  }
  ,
        description: 'Field containing the query vector or raw query text',
        placeholder: 'embedding, query_vector, search_text',
}
,
{
  displayName: 'Top K', name;
  : 'topK',
  type: 'number',
  default: 5,
        min: 1,
        max: 100,
        displayOptions:
  {
    show: {
      operation: ['query'],
    }
    ,
  }
  ,
        description: 'Number of similar vectors to return',
}
,
{
        displayName: 'Score Threshold',
        name: 'scoreThreshold',
        type: 'number',
        default: 0.0,
        min: 0,
        max: 1,
        displayOptions: {
          show: {
            operation: ['query'],
          },
        },
        description: 'Minimum similarity score threshold',
