set({
  isLoading: false,
  error: error.message || 'Failed to invite user',
});
throw error;
}
      },

      removeUser: async (organizationId: string, userId: string) =>
{
  set({ isLoading: true, error: null });
  try {
    // Remove user from organization
    rbacService.removeRole(userId, 'organization_owner', organizationId);
    rbacService.removeRole(userId, 'workflow_admin', organizationId);
    rbacService.removeRole(userId, 'workflow_editor', organizationId);
    rbacService.removeRole(userId, 'workflow_viewer', organizationId);

    set({ isLoading: false });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to remove user',
    });
    throw error;
  }
}
,

      updateUserRole: async (
        organizationId: string,
        userId: string,
        role: OrganizationMember['role']
      ) =>
{
  set({ isLoading: true, error: null });
  try {
    // Remove existing organization roles
    await get().removeUser(organizationId, userId);

    // Add new role
    const systemRoleMap: Record<OrganizationMember['role'], string> = {
      owner: 'organization_owner',
      admin: 'workflow_admin',
      member: 'workflow_editor',
      viewer: 'workflow_viewer',
    };

    rbacService.assignRole(userId, systemRoleMap[role], organizationId);

    set({ isLoading: false });
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to update user role',
    });
    throw error;
  }
}
,

      // Team management
      createTeam: async (teamData) =>
{
  set({ isLoading: true, error: null });
  try {
    const team = rbacService.createTeam(teamData);

    const state = get();
    set({
      teams: [...state.teams, team],
      isLoading: false,
    });

    return team;
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.message || 'Failed to create team',
    });
    throw error;
  }
}
,

      updateTeam: async (teamId: string, updates: Partial<Team>) =>
{
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const teamIndex = state.teams.findIndex((team) => team.id === teamId);

          if (teamIndex === -1) {
            throw new Error('Team not found');
          }

          const updatedTeam = {
            ...state.teams[teamIndex],
            ...updates,
          };

          const updatedTeams = [...state.teams];
          updatedTeams[teamIndex] = updatedTeam;

          set({
            teams: updatedTeams,
            isLoading: false,
