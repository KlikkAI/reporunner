connectionStatus: 'connecting', currentUser;
: user,
      })

try {
  // Set up event listeners before initializing
  const state = get();
  if (!state.isConnected) {
    setupCollaborationEventListeners(set);
  }

  const session = await collaborationService.initializeSession(workflowId, user, serverUrl);

  set({
    isConnected: true,
    connectionStatus: 'connected',
    currentSession: session,
    lastSyncTimestamp: new Date().toISOString(),
  });
} catch (error) {
  set({
    connectionStatus: 'disconnected',
    isConnected: false,
  });
  throw error;
}
},

    leaveSession: async () =>
{
  try {
    await collaborationService.leaveSession();
    set({
      isConnected: false,
      connectionStatus: 'disconnected',
      currentSession: null,
      userPresences: [],
      operationHistory: [],
      pendingOperations: [],
      comments: [],
      activeComments: [],
      activeConflicts: [],
      lastSyncTimestamp: null,
      collaborationPanelOpen: false,
    });
  } catch (_error) {}
}
,

    updatePresence: (presence: Partial<UserPresence>) =>
{
  set({ myPresence: presence });
  collaborationService.updatePresence(presence);
}
,

    sendOperation: async (operation: Omit<CollaborationOperation, 'id' | 'timestamp'>) =>
{
  const state = get();
  if (!state.isConnected) {
    throw new Error('Not connected to collaboration session');
  }
  await collaborationService.sendOperation(operation);
}
,

    addComment: async (
      comment: Omit<CollaborationComment, 'id' | 'timestamp' | 'author' | 'replies'>
    ) =>
{
  const state = get();
  if (!state.isConnected) {
    throw new Error('Not connected to collaboration session');
  }
  const newComment = await collaborationService.addComment(comment);
  set(() => ({
    comments: [...state.comments, newComment],
    activeComments: newComment.resolved
      ? state.activeComments
      : [...state.activeComments, newComment],
    commentMode: false, // Exit comment mode after adding
  }));
}
,

    replyToComment: async (commentId: string, content: string, mentions: string[] = []) =>
{
  const state = get();
  if (!state.isConnected) {
    throw new Error('Not connected to collaboration session');
  }
  const reply = await collaborationService.replyToComment(commentId, content, mentions);

  set(() => ({
    comments: state.comments.map((comment) =>
      comment.id === commentId ? { ...comment, replies: [...comment.replies, reply] } : comment
    ),
  }));
}
,

    resolveComment: (commentId: string) =>
{
  set((state) => ({
    comments: state.comments.map((comment) =>
      comment.id === commentId ? { ...comment, resolved: true } : comment
    ),
    activeComments: state.activeComments.filter((comment) => comment.id !== commentId),
    selectedCommentId: state.selectedCommentId === commentId ? null : state.selectedCommentId,
  }));
}
,
