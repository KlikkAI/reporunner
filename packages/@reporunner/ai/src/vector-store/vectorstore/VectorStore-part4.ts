const result = await client.query(sql, queryParams);
return parseInt(result.rows[0].count, 10);
} finally
{
  client.release();
}
} catch (error)
{
  throw new VectorStoreError(`Failed to get document count: ${error}`);
}
}

  /**
   * Close the connection pool
   */
  async close(): Promise<void>
{
  await this.pool.end();
}

/**
 * Parse vector string to number array
 */
private
parseVector(vectorString: string)
: number[]
{
  // Remove brackets and parse as array
  const cleanString = vectorString.replace(/^\[|\]$/g, '');
  return cleanString.split(',').map((n) => parseFloat(n.trim()));
}
}
