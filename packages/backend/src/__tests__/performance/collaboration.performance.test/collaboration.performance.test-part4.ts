})

const queryEnd = Date.now();
const queryDuration = queryEnd - queryStart;

expect(queryDuration).toBeLessThan(1000);

console.log(`Created ${sessionCount} sessions in ${duration}ms, queried in ${queryDuration}ms`);
}, 10000)
})

describe('Operation Performance', () =>
{
    it('should handle high-frequency operations efficiently', async () => {
      const operationCount = 5000;
      const sessionId = 'perf-session-operations';
      const startTime = Date.now();

      // Create operations in batches
      const batchSize = 200;
      const batches = Math.ceil(operationCount / batchSize);

      for (let i = 0; i < batches; i++) {
        const batchOperations = [];
        const start = i * batchSize;
        const end = Math.min(start + batchSize, operationCount);

        for (let j = start; j < end; j++) {
          const operationType = [
            'node_add',
            'node_update',
            'node_delete',
            'edge_add',
            'edge_update',
            'edge_delete',
          ][j % 6];

          batchOperations.push({
            sessionId,
            workflowId: testWorkflowId,
            authorId: testUser._id,
            type: operationType,
            target: {
              type: operationType.startsWith('node') ? 'node' : 'edge',
              id: `${operationType.startsWith('node') ? 'node' : 'edge'}-${j}`,
            },
            data: {
              name: `Operation ${j}`,
              position: { x: j % 100, y: Math.floor(j / 100) * 50 },
            },
            status: ['pending', 'applied', 'failed'][j % 3],
            version: j + 1,
            timestamp: new Date(Date.now() - Math.random() * 60000), // Random timestamp within last minute
          });
        }

        await Operation.insertMany(batchOperations);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle high-frequency operations efficiently
      expect(duration).toBeLessThan(10000);

      // Test operation queries
      const queryStart = Date.now();

      // Recent operations
      const _recentOps = await Operation.find({
        sessionId,
        timestamp: { $gte: new Date(Date.now() - 30000) },
      })
        .sort({ timestamp: -1 })
        .limit(100);

      // Operations by type
      const _nodeOps = await Operation.find({
        sessionId,
        type: { $regex: '^node_' },
      }).limit(1000);

      // Operations by status
      const _appliedOps = await Operation.find({
        sessionId,
        status: 'applied',
      }).limit(1000);

      const queryEnd = Date.now();
      const queryDuration = queryEnd - queryStart;

      expect(queryDuration).toBeLessThan(2000);

      console.log(
        `Created ${operationCount} operations in ${duration}ms (${((operationCount / duration) * 1000).toFixed(2)} ops/sec)`
      );
      console.log(`Queried operations in ${queryDuration}ms`);
    }, 15000);
