const table = this.getNodeParameter('table', '') as string;
const columns = this.getNodeParameter('columns', '*') as string;
const where = this.getNodeParameter('where', '') as string;
const limit = this.getNodeParameter('limit', 100) as number;

// Mock SELECT results
for (let i = 0; i < Math.min(5, limit); i++) {
  mockResults.push({
    json: {
      id: i + 1,
      table: table,
      columns: columns,
      where: where,
      database: database,
      operation: 'select',
      mockData: `Sample record ${i + 1}`,
      timestamp: new Date().toISOString(),
    },
  });
}
break;
}

      case 'insert':
{
  const table = this.getNodeParameter('table', '') as string;
  const data = this.getNodeParameter('data', '{}') as string;

  let parsedData;
  try {
    parsedData = JSON.parse(data);
  } catch (err) {
    parsedData = { error: 'Invalid JSON data', err };
  }

  mockResults.push({
    json: {
      operation: 'insert',
      table: table,
      database: database,
      insertedData: parsedData,
      insertedId: Math.floor(Math.random() * 10000),
      rowsAffected: 1,
      timestamp: new Date().toISOString(),
    },
  });
  break;
}

case 'update':
{
  const table = this.getNodeParameter('table', '') as string;
  const data = this.getNodeParameter('data', '{}') as string;
  const where = this.getNodeParameter('where', '') as string;

  let parsedData;
  try {
    parsedData = JSON.parse(data);
  } catch (err) {
    parsedData = { error: 'Invalid JSON data', err };
  }

  mockResults.push({
    json: {
      operation: 'update',
      table: table,
      database: database,
      updatedData: parsedData,
      where: where,
      rowsAffected: Math.floor(Math.random() * 5) + 1,
      timestamp: new Date().toISOString(),
    },
  });
  break;
}

case 'delete':
{
  const table = this.getNodeParameter('table', '') as string;
  const where = this.getNodeParameter('where', '') as string;

  mockResults.push({
    json: {
      operation: 'delete',
      table: table,
      database: database,
      where: where,
      rowsAffected: Math.floor(Math.random() * 3) + 1,
      timestamp: new Date().toISOString(),
    },
  });
  break;
}

case 'query':
{
        const query = this.getNodeParameter('query', '') as string;

        mockResults.push({
          json: {
            operation: 'query',
            database: database,
            query: query,
            result: 'Custom query executed successfully',
