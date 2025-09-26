private
setupEventHandlers();
: void
{
  this.io.on('connection', (socket: Socket) => {
    const _user = socket.data.user as IJwtPayload;
    const _sessionId = socket.data.sessionId;

    // Handle workflow room joining
    socket.on('join:workflow', async (data: { workflowId: string }) => {
      await this.handleJoinWorkflow(socket, data.workflowId);
    });

    // Handle cursor movement
    socket.on('cursor:move', (data: { x: number; y: number; nodeId?: string }) => {
      this.handleCursorMove(socket, data);
    });

    // Handle selection changes
    socket.on('selection:change', (data: { nodeIds: string[]; edgeIds: string[] }) => {
      this.handleSelectionChange(socket, data);
    });

    // Handle workflow operations (with OT)
    socket.on('operation:apply', async (operation: any) => {
      await this.handleOperation(socket, operation);
    });

    // Handle node operations
    socket.on('node:add', (data: any) => this.handleNodeAdd(socket, data));
    socket.on('node:update', (data: any) => this.handleNodeUpdate(socket, data));
    socket.on('node:delete', (data: any) => this.handleNodeDelete(socket, data));
    socket.on('node:move', (data: any) => this.handleNodeMove(socket, data));

    // Handle edge operations
    socket.on('edge:add', (data: any) => this.handleEdgeAdd(socket, data));
    socket.on('edge:update', (data: any) => this.handleEdgeUpdate(socket, data));
    socket.on('edge:delete', (data: any) => this.handleEdgeDelete(socket, data));

    // Handle comments
    socket.on('comment:add', (data: any) => this.handleCommentAdd(socket, data));
    socket.on('comment:reply', (data: any) => this.handleCommentReply(socket, data));
    socket.on('comment:resolve', (data: any) => this.handleCommentResolve(socket, data));

    // Handle typing indicators
    socket.on('typing:start', (data: { nodeId: string; field: string }) => {
      this.handleTypingStart(socket, data);
    });
    socket.on('typing:stop', (data: { nodeId: string; field: string }) => {
      this.handleTypingStop(socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    // Handle leaving workflow
    socket.on('leave:workflow', () => {
      this.handleLeaveWorkflow(socket);
    });
  });
}

private
async;
handleJoinWorkflow(socket: Socket, workflowId: string)
: Promise<void>
{
    const user = socket.data.user as IJwtPayload;
    const sessionId = socket.data.sessionId;

    // Check permissions
    if (!this.checkWorkflowAccess(user, workflowId)) {
      socket.emit('error', { message: 'Access denied to workflow' });
      return;
    }

    // Join room
    await socket.join(`workflow:${workflowId}`);
    socket.data.workflowId = workflowId;

    // Create collaboration session
    const session: CollaborationSession = {
      workflowId,
      userId: user.sub,
      userName: user.email,
      userColor: this.generateUserColor(user.sub),
      isActive: true,
      lastActivity: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Track presence
    await this.presenceTracker.addUser(workflowId, {
      userId: user.sub,
      sessionId,
      socketId: socket.id,
      userName: user.email,
      userColor: session.userColor,
      joinedAt: new Date(),
    });

    // Get current collaborators
    const collaborators = await this.presenceTracker.getUsers(workflowId);
