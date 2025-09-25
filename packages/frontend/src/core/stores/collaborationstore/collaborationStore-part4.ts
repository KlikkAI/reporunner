collaborationService.addEventListener('operation_sent', (operation: CollaborationOperation) => {
  set((state) => ({
    pendingOperations: [...state.pendingOperations, operation],
  }));
});

// Conflict events
collaborationService.addEventListener('conflict_detected', (conflict: CollaborationConflict) => {
  set((state) => ({
    activeConflicts: [...state.activeConflicts, conflict],
    conflictResolutionMode: true,
  }));
});

// Comment events
collaborationService.addEventListener('comment_added', (comment: CollaborationComment) => {
  set((state) => ({
    comments: [...state.comments, comment],
    activeComments: comment.resolved ? state.activeComments : [...state.activeComments, comment],
  }));
});

collaborationService.addEventListener('comment_updated', (comment: CollaborationComment) => {
  set((state) => ({
    comments: state.comments.map((c) => (c.id === comment.id ? comment : c)),
    activeComments: comment.resolved
      ? state.activeComments.filter((c) => c.id !== comment.id)
      : state.activeComments.map((c) => (c.id === comment.id ? comment : c)),
  }));
});

collaborationService.addEventListener('reply_added', ({ commentId, reply }: any) => {
  set((state) => ({
    comments: state.comments.map((comment) =>
      comment.id === commentId ? { ...comment, replies: [...comment.replies, reply] } : comment
    ),
  }));
});
}

// Subscribe to workflow changes to send operations
if (typeof window !== 'undefined') {
  // We'll integrate this with the workflow store to automatically
  // send operations when the workflow changes

  let collaborationTimeout: NodeJS.Timeout;

  useCollaborationStore.subscribe(
    (state) => ({
      isConnected: state.isConnected,
      currentSession: state.currentSession,
    }),
    ({ isConnected, currentSession }) => {
      if (isConnected && currentSession) {
        // Set up auto-sync
        clearTimeout(collaborationTimeout);
        collaborationTimeout = setTimeout(() => {
          // Periodic presence heartbeat
          const store = useCollaborationStore.getState();
          if (store.myPresence) {
            collaborationService.updatePresence(store.myPresence);
          }
        }, 5000);
      }
    }
  );
}
