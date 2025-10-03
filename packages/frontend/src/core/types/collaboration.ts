/**
 * Real-time Workflow Collaboration Types
 *
 * Comprehensive collaboration system providing:
 * - Real-time workflow editing with conflict resolution
 * - Live cursor tracking and user presence
 * - Comment system for workflow nodes
 * - Change history and version control
 * - Collaborative debugging sessions
 * - Permission-based collaboration controls
 */

export interface CollaborationSession {
  id: string;
  workflowId: string;
  participants: CollaborationParticipant[];
  status: 'active' | 'paused' | 'ended';
  createdAt: number;
  lastActivityAt: number;
  settings: CollaborationSettings;
  permissions: CollaborationPermissions;
  metadata: Record<string, any>;
}

export interface CollaborationParticipant {
  userId: string;
  userEmail: string;
  userName: string;
  avatar?: string;
  role: CollaborationRole;
  status: 'online' | 'away' | 'offline';
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastSeen: number;
  permissions: ParticipantPermissions;
  metadata: Record<string, any>;
}

export interface CursorPosition {
  x: number;
  y: number;
  nodeId?: string;
  timestamp: number;
}

export interface SelectionRange {
  startNodeId: string;
  endNodeId: string;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  timestamp: number;
}

export interface CollaborationEvent {
  id: string;
  type: CollaborationEventType;
  userId: string;
  workflowId: string;
  timestamp: number;
  data: CollaborationEventData;
  metadata: Record<string, any>;
}

export interface CollaborationEventData {
  // Node events
  nodeCreated?: NodeCreatedEvent;
  nodeUpdated?: NodeUpdatedEvent;
  nodeDeleted?: NodeDeletedEvent;
  nodeMoved?: NodeMovedEvent;

  // Connection events
  connectionCreated?: ConnectionCreatedEvent;
  connectionDeleted?: ConnectionDeletedEvent;

  // Cursor events
  cursorMoved?: CursorMovedEvent;
  selectionChanged?: SelectionChangedEvent;

  // Comment events
  commentAdded?: CommentAddedEvent;
  commentUpdated?: CommentUpdatedEvent;
  commentDeleted?: CommentDeletedEvent;

  // Presence events
  userJoined?: UserJoinedEvent;
  userLeft?: UserLeftEvent;
  userStatusChanged?: UserStatusChangedEvent;

  // Conflict events
  conflictDetected?: ConflictDetectedEvent;
  conflictResolved?: ConflictResolvedEvent;

  // Version events
  versionCreated?: VersionCreatedEvent;
  versionRestored?: VersionRestoredEvent;
}

export interface NodeCreatedEvent {
  nodeId: string;
  nodeType: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
}

export interface NodeUpdatedEvent {
  nodeId: string;
  changes: Record<string, { old: any; new: any }>;
  properties: Record<string, any>;
}

export interface NodeDeletedEvent {
  nodeId: string;
  nodeType: string;
  position: { x: number; y: number };
}

export interface NodeMovedEvent {
  nodeId: string;
  oldPosition: { x: number; y: number };
  newPosition: { x: number; y: number };
}

export interface ConnectionCreatedEvent {
  connectionId: string;
  sourceNodeId: string;
  targetNodeId: string;
  connectionType: string;
}

export interface ConnectionDeletedEvent {
  connectionId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface CursorMovedEvent {
  position: CursorPosition;
  nodeId?: string;
}

export interface SelectionChangedEvent {
  selection: SelectionRange;
  selectedNodes: string[];
}

export interface CommentAddedEvent {
  commentId: string;
  nodeId: string;
  content: string;
  position: { x: number; y: number };
  mentions?: string[];
}

export interface CommentUpdatedEvent {
  commentId: string;
  content: string;
  editedAt: number;
}

export interface CommentDeletedEvent {
  commentId: string;
  nodeId: string;
}

export interface UserJoinedEvent {
  participant: CollaborationParticipant;
}

export interface UserLeftEvent {
  userId: string;
  reason: 'disconnected' | 'kicked' | 'left';
}

export interface UserStatusChangedEvent {
  userId: string;
  oldStatus: CollaborationParticipant['status'];
  newStatus: CollaborationParticipant['status'];
}

export interface ConflictDetectedEvent {
  conflictId: string;
  type: ConflictType;
  nodeId?: string;
  connectionId?: string;
  conflictingChanges: ConflictChange[];
  resolutionStrategy: ConflictResolutionStrategy;
}

export interface ConflictResolvedEvent {
  conflictId: string;
  resolution: ConflictResolution;
  resolvedBy: string;
  resolvedAt: number;
}

export interface VersionCreatedEvent {
  versionId: string;
  versionName: string;
  description: string;
  snapshot: WorkflowSnapshot;
}

export interface VersionRestoredEvent {
  versionId: string;
  restoredBy: string;
  restoredAt: number;
}

export interface ConflictChange {
  userId: string;
  timestamp: number;
  change: any;
  operation: 'create' | 'update' | 'delete' | 'move';
}

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  acceptedChange: ConflictChange;
  rejectedChanges: ConflictChange[];
  mergedChange?: any;
}

