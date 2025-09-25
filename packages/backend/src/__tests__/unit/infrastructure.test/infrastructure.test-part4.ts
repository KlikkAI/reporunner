Comment.find({
          workflowId: testWorkflowId,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        })
          .sort({ createdAt: -1 })
          .limit(50),
        Comment.aggregate([
          { $match: { workflowId: testWorkflowId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
])

const queryEnd = Date.now();
const queryDuration = queryEnd - queryStart;

// Queries should be fast (under 1 second)
expect(queryDuration).toBeLessThan(1000);

// Verify query results
expect(statusQuery.length).toBeGreaterThan(0);
expect(tagQuery.length).toBeGreaterThan(0);
expect(spatialQuery.length).toBeGreaterThan(0);
expect(recentQuery.length).toBeGreaterThan(0);
expect(aggregateQuery).toHaveLength(3); // 3 status types

console.log(`Executed complex queries in ${queryDuration}ms`);
})
})
})
