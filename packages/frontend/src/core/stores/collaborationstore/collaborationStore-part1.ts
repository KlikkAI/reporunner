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
