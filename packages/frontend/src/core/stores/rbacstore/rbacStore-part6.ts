set({ isLoading: true, error: null });
try {
  // In a real app, would get current user ID from auth store
  const currentUserId = 'current-user-id'; // Placeholder
  const teams = rbacService.getUserTeams(currentUserId, organizationId);

  set({
    teams,
    isLoading: false,
  });
} catch (error: any) {
  set({
    isLoading: false,
    error: error.message || 'Failed to load teams',
  });
  throw error;
}
},

      loadRoles: async (organizationId?: string) =>
{
  set({ isLoading: true, error: null });
  try {
    const roles = rbacService.getAllRoles(organizationId);

    set({
      roles,
      isLoading: false,
    });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to load roles',
    });
    throw error;
  }
}
,

      // Utility actions
      clearError: () => set(
{
  error: null;
}
),

      refreshPermissions: async (userId: string) =>
{
  const { currentOrganizationId } = get();
  const userPermissions = rbacService.getUserPermissions(
    userId,
    currentOrganizationId || undefined
  );

  set({ userPermissions });
}
,
    }),
{
  name: 'rbac-storage', partialize;
  : (state) => (
    currentOrganizationId: state.currentOrganizationId, currentTeamId
  : state.currentTeamId,
  ),
}
)
)
