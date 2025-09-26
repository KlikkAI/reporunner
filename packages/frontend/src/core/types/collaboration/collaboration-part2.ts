{
  x: number;
  y: number;
}
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
