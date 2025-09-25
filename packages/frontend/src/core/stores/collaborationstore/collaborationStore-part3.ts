resolveConflict: async (conflictId: string, resolution: any) => {
  const state = get();
  if (!state.isConnected) {
    throw new Error('Not connected to collaboration session');
  }
  await collaborationService.resolveConflict(conflictId, resolution);

  set(() => ({
    activeConflicts: state.activeConflicts.filter((conflict) => conflict.id !== conflictId),
    conflictResolutionMode: state.activeConflicts.length <= 1,
  }));
},
  selectComment;
: (commentId: string | null) =>
{
  set({ selectedCommentId: commentId });
}
,

    toggleCollaborationPanel: () =>
{
  set((state) => ({
    collaborationPanelOpen: !state.collaborationPanelOpen,
  }));
}
,

    toggleCommentMode: () =>
{
  set((state) => ({ commentMode: !state.commentMode }));
}
,

    toggleUserCursors: () =>
{
  set((state) => ({ showUserCursors: !state.showUserCursors }));
}
,

    toggleUserSelections: () =>
{
  set((state) => ({ showUserSelections: !state.showUserSelections }));
}
,

    toggleComments: () =>
{
  set((state) => ({ showComments: !state.showComments }));
}
,
  }))
)

// Set up collaboration event listeners
function setupCollaborationEventListeners(
  set: (fn: (state: CollaborationState) => Partial<CollaborationState>) => void
  // get accessor for state retrieval (used by UI components)
): void {
  // Connection events
  collaborationService.addEventListener('connected', () => {
    set(() => ({
      isConnected: true,
      connectionStatus: 'connected',
      lastSyncTimestamp: new Date().toISOString(),
    }));
  });

  collaborationService.addEventListener('disconnected', (_reason: string) => {
    set(() => ({
      isConnected: false,
      connectionStatus: 'disconnected',
    }));
  });

  collaborationService.addEventListener('connection_error', (_error: Error) => {
    set(() => ({
      isConnected: false,
      connectionStatus: 'disconnected',
    }));
  });

  // User events
  collaborationService.addEventListener('user_joined', (_user: CollaborationUser) => {});

  collaborationService.addEventListener('user_left', (userId: string) => {
    set((state) => ({
      userPresences: state.userPresences.filter((presence) => presence.userId !== userId),
    }));
  });

  // Presence events
  collaborationService.addEventListener('presence_update', (presence: UserPresence) => {
    set((state) => ({
      userPresences: state.userPresences
        .map((p) => (p.userId === presence.userId ? presence : p))
        .concat(state.userPresences.find((p) => p.userId === presence.userId) ? [] : [presence]),
    }));
  });

  // Operation events
  collaborationService.addEventListener(
    'operation_received',
    (operation: CollaborationOperation) => {
      set((state) => ({
        operationHistory: [...state.operationHistory, operation],
        pendingOperations: state.pendingOperations.filter((op) => op.id !== operation.id),
        lastSyncTimestamp: new Date().toISOString(),
      }));
    }
  );
