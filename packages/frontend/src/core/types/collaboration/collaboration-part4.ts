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
