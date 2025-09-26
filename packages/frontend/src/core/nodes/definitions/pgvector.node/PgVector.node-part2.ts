},
        },
      },
{
  name: 'distanceStrategy', displayName;
  : 'Distance Strategy',
  type: 'select', required;
  : false,
        description: 'Method for calculating vector similarity',
        default: 'cosine',
        options: [
    name: 'Cosine Similarity', value
  : 'cosine'
  ,
    name: 'Euclidean Distance', value
  : 'euclidean'
  ,
    name: 'Inner Product', value
  : 'inner_product'
  ,
        ],
        displayOptions:
      operation: ['search'],
    ,
  ,
}
,
{
  name: 'threshold', displayName;
  : 'Similarity Threshold',
  type: 'number', required;
  : false,
        description: 'Minimum similarity score for results',
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
        displayOptions:
      operation: ['search'],
    ,
  ,
}
,
{
  name: 'idColumn', displayName;
  : 'ID Column',
  type: 'string', required;
  : false,
        description: 'Column name for unique identifiers',
        default: 'id',
        placeholder: 'id',
}
,
{
  name: 'whereClause', displayName;
  : 'WHERE Clause',
  type: 'text', required;
  : false,
        description: 'Additional SQL WHERE conditions',
        default: '',
        placeholder: "category = 'example' AND created_at > '2024-01-01'",
        rows: 2,
        displayOptions:
      operation: ['search', 'delete'],
    ,
  ,
}
,
    ],
    categories: [UNIFIED_CATEGORIES.DATA_STORAGE],
  }

async
execute(this: any)
: Promise<INodeExecutionData[][]>
{
    const parameters = this.getNodeParameter('parameters'); // Assuming parameters are passed as a single object

    // Extract parameters
    const operation = (parameters.operation as string) || 'search';
    const tableName = (parameters.tableName as string) || 'customerSuppertDocs';
    const vectorColumn = (parameters.vectorColumn as string) || 'embedding';
    const vector = parameters.vector as string;
    const metadata = (parameters.metadata as string) || '{}';
    const limit = (parameters.limit as number) || 5;
    const distanceStrategy = (parameters.distanceStrategy as string) || 'cosine';
    const threshold = (parameters.threshold as number) || 0.7;
    const idColumn = (parameters.idColumn as string) || 'id';
    const whereClause = (parameters.whereClause as string) || '';

    const inputData = this.getInputData();
    const results: INodeExecutionData[] = [];

    // Process each input item
    for (let i = 0; i < inputData.length; i++) {
      const item = inputData[i];

      // Replace {{input}} placeholders with actual input data
      let processedVector = vector;
      if (processedVector.includes('{{input}}')) {
        const inputContent =
          typeof item.json === 'object' ? JSON.stringify(item.json) : String(item.json);
        processedVector = processedVector.replace(/\{\{input\}\}/g, inputContent);
      }

      const result: any = {
        operation,
        tableName,
        vectorColumn,
        idColumn,
