strategy: ConflictResolutionStrategy;
): boolean =>
{
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
}

export const calculateCollaborationScore = (history: CollaborationHistory): number => {
  const summary = history.summary;
  const totalEvents = summary.totalEvents;

  if (totalEvents === 0) return 100;

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
