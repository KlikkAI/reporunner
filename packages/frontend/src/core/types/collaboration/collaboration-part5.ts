): CollaborationSession => (
{
  id: `collab_${Date.now()}`, workflowId, participants;
  : [creator],
  status: 'active',
  createdAt: Date.now(),
  lastActivityAt: Date.now(),
  settings:
    allowAnonymous: false, requireApproval
  : false,
    maxParticipants: 10,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    conflictResolution: 'last_write_wins',
    versionControl: true,
    commentNotifications: true,
    presenceTracking: true,
    ...settings,
  ,
  permissions:
    canEdit: true, canComment
  : true,
    canInvite: true,
    canKick: false,
    canManagePermissions: false,
    canCreateVersions: true,
    canRestoreVersions: true,
    canExport: true,
  ,
  metadata:
  ,
}
)

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
