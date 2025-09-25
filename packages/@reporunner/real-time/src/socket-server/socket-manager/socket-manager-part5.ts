// Broadcast to all including sender for confirmation
this.io.to(`workflow:${workflowId}`).emit('comment:added', comment);
}

  private handleCommentReply(socket: Socket, data: any): void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  const reply = {
    id: `reply-${Date.now()}`,
    ...data,
    userId: user.sub,
    userName: user.email,
    timestamp: new Date(),
  };

  this.io.to(`workflow:${workflowId}`).emit('comment:replied', reply);
}

private
handleCommentResolve(socket: Socket, data: any)
: void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  this.io.to(`workflow:${workflowId}`).emit('comment:resolved', {
    ...data,
    resolvedBy: user.sub,
    resolvedAt: new Date(),
  });
}

private
handleTypingStart(socket: Socket, data: { nodeId: string;
field: string;
}): void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;
  const sessionId = socket.data.sessionId;

  if (!workflowId) return;

  socket.to(`workflow:${workflowId}`).emit('typing:started', {
    ...data,
    userId: user.sub,
    userName: user.email,
    sessionId,
  });
}

private
handleTypingStop(socket: Socket, data: { nodeId: string;
field: string;
}): void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;
  const sessionId = socket.data.sessionId;

  if (!workflowId) return;

  socket.to(`workflow:${workflowId}`).emit('typing:stopped', {
    ...data,
    userId: user.sub,
    sessionId,
  });
}

private
handleLeaveWorkflow(socket: Socket)
: void
{
  const workflowId = socket.data.workflowId;
  const sessionId = socket.data.sessionId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  // Leave room
  socket.leave(`workflow:${workflowId}`);

  // Remove presence
  this.presenceTracker.removeUser(workflowId, sessionId);

  // Notify others
  socket.to(`workflow:${workflowId}`).emit('user:left', {
    userId: user.sub,
    sessionId,
  });

  // Clean up session
  this.sessions.delete(sessionId);
}

private
handleDisconnect(socket: Socket)
: void
{
    const sessionId = socket.data.sessionId;
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (sessionId && workflowId) {
      // Remove from presence tracking
      this.presenceTracker.removeUser(workflowId, sessionId);

      // Notify others in the workflow
      socket.to(`workflow:${workflowId}`).emit('user:disconnected', {
        userId: user?.sub,
        sessionId,
