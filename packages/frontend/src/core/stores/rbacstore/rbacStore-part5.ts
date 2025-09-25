}
      },

      deleteRole: async (roleId: string) =>
{
  set({ isLoading: true, error: null });
  try {
    rbacService.deleteRole(roleId);

    const state = get();
    set({
      roles: state.roles.filter((role) => role.id !== roleId),
      isLoading: false,
    });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to delete role',
    });
    throw error;
  }
}
,

      assignRole: async (userId: string, roleId: string) =>
{
  set({ isLoading: true, error: null });
  try {
    const { currentOrganizationId } = get();
    rbacService.assignRole(userId, roleId, currentOrganizationId || undefined);

    set({ isLoading: false });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to assign role',
    });
    throw error;
  }
}
,

      removeRole: async (userId: string, roleId: string) =>
{
  set({ isLoading: true, error: null });
  try {
    const { currentOrganizationId } = get();
    rbacService.removeRole(userId, roleId, currentOrganizationId || undefined);

    set({ isLoading: false });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to remove role',
    });
    throw error;
  }
}
,

      // Data loading
      loadUserContext: async (userId: string) =>
{
  set({ isLoading: true, error: null });
  try {
    const { currentOrganizationId } = get();

    const userRoles = rbacService.getUserRoles(userId, currentOrganizationId || undefined);
    const userPermissions = rbacService.getUserPermissions(
      userId,
      currentOrganizationId || undefined
    );

    set({
      userRoles,
      userPermissions,
      isLoading: false,
    });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to load user context',
    });
    throw error;
  }
}
,

      loadOrganizations: async () =>
{
  set({ isLoading: true, error: null });
  try {
    // In a real app, this would fetch from API
    const organizations: Organization[] = [];

    set({
      organizations,
      isLoading: false,
    });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to load organizations',
    });
    throw error;
  }
}
,

      loadTeams: async (organizationId?: string) =>
{
