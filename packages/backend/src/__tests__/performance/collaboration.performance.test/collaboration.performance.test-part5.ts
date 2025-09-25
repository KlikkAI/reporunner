it('should handle operation conflict resolution efficiently', async () => {
  const conflictOperations = 1000;
  const sessionId = 'conflict-resolution-session';
  const startTime = Date.now();

  // Create operations that might conflict (same targets)
  const operations = [];
  const nodeIds = Array.from({ length: 10 }, (_, i) => `conflict-node-${i}`);

  for (let i = 0; i < conflictOperations; i++) {
    const nodeId = nodeIds[i % nodeIds.length];
    operations.push({
      sessionId,
      workflowId: testWorkflowId,
      authorId: testUser._id,
      type: 'node_update',
      target: { type: 'node', id: nodeId },
      data: {
        name: `Updated name ${i}`,
        properties: { value: i },
      },
      status: 'pending',
      version: i + 1,
      timestamp: new Date(Date.now() + i * 10), // Sequential timestamps
    });
  }

  await Operation.insertMany(operations);

  // Simulate conflict resolution by finding and updating conflicting operations
  const conflictResolutionStart = Date.now();

  for (const nodeId of nodeIds) {
    const conflictingOps = await Operation.find({
      sessionId,
      'target.id': nodeId,
      status: 'pending',
    }).sort({ timestamp: 1 });

    if (conflictingOps.length > 1) {
      // Apply operational transform simulation
      const lastOp = conflictingOps[conflictingOps.length - 1];

      // Mark earlier operations as transformed
      await Operation.updateMany(
        {
          _id: { $in: conflictingOps.slice(0, -1).map((op) => op._id) },
        },
        {
          $set: { status: 'transformed' },
        }
      );

      // Mark last operation as applied
      await Operation.updateOne({ _id: lastOp._id }, { $set: { status: 'applied' } });
    }
  }

  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  const resolutionDuration = endTime - conflictResolutionStart;

  expect(totalDuration).toBeLessThan(8000);
  expect(resolutionDuration).toBeLessThan(3000);

  // Verify conflict resolution
  const appliedOps = await Operation.countDocuments({
    sessionId,
    status: 'applied',
  });
  const transformedOps = await Operation.countDocuments({
    sessionId,
    status: 'transformed',
  });

  expect(appliedOps).toBe(nodeIds.length); // One applied operation per node
  expect(transformedOps).toBe(conflictOperations - nodeIds.length); // Rest are transformed

  console.log(
    `Resolved ${conflictOperations} potentially conflicting operations in ${resolutionDuration}ms`
  );
}, 12000);
})
})
