/**
 * Collaboration Store
 *
 * Zustand store for managing real-time collaboration state, including
 * user presence, operations, comments, and conflict resolution.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  CollaborationComment,
  CollaborationConflict,
  CollaborationOperation,
  CollaborationSession,
  CollaborationUser,
  UserPresence,
} from '../services/collaborationService';
import { collaborationService } from '../services/collaborationService';

export interface CollaborationState {
  // Session state
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  currentSession: CollaborationSession | null;
  currentUser: CollaborationUser | null;

  // User presence
  userPresences: UserPresence[];
  myPresence: Partial<UserPresence> | null;

  // Operations and synchronization
  operationHistory: CollaborationOperation[];
  pendingOperations: CollaborationOperation[];
  lastSyncTimestamp: string | null;

  // Comments and annotations
  comments: CollaborationComment[];
  activeComments: CollaborationComment[]; // Non-resolved comments
  selectedCommentId: string | null;

  // Conflicts
  activeConflicts: CollaborationConflict[];
  conflictResolutionMode: boolean;

  // UI state
  showUserCursors: boolean;
  showUserSelections: boolean;
  showComments: boolean;
  collaborationPanelOpen: boolean;
  commentMode: boolean; // For adding new comments

  // Actions
  initializeSession: (
    workflowId: string,
    user: CollaborationUser,
    serverUrl?: string
  ) => Promise<void>;
  leaveSession: () => Promise<void>;
  updatePresence: (presence: Partial<UserPresence>) => void;
  sendOperation: (operation: Omit<CollaborationOperation, 'id' | 'timestamp'>) => Promise<void>;
  addComment: (
    comment: Omit<CollaborationComment, 'id' | 'timestamp' | 'author' | 'replies'>
  ) => Promise<void>;
  replyToComment: (commentId: string, content: string, mentions?: string[]) => Promise<void>;
  resolveComment: (commentId: string) => void;
  resolveConflict: (conflictId: string, resolution: any) => Promise<void>;
  selectComment: (commentId: string | null) => void;
  toggleCollaborationPanel: () => void;
  toggleCommentMode: () => void;
  toggleUserCursors: () => void;
  toggleUserSelections: () => void;
  toggleComments: () => void;
}

export const useCollaborationStore = create<CollaborationState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    connectionStatus: 'disconnected',
    currentSession: null,
    currentUser: null,
    userPresences: [],
    myPresence: null,
    operationHistory: [],
    pendingOperations: [],
    lastSyncTimestamp: null,
    comments: [],
    activeComments: [],
    selectedCommentId: null,
    activeConflicts: [],
    conflictResolutionMode: false,
    showUserCursors: true,
    showUserSelections: true,
    showComments: true,
    collaborationPanelOpen: false,
    commentMode: false,

    // Actions
    initializeSession: async (workflowId: string, user: CollaborationUser, serverUrl?: string) => {
      set({
        connectionStatus: 'connecting',
        currentUser: user,
      });

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

    leaveSession: async () => {
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
    },

    updatePresence: (presence: Partial<UserPresence>) => {
      set({ myPresence: presence });
      collaborationService.updatePresence(presence);
    },

    sendOperation: async (operation: Omit<CollaborationOperation, 'id' | 'timestamp'>) => {
      const state = get();
      if (!state.isConnected) {
        throw new Error('Not connected to collaboration session');
      }
      await collaborationService.sendOperation(operation);
    },

    addComment: async (
      comment: Omit<CollaborationComment, 'id' | 'timestamp' | 'author' | 'replies'>
    ) => {
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
    },

    replyToComment: async (commentId: string, content: string, mentions: string[] = []) => {
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
    },

    resolveComment: (commentId: string) => {
      set((state) => ({
        comments: state.comments.map((comment) =>
          comment.id === commentId ? { ...comment, resolved: true } : comment
        ),
        activeComments: state.activeComments.filter((comment) => comment.id !== commentId),
        selectedCommentId: state.selectedCommentId === commentId ? null : state.selectedCommentId,
      }));
    },

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

    selectComment: (commentId: string | null) => {
      set({ selectedCommentId: commentId });
    },

    toggleCollaborationPanel: () => {
      set((state) => ({
        collaborationPanelOpen: !state.collaborationPanelOpen,
      }));
    },

    toggleCommentMode: () => {
      set((state) => ({ commentMode: !state.commentMode }));
    },

    toggleUserCursors: () => {
      set((state) => ({ showUserCursors: !state.showUserCursors }));
    },

    toggleUserSelections: () => {
      set((state) => ({ showUserSelections: !state.showUserSelections }));
    },

    toggleComments: () => {
      set((state) => ({ showComments: !state.showComments }));
    },
  }))
);

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
