// Notify others in the room
socket.to(`workflow:${workflowId}`).emit('user:joined', {
  userId: user.sub,
  userName: user.email,
  userColor: session.userColor,
  sessionId,
});

// Send current state to joining user
socket.emit('workflow:state', {
  collaborators,
  // Include current workflow state if needed
});
}

  private handleCursorMove(socket: Socket, data:
{
  x: number;
  y: number;
  nodeId?: string
}
): void
{
  const sessionId = socket.data.sessionId;
  const workflowId = socket.data.workflowId;
  const session = this.sessions.get(sessionId);

  if (!session || !workflowId) return;

  // Update session cursor
  session.cursor = data;
  session.lastActivity = new Date();

  // Broadcast to others in the room
  socket.to(`workflow:${workflowId}`).emit('cursor:moved', {
    userId: session.userId,
    sessionId,
    cursor: data,
  });
}

private
handleSelectionChange(
    socket: Socket,
    data: { nodeIds: string[];
edgeIds: string[]
}
  ): void
{
  const sessionId = socket.data.sessionId;
  const workflowId = socket.data.workflowId;
  const session = this.sessions.get(sessionId);

  if (!session || !workflowId) return;

  // Update session selection
  session.selection = data;
  session.lastActivity = new Date();

  // Broadcast to others
  socket.to(`workflow:${workflowId}`).emit('selection:changed', {
    userId: session.userId,
    sessionId,
    selection: data,
  });
}

private
async;
handleOperation(socket: Socket, operation: any)
: Promise<void>
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  try {
    // Apply operational transform
    const transformedOp = await this.operationalTransform.transform(
      workflowId,
      operation,
      user.sub
    );

    // Apply operation to workflow
    await this.applyOperationToWorkflow(workflowId, transformedOp);

    // Broadcast to all clients including sender
    this.io.to(`workflow:${workflowId}`).emit('operation:applied', {
      operation: transformedOp,
      userId: user.sub,
      timestamp: new Date(),
    });
  } catch (error) {
    socket.emit('operation:error', {
      message: 'Failed to apply operation',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

private
handleNodeAdd(socket: Socket, data: any)
: void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  // Broadcast node addition
  socket.to(`workflow:${workflowId}`).emit('node:added', {
    ...data,
    userId: user.sub,
    timestamp: new Date(),
  });
}