export interface WorkflowSnapshot {
  id: string;
  workflowId: string;
  version: string;
  nodes: any[];
  connections: any[];
  metadata: Record<string, any>;
  createdAt: number;
  createdBy: string;
}

export interface CollaborationComment {
  id: string;
  nodeId: string;
  userId: string;
  userEmail: string;
  userName: string;
  content: string;
  position: { x: number; y: number };
  mentions: string[];
  replies: CommentReply[];
  status: 'active' | 'resolved' | 'archived';
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, any>;
  author?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface CollaborationSettings {
  allowAnonymous: boolean;
  requireApproval: boolean;
  maxParticipants: number;
  sessionTimeout: number; // milliseconds
  autoSave: boolean;
  autoSaveInterval: number; // milliseconds
  conflictResolution: ConflictResolutionStrategy;
  versionControl: boolean;
  commentNotifications: boolean;
  presenceTracking: boolean;
}

export interface CollaborationPermissions {
  canEdit: boolean;
  canComment: boolean;
  canInvite: boolean;
  canKick: boolean;
  canManagePermissions: boolean;
  canCreateVersions: boolean;
  canRestoreVersions: boolean;
  canExport: boolean;
}

export interface ParticipantPermissions {
  canEditNodes: boolean;
  canEditConnections: boolean;
  canAddComments: boolean;
  canDeleteComments: boolean;
  canInviteUsers: boolean;
  canCreateVersions: boolean;
  canRestoreVersions: boolean;
}

export interface CollaborationInvitation {
  id: string;
  workflowId: string;
  invitedBy: string;
  invitedUser: string;
  role: CollaborationRole;
  permissions: ParticipantPermissions;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: number;
  createdAt: number;
  acceptedAt?: number;
  message?: string;
}

export interface CollaborationHistory {
  id: string;
  workflowId: string;
  sessionId: string;
  events: CollaborationEvent[];
  participants: string[];
  duration: number; // milliseconds
  startTime: number;
  endTime: number;
  summary: CollaborationSummary;
}

export interface CollaborationSummary {
  totalEvents: number;
  participants: number;
  nodesCreated: number;
  nodesUpdated: number;
  nodesDeleted: number;
  connectionsCreated: number;
  connectionsDeleted: number;
  commentsAdded: number;
  conflictsDetected: number;
  conflictsResolved: number;
  versionsCreated: number;
}

export interface CollaborationConflict {
  id: string;
  workflowId: string;
  type: ConflictType;
  nodeId?: string;
  connectionId?: string;
  conflictingChanges: ConflictChange[];
  status: 'detected' | 'resolving' | 'resolved' | 'failed';
  detectedAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  resolution?: ConflictResolution;
  operations?: Array<{
    type: string;
    userId: string;
    timestamp: number;
  }>;
  affectedNodes?: string[];
}

export interface CollaborationPresence {
  userId: string;
  userEmail: string;
  userName: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastSeen: number;
  currentActivity?: string;
}

// Enums
export type CollaborationEventType =
  | 'node_created'
  | 'node_updated'
  | 'node_deleted'
  | 'node_moved'
  | 'connection_created'
  | 'connection_deleted'
  | 'cursor_moved'
  | 'selection_changed'
  | 'comment_added'
  | 'comment_updated'
  | 'comment_deleted'
  | 'user_joined'
  | 'user_left'
  | 'user_status_changed'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'version_created'
  | 'version_restored';

export type CollaborationRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export type ConflictType =
  | 'node_conflict'
  | 'connection_conflict'
  | 'property_conflict'
  | 'position_conflict';

export type ConflictResolutionStrategy =
  | 'last_write_wins'
  | 'first_write_wins'
  | 'manual_resolution'
  | 'automatic_merge';

// Factory functions
export const createCollaborationSession = (
  workflowId: string,
  creator: CollaborationParticipant,
  settings: Partial<CollaborationSettings> = {}
): CollaborationSession => ({
  id: `collab_${Date.now()}`,
  workflowId,
  participants: [creator],
  status: 'active',
  createdAt: Date.now(),
  lastActivityAt: Date.now(),
  settings: {
    allowAnonymous: false,
    requireApproval: false,
    maxParticipants: 10,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    conflictResolution: 'last_write_wins',
    versionControl: true,
    commentNotifications: true,
    presenceTracking: true,
    ...settings,
  },
  permissions: {
    canEdit: true,
    canComment: true,
    canInvite: true,
    canKick: false,
    canManagePermissions: false,
    canCreateVersions: true,
    canRestoreVersions: true,
    canExport: true,
  },
  metadata: {},
});

export const createCollaborationEvent = (
  type: CollaborationEventType,
  userId: string,
  workflowId: string,
  data: CollaborationEventData
): CollaborationEvent => ({
  id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  userId,
  workflowId,
  timestamp: Date.now(),
  data,
  metadata: {},
});

export const createCollaborationComment = (
  nodeId: string,
  userId: string,
  userEmail: string,
  userName: string,
  content: string,
  position: { x: number; y: number }
): CollaborationComment => ({
  id: `comment_${Date.now()}`,
  nodeId,
  userId,
  userEmail,
  userName,
  content,
  position,
  mentions: [],
  replies: [],
  status: 'active',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  metadata: {},
});

export const createCollaborationInvitation = (
  workflowId: string,
  invitedBy: string,
  invitedUser: string,
  role: CollaborationRole,
  permissions: ParticipantPermissions
): CollaborationInvitation => ({
  id: `invite_${Date.now()}`,
  workflowId,
  invitedBy,
  invitedUser,
  role,
  permissions,
  status: 'pending',
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  createdAt: Date.now(),
});

// Utility functions
export const canUserEdit = (userPermissions: ParticipantPermissions): boolean => {
  return userPermissions.canEditNodes;
};

export const canUserComment = (userPermissions: ParticipantPermissions): boolean => {
  return userPermissions.canAddComments;
};

export const isConflictResolvable = (
  conflict: CollaborationConflict,
  strategy: ConflictResolutionStrategy
): boolean => {
  switch (strategy) {
    case 'automatic_merge':
      return conflict.type === 'property_conflict';
    case 'last_write_wins':
    case 'first_write_wins':
      return true;
    case 'manual_resolution':
      return true;
    default:
      return false;
  }
};

export const calculateCollaborationScore = (history: CollaborationHistory): number => {
  const summary = history.summary;
  const totalEvents = summary.totalEvents;

  if (totalEvents === 0) {
    return 100;
  }

  const conflictRate = summary.conflictsDetected / totalEvents;
  const resolutionRate = summary.conflictsResolved / Math.max(summary.conflictsDetected, 1);

  return Math.round((1 - conflictRate) * resolutionRate * 100);
};

export const getCollaborationRolePermissions = (
  role: CollaborationRole
): ParticipantPermissions => {
  switch (role) {
    case 'owner':
      return {
        canEditNodes: true,
        canEditConnections: true,
        canAddComments: true,
        canDeleteComments: true,
        canInviteUsers: true,
        canCreateVersions: true,
        canRestoreVersions: true,
      };
    case 'editor':
      return {
        canEditNodes: true,
        canEditConnections: true,
        canAddComments: true,
        canDeleteComments: false,
        canInviteUsers: false,
        canCreateVersions: true,
        canRestoreVersions: false,
      };
    case 'commenter':
      return {
        canEditNodes: false,
        canEditConnections: false,
        canAddComments: true,
        canDeleteComments: false,
        canInviteUsers: false,
        canCreateVersions: false,
        canRestoreVersions: false,
      };
    case 'viewer':
      return {
        canEditNodes: false,
        canEditConnections: false,
        canAddComments: false,
        canDeleteComments: false,
        canInviteUsers: false,
        canCreateVersions: false,
        canRestoreVersions: false,
      };
    default:
      return {
        canEditNodes: false,
        canEditConnections: false,
        canAddComments: false,
        canDeleteComments: false,
        canInviteUsers: false,
        canCreateVersions: false,
        canRestoreVersions: false,
      };
  }
};
