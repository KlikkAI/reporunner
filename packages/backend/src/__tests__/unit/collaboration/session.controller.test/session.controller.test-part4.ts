role: 'owner',
},
        ],
        isActive: false,
      })

mockReq.params =
{
  userId: testUser._id.toString();
}
mockReq.query = { active: 'true' };

await sessionController.getUserSessions(mockReq as Request, mockRes as Response);

const call = (mockRes.json as any).mock.calls[0][0];
expect(call.data.sessions).toHaveLength(1);
expect(call.data.sessions[0].sessionId).toBe('active-session');
})
})

describe('getSessionOperations', () =>
{
    it('should return operations for a session', async () => {
      const sessionId = 'test-session-123';

      // Create test operations
      await Operation.create({
        sessionId,
        workflowId: testWorkflowId,
        authorId: testUser._id,
        type: 'node_add',
        target: { type: 'node', id: 'node1' },
        data: { name: 'Test Node' },
        status: 'applied',
      });

      await Operation.create({
        sessionId,
        workflowId: testWorkflowId,
        authorId: testUser._id,
        type: 'edge_add',
        target: { type: 'edge', id: 'edge1' },
        data: { source: 'node1', target: 'node2' },
        status: 'applied',
      });

      mockReq.params = { sessionId };
      mockReq.query = { limit: '50', page: '1' };

      await sessionController.getSessionOperations(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            operations: expect.arrayContaining([
              expect.objectContaining({
                type: 'node_add',
                status: 'applied',
              }),
              expect.objectContaining({
                type: 'edge_add',
                status: 'applied',
              }),
            ]),
            pagination: expect.objectContaining({
              total: 2,
            }),
          }),
        })
      );
    });

    it('should filter operations by status', async () => {
      const sessionId = 'test-session-123';

      await Operation.create({
        sessionId,
        workflowId: testWorkflowId,
        authorId: testUser._id,
        type: 'node_add',
        target: { type: 'node', id: 'node1' },
        data: { name: 'Applied Node' },
        status: 'applied',
      });

      await Operation.create({
        sessionId,
        workflowId: testWorkflowId,
        authorId: testUser._id,
        type: 'node_add',
        target: { type: 'node', id: 'node2' },
        data: { name: 'Pending Node' },
        status: 'pending',
      });

      mockReq.params = { sessionId };
      mockReq.query = { status: 'applied' };

      await sessionController.getSessionOperations(mockReq as Request, mockRes as Response);

      const call = (mockRes.json as any).mock.calls[0][0];
      expect(call.data.operations).toHaveLength(1);
      expect(call.data.operations[0].status).toBe('applied');
