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
