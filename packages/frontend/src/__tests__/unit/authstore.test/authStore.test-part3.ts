expect(newState.error).toBeNull();
})

it('should handle logout failure gracefully', async () =>
{
  // Set authenticated state
  useAuthStore.setState({
    user: mockUser,
    isAuthenticated: true,
  });

  vi.mocked(authApiService.logout).mockRejectedValue(new Error('Network error'));

  const store = useAuthStore.getState();

  await store.logout();

  // Should still clear local state even if API call fails
  const newState = useAuthStore.getState();
  expect(newState.user).toBeNull();
  expect(newState.isAuthenticated).toBe(false);
}
)
})

describe('getCurrentUser', () =>
{
  it('should get current user successfully', async () => {
    vi.mocked(authApiService.getProfile).mockResolvedValue(mockUser);

    const store = useAuthStore.getState();

    await store.getCurrentUser();

    expect(authApiService.getProfile).toHaveBeenCalled();

    const newState = useAuthStore.getState();
    expect(newState.user).toEqual(mockUser);
    expect(newState.isAuthenticated).toBe(true);
    expect(newState.error).toBeNull();
  });

  it('should handle unauthorized getCurrentUser', async () => {
    const unauthorizedError = {
      status: 401,
      code: 'TOKEN_REFRESH_ERROR',
      message: 'Invalid token',
    };

    vi.mocked(authApiService.getProfile).mockRejectedValue(unauthorizedError);
    vi.mocked(authApiService.clearAuthData).mockResolvedValue();

    // Start with authenticated state
    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
    });

    const store = useAuthStore.getState();

    await store.getCurrentUser();

    // Should clear auth state for 401 errors
    const newState = useAuthStore.getState();
    expect(newState.user).toBeNull();
    expect(newState.isAuthenticated).toBe(false);
    expect(authApiService.clearAuthData).toHaveBeenCalled();
  });

  it('should handle non-auth errors gracefully', async () => {
    const networkError = {
      status: 500,
      message: 'Network error',
    };

    vi.mocked(authApiService.getProfile).mockRejectedValue(networkError);

    // Start with authenticated state
    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
    });

    const store = useAuthStore.getState();

    await store.getCurrentUser();

    // Should keep user logged in for non-auth errors
    const newState = useAuthStore.getState();
    expect(newState.user).toEqual(mockUser);
    expect(newState.isAuthenticated).toBe(true);
    expect(newState.error).toBe(networkError.message);
  });
}
)

describe('updateProfile', () =>
{
    it('should update profile successfully', async () => {
      const updatedUser = {
        ...mockUser,
        firstName: 'Updated',
        lastName: 'Name',
      };
      const profileUpdates = { firstName: 'Updated', lastName: 'Name' };
