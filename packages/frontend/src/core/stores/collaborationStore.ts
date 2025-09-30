/**
 * Collaboration Store
 *
 * Manages real-time collaboration features for workflow editing
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
}

interface UserPresence {
  userId: string;
  user: User;
  cursor?: { x: number; y: number };
  selectedNodes?: string[];
  lastActive: string;
  status: 'active' | 'away' | 'offline';
}

interface Comment {
  id: string;
  userId: string;
  user: User;
  content: string;
  timestamp: string;
  position: { x: number; y: number };
  nodeId?: string;
  replies?: Comment[];
  resolved: boolean;
}

interface CollaborationState {
  // Current user
  currentUser: User | null;

  // User presence
  connectedUsers: Map<string, UserPresence>;
  userPresences: UserPresence[];

  // Comments and annotations
  comments: Map<string, Comment>;
  activeComments: Comment[];
  selectedComment: string | null;

  // Real-time collaboration
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';

  // Actions
  setCurrentUser: (user: User) => void;
  updateUserPresence: (userId: string, presence: Partial<UserPresence>) => void;
  removeUser: (userId: string) => void;
  addComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => string;
  updateComment: (commentId: string, updates: Partial<Comment>) => void;
  deleteComment: (commentId: string) => void;
  resolveComment: (commentId: string) => void;
  setSelectedComment: (commentId: string | null) => void;
  setConnectionStatus: (status: CollaborationState['connectionStatus']) => void;
}

export const useCollaborationStore = create<CollaborationState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentUser: null,
    connectedUsers: new Map(),
    userPresences: [],
    comments: new Map(),
    activeComments: [],
    selectedComment: null,
    isConnected: false,
    connectionStatus: 'disconnected',

    // Set current user
    setCurrentUser: (user: User): void => {
      set({ currentUser: user });
    },

    // Update user presence
    updateUserPresence: (userId: string, presence: Partial<UserPresence>): void => {
      set((state) => {
        const existingPresence = state.connectedUsers.get(userId);
        const updatedPresence = existingPresence
          ? { ...existingPresence, ...presence, lastActive: new Date().toISOString() }
          : {
              userId,
              user: presence.user || { id: userId, name: 'Unknown', email: '', color: '#666' },
              lastActive: new Date().toISOString(),
              status: 'active' as const,
              ...presence,
            };

        const newConnectedUsers = new Map(state.connectedUsers);
        newConnectedUsers.set(userId, updatedPresence);

        return {
          connectedUsers: newConnectedUsers,
          userPresences: Array.from(newConnectedUsers.values()),
        };
      });
    },

    // Remove user
    removeUser: (userId: string): void => {
      set((state) => {
        const newConnectedUsers = new Map(state.connectedUsers);
        newConnectedUsers.delete(userId);

        return {
          connectedUsers: newConnectedUsers,
          userPresences: Array.from(newConnectedUsers.values()),
        };
      });
    },

    // Add comment
    addComment: (comment: Omit<Comment, 'id' | 'timestamp'>): string => {
      const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newComment: Comment = {
        ...comment,
        id: commentId,
        timestamp: new Date().toISOString(),
        resolved: false,
        replies: [],
      };

      set((state) => {
        const newComments = new Map(state.comments);
        newComments.set(commentId, newComment);

        return {
          comments: newComments,
          activeComments: Array.from(newComments.values()).filter((c) => !c.resolved),
        };
      });

      return commentId;
    },

    // Update comment
    updateComment: (commentId: string, updates: Partial<Comment>): void => {
      set((state) => {
        const comment = state.comments.get(commentId);
        if (!comment) {
          return state;
        }

        const updatedComment = { ...comment, ...updates };
        const newComments = new Map(state.comments);
        newComments.set(commentId, updatedComment);

        return {
          comments: newComments,
          activeComments: Array.from(newComments.values()).filter((c) => !c.resolved),
        };
      });
    },

    // Delete comment
    deleteComment: (commentId: string): void => {
      set((state) => {
        const newComments = new Map(state.comments);
        newComments.delete(commentId);

        return {
          comments: newComments,
          activeComments: Array.from(newComments.values()).filter((c) => !c.resolved),
          selectedComment: state.selectedComment === commentId ? null : state.selectedComment,
        };
      });
    },

    // Resolve comment
    resolveComment: (commentId: string): void => {
      get().updateComment(commentId, { resolved: true });
    },

    // Set selected comment
    setSelectedComment: (commentId: string | null): void => {
      set({ selectedComment: commentId });
    },

    // Set connection status
    setConnectionStatus: (status: CollaborationState['connectionStatus']): void => {
      set({
        connectionStatus: status,
        isConnected: status === 'connected',
      });
    },
  }))
);
