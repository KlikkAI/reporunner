// In a real app, would get current user ID from auth store
// state.refreshPermissions(currentUserId)
}
      },

      setCurrentTeam: (teamId: string | null) =>
{
  set({ currentTeamId: teamId });
}
,

      // Permission checking methods
      hasPermission: (resource: string, action: string, resourceId?: string) =>
{
  const { currentOrganizationId } = get();
  // In a real app, would get current user ID from auth store
  const currentUserId = 'current-user-id'; // Placeholder

  return rbacService.hasPermission(
          currentUserId,
          resource,
          action,
          resourceId,
          currentOrganizationId || undefined
        );
}
,

      canAccessWorkflow: (workflowId: string, action: string) =>
{
  return get().hasPermission('workflow', action, workflowId);
}
,

      canManageOrganization: () =>
{
  return get().hasPermission('organization', 'update');
}
,

      canManageUsers: () =>
{
  return get().hasPermission('user', 'update');
}
,

      // Organization management
      createOrganization: async (orgData) =>
{
  set({ isLoading: true, error: null });
  try {
    const organization = rbacService.createOrganization(orgData);

    const state = get();
    set({
      organizations: [...state.organizations, organization],
      currentOrganizationId: organization.id,
      isLoading: false,
    });

    return organization;
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to create organization',
    });
    throw error;
  }
}
,

      updateOrganization: async (orgId: string, updates: Partial<Organization>) =>
{
  set({ isLoading: true, error: null });
  try {
    const state = get();
    const orgIndex = state.organizations.findIndex((org) => org.id === orgId);

    if (orgIndex === -1) {
      throw new Error('Organization not found');
    }

    const updatedOrg = {
      ...state.organizations[orgIndex],
      ...updates,
      updatedAt: new Date(),
    };

    const updatedOrganizations = [...state.organizations];
    updatedOrganizations[orgIndex] = updatedOrg;

    set({
      organizations: updatedOrganizations,
      isLoading: false,
    });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to update organization',
    });
    throw error;
  }
}
,

      inviteUser: async (
        _organizationId: string,
        _email: string,
        _role: OrganizationMember['role']
      ) =>
{
        set({ isLoading: true, error: null });
        try {
          set({ isLoading: false });
        } catch (error: any) {
