private
handleNodeUpdate(socket: Socket, data: any)
: void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  // Check for conflicts
  const isLocked = this.checkNodeLock(workflowId, data.nodeId, user.sub);
  if (isLocked) {
    socket.emit('node:locked', { nodeId: data.nodeId });
    return;
  }

  // Broadcast node update
  socket.to(`workflow:${workflowId}`).emit('node:updated', {
    ...data,
    userId: user.sub,
    timestamp: new Date(),
  });
}

private
handleNodeDelete(socket: Socket, data: any)
: void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  socket.to(`workflow:${workflowId}`).emit('node:deleted', {
    ...data,
    userId: user.sub,
    timestamp: new Date(),
  });
}

private
handleNodeMove(socket: Socket, data: any)
: void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  socket.to(`workflow:${workflowId}`).emit('node:moved', {
    ...data,
    userId: user.sub,
    timestamp: new Date(),
  });
}

private
handleEdgeAdd(socket: Socket, data: any)
: void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  socket.to(`workflow:${workflowId}`).emit('edge:added', {
    ...data,
    userId: user.sub,
    timestamp: new Date(),
  });
}

private
handleEdgeUpdate(socket: Socket, data: any)
: void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  socket.to(`workflow:${workflowId}`).emit('edge:updated', {
    ...data,
    userId: user.sub,
    timestamp: new Date(),
  });
}

private
handleEdgeDelete(socket: Socket, data: any)
: void
{
  const workflowId = socket.data.workflowId;
  const user = socket.data.user as IJwtPayload;

  if (!workflowId) return;

  socket.to(`workflow:${workflowId}`).emit('edge:deleted', {
    ...data,
    userId: user.sub,
    timestamp: new Date(),
  });
}

private
handleCommentAdd(socket: Socket, data: any)
: void
{
    const workflowId = socket.data.workflowId;
    const user = socket.data.user as IJwtPayload;

    if (!workflowId) return;

    const comment = {
      id: `comment-${Date.now()}`,
      ...data,
      userId: user.sub,
      userName: user.email,
      timestamp: new Date(),
    };
