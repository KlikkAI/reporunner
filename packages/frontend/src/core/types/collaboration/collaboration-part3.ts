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
