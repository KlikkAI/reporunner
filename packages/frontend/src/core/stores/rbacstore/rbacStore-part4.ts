})
} catch (error: any)
{
  set({
    isLoading: false,
    error: error.message || 'Failed to update team',
  });
  throw error;
}
},

      addTeamMember: async (teamId: string, userId: string) =>
{
  set({ isLoading: true, error: null });
  try {
    rbacService.addTeamMember(teamId, userId);

    // Refresh teams
    const state = get();
    await state.loadTeams(state.currentOrganizationId || undefined);

    set({ isLoading: false });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to add team member',
    });
    throw error;
  }
}
,

      removeTeamMember: async (teamId: string, userId: string) =>
{
  set({ isLoading: true, error: null });
  try {
    const state = get();
    const team = state.teams.find((t) => t.id === teamId);

    if (team) {
      const updatedMembers = team.members.filter((id) => id !== userId);
      await state.updateTeam(teamId, { members: updatedMembers });
    }

    set({ isLoading: false });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to remove team member',
    });
    throw error;
  }
}
,

      // Role management
      createRole: async (roleData) =>
{
  set({ isLoading: true, error: null });
  try {
    const role = rbacService.createCustomRole(
      roleData.name,
      roleData.description,
      roleData.permissions,
      roleData.organizationId
    );

    const state = get();
    set({
      roles: [...state.roles, role],
      isLoading: false,
    });

    return role;
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to create role',
    });
    throw error;
  }
}
,

      updateRole: async (roleId: string, updates: Partial<Role>) =>
{
        set({ isLoading: true, error: null });
        try {
          const updatedRole = rbacService.updateRole(roleId, updates);

          const state = get();
          const roleIndex = state.roles.findIndex((role) => role.id === roleId);

          if (roleIndex !== -1) {
            const updatedRoles = [...state.roles];
            updatedRoles[roleIndex] = updatedRole;

            set({
              roles: updatedRoles,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to update role',
          });
          throw error;
